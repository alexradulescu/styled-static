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
  globalCss?: string;
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
  | "globalCss"
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

export interface ModuleAnalysis {
  templates: FoundTemplate[];
  variants: FoundVariant[];
  componentConversions: FoundWithComponent[];
}

// ============================================================================
// AST Walking
// ============================================================================

/** Configuration keys use one spelling: ordinary JavaScript identifiers. */
function getConfigPropertyName(property: ESTree.Property): string | undefined {
  if (property.kind !== "init" || property.method) return undefined;
  if (
    property.key.type === "Identifier" &&
    !property.computed &&
    property.key.name !== "__proto__"
  ) {
    return property.key.name;
  }
  return undefined;
}

/** Static attrs also need standard hyphenated HTML and ARIA attribute names. */
function getAttrPropertyName(property: ESTree.Property): string | undefined {
  const identifier = getConfigPropertyName(property);
  if (identifier) return identifier;
  if (
    property.kind === "init" &&
    !property.method &&
    !property.computed &&
    property.key.type === "Literal" &&
    typeof property.key.value === "string" &&
    /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/.test(property.key.value) &&
    property.key.value !== "__proto__"
  ) {
    return property.key.value;
  }
  return undefined;
}

function validateStaticAttrs(object: ESTree.ObjectExpression): void {
  const names = new Set<string>();
  for (const item of object.properties) {
    const value = item.type === "Property" ? item.value : undefined;
    const isSupportedLiteral =
      (value?.type === "Literal" &&
        (value.value === null || ["string", "number", "boolean"].includes(typeof value.value))) ||
      (value?.type === "UnaryExpression" &&
        ["+", "-"].includes(value.operator) &&
        value.argument.type === "Literal" &&
        typeof value.argument.value === "number");
    const name = item.type === "Property" ? getAttrPropertyName(item) : undefined;
    if (item.type !== "Property" || !name || !isSupportedLiteral) {
      throw new Error(
        "[styled-static] attrs() accepts only explicit string, number, boolean, or null literal properties. Pass dynamic values as component props.",
      );
    }
    if (names.has(name)) {
      throw new Error(`[styled-static] attrs() property ${JSON.stringify(name)} is duplicated.`);
    }
    names.add(name);
  }
}

function getStaticMemberName(member: ESTree.MemberExpression): string | undefined {
  if (!member.computed && member.property.type === "Identifier") return member.property.name;
  return undefined;
}

function getComponentExpression(node: ESTree.Node | undefined, code: string): string | undefined {
  if (!node || node.type !== "Identifier") return undefined;
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
 * Extract CSS from the only accepted variant spelling: `css` tagged templates.
 */
export function extractCssFromValueNode(
  node: ESTree.Expression,
  code: string,
  cssImportName: string | undefined,
  keyframeNames?: ReadonlyMap<string, string>,
): string | undefined {
  if (node.type === "TaggedTemplateExpression") {
    const tagged = node as ESTree.TaggedTemplateExpression & {
      quasi: ESTree.TemplateLiteral & { start: number; end: number };
    };
    if (tagged.tag.type === "Identifier" && tagged.tag.name === cssImportName) {
      return extractTemplateContent(code, tagged.quasi, keyframeNames);
    }
  }
  return undefined;
}

// ============================================================================
// Import Detection
// ============================================================================

function recordStyledStaticImport(
  node: ESTree.ImportDeclaration,
  imports: StyledStaticImports,
): void {
  if (node.source.value !== "@alex.radulescu/styled-static") return;
  for (const specifier of node.specifiers) {
    if (specifier.type !== "ImportSpecifier") continue;
    const imported = (specifier.imported as ESTree.Identifier).name;
    const local = specifier.local.name;
    if (imported in imports) {
      throw new Error(
        `[styled-static] Import ${JSON.stringify(imported)} has more than one local alias. Import each styled-static API once per module.`,
      );
    }
    if (
      [
        "styled",
        "css",
        "globalCss",
        "keyframes",
        "styledVariants",
        "cssVariants",
        "withComponent",
      ].includes(imported)
    ) {
      imports[imported as keyof StyledStaticImports] = local;
    }
  }
}

/** Validate and lower every extracted definition in one top-level declaration pass. */
export function analyzeModule(
  ast: ESTree.Program,
  code: string,
  keyframeNameFor: (localName: string) => string,
): ModuleAnalysis {
  const imports: StyledStaticImports = {};
  const sourceStatements: ESTree.Program["body"] = [];
  for (const statement of ast.body) {
    if (statement.type === "ImportDeclaration") {
      recordStyledStaticImport(statement, imports);
    } else {
      sourceStatements.push(statement);
    }
  }

  const templates: FoundTemplate[] = [];
  const pendingVariants: Array<{
    call: ESTree.CallExpression & { start: number; end: number };
    variableName: string;
  }> = [];
  const componentConversions: FoundWithComponent[] = [];
  const allowed = new Set<ESTree.Node>();

  for (const statement of sourceStatements) {
    const declaration =
      statement.type === "VariableDeclaration"
        ? statement
        : statement.type === "ExportNamedDeclaration" &&
            statement.declaration?.type === "VariableDeclaration"
          ? statement.declaration
          : undefined;

    if (declaration) {
      assertSupportedDeclaration(declaration, imports);
      for (const item of declaration.declarations) {
        if (!item.init || item.id.type !== "Identifier") continue;
        const variableName = item.id.name;
        if (!isPotentialDefinition(item.init, imports)) continue;
        if (isGlobalCssTemplate(item.init, imports)) {
          throw new Error(
            "[styled-static] globalCss must be a top-level expression. Do not assign its void result.",
          );
        }

        allowed.add(item.init);
        if (item.init.type === "TaggedTemplateExpression") {
          const template = classifyTemplate(
            item.init as TaggedTemplateWithPosition,
            imports,
            variableName,
            code,
          );
          if (!template) {
            throw new Error(
              "[styled-static] Unsupported styled template syntax. Use styled.element, styled(LocalComponent), or styled.element.attrs({...}).",
            );
          }
          templates.push(template);
          continue;
        }
        if (item.init.type !== "CallExpression") continue;

        const call = item.init as ESTree.CallExpression & { start: number; end: number };
        if (
          call.callee.type === "Identifier" &&
          [imports.styledVariants, imports.cssVariants].includes(call.callee.name)
        ) {
          pendingVariants.push({ call, variableName });
          walkNodes(call, (child) => {
            if (
              child.type === "TaggedTemplateExpression" &&
              child.tag.type === "Identifier" &&
              child.tag.name === imports.css
            ) {
              allowed.add(child);
            }
          });
        }
        const conversion = classifyWithComponentCall(call, imports, code, variableName);
        if (conversion) componentConversions.push(conversion);
      }
    }

    if (
      statement.type === "ExpressionStatement" &&
      isGlobalCssTemplate(statement.expression, imports)
    ) {
      allowed.add(statement.expression);
      templates.push({
        type: "globalCss",
        node: statement.expression as TaggedTemplateWithPosition,
        tag: "",
      });
    }
  }

  const keyframeNames = new Map(
    templates.flatMap((template) =>
      template.type === "keyframes" && template.variableName
        ? [[template.variableName, keyframeNameFor(template.variableName)] as const]
        : [],
    ),
  );
  const variants = pendingVariants.flatMap(({ call, variableName }) => {
    const variant = classifyVariantCall(call, code, imports, variableName, keyframeNames);
    return variant ? [variant] : [];
  });

  walkNodes(ast, (node) => {
    if (isPotentialDefinition(node, imports) && !allowed.has(node)) {
      throw new Error(
        "[styled-static] Extracted definitions must be one named top-level const statement. globalCss may be a top-level expression.",
      );
    }
  });

  return { templates, variants, componentConversions };
}

function isGlobalCssTemplate(node: ESTree.Node, imports: StyledStaticImports): boolean {
  return (
    node.type === "TaggedTemplateExpression" &&
    node.tag.type === "Identifier" &&
    node.tag.name === imports.globalCss
  );
}

function isPotentialDefinition(node: ESTree.Node, imports: StyledStaticImports): boolean {
  if (node.type === "TaggedTemplateExpression") {
    const { tag } = node;
    if (tag.type === "Identifier") {
      return [imports.css, imports.keyframes, imports.globalCss].includes(tag.name);
    }
    if (tag.type === "MemberExpression") {
      if (tag.object.type === "Identifier" && tag.object.name === imports.styled) return true;
      return (
        tag.object.type === "CallExpression" &&
        tag.object.callee.type === "Identifier" &&
        tag.object.callee.name === imports.styled
      );
    }
    if (tag.type !== "CallExpression") return false;
    if (tag.callee.type === "Identifier") return tag.callee.name === imports.styled;
    return (
      tag.callee.type === "MemberExpression" &&
      tag.callee.object.type === "MemberExpression" &&
      tag.callee.object.object.type === "Identifier" &&
      tag.callee.object.object.name === imports.styled
    );
  }
  return (
    node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    [imports.styledVariants, imports.cssVariants, imports.withComponent].includes(node.callee.name)
  );
}

function walkNodes(node: ESTree.Node, visit: (node: ESTree.Node) => void): void {
  visit(node);
  for (const value of Object.values(node)) {
    if (!value || typeof value !== "object") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && typeof item.type === "string") {
          walkNodes(item as ESTree.Node, visit);
        }
      }
    } else if (typeof (value as { type?: unknown }).type === "string") {
      walkNodes(value as ESTree.Node, visit);
    }
  }
}

// ============================================================================
// Template Detection
// ============================================================================

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
    if (tag.computed) {
      throw new Error("[styled-static] Use styled.div instead of bracket notation.");
    }
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
      throw new Error('[styled-static] Use styled.div instead of styled("div").');
    }

    const baseComponent = getComponentExpression(argument, code);
    if (!baseComponent) {
      throw new Error(
        "[styled-static] styled() requires a local identifier. Assign member expressions such as UI.Button to a local const first.",
      );
    }
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
    validateStaticAttrs(tag.arguments[0]);
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
 * Classify a call expression as styledVariants or cssVariants.
 */
function classifyVariantCall(
  node: ESTree.CallExpression & { start: number; end: number },
  code: string,
  imports: StyledStaticImports,
  variableName: string,
  keyframeNames?: ReadonlyMap<string, string>,
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
  const allowedFields = new Set([
    ...(isStyledVariants ? ["component"] : []),
    "css",
    "variants",
    "defaultVariants",
    "compoundVariants",
  ]);

  let component: ComponentReference | undefined;
  let baseCss: string | undefined;
  const variants = new Map<string, Map<string, string>>();
  let defaultVariants: Map<string, string> | undefined;
  let compoundVariants: Array<{ conditions: Map<string, string>; css: string }> | undefined;
  const seenFields = new Set<string>();

  for (const prop of configObj.properties) {
    if (prop.type !== "Property") {
      throw new Error(
        `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() does not support spread properties. Write the configuration fields inline.`,
      );
    }

    const propName = getConfigPropertyName(prop);
    if (!propName) {
      throw new Error(
        `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() configuration keys must be static property names.`,
      );
    }
    if (!allowedFields.has(propName)) {
      throw new Error(
        `[styled-static] Unknown ${isStyledVariants ? "styledVariants" : "cssVariants"}() field ${JSON.stringify(propName)}.`,
      );
    }
    if (seenFields.has(propName)) {
      throw new Error(
        `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() field ${JSON.stringify(propName)} is duplicated.`,
      );
    }
    seenFields.add(propName);

    // component: 'button' or component: Button
    if (propName === "component") {
      const componentValue = prop.value;
      if (componentValue.type === "Literal" && typeof componentValue.value === "string") {
        component = { kind: "htmlTag", value: componentValue.value };
      } else if (componentValue.type === "Identifier") {
        component = { kind: "component", value: componentValue.name };
      } else {
      }
      if (!component) {
        throw new Error(
          "[styled-static] styledVariants() component must be an HTML tag string or local identifier. Assign member expressions such as UI.Button to a local const first.",
        );
      }
    }

    // css: `...` or css: css`...`
    if (propName === "css") {
      baseCss = extractCssFromValueNode(
        prop.value as ESTree.Expression,
        code,
        imports.css,
        keyframeNames,
      );
      if (baseCss === undefined) {
        throw new Error(
          `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() css must use the css tagged template: css\`...\`.`,
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

        const variantName = getConfigPropertyName(variantProp);
        if (!variantName) {
          throw new Error("[styled-static] Variant names must be static property names.");
        }
        if (variantName === "css") {
          throw new Error(
            '[styled-static] Variant name "css" is reserved for compound variant styles.',
          );
        }
        if (isStyledVariants && ["className", "children", "ref", "key"].includes(variantName)) {
          throw new Error(
            `[styled-static] styledVariants() cannot use reserved React prop ${JSON.stringify(variantName)} as a variant name.`,
          );
        }
        if (variants.has(variantName)) {
          throw new Error(`[styled-static] Variant ${JSON.stringify(variantName)} is duplicated.`);
        }
        const variantValues = new Map<string, string>();

        for (const valueProp of variantProp.value.properties) {
          if (valueProp.type !== "Property") {
            throw new Error(
              `[styled-static] Variant ${JSON.stringify(variantName)} does not support spread values.`,
            );
          }

          const valueName = getConfigPropertyName(valueProp);
          if (!valueName) {
            throw new Error("[styled-static] Variant values must use static property names.");
          }
          if (variantValues.has(valueName)) {
            throw new Error(
              `[styled-static] Variant ${JSON.stringify(variantName)} value ${JSON.stringify(valueName)} is duplicated.`,
            );
          }
          const cssContent = extractCssFromValueNode(
            valueProp.value as ESTree.Expression,
            code,
            imports.css,
            keyframeNames,
          );

          if (cssContent === undefined) {
            throw new Error(
              `[styled-static] Variant ${JSON.stringify(variantName)} value ${JSON.stringify(valueName)} must use css\`...\`.`,
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

        const variantName = getConfigPropertyName(defaultProp);
        if (!variantName) {
          throw new Error("[styled-static] Default variant names must be static property names.");
        }
        if (defaults.has(variantName)) {
          throw new Error(
            `[styled-static] Default variant ${JSON.stringify(variantName)} is duplicated.`,
          );
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

          const key = getConfigPropertyName(cvProp);
          if (!key) {
            throw new Error("[styled-static] Compound variant keys must be static property names.");
          }
          if (key === "css" ? cssContent !== undefined : conditions.has(key)) {
            throw new Error(
              `[styled-static] Compound variant key ${JSON.stringify(key)} is duplicated.`,
            );
          }

          if (key === "css") {
            cssContent = extractCssFromValueNode(
              cvProp.value as ESTree.Expression,
              code,
              imports.css,
              keyframeNames,
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
  if (!seenFields.has("variants")) {
    throw new Error(
      `[styled-static] ${isStyledVariants ? "styledVariants" : "cssVariants"}() requires a variants field.`,
    );
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

function classifyWithComponentCall(
  call: ESTree.CallExpression & { start: number; end: number },
  imports: StyledStaticImports,
  code: string,
  variableName: string,
): FoundWithComponent | undefined {
  if (call.callee.type !== "Identifier" || call.callee.name !== imports.withComponent) return;
  if (call.arguments.length !== 2) {
    throw new Error(
      "[styled-static] withComponent() requires exactly two arguments: the target and the styled source component.",
    );
  }

  const toArg = call.arguments[0];
  const toComponent: ComponentReference | undefined =
    toArg?.type === "Literal" && typeof toArg.value === "string"
      ? { kind: "htmlTag", value: toArg.value }
      : toArg?.type === "Identifier"
        ? { kind: "component", value: toArg.name }
        : undefined;
  const fromComponent = getComponentExpression(call.arguments[1], code);
  if (!toComponent || !fromComponent) {
    throw new Error(
      "[styled-static] withComponent() arguments must be an HTML tag string or local identifiers. Assign member expressions to local consts first.",
    );
  }

  return { start: call.start, end: call.end, toComponent, fromComponent, variableName };
}

function isExtractedDefinition(
  init: ESTree.Expression | null | undefined,
  imports: StyledStaticImports,
): boolean {
  return !!init && isPotentialDefinition(init, imports);
}

function assertSupportedDeclaration(
  declaration: ESTree.VariableDeclaration,
  imports: StyledStaticImports,
): void {
  if (!declaration.declarations.some((item) => isExtractedDefinition(item.init, imports))) return;
  if (declaration.kind !== "const") {
    throw new Error(
      "[styled-static] Extracted definitions must use a top-level const declaration.",
    );
  }
  if (declaration.declarations.length !== 1) {
    throw new Error("[styled-static] Put each extracted definition in its own const statement.");
  }
  if (declaration.declarations[0]?.id.type !== "Identifier") {
    throw new Error("[styled-static] Extracted definitions require a simple local name.");
  }
}
