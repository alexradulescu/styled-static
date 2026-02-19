/**
 * styled-static Vite Plugin Tests
 *
 * These tests verify the plugin's transformation logic, CSS processing,
 * and edge case handling. We mock Vite's plugin context to test the
 * transform function in isolation.
 */
import { parse } from "acorn";
import type { Plugin } from "vite";
import {  beforeEach, describe, expect, it, vi } from "vitest";
import { styledStatic } from "./vite";

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
    const code = `import { styled } from '@alex.radulescu/styled-static';
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/Button.tsx");
    expect(result).not.toBeNull();
  });

  it("should process .jsx files", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/Button.jsx");
    expect(result).not.toBeNull();
  });

  it("should process .ts files", async () => {
    const code = `import { css } from '@alex.radulescu/styled-static';
const buttonClass = css\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/styles.ts");
    expect(result).not.toBeNull();
  });

  it("should process .js files", async () => {
    const code = `import { css } from '@alex.radulescu/styled-static';
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`
  padding: 1rem;
  color: red;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('import { createElement } from "react"');
    expect(result?.code).toContain('import { m } from "@alex.radulescu/styled-static/runtime"');
    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain('import "virtual:styled-static/');
  });

  it("should transform styled.div", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Container = styled.div\`max-width: 1280px;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('createElement("div"');
  });

  it("should transform styled.a", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Link = styled.a\`color: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('createElement("a"');
  });

  it("should transform styled.input", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Input = styled.input\`padding: 0.5rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('createElement("input"');
  });

  it("should transform styled.span", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Text = styled.span\`font-weight: bold;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('createElement("span"');
  });

  it("should transform multiple styled elements in one file", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;
const Container = styled.div\`margin: 0;\`;
const Link = styled.a\`color: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain('createElement("div"');
    expect(result?.code).toContain('createElement("a"');

    // Should have 3 CSS imports
    const cssImportCount = countMatches(
      result?.code ?? "",
      /import "virtual:styled-static\//g
    );
    expect(cssImportCount).toBe(3);
  });

  it("should generate inline component with Object.assign pattern", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const MyButton = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // Should use Object.assign pattern for inline component
    expect(result?.code).toContain("Object.assign");
    expect(result?.code).toContain(".className");
  });

  it("should generate consistent output in prod mode", async () => {
    const prodPlugin = styledStatic();
    (prodPlugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const MyButton = styled.button\`padding: 1rem;\`;`;
    const result = await transform(prodPlugin, code, "/test.tsx");

    // Should use Object.assign pattern
    expect(result?.code).toContain("Object.assign");
    expect(result?.code).toMatch(/className: "ss-[a-z0-9]+"/);
  });
});

// =============================================================================
// styled.element.attrs() Tests
// =============================================================================

describe("styled.element.attrs() transformation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform styled.input.attrs with type", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const PasswordInput = styled.input.attrs({ type: 'password' })\`
  padding: 0.5rem;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('createElement("input"');
    // Should spread attrs before props
    expect(result?.code).toContain("{ type: 'password' }");
    expect(result?.code).toContain("Object.assign");
  });

  it("should transform styled.button.attrs with type submit", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const SubmitButton = styled.button.attrs({ type: 'submit' })\`
  background: blue;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain("{ type: 'submit' }");
  });

  it("should transform styled.a.attrs with target blank", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const ExternalLink = styled.a.attrs({ target: '_blank', rel: 'noopener noreferrer' })\`
  color: blue;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('createElement("a"');
    expect(result?.code).toContain("target: '_blank'");
    expect(result?.code).toContain("rel: 'noopener noreferrer'");
  });

  it("should spread attrs before props for correct override behavior", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Input = styled.input.attrs({ type: 'text', placeholder: 'Enter...' })\`
  padding: 0.5rem;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // Pattern should be: {...attrs, ...p, className: m(...)}
    // This ensures user props override default attrs
    expect(result?.code).toMatch(/\{\.\.\..*type.*placeholder.*\}/);
    expect(result?.code).toContain("...p");
  });

  it("should handle exported attrs components", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
export const PasswordInput = styled.input.attrs({ type: 'password' })\`
  padding: 0.5rem;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const PasswordInput = Object.assign");
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;
const PrimaryButton = styled(Button)\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // Should render Button component with extended className
    expect(result?.code).toContain("createElement(Button");
    // Should concatenate base className
    expect(result?.code).toContain("Button.className");
  });

  it("should handle nested component extension (3 levels)", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;
const PrimaryButton = styled(Button)\`background: blue;\`;
const LargePrimaryButton = styled(PrimaryButton)\`font-size: 1.5rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain("createElement(Button");
    expect(result?.code).toContain("createElement(PrimaryButton");
    expect(result?.code).toContain("PrimaryButton.className");
  });

  it("should maintain declaration order for CSS cascade", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;
const Primary = styled(Button)\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // CSS imports should be in order
    const imports = result?.code.match(/import "virtual:styled-static\/[^"]+"/g) || [];
    expect(imports.length).toBe(2);

    // Button should come before Primary in the transformed code
    const buttonPos = result?.code.indexOf('createElement("button"') ?? -1;
    const primaryPos = result?.code.indexOf("createElement(Button") ?? -1;
    expect(buttonPos).toBeLessThan(primaryPos);
  });
});

// =============================================================================
// withComponent Transformation Tests
// =============================================================================

describe("withComponent transformation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform withComponent with component reference", async () => {
    const code = `import { styled, withComponent } from '@alex.radulescu/styled-static';
import { Link } from 'react-router-dom';

const Button = styled.button\`padding: 1rem;\`;
const LinkButton = withComponent(Link, Button);`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    // Should generate inline component with Button.className
    expect(result?.code).toContain("Object.assign");
    expect(result?.code).toContain("createElement(Link");
    expect(result?.code).toContain("Button.className");
  });

  it("should transform withComponent with HTML tag string", async () => {
    const code = `import { styled, withComponent } from '@alex.radulescu/styled-static';

const Button = styled.button\`padding: 1rem;\`;
const AnchorButton = withComponent('a', Button);`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('createElement("a"');
    expect(result?.code).toContain("Button.className");
  });

  it("should handle exported withComponent", async () => {
    const code = `import { styled, withComponent } from '@alex.radulescu/styled-static';
import { Link } from 'react-router-dom';

const Button = styled.button\`padding: 1rem;\`;
export const LinkButton = withComponent(Link, Button);`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const LinkButton = Object.assign");
  });

  it("should work with extended components", async () => {
    const code = `import { styled, withComponent } from '@alex.radulescu/styled-static';
import { Link } from 'react-router-dom';

const Button = styled.button\`padding: 1rem;\`;
const Primary = styled(Button)\`background: blue;\`;
const PrimaryLink = withComponent(Link, Primary);`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("createElement(Link");
    expect(result?.code).toContain("Primary.className");
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
    const code = `import { css } from '@alex.radulescu/styled-static';
const activeClass = css\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // css`` only needs the CSS import, no runtime
    expect(result?.code).not.toContain("import { createElement");
    expect(result?.code).toContain('import "virtual:styled-static/');
    // In dev mode, uses readable class name: ss-VariableName-Filename
    expect(result?.code).toContain('const activeClass = "ss-activeClass-test"');
  });

  it("should handle multiple css`` calls", async () => {
    const code = `import { css } from '@alex.radulescu/styled-static';
const activeClass = css\`background: blue;\`;
const hoverClass = css\`transform: scale(1.1);\`;
const disabledClass = css\`opacity: 0.5;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    const cssImportCount = countMatches(
      result?.code ?? "",
      /import "virtual:styled-static\//g
    );
    expect(cssImportCount).toBe(3);
  });

  it("should work alongside styled components", async () => {
    const code = `import { styled, css } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;
const activeClass = css\`outline: 2px solid blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain('const activeClass = "ss-activeClass-test"');
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
    const code = `import { createGlobalStyle } from '@alex.radulescu/styled-static';
const GlobalStyle = createGlobalStyle\`
  * { box-sizing: border-box; }
  body { margin: 0; }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // createGlobalStyle now returns () => null (no-op component)
    expect(result?.code).toContain("const GlobalStyle = () => null");
    expect(result?.code).toContain('import "virtual:styled-static/');
    // No runtime needed for createGlobalStyle
    expect(result?.code).not.toContain("import { createElement");
  });

  it("should not wrap global styles in class selector", async () => {
    // Global styles should be unscoped - this test verifies the code transforms
    // The actual CSS content check would require inspecting the virtual module
    const code = `import { createGlobalStyle } from '@alex.radulescu/styled-static';
const GlobalStyle = createGlobalStyle\`
  :root { --color-primary: blue; }
  body { margin: 0; }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain("() => null");
  });

  it("should work alongside styled and css", async () => {
    const code = `import { styled, css, createGlobalStyle } from '@alex.radulescu/styled-static';
const GlobalStyle = createGlobalStyle\`body { margin: 0; }\`;
const Button = styled.button\`padding: 1rem;\`;
const activeClass = css\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('import { createElement } from "react"');
    expect(result?.code).toContain('import { m } from "@alex.radulescu/styled-static/runtime"');
    expect(result?.code).toContain("const GlobalStyle = () => null");
    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain('const activeClass = "ss-activeClass-test"');
  });
});

// =============================================================================
// keyframes Transformation Tests
// =============================================================================

describe("keyframes transformation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform keyframes to animation name string", async () => {
    const code = `import { keyframes } from '@alex.radulescu/styled-static';
const spin = keyframes\`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    // keyframes should become a string (like css) - dev mode uses readable names
    expect(result?.code).toContain('const spin = "ss-spin-test"');
    expect(result?.code).toContain('import "virtual:styled-static/');
    // No runtime needed for keyframes
    expect(result?.code).not.toContain("import { createElement");
  });

  it("should handle keyframes used in styled component", async () => {
    const code = `import { styled, keyframes } from '@alex.radulescu/styled-static';
const spin = keyframes\`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
\`;
const Spinner = styled.div\`
  animation: \${spin} 1s linear infinite;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    // Both keyframes and styled should be transformed - dev mode uses readable names
    expect(result?.code).toContain('const spin = "ss-spin-test"');
    expect(result?.code).toContain('createElement("div"');
  });

  it("should handle exported keyframes", async () => {
    const code = `import { keyframes } from '@alex.radulescu/styled-static';
export const fadeIn = keyframes\`
  from { opacity: 0; }
  to { opacity: 1; }
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('export const fadeIn = "ss-fadeIn-test"');
  });

  it("should handle multiple keyframes declarations", async () => {
    const code = `import { keyframes } from '@alex.radulescu/styled-static';
const spin = keyframes\`from { transform: rotate(0deg); } to { transform: rotate(360deg); }\`;
const fadeIn = keyframes\`from { opacity: 0; } to { opacity: 1; }\`;
const slideIn = keyframes\`from { transform: translateX(-100%); } to { transform: translateX(0); }\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // Should have 3 CSS imports
    const cssImportCount = countMatches(
      result?.code ?? "",
      /import "virtual:styled-static\//g
    );
    expect(cssImportCount).toBe(3);
  });
});

// =============================================================================
// styledVariants Transformation Tests
// =============================================================================

describe("styledVariants transformation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform styledVariants with HTML tag", async () => {
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    size: {
      sm: css\`font-size: 0.875rem;\`,
      lg: css\`font-size: 1.25rem;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain("Object.assign");
    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain('import "virtual:styled-static/');
  });

  it("should transform styledVariants extending a component", async () => {
    const code = `import { styled, styledVariants, css } from '@alex.radulescu/styled-static';
const BaseButton = styled.button\`padding: 1rem;\`;
const Button = styledVariants({
  component: BaseButton,
  css: css\`border: none;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    // Should extend BaseButton
    expect(result?.code).toContain("createElement(BaseButton");
    expect(result?.code).toContain("BaseButton.className");
  });

  it("should handle multiple variant dimensions", async () => {
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
    size: {
      sm: css\`font-size: 0.875rem;\`,
      lg: css\`font-size: 1.25rem;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    // Should destructure variant props
    expect(result?.code).toContain("color");
    expect(result?.code).toContain("size");
    // Should have variant class conditions
    expect(result?.code).toContain('=== "primary"');
    expect(result?.code).toContain('=== "sm"');
  });

  it("should handle exported styledVariants", async () => {
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
export const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    size: { sm: css\`font-size: 0.875rem;\` },
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const Button = Object.assign");
  });

  it("should handle styledVariants with plain template literal css", async () => {
    const code = `import { styledVariants } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: \`padding: 1rem;\`,
  variants: {
    size: { sm: \`font-size: 0.875rem;\` },
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain("Object.assign");
  });

  it("should apply defaultVariants as default parameter values", async () => {
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    size: {
      sm: css\`font-size: 0.875rem;\`,
      md: css\`font-size: 1rem;\`,
      lg: css\`font-size: 1.25rem;\`,
    },
    intent: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
  },
  defaultVariants: {
    size: 'md',
    intent: 'primary',
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    // Default values should appear in the destructure
    expect(result?.code).toContain('size = "md"');
    expect(result?.code).toContain('intent = "primary"');
  });

  it("should generate compoundVariants CSS with combined selectors", async () => {
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    size: {
      sm: css\`font-size: 0.875rem;\`,
      lg: css\`font-size: 1.25rem;\`,
    },
    intent: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
  },
  compoundVariants: [
    {
      size: 'lg',
      intent: 'danger',
      css: css\`font-weight: 900; text-transform: uppercase;\`,
    },
  ],
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    // Component should still work normally
    expect(result?.code).toContain("Object.assign");
    expect(result?.code).toContain("createElement");
  });

  it("should handle both defaultVariants and compoundVariants together", async () => {
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    size: { sm: css\`font-size: 0.875rem;\`, lg: css\`font-size: 1.25rem;\` },
    intent: { primary: css\`background: blue;\`, danger: css\`background: red;\` },
  },
  defaultVariants: {
    size: 'sm',
    intent: 'primary',
  },
  compoundVariants: [
    { size: 'lg', intent: 'danger', css: css\`font-weight: bold;\` },
  ],
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('size = "sm"');
    expect(result?.code).toContain('intent = "primary"');
  });
});

// =============================================================================
// cssVariants Transformation Tests
// =============================================================================

describe("cssVariants transformation", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should transform cssVariants to function", async () => {
    const code = `import { cssVariants, css } from '@alex.radulescu/styled-static';
const buttonClass = cssVariants({
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    // cssVariants becomes a function that returns class string
    expect(result?.code).toContain("(variants) =>");
    expect(result?.code).toContain('variants.color === "primary"');
    expect(result?.code).toContain('import "virtual:styled-static/');
    // No createElement needed
    expect(result?.code).not.toContain("createElement");
  });

  it("should handle multiple variant dimensions in cssVariants", async () => {
    const code = `import { cssVariants, css } from '@alex.radulescu/styled-static';
const styles = cssVariants({
  css: css\`display: flex;\`,
  variants: {
    size: { sm: css\`gap: 0.5rem;\`, lg: css\`gap: 1rem;\` },
    align: { start: css\`align-items: start;\`, center: css\`align-items: center;\` },
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('variants.size === "sm"');
    expect(result?.code).toContain('variants.align === "start"');
  });

  it("should handle exported cssVariants", async () => {
    const code = `import { cssVariants, css } from '@alex.radulescu/styled-static';
export const buttonClass = cssVariants({
  css: css\`padding: 1rem;\`,
  variants: {
    color: { primary: css\`background: blue;\` },
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const buttonClass = (variants) =>");
  });

  it("should handle cssVariants with defaultVariants", async () => {
    const code = `import { cssVariants, css } from '@alex.radulescu/styled-static';
const buttonClass = cssVariants({
  css: css\`padding: 1rem;\`,
  variants: {
    size: { sm: css\`font-size: 0.875rem;\`, md: css\`font-size: 1rem;\`, lg: css\`font-size: 1.25rem;\` },
  },
  defaultVariants: {
    size: 'md',
  },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain("(variants) =>");
  });

  it("should handle cssVariants with compoundVariants", async () => {
    const code = `import { cssVariants, css } from '@alex.radulescu/styled-static';
const buttonClass = cssVariants({
  css: css\`padding: 1rem;\`,
  variants: {
    size: { sm: css\`font-size: 0.875rem;\`, lg: css\`font-size: 1.25rem;\` },
    intent: { primary: css\`background: blue;\`, danger: css\`background: red;\` },
  },
  compoundVariants: [
    { size: 'lg', intent: 'danger', css: css\`font-weight: bold;\` },
  ],
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain("(variants) =>");
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
export const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const Button = Object.assign");
  });

  it("should handle multiple exports", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
export const Button = styled.button\`padding: 1rem;\`;
export const Card = styled.div\`margin: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const Button = Object.assign");
    expect(result?.code).toContain("export const Card = Object.assign");
  });

  it("should handle mix of exported and non-exported", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
export const Button = styled.button\`padding: 1rem;\`;
const InternalCard = styled.div\`margin: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("export const Button = Object.assign");
    expect(result?.code).toContain("const InternalCard = Object.assign");
  });

  it("should handle exported css classes", async () => {
    const code = `import { css } from '@alex.radulescu/styled-static';
export const activeClass = css\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('export const activeClass = "ss-activeClass-test"');
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
    const code = `import { styled as s } from '@alex.radulescu/styled-static';
const Button = s.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('createElement("button"');
  });

  it("should handle aliased css import", async () => {
    const code = `import { css as c } from '@alex.radulescu/styled-static';
const activeClass = c\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('const activeClass = "ss-activeClass-test"');
  });

  it("should handle aliased createGlobalStyle import", async () => {
    const code = `import { createGlobalStyle as global } from '@alex.radulescu/styled-static';
const GlobalStyle = global\`body { margin: 0; }\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("const GlobalStyle = () => null");
  });

  it("should handle multiple aliased imports", async () => {
    const code = `import { styled as s, css as c, createGlobalStyle as g } from '@alex.radulescu/styled-static';
const GlobalStyle = g\`body { margin: 0; }\`;
const Button = s.button\`padding: 1rem;\`;
const activeClass = c\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("() => null");
    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain('const activeClass = "ss-activeClass-test"');
  });

  it("should handle aliased keyframes import", async () => {
    const code = `import { keyframes as kf } from '@alex.radulescu/styled-static';
const spin = kf\`from { transform: rotate(0deg); } to { transform: rotate(360deg); }\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain('const spin = "ss-spin-test"');
  });

  it("should handle aliased styledVariants import", async () => {
    const code = `import { styledVariants as sv, css } from '@alex.radulescu/styled-static';
const Button = sv({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: { size: { sm: css\`font-size: 0.875rem;\` } },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("Object.assign");
    expect(result?.code).toContain('createElement("button"');
  });

  it("should handle aliased cssVariants import", async () => {
    const code = `import { cssVariants as cv, css } from '@alex.radulescu/styled-static';
const styles = cv({
  css: css\`padding: 1rem;\`,
  variants: { size: { sm: css\`font-size: 0.875rem;\` } },
});`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("(variants) =>");
  });

  it("should handle aliased withComponent import", async () => {
    const code = `import { styled, withComponent as wc } from '@alex.radulescu/styled-static';
import { Link } from 'react-router-dom';
const Button = styled.button\`padding: 1rem;\`;
const LinkButton = wc(Link, Button);`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("createElement(Link");
    expect(result?.code).toContain("Button.className");
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Box = styled.div\`
  content: "Hello World";
  background: url('image.png');
  font-family: 'Helvetica Neue', sans-serif;
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('createElement("div"');
  });

  it("should handle CSS variables", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Box = styled.div\`
  --custom-color: #3b82f6;
  color: var(--custom-color);
  padding: var(--spacing, 1rem);
\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
  });

  it("should handle nested selectors with &", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Empty = styled.div\`\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('createElement("div"');
  });

  it("should handle whitespace-only CSS content", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button2 = styled.button\`padding: 1rem;\`;
const Card3D = styled.div\`transform: perspective(500px);\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // Should transform both components with inline pattern
    expect(result?.code).toContain("const Button2 = Object.assign");
    expect(result?.code).toContain("const Card3D = Object.assign");
  });

  it("should handle underscore in component names", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Primary_Button = styled.button\`background: blue;\`;
const _PrivateCard = styled.div\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("const Primary_Button = Object.assign");
    expect(result?.code).toContain("const _PrivateCard = Object.assign");
  });

  it("should transform let declarations", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
let Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // let declarations are transformed (valid use case for reassignment)
    expect(result).not.toBeNull();
    expect(result?.code).toContain('createElement("button"');
  });

  it("should transform var declarations", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
var Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // var declarations are transformed (legacy code support)
    expect(result).not.toBeNull();
    expect(result?.code).toContain('createElement("button"');
  });

  it("should handle files with mixed content", async () => {
    const code = `import React from 'react';
import { styled } from '@alex.radulescu/styled-static';

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
const Card = styled.div\`margin: 1rem.\`;

export { Button, Card, helper };`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.code).toContain("import React from 'react'");
    expect(result?.code).toContain("const regularVar = 'test'");
    expect(result?.code).toContain("const num = 42");
    expect(result?.code).toContain("function helper()");
    expect(result?.code).toContain('createElement("button"');
    expect(result?.code).toContain('createElement("div"');
  });

  it("should not transform strings that look like styled calls", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
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
    expect(result?.code).toContain('createElement("button"');

    // Should only have one Object.assign call (one styled component)
    const objectAssignCalls = countMatches(result?.code ?? "", /Object\.assign\(/g);
    expect(objectAssignCalls).toBe(1);
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    expect(result?.map).toBeTruthy();
  });

  it("should generate hires source maps", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
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

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // In dev mode, uses readable class name with custom prefix
    expect(result?.code).toContain('className: "myapp-Button-test"');
  });

  it("should use custom prefix for css`` too", async () => {
    const plugin = styledStatic({ classPrefix: "app" });
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { css } from '@alex.radulescu/styled-static';
const activeClass = css\`background: blue;\`;`;
    const result = await transform(plugin, code, "/test.tsx");

    // In dev mode, uses readable class name with custom prefix
    expect(result?.code).toContain('const activeClass = "app-activeClass-test"');
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

  it("should resolve new virtual module format with prefix", () => {
    const resolveId = plugin.resolveId as Function;

    const result = resolveId("virtual:styled-static//test.tsx/0.css");
    expect(result).toBe("\0virtual:styled-static//test.tsx/0.css");
  });

  it("should pass through already-prefixed new format virtual module IDs", () => {
    const resolveId = plugin.resolveId as Function;

    const result = resolveId("\0virtual:styled-static//test.tsx/0.css");
    expect(result).toBe("\0virtual:styled-static//test.tsx/0.css");
  });

  it("should return null for non-styled-static modules", () => {
    const resolveId = plugin.resolveId as Function;

    const result = resolveId("react");
    expect(result).toBeNull();
  });
});

// =============================================================================
// Minimal Runtime Tests
// =============================================================================

describe("minimal runtime", () => {
  it("should export class merge helper m()", async () => {
    const { m } = await import("./runtime/index");

    expect(typeof m).toBe("function");
  });

  it("should merge base and user className", async () => {
    const { m } = await import("./runtime/index");

    expect(m("ss-base", "user-class")).toBe("ss-base user-class");
  });

  it("should return base class when no user class", async () => {
    const { m } = await import("./runtime/index");

    expect(m("ss-base", undefined)).toBe("ss-base");
    expect(m("ss-base")).toBe("ss-base");
  });

  it("should handle empty user className", async () => {
    const { m } = await import("./runtime/index");

    // Empty string is falsy, so it returns base only
    expect(m("ss-base", "")).toBe("ss-base");
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

describe("security: build-time variant safety", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should generate explicit equality checks for variant values", async () => {
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test-variants.tsx");

    // Variants use explicit equality checks (===) not string interpolation
    expect(result?.code).toContain('=== "primary"');
    expect(result?.code).toContain('=== "danger"');
    // No dynamic string building with variant values
    expect(result?.code).not.toMatch(/\+ color\b/);
  });

  it("should use static class names for variants", async () => {
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    size: {
      sm: css\`font-size: 0.875rem;\`,
      lg: css\`font-size: 1.25rem;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test-static-variants.tsx");

    // Class names are hardcoded literals, not dynamically built from user input
    // In dev mode, uses readable format: ss-VariableName-Filename--variant-value
    expect(result?.code).toContain("ss-Button-teststaticvariants--size-sm");
    expect(result?.code).toContain("ss-Button-teststaticvariants--size-lg");
  });

  it("should generate correct cssVariants class names without variants. prefix", async () => {
    const code = `import { cssVariants, css } from '@alex.radulescu/styled-static';
const calloutStyles = cssVariants({
  css: css\`padding: 1rem;\`,
  variants: {
    type: {
      note: css\`background: blue;\`,
      tip: css\`background: green;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test-cssVariants.tsx");

    // Should use variants.type in condition check
    expect(result?.code).toContain('variants.type === "note"');
    expect(result?.code).toContain('variants.type === "tip"');
    // Class names should NOT contain "variants." - just the key name
    expect(result?.code).toMatch(/--type-note/);
    expect(result?.code).toMatch(/--type-tip/);
    expect(result?.code).not.toContain("--variants.type");
  });

  it("should use if/else for <= 4 total variant values", async () => {
    // 2 variants × 2 values = 4 total (at threshold, should use if/else)
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
    size: {
      sm: css\`font-size: 0.875rem;\`,
      lg: css\`font-size: 1.125rem;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test-threshold-4.tsx");

    // Should use if/else chain (original approach)
    expect(result?.code).toContain('if (color === "primary")');
    expect(result?.code).toContain('else if (color === "danger")');
    expect(result?.code).toContain('if (size === "sm")');
    // Should NOT have hoisted map
    expect(result?.code).not.toMatch(/const _vm\d+/);
  });

  it("should use hoisted map for > 4 total variant values", async () => {
    // 1 variant × 5 values = 5 total (above threshold, should use hoisted map)
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
      secondary: css\`background: gray;\`,
      success: css\`background: green;\`,
      danger: css\`background: red;\`,
      warning: css\`background: orange;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test-threshold-5.tsx");

    // Should have hoisted map declaration
    expect(result?.code).toMatch(/const _vm\d+=\{color:\{/);
    // Should use map lookup instead of if/else
    expect(result?.code).toMatch(/_vm\d+\.color\[color\]\|\|""/);
    // Should NOT have if/else chain for this variant
    expect(result?.code).not.toContain('if (color === "primary")');
  });

  it("should use hoisted map for complex multi-variant components", async () => {
    // 3 variants × 2 values each = 6 total (above threshold)
    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
    size: {
      sm: css\`font-size: 0.875rem;\`,
      lg: css\`font-size: 1.125rem;\`,
    },
    variant: {
      solid: css\`border: none;\`,
      outline: css\`border: 1px solid;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test-threshold-6.tsx");

    // Should have hoisted map with all three variant dimensions
    expect(result?.code).toMatch(/const _vm\d+=\{color:\{.*\},size:\{.*\},variant:\{.*\}\}/);
    // Should use map lookups
    expect(result?.code).toMatch(/_vm\d+\.color\[color\]\|\|""/);
    expect(result?.code).toMatch(/_vm\d+\.size\[size\]\|\|""/);
    expect(result?.code).toMatch(/_vm\d+\.variant\[variant\]\|\|""/);
  });

  it("should use hoisted map for cssVariants with > 4 values", async () => {
    const code = `import { cssVariants, css } from '@alex.radulescu/styled-static';
const calloutStyles = cssVariants({
  css: css\`padding: 1rem;\`,
  variants: {
    type: {
      note: css\`background: blue;\`,
      tip: css\`background: green;\`,
      warning: css\`background: orange;\`,
      danger: css\`background: red;\`,
      info: css\`background: cyan;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/test-cssVariants-hoisted.tsx");

    // Should have hoisted map
    expect(result?.code).toMatch(/const _vm\d+=\{type:\{/);
    // cssVariants uses variants.type in lookup
    expect(result?.code).toMatch(/_vm\d+\.type\[variants\.type\]\|\|""/);
  });
});

describe("security: prototype pollution prevention", () => {
  it("should use Object.keys to avoid prototype pollution", () => {
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
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

    const code = `import { styled } from '@alex.radulescu/styled-static';
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
    const code = `import { styled } from '@alex.radulescu/styled-static';
const MyButton = styled.button\`padding: 1rem;\`;
const _PrivateButton = styled.button\`margin: 1rem;\`;
const $special = styled.button\`color: red;\`;`;

    const result = await transform(plugin, code, "/test-identifiers.tsx");

    expect(result).not.toBeNull();
    // Should transform all components with Object.assign pattern
    expect(result?.code).toContain("const MyButton = Object.assign");
    expect(result?.code).toContain("const _PrivateButton = Object.assign");
    expect(result?.code).toContain("const $special = Object.assign");
  });

  it("should use longer hash in production mode", async () => {
    const prodPlugin = styledStatic();
    (prodPlugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;

    const result = await transform(prodPlugin, code, "/test-prod-hash.tsx");

    // In production, hash should be 8 chars (base36 may produce 5-8 chars)
    // Match pattern: ss-[5-8 alphanumeric chars]
    expect(result?.code).toMatch(/ss-[a-z0-9]{5,8}/);
    // Should use Object.assign pattern
    expect(result?.code).toContain("Object.assign");
  });
});

describe("security: file path based CSS modules", () => {
  let plugin: Plugin;

  beforeEach(() => {
    plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
  });

  it("should use file path in CSS module ID (for proper chunk association)", async () => {
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;

    const result = await transform(plugin, code, "/test-collision.tsx");

    // CSS import should include the source file path for chunk association
    // Format: virtual:styled-static/path/to/file.tsx/N.css (build) or .js (dev)
    expect(result?.code).toMatch(/virtual:styled-static\/.*\/\d+\.(css|js)/);
    expect(result?.code).toContain("test-collision.tsx");
  });
});

// =============================================================================
// cx Utility Tests
// =============================================================================

describe("cx utility", () => {
  it("should join class names", async () => {
    const { cx } = await import("./index");

    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("should filter falsy values", async () => {
    const { cx } = await import("./index");

    expect(cx("a", null, "b", undefined, "c", false)).toBe("a b c");
  });

  it("should handle empty input", async () => {
    const { cx } = await import("./index");

    expect(cx()).toBe("");
  });

  it("should handle single class", async () => {
    const { cx } = await import("./index");

    expect(cx("single")).toBe("single");
  });

  it("should work with conditional classes", async () => {
    const { cx } = await import("./index");

    const isActive = true;
    const isDisabled = false;

    expect(cx("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("should handle all falsy values", async () => {
    const { cx } = await import("./index");

    expect(cx(null, undefined, false, "")).toBe("");
  });
});

// =============================================================================
// Dev-friendly Class Names Tests
// =============================================================================

describe("dev-friendly class names", () => {
  it("should use variable name and filename in dev mode", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const MyButton = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/components/Button.tsx");

    expect(result).not.toBeNull();
    // Should use readable class name format: ss-VariableName-Filename
    expect(result?.code).toContain('className: "ss-MyButton-Button"');
  });

  it("should use hash in prod mode", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const MyButton = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/components/Button.tsx");

    expect(result).not.toBeNull();
    // Should use hash-based class name in prod
    expect(result?.code).toMatch(/className: "ss-[a-z0-9]+"/);
    expect(result?.code).not.toContain("ss-MyButton");
  });

  it("should handle css helper with variable name in dev mode", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { css } from '@alex.radulescu/styled-static';
const highlightClass = css\`background: yellow;\`;`;
    const result = await transform(plugin, code, "/src/styles/shared.tsx");

    expect(result).not.toBeNull();
    // Should use readable class name for css helper too
    expect(result?.code).toContain('"ss-highlightClass-shared"');
  });

  it("should handle styled extension with variable name in dev mode", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;
const PrimaryButton = styled(Button)\`background: blue;\`;`;
    const result = await transform(plugin, code, "/src/App.tsx");

    expect(result).not.toBeNull();
    expect(result?.code).toContain('className: "ss-Button-App"');
    expect(result?.code).toContain('"ss-PrimaryButton-App"');
  });

  it("should sanitize special characters in filename", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Box = styled.div\`display: flex;\`;`;
    const result = await transform(plugin, code, "/src/my-component.test.tsx");

    expect(result).not.toBeNull();
    // Special chars like - should be removed
    expect(result?.code).toContain('className: "ss-Box-mycomponenttest"');
  });
});

// =============================================================================
// Load Hook Tests
// =============================================================================

describe("load hook", () => {
  it("should return null for non-styled-static IDs", () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
    const load = plugin.load as Function;
    expect(load("\0other-plugin/module.css")).toBeNull();
  });

  it("should return null for IDs without virtual prefix", () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
    const load = plugin.load as Function;
    expect(load("regular-module.js")).toBeNull();
  });

  it("should return JS DOM injection code in dev mode", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test-load.tsx");
    expect(result).not.toBeNull();

    // Extract the virtual module import from the transformed output
    const importMatch = result!.code.match(/import "([^"]+)"/);
    expect(importMatch).not.toBeNull();

    const load = plugin.load as Function;
    // In dev mode the import uses .js extension; the load function maps it to .css key
    const virtualId = "\0" + importMatch![1];
    const loaded = load(virtualId);
    expect(loaded).toContain("document.createElement('style')");
    expect(loaded).toContain("import.meta.hot");
  });

  it("should return raw CSS in build mode with virtual output", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test-load-build.tsx");
    expect(result).not.toBeNull();

    const importMatch = result!.code.match(/import "([^"]+)"/);
    expect(importMatch).not.toBeNull();

    const load = plugin.load as Function;
    const virtualId = "\0" + importMatch![1];
    const loaded = load(virtualId);
    // Build mode virtual: returns raw CSS
    expect(loaded).toContain("padding: 1rem;");
    // Should NOT contain JS injection
    expect(loaded).not.toContain("document.createElement");
  });

  it("should return empty string in build mode with file output", async () => {
    const plugin = styledStatic({ cssOutput: "file" });
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test-load-file.tsx");
    expect(result).not.toBeNull();

    const importMatch = result!.code.match(/import "([^"]+)"/);
    expect(importMatch).not.toBeNull();

    const load = plugin.load as Function;
    const virtualId = "\0" + importMatch![1];
    const loaded = load(virtualId);
    expect(loaded).toBe("");
  });

  it("should handle CSS module with no matching entry gracefully", () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "build" });

    const load = plugin.load as Function;
    // Load a virtual module ID that was never registered via transform
    const loaded = load("\0virtual:styled-static/nonexistent/0.css");
    // Should return empty CSS (the fallback)
    expect(loaded).toBe("");
  });
});

// =============================================================================
// Resolve ID Hook Tests
// =============================================================================

describe("resolveId hook", () => {
  it("should resolve virtual:styled-static/ IDs", () => {
    const plugin = styledStatic();
    const resolveId = plugin.resolveId as Function;
    const result = resolveId("virtual:styled-static/test/0.css");
    expect(result).toBe("\0virtual:styled-static/test/0.css");
  });

  it("should pass through already-prefixed IDs", () => {
    const plugin = styledStatic();
    const resolveId = plugin.resolveId as Function;
    const result = resolveId("\0virtual:styled-static/test/0.css");
    expect(result).toBe("\0virtual:styled-static/test/0.css");
  });

  it("should return null for non-styled-static IDs", () => {
    const plugin = styledStatic();
    const resolveId = plugin.resolveId as Function;
    const result = resolveId("some-other-module");
    expect(result).toBeNull();
  });
});

// =============================================================================
// HMR (handleHotUpdate) Hook Tests
// =============================================================================

describe("handleHotUpdate hook", () => {
  it("should invalidate virtual modules for changed source files", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    // Transform a file to populate CSS modules
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    await transform(plugin, code, "/src/Button.tsx");

    const mockMod = { id: "mock-module" };
    const invalidateModule = vi.fn();
    const getModuleById = vi.fn().mockReturnValue(mockMod);
    const mockServer = {
      moduleGraph: { getModuleById, invalidateModule },
    };

    const handleHotUpdate = plugin.handleHotUpdate as Function;
    handleHotUpdate({ file: "/src/Button.tsx", server: mockServer });

    // Should have looked up and invalidated the module
    expect(getModuleById).toHaveBeenCalled();
    expect(invalidateModule).toHaveBeenCalledWith(mockMod);
  });

  it("should not invalidate modules for non-matching source files", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    await transform(plugin, code, "/src/Button.tsx");

    const getModuleById = vi.fn();
    const mockServer = {
      moduleGraph: { getModuleById, invalidateModule: vi.fn() },
    };

    const handleHotUpdate = plugin.handleHotUpdate as Function;
    // Different file that doesn't match
    handleHotUpdate({ file: "/src/Other.tsx", server: mockServer });

    // Should not find any matching modules
    expect(getModuleById).not.toHaveBeenCalled();
  });

  it("should ignore non-JS/TS files", () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const getModuleById = vi.fn();
    const mockServer = {
      moduleGraph: { getModuleById, invalidateModule: vi.fn() },
    };

    const handleHotUpdate = plugin.handleHotUpdate as Function;
    handleHotUpdate({ file: "/src/styles.css", server: mockServer });

    expect(getModuleById).not.toHaveBeenCalled();
  });

  it("should handle module not found in graph", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    await transform(plugin, code, "/src/Button.tsx");

    const invalidateModule = vi.fn();
    const getModuleById = vi.fn().mockReturnValue(null); // Module not in graph
    const mockServer = {
      moduleGraph: { getModuleById, invalidateModule },
    };

    const handleHotUpdate = plugin.handleHotUpdate as Function;
    handleHotUpdate({ file: "/src/Button.tsx", server: mockServer });

    expect(getModuleById).toHaveBeenCalled();
    // Should not try to invalidate null
    expect(invalidateModule).not.toHaveBeenCalled();
  });
});

// =============================================================================
// generateBundle Hook Tests
// =============================================================================

describe("generateBundle hook", () => {
  it("should emit CSS files in file output mode", async () => {
    const plugin = styledStatic({ cssOutput: "file" });
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    await transform(plugin, code, "/src/components/Button.tsx");

    const emitFile = vi.fn();
    const generateBundle = plugin.generateBundle as Function;
    const mockBundle: Record<string, any> = {
      "components/Button.js": {
        type: "chunk",
        moduleIds: ["/src/components/Button.tsx"],
        code: 'import "virtual:styled-static/something";\nconsole.log("test");',
      },
    };
    generateBundle.call({ emitFile }, {}, mockBundle);

    expect(emitFile).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "asset",
        fileName: "components/Button.css",
      })
    );
    // The chunk code should be rewritten to have relative CSS import
    expect(mockBundle["components/Button.js"].code).toContain(
      'import "./Button.css"'
    );
  });

  it("should skip chunks with no CSS", async () => {
    const plugin = styledStatic({ cssOutput: "file" });
    (plugin.configResolved as Function)?.({ command: "build" });

    const emitFile = vi.fn();
    const generateBundle = plugin.generateBundle as Function;
    const mockBundle: Record<string, any> = {
      "utils/helpers.js": {
        type: "chunk",
        moduleIds: ["/src/utils/helpers.ts"],
        code: 'console.log("no css here");',
      },
    };
    generateBundle.call({ emitFile }, {}, mockBundle);

    expect(emitFile).not.toHaveBeenCalled();
  });

  it("should skip non-chunk entries in bundle", async () => {
    const plugin = styledStatic({ cssOutput: "file" });
    (plugin.configResolved as Function)?.({ command: "build" });

    const emitFile = vi.fn();
    const generateBundle = plugin.generateBundle as Function;
    const mockBundle: Record<string, any> = {
      "styles.css": {
        type: "asset",
        source: "body { margin: 0; }",
      },
    };
    generateBundle.call({ emitFile }, {}, mockBundle);

    expect(emitFile).not.toHaveBeenCalled();
  });

  it("should be a no-op in virtual output mode", () => {
    const plugin = styledStatic(); // default: virtual
    (plugin.configResolved as Function)?.({ command: "build" });

    const emitFile = vi.fn();
    const generateBundle = plugin.generateBundle as Function;
    generateBundle.call({ emitFile }, {}, {});

    expect(emitFile).not.toHaveBeenCalled();
  });
});

// =============================================================================
// cssOutput Configuration Tests
// =============================================================================

describe("cssOutput configuration", () => {
  it("should default to virtual for non-library builds", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test-virtual.tsx");
    expect(result).not.toBeNull();
    // In virtual mode, CSS imports point to virtual modules
    expect(result!.code).toContain("virtual:styled-static/");
  });

  it("should auto-detect file mode for library builds", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({
      command: "build",
      build: { lib: { entry: "src/index.ts" } },
    });

    // generateBundle should emit files in this mode
    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    await transform(plugin, code, "/src/lib.tsx");

    const emitFile = vi.fn();
    const generateBundle = plugin.generateBundle as Function;
    const mockBundle: Record<string, any> = {
      "lib.js": {
        type: "chunk",
        moduleIds: ["/src/lib.tsx"],
        code: 'import "virtual:styled-static/something";',
      },
    };
    generateBundle.call({ emitFile }, {}, mockBundle);
    expect(emitFile).toHaveBeenCalled();
  });

  it("should use explicit virtual mode when configured", async () => {
    const plugin = styledStatic({ cssOutput: "virtual" });
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test-explicit-virtual.tsx");
    expect(result).not.toBeNull();
  });

  it("should use explicit file mode when configured", async () => {
    const plugin = styledStatic({ cssOutput: "file" });
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/test-explicit-file.tsx");
    expect(result).not.toBeNull();
  });
});

// =============================================================================
// Hash Remainder Byte Tests
// =============================================================================

describe("hash remainder bytes", () => {
  it("should handle string with 3 remainder bytes (length 7)", async () => {
    const { hash } = await import("./hash");
    // 7 chars: 4 processed in main loop, 3 remaining
    const result = hash("abcdefg");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle string with 2 remainder bytes (length 6)", async () => {
    const { hash } = await import("./hash");
    // 6 chars: 4 processed in main loop, 2 remaining
    const result = hash("abcdef");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle string with 1 remainder byte (length 5)", async () => {
    const { hash } = await import("./hash");
    // 5 chars: 4 processed in main loop, 1 remaining
    const result = hash("abcde");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle string with 0 remainder bytes (length 4)", async () => {
    const { hash } = await import("./hash");
    // 4 chars: exactly 4 processed, 0 remaining
    const result = hash("abcd");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should produce different hashes for different remainder lengths", async () => {
    const { hash } = await import("./hash");
    const h4 = hash("abcd");
    const h5 = hash("abcde");
    const h6 = hash("abcdef");
    const h7 = hash("abcdefg");
    // All should be unique
    const unique = new Set([h4, h5, h6, h7]);
    expect(unique.size).toBe(4);
  });
});

// =============================================================================
// Local Import Path Resolution Tests
// =============================================================================

describe("local import path resolution", () => {
  it("should resolve runtime path for ./index imports", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from './index';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/test-local.tsx");
    expect(result).not.toBeNull();
    expect(result!.code).toContain('from "./runtime"');
  });

  it("should resolve runtime path for ../index imports", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled } from '../index';
const Button = styled.button\`padding: 1rem;\`;`;
    const result = await transform(plugin, code, "/src/sub/test-local.tsx");
    expect(result).not.toBeNull();
    expect(result!.code).toContain('from "../runtime"');
  });
});

// =============================================================================
// Debug Mode Tests
// =============================================================================

describe("debug mode", () => {
  it("should log debug messages when debug is enabled", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const plugin = styledStatic({ debug: true });
    (plugin.configResolved as Function)?.({
      command: "serve",
      build: {},
    });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    await transform(plugin, code, "/src/Debug.tsx");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[styled-static]"),
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  it("should log when no templates or variants found after parsing imports", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const plugin = styledStatic({ debug: true });
    (plugin.configResolved as Function)?.({ command: "serve", build: {} });

    // Import cx (not styled/css) — has the import but no templates/variants
    const code = `import { cx } from '@alex.radulescu/styled-static';
const cls = cx("a", "b");`;
    const result = await transform(plugin, code, "/src/NoTemplates.tsx");

    // Should return null since cx doesn't need transformation
    expect(result).toBeNull();
    // Should have logged that no imports were found
    expect(consoleSpy).toHaveBeenCalledWith(
      "[styled-static] No imports found, skipping"
    );
    consoleSpy.mockRestore();
  });

  it("should log when parse error occurs", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const plugin = styledStatic({ debug: true });
    (plugin.configResolved as Function)?.({ command: "serve", build: {} });

    // Invalid JS that references styled-static
    const code = `import { styled } from '@alex.radulescu/styled-static';
const ??? = invalid syntax here;`;
    const result = await transform(plugin, code, "/src/BadFile.tsx");
    expect(result).toBeNull();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[styled-static] AST parse error:",
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  it("should log CSS output mode during configResolved", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const plugin = styledStatic({ debug: true });
    (plugin.configResolved as Function)?.({ command: "build", build: {} });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[styled-static] CSS output mode:")
    );
    consoleSpy.mockRestore();
  });

  it("should log generateBundle emit with debug enabled", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const plugin = styledStatic({ debug: true, cssOutput: "file" });
    (plugin.configResolved as Function)?.({ command: "build", build: {} });

    const code = `import { styled } from '@alex.radulescu/styled-static';
const Button = styled.button\`padding: 1rem;\`;`;
    await transform(plugin, code, "/src/comp/Dbg.tsx");

    const emitFile = vi.fn();
    const generateBundle = plugin.generateBundle as Function;
    generateBundle.call({ emitFile }, {}, {
      "comp/Dbg.js": {
        type: "chunk",
        moduleIds: ["/src/comp/Dbg.tsx"],
        code: 'import "virtual:styled-static/something";',
      },
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[styled-static] Emitted CSS file:")
    );
    consoleSpy.mockRestore();
  });
});

// =============================================================================
// Edge Cases: Import-but-no-use & Parse Errors
// =============================================================================

describe("edge cases for transform skip paths", () => {
  it("should skip when file imports only non-API exports like cx", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    // cx is exported but not transformed by the plugin
    const code = `import { cx } from '@alex.radulescu/styled-static';
const cls = cx("a", "b");`;
    const result = await transform(plugin, code, "/src/CxOnly.tsx");
    expect(result).toBeNull();
  });

  it("should skip when file has styled-static import but uses none of the APIs", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    // Import styled but never use it in a tagged template
    const code = `import { styled } from '@alex.radulescu/styled-static';
console.log(styled);`;
    const result = await transform(plugin, code, "/src/Unused.tsx");
    expect(result).toBeNull();
  });

  it("should handle AST parse errors gracefully", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    // Contains styled-static string so it passes the quick check,
    // but has syntax that acorn can't parse
    const code = `import { styled } from '@alex.radulescu/styled-static';
const 123invalid = "bad";`;
    const result = await transform(plugin, code, "/src/Bad.tsx");
    expect(result).toBeNull();
  });
});

// =============================================================================
// Variants in Prod Mode (build)
// =============================================================================

describe("variants in build mode", () => {
  it("should use hash-based class names for styledVariants in build mode", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { styledVariants } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: \`padding: 1rem;\`,
  variants: {
    color: {
      primary: \`background: blue;\`,
      danger: \`background: red;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/src/ProdVariant.tsx");
    expect(result).not.toBeNull();
    // In prod mode, should use hash-based names, not variable name
    expect(result!.code).not.toContain("ProdVariant");
    expect(result!.code).toContain("ss-");
  });

  it("should use hash-based class names for cssVariants in build mode", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "build" });

    const code = `import { cssVariants } from '@alex.radulescu/styled-static';
const buttonCss = cssVariants({
  css: \`padding: 1rem;\`,
  variants: {
    size: {
      sm: \`font-size: 0.875rem;\`,
      lg: \`font-size: 1.25rem;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/src/ProdCssVar.tsx");
    expect(result).not.toBeNull();
    expect(result!.code).toContain("ss-");
  });
});

// =============================================================================
// CompoundVariants with Template Literal CSS
// =============================================================================

describe("compoundVariants with template literal CSS", () => {
  it("should handle compoundVariants with plain template literal CSS", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styledVariants } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: \`padding: 1rem;\`,
  variants: {
    size: {
      sm: \`font-size: 0.875rem;\`,
      lg: \`font-size: 1.25rem;\`,
    },
    intent: {
      primary: \`background: blue;\`,
      danger: \`background: red;\`,
    },
  },
  compoundVariants: [
    { size: 'lg', intent: 'danger', css: \`font-weight: bold;\` },
  ],
});`;
    const result = await transform(plugin, code, "/src/CompoundTpl.tsx");
    expect(result).not.toBeNull();
    // Should generate compound variant CSS
    expect(result!.code).toContain("createElement");
  });
});

// =============================================================================
// Variant Edge Cases (branch coverage)
// =============================================================================

describe("variant branch coverage", () => {
  it("should handle cssVariants with no variant keys (base only)", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { cssVariants } from '@alex.radulescu/styled-static';
const baseCss = cssVariants({
  css: \`padding: 1rem;\`,
  variants: {},
});`;
    const result = await transform(plugin, code, "/src/BaseOnly.tsx");
    expect(result).not.toBeNull();
    // Should generate a function with just the base class, no variant logic
    expect(result!.code).toContain("(variants)");
    expect(result!.code).toContain("return c;");
  });

  it("should handle styledVariants with string literal CSS values", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styledVariants } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: 'padding: 1rem;',
  variants: {
    color: {
      primary: 'background: blue;',
      danger: 'background: red;',
    },
  },
});`;
    const result = await transform(plugin, code, "/src/StringLiterals.tsx");
    expect(result).not.toBeNull();
    expect(result!.code).toContain("createElement");
  });

  it("should handle cssVariants with string literal base CSS", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { cssVariants } from '@alex.radulescu/styled-static';
const btnCss = cssVariants({
  css: 'display: flex;',
  variants: {
    size: {
      sm: 'font-size: 12px;',
    },
  },
});`;
    const result = await transform(plugin, code, "/src/StrCssVar.tsx");
    expect(result).not.toBeNull();
  });

  it("should handle styledVariants with no base CSS", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styledVariants } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  variants: {
    color: {
      primary: \`background: blue;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/src/NoBase.tsx");
    expect(result).not.toBeNull();
    expect(result!.code).toContain("createElement");
  });

  it("should handle styledVariants with defaultVariants and > 4 values (hoisted map)", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styledVariants } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: \`padding: 1rem;\`,
  variants: {
    color: {
      red: \`color: red;\`,
      blue: \`color: blue;\`,
      green: \`color: green;\`,
      yellow: \`color: yellow;\`,
      purple: \`color: purple;\`,
    },
  },
  defaultVariants: {
    color: 'blue',
  },
});`;
    const result = await transform(plugin, code, "/src/HoistedDefaults.tsx");
    expect(result).not.toBeNull();
    // Should have hoisted map
    expect(result!.code).toContain("_vm");
    // Should have default value in destructuring
    expect(result!.code).toContain('color = "blue"');
  });

  it("should handle styledVariants extending a component", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styled, styledVariants } from '@alex.radulescu/styled-static';
const Base = styled.div\`display: flex;\`;
const Variant = styledVariants({
  component: Base,
  css: \`padding: 1rem;\`,
  variants: {
    size: {
      sm: \`font-size: 12px;\`,
      lg: \`font-size: 18px;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/src/ExtendVariant.tsx");
    expect(result).not.toBeNull();
    // Should reference Base.className
    expect(result!.code).toContain("Base.className");
  });

  it("should handle compoundVariants with string literal CSS", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styledVariants } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: \`padding: 1rem;\`,
  variants: {
    size: {
      sm: \`font-size: 12px;\`,
      lg: \`font-size: 18px;\`,
    },
    intent: {
      primary: \`background: blue;\`,
      danger: \`background: red;\`,
    },
  },
  compoundVariants: [
    { size: 'lg', intent: 'danger', css: 'font-weight: bold;' },
  ],
});`;
    const result = await transform(plugin, code, "/src/CompoundStr.tsx");
    expect(result).not.toBeNull();
  });

  it("should handle cssVariants with compoundVariants", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { cssVariants } from '@alex.radulescu/styled-static';
const btnCss = cssVariants({
  css: \`padding: 1rem;\`,
  variants: {
    size: {
      sm: \`font-size: 12px;\`,
      lg: \`font-size: 18px;\`,
    },
    intent: {
      primary: \`background: blue;\`,
      danger: \`background: red;\`,
    },
  },
  compoundVariants: [
    { size: 'lg', intent: 'danger', css: \`font-weight: bold;\` },
  ],
});`;
    const result = await transform(plugin, code, "/src/CssCompound.tsx");
    expect(result).not.toBeNull();
    // Should use variants.size style reference in cssVariants
    expect(result!.code).toContain("variants.");
  });
});

// =============================================================================
// Load Hook Edge Cases (branch coverage)
// =============================================================================

describe("load hook edge cases", () => {
  it("should handle dev mode load for nonexistent CSS module (no sourceFile)", () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });
    const load = plugin.load as Function;

    // Load a virtual module that doesn't exist in cssModules map
    const loaded = load("\0virtual:styled-static/nonexistent/0.js");
    // Should return JS injection code with empty CSS and no sourceURL
    expect(loaded).toContain("document.createElement('style')");
    // No sourceURL since sourceFile is ""
    expect(loaded).not.toContain("sourceURL");
  });
});

// =============================================================================
// Transform Import/Skip Edge Cases (branch coverage)
// =============================================================================

describe("transform import edge cases", () => {
  it("should return null when styled-static is imported but only non-API names used", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    // Import styled but use it as regular identifier, not template tag
    const code = `import { styled } from '@alex.radulescu/styled-static';
const x = styled;
export default x;`;
    const result = await transform(plugin, code, "/src/NoUse.tsx");
    // Found styled import, found templates: 0, variants: 0, withComponent: 0 → null
    expect(result).toBeNull();
  });

  it("should handle defaultVariants with non-string values (skips them)", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styledVariants } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: \`padding: 1rem;\`,
  variants: {
    size: {
      sm: \`font-size: 12px;\`,
      lg: \`font-size: 18px;\`,
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});`;
    const result = await transform(plugin, code, "/src/Defaults.tsx");
    expect(result).not.toBeNull();
    expect(result!.code).toContain('size = "sm"');
  });

  it("should handle variant config with tagged css template for base", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/src/CssTagged.tsx");
    expect(result).not.toBeNull();
  });

  it("should handle cssVariants with tagged css templates", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { cssVariants, css } from '@alex.radulescu/styled-static';
const btnCss = cssVariants({
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
    },
  },
});`;
    const result = await transform(plugin, code, "/src/CssTaggedVar.tsx");
    expect(result).not.toBeNull();
  });

  it("should handle compoundVariants with tagged css template", async () => {
    const plugin = styledStatic();
    (plugin.configResolved as Function)?.({ command: "serve" });

    const code = `import { styledVariants, css } from '@alex.radulescu/styled-static';
const Button = styledVariants({
  component: 'button',
  css: css\`padding: 1rem;\`,
  variants: {
    size: {
      sm: css\`font-size: 12px;\`,
      lg: css\`font-size: 18px;\`,
    },
    intent: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
  },
  compoundVariants: [
    { size: 'lg', intent: 'danger', css: css\`font-weight: bold;\` },
  ],
});`;
    const result = await transform(plugin, code, "/src/CompoundTagged.tsx");
    expect(result).not.toBeNull();
  });
});
