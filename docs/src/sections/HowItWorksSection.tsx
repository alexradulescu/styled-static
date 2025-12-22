/**
 * How It Works Section - Explains the build-time transformation
 * Contains: compilation process, virtual CSS modules, runtime wrappers, bundle size
 */
import { styled } from "styled-static";
import { Info, Lightbulb } from "lucide-react";
import {
  Breadcrumb,
  Callout,
  CodeBlock,
  InlineCode,
  Paragraph,
  Section,
  SectionTitle,
  SubsectionTitle,
} from "./shared";

// Section-specific styled component (tests CSS code splitting)
const HowItWorksWrapper = styled.div`
  opacity: 1;
  transition: opacity 0.35s ease-out;

  /* Unique to HowItWorksSection */
  --how-it-works-section-loaded: 1;
`;

export function HowItWorksSection() {
  return (
    <HowItWorksWrapper>
      {/* Overview */}
      <Section id="how-it-works">
        <Breadcrumb>Internals</Breadcrumb>
        <SectionTitle>How It Works</SectionTitle>
        <Paragraph>
          styled-static takes a different approach from runtime CSS-in-JS
          libraries. Instead of generating CSS at runtime, it extracts all CSS
          at build time using a Vite plugin. This gives you the developer
          experience of styled-components with near-zero runtime cost.
        </Paragraph>
      </Section>

      {/* Build-Time Transformation */}
      <Section id="transformation">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Build-Time Transformation</SubsectionTitle>
        <Paragraph>
          When you write a styled component, the Vite plugin intercepts your
          source code and performs AST-based transformation. The CSS is
          extracted to a static file, and the component definition is replaced
          with an inline React component. The runtime is just ~45 bytes for
          className merging.
        </Paragraph>

        <Paragraph>Here's what happens to your code:</Paragraph>

        <CodeBlock>{`// What you write:
import { styled } from "styled-static";

const Button = styled.button\`
  padding: 1rem 2rem;
  background: blue;
  color: white;
\`;`}</CodeBlock>

        <CodeBlock>{`// What gets generated:
import { createElement } from "react";
import { m } from "styled-static/runtime";
import "styled-static:abc123-0.css";

const Button = Object.assign(
  (p) => createElement("button", {...p, className: m("ss-abc123", p.className)}),
  { className: "ss-abc123" }
);`}</CodeBlock>

        <Callout type="tip" icon={<Lightbulb size={20} />}>
          The CSS is completely removed from your JavaScript bundle and moved to
          a separate CSS file that Vite can optimize and cache.
        </Callout>
      </Section>

      {/* Virtual CSS Modules */}
      <Section id="virtual-css">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Virtual CSS Modules</SubsectionTitle>
        <Paragraph>
          The extracted CSS is served through Vite's virtual module system. Each
          styled component gets a unique virtual CSS module with a name like{" "}
          <InlineCode>styled-static:abc123-0.css</InlineCode>.
        </Paragraph>

        <CodeBlock>{`/* Virtual module: styled-static:abc123-0.css */
.ss-abc123 {
  padding: 1rem 2rem;
  background: blue;
  color: white;
}`}</CodeBlock>

        <Paragraph>This approach has several benefits:</Paragraph>
        <ul
          style={{ marginLeft: "1.5rem", color: "var(--color-text-secondary)" }}
        >
          <li>✅ CSS is deduplicated and optimized by Vite</li>
          <li>✅ Supports code splitting (CSS loads with component)</li>
          <li>✅ Works with Vite's HMR (hot module replacement)</li>
          <li>✅ Can be extracted to a single CSS file for production</li>
        </ul>
      </Section>

      {/* Runtime Wrappers */}
      <Section id="runtime">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Minimal Runtime</SubsectionTitle>
        <Paragraph>
          The runtime is just ~45 bytes because components are generated inline
          at build time. The only runtime code is a simple function to merge
          className strings:
        </Paragraph>

        <CodeBlock>{`// The entire runtime (~45 bytes minified)
export const m = (b, u) => (u ? \`\${b} \${u}\` : b);

// Usage: m("ss-abc123", props.className)
// m("ss-btn", undefined)     → "ss-btn"
// m("ss-btn", "custom")      → "ss-btn custom"
// m("ss-btn ss-primary", "") → "ss-btn ss-primary"`}</CodeBlock>

        <Paragraph>
          For polymorphic rendering, use{" "}
          <InlineCode>withComponent(To, From)</InlineCode> instead of an{" "}
          <InlineCode>as</InlineCode> prop. This resolves the component at build
          time rather than runtime.
        </Paragraph>
      </Section>

      {/* Zero-Runtime Features */}
      <Section id="zero-runtime">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Zero-Runtime Features</SubsectionTitle>
        <Paragraph>
          Some features have literally zero runtime cost because they are
          completely replaced at build time:
        </Paragraph>

        <CodeBlock>{`// css helper - zero runtime
const activeStyles = css\`
  outline: 2px solid blue;
\`;

// Generated: pure string literal
const activeStyles = "ss-xyz789";

// Global styles - zero runtime (just CSS import)
const GlobalStyles = createGlobalStyle\`
  * { box-sizing: border-box; }
\`;

// Generated: no-op component
const GlobalStyles = () => null;`}</CodeBlock>
      </Section>

      {/* Library Comparison */}
      <Section id="comparison">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Library Comparison</SubsectionTitle>
        <Paragraph>
          An honest comparison with other CSS-in-JS libraries. Each library
          excels in different areas—choose based on your needs.
        </Paragraph>

        <Paragraph
          style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}
        >
          <strong>Legend:</strong> ✓ Supported | ◐ Partial | ✗ Not supported | —
          Not applicable
        </Paragraph>

        {/* Runtime & Build Table */}
        <div
          style={{
            marginTop: "1.5rem",
            marginBottom: "0.5rem",
            fontWeight: 600,
          }}
        >
          Runtime &amp; Build
        </div>
        <div
          style={{
            overflowX: "auto",
            margin: "0.5rem 0 1.5rem",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--color-bg-sidebar)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Feature
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  styled-static
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Emotion
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Linaria
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  <a
                    href="https://restyle.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-text)" }}
                  >
                    Restyle
                  </a>
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Panda CSS
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Runtime size</td>
                <td
                  style={{ padding: "0.75rem", color: "var(--color-primary)" }}
                >
                  ~50 B
                </td>
                <td style={{ padding: "0.75rem" }}>~11 KB</td>
                <td style={{ padding: "0.75rem" }}>~1.5 KB</td>
                <td style={{ padding: "0.75rem" }}>~2.2 KB</td>
                <td style={{ padding: "0.75rem" }}>0 B</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Zero-runtime CSS</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>SSR complexity</td>
                <td style={{ padding: "0.75rem" }}>None</td>
                <td style={{ padding: "0.75rem" }}>Setup required</td>
                <td style={{ padding: "0.75rem" }}>None</td>
                <td style={{ padding: "0.75rem" }}>None</td>
                <td style={{ padding: "0.75rem" }}>None</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem" }}>Bundler support</td>
                <td style={{ padding: "0.75rem" }}>Vite only</td>
                <td style={{ padding: "0.75rem" }}>Any</td>
                <td style={{ padding: "0.75rem" }}>Many</td>
                <td style={{ padding: "0.75rem" }}>Any</td>
                <td style={{ padding: "0.75rem" }}>Any</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* API & Features Table */}
        <div
          style={{
            marginTop: "1.5rem",
            marginBottom: "0.5rem",
            fontWeight: 600,
          }}
        >
          API &amp; Features
        </div>
        <div
          style={{
            overflowX: "auto",
            margin: "0.5rem 0 1.5rem",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--color-bg-sidebar)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Feature
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  styled-static
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Emotion
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Linaria
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Restyle
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Panda CSS
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  <InlineCode>styled.element</InlineCode>
                </td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>◐ patterns</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  <InlineCode>styled(Component)</InlineCode>
                </td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  <InlineCode>css</InlineCode> helper
                </td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  <InlineCode>css</InlineCode> prop
                </td>
                <td style={{ padding: "0.75rem" }}>✗ by design</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Variants/Recipes</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>◐ manual</td>
                <td style={{ padding: "0.75rem" }}>◐ manual</td>
                <td style={{ padding: "0.75rem" }}>◐ manual</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  <InlineCode>as</InlineCode> prop
                </td>
                <td style={{ padding: "0.75rem" }}>✗ withComponent</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>◐ manual</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  <InlineCode>attrs</InlineCode>
                </td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>—</td>
                <td style={{ padding: "0.75rem" }}>—</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Runtime interpolation</td>
                <td style={{ padding: "0.75rem" }}>✗ by design</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Theming & DX Table */}
        <div
          style={{
            marginTop: "1.5rem",
            marginBottom: "0.5rem",
            fontWeight: 600,
          }}
        >
          Theming &amp; DX
        </div>
        <div
          style={{
            overflowX: "auto",
            margin: "0.5rem 0 1.5rem",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--color-bg-sidebar)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Feature
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  styled-static
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Emotion
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Linaria
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Restyle
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Panda CSS
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>CSS variables</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>ThemeProvider</td>
                <td style={{ padding: "0.75rem" }}>— CSS-first</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>—</td>
                <td style={{ padding: "0.75rem" }}>— CSS vars</td>
                <td style={{ padding: "0.75rem" }}>—</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Design tokens</td>
                <td style={{ padding: "0.75rem" }}>◐ manual</td>
                <td style={{ padding: "0.75rem" }}>◐ manual</td>
                <td style={{ padding: "0.75rem" }}>◐ manual</td>
                <td style={{ padding: "0.75rem" }}>◐ manual</td>
                <td style={{ padding: "0.75rem" }}>✓ built-in</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>TypeScript</td>
                <td style={{ padding: "0.75rem" }}>✓ full</td>
                <td style={{ padding: "0.75rem" }}>✓ full</td>
                <td style={{ padding: "0.75rem" }}>✓ full</td>
                <td style={{ padding: "0.75rem" }}>✓ full</td>
                <td style={{ padding: "0.75rem" }}>✓ full</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>React version</td>
                <td style={{ padding: "0.75rem" }}>19+</td>
                <td style={{ padding: "0.75rem" }}>16+</td>
                <td style={{ padding: "0.75rem" }}>16+</td>
                <td style={{ padding: "0.75rem" }}>19+</td>
                <td style={{ padding: "0.75rem" }}>16+</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem" }}>Dependencies</td>
                <td
                  style={{ padding: "0.75rem", color: "var(--color-primary)" }}
                >
                  0
                </td>
                <td style={{ padding: "0.75rem" }}>5+</td>
                <td style={{ padding: "0.75rem" }}>10+</td>
                <td style={{ padding: "0.75rem" }}>0</td>
                <td style={{ padding: "0.75rem" }}>5+</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout type="note" icon={<Info size={20} />}>
          <strong>When to choose each:</strong>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
            <li>
              <strong>styled-static</strong> — Familiar styled-components DX,
              zero deps, minimal runtime, React 19+ with Vite
            </li>
            <li>
              <strong>Emotion</strong> — Runtime interpolation, ThemeProvider,
              wide bundler/React support
            </li>
            <li>
              <strong>Linaria</strong> — Near-zero runtime, multi-bundler, don't need{" "}
              <InlineCode>as</InlineCode> prop or variants
            </li>
            <li>
              <strong>
                <a
                  href="https://restyle.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit" }}
                >
                  Restyle
                </a>
              </strong>{" "}
              — Runtime CSS-in-JS with <InlineCode>css</InlineCode> prop, zero
              config, React 19+ Server Components
            </li>
            <li>
              <strong>Panda CSS</strong> — Atomic CSS, built-in design tokens,
              framework-agnostic
            </li>
          </ul>
        </Callout>
      </Section>

      {/* Component Extensions */}
      <Section id="extensions">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Component Extensions</SubsectionTitle>
        <Paragraph>
          When you extend a component with{" "}
          <InlineCode>styled(Component)</InlineCode>, the transformation is even
          simpler - it just passes through to the base component:
        </Paragraph>

        <CodeBlock>{`// Source
const Primary = styled(Button)\`
  background: darkblue;
\`;

// Generated (inline component with Object.assign)
import { createElement } from "react";
import { m } from "styled-static/runtime";

const Primary = Object.assign(
  (p) => createElement(Button, {...p, className: m("ss-xyz789", p.className)}),
  { className: Button.className + " ss-xyz789" }
);

// The .className property concatenates: "ss-btn ss-xyz789"
// This ensures proper CSS cascade: base → extension → user`}</CodeBlock>

        <Paragraph>
          The base component handles its own className (including any extensions
          it has), and the new className is merged last. This ensures proper CSS
          cascade: base → extension → user.
        </Paragraph>
      </Section>

      {/* Variants */}
      <Section id="variant-internals">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Variants Implementation</SubsectionTitle>
        <Paragraph>
          Variant components build class strings dynamically at runtime based on
          prop values. All variant values are sanitized to prevent CSS injection
          attacks.
        </Paragraph>

        <CodeBlock>{`// Source
const Button = styledVariants({
  component: "button",
  css: css\`padding: 1rem;\`,
  variants: {
    color: {
      primary: css\`background: blue;\`,
      danger: css\`background: red;\`,
    },
  },
});

// Generated (inline component with explicit variant checks)
const Button = Object.assign(
  ({ color, className, ...p }) => {
    let c = "ss-abc123";
    if (color === "primary") c += " ss-abc123--color-primary";
    else if (color === "danger") c += " ss-abc123--color-danger";
    return createElement("button", {...p, className: m(c, className)});
  },
  { className: "ss-abc123" }
);

// Usage: <Button color="primary">Click</Button>
// Renders with class="ss-abc123 ss-abc123--color-primary"`}</CodeBlock>
      </Section>

      {/* Development Features */}
      <Section id="dev-features">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Development-Only Features</SubsectionTitle>
        <Paragraph>
          The generated code is identical in development and production builds.
          Debug logging is available via an environment variable:
        </Paragraph>

        <CodeBlock>{`# Enable debug logging during development
DEBUG_STYLED_STATIC=true bun dev

# The generated component is the same in dev and prod:
const Button = Object.assign(
  (p) => createElement("button", {...p, className: m("ss-abc123", p.className)}),
  { className: "ss-abc123" }
);`}</CodeBlock>

        <Paragraph>
          Since components are generated inline at build time, there's no
          runtime <InlineCode>displayName</InlineCode> handling. React DevTools
          will show the variable name from your source code.
        </Paragraph>
      </Section>
    </HowItWorksWrapper>
  );
}
