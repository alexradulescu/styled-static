<!--
═══════════════════════════════════════════════════════════════════════════════
This README serves as both user documentation and LLM context (LLMs.txt).
It documents styled-static - a zero-runtime CSS-in-JS library for React 19+
with Vite.

Key APIs: styled, css, createGlobalStyle, styledVariants, cssVariants, cx
Theme helpers: initTheme, setTheme, getTheme, onSystemThemeChange
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
