/**
 * API Section - Lazy loaded
 * Contains: styled, extension, css, cx, keyframes, attrs, variants, global
 */
import { useState } from "react";
import { cx } from "styled-static";
import {
  AlertTriangle,
  Breadcrumb,
  Button,
  ButtonGroup,
  Callout,
  CodeBlock,
  DemoArea,
  DemoLabel,
  ExtendedButton,
  highlightClass,
  Info,
  InlineCode,
  Lightbulb,
  Paragraph,
  Section,
  SectionTitle,
  StyledButton,
  SubsectionTitle,
} from "./shared";

export function ApiSection() {
  const [isHighlighted, setIsHighlighted] = useState(false);

  return (
    <>
      {/* styled */}
      <Section id="styled">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>styled</SectionTitle>
        <Paragraph>
          Create styled React components with static CSS extraction. CSS is
          extracted at build time.
        </Paragraph>
        <CodeBlock filename="Button.tsx">{`import { styled } from 'styled-static';

const Button = styled.button\`
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #059669;
  }
\`;

// Usage
<Button>Click me</Button>`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <StyledButton>Click me</StyledButton>
        </DemoArea>
      </Section>

      {/* Extension */}
      <Section id="extension">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>Component Extension</SectionTitle>
        <Paragraph>
          Extend existing styled components by passing them to{" "}
          <InlineCode>styled()</InlineCode>. The new component inherits all
          styles from the base.
        </Paragraph>
        <CodeBlock filename="ExtendedButton.tsx">{`const Button = styled.button\`
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
\`;

const BoldButton = styled(Button)\`
  font-weight: 600;
  text-transform: uppercase;
\`;`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <StyledButton>Base Button</StyledButton>
            <ExtendedButton>Extended Button</ExtendedButton>
          </ButtonGroup>
        </DemoArea>
      </Section>

      {/* css */}
      <Section id="css">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>css Helper</SectionTitle>
        <Paragraph>
          The <InlineCode>css</InlineCode> helper returns a scoped class name
          string. Use it for conditional styles or to mix with styled
          components.
        </Paragraph>
        <CodeBlock>{`import { css } from 'styled-static';

const highlightClass = css\`
  box-shadow: 0 0 0 3px #10b981;
\`;

// Apply conditionally
<button className={isActive ? highlightClass : ''}>
  Click me
</button>`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <StyledButton
              className={cx(isHighlighted && highlightClass)}
              onClick={() => setIsHighlighted(!isHighlighted)}
            >
              {isHighlighted
                ? "Highlighted! Click to remove"
                : "Click to highlight"}
            </StyledButton>
          </ButtonGroup>
        </DemoArea>
      </Section>

      {/* cx */}
      <Section id="cx">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>cx Utility</SectionTitle>
        <Paragraph>
          A minimal utility for conditionally joining class names.
          Filters out falsy values automatically.
        </Paragraph>
        <CodeBlock>{`import { cx } from 'styled-static';

// Multiple class names
cx('base', 'active')           // → 'base active'

// Conditional classes
cx('btn', isActive && 'active') // → 'btn active' or 'btn'

// With css helper
const activeClass = css\`color: blue;\`;
cx('btn', isActive && activeClass)

// Falsy values are filtered
cx('a', null, undefined, false, 'b') // → 'a b'`}</CodeBlock>
      </Section>

      {/* keyframes */}
      <Section id="keyframes">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>keyframes</SectionTitle>
        <Paragraph>
          Create scoped keyframe animations. The animation name is hashed to
          avoid conflicts between components.
        </Paragraph>
        <CodeBlock>{`import { styled, keyframes } from 'styled-static';

const spin = keyframes\`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
\`;

const pulse = keyframes\`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
\`;

const Spinner = styled.div\`
  width: 24px;
  height: 24px;
  border: 2px solid #3b82f6;
  border-top-color: transparent;
  border-radius: 50%;
  animation: \${spin} 1s linear infinite;
\`;

const PulsingDot = styled.div\`
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: \${pulse} 2s ease-in-out infinite;
\`;`}</CodeBlock>
        <Callout type="note" icon={<Info size={20} />}>
          At build time, keyframes CSS is extracted to a static file and the
          animation name is hashed (e.g., <InlineCode>ss-abc123</InlineCode>).
          References in styled components are replaced with the hashed name.
        </Callout>
      </Section>

      {/* attrs */}
      <Section id="attrs">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>attrs</SectionTitle>
        <Paragraph>
          Set default HTML attributes on styled components using the{" "}
          <InlineCode>.attrs()</InlineCode> method.
        </Paragraph>
        <CodeBlock>{`import { styled } from 'styled-static';

// Set default type for input
const PasswordInput = styled.input.attrs({ type: 'password' })\`
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
\`;

// Set multiple default attributes
const SubmitButton = styled.button.attrs({
  type: 'submit',
  'aria-label': 'Submit form',
})\`
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
\`;

// Usage - default attrs are applied, can be overridden
<PasswordInput placeholder="Enter password" />
// Renders: <input type="password" placeholder="Enter password" class="ss-abc123" />

<SubmitButton>Send</SubmitButton>
// Renders: <button type="submit" aria-label="Submit form" class="ss-xyz789">Send</button>`}</CodeBlock>
        <Callout type="warning" icon={<AlertTriangle size={20} />}>
          Unlike styled-components, attrs in styled-static must be static
          objects (no functions). For dynamic attributes, use regular props on
          your component.
        </Callout>
      </Section>

      {/* Variants */}
      <Section id="variants">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>Variants API</SectionTitle>
        <Paragraph>
          For type-safe variant handling, use{" "}
          <InlineCode>styledVariants</InlineCode> to create components with
          variant props, or <InlineCode>cssVariants</InlineCode> to get class
          functions.
        </Paragraph>
        <Callout type="tip" icon={<Lightbulb size={20} />}>
          Wrap CSS strings in <InlineCode>css`...`</InlineCode> to get IDE
          syntax highlighting from the styled-components VSCode extension.
        </Callout>
        <SubsectionTitle>styledVariants</SubsectionTitle>
        <CodeBlock>{`import { styledVariants, css } from 'styled-static';

// With css\`\` for syntax highlighting (recommended)
const Button = styledVariants({
  component: 'button',
  css: css\`
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  \`,
  variants: {
    variant: {
      primary: css\`
        background: #10b981;
        color: white;
      \`,
      secondary: css\`
        background: #e5e7eb;
        color: #1a1a1a;
      \`,
    },
    size: {
      sm: css\`font-size: 0.875rem;\`,
      lg: css\`font-size: 1.125rem;\`,
    },
  },
});

// Plain strings also work (no highlighting)
const SimpleButton = styledVariants({
  component: 'button',
  css: \`padding: 0.5rem;\`,
  variants: {
    size: { sm: \`font-size: 0.875rem;\` },
  },
});

// Usage with type-safe props
<Button variant="primary" size="lg">Click</Button>`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <Button variant="primary" size="sm">
              Primary SM
            </Button>
            <Button variant="primary" size="md">
              Primary MD
            </Button>
            <Button variant="primary" size="lg">
              Primary LG
            </Button>
            <Button variant="secondary" size="md">
              Secondary
            </Button>
            <Button variant="ghost" size="md">
              Ghost
            </Button>
          </ButtonGroup>
        </DemoArea>

        <SubsectionTitle>cssVariants</SubsectionTitle>
        <CodeBlock>{`import { cssVariants, css, cx } from 'styled-static';

// With css\`\` for syntax highlighting (recommended)
const badgeCss = cssVariants({
  css: css\`
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  \`,
  variants: {
    variant: {
      info: css\`background: #e0f2fe; color: #0369a1;\`,
      success: css\`background: #dcfce7; color: #166534;\`,
    },
  },
});

// Returns class string
<span className={badgeCss({ variant: 'info' })}>Info</span>

// Combine with cx for conditional classes
<span className={cx(badgeCss({ variant: 'info' }), isActive && activeClass)}>
  Info
</span>`}</CodeBlock>
      </Section>

      {/* Global Styles */}
      <Section id="global">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>Global Styles</SectionTitle>
        <Paragraph>
          Use <InlineCode>createGlobalStyle</InlineCode> for global CSS like
          resets, CSS variables, or base styles.
        </Paragraph>
        <CodeBlock>{`import { createGlobalStyle } from 'styled-static';

const GlobalStyle = createGlobalStyle\`
  :root {
    --color-primary: #10b981;
    --color-text: #1a1a1a;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    color: var(--color-text);
  }
\`;

// Render once at app root
<GlobalStyle />
<App />`}</CodeBlock>
        <Callout type="note" icon={<Info size={20} />}>
          The component renders nothing at runtime. All CSS is extracted and
          injected via imports.
        </Callout>
      </Section>
    </>
  );
}
