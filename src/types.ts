import type { ComponentType, JSX } from "react";

/** All valid HTML tag names */
export type HTMLTag = keyof JSX.IntrinsicElements;

// ============================================================================
// Keyframes Types
// ============================================================================

/**
 * Represents a scoped keyframes animation name.
 * At build time, the keyframes CSS is extracted and the name is hashed.
 * This is essentially a string, but branded for type safety.
 */
export type Keyframes = string & { readonly __brand: "keyframes" };

// ============================================================================
// Variant Types
// ============================================================================

/** CSS string for a variant value */
export type VariantValue = string;

/** Mapping of variant value names to CSS strings */
export type VariantOptions = Record<string, VariantValue>;

/** Full variants configuration: variantName -> { valueName -> css } */
export type VariantsConfig = Record<string, VariantOptions>;

/**
 * Base configuration for variants (used by cssVariants).
 */
export interface VariantsDefinition<V extends VariantsConfig = VariantsConfig> {
  /** Base CSS that always applies */
  css?: string;
  /** Variant definitions */
  variants: V;
}

/**
 * Configuration for styledVariants (includes component).
 */
export interface StyledVariantsDefinition<
  V extends VariantsConfig = VariantsConfig,
> extends VariantsDefinition<V> {
  /** HTML tag or component to render */
  component: HTMLTag | ComponentType<any>;
}

/**
 * Props derived from a variants config.
 * Each variant name becomes an optional prop with its value names as the type.
 *
 * @example
 * // Config: { color: { primary: '...', danger: '...' }, size: { sm: '...', lg: '...' } }
 * // Becomes: { color?: 'primary' | 'danger', size?: 'sm' | 'lg' }
 */
export type VariantProps<V extends VariantsConfig> = {
  [K in keyof V]?: keyof V[K];
};

/**
 * Component returned by styledVariants.
 * Accepts variant props + base element/component props + children.
 */
export type StyledVariantComponent<
  T extends HTMLTag | ComponentType<any>,
  V extends VariantsConfig,
> = T extends HTMLTag
  ? ComponentType<JSX.IntrinsicElements[T] & VariantProps<V> & TransientProps>
  : T extends ComponentType<infer P>
    ? ComponentType<P & VariantProps<V> & TransientProps>
    : never;

/**
 * Function returned by cssVariants.
 * Takes variant selections and returns a class string.
 */
export type CssVariantsFunction<V extends VariantsConfig> = (
  variants?: Partial<VariantProps<V>>
) => string;

/** Extract props from an HTML tag or component */
export type PropsOf<T> = T extends HTMLTag
  ? JSX.IntrinsicElements[T]
  : T extends ComponentType<infer P>
    ? P
    : never;

/**
 * Transient props - prefixed with $ to prevent forwarding to DOM.
 * These props are filtered out before rendering, useful for conditional styling logic.
 *
 * @example
 * <Button $primary={true} $size="large" />
 * // $primary and $size won't appear in the DOM
 */
export type TransientProps = { [K in `$${string}`]?: unknown };

/**
 * The `as` prop enables polymorphic rendering.
 * Allows a styled component to render as a different HTML element.
 *
 * @example
 * const Button = styled.button`...`;
 * <Button as="a" href="/link">Link styled as button</Button>
 */
export type AsProp = {
  as?: HTMLTag;
};

/**
 * A styled React component with full type inference.
 *
 * For HTML elements: includes original element props + transient props + as prop
 * For components: includes component props + transient props (no as prop)
 */
export type StyledComponent<T extends HTMLTag | ComponentType<any>> =
  T extends HTMLTag
    ? ComponentType<PropsOf<T> & TransientProps & AsProp>
    : T extends ComponentType<infer P>
      ? ComponentType<P & TransientProps>
      : never;

// ============================================================================
// Attrs Types
// ============================================================================

/**
 * Default attributes for a styled component.
 * Can be a static object or a function that receives props and returns attrs.
 */
export type AttrsArg<P> = Partial<P> | ((props: P) => Partial<P>);

/**
 * Styled element builder with attrs support.
 * Returns a template tag function that creates a styled component.
 */
export interface StyledElementBuilder<T extends HTMLTag> {
  /**
   * Add default attributes to the component.
   * @example
   * styled.input.attrs({ type: 'password' })`padding: 0.5rem;`
   */
  attrs<A extends Partial<JSX.IntrinsicElements[T]>>(
    attrs: A | ((props: JSX.IntrinsicElements[T] & TransientProps) => A)
  ): (
    strings: TemplateStringsArray,
    ...interpolations: never[]
  ) => StyledComponent<T>;

  /**
   * Template tag to create styled component.
   */
  (
    strings: TemplateStringsArray,
    ...interpolations: never[]
  ): StyledComponent<T>;
}

/**
 * The main styled function type.
 * Supports both `styled.element` and `styled(Component)` syntax.
 */
export type StyledFunction = {
  /**
   * Style an HTML element.
   * @example
   * const Button = styled.button`padding: 1rem;`;
   */
  <T extends HTMLTag>(
    tag: T
  ): (
    strings: TemplateStringsArray,
    ...interpolations: never[]
  ) => StyledComponent<T>;

  /**
   * Extend an existing styled component or any component with className prop.
   * @example
   * const PrimaryButton = styled(Button)`background: blue;`;
   */
  <P extends { className?: string }>(
    component: ComponentType<P>
  ): (
    strings: TemplateStringsArray,
    ...interpolations: never[]
  ) => StyledComponent<ComponentType<P>>;
} & {
  /**
   * Shorthand for all HTML elements with attrs support.
   * @example
   * styled.div`...`
   * styled.button`...`
   * styled.input.attrs({ type: 'text' })`...`
   */
  [K in HTMLTag]: StyledElementBuilder<K>;
};
