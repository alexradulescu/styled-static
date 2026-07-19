import { css, styled, styledVariants } from "../src/index";

/** Compile-only assertions that keep public types aligned with the static grammar. */
export function verifyPublicTypes(): void {
  styledVariants({
    component: "button",
    variants: {
      tone: {
        calm: css`
          color: blue;
        `,
      },
    },
  });
  styled.input.attrs({ type: "password", tabIndex: 0, hidden: false });

  // @ts-expect-error Variant CSS must use the css tagged template.
  styledVariants({ component: "button", variants: { tone: { calm: "color: blue;" } } });

  // @ts-expect-error Static attrs cannot execute functions at runtime.
  styled.button.attrs({ onClick: () => undefined });
}
