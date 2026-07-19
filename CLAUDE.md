# styled-static maintainer guide

## BLUF

styled-static 1.x is a static styling language for React 19 and Vite 8. Keep its source grammar small. The compiler turns trusted developer-authored templates into readable React code and extracted CSS. The browser runtime only merges class names.

## Platform

- Node 24+
- React 19
- Vite 8
- TypeScript strict mode
- Bun workspaces, tests, and package management
- No browser-runtime dependency

## Public API

```tsx
styled.div`...`;
styled(LocalComponent)`...`;
styled.input.attrs({ type: "password" })`...`;
css`...`;
keyframes`...`;
globalCss`...`;
styledVariants({ component, css: css`...`, variants: { ... } });
cssVariants({ css: css`...`, variants: { ... } });
withComponent(Target, StyledSource);
cx("base", condition && "active");
```

The Vite plugin is option-free: `styledStatic()`. Library builds default to ESM + CommonJS because both can link colocated CSS; UMD and IIFE are rejected.

## Source grammar

- One named top-level `const` per extracted definition.
- `globalCss` is a top-level expression.
- Use `styled.div`, never bracket notation or `styled("div")`.
- Component arguments are local identifiers, never member expressions.
- Variant CSS always uses the imported `css` tag.
- Configuration keys are identifiers; no quoted, computed, numeric, or `__proto__` keys. Static attrs also allow quoted HTML/ARIA names.
- Only direct `keyframes` identifiers may be interpolated into CSS.
- Imports may be aliased and must come from the exact package name.

## Architecture

```text
source + Vite AST
  -> compiler.ts (pure module result)
     -> JavaScript + source map + style artifacts
  -> vite.ts (registry and lifecycle)
     -> dev injection/HMR, app CSS, or library chunk CSS
```

- `compiler.ts` owns module compilation and retains no state.
- `parse.ts` validates and lowers all top-level definitions in one declaration pass.
- `codegen.ts` owns safe readable JavaScript generation.
- `vite.ts` owns only Vite lifecycle and the style registry.
- `runtime/index.ts` exports `mergeClassNames`.
- `showcase/` owns content, DOM, interactions, and semantic assertions.
- `adapters/` and benchmark-local App files own styling-library declarations.
- Docs and the styled-static benchmark import the exact same adapter.

## Non-negotiable invariants

- AST recognition, not regex rewriting.
- Never evaluate user JavaScript during extraction.
- Escape every generated string literal.
- Never embed raw paths in virtual import IDs.
- Stable class identity excludes CSS text so HMR edits do not rename declarations.
- Same local names in different modules do not collide.
- Variant runtime code uses explicit equality and own-property checks.
- Base, extension, then user class order.
- Static attrs are defaults; explicit props win.
- Library output uses ordinary colocated ESM imports or CommonJS requires.

## Commands

```bash
bun install
bun run format:check
bun run lint
bunx tsc --noEmit
bun run test
bun run build
(cd docs && bun run build)
for project in emotion panda-css restyle styled-static tailwind; do (cd "benchmarks/$project" && bun run build); done
```

Run `DEBUG_STYLED_STATIC=true vite` for temporary diagnostics. It can reveal local source paths.

## Changes

Prefer tests at the compiler/plugin interface. Add a rejection row for every grammar restriction and a behavioral test for every lifecycle fix. Do not expose parser or registry internals merely for tests. Update the README when the public grammar or generated model changes.
