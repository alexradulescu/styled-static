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
export type { StyledComponent, StyledFunction, HTMLTag, PropsOf } from './types';
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
 * // Use transient props (won't reach DOM)
 * <Button $primary={true}>Click</Button>
 */
export declare const styled: import("./types").StyledFunction;
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
export declare function css(_strings: TemplateStringsArray, ..._interpolations: never[]): string;
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
export declare function createGlobalStyle(_strings: TemplateStringsArray, ..._interpolations: never[]): () => null;
//# sourceMappingURL=index.d.ts.map