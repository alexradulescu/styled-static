import { describe, expect, it, mock } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseSync } from "rolldown/utils";
import { createServer, type Plugin } from "vite";
import { rewriteCssImports } from "./codegen";
import { compile } from "./compiler";
import { hash } from "./hash";
import { styledStatic } from "./vite";

const PACKAGE = "@alex.radulescu/styled-static";

function context() {
  return {
    parse(code: string) {
      return parseSync("fixture.js", code, {
        sourceType: "module",
        preserveParens: false,
      }).program;
    },
  };
}

function configure(
  plugin: Plugin,
  command: "serve" | "build",
  library = false,
  root = "/project",
): void {
  (plugin.configResolved as Function)?.({
    command,
    root,
    build: library ? { lib: { entry: `${root}/src/index.ts` } } : {},
  });
}

async function transform(plugin: Plugin, code: string, id = "/project/src/example.tsx") {
  const hook = plugin.transform as Function | { handler: Function };
  const handler = typeof hook === "function" ? hook : hook.handler;
  return handler.call(context(), code, id) as Promise<{
    code: string;
    map: unknown;
  } | null>;
}

function load(plugin: Plugin, id: string): unknown {
  const hook = plugin.load as Function | { handler: Function };
  const handler = typeof hook === "function" ? hook : hook.handler;
  return handler(id);
}

function cssImports(code: string): string[] {
  return Array.from(
    code.matchAll(/import "(virtual:styled-static\/[^"]+)";/g),
    (match) => match[1]!,
  );
}

function loadCss(plugin: Plugin, transformed: string): string {
  return cssImports(transformed)
    .map((id) => String(load(plugin, `\0${id}`)))
    .join("\n");
}

describe("public plugin contract", () => {
  it("is option-free and runs after the React transform", () => {
    const plugin = styledStatic();
    expect(plugin.name).toBe("styled-static");
    expect(plugin.enforce).toBe("post");
    expect(styledStatic.length).toBe(0);
  });

  it("uses Vite hook filters for source and virtual modules", () => {
    const plugin = styledStatic();
    const transformHook = plugin.transform as {
      filter: {
        code?: string;
        id?: { include?: RegExp; exclude?: RegExp };
      };
    };
    const resolveHook = plugin.resolveId as { filter?: { id?: RegExp } };
    const loadHook = plugin.load as { filter?: { id?: RegExp } };

    expect(transformHook.filter.code).toBe(PACKAGE);
    expect(transformHook.filter.id?.include?.test("/project/src/Button.tsx?direct")).toBe(true);
    expect(transformHook.filter.id?.include?.test("/project/src/Button.css")).toBe(false);
    expect(transformHook.filter.id?.exclude?.test("/project/node_modules/Button.tsx")).toBe(true);
    expect(resolveHook.filter?.id?.test("virtual:styled-static/example/0.css")).toBe(true);
    expect(resolveHook.filter?.id?.test("\0virtual:styled-static/example/0.css")).toBe(true);
    expect(loadHook.filter?.id?.test("\0virtual:styled-static/example/0.css")).toBe(true);
  });

  it("defaults library builds to the two formats that can link CSS", () => {
    const plugin = styledStatic();
    const config = (plugin.config as Function)({ build: { lib: { entry: "src/index.ts" } } });
    expect(config.build.lib.formats).toEqual(["es", "cjs"]);
    expect(
      (plugin.config as Function)({
        build: { lib: { entry: "src/index.ts", formats: ["es"] } },
      }),
    ).toBeUndefined();
  });

  it("supports JavaScript and TypeScript module extensions", async () => {
    for (const extension of ["js", "jsx", "ts", "tsx", "mjs", "cjs", "mts", "cts"]) {
      const plugin = styledStatic();
      configure(plugin, "build");
      const result = await transform(
        plugin,
        `import { css } from '${PACKAGE}'; const token = css\`color: red;\`;`,
        `/project/src/example.${extension}`,
      );
      expect(result?.code).toContain('const token = "ss-token-');
    }
  });

  it("keeps a handler guard for unrelated packages", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    expect(
      await transform(plugin, `import { css } from './styled-static';`, "/project/a.ts"),
    ).toBeNull();
  });

  it("uses the nearest named package in nested workspaces", async () => {
    const classNames: string[] = [];
    const roots: string[] = [];
    try {
      for (const outerName of ["@example/outer-one", "@example/outer-two"]) {
        const root = await mkdtemp(join(tmpdir(), "styled-static-package-"));
        roots.push(root);
        const packageRoot = join(root, "packages", "ui");
        const file = join(packageRoot, "src", "Button.tsx");
        await mkdir(join(packageRoot, "src"), { recursive: true });
        await writeFile(join(root, "package.json"), JSON.stringify({ name: outerName }));
        await writeFile(join(packageRoot, "package.json"), JSON.stringify({ name: "@example/ui" }));

        const plugin = styledStatic();
        configure(plugin, "build", false, root);
        const result = await transform(
          plugin,
          `import { styled } from '${PACKAGE}'; const Button = styled.button\`color:red;\`;`,
          file,
        );
        classNames.push(result!.code.match(/ss-Button-[a-z0-9]+/)?.[0] ?? "");
      }
    } finally {
      await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
    }

    expect(classNames).toEqual(["ss-Button-1m7pymyozff7g", "ss-Button-1m7pymyozff7g"]);
  });

  it("skips unnamed package manifests and stops at the filesystem root", async () => {
    const root = await mkdtemp(join(tmpdir(), "styled-static-package-"));
    try {
      const packageRoot = join(root, "packages", "ui");
      const file = join(packageRoot, "src", "Button.tsx");
      await mkdir(join(packageRoot, "src"), { recursive: true });
      await writeFile(join(root, "package.json"), JSON.stringify({ name: "@example/outer" }));
      await writeFile(join(packageRoot, "package.json"), "{}");

      const plugin = styledStatic();
      configure(plugin, "build", false, root);
      const source = `import { styled } from '${PACKAGE}'; const Button = styled.button\`color:red;\`;`;
      const result = await transform(plugin, source, file);
      expect(result!.code).toContain("ss-Button-34ataxggispk6");

      await expect(transform(plugin, source, join(root, "..", "detached.ts"))).rejects.toThrow(
        "outside package root",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("accepted static language", () => {
  it("transforms every public compiler binding through import aliases", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    const result = await transform(
      plugin,
      `import { styled as s, css as c, globalCss as g, keyframes as k, styledVariants as sv, cssVariants as cv, withComponent as wc } from '${PACKAGE}';
const spin = k\`to { transform: rotate(1turn); }\`;
const selected = c\`outline: 2px solid;\`;
const Button = s.button.attrs({ type: "button" })\`animation: \${spin} 1s;\`;
const Primary = s(Button)\`color: blue;\`;
const LinkButton = wc("a", Primary);
const tones = cv({ css: c\`display: block;\`, variants: { tone: { calm: c\`color: blue;\` } } });
const VariantButton = sv({ component: Button, css: c\`padding: 1rem;\`, variants: { tone: { calm: c\`color: blue;\` } } });
g\`body { margin: 0; }\`;`,
    );

    expect(result).not.toBeNull();
    expect(result!.code).toContain("mergeClassNames");
    expect(result!.code).toContain('import { createElement } from "react"');
    expect(result!.code).toContain("Object.assign");
    expect(result!.code).toContain("void 0");
    expect(cssImports(result!.code)).toHaveLength(7);
    const extracted = loadCss(plugin, result!.code);
    expect(extracted).toContain("@keyframes ss-spin-");
    expect(extracted).toContain("body { margin: 0; }");
  });

  it("preserves base, extension, then user class order", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    const result = await transform(
      plugin,
      `import { styled } from '${PACKAGE}';
const Button = styled.button\`color: blue;\`;
const Danger = styled(Button)\`color: red;\`;`,
    );
    expect(result!.code).toContain('[Button.className, "ss-Danger-');
    expect(result!.code).toContain("mergeClassNames");
  });

  it("lets explicit props override static attrs", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    const result = await transform(
      plugin,
      `import { styled } from '${PACKAGE}'; const Input = styled.input.attrs({ type: "password" })\`padding: 1rem;\`;`,
    );
    expect(result!.code).toContain('...({ type: "password" }), ...props');

    const ariaResult = await transform(
      plugin,
      `import { styled } from '${PACKAGE}'; const Input = styled.input.attrs({ "aria-label": "Password", tabIndex: -1, hidden: false })\`padding: 1rem;\`;`,
      "/project/src/aria.tsx",
    );
    expect(ariaResult!.code).toContain('"aria-label": "Password"');
    expect(ariaResult!.code).toContain("tabIndex: -1");
  });

  it("emits extracted CSS in source declaration order", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    const result = await transform(
      plugin,
      `import { css, cssVariants } from '${PACKAGE}';
const tones = cssVariants({ variants: { tone: { calm: css\`color: first-red;\` } } });
const override = css\`color: second-blue;\`;`,
    );

    const extracted = loadCss(plugin, result!.code);
    expect(extracted.indexOf("first-red")).toBeLessThan(extracted.indexOf("second-blue"));
  });
});

describe("rejected static language", () => {
  const cases: Array<[string, string]> = [
    [
      `import { styled } from '${PACKAGE}'; let Button = styled.button\`\`;`,
      "must use a top-level const",
    ],
    [
      `import { styled } from '${PACKAGE}'; const Button = styled.button\`\`, Card = styled.div\`\`;`,
      "own const statement",
    ],
    [
      `import { styled } from '${PACKAGE}'; function make() { const Button = styled.button\`\`; }`,
      "one named top-level const",
    ],
    [`import { styled } from '${PACKAGE}'; const Box = styled["div"]\`\`;`, "styled.div"],
    [`import { styled } from '${PACKAGE}'; const Box = styled("div")\`\`;`, "styled.div"],
    [`import { styled } from '${PACKAGE}'; const Box = styled(UI.Box)\`\`;`, "local identifier"],
    [
      `import { styled } from '${PACKAGE}'; const Box = styled()\`\`;`,
      "Unsupported styled template syntax",
    ],
    [
      `import { styled } from '${PACKAGE}'; const Box = styled.div.attrs({}, {})\`\`;`,
      "Unsupported styled template syntax",
    ],
    [
      `import { globalCss } from '${PACKAGE}'; const globals = globalCss\`body {}\`;`,
      "top-level expression",
    ],
    [
      `import { styled } from '${PACKAGE}'; const defaults = { type: "button" }; const Button = styled.button.attrs({ ...defaults })\`\`;`,
      "only explicit string, number, boolean, or null",
    ],
    [
      `import { styled } from '${PACKAGE}'; const Button = styled.button.attrs({ type: getType() })\`\`;`,
      "only explicit string, number, boolean, or null",
    ],
    [
      `import { css, cssVariants } from '${PACKAGE}'; const x = cssVariants({ css: "color:red", variants: {} });`,
      "css tagged template",
    ],
    [
      `import { cssVariants } from '${PACKAGE}'; const x = cssVariants({ variants: { size: { 1: "color:red" } } });`,
      "static property names",
    ],
    [
      `import { cssVariants } from '${PACKAGE}'; const key = "tone"; const x = cssVariants({ variants: { [key]: { calm: "color:red" } } });`,
      "static property names",
    ],
    [
      `import { css, cssVariants } from '${PACKAGE}'; const x = cssVariants({ variants: { __proto__: { calm: css\`color:red\` } } });`,
      "static property names",
    ],
    [
      `import { css, cssVariants } from '${PACKAGE}'; const x = cssVariants({ variants: { "high-contrast": { calm: css\`color:red\` } } });`,
      "static property names",
    ],
    [
      `import { css, cssVariants } from '${PACKAGE}'; const x = cssVariants({ variants: {}, variants: {} });`,
      'field "variants" is duplicated',
    ],
    [
      `import { cssVariants } from '${PACKAGE}'; const x = cssVariants({});`,
      "requires a variants field",
    ],
    [
      `import { styledVariants } from '${PACKAGE}'; const X = styledVariants({ component: "button" });`,
      "requires a variants field",
    ],
    [
      `import { css, styledVariants } from '${PACKAGE}'; const X = styledVariants({ component: "button", variants: { className: { danger: css\`color:red\` } } });`,
      "reserved React prop",
    ],
    [
      `import { css, cssVariants } from '${PACKAGE}'; const x = cssVariants({ variants: { css: { compact: css\`color:red\` } } });`,
      'Variant name "css" is reserved',
    ],
    [
      `import { css as first, css as second } from '${PACKAGE}'; const x = second\`color:red\`;`,
      "more than one local alias",
    ],
  ];

  for (const [code, message] of cases) {
    it(message, async () => {
      const plugin = styledStatic();
      configure(plugin, "build");
      await expect(transform(plugin, code)).rejects.toThrow(message);
    });
  }

  it("rejects all interpolation except direct keyframe identifiers", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    await expect(
      transform(
        plugin,
        `import { styled } from '${PACKAGE}'; const color = "red"; const Box = styled.div\`color: \${color};\`;`,
      ),
    ).rejects.toThrow("Only direct keyframes references");
  });

  it("allows direct keyframe references in variant CSS", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    const result = await transform(
      plugin,
      `import { css, cssVariants, keyframes } from '${PACKAGE}';
const spin = keyframes\`to { transform: rotate(1turn); }\`;
const motion = cssVariants({ variants: { motion: { spin: css\`animation: \${spin} 1s linear;\` } } });`,
    );
    const extracted = loadCss(plugin, result!.code);
    const animationName = extracted.match(/@keyframes (ss-spin-[a-z0-9]+)/)?.[1];
    expect(animationName).toBeDefined();
    expect(extracted).toContain(`animation: ${animationName} 1s linear`);
  });
});

describe("stable, readable identity", () => {
  async function classFor(
    command: "serve" | "build",
    css: string,
    file = "/project/src/Button.tsx",
    root = "/project",
  ) {
    const plugin = styledStatic();
    configure(plugin, command, false, root);
    const result = await transform(
      plugin,
      `import { styled } from '${PACKAGE}'; const Button = styled.button\`${css}\`;`,
      file,
    );
    return result!.code.match(/ss-Button-[a-z0-9]+/)?.[0];
  }

  it("uses the same identity in development and production", async () => {
    expect(await classFor("serve", "color: red;")).toBe(await classFor("build", "color: red;"));
  });

  it("does not rename a declaration when only its CSS changes", async () => {
    expect(await classFor("serve", "color: red;")).toBe(await classFor("serve", "color: blue;"));
  });

  it("separates same-named declarations in different modules", async () => {
    expect(await classFor("build", "", "/project/src/a/Button.tsx")).not.toBe(
      await classFor("build", "", "/project/src/b/Button.tsx"),
    );
  });

  it("separates same-named declarations in different packages", async () => {
    expect(await classFor("build", "", "/one/src/Button.tsx", "/one")).not.toBe(
      await classFor("build", "", "/two/src/Button.tsx", "/two"),
    );
  });

  it("reproduces identity across checkout paths for the same named package", () => {
    const code = `import { styled } from '${PACKAGE}'; const Button = styled.button\`color:red;\`;`;
    const compileAt = (checkout: string) =>
      compile(code, `${checkout}/src/Button.tsx`, {
        ast: context().parse(code) as any,
        root: checkout,
        packageIdentity: "@example/ui",
      })!.code.match(/ss-Button-[a-z0-9]+/)?.[0];
    expect(compileAt("/checkout/one")).toBe("ss-Button-1m7pymyozff7g");
    expect(compileAt("/different/location")).toBe("ss-Button-1m7pymyozff7g");
    expect(compileAt("C:\\checkout\\one")).toBe("ss-Button-1m7pymyozff7g");
  });

  it("rejects extracted source outside its package root", () => {
    const code = `import { css } from '${PACKAGE}'; const token = css\`color:red;\`;`;
    expect(() =>
      compile(code, "/external/token.ts", {
        ast: context().parse(code) as any,
        root: "/project",
        packageIdentity: "app",
      }),
    ).toThrow("outside package root");
  });
});

describe("variants and security", () => {
  it("uses explicit equality and own-property checks", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    const result = await transform(
      plugin,
      `import { css, cssVariants } from '${PACKAGE}';
const classes = cssVariants({ variants: { tone: { calm: css\`color: blue;\`, danger: css\`color: red;\` } }, defaultVariants: { tone: "calm" } });`,
    );
    expect(result!.code).toContain('=== "calm"');
    expect(result!.code).toContain("Object.hasOwn");
    expect(result!.code).not.toContain("+ variants[");

    const componentResult = await transform(
      plugin,
      `import { css, styledVariants } from '${PACKAGE}';
const Button = styledVariants({ component: "button", variants: { tone: { calm: css\`color: blue;\` } }, defaultVariants: { tone: "calm" } });`,
      "/project/src/component.tsx",
    );
    expect(componentResult!.code).toContain('Object.hasOwn(props, "tone")');
    expect(componentResult!.code).toContain('Object.hasOwn(props, "className")');

    const executable = componentResult!.code.replace(/^import .*$/gm, "");
    const Button = Function(
      "createElement",
      "mergeClassNames",
      `${executable}\nreturn Button;`,
    )(
      (tag: string, props: Record<string, unknown>) => ({ tag, props }),
      (...values: unknown[]) => values.filter(Boolean).join(" "),
    ) as (props: Record<string, unknown>) => {
      props: { className: string; id: string };
    };
    const inherited = Object.assign(Object.create({ tone: "danger", className: "inherited" }), {
      id: "safe",
    });
    const rendered = Button(inherited);
    expect(rendered.props.id).toBe("safe");
    expect(rendered.props.className).toContain("--tone-calm");
    expect(rendered.props.className).not.toContain("inherited");

    const cssExecutable = result!.code.replace(/^import .*$/gm, "");
    const classes = Function(`${cssExecutable}\nreturn classes;`)() as (variants?: {
      tone?: string;
    }) => string;
    expect(classes({ tone: undefined })).toContain("--tone-calm");
    expect(classes(Object.create({ tone: "danger" }))).toContain("--tone-calm");
  });

  it("ignores inherited className on normal styled components", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    const result = await transform(
      plugin,
      `import { styled } from '${PACKAGE}';
const Box = styled.div\`color: blue;\`;`,
    );
    const executable = result!.code.replace(/^import .*$/gm, "");
    const Box = Function(
      "createElement",
      "mergeClassNames",
      `${executable}\nreturn Box;`,
    )(
      (tag: string, props: Record<string, unknown>) => ({ tag, props }),
      (...values: unknown[]) => values.filter(Boolean).join(" "),
    ) as (props: Record<string, unknown>) => { props: { className: string } };
    expect(Box(Object.create({ className: "inherited" })).props.className).not.toContain(
      "inherited",
    );
  });

  it("rejects unknown defaults and compounds", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    await expect(
      transform(
        plugin,
        `import { css, cssVariants } from '${PACKAGE}'; const x = cssVariants({ variants: { tone: { calm: css\`\` } }, defaultVariants: { tone: "missing" } });`,
      ),
    ).rejects.toThrow("Unknown default variant");
  });
});

describe("Vite lifecycle", () => {
  it("lets Vite own development style injection and CSS HMR", async () => {
    const entry = "/project/entry.ts";
    let source = `import { css } from "${PACKAGE}";
export const token = css\`color:integration-red;\`;`;
    const fixture: Plugin = {
      name: "styled-static-test-fixture",
      enforce: "pre",
      resolveId(id) {
        if (id === "/entry.ts" || id === entry) return entry;
      },
      load(id) {
        if (id === entry) return source;
      },
    };
    const acceptUpdates: Plugin = {
      name: "styled-static-test-hmr-boundary",
      enforce: "post",
      transform(code, id) {
        if (id === entry) return `${code}\nif (import.meta.hot) import.meta.hot.accept();`;
      },
    };
    const server = await createServer({
      configFile: false,
      root: "/project",
      logLevel: "silent",
      server: { middlewareMode: true },
      resolve: {
        alias: { [PACKAGE]: resolve(import.meta.dir, "index.ts") },
      },
      plugins: [fixture, styledStatic(), acceptUpdates],
    });

    try {
      const firstEntry = await server.environments.client.transformRequest("/entry.ts");
      const styleModule = Array.from(
        server.environments.client.moduleGraph.idToModuleMap.values(),
      ).find((module) => module.id?.startsWith("\0virtual:styled-static/"));
      expect(styleModule).toBeDefined();

      const firstStyle = await server.environments.client.transformRequest(styleModule!.url);
      expect(firstStyle?.code).toContain("integration-red");
      expect(firstStyle?.code).toContain("__vite__updateStyle");
      expect(firstStyle?.code).toContain("__vite__removeStyle");
      expect(firstStyle?.code).toContain("sourceURL=/project/entry.ts");

      const update = new Promise<{ updates: Array<{ path: string }> }>((resolveUpdate, reject) => {
        const timeout = setTimeout(() => reject(new Error("Vite HMR update timed out")), 5_000);
        server.environments.client.hot.send = (payload) => {
          if (payload.type !== "update") return;
          clearTimeout(timeout);
          resolveUpdate(payload);
        };
      });

      source = `import { css } from "${PACKAGE}";
export const token = css\`color:integration-blue;\`;`;
      server.watcher.emit("change", entry);

      const payload = await update;
      expect(payload.updates.some(({ path }) => path.includes("virtual:styled-static/"))).toBe(
        true,
      );

      const secondEntry = await server.environments.client.transformRequest("/entry.ts");
      const secondStyle = await server.environments.client.transformRequest(styleModule!.url);
      expect(secondStyle?.code).toContain("integration-blue");
      expect(secondStyle?.code).not.toContain("integration-red");
      expect(secondEntry?.code.match(/ss-token-[a-z0-9]+/)?.[0]).toBe(
        firstEntry?.code.match(/ss-token-[a-z0-9]+/)?.[0],
      );
    } finally {
      await server.close();
    }
  });

  it("normalizes query-bearing source ids and exposes the exact source in development CSS", async () => {
    const plugin = styledStatic();
    configure(plugin, "serve");
    const result = await transform(
      plugin,
      `import { css } from '${PACKAGE}'; const token = css\`color:red;\`;`,
      '/project/src/a*/weird"name.ts?direct',
    );
    const id = cssImports(result!.code)[0]!;
    const loaded = String(load(plugin, `\0${id}`));
    expect(id).toEndWith(".css");
    expect(loaded).toContain("color:red");
    expect(loaded).toContain("sourceURL=/project/src/a*");
    expect(loaded).toContain('weird"name.ts');
    expect(loaded).not.toContain("document.");
    expect(loaded).not.toContain("data-ss-id");
    expect(loaded).not.toContain("import.meta.hot");
  });

  it("invalidates every style record owned by the changed module", async () => {
    const plugin = styledStatic();
    configure(plugin, "serve");
    const result = await transform(
      plugin,
      `import { css } from '${PACKAGE}'; const one = css\`a{}\`; const two = css\`b{}\`;`,
      "/project/src/styles.ts?direct",
    );
    const invalidateModule = mock(() => {});
    const requestedIds: string[] = [];
    const getModuleById = mock((id: string) => {
      requestedIds.push(id);
      return { id };
    });
    const sourceModule = { id: "/project/src/styles.ts" };
    const affected = (plugin.handleHotUpdate as Function)({
      file: "/project/src/styles.ts",
      modules: [sourceModule],
      server: { moduleGraph: { getModuleById, invalidateModule } },
    });
    expect(requestedIds).toEqual(cssImports(result!.code).map((id) => `\0${id}`));
    expect(invalidateModule).toHaveBeenCalledTimes(2);
    expect(affected).toEqual([sourceModule, ...requestedIds.map((id) => ({ id }))]);
  });

  it("clears style records when the last definition is deleted", async () => {
    const plugin = styledStatic();
    configure(plugin, "serve");
    const file = "/project/src/styles.ts";
    const styled = await transform(
      plugin,
      `import { css } from '${PACKAGE}'; const token = css\`color: stale-red;\`;`,
      file,
    );
    const styleId = cssImports(styled!.code)[0]!;
    expect(String(load(plugin, `\0${styleId}`))).toContain("stale-red");

    expect(await transform(plugin, `import { css } from '${PACKAGE}';`, file)).toBeNull();
    expect(String(load(plugin, `\0${styleId}`))).not.toContain("stale-red");
  });

  it("returns raw CSS for apps and emits colocated CSS imports for libraries", async () => {
    const app = styledStatic();
    configure(app, "build");
    const appResult = await transform(
      app,
      `import { css } from '${PACKAGE}'; const x = css\`a{}\`;`,
    );
    expect(loadCss(app, appResult!.code)).toContain("a{}");

    const library = styledStatic();
    configure(library, "build", true);
    const libraryResult = await transform(
      library,
      `import { css } from '${PACKAGE}'; const x = css\`a{}\`;`,
    );
    const emitted: unknown[] = [];
    const chunk = {
      type: "chunk",
      code: libraryResult!.code,
      map: libraryResult!.map,
      moduleIds: ["/project/src/example.tsx"],
    };
    (library.generateBundle as Function).call(
      { ...context(), emitFile: (asset: unknown) => emitted.push(asset) },
      { format: "es" },
      { "index.js": chunk },
    );
    expect(emitted).toEqual([
      { type: "asset", fileName: "index.css", source: expect.stringContaining("a{}") },
    ]);
    expect(chunk.code).toStartWith('import "./index.css";');
  });

  it("rejects library formats that cannot carry a static CSS dependency", async () => {
    const library = styledStatic();
    configure(library, "build", true);
    const result = await transform(
      library,
      `import { css } from '${PACKAGE}'; const x = css\`a{}\`;`,
    );
    const chunk = {
      type: "chunk",
      code: result!.code,
      map: result!.map,
      moduleIds: ["/project/src/example.tsx"],
    };
    expect(() =>
      (library.generateBundle as Function).call(
        {
          ...context(),
          error: (message: string) => {
            throw new Error(message);
          },
        },
        { format: "umd" },
        { "index.umd.js": chunk },
      ),
    ).toThrow("cannot link a static stylesheet");
  });

  it("returns a source map when it adds a library CSS import", async () => {
    const library = styledStatic();
    configure(library, "build", true);
    const result = await transform(
      library,
      `import { css } from '${PACKAGE}'; const x = css\`a{}\`;`,
    );

    const chunk = {
      type: "chunk",
      code: result!.code,
      map: result!.map,
      moduleIds: ["/project/src/example.tsx"],
    };
    (library.generateBundle as Function).call(
      { ...context(), emitFile: () => {} },
      { format: "es" },
      { "index.js": chunk },
    );

    expect(chunk.code).toStartWith('import "./index.css";');
    expect(chunk.map).toBeDefined();
  });
});

describe("small pure helpers", () => {
  it("hashes deterministically without practical collisions in representative input", () => {
    const values = new Set(
      Array.from({ length: 10_000 }, (_, index) => hash(`.item-${index}{color:${index}}`)),
    );
    expect(values.size).toBe(10_000);
  });

  it("rewrites only side-effect styling imports", () => {
    const code = `import "virtual:styled-static/a.css";\nexport const value = 1;`;
    const ast = context().parse(code);
    expect(rewriteCssImports(code, "chunks/value.css", ast as any).code).toBe(
      `import "./value.css";\n\nexport const value = 1;`,
    );
    expect(rewriteCssImports(code, "chunks/value.css", ast as any, "cjs").code).toBe(
      `require("./value.css");\n\nexport const value = 1;`,
    );
  });

  it("preserves JavaScript values that contain Vite's empty CSS marker", () => {
    const code = 'import "virtual:styled-static/a.css";\nexport const marker = "/* empty css */";';
    const ast = context().parse(code);

    expect(rewriteCssImports(code, "value.css", ast as any).code).toContain(
      'export const marker = "/* empty css */";',
    );
  });
});
