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

import { createElement, type ComponentType, type JSX } from "react";

type HTMLTag = keyof JSX.IntrinsicElements;

/**
 * Dangerous HTML elements that should not be used with the `as` prop.
 * These elements can execute scripts, embed external content, or inject styles.
 *
 * SECURITY: Defense-in-depth to prevent XSS via polymorphic rendering.
 * While the developer controls the code, this prevents accidental misuse
 * where user input might flow into the `as` prop.
 */
const DANGEROUS_ELEMENTS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "style",
  "link",
  "meta",
  "base",
  "noscript",
  "template",
]);

/**
 * Validates that an element is safe to render.
 * Returns the safe tag, or falls back to the default if dangerous.
 */
function validateAsTag(as: unknown, defaultTag: string): string {
  if (typeof as !== "string") {
    return defaultTag;
  }
  const normalized = as.toLowerCase();
  if (DANGEROUS_ELEMENTS.has(normalized)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[styled-static] Blocked dangerous element "${as}" in "as" prop. ` +
          `Falling back to "${defaultTag}".`
      );
    }
    return defaultTag;
  }
  return as;
}

/**
 * Sanitizes a variant value to prevent CSS class injection attacks.
 * Only allows alphanumeric characters and hyphens.
 *
 * SECURITY: User-controlled variant props could inject arbitrary classes
 * (e.g., color="primary malicious-class") which could override security-sensitive
 * styles or enable CSS-based data exfiltration attacks.
 */
function sanitizeVariantValue(value: unknown): string | null {
  const str = String(value);
  const sanitized = str.replace(/[^a-zA-Z0-9-]/g, "");
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Filters out transient props (those starting with $).
 * This prevents React warnings about invalid DOM attributes.
 *
 * SECURITY: Uses Object.keys() instead of for...in to prevent prototype
 * pollution attacks where Object.prototype properties could be copied to DOM elements.
 */
function filterTransientProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (key[0] !== "$") {
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
function mergeClassNames(styledClass: string, userClass?: string): string {
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
export function __styled<T extends HTMLTag>(
  tag: T,
  className: string,
  displayName?: string
): ComponentType<any> {
  const Component = (props: any) => {
    const { as: asProp, className: userClass, ...rest } = props;

    // SECURITY: Validate `as` prop to prevent rendering dangerous elements
    const As = validateAsTag(asProp, tag);

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
export function __styledExtend<P extends { className?: string }>(
  Base: ComponentType<P>,
  className: string,
  displayName?: string
): ComponentType<any> {
  const Component = (props: any) => {
    const { className: userClass, ...rest } = props;

    const cleanProps = filterTransientProps(rest);

    // Extension class comes after base class (base handles its own class)
    // User class comes last for maximum override capability
    cleanProps.className = mergeClassNames(className, userClass);

    return createElement(Base, cleanProps as P);
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
export const __GlobalStyle: ComponentType<Record<string, never>> = () => null;

// ============================================================================
// Variant Runtime
// ============================================================================

/**
 * Creates a styled component with variant support.
 *
 * At build time, this receives:
 * - tag: HTML element or component to render
 * - baseClass: The base class name
 * - variantKeys: Array of variant property names (e.g., ['color', 'size'])
 * - displayName: Optional component name for DevTools
 *
 * @example
 * __styledVariants('button', 'ss-abc123', ['color', 'size'], 'Button')
 * // With variant props: <Button color="primary" size="sm" />
 * // Renders: <button class="ss-abc123 ss-abc123--color-primary ss-abc123--size-sm">
 */
export function __styledVariants<T extends HTMLTag>(
  tag: T,
  baseClass: string,
  variantKeys: string[],
  displayName?: string
): ComponentType<any> {
  const Component = (props: any) => {
    const { as: asProp, className: userClass, ...rest } = props;

    // SECURITY: Validate `as` prop to prevent rendering dangerous elements
    const As = validateAsTag(asProp, tag);

    // Build variant classes with sanitized values
    const classes = [baseClass];
    for (const key of variantKeys) {
      const value = rest[key];
      if (value != null) {
        const sanitized = sanitizeVariantValue(value);
        if (sanitized) {
          classes.push(`${baseClass}--${key}-${sanitized}`);
        }
        delete rest[key]; // Remove variant prop from DOM
      }
    }

    const domProps = filterTransientProps(rest);
    domProps.className = mergeClassNames(classes.join(" "), userClass);

    return createElement(As, domProps);
  };

  if (displayName) {
    Component.displayName = displayName;
  }

  return Component;
}

/**
 * Creates a styled component with variants by extending an existing component.
 *
 * @param Base - Component to extend
 * @param baseClass - The base class name for this extension
 * @param variantKeys - Array of variant property names
 * @param displayName - Optional component name for DevTools
 */
export function __styledVariantsExtend<P extends { className?: string }>(
  Base: ComponentType<P>,
  baseClass: string,
  variantKeys: string[],
  displayName?: string
): ComponentType<any> {
  const Component = (props: any) => {
    const { className: userClass, ...rest } = props;

    // Build variant classes with sanitized values
    const classes = [baseClass];
    for (const key of variantKeys) {
      const value = rest[key];
      if (value != null) {
        const sanitized = sanitizeVariantValue(value);
        if (sanitized) {
          classes.push(`${baseClass}--${key}-${sanitized}`);
        }
        delete rest[key]; // Remove variant prop from DOM
      }
    }

    const cleanProps = filterTransientProps(rest);
    cleanProps.className = mergeClassNames(classes.join(" "), userClass);

    return createElement(Base, cleanProps as P);
  };

  if (displayName) {
    Component.displayName = displayName;
  }

  return Component;
}

/**
 * Creates a cssVariants function.
 *
 * At build time, this receives:
 * - baseClass: The base class name
 * - variantKeys: Array of variant property names
 *
 * @example
 * const buttonCss = __cssVariants('ss-xyz789', ['color', 'size']);
 * buttonCss({ color: 'primary', size: 'sm' })
 * // Returns: 'ss-xyz789 ss-xyz789--color-primary ss-xyz789--size-sm'
 */
export function __cssVariants(
  baseClass: string,
  variantKeys: string[]
): (variants?: Record<string, string | undefined>) => string {
  return (variants) => {
    const classes = [baseClass];
    if (variants) {
      for (const key of variantKeys) {
        const value = variants[key];
        if (value != null) {
          const sanitized = sanitizeVariantValue(value);
          if (sanitized) {
            classes.push(`${baseClass}--${key}-${sanitized}`);
          }
        }
      }
    }
    return classes.join(" ");
  };
}
