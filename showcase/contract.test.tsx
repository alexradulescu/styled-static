import { expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ShowcaseApp, type ShowcaseStyles } from "./App";

const styles = Object.fromEntries(
  [
    "page",
    "shell",
    "header",
    "brand",
    "nav",
    "hero",
    "kicker",
    "title",
    "lede",
    "actions",
    "primary",
    "secondary",
    "section",
    "grid",
    "card",
    "cardTitle",
    "code",
    "counter",
    "themes",
    "themeButton",
    "activeTheme",
    "footer",
  ].map((name) => [name, name]),
) as unknown as ShowcaseStyles;

it("freezes the semantic showcase shared by docs and every benchmark", () => {
  const html = renderToStaticMarkup(<ShowcaseApp styles={styles} />);
  expect(html).toContain("Styled components without a styling runtime.");
  expect(html).toContain('aria-label="Primary navigation"');
  expect(html).toContain('aria-labelledby="features-title"');
  expect(html).toContain('aria-label="Theme"');
  expect(html.match(/<article/g)).toHaveLength(4);
  expect(html.match(/type="button"/g)).toHaveLength(5);
  for (const theme of ["system", "light", "dark", "copper"]) {
    expect(html).toContain(`>${theme}</button>`);
  }
});
