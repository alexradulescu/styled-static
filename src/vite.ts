/**
 * styled-static Vite Plugin
 *
 * Transforms styled-static syntax into optimized React components with
 * static CSS extraction.
 *
 * ## Zero Dependencies
 *
 * This plugin has NO direct dependencies! It uses:
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
import type { Plugin, ResolvedConfig } from "vite";
import {
  generateReplacement,
  generateVariantReplacement,
  getFileBaseName,
  isValidIdentifier,
  normalizePath,
  rewriteCssImports,
  safeStringLiteral,
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
export function styledStatic(options: StyledStaticOptions = {}): Plugin {
  const {
    classPrefix = "ss",
    debug: debugOption,
    cssOutput = "auto",
  } = options;

  // SECURITY: Debug logging can expose file paths and internal state.
  // Only enable via explicit option or environment variable.
  const DEBUG = debugOption ?? process.env.DEBUG_STYLED_STATIC === "true";

  // Virtual CSS modules: filename -> CSS content + source file
  const cssModules = new Map<string, { css: string; sourceFile: string }>();

  let config: ResolvedConfig;
  let isDev = false;
  let actualCssOutput: "virtual" | "file" = "virtual";
  // Per-plugin-instance counter for unique hoisted variant map names
  let variantMapId = 0;

  return {
    name: "styled-static",
    enforce: "post", // Run AFTER React plugin (JSX already transformed)

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      isDev = config.command === "serve";

      // Resolve 'auto' CSS output mode based on build type
      if (cssOutput === "auto") {
        // Library builds get file mode for tree-shaking, apps get virtual mode
        actualCssOutput = config.build?.lib ? "file" : "virtual";
      } else {
        actualCssOutput = cssOutput;
      }

      if (DEBUG) {
        console.log(
          `[styled-static] CSS output mode: ${actualCssOutput} (config: ${cssOutput}, isLib: ${!!config.build?.lib})`
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
          const sourceFile = data?.sourceFile ?? "";
          const cssWithSource = sourceFile
            ? `${css}\n/*# sourceURL=${sourceFile} */`
            : css;

          // Dev mode: return JS that injects CSS into DOM with HMR support
          return `
const id = ${JSON.stringify(basePath)};
const css = ${JSON.stringify(cssWithSource)};

// Remove existing style for this module (HMR cleanup)
const existing = document.querySelector(\`style[data-ss-id="\${id}"]\`);
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
        // Invalidate all virtual CSS modules from this source file
        for (const [moduleId] of cssModules) {
          // New format: virtual:styled-static/path/to/file.tsx/0.css
          if (moduleId.includes(normalizedPath)) {
            const mod = server.moduleGraph.getModuleById(`\0${moduleId}`);
            if (mod) {
              server.moduleGraph.invalidateModule(mod);
            }
          }
        }
      }
    },

    async transform(code, id) {
      // Process all JS/TS files, skip node_modules
      // Matches: .js, .jsx, .ts, .tsx, .mjs, .cjs, .mts, .cts
      if (!/\.[cm]?[jt]sx?$/.test(id) || /node_modules/.test(id)) {
        return null;
      }

      // Quick check: does file import from styled-static or local index?
      // This avoids parsing files that don't use the library
      const hasStyledStaticImport = code.includes("styled-static");
      const hasLocalIndexImport =
        code.includes('from "./index"') ||
        code.includes("from './index'") ||
        code.includes('from "../index"') ||
        code.includes("from '../index'");
      if (!hasStyledStaticImport && !hasLocalIndexImport) {
        return null;
      }

      if (DEBUG) console.log("[styled-static] Transforming:", id);

      // Parse AST using Vite's built-in parser
      // Since we run after React plugin (enforce: 'post'), JSX is already transformed
      let ast: ESTree.Program;
      try {
        ast = this.parse(code) as ESTree.Program;
        if (DEBUG) {
          console.log(
            "[styled-static] AST parsed successfully, body length:",
            ast.body.length
          );
        }
      } catch (e) {
        // Parse error - this might be a partial file or syntax error
        if (DEBUG) console.log("[styled-static] AST parse error:", e);
        return null;
      }

      // Find styled-static imports and their local names
      const imports = findStyledStaticImports(ast);
      if (DEBUG) console.log("[styled-static] Found imports:", imports);
      const hasTemplateImports =
        imports.css ||
        imports.styled ||
        imports.createGlobalStyle ||
        imports.keyframes;
      const hasVariantImports = imports.styledVariants || imports.cssVariants;
      const hasWithComponent = !!imports.withComponent;
      if (!hasTemplateImports && !hasVariantImports && !hasWithComponent) {
        if (DEBUG) console.log("[styled-static] No imports found, skipping");
        return null;
      }

      // Find all tagged template literals using our imports
      const templates = hasTemplateImports
        ? findTaggedTemplates(ast, imports, code)
        : [];
      if (DEBUG)
        console.log("[styled-static] Found templates:", templates.length);

      // Find all variant calls using our imports
      const variantCalls = hasVariantImports
        ? findVariantCalls(ast, code, imports)
        : [];
      if (DEBUG)
        console.log(
          "[styled-static] Found variant calls:",
          variantCalls.length
        );

      // Find all withComponent calls
      const withComponentCalls = hasWithComponent
        ? findWithComponentCalls(ast, imports)
        : [];
      if (DEBUG)
        console.log(
          "[styled-static] Found withComponent calls:",
          withComponentCalls.length
        );

      if (
        templates.length === 0 &&
        variantCalls.length === 0 &&
        withComponentCalls.length === 0
      ) {
        if (DEBUG)
          console.log(
            "[styled-static] No templates, variants, or withComponent found, skipping"
          );
        return null;
      }

      const s = new MagicString(code);
      const cssImports: string[] = [];
      // Track if we need React's createElement and our merge helper
      let needsCreateElement = false;

      // Clean up stale CSS modules from previous transforms of this file
      // Prevents unbounded memory growth during long dev sessions with HMR
      const normalizedId = normalizePath(id);
      for (const key of cssModules.keys()) {
        if (key.includes(normalizedId)) {
          cssModules.delete(key);
        }
      }

      let cssIndex = 0;

      for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        if (!t) continue; // Guard against undefined (noUncheckedIndexedAccess)
        const cssContent = extractTemplateContent(code, t.node.quasi);
        // In dev mode, use readable class names; in prod, use hash for minimal size
        let className: string;
        if (isDev && t.variableName) {
          const fileBase = getFileBaseName(id);
          className = `${classPrefix}-${t.variableName}-${fileBase}`;
        } else {
          // SECURITY: Use longer hash in production for lower collision probability
          const hashLength = isDev ? 6 : 8;
          const cssHash = hash(cssContent).slice(0, hashLength);
          className = `${classPrefix}-${cssHash}`;
        }

        // Wrap CSS appropriately per type:
        // - createGlobalStyle: unscoped (raw CSS)
        // - keyframes: wrapped in @keyframes rule
        // - styled/css: wrapped in class selector
        // Lightning CSS (via Vite's CSS pipeline) handles nesting, prefixes, etc.
        const processedCss =
          t.type === "createGlobalStyle"
            ? cssContent
            : t.type === "keyframes"
              ? `@keyframes ${className} { ${cssContent} }`
              : `.${className} { ${cssContent} }`;

        // Create virtual CSS module with source file path for proper chunk association
        // Use .js extension in dev mode (to avoid Vite's CSS plugin processing)
        // Use .css extension in build mode (for proper CSS extraction)
        const cssModuleBase = `virtual:styled-static/${normalizePath(id)}/${cssIndex++}`;
        const cssModuleId = `${cssModuleBase}.css`; // Always store with .css
        const importId = isDev ? `${cssModuleBase}.js` : cssModuleId;
        cssModules.set(cssModuleId, { css: processedCss, sourceFile: id });
        cssImports.push(`import "${importId}";`);

        // Generate replacement code and track runtime needs
        const replacement = generateReplacement(t, className);
        s.overwrite(t.node.start, t.node.end, replacement);

        // styled, styledExtend, styledAttrs need createElement and m
        if (
          t.type === "styled" ||
          t.type === "styledExtend" ||
          t.type === "styledAttrs"
        ) {
          needsCreateElement = true;
        }
        // css, keyframes, createGlobalStyle don't need runtime
      }

      // Process variant calls
      const hoistedDeclarations: string[] = [];
      for (const v of variantCalls) {
        // In dev mode, use readable class names; in prod, use hash for minimal size
        let baseClass: string;
        if (isDev && v.variableName) {
          const fileBase = getFileBaseName(id);
          baseClass = `${classPrefix}-${v.variableName}-${fileBase}`;
        } else {
          const baseHash = hash(v.baseCss || "").slice(0, 6);
          baseClass = `${classPrefix}-${baseHash}`;
        }

        // Generate CSS for base and all variants
        let allCss = "";

        // Base CSS
        if (v.baseCss) {
          allCss += `.${baseClass} { ${v.baseCss} }\n`;
        }

        // Variant CSS (modifiers)
        for (const [variantName, values] of v.variants) {
          for (const [valueName, cssContent] of values) {
            const modifierClass = `${baseClass}--${variantName}-${valueName}`;
            allCss += `.${modifierClass} { ${cssContent} }\n`;
          }
        }

        // Compound variant CSS (combined selectors for higher specificity)
        if (v.compoundVariants) {
          for (const cv of v.compoundVariants) {
            // Build combined selector: .ss-btn--size-lg.ss-btn--intent-danger
            const selectors = Array.from(cv.conditions.entries())
              .map(
                ([variantName, value]) =>
                  `.${baseClass}--${variantName}-${value}`
              )
              .join("");
            allCss += `${selectors} { ${cv.css} }\n`;
          }
        }

        // Create virtual CSS module with source file path for proper chunk association
        // Use .js extension in dev mode, .css in build mode
        const cssModuleBase = `virtual:styled-static/${normalizePath(id)}/${cssIndex++}`;
        const cssModuleId = `${cssModuleBase}.css`;
        const importId = isDev ? `${cssModuleBase}.js` : cssModuleId;
        cssModules.set(cssModuleId, { css: allCss, sourceFile: id });
        cssImports.push(`import "${importId}";`);

        // Generate replacement code
        const variantKeys = Array.from(v.variants.keys());
        const result = generateVariantReplacement(
          v,
          baseClass,
          variantKeys,
          () => variantMapId++
        );
        s.overwrite(v.start, v.end, result.code);

        // Collect hoisted declarations for complex variants
        if (result.hoisted) {
          hoistedDeclarations.push(result.hoisted);
        }

        // styledVariants needs createElement and m
        if (v.type === "styledVariants") {
          needsCreateElement = true;
        }
        // cssVariants doesn't need runtime (inline function)
      }

      // Process withComponent calls
      for (const wc of withComponentCalls) {
        // SECURITY: Validate component references
        if (!isValidIdentifier(wc.fromComponent)) {
          throw new Error(
            `[styled-static] Invalid fromComponent name: ${wc.fromComponent}`
          );
        }

        // Generate replacement code
        // withComponent(To, From) → Object.assign((p) => createElement(To, {...p, className: m(From.className, p.className)}), { className: From.className })
        const isHtmlTag = /^[a-z]/.test(wc.toComponent);
        let replacement: string;

        if (isHtmlTag) {
          // HTML tag: withComponent('a', Button)
          replacement = `Object.assign((p) => createElement(${safeStringLiteral(wc.toComponent)}, {...p, className: m(${wc.fromComponent}.className, p.className)}), { className: ${wc.fromComponent}.className })`;
        } else {
          // Component reference: withComponent(Link, Button)
          if (!isValidIdentifier(wc.toComponent)) {
            throw new Error(
              `[styled-static] Invalid toComponent name: ${wc.toComponent}`
            );
          }
          replacement = `Object.assign((p) => createElement(${wc.toComponent}, {...p, className: m(${wc.fromComponent}.className, p.className)}), { className: ${wc.fromComponent}.className })`;
        }

        s.overwrite(wc.start, wc.end, replacement);
        needsCreateElement = true;
      }

      // Build imports for the new minimal runtime
      // Only need createElement from React and m from our runtime
      const runtimeBasePath =
        imports.source === "./index" || imports.source === "../index"
          ? imports.source.replace("/index", "/runtime")
          : "@alex.radulescu/styled-static/runtime";

      // Prepend imports: CSS first, then runtime, then hoisted declarations
      let prepend = "";
      if (cssImports.length > 0) {
        prepend += cssImports.join("\n") + "\n";
      }
      if (needsCreateElement) {
        prepend += `import { createElement } from "react";\n`;
        prepend += `import { m } from "${runtimeBasePath}";\n`;
      }
      // Add hoisted variant maps for complex variants (> 4 values)
      if (hoistedDeclarations.length > 0) {
        prepend += hoistedDeclarations.join("\n") + "\n";
      }
      if (prepend) {
        // Add extra newline after imports for better readability
        s.prepend(prepend + "\n");
      }

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      };
    },

    // Emit CSS files for library builds (cssOutput: 'file')
    generateBundle(_options, bundle) {
      if (actualCssOutput !== "file") return;

      // Build reverse index: sourceFile → CSS strings for O(1) lookup per module
      const cssBySource = new Map<string, string[]>();
      for (const [, data] of cssModules) {
        let arr = cssBySource.get(data.sourceFile);
        if (!arr) {
          arr = [];
          cssBySource.set(data.sourceFile, arr);
        }
        arr.push(data.css);
      }

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "chunk") continue;

        // Collect CSS for all modules in this chunk
        const moduleIds = chunk.moduleIds || [];
        let aggregatedCss = "";

        for (const moduleId of moduleIds) {
          const cssEntries = cssBySource.get(moduleId);
          if (cssEntries) {
            for (const css of cssEntries) {
              aggregatedCss += css + "\n";
            }
          }
        }

        if (!aggregatedCss.trim()) continue;

        // Emit CSS file with same path as JS chunk
        const cssFileName = fileName.replace(/\.js$/, ".css");
        this.emitFile({
          type: "asset",
          fileName: cssFileName,
          source: aggregatedCss.trim(),
        });

        // Rewrite the chunk's code to use relative CSS import
        chunk.code = rewriteCssImports(chunk.code, cssFileName);

        if (DEBUG) {
          console.log(`[styled-static] Emitted CSS file: ${cssFileName}`);
        }
      }
    },
  };
}

// Default export for convenience
export default styledStatic;
