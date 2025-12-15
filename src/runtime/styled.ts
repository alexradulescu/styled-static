/**
 * styled-static styled components runtime
 *
 * Provides __styled() and __styledExtend() functions for creating
 * styled components with support for:
 * - `as` prop polymorphism
 * - className merging
 */
import { type ComponentType, type JSX, createElement } from "react";
import { debugLog, mergeClassNames, validateAsTag } from "./core";

type HTMLTag = keyof JSX.IntrinsicElements;

/**
 * Config object for __styled function
 */
type StyledConfig<T extends HTMLTag> = {
  tag: T;
  className: string;
  displayName?: string;
};

/**
 * Creates a styled component from an HTML tag.
 *
 * Supports the `as` prop for polymorphic rendering:
 * @example
 * const Button = __styled({ tag: 'button', className: 'ss-abc123' });
 * <Button as="a" href="/link">Link</Button> // Renders as <a>
 *
 * @param config - Configuration object
 * @param config.tag - Default HTML tag to render
 * @param config.className - Generated class name from CSS
 * @param config.displayName - Component name for DevTools (dev mode only)
 */
export function __styled<T extends HTMLTag>(
  config: StyledConfig<T>
): ComponentType<any> {
  const { tag, className, displayName } = config;

  const Component = (props: any) => {
    const { as: asProp, className: userClass, __debug, ...rest } = props;

    if (__debug) {
      debugLog(displayName || tag, [
        ["Props", { as: asProp, className: userClass }],
        ["Final className", mergeClassNames(className, userClass)],
      ]);
    }

    rest.className = mergeClassNames(className, userClass);

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
 * Config object for __styledExtend function
 */
type StyledExtendConfig<P> = {
  base: ComponentType<P>;
  className: string;
  displayName?: string;
};

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
 * const Button = __styled({ tag: 'button', className: 'ss-base' });
 * const Primary = __styledExtend({ base: Button, className: 'ss-primary' });
 * <Primary /> renders with class="ss-base ss-primary"
 * <Primary className="custom" /> renders with class="ss-base ss-primary custom"
 *
 * @param config - Configuration object
 * @param config.base - Component to extend
 * @param config.className - Additional class name for this extension
 * @param config.displayName - Component name for DevTools (dev mode only)
 */
export function __styledExtend<P extends { className?: string }>(
  config: StyledExtendConfig<P>
): ComponentType<any> {
  const { base: Base, className, displayName } = config;

  const Component = (props: any) => {
    const { className: userClass, __debug, ...rest } = props;

    if (__debug) {
      debugLog(displayName || Base.displayName || "Component", [
        ["Props", { className: userClass }],
        ["Extension className", className],
        ["Final className", mergeClassNames(className, userClass)],
      ]);
    }

    // Extension class comes after base class (base handles its own class)
    // User class comes last for maximum override capability
    rest.className = mergeClassNames(className, userClass);

    return createElement(Base, rest as P);
  };

  if (process.env.NODE_ENV !== "production" && displayName) {
    Component.displayName = displayName;
  }

  return Component;
}
