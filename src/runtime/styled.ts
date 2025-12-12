/**
 * styled-static styled components runtime
 *
 * Provides __styled() and __styledExtend() functions for creating
 * styled components with support for:
 * - `as` prop polymorphism
 * - className merging
 * - Transient props filtering
 */
import { type ComponentType, type JSX, createElement } from "react";
import { filterTransientProps, mergeClassNames, validateAsTag } from "./core";

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
export function __styled<T extends HTMLTag>(
  tag: T,
  className: string,
  displayName?: string
): ComponentType<any> {
  const Component = (props: any) => {
    const { as: asProp, className: userClass, ...rest } = props;

    const domProps = filterTransientProps(rest);
    domProps.className = mergeClassNames(className, userClass);

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
