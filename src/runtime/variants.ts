/**
 * styled-static variants runtime
 *
 * Provides variant support for styled components:
 * - styledVariants: Creates components with variant props
 * - styledVariantsExtend: Extends components with variants
 * - cssVariants: Returns variant class strings
 */
import { type ComponentType, type JSX, createElement } from "react";
import { filterTransientProps, mergeClassNames, validateAsTag } from "./core";

type HTMLTag = keyof JSX.IntrinsicElements;

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

    // No as prop - use default tag
    if (asProp === undefined) {
      return createElement(tag, domProps);
    }

    // String (HTML element) - validate for security
    if (typeof asProp === "string") {
      const validatedTag = validateAsTag(asProp, tag);
      return createElement(validatedTag, domProps);
    }

    // Component - render directly (no validation needed, comes from code not user input)
    return createElement(asProp, domProps);
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
