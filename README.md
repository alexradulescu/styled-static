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

**What's "zero"?** CSS generation happens at build time (the expensive part). A minimal runtime handles `as` prop polymorphism and className merging - features that require runtime props.

## Features

- ⚡ **Static CSS** - All CSS extracted at build time, no runtime stylesheet generation
- 🎯 **Type-Safe** - Full TypeScript support with proper prop inference
- 🎨 **Familiar API** - styled-components syntax you already know
- 📦 **Tiny** - Minimal runtime for `as` prop and className merging
- 🔧 **Zero Dependencies** - Uses native CSS features and Vite's built-in tools
- 🌳 **Tree-Shakable** - Runtime split into modules; only ship what you use
- 🌓 **Theme Helpers** - Simple utilities for dark mode and custom themes

---

## Quick Overview

All the APIs you need at a glance. styled-static provides 6 core functions that cover most CSS-in-JS use cases:

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
```

---

## Why styled-static?

- 🌐 **CSS & browsers have evolved.** Native CSS nesting, CSS variables, container queries, and fewer vendor prefixes mean the gap between CSS and CSS-in-JS has never been smaller.

- 😵 **CSS-in-JS fatigue is real.** Most libraries are now obsolete, overly complex, or have large runtime overhead. The ecosystem needs simpler solutions.

- ✨ **Syntactic sugar over CSS modules.** Most projects don't need runtime interpolation. They need a better DX for writing and organizing CSS.

- 🔒 **Supply chain security matters.** Zero dependencies means a minimal attack surface. No transitive dependencies to audit or worry about.

- 🎯 **Intentionally simple.** 95% native browser foundation + 5% sprinkles on top. We leverage what browsers and vite already do great.

- 🎉 **Built for fun.** Sometimes the best projects come from curiosity and the joy of building something useful.

---

## What We Don't Do

styled-static is intentionally limited. Here's what we don't support—and why:

- 🚫 **No runtime interpolation.** You can't write `${props => props.color}`. CSS is extracted at build time, so values must be static. Use Variants API, CSS variables or data attributes for dynamic styles.

- ⚛️ **React 19+ only.** We rely on automatic ref forwarding instead of `forwardRef`. This keeps the runtime tiny but requires React 19.

- ⚡ **Vite only.** The plugin uses Vite's built-in AST parser and virtual module system. No Webpack, Rollup, or other bundler support.

- 🚫 **No `css` prop.** We don't support `<Button css={...}>`. Use named `css` variables with `className` instead. This keeps the plugin simple (~100 fewer lines) and nudges you toward reusable, named styles.

- 🚫 **No `shouldForwardProp`.** Not needed—without runtime interpolation, you don't pass custom styling props. Variants auto-strip their props; for edge cases, use destructuring or data attributes.

- 💡 **Why these constraints?** Each limitation removes complexity. No runtime interpolation means no runtime CSS parsing. React 19 means no forwardRef wrapper. Vite-only means one excellent integration instead of many mediocre ones.

---

## Installation

```bash
npm install styled-static
# or
bun add styled-static
```

Configure the Vite plugin:

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { styledStatic } from "styled-static/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [styledStatic(), react()],
});
```

> **Note:** The plugin must be placed **before** the React plugin in the plugins array.

---

## API Reference

### styled

Create styled React components with zero runtime overhead. CSS is extracted to static files at build time.

```tsx
import { styled } from "styled-static";

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
import { css } from 'styled-static';

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
import { keyframes, styled } from "styled-static";

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

**How it works:**

- At build time, keyframes CSS is extracted to a static file
- The animation name is hashed (e.g., `ss-abc123`)
- References in styled components are replaced with the hashed name

```css
/* Generated CSS */
@keyframes ss-abc123 {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.ss-xyz789 {
  animation: ss-abc123 1s linear infinite;
}
```

### attrs

Set default HTML attributes on styled components using the `.attrs()` method:

```tsx
import { styled } from 'styled-static';

// Set default type for input
const PasswordInput = styled.input.attrs({ type: 'password' })`
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
`;

// Set multiple default attributes
const SubmitButton = styled.button.attrs({
  type: 'submit',
  'aria-label': 'Submit form',
})`
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
`;

// Usage - default attrs are applied, can be overridden
<PasswordInput placeholder="Enter password" />
// Renders: <input type="password" placeholder="Enter password" class="ss-abc123" />

<SubmitButton>Send</SubmitButton>
// Renders: <button type="submit" aria-label="Submit form" class="ss-xyz789">Send</button>
```

> **Note:** Unlike styled-components, attrs in styled-static must be static objects (no functions). For dynamic attributes, use regular props on your component.

### cx Utility

Combine class names conditionally with the minimal `cx` utility:

```tsx
import { css, cx } from 'styled-static';

const activeClass = css`
  color: blue;
`;

// Multiple class names
<div className={cx('base', 'active')} />
// → class="base active"

// Conditional classes
<Button className={cx('btn', isActive && activeClass)} />
// → class="btn ss-abc123" (when active)
// → class="btn" (when not active)

// Falsy values are filtered out
<div className={cx('a', null, undefined, false, 'b')} />
// → class="a b"
```

### Global Styles

```tsx
import { createGlobalStyle } from "styled-static";

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

> **Note:** The component renders nothing at runtime. All CSS is extracted and injected via imports.

### Variants API

For type-safe variant handling, use `styledVariants` to create components with variant props, or `cssVariants` to get class functions.

> **Tip:** Wrap CSS strings in `css\`...\`` to get IDE syntax highlighting from the styled-components VSCode extension.

#### styledVariants

```tsx
import { css, styledVariants } from "styled-static";

// With css`` for syntax highlighting (recommended)
const Button = styledVariants({
  component: "button",
  css: css`
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `,
  variants: {
    color: {
      primary: css`
        background: blue;
        color: white;
      `,
      danger: css`
        background: red;
        color: white;
      `,
      success: css`
        background: green;
        color: white;
      `,
    },
    size: {
      sm: css`
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
      `,
      md: css`
        font-size: 1rem;
      `,
      lg: css`
        font-size: 1.125rem;
        padding: 0.75rem 1.5rem;
      `,
    },
  },
});

// Plain strings also work (no highlighting)
const SimpleButton = styledVariants({
  component: "button",
  css: `padding: 0.5rem;`,
  variants: {
    size: { sm: `font-size: 0.875rem;` },
  },
});

// Usage - variant props are type-safe
<Button color="primary" size="lg">
  Click me
</Button>;
// Renders: <button class="ss-abc ss-abc--color-primary ss-abc--size-lg">
```

#### cssVariants

```tsx
import { cssVariants, css, cx } from 'styled-static';

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

### Polymorphic `as` Prop

Render a styled component as a different HTML element or React component:

```tsx
// Render as a React component (e.g., react-router Link)
import { Link } from "react-router-dom";

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: blue;
  color: white;
`;

// Render as an anchor tag
<Button as="a" href="/link">
  I'm a link styled as a button
</Button>;

<Button as={Link} to="/path">
  I'm a router link styled as a button
</Button>;
```

The `as` prop accepts:

- **HTML elements**: `"a"`, `"div"`, `"span"`, etc.
- **React components**: Any component that accepts a `className` prop

### Pre-configured Polymorphic Components

To create a component that always renders as a specific element or component (similar to styled-components' `withComponent`), use a simple wrapper:

```tsx
import { Link } from 'react-router-dom';
import type { ComponentProps } from 'react';

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: blue;
`;

// Always render as Link
const LinkButton = (props: ComponentProps<typeof Link>) => (
  <Button as={Link} {...props} />
);

// Always render as anchor
const AnchorButton = (props: ComponentProps<'a'>) => (
  <Button as="a" {...props} />
);

// Usage
<LinkButton to="/home">Home</LinkButton>
<AnchorButton href="/external">External</AnchorButton>
```

This pattern has zero bundle overhead and works with both `styled` and `styledVariants` components.

> **Why no `.withComponent()` method?**
>
> Unlike styled-components, we don't provide a built-in `withComponent` method. This is intentional: the pattern above is simple, explicit, and adds zero bytes to your bundle. Since pre-configured polymorphic components are typically needed in only 1-2% of cases, we chose not to add runtime overhead for a feature that's trivial to implement manually.

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

Since CSS is extracted at build time, you cannot use runtime interpolations like `${props => props.color}`. Instead, use these patterns:

### 1. Variants API (Recommended)

For type-safe variant handling, use `styledVariants` or `cssVariants`:

```tsx
import { styledVariants, css } from "styled-static";

const Button = styledVariants({
  component: "button",
  css: css`
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
  `,
  variants: {
    color: {
      primary: css`background: blue; color: white;`,
      danger: css`background: red; color: white;`,
      success: css`background: green; color: white;`,
    },
  },
});

// Usage - variant props are type-safe
<Button color="primary">Click</Button>
<Button color="danger">Delete</Button>
```

See the [Variants API](#variants-api) section for full documentation.

### 2. Class Toggling with cx

```tsx
import { css, cx, styled } from "styled-static";

const primaryClass = css`
  background: blue;
`;
const dangerClass = css`
  background: red;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  color: white;
`;

// Toggle between classes based on props/state
<Button className={cx(isPrimary ? primaryClass : dangerClass)}>Click</Button>;
```

### 3. Data Attributes

```tsx
const Button = styled.button`
  padding: 0.5rem 1rem;
  color: white;

  &[data-variant="primary"] {
    background: blue;
  }
  &[data-variant="danger"] {
    background: red;
  }
  &[data-variant="success"] {
    background: green;
  }
`;

<Button data-variant={variant}>Click</Button>;
```

### 4. CSS Variables

```tsx
const Button = styled.button`
  padding: 0.5rem 1rem;
  background: var(--btn-bg, gray);
  color: var(--btn-color, white);
`;

<Button style={{ "--btn-bg": color, "--btn-color": textColor }}>Click</Button>;
```

---

## Theming

styled-static provides a simple, CSS-first approach to theming using CSS variables and `data-theme` attributes. No runtime overhead—just pure CSS.

### Defining Themes

Use `createGlobalStyle` to define your theme tokens:

```tsx
import { createGlobalStyle, styled } from "styled-static";

const GlobalStyle = createGlobalStyle`
  :root, [data-theme="light"] {
    --color-bg: #ffffff;
    --color-text: #1a1a1a;
    --color-primary: #3b82f6;
    --color-accent: #8b5cf6;
  }
  
  [data-theme="dark"] {
    --color-bg: #0f172a;
    --color-text: #f1f5f9;
    --color-primary: #60a5fa;
    --color-accent: #a78bfa;
  }
  
  /* Custom themes */
  [data-theme="pokemon"] {
    --color-bg: #ffcb05;
    --color-text: #2a75bb;
    --color-primary: #cc0000;
    --color-accent: #3d7dca;
  }
  
  [data-theme="star-trek"] {
    --color-bg: #000000;
    --color-text: #ff9900;
    --color-primary: #3366cc;
    --color-accent: #cc0000;
  }
`;

// Use CSS variables in your components
const Button = styled.button`
  background: var(--color-primary);
  color: var(--color-bg);
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;

  &:hover {
    background: var(--color-accent);
  }
`;
```

### Theme Helper Functions

styled-static provides helper functions for theme switching:

```tsx
import {
  getTheme,
  initTheme,
  onSystemThemeChange,
  setTheme,
} from "styled-static";

// Initialize on app load (reads from localStorage, falls back to default)
initTheme({
  defaultTheme: "light",
  useSystemPreference: true, // Optional: detect OS dark mode
});

// Get current theme
const current = getTheme(); // 'light' | 'dark' | 'pokemon' | etc.

// Change theme (persists to localStorage by default)
setTheme("dark");

// Change without persisting (useful for previews)
setTheme("pokemon", false);

// Listen for OS theme changes
const unsubscribe = onSystemThemeChange((prefersDark) => {
  if (!localStorage.getItem("theme")) {
    setTheme(prefersDark ? "dark" : "light", false);
  }
});
```

### Theme Toggle Example

```tsx
import { getTheme, setTheme } from "styled-static";

function ThemeToggle() {
  const toggleTheme = () => {
    const current = getTheme();
    setTheme(current === "dark" ? "light" : "dark");
  };

  return <button onClick={toggleTheme}>Toggle Theme</button>;
}

function ThemeSelector() {
  return (
    <select onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="pokemon">Pokemon</option>
      <option value="star-trek">Star Trek</option>
    </select>
  );
}
```

### System Preference Detection

Combine `useSystemPreference` with CSS for automatic system theme detection:

```tsx
const GlobalStyle = createGlobalStyle`
  :root {
    --color-bg: #ffffff;
    --color-text: #1a1a1a;
  }
  
  /* Automatic system preference (when no explicit theme set) */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme]) {
      --color-bg: #0f172a;
      --color-text: #f1f5f9;
    }
  }
  
  /* Explicit theme overrides */
  [data-theme="light"] { --color-bg: #ffffff; --color-text: #1a1a1a; }
  [data-theme="dark"] { --color-bg: #0f172a; --color-text: #f1f5f9; }
`;

// Initialize with system preference detection
initTheme({ useSystemPreference: true });
```

### API Reference

| Function                              | Description                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `getTheme(attribute?)`                | Get current theme from `data-theme` attribute. Returns `'light'` as default.         |
| `setTheme(theme, persist?, options?)` | Set theme on document. Persists to localStorage by default.                          |
| `initTheme(options?)`                 | Initialize theme on page load. Priority: localStorage → system preference → default. |
| `onSystemThemeChange(callback)`       | Subscribe to OS theme changes. Returns unsubscribe function.                         |

#### initTheme Options

```ts
initTheme({
  defaultTheme: "light", // Default theme if no stored preference
  storageKey: "theme", // localStorage key (default: 'theme')
  useSystemPreference: false, // Detect OS dark/light preference
  attribute: "data-theme", // Attribute to set on documentElement
});
```

---

## How It Works

styled-static uses a Vite plugin to transform your styled components at build time. Here's what happens under the hood:

### Build-Time Transformation

When you write a styled component, the Vite plugin intercepts your code and performs AST-based transformation:

```tsx
// 1. What you write:
import { styled } from "styled-static";

const Button = styled.button`
  padding: 1rem;
  background: blue;
  color: white;
`;

// 2. What gets generated:
import { __styled } from "styled-static/runtime/styled";
import "styled-static:abc123-0.css";

const Button = __styled({
  tag: "button",
  className: "ss-abc123",
  displayName: "Button"  // dev-only
});
```

The CSS is completely removed from your JavaScript bundle and extracted to a virtual CSS module that Vite can optimize and cache.

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

The runtime is tree-shakable and extremely small because all CSS has been extracted at build time:

| Module      | Minified   | Brotli     |
| ----------- | ---------- | ---------- |
| core.js     | 544 B      | 298 B      |
| styled.js   | 1.1 KB     | 491 B      |
| variants.js | 1.7 KB     | 734 B      |
| global.js   | 43 B       | 47 B       |
| **Total**   | **3.4 KB** | **1.5 KB** |

Apps only bundle the modules they use. A typical styled-only app: ~1.6 KB minified.

```tsx
// Simplified runtime implementation
export function __styled(config) {
  const { tag, className, displayName } = config;

  const Component = (props) => {
    const { as, className: userClass, __debug, ...rest } = props;

    // Merge classes (styled first, user last)
    rest.className = mergeClassNames(className, userClass);

    // Render with validated tag
    return createElement(as || tag, rest);
  };

  return Component;
}
```

### Bundle Size Comparison

For an app with 500 styled components:

| Library           | Runtime | Per Component | Total (500)   |
| ----------------- | ------- | ------------- | ------------- |
| **styled-static** | ~1.6 KB | ~20 bytes     | **~12 KB** ⭐ |
| Emotion           | 7.9 KB  | ~50 bytes     | 32.9 KB       |
| styled-components | 16 KB   | ~60 bytes     | 46 KB         |
| Linaria           | 0 bytes | ~40 bytes     | 20 KB         |

### Zero-Runtime Features

Some features have literally zero runtime cost because they're completely replaced at build time:

```tsx
// css helper - zero runtime
const activeClass = css`
  outline: 2px solid blue;
`;
// Generated: const activeClass = "ss-xyz789";

// Global styles - zero runtime (just CSS import)
const GlobalStyles = createGlobalStyle`* { box-sizing: border-box; }`;
// Generated: const GlobalStyles = () => null;
```

For a detailed explanation of the transformation process, virtual CSS modules, and runtime internals, see the ["How It Works" section in the documentation](https://styled-static.dev#how-it-works).

---

## Configuration

```ts
styledStatic({
  // Prefix for generated class names (default: 'ss')
  classPrefix: "my-app",
});
```

---

## TypeScript

Full type inference is provided:

```tsx
const Button = styled.button`...`;

// ✅ Type-safe: button props are available
<Button type="submit" disabled>Submit</Button>

// ✅ Type-safe: as prop changes available props
<Button as="a" href="/link">Link</Button>
```

---

## Limitations

- **No runtime interpolation** - CSS values must be static (use CSS variables for dynamic values)
- **React 19+ only** - Uses automatic ref forwarding
- **Vite only** - Built specifically for Vite's plugin system

---

## Zero Dependencies

The plugin has **ZERO** direct dependencies! 🎉

It relies on:

- **Native CSS nesting** - Supported in all browsers that support React 19 (Chrome 112+, Safari 16.5+, Firefox 117+, Edge 112+)
- **Vite's CSS pipeline** - Handles the virtual CSS modules

### Optional: Lightning CSS

For faster CSS processing and automatic vendor prefixes, install Lightning CSS:

```bash
npm install lightningcss
```

Then enable in your vite.config.ts:

```ts
export default defineConfig({
  css: { transformer: "lightningcss" },
  plugins: [styledStatic(), react()],
});
```

---

## Comparison

An honest comparison with other CSS-in-JS libraries. Each library excels in different areas—choose based on your needs.

**Legend:** ✓ Supported | ◐ Partial | ✗ Not supported | — Not applicable

### Runtime & Build

| Feature          | styled-static | Emotion        | Linaria | Panda CSS |
| ---------------- | ------------- | -------------- | ------- | --------- |
| Runtime size     | ~1.6 KB       | ~11KB          | 0B      | 0B        |
| Zero-runtime CSS | ◐             | ✗              | ✓       | ✓         |
| SSR complexity   | None          | Setup required | None    | None      |
| Bundler support  | Vite only     | Any            | Many    | Any       |

### API & Features

| Feature               | styled-static | Emotion  | Linaria  | Panda CSS  |
| --------------------- | ------------- | -------- | -------- | ---------- |
| `styled.element`      | ✓             | ✓        | ✓        | ◐ patterns |
| `styled(Component)`   | ✓             | ✓        | ✓        | ◐          |
| `css` helper          | ✓             | ✓        | ✓        | ✓          |
| `css` prop            | ✗ by design   | ✓        | ✗        | ✓          |
| Variants/Recipes      | ✓             | ◐ manual | ◐ manual | ✓          |
| `as` prop             | ✓             | ✓        | ✗        | ◐ manual   |
| `attrs`               | ✓             | ✓        | ✗        | —          |
| keyframes             | ✓             | ✓        | ✓        | ✓          |
| Global styles         | ✓             | ✓        | ✓        | ✓          |
| Runtime interpolation | ✗ by design   | ✓        | ✗        | ✗          |

### Theming & DX

| Feature       | styled-static | Emotion  | Linaria  | Panda CSS  |
| ------------- | ------------- | -------- | -------- | ---------- |
| CSS variables | ✓             | ✓        | ✓        | ✓          |
| ThemeProvider | — CSS-first   | ✓        | —        | —          |
| Design tokens | ◐ manual      | ◐ manual | ◐ manual | ✓ built-in |
| TypeScript    | ✓ full        | ✓ full   | ✓ full   | ✓ full     |
| React version | 19+           | 16+      | 16+      | 16+        |
| Dependencies  | 0             | 5+       | 10+      | 5+         |

### When to Choose Each

- **styled-static**: You want familiar styled-components DX with zero dependencies, minimal runtime, and are on React 19+ with Vite
- **Emotion**: You need runtime interpolation (`${props => props.color}`), ThemeProvider, or wide bundler/React version support
- **Linaria**: You want zero runtime with multi-bundler support and don't need `as` prop or variants
- **Panda CSS**: You want atomic CSS, built-in design tokens, and framework-agnostic support

---

## VS Code Support

For syntax highlighting in template literals, install the [vscode-styled-components](https://marketplace.visualstudio.com/items?itemName=styled-components.vscode-styled-components) extension.

---

## License

MIT
