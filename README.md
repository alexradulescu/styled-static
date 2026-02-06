<!--
═══════════════════════════════════════════════════════════════════════════════
This README serves as both user documentation and LLM context (LLMs.txt).
It documents styled-static - a near-zero-runtime CSS-in-JS library for React 19+
with Vite. CSS is extracted at build time; minimal runtime handles dynamic features.

Key APIs: styled, css, createGlobalStyle, styledVariants, cssVariants, cx
Theme helpers: initTheme, setTheme, getTheme, onSystemThemeChange
Runtime: Minimal | Dependencies: 0 | React 19+ required | Vite only

For implementation details, see CLAUDE.md or the source files in src/
═══════════════════════════════════════════════════════════════════════════════
-->

# styled-static

Near-zero-runtime CSS-in-JS for React 19+ with Vite. Write styled-components syntax, get static CSS extracted at build time.

**What's "zero"?** CSS generation happens at build time (the expensive part). A minimal runtime (~45 bytes) handles className merging. Components are generated inline at build time.

## Features

- ⚡ **Static CSS** - All CSS extracted at build time, no runtime stylesheet generation
- 🎯 **Type-Safe** - Full TypeScript support with proper prop inference
- 🎨 **Familiar API** - styled-components syntax you already know
- 📦 **Tiny** - Minimal ~45 byte runtime for className merging only
- 🔧 **Zero Dependencies** - Uses native CSS features and Vite's built-in tools
- 🌳 **Inline Components** - Components generated at build time, no runtime factories
- 🌓 **Theme Helpers** - Simple utilities for dark mode and custom themes

---

## Quick Overview

All the APIs you need at a glance. styled-static provides 10 core functions that cover most CSS-in-JS use cases:

### styled.element

Style HTML elements with template literals:

```tsx
const Button = styled.button`
  padding: 0.5rem 1rem;
  ...
`;

const PrimaryButton = styled(Button)`
  font-weight: bold;
  ...
`;

const activeClass = css`
  outline: 2px solid blue;
  ...
`;

<Button className={isActive ? activeClass : ""}>Click</Button>;

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui; }
`;

<GlobalStyle />; // Render once at app root

// With css`` for IDE syntax highlighting (recommended)
const Button = styledVariants({
  component: "button",
  css: css`
    padding: 0.5rem 1rem;
    border-radius: 4px;
  `,
  variants: {
    size: {
      sm: css`
        font-size: 0.875rem;
      `,
      lg: css`
        font-size: 1.125rem;
      `,
    },
  },
});

<Button size="lg">Large Button</Button>;

const badgeCss = cssVariants({
  css: css`
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  `,
  variants: {
    color: {
      blue: css`
        background: #e0f2fe;
        color: #0369a1;
      `,
      green: css`
        background: #dcfce7;
        color: #166534;
      `,
    },
  },
});

<span className={badgeCss({ color: "blue" })}>Info</span>;

// Combine classes conditionally
<div className={cx("base", isActive && activeClass)} />;

// Default attributes
const PasswordInput = styled.input.attrs({ type: "password" })`
  padding: 0.5rem 1rem;
`;

// Polymorphism - render Link with Button's styles
import { Link } from "react-router-dom";
const LinkButton = withComponent(Link, Button);
<LinkButton to="/path">Router link styled as button</LinkButton>;
```

---

## Table of Contents

- [Quick Overview](#quick-overview) · [Why](#why-styled-static) · [What We Don't Do](#what-we-dont-do) · [Installation](#installation)
- **API:** [styled](#styled) · [Extension](#component-extension) · [css](#css-helper) · [keyframes](#keyframes) · [attrs](#attrs) · [cx](#cx-utility) · [Global Styles](#global-styles) · [Variants](#variants-api)
- **Features:** [Polymorphism](#polymorphism-with-withcomponent) · [.className](#manual-composition-with-classname) · [CSS Nesting](#css-nesting) · [Dynamic Styling](#dynamic-styling) · [Theming](#theming)
- **Internals:** [Troubleshooting](#troubleshooting) · [How It Works](#how-it-works) · [Config](#configuration) · [TypeScript](#typescript) · [Zero Deps](#zero-dependencies) · [Comparison](#comparison)

---

## Why styled-static?

- 🌐 **CSS evolved.** Native nesting, CSS variables, container queries—the gap between CSS and CSS-in-JS is smaller than ever.
- 😵 **CSS-in-JS fatigue.** Most libraries are obsolete, complex, or have large runtime overhead.
- ✨ **Syntactic sugar over CSS modules.** Better DX for writing CSS, without runtime interpolation.
- 🔒 **Zero dependencies.** Minimal attack surface. Nothing to audit.
- 🎯 **Intentionally simple.** 95% native browser + 5% sprinkles.
- 🎉 **Built for fun.** Curiosity-driven, useful code.

---

## What We Don't Do

- 🚫 **No runtime interpolation** — Can't write `${props => props.color}`. Use variants, CSS variables, or data attributes.
- ⚛️ **React 19+ only** — Uses automatic ref forwarding (no `forwardRef`).
- ⚡ **Vite only** — Uses Vite's AST parser and virtual modules. No Webpack/Rollup.
- 🚫 **No `css` prop** — Use named `css` variables with `className`.
- 🚫 **No `shouldForwardProp`** — Not needed. Variants auto-strip props.

Each constraint removes complexity—no CSS parsing, no forwardRef, one great integration.

---

## Installation

```bash
npm install @alex.radulescu/styled-static
# or
bun add @alex.radulescu/styled-static
```

Configure the Vite plugin:

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { styledStatic } from "@alex.radulescu/styled-static/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [styledStatic(), react()],
});
```

> **Note:** The plugin must be placed **before** the React plugin in the plugins array.

---

## API Reference

### styled

Create styled React components:

```tsx
import { styled } from "@alex.radulescu/styled-static";

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #2563eb;
  }
`;

// Usage
<Button onClick={handleClick}>Click me</Button>;
```

### Component Extension

Extend existing styled components by passing them to `styled()`:

```tsx
const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
`;

// Extend with additional styles
const PrimaryButton = styled(Button)`
  background: #3b82f6;
  color: white;
`;

// Chain extensions
const LargePrimaryButton = styled(PrimaryButton)`
  padding: 1rem 2rem;
  font-size: 1.25rem;
`;
```

**CSS Cascade Order:**
When components are extended, classes are ordered correctly:

- Base styles first
- Extension styles second (override base)
- User className last (override all)

```tsx
<LargePrimaryButton className="custom" />
// Renders: class="ss-base ss-primary ss-large custom"
```

### css Helper

Get a scoped class name for mixing with other classes:

```tsx
import { css } from '@alex.radulescu/styled-static';

const activeClass = css`
  outline: 2px solid blue;
`;

const highlightClass = css`
  box-shadow: 0 0 10px yellow;
`;

// Mix with styled components
<Button className={isActive ? activeClass : ''}>
  Conditional styling
</Button>

// Combine multiple classes
<div className={`${activeClass} ${highlightClass}`}>
  Multiple classes
</div>
```

### keyframes

Create scoped keyframe animations. The animation name is hashed to avoid conflicts between components:

```tsx
import { keyframes, styled } from "@alex.radulescu/styled-static";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Spinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid #3b82f6;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const PulsingDot = styled.div`
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: ${pulse} 2s ease-in-out infinite;
`;
```

Animation names are hashed at build time to avoid conflicts.

### attrs

Set default HTML attributes using `.attrs()`:

```tsx
const SubmitButton = styled.button.attrs({
  type: 'submit',
  'aria-label': 'Submit form',
})`
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
`;

<SubmitButton>Send</SubmitButton>
// Renders: <button type="submit" aria-label="Submit form" class="ss-xyz789">
```

> **Note:** attrs must be static objects (no functions). For dynamic attributes, use regular props.

### cx Utility

Combine class names conditionally. Intentionally flat (no nested arrays/objects) for minimal bundle size:

```tsx
import { css, cx } from '@alex.radulescu/styled-static';

const activeClass = css`color: blue;`;

cx('base', 'active')                    // → "base active"
cx('btn', isActive && activeClass)      // → "btn ss-abc123" or "btn"
cx('a', null, undefined, false, 'b')    // → "a b"
```

### Global Styles

```tsx
import { createGlobalStyle } from "@alex.radulescu/styled-static";

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: system-ui, sans-serif;
  }

  :root {
    --color-primary: #3b82f6;
    --color-text: #1a1a1a;
  }
`;

// Render once at app root
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalStyle />
    <App />
  </StrictMode>
);
```


### Variants API

For type-safe variant handling, use `styledVariants` to create components with variant props, or `cssVariants` to get class functions.

> **Tip:** Wrap CSS strings in `css\`...\`` to get IDE syntax highlighting from the styled-components VSCode extension.

#### styledVariants

```tsx
import { css, styledVariants } from "@alex.radulescu/styled-static";

const Button = styledVariants({
  component: "button",
  css: css`
    padding: 0.5rem 1rem;
    background: gray;
    color: white;
    font-size: 1rem;
  `,
  variants: {
    color: {
      primary: css`background: blue;`,
      danger: css`background: red;`,
      success: css`background: green;`,
    },
    size: {
      sm: css`font-size: 0.875rem; padding: 0.25rem 0.5rem;`,
      lg: css`font-size: 1.125rem; padding: 0.75rem 1.5rem;`,
    },
  },
  // Default variant values (applied when prop is undefined)
  defaultVariants: {
    color: "primary",
    size: "sm",
  },
  // Compound variants (special styles when multiple conditions match)
  compoundVariants: [
    {
      size: "lg",
      color: "danger",
      css: css`font-weight: 900; text-transform: uppercase;`,
    },
  ],
});

<Button>Click me</Button>
// Uses defaults: color="primary", size="sm"
// Renders: <button class="ss-abc ss-abc--color-primary ss-abc--size-sm">

<Button size="lg" color="danger">Delete</Button>
// Gets compound styles (font-weight: 900, text-transform: uppercase)
// Renders: <button class="ss-abc ss-abc--color-danger ss-abc--size-lg">
```

#### cssVariants

```tsx
import { cssVariants, css, cx } from '@alex.radulescu/styled-static';

// With css`` for syntax highlighting (recommended)
const badgeCss = cssVariants({
  css: css`
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  `,
  variants: {
    variant: {
      info: css`background: #e0f2fe; color: #0369a1;`,
      success: css`background: #dcfce7; color: #166534;`,
      warning: css`background: #fef3c7; color: #92400e;`,
    },
  },
  // defaultVariants and compoundVariants also work with cssVariants
});

// Usage - returns class string
<span className={badgeCss({ variant: 'info' })}>Info</span>
// Returns: "ss-xyz ss-xyz--variant-info"

// Combine with cx for conditional classes
<span className={cx(badgeCss({ variant: 'info' }), isActive && activeClass)}>
  Info
</span>
```

---

## Features

### Polymorphism with withComponent

Render one component with another's styles using `withComponent`:

```tsx
import { Link } from "react-router-dom";
import { styled, withComponent } from "@alex.radulescu/styled-static";

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: blue;
  color: white;
`;

// Create a Link that looks like Button
const LinkButton = withComponent(Link, Button);

// Also works with HTML tags
const AnchorButton = withComponent('a', Button);

// Usage
<LinkButton to="/path">Router link styled as button</LinkButton>
<AnchorButton href="/external">External link</AnchorButton>
```

`withComponent` accepts:

- **First argument**: The component to render (React component or HTML tag string)
- **Second argument**: The styled component whose styles to use

### Manual Composition with .className

Every styled component exposes a static `.className` property for manual composition:

```tsx
const Button = styled.button`
  padding: 0.5rem 1rem;
  background: blue;
`;

// Use className directly on any element
<a className={Button.className} href="/link">
  Link with button styles
</a>

// Combine with cx utility
<div className={cx(Button.className, Card.className, "custom")}>
  Combined styles
</div>
```

This is useful when you need button styles on a non-component element or want to combine multiple styled component classes.

### CSS Nesting

styled-static uses native CSS nesting (supported in all modern browsers):

```tsx
const Card = styled.div`
  padding: 1rem;
  background: white;
  border-radius: 8px;

  /* Pseudo-classes */
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* Child selectors */
  & h2 {
    margin: 0 0 0.5rem;
  }

  /* Media queries */
  @media (max-width: 640px) {
    padding: 0.5rem;
  }

  /* Pseudo-elements */
  &::before {
    content: "";
    position: absolute;
  }
`;
```

> **Tip:** Native CSS nesting means zero build-time processing. Your CSS is passed directly to the browser.

---

## Dynamic Styling

No runtime interpolation—use these patterns instead:
- **[Variants API](#variants-api)** — Type-safe component variants (recommended)
- **[cx utility](#cx-utility)** — Conditional class toggling
- **CSS variables** — Pass via `style` prop for truly dynamic values
- **Data attributes** — Style with `&[data-variant="x"]` selectors

---

## Theming

CSS-first theming with CSS variables and `data-theme` attributes:

```tsx
const GlobalStyle = createGlobalStyle`
  :root, [data-theme="light"] { --bg: #fff; --text: #1a1a1a; }
  [data-theme="dark"] { --bg: #0a0a0a; --text: #f1f5f9; }
  [data-theme="pokemon"] { --bg: #ffcb05; --text: #2a75bb; }
`;

const Card = styled.div`
  background: var(--bg);
  color: var(--text);
`;
```

### Theme Helpers

```tsx
import { initTheme, setTheme, getTheme, onSystemThemeChange } from "@alex.radulescu/styled-static";

// Initialize (reads localStorage → system preference → default)
initTheme({ defaultTheme: "light", useSystemPreference: true });

// Switch themes
setTheme("dark");              // persists to localStorage
setTheme("pokemon", false);    // no persist (preview)

// Read current
const current = getTheme();    // 'light' | 'dark' | etc.

// React to OS changes
const unsub = onSystemThemeChange((prefersDark) => {
  if (!localStorage.getItem("theme")) setTheme(prefersDark ? "dark" : "light", false);
});
```

| Function | Description |
| -------- | ----------- |
| `initTheme(options?)` | Init on load. Priority: localStorage → system → default |
| `setTheme(theme, persist?)` | Set theme. Persists to localStorage by default |
| `getTheme()` | Get current theme from `data-theme` |
| `onSystemThemeChange(cb)` | Subscribe to OS theme changes |

---

## Troubleshooting

### Storybook: "This package is ESM only"

If you see this error when using styled-static with Storybook:

```
Failed to resolve "@alex.radulescu/styled-static/vite".
This package is ESM only but it was tried to load by `require`.
```

Add the package to Vite's `optimizeDeps.include` in your Storybook config:

```ts
// .storybook/main.ts
export default {
  // ... other config
  viteFinal: async (config) => {
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      '@alex.radulescu/styled-static',
    ];
    return config;
  },
};
```

This is a known limitation with ESM-only packages in Storybook's esbuild-based config loading.

---

## How It Works

styled-static uses a Vite plugin to transform your styled components at build time. Here's what happens under the hood:

### Build-Time Transformation

When you write a styled component, the Vite plugin intercepts your code and performs AST-based transformation:

```tsx
// 1. What you write:
import { styled } from "@alex.radulescu/styled-static";

const Button = styled.button`
  padding: 1rem;
  background: blue;
  color: white;
`;

// 2. What gets generated:
import { createElement } from "react";
import { m } from "@alex.radulescu/styled-static/runtime";
import "@alex.radulescu/styled-static:abc123-0.css";

const Button = Object.assign(
  (p) => createElement("button", {...p, className: m("ss-abc123", p.className)}),
  { className: "ss-abc123" }
);
```

The CSS is completely removed from your JavaScript bundle and extracted to a virtual CSS module. The component becomes an inline function with a static `.className` property for composition.

### Virtual CSS Modules

Each styled component gets its own virtual CSS module with a unique ID like `styled-static:abc123-0.css`. This approach enables:

- ✅ **Deduplication** - CSS is optimized by Vite's pipeline
- ✅ **Code splitting** - CSS loads only with the components that use it
- ✅ **Hot Module Replacement** - Changes to styles trigger instant HMR
- ✅ **Production optimization** - CSS can be extracted to a single file

```css
/* Virtual module: styled-static:abc123-0.css */
.ss-abc123 {
  padding: 1rem;
  background: blue;
  color: white;
}
```

### Minimal Runtime

The runtime is extremely small because components are generated inline at build time. The only runtime code is a className merge helper:

| Module           | Minified | Brotli |
| ---------------- | -------- | ------ |
| runtime/index.js | **45 B** | 50 B   |

This is a **98% reduction** from traditional CSS-in-JS libraries.

```tsx
// The ENTIRE runtime - just className merging
export const m = (base, user) => user ? `${base} ${user}` : base;
```

Everything else is generated at build time as inline components.

### Zero-Runtime Features

Some features have literally zero runtime cost because they're completely replaced at build time:

```tsx
// css helper - zero runtime (just a string)
const activeClass = css`outline: 2px solid blue;`;
// Generated: const activeClass = "ss-xyz789";

// Global styles - zero runtime (just CSS import)
const GlobalStyles = createGlobalStyle`* { box-sizing: border-box; }`;
// Generated: const GlobalStyles = () => null;

// withComponent - zero runtime (build-time transformation)
const LinkButton = withComponent(Link, Button);
// Generated: Object.assign((p) => createElement(Link, {...p, className: m(Button.className, p.className)}), { className: Button.className })
```

---

## Configuration

```ts
styledStatic({
  // Prefix for generated class names (default: 'ss')
  classPrefix: "my-app",

  // CSS output mode (default: 'auto')
  // - 'auto': Uses 'file' for library builds (build.lib set), 'virtual' for apps
  // - 'virtual': CSS as virtual modules (Vite bundles into single file)
  // - 'file': CSS as separate files co-located with JS (for library builds)
  cssOutput: "auto",
});
```

### Library Builds

When building a component library with `build.lib` configured, styled-static automatically outputs CSS as separate files co-located with each JS file. This enables CSS tree-shaking for consuming applications.

```
dist/
  components/
    Button/
      Button.js    # imports "./Button.css"
      Button.css   # Button-specific styles only
    Alert/
      Alert.js     # imports "./Alert.css"
      Alert.css    # Alert-specific styles only
```

Consuming apps automatically get only the CSS for components they import:

```tsx
// In your app - only Button.css is included in the bundle
import { Button } from "my-component-library/components/Button";
```

For app builds (no `build.lib`), CSS is bundled as virtual modules into a single CSS file, which is the default Vite behavior.

---

## TypeScript

Full type inference is provided:

```tsx
const Button = styled.button`...`;

// ✅ Type-safe: button props are available
<Button type="submit" disabled>Submit</Button>

// ✅ Type-safe: withComponent infers props from target component
const LinkButton = withComponent(Link, Button);
<LinkButton to="/path">Link</LinkButton>

// ✅ Type-safe: .className is always string
const classes = Button.className; // string
```

---

## Zero Dependencies

Zero runtime dependencies. Uses native CSS nesting (Chrome 112+, Safari 16.5+, Firefox 117+) and Vite's CSS pipeline. See [Installation](#installation) for optional Lightning CSS integration.

---

## Comparison

**Legend:** ✓ Yes | ◐ Partial | ✗ No

| | styled-static | Emotion | Linaria | [Restyle](https://restyle.dev) | Panda CSS |
|-|---------------|---------|---------|--------|-----------|
| Runtime | **~50 B** | ~11 KB | ~1.5 KB | ~2.2 KB | 0 B |
| Dependencies | 0 | 5+ | 10+ | 0 | 5+ |
| React | 19+ | 16+ | 16+ | 19+ | 16+ |
| Bundler | Vite | Any | Many | Any | Any |
| `styled.el` | ✓ | ✓ | ✓ | ✓ | ◐ |
| `styled(Comp)` | ✓ | ✓ | ✓ | ✓ | ◐ |
| Variants | ✓ | ◐ | ◐ | ◐ | ✓ |
| `css` helper | ✓ | ✓ | ✓ | ✓ | ✓ |
| `css` inline prop | ✗ | ✓ | ✗ | ✓ | ✓ |
| Runtime interpolation | ✗ | ✓ | ✗ | ✓ | ✗ |
| `.className` access | ✓ | ✗ | ✗ | ✗ | ✗ |

**When to choose:** styled-static for familiar DX + zero deps + React 19/Vite. Emotion for runtime interpolation + ThemeProvider. Linaria for multi-bundler zero-runtime. [Restyle](https://restyle.dev) for `css` prop + Server Components. Panda for atomic CSS + design tokens.

---

## VS Code Support

For syntax highlighting in template literals, install the [vscode-styled-components](https://marketplace.visualstudio.com/items?itemName=styled-components.vscode-styled-components) extension.

---

## Inspiration

We take inspiration from the greats before us: [Emotion](https://emotion.sh), [styled-components](https://styled-components.com), [Linaria](https://linaria.dev), [Panda CSS](https://panda-css.com), [Pigment CSS](https://github.com/mui/pigment-css), [Stitches](https://stitches.dev), [Ecsstatic](https://github.com/danielroe/ecsstatic), [Restyle](https://restyle.dev), [goober](https://goober.rocks). Thanks to each and every one for ideas and inspiration.

---

## License

MIT
