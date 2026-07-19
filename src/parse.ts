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

export interface TaggedTemplateWithPosition extends ESTree.TaggedTemplateExpression {
  start: number;
  end: number;
  quasi: TemplateLiteralWithPosition;
}

export interface TemplateLiteralWithPosition extends ESTree.TemplateLiteral {
  start: number;
  end: number;
}

export type ComponentReference =
  | { kind: "htmlTag"; value: string }
  | { kind: "component"; value: string };

/** Import tracking for styled-static */
export interface StyledStaticImports {
  styled?: string;
  css?: string;
  createGlobalStyle?: string;
  keyframes?: string;
  styledVariants?: string;
  cssVariants?: string;
  withComponent?: string;
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
  toComponent: ComponentReference;
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
  component: ComponentReference | undefined;
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
// AST Walking
// ============================================================================

/**
 * Walk all variable declarators at the top level of the module,
 * including those inside `export` declarations.
 */
function walkVariableDeclarations(
  ast: ESTree.Program,
  processor: (node: ESTree.VariableDeclaration) => void,
): void {
  for (const node of ast.body) {
    if (node.type === "VariableDeclaration") {
      processor(node);
    }
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration"
    ) {
      processor(node.declaration);
    }
  }
}

/** Read a static object property name, including quoted, numeric, and computed literal keys. */
function getStaticPropertyName(property: ESTree.Property): string | undefined {
  if (property.key.type === "Identifier" && !property.computed) return property.key.name;
  if (property.key.type === "Literal") {
    if (typeof property.key.value === "string" || typeof property.key.value === "number") {
      return String(property.key.value);
    }
  }
  return undefined;
}

function getStaticMemberName(member: ESTree.MemberExpression): string | undefined {
  if (!member.computed && member.property.type === "Identifier") return member.property.name;
  if (
    member.computed &&
    member.property.type === "Literal" &&
    typeof member.property.value === "string"
  ) {
    return member.property.value;
  }
  return undefined;
}

function isStaticComponentExpression(node: ESTree.Node): boolean {
  if (node.type === "Identifier") return true;
  if (node.type !== "MemberExpression" || node.computed || node.property.type !== "Identifier") {
    return false;
  }
  return isStaticComponentExpression(node.object);
}

function getComponentExpression(node: ESTree.Node | undefined, code: string): string | undefined {
  if (!node || !isStaticComponentExpression(node)) return undefined;
  const positionedNode = node as ESTree.Node & { start: number; end: number };
  return code.slice(positionedNode.start, positionedNode.end);
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
  quasi: TemplateLiteralWithPosition,
  interpolationValues?: ReadonlyMap<string, string>,
): string {
  let result = "";

  for (let index = 0; index < quasi.quasis.length; index++) {
    const element = quasi.quasis[index] as ESTree.TemplateElement & {
      start: number;
      end: number;
    };
    result += code.slice(element.start, element.end);

    const expression = quasi.expressions[index];
    if (!expression) continue;

    if (expression.type === "Identifier") {
      const value = interpolationValues?.get(expression.name);
      if (value) {
        result += value;
        continue;
      }
    }

    throw new Error(
      "[styled-static] Runtime CSS interpolation is not supported. Only direct keyframes references such as ${spin} are allowed.",
    );
  }

  return result;
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
  cssImportName: string | undefined,
): string | undefined {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral") {
    if (node.expressions.length > 0) {
      throw new Error(
        "[styled-static] CSS interpolation inside a variants definition is not supported. Move the animation declaration to a styled or css template.",
      );
    }
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
    if (tagged.tag.type === "Identifier" && tagged.tag.name === cssImportName) {
      if (tagged.quasi.expressions.length > 0) {
        throw new Error(
          "[styled-static] CSS interpolation inside a variants definition is not supported. Move the animation declaration to a styled or css template.",
        );
      }
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
export function findStyledStaticImports(ast: ESTree.Program): StyledStaticImports {
  const imports: StyledStaticImports = {};

  for (const node of ast.body) {
    if (node.type === "ImportDeclaration") {
      const source = node.source.value as string;
      const isStyledStaticImport = source === "@alex.radulescu/styled-static";

      if (isStyledStaticImport) {
        for (const spec of node.specifiers) {
          if (spec.type === "ImportSpecifier") {
            const imported = (spec.imported as ESTree.Identifier).name;
            const local = spec.local.name;

            if (imported === "styled") imports.styled = local;
            if (imported === "css") imports.css = local;
            if (imported === "createGlobalStyle") imports.createGlobalStyle = local;
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
  code: string,
): FoundTemplate[] {
  const results: FoundTemplate[] = [];

  walkVariableDeclarations(ast, (node) => {
    for (const decl of node.declarations) {
      if (decl.init?.type === "TaggedTemplateExpression" && decl.id.type === "Identifier") {
        const template = decl.init as TaggedTemplateWithPosition;
        const varName = decl.id.name;
        const found = classifyTemplate(template, imports, varName, code);
        if (found) results.push(found);
      }
    }
  });

  return results;
}

/**
 * Classify a tagged template expression into one of our supported types.
 */
function classifyTemplate(
  node: TaggedTemplateWithPosition,
  imports: StyledStaticImports,
  variableName: string,
  code: string,
): FoundTemplate | null {
  const { tag } = node;

  // styled.element`...`
  if (
    tag.type === "MemberExpression" &&
    tag.object.type === "Identifier" &&
    tag.object.name === imports.styled
  ) {
    const elementTag = getStaticMemberName(tag);
    if (!elementTag) return null;
    return {
      type: "styled",
      node,
      tag: elementTag,
      variableName,
    };
  }

  // styled(Component)`...`
  if (
    tag.type === "CallExpression" &&
    tag.callee.type === "Identifier" &&
    tag.callee.name === imports.styled
  ) {
    const argument = tag.arguments[0];
    if (tag.arguments.length !== 1 || !argument) return null;

    if (argument.type === "Literal" && typeof argument.value === "string") {
      return {
        type: "styled",
        node,
        tag: argument.value,
        variableName,
      };
    }

    const baseComponent = getComponentExpression(argument, code);
    if (!baseComponent) return null;
    return {
      type: "styledExtend",
      node,
      tag: "",
      baseComponent,
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
    tag.arguments.length === 1
  ) {
    if (tag.arguments[0]?.type !== "ObjectExpression") {
      throw new Error(
        "[styled-static] attrs() only accepts a static object literal. Pass dynamic values as regular component props.",
      );
    }
    const elementTag = getStaticMemberName(tag.callee.object);
    if (!elementTag) return null;
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
  imports: StyledStaticImports,
): FoundVariant[] {
  const results: FoundVariant[] = [];

  walkVariableDeclarations(ast, (node) => {
    for (const decl of node.declarations) {
      if (decl.init?.type === "CallExpression" && decl.id.type === "Identifier") {
        const call = decl.init as ESTree.CallExpression & {
          start: number;
          end: number;
        };
        const varName = decl.id.name;
        const found = classifyVariantCall(call, code, imports, varName);
        if (found) results.push(found);
      }
    }
  });

  return results;
}

/**
 * Classify a call expression as styledVariants or cssVariants.
 */
function classifyVariantCall(
  node: ESTree.CallExpression & { start: number; end: number },
  code: string,
  imports: StyledStaticImports,
  variableName: string,
): FoundVariant | null {
  if (node.callee.type !== "Identifier") return null;

  const calleeName = node.callee.name;
  const isStyledVariants = calleeName === imports.styledVariants;
  const isCssVariants = calleeName === imports.cssVariants;

  if (!isStyledVariants && !isCssVariants) return null;

  if (node.arguments.length !== 1 || node.arguments[0]?.type !== "ObjectExpression") {
    throw new Error(
      `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() requires one inline object literal so its CSS can be extracted at build time.`,
    );
  }

  const configObj = node.arguments[0] as ESTree.ObjectExpression;

  let component: ComponentReference | undefined;
  let baseCss: string | undefined;
  const variants = new Map<string, Map<string, string>>();
  let defaultVariants: Map<string, string> | undefined;
  let compoundVariants: Array<{ conditions: Map<string, string>; css: string }> | undefined;

  for (const prop of configObj.properties) {
    if (prop.type !== "Property") {
      throw new Error(
        `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() does not support spread properties. Write the configuration fields inline.`,
      );
    }

    const propName = getStaticPropertyName(prop);
    if (!propName) {
      throw new Error(
        `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() configuration keys must be static property names.`,
      );
    }

    // component: 'button' or component: Button
    if (propName === "component") {
      const componentValue = prop.value;
      if (componentValue.type === "Literal" && typeof componentValue.value === "string") {
        component = { kind: "htmlTag", value: componentValue.value };
      } else if (componentValue.type === "Identifier") {
        component = { kind: "component", value: componentValue.name };
      } else {
        const expression = getComponentExpression(componentValue, code);
        if (expression) component = { kind: "component", value: expression };
      }
      if (!component) {
        throw new Error(
          "[styled-static] styledVariants() component must be an HTML tag string or a static component reference such as Button or UI.Button.",
        );
      }
    }

    // css: `...` or css: css`...`
    if (propName === "css") {
      baseCss = extractCssFromValueNode(prop.value as ESTree.Expression, code, imports.css);
      if (baseCss === undefined) {
        throw new Error(
          `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() css must be a string or a static template literal.`,
        );
      }
    }

    // variants: { color: { primary: `...` }, size: { sm: `...` } }
    if (propName === "variants") {
      const variantsValue = prop.value;
      if (variantsValue.type !== "ObjectExpression") {
        throw new Error(
          `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() variants must be an inline object literal.`,
        );
      }
      for (const variantProp of variantsValue.properties) {
        if (variantProp.type !== "Property" || variantProp.value.type !== "ObjectExpression") {
          throw new Error(
            "[styled-static] Each variant must be an inline object of value-to-CSS mappings.",
          );
        }

        const variantName = getStaticPropertyName(variantProp);
        if (!variantName) {
          throw new Error("[styled-static] Variant names must be static property names.");
        }
        const variantValues = new Map<string, string>();

        for (const valueProp of variantProp.value.properties) {
          if (valueProp.type !== "Property") {
            throw new Error(
              `[styled-static] Variant ${JSON.stringify(variantName)} does not support spread values.`,
            );
          }

          const valueName = getStaticPropertyName(valueProp);
          if (!valueName) {
            throw new Error("[styled-static] Variant values must use static property names.");
          }
          const cssContent = extractCssFromValueNode(
            valueProp.value as ESTree.Expression,
            code,
            imports.css,
          );

          if (cssContent === undefined) {
            throw new Error(
              `[styled-static] Variant ${JSON.stringify(variantName)} value ${JSON.stringify(valueName)} must contain a string or static template literal.`,
            );
          }
          variantValues.set(valueName, cssContent);
        }

        if (variantValues.size === 0) {
          throw new Error(
            `[styled-static] Variant ${JSON.stringify(variantName)} must define at least one value.`,
          );
        }
        variants.set(variantName, variantValues);
      }
    }

    // defaultVariants: { size: 'md', intent: 'primary' }
    if (propName === "defaultVariants") {
      if (prop.value.type !== "ObjectExpression") {
        throw new Error("[styled-static] defaultVariants must be an inline object literal.");
      }
      const defaults = new Map<string, string>();
      for (const defaultProp of prop.value.properties) {
        if (defaultProp.type !== "Property") {
          throw new Error("[styled-static] defaultVariants does not support spread properties.");
        }

        const variantName = getStaticPropertyName(defaultProp);
        if (!variantName) {
          throw new Error("[styled-static] Default variant names must be static property names.");
        }
        if (defaultProp.value.type !== "Literal" || typeof defaultProp.value.value !== "string") {
          throw new Error(
            `[styled-static] Default variant ${JSON.stringify(variantName)} must be a string literal.`,
          );
        }
        defaults.set(variantName, defaultProp.value.value);
      }
      if (defaults.size > 0) {
        defaultVariants = defaults;
      }
    }

    // compoundVariants: [{ size: 'lg', intent: 'danger', css: `...` }]
    if (propName === "compoundVariants") {
      if (prop.value.type !== "ArrayExpression") {
        throw new Error("[styled-static] compoundVariants must be an inline array literal.");
      }
      const compounds: Array<{
        conditions: Map<string, string>;
        css: string;
      }> = [];

      for (const element of prop.value.elements) {
        if (element?.type !== "ObjectExpression") {
          throw new Error(
            "[styled-static] Every compoundVariants entry must be an inline object literal.",
          );
        }

        const conditions = new Map<string, string>();
        let cssContent: string | undefined;

        for (const cvProp of element.properties) {
          if (cvProp.type !== "Property") {
            throw new Error(
              "[styled-static] compoundVariants entries do not support spread properties.",
            );
          }

          const key = getStaticPropertyName(cvProp);
          if (!key) {
            throw new Error("[styled-static] Compound variant keys must be static property names.");
          }

          if (key === "css") {
            cssContent = extractCssFromValueNode(
              cvProp.value as ESTree.Expression,
              code,
              imports.css,
            );
          } else {
            if (cvProp.value.type !== "Literal" || typeof cvProp.value.value !== "string") {
              throw new Error(
                `[styled-static] Compound variant condition ${JSON.stringify(key)} must be a string literal.`,
              );
            }
            conditions.set(key, cvProp.value.value);
          }
        }

        if (cssContent === undefined || conditions.size === 0) {
          throw new Error(
            "[styled-static] Every compoundVariants entry needs CSS and at least one variant condition.",
          );
        }
        compounds.push({ conditions, css: cssContent });
      }

      if (compounds.length > 0) {
        compoundVariants = compounds;
      }
    }
  }

  if (isStyledVariants && !component) {
    throw new Error("[styled-static] styledVariants() requires a component field.");
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
  imports: StyledStaticImports,
  code: string,
): FoundWithComponent[] {
  const results: FoundWithComponent[] = [];

  walkVariableDeclarations(ast, (node) => {
    for (const decl of node.declarations) {
      if (decl.init?.type === "CallExpression" && decl.id.type === "Identifier") {
        const call = decl.init as ESTree.CallExpression & {
          start: number;
          end: number;
        };
        const varName = decl.id.name;

        if (call.callee.type === "Identifier" && call.callee.name === imports.withComponent) {
          if (call.arguments.length !== 2) {
            throw new Error(
              "[styled-static] withComponent() requires exactly two arguments: the target and the styled source component.",
            );
          }
          const toArg = call.arguments[0];
          const fromArg = call.arguments[1];

          let toComponent: ComponentReference | undefined;
          let fromComponent: string | undefined;

          if (toArg?.type === "Literal" && typeof toArg.value === "string") {
            toComponent = { kind: "htmlTag", value: toArg.value };
          } else if (toArg?.type === "Identifier") {
            toComponent = { kind: "component", value: toArg.name };
          } else {
            const expression = getComponentExpression(toArg, code);
            if (expression) toComponent = { kind: "component", value: expression };
          }

          fromComponent = getComponentExpression(fromArg, code);

          if (!toComponent || !fromComponent) {
            throw new Error(
              "[styled-static] withComponent() arguments must be an HTML tag string or static references such as Button or UI.Button.",
            );
          }
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
  });

  return results;
}
