/**
 * Code generation for styled-static.
 *
 * Generates replacement JavaScript code for styled templates,
 * variant calls, and withComponent calls. All functions are pure
 * and produce string output for AST replacement.
 */
import MagicString from "magic-string";
import type { FoundTemplate, FoundVariant, FoundWithComponent } from "./parse.js";

// ============================================================================
// Security Helpers
// ============================================================================

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

function indent(code: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return code
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function variantSelectionDeclaration(
  source: string,
  key: string,
  localName: string,
  defaultValue: string | undefined,
): string {
  const keyLiteral = safeStringLiteral(key);
  const fallback = defaultValue === undefined ? "undefined" : safeStringLiteral(defaultValue);
  return `const ${localName} = Object.hasOwn(${source}, ${keyLiteral}) && ${source}[${keyLiteral}] !== undefined ? ${source}[${keyLiteral}] : ${fallback};`;
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
      if (!template.baseComponent || !isValidIdentifier(template.baseComponent)) {
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
  if (!isValidIdentifier(conversion.fromComponent)) {
    /* unreachable: component references are validated during parsing */
    throw new Error(`[styled-static] Invalid source component: ${conversion.fromComponent}`);
  }

  const target =
    conversion.toComponent.kind === "htmlTag"
      ? safeStringLiteral(conversion.toComponent.value)
      : conversion.toComponent.value;
  if (conversion.toComponent.kind === "component" && !isValidIdentifier(target)) {
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
  const styledSelectionDeclarations = variantKeys.map((key, index) => {
    const localName = variantValues?.[index] ?? createVariantValueName(key, index);
    return variantSelectionDeclaration(props, key, localName, variant.defaultVariants?.get(key));
  });
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
          return `${valueIndex === 0 ? "if" : "else if"} (${keyRef} === ${safeStringLiteral(value)}) {\n  ${classNames} += ${safeStringLiteral(` ${modifierClass}`)};\n}`;
        })
        .join(" ");
      if (valueChecks) {
        variantChecks.push(valueChecks);
      }
    }
  }

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
      if (!component || !isValidIdentifier(component.value)) {
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

    const body = [
      `const ${propsDestructure} = ${props};`,
      ...styledSelectionDeclarations,
      userClassNameDeclaration,
      `let ${classNames} = ${cls};`,
      ...variantChecks,
      `return ${createElement}(${componentRef}, {...${remainingProps}, className: ${mergeClassNames}(${classNames}, ${userClassName})});`,
    ].join("\n");
    return `Object.assign(
  (${props}) => {
${indent(body, 4)}
  },
  { className: ${classNameValue} },
)`;
  }

  // cssVariants: returns a function that generates a class string.
  const selectionDeclarations = variantKeys.map((key, index) => {
    const localName = variantValues?.[index] ?? createVariantValueName(key, index);
    return variantSelectionDeclaration(
      "variants",
      key,
      localName,
      variant.defaultVariants?.get(key),
    );
  });
  const body = [
    ...selectionDeclarations,
    `let ${classNames} = ${cls};`,
    ...variantChecks,
    `return ${classNames};`,
  ].join("\n");
  return `(variants = {}) => {
${indent(body, 2)}
}`;
}

// ============================================================================
// Utility
// ============================================================================

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
): { code: string; map: ReturnType<MagicString["generateMap"]> } {
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
    }));

  const output = new MagicString(code);
  for (const range of importRanges) {
    output.remove(range.start, range.end);
  }

  // Get just the filename for relative import (same directory)
  const baseName = cssFileName.split("/").pop() || cssFileName;

  const cssPath = safeStringLiteral(`./${baseName}`);
  const cssLink = format === "cjs" ? `require(${cssPath});` : `import ${cssPath};`;
  output.prepend(`${cssLink}\n`);
  return { code: output.toString(), map: output.generateMap({ hires: true }) };
}
