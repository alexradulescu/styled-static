/**
 * styled-static
 *
 * Zero-runtime styled components for React 19+ with Vite.
 * CSS is extracted to static files at build time.
 *
 * @example
 * ```tsx
 * import { styled, css, createGlobalStyle } from 'styled-static';
 *
 * // Style HTML elements
 * const Button = styled.button`
 *   padding: 0.5rem 1rem;
 *   background: blue;
 *   color: white;
 *
 *   &:hover {
 *     background: darkblue;
 *   }
 * `;
 *
 * // Extend existing styled components
 * const PrimaryButton = styled(Button)`
 *   font-weight: bold;
 * `;
 *
 * // Get a class name for mixing
 * const activeClass = css`
 *   outline: 2px solid blue;
 * `;
 *
 * // Global styles
 * const GlobalStyle = createGlobalStyle`
 *   * { box-sizing: border-box; }
 *   body { margin: 0; }
 * `;
 *
 * // Usage
 * <GlobalStyle />
 * <Button>Click me</Button>
 * <Button as="a" href="/link">Link button</Button>
 * <PrimaryButton className={activeClass}>Active</PrimaryButton>
 * ```
 */

export type {
  StyledComponent,
  StyledFunction,
  HTMLTag,
  PropsOf,
  VariantsConfig,
  VariantsDefinition,
  StyledVariantsDefinition,
  VariantProps,
  StyledVariantComponent,
  CssVariantsFunction,
  Keyframes,
} from "./types";

// Theme helpers - runtime utilities for theme switching
export {
  getTheme,
  setTheme,
  initTheme,
  onSystemThemeChange,
  type InitThemeOptions,
} from "./theme";

function throwConfigError(name: string): never {
  throw new Error(
    `${name} was not transformed at build time. ` +
      `Ensure the styled-static plugin is configured in vite.config.ts:\n\n` +
      `  import { styledStatic } from 'styled-static/vite';\n` +
      `  import react from '@vitejs/plugin-react';\n\n` +
      `  export default defineConfig({\n` +
      `    plugins: [styledStatic(), react()],\n` +
      `  });`
  );
}

/**
 * Create styled React components with zero runtime overhead.
 * CSS is extracted to static files at build time.
 *
 * @example
 * // Style HTML elements
 * const Button = styled.button`
 *   padding: 0.5rem 1rem;
 *   background: blue;
 * `;
 *
 * // Extend existing styled components
 * const PrimaryButton = styled(Button)`
 *   font-weight: bold;
 * `;
 *
 * // Use with `as` prop for polymorphism
 * <Button as="a" href="/link">Click</Button>
 *
 * // Pre-configure as prop (zero overhead alternative to withComponent)
 * const LinkButton = (props: ComponentProps<typeof Link>) => (
 *   <Button as={Link} {...props} />
 * );
 *
 * // Use transient props (won't reach DOM)
 * <Button $primary={true}>Click</Button>
 */
export const styled = new Proxy({} as never, {
  get: () => () => throwConfigError("styled"),
  apply: () => throwConfigError("styled"),
}) as import("./types").StyledFunction;

/**
 * Get a scoped class name for CSS.
 * Useful for conditional classes or mixing with styled components.
 *
 * @example
 * const activeClass = css`
 *   background: blue;
 *   color: white;
 * `;
 *
 * const highlightClass = css`
 *   box-shadow: 0 0 10px yellow;
 * `;
 *
 * <div className={isActive ? activeClass : ''} />
 * <Button className={`${activeClass} ${highlightClass}`}>Mixed</Button>
 */
export function css(
  _strings: TemplateStringsArray,
  ..._interpolations: never[]
): string {
  throwConfigError("css");
}

/**
 * Create scoped keyframes for animations.
 * The animation name is hashed to avoid conflicts between components.
 *
 * @example
 * const spin = keyframes`
 *   from { transform: rotate(0deg); }
 *   to { transform: rotate(360deg); }
 * `;
 *
 * const Spinner = styled.div`
 *   animation: ${spin} 1s linear infinite;
 * `;
 *
 * // In CSS output:
 * // @keyframes ss-abc123 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
 * // .ss-xyz789 { animation: ss-abc123 1s linear infinite; }
 */
export function keyframes(
  _strings: TemplateStringsArray,
  ..._interpolations: never[]
): string {
  throwConfigError("keyframes");
}

/**
 * Create global (unscoped) styles.
 * Returns a component that should be rendered once at the root of your app.
 * The component renders nothing - CSS is extracted at build time.
 *
 * @example
 * const GlobalStyle = createGlobalStyle`
 *   * {
 *     box-sizing: border-box;
 *   }
 *
 *   body {
 *     margin: 0;
 *     font-family: system-ui, sans-serif;
 *   }
 *
 *   :root {
 *     --color-primary: #3b82f6;
 *     --color-text: #1a1a1a;
 *   }
 * `;
 *
 * // In your app entry point
 * createRoot(document.getElementById('root')!).render(
 *   <StrictMode>
 *     <GlobalStyle />
 *     <App />
 *   </StrictMode>
 * );
 */
export function createGlobalStyle(
  _strings: TemplateStringsArray,
  ..._interpolations: never[]
): () => null {
  throwConfigError("createGlobalStyle");
}

/**
 * Utility for conditionally joining class names.
 * A minimal (~40B) alternative to clsx/classnames.
 *
 * @example
 * // Multiple class names
 * cx('base', 'active')           // → 'base active'
 *
 * // Conditional classes
 * cx('btn', isActive && 'active') // → 'btn active' or 'btn'
 *
 * // With css helper
 * const activeClass = css`color: blue;`;
 * cx('btn', isActive && activeClass)
 *
 * // Falsy values are filtered
 * cx('a', null, undefined, false, 'b') // → 'a b'
 */
export function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// ============================================================================
// Variant APIs
// ============================================================================

/**
 * Create a styled component with variant support.
 * CSS for base and all variants is extracted at build time.
 * Variant props are mapped to modifier classes at runtime.
 *
 * @example
 * // With css`` for IDE syntax highlighting (recommended)
 * const Button = styledVariants({
 *   component: 'button',
 *   css: css`
 *     padding: 0.5rem 1rem;
 *     border: none;
 *     border-radius: 4px;
 *   `,
 *   variants: {
 *     color: {
 *       primary: css`background: blue; color: white;`,
 *       danger: css`background: red; color: white;`,
 *     },
 *     size: {
 *       sm: css`font-size: 0.875rem;`,
 *       lg: css`font-size: 1.125rem;`,
 *     },
 *   },
 * });
 *
 * // Plain strings also work (no highlighting)
 * const SimpleButton = styledVariants({
 *   component: 'button',
 *   css: `padding: 0.5rem;`,
 *   variants: { size: { sm: `font-size: 0.875rem;` } },
 * });
 *
 * // Usage - variant props become modifier classes
 * <Button color="primary" size="lg">Click me</Button>
 * // Renders: <button class="ss-abc ss-abc--color-primary ss-abc--size-lg">
 */
export function styledVariants<
  T extends import("./types").HTMLTag | import("react").ComponentType<any>,
  V extends import("./types").VariantsConfig,
>(
  _config: import("./types").StyledVariantsDefinition<V> & { component: T }
): import("./types").StyledVariantComponent<T, V> {
  throwConfigError("styledVariants");
}

/**
 * Create a variant function that returns class strings.
 * CSS for base and all variants is extracted at build time.
 * The function maps variant selections to class names at runtime.
 *
 * @example
 * // With css`` for IDE syntax highlighting (recommended)
 * const buttonCss = cssVariants({
 *   css: css`
 *     padding: 0.5rem 1rem;
 *     border-radius: 4px;
 *   `,
 *   variants: {
 *     color: {
 *       primary: css`background: blue;`,
 *       danger: css`background: red;`,
 *     },
 *   },
 * });
 *
 * // Usage - returns class string
 * <div className={buttonCss({ color: 'primary' })}>
 * // Returns: "ss-xyz ss-xyz--color-primary"
 *
 * // Combine with cx
 * <div className={cx(buttonCss({ color: 'primary' }), isActive && activeClass)}>
 */
export function cssVariants<V extends import("./types").VariantsConfig>(
  _config: import("./types").VariantsDefinition<V>
): import("./types").CssVariantsFunction<V> {
  throwConfigError("cssVariants");
}
