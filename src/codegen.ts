/**
 * Code generation for styled-static.
 *
 * Generates replacement JavaScript code for styled templates,
 * variant calls, and withComponent calls. All functions are pure
 * and produce string output for AST replacement.
 */
import type { FoundTemplate, FoundVariant, FoundWithComponent } from "./parse.js";

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

export function isValidComponentReference(value: string): boolean {
  return value.split(".").every(isValidIdentifier);
}

/**
 * SECURITY: Safely escape a string for use in generated code.
 * Uses JSON.stringify to properly escape special characters.
 */
export function safeStringLiteral(str: string): string {
  return JSON.stringify(str);
}

/** Convert an arbitrary API name into a readable, collision-resistant CSS class segment. */
export function toClassNameSegment(value: string): string {
  const readable = value.replace(/[^a-zA-Z0-9_-]/g, "-") || "value";
  return readable === value ? readable : `${readable}-${simpleHash(value)}`;
}

export function createVariantClassName(
  baseClass: string,
  variantName: string,
  valueName: string,
): string {
  return `${baseClass}--${toClassNameSegment(variantName)}-${toClassNameSegment(valueName)}`;
}

/** Small local hash used only to disambiguate sanitized class-name segments. */
function simpleHash(value: string): string {
  let result = 5381;
  for (let index = 0; index < value.length; index++) {
    result = (result * 33) ^ value.charCodeAt(index);
  }
  return (result >>> 0).toString(36).slice(0, 5);
}

export function createVariantValueName(name: string, index: number): string {
  const readable = name.replace(/[^a-zA-Z0-9_$]/g, "_");
  return `_variant_${readable || "value"}_${index}`;
}

export interface GeneratedRuntimeNames {
  createElement: string;
  mergeClassNames: string;
  props: string;
  remainingProps: string;
  userClassName: string;
  classNames: string;
  variantValues?: string[];
}

const defaultRuntimeNames: GeneratedRuntimeNames = {
  createElement: "createElement",
  mergeClassNames: "mergeClassNames",
  props: "props",
  remainingProps: "remainingProps",
  userClassName: "userClassName",
  classNames: "classNames",
};

function ownClassName(props: string): string {
  return `Object.hasOwn(${props}, "className") ? ${props}.className : undefined`;
}

// ============================================================================
// Template Code Generation
// ============================================================================

/**
 * Generate the replacement code for a styled template.
 *
 * This generates inline React components using Object.assign pattern:
 * Object.assign((props) => createElement(tag, {...props, className: mergeClassNames(cls, props.className)}), { className: cls })
 *
 * SECURITY: Uses safeStringLiteral() for className to prevent code injection.
 */
export function generateReplacement(
  template: FoundTemplate,
  className: string,
  runtimeNames: GeneratedRuntimeNames = defaultRuntimeNames,
): string {
  const cls = safeStringLiteral(className);
  const { createElement, mergeClassNames, props } = runtimeNames;

  switch (template.type) {
    case "styled":
      return `Object.assign((${props}) => ${createElement}(${safeStringLiteral(template.tag)}, {...${props}, className: ${mergeClassNames}(${cls}, ${ownClassName(props)})}), { className: ${cls} })`;

    case "styledExtend":
      // template.baseComponent comes from AST (Identifier node) so it is a valid
      // JS identifier by construction, but assert for defense-in-depth.
      if (!template.baseComponent || !isValidComponentReference(template.baseComponent)) {
        /* unreachable: AST component references are validated during parsing */
        throw new Error(`[styled-static] Invalid base component name: ${template.baseComponent}`);
      }
      return `Object.assign((${props}) => ${createElement}(${template.baseComponent}, {...${props}, className: ${mergeClassNames}(${cls}, ${ownClassName(props)})}), { className: [${template.baseComponent}.className, ${cls}].filter(Boolean).join(" ") })`;

    case "styledAttrs":
      return `Object.assign((${props}) => ${createElement}(${safeStringLiteral(template.tag)}, {...(${template.attrsArg ?? "{}"}), ...${props}, className: ${mergeClassNames}(${cls}, ${ownClassName(props)})}), { className: ${cls} })`;

    case "css":
      return cls;

    case "keyframes":
      return cls;

    case "globalCss":
      return "void 0";
  }
}

/** Generate the replacement for withComponent(To, From). */
export function generateWithComponentReplacement(
  conversion: FoundWithComponent,
  runtimeNames: GeneratedRuntimeNames = defaultRuntimeNames,
): string {
  if (!isValidComponentReference(conversion.fromComponent)) {
    /* unreachable: component references are validated during parsing */
    throw new Error(`[styled-static] Invalid source component: ${conversion.fromComponent}`);
  }

  const target =
    conversion.toComponent.kind === "htmlTag"
      ? safeStringLiteral(conversion.toComponent.value)
      : conversion.toComponent.value;
  if (conversion.toComponent.kind === "component" && !isValidComponentReference(target)) {
    /* unreachable: component references are validated during parsing */
    throw new Error(`[styled-static] Invalid target component: ${target}`);
  }

  const { createElement, mergeClassNames, props } = runtimeNames;
  return `Object.assign((${props}) => ${createElement}(${target}, {...${props}, className: ${mergeClassNames}(${conversion.fromComponent}.className, ${ownClassName(props)})}), { className: ${conversion.fromComponent}.className })`;
}

// ============================================================================
// Variant Code Generation
// ============================================================================

/**
 * Generate replacement code for a variant call.
 *
 * Uses explicit equality checks for every variant. This is deliberately verbose:
 * it is easy to audit, accepts no inherited object properties, and never turns a
 * user-provided value into a class name.
 */
export function generateVariantReplacement(
  variant: FoundVariant,
  baseClass: string,
  variantKeys: string[],
  runtimeNames: GeneratedRuntimeNames = defaultRuntimeNames,
): string {
  const cls = safeStringLiteral(baseClass);
  const {
    createElement,
    mergeClassNames,
    remainingProps,
    userClassName,
    classNames,
    variantValues,
  } = runtimeNames;

  const props = runtimeNames.props;
  const omittedVariantProps = variantKeys
    .map((key, index) => {
      const localName = variantValues?.[index] ?? createVariantValueName(key, index);
      return `${safeStringLiteral(key)}: ${localName}_omitted`;
    })
    .join(", ");
  const propsDestructure = `{ ${omittedVariantProps}${omittedVariantProps ? ", " : ""}className: ${userClassName}_omitted, ...${remainingProps} }`;
  const styledSelectionDeclarations = variantKeys
    .map((key, index) => {
      const keyLiteral = safeStringLiteral(key);
      const localName = variantValues?.[index] ?? createVariantValueName(key, index);
      const defaultValue = variant.defaultVariants?.get(key);
      const fallback = defaultValue === undefined ? "undefined" : safeStringLiteral(defaultValue);
      return `const ${localName} = Object.hasOwn(${props}, ${keyLiteral}) && ${props}[${keyLiteral}] !== undefined ? ${props}[${keyLiteral}] : ${fallback};`;
    })
    .join(" ");
  const userClassNameDeclaration = `const ${userClassName} = Object.hasOwn(${props}, "className") ? ${props}.className : undefined;`;

  const variantChecks: string[] = [];
  for (let keyIndex = 0; keyIndex < variantKeys.length; keyIndex++) {
    const key = variantKeys[keyIndex];
    if (!key) continue;

    const values = variant.variants.get(key);
    if (values) {
      const keyRef = variantValues?.[keyIndex] ?? createVariantValueName(key, keyIndex);
      const valueChecks = Array.from(values.keys())
        .map((value, valueIndex) => {
          const modifierClass = createVariantClassName(baseClass, key, value);
          return `${valueIndex === 0 ? "if" : "else if"} (${keyRef} === ${safeStringLiteral(value)}) ${classNames} += ${safeStringLiteral(` ${modifierClass}`)}`;
        })
        .join("; ");
      if (valueChecks) {
        variantChecks.push(valueChecks);
      }
    }
  }
  const variantLogic = variantChecks.length > 0 ? variantChecks.join("; ") + "; " : "";

  // Note: Compound variants work through CSS specificity alone.
  // The combined selectors (e.g., .ss-btn--size-lg.ss-btn--intent-danger)
  // automatically match when individual variant classes are present.
  // No additional runtime logic is needed.

  if (variant.type === "styledVariants") {
    const component = variant.component;

    if (component?.kind === "htmlTag") {
      if (!/^[a-zA-Z][a-zA-Z0-9:-]*$/.test(component.value)) {
        /* unreachable: component is a validated JSX intrinsic element */
        throw new Error(`[styled-static] Invalid HTML tag name: ${component.value}`);
      }
    } else {
      if (!component || !isValidComponentReference(component.value)) {
        /* unreachable: component comes from a validated AST reference */
        throw new Error(`[styled-static] Invalid component name: ${component?.value}`);
      }
    }

    const componentRef =
      component.kind === "htmlTag" ? safeStringLiteral(component.value) : component.value;
    const classNameValue =
      component.kind === "htmlTag"
        ? cls
        : `[${component.value}.className, ${cls}].filter(Boolean).join(" ")`;

    return `Object.assign((${props}) => { const ${propsDestructure} = ${props}; ${styledSelectionDeclarations} ${userClassNameDeclaration} let ${classNames} = ${cls}; ${variantLogic}return ${createElement}(${componentRef}, {...${remainingProps}, className: ${mergeClassNames}(${classNames}, ${userClassName})}); }, { className: ${classNameValue} })`;
  }

  // cssVariants: returns a function that generates a class string.
  const selectionDeclarations = variantKeys
    .map((key, index) => {
      const keyLiteral = safeStringLiteral(key);
      const localName = variantValues?.[index] ?? createVariantValueName(key, index);
      const defaultValue = variant.defaultVariants?.get(key);
      const fallback = defaultValue === undefined ? "undefined" : safeStringLiteral(defaultValue);
      return `const ${localName} = Object.hasOwn(variants, ${keyLiteral}) && variants[${keyLiteral}] !== undefined ? variants[${keyLiteral}] : ${fallback};`;
    })
    .join(" ");
  return `(variants = {}) => { ${selectionDeclarations} let ${classNames} = ${cls}; ${variantLogic}return ${classNames}; }`;
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Extract a clean, CSS-safe filename from a file path.
 * Used in dev mode to generate readable class names.
 */
export function getFileBaseName(filePath: string): string {
  const base = filePath.split(/[/\\]/).pop() || "unknown";
  return toClassNameSegment(base.replace(/\.[^.]+$/, ""));
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
export function rewriteCssImports(
  code: string,
  cssFileName: string,
  ast: import("estree").Program,
  format: "es" | "cjs" = "es",
): string {
  const importRanges = ast.body
    .filter(
      (node): node is import("estree").ImportDeclaration =>
        node.type === "ImportDeclaration" &&
        node.specifiers.length === 0 &&
        typeof node.source.value === "string" &&
        (node.source.value.startsWith("virtual:styled-static/") ||
          node.source.value === "@alex.radulescu/styled-static"),
    )
    .map((node) => ({
      start: (node as typeof node & { start: number }).start,
      end: (node as typeof node & { end: number }).end,
    }))
    .sort((left, right) => right.start - left.start);

  for (const range of importRanges) {
    code = code.slice(0, range.start) + code.slice(range.end);
  }

  // Remove /* empty css */ comments Vite adds
  code = code.replace(/\/\*\s*empty css\s*\*\/\s*/g, "");

  // Get just the filename for relative import (same directory)
  const baseName = cssFileName.split("/").pop() || cssFileName;

  const cssPath = safeStringLiteral(`./${baseName}`);
  const cssLink = format === "cjs" ? `require(${cssPath});` : `import ${cssPath};`;
  return `${cssLink}\n${code}`;
}
