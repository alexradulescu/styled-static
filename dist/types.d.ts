import type { ComponentType, JSX } from "react";
/** All valid HTML tag names */
export type HTMLTag = keyof JSX.IntrinsicElements;
/**
 * Represents a scoped keyframes animation name.
 * At build time, the keyframes CSS is extracted and the name is hashed.
 * This is essentially a string, but branded for type safety.
 */
export type Keyframes = string & {
    readonly __brand: "keyframes";
};
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
export interface StyledVariantsDefinition<V extends VariantsConfig = VariantsConfig> extends VariantsDefinition<V> {
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
 *
 * A styled component with variant props that dynamically apply CSS classes
 * based on prop values. Variant props are automatically removed from the DOM.
 *
 * **Features:**
 * - Type-safe variant props (autocomplete for variant names and values)
 * - Automatic sanitization of variant values (prevents CSS injection)
 * - Supports all standard component features (as, className, __debug)
 * - Variant classes follow BEM-like pattern: `base--variantName-value`
 *
 * @example
 * ```tsx
 * // Define variants
 * const Button = styledVariants({
 *   component: "button",
 *   css: css`padding: 1rem;`,
 *   variants: {
 *     color: {
 *       primary: css`background: blue; color: white;`,
 *       danger: css`background: red; color: white;`,
 *     },
 *     size: {
 *       sm: css`font-size: 0.875rem;`,
 *       lg: css`font-size: 1.25rem;`,
 *     },
 *   },
 * });
 *
 * // Use with type-safe props
 * <Button color="primary" size="lg">Large Primary Button</Button>
 *
 * // Debug variants in development
 * <Button color="danger" __debug>Shows active variants</Button>
 * ```
 *
 * @template T - The HTML tag or component being styled
 * @template V - The variants configuration
 */
export type StyledVariantComponent<T extends HTMLTag | ComponentType<any>, V extends VariantsConfig> = T extends HTMLTag ? ComponentType<JSX.IntrinsicElements[T] & VariantProps<V>> : T extends ComponentType<infer P> ? ComponentType<P & VariantProps<V>> : never;
/**
 * Function returned by cssVariants.
 *
 * A utility function that generates CSS class strings based on variant selections.
 * Useful for applying variant styles to non-component elements or for composition.
 *
 * **Features:**
 * - Type-safe variant selection (autocomplete for variant names and values)
 * - Automatic sanitization (prevents CSS injection)
 * - Returns space-separated class string ready for className attribute
 * - Zero runtime overhead (just string concatenation)
 *
 * @example
 * ```tsx
 * // Define CSS variants
 * const buttonStyles = cssVariants({
 *   css: css`padding: 1rem;`,
 *   variants: {
 *     color: {
 *       primary: css`background: blue;`,
 *       danger: css`background: red;`,
 *     },
 *   },
 * });
 *
 * // Use in className
 * <div className={buttonStyles({ color: "primary" })}>
 *   Custom element with variant styles
 * </div>
 *
 * // Combine with other classes
 * <div className={`${buttonStyles({ color: "danger" })} mt-4`}>
 *   With additional classes
 * </div>
 * ```
 *
 * @template V - The variants configuration
 */
export type CssVariantsFunction<V extends VariantsConfig> = (variants?: Partial<VariantProps<V>>) => string;
/** Extract props from an HTML tag or component */
export type PropsOf<T> = T extends HTMLTag ? JSX.IntrinsicElements[T] : T extends ComponentType<infer P> ? P : never;
/**
 * A styled React component with full type inference.
 *
 * Styled components created by styled-static support several special features:
 *
 * **Special Props:**
 * - `className` - Additional CSS classes (merged with styled classes, user classes override)
 *
 * **Static Properties:**
 * - `.className` - The static class name(s) for this component, enabling manual composition
 *
 * **Type Inference:**
 * - For HTML elements: includes element's native props
 * - For wrapped components: includes component's props
 *
 * **Polymorphism:**
 * Use `withComponent(ToComponent, FromComponent)` to render one component with another's styles.
 *
 * @example
 * ```tsx
 * // Create a styled button
 * const Button = styled.button`
 *   padding: 1rem 2rem;
 *   background: blue;
 *   color: white;
 * `;
 *
 * // Add custom classes (merged after styled classes)
 * <Button className="mt-4 hover:opacity-80">Click me</Button>
 *
 * // Extend existing components
 * const PrimaryButton = styled(Button)`
 *   background: darkblue;
 * `;
 *
 * // Access className for manual composition
 * <a className={Button.className} href="/link">Link with button styles</a>
 *
 * // Use withComponent for polymorphism
 * import { Link } from 'react-router-dom';
 * const LinkButton = withComponent(Link, Button);
 * <LinkButton to="/path">Router link styled as button</LinkButton>
 * ```
 *
 * @template T - The HTML tag or component being styled
 */
export type StyledComponent<T extends HTMLTag | ComponentType<any>> = (T extends HTMLTag ? ComponentType<PropsOf<T>> : T extends ComponentType<infer P> ? ComponentType<P> : never) & {
    /** The static class name(s) for this styled component */
    className: string;
};
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
    attrs<A extends Partial<JSX.IntrinsicElements[T]>>(attrs: A | ((props: JSX.IntrinsicElements[T]) => A)): (strings: TemplateStringsArray, ...interpolations: never[]) => StyledComponent<T>;
    /**
     * Template tag to create styled component.
     */
    (strings: TemplateStringsArray, ...interpolations: never[]): StyledComponent<T>;
}
/**
 * The main styled function - the core API for creating styled components.
 *
 * **Syntax Options:**
 * - `styled.element` - Style an HTML element directly (e.g., `styled.button`)
 * - `styled(Component)` - Extend an existing component with additional styles
 * - `styled.element.attrs()` - Add default attributes to elements
 *
 * **Build-Time Transformation:**
 * - CSS is extracted to static files at build time
 * - Components become lightweight runtime wrappers
 * - Virtual CSS modules handle imports automatically
 *
 * @example
 * ```tsx
 * // Style HTML elements
 * const Button = styled.button`
 *   padding: 1rem 2rem;
 *   background: blue;
 *   color: white;
 *   border: none;
 *   cursor: pointer;
 * `;
 *
 * // Extend existing components
 * const PrimaryButton = styled(Button)`
 *   background: darkblue;
 *   font-weight: bold;
 * `;
 *
 * // Nested CSS with postcss-nested
 * const Card = styled.div`
 *   padding: 1rem;
 *
 *   &:hover {
 *     box-shadow: 0 4px 8px rgba(0,0,0,0.1);
 *   }
 *
 *   & > h2 {
 *     margin-top: 0;
 *   }
 * `;
 *
 * // Add default attributes
 * const PasswordInput = styled.input.attrs({ type: 'password' })`
 *   padding: 0.5rem;
 *   border: 1px solid #ccc;
 * `;
 * ```
 */
export type StyledFunction = {
    /**
     * Style an HTML element.
     *
     * @example
     * ```tsx
     * const Heading = styled.h1`
     *   font-size: 2rem;
     *   font-weight: bold;
     * `;
     * ```
     */
    <T extends HTMLTag>(tag: T): (strings: TemplateStringsArray, ...interpolations: never[]) => StyledComponent<T>;
    /**
     * Extend an existing styled component or any component with className prop.
     *
     * @example
     * ```tsx
     * const LinkButton = styled(Button)`
     *   text-decoration: underline;
     * `;
     * ```
     */
    <P extends {
        className?: string;
    }>(component: ComponentType<P>): (strings: TemplateStringsArray, ...interpolations: never[]) => StyledComponent<ComponentType<P>>;
} & {
    [K in HTMLTag]: StyledElementBuilder<K>;
};
//# sourceMappingURL=types.d.ts.map