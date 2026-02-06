# Spec: CSS Framework Benchmark Suite
**Date:** 2026-02-06
**Target path:** `/specs/2026-02-06-benchmarks.md` (copy upon approval)

---

## 1. Goal

Build a benchmark suite under `/benchmarks/` that replicates the **full docs site** (`/docs/`) in 5 CSS frameworks, then measures build time, output file sizes, and optionally Lighthouse scores. Each implementation is a self-contained Vite + React 19 app differing ONLY in the styling library.

**Frameworks:**
1. **styled-static** — baseline copy from `/docs/`
2. **Emotion** — runtime CSS-in-JS (`@emotion/styled` + `@emotion/css`)
3. **Tailwind CSS v4** — utility classes with `tailwind-variants` + `clsx`
4. **Restyle** — runtime, object-syntax `styled()`
5. **Panda CSS** — build-time codegen + PostCSS

---

## 2. Folder Structure

```
benchmarks/
├── benchmark.sh              # Build time + file size measurement
├── lighthouse.sh             # Optional Lighthouse scoring
├── results.md                # Generated markdown comparison table
├── styled-static/            # Phase 0
├── emotion/                  # Phase 1
├── tailwind/                 # Phase 2
├── restyle/                  # Phase 3
└── panda-css/                # Phase 4
```

Each sub-folder:
```
<framework>/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx                    # ~1,212 lines — layout + Getting Started
    ├── theme.ts                   # Theme helpers (for non-styled-static only)
    └── sections/
        ├── shared.tsx             # ~390 lines — reusable components
        ├── ApiSection.tsx         # ~382 lines — API docs
        ├── FeaturesSection.tsx    # ~180 lines — Features docs
        └── HowItWorksSection.tsx  # ~476 lines — Internals docs
```

---

## 3. What Stays Identical Across All Implementations

- **All JSX structure** — same elements, same nesting, same content text
- **All text content** — same documentation text (about styled-static)
- **All interactive logic** — search, scroll spy, theme toggle, lazy loading, code copy
- **All dependencies except styling** — react 19, react-dom 19, lucide-react, sugar-high
- **All dev dependencies** — typescript, @vitejs/plugin-react, vite
- **index.html** — identical shell
- **tsconfig.json** — identical (except paths if needed)

What changes per framework:
- Styling library dependency in `package.json`
- Import statements for styling APIs
- How components are defined (template literals vs objects vs utility classes)
- `vite.config.ts` plugin setup
- Framework-specific config files (e.g., `panda.config.ts`, `postcss.config.cjs`)

---

## 4. Source Inventory — Components to Convert

### App.tsx (~60 styled components/helpers)

**Global styles** (`createGlobalStyle`):
- CSS custom properties (`:root` and `[data-theme="dark"]`)
- Reset styles (`box-sizing`, scrollbar, `html`, `body`, `::selection`)

**Layout components** (all `styled.X`):
- `Layout` — flex container, min-height: 100vh
- `MobileHeader` — fixed header, hidden on desktop, shown at 767px breakpoint
- `BurgerButton` — hamburger menu button with `span` children
- `HeaderTitle` — mobile header title text
- `Overlay` — mobile sidebar backdrop with `[data-visible]` attr
- `Sidebar` — fixed 260px sidebar with `[data-open]` attr, mobile transform
- `SidebarHeader` — padded container with border
- `Logo` — flex link with hover color
- `SearchInput` — relative container
- `SearchIcon` — absolute positioned icon
- `SearchField` — full-width input with focus/placeholder styles
- `SearchHint` — keyboard shortcut badge
- `NavSection` — scrollable nav
- `NavGroup` — padded nav group
- `NavGroupTitle` — uppercase muted label with icon
- `NavItem` — nav link with hover/border-left states
- `SidebarFooter` — flex footer with border
- `ThemeToggle` — icon button with hover
- `IconLink` — icon link button with hover
- `Main` — flex-1 with margin-left: sidebar-width, mobile margin-top
- `Content` — centered max-width container

**Typography** (inline for Getting Started):
- `PageTitle` — h1, 2.5rem
- `PageSubtitle` — subtitle paragraph
- `HeroBanner` — decorative gradient with `::before`/`::after` pseudo-elements
- `Section` — scroll-margin-top
- `Breadcrumb` — colored label
- `SectionTitle` — h2
- `Paragraph` — basic p
- `InlineCode` — code with background

**Callout** (inline):
- `calloutStyles` — `cssVariants` with `note`/`tip`/`warning` variants (light+dark colors)
- `CalloutIcon` — icon wrapper
- `CalloutContent` — flex-1 content

**Other:**
- `activeNavItem` — `css` helper for active nav state
- `LoadingWrapper` — centered loading placeholder

### shared.tsx (~20 styled components)

**Typography** (exported):
- `Section`, `Breadcrumb`, `SectionTitle`, `SubsectionTitle`, `Paragraph`, `InlineCode`

**Demo area:**
- `DemoArea` — bordered container with bg
- `DemoLabel` — uppercase "Result" label
- `ButtonGroup` — flex-wrap container

**Button** (`styledVariants`):
- Base: inline-flex, padding, font, border-radius, focus/disabled states
- Variant: `primary` | `secondary` | `ghost`
- Size: `sm` | `md` | `lg`

**Demo buttons:**
- `StyledButton` — basic styled button
- `ExtendedButton` — `styled(StyledButton)` with font-weight + uppercase
- `highlightClass` — `css` helper for box-shadow highlight
- `Counter` — flex counter display

**Code block:**
- `CodeBlockWrapper` — rounded container with dark bg
- `CodeBlockHeader` — flex header with dark bg
- `TabLabel` — filename tab
- `CodeBlockContent` — pre with monospace font, syntax highlighting
- `CopyButton` — copy action button
- `CodeBlock()` — function component using sugar-high

**Callout:**
- `calloutStyles` — `cssVariants` (note/tip/warning)
- `CalloutIcon`, `CalloutContent`
- `Callout()` — function component

### Section files (ApiSection, FeaturesSection, HowItWorksSection)

Each has:
- 1 section-specific wrapper (`styled.div` with unique CSS custom property)
- Uses shared components from `shared.tsx`
- Heavy use of `CodeBlock` with inline code strings
- `ApiSection` has `useState` for highlight demo
- All import from `@alex.radulescu/styled-static` directly for `styled`, `cx`

---

## 5. Theme Helpers

The styled-static package exports these pure DOM helpers. For non-styled-static frameworks, inline them as `src/theme.ts`:

```ts
export function initTheme(): "light" | "dark" {
  const stored = localStorage.getItem("theme");
  const theme = stored === "dark" || stored === "light"
    ? stored
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

export function setTheme(theme: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export function getTheme(): "light" | "dark" {
  return (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
}

export function onSystemThemeChange(cb: (theme: "light" | "dark") => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => cb(e.matches ? "dark" : "light");
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
```

---

## 6. Phase-by-Phase Implementation

### Phase 0: Scaffold + styled-static baseline + benchmark script

**Goal:** Create `/benchmarks/styled-static/` as the baseline and the `benchmark.sh` script.

**Steps:**
1. Create `/benchmarks/` directory
2. Copy all files from `/docs/` into `/benchmarks/styled-static/`
3. Modify `benchmarks/styled-static/vite.config.ts`:
   - Remove `resolve.alias` block (no local source references)
   - Change `base` from `"/styled-static/"` to `"/"`
   - Keep `styledStatic()` and `react()` plugins
   - Keep `lightningcss` transformer
4. Modify `benchmarks/styled-static/tsconfig.json`:
   - Remove `paths` block
5. Modify `benchmarks/styled-static/package.json`:
   - Ensure `@alex.radulescu/styled-static: "^0.7.3"` from npm
6. Create `benchmarks/benchmark.sh` (see Section 7)
7. Test: `cd benchmarks/styled-static && bun install && bun run build`

**Verification:** Build succeeds, `dist/` contains JS/CSS/HTML files.

---

### Phase 1: Emotion

**Goal:** Convert styled-static → Emotion. Closest API surface.

**Dependencies:**
```json
{
  "@emotion/react": "^11.13.0",
  "@emotion/styled": "^11.13.0",
  "@emotion/css": "^11.13.0"
}
```

**vite.config.ts:**
```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  css: { transformer: "lightningcss" },
  plugins: [react({ jsxImportSource: "@emotion/react" })],
});
```

**Conversion rules:**

| styled-static API | Emotion equivalent |
|---|---|
| `import { styled } from "@alex.radulescu/styled-static"` | `import styled from "@emotion/styled"` |
| `styled.button\`...\`` | `styled.button\`...\`` (identical syntax) |
| `styled(Base)\`...\`` | `styled(Base)\`...\`` (identical) |
| `import { css } from "..."` | `import { css } from "@emotion/css"` |
| `css\`...\`` | `css\`...\`` (identical — returns className string) |
| `cx(a, b)` | `import { cx } from "@emotion/css"` then `cx(a, b)` |
| `createGlobalStyle\`...\`` | `import { Global, css } from "@emotion/react"` then `<Global styles={css\`...\`} />` |
| `initTheme/setTheme/getTheme/onSystemThemeChange` | Import from local `./theme.ts` |

**`cssVariants` conversion** — implement as a function:
```tsx
// Before
const calloutStyles = cssVariants({
  css: css`...base...`,
  variants: { type: { note: css`...`, tip: css`...`, warning: css`...` } },
});
// Usage: <div className={calloutStyles({ type: "note" })}>

// After (Emotion)
const calloutBase = css`...base...`;
const calloutVariants = {
  note: css`...note...`,
  tip: css`...tip...`,
  warning: css`...warning...`,
};
function calloutStyles({ type }: { type: "note" | "tip" | "warning" }) {
  return cx(calloutBase, calloutVariants[type]);
}
// Usage: identical — <div className={calloutStyles({ type: "note" })}>
```

**`styledVariants` conversion** — implement as styled component with props:
```tsx
// Before
const Button = styledVariants({
  component: "button",
  css: css`...base...`,
  variants: { variant: { primary: css`...`, ... }, size: { sm: css`...`, ... } },
});

// After (Emotion) — use styled with prop-based className
const ButtonBase = styled.button`...base...`;
const variantStyles = { primary: css`...`, secondary: css`...`, ghost: css`...` };
const sizeStyles = { sm: css`...`, md: css`...`, lg: css`...` };

function Button({ variant, size, className, ...props }: { variant: string; size: string; className?: string } & React.ComponentProps<"button">) {
  return <ButtonBase className={cx(variantStyles[variant], sizeStyles[size], className)} {...props} />;
}
```

**Key notes:**
- Emotion is **runtime** — all CSS computed and injected at render time
- Expect: **larger JS**, **minimal/no CSS files** in output
- The `css` from `@emotion/css` (framework-agnostic) returns className strings like styled-static
- The `css` from `@emotion/react` returns objects (for the `css` prop) — don't use this for className-based patterns
- `<Global>` must be rendered in the component tree (put it in `App()` return)

---

### Phase 2: Tailwind CSS v4

**Goal:** Convert styled components to idiomatic Tailwind utility classes with `tailwind-variants` for component abstraction.

**Dependencies:**
```json
{
  "tailwindcss": "^4.0.0",
  "@tailwindcss/vite": "^4.0.0",
  "tailwind-variants": "^0.3.0",
  "clsx": "^2.1.0"
}
```

**vite.config.ts:**
```ts
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**src/index.css** (imported in main.tsx):
```css
@import "tailwindcss";

/* Custom dark mode variant matching styled-static's data-theme approach */
@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
  /* All CSS variables from createGlobalStyle go here */
  --color-bg: #ffffff;
  --color-bg-sidebar: #fafafa;
  --color-bg-code: #0f0f0f;
  --color-bg-callout: #f0fdf4;
  --color-border: #e2e8f0;
  --color-border-subtle: #f1f5f9;
  --color-text: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-nav-active: rgba(16, 185, 129, 0.08);
  --sidebar-width: 260px;
  --header-height: 60px;
  --mobile-header-height: 56px;
  --content-max-width: 720px;
  --radius: 8px;
  --radius-lg: 12px;
  --transition: 0.15s ease;
  /* sugar-high vars */
  --sh-class: #4ec9b0;
  --sh-identifier: #9cdcfe;
  --sh-sign: #d4d4d4;
  --sh-property: #9cdcfe;
  --sh-entity: #4fc1ff;
  --sh-jsxliterals: #ce9178;
  --sh-string: #ce9178;
  --sh-keyword: #c586c0;
  --sh-comment: #6a9955;
}

/* Dark theme overrides */
[data-theme="dark"] {
  --color-bg: #0a0a0a;
  --color-bg-sidebar: #111111;
  --color-bg-code: #0f0f0f;
  --color-bg-callout: #0c2915;
  --color-border: #1f1f1f;
  --color-border-subtle: #171717;
  --color-text: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
}

/* Global resets */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: calc(var(--header-height) + 2rem); }
body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 15px;
  line-height: 1.65;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}
::selection { background: var(--color-primary); color: white; }
```

**Conversion pattern — simple component:**
```tsx
// styled-static
const NavItem = styled.a`
  display: block; padding: 0.4375rem 0.75rem; margin: 0.0625rem 0;
  font-size: 0.875rem; color: var(--color-text-secondary);
  text-decoration: none; border-radius: 6px;
  border-left: 2px solid transparent; transition: all var(--transition);
  &:hover { color: var(--color-text); background: var(--color-border-subtle); }
`;

// Tailwind
function NavItem({ className, ...props }: React.ComponentProps<"a">) {
  return <a className={clsx(
    "block py-[0.4375rem] px-3 my-px text-sm text-[var(--color-text-secondary)]",
    "no-underline rounded-md border-l-2 border-transparent transition-all duration-150",
    "hover:text-[var(--color-text)] hover:bg-[var(--color-border-subtle)]",
    className
  )} {...props} />;
}
```

**Conversion pattern — variant component with `tv()`:**
```tsx
import { tv } from "tailwind-variants";

const button = tv({
  base: "inline-flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium border-none rounded-md cursor-pointer transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-[rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed",
  variants: {
    variant: {
      primary: "bg-[var(--color-primary)] text-white hover:enabled:bg-[var(--color-primary-hover)]",
      secondary: "bg-[var(--color-border)] text-[var(--color-text)] hover:enabled:bg-[var(--color-text-secondary)] hover:enabled:text-white",
      ghost: "bg-transparent text-[var(--color-text-secondary)] hover:enabled:bg-[var(--color-border)] hover:enabled:text-[var(--color-text)]",
    },
    size: {
      sm: "py-1.5 px-3 text-[0.8125rem]",
      md: "py-2 px-4 text-sm",
      lg: "py-3 px-6 text-base",
    },
  },
});

function Button({ variant, size, className, ...props }: { variant: "primary" | "secondary" | "ghost"; size: "sm" | "md" | "lg" } & React.ComponentProps<"button">) {
  return <button className={button({ variant, size, className })} {...props} />;
}
```

**Conversion pattern — `cssVariants` with `tv()`:**
```tsx
const callout = tv({
  base: "flex gap-3.5 p-[1.125rem_1.25rem] my-6 rounded-[var(--radius)] text-[0.9375rem] leading-relaxed",
  variants: {
    type: {
      note: "bg-[#eff6ff] border border-[#bfdbfe] dark:bg-[#1e3a5f] dark:border-[#2563eb40]",
      tip: "bg-[#f0fdf4] border border-[#bbf7d0] dark:bg-[#0c2915] dark:border-[#10b98140]",
      warning: "bg-[#fffbeb] border border-[#fde68a] dark:bg-[#3d2e0a] dark:border-[#d9790640]",
    },
  },
});
```

**Key notes:**
- `tailwind-variants` `tv()` maps almost 1:1 to `styledVariants`/`cssVariants`
- `clsx` replaces `cx()` for conditional classes
- `activeNavItem` → just a `clsx` conditional with inline Tailwind classes
- Components without variants: plain function with `className={clsx("...", className)}`
- No `.className` static property — not needed (use the classes directly)
- `createGlobalStyle` → `index.css` with `@theme` + raw CSS
- Pseudo-elements (`::before`, `::after` on HeroBanner) → use Tailwind's `before:` / `after:` prefixes or fall back to a small `<style>` block / raw CSS in `index.css`
- Tailwind is **build-time** — zero runtime JS for styles

---

### Phase 3: Restyle

**Goal:** Convert template literal CSS to Restyle's object-syntax `styled()`.

**Dependencies:**
```json
{
  "restyle": "^2.0.0"
}
```

**vite.config.ts:**
```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
```

**Conversion rules:**

| styled-static | Restyle |
|---|---|
| `styled.button\`padding: 1rem;\`` | `styled('button', { padding: '1rem' })` |
| `styled(Base)\`...\`` | Compose manually (see below) |
| `css\`...\`` | `css({ ... })` returns `[className, Styles]` tuple |
| `createGlobalStyle\`...\`` | `<GlobalStyles>{{ ":root": {...}, body: {...} }}</GlobalStyles>` |
| `cssVariants` | Manual function with `css()` per variant |
| `styledVariants` | `styled('button', (props) => ({...}))` resolver |
| `cx(a, b)` | Template literal `${a} ${b}` or custom cx helper |

**CSS property conversion** (kebab-case → camelCase):
```
padding           → padding (same)
font-size         → fontSize
font-weight       → fontWeight
font-family       → fontFamily
border-radius     → borderRadius
background        → background (same)
text-decoration   → textDecoration
text-transform    → textTransform
letter-spacing    → letterSpacing
flex-direction    → flexDirection
align-items       → alignItems
justify-content   → justifyContent
overflow-x        → overflowX
overflow-y        → overflowY
border-right      → borderRight
border-bottom     → borderBottom
box-sizing        → boxSizing
scroll-margin-top → scrollMarginTop
scroll-behavior   → scrollBehavior
line-height       → lineHeight
min-height        → minHeight
max-width         → maxWidth
z-index           → zIndex
pointer-events    → pointerEvents
box-shadow        → boxShadow
margin-left       → marginLeft
margin-bottom     → marginBottom
-webkit-font-smoothing → WebkitFontSmoothing
```

**Nested selectors:**
```tsx
// styled-static
const NavItem = styled.a`
  color: gray;
  &:hover { color: black; background: white; }
  @media (max-width: 767px) { font-size: 0.8rem; }
`;

// Restyle
const NavItem = styled('a', {
  color: 'gray',
  '&:hover': { color: 'black', background: 'white' },
  '@media (max-width: 767px)': { fontSize: '0.8rem' },
});
```

**Component extension workaround:**
```tsx
// styled-static: const Extended = styled(StyledButton)`font-weight: 600;`
// Restyle: render the base component and layer extra styles
const StyledButton = styled('button', { padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' });

function ExtendedButton(props: React.ComponentProps<typeof StyledButton>) {
  const [cls, Styles] = css({ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' });
  return <><StyledButton {...props} className={`${cls} ${props.className || ''}`} /><Styles /></>;
}
```

**`css()` tuple pattern:**
```tsx
// Restyle's css() returns [classNames, StylesComponent]
// The <Styles /> must be rendered for the styles to take effect
const [highlightClass, HighlightStyles] = css({ boxShadow: '0 0 0 3px var(--color-primary)' });
// Must render <HighlightStyles /> somewhere in the tree
```

**Global styles:**
```tsx
import { GlobalStyles } from 'restyle';

function App() {
  return (
    <>
      <GlobalStyles>
        {{
          ':root': {
            '--color-bg': '#ffffff',
            '--color-text': '#0f172a',
            // ... all CSS variables
          },
          '[data-theme="dark"]': {
            '--color-bg': '#0a0a0a',
            // ... dark overrides
          },
          '*': { boxSizing: 'border-box' },
          html: { scrollBehavior: 'smooth' },
          body: { margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '15px' },
          '::selection': { background: 'var(--color-primary)', color: 'white' },
        }}
      </GlobalStyles>
      {/* rest of app */}
    </>
  );
}
```

**Key notes:**
- Every `css()` call returns a tuple — `<Styles />` components must be rendered
- This is the most labor-intensive conversion (all CSS → camelCase objects)
- Restyle is **runtime** (2.2kb) — styles injected via `<style>` elements
- No Vite plugin needed — zero build configuration
- Component extension is not first-class — use className composition

---

### Phase 4: Panda CSS

**Goal:** Convert to Panda CSS codegen with object syntax.

**Dependencies (devDependencies):**
```json
{
  "@pandacss/dev": "^0.52.0"
}
```

**Additional files:**

`postcss.config.cjs`:
```js
module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {},
  },
};
```

`panda.config.ts`:
```ts
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  theme: {
    extend: {
      tokens: {
        // Can define tokens here or use raw CSS variables
      },
    },
  },
  globalCss: {
    ":root": {
      "--color-bg": "#ffffff",
      "--color-text": "#0f172a",
      // ... all CSS variables
    },
    "[data-theme='dark']": {
      "--color-bg": "#0a0a0a",
      // ... dark overrides
    },
    html: { scrollBehavior: "smooth", scrollPaddingTop: "calc(var(--header-height) + 2rem)" },
    body: { margin: 0, fontFamily: "'Inter', -apple-system, sans-serif", fontSize: "15px", lineHeight: 1.65, color: "var(--color-text)", background: "var(--color-bg)" },
    "::selection": { background: "var(--color-primary)", color: "white" },
  },
});
```

**vite.config.ts:**
```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
```

**package.json scripts:**
```json
{
  "prepare": "panda codegen",
  "dev": "panda codegen && vite",
  "build": "panda codegen && tsc && vite build"
}
```

**src/index.css:**
```css
@layer reset, base, tokens, recipes, utilities;
```

**Conversion rules:**

| styled-static | Panda CSS |
|---|---|
| `styled.button\`padding: 1rem;\`` | `<button className={css({ padding: '1rem' })}>` |
| `styled(Base)\`...\`` | Compose: `className={css({...extra})}` on `<Base>` |
| `css\`...\`` | `css({...})` from `styled-system/css` (returns className) |
| `cx(a, b)` | `cx(a, b)` from `styled-system/css` |
| `createGlobalStyle` | `globalCss` in `panda.config.ts` |
| `cssVariants` / `styledVariants` | `cva({...})` from `styled-system/css` |

**Conversion pattern — simple component:**
```tsx
import { css } from "../styled-system/css";

// styled-static: const Sidebar = styled.aside`position: fixed; ...`;
function Sidebar({ className, children, ...props }: React.ComponentProps<"aside"> ) {
  return (
    <aside className={css({
      position: "fixed", top: 0, left: 0,
      width: "var(--sidebar-width)", height: "100vh",
      background: "var(--color-bg-sidebar)",
      borderRight: "1px solid var(--color-border)",
      display: "flex", flexDirection: "column", zIndex: 100,
    })} {...props}>
      {children}
    </aside>
  );
}
```

**Conversion pattern — variants with `cva()`:**
```tsx
import { cva, cx } from "../styled-system/css";

const button = cva({
  base: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.875rem",
    fontWeight: 500, border: "none", borderRadius: "6px",
    cursor: "pointer", transition: "all 0.2s ease",
  },
  variants: {
    variant: {
      primary: { background: "var(--color-primary)", color: "white", _hover: { background: "var(--color-primary-hover)" } },
      secondary: { background: "var(--color-border)", color: "var(--color-text)" },
      ghost: { background: "transparent", color: "var(--color-text-secondary)" },
    },
    size: {
      sm: { padding: "0.375rem 0.75rem", fontSize: "0.8125rem" },
      md: { padding: "0.5rem 1rem", fontSize: "0.875rem" },
      lg: { padding: "0.75rem 1.5rem", fontSize: "1rem" },
    },
  },
});

function Button({ variant, size, className, ...props }: { variant: "primary" | "secondary" | "ghost"; size: "sm" | "md" | "lg" } & React.ComponentProps<"button">) {
  return <button className={cx(button({ variant, size }), className)} {...props} />;
}
```

**Key notes:**
- Panda CSS is **build-time** — zero runtime, CSS extracted via PostCSS
- Must run `panda codegen` before any build or dev server start
- `styled-system/` directory is generated — add to `.gitignore`
- Panda has `_hover`, `_focus`, `_disabled` condition helpers (optional — can also use nested `"&:hover"` objects)
- Use raw CSS variable values (`var(--color-X)`) for theme integration — this keeps it comparable
- Benchmark script MUST include `panda codegen` time in build measurement
- CSS property names are camelCase (same as Restyle)

---

### Phase 5: Benchmark Script + Results

**Goal:** Create `benchmark.sh` and optional `lighthouse.sh`, run all benchmarks, generate `results.md`.

**`benchmarks/benchmark.sh`:**
```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORKS=("styled-static" "emotion" "tailwind" "restyle" "panda-css")
RUNS=5
RESULTS_FILE="$SCRIPT_DIR/results.md"

declare -A BUILD_TIMES JS_RAW JS_BROTLI CSS_RAW CSS_BROTLI HTML_RAW

for fw in "${FRAMEWORKS[@]}"; do
  echo "=== Benchmarking: $fw ==="
  FW_DIR="$SCRIPT_DIR/$fw"
  cd "$FW_DIR"

  # Install dependencies
  bun install --frozen-lockfile 2>/dev/null || bun install

  # Build time: run RUNS times, collect all, take median
  times=()
  for i in $(seq 1 $RUNS); do
    rm -rf dist
    start_ms=$(($(date +%s%N) / 1000000))
    bun run build >/dev/null 2>&1
    end_ms=$(($(date +%s%N) / 1000000))
    elapsed=$((end_ms - start_ms))
    times+=("$elapsed")
    echo "  Run $i: ${elapsed}ms"
  done

  # Sort and get median
  sorted=($(printf '%s\n' "${times[@]}" | sort -n))
  median_idx=$(( (RUNS - 1) / 2 ))
  BUILD_TIMES[$fw]="${sorted[$median_idx]}"

  # File sizes (last build is still in dist/)
  JS_RAW[$fw]=$(find dist -name "*.js" -exec cat {} + 2>/dev/null | wc -c | tr -d ' ')
  CSS_RAW[$fw]=$(find dist -name "*.css" -exec cat {} + 2>/dev/null | wc -c | tr -d ' ')
  HTML_RAW[$fw]=$(find dist -name "*.html" -exec cat {} + 2>/dev/null | wc -c | tr -d ' ')

  # Brotli compressed sizes
  JS_BROTLI[$fw]=$(find dist -name "*.js" -exec cat {} + 2>/dev/null | brotli -c 2>/dev/null | wc -c | tr -d ' ')
  CSS_BROTLI[$fw]=$(find dist -name "*.css" -exec cat {} + 2>/dev/null | brotli -c 2>/dev/null | wc -c | tr -d ' ')

  echo "  Median build: ${BUILD_TIMES[$fw]}ms | JS: ${JS_RAW[$fw]}B | CSS: ${CSS_RAW[$fw]}B"
done

# Generate results markdown
cat > "$RESULTS_FILE" << 'HEADER'
# CSS Framework Benchmark Results

> Auto-generated by `benchmark.sh`

HEADER

# Helper to format bytes as KB
fmt() { echo "scale=1; $1 / 1024" | bc; }

echo "| Framework | Build (ms) | JS raw (KB) | JS brotli (KB) | CSS raw (KB) | CSS brotli (KB) | HTML (KB) |" >> "$RESULTS_FILE"
echo "|---|---|---|---|---|---|---|" >> "$RESULTS_FILE"

for fw in "${FRAMEWORKS[@]}"; do
  echo "| $fw | ${BUILD_TIMES[$fw]} | $(fmt ${JS_RAW[$fw]}) | $(fmt ${JS_BROTLI[$fw]}) | $(fmt ${CSS_RAW[$fw]}) | $(fmt ${CSS_BROTLI[$fw]}) | $(fmt ${HTML_RAW[$fw]}) |" >> "$RESULTS_FILE"
done

echo ""
echo "Results written to $RESULTS_FILE"
cat "$RESULTS_FILE"
```

**Optional `benchmarks/lighthouse.sh`:**
- Install: `npm install -g @lhci/cli` or use `npx`
- For each framework: `npx serve dist -l 3456 &`, run `lhci autorun`, kill serve
- Capture Performance, FCP, LCP, TBT, CLS
- Append as a second table in `results.md`

---

## 7. Execution Order

| Phase | What | Thread instructions |
|---|---|---|
| **Phase 0** | Scaffold + styled-static + benchmark.sh | "Read the spec at `/specs/2026-02-06-benchmarks.md`. Execute Phase 0." |
| **Phase 1** | Emotion implementation | "Read the spec at `/specs/2026-02-06-benchmarks.md`. Execute Phase 1. Use `/benchmarks/styled-static/` as the reference implementation to convert from." |
| **Phase 2** | Tailwind implementation | "Read the spec at `/specs/2026-02-06-benchmarks.md`. Execute Phase 2. Use `/benchmarks/styled-static/` as the reference implementation to convert from." |
| **Phase 3** | Restyle implementation | "Read the spec at `/specs/2026-02-06-benchmarks.md`. Execute Phase 3. Use `/benchmarks/styled-static/` as the reference implementation to convert from." |
| **Phase 4** | Panda CSS implementation | "Read the spec at `/specs/2026-02-06-benchmarks.md`. Execute Phase 4. Use `/benchmarks/styled-static/` as the reference implementation to convert from." |
| **Phase 5** | Benchmark run + results | "Read the spec at `/specs/2026-02-06-benchmarks.md`. Execute Phase 5. Run `./benchmarks/benchmark.sh` and verify results." |

Each phase is sequential. Each thread reads the spec, reads the reference implementation, and converts.

---

## 8. Verification Checklist

Per-framework:
- [ ] `bun install` succeeds
- [ ] `bun run build` succeeds without errors
- [ ] `dist/` contains JS, CSS (where applicable), and HTML files
- [ ] `bun run preview` shows the site with correct layout
- [ ] Sidebar navigation works
- [ ] Dark/light theme toggle works
- [ ] Search filters sections
- [ ] Code blocks render with syntax highlighting
- [ ] Copy button works
- [ ] Callouts render with correct colors per type
- [ ] Button variants (primary/secondary/ghost) and sizes render correctly
- [ ] Mobile responsive layout works at 767px breakpoint
- [ ] Lazy-loaded sections load on scroll

Final:
- [ ] `benchmark.sh` runs all 5 frameworks end-to-end
- [ ] `results.md` is generated with all metrics populated
- [ ] No NaN or empty values in the results table
