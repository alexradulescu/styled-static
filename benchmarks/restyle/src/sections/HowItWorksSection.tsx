/**
 * How It Works Section - Explains the build-time transformation
 * Contains: compilation process, virtual CSS modules, runtime wrappers, bundle size
 * Converted from styled-static to Restyle.
 */
import { styled } from "restyle";
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
const HowItWorksWrapper = styled("div", {
  opacity: 1,
  transition: "opacity 0.35s ease-out",
  "--how-it-works-section-loaded": "1",
});

const BenefitsList = styled("ul", {
  marginLeft: "1.5rem",
  color: "var(--color-text-secondary)",
});

const LegendParagraph = styled("p", {
  fontSize: "0.875rem",
  color: "var(--color-text-secondary)",
  margin: "0 0 1rem",
});

const CompareTableWrap = styled("div", {
  overflowX: "auto",
  margin: "1rem 0 1.5rem",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
});

const CompareTable = styled("table", {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.875rem",
});

const CompareHeaderRow = styled("tr", {
  background: "var(--color-bg-sidebar)",
  borderBottom: "1px solid var(--color-border)",
});

const CompareHeaderCell = styled("th", {
  padding: "0.75rem",
  textAlign: "left",
});

const CompareRow = styled("tr", {
  borderBottom: "1px solid var(--color-border-subtle)",
  "&:last-child": {
    borderBottom: "none",
  },
});

const CompareCell = styled("td", {
  padding: "0.75rem",
});

const CompareCellBest = styled("td", {
  padding: "0.75rem",
  color: "var(--color-primary)",
});

const RestyleLink = styled("a", {
  color: "var(--color-text)",
});

export function HowItWorksSection() {
  return (
    <HowItWorksWrapper>
      {/* Overview */}
      <Section id="how-it-works">
        <Breadcrumb>Internals</Breadcrumb>
        <SectionTitle>How It Works</SectionTitle>
        <Paragraph>
          styled-static takes a different approach from runtime CSS-in-JS libraries. Instead of
          generating CSS at runtime, it extracts all CSS at build time using a Vite plugin. This
          gives you the developer experience of styled-components with near-zero runtime cost.
        </Paragraph>
      </Section>

      {/* Build-Time Transformation */}
      <Section id="transformation">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Build-Time Transformation</SubsectionTitle>
        <Paragraph>
          When you write a styled component, the Vite plugin intercepts your source code and
          performs AST-based transformation. The CSS is extracted to a static file, and the
          component definition is replaced with an inline React component. The runtime is just ~45
          bytes for className merging.
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
import "virtual:styled-static/src/Button.tsx/0.css";

const Button = Object.assign(
  (props) => createElement("button", {...props, className: m("ss-abc123", props.className)}),
  { className: "ss-abc123" }
);`}</CodeBlock>

        <Callout type="tip" icon={<Lightbulb size={20} />}>
          The CSS is completely removed from your JavaScript bundle and moved to a separate CSS file
          that Vite can optimize and cache.
        </Callout>
      </Section>

      {/* Virtual CSS Modules */}
      <Section id="virtual-css">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Virtual CSS Modules</SubsectionTitle>
        <Paragraph>
          The extracted CSS is served through Vite's virtual module system. Each styled component
          gets a unique virtual CSS module with a name like{" "}
          <InlineCode>virtual:styled-static/src/Button.tsx/0.css</InlineCode>.
        </Paragraph>

        <CodeBlock>{`/* Virtual module: virtual:styled-static/src/Button.tsx/0.css */
.ss-abc123 {
  padding: 1rem 2rem;
  background: blue;
  color: white;
}`}</CodeBlock>

        <Paragraph>This approach has several benefits:</Paragraph>
        <BenefitsList>
          <li>&#10003; CSS is deduplicated and optimized by Vite</li>
          <li>&#10003; Supports code splitting (CSS loads with component)</li>
          <li>&#10003; Works with Vite's HMR (hot module replacement)</li>
          <li>&#10003; Can be extracted to a single CSS file for production</li>
        </BenefitsList>
      </Section>

      {/* Runtime Wrappers */}
      <Section id="runtime">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Minimal Runtime</SubsectionTitle>
        <Paragraph>
          The runtime is just ~45 bytes because components are generated inline at build time. The
          only runtime code is a simple function to merge className strings:
        </Paragraph>

        <CodeBlock>{`// The entire runtime (~45 bytes minified)
export const m = (b, u) => (u ? \`\${b} \${u}\` : b);

// Usage: m("ss-abc123", props.className)
// m("ss-btn", undefined)     → "ss-btn"
// m("ss-btn", "custom")      → "ss-btn custom"
// m("ss-btn ss-primary", "") → "ss-btn ss-primary"`}</CodeBlock>

        <Paragraph>
          For polymorphic rendering, use <InlineCode>withComponent(To, From)</InlineCode> instead of
          an <InlineCode>as</InlineCode> prop. This resolves the component at build time rather than
          runtime.
        </Paragraph>
      </Section>

      {/* Zero-Runtime Features */}
      <Section id="zero-runtime">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Zero-Runtime Features</SubsectionTitle>
        <Paragraph>
          Some features have literally zero runtime cost because they are completely replaced at
          build time:
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
        <LegendParagraph>
          <strong>Legend:</strong> ✓ Yes | ◐ Partial | ✗ No
        </LegendParagraph>

        <CompareTableWrap>
          <CompareTable>
            <thead>
              <CompareHeaderRow>
                <CompareHeaderCell></CompareHeaderCell>
                <CompareHeaderCell>styled-static</CompareHeaderCell>
                <CompareHeaderCell>Emotion</CompareHeaderCell>
                <CompareHeaderCell>Linaria</CompareHeaderCell>
                <CompareHeaderCell>
                  <RestyleLink href="https://restyle.dev" target="_blank" rel="noopener noreferrer">
                    Restyle
                  </RestyleLink>
                </CompareHeaderCell>
                <CompareHeaderCell>Panda CSS</CompareHeaderCell>
              </CompareHeaderRow>
            </thead>
            <tbody>
              <CompareRow>
                <CompareCell>Runtime</CompareCell>
                <CompareCellBest>
                  <strong>~50 B</strong>
                </CompareCellBest>
                <CompareCell>~11 KB</CompareCell>
                <CompareCell>~1.5 KB</CompareCell>
                <CompareCell>~2.2 KB</CompareCell>
                <CompareCell>0 B</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>Dependencies</CompareCell>
                <CompareCellBest>0</CompareCellBest>
                <CompareCell>5+</CompareCell>
                <CompareCell>10+</CompareCell>
                <CompareCell>0</CompareCell>
                <CompareCell>5+</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>React</CompareCell>
                <CompareCell>19+</CompareCell>
                <CompareCell>16+</CompareCell>
                <CompareCell>16+</CompareCell>
                <CompareCell>19+</CompareCell>
                <CompareCell>16+</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>Bundler</CompareCell>
                <CompareCell>Vite</CompareCell>
                <CompareCell>Any</CompareCell>
                <CompareCell>Many</CompareCell>
                <CompareCell>Any</CompareCell>
                <CompareCell>Any</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>
                  <InlineCode>styled.el</InlineCode>
                </CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>◐</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>
                  <InlineCode>styled(Comp)</InlineCode>
                </CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>◐</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>Variants</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>◐</CompareCell>
                <CompareCell>◐</CompareCell>
                <CompareCell>◐</CompareCell>
                <CompareCell>✓</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>
                  <InlineCode>css</InlineCode> helper
                </CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>
                  <InlineCode>css</InlineCode> inline prop
                </CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✓</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>Runtime interpolation</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✗</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>Default variants</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✓</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>Compound variants</CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✓</CompareCell>
              </CompareRow>
              <CompareRow>
                <CompareCell>
                  <InlineCode>.className</InlineCode> access
                </CompareCell>
                <CompareCell>✓</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✗</CompareCell>
                <CompareCell>✗</CompareCell>
              </CompareRow>
            </tbody>
          </CompareTable>
        </CompareTableWrap>
      </Section>

      {/* Component Extensions */}
      <Section id="extensions">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Component Extensions</SubsectionTitle>
        <Paragraph>
          When you extend a component with <InlineCode>styled(Component)</InlineCode>, the
          transformation is even simpler - it just passes through to the base component:
        </Paragraph>

        <CodeBlock>{`// Source
const Primary = styled(Button)\`
  background: darkblue;
\`;

// Generated (inline component with Object.assign)
import { createElement } from "react";
import { m } from "styled-static/runtime";

const Primary = Object.assign(
  (props) => createElement(Button, {...props, className: m("ss-xyz789", props.className)}),
  { className: Button.className + " ss-xyz789" }
);

// The .className property concatenates: "ss-btn ss-xyz789"
// This ensures proper CSS cascade: base → extension → user`}</CodeBlock>

        <Paragraph>
          The base component handles its own className (including any extensions it has), and the
          new className is merged last. This ensures proper CSS cascade: base → extension → user.
        </Paragraph>
      </Section>

      {/* Variants */}
      <Section id="variant-internals">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Variants Implementation</SubsectionTitle>
        <Paragraph>
          Variant components build class strings dynamically at runtime based on prop values. All
          variant values are compared with known strings. Unknown values add no class and can never
          become CSS.
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
  ({ color, className: userClassName, ...remainingProps }) => {
    let classNames = "ss-abc123";
    if (color === "primary") classNames += " ss-abc123--color-primary";
    else if (color === "danger") classNames += " ss-abc123--color-danger";
    return createElement("button", {...remainingProps, className: m(classNames, userClassName)});
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
          Development uses readable, path-qualified class names and JavaScript-backed virtual CSS
          for HMR. Production uses content hashes and extracted CSS. Debug logging is available via
          an environment variable:
        </Paragraph>

        <CodeBlock>{`# Enable debug logging during development
DEBUG_STYLED_STATIC=true bun dev

# Representative generated component:
const Button = Object.assign(
  (props) => createElement("button", {...props, className: m("ss-abc123", props.className)}),
  { className: "ss-abc123" }
);`}</CodeBlock>

        <Paragraph>
          Since components are generated inline at build time, there's no runtime{" "}
          <InlineCode>displayName</InlineCode> handling. React DevTools will show the variable name
          from your source code.
        </Paragraph>
      </Section>

      {/* Plugin Configuration */}
      <Section id="configuration">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Plugin Configuration</SubsectionTitle>
        <Paragraph>
          The Vite plugin accepts configuration options for customizing class name prefixes, debug
          logging, and CSS output mode:
        </Paragraph>

        <CodeBlock>{`// vite.config.ts
styledStatic({
  classPrefix: 'ss',   // Prefix for generated class names (default: 'ss')
  debug: false,        // Debug logging (default: false)
  cssOutput: 'auto',   // CSS output mode (default: 'auto')
})`}</CodeBlock>

        <Paragraph>
          The <InlineCode>cssOutput</InlineCode> option controls how CSS is emitted during builds:
        </Paragraph>
        <BenefitsList>
          <li>
            <strong>'auto'</strong> (default) — Uses 'file' for library builds, 'virtual' for apps
          </li>
          <li>
            <strong>'virtual'</strong> — CSS as virtual modules (Vite bundles into single file)
          </li>
          <li>
            <strong>'file'</strong> — CSS as separate files co-located with JS (enables
            tree-shaking)
          </li>
        </BenefitsList>
      </Section>

      {/* Library Builds */}
      <Section id="library-builds">
        <Breadcrumb>Internals</Breadcrumb>
        <SubsectionTitle>Library Builds</SubsectionTitle>
        <Paragraph>
          When building a component library with <InlineCode>build.lib</InlineCode> configured,
          styled-static automatically outputs CSS as separate files co-located with each JS file.
          This enables CSS tree-shaking for consuming applications.
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
          Consuming apps automatically get only the CSS for components they import:
        </Paragraph>

        <CodeBlock>{`// In your app - only Button.css is included in the bundle
import { Button } from "my-component-library/components/Button";`}</CodeBlock>

        <Callout type="tip" icon={<Lightbulb size={20} />}>
          For app builds (no <InlineCode>build.lib</InlineCode>), CSS is bundled as virtual modules
          into a single CSS file, which is the default Vite behavior.
        </Callout>
      </Section>
    </HowItWorksWrapper>
  );
}
