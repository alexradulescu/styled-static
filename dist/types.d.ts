import type { ComponentType, JSX } from "react";
/** All valid HTML tag names */
export type HTMLTag = keyof JSX.IntrinsicElements;
/** Extract props from an HTML tag or component */
export type PropsOf<T> = T extends HTMLTag ? JSX.IntrinsicElements[T] : T extends ComponentType<infer P> ? P : never;
/**
 * Transient props - prefixed with $ to prevent forwarding to DOM.
 * These props are filtered out before rendering, useful for conditional styling logic.
 *
 * @example
 * <Button $primary={true} $size="large" />
 * // $primary and $size won't appear in the DOM
 */
export type TransientProps = {
    [K in `$${string}`]?: unknown;
};
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
export type StyledComponent<T extends HTMLTag | ComponentType<any>> = T extends HTMLTag ? ComponentType<PropsOf<T> & TransientProps & AsProp> : T extends ComponentType<infer P> ? ComponentType<P & TransientProps> : never;
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
    <T extends HTMLTag>(tag: T): (strings: TemplateStringsArray, ...interpolations: never[]) => StyledComponent<T>;
    /**
     * Extend an existing styled component or any component with className prop.
     * @example
     * const PrimaryButton = styled(Button)`background: blue;`;
     */
    <P extends {
        className?: string;
    }>(component: ComponentType<P>): (strings: TemplateStringsArray, ...interpolations: never[]) => StyledComponent<ComponentType<P>>;
} & {
    [K in HTMLTag]: (strings: TemplateStringsArray, ...interpolations: never[]) => StyledComponent<K>;
};
//# sourceMappingURL=types.d.ts.map