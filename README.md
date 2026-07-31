# styled-static

`styled-static` is a React 19 styling library for Vite 8. It keeps the familiar `styled.button` API, extracts CSS during the build, and leaves only readable React components plus one class-name helper in the browser. The intentionally small static language favors predictable output, fast HMR, and code that should remain easy to maintain for years.

## Start in under five minutes

Requirements: Node `^20.19.0` or `>=22.12.0`, React 19, and Vite 8.

```bash
bun add @alex.radulescu/styled-static
```

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { styledStatic } from "@alex.radulescu/styled-static/vite";

export default defineConfig({
  plugins: [react(), styledStatic()],
});
```

The plugin has no options. It automatically detects application and library builds.

## First component

```tsx
import { styled } from "@alex.radulescu/styled-static";

const Button = styled.button`
  border: 0;
  border-radius: 0.5rem;
  padding: 0.65rem 1rem;
  background: royalblue;
  color: white;

  &:hover {
    background: mediumblue;
  }
`;

export function SaveButton() {
  return <Button type="button">Save</Button>;
}
```

Every extracted definition must be one named, top-level `const`. This gives the compiler a stable identity and keeps errors local.

## API at a glance

| API                       | Purpose                             | Result                |
| ------------------------- | ----------------------------------- | --------------------- |
| `styled.element`          | Style an intrinsic element          | React component       |
| `styled(Component)`       | Extend a local component            | React component       |
| `.attrs({...})`           | Add static default props            | React component       |
| `css`                     | Extract a reusable class            | Class-name string     |
| `styledVariants`          | Styled component with variant props | React component       |
| `cssVariants`             | Select variant classes manually     | Class-name function   |
| `keyframes`               | Extract a scoped animation          | Animation-name string |
| `globalCss`               | Extract unscoped CSS                | Module side effect    |
| `withComponent(To, From)` | Change render target, retain styles | React component       |
| `cx(...)`                 | Join conditional class names        | Class-name string     |

Import aliases work for every compiler API:

```tsx
import { css as staticCss, styled as s } from "@alex.radulescu/styled-static";

const Box = s.div`display: grid;`;
const selected = staticCss`outline: 2px solid;`;
```

## Variants

Use `css` tags for every CSS value. Plain strings and untagged templates are intentionally rejected.

```tsx
import { css, styledVariants } from "@alex.radulescu/styled-static";

const Button = styledVariants({
  component: "button",
  css: css`
    border: 0;
    padding: 0.65rem 1rem;
  `,
  variants: {
    tone: {
      normal: css`
        background: royalblue;
        color: white;
      `,
      danger: css`
        background: firebrick;
        color: white;
      `,
    },
    size: {
      small: css`
        font-size: 0.875rem;
      `,
      large: css`
        font-size: 1.125rem;
      `,
    },
  },
  defaultVariants: {
    tone: "normal",
    size: "small",
  },
  compoundVariants: [
    {
      tone: "danger",
      size: "large",
      css: css`
        box-shadow: 0 0 0 3px color-mix(in srgb, firebrick 35%, transparent);
      `,
    },
  ],
});

<Button tone="danger" size="large">
  Delete
</Button>;
```

Use `cssVariants` when another component owns the element:

```tsx
const badgeClasses = cssVariants({
  css: css`
    border-radius: 999px;
    padding: 0.2rem 0.5rem;
  `,
  variants: {
    tone: {
      info: css`
        background: lightblue;
      `,
      warning: css`
        background: wheat;
      `,
    },
  },
});

<ThirdPartyBadge className={badgeClasses({ tone: "warning" })} />;
```

Unknown runtime values add no class. Variant props are removed before intrinsic elements render. Generated code uses explicit equality checks and never converts an input value into a class name.

## Composition and polymorphism

```tsx
const Button = styled.button`
  padding: 0.65rem 1rem;
`;
const PrimaryButton = styled(Button)`
  background: royalblue;
`;
```

Class order is base → extension → user:

```tsx
<PrimaryButton className="analytics-target" />
// Button.className PrimaryButton.className analytics-target
```

Static attrs are defaults. Explicit props win:

```tsx
const Password = styled.input.attrs({ type: "password" })`
  padding: 0.5rem;
`;
<Password type="text" />; // renders type="text"
```

Use `withComponent` instead of a runtime `as` prop:

```tsx
import { Link } from "react-router-dom";

const ButtonLink = withComponent(Link, Button);
<ButtonLink to="/settings">Settings</ButtonLink>;
```

Member expressions are not compiler inputs. Bind them first:

```tsx
const Link = Router.Link;
const ButtonLink = styled(Link)`
  text-decoration: none;
`;
```

For manual composition:

```tsx
const focused = css`
  outline: 2px solid currentColor;
`;
<a className={cx(Button.className, isFocused && focused)} />;
```

## Keyframes

Direct keyframe references are the only CSS interpolation:

```tsx
const spin = keyframes`
  to { transform: rotate(1turn); }
`;

const Spinner = styled.span`
  animation: ${spin} 800ms linear infinite;
`;
```

Runtime values do not belong in extracted templates. Use CSS custom properties or inline styles for dynamic values.

## Global CSS

`globalCss` is an honest module side effect. It does not create a fake React component.

```tsx
// global.css.ts
import { globalCss } from "@alex.radulescu/styled-static";

globalCss`
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; }
`;
```

```tsx
// main.tsx
import "./global.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

The generated CSS participates in Vite asset hashing. A changed production stylesheet gets a new hashed asset URL; it is not permanently cached as a fixed `global.css` URL.

## UI libraries and applications

No manual output mode is needed.

- Application build: Vite collects virtual CSS through its normal CSS pipeline.
- Library build: when formats are omitted, the plugin selects ESM + CommonJS. Each chunk receives a colocated CSS link: `import "./chunk.css"` or `require("./chunk.css")`.
- Consumer without styled-static: imports the built library normally; Vite follows its standard CSS imports.
- Consumer also using styled-static: the consumer plugin compiles consumer source while the library CSS remains ordinary built CSS. They do not conflict.
- Tree shaking: an unused library chunk and its colocated stylesheet can be omitted together.

```tsx
// UI library source
export const Button = styled.button`
  padding: 0.65rem 1rem;
`;
```

Conceptual library output:

```js
import "./Button.css";
export const Button = Object.assign(/* readable generated component */);
```

CommonJS output uses the equivalent `require("./Button.css")`. Both formats work when consumed by a Vite app.

UMD and IIFE cannot express a static stylesheet dependency, so the plugin rejects those library formats. Build the library as ESM or CommonJS, let the consuming application create its browser bundle, and have that application own any final `<link>` tag.

Avoid importing one package-wide CSS entry from every module; that makes style tree shaking impossible.

## Roll-your-own themes

Theme selection is application policy, so it is not part of styled-static. This complete recipe supports `system`, `light`, `dark`, and a custom `copper` theme.

```ts
// theme.ts
export type ThemeChoice = "system" | "light" | "dark" | "copper";
type ResolvedTheme = Exclude<ThemeChoice, "system">;

const STORAGE_KEY = "theme";
const choices: readonly ThemeChoice[] = ["system", "light", "dark", "copper"];
let currentChoice: ThemeChoice = "system";

function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === "string" && choices.includes(value as ThemeChoice);
}

function systemTheme(): ResolvedTheme {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  return choice === "system" ? systemTheme() : choice;
}

function readChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeChoice(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function applyTheme(choice: ThemeChoice): void {
  document.documentElement.dataset.theme = resolveTheme(choice);
  document.documentElement.dataset.themeChoice = choice;
}

export function setTheme(choice: ThemeChoice): void {
  currentChoice = choice;
  applyTheme(choice);
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* storage may be blocked */
  }
}

export function startTheme(): () => void {
  currentChoice = readChoice();
  applyTheme(currentChoice);
  const media = matchMedia("(prefers-color-scheme: dark)");
  const update = () => {
    if (currentChoice === "system") applyTheme("system");
  };
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
```

Run this small equivalent before CSS loads to prevent a wrong-theme flash:

```html
<script nonce="YOUR_CSP_NONCE">
  const choices = ["system", "light", "dark", "copper"];
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  let choice = "system";
  try {
    const stored = localStorage.getItem("theme");
    if (choices.includes(stored)) choice = stored;
  } catch {}
  const resolved = choice === "system" ? (dark ? "dark" : "light") : choice;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeChoice = choice;
</script>
```

```tsx
globalCss`
  :root, [data-theme="light"] {
    --surface: #ffffff;
    --text: #1d2433;
    color-scheme: light;
  }

  [data-theme="dark"] {
    --surface: #121722;
    --text: #eef2ff;
    color-scheme: dark;
  }

  [data-theme="copper"] {
    --surface: #2b1810;
    --text: #ffd7b0;
    --accent: #c77b48;
    color-scheme: dark;
  }

  body { background: var(--surface); color: var(--text); }
`;
```

For SSR, store the choice in a cookie and render both data attributes on `<html>`. Under a strict CSP, use a request-specific nonce on the early script or serve an equivalent allowed external script. Treat storage and media APIs as browser-only.

## Supported source grammar

| Need          | Supported                            | Rejected                         | Use instead                |
| ------------- | ------------------------------------ | -------------------------------- | -------------------------- |
| Intrinsic     | `styled.div`                         | `styled["div"]`, `styled("div")` | Dot syntax                 |
| Component     | `styled(Button)`                     | `styled(UI.Button)`              | `const Button = UI.Button` |
| Placement     | `const Button = ...` at module scope | nested, `let`, `var`             | One top-level `const`      |
| Statements    | one extracted declaration            | `const A = ..., B = ...`         | Separate statements        |
| Global CSS    | top-level `globalCss\`...\``         | assignment or render component   | Import the module          |
| Variant CSS   | `css\`...\``                         | strings, plain templates         | Tag every CSS value        |
| Config keys   | identifiers such as `tone`           | quoted, computed, numeric keys   | Simple identifier names    |
| Interpolation | `${animationName}` from `keyframes`  | runtime expressions              | CSS variables/inline style |
| Attrs         | `.attrs({ tabIndex: 0 })` literals   | functions, spreads, expressions  | Props for dynamic values   |

Quoted HTML attribute names such as `{ "aria-label": "Close" }` remain supported in `attrs`. The variant name `css` is reserved for compound styles. Styled-component variants also cannot use React's structural props: `className`, `children`, `ref`, or `key`.

Unsupported syntax fails the build with an actionable `[styled-static]` error.

## Generated output and runtime

Input:

```tsx
const Button = styled.button`
  color: blue;
`;
```

Conceptual output:

```tsx
import { createElement } from "react";
import { mergeClassNames } from "@alex.radulescu/styled-static/runtime";
import "virtual:styled-static/…/0.css";

const Button = Object.assign(
  (props) =>
    createElement("button", {
      ...props,
      className: mergeClassNames("ss-Button-01k9x3m7q4abc", props.className),
    }),
  { className: "ss-Button-01k9x3m7q4abc" },
);
```

The class identity uses package identity, package-relative source path, and local declaration name. Development and production use the same readable name. Editing only CSS does not rename the class during HMR.

Workspace and linked-library source should live under a named `package.json`. This keeps class identity independent of the checkout's absolute path; extracted source outside the Vite root without a named package fails with a clear error.

## HMR and diagnostics

- Each source module owns stable virtual style modules.
- Vite owns development style injection, updates, and removal through virtual CSS modules.
- A refresh removes stale style records and invalidates every affected virtual module.
- Development styles include their exact source path for DevTools.
- Query-bearing Vite module IDs are normalized consistently.

Debug only when needed:

```bash
DEBUG_STYLED_STATIC=true vite
```

This can print local paths. Do not enable it in shared production logs.

## Security model

- Source is recognized through Vite's AST, never regular expressions.
- Only exact imports from `@alex.radulescu/styled-static` are compiler inputs.
- User JavaScript is never evaluated during extraction.
- Generated literals use safe JavaScript escaping.
- CSS module identifiers never embed raw file paths.
- Variant choices use explicit equality and own-property checks.
- Runtime values never become selectors or class names.
- Dynamic/spread variant configuration is rejected before generation.
- CSS comments escape comment terminators and newlines.

CSS template contents are trusted developer-authored CSS. Apply normal review and CSP policy to them.

## Migrating to 1.0

- Node: upgrade to 24+.
- Vite: upgrade to 8.
- Plugin: replace `styledStatic({...})` with `styledStatic()`.
- Global styles: replace `const Global = createGlobalStyle\`...\`; <Global />`with top-level`globalCss\`...\``.
- Themes: copy the application-owned recipe above.
- Runtime helper: replace private `m` imports with `mergeClassNames`; most applications should import neither.
- Intrinsics: replace `styled("div")` and `styled["div"]` with `styled.div`.
- Member components: bind `UI.Button` to a local identifier before styling it.
- Variants: wrap every base, value, and compound CSS value in `css\`...\``.
- Declarations: use one named top-level `const` for each extracted value.

## License

MIT
