/**
 * Code generation for styled-static.
 *
 * Generates replacement JavaScript code for styled templates,
 * variant calls, and withComponent calls. All functions are pure
 * and produce string output for AST replacement.
 */
import type { FoundTemplate, FoundVariant } from "./parse.js";

// ============================================================================
// Security Helpers
// ============================================================================

/**
 * SECURITY: Validates that a string is a safe identifier (alphanumeric + underscore).
 * Prevents code injection via displayName or component name interpolation.
 */
export function isValidIdentifier(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/**
 * SECURITY: Safely escape a string for use in generated code.
 * Uses JSON.stringify to properly escape special characters.
 */
export function safeStringLiteral(str: string): string {
  return JSON.stringify(str);
}

// ============================================================================
// Template Code Generation
// ============================================================================

/**
 * Generate the replacement code for a styled template.
 *
 * This generates inline React components using Object.assign pattern:
 * Object.assign((p) => createElement(tag, {...p, className: m(cls, p.className)}), { className: cls })
 *
 * SECURITY: Uses safeStringLiteral() for className to prevent code injection.
 */
export function generateReplacement(
  template: FoundTemplate,
  className: string
): string {
  const cls = safeStringLiteral(className);

  switch (template.type) {
    case "styled":
      return `Object.assign((p) => createElement(${safeStringLiteral(template.tag)}, {...p, className: m(${cls}, p.className)}), { className: ${cls} })`;

    case "styledExtend":
      return `Object.assign((p) => createElement(${template.baseComponent}, {...p, className: m(${cls}, p.className)}), { className: ${template.baseComponent}.className + " " + ${cls} })`;

    case "styledAttrs":
      return `Object.assign((p) => createElement(${safeStringLiteral(template.tag)}, {...(${template.attrsArg ?? "{}"}), ...p, className: m(${cls}, p.className)}), { className: ${cls} })`;

    case "css":
      return cls;

    case "keyframes":
      return cls;

    case "createGlobalStyle":
      return `() => null`;
  }
}

// ============================================================================
// Variant Code Generation
// ============================================================================

/** Threshold for switching from if/else to hoisted map */
const VARIANT_MAP_THRESHOLD = 4;

/** Result from variant replacement generation */
export interface VariantReplacementResult {
  code: string;
  hoisted: string | undefined;
}

/**
 * Generate replacement code for a variant call.
 *
 * Uses a hybrid approach:
 * - For <= 4 total variant values: if/else chains (zero allocation, simple)
 * - For > 4 total variant values: hoisted static map (O(1) lookup, compact)
 *
 * SECURITY: Validates component names and generates explicit equality checks.
 */
export function generateVariantReplacement(
  variant: FoundVariant,
  baseClass: string,
  variantKeys: string[],
  nextMapId: () => number
): VariantReplacementResult {
  const cls = safeStringLiteral(baseClass);
  const isCssVariants = variant.type === "cssVariants";

  // Calculate total variant values to determine strategy
  const totalVariantValues = variantKeys.reduce(
    (sum, key) => sum + (variant.variants.get(key)?.size ?? 0),
    0
  );
  const useHoistedMap = totalVariantValues > VARIANT_MAP_THRESHOLD;

  // Destructure variant props from the component props, with defaults if specified
  const propsEntries = variantKeys.map((key) => {
    const defaultValue = variant.defaultVariants?.get(key);
    return defaultValue ? `${key} = ${safeStringLiteral(defaultValue)}` : key;
  });
  const propsDestructure =
    variantKeys.length > 0
      ? `{ ${propsEntries.join(", ")}, className, ...p }`
      : `{ className, ...p }`;

  let variantLogic: string;
  let hoisted: string | undefined;

  if (useHoistedMap && variantKeys.length > 0) {
    // Generate hoisted static map for > 4 values
    const mapName = `_vm${nextMapId()}`;

    const mapEntries = variantKeys.map((key) => {
      const values = variant.variants.get(key);
      if (!values) return "";
      const valueEntries = Array.from(values.keys())
        .map(
          (v) =>
            `${safeStringLiteral(v)}:${safeStringLiteral(` ${baseClass}--${key}-${v}`)}`
        )
        .join(",");
      return `${key}:{${valueEntries}}`;
    });
    hoisted = `const ${mapName}={${mapEntries.join(",")}};`;

    const lookups = variantKeys.map((key) => {
      const keyRef = isCssVariants ? `variants.${key}` : key;
      return `c+=${mapName}.${key}[${keyRef}]||""`;
    });
    variantLogic = lookups.join(";") + ";";
  } else {
    // Generate if/else checks for <= 4 values (original approach)
    const variantChecks: string[] = [];
    for (const key of variantKeys) {
      const values = variant.variants.get(key);
      if (values) {
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
    variantLogic =
      variantChecks.length > 0 ? variantChecks.join("; ") + "; " : "";
  }

  // Note: Compound variants work through CSS specificity alone.
  // The combined selectors (e.g., .ss-btn--size-lg.ss-btn--intent-danger)
  // automatically match when individual variant classes are present.
  // No additional runtime logic is needed.

  if (variant.type === "styledVariants") {
    const isHtmlTag = variant.component && /^[a-z]/.test(variant.component);

    if (isHtmlTag) {
      if (!variant.component || !/^[a-z][a-z0-9]*$/.test(variant.component)) {
        throw new Error(
          `[styled-static] Invalid HTML tag name: ${variant.component}`
        );
      }
      const tag = safeStringLiteral(variant.component);
      return {
        code: `Object.assign((${propsDestructure}) => { let c = ${cls}; ${variantLogic}return createElement(${tag}, {...p, className: m(c, className)}); }, { className: ${cls} })`,
        hoisted,
      };
    } else {
      if (!variant.component || !isValidIdentifier(variant.component)) {
        throw new Error(
          `[styled-static] Invalid component name: ${variant.component}`
        );
      }
      return {
        code: `Object.assign((${propsDestructure}) => { let c = ${cls}; ${variantLogic}return createElement(${variant.component}, {...p, className: m(c, className)}); }, { className: ${variant.component}.className + " " + ${cls} })`,
        hoisted,
      };
    }
  }

  // cssVariants: returns a function that generates class string
  // Apply defaultVariants by merging defaults with provided variants
  let defaultsPrefix = "";
  if (
    isCssVariants &&
    variant.defaultVariants &&
    variant.defaultVariants.size > 0
  ) {
    const defaultEntries = Array.from(variant.defaultVariants.entries())
      .map(([k, v]) => `${safeStringLiteral(k)}:${safeStringLiteral(v)}`)
      .join(",");
    defaultsPrefix = `variants = {...{${defaultEntries}}, ...variants}; `;
  }
  return {
    code: `(variants) => { ${defaultsPrefix}let c = ${cls}; ${variantLogic}return c; }`,
    hoisted,
  };
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Extract a clean, CSS-safe filename from a file path.
 * Used in dev mode to generate readable class names.
 */
export function getFileBaseName(filePath: string): string {
  const base = filePath.split("/").pop() || "unknown";
  return base.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Normalize file paths for consistent virtual module IDs across platforms.
 * Converts backslashes to forward slashes and strips leading slashes.
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "");
}

/**
 * Rewrite CSS imports in chunk code for library builds.
 * Removes virtual CSS imports and adds a single relative CSS file import.
 */
export function rewriteCssImports(code: string, cssFileName: string): string {
  // Remove all virtual:styled-static imports
  code = code.replace(/import\s*["']virtual:styled-static[^"']*["'];?\n?/g, "");
  // Remove /* empty css */ comments Vite adds
  code = code.replace(/\/\*\s*empty css\s*\*\/\s*/g, "");
  // Remove useless side-effect import of styled-static package
  code = code.replace(
    /import\s*["']@alex\.radulescu\/styled-static["'];?\n?/g,
    ""
  );

  // Get just the filename for relative import (same directory)
  const baseName = cssFileName.split("/").pop() || cssFileName;

  // Add single relative CSS import at top
  return `import "./${baseName}";\n${code}`;
}
