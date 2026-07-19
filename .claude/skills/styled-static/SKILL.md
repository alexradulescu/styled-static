---
name: styled-static
description: Use when writing styles with styled-static, creating styled components, using CSS-in-JS patterns, styling React components, or asking about theming/variants in this project. Also triggers for: migrating from styled-components/Emotion, adding dark mode, building component variants, conditional styling without runtime interpolation, keyframe animations, polymorphic components, and any question about why dynamic props or the css prop aren't supported.
---

# styled-static

React 19+, Vite only. CSS at build time; ~45B runtime. No runtime interpolation — all CSS static. Use CSS variables, variants, cx, or data attributes for dynamic values.

Imports: `import { styled, css, cx, keyframes, createGlobalStyle, withComponent, styledVariants, cssVariants, initTheme, getTheme, setTheme, onSystemThemeChange } from "@alex.radulescu/styled-static";`

## API

### styled

```tsx
const Button = styled.button`padding: 1rem; &:hover { background: blue; }`;
const Primary = styled(Button)`background: blue;`; // extend, multi-level ok
const Big = styled(Primary)`font-size: 2rem;`;

Button.className // → "ss-abc" — static, use for manual composition
<a className={Button.className} href="/link">link</a>

const Input = styled.input.attrs({ type: "password" })`padding: 0.5rem;`; // attrs: static objects only
```

### withComponent

```tsx
const LinkButton = withComponent(Link, Button); // polymorphic at build time
const AnchorButton = withComponent("a", Button);
```

### css — scoped class string

```tsx
const active = css`
  outline: 2px solid blue;
`;
<Button className={active} />;
```

### createGlobalStyle

```tsx
const GlobalStyle = createGlobalStyle`* { box-sizing: border-box; } body { margin: 0; }`;
<GlobalStyle />; // render once at root, outputs nothing to DOM
```

### keyframes

```tsx
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const Spinner = styled.div`
  animation: ${spin} 1s linear infinite;
`;
```

### styledVariants — component, variant props auto-stripped from DOM

```tsx
const Button = styledVariants({
  component: "button",
  css: css`
    padding: 0.5rem 1rem;
  `,
  variants: {
    color: {
      primary: css`
        background: blue;
      `,
      danger: css`
        background: red;
      `,
    },
    size: {
      sm: css`
        font-size: 0.875rem;
      `,
      lg: css`
        font-size: 1.125rem;
      `,
    },
  },
  defaultVariants: { color: "primary", size: "sm" },
  compoundVariants: [
    {
      color: "danger",
      size: "lg",
      css: css`
        font-weight: 900;
      `,
    },
  ],
});
<Button color="danger" size="lg" />; // class="ss-base ss-base--color-danger ss-base--size-lg"
```

### cssVariants — returns class strings, not a component

```tsx
const buttonClass = cssVariants({
  css: css`
    padding: 0.5rem 1rem;
  `,
  variants: {
    color: {
      primary: css`
        background: blue;
      `,
      danger: css`
        background: red;
      `,
    },
    size: {
      sm: css`
        font-size: 0.875rem;
      `,
      lg: css`
        font-size: 1.25rem;
      `,
    },
  },
  defaultVariants: { color: "primary", size: "sm" },
  compoundVariants: [
    {
      color: "danger",
      size: "lg",
      css: css`
        font-weight: bold;
      `,
    },
  ],
});
<button className={buttonClass({ color: "primary" })} />;
```

### cx — flat only, no nested arrays/objects

```tsx
cx("base", "active")                  // → "base active"
cx("btn", isActive && active)         // → "btn ss-abc" or "btn"
cx("a", null, undefined, false, "b")  // → "a b"
<Button className={cx(isActive && active, isDisabled && disabled)} />
```

### Theme helpers

```tsx
initTheme({ useSystemPreference: true }); // localStorage → system pref → default
getTheme(); // reads data-theme on <html>
setTheme("dark"); // persists to localStorage
setTheme("light", false); // no persist
const unsub = onSystemThemeChange((isDark) => setTheme(isDark ? "dark" : "light", false));

const GlobalStyle = createGlobalStyle`
  :root[data-theme="light"] { --bg: white; --text: black; }
  :root[data-theme="dark"]  { --bg: black; --text: white; }
`;
const Box = styled.div`
  background: var(--bg);
  color: var(--text);
`;
```

## Dynamic styling

```tsx
// CSS variables — for truly dynamic values
const Button = styled.button`
  background: var(--btn-bg, gray);
`;
<Button style={{ "--btn-bg": isPrimary ? "blue" : "gray" }} />;

// Data attributes
const Button = styled.button`
  &[data-variant="primary"] {
    background: blue;
  }
  &[data-variant="danger"] {
    background: red;
  }
`;
<Button data-variant={variant} />;
```

## Gotchas

**No runtime interpolation:**

```tsx
styled.div`
  color: ${someVar};
`; // WRONG — build-time only
styled.div`
  color: var(--color);
`; // RIGHT
```

**React 19+ only** — no React 18. **Vite only** — no Webpack/Rollup/Parcel.

**Plugin order** — styledStatic() transforms source before react() processes JSX:

```ts
plugins: [styledStatic(), react()]; // from "@alex.radulescu/styled-static/vite"
```

**No css prop** — name the class instead:

```tsx
<div css={css`color: red;`}>          // NOT SUPPORTED
<div className={css`color: red;`}>    // correct
```

**No shouldForwardProp** — no runtime props means no custom styling props to filter. Edge cases:

```tsx
function MyButton({ isActive, ...rest }) { return <Button className={cx(isActive && activeClass)} {...rest} />; }
<Button data-active={isActive} />  // data attribute
<Button active />                  // styledVariants strips "active" from DOM
```

**Cascade order** — Base → Extension → User className (user wins):

```tsx
<Primary className="custom" />; // class="ss-abc ss-def custom"
Primary.className; // → "ss-abc ss-def"
```

## Vite plugin

```ts
import { styledStatic } from "@alex.radulescu/styled-static/vite";
styledStatic({ classPrefix: "ss", debug: false, cssOutput: "auto" });
```

| `cssOutput`        | Behavior                                                        |
| ------------------ | --------------------------------------------------------------- |
| `'auto'` (default) | `'file'` for lib builds (`build.lib` set), `'virtual'` for apps |
| `'virtual'`        | virtual modules → single bundled CSS                            |
| `'file'`           | per-component CSS files → enables consumer tree-shaking         |

**Autoprefixing via Lightning CSS:**

```ts
export default defineConfig({
  css: { transformer: "lightningcss" },
  plugins: [styledStatic(), react()],
});
```
