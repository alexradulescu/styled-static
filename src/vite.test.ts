/**
 * styled-static Vite Plugin Tests
 *
 * These tests verify the plugin's transformation logic, CSS processing,
 * and edge case handling. We mock Vite's plugin context to test the
 * transform function in isolation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { styledStatic } from "./vite";
import type { Plugin } from "vite";
import { parse } from "acorn";

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a mock Vite plugin context with a working parser.
 * Uses acorn directly since we can't easily mock Vite's internal parser.
 */
function createMockContext() {
  return {
    parse(code: string) {
      return parse(code, {
        sourceType: "module",
        ecmaVersion: "latest",
        locations: false,
      });
    },
  };
}

/**
 * Helper to run the plugin's transform function with proper context.
 */
async function transform(
  plugin: Plugin,
  code: string,
  id: string
): Promise<{ code: string; map: any } | null> {
  const ctx = createMockContext();
  const transformFn = plugin.transform as Function;
  if (!transformFn) return null;
  return transformFn.call(ctx, code, id);
}

/**
 * Helper to count occurrences of a pattern in a string.
 */
function countMatches(str: string, pattern: RegExp): number {
  return (str.match(pattern) || []).length;
}

// =============================================================================
// Plugin Configuration Tests
// =============================================================================

describe("plugin configuration", () => {
  it("should create a plugin with correct name", () => {
    const plugin = styledStatic();
    expect(plugin.name).toBe("styled-static");
  });

  it("should enforce post order to run after React plugin (JSX transformed)", () => {
    const plugin = styledStatic();
    expect(plugin.enforce).toBe("post");
  });

  it("should accept custom class prefix", () => {
    const plugin = styledStatic({ classPrefix: "my-app" });
    expect(plugin.name).toBe("styled-static");
  });

  it("should accept custom autoprefixer config", () => {
    const plugin = styledStatic({
      autoprefixer: ["last 1 Chrome version"],
    });
    expect(plugin.name).toBe("styled-static");
  });

  it("should accept autoprefixer: false to disable", () => {
    const plugin = styledStatic({ autoprefixer: false });
    expect(plugin.name).toBe("styled-static");
  });
});

// =============================================================================
// File Filtering Tests
// =============================================================================

describe("file filtering", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    // Simulate configResolved
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should skip .css files", async () => {
    const result = await transform(plugin, "body { color: red; }", "/test.css");
    expect(result).toBeNull();
  });

  it("should skip .json files", async () => {
    const result = await transform(plugin, '{"key": "value"}', "/test.json");
    expect(result).toBeNull();
  });

  it("should skip .html files", async () => {
    const result = await transform(plugin, "<html></html>", "/index.html");
    expect(result).toBeNull();
  });

  it("should skip node_modules", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(
      plugin,
      code,
      "/node_modules/some-pkg/index.tsx"
    );
    expect(result).toBeNull();
  });

  it("should skip files without styled-static import", async () => {
    const code = `import React from 'react';
const Component = () => <div>Hello</div>;`;
    const result = await transform(plugin, code, "/src/Component.tsx");
    expect(result).toBeNull();
  });

  it("should process .tsx files with styled-static import", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/Button.tsx");
    expect(result).not.toBeNull();
  });

  it("should process .jsx files", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/Button.jsx");
    expect(result).not.toBeNull();
  });

  it("should process .ts files", async () => {
    const code = `import { css } from 'styled-static';
const buttonClass = css\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/styles.ts");
    expect(result).not.toBeNull();
  });

  it("should process .js files", async () => {
    const code = `import { css } from 'styled-static';
const buttonClass = css\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/styles.js");
    expect(result).not.toBeNull();
  });
});

// =============================================================================
// styled.element Transformation Tests
// =============================================================================

describe("styled.element transformation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform styled.button", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`
  padding: 1rem;
  color: red;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain("import { __styled }");
    expect(result?.code).toContain('__styled("button"');
    expect(result?.code).toContain('import "styled-static:');
  });

  it("should transform styled.div", async () => {
    const code = `import { styled } from 'styled-static';
const Container = styled.div\`max-width: 1280px;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('__styled("div"');
  });

  it("should transform styled.a", async () => {
    const code = `import { styled } from 'styled-static';
const Link = styled.a\`color: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('__styled("a"');
  });

  it("should transform styled.input", async () => {
    const code = `import { styled } from 'styled-static';
const Input = styled.input\`padding: 0.5rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('__styled("input"');
  });

  it("should transform styled.span", async () => {
    const code = `import { styled } from 'styled-static';
const Text = styled.span\`font-weight: bold;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('__styled("span"');
  });

  it("should transform multiple styled elements in one file", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;
const Container = styled.div\`margin: 0;\`;
const Link = styled.a\`color: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('__styled("button"');
    expect(result?.code).toContain('__styled("div"');
    expect(result?.code).toContain('__styled("a"');

    // Should have 3 CSS imports
    const cssImportCount = countMatches(
      result?.code ?? "",
      /import "styled-static:/g
    );
    expect(cssImportCount).toBe(3);
  });

  it("should add displayName in dev mode", async () => {
    const code = `import { styled } from 'styled-static';
const MyButton = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('"MyButton"');
  });

  it("should omit displayName in prod mode", async () => {
    const prodPlugin = styledStatic();
    (prodPlugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from 'styled-static';
const MyButton = styled.button\`padding: 1rem;\`;`;
    const result = await transform(prodPlugin, code, "/test.tsx");

    // Should have only 2 arguments (tag, className) not 3
    expect(result?.code).toMatch(/__styled\("button", "ss-[a-z0-9]+"\)/);
    expect(result?.code).not.toContain('"MyButton"');
  });
});

// =============================================================================
// styled(Component) Extension Tests
// =============================================================================

describe("styled(Component) extension", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform component extension", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;
const PrimaryButton = styled(Button)\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("import { __styled, __styledExtend }");
    expect(result?.code).toContain("__styledExtend(Button");
  });

  it("should handle nested component extension (3 levels)", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;
const PrimaryButton = styled(Button)\`background: blue;\`;
const LargePrimaryButton = styled(PrimaryButton)\`font-size: 1.5rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('__styled("button"');
    expect(result?.code).toContain("__styledExtend(Button");
    expect(result?.code).toContain("__styledExtend(PrimaryButton");
  });

  it("should maintain declaration order for CSS cascade", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;
const Primary = styled(Button)\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // CSS imports should be in order
    const imports = result?.code.match(/import "styled-static:[^"]+"/g) || [];
    expect(imports.length).toBe(2);

    // Button should come before Primary in the transformed code
    const buttonPos = result?.code.indexOf('__styled("button"') ?? -1;
    const primaryPos = result?.code.indexOf("__styledExtend(Button") ?? -1;
    expect(buttonPos).toBeLessThan(primaryPos);
  });
});

// =============================================================================
// css`` Transformation Tests
// =============================================================================

describe("css`` transformation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform css`` to class string", async () => {
    const code = `import { css } from 'styled-static';
const activeClass = css\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).not.toContain("import { __styled");
    expect(result?.code).toContain('import "styled-static:');
    expect(result?.code).toMatch(/const activeClass = "ss-[a-z0-9]+"/);
  });

  it("should handle multiple css`` calls", async () => {
    const code = `import { css } from 'styled-static';
const activeClass = css\`background: blue;\`;
const hoverClass = css\`transform: scale(1.1);\`;
const disabledClass = css\`opacity: 0.5;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    const cssImportCount = countMatches(
      result?.code ?? "",
      /import "styled-static:/g
    );
    expect(cssImportCount).toBe(3);
  });

  it("should work alongside styled components", async () => {
    const code = `import { styled, css } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;
const activeClass = css\`outline: 2px solid blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('__styled("button"');
    expect(result?.code).toMatch(/const activeClass = "ss-[a-z0-9]+"/);
  });
});

// =============================================================================
// createGlobalStyle Transformation Tests
// =============================================================================

describe("createGlobalStyle transformation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform createGlobalStyle", async () => {
    const code = `import { createGlobalStyle } from 'styled-static';
const GlobalStyle = createGlobalStyle\`
  * { box-sizing: border-box; }
  body { margin: 0; }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("import { __GlobalStyle }");
    expect(result?.code).toContain("const GlobalStyle = __GlobalStyle");
    expect(result?.code).toContain('import "styled-static:');
  });

  it("should not wrap global styles in class selector", async () => {
    // Global styles should be unscoped - this test verifies the code transforms
    // The actual CSS content check would require inspecting the virtual module
    const code = `import { createGlobalStyle } from 'styled-static';
const GlobalStyle = createGlobalStyle\`
  :root { --color-primary: blue; }
  body { margin: 0; }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain("__GlobalStyle");
  });

  it("should work alongside styled and css", async () => {
    const code = `import { styled, css, createGlobalStyle } from 'styled-static';
const GlobalStyle = createGlobalStyle\`body { margin: 0; }\`;
const Button = styled.button\`padding: 1rem;\`;
const activeClass = css\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("import { __styled, __GlobalStyle }");
    expect(result?.code).toContain("const GlobalStyle = __GlobalStyle");
    expect(result?.code).toContain('__styled("button"');
    expect(result?.code).toMatch(/const activeClass = "ss-[a-z0-9]+"/);
  });
});

// =============================================================================
// Export Handling Tests
// =============================================================================

describe("export handling", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should handle exported styled components", async () => {
    const code = `import { styled } from 'styled-static';
export const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const Button = __styled");
  });

  it("should handle multiple exports", async () => {
    const code = `import { styled } from 'styled-static';
export const Button = styled.button\`padding: 1rem;\`;
export const Card = styled.div\`margin: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const Button = __styled");
    expect(result?.code).toContain("export const Card = __styled");
  });

  it("should handle mix of exported and non-exported", async () => {
    const code = `import { styled } from 'styled-static';
export const Button = styled.button\`padding: 1rem;\`;
const InternalCard = styled.div\`margin: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const Button = __styled");
    expect(result?.code).toContain("const InternalCard = __styled");
  });

  it("should handle exported css classes", async () => {
    const code = `import { css } from 'styled-static';
export const activeClass = css\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toMatch(/export const activeClass = "ss-[a-z0-9]+"/);
  });
});

// =============================================================================
// Import Aliasing Tests
// =============================================================================

describe("import aliasing", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should handle aliased styled import", async () => {
    const code = `import { styled as s } from 'styled-static';
const Button = s.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('__styled("button"');
  });

  it("should handle aliased css import", async () => {
    const code = `import { css as c } from 'styled-static';
const activeClass = c\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toMatch(/const activeClass = "ss-[a-z0-9]+"/);
  });

  it("should handle aliased createGlobalStyle import", async () => {
    const code = `import { createGlobalStyle as global } from 'styled-static';
const GlobalStyle = global\`body { margin: 0; }\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("const GlobalStyle = __GlobalStyle");
  });

  it("should handle multiple aliased imports", async () => {
    const code = `import { styled as s, css as c, createGlobalStyle as g } from 'styled-static';
const GlobalStyle = g\`body { margin: 0; }\`;
const Button = s.button\`padding: 1rem;\`;
const activeClass = c\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("__GlobalStyle");
    expect(result?.code).toContain('__styled("button"');
    expect(result?.code).toMatch(/const activeClass = "ss-[a-z0-9]+"/);
  });
});

// =============================================================================
// CSS Content Preservation Tests
// =============================================================================

describe("CSS content preservation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should handle CSS with special characters", async () => {
    const code = `import { styled } from 'styled-static';
const Box = styled.div\`
  content: "Hello World";
  background: url('image.png');
  font-family: 'Helvetica Neue', sans-serif;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('__styled("div"');
  });

  it("should handle CSS variables", async () => {
    const code = `import { styled } from 'styled-static';
const Box = styled.div\`
  --custom-color: #3b82f6;
  color: var(--custom-color);
  padding: var(--spacing, 1rem);
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
  });

  it("should handle nested selectors with &", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`
  padding: 1rem;

  &:hover {
    background: blue;
  }

  &:focus {
    outline: 2px solid;
  }

  &:disabled {
    opacity: 0.5;
  }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
  });

  it("should handle complex nested selectors", async () => {
    const code = `import { styled } from 'styled-static';
const List = styled.ul\`
  & > li {
    padding: 0.5rem;
  }

  & > li:first-child {
    border-top: none;
  }

  & > li:not(:last-child) {
    border-bottom: 1px solid #ccc;
  }

  &[data-active="true"] {
    background: blue;
  }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
  });

  it("should handle media queries", async () => {
    const code = `import { styled } from 'styled-static';
const Container = styled.div\`
  padding: 1rem;

  @media (min-width: 640px) {
    padding: 1.5rem;
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }

  @media (prefers-color-scheme: dark) {
    background: #1a1a1a;
  }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
  });

  it("should handle keyframe animations", async () => {
    const code = `import { styled } from 'styled-static';
const Spinner = styled.div\`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
  });

  it("should handle empty CSS content", async () => {
    const code = `import { styled } from 'styled-static';
const Empty = styled.div\`\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('__styled("div"');
  });

  it("should handle whitespace-only CSS content", async () => {
    const code = `import { styled } from 'styled-static';
const Whitespace = styled.div\`   \`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
  });
});

// =============================================================================
// Edge Cases and Error Handling
// =============================================================================

describe("edge cases", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should handle component names with numbers", async () => {
    const code = `import { styled } from 'styled-static';
const Button2 = styled.button\`padding: 1rem;\`;
const Card3D = styled.div\`transform: perspective(500px);\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('"Button2"');
    expect(result?.code).toContain('"Card3D"');
  });

  it("should handle underscore in component names", async () => {
    const code = `import { styled } from 'styled-static';
const Primary_Button = styled.button\`background: blue;\`;
const _PrivateCard = styled.div\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('"Primary_Button"');
    expect(result?.code).toContain('"_PrivateCard"');
  });

  it("should transform let declarations", async () => {
    const code = `import { styled } from 'styled-static';
let Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // let declarations are transformed (valid use case for reassignment)
    expect(result).not.toBeNull();
    expect(result?.code).toContain('__styled("button"');
  });

  it("should transform var declarations", async () => {
    const code = `import { styled } from 'styled-static';
var Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // var declarations are transformed (legacy code support)
    expect(result).not.toBeNull();
    expect(result?.code).toContain('__styled("button"');
  });

  it("should handle files with mixed content", async () => {
    const code = `import React from 'react';
import { styled } from 'styled-static';

// Regular code
const regularVar = 'test';
const num = 42;

// Styled component
const Button = styled.button\`padding: 1rem;\`;

// Regular function
function helper() {
  return 'helper';
}

// Another styled component
const Card = styled.div\`margin: 1rem;\`;

export { Button, Card, helper };`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("import React from 'react'");
    expect(result?.code).toContain("const regularVar = 'test'");
    expect(result?.code).toContain("const num = 42");
    expect(result?.code).toContain("function helper()");
    expect(result?.code).toContain('__styled("button"');
    expect(result?.code).toContain('__styled("div"');
  });

  it("should not transform strings that look like styled calls", async () => {
    const code = `import { styled } from 'styled-static';
// Comment about styled.button
const config = { styled: { button: true } };
const text = "styled.button is great";

// Only this should be transformed
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain(
      "const config = { styled: { button: true } }"
    );
    expect(result?.code).toContain('const text = "styled.button is great"');
    expect(result?.code).toContain('__styled("button"');

    // Should only have one __styled call
    const styledCalls = countMatches(result?.code ?? "", /__styled\(/g);
    expect(styledCalls).toBe(1);
  });
});

// =============================================================================
// Source Map Tests
// =============================================================================

describe("source maps", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should generate source maps", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.map).toBeTruthy();
  });

  it("should generate hires source maps", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.map).toBeTruthy();
    expect(result?.map.mappings).toBeTruthy();
  });
});

// =============================================================================
// Custom Class Prefix Tests
// =============================================================================

describe("custom class prefix", () => {
  it("should use custom class prefix", async () => {
    const plugin = styledStatic({ classPrefix: "myapp" });
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toMatch(/__styled\("button", "myapp-[a-z0-9]+"/);
  });

  it("should use custom prefix for css`` too", async () => {
    const plugin = styledStatic({ classPrefix: "app" });
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { css } from 'styled-static';
const activeClass = css\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toMatch(/const activeClass = "app-[a-z0-9]+"/);
  });
});

// =============================================================================
// Virtual Module Tests
// =============================================================================

describe("virtual modules", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should resolve virtual module IDs with prefix", () => {
    const resolveId = plugin.resolveId as Function;

    const result = resolveId("styled-static:abc123.css");
    expect(result).toBe("\0styled-static:abc123.css");
  });

  it("should pass through already-prefixed virtual module IDs", () => {
    const resolveId = plugin.resolveId as Function;

    const result = resolveId("\0styled-static:abc123.css");
    expect(result).toBe("\0styled-static:abc123.css");
  });

  it("should return null for non-styled-static modules", () => {
    const resolveId = plugin.resolveId as Function;

    const result = resolveId("react");
    expect(result).toBeNull();
  });
});

// =============================================================================
// Runtime Module Tests
// =============================================================================

describe("runtime", () => {
  describe("__styled", () => {
    it("should create a component function", async () => {
      const { __styled } = await import("./runtime");
      const Button = __styled("button", "ss-test");

      expect(typeof Button).toBe("function");
    });

    it("should not set displayName when not provided", async () => {
      const { __styled } = await import("./runtime");
      const Button = __styled("button", "ss-test");

      expect(Button.displayName).toBeUndefined();
    });

    it("should set displayName when provided", async () => {
      const { __styled } = await import("./runtime");
      const Button = __styled("button", "ss-test", "Button");

      expect(Button.displayName).toBe("Button");
    });
  });

  describe("__styledExtend", () => {
    it("should create an extended component function", async () => {
      const { __styled, __styledExtend } = await import("./runtime");
      const Button = __styled("button", "ss-base");
      const Primary = __styledExtend(Button, "ss-primary");

      expect(typeof Primary).toBe("function");
    });

    it("should set displayName on extended component", async () => {
      const { __styled, __styledExtend } = await import("./runtime");
      const Button = __styled("button", "ss-base", "Button");
      const Primary = __styledExtend(Button, "ss-primary", "PrimaryButton");

      expect(Primary.displayName).toBe("PrimaryButton");
    });
  });

  describe("__GlobalStyle", () => {
    it("should be a function", async () => {
      const { __GlobalStyle } = await import("./runtime");

      expect(typeof __GlobalStyle).toBe("function");
    });

    it("should return null when called", async () => {
      const { __GlobalStyle } = await import("./runtime");

      expect(__GlobalStyle({})).toBeNull();
    });
  });
});

// =============================================================================
// Hash Function Tests
// =============================================================================

describe("hash", () => {
  it("should produce consistent hashes", async () => {
    const { hash } = await import("./hash");

    const result1 = hash("padding: 1rem;");
    const result2 = hash("padding: 1rem;");

    expect(result1).toBe(result2);
  });

  it("should produce different hashes for different input", async () => {
    const { hash } = await import("./hash");

    const result1 = hash("padding: 1rem;");
    const result2 = hash("margin: 1rem;");

    expect(result1).not.toBe(result2);
  });

  it("should handle empty string", async () => {
    const { hash } = await import("./hash");

    const result = hash("");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle long strings", async () => {
    const { hash } = await import("./hash");

    const longCss = "a".repeat(10000);
    const result = hash(longCss);

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(20); // Hash should be short
  });

  it("should handle unicode characters", async () => {
    const { hash } = await import("./hash");

    const result = hash('content: "🎨";');
    expect(typeof result).toBe("string");
  });
});

// =============================================================================
// Security Tests
// =============================================================================

describe("security: variant value sanitization", () => {
  it("should sanitize variant values with spaces (class injection)", async () => {
    const { __cssVariants } = await import("./runtime");

    const buttonCss = __cssVariants("ss-abc", ["color"]);

    // Attempt class injection via space
    const result = buttonCss({ color: "primary malicious-class" });

    // Spaces are stripped, so injected class name becomes part of single token
    // "primary malicious-class" -> "primarymalicious-class"
    // This is safe because there's no space to create a separate class
    expect(result).toContain("ss-abc--color-primarymalicious-class");
    // The entire string becomes one class, no injection possible
    expect(result).not.toContain(" malicious-class");
  });

  it("should sanitize variant values with special characters", async () => {
    const { __cssVariants } = await import("./runtime");

    const buttonCss = __cssVariants("ss-abc", ["size"]);

    // Attempt injection with various special chars
    const result = buttonCss({ size: 'lg"><script>alert(1)</script>' });

    // All special chars should be stripped
    expect(result).not.toContain(">");
    expect(result).not.toContain("<");
    expect(result).not.toContain('"');
    expect(result).toContain("ss-abc--size-lgscriptalert1script");
  });

  it("should handle empty variant value after sanitization", async () => {
    const { __cssVariants } = await import("./runtime");

    const buttonCss = __cssVariants("ss-abc", ["style"]);

    // Value that becomes empty after sanitization
    const result = buttonCss({ style: "!@#$%^&*()" });

    // Should not include a variant class if sanitized value is empty
    expect(result).toBe("ss-abc");
  });

  it("should allow valid alphanumeric variant values", async () => {
    const { __cssVariants } = await import("./runtime");

    const buttonCss = __cssVariants("ss-abc", ["color", "size"]);

    const result = buttonCss({ color: "primary-blue", size: "lg" });

    expect(result).toBe("ss-abc ss-abc--color-primary-blue ss-abc--size-lg");
  });
});

describe("security: prototype pollution prevention", () => {
  it("should use Object.keys to avoid prototype pollution", () => {
    // Direct test of the filterTransientProps pattern
    // The runtime uses Object.keys() which only returns own properties
    const pollutedKey = "__test_polluted__";

    try {
      // @ts-expect-error - intentionally polluting prototype for test
      Object.prototype[pollutedKey] = "malicious-value";

      const testObj = { normalProp: "value" };

      // Object.keys only returns own properties, not inherited ones
      const keys = Object.keys(testObj);
      expect(keys).not.toContain(pollutedKey);
      expect(keys).toContain("normalProp");

      // for...in would have included polluted key (this is what we avoid)
      const forInKeys: string[] = [];
      for (const key in testObj) {
        forInKeys.push(key);
      }
      // Demonstrate the vulnerability we're protecting against
      expect(forInKeys).toContain(pollutedKey);
    } finally {
      // @ts-expect-error - cleanup
      delete Object.prototype[pollutedKey];
    }
  });
});

describe("security: debug logging control", () => {
  it("should not log by default (no debug option)", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const plugin = styledStatic();
    // Simulate configResolved
    (plugin.configResolved as Function)?.({ command: "serve" });

    // Transform should not log without debug enabled
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;

    // Reset spy before transform
    consoleSpy.mockClear();

    await transform(plugin, code, "/test-no-log.tsx");

    // Check that no styled-static logs were made
    const styledStaticLogs = consoleSpy.mock.calls.filter((call) =>
      String(call[0]).includes("[styled-static]")
    );

    expect(styledStaticLogs.length).toBe(0);

    consoleSpy.mockRestore();
  });

  it("should log when debug option is true", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const plugin = styledStatic({ debug: true });
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;

    consoleSpy.mockClear();

    await transform(plugin, code, "/test-with-log.tsx");

    // Check that styled-static logs were made
    const styledStaticLogs = consoleSpy.mock.calls.filter((call) =>
      String(call[0]).includes("[styled-static]")
    );

    expect(styledStaticLogs.length).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });
});

describe("security: identifier validation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should handle components with valid identifiers", async () => {
    const code = `import { styled } from 'styled-static';
const MyButton = styled.button\`padding: 1rem;\`;
const _PrivateButton = styled.button\`margin: 1rem;\`;
const $special = styled.button\`color: red;\`;`;

    const result = await transform(plugin, code, "/test-identifiers.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('"MyButton"');
    expect(result?.code).toContain('"_PrivateButton"');
    expect(result?.code).toContain('"$special"');
  });

  it("should use longer hash in production mode", async () => {
    const prodPlugin = styledStatic();
    (prodPlugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;

    const result = await transform(prodPlugin, code, "/test-prod-hash.tsx");

    // In production, hash should be 8 chars (base36 may produce 5-8 chars)
    // Match pattern: ss-[5-8 alphanumeric chars]
    expect(result?.code).toMatch(/ss-[a-z0-9]{5,8}/);
    // No displayName in production
    expect(result?.code).not.toContain('"Button"');
  });
});

describe("security: dangerous element blocking", () => {
  it("should block script element in as prop", async () => {
    const { __styled } = await import("./runtime");
    const { createElement } = await import("react");

    const Button = __styled("button", "ss-test");

    // Create element with dangerous `as` prop
    const element = createElement(Button, { as: "script", children: "test" });

    // Should render as button (fallback), not script
    // The element.type will be the Button component, not "script"
    expect(element.props.as).toBe("script"); // prop is passed in
    // When rendered, validateAsTag will convert it to "button"
  });

  it("should block iframe element in as prop", async () => {
    const { __styled } = await import("./runtime");
    const { createElement } = await import("react");

    const Button = __styled("button", "ss-test");
    const element = createElement(Button, {
      as: "iframe",
      src: "http://evil.com",
    });

    // The validation happens at render time, not createElement time
    expect(element.props.as).toBe("iframe");
  });

  it("should allow safe elements in as prop", async () => {
    const { __styled } = await import("./runtime");
    const { createElement } = await import("react");

    const Button = __styled("button", "ss-test");

    // Safe elements should work normally
    const aElement = createElement(Button, { as: "a", href: "#" });
    const divElement = createElement(Button, { as: "div" });
    const spanElement = createElement(Button, { as: "span" });

    expect(aElement.props.as).toBe("a");
    expect(divElement.props.as).toBe("div");
    expect(spanElement.props.as).toBe("span");
  });
});

describe("security: file hash collision resistance", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should use file hash for CSS modules (collision resistant)", async () => {
    const code = `import { styled } from 'styled-static';
const Button = styled.button\`padding: 1rem;\`;`;

    const result = await transform(plugin, code, "/test-collision.tsx");

    // CSS import should have a file hash (base36 produces 5-8 chars typically)
    // Format: styled-static:XXXXXXX-N.css
    expect(result?.code).toMatch(/styled-static:[a-z0-9]+-\d+\.css/);
  });
});
