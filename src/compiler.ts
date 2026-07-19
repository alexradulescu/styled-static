import type * as ESTree from "estree";
import MagicString from "magic-string";
import {
  createVariantClassName,
  createVariantValueName,
  generateReplacement,
  generateVariantReplacement,
  generateWithComponentReplacement,
  normalizePath,
  safeStringLiteral,
  toClassNameSegment,
} from "./codegen.js";
import { hash } from "./hash.js";
import { analyzeModule, extractTemplateContent } from "./parse.js";
import type { FoundVariant } from "./parse.js";

export interface CompileContext {
  ast: ESTree.Program;
  root: string;
  packageIdentity: string;
  development: boolean;
}

export interface CompiledStyle {
  moduleId: string;
  css: string;
}

export interface CompileResult {
  code: string;
  map: ReturnType<MagicString["generateMap"]>;
  styles: CompiledStyle[];
}

function uniqueName(code: string, preferredName: string): string {
  let candidate = preferredName;
  while (new RegExp(`\\b${candidate}\\b`).test(code)) candidate += "_";
  return candidate;
}

function classNameFor(
  localName: string,
  filePath: string,
  root: string,
  packageIdentity: string,
): string {
  const file = normalizePath(filePath);
  const normalizedRoot = normalizePath(root).replace(/\/$/, "");
  const relativeFile = file.startsWith(`${normalizedRoot}/`)
    ? file.slice(normalizedRoot.length + 1)
    : file === normalizedRoot
      ? normalizePath(filePath).split("/").pop() || "module"
      : undefined;
  if (!relativeFile) {
    throw new Error(
      `[styled-static] ${filePath} is outside package root ${root}. Add a named package.json beside the source or configure Vite with that package as its root.`,
    );
  }
  const identity = `${packageIdentity}:${relativeFile}:${localName}`;
  return `ss-${toClassNameSegment(localName)}-${hash(identity)}`;
}

function validateVariantReferences(variant: FoundVariant): void {
  for (const [name, value] of variant.defaultVariants ?? []) {
    if (!variant.variants.get(name)?.has(value)) {
      throw new Error(
        `[styled-static] Unknown default variant ${JSON.stringify(name)}: ${JSON.stringify(value)} in ${variant.variableName}.`,
      );
    }
  }
  for (const compound of variant.compoundVariants ?? []) {
    for (const [name, value] of compound.conditions) {
      if (!variant.variants.get(name)?.has(value)) {
        throw new Error(
          `[styled-static] Unknown compound variant ${JSON.stringify(name)}: ${JSON.stringify(value)} in ${variant.variableName}.`,
        );
      }
    }
  }
}

/** Compile one source module without retaining plugin or filesystem state. */
export function compile(
  code: string,
  filePath: string,
  context: CompileContext,
): CompileResult | null {
  const { templates, variants, componentConversions } = analyzeModule(
    context.ast,
    code,
    (localName) => classNameFor(localName, filePath, context.root, context.packageIdentity),
  );
  if (templates.length === 0 && variants.length === 0 && componentConversions.length === 0) {
    return null;
  }

  const output = new MagicString(code);
  const styles: CompiledStyle[] = [];
  const cssImports: string[] = [];
  let needsComponentRuntime = false;
  let styleIndex = 0;

  const names = {
    createElement: uniqueName(code, "createElement"),
    mergeClassNames: uniqueName(code, "mergeClassNames"),
    props: uniqueName(code, "props"),
    remainingProps: uniqueName(code, "remainingProps"),
    userClassName: uniqueName(code, "userClassName"),
    classNames: uniqueName(code, "classNames"),
  };

  const addStyle = (css: string): void => {
    const baseId = `virtual:styled-static/${hash(normalizePath(filePath)).slice(0, 10)}/${styleIndex++}`;
    const moduleId = `${baseId}.css`;
    styles.push({ moduleId, css });
    cssImports.push(
      `import ${safeStringLiteral(context.development ? `${baseId}.js` : moduleId)};`,
    );
  };

  const keyframeNames = new Map<string, string>();
  for (const template of templates) {
    if (template.type === "keyframes" && template.variableName) {
      keyframeNames.set(
        template.variableName,
        classNameFor(template.variableName, filePath, context.root, context.packageIdentity),
      );
    }
  }

  for (const template of templates) {
    const css = extractTemplateContent(code, template.node.quasi, keyframeNames);
    const className = classNameFor(
      template.variableName ?? `global-${styleIndex}`,
      filePath,
      context.root,
      context.packageIdentity,
    );
    const extractedCss =
      template.type === "globalCss"
        ? css
        : template.type === "keyframes"
          ? `@keyframes ${className} { ${css} }`
          : `.${className} { ${css} }`;
    addStyle(extractedCss);
    output.overwrite(
      template.node.start,
      template.node.end,
      generateReplacement(template, className, names),
    );
    if (["styled", "styledExtend", "styledAttrs"].includes(template.type)) {
      needsComponentRuntime = true;
    }
  }

  for (const variant of variants) {
    validateVariantReferences(variant);
    const baseClassName = classNameFor(
      variant.variableName,
      filePath,
      context.root,
      context.packageIdentity,
    );
    let extractedCss = variant.baseCss ? `.${baseClassName} { ${variant.baseCss} }\n` : "";

    for (const [variantName, values] of variant.variants) {
      for (const [valueName, css] of values) {
        extractedCss += `.${createVariantClassName(baseClassName, variantName, valueName)} { ${css} }\n`;
      }
    }
    for (const compound of variant.compoundVariants ?? []) {
      const selector = Array.from(
        compound.conditions,
        ([name, value]) => `.${createVariantClassName(baseClassName, name, value)}`,
      ).join("");
      extractedCss += `${selector} { ${compound.css} }\n`;
    }
    addStyle(extractedCss);

    const variantKeys = Array.from(variant.variants.keys());
    output.overwrite(
      variant.start,
      variant.end,
      generateVariantReplacement(variant, baseClassName, variantKeys, {
        ...names,
        variantValues: variantKeys.map((name, index) =>
          uniqueName(code, createVariantValueName(name, index)),
        ),
      }),
    );
    if (variant.type === "styledVariants") needsComponentRuntime = true;
  }

  for (const conversion of componentConversions) {
    output.overwrite(
      conversion.start,
      conversion.end,
      generateWithComponentReplacement(conversion, names),
    );
    needsComponentRuntime = true;
  }

  let header = cssImports.join("\n");
  if (needsComponentRuntime) {
    const createElementImport =
      names.createElement === "createElement"
        ? "createElement"
        : `createElement as ${names.createElement}`;
    const mergeImport =
      names.mergeClassNames === "mergeClassNames"
        ? "mergeClassNames"
        : `mergeClassNames as ${names.mergeClassNames}`;
    header += `${header ? "\n" : ""}import { ${createElementImport} } from "react";`;
    header += `\nimport { ${mergeImport} } from "@alex.radulescu/styled-static/runtime";`;
  }
  if (header) output.prepend(`${header}\n\n`);

  return { code: output.toString(), map: output.generateMap({ hires: true }), styles };
}
