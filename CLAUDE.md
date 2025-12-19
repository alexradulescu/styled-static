# CLAUDE.md - Project Context for Claude Code CLI

## What is this?

**styled-static** is a near-zero-runtime CSS-in-JS library for React 19+ with Vite. It provides a styled-components-like API and extracts all CSS at build time. Components are generated inline at build time with a minimal (~45 byte) runtime for className merging.

## Tech Stack

- **Runtime**: React 19+ (uses automatic ref forwarding)
- **Build**: Vite plugin with AST-based transformation
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun
- **Testing**: Vitest
- **Dependencies**: Zero runtime dependencies (uses Vite's built-in tools)

## Project Structure

```
src/
  vite.ts       # Main Vite plugin - AST transformation, CSS extraction
  runtime/
    index.ts    # Minimal runtime (~45 bytes) - just className merging
  index.ts      # Public API exports (styled, css, createGlobalStyle, withComponent)
  types.ts      # TypeScript types (StyledComponent, StyledFunction, etc.)
  hash.ts       # Murmurhash for class name generation
  vite.test.ts  # Comprehensive test suite
example/        # Working demo app
```

## API

```tsx
// Style elements
const Button = styled.button`padding: 1rem;`;

// Extend components (multi-level works too)
const Primary = styled(Button)`background: blue;`;
const BigPrimary = styled(Primary)`font-size: 2rem;`;

// Access className for manual composition
<a className={Button.className} href="/link">Link with button styles</a>

// Get class string
const active = css`outline: 2px solid;`;

// Global styles
const GlobalStyle = createGlobalStyle`* { box-sizing: border-box; }`;

// Polymorphism via withComponent (replaces 'as' prop)
import { Link } from 'react-router-dom';
const LinkButton = withComponent(Link, Button);
<LinkButton to="/path">Router link styled as button</LinkButton>

// Default attributes
const PasswordInput = styled.input.attrs({ type: 'password' })`...`;
```

## Key Design Decisions

1. **AST over Regex** - Uses Vite's built-in parser for robustness
2. **Inline components** - Components are generated as inline functions at build time
3. **No forwardRef** - React 19 handles ref forwarding automatically
4. **className order** - Base → Extension → User for correct cascade
5. **Virtual CSS modules** - Each styled block becomes a virtual .css import
6. **Zero dependencies** - Delegates CSS processing to Vite's pipeline; use Lightning CSS for autoprefixing
7. **No `css` prop** - Intentionally omitted. Named `css` variables encourage reusable styles and add zero plugin complexity
8. **No `shouldForwardProp`** - Not needed. No runtime interpolation means no custom styling props to filter. Variants auto-strip their props; use destructuring or data attributes for edge cases
9. **No `as` prop** - Replaced by `withComponent(To, From)` for build-time polymorphism

## Commands

```bash
bun install          # Install dependencies
bun run build        # Build the library
bun test             # Run tests
cd example && bun dev # Run example app
```

## How Transformation Works

**Input:**

```tsx
const Button = styled.button`
  padding: 1rem;
`;
```

**Output:**

```tsx
import { createElement } from "react";
import { m } from "styled-static/runtime";
import "styled-static:abc123-0.css";

const Button = Object.assign(
  (p) => createElement("button", {...p, className: m("ss-abc123", p.className)}),
  { className: "ss-abc123" }
);
```

The CSS is extracted to a virtual module. The styled component becomes an inline function with a static `.className` property for composition.

### Extension Chains

```tsx
// Input
const Button = styled.button`padding: 1rem;`;
const Primary = styled(Button)`background: blue;`;

// Output
const Button = Object.assign(
  (p) => createElement("button", {...p, className: m("ss-btn", p.className)}),
  { className: "ss-btn" }
);
const Primary = Object.assign(
  (p) => createElement(Button, {...p, className: m("ss-primary", p.className)}),
  { className: Button.className + " ss-primary" }  // "ss-btn ss-primary"
);
```

## Runtime Size

The runtime is minimal - just a className merge function:

| Module | Minified | Brotli |
|--------|----------|--------|
| `runtime/index.ts` | **45 B** | **50 B** |

This is a 98% reduction from the previous 3.4 KB runtime.

## The Object.assign Pattern

We use `Object.assign` to create inline component functions with static properties. Here's why:

```tsx
// This creates a valid React component with a .className property
const Button = Object.assign(
  (p) => createElement("button", {...p, className: m("ss-btn", p.className)}),
  { className: "ss-btn" }
);
```

**Why this works:**
1. **Functions are objects** - In JavaScript, functions can have properties
2. **React components are functions** - A function returning JSX is a valid React component
3. **Object.assign returns the first argument** - The function itself, now with `.className` attached
4. **Single expression** - Easy to generate via AST replacement (no multi-statement blocks)

**Caveats:**
- `React.memo(Button)` won't copy static properties - use `Object.assign(memo(Button), { className: Button.className })`
- Works perfectly with React Compiler (it only cares that it's a function)

## Plugin Hooks Used

- `configResolved` - Capture dev/prod mode
- `resolveId` - Handle virtual CSS module IDs
- `load` - Return CSS content for virtual modules
- `transform` - AST transformation of source files
- `handleHotUpdate` - HMR support

## Current Status

✅ Fully implemented and working
✅ Comprehensive test suite
✅ Example app demonstrating all features
✅ Minimal runtime (~45 bytes)

## Potential Future Work

- npm publish + CI/CD
