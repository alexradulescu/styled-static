---
name: styled-static
description: Use when writing styles with styled-static, creating styled components, using CSS-in-JS patterns, styling React components, or asking about theming/variants in this project
---

# styled-static

Near-zero-runtime CSS-in-JS for React 19+ with Vite. CSS generation happens at build time (zero runtime cost). A minimal runtime handles `as` prop and className merging.

## Tree-Shakable Runtime

The runtime is split into separate modules for optimal tree-shaking:

| Module | Minified | Brotli |
|--------|----------|--------|
| core.js | 544 B | 298 B |
| styled.js | 1.1 KB | 491 B |
| variants.js | 1.7 KB | 734 B |
| global.js | 43 B | 47 B |

Apps bundle only what they use. Typical styled-only app: ~1.6 KB minified.

## Key Difference from Emotion/styled-components

**No runtime interpolation.** This won't work:
```tsx
// WRONG - runtime interpolation not supported
const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
`;
```

All CSS must be static. Use alternatives below for dynamic styling.

---

## API Reference

### styled

Create styled components:
```tsx
import { styled } from 'styled-static';

// HTML elements
const Button = styled.button`
  padding: 1rem;
  &:hover { background: blue; }
`;

// Extend components
const PrimaryButton = styled(Button)`
  background: blue;
  color: white;
`;
```

**Props:**
- `as` - Polymorphic rendering with HTML elements or React components:
  ```tsx
  <Button as="a" href="/">Link</Button>
  <Button as={Link} to="/path">Router Link</Button>
  ```
- `className` - Merged after styled classes (wins in cascade)

**Pre-configured `as` (alternative to `withComponent`):**
```tsx
import type { ComponentProps } from 'react';

// Zero-overhead pattern for always rendering as a specific element/component
const LinkButton = (props: ComponentProps<typeof Link>) => (
  <Button as={Link} {...props} />
);

<LinkButton to="/home">Home</LinkButton>
```

> We don't provide `.withComponent()` — this pattern is simple, explicit, and adds zero bytes.

**attrs:**
```tsx
const PasswordInput = styled.input.attrs({ type: 'password' })`
  padding: 0.5rem;
`;

const SubmitButton = styled.button.attrs({ type: 'submit' })`
  background: blue;
`;
```
> Note: attrs must be static objects (no functions).

### css

Get a scoped class string:
```tsx
import { css } from 'styled-static';

const activeClass = css`
  outline: 2px solid blue;
`;

<Button className={activeClass}>Active</Button>
```

### createGlobalStyle

Inject global CSS (renders null, CSS via import):
```tsx
import { createGlobalStyle } from 'styled-static';

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui; }
`;

// Render once at app root
<GlobalStyle />
```

### keyframes

Create scoped animation names:
```tsx
import { styled, keyframes } from 'styled-static';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  animation: ${spin} 1s linear infinite;
`;
```

### styledVariants

Component with variant props:
```tsx
import { styledVariants, css } from 'styled-static';

const Button = styledVariants({
  component: 'button',
  css: css`padding: 0.5rem 1rem;`,
  variants: {
    color: {
      primary: css`background: blue; color: white;`,
      danger: css`background: red; color: white;`,
    },
    size: {
      sm: css`font-size: 0.875rem;`,
      lg: css`font-size: 1.125rem; padding: 0.75rem 1.5rem;`,
    },
  },
});

<Button color="primary" size="lg">Large Primary</Button>
// Renders: class="ss-base ss-base--color-primary ss-base--size-lg"
```

### cssVariants

Function that returns class strings (not a component):
```tsx
import { cssVariants, css } from 'styled-static';

const buttonClass = cssVariants({
  css: css`padding: 0.5rem 1rem;`,
  variants: {
    color: { primary: css`background: blue;` },
  },
});

<button className={buttonClass({ color: 'primary' })}>Click</button>
```

### cx

Conditionally join class names:
```tsx
import { cx, css } from 'styled-static';

const active = css`outline: 2px solid;`;
const disabled = css`opacity: 0.5;`;

<Button className={cx(
  isActive && active,
  isDisabled && disabled,
  customClass
)}>
  Click
</Button>
```

### Theme Helpers

```tsx
import { initTheme, getTheme, setTheme, onSystemThemeChange } from 'styled-static';

// On app init - checks localStorage, then system pref, then default
initTheme({ useSystemPreference: true });

// Get current theme
const theme = getTheme(); // reads data-theme attribute

// Set theme (persists to localStorage by default)
setTheme('dark');
setTheme('light', false); // don't persist

// Listen for OS theme changes
const unsubscribe = onSystemThemeChange((isDark) => {
  if (!localStorage.getItem('theme')) {
    setTheme(isDark ? 'dark' : 'light', false);
  }
});
```

Theme CSS pattern:
```tsx
const GlobalStyle = createGlobalStyle`
  :root[data-theme="light"] {
    --bg: white;
    --text: black;
  }
  :root[data-theme="dark"] {
    --bg: black;
    --text: white;
  }
`;

const Box = styled.div`
  background: var(--bg);
  color: var(--text);
`;
```

---

## Dynamic Styling (Without Runtime Interpolation)

### CSS Variables
```tsx
const Button = styled.button`
  background: var(--btn-bg, gray);
`;

<Button style={{ '--btn-bg': isPrimary ? 'blue' : 'gray' }}>Click</Button>
```

### Data Attributes
```tsx
const Button = styled.button`
  background: gray;
  &[data-variant="primary"] { background: blue; }
  &[data-variant="danger"] { background: red; }
`;

<Button data-variant={variant}>Click</Button>
```

### Variants API
Use `styledVariants` or `cssVariants` for predefined states (see above).

### Class Mixing
```tsx
const primary = css`background: blue;`;
const large = css`font-size: 1.25rem;`;

<Button className={cx(isPrimary && primary, isLarge && large)}>Click</Button>
```

---

## Critical Gotchas

### 1. No Runtime Interpolation
```tsx
// WRONG
styled.div`color: ${props => props.color};`
styled.div`color: ${someVariable};`

// RIGHT - use CSS variables or variants
styled.div`color: var(--color);`
```

### 2. React 19+ Only
Uses automatic ref forwarding. Not compatible with React 18 or earlier.

### 3. Vite Only
Not compatible with Webpack, Rollup, Parcel, or other bundlers.

### 4. Plugin Order Matters
```ts
// vite.config.ts
import { styledStatic } from 'styled-static/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    styledStatic(),  // MUST be before react()
    react(),
  ],
});
```

### 5. No css Prop (By Design)
```tsx
// NOT SUPPORTED
<div css={css`color: red;`}>

// USE THIS INSTEAD
const redText = css`color: red;`;
<div className={redText}>
```

**Why?** The `css` prop saves ~10 characters of naming but adds ~100 lines of plugin complexity. Named variables encourage reusable styles and are easier to refactor. The "friction" of naming is a feature, not a bug.

### 6. No shouldForwardProp (Not Needed)

`shouldForwardProp` exists in styled-components/Emotion to filter custom props used for runtime interpolation. Since styled-static has no runtime interpolation, you don't pass custom styling props in the first place.

**Workarounds for edge cases:**
```tsx
// 1. Destructure before passing
function MyButton({ isActive, ...rest }) {
  return <Button className={cx(isActive && activeClass)} {...rest} />;
}

// 2. Use data attributes (valid HTML)
const Button = styled.button`
  &[data-active="true"] { background: blue; }
`;
<Button data-active={isActive} />

// 3. Use variants (auto-stripped)
const Button = styledVariants({
  component: 'button',
  variants: { active: { true: css`...` } }
});
<Button active />  // "active" never reaches DOM
```

### 7. Cascade Order
Classes merge as: Base → Extension → User className
```tsx
const Button = styled.button`padding: 1rem;`;      // .ss-abc
const Primary = styled(Button)`background: blue;`; // .ss-def
<Primary className="custom" />
// Renders: class="ss-abc ss-def custom"
// "custom" wins if it sets same properties
```

---

## Security

### Blocked Elements
The `as` prop blocks dangerous HTML elements: `script`, `iframe`, `style`, `meta`, `link`, `embed`, `object`, `base`, `noscript`, `template`

React components passed to `as` are not validated (they come from code, not user input).

### Variant Sanitization
Variant values are auto-sanitized to alphanumeric + hyphens only, preventing class injection attacks.

---

## Vite Plugin Options

```ts
styledStatic({
  classPrefix: 'ss',  // Custom prefix (default: 'ss')
  debug: false,       // Debug logging (don't use in prod)
})
```

### Autoprefixing with Lightning CSS

styled-static has **zero dependencies** and delegates CSS processing to Vite's pipeline. For autoprefixing, use Lightning CSS:

```bash
npm install lightningcss
```

```ts
// vite.config.ts
export default defineConfig({
  css: { transformer: 'lightningcss' },
  plugins: [styledStatic(), react()],
});
```

Lightning CSS provides:
- Automatic vendor prefixes
- CSS minification
- Faster builds than PostCSS
