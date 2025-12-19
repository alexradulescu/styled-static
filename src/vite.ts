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
import { hash } from "./hash.js";

// ============================================================================
// Types
// ============================================================================

interface TaggedTemplateWithPosition extends ESTree.TaggedTemplateExpression {
  start: number;
  end: number;
  quasi: TemplateLiteralWithPosition;
}

interface TemplateLiteralWithPosition extends ESTree.TemplateLiteral {
  start: number;
  end: number;
}

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
}

/** Import tracking for styled-static */
interface StyledStaticImports {
  styled?: string;
  css?: string;
  createGlobalStyle?: string;
  keyframes?: string;
  styledVariants?: string;
  cssVariants?: string;
  withComponent?: string;
  /** The source path of the import (e.g., "styled-static" or "./index") */
  source?: string;
}

/** Types of styled templates we can transform */
type TemplateType =
  | "styled"
  | "styledExtend"
  | "styledAttrs"
  | "css"
  | "createGlobalStyle"
  | "keyframes";

/** Types of variant calls we can transform */
type VariantType = "styledVariants" | "cssVariants";

/** Information about a found withComponent call */
interface FoundWithComponent {
  start: number;
  end: number;
  toComponent: string; // Component reference or HTML tag string
  fromComponent: string; // Styled component reference
  variableName?: string;
}

/** Information about a found template */
interface FoundTemplate {
  type: TemplateType;
  node: TaggedTemplateWithPosition;
  tag: string; // HTML tag for styled.element
  baseComponent?: string; // Component name for styled(Component)
  variableName?: string; // Variable name for displayName
  attrsArg?: string; // Serialized attrs object for styled.element.attrs({})
}

/** Information about a found variant call */
interface FoundVariant {
  type: VariantType;
  start: number;
  end: number;
  component: string | undefined; // 'button' or Component reference
  baseCss: string | undefined; // Base CSS string
  variants: Map<string, Map<string, string>>; // variantName -> { valueName -> css }
  variableName: string; // Variable name for displayName
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
/**
 * SECURITY: Validates that a string is a safe identifier (alphanumeric + underscore).
 * Prevents code injection via displayName or component name interpolation.
 */
function isValidIdentifier(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/**
 * SECURITY: Safely escape a string for use in generated code.
 * Uses JSON.stringify to properly escape special characters.
 */
function safeStringLiteral(str: string): string {
  return JSON.stringify(str);
}

export function styledStatic(options: StyledStaticOptions = {}): Plugin {
  const { classPrefix = "ss", debug: debugOption } = options;

  // SECURITY: Debug logging can expose file paths and internal state.
  // Only enable via explicit option or environment variable.
  const DEBUG = debugOption ?? process.env.DEBUG_STYLED_STATIC === "true";

  // Virtual CSS modules: filename -> CSS content
  const cssModules = new Map<string, string>();

  let config: ResolvedConfig;
  let isDev = false;

  return {
    name: "styled-static",
    enforce: "post", // Run AFTER React plugin (JSX already transformed)

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
        // SECURITY: Use consistent 8-char hash to match transform()
        const fileHash = hash(normalizePath(file)).slice(0, 8);
        for (const [name] of cssModules) {
          if (name.startsWith(fileHash)) {
            const mod = server.moduleGraph.getModuleById(
              `\0styled-static:${name}`
            );
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

      if (templates.length === 0 && variantCalls.length === 0 && withComponentCalls.length === 0) {
        if (DEBUG)
          console.log(
            "[styled-static] No templates, variants, or withComponent found, skipping"
          );
        return null;
      }

      const s = new MagicString(code);
      // Use 8-char file hash to match Vite's CSS Modules standard
      // (8 chars base36 = ~2.8 × 10^12 possibilities)
      const fileHash = hash(normalizePath(id)).slice(0, 8);
      const cssImports: string[] = [];
      // Track if we need React's createElement and our merge helper
      let needsCreateElement = false;

      let cssIndex = 0;

      for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        if (!t) continue; // Guard against undefined (noUncheckedIndexedAccess)
        const cssContent = extractTemplateContent(code, t.node.quasi);
        // SECURITY: Use longer hash in production for lower collision probability
        const hashLength = isDev ? 6 : 8;
        const cssHash = hash(cssContent).slice(0, hashLength);
        const className = `${classPrefix}-${cssHash}`;

        // Wrap CSS in class selector (unless global)
        // Lightning CSS (via Vite's CSS pipeline) handles nesting, prefixes, etc.
        const processedCss =
          t.type === "createGlobalStyle"
            ? cssContent
            : `.${className} { ${cssContent} }`;

        // Create virtual CSS module
        const cssFilename = `${fileHash}-${cssIndex++}.css`;
        cssModules.set(cssFilename, processedCss);
        cssImports.push(`import "styled-static:${cssFilename}";`);

        // Generate replacement code and track runtime needs
        const replacement = generateReplacement(t, className, isDev);
        s.overwrite(t.node.start, t.node.end, replacement);

        // styled, styledExtend, styledAttrs need createElement and m
        if (t.type === "styled" || t.type === "styledExtend" || t.type === "styledAttrs") {
          needsCreateElement = true;
        }
        // css, keyframes, createGlobalStyle don't need runtime
      }

      // Process variant calls
      for (const v of variantCalls) {
        const baseHash = hash(v.baseCss || "").slice(0, 6);
        const baseClass = `${classPrefix}-${baseHash}`;

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

        // Create virtual CSS module
        const cssFilename = `${fileHash}-${cssIndex++}.css`;
        cssModules.set(cssFilename, allCss);
        cssImports.push(`import "styled-static:${cssFilename}";`);

        // Generate replacement code
        const variantKeys = Array.from(v.variants.keys());
        const replacement = generateVariantReplacement(
          v,
          baseClass,
          variantKeys,
          isDev
        );
        s.overwrite(v.start, v.end, replacement);

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
          : "styled-static/runtime";

      // Prepend imports: CSS first, then runtime
      let prepend = "";
      if (cssImports.length > 0) {
        prepend += cssImports.join("\n") + "\n";
      }
      if (needsCreateElement) {
        prepend += `import { createElement } from "react";\n`;
        prepend += `import { m } from "${runtimeBasePath}";\n`;
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
  };
}

// ============================================================================
// AST Helpers
// ============================================================================

/**
 * Find all imports from 'styled-static' and return their local names.
 * Handles aliased imports like `import { styled as s } from 'styled-static'`
 */
function findStyledStaticImports(ast: ESTree.Program): StyledStaticImports {
  const imports: StyledStaticImports = {};

  for (const node of ast.body) {
    if (node.type === "ImportDeclaration") {
      const source = node.source.value as string;
      // Match both "styled-static" (package) and "./index" (local dev)
      const isStyledStaticImport =
        source === "styled-static" ||
        source === "./index" ||
        source === "../index";

      if (isStyledStaticImport) {
        // Track the source for determining runtime import path
        imports.source = source;

        for (const spec of node.specifiers) {
          if (spec.type === "ImportSpecifier") {
            const imported = (spec.imported as ESTree.Identifier).name;
            const local = spec.local.name;

            if (imported === "styled") imports.styled = local;
            if (imported === "css") imports.css = local;
            if (imported === "createGlobalStyle")
              imports.createGlobalStyle = local;
            if (imported === "keyframes") imports.keyframes = local;
            if (imported === "styledVariants") imports.styledVariants = local;
            if (imported === "cssVariants") imports.cssVariants = local;
            if (imported === "withComponent") imports.withComponent = local;
          }
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
function findTaggedTemplates(
  ast: ESTree.Program,
  imports: StyledStaticImports,
  code: string
): FoundTemplate[] {
  const results: FoundTemplate[] = [];

  /**
   * Process a variable declaration that might contain a styled template
   */
  function processVariableDeclaration(node: ESTree.VariableDeclaration) {
    for (const decl of node.declarations) {
      if (
        decl.init?.type === "TaggedTemplateExpression" &&
        decl.id.type === "Identifier"
      ) {
        const template = decl.init as TaggedTemplateWithPosition;
        const varName = decl.id.name;
        const found = classifyTemplate(template, imports, varName, code);
        if (found) results.push(found);
      }
    }
  }

  for (const node of ast.body) {
    // Regular variable declaration: const X = styled.div`...`
    if (node.type === "VariableDeclaration") {
      processVariableDeclaration(node);
    }

    // Exported variable: export const X = styled.div`...`
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration"
    ) {
      processVariableDeclaration(node.declaration);
    }
  }

  return results;
}

/**
 * Classify a tagged template expression into one of our supported types.
 */
function classifyTemplate(
  node: TaggedTemplateWithPosition,
  imports: StyledStaticImports,
  variableName: string,
  code: string
): FoundTemplate | null {
  const { tag } = node;

  // styled.element`...`
  if (
    tag.type === "MemberExpression" &&
    tag.object.type === "Identifier" &&
    tag.object.name === imports.styled &&
    tag.property.type === "Identifier"
  ) {
    return {
      type: "styled",
      node,
      tag: tag.property.name,
      variableName,
    };
  }

  // styled(Component)`...`
  if (
    tag.type === "CallExpression" &&
    tag.callee.type === "Identifier" &&
    tag.callee.name === imports.styled &&
    tag.arguments[0]?.type === "Identifier"
  ) {
    return {
      type: "styledExtend",
      node,
      tag: "",
      baseComponent: (tag.arguments[0] as ESTree.Identifier).name,
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

  // keyframes`...`
  if (tag.type === "Identifier" && tag.name === imports.keyframes) {
    return {
      type: "keyframes",
      node,
      tag: "",
      variableName,
    };
  }

  // styled.element.attrs({...})`...`
  // Pattern: CallExpression -> MemberExpression -> MemberExpression
  if (
    tag.type === "CallExpression" &&
    tag.callee.type === "MemberExpression" &&
    tag.callee.property.type === "Identifier" &&
    tag.callee.property.name === "attrs" &&
    tag.callee.object.type === "MemberExpression" &&
    tag.callee.object.object.type === "Identifier" &&
    tag.callee.object.object.name === imports.styled &&
    tag.callee.object.property.type === "Identifier" &&
    tag.arguments.length === 1
  ) {
    const elementTag = (tag.callee.object.property as ESTree.Identifier).name;
    // Capture the attrs argument as a string for later use
    const attrsNode = tag.arguments[0] as ESTree.Node & {
      start: number;
      end: number;
    };
    const attrsArg = code.slice(attrsNode.start, attrsNode.end);
    return {
      type: "styledAttrs",
      node,
      tag: elementTag,
      variableName,
      attrsArg,
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
function extractTemplateContent(
  code: string,
  quasi: TemplateLiteralWithPosition
): string {
  // Get raw content between backticks
  return code.slice(quasi.start + 1, quasi.end - 1);
}

// ============================================================================
// Code Generation
// ============================================================================

/**
 * Generate the replacement code for a styled template.
 *
 * This generates inline React components using Object.assign pattern:
 * Object.assign((p) => createElement(tag, {...p, className: m(cls, p.className)}), { className: cls })
 *
 * SECURITY: Uses safeStringLiteral() for className to prevent code injection.
 */
function generateReplacement(
  template: FoundTemplate,
  className: string,
  _isDev: boolean
): string {
  const cls = safeStringLiteral(className);

  switch (template.type) {
    case "styled":
      // Inline component: Object.assign((p) => createElement("tag", {...p, className: m("cls", p.className)}), { className: "cls" })
      return `Object.assign((p) => createElement(${safeStringLiteral(template.tag)}, {...p, className: m(${cls}, p.className)}), { className: ${cls} })`;

    case "styledExtend":
      // Extension: renders base component with merged className
      // className is concatenated at runtime: Base.className + " " + newClass
      return `Object.assign((p) => createElement(${template.baseComponent}, {...p, className: m(${cls}, p.className)}), { className: ${template.baseComponent}.className + " " + ${cls} })`;

    case "styledAttrs":
      // Attrs: spread default attrs, then props, with className merge
      return `Object.assign((p) => createElement(${safeStringLiteral(template.tag)}, {...(${template.attrsArg ?? "{}"}), ...p, className: m(${cls}, p.className)}), { className: ${cls} })`;

    case "css":
      return cls;

    case "keyframes":
      // Keyframes are replaced with just the scoped animation name
      return cls;

    case "createGlobalStyle":
      // GlobalStyle is a no-op component (CSS is imported via side-effect)
      return `() => null`;
  }
}

/**
 * Normalize file paths for consistent hashing across platforms.
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

// ============================================================================
// Variant Detection
// ============================================================================

/**
 * Find all styledVariants and cssVariants calls in the AST.
 */
function findVariantCalls(
  ast: ESTree.Program,
  code: string,
  imports: StyledStaticImports
): FoundVariant[] {
  const results: FoundVariant[] = [];

  function processVariableDeclaration(node: ESTree.VariableDeclaration) {
    for (const decl of node.declarations) {
      if (
        decl.init?.type === "CallExpression" &&
        decl.id.type === "Identifier"
      ) {
        const call = decl.init as ESTree.CallExpression & {
          start: number;
          end: number;
        };
        const varName = decl.id.name;
        const found = classifyVariantCall(call, code, imports, varName);
        if (found) results.push(found);
      }
    }
  }

  for (const node of ast.body) {
    // Regular variable declaration: const X = styledVariants({...})
    if (node.type === "VariableDeclaration") {
      processVariableDeclaration(node);
    }

    // Exported variable: export const X = styledVariants({...})
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration"
    ) {
      processVariableDeclaration(node.declaration);
    }
  }

  return results;
}

/**
 * Classify a call expression as styledVariants or cssVariants.
 */
function classifyVariantCall(
  node: ESTree.CallExpression & { start: number; end: number },
  code: string,
  imports: StyledStaticImports,
  variableName: string
): FoundVariant | null {
  if (node.callee.type !== "Identifier") return null;

  const calleeName = node.callee.name;
  const isStyledVariants = calleeName === imports.styledVariants;
  const isCssVariants = calleeName === imports.cssVariants;

  if (!isStyledVariants && !isCssVariants) return null;

  // The argument should be an object expression
  if (
    node.arguments.length !== 1 ||
    node.arguments[0]?.type !== "ObjectExpression"
  ) {
    return null;
  }

  const configObj = node.arguments[0] as ESTree.ObjectExpression;

  let component: string | undefined;
  let baseCss: string | undefined;
  const variants = new Map<string, Map<string, string>>();

  for (const prop of configObj.properties) {
    if (prop.type !== "Property" || prop.key.type !== "Identifier") continue;

    const propName = prop.key.name;

    // component: 'button' or component: Button
    if (propName === "component") {
      if (
        prop.value.type === "Literal" &&
        typeof prop.value.value === "string"
      ) {
        component = prop.value.value;
      } else if (prop.value.type === "Identifier") {
        component = prop.value.name;
      }
    }

    // css: `...` or css: css`...`
    if (propName === "css") {
      if (
        prop.value.type === "Literal" &&
        typeof prop.value.value === "string"
      ) {
        baseCss = prop.value.value;
      } else if (prop.value.type === "TemplateLiteral") {
        const tpl = prop.value as ESTree.TemplateLiteral & {
          start: number;
          end: number;
        };
        baseCss = code.slice(tpl.start + 1, tpl.end - 1);
      } else if (prop.value.type === "TaggedTemplateExpression") {
        // Support css`...` tagged template for syntax highlighting
        const tagged = prop.value as ESTree.TaggedTemplateExpression & {
          quasi: ESTree.TemplateLiteral & { start: number; end: number };
        };
        if (
          tagged.tag.type === "Identifier" &&
          tagged.tag.name === imports.css
        ) {
          baseCss = code.slice(tagged.quasi.start + 1, tagged.quasi.end - 1);
        }
      }
    }

    // variants: { color: { primary: `...` }, size: { sm: `...` } }
    if (propName === "variants" && prop.value.type === "ObjectExpression") {
      for (const variantProp of prop.value.properties) {
        if (
          variantProp.type !== "Property" ||
          variantProp.key.type !== "Identifier"
        )
          continue;
        if (variantProp.value.type !== "ObjectExpression") continue;

        const variantName = variantProp.key.name;
        const variantValues = new Map<string, string>();

        for (const valueProp of variantProp.value.properties) {
          if (
            valueProp.type !== "Property" ||
            valueProp.key.type !== "Identifier"
          )
            continue;

          const valueName = valueProp.key.name;
          let cssContent: string | undefined;

          if (
            valueProp.value.type === "Literal" &&
            typeof valueProp.value.value === "string"
          ) {
            cssContent = valueProp.value.value;
          } else if (valueProp.value.type === "TemplateLiteral") {
            const tpl = valueProp.value as ESTree.TemplateLiteral & {
              start: number;
              end: number;
            };
            cssContent = code.slice(tpl.start + 1, tpl.end - 1);
          } else if (valueProp.value.type === "TaggedTemplateExpression") {
            // Support css`...` tagged template for syntax highlighting
            const tagged =
              valueProp.value as ESTree.TaggedTemplateExpression & {
                quasi: ESTree.TemplateLiteral & { start: number; end: number };
              };
            if (
              tagged.tag.type === "Identifier" &&
              tagged.tag.name === imports.css
            ) {
              cssContent = code.slice(
                tagged.quasi.start + 1,
                tagged.quasi.end - 1
              );
            }
          }

          if (cssContent) {
            variantValues.set(valueName, cssContent);
          }
        }

        if (variantValues.size > 0) {
          variants.set(variantName, variantValues);
        }
      }
    }
  }

  return {
    type: isStyledVariants ? "styledVariants" : "cssVariants",
    start: node.start,
    end: node.end,
    component,
    baseCss,
    variants,
    variableName,
  };
}

/**
 * Generate replacement code for a variant call.
 *
 * This generates inline components with explicit variant checks.
 * No string interpolation with user values - each variant value generates
 * a static if/else check for maximum security.
 *
 * SECURITY: Validates component names and generates explicit equality checks.
 */
function generateVariantReplacement(
  variant: FoundVariant,
  baseClass: string,
  variantKeys: string[],
  _isDev: boolean
): string {
  const cls = safeStringLiteral(baseClass);

  // Generate variant class building logic
  // Each variant key gets explicit if/else checks for each value
  // For cssVariants, use "variants.key" in condition; for styledVariants, use destructured "key"
  const isCssVariants = variant.type === "cssVariants";

  const variantChecks: string[] = [];
  for (const key of variantKeys) {
    const values = variant.variants.get(key);
    if (values) {
      // Use variants.key for cssVariants, plain key for styledVariants
      const keyRef = isCssVariants ? `variants.${key}` : key;
      const valueChecks = Array.from(values.keys())
        .map(
          (value, i) =>
            `${i === 0 ? "if" : "else if"} (${keyRef} === ${safeStringLiteral(value)}) c += ${safeStringLiteral(` ${baseClass}--${key}-${value}`)}`
        )
        .join("; ");
      if (valueChecks) {
        variantChecks.push(valueChecks);
      }
    }
  }

  // Join variant checks with semicolons and newlines for readability
  const variantLogic = variantChecks.length > 0 ? variantChecks.join("; ") + "; " : "";

  // Destructure variant props from the component props
  const propsDestructure =
    variantKeys.length > 0
      ? `{ ${variantKeys.join(", ")}, className, ...p }`
      : `{ className, ...p }`;

  if (variant.type === "styledVariants") {
    // Check if component is an HTML tag (lowercase) or component reference
    const isHtmlTag = variant.component && /^[a-z]/.test(variant.component);

    if (isHtmlTag) {
      // SECURITY: Validate HTML tag name
      if (!variant.component || !/^[a-z][a-z0-9]*$/.test(variant.component)) {
        throw new Error(
          `[styled-static] Invalid HTML tag name: ${variant.component}`
        );
      }
      const tag = safeStringLiteral(variant.component);
      return `Object.assign((${propsDestructure}) => { let c = ${cls}; ${variantLogic}return createElement(${tag}, {...p, className: m(c, className)}); }, { className: ${cls} })`;
    } else {
      // SECURITY: Validate component reference is a valid identifier
      if (!variant.component || !isValidIdentifier(variant.component)) {
        throw new Error(
          `[styled-static] Invalid component name: ${variant.component}`
        );
      }
      // Extension: className includes base component's className
      return `Object.assign((${propsDestructure}) => { let c = ${cls}; ${variantLogic}return createElement(${variant.component}, {...p, className: m(c, className)}); }, { className: ${variant.component}.className + " " + ${cls} })`;
    }
  }

  // cssVariants: returns a function that generates class string
  // variantLogic already uses "variants.key" for condition checks (set above via isCssVariants)
  return `(variants) => { let c = ${cls}; ${variantLogic}return c; }`;
}

// ============================================================================
// withComponent Detection
// ============================================================================

/**
 * Find all withComponent(To, From) calls in the AST.
 */
function findWithComponentCalls(
  ast: ESTree.Program,
  imports: StyledStaticImports
): FoundWithComponent[] {
  const results: FoundWithComponent[] = [];

  function processVariableDeclaration(node: ESTree.VariableDeclaration) {
    for (const decl of node.declarations) {
      if (
        decl.init?.type === "CallExpression" &&
        decl.id.type === "Identifier"
      ) {
        const call = decl.init as ESTree.CallExpression & {
          start: number;
          end: number;
        };
        const varName = decl.id.name;

        // Check if this is a withComponent call
        if (
          call.callee.type === "Identifier" &&
          call.callee.name === imports.withComponent &&
          call.arguments.length === 2
        ) {
          const toArg = call.arguments[0];
          const fromArg = call.arguments[1];

          let toComponent: string | undefined;
          let fromComponent: string | undefined;

          // toComponent can be a string literal (HTML tag) or identifier (component)
          if (toArg?.type === "Literal" && typeof toArg.value === "string") {
            toComponent = toArg.value;
          } else if (toArg?.type === "Identifier") {
            toComponent = toArg.name;
          }

          // fromComponent must be an identifier (styled component reference)
          if (fromArg?.type === "Identifier") {
            fromComponent = fromArg.name;
          }

          if (toComponent && fromComponent) {
            results.push({
              start: call.start,
              end: call.end,
              toComponent,
              fromComponent,
              variableName: varName,
            });
          }
        }
      }
    }
  }

  for (const node of ast.body) {
    // Regular variable declaration: const X = withComponent(Link, Button)
    if (node.type === "VariableDeclaration") {
      processVariableDeclaration(node);
    }

    // Exported variable: export const X = withComponent(Link, Button)
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration"
    ) {
      processVariableDeclaration(node.declaration);
    }
  }

  return results;
}

// Default export for convenience
export default styledStatic;
