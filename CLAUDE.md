# CLAUDE.md - Project Context for Claude Code CLI

## What is this?

**styled-static** is a zero-runtime CSS-in-JS library for React 19+ with Vite. It provides a styled-components-like API but extracts all CSS at build time, leaving only a ~300 byte runtime.

## Tech Stack

- **Runtime**: React 19+ (uses automatic ref forwarding)
- **Build**: Vite plugin with AST-based transformation
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun
- **Testing**: Vitest
- **Dependencies**: magic-string, postcss, postcss-nested, autoprefixer (4 total)

## Project Structure

```
src/
  vite.ts       # Main Vite plugin - AST transformation, CSS extraction
  runtime.tsx   # Minimal runtime (~300B) - as prop, transient props, className merge
  index.ts      # Public API exports (styled, css, createGlobalStyle)
  types.ts      # TypeScript types (StyledComponent, StyledFunction, etc.)
  hash.ts       # Murmurhash for class name generation
  vite.test.ts  # Comprehensive test suite
example/        # Working demo app
```

## API

```tsx
// Style elements
const Button = styled.button`padding: 1rem;`;

// Extend components
const Primary = styled(Button)`background: blue;`;

// Get class string
const active = css`outline: 2px solid;`;

// Global styles
const GlobalStyle = createGlobalStyle`* { box-sizing: border-box; }`;

// Polymorphic as prop
<Button as="a" href="/">Link</Button>

// Transient props (filtered from DOM)
<Button $primary={true}>Click</Button>
```

## Key Design Decisions

1. **AST over Regex** - Uses Vite's built-in parser for robustness
2. **No forwardRef** - React 19 handles ref forwarding automatically
3. **className order** - Base → Extension → User for correct cascade
4. **Transient props** - $-prefixed props filtered to prevent DOM warnings
5. **Virtual CSS modules** - Each styled block becomes a virtual .css import

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
import { __styled } from "styled-static/runtime";
import "styled-static:abc123-0.css";

const Button = __styled("button", "ss-abc123", "Button");
```

The CSS is extracted to a virtual module, and the styled call is replaced with a thin runtime wrapper.

## Code Patterns

**Runtime functions:**

- `__styled(tag, className, displayName?)` - Creates styled component
- `__styledExtend(Base, className, displayName?)` - Extends existing component
- `__GlobalStyle` - No-op component (CSS injected via import)

**Plugin hooks used:**

- `configResolved` - Capture dev/prod mode
- `resolveId` - Handle virtual CSS module IDs
- `load` - Return CSS content for virtual modules
- `transform` - AST transformation of source files
- `handleHotUpdate` - HMR support

## Current Status

✅ Fully implemented and working
✅ Comprehensive test suite
✅ Example app demonstrating all features

## Potential Future Work

- `keyframes` helper for scoped animation names
- `css` prop support
- `attrs()` helper for default props
- `shouldForwardProp` customization
- npm publish + CI/CD
