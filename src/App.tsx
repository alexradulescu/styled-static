import { useState } from "react";
import {
  styled,
  css,
  createGlobalStyle,
  styledVariants,
  cssVariants,
  cx,
} from "./index";

// =============================================================================
// Global Styles
// =============================================================================

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
    background: #f9fafb;
  }

  :root {
    --color-primary: #3b82f6;
    --color-primary-hover: #2563eb;
    --color-danger: #ef4444;
    --color-success: #10b981;
    --radius-sm: 4px;
    --radius-md: 8px;
  }
`;

// =============================================================================
// Layout Components
// =============================================================================

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Section = styled.section`
  background: white;
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 0 0 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
`;

// =============================================================================
// Button Components - Demonstrating Extension
// =============================================================================

/**
 * Base button with common styles.
 */
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Primary button - extends Button
 */
const PrimaryButton = styled(Button)`
  background: var(--color-primary);
  color: white;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
`;

/**
 * Secondary button - extends Button
 */
const SecondaryButton = styled(Button)`
  background: #e5e7eb;
  color: #374151;

  &:hover:not(:disabled) {
    background: #d1d5db;
  }
`;

/**
 * Danger button - extends Button
 */
const DangerButton = styled(Button)`
  background: var(--color-danger);
  color: white;

  &:hover:not(:disabled) {
    background: #dc2626;
  }
`;

/**
 * Large primary button - extends PrimaryButton (nested extension)
 */
const LargePrimaryButton = styled(PrimaryButton)`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
`;

// =============================================================================
// CSS Helper - Demonstrating css``
// =============================================================================

/**
 * Standalone class for conditional styling
 */
const activeClass = css`
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
`;

const pulseClass = css`
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

// =============================================================================
// Demo Components
// =============================================================================

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const Counter = styled.div`
  font-size: 3rem;
  font-weight: bold;
  text-align: center;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
  margin: 1rem 0;
`;

const Code = styled.pre`
  background: #1a1a1a;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: var(--radius-md);
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  margin-left: 0.5rem;
`;

// =============================================================================
// Application
// =============================================================================

function CounterDemo() {
  const [count, setCount] = useState(0);

  return (
    <Section>
      <SectionTitle>Interactive Counter</SectionTitle>
      <p>Demonstrates state management with styled components.</p>
      <Counter>{count}</Counter>
      <ButtonGroup>
        <SecondaryButton onClick={() => setCount((c) => c - 1)}>
          Decrease
        </SecondaryButton>
        <DangerButton onClick={() => setCount(0)}>Reset</DangerButton>
        <PrimaryButton onClick={() => setCount((c) => c + 1)}>
          Increase
        </PrimaryButton>
      </ButtonGroup>
    </Section>
  );
}

function ExtensionDemo() {
  return (
    <Section>
      <SectionTitle>Component Extension</SectionTitle>
      <p>Button variants created by extending the base Button component:</p>
      <ButtonGroup>
        <Button>Base Button</Button>
        <PrimaryButton>Primary</PrimaryButton>
        <SecondaryButton>Secondary</SecondaryButton>
        <DangerButton>Danger</DangerButton>
      </ButtonGroup>
      <p>Nested extension (LargePrimaryButton extends PrimaryButton):</p>
      <ButtonGroup>
        <LargePrimaryButton>Large Primary</LargePrimaryButton>
      </ButtonGroup>
      <Code>{`const Button = styled.button\`...\`;
const PrimaryButton = styled(Button)\`background: blue;\`;
const LargePrimaryButton = styled(PrimaryButton)\`padding: 1rem 2rem;\`;`}</Code>
    </Section>
  );
}

function AsPropsDemo() {
  return (
    <Section>
      <SectionTitle>Polymorphic "as" Prop</SectionTitle>
      <p>Render a button as different HTML elements:</p>
      <ButtonGroup>
        <PrimaryButton>Button (default)</PrimaryButton>
        {/* @ts-expect-error - as prop polymorphism not fully typed yet */}
        <PrimaryButton as="a" href="#as-prop">
          As Anchor
        </PrimaryButton>
        <PrimaryButton as="span">As Span</PrimaryButton>
      </ButtonGroup>
      <Code>{`<PrimaryButton as="a" href="/link">Link styled as button</PrimaryButton>`}</Code>
    </Section>
  );
}

function CssHelperDemo() {
  const [isActive, setIsActive] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  return (
    <Section>
      <SectionTitle>
        CSS Helper <Badge>css``</Badge> + <Badge>cx()</Badge>
      </SectionTitle>
      <p>
        Use <code>css</code> for standalone classes and <code>cx</code> for
        conditional combining:
      </p>
      <ButtonGroup>
        <PrimaryButton
          className={cx(isActive && activeClass, isPulsing && pulseClass)}
          onClick={() => setIsActive(!isActive)}
        >
          {isActive ? "Active" : "Inactive"} (click to toggle)
        </PrimaryButton>
        <SecondaryButton onClick={() => setIsPulsing(!isPulsing)}>
          {isPulsing ? "Stop Pulse" : "Start Pulse"}
        </SecondaryButton>
      </ButtonGroup>
      <Code>{`import { css, cx } from 'styled-static';

const activeClass = css\`outline: 2px solid blue;\`;
const pulseClass = css\`animation: pulse 1s infinite;\`;

// cx joins class names, filtering out falsy values
<Button className={cx(
  isActive && activeClass,
  isPulsing && pulseClass
)}>
  Toggle
</Button>

// Multiple arguments - falsy values filtered
cx('base', isActive && 'active', null, 'other')
// → "base active other" or "base other"`}</Code>
    </Section>
  );
}

function ClassNameMergingDemo() {
  return (
    <Section>
      <SectionTitle>className Merging</SectionTitle>
      <p>User className is merged with styled class (correct cascade order):</p>
      <ButtonGroup>
        <PrimaryButton className="custom-tracking-class">
          With Custom Class
        </PrimaryButton>
        <PrimaryButton className={`${activeClass} ${pulseClass}`}>
          Multiple Classes
        </PrimaryButton>
      </ButtonGroup>
      <Code>{`// Classes are merged in order: styled-class user-class
<PrimaryButton className="custom">
// Renders: class="ss-abc123 custom"`}</Code>
    </Section>
  );
}

// =============================================================================
// Variants Demo - styledVariants and cssVariants
// =============================================================================

const VariantButton = styledVariants({
  component: "button",
  css: `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: inherit;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
  `,
  variants: {
    color: {
      primary: `
        background: var(--color-primary);
        color: white;
        &:hover { background: var(--color-primary-hover); }
      `,
      danger: `
        background: var(--color-danger);
        color: white;
        &:hover { background: #dc2626; }
      `,
      success: `
        background: var(--color-success);
        color: white;
        &:hover { background: #059669; }
      `,
    },
    size: {
      sm: `
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
      `,
      md: `
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      `,
      lg: `
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
      `,
    },
  },
});

const badgeCss = cssVariants({
  css: `
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: var(--radius-sm);
  `,
  variants: {
    variant: {
      info: `background: #e0f2fe; color: #0369a1;`,
      success: `background: #dcfce7; color: #166534;`,
      warning: `background: #fef3c7; color: #92400e;`,
      error: `background: #fee2e2; color: #991b1b;`,
    },
  },
});

function VariantsDemo() {
  const [color, setColor] = useState<"primary" | "danger" | "success">(
    "primary"
  );
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");

  return (
    <Section>
      <SectionTitle>
        Variants API <Badge>NEW</Badge>
      </SectionTitle>
      <p>Use styledVariants and cssVariants for type-safe variant handling:</p>

      <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
        styledVariants - Component with variant props:
      </h4>
      <ButtonGroup>
        <VariantButton color={color} size={size}>
          color="{color}" size="{size}"
        </VariantButton>
      </ButtonGroup>
      <ButtonGroup>
        <SecondaryButton onClick={() => setColor("primary")}>
          Primary
        </SecondaryButton>
        <SecondaryButton onClick={() => setColor("danger")}>
          Danger
        </SecondaryButton>
        <SecondaryButton onClick={() => setColor("success")}>
          Success
        </SecondaryButton>
        <span style={{ margin: "0 0.5rem" }}>|</span>
        <SecondaryButton onClick={() => setSize("sm")}>Small</SecondaryButton>
        <SecondaryButton onClick={() => setSize("md")}>Medium</SecondaryButton>
        <SecondaryButton onClick={() => setSize("lg")}>Large</SecondaryButton>
      </ButtonGroup>

      <h4 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
        cssVariants - Returns class string:
      </h4>
      <ButtonGroup>
        <span className={badgeCss({ variant: "info" })}>Info Badge</span>
        <span className={badgeCss({ variant: "success" })}>Success Badge</span>
        <span className={badgeCss({ variant: "warning" })}>Warning Badge</span>
        <span className={badgeCss({ variant: "error" })}>Error Badge</span>
      </ButtonGroup>

      <Code>{`// styledVariants - creates a component
const Button = styledVariants({
  component: 'button',
  css: \`padding: 0.5rem 1rem;\`,
  variants: {
    color: {
      primary: \`background: blue;\`,
      danger: \`background: red;\`,
    },
  },
});
<Button color="primary">Click</Button>

// cssVariants - returns class function
const badgeCss = cssVariants({
  css: \`padding: 0.25rem 0.5rem;\`,
  variants: {
    variant: { info: \`color: blue;\` },
  },
});
<span className={badgeCss({ variant: 'info' })}>Badge</span>`}</Code>
    </Section>
  );
}

export function App() {
  return (
    <>
      <GlobalStyle />
      <Container>
        <Title>styled-static</Title>
        <Subtitle>
          Zero-runtime styled components for React 19+ with Vite
        </Subtitle>

        <CounterDemo />
        <ExtensionDemo />
        <AsPropsDemo />
        <CssHelperDemo />
        <ClassNameMergingDemo />
        <VariantsDemo />
      </Container>
    </>
  );
}
