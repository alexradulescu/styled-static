import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { originalPositionFor, TraceMap } from "@jridgewell/trace-mapping";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { build, version as viteVersion } from "vite";
import { styledStatic } from "./vite";

const workspace = await realpath(await mkdtemp(join(tmpdir(), "styled-static-build-")));
const packageRoot = resolve(import.meta.dir, "..");
const packageAlias = resolve(packageRoot, "src/index.ts");
const runtimeAlias = resolve(packageRoot, "src/runtime/index.ts");
const execFileAsync = promisify(execFile);

afterAll(async () => {
  await rm(workspace, { recursive: true, force: true });
});

async function write(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
}

function aliases() {
  return [
    { find: "@alex.radulescu/styled-static/runtime", replacement: runtimeAlias },
    { find: "@alex.radulescu/styled-static", replacement: packageAlias },
    { find: "react", replacement: resolve(packageRoot, "node_modules/react/index.js") },
  ];
}

async function builtCss(outDir: string): Promise<string> {
  const assetsDirectory = join(outDir, "assets");
  const files = await readdir(assetsDirectory);
  const cssFile = files.find((file) => file.endsWith(".css"));
  expect(cssFile).toBeDefined();
  return readFile(join(assetsDirectory, cssFile!), "utf8");
}

function generatedPositionOf(code: string, text: string): { line: number; column: number } {
  const index = code.indexOf(text);
  expect(index).toBeGreaterThanOrEqual(0);
  const preceding = code.slice(0, index);
  const lines = preceding.split("\n");
  return { line: lines.length, column: lines.at(-1)?.length ?? 0 };
}

function expectOriginalLine(
  sourceMap: TraceMap,
  generatedCode: string,
  text: string,
  line: number,
): void {
  const original = originalPositionFor(sourceMap, generatedPositionOf(generatedCode, text));
  expect(original.source).toEndWith("entry.ts");
  expect(original.line).toBe(line);
}

function traceMapFromJson(json: string): TraceMap {
  const sourceMap = JSON.parse(json) as { sources: string[]; mappings: string };
  return new TraceMap(sourceMap);
}

async function traceMapFromFile(path: string): Promise<TraceMap> {
  return traceMapFromJson(await readFile(path, "utf8"));
}

function inlineTraceMap(generatedCode: string): TraceMap {
  const encodedMap = generatedCode.match(
    /sourceMappingURL=data:application\/json[^\r\n,]*;base64,([^\r\n]+)/,
  )?.[1];
  expect(encodedMap).toBeDefined();
  return traceMapFromJson(Buffer.from(encodedMap!, "base64").toString("utf8"));
}

async function buildSourceMapFixture(
  name: string,
  sourcemap: true | "inline",
  sourcemapFileNames?: string,
): Promise<{ generatedCode: string; outDir: string }> {
  const root = join(workspace, name);
  const outDir = join(root, "dist");
  const entry = join(root, "entry.ts");
  await write(
    entry,
    `import { css } from "@alex.radulescu/styled-static";
export const marker = "source-map-marker";
export const token = css\`color: source-map-blue;\`;`,
  );

  await build({
    configFile: false,
    root,
    plugins: [styledStatic()],
    resolve: { alias: aliases() },
    build: {
      lib: { entry, formats: ["es"], fileName: () => "index.mjs", cssFileName: "vite" },
      outDir,
      emptyOutDir: true,
      sourcemap,
      ...(sourcemapFileNames ? { rollupOptions: { output: { sourcemapFileNames } } } : undefined),
    },
  });

  return {
    generatedCode: await readFile(join(outDir, "index.mjs"), "utf8"),
    outDir,
  };
}

describe("real library consumption", () => {
  const libraryRoot = join(workspace, "library");
  const libraryOut = join(libraryRoot, "dist");
  const libraryJavaScript = join(libraryOut, "index.mjs");
  const libraryCommonJs = join(libraryOut, "index.cjs");

  beforeAll(async () => {
    const entry = join(libraryRoot, "entry.ts");
    await write(
      entry,
      `import { styled } from "@alex.radulescu/styled-static";
export const marker = "source-map-marker";
export const LibraryButton = styled.button\`color: library-blue;\`;`,
    );

    await build({
      configFile: false,
      root: libraryRoot,
      plugins: [styledStatic()],
      resolve: { alias: aliases(), dedupe: ["react"] },
      build: {
        lib: {
          entry,
          fileName: (format) => (format === "cjs" ? "index.cjs" : "index.mjs"),
          cssFileName: "vite",
        },
        outDir: libraryOut,
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
          external: ["react", "@alex.radulescu/styled-static/runtime"],
        },
      },
    });
  });

  it("emits a standard colocated CSS import", async () => {
    const javascript = await readFile(libraryJavaScript, "utf8");
    expect(javascript).toStartWith('import "./index.css";');
    expect(await readFile(join(libraryOut, "index.css"), "utf8")).toContain("library-blue");
  });

  it("emits format-appropriate CSS linkage for CommonJS", async () => {
    const javascript = await readFile(libraryCommonJs, "utf8");
    expect(javascript).toStartWith('require("./index.css")');
    expect(javascript).not.toStartWith("import ");
  });

  it("preserves source mappings after adding the CSS import", async () => {
    const javascript = await readFile(libraryJavaScript, "utf8");
    const traceMap = await traceMapFromFile(`${libraryJavaScript}.map`);

    expectOriginalLine(traceMap, javascript, "source-map-marker", 2);
    expectOriginalLine(traceMap, javascript, "ss-LibraryButton-", 3);
  });

  it("preserves CommonJS library CSS when a Vite app consumes it", async () => {
    const consumerRoot = join(workspace, "commonjs-consumer");
    const consumerOut = join(consumerRoot, "dist");
    await write(
      join(consumerRoot, "index.html"),
      `<main id="app"></main><script type="module" src="/entry.ts"></script>`,
    );
    await write(
      join(consumerRoot, "entry.ts"),
      `import { LibraryButton } from ${JSON.stringify(libraryCommonJs)};
document.querySelector("#app")!.className = LibraryButton.className;`,
    );

    await build({
      configFile: false,
      root: consumerRoot,
      resolve: { alias: aliases(), dedupe: ["react"] },
      build: { outDir: consumerOut, emptyOutDir: true },
    });

    expect(await builtCss(consumerOut)).toContain("library-blue");
  });

  for (const consumerUsesPlugin of [false, true]) {
    it(`works when the consumer ${consumerUsesPlugin ? "also uses" : "does not use"} styled-static`, async () => {
      const consumerRoot = join(
        workspace,
        consumerUsesPlugin ? "direct-consumer" : "plain-consumer",
      );
      const consumerOut = join(consumerRoot, "dist");
      const directDefinition = consumerUsesPlugin
        ? `import { css } from "@alex.radulescu/styled-static";
const consumerClass = css\`color: consumer-red;\`;`
        : `const consumerClass = "plain";`;
      await write(
        join(consumerRoot, "index.html"),
        `<main id="app"></main><script type="module" src="/entry.ts"></script>`,
      );
      await write(
        join(consumerRoot, "entry.ts"),
        `import { LibraryButton } from ${JSON.stringify(libraryJavaScript)};
${directDefinition}
document.querySelector("#app")!.className = LibraryButton.className + " " + consumerClass;`,
      );

      await build({
        configFile: false,
        root: consumerRoot,
        plugins: consumerUsesPlugin ? [styledStatic()] : [],
        resolve: { alias: aliases(), dedupe: ["react"] },
        build: { outDir: consumerOut, emptyOutDir: true },
      });

      const css = await builtCss(consumerOut);
      expect(css).toContain("library-blue");
      expect(css).not.toContain("sourceURL=");
      if (consumerUsesPlugin) expect(css).toContain("consumer-red");
    });
  }

  it("links CSS when library chunk names include content hashes", async () => {
    const hashedRoot = join(workspace, "hashed-library");
    const hashedOut = join(hashedRoot, "dist");
    const entry = join(hashedRoot, "entry.ts");
    await write(
      entry,
      `import { css } from "@alex.radulescu/styled-static";
export const token = css\`color: hashed-blue;\`;`,
    );

    await build({
      configFile: false,
      root: hashedRoot,
      plugins: [styledStatic()],
      resolve: { alias: aliases() },
      build: {
        lib: { entry, formats: ["es"], cssFileName: "vite" },
        outDir: hashedOut,
        emptyOutDir: true,
        rollupOptions: {
          output: { entryFileNames: "chunks/[name]-[hash].js" },
        },
      },
    });

    const chunksDirectory = join(hashedOut, "chunks");
    const files = await readdir(chunksDirectory);
    const javascriptFile = files.find((file) => file.endsWith(".js"));
    expect(javascriptFile).toBeDefined();
    const javascript = await readFile(join(chunksDirectory, javascriptFile!), "utf8");
    const cssImport = javascript.match(/import\s*["'](.+\.css)["']/)?.[1];
    expect(cssImport).toBeDefined();
    expect(await readFile(resolve(chunksDirectory, cssImport!), "utf8")).toContain("hashed-blue");
  });

  it("updates inline source maps after adding the CSS import", async () => {
    const { generatedCode } = await buildSourceMapFixture("inline-source-map-library", "inline");
    const traceMap = inlineTraceMap(generatedCode);

    expectOriginalLine(traceMap, generatedCode, "source-map-marker", 2);
    expectOriginalLine(traceMap, generatedCode, "ss-token-", 3);
  });

  const customSourceMapTest = viteVersion.startsWith("8.0.") ? it.skip : it;
  customSourceMapTest(
    "updates custom-named source-map assets after adding the CSS import",
    async () => {
      const { generatedCode, outDir } = await buildSourceMapFixture(
        "custom-source-map-library",
        true,
        "maps/[name]-custom.map",
      );
      const mapFiles = await readdir(join(outDir, "maps"));
      const mapFile = mapFiles.find((file) => file.endsWith(".map"));
      expect(mapFile).toBeDefined();
      const traceMap = await traceMapFromFile(join(outDir, "maps", mapFile!));

      expectOriginalLine(traceMap, generatedCode, "source-map-marker", 2);
      expectOriginalLine(traceMap, generatedCode, "ss-token-", 3);
    },
  );
});

describe("published package", () => {
  it("ships and imports every documented export without source or removed modules", async () => {
    await execFileAsync(process.execPath, ["run", "build"], { cwd: packageRoot });

    const { stdout } = await execFileAsync("npm", ["pack", "--dry-run", "--json"], {
      cwd: packageRoot,
    });
    const pack = JSON.parse(stdout) as Array<{ files: Array<{ path: string }> }>;
    const files = pack[0]!.files.map(({ path }) => path);
    expect(files).toContain("dist/index.js");
    expect(files).toContain("dist/vite.js");
    expect(files).toContain("dist/runtime/index.js");
    expect(files).not.toContain("dist/theme.js");
    expect(files.some((path) => path.startsWith("src/") || path.includes(".test."))).toBe(false);

    await execFileAsync(
      "node",
      [
        "--input-type=module",
        "--eval",
        `const api = await import("@alex.radulescu/styled-static");
const vite = await import("@alex.radulescu/styled-static/vite");
const runtime = await import("@alex.radulescu/styled-static/runtime");
if (typeof api.styled !== "function" || typeof vite.styledStatic !== "function" || typeof runtime.mergeClassNames !== "function") process.exit(1);`,
      ],
      { cwd: packageRoot },
    );

    await execFileAsync(
      "node",
      [
        "--eval",
        `const runtime = require("@alex.radulescu/styled-static/runtime");
if (typeof runtime.mergeClassNames !== "function") process.exit(1);`,
      ],
      { cwd: packageRoot },
    );
  });
});
