<!--
═══════════════════════════════════════════════════════════════════════════════
This README serves as both user documentation and LLM context (LLMs.txt).
It documents styled-static - a zero-runtime CSS-in-JS library for React 19+
with Vite.

Key APIs: styled, css, createGlobalStyle, styledVariants, cssVariants, cx
Runtime: ~300 bytes | Dependencies: 0 | React 19+ required | Vite only

For implementation details, see CLAUDE.md or the source files in src/
═══════════════════════════════════════════════════════════════════════════════
-->

# styled-static

Zero-runtime CSS-in-JS for React 19+ with Vite. Write styled-components syntax, get static CSS extracted at build time.

## Features

- ⚡ **Zero Runtime** - CSS extracted at build time, no CSS-in-JS overhead
- 🎯 **Type-Safe** - Full TypeScript support with proper prop inference
- 🎨 **Familiar API** - styled-components syntax you already know
- 📦 **Tiny** - ~300 bytes runtime for `as` prop and transient props support
- 🔧 **Zero Dependencies** - Uses native CSS features and Vite's built-in tools

---

## Quick Overview

All the APIs you need at a glance. styled-static provides 6 core functions that cover most CSS-in-JS use cases:

### styled.element

Style HTML elements with template literals:

```tsx
const Button = styled.button`
  padding: 0.5rem 1rem;
  background: blue;
  color: white;
`;
```

### styled(Component)

Extend existing styled components:

```tsx
const PrimaryButton = styled(Button)`
  font-weight: bold;
  background: darkblue;
`;
```

### css

Get a scoped class name string:

```tsx
const activeClass = css`
  outline: 2px solid blue;
`;

<Button className={isActive ? activeClass : ""}>Click</Button>;
```

### createGlobalStyle

Define global (unscoped) styles:

```tsx
const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui; }
`;

<GlobalStyle />; // Render once at app root
```

### styledVariants

Create components with type-safe variant props:

```tsx
const Button = styledVariants({
  component: "button",
  css: `padding: 0.5rem 1rem; border-radius: 4px;`,
  variants: {
    size: {
      sm: `font-size: 0.875rem;`,
      lg: `font-size: 1.125rem;`,
    },
  },
});

<Button size="lg">Large Button</Button>;
```

### cssVariants

Get variant class strings for any element:

```tsx
const badgeCss = cssVariants({
  css: `padding: 0.25rem 0.5rem; border-radius: 4px;`,
  variants: {
    color: {
      blue: `background: #e0f2fe; color: #0369a1;`,
      green: `background: #dcfce7; color: #166534;`,
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

- 🎯 **Intentionally simple.** 95% native browser foundation + 5% sprinkles on top. We leverage what browsers already do well.

- 🎉 **Built for fun.** Sometimes the best projects come from curiosity and the joy of building something useful.

---

## What We Don't Do

styled-static is intentionally limited. Here's what we don't support—and why:

- 🚫 **No runtime interpolation.** You can't write `${props => props.color}`. CSS is extracted at build time, so values must be static. Use CSS variables, data attributes, or the Variants API for dynamic styles.

- ⚛️ **React 19+ only.** We rely on automatic ref forwarding instead of `forwardRef`. This keeps the runtime tiny but requires React 19.

- ⚡ **Vite only.** The plugin uses Vite's built-in AST parser and virtual module system. No Webpack, Rollup, or other bundler support.

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
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { styledStatic } from "styled-static/vite";

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

### cx Utility

Combine class names conditionally with the minimal `cx` utility (~40 bytes):

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

#### styledVariants

```tsx
import { styledVariants } from "styled-static";

const Button = styledVariants({
  component: "button",
  css: `
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `,
  variants: {
    color: {
      primary: `background: blue; color: white;`,
      danger: `background: red; color: white;`,
      success: `background: green; color: white;`,
    },
    size: {
      sm: `font-size: 0.875rem; padding: 0.25rem 0.5rem;`,
      md: `font-size: 1rem;`,
      lg: `font-size: 1.125rem; padding: 0.75rem 1.5rem;`,
    },
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
import { cssVariants } from 'styled-static';

const badgeCss = cssVariants({
  css: `
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  `,
  variants: {
    variant: {
      info: `background: #e0f2fe; color: #0369a1;`,
      success: `background: #dcfce7; color: #166534;`,
      warning: `background: #fef3c7; color: #92400e;`,
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

Render a styled component as a different HTML element:

```tsx
const Button = styled.button`
  padding: 0.5rem 1rem;
  background: blue;
  color: white;
`;

// Render as an anchor tag
<Button as="a" href="/link">
  I'm a link styled as a button
</Button>;
```

### Transient Props

Props prefixed with `$` are filtered out and won't reach the DOM. This is useful for passing data through components without polluting the HTML:

```tsx
// $-prefixed props are filtered from the DOM
<Button $trackingId="hero-cta" onClick={handleClick}>
  Click
</Button>;
// Renders: <button class="ss-abc123">Click</button>
// The $trackingId prop is available in event handlers but not in HTML

// Useful for component composition
const Card = styled.div`...`;
<Card $featured={true} $size="large" className="my-card">
  Content
</Card>;
// Renders: <div class="ss-abc123 my-card">Content</div>
```

> **Note:** Since styled-static extracts CSS at build time, transient props cannot be used for dynamic styling. Use class toggling, data attributes, or CSS variables instead.

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

### 1. Class Toggling with cx

```tsx
import { styled, css, cx } from "styled-static";

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

### 2. Data Attributes

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

### 3. CSS Variables

```tsx
const Button = styled.button`
  padding: 0.5rem 1rem;
  background: var(--btn-bg, gray);
  color: var(--btn-color, white);
`;

<Button style={{ "--btn-bg": color, "--btn-color": textColor }}>Click</Button>;
```

### 4. Variants API (Recommended)

For type-safe variant handling, use `styledVariants` or `cssVariants` as shown above.

---

## How It Works

styled-static transforms your code at build time:

```tsx
// You write:
const Button = styled.button`
  padding: 1rem;
  background: blue;
`;

// Becomes:
import "styled-static:abc123-0.css";
const Button = __styled("button", "ss-def456", "Button");

// CSS extracted to static file:
.ss-def456 {
  padding: 1rem;
  background: blue;
}
```

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

// ✅ Transient props are typed
<Button $primary={true}>Primary</Button>
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

| Feature               | styled-static | styled-components | Emotion | Linaria |
| --------------------- | ------------- | ----------------- | ------- | ------- |
| Zero Runtime          | ✅            | ❌                | ❌      | ✅      |
| Runtime Interpolation | ❌            | ✅                | ✅      | ❌      |
| `as` prop             | ✅            | ✅                | ✅      | ❌      |
| Component Extension   | ✅            | ✅                | ✅      | ✅      |
| Bundle Size           | ~300B         | ~12KB             | ~11KB   | ~0B     |
| Direct Dependencies   | 0             | 7                 | 5       | 10+     |

---

## VS Code Support

For syntax highlighting in template literals, install the [vscode-styled-components](https://marketplace.visualstudio.com/items?itemName=styled-components.vscode-styled-components) extension.

---

## License

MIT
