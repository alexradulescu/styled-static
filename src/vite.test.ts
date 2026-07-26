import { parse } from "acorn";
import { describe, expect, it, mock } from "bun:test";
import type { Plugin } from "vite";
import { rewriteCssImports } from "./codegen";
import { compile } from "./compiler";
import { hash } from "./hash";
import { styledStatic } from "./vite";

const PACKAGE = "@alex.radulescu/styled-static";

function context() {
  return {
    parse(code: string) {
      return parse(code, { sourceType: "module", ecmaVersion: "latest" });
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

function cssImports(code: string): string[] {
  return Array.from(
    code.matchAll(/import "(virtual:styled-static\/[^"]+)";/g),
    (match) => match[1]!,
  );
}

function loadCss(plugin: Plugin, transformed: string): string {
  return cssImports(transformed)
    .map((id) => String((plugin.load as Function)(`\0${id}`)))
    .join("\n");
}

describe("public plugin contract", () => {
  it("is option-free and runs after the React transform", () => {
    const plugin = styledStatic();
    expect(plugin.name).toBe("styled-static");
    expect(plugin.enforce).toBe("post");
    expect(styledStatic.length).toBe(0);
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

  it("ignores unrelated packages and non-code modules", async () => {
    const plugin = styledStatic();
    configure(plugin, "build");
    expect(
      await transform(plugin, `import { css } from './styled-static';`, "/project/a.ts"),
    ).toBeNull();
    expect(
      await transform(plugin, `import { css } from '${PACKAGE}';`, "/project/a.css"),
    ).toBeNull();
    expect(
      await transform(plugin, `import { css } from '${PACKAGE}';`, "/project/node_modules/a.ts"),
    ).toBeNull();
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
        development: false,
      })!.code.match(/ss-Button-[a-z0-9]+/)?.[0];
    expect(compileAt("/checkout/one")).toBe(compileAt("/different/location"));
  });

  it("rejects extracted source outside its package root", () => {
    const code = `import { css } from '${PACKAGE}'; const token = css\`color:red;\`;`;
    expect(() =>
      compile(code, "/external/token.ts", {
        ast: context().parse(code) as any,
        root: "/project",
        packageIdentity: "app",
        development: false,
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
  it("normalizes query-bearing source ids and exposes the exact source in development CSS", async () => {
    const plugin = styledStatic();
    configure(plugin, "serve");
    const result = await transform(
      plugin,
      `import { css } from '${PACKAGE}'; const token = css\`color:red;\`;`,
      '/project/src/a*/weird"name.ts?direct',
    );
    const id = cssImports(result!.code)[0]!;
    const loaded = String((plugin.load as Function)(`\0${id}`));
    expect(loaded).toContain("sourceURL=/project/src/a*");
    expect(loaded).toContain('weird\\"name.ts');
    expect(loaded).toContain('getAttribute("data-ss-id") === id');
    expect(loaded).toContain("const style = existing ?? document.createElement");
    expect(loaded).not.toContain("existing.remove");
    expect(loaded).not.toContain("import.meta.hot.dispose");
    expect(loaded).toContain("import.meta.hot.prune");
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
    (plugin.handleHotUpdate as Function)({
      file: "/project/src/styles.ts",
      server: { moduleGraph: { getModuleById, invalidateModule } },
    });
    expect(requestedIds).toEqual(cssImports(result!.code).map((id) => `\0${id}`));
    expect(invalidateModule).toHaveBeenCalledTimes(2);
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
    expect(String((plugin.load as Function)(`\0${styleId}`))).toContain("stale-red");

    expect(await transform(plugin, `import { css } from '${PACKAGE}';`, file)).toBeNull();
    expect(String((plugin.load as Function)(`\0${styleId}`))).not.toContain("stale-red");
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
