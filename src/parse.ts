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
  type: "withComponent";
  start: number;
  end: number;
  toComponent: ComponentReference;
  fromComponent: string;
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

export type FoundDefinition = FoundTemplate | FoundVariant | FoundWithComponent;

export interface ModuleAnalysis {
  definitions: FoundDefinition[];
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

function getLocalName(node: ESTree.Node | undefined): string | undefined {
  return node?.type === "Identifier" ? node.name : undefined;
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

  interface PendingVariant {
    type: "pendingVariant";
    call: ESTree.CallExpression & { start: number; end: number };
    variableName: string;
  }
  const pendingDefinitions: Array<FoundTemplate | PendingVariant | FoundWithComponent> = [];
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
          pendingDefinitions.push(template);
          continue;
        }
        if (item.init.type !== "CallExpression") continue;

        const call = item.init as ESTree.CallExpression & { start: number; end: number };
        if (
          call.callee.type === "Identifier" &&
          [imports.styledVariants, imports.cssVariants].includes(call.callee.name)
        ) {
          pendingDefinitions.push({ type: "pendingVariant", call, variableName });
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
        const conversion = classifyWithComponentCall(call, imports);
        if (conversion) pendingDefinitions.push(conversion);
      }
    }

    if (
      statement.type === "ExpressionStatement" &&
      isGlobalCssTemplate(statement.expression, imports)
    ) {
      allowed.add(statement.expression);
      pendingDefinitions.push({
        type: "globalCss",
        node: statement.expression as TaggedTemplateWithPosition,
        tag: "",
      });
    }
  }

  const keyframeNames = new Map(
    pendingDefinitions.flatMap((definition) =>
      definition.type === "keyframes" && definition.variableName
        ? [[definition.variableName, keyframeNameFor(definition.variableName)] as const]
        : [],
    ),
  );
  const definitions: FoundDefinition[] = [];
  for (const definition of pendingDefinitions) {
    if (definition.type !== "pendingVariant") {
      definitions.push(definition);
      continue;
    }
    const variant = classifyVariantCall(
      definition.call,
      code,
      imports,
      definition.variableName,
      keyframeNames,
    );
    if (variant) definitions.push(variant);
  }

  walkNodes(ast, (node) => {
    if (isPotentialDefinition(node, imports) && !allowed.has(node)) {
      throw new Error(
        "[styled-static] Extracted definitions must be one named top-level const statement. globalCss may be a top-level expression.",
      );
    }
  });

  return { definitions };
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

    const baseComponent = getLocalName(argument);
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

interface CssExtractionContext {
  code: string;
  cssImportName: string | undefined;
  keyframeNames: ReadonlyMap<string, string> | undefined;
}

function parseVariantComponent(value: ESTree.Expression | ESTree.Pattern): ComponentReference {
  if (value.type === "Literal" && typeof value.value === "string") {
    return { kind: "htmlTag", value: value.value };
  }
  if (value.type === "Identifier") {
    return { kind: "component", value: value.name };
  }
  throw new Error(
    "[styled-static] styledVariants() component must be an HTML tag string or local identifier. Assign member expressions such as UI.Button to a local const first.",
  );
}

function parseVariants(
  value: ESTree.Expression | ESTree.Pattern,
  context: CssExtractionContext,
  isStyledVariants: boolean,
  apiName: string,
): Map<string, Map<string, string>> {
  if (value.type !== "ObjectExpression") {
    throw new Error(`[styled-static] ${apiName} variants must be an inline object literal.`);
  }

  const variants = new Map<string, Map<string, string>>();
  for (const variantProperty of value.properties) {
    if (variantProperty.type !== "Property" || variantProperty.value.type !== "ObjectExpression") {
      throw new Error(
        "[styled-static] Each variant must be an inline object of value-to-CSS mappings.",
      );
    }

    const variantName = getConfigPropertyName(variantProperty);
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
    for (const valueProperty of variantProperty.value.properties) {
      if (valueProperty.type !== "Property") {
        throw new Error(
          `[styled-static] Variant ${JSON.stringify(variantName)} does not support spread values.`,
        );
      }

      const valueName = getConfigPropertyName(valueProperty);
      if (!valueName) {
        throw new Error("[styled-static] Variant values must use static property names.");
      }
      if (variantValues.has(valueName)) {
        throw new Error(
          `[styled-static] Variant ${JSON.stringify(variantName)} value ${JSON.stringify(valueName)} is duplicated.`,
        );
      }

      const cssContent = extractCssFromValueNode(
        valueProperty.value as ESTree.Expression,
        context.code,
        context.cssImportName,
        context.keyframeNames,
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
  return variants;
}

function parseDefaultVariants(
  value: ESTree.Expression | ESTree.Pattern,
): Map<string, string> | undefined {
  if (value.type !== "ObjectExpression") {
    throw new Error("[styled-static] defaultVariants must be an inline object literal.");
  }

  const defaults = new Map<string, string>();
  for (const property of value.properties) {
    if (property.type !== "Property") {
      throw new Error("[styled-static] defaultVariants does not support spread properties.");
    }

    const variantName = getConfigPropertyName(property);
    if (!variantName) {
      throw new Error("[styled-static] Default variant names must be static property names.");
    }
    if (defaults.has(variantName)) {
      throw new Error(
        `[styled-static] Default variant ${JSON.stringify(variantName)} is duplicated.`,
      );
    }
    if (property.value.type !== "Literal" || typeof property.value.value !== "string") {
      throw new Error(
        `[styled-static] Default variant ${JSON.stringify(variantName)} must be a string literal.`,
      );
    }
    defaults.set(variantName, property.value.value);
  }
  return defaults.size > 0 ? defaults : undefined;
}

function parseCompoundVariants(
  value: ESTree.Expression | ESTree.Pattern,
  context: CssExtractionContext,
): FoundVariant["compoundVariants"] {
  if (value.type !== "ArrayExpression") {
    throw new Error("[styled-static] compoundVariants must be an inline array literal.");
  }

  const compounds: NonNullable<FoundVariant["compoundVariants"]> = [];
  for (const element of value.elements) {
    if (element?.type !== "ObjectExpression") {
      throw new Error(
        "[styled-static] Every compoundVariants entry must be an inline object literal.",
      );
    }

    const conditions = new Map<string, string>();
    let cssContent: string | undefined;
    for (const property of element.properties) {
      if (property.type !== "Property") {
        throw new Error(
          "[styled-static] compoundVariants entries do not support spread properties.",
        );
      }

      const key = getConfigPropertyName(property);
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
          property.value as ESTree.Expression,
          context.code,
          context.cssImportName,
          context.keyframeNames,
        );
        continue;
      }
      if (property.value.type !== "Literal" || typeof property.value.value !== "string") {
        throw new Error(
          `[styled-static] Compound variant condition ${JSON.stringify(key)} must be a string literal.`,
        );
      }
      conditions.set(key, property.value.value);
    }

    if (cssContent === undefined || conditions.size === 0) {
      throw new Error(
        "[styled-static] Every compoundVariants entry needs CSS and at least one variant condition.",
      );
    }
    compounds.push({ conditions, css: cssContent });
  }
  return compounds.length > 0 ? compounds : undefined;
}

/** Classify and validate one styledVariants or cssVariants call. */
function classifyVariantCall(
  node: ESTree.CallExpression & { start: number; end: number },
  code: string,
  imports: StyledStaticImports,
  variableName: string,
  keyframeNames?: ReadonlyMap<string, string>,
): FoundVariant | null {
  if (node.callee.type !== "Identifier") return null;

  const isStyledVariants = node.callee.name === imports.styledVariants;
  const isCssVariants = node.callee.name === imports.cssVariants;
  if (!isStyledVariants && !isCssVariants) return null;

  const type: VariantType = isStyledVariants ? "styledVariants" : "cssVariants";
  const apiName = `${type}()`;
  const cssContext: CssExtractionContext = {
    code,
    cssImportName: imports.css,
    keyframeNames,
  };
  if (node.arguments.length !== 1 || node.arguments[0]?.type !== "ObjectExpression") {
    throw new Error(
      `[styled-static] ${apiName} requires one inline object literal so its CSS can be extracted at build time.`,
    );
  }

  const allowedFields = new Set([
    ...(isStyledVariants ? ["component"] : []),
    "css",
    "variants",
    "defaultVariants",
    "compoundVariants",
  ]);
  let component: ComponentReference | undefined;
  let baseCss: string | undefined;
  let variants = new Map<string, Map<string, string>>();
  let defaultVariants: Map<string, string> | undefined;
  let compoundVariants: FoundVariant["compoundVariants"];
  const seenFields = new Set<string>();

  for (const property of node.arguments[0].properties) {
    if (property.type !== "Property") {
      throw new Error(
        `[styled-static] ${apiName} does not support spread properties. Write the configuration fields inline.`,
      );
    }

    const field = getConfigPropertyName(property);
    if (!field) {
      throw new Error(
        `[styled-static] ${apiName} configuration keys must be static property names.`,
      );
    }
    if (!allowedFields.has(field)) {
      throw new Error(`[styled-static] Unknown ${apiName} field ${JSON.stringify(field)}.`);
    }
    if (seenFields.has(field)) {
      throw new Error(`[styled-static] ${apiName} field ${JSON.stringify(field)} is duplicated.`);
    }
    seenFields.add(field);

    switch (field) {
      case "component":
        component = parseVariantComponent(property.value);
        break;
      case "css":
        baseCss = extractCssFromValueNode(
          property.value as ESTree.Expression,
          cssContext.code,
          cssContext.cssImportName,
          cssContext.keyframeNames,
        );
        if (baseCss === undefined) {
          throw new Error(
            `[styled-static] ${apiName} css must use the css tagged template: css\`...\`.`,
          );
        }
        break;
      case "variants":
        variants = parseVariants(property.value, cssContext, isStyledVariants, apiName);
        break;
      case "defaultVariants":
        defaultVariants = parseDefaultVariants(property.value);
        break;
      case "compoundVariants":
        compoundVariants = parseCompoundVariants(property.value, cssContext);
        break;
    }
  }

  if (isStyledVariants && !component) {
    throw new Error("[styled-static] styledVariants() requires a component field.");
  }
  if (!seenFields.has("variants")) {
    throw new Error(`[styled-static] ${apiName} requires a variants field.`);
  }

  const result: FoundVariant = {
    type,
    start: node.start,
    end: node.end,
    component,
    baseCss,
    variants,
    variableName,
  };
  if (defaultVariants) result.defaultVariants = defaultVariants;
  if (compoundVariants) result.compoundVariants = compoundVariants;
  return result;
}

// ============================================================================
// withComponent Detection
// ============================================================================

function classifyWithComponentCall(
  call: ESTree.CallExpression & { start: number; end: number },
  imports: StyledStaticImports,
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
  const fromComponent = getLocalName(call.arguments[1]);
  if (!toComponent || !fromComponent) {
    throw new Error(
      "[styled-static] withComponent() arguments must be an HTML tag string or local identifiers. Assign member expressions to local consts first.",
    );
  }

  return { type: "withComponent", start: call.start, end: call.end, toComponent, fromComponent };
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
