/**
 * styled-static Vite Plugin
 *
 * Transforms styled-static syntax into optimized React components with
 * static CSS extraction.
 *
 * ## Why AST over Regex?
 *
 * We use Vite's built-in parser (via Rollup's acorn) instead of regex because:
 *
 * 1. **Robustness**: Regex breaks on edge cases like CSS containing backticks,
 *    strings that look like styled calls, or complex nesting.
 *
 *    Example that would break regex:
 *    ```tsx
 *    const x = styled.div`content: "styled.button\`test\`";`;
 *    const comment = "// styled.div`fake`"; // This isn't actually a styled call
 *    ```
 *
 * 2. **No extra dependencies**: Vite provides `this.parse()` for free via Rollup.
 *    We don't need acorn or acorn-walk as separate dependencies.
 *
 * 3. **Accuracy**: AST gives us exact node positions for surgical code replacement
 *    with proper source maps. Regex can't reliably handle nested backticks or
 *    escaped characters.
 *
 * 4. **Maintainability**: Adding new syntax patterns is straightforward with AST
 *    visitors vs. increasingly complex regex patterns that become unmaintainable.
 *
 * ## Transformation Pipeline
 *
 * 1. Parse source with Vite's parser
 * 2. Find all styled/css/createGlobalStyle tagged template literals
 * 3. For each:
 *    - Extract CSS content
 *    - Hash it to generate unique class name
 *    - Process CSS (nesting, autoprefixer)
 *    - Create virtual CSS module
 *    - Replace original code with runtime call + import
 * 4. Return transformed code with source map
 *
 * ## className Order (CSS Cascade)
 *
 * When components are extended, classes are ordered for proper cascade:
 * - Base styles first
 * - Extension styles second (override base)
 * - User className last (override all)
 *
 * Example:
 * ```tsx
 * const Button = styled.button`padding: 1rem;`;        // .ss-abc
 * const Primary = styled(Button)`background: blue;`;   // .ss-def
 * <Primary className="custom" />
 * // Renders: class="ss-abc ss-def custom"
 * // CSS cascade: padding → background → custom overrides
 * ```
 */
import MagicString from "magic-string";
import postcss from "postcss";
import postcssNested from "postcss-nested";
import autoprefixer from "autoprefixer";
import { hash } from "./hash.js";
// ============================================================================
// Plugin
// ============================================================================
/**
 * Vite plugin for styled-static.
 *
 * @example
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { styledStatic } from 'styled-static/vite';
 *
 * export default defineConfig({
 *   plugins: [styledStatic(), react()],
 * });
 */
export function styledStatic(options = {}) {
    const { classPrefix = "ss", autoprefixer: autoprefixerOption = [
        "last 2 Chrome versions",
        "last 2 Firefox versions",
        "last 2 Safari versions",
        "last 2 Edge versions",
    ], } = options;
    // Virtual CSS modules: filename -> CSS content
    const cssModules = new Map();
    let config;
    let isDev = false;
    return {
        name: "styled-static",
        enforce: "pre", // Run before other plugins (especially React)
        configResolved(resolvedConfig) {
            config = resolvedConfig;
            isDev = config.command === "serve";
        },
        // Resolve virtual CSS module IDs
        resolveId(id) {
            // Handle the virtual module prefix
            if (id.startsWith("\0styled-static:")) {
                return id;
            }
            // Handle imports without the \0 prefix (from our generated code)
            if (id.startsWith("styled-static:")) {
                return "\0" + id;
            }
            return null;
        },
        // Load virtual CSS module content
        load(id) {
            if (id.startsWith("\0styled-static:")) {
                const filename = id.slice("\0styled-static:".length);
                return cssModules.get(filename) ?? "";
            }
            return null;
        },
        // Handle HMR for virtual CSS modules
        handleHotUpdate({ file, server }) {
            // When a source file changes, the transform will re-run
            // and update cssModules. We just need to invalidate any
            // cached virtual modules.
            if (/\.[tj]sx?$/.test(file)) {
                // Invalidate all virtual CSS modules from this file
                const fileHash = hash(normalizePath(file)).slice(0, 6);
                for (const [name] of cssModules) {
                    if (name.startsWith(fileHash)) {
                        const mod = server.moduleGraph.getModuleById(`\0styled-static:${name}`);
                        if (mod) {
                            server.moduleGraph.invalidateModule(mod);
                        }
                    }
                }
            }
        },
        async transform(code, id) {
            // Only process .tsx/.jsx/.ts/.js files, skip node_modules
            if (!/\.[tj]sx?$/.test(id) || /node_modules/.test(id)) {
                return null;
            }
            // Quick check: does file import from styled-static?
            if (!code.includes("styled-static")) {
                return null;
            }
            console.log("[styled-static] Transforming:", id);
            // Parse AST using Vite's built-in parser
            let ast;
            try {
                ast = this.parse(code);
                console.log("[styled-static] AST parsed successfully, body length:", ast.body.length);
            }
            catch (e) {
                // Parse error - this might be a partial file or syntax error
                console.log("[styled-static] AST parse error:", e);
                return null;
            }
            // Find styled-static imports and their local names
            const imports = findStyledStaticImports(ast);
            console.log("[styled-static] Found imports:", imports);
            if (!imports.css && !imports.styled && !imports.createGlobalStyle) {
                console.log("[styled-static] No imports found, skipping");
                return null;
            }
            // Find all tagged template literals using our imports
            const templates = findTaggedTemplates(ast, imports);
            console.log("[styled-static] Found templates:", templates.length);
            if (templates.length === 0) {
                console.log("[styled-static] No templates found, skipping");
                return null;
            }
            const s = new MagicString(code);
            const fileHash = hash(normalizePath(id)).slice(0, 6);
            const cssImports = [];
            let needsStyledRuntime = false;
            let needsExtendRuntime = false;
            let needsGlobalRuntime = false;
            for (let i = 0; i < templates.length; i++) {
                const t = templates[i];
                if (!t)
                    continue; // Guard against undefined (noUncheckedIndexedAccess)
                const cssContent = extractTemplateContent(code, t.node.quasi);
                const cssHash = hash(cssContent).slice(0, 6);
                const className = `${classPrefix}-${cssHash}`;
                // Process CSS
                const processedCss = await processCSS(cssContent, className, t.type === "createGlobalStyle", autoprefixerOption);
                // Create virtual CSS module
                const cssFilename = `${fileHash}-${i}.css`;
                cssModules.set(cssFilename, processedCss);
                cssImports.push(`import "styled-static:${cssFilename}";`);
                // Generate replacement code and track runtime needs
                const replacement = generateReplacement(t, className, isDev);
                s.overwrite(t.node.start, t.node.end, replacement);
                if (t.type === "styled")
                    needsStyledRuntime = true;
                if (t.type === "styledExtend")
                    needsExtendRuntime = true;
                if (t.type === "createGlobalStyle")
                    needsGlobalRuntime = true;
            }
            // Build runtime imports
            const runtimeImports = [];
            if (needsStyledRuntime)
                runtimeImports.push("__styled");
            if (needsExtendRuntime)
                runtimeImports.push("__styledExtend");
            if (needsGlobalRuntime)
                runtimeImports.push("__GlobalStyle");
            // Prepend imports (CSS first, then runtime)
            let prepend = "";
            if (cssImports.length > 0) {
                prepend += cssImports.join("\n") + "\n";
            }
            if (runtimeImports.length > 0) {
                prepend += `import { ${runtimeImports.join(", ")} } from "styled-static/runtime";\n`;
            }
            if (prepend) {
                s.prepend(prepend);
            }
            return {
                code: s.toString(),
                map: s.generateMap({ hires: true }),
            };
        },
    };
}
// ============================================================================
// AST Helpers
// ============================================================================
/**
 * Find all imports from 'styled-static' and return their local names.
 * Handles aliased imports like `import { styled as s } from 'styled-static'`
 */
function findStyledStaticImports(ast) {
    const imports = {};
    for (const node of ast.body) {
        if (node.type === "ImportDeclaration" &&
            node.source.value === "styled-static") {
            for (const spec of node.specifiers) {
                if (spec.type === "ImportSpecifier") {
                    const imported = spec.imported.name;
                    const local = spec.local.name;
                    if (imported === "styled")
                        imports.styled = local;
                    if (imported === "css")
                        imports.css = local;
                    if (imported === "createGlobalStyle")
                        imports.createGlobalStyle = local;
                }
            }
        }
    }
    return imports;
}
/**
 * Find all tagged template literals that use styled-static imports.
 * Walks the AST to find variable declarations with our tagged templates.
 */
function findTaggedTemplates(ast, imports) {
    const results = [];
    /**
     * Process a variable declaration that might contain a styled template
     */
    function processVariableDeclaration(node) {
        for (const decl of node.declarations) {
            if (decl.init?.type === "TaggedTemplateExpression" &&
                decl.id.type === "Identifier") {
                const template = decl.init;
                const varName = decl.id.name;
                const found = classifyTemplate(template, imports, varName);
                if (found)
                    results.push(found);
            }
        }
    }
    for (const node of ast.body) {
        // Regular variable declaration: const X = styled.div`...`
        if (node.type === "VariableDeclaration") {
            processVariableDeclaration(node);
        }
        // Exported variable: export const X = styled.div`...`
        if (node.type === "ExportNamedDeclaration" &&
            node.declaration?.type === "VariableDeclaration") {
            processVariableDeclaration(node.declaration);
        }
    }
    return results;
}
/**
 * Classify a tagged template expression into one of our supported types.
 */
function classifyTemplate(node, imports, variableName) {
    const { tag } = node;
    // styled.element`...`
    if (tag.type === "MemberExpression" &&
        tag.object.type === "Identifier" &&
        tag.object.name === imports.styled &&
        tag.property.type === "Identifier") {
        return {
            type: "styled",
            node,
            tag: tag.property.name,
            variableName,
        };
    }
    // styled(Component)`...`
    if (tag.type === "CallExpression" &&
        tag.callee.type === "Identifier" &&
        tag.callee.name === imports.styled &&
        tag.arguments[0]?.type === "Identifier") {
        return {
            type: "styledExtend",
            node,
            tag: "",
            baseComponent: tag.arguments[0].name,
            variableName,
        };
    }
    // css`...`
    if (tag.type === "Identifier" && tag.name === imports.css) {
        return {
            type: "css",
            node,
            tag: "",
            variableName,
        };
    }
    // createGlobalStyle`...`
    if (tag.type === "Identifier" && tag.name === imports.createGlobalStyle) {
        return {
            type: "createGlobalStyle",
            node,
            tag: "",
            variableName,
        };
    }
    return null;
}
// ============================================================================
// CSS Processing
// ============================================================================
/**
 * Extract raw CSS content from a template literal.
 * Handles the content between the backticks.
 */
function extractTemplateContent(code, quasi) {
    // Get raw content between backticks
    return code.slice(quasi.start + 1, quasi.end - 1);
}
/**
 * Process CSS with PostCSS.
 * - Wraps in class selector (unless global)
 * - Processes nested selectors
 * - Adds vendor prefixes
 */
async function processCSS(content, className, isGlobal, autoprefixerOption) {
    // Wrap in class selector unless global
    const wrapped = isGlobal ? content : `.${className} { ${content} }`;
    // Build PostCSS plugins
    const plugins = [postcssNested()];
    if (autoprefixerOption !== false) {
        plugins.push(autoprefixer({
            overrideBrowserslist: autoprefixerOption,
        }));
    }
    // Process with PostCSS
    const result = await postcss(plugins).process(wrapped, { from: undefined });
    return result.css;
}
// ============================================================================
// Code Generation
// ============================================================================
/**
 * Generate the replacement code for a styled template.
 */
function generateReplacement(template, className, isDev) {
    const displayName = isDev ? template.variableName : undefined;
    const displayNameArg = displayName ? `, "${displayName}"` : "";
    switch (template.type) {
        case "styled":
            return `__styled("${template.tag}", "${className}"${displayNameArg})`;
        case "styledExtend":
            return `__styledExtend(${template.baseComponent}, "${className}"${displayNameArg})`;
        case "css":
            return `"${className}"`;
        case "createGlobalStyle":
            return `__GlobalStyle`;
    }
}
/**
 * Normalize file paths for consistent hashing across platforms.
 */
function normalizePath(p) {
    return p.replace(/\\/g, "/").toLowerCase();
}
// Default export for convenience
export default styledStatic;
//# sourceMappingURL=vite.js.map