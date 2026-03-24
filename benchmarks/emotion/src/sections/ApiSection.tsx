/**
 * API Section - Lazy loaded
 * Contains: styled, extension, css, cx, keyframes, attrs, variants, global
 *
 * Emotion conversion of the styled-static docs ApiSection.tsx
 */
import { useState } from "react";
import styled from "@emotion/styled";
import { css, cx } from "@emotion/css";
import {
  AlertTriangle,
  badgeCss,
  BigPrimaryButton,
  Breadcrumb,
  Button,
  ButtonGroup,
  Callout,
  CodeBlock,
  DemoArea,
  DemoLabel,
  ExtendedButton,
  Info,
  InlineCode,
  Lightbulb,
  Paragraph,
  PasswordInput,
  PulsingDot,
  Section,
  SectionTitle,
  Spinner,
  StyledButton,
  SubmitButton,
  SubsectionTitle,
  highlightClass,
} from "./shared";

// Section-specific styled component (tests CSS code splitting)
const ApiWrapper = styled.div`
  opacity: 1;
  transition: opacity 0.3s ease-out;

  /* Unique to ApiSection */
  --api-section-loaded: 1;
`;

// Layout primitives for demo areas
const DemoSpacer = styled.div`
  margin-top: 0.75rem;
`;

const FlexRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AnimLabel = styled.span`
  font-size: 0.875rem;
  color: var(--color-text-secondary);
`;

const AttrsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 320px;
`;

const AttrsLabel = styled.div`
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
`;

const VarsGrid = styled.div`
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const VarsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VarName = styled.span`
  color: var(--color-primary);
  font-weight: 600;
  font-family: "Fira Code", "Monaco", monospace;
  font-size: 0.8125rem;
`;

const VarSwatch = styled.div`
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  border-radius: 4px;
  border: 1px solid var(--color-border);
`;

const VarDesc = styled.span`
  color: var(--color-text-secondary);
`;

// cx demo classes
const boldClass = css`
  font-weight: 700;
`;
const roundedClass = css`
  border-radius: 9999px;
`;
const coloredClass = css`
  background: #8b5cf6;
  &:hover {
    background: #7c3aed;
  }
`;

// Variant demo button — Emotion: base styled component + variant function via cx
const VariantDemoButtonBase = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const variantDemoVariants = {
  primary: css`
    background: #10b981;
    color: white;
    &:hover {
      background: #059669;
    }
  `,
  secondary: css`
    background: #e5e7eb;
    color: #1a1a1a;
    &:hover {
      background: #d1d5db;
    }
  `,
  danger: css`
    background: #ef4444;
    color: white;
    &:hover {
      background: #dc2626;
    }
  `,
};

const variantDemoSizes = {
  sm: css`
    font-size: 0.8125rem;
    padding: 0.375rem 0.75rem;
  `,
  lg: css`
    font-size: 1.125rem;
    padding: 0.75rem 1.5rem;
  `,
};

const variantDemoCompound = css`
  font-weight: 900;
  text-transform: uppercase;
`;

function VariantDemoButton({
  variant = "primary",
  size = "sm",
  className,
  children,
  ...props
}: {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
} & React.ComponentProps<"button">) {
  const isCompound = variant === "danger" && size === "lg";
  return (
    <VariantDemoButtonBase
      className={cx(
        variantDemoVariants[variant],
        variantDemoSizes[size],
        isCompound && variantDemoCompound,
        className
      )}
      {...props}
    >
      {children}
    </VariantDemoButtonBase>
  );
}

export function ApiSection() {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [cxDemo, setCxDemo] = useState({ bold: false, rounded: false, colored: false });

  return (
    <ApiWrapper>
      {/* styled */}
      <Section id="styled">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>styled</SectionTitle>
        <Paragraph>
          Create styled React components with static CSS extraction. CSS is
          extracted at build time.
        </Paragraph>
        <CodeBlock filename="Button.tsx">{`import { styled } from '@alex.radulescu/styled-static';

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
\`;

// Multi-level: extends BoldButton
const BigPrimary = styled(BoldButton)\`
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
\`;`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <StyledButton>Base</StyledButton>
            <ExtendedButton>Extended</ExtendedButton>
            <BigPrimaryButton>Big Primary</BigPrimaryButton>
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
        <CodeBlock>{`import { css } from '@alex.radulescu/styled-static';

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
          A minimal utility for conditionally joining class names. Filters out
          falsy values automatically.
        </Paragraph>
        <CodeBlock>{`import { cx } from '@alex.radulescu/styled-static';

// Multiple class names
cx('base', 'active')           // → 'base active'

// Conditional classes
cx('btn', isActive && 'active') // → 'btn active' or 'btn'

// With css helper
const activeClass = css\`color: blue;\`;
cx('btn', isActive && activeClass)

// Falsy values are filtered
cx('a', null, undefined, false, 'b') // → 'a b'`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCxDemo((s) => ({ ...s, bold: !s.bold }))}
            >
              {cxDemo.bold ? "- Bold" : "+ Bold"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCxDemo((s) => ({ ...s, rounded: !s.rounded }))}
            >
              {cxDemo.rounded ? "- Rounded" : "+ Rounded"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCxDemo((s) => ({ ...s, colored: !s.colored }))}
            >
              {cxDemo.colored ? "- Purple" : "+ Purple"}
            </Button>
          </ButtonGroup>
          <DemoSpacer>
            <StyledButton
              className={cx(
                cxDemo.bold && boldClass,
                cxDemo.rounded && roundedClass,
                cxDemo.colored && coloredClass
              )}
            >
              Dynamic Classes
            </StyledButton>
          </DemoSpacer>
        </DemoArea>
      </Section>

      {/* keyframes */}
      <Section id="keyframes">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>keyframes</SectionTitle>
        <Paragraph>
          Create scoped keyframe animations using the{" "}
          <InlineCode>keyframes</InlineCode> helper from{" "}
          <InlineCode>@emotion/react</InlineCode>. The animation name is hashed
          to avoid conflicts between components.
        </Paragraph>
        <CodeBlock>{`import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

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
  border: 3px solid var(--color-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: \${spin} 1s linear infinite;
\`;

const PulsingDot = styled.div\`
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: \${pulse} 2s ease-in-out infinite;
\`;`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <FlexRow>
              <Spinner />
              <AnimLabel>Spinner (spin)</AnimLabel>
            </FlexRow>
            <FlexRow>
              <PulsingDot />
              <AnimLabel>Pulsing dot (pulse)</AnimLabel>
            </FlexRow>
          </ButtonGroup>
        </DemoArea>
        <Callout type="note" icon={<Info size={20} />}>
          Emotion interpolates the keyframe object directly into the template
          literal, replacing it with a hashed animation name at runtime.
        </Callout>
      </Section>

      {/* attrs */}
      <Section id="attrs">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>attrs</SectionTitle>
        <Paragraph>
          Emotion does not have a built-in <InlineCode>.attrs()</InlineCode>{" "}
          method. Default HTML attributes are set via wrapper components with
          hardcoded props.
        </Paragraph>
        <CodeBlock>{`// Emotion: use a wrapper component with hardcoded defaults
function PasswordInput({ className, ...props }) {
  return (
    <input
      type="password"
      className={cx(passwordInputCss, className)}
      {...props}
    />
  );
}

function SubmitButton({ className, children, ...props }) {
  return (
    <button
      type="submit"
      aria-label="Submit form"
      className={cx(submitButtonCss, className)}
      {...props}
    >
      {children}
    </button>
  );
}

// Usage - default attrs are baked in
<PasswordInput placeholder="Enter password" />
<SubmitButton>Send</SubmitButton>`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <AttrsColumn>
            <div>
              <AttrsLabel>
                PasswordInput (type=&quot;password&quot; via wrapper)
              </AttrsLabel>
              <PasswordInput placeholder="Enter password" />
            </div>
            <div>
              <AttrsLabel>
                SubmitButton (type=&quot;submit&quot;, aria-label via wrapper)
              </AttrsLabel>
              <SubmitButton>Submit Form</SubmitButton>
            </div>
          </AttrsColumn>
        </DemoArea>
        <Callout type="warning" icon={<AlertTriangle size={20} />}>
          Unlike styled-components, Emotion has no <InlineCode>.attrs()</InlineCode> API.
          Use wrapper components or spread default props manually.
        </Callout>
      </Section>

      {/* Variants */}
      <Section id="variants">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>Variants API</SectionTitle>
        <Paragraph>
          Emotion has no built-in variants API. Use plain objects of{" "}
          <InlineCode>css`...`</InlineCode> strings combined with{" "}
          <InlineCode>cx()</InlineCode> for component variant props, and the
          same pattern for class variants.
        </Paragraph>
        <Callout type="tip" icon={<Lightbulb size={20} />}>
          Wrap CSS strings in <InlineCode>css`...`</InlineCode> to get IDE
          syntax highlighting from the styled-components VSCode extension.
        </Callout>
        <SubsectionTitle>styledVariants</SubsectionTitle>
        <CodeBlock>{`import { css, cx } from '@emotion/css';
import styled from '@emotion/styled';

const buttonVariants = {
  primary: css\`background: #10b981; color: white;\`,
  secondary: css\`background: #e5e7eb; color: #1a1a1a;\`,
  danger: css\`background: #ef4444; color: white;\`,
};

const buttonSizes = {
  sm: css\`font-size: 0.875rem;\`,
  lg: css\`font-size: 1.125rem;\`,
};

// Apply via cx in a wrapper component
function Button({ variant = 'primary', size = 'sm', ...props }) {
  return (
    <ButtonBase
      className={cx(buttonVariants[variant], buttonSizes[size])}
      {...props}
    />
  );
}

// Usage - defaults applied via default params
<Button>Click</Button>  // variant="primary", size="sm"
<Button size="lg" variant="danger">Delete</Button>`}</CodeBlock>
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

        <SubsectionTitle>Default & Compound Variants</SubsectionTitle>
        <Paragraph>
          Use JavaScript default parameters for fallback values when props are
          omitted. Compound styles are applied with additional{" "}
          <InlineCode>cx()</InlineCode> conditions.
        </Paragraph>
        <DemoArea>
          <DemoLabel>Default variants (no props = primary + sm)</DemoLabel>
          <ButtonGroup>
            <VariantDemoButton>Default (primary sm)</VariantDemoButton>
            <VariantDemoButton variant="secondary">
              Secondary (sm default)
            </VariantDemoButton>
            <VariantDemoButton size="lg">Primary (lg default)</VariantDemoButton>
          </ButtonGroup>
        </DemoArea>
        <DemoArea>
          <DemoLabel>Compound: danger + lg = bold uppercase</DemoLabel>
          <ButtonGroup>
            <VariantDemoButton variant="danger" size="sm">
              Danger SM
            </VariantDemoButton>
            <VariantDemoButton variant="danger" size="lg">
              Danger LG (compound)
            </VariantDemoButton>
          </ButtonGroup>
        </DemoArea>

        <SubsectionTitle>cssVariants</SubsectionTitle>
        <CodeBlock>{`import { css, cx } from '@emotion/css';

// Plain objects of css\`\` strings
const badgeBase = css\`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
\`;

const badgeVariants = {
  info: css\`background: #e0f2fe; color: #0369a1;\`,
  success: css\`background: #dcfce7; color: #166534;\`,
};

const badgeCss = ({ variant }) => cx(badgeBase, badgeVariants[variant]);

// Returns class string
<span className={badgeCss({ variant: 'info' })}>Info</span>

// Combine with cx for conditional classes
<span className={cx(badgeCss({ variant: 'info' }), isActive && activeClass)}>
  Info
</span>`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <span className={badgeCss({ variant: "info" })}>Info</span>
            <span className={badgeCss({ variant: "success" })}>Success</span>
            <span className={badgeCss({ variant: "warning" })}>Warning</span>
          </ButtonGroup>
        </DemoArea>
      </Section>

      {/* Global Styles */}
      <Section id="global">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>Global Styles</SectionTitle>
        <Paragraph>
          Use <InlineCode>Global</InlineCode> from{" "}
          <InlineCode>@emotion/react</InlineCode> for global CSS like resets,
          CSS variables, or base styles.
        </Paragraph>
        <CodeBlock>{`import { Global, css } from '@emotion/react';

const globalStyles = css\`
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
<Global styles={globalStyles} />
<App />`}</CodeBlock>
        <Callout type="note" icon={<Info size={20} />}>
          Unlike styled-static's <InlineCode>createGlobalStyle</InlineCode>,
          Emotion's <InlineCode>Global</InlineCode> injects styles at runtime.
        </Callout>
        <DemoArea>
          <DemoLabel>Active on this page</DemoLabel>
          <VarsGrid>
            <VarsRow>
              <VarName>--color-primary</VarName>
              <VarSwatch />
              <VarDesc>Set via Global styles on :root</VarDesc>
            </VarsRow>
            <VarsRow>
              <VarName>box-sizing</VarName>
              <VarDesc>border-box applied to all elements via * selector</VarDesc>
            </VarsRow>
            <VarsRow>
              <VarName>body</VarName>
              <VarDesc>margin: 0, font-family: Inter, system-ui</VarDesc>
            </VarsRow>
          </VarsGrid>
        </DemoArea>
      </Section>
    </ApiWrapper>
  );
}
