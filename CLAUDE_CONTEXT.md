# styled-static maintainer context

## What this project is

styled-static is a near-zero-runtime CSS-in-JS library for React 19 and Vite. The Vite plugin extracts CSS and replaces the public authoring API with inline React components or class-name functions. The browser runtime only merges class names.

## Supported authoring API

```tsx
import {
  createGlobalStyle,
  css,
  cssVariants,
  keyframes,
  styled,
  styledVariants,
  withComponent,
} from "@alex.radulescu/styled-static";

const Button = styled.button`
  padding: 1rem;
`;
const PrimaryButton = styled(Button)`
  background: blue;
`;
const PasswordInput = styled.input.attrs({ type: "password" })`
  padding: 0.5rem;
`;

const spin = keyframes`to { transform: rotate(360deg); }`;
const Spinner = styled.div`
  animation: ${spin} 1s linear infinite;
`;

const GlobalStyle = createGlobalStyle`* { box-sizing: border-box; }`;
const focusRing = css`
  outline: 2px solid blue;
`;

const Badge = styledVariants({
  component: "span",
  variants: {
    tone: {
      info: "color: blue;",
      danger: "color: red;",
    },
  },
  defaultVariants: { tone: "info" },
});

const badgeClass = cssVariants({
  variants: {
    size: { sm: "font-size: 0.75rem;", lg: "font-size: 1.25rem;" },
  },
});

const LinkButton = withComponent(RouterLink, Button);
```

## Intentional constraints

- CSS templates are static. The only supported interpolation is a direct, top-level `keyframes` reference such as `${spin}`.
- `styledVariants` and `cssVariants` require one inline object literal. Variable or spread-based configuration is rejected with a build error.
- `.attrs()` accepts one static object literal. Functional attributes are not part of the API.
- Styled declarations must be named, top-level variables so the plugin can generate stable development class names.
- Polymorphism uses `withComponent(To, From)`. There is no runtime `as` prop.
- Ordinary styled components forward props unchanged. Variant props are removed before rendering.
- CSS text is trusted developer-authored source. Do not pass untrusted input into CSS templates or configuration.

## Transformation example

Input:

```tsx
import { styled } from "@alex.radulescu/styled-static";

const Button = styled.button`
  padding: 1rem;
`;
```

Representative output:

```tsx
import "virtual:styled-static/src/Button.tsx/0.css";
import { createElement } from "react";
import { m } from "@alex.radulescu/styled-static/runtime";

const Button = Object.assign(
  (props) =>
    createElement("button", {
      ...props,
      className: m("ss-abc123", props.className),
    }),
  { className: "ss-abc123" },
);
```

The virtual module contains:

```css
.ss-abc123 {
  padding: 1rem;
}
```

## Architecture

```text
src/
  index.ts             Public authoring API placeholders and exports
  types.ts             Public React and variants types
  parse.ts             ESTree parsing and API classification
  codegen.ts           Pure JavaScript replacement generation
  vite.ts              Vite lifecycle, CSS modules, HMR, and file output
  hash.ts              UTF-8 64-bit FNV-1a class-name hash
  theme.ts             Theme and color-scheme browser helpers
  runtime/index.ts     Class-name merge helper
  *.test.ts            Node and browser regression tests
docs/                  Documentation app
benchmarks/            Comparison apps, including the local styled-static build
```

## Design rules

1. Parse JavaScript with the AST. Do not use regular expressions to interpret JavaScript syntax.
2. Generate source with `MagicString` so source maps stay accurate.
3. Keep class order base → extension → user.
4. Keep generated class selection explicit. Never index a class map with an untrusted runtime value.
5. Use `safeStringLiteral()` for strings inserted into generated JavaScript.
6. Keep the browser runtime small. Build-time clarity is more important than clever generated code.
7. Run the React plugin before `styledStatic()`; styled-static uses `enforce: "post"`.

## Vite configuration

```ts
import react from "@vitejs/plugin-react";
import { styledStatic } from "@alex.radulescu/styled-static/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), styledStatic()],
});
```

`cssOutput: "auto"` emits co-located CSS files for library builds and virtual CSS for app builds. `classPrefix` must be a safe CSS identifier segment. Debug logging is opt-in because it exposes local file paths.

## Dependencies

- Runtime peer: React 19.
- Build peer: Vite 5–8.
- Package dependency: `magic-string` for safe edits and source maps.
- Development: Bun, TypeScript, Acorn, oxlint, oxfmt, and Happy DOM.

## Commands

```bash
bun install
bun run test
bun run build
bun run lint
bun run format:check

cd docs && bun run build
cd benchmarks/styled-static && bun run build
```

Use `bun run test`, not raw `bun test`: the package script runs the Node suite and then the browser suite with its DOM preload.

## Security model

- Runtime variant values are compared against explicit known strings.
- Variant selection ignores inherited properties.
- Component references come only from validated identifier/member-expression AST nodes.
- Virtual-module HMR matching strips Vite query strings and escapes source comments.
- Import detection accepts only `@alex.radulescu/styled-static`; unrelated local exports named `styled` are ignored.
- Production class names use a 64-bit content fingerprint. Variant fingerprints include base, defaults, values, and compound rules.
- See `SECURITY.md` for reporting and trust-boundary details.
