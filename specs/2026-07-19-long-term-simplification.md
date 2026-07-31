# styled-static long-term simplification plan

## BLUF

- Ship a breaking `1.0.0` focused on one deep module: a Vite 8 compiler that turns a small, static styling language into readable React code and extracted CSS.
- Keep the high-leverage styling features: `styled`, `css`, variants, keyframes, static attrs, `withComponent`, `cx`, library builds, import aliases, and high-quality HMR.
- Remove unrelated policy and compatibility work: theme runtime helpers, Vite 5–7, Node before 24, configurable plugin modes, pre-minified distribution files, duplicated benchmark applications, and permissive source-code spellings.
- Replace `createGlobalStyle` with the honest side-effecting `globalCss` tag.
- Make the documentation showcase and every benchmark render the same canonical content and structure through styling-library adapters.
- Baseline commit: `5253ab02db028d30bab990d0a3844b69394ff779`.

## Product contract

### Keep

```tsx
const Button = styled.button`
  padding: 1rem;
`;

const LinkButton = styled(Link)`
  text-decoration: none;
`;

const PasswordInput = styled.input.attrs({ type: "password" })`
  padding: 0.5rem;
`;

const selected = css`
  outline: 2px solid currentColor;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const buttonClasses = cssVariants({
  css: css`
    padding: 1rem;
  `,
  variants: {
    tone: {
      normal: css`
        color: black;
      `,
      danger: css`
        color: red;
      `,
    },
  },
});

const VariantButton = styledVariants({
  component: "button",
  css: css`
    padding: 1rem;
  `,
  variants: {
    tone: {
      normal: css`
        color: black;
      `,
      danger: css`
        color: red;
      `,
    },
  },
});

const RouterButton = withComponent(Link, Button);

cx(Button.className, selected);
```

Required qualities:

- Import aliases remain supported.
- Development HMR remains precise and fast, including stale-style removal.
- Direct Vite application use remains automatic.
- Vite library builds emit standard, tree-shakeable JavaScript-to-CSS imports automatically.
- A compiled UI library works in a consumer that does or does not use styled-static directly.
- All unsupported static syntax fails with a short, actionable build error.

### Replace

```tsx
// Before
const GlobalStyle = createGlobalStyle`
  body { margin: 0; }
`;

<GlobalStyle />;

// After
globalCss`
  body { margin: 0; }
`;
```

`globalCss` is a top-level side effect. It produces extracted CSS when its module is imported. It does not create a React component.

### Remove

- `getTheme`
- `setTheme`
- `initTheme`
- `onSystemThemeChange`
- `InitThemeOptions`
- `createGlobalStyle`
- `StyledStaticOptions`
- `classPrefix`
- `cssOutput`
- the `debug` function option
- bracket intrinsic syntax such as `styled["div"]`
- `styled("div")`; use `styled.div`
- computed configuration keys
- numeric and special object keys such as `__proto__`
- member-expression component references such as `UI.Link`; bind them to a local identifier first
- plain strings and untagged templates as variant CSS values
- multiple or mutable extracted declarations in one statement
- Vite 5, 6, and 7 compatibility
- Node versions before 24
- custom distribution minification and size mutation

### Static source grammar

Allow one named top-level `const` definition per statement:

```tsx
export const Button = styled.button`
  color: blue;
`;
```

Allow a top-level `globalCss` expression:

```tsx
globalCss`
  body { margin: 0; }
`;
```

Reject with clear errors:

```tsx
let Button = styled.button``;
const Button = styled.button``,
  Card = styled.div``;
function makeStyles() {
  const Button = styled.button``;
}
const Button = styled(UI.Button)``;
const Box = styled["div"]``;
```

Inside `styledVariants` and `cssVariants`, require `css\`...\`` for base, value, and compound CSS.

## Platform contract

```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "vite": "^8.0.0"
  },
  "engines": {
    "node": "^20.19.0 || >=22.12.0"
  }
}
```

- Use current Vite 8 and `@vitejs/plugin-react` only.
- Keep JavaScript and TypeScript module extensions because they share the same transform path.
- Do not add Vite-version branches.
- Keep Bun as the repository package manager and test runner unless implementation evidence shows a concrete maintenance problem.

## Plugin interface

The complete public plugin interface becomes:

```tsx
styledStatic();
```

Application versus library output is detected from resolved Vite configuration.

Diagnostics remain available only through:

```bash
DEBUG_STYLED_STATIC=true vite
```

Centralize every diagnostic through one internal logger.

## Class names and source traceability

Use one deterministic scheme in development and production:

```text
ss-Button-k9x3m7
```

Identity inputs should be stable and reproducible:

- package identity
- package-relative module path
- local declaration name
- declaration ordinal only when necessary

CSS edits must not unnecessarily rename a declaration during HMR. Same-named declarations in different files or packages must not collide.

Developer acceptance criteria:

- The DOM class includes the local declaration name.
- The DevTools CSS rule identifies or links to the exact source module.
- Source traceability is checked in a real browser, not only through string assertions.
- Development and production use the same class-name function.

## Theme migration documentation

Delete theme implementation and tests from the package. Add a copy-paste guide supporting:

```ts
type Theme = "system" | "light" | "dark" | "copper";
```

The guide must include:

- persistent user selection
- resolving `system` through `prefers-color-scheme`
- live system-preference changes only while selection is `system`
- a custom `copper` theme
- safe storage failure handling
- an early inline initialization script that prevents a wrong-theme flash
- CSS variables for light, dark, and copper
- notes for cookies/SSR and CSP nonces

Theme policy belongs to the application; styled-static only provides `globalCss` and normal CSS capabilities.

## Target implementation shape

Design two deep internal modules and keep other seams private:

```text
source module
    │
    ▼
compiler interface
    │  compile(code, id, context)
    │
    ├── transformed JavaScript + source map
    ├── extracted style artifacts
    └── diagnostics
           │
           ▼
Vite adapter
    ├── development injection + HMR
    ├── application CSS modules
    └── library chunk CSS emission
```

### Compiler

- Analyze imports and top-level declarations in one AST pass.
- Track aliases while enforcing the narrow grammar.
- Lower every accepted definition into one small discriminated internal representation.
- Validate during lowering, before code generation.
- Generate readable JavaScript names.
- Return results instead of mutating global state.
- Keep parsing and generation helpers private unless a second real adapter needs them.

Conceptual internal representation:

```ts
type Definition =
  | StyledDefinition
  | CssDefinition
  | KeyframesDefinition
  | GlobalCssDefinition
  | VariantsDefinition
  | WithComponentDefinition;
```

Do not preserve this exact type layout if a smaller, clearer representation emerges during implementation.

### Vite adapter

- Own plugin lifecycle and the extracted-style registry.
- Select application or library output automatically.
- Keep Vite-specific HMR and bundle behavior out of compiler logic.
- Use Vite 8 hook filters when they make the handler clearer; retain handler-side safety checks where useful.
- Keep virtual module identifiers stable across CSS edits.
- Remove stale style records on update and deletion.
- Treat query-bearing module IDs consistently.
- Preserve standard CSS import processing and source maps.

### Runtime

- Retain one tiny shared class-merging runtime to avoid repeating merge logic in every generated component.
- Rename the internal `m` symbol to readable source terminology such as `mergeClassNames`; consumer minification may shorten it later.
- Keep `cx` as the public multi-value composition helper.
- Keep base → extension → user class ordering explicit and tested.

## Documentation and benchmark architecture

Create one canonical showcase used by both documentation and benchmarks:

```text
showcase/
  content/
  app/
  interactions/
  contract/

adapters/
  styled-static/
  emotion/
  panda-css/
  tailwind/
  restyle/

docs/
  entry using showcase + styled-static adapter

benchmarks/
  build and measurement harness
  results.md
```

Centralize:

- content and copy
- semantic DOM structure
- icons and assets
- state and interactions
- routes or sections
- accessibility behavior
- viewport definitions
- measurement rules
- result formatting
- semantic and visual assertions

Keep adapter-specific:

- style declarations
- providers
- generated styling artifacts
- unavoidable wrapper details
- build-plugin configuration

The adapter seam is real because five styling implementations occupy it. Keep it as small as the showcase permits; do not create a pass-through wrapper for every DOM node.

Verification:

- identical visible text and semantic roles
- identical interaction states
- equivalent DOM where the styling library permits it
- screenshot comparison at fixed viewports and states
- identical production measurement procedure
- docs use the exact styled-static benchmark adapter, not a copy

## README and documentation

Make `README.md` the canonical textual reference for humans and LLMs.

Required order:

1. One-paragraph BLUF
2. Install and configure in under five minutes
3. First component
4. Public interface quick reference
5. Variants
6. Composition and polymorphism
7. Keyframes
8. Global CSS
9. UI-library builds and consumer behavior
10. Roll-your-own theming
11. Supported and intentionally unsupported syntax
12. Generated output and runtime model
13. HMR and debugging
14. Security model
15. Migration to `1.0.0`

Documentation rules:

- One preferred spelling per feature.
- Short examples before explanation.
- Explicit “supported / rejected / use this instead” tables.
- Stable descriptive headings.
- No duplicated hand-maintained `llms.txt`; generate it from canonical content or remove it.
- Docs-site examples import the real package and are compiled as verification fixtures.

## Test strategy

The interface is the test surface. Test observable compiler/plugin behavior instead of private helper details.

### Preserve or add

- accepted syntax table
- rejected syntax table with exact actionable errors
- import-alias coverage for every public compiler binding
- styled extension class order
- attrs precedence
- keyframe interpolation and rejection of other interpolation
- variant defaults and compounds
- inherited-property and unsafe-key security regressions
- identifier collision regressions
- same-name declaration collision regressions
- deterministic class names
- virtual module query handling
- stale HMR CSS removal
- source traceability
- application production build
- UI-library build
- UI-library consumed by a direct styled-static application
- UI-library consumed without the consumer plugin
- `.js`, `.mjs`, and `.cjs` library outputs where Vite 8 supports them
- package import smoke tests
- package contents check

### Delete or consolidate

- theme implementation tests
- Vite 5–7 compatibility tests
- tests for removed grammar
- repeated one-example tests that can become table rows
- tests coupled only to private helper layout
- duplicate docs and benchmark build suites

Keep regression tests named after behavior, not historical line numbers or implementation branches.

## Security invariants

Do not trade away:

- AST-based source recognition and rewriting
- exact package import recognition
- safe JavaScript literal generation
- collision-resistant deterministic identifiers
- explicit equality checks for variant selections
- no untrusted property-map indexing
- validation before generated code is emitted
- source comment and module ID escaping
- selector-safe development style lookup
- no evaluation of user JavaScript during extraction
- no spreads or dynamic variant configuration
- no runtime CSS interpolation except direct keyframe references

Run dependency audits after workspace consolidation and document that CSS template contents are trusted developer input.

## Implementation sequence

### 1. Freeze the new contract with tests

- Add focused tests for the accepted `1.0.0` interface.
- Add rejection tests for every removed syntax form.
- Add `globalCss` tests before removing `createGlobalStyle`.
- Add automatic application/library output tests.
- Add deterministic readable-class and source-trace tests.

### 2. Remove unrelated runtime policy

- Add the theming migration guide.
- Remove theme exports, implementation, browser setup, and tests.
- Replace all repository usage of `createGlobalStyle` with `globalCss`.
- Remove `createGlobalStyle` types, parsing, generation, tests, and docs.

### 3. Narrow package and plugin configuration

- Set Vite 8, React 19, and Vite's supported Node requirements.
- Remove plugin options and validation.
- Add one environment-controlled logger.
- Make application/library selection automatic.
- Remove default/config examples that imply alternatives.

### 4. Deepen the compiler

- Introduce the single compiler result interface.
- Replace three repeated declaration walks with one top-level analysis pass.
- Enforce one named top-level `const` per definition.
- Restrict component references and object keys to the agreed static grammar.
- Restrict variant CSS to tagged `css` values.
- Lower to one discriminated representation.
- Centralize validation and code generation around that representation.

### 5. Simplify naming, generated code, and runtime

- Implement the single readable deterministic class scheme.
- Keep HMR identity stable across CSS edits.
- Add exact source metadata for DevTools.
- Rename generated/runtime identifiers for readability.
- Preserve class order and collision safety.

### 6. Simplify Vite lifecycle implementation

- Separate compiler results from plugin registry state.
- Keep one clear registry ownership model.
- Simplify virtual resolution/loading.
- Preserve precise stale-style cleanup and HMR.
- Preserve automatic application CSS and colocated library CSS.
- Verify Rolldown chunk rewriting across supported output formats.

### 7. Remove distribution mutation

- Remove `scripts/minify.ts`.
- Remove `scripts/sizes.ts` or move non-mutating measurement into the benchmark harness.
- Publish readable TypeScript compiler output.
- Let consuming Vite builds minify and hash final assets.

### 8. Centralize showcase, docs, and benchmarks

- Extract canonical content, structure, behavior, and assertions.
- Implement the small styling adapter seam.
- Point docs and styled-static benchmark to the same adapter.
- Port other styling benchmarks without altering content or visuals.
- Add semantic and visual equivalence verification.
- Delete copied applications and redundant lockfiles/configuration where workspaces can share them safely.

### 9. Rewrite documentation

- Rewrite README in the required order.
- Add migration examples for every breaking change.
- Add the complete theme recipe.
- Explain direct, library, and combined consumption.
- Update package documentation, security notes, generated examples, and maintainer context.

### 10. Full verification and review

- Run formatting, linting, type checking, tests, and builds.
- Build docs/showcase and every styling adapter.
- Run semantic and screenshot equivalence checks.
- Run direct app and UI-library consumption smoke tests.
- Inspect the published package contents.
- Run dependency audits for every remaining workspace.
- Run React Doctor after React showcase changes.
- Run a two-axis code review: project standards and requested contract.
- Fix every actionable review and rerun the full suite.
- Perform a final security review against the invariants above.
- Report intentional false positives or retained trade-offs explicitly.

## Exit criteria

- The agreed public interface is fully documented and tested.
- Removed interfaces cannot silently survive untransformed.
- `styledStatic()` has no options.
- Vite 8 and its supported Node range are the only promised build platform.
- Direct and library consumption work automatically.
- HMR remains precise and source-traceable.
- Theme policy is absent from package runtime and covered by a complete recipe.
- One canonical showcase drives docs and all benchmarks.
- No benchmark application content or visual implementation is copied unnecessarily.
- Distribution JavaScript is readable and consumer-minifiable.
- Tests describe behavior through deep module interfaces.
- Security invariants pass review.
- The working tree contains no unrelated changes.
