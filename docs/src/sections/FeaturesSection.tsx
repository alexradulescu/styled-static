/**
 * Features Section - Lazy loaded
 * Contains: as prop, transient props, CSS nesting, theming
 */
import { Moon, Sun } from "lucide-react";
import {
  AlertTriangle,
  Breadcrumb,
  Button,
  ButtonGroup,
  Callout,
  CodeBlock,
  DemoArea,
  DemoLabel,
  InlineCode,
  Lightbulb,
  Paragraph,
  Section,
  SectionTitle,
  StyledButton,
  SubsectionTitle,
} from "./shared";

interface FeaturesSectionProps {
  theme: string;
  toggleTheme: () => void;
}

export function FeaturesSection({ theme, toggleTheme }: FeaturesSectionProps) {
  return (
    <>
      {/* as prop */}
      <Section id="as-prop">
        <Breadcrumb>Features</Breadcrumb>
        <SectionTitle>Polymorphic as Prop</SectionTitle>
        <Paragraph>
          Change the rendered element using the <InlineCode>as</InlineCode>{" "}
          prop. Useful for semantic HTML or accessibility.
        </Paragraph>
        <CodeBlock>{`const Button = styled.button\`
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
\`;

// Render as anchor
<Button as="a" href="/link">
  I'm a link!
</Button>

// Render as span
<Button as="span">
  I'm a span!
</Button>`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <StyledButton>Button</StyledButton>
            {/* @ts-expect-error - polymorphic typing limitation */}
            <StyledButton as="a" href="#as-prop">
              Anchor
            </StyledButton>
            <StyledButton as="span">Span</StyledButton>
          </ButtonGroup>
        </DemoArea>
      </Section>

      {/* Transient Props */}
      <Section id="transient">
        <Breadcrumb>Features</Breadcrumb>
        <SectionTitle>Transient Props</SectionTitle>
        <Paragraph>
          Props prefixed with <InlineCode>$</InlineCode> are filtered out before
          reaching the DOM. Use them to pass data to your component logic
          without polluting HTML attributes.
        </Paragraph>
        <CodeBlock>{`const Button = styled.button\`
  padding: 0.5rem 1rem;
\`;

// $variant won't appear in the DOM
<Button $variant="primary" $size="large">
  Click me
</Button>

// Rendered HTML:
<button class="ss-abc123">Click me</button>`}</CodeBlock>
        <Callout type="warning" icon={<AlertTriangle size={20} />}>
          Transient props are for DOM filtering only. For dynamic CSS based on
          props, use the Variants API instead.
        </Callout>
      </Section>

      {/* CSS Nesting */}
      <Section id="nesting">
        <Breadcrumb>Features</Breadcrumb>
        <SectionTitle>CSS Nesting</SectionTitle>
        <Paragraph>
          styled-static uses native CSS nesting (supported in all modern
          browsers). Use
          <InlineCode>&</InlineCode> to reference the parent selector.
        </Paragraph>
        <CodeBlock>{`const Card = styled.div\`
  padding: 1rem;
  background: white;
  border-radius: 8px;

  /* Pseudo-classes */
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* Child selectors */
  & h2 {
    margin: 0 0 0.5rem;
  }

  /* Media queries */
  @media (max-width: 640px) {
    padding: 0.5rem;
  }

  /* Pseudo-elements */
  &::before {
    content: '';
    position: absolute;
  }
\`;`}</CodeBlock>
        <Callout type="tip" icon={<Lightbulb size={20} />}>
          Native CSS nesting means zero build-time processing. Your CSS is
          passed directly to the browser.
        </Callout>
      </Section>

      {/* Theming */}
      <Section id="theming">
        <Breadcrumb>Features</Breadcrumb>
        <SectionTitle>Theming</SectionTitle>
        <Paragraph>
          styled-static provides a CSS-first approach to theming using CSS
          variables and <InlineCode>data-theme</InlineCode> attributes. Zero
          runtime overhead—just pure CSS.
        </Paragraph>

        <SubsectionTitle>Defining Themes</SubsectionTitle>
        <Paragraph>
          Use <InlineCode>createGlobalStyle</InlineCode> to define your theme
          tokens as CSS variables:
        </Paragraph>
        <CodeBlock>{`const GlobalStyle = createGlobalStyle\`
  :root, [data-theme="light"] {
    --color-bg: #ffffff;
    --color-text: #1a1a1a;
    --color-primary: #10b981;
  }
  
  [data-theme="dark"] {
    --color-bg: #0f0f0f;
    --color-text: #e5e7eb;
    --color-primary: #10b981;
  }
  
  /* Custom themes */
  [data-theme="pokemon"] {
    --color-bg: #ffcb05;
    --color-text: #2a75bb;
    --color-primary: #cc0000;
  }
\`;

const Button = styled.button\`
  background: var(--color-primary);
  color: var(--color-bg);
\`;`}</CodeBlock>

        <SubsectionTitle>Theme Helper Functions</SubsectionTitle>
        <Paragraph>
          styled-static exports helper functions for theme switching:
        </Paragraph>
        <CodeBlock>{`import { initTheme, setTheme, getTheme, onSystemThemeChange } from 'styled-static';

// Initialize on app load (reads from localStorage, then system preference)
initTheme({
  defaultTheme: 'light',
  useSystemPreference: true  // Optional: detect OS dark mode
});

// Get current theme
const current = getTheme(); // 'light' | 'dark' | etc.

// Change theme (persists to localStorage by default)
setTheme('dark');

// Change without persisting (useful for previews)
setTheme('pokemon', false);

// Listen for OS theme changes
const unsubscribe = onSystemThemeChange((prefersDark) => {
  if (!localStorage.getItem('theme')) {
    setTheme(prefersDark ? 'dark' : 'light', false);
  }
});`}</CodeBlock>

        <SubsectionTitle>Theme Toggle Example</SubsectionTitle>
        <Paragraph>
          Here's how this documentation page implements its theme toggle:
        </Paragraph>
        <CodeBlock>{`function ThemeToggle() {
  const [theme, setThemeState] = useState(() => {
    return initTheme({ useSystemPreference: true });
  });
  
  const toggleTheme = () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Try it</DemoLabel>
          <ButtonGroup>
            <Button variant="primary" onClick={toggleTheme}>
              {theme === "light" ? (
                <>
                  <Moon size={16} /> Dark Mode
                </>
              ) : (
                <>
                  <Sun size={16} /> Light Mode
                </>
              )}
            </Button>
          </ButtonGroup>
        </DemoArea>

        <SubsectionTitle>API Reference</SubsectionTitle>
        <CodeBlock>{`// initTheme options
initTheme({
  defaultTheme: 'light',        // Default theme if no stored preference
  storageKey: 'theme',          // localStorage key (default: 'theme')
  useSystemPreference: false,   // Detect OS dark/light preference
  attribute: 'data-theme',      // Attribute to set on documentElement
});

// Function signatures
getTheme(attribute?: string): string
setTheme(theme: string, persist?: boolean, options?: object): void
initTheme(options?: InitThemeOptions): string
onSystemThemeChange(callback: (isDark: boolean) => void): () => void`}</CodeBlock>

        <Callout type="tip" icon={<Lightbulb size={20} />}>
          The theme helpers are SSR-safe and gracefully handle missing browser
          APIs. They return sensible defaults when running on the server.
        </Callout>
      </Section>
    </>
  );
}
