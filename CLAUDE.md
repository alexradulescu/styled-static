# CLAUDE.md - Project Context for Claude Code CLI

## What is this?

**styled-static** is a near-zero-runtime CSS-in-JS library for React 19+ with Vite. It provides a styled-components-like API and extracts all CSS at build time. A minimal runtime handles dynamic features (`as` prop, className merging) that require runtime props.

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
  runtime/      # Tree-shakable runtime modules
    core.ts     # Shared utilities (validateAsTag, mergeClassNames)
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

// Pre-configured as (zero-overhead alternative to withComponent)
const LinkButton = (props: ComponentProps<typeof Link>) => (
  <Button as={Link} {...props} />
);

// Default attributes
const PasswordInput = styled.input.attrs({ type: 'password' })`...`;
```

## Key Design Decisions

1. **AST over Regex** - Uses Vite's built-in parser for robustness
2. **No forwardRef** - React 19 handles ref forwarding automatically
3. **className order** - Base → Extension → User for correct cascade
4. **Virtual CSS modules** - Each styled block becomes a virtual .css import
5. **Zero dependencies** - Delegates CSS processing to Vite's pipeline; use Lightning CSS for autoprefixing
6. **No `css` prop** - Intentionally omitted. Named `css` variables encourage reusable styles and add zero plugin complexity
7. **No `shouldForwardProp`** - Not needed. No runtime interpolation means no custom styling props to filter. Variants auto-strip their props; use destructuring or data attributes for edge cases

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

| Module | Minified | Gzip | Brotli |
|--------|----------|------|--------|
| `runtime/core.ts` | 544 B | 390 B | 298 B |
| `runtime/styled.ts` | 1.1 KB | 590 B | 491 B |
| `runtime/variants.ts` | 1.7 KB | 894 B | 734 B |
| `runtime/global.ts` | 43 B | 63 B | 47 B |
| **Total** | **3.4 KB** | **1.9 KB** | **1.5 KB** |

The Vite plugin automatically imports only what it needs. Apps bundle only the runtime modules they use (e.g., styled-only apps: ~1.6 KB minified).

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

- npm publish + CI/CD
