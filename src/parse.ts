/**
 * AST parsing and classification for styled-static.
 *
 * Handles finding imports, tagged templates, variant calls, and
 * withComponent calls in the AST. All functions are pure and
 * operate on the ESTree AST representation.
 */
import type * as ESTree from "estree";

// ============================================================================
// Types
// ============================================================================

export interface TaggedTemplateWithPosition
  extends ESTree.TaggedTemplateExpression {
  start: number;
  end: number;
  quasi: TemplateLiteralWithPosition;
}

export interface TemplateLiteralWithPosition extends ESTree.TemplateLiteral {
  start: number;
  end: number;
}

/** Import tracking for styled-static */
export interface StyledStaticImports {
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
export type TemplateType =
  | "styled"
  | "styledExtend"
  | "styledAttrs"
  | "css"
  | "createGlobalStyle"
  | "keyframes";

/** Types of variant calls we can transform */
export type VariantType = "styledVariants" | "cssVariants";

/** Information about a found withComponent call */
export interface FoundWithComponent {
  start: number;
  end: number;
  toComponent: string;
  fromComponent: string;
  variableName?: string;
}

/** Information about a found template */
export interface FoundTemplate {
  type: TemplateType;
  node: TaggedTemplateWithPosition;
  tag: string;
  baseComponent?: string;
  variableName?: string;
  attrsArg?: string;
}

/** Information about a found variant call */
export interface FoundVariant {
  type: VariantType;
  start: number;
  end: number;
  component: string | undefined;
  baseCss: string | undefined;
  variants: Map<string, Map<string, string>>;
  variableName: string;
  defaultVariants?: Map<string, string>;
  compoundVariants?: Array<{
    conditions: Map<string, string>;
    css: string;
  }>;
}

// ============================================================================
// CSS Extraction
// ============================================================================

/**
 * Extract raw CSS content from a template literal.
 * Handles the content between the backticks.
 */
export function extractTemplateContent(
  code: string,
  quasi: TemplateLiteralWithPosition
): string {
  return code.slice(quasi.start + 1, quasi.end - 1);
}

/**
 * Extract CSS string from an AST node that may be:
 * - A string literal: `"padding: 1rem;"`
 * - A plain template literal: `` `padding: 1rem;` ``
 * - A tagged css template: `` css`padding: 1rem;` ``
 *
 * This consolidates the repeated CSS extraction pattern used in variant parsing.
 */
export function extractCssFromValueNode(
  node: ESTree.Expression,
  code: string,
  cssImportName: string | undefined
): string | undefined {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral") {
    const tpl = node as ESTree.TemplateLiteral & {
      start: number;
      end: number;
    };
    return code.slice(tpl.start + 1, tpl.end - 1);
  }
  if (node.type === "TaggedTemplateExpression") {
    const tagged = node as ESTree.TaggedTemplateExpression & {
      quasi: ESTree.TemplateLiteral & { start: number; end: number };
    };
    if (
      tagged.tag.type === "Identifier" &&
      tagged.tag.name === cssImportName
    ) {
      return code.slice(tagged.quasi.start + 1, tagged.quasi.end - 1);
    }
  }
  return undefined;
}

// ============================================================================
// Import Detection
// ============================================================================

/**
 * Find all imports from '@alex.radulescu/styled-static' and return their local names.
 * Handles aliased imports like `import { styled as s } from '@alex.radulescu/styled-static'`
 */
export function findStyledStaticImports(
  ast: ESTree.Program
): StyledStaticImports {
  const imports: StyledStaticImports = {};

  for (const node of ast.body) {
    if (node.type === "ImportDeclaration") {
      const source = node.source.value as string;
      const isStyledStaticImport =
        source === "@alex.radulescu/styled-static" ||
        source === "./index" ||
        source === "../index";

      if (isStyledStaticImport) {
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

// ============================================================================
// Template Detection
// ============================================================================

/**
 * Find all tagged template literals that use styled-static imports.
 * Walks the AST to find variable declarations with our tagged templates.
 */
export function findTaggedTemplates(
  ast: ESTree.Program,
  imports: StyledStaticImports,
  code: string
): FoundTemplate[] {
  const results: FoundTemplate[] = [];

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
    if (node.type === "VariableDeclaration") {
      processVariableDeclaration(node);
    }

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
// Variant Detection
// ============================================================================

/**
 * Find all styledVariants and cssVariants calls in the AST.
 */
export function findVariantCalls(
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
    if (node.type === "VariableDeclaration") {
      processVariableDeclaration(node);
    }

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
  let defaultVariants: Map<string, string> | undefined;
  let compoundVariants:
    | Array<{ conditions: Map<string, string>; css: string }>
    | undefined;

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
      baseCss = extractCssFromValueNode(prop.value as ESTree.Expression, code, imports.css);
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
          const cssContent = extractCssFromValueNode(
            valueProp.value as ESTree.Expression,
            code,
            imports.css
          );

          if (cssContent) {
            variantValues.set(valueName, cssContent);
          }
        }

        if (variantValues.size > 0) {
          variants.set(variantName, variantValues);
        }
      }
    }

    // defaultVariants: { size: 'md', intent: 'primary' }
    if (
      propName === "defaultVariants" &&
      prop.value.type === "ObjectExpression"
    ) {
      const defaults = new Map<string, string>();
      for (const defaultProp of prop.value.properties) {
        if (
          defaultProp.type !== "Property" ||
          defaultProp.key.type !== "Identifier"
        )
          continue;

        const variantName = defaultProp.key.name;
        let defaultValue: string | undefined;

        if (
          defaultProp.value.type === "Literal" &&
          typeof defaultProp.value.value === "string"
        ) {
          defaultValue = defaultProp.value.value;
        }

        if (defaultValue) {
          defaults.set(variantName, defaultValue);
        }
      }
      if (defaults.size > 0) {
        defaultVariants = defaults;
      }
    }

    // compoundVariants: [{ size: 'lg', intent: 'danger', css: `...` }]
    if (
      propName === "compoundVariants" &&
      prop.value.type === "ArrayExpression"
    ) {
      const compounds: Array<{
        conditions: Map<string, string>;
        css: string;
      }> = [];

      for (const element of prop.value.elements) {
        if (element?.type !== "ObjectExpression") continue;

        const conditions = new Map<string, string>();
        let cssContent: string | undefined;

        for (const cvProp of element.properties) {
          if (cvProp.type !== "Property" || cvProp.key.type !== "Identifier")
            continue;

          const key = cvProp.key.name;

          if (key === "css") {
            cssContent = extractCssFromValueNode(
              cvProp.value as ESTree.Expression,
              code,
              imports.css
            );
          } else {
            if (
              cvProp.value.type === "Literal" &&
              typeof cvProp.value.value === "string"
            ) {
              conditions.set(key, cvProp.value.value);
            }
          }
        }

        if (cssContent && conditions.size > 0) {
          compounds.push({ conditions, css: cssContent });
        }
      }

      if (compounds.length > 0) {
        compoundVariants = compounds;
      }
    }
  }

  const result: FoundVariant = {
    type: isStyledVariants ? "styledVariants" : "cssVariants",
    start: node.start,
    end: node.end,
    component,
    baseCss,
    variants,
    variableName,
  };

  if (defaultVariants) {
    result.defaultVariants = defaultVariants;
  }
  if (compoundVariants) {
    result.compoundVariants = compoundVariants;
  }

  return result;
}

// ============================================================================
// withComponent Detection
// ============================================================================

/**
 * Find all withComponent(To, From) calls in the AST.
 */
export function findWithComponentCalls(
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

        if (
          call.callee.type === "Identifier" &&
          call.callee.name === imports.withComponent &&
          call.arguments.length === 2
        ) {
          const toArg = call.arguments[0];
          const fromArg = call.arguments[1];

          let toComponent: string | undefined;
          let fromComponent: string | undefined;

          if (toArg?.type === "Literal" && typeof toArg.value === "string") {
            toComponent = toArg.value;
          } else if (toArg?.type === "Identifier") {
            toComponent = toArg.name;
          }

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
    if (node.type === "VariableDeclaration") {
      processVariableDeclaration(node);
    }

    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration"
    ) {
      processVariableDeclaration(node.declaration);
    }
  }

  return results;
}
