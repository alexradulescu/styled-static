import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { build } from "vite";
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
    expect(javascript).toStartWith('require("./index.css");');
    expect(javascript).not.toStartWith("import ");
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
      if (consumerUsesPlugin) expect(css).toContain("consumer-red");
    });
  }
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
