import type * as ESTree from "estree";
import remapping, { type SourceMapInput } from "@jridgewell/remapping";
import { readFileSync } from "node:fs";
import { basename, dirname, join, parse } from "node:path";
import type { Plugin } from "vite";
import { normalizePath, rewriteCssImports } from "./codegen.js";
import { compile } from "./compiler.js";

const VIRTUAL_PREFIX = "virtual:styled-static/";
const RESOLVED_VIRTUAL_PREFIX = `\0${VIRTUAL_PREFIX}`;

interface StyleRecord {
  css: string;
  sourceFile: string;
}

interface SourceMapLike {
  file?: string | null;
  toString(): string;
}

function composeSourceMaps(rewriteMap: SourceMapLike, chunkMap: SourceMapLike) {
  const input = [rewriteMap, chunkMap].map((map) => JSON.parse(map.toString()) as SourceMapInput);
  const raw = JSON.parse(remapping(input, () => null).toString()) as {
    version: number;
    file?: string | null;
    mappings: string;
    names: string[];
    sources: Array<string | null>;
    sourcesContent?: Array<string | null>;
    ignoreList?: number[];
  };
  const map = {
    version: raw.version,
    file: raw.file ?? chunkMap.file ?? "",
    mappings: raw.mappings,
    names: raw.names,
    sources: raw.sources.map((source) => source ?? ""),
    sourcesContent: (raw.sourcesContent ?? []).map((source) => source ?? ""),
    ...(raw.ignoreList?.length ? { x_google_ignoreList: raw.ignoreList } : {}),
  };
  const json = JSON.stringify(map);
  return {
    ...map,
    toString: () => json,
    toUrl: () =>
      `data:application/json;charset=utf-8;base64,${Buffer.from(json).toString("base64")}`,
  };
}

function sourcePath(moduleId: string): string {
  return moduleId.split("?", 1)[0] ?? moduleId;
}

function sameSource(left: string, right: string): boolean {
  return normalizePath(sourcePath(left)) === normalizePath(sourcePath(right));
}

function canonicalStyleModuleId(id: string): string {
  return id.replace(/\.(css|js)$/, ".css");
}

function developmentStyleModuleId(id: string): string {
  return id.replace(/\.css$/, ".js");
}

function escapeCssComment(value: string): string {
  return value.replace(/\*\//g, "*\\/").replace(/[\r\n]/g, "");
}

function packageName(root: string): string | undefined {
  try {
    const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      name?: unknown;
    };
    if (typeof manifest.name === "string" && manifest.name) return manifest.name;
  } catch {
    // A Vite root does not have to be a package root.
  }
  return undefined;
}

function sourcePackage(
  filePath: string,
  viteRoot: string,
  vitePackageIdentity: string,
): { root: string; identity: string } {
  for (let directory = dirname(filePath); ; directory = dirname(directory)) {
    const identity = packageName(directory);
    if (identity) return { root: directory, identity };
    if (directory === parse(directory).root) break;
  }

  // Let compile() return null for already-compiled dependencies. If this file
  // contains an extracted definition, its package-root check gives the clear error.
  return { root: viteRoot, identity: vitePackageIdentity };
}

function developmentStyleModule(id: string, record?: StyleRecord): string {
  const sourceComment = record?.sourceFile
    ? `\n/*# sourceURL=${escapeCssComment(record.sourceFile)} */`
    : "";
  return `
const id = ${JSON.stringify(id)};
const css = ${JSON.stringify(`${record?.css ?? ""}${sourceComment}`)};

const existing = Array.from(document.querySelectorAll("style[data-ss-id]")).find(
  (element) => element.getAttribute("data-ss-id") === id,
);

const style = existing ?? document.createElement("style");
if (!existing) {
  style.setAttribute("data-ss-id", id);
  document.head.appendChild(style);
}
style.textContent = css;

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.prune(() => style.remove());
}
export default css;
`;
}

/** Vite 8 adapter for the styled-static compiler. */
export function styledStatic(): Plugin {
  const styles = new Map<string, StyleRecord>();
  const sourcePackages = new Map<string, { root: string; identity: string }>();
  const debugEnabled = process.env.DEBUG_STYLED_STATIC === "true";
  const debug = (...values: unknown[]): void => {
    if (debugEnabled) console.log("[styled-static]", ...values);
  };

  let development = false;
  let libraryBuild = false;
  let root = process.cwd();
  let rootPackageIdentity = basename(root) || "application";

  return {
    name: "styled-static",
    enforce: "post",

    config(config) {
      const library = config.build?.lib;
      if (!library || typeof library !== "object" || library.formats) return;
      return { build: { lib: { ...library, formats: ["es", "cjs"] } } };
    },

    configResolved(config) {
      development = config.command === "serve";
      libraryBuild = !!config.build?.lib;
      root = config.root ?? process.cwd();
      rootPackageIdentity = packageName(root) ?? basename(root) ?? "application";
      sourcePackages.clear();
      debug("mode:", development ? "development" : libraryBuild ? "library" : "application");
    },

    resolveId(id) {
      if (id.startsWith(RESOLVED_VIRTUAL_PREFIX)) return id;
      if (id.startsWith(VIRTUAL_PREFIX)) return `\0${id}`;
      return null;
    },

    load(id) {
      if (!id.startsWith(RESOLVED_VIRTUAL_PREFIX)) return null;
      const canonicalId = canonicalStyleModuleId(id.slice(1));
      const record = styles.get(canonicalId);
      if (development) return developmentStyleModule(canonicalId, record);
      return libraryBuild ? "" : (record?.css ?? "");
    },

    handleHotUpdate({ file, server }) {
      if (!/\.[cm]?[jt]sx?$/.test(file)) return;
      for (const [moduleId, record] of styles) {
        if (!sameSource(record.sourceFile, file)) continue;
        const developmentId = developmentStyleModuleId(moduleId);
        const module = server.moduleGraph.getModuleById(`\0${developmentId}`);
        if (module) server.moduleGraph.invalidateModule(module);
      }
    },

    transform: {
      filter: { id: /\.[cm]?[jt]sx?(?:\?.*)?$/ },
      handler(code, id) {
        const filePath = sourcePath(id);
        if (
          /(?:^|[/\\])node_modules(?:[/\\]|$)/.test(filePath) ||
          !code.includes("@alex.radulescu/styled-static")
        ) {
          return null;
        }

        let ast: ESTree.Program;
        try {
          ast = this.parse(code) as ESTree.Program;
        } catch (error) {
          debug("parse skipped:", id, error);
          return null;
        }

        const sourceDirectory = dirname(filePath);
        let packageContext = sourcePackages.get(sourceDirectory);
        if (!packageContext) {
          packageContext = sourcePackage(filePath, root, rootPackageIdentity);
          sourcePackages.set(sourceDirectory, packageContext);
        }
        const result = compile(code, filePath, {
          ast,
          root: packageContext.root,
          packageIdentity: packageContext.identity,
          development,
        });

        for (const [moduleId, record] of styles) {
          if (sameSource(record.sourceFile, filePath)) styles.delete(moduleId);
        }
        if (!result) {
          debug("cleared:", id);
          return null;
        }
        for (const style of result.styles) {
          styles.set(style.moduleId, { css: style.css, sourceFile: filePath });
        }
        debug("compiled:", id, `${result.styles.length} style module(s)`);
        return { code: result.code, map: result.map };
      },
    },

    generateBundle(options, bundle) {
      if (!libraryBuild) return;
      if (options.format !== "es" && options.format !== "cjs") {
        this.error(
          `[styled-static] Library format ${JSON.stringify(options.format)} cannot link a static stylesheet. Use Vite's ESM or CommonJS library format, then let the consuming application bundle it for the browser.`,
        );
      }

      const cssBySource = new Map<string, string[]>();
      for (const record of styles.values()) {
        const key = normalizePath(sourcePath(record.sourceFile));
        const entries = cssBySource.get(key) ?? [];
        entries.push(record.css);
        cssBySource.set(key, entries);
      }

      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== "chunk") continue;
        const css = output.moduleIds
          .flatMap((moduleId) => cssBySource.get(normalizePath(sourcePath(moduleId))) ?? [])
          .join("\n")
          .trim();
        if (!css) continue;

        const cssFileName = /\.[cm]?js$/.test(fileName)
          ? fileName.replace(/\.[cm]?js$/, ".css")
          : `${fileName}.css`;
        this.emitFile({ type: "asset", fileName: cssFileName, source: css });
        const ast = this.parse(output.code) as ESTree.Program;
        const rewritten = rewriteCssImports(output.code, cssFileName, ast, options.format);
        output.code = rewritten.code;
        if (output.map) {
          const composedMap = composeSourceMaps(rewritten.map, output.map);
          output.map = composedMap;
          const sourceMapAsset = bundle[output.sourcemapFileName ?? `${fileName}.map`];
          if (sourceMapAsset?.type === "asset") {
            sourceMapAsset.source = composedMap.toString();
          } else {
            output.code = output.code.replace(
              /^\/\/# sourceMappingURL=data:application\/json[^\r\n]*$/m,
              `//# sourceMappingURL=${composedMap.toUrl()}`,
            );
          }
        }
        debug("emitted:", cssFileName);
      }
    },
  };
}

export default styledStatic;
