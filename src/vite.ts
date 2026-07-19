/**
 * styled-static Vite Plugin
 *
 * Transforms styled-static syntax into optimized React components with
 * static CSS extraction.
 *
 * ## Minimal Dependencies
 *
 * The plugin uses `magic-string` for source-map-safe replacements and:
 * - Vite's built-in parser (via Rollup's acorn)
 * - Native CSS nesting (Chrome 112+, Safari 16.5+, Firefox 117+, Edge 112+)
 * - Vite's CSS pipeline for processing
 *
 * ## Optional: Lightning CSS
 *
 * For faster CSS processing, install `lightningcss`:
 * ```bash
 * npm install lightningcss
 * ```
 * Then enable in vite.config.ts:
 * ```ts
 * css: { transformer: 'lightningcss' }
 * ```
 *
 * ## Plugin Order
 *
 * Uses `enforce: 'post'` to run AFTER the React plugin. By that point,
 * JSX has been transformed to React.createElement() calls, so Vite's
 * built-in parser works perfectly.
 *
 * This means the plugin works with ALL file types:
 * `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, etc.
 *
 * ## Transformation Pipeline
 *
 * 1. Parse source with Vite's built-in parser (post-React transform)
 * 2. Find all styled/css/createGlobalStyle tagged template literals
 * 3. For each:
 *    - Extract CSS content
 *    - Hash it to generate unique class name
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
import type * as ESTree from "estree";
import MagicString from "magic-string";
import type { Plugin } from "vite";
import {
  createVariantClassName,
  createVariantValueName,
  generateReplacement,
  generateVariantReplacement,
  getFileBaseName,
  isValidComponentReference,
  normalizePath,
  rewriteCssImports,
  safeStringLiteral,
  toClassNameSegment,
} from "./codegen.js";
import { hash } from "./hash.js";
import {
  extractTemplateContent,
  findStyledStaticImports,
  findTaggedTemplates,
  findVariantCalls,
  findWithComponentCalls,
} from "./parse.js";

// ============================================================================
// Types
// ============================================================================

/** Plugin configuration options */
export interface StyledStaticOptions {
  /**
   * Prefix for generated class names.
   * @default 'ss'
   */
  classPrefix?: string;
  /**
   * Enable debug logging. Set to true or use DEBUG_STYLED_STATIC=true env var.
   * SECURITY: Debug logs expose file paths and internal state; disable in production.
   * @default false
   */
  debug?: boolean;
  /**
   * How to output CSS:
   * - 'auto' (default): Uses 'file' for library builds (build.lib set), 'virtual' for apps
   * - 'virtual': CSS as virtual modules (Vite bundles into single file)
   * - 'file': CSS as separate files co-located with JS (enables tree-shaking for libraries)
   * @default 'auto'
   */
  cssOutput?: "auto" | "virtual" | "file";
}

function createUniqueIdentifier(code: string, preferredName: string): string {
  let candidate = preferredName;
  while (new RegExp(`\\b${candidate}\\b`).test(code)) {
    candidate += "_";
  }
  return candidate;
}

function removeQueryString(moduleId: string): string {
  return moduleId.split("?", 1)[0] ?? moduleId;
}

function createDevClassName(prefix: string, variableName: string, filePath: string): string {
  const pathHash = hash(normalizePath(filePath)).slice(0, 5);
  return `${prefix}-${toClassNameSegment(variableName)}-${getFileBaseName(filePath)}-${pathHash}`;
}

function escapeCssComment(value: string): string {
  return value.replace(/\*\//g, "*\\/").replace(/[\r\n]/g, "");
}

function createVariantFingerprint(variant: ReturnType<typeof findVariantCalls>[number]): string {
  return JSON.stringify({
    base: variant.baseCss ?? "",
    variants: Array.from(variant.variants, ([name, values]) => [name, Array.from(values)]),
    compounds: variant.compoundVariants?.map(({ conditions, css }) => [
      Array.from(conditions),
      css,
    ]),
  });
}

function validateVariantReferences(variant: ReturnType<typeof findVariantCalls>[number]): void {
  for (const [name, value] of variant.defaultVariants ?? []) {
    if (!variant.variants.get(name)?.has(value)) {
      throw new Error(
        `[styled-static] Unknown default variant ${JSON.stringify(name)}: ${JSON.stringify(value)} in ${variant.variableName}.`,
      );
    }
  }

  for (const compound of variant.compoundVariants ?? []) {
    for (const [name, value] of compound.conditions) {
      if (!variant.variants.get(name)?.has(value)) {
        throw new Error(
          `[styled-static] Unknown compound variant ${JSON.stringify(name)}: ${JSON.stringify(value)} in ${variant.variableName}.`,
        );
      }
    }
  }
}

// ============================================================================
// Plugin
// ============================================================================

/**
 * Vite plugin for styled-static.
 *
 * @example
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { styledStatic } from '@alex.radulescu/styled-static/vite';
 *
 * export default defineConfig({
 *   plugins: [react(), styledStatic()],
 * });
 */
export function styledStatic(options: StyledStaticOptions = {}): Plugin {
  const { classPrefix = "ss", debug: debugOption, cssOutput = "auto" } = options;

  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(classPrefix)) {
    throw new Error(
      `[styled-static] classPrefix must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens. Received: ${JSON.stringify(classPrefix)}`,
    );
  }

  // SECURITY: Debug logging can expose file paths and internal state.
  // Only enable via explicit option or environment variable.
  const debugEnabled = debugOption ?? process.env.DEBUG_STYLED_STATIC === "true";

  // Virtual CSS modules: filename -> CSS content + source file
  const cssModules = new Map<string, { css: string; sourceFile: string }>();

  let isDev = false;
  let actualCssOutput: "virtual" | "file" = "virtual";
  return {
    name: "styled-static",
    enforce: "post", // Run AFTER React plugin (JSX already transformed)

    configResolved(resolvedConfig) {
      isDev = resolvedConfig.command === "serve";

      // Resolve 'auto' CSS output mode based on build type
      if (cssOutput === "auto") {
        // Library builds get file mode for tree-shaking, apps get virtual mode
        actualCssOutput = resolvedConfig.build?.lib ? "file" : "virtual";
      } else {
        actualCssOutput = cssOutput;
      }

      if (debugEnabled) {
        console.log(
          `[styled-static] CSS output mode: ${actualCssOutput} (config: ${cssOutput}, isLib: ${!!resolvedConfig.build?.lib})`,
        );
      }
    },

    // Resolve virtual CSS module IDs
    resolveId(id) {
      // Handle virtual:styled-static/path/to/file.tsx/0.css (build) or .js (dev)
      if (id.startsWith("virtual:styled-static/")) {
        return "\0" + id;
      }
      if (id.startsWith("\0virtual:styled-static/")) {
        return id;
      }
      return null;
    },

    // Load virtual CSS module content
    load(id) {
      if (id.startsWith("\0virtual:styled-static/")) {
        // Extract the base path (without extension) for Map lookup
        const fullPath = id.slice("\0".length); // "virtual:styled-static/.../0.css" or ".js"
        // Remove extension (.css or .js) to get base path for lookup
        const basePath = fullPath.replace(/\.(css|js)$/, ".css");
        const data = cssModules.get(basePath);
        const css = data?.css ?? "";

        if (isDev) {
          // Add sourceURL comment for DevTools source mapping
          const sourceFile = data?.sourceFile ? escapeCssComment(data.sourceFile) : "";
          const cssWithSource = sourceFile ? `${css}\n/*# sourceURL=${sourceFile} */` : css;

          // Dev mode: return JS that injects CSS into DOM with HMR support
          return `
const id = ${JSON.stringify(basePath)};
const css = ${JSON.stringify(cssWithSource)};

// Remove existing style for this module (HMR cleanup). Avoid interpolating the
// module id into a CSS selector because valid file names can contain quotes.
const existing = Array.from(document.querySelectorAll("style[data-ss-id]")).find(
  (element) => element.getAttribute("data-ss-id") === id,
);
if (existing) existing.remove();

const style = document.createElement('style');
style.setAttribute('data-ss-id', id);
style.textContent = css;
document.head.appendChild(style);

if (import.meta.hot) {
  import.meta.hot.accept();
}

export default css;
`;
        }
        // Build mode with file output: return empty, we'll emit files in generateBundle
        if (actualCssOutput === "file") {
          return "";
        }

        // Build mode with virtual output: return raw CSS for Vite to bundle
        return css;
      }
      return null;
    },

    // Handle HMR for virtual CSS modules
    handleHotUpdate({ file, server }) {
      // When a source file changes, the transform will re-run
      // and update cssModules. We just need to invalidate any
      // cached virtual modules.
      if (/\.[tj]sx?$/.test(file)) {
        const normalizedPath = normalizePath(file);
        // Invalidate all virtual CSS modules from this source file.
        // Use normalizedPath + "/" to avoid matching files with a common prefix
        // (e.g., "Button.tsx" must not invalidate "ButtonGroup.tsx" CSS modules).
        for (const [moduleId, data] of cssModules) {
          if (normalizePath(removeQueryString(data.sourceFile)) === normalizedPath) {
            const mod = server.moduleGraph.getModuleById(`\0${moduleId}`);
            if (mod) {
              server.moduleGraph.invalidateModule(mod);
            }
          }
        }
      }
    },

    async transform(code, id) {
      const filePath = removeQueryString(id);
      // Process all JS/TS files, skip node_modules
      // Matches: .js, .jsx, .ts, .tsx, .mjs, .cjs, .mts, .cts
      if (
        !/\.[cm]?[jt]sx?$/.test(filePath) ||
        /(?:^|[/\\])node_modules(?:[/\\]|$)/.test(filePath)
      ) {
        return null;
      }

      // Quick check: does the file import from styled-static?
      // This avoids parsing files that don't use the library
      const hasStyledStaticImport = code.includes("styled-static");
      if (!hasStyledStaticImport) {
        return null;
      }

      if (debugEnabled) console.log("[styled-static] Transforming:", id);

      // Parse AST using Vite's built-in parser
      // Since we run after React plugin (enforce: 'post'), JSX is already transformed
      let ast: ESTree.Program;
      try {
        ast = this.parse(code) as ESTree.Program;
        if (debugEnabled) {
          console.log("[styled-static] AST parsed successfully, body length:", ast.body.length);
        }
      } catch (e) {
        // Parse error - this might be a partial file or syntax error
        if (debugEnabled) console.log("[styled-static] AST parse error:", e);
        return null;
      }

      // Find styled-static imports and their local names
      const imports = findStyledStaticImports(ast);
      if (debugEnabled) console.log("[styled-static] Found imports:", imports);
      const hasTemplateImports =
        imports.css || imports.styled || imports.createGlobalStyle || imports.keyframes;
      const hasVariantImports = imports.styledVariants || imports.cssVariants;
      const hasWithComponent = !!imports.withComponent;
      if (!hasTemplateImports && !hasVariantImports && !hasWithComponent) {
        if (debugEnabled) console.log("[styled-static] No imports found, skipping");
        return null;
      }

      // Find all tagged template literals using our imports
      const templates = hasTemplateImports ? findTaggedTemplates(ast, imports, code) : [];
      if (debugEnabled) console.log("[styled-static] Found templates:", templates.length);

      // Find all variant calls using our imports
      const variantCalls = hasVariantImports ? findVariantCalls(ast, code, imports) : [];
      if (debugEnabled) console.log("[styled-static] Found variant calls:", variantCalls.length);

      // Find all withComponent calls
      const withComponentCalls = hasWithComponent ? findWithComponentCalls(ast, imports, code) : [];
      if (debugEnabled)
        console.log("[styled-static] Found withComponent calls:", withComponentCalls.length);

      if (templates.length === 0 && variantCalls.length === 0 && withComponentCalls.length === 0) {
        if (debugEnabled)
          console.log("[styled-static] No templates, variants, or withComponent found, skipping");
        return null;
      }

      const transformedCode = new MagicString(code);
      const cssImports: string[] = [];
      // Track if we need React's createElement and our merge helper
      let needsCreateElement = false;
      const runtimeNames = {
        createElement: createUniqueIdentifier(code, "createElement"),
        mergeClassNames: createUniqueIdentifier(code, "m"),
        props: createUniqueIdentifier(code, "props"),
        remainingProps: createUniqueIdentifier(code, "remainingProps"),
        userClassName: createUniqueIdentifier(code, "userClassName"),
        classNames: createUniqueIdentifier(code, "classNames"),
      };

      // Clean up stale CSS modules from previous transforms of this file.
      // Prevents unbounded memory growth during long dev sessions with HMR.
      // Use normalizedId + "/" to avoid false matches with files sharing a common prefix.
      const normalizedFilePath = normalizePath(filePath);
      for (const [key, data] of cssModules) {
        if (normalizePath(removeQueryString(data.sourceFile)) === normalizedFilePath) {
          cssModules.delete(key);
        }
      }

      let cssIndex = 0;

      const keyframeClasses = new Map<string, string>();
      for (const template of templates) {
        if (template.type !== "keyframes" || !template.variableName) continue;
        const cssContent = extractTemplateContent(code, template.node.quasi);
        const className = isDev
          ? createDevClassName(classPrefix, template.variableName, filePath)
          : `${classPrefix}-${hash(cssContent)}`;
        keyframeClasses.set(template.variableName, className);
      }

      for (const template of templates) {
        const cssContent = extractTemplateContent(code, template.node.quasi, keyframeClasses);
        // In dev mode, use readable class names; in prod, use hash for minimal size
        let className: string;
        if (isDev && template.variableName) {
          className = createDevClassName(classPrefix, template.variableName, filePath);
        } else {
          const cssHash = hash(cssContent);
          className = `${classPrefix}-${cssHash}`;
        }

        // Wrap CSS appropriately per type:
        // - createGlobalStyle: unscoped (raw CSS)
        // - keyframes: wrapped in @keyframes rule
        // - styled/css: wrapped in class selector
        // Lightning CSS (via Vite's CSS pipeline) handles nesting, prefixes, etc.
        const processedCss =
          template.type === "createGlobalStyle"
            ? cssContent
            : template.type === "keyframes"
              ? `@keyframes ${className} { ${cssContent} }`
              : `.${className} { ${cssContent} }`;

        // Create virtual CSS module with source file path for proper chunk association
        // Use .js extension in dev mode (to avoid Vite's CSS plugin processing)
        // Use .css extension in build mode (for proper CSS extraction)
        const cssModuleBase = `virtual:styled-static/${normalizePath(filePath)}/${cssIndex++}`;
        const cssModuleId = `${cssModuleBase}.css`; // Always store with .css
        const importId = isDev ? `${cssModuleBase}.js` : cssModuleId;
        cssModules.set(cssModuleId, { css: processedCss, sourceFile: filePath });
        cssImports.push(`import "${importId}";`);

        // Generate replacement code and track runtime needs
        const replacement = generateReplacement(template, className, runtimeNames);
        transformedCode.overwrite(template.node.start, template.node.end, replacement);

        // styled, styledExtend, styledAttrs need createElement and m
        if (
          template.type === "styled" ||
          template.type === "styledExtend" ||
          template.type === "styledAttrs"
        ) {
          needsCreateElement = true;
        }
        // css, keyframes, createGlobalStyle don't need runtime
      }

      // Process variant calls
      for (const variant of variantCalls) {
        validateVariantReferences(variant);
        // In dev mode, use readable class names; in prod, use hash for minimal size
        let baseClass: string;
        if (isDev && variant.variableName) {
          baseClass = createDevClassName(classPrefix, variant.variableName, filePath);
        } else {
          const baseHash = hash(createVariantFingerprint(variant));
          baseClass = `${classPrefix}-${baseHash}`;
        }

        // Generate CSS for base and all variants
        let allCss = "";

        // Base CSS
        if (variant.baseCss) {
          allCss += `.${baseClass} { ${variant.baseCss} }\n`;
        }

        // Variant CSS (modifiers)
        for (const [variantName, values] of variant.variants) {
          for (const [valueName, cssContent] of values) {
            const modifierClass = createVariantClassName(baseClass, variantName, valueName);
            allCss += `.${modifierClass} { ${cssContent} }\n`;
          }
        }

        // Compound variant CSS (combined selectors for higher specificity)
        if (variant.compoundVariants) {
          for (const compoundVariant of variant.compoundVariants) {
            // Build combined selector: .ss-btn--size-lg.ss-btn--intent-danger
            const selectors = Array.from(compoundVariant.conditions.entries())
              .map(
                ([variantName, value]) =>
                  `.${createVariantClassName(baseClass, variantName, value)}`,
              )
              .join("");
            allCss += `${selectors} { ${compoundVariant.css} }\n`;
          }
        }

        // Create virtual CSS module with source file path for proper chunk association
        // Use .js extension in dev mode, .css in build mode
        const cssModuleBase = `virtual:styled-static/${normalizePath(filePath)}/${cssIndex++}`;
        const cssModuleId = `${cssModuleBase}.css`;
        const importId = isDev ? `${cssModuleBase}.js` : cssModuleId;
        cssModules.set(cssModuleId, { css: allCss, sourceFile: filePath });
        cssImports.push(`import "${importId}";`);

        // Generate replacement code
        const variantKeys = Array.from(variant.variants.keys());
        const variantRuntimeNames = {
          ...runtimeNames,
          variantValues: variantKeys.map((key, index) =>
            createUniqueIdentifier(code, createVariantValueName(key, index)),
          ),
        };
        const replacement = generateVariantReplacement(
          variant,
          baseClass,
          variantKeys,
          variantRuntimeNames,
        );
        transformedCode.overwrite(variant.start, variant.end, replacement);

        // styledVariants needs createElement and m
        if (variant.type === "styledVariants") {
          needsCreateElement = true;
        }
        // cssVariants doesn't need runtime (inline function)
      }

      // Process withComponent calls
      for (const componentCall of withComponentCalls) {
        // SECURITY: Validate component references
        if (!isValidComponentReference(componentCall.fromComponent)) {
          /* unreachable: component references are validated during parsing */
          throw new Error(
            `[styled-static] Invalid fromComponent name: ${componentCall.fromComponent}`,
          );
        }

        // Generate replacement code
        // withComponent(To, From) preserves the source component's classes while changing its target.
        const isHtmlTag = componentCall.toComponent.kind === "htmlTag";
        const targetComponent = componentCall.toComponent.value;
        let replacement: string;

        if (isHtmlTag) {
          // HTML tag: withComponent('a', Button)
          replacement = `Object.assign((${runtimeNames.props}) => ${runtimeNames.createElement}(${safeStringLiteral(targetComponent)}, {...${runtimeNames.props}, className: ${runtimeNames.mergeClassNames}(${componentCall.fromComponent}.className, ${runtimeNames.props}.className)}), { className: ${componentCall.fromComponent}.className })`;
        } else {
          // Component reference: withComponent(Link, Button)
          if (!isValidComponentReference(targetComponent)) {
            /* unreachable: component references are validated during parsing */
            throw new Error(`[styled-static] Invalid toComponent name: ${targetComponent}`);
          }
          replacement = `Object.assign((${runtimeNames.props}) => ${runtimeNames.createElement}(${targetComponent}, {...${runtimeNames.props}, className: ${runtimeNames.mergeClassNames}(${componentCall.fromComponent}.className, ${runtimeNames.props}.className)}), { className: ${componentCall.fromComponent}.className })`;
        }

        transformedCode.overwrite(componentCall.start, componentCall.end, replacement);
        needsCreateElement = true;
      }

      // Build imports for the new minimal runtime
      // Only need createElement from React and m from our runtime
      const runtimeBasePath = "@alex.radulescu/styled-static/runtime";

      // Prepend CSS imports first, followed by the small generated-component runtime imports.
      let prepend = "";
      if (cssImports.length > 0) {
        prepend += cssImports.join("\n") + "\n";
      }
      if (needsCreateElement) {
        const createElementImport =
          runtimeNames.createElement === "createElement"
            ? "createElement"
            : `createElement as ${runtimeNames.createElement}`;
        const mergeImport =
          runtimeNames.mergeClassNames === "m" ? "m" : `m as ${runtimeNames.mergeClassNames}`;
        prepend += `import { ${createElementImport} } from "react";\n`;
        prepend += `import { ${mergeImport} } from "${runtimeBasePath}";\n`;
      }
      if (prepend) {
        // Add extra newline after imports for better readability
        transformedCode.prepend(prepend + "\n");
      }

      return {
        code: transformedCode.toString(),
        map: transformedCode.generateMap({ hires: true }),
      };
    },

    // Emit CSS files for library builds (cssOutput: 'file')
    generateBundle(_options, bundle) {
      if (actualCssOutput !== "file") return;

      // Build reverse index: sourceFile → CSS strings for O(1) lookup per module
      const cssBySource = new Map<string, string[]>();
      for (const [, data] of cssModules) {
        const sourceKey = normalizePath(removeQueryString(data.sourceFile));
        let arr = cssBySource.get(sourceKey);
        if (!arr) {
          arr = [];
          cssBySource.set(sourceKey, arr);
        }
        arr.push(data.css);
      }

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;

        // Collect CSS for all modules in this chunk
        const moduleIds = chunk.moduleIds || [];
        let aggregatedCss = "";

        for (const moduleId of moduleIds) {
          const cssEntries = cssBySource.get(normalizePath(removeQueryString(moduleId)));
          if (cssEntries) {
            for (const css of cssEntries) {
              aggregatedCss += css + "\n";
            }
          }
        }

        if (!aggregatedCss.trim()) continue;

        // Emit CSS file with same path as JS chunk
        const cssFileName = /\.[cm]?js$/.test(fileName)
          ? fileName.replace(/\.[cm]?js$/, ".css")
          : `${fileName}.css`;
        this.emitFile({
          type: "asset",
          fileName: cssFileName,
          source: aggregatedCss.trim(),
        });

        // Rewrite the chunk's code to use relative CSS import
        const chunkAst = this.parse(chunk.code) as ESTree.Program;
        chunk.code = rewriteCssImports(chunk.code, cssFileName, chunkAst);

        if (debugEnabled) {
          console.log(`[styled-static] Emitted CSS file: ${cssFileName}`);
        }
      }
    },
  };
}

// Default export for convenience
export default styledStatic;
