/**
 * API Section - Lazy loaded
 * Contains: styled, extension, css, cx, keyframes, attrs, variants, global
 */
import { useState } from "react";
import clsx from "clsx";
import { tv } from "tailwind-variants";
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
  cx,
} from "./shared";

// Section-specific wrapper (tests CSS code splitting)
function ApiWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx("opacity-100 transition-opacity duration-300 ease-out", className)}
      style={{ "--api-section-loaded": 1 } as React.CSSProperties}
      {...props}
    />
  );
}

// Layout primitives for demo areas
function DemoSpacer({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("mt-3", className)} {...props} />;
}

function FlexRow({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("flex items-center gap-3", className)} {...props} />;
}

function AnimLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={clsx("text-sm text-[var(--color-text-secondary)]", className)} {...props} />
  );
}

function AttrsColumn({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("flex flex-col gap-3 max-w-[320px]", className)} {...props} />;
}

function AttrsLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={clsx("text-xs text-[var(--color-text-muted)] mb-1", className)} {...props} />
  );
}

function VarsGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("text-sm flex flex-col gap-2", className)} {...props} />;
}

function VarsRow({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("flex items-center gap-2", className)} {...props} />;
}

function VarName({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={clsx(
        "text-[var(--color-primary)] font-semibold",
        "font-[Fira_Code,Monaco,monospace] text-[0.8125rem]",
        className,
      )}
      {...props}
    />
  );
}

function VarSwatch({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "w-6 h-6 bg-[var(--color-primary)] rounded border border-[var(--color-border)]",
        className,
      )}
      {...props}
    />
  );
}

function VarDesc({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={clsx("text-[var(--color-text-secondary)]", className)} {...props} />;
}

// cx demo classes
const boldClass = "font-bold";
const roundedClass = "rounded-full";
const coloredClass = "bg-[#8b5cf6] hover:bg-[#7c3aed]";

// Compound/default variants demo using tv()
const variantDemoButton = tv({
  base: [
    "py-2 px-4 text-sm font-medium font-[inherit]",
    "border-none rounded-md cursor-pointer",
    "transition-all duration-200",
  ],
  variants: {
    variant: {
      primary: "bg-[#10b981] text-white hover:bg-[#059669]",
      secondary: "bg-[#e5e7eb] text-[#1a1a1a] hover:bg-[#d1d5db]",
      danger: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
    },
    size: {
      sm: "text-[0.8125rem] py-1.5 px-3",
      lg: "text-lg py-3 px-6",
    },
    compound: {
      dangerLg: "font-black uppercase",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "sm",
  },
});

function VariantDemoButton({
  variant,
  size,
  className,
  ...props
}: {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "lg";
} & React.ComponentProps<"button">) {
  const isCompound = (variant === "danger" || !variant) && size === "lg";
  return (
    <button
      className={variantDemoButton({
        variant,
        size,
        className: cx(isCompound && variantDemoButton({ compound: "dangerLg" }), className),
      })}
      {...props}
    />
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
          Create styled React components with static CSS extraction. CSS is extracted at build time.
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
          Extend existing styled components by passing them to <InlineCode>styled()</InlineCode>.
          The new component inherits all styles from the base.
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
          The <InlineCode>css</InlineCode> helper returns a scoped class name string. Use it for
          conditional styles or to mix with styled components.
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
              {isHighlighted ? "Highlighted! Click to remove" : "Click to highlight"}
            </StyledButton>
          </ButtonGroup>
        </DemoArea>
      </Section>

      {/* cx */}
      <Section id="cx">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>cx Utility</SectionTitle>
        <Paragraph>
          A minimal utility for conditionally joining class names. Filters out falsy values
          automatically.
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
                cxDemo.colored && coloredClass,
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
          Define keyframe animations via <InlineCode>createGlobalStyle</InlineCode> and reference
          them by name in styled components. The <InlineCode>keyframes</InlineCode> helper generates
          a hashed name — see the note below about interpolation support.
        </Paragraph>
        <CodeBlock>{`import { createGlobalStyle, styled } from '@alex.radulescu/styled-static';

// Define named @keyframes via createGlobalStyle (extracted at build time)
const GlobalAnimations = createGlobalStyle\`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
\`;

// Reference animation by name in styled components
const Spinner = styled.div\`
  width: 24px;
  height: 24px;
  border: 2px solid #3b82f6;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
\`;

const PulsingDot = styled.div\`
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
\`;

// Render GlobalAnimations once at app root
<GlobalAnimations />
<App />`}</CodeBlock>
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
        <Callout type="warning" icon={<AlertTriangle size={20} />}>
          <InlineCode>{`\${keyframeVar}`}</InlineCode> interpolation inside{" "}
          <InlineCode>styled</InlineCode> templates is not supported — the CSS extractor captures
          raw source text and the variable reference would end up literally in the CSS. Define named{" "}
          <InlineCode>@keyframes</InlineCode> via <InlineCode>createGlobalStyle</InlineCode> and
          reference them by string name instead.
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
        <CodeBlock>{`import { styled } from '@alex.radulescu/styled-static';

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
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <AttrsColumn>
            <div>
              <AttrsLabel>PasswordInput (type=&quot;password&quot; via attrs)</AttrsLabel>
              <PasswordInput placeholder="Enter password" />
            </div>
            <div>
              <AttrsLabel>SubmitButton (type=&quot;submit&quot;, aria-label via attrs)</AttrsLabel>
              <SubmitButton>Submit Form</SubmitButton>
            </div>
          </AttrsColumn>
        </DemoArea>
        <Callout type="warning" icon={<AlertTriangle size={20} />}>
          Unlike styled-components, attrs in styled-static must be static objects (no functions).
          For dynamic attributes, use regular props on your component.
        </Callout>
      </Section>

      {/* Variants */}
      <Section id="variants">
        <Breadcrumb>API</Breadcrumb>
        <SectionTitle>Variants API</SectionTitle>
        <Paragraph>
          For type-safe variant handling, use <InlineCode>styledVariants</InlineCode> to create
          components with variant props, or <InlineCode>cssVariants</InlineCode> to get class
          functions.
        </Paragraph>
        <Callout type="tip" icon={<Lightbulb size={20} />}>
          Wrap CSS strings in <InlineCode>css`...`</InlineCode> to get IDE syntax highlighting from
          the styled-components VSCode extension.
        </Callout>
        <SubsectionTitle>styledVariants</SubsectionTitle>
        <CodeBlock>{`import { styledVariants, css } from '@alex.radulescu/styled-static';

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
      primary: css\`background: #10b981; color: white;\`,
      secondary: css\`background: #e5e7eb; color: #1a1a1a;\`,
      danger: css\`background: #ef4444; color: white;\`,
    },
    size: {
      sm: css\`font-size: 0.875rem;\`,
      lg: css\`font-size: 1.125rem;\`,
    },
  },
  // Default values (applied when prop is undefined)
  defaultVariants: {
    variant: 'primary',
    size: 'sm',
  },
  // Compound variants (styles when multiple conditions match)
  compoundVariants: [
    {
      variant: 'danger',
      size: 'lg',
      css: css\`font-weight: 900; text-transform: uppercase;\`,
    },
  ],
});

// Usage - defaults are applied automatically
<Button>Click</Button>  // variant="primary", size="sm"
<Button size="lg" variant="danger">Delete</Button>  // Gets compound styles`}</CodeBlock>
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
          Use <InlineCode>defaultVariants</InlineCode> to set fallback values when props are
          omitted. Use <InlineCode>compoundVariants</InlineCode> to apply extra styles when multiple
          variant conditions match.
        </Paragraph>
        <DemoArea>
          <DemoLabel>Default variants (no props = primary + sm)</DemoLabel>
          <ButtonGroup>
            <VariantDemoButton>Default (primary sm)</VariantDemoButton>
            <VariantDemoButton variant="secondary">Secondary (sm default)</VariantDemoButton>
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
        <CodeBlock>{`import { cssVariants, css, cx } from '@alex.radulescu/styled-static';

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
          Use <InlineCode>createGlobalStyle</InlineCode> for global CSS like resets, CSS variables,
          or base styles.
        </Paragraph>
        <CodeBlock>{`import { createGlobalStyle } from '@alex.radulescu/styled-static';

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
          The component renders nothing at runtime. All CSS is extracted and injected via imports.
        </Callout>
        <DemoArea>
          <DemoLabel>Active on this page</DemoLabel>
          <VarsGrid>
            <VarsRow>
              <VarName>--color-primary</VarName>
              <VarSwatch />
              <VarDesc>Set via createGlobalStyle on :root</VarDesc>
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
