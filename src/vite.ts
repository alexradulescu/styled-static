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

import type { Plugin, ResolvedConfig } from "vite";
import type * as ESTree from "estree";
import MagicString from "magic-string";
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
}

/** Import tracking for styled-static */
interface StyledStaticImports {
  styled?: string;
  css?: string;
  createGlobalStyle?: string;
  styledVariants?: string;
  cssVariants?: string;
  /** The source path of the import (e.g., "styled-static" or "./index") */
  source?: string;
}

/** Types of styled templates we can transform */
type TemplateType = "styled" | "styledExtend" | "css" | "createGlobalStyle";

/** Types of variant calls we can transform */
type VariantType = "styledVariants" | "cssVariants";

/** Information about a found template */
interface FoundTemplate {
  type: TemplateType;
  node: TaggedTemplateWithPosition;
  tag: string; // HTML tag for styled.element
  baseComponent?: string; // Component name for styled(Component)
  variableName?: string; // Variable name for displayName
}

/** Information about a found variant call */
interface FoundVariant {
  type: VariantType;
  start: number;
  end: number;
  component?: string; // 'button' or Component reference
  baseCss?: string; // Base CSS string
  variants: Map<string, Map<string, string>>; // variantName -> { valueName -> css }
  variableName?: string; // Variable name for displayName
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
  const { classPrefix = "ss" } = options;

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
        const fileHash = hash(normalizePath(file)).slice(0, 6);
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

      console.log("[styled-static] Transforming:", id);

      // Parse AST using Vite's built-in parser
      // Since we run after React plugin (enforce: 'post'), JSX is already transformed
      let ast: ESTree.Program;
      try {
        ast = this.parse(code) as ESTree.Program;
        console.log(
          "[styled-static] AST parsed successfully, body length:",
          ast.body.length
        );
      } catch (e) {
        // Parse error - this might be a partial file or syntax error
        console.log("[styled-static] AST parse error:", e);
        return null;
      }

      // Find styled-static imports and their local names
      const imports = findStyledStaticImports(ast);
      console.log("[styled-static] Found imports:", imports);
      const hasTemplateImports =
        imports.css || imports.styled || imports.createGlobalStyle;
      const hasVariantImports = imports.styledVariants || imports.cssVariants;
      if (!hasTemplateImports && !hasVariantImports) {
        console.log("[styled-static] No imports found, skipping");
        return null;
      }

      // Find all tagged template literals using our imports
      const templates = hasTemplateImports
        ? findTaggedTemplates(ast, imports)
        : [];
      console.log("[styled-static] Found templates:", templates.length);

      // Find all variant calls using our imports
      const variantCalls = hasVariantImports
        ? findVariantCalls(ast, code, imports)
        : [];
      console.log("[styled-static] Found variant calls:", variantCalls.length);

      if (templates.length === 0 && variantCalls.length === 0) {
        console.log("[styled-static] No templates or variants found, skipping");
        return null;
      }

      const s = new MagicString(code);
      const fileHash = hash(normalizePath(id)).slice(0, 6);
      const cssImports: string[] = [];
      let needsStyledRuntime = false;
      let needsExtendRuntime = false;
      let needsGlobalRuntime = false;
      let needsStyledVariantsRuntime = false;
      let needsStyledVariantsExtendRuntime = false;
      let needsCssVariantsRuntime = false;

      let cssIndex = 0;

      for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        if (!t) continue; // Guard against undefined (noUncheckedIndexedAccess)
        const cssContent = extractTemplateContent(code, t.node.quasi);
        const cssHash = hash(cssContent).slice(0, 6);
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

        if (t.type === "styled") needsStyledRuntime = true;
        if (t.type === "styledExtend") needsExtendRuntime = true;
        if (t.type === "createGlobalStyle") needsGlobalRuntime = true;
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

        // Track runtime needs
        if (v.type === "styledVariants") {
          // Check if component is a string (HTML tag) or reference (component)
          if (v.component && /^[a-z]/.test(v.component)) {
            needsStyledVariantsRuntime = true;
          } else {
            needsStyledVariantsExtendRuntime = true;
          }
        }
        if (v.type === "cssVariants") needsCssVariantsRuntime = true;
      }

      // Build runtime imports
      const runtimeImports: string[] = [];
      if (needsStyledRuntime) runtimeImports.push("__styled");
      if (needsExtendRuntime) runtimeImports.push("__styledExtend");
      if (needsGlobalRuntime) runtimeImports.push("__GlobalStyle");
      if (needsStyledVariantsRuntime) runtimeImports.push("__styledVariants");
      if (needsStyledVariantsExtendRuntime)
        runtimeImports.push("__styledVariantsExtend");
      if (needsCssVariantsRuntime) runtimeImports.push("__cssVariants");

      // Determine the runtime import path based on original import source
      const runtimePath =
        imports.source === "./index" || imports.source === "../index"
          ? imports.source.replace("/index", "/runtime")
          : "styled-static/runtime";

      // Prepend imports (CSS first, then runtime)
      let prepend = "";
      if (cssImports.length > 0) {
        prepend += cssImports.join("\n") + "\n";
      }
      if (runtimeImports.length > 0) {
        prepend += `import { ${runtimeImports.join(
          ", "
        )} } from "${runtimePath}";\n`;
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
            if (imported === "styledVariants") imports.styledVariants = local;
            if (imported === "cssVariants") imports.cssVariants = local;
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
  imports: StyledStaticImports
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
        const found = classifyTemplate(template, imports, varName);
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
  variableName: string
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
 */
function generateReplacement(
  template: FoundTemplate,
  className: string,
  isDev: boolean
): string {
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

    // css: `...`
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
 */
function generateVariantReplacement(
  variant: FoundVariant,
  baseClass: string,
  variantKeys: string[],
  isDev: boolean
): string {
  const displayName = isDev ? variant.variableName : undefined;
  const displayNameArg = displayName ? `, "${displayName}"` : "";
  const keysJson = JSON.stringify(variantKeys);

  if (variant.type === "styledVariants") {
    // Check if component is an HTML tag (lowercase) or component reference
    const isHtmlTag = variant.component && /^[a-z]/.test(variant.component);
    if (isHtmlTag) {
      return `__styledVariants("${variant.component}", "${baseClass}", ${keysJson}${displayNameArg})`;
    } else {
      return `__styledVariantsExtend(${variant.component}, "${baseClass}", ${keysJson}${displayNameArg})`;
    }
  }

  // cssVariants
  return `__cssVariants("${baseClass}", ${keysJson})`;
}

// Default export for convenience
export default styledStatic;
