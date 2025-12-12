# CLAUDE.md - Project Context for Claude Code CLI

## What is this?

**styled-static** is a near-zero-runtime CSS-in-JS library for React 19+ with Vite. It provides a styled-components-like API and extracts all CSS at build time. The ~300 byte runtime handles dynamic features (`as` prop, transient props, className merging) that require runtime props.

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
  runtime/      # Tree-shakable runtime modules
    core.ts     # Shared utilities (validateAsTag, filterTransientProps, etc.)
    styled.ts   # __styled, __styledExtend
    variants.ts # __styledVariants, __styledVariantsExtend, __cssVariants
    global.ts   # __GlobalStyle
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
import { __styled } from "styled-static/runtime/styled";
import "styled-static:abc123-0.css";

const Button = __styled("button", "ss-abc123", "Button");
```

The CSS is extracted to a virtual module, and the styled call is replaced with a thin runtime wrapper.

## Runtime Structure (Tree-Shakable)

The runtime is split into separate modules for optimal tree-shaking. Bundlers automatically exclude unused modules, reducing bundle size:

- **`runtime/core.ts`** - Shared utilities (validateAsTag, filterTransientProps, mergeClassNames)
- **`runtime/styled.ts`** - __styled, __styledExtend (~80 bytes)
- **`runtime/variants.ts`** - __styledVariants, __styledVariantsExtend, __cssVariants (~150 bytes)
- **`runtime/global.ts`** - __GlobalStyle (~10 bytes)

The Vite plugin automatically imports only what it needs. Apps that don't use variants save ~150 bytes, apps that don't use styled components save ~80 bytes.

## Code Patterns

**Runtime functions:**

- `__styled(tag, className, displayName?)` - Creates styled component
- `__styledExtend(Base, className, displayName?)` - Extends existing component
- `__styledVariants(tag, baseClass, variantKeys, displayName?)` - Creates component with variants
- `__styledVariantsExtend(Base, baseClass, variantKeys, displayName?)` - Extends component with variants
- `__cssVariants(baseClass, variantKeys)` - Returns variant class string function
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
