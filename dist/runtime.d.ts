/**
 * styled-static runtime
 *
 * This is the minimal runtime required for styled-static (~300 bytes minified).
 * It provides:
 *
 * - `as` prop polymorphism: render as different HTML element
 * - Transient props filtering: $-prefixed props don't reach the DOM
 * - className merging: styled classes + user classes in correct order
 * - displayName: for React DevTools (dev mode only)
 *
 * React 19's automatic ref forwarding handles refs without explicit forwardRef.
 */
import { type ComponentType, type JSX } from 'react';
type HTMLTag = keyof JSX.IntrinsicElements;
/**
 * Creates a styled component from an HTML tag.
 *
 * Supports the `as` prop for polymorphic rendering:
 * @example
 * const Button = __styled('button', 'ss-abc123');
 * <Button as="a" href="/link">Link</Button> // Renders as <a>
 *
 * @param tag - Default HTML tag to render
 * @param className - Generated class name from CSS
 * @param displayName - Component name for DevTools (dev mode only)
 */
export declare function __styled<T extends HTMLTag>(tag: T, className: string, displayName?: string): ComponentType<any>;
/**
 * Creates a styled component by extending an existing component.
 *
 * The new className is merged with the base component's className,
 * maintaining proper CSS cascade order:
 * - Base component's styles apply first
 * - Extension styles apply second (can override base)
 * - User's className applies last (can override both)
 *
 * @example
 * const Button = __styled('button', 'ss-base');
 * const Primary = __styledExtend(Button, 'ss-primary');
 * // <Primary /> renders with class="ss-base ss-primary"
 * // <Primary className="custom" /> renders with class="ss-base ss-primary custom"
 *
 * @param Base - Component to extend
 * @param className - Additional class name for this extension
 * @param displayName - Component name for DevTools (dev mode only)
 */
export declare function __styledExtend<P extends {
    className?: string;
}>(Base: ComponentType<P>, className: string, displayName?: string): ComponentType<any>;
/**
 * GlobalStyle component - renders nothing.
 * The CSS is extracted to a static file at build time.
 * This component exists only to provide a familiar API.
 */
export declare const __GlobalStyle: ComponentType<Record<string, never>>;
export {};
//# sourceMappingURL=runtime.d.ts.map