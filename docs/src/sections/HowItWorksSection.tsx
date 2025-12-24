/**
 * How It Works Section - Explains the build-time transformation
 * Contains: compilation process, virtual CSS modules, runtime wrappers, bundle size
 */
import { styled } from "styled-static";
import { Lightbulb } from "lucide-react";
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
        <Paragraph
          style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}
        >
          <strong>Legend:</strong> ✓ Yes | ◐ Partial | ✗ No
        </Paragraph>

        <div
          style={{
            overflowX: "auto",
            margin: "1rem 0 1.5rem",
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
                <th style={{ padding: "0.75rem", textAlign: "left" }}></th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>styled-static</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Emotion</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Linaria</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  <a href="https://restyle.dev" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text)" }}>Restyle</a>
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Panda CSS</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}>Runtime</td>
                <td style={{ padding: "0.75rem", color: "var(--color-primary)" }}><strong>~50 B</strong></td>
                <td style={{ padding: "0.75rem" }}>~11 KB</td>
                <td style={{ padding: "0.75rem" }}>~1.5 KB</td>
                <td style={{ padding: "0.75rem" }}>~2.2 KB</td>
                <td style={{ padding: "0.75rem" }}>0 B</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}>Dependencies</td>
                <td style={{ padding: "0.75rem", color: "var(--color-primary)" }}>0</td>
                <td style={{ padding: "0.75rem" }}>5+</td>
                <td style={{ padding: "0.75rem" }}>10+</td>
                <td style={{ padding: "0.75rem" }}>0</td>
                <td style={{ padding: "0.75rem" }}>5+</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}>React</td>
                <td style={{ padding: "0.75rem" }}>19+</td>
                <td style={{ padding: "0.75rem" }}>16+</td>
                <td style={{ padding: "0.75rem" }}>16+</td>
                <td style={{ padding: "0.75rem" }}>19+</td>
                <td style={{ padding: "0.75rem" }}>16+</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}>Bundler</td>
                <td style={{ padding: "0.75rem" }}>Vite</td>
                <td style={{ padding: "0.75rem" }}>Any</td>
                <td style={{ padding: "0.75rem" }}>Many</td>
                <td style={{ padding: "0.75rem" }}>Any</td>
                <td style={{ padding: "0.75rem" }}>Any</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}><InlineCode>styled.el</InlineCode></td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}><InlineCode>styled(Comp)</InlineCode></td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}>Variants</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
                <td style={{ padding: "0.75rem" }}>◐</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}><InlineCode>css</InlineCode> helper</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}><InlineCode>css</InlineCode> inline prop</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "0.75rem" }}>Runtime interpolation</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
              </tr>
              <tr>
                <td style={{ padding: "0.75rem" }}><InlineCode>.className</InlineCode> access</td>
                <td style={{ padding: "0.75rem" }}>✓</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
                <td style={{ padding: "0.75rem" }}>✗</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Paragraph style={{ color: "var(--color-text-secondary)" }}>
          <strong>When to choose:</strong> styled-static for familiar DX + zero deps + React 19/Vite.
          Emotion for runtime interpolation + ThemeProvider.
          Linaria for multi-bundler zero-runtime.{" "}
          <a href="https://restyle.dev" target="_blank" rel="noopener noreferrer">Restyle</a> for <InlineCode>css</InlineCode> prop + Server Components.
          Panda for atomic CSS + design tokens.
        </Paragraph>
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

      {/* Plugin Configuration */}
      <Section id="configuration">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Plugin Configuration</SubsectionTitle>
        <Paragraph>
          The Vite plugin accepts configuration options for customizing class
          name prefixes, debug logging, and CSS output mode:
        </Paragraph>

        <CodeBlock>{`// vite.config.ts
styledStatic({
  classPrefix: 'ss',   // Prefix for generated class names (default: 'ss')
  debug: false,        // Debug logging (default: false)
  cssOutput: 'auto',   // CSS output mode (default: 'auto')
})`}</CodeBlock>

        <Paragraph>
          The <InlineCode>cssOutput</InlineCode> option controls how CSS is
          emitted during builds:
        </Paragraph>
        <ul
          style={{ marginLeft: "1.5rem", color: "var(--color-text-secondary)" }}
        >
          <li>
            <strong>'auto'</strong> (default) — Uses 'file' for library builds,
            'virtual' for apps
          </li>
          <li>
            <strong>'virtual'</strong> — CSS as virtual modules (Vite bundles
            into single file)
          </li>
          <li>
            <strong>'file'</strong> — CSS as separate files co-located with JS
            (enables tree-shaking)
          </li>
        </ul>
      </Section>

      {/* Library Builds */}
      <Section id="library-builds">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Library Builds</SubsectionTitle>
        <Paragraph>
          When building a component library with{" "}
          <InlineCode>build.lib</InlineCode> configured, styled-static
          automatically outputs CSS as separate files co-located with each JS
          file. This enables CSS tree-shaking for consuming applications.
        </Paragraph>

        <CodeBlock>{`# Output structure for library builds
dist/
  components/
    Button/
      Button.js    # imports "./Button.css"
      Button.css   # Button-specific styles only
    Alert/
      Alert.js     # imports "./Alert.css"
      Alert.css    # Alert-specific styles only`}</CodeBlock>

        <Paragraph>
          Consuming apps automatically get only the CSS for components they
          import:
        </Paragraph>

        <CodeBlock>{`// In your app - only Button.css is included in the bundle
import { Button } from "my-component-library/components/Button";`}</CodeBlock>

        <Callout type="tip" icon={<Lightbulb size={20} />}>
          For app builds (no <InlineCode>build.lib</InlineCode>), CSS is bundled
          as virtual modules into a single CSS file, which is the default Vite
          behavior.
        </Callout>
      </Section>
    </HowItWorksWrapper>
  );
}
