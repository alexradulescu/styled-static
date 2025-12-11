/**
 * styled-static Vite Plugin
 *
 * Transforms styled-static syntax into optimized React components with
 * static CSS extraction.
 *
 * ## Why AST over Regex?
 *
 * We use Vite's built-in parser (via Rollup's acorn) instead of regex because:
 *
 * 1. **Robustness**: Regex breaks on edge cases like CSS containing backticks,
 *    strings that look like styled calls, or complex nesting.
 *
 *    Example that would break regex:
 *    ```tsx
 *    const x = styled.div`content: "styled.button\`test\`";`;
 *    const comment = "// styled.div`fake`"; // This isn't actually a styled call
 *    ```
 *
 * 2. **No extra dependencies**: Vite provides `this.parse()` for free via Rollup.
 *    We don't need acorn or acorn-walk as separate dependencies.
 *
 * 3. **Accuracy**: AST gives us exact node positions for surgical code replacement
 *    with proper source maps. Regex can't reliably handle nested backticks or
 *    escaped characters.
 *
 * 4. **Maintainability**: Adding new syntax patterns is straightforward with AST
 *    visitors vs. increasingly complex regex patterns that become unmaintainable.
 *
 * ## Transformation Pipeline
 *
 * 1. Parse source with Vite's parser
 * 2. Find all styled/css/createGlobalStyle tagged template literals
 * 3. For each:
 *    - Extract CSS content
 *    - Hash it to generate unique class name
 *    - Process CSS (nesting, autoprefixer)
 *    - Create virtual CSS module
 *    - Replace original code with runtime call + import
 * 4. Return transformed code with source map
 *
 * ## className Order (CSS Cascade)
 *
 * When components are extended, classes are ordered for proper cascade:
 * - Base styles first
 * - Extension styles second (override base)
 * - User className last (override all)
 *
 * Example:
 * ```tsx
 * const Button = styled.button`padding: 1rem;`;        // .ss-abc
 * const Primary = styled(Button)`background: blue;`;   // .ss-def
 * <Primary className="custom" />
 * // Renders: class="ss-abc ss-def custom"
 * // CSS cascade: padding → background → custom overrides
 * ```
 */
import type { Plugin } from "vite";
/** Plugin configuration options */
export interface StyledStaticOptions {
    /**
     * Prefix for generated class names.
     * @default 'ss'
     */
    classPrefix?: string;
    /**
     * Browsers to target for autoprefixer.
     * Set to false to disable autoprefixer.
     * @default ['last 2 Chrome versions', 'last 2 Firefox versions', 'last 2 Safari versions', 'last 2 Edge versions']
     */
    autoprefixer?: string[] | false;
}
/**
 * Vite plugin for styled-static.
 *
 * @example
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { styledStatic } from 'styled-static/vite';
 *
 * export default defineConfig({
 *   plugins: [styledStatic(), react()],
 * });
 */
export declare function styledStatic(options?: StyledStaticOptions): Plugin;
export default styledStatic;
//# sourceMappingURL=vite.d.ts.map