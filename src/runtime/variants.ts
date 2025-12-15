/**
 * styled-static variants runtime
 *
 * Provides variant support for styled components:
 * - styledVariants: Creates components with variant props
 * - styledVariantsExtend: Extends components with variants
 * - cssVariants: Returns variant class strings
 */
import { type ComponentType, type JSX, createElement } from "react";
import { debugLog, mergeClassNames, validateAsTag } from "./core";

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
 * Config object for __styledVariants function
 */
type StyledVariantsConfig<T extends HTMLTag> = {
  tag: T;
  baseClass: string;
  variantKeys: string[];
  displayName?: string;
};

/**
 * Creates a styled component with variant support.
 *
 * @example
 * __styledVariants({ tag: 'button', baseClass: 'ss-abc123', variantKeys: ['color', 'size'] })
 * // With variant props: <Button color="primary" size="sm" />
 * // Renders: <button class="ss-abc123 ss-abc123--color-primary ss-abc123--size-sm">
 *
 * @param config - Configuration object
 * @param config.tag - HTML element or component to render
 * @param config.baseClass - The base class name
 * @param config.variantKeys - Array of variant property names (e.g., ['color', 'size'])
 * @param config.displayName - Optional component name for DevTools
 */
export function __styledVariants<T extends HTMLTag>(
  config: StyledVariantsConfig<T>
): ComponentType<any> {
  const { tag, baseClass, variantKeys, displayName } = config;

  const Component = (props: any) => {
    const { as: asProp, className: userClass, __debug, ...rest } = props;

    // Build variant classes with sanitized values
    const classes = [baseClass];
    const activeVariants: Record<string, string> = {};
    for (const key of variantKeys) {
      const value = rest[key];
      if (value != null) {
        const sanitized = sanitizeVariantValue(value);
        if (sanitized) {
          classes.push(`${baseClass}--${key}-${sanitized}`);
          activeVariants[key] = sanitized;
        }
        delete rest[key]; // Remove variant prop from DOM
      }
    }

    if (__debug) {
      debugLog(displayName || tag, [
        ["Props", { as: asProp, className: userClass }],
        ["Active variants", activeVariants],
        ["Final className", mergeClassNames(classes.join(" "), userClass)],
      ]);
    }

    rest.className = mergeClassNames(classes.join(" "), userClass);

    // No as prop - use default tag
    if (asProp === undefined) {
      return createElement(tag, rest);
    }

    // String (HTML element) - validate for security
    if (typeof asProp === "string") {
      const validatedTag = validateAsTag(asProp, tag);
      return createElement(validatedTag, rest);
    }

    // Component - render directly (no validation needed, comes from code not user input)
    return createElement(asProp, rest);
  };

  if (process.env.NODE_ENV !== "production" && displayName) {
    Component.displayName = displayName;
  }

  return Component;
}

/**
 * Config object for __styledVariantsExtend function
 */
type StyledVariantsExtendConfig<P> = {
  base: ComponentType<P>;
  baseClass: string;
  variantKeys: string[];
  displayName?: string;
};

/**
 * Creates a styled component with variants by extending an existing component.
 *
 * @param config - Configuration object
 * @param config.base - Component to extend
 * @param config.baseClass - The base class name for this extension
 * @param config.variantKeys - Array of variant property names
 * @param config.displayName - Optional component name for DevTools
 */
export function __styledVariantsExtend<P extends { className?: string }>(
  config: StyledVariantsExtendConfig<P>
): ComponentType<any> {
  const { base: Base, baseClass, variantKeys, displayName } = config;

  const Component = (props: any) => {
    const { className: userClass, __debug, ...rest } = props;

    // Build variant classes with sanitized values
    const classes = [baseClass];
    const activeVariants: Record<string, string> = {};
    for (const key of variantKeys) {
      const value = rest[key];
      if (value != null) {
        const sanitized = sanitizeVariantValue(value);
        if (sanitized) {
          classes.push(`${baseClass}--${key}-${sanitized}`);
          activeVariants[key] = sanitized;
        }
        delete rest[key]; // Remove variant prop from DOM
      }
    }

    if (__debug) {
      debugLog(displayName || Base.displayName || "Component", [
        ["Props", { className: userClass }],
        ["Active variants", activeVariants],
        ["Extension className", baseClass],
        ["Final className", mergeClassNames(classes.join(" "), userClass)],
      ]);
    }

    rest.className = mergeClassNames(classes.join(" "), userClass);

    return createElement(Base, rest as P);
  };

  if (process.env.NODE_ENV !== "production" && displayName) {
    Component.displayName = displayName;
  }

  return Component;
}

/**
 * Config object for __cssVariants function
 */
type CssVariantsConfig = {
  baseClass: string;
  variantKeys: string[];
};

/**
 * Creates a cssVariants function.
 *
 * @example
 * const buttonCss = __cssVariants({ baseClass: 'ss-xyz789', variantKeys: ['color', 'size'] });
 * buttonCss({ color: 'primary', size: 'sm' })
 * // Returns: 'ss-xyz789 ss-xyz789--color-primary ss-xyz789--size-sm'
 *
 * @param config - Configuration object
 * @param config.baseClass - The base class name
 * @param config.variantKeys - Array of variant property names
 */
export function __cssVariants(
  config: CssVariantsConfig
): (variants?: Record<string, string | undefined>) => string {
  const { baseClass, variantKeys } = config;

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
