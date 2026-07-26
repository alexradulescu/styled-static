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
  const { definitions } = analyzeModule(context.ast, code, (localName) =>
    classNameFor(localName, filePath, context.root, context.packageIdentity),
  );
  if (definitions.length === 0) return null;

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

  const keyframeNames = new Map(
    definitions.flatMap((definition) =>
      definition.type === "keyframes" && definition.variableName
        ? [
            [
              definition.variableName,
              classNameFor(
                definition.variableName,
                filePath,
                context.root,
                context.packageIdentity,
              ),
            ] as const,
          ]
        : [],
    ),
  );

  for (const definition of definitions) {
    switch (definition.type) {
      case "styled":
      case "styledExtend":
      case "styledAttrs":
      case "css":
      case "globalCss":
      case "keyframes": {
        const css = extractTemplateContent(code, definition.node.quasi, keyframeNames);
        const className = classNameFor(
          definition.variableName ?? `global-${styleIndex}`,
          filePath,
          context.root,
          context.packageIdentity,
        );
        const extractedCss =
          definition.type === "globalCss"
            ? css
            : definition.type === "keyframes"
              ? `@keyframes ${className} { ${css} }`
              : `.${className} { ${css} }`;
        addStyle(extractedCss);
        output.overwrite(
          definition.node.start,
          definition.node.end,
          generateReplacement(definition, className, names),
        );
        if (["styled", "styledExtend", "styledAttrs"].includes(definition.type)) {
          needsComponentRuntime = true;
        }
        break;
      }

      case "styledVariants":
      case "cssVariants": {
        validateVariantReferences(definition);
        const baseClassName = classNameFor(
          definition.variableName,
          filePath,
          context.root,
          context.packageIdentity,
        );
        let extractedCss = definition.baseCss
          ? `.${baseClassName} { ${definition.baseCss} }\n`
          : "";

        for (const [variantName, values] of definition.variants) {
          for (const [valueName, css] of values) {
            extractedCss += `.${createVariantClassName(baseClassName, variantName, valueName)} { ${css} }\n`;
          }
        }
        for (const compound of definition.compoundVariants ?? []) {
          const selector = Array.from(
            compound.conditions,
            ([name, value]) => `.${createVariantClassName(baseClassName, name, value)}`,
          ).join("");
          extractedCss += `${selector} { ${compound.css} }\n`;
        }
        addStyle(extractedCss);

        const variantKeys = Array.from(definition.variants.keys());
        output.overwrite(
          definition.start,
          definition.end,
          generateVariantReplacement(definition, baseClassName, variantKeys, {
            ...names,
            variantValues: variantKeys.map((name, index) =>
              uniqueName(code, createVariantValueName(name, index)),
            ),
          }),
        );
        if (definition.type === "styledVariants") needsComponentRuntime = true;
        break;
      }

      case "withComponent":
        output.overwrite(
          definition.start,
          definition.end,
          generateWithComponentReplacement(definition, names),
        );
        needsComponentRuntime = true;
        break;
    }
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
