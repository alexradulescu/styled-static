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
import { createElement } from 'react';
/**
 * Filters out transient props (those starting with $).
 * This prevents React warnings about invalid DOM attributes.
 */
function filterTransientProps(props) {
    const filtered = {};
    for (const key in props) {
        if (key[0] !== '$') {
            filtered[key] = props[key];
        }
    }
    return filtered;
}
/**
 * Merges class names in the correct order for CSS cascade.
 * Order: styled class(es) first, user className last
 * This allows user classes to override styled classes when needed.
 */
function mergeClassNames(styledClass, userClass) {
    return userClass ? `${styledClass} ${userClass}` : styledClass;
}
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
export function __styled(tag, className, displayName) {
    const Component = (props) => {
        const { as: As = tag, className: userClass, ...rest } = props;
        const domProps = filterTransientProps(rest);
        domProps.className = mergeClassNames(className, userClass);
        return createElement(As, domProps);
    };
    if (displayName) {
        Component.displayName = displayName;
    }
    return Component;
}
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
export function __styledExtend(Base, className, displayName) {
    const Component = (props) => {
        const { className: userClass, ...rest } = props;
        const cleanProps = filterTransientProps(rest);
        // Extension class comes after base class (base handles its own class)
        // User class comes last for maximum override capability
        cleanProps.className = mergeClassNames(className, userClass);
        return createElement(Base, cleanProps);
    };
    if (displayName) {
        Component.displayName = displayName;
    }
    return Component;
}
/**
 * GlobalStyle component - renders nothing.
 * The CSS is extracted to a static file at build time.
 * This component exists only to provide a familiar API.
 */
export const __GlobalStyle = () => null;
//# sourceMappingURL=runtime.js.map