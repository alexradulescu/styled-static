/**
 * How It Works Section - Explains the build-time transformation
 * Contains: compilation process, virtual CSS modules, runtime wrappers, bundle size
 */
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

export function HowItWorksSection() {
  return (
    <>
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
          with a lightweight runtime wrapper.
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
import { __styled } from "styled-static/runtime/styled";
import "styled-static:abc123-0.css";

const Button = __styled({
  tag: "button",
  className: "ss-abc123",
  displayName: "Button"  // dev-only
});`}</CodeBlock>

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
          The runtime wrapper is extremely small because all CSS has been
          extracted. The runtime only needs to handle dynamic features that
          require runtime props:
        </Paragraph>

        <ul
          style={{ marginLeft: "1.5rem", color: "var(--color-text-secondary)" }}
        >
          <li>
            <InlineCode>as</InlineCode> prop - Polymorphic rendering
          </li>
          <li>
            <InlineCode>className</InlineCode> - Merging user classes
          </li>
          <li>
            <InlineCode>__debug</InlineCode> - Dev-only logging (stripped in
            production)
          </li>
        </ul>

        <CodeBlock>{`// Simplified runtime implementation
export function __styled(config) {
  const { tag, className, displayName } = config;

  const Component = (props) => {
    const { as, className: userClass, __debug, ...rest } = props;

    // Merge classes (styled first, user last)
    rest.className = mergeClassNames(className, userClass);

    // Render with validated tag
    return createElement(as || tag, rest);
  };

  if (process.env.NODE_ENV !== "production" && displayName) {
    Component.displayName = displayName;
  }

  return Component;
}`}</CodeBlock>
      </Section>

      {/* Object-Based API */}
      <Section id="object-api">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Self-Documenting Object API</SubsectionTitle>
        <Paragraph>
          Runtime functions use object-based configuration instead of positional
          parameters. This makes the generated code self-documenting and easier
          to debug.
        </Paragraph>

        <CodeBlock>{`// Clear object syntax (current)
__styled({
  tag: "button",
  className: "ss-abc123",
  displayName: "Button"
});

// vs. positional parameters (harder to read)
__styled("button", "ss-abc123", "Button");`}</CodeBlock>
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

      {/* Bundle Size Comparison */}
      <Section id="bundle-size">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Bundle Size Comparison</SubsectionTitle>
        <Paragraph>
          Here's how styled-static compares to other CSS-in-JS libraries for an
          app with 500 styled components:
        </Paragraph>

        <div
          style={{
            overflowX: "auto",
            margin: "1.5rem 0",
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
                  Library
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Runtime
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Per Component
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Total (500)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  <strong style={{ color: "var(--color-primary)" }}>
                    styled-static
                  </strong>
                </td>
                <td style={{ padding: "0.75rem" }}>~1.6 KB</td>
                <td style={{ padding: "0.75rem" }}>~20 bytes</td>
                <td style={{ padding: "0.75rem" }}>
                  <strong style={{ color: "var(--color-primary)" }}>
                    ~12 KB
                  </strong>
                </td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Emotion</td>
                <td style={{ padding: "0.75rem" }}>7.9 KB</td>
                <td style={{ padding: "0.75rem" }}>~50 bytes</td>
                <td style={{ padding: "0.75rem" }}>32.9 KB</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>styled-components</td>
                <td style={{ padding: "0.75rem" }}>16 KB</td>
                <td style={{ padding: "0.75rem" }}>~60 bytes</td>
                <td style={{ padding: "0.75rem" }}>46 KB</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem" }}>Linaria</td>
                <td style={{ padding: "0.75rem" }}>0 bytes</td>
                <td style={{ padding: "0.75rem" }}>~40 bytes</td>
                <td style={{ padding: "0.75rem" }}>20 KB</td>
              </tr>
            </tbody>
          </table>
        </div>
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
                  ~1.6 KB
                </td>
                <td style={{ padding: "0.75rem" }}>~11KB</td>
                <td style={{ padding: "0.75rem" }}>0B</td>
                <td style={{ padding: "0.75rem" }}>0B</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Zero-runtime CSS</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
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
              </tr>
              <tr>
                <td style={{ padding: "0.75rem" }}>Bundler support</td>
                <td style={{ padding: "0.75rem" }}>Vite only</td>
                <td style={{ padding: "0.75rem" }}>Any</td>
                <td style={{ padding: "0.75rem" }}>Many</td>
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
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Variants/Recipes</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
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
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
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
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Runtime interpolation</td>
                <td style={{ padding: "0.75rem" }}>✗ by design</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
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
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>ThemeProvider</td>
                <td style={{ padding: "0.75rem" }}>— CSS-first</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>—</td>
                <td style={{ padding: "0.75rem" }}>—</td>
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>Design tokens</td>
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
              </tr>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <td style={{ padding: "0.75rem" }}>React version</td>
                <td style={{ padding: "0.75rem" }}>19+</td>
                <td style={{ padding: "0.75rem" }}>16+</td>
                <td style={{ padding: "0.75rem" }}>16+</td>
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
              <strong>Linaria</strong> — Zero runtime, multi-bundler, don't need{" "}
              <InlineCode>as</InlineCode> prop or variants
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

// Generated
const Primary = __styledExtend({
  base: Button,
  className: "ss-xyz789",
  displayName: "Primary"
});

// Runtime behavior
const Primary = (props) => {
  const { className: userClass, ...rest } = props;
  return (
    <Button
      {...rest}
      className={mergeClassNames("ss-xyz789", userClass)}
    />
  );
};`}</CodeBlock>

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

// Generated
const Button = __styledVariants({
  tag: "button",
  baseClass: "ss-abc123",
  variantKeys: ["color"],
  displayName: "Button"
});

// Runtime: builds classes like "ss-abc123 ss-abc123--color-primary"
<Button color="primary">Click</Button>`}</CodeBlock>
      </Section>

      {/* Development Features */}
      <Section id="dev-features">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Development-Only Features</SubsectionTitle>
        <Paragraph>
          Several features are automatically stripped in production builds to
          keep bundle size minimal:
        </Paragraph>

        <ul
          style={{ marginLeft: "1.5rem", color: "var(--color-text-secondary)" }}
        >
          <li>
            <InlineCode>displayName</InlineCode> - Only set in development for
            React DevTools
          </li>
          <li>
            <InlineCode>__debug</InlineCode> prop - Console logging removed in
            production
          </li>
          <li>Dev warnings - Dangerous element validation logs</li>
        </ul>

        <CodeBlock>{`// Development build
const Button = __styled({
  tag: "button",
  className: "ss-abc123",
  displayName: "Button"  // ← included
});

// Production build
const Button = __styled({
  tag: "button",
  className: "ss-abc123"
  // displayName removed by bundler
});`}</CodeBlock>
      </Section>
    </>
  );
}
