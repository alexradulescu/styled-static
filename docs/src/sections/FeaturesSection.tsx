/**
 * Features Section - Lazy loaded
 * Contains: withComponent, CSS nesting, theming
 */
import { styled } from "styled-static";
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

// Section-specific styled component (tests CSS code splitting)
const FeaturesWrapper = styled.div`
  opacity: 1;
  transition: opacity 0.25s ease-out;

  /* Unique to FeaturesSection */
  --features-section-loaded: 1;
`;

interface FeaturesSectionProps {
  theme: string;
  toggleTheme: () => void;
}

export function FeaturesSection({ theme, toggleTheme }: FeaturesSectionProps) {
  return (
    <FeaturesWrapper>
      {/* withComponent & className */}
      <Section id="polymorphism">
        <Breadcrumb>Features</Breadcrumb>
        <SectionTitle>Polymorphism & Composition</SectionTitle>
        <Paragraph>
          Every styled component exposes a static <InlineCode>.className</InlineCode>{" "}
          property for manual composition. For rendering one component with
          another's styles, use <InlineCode>withComponent</InlineCode>.
        </Paragraph>
        <CodeBlock>{`const Button = styled.button\`
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
\`;

// Access className for manual composition
<a className={Button.className} href="/link">
  Link with button styles
</a>

// Use withComponent for polymorphic rendering
import { Link } from 'react-router-dom';
import { withComponent } from 'styled-static';

const LinkButton = withComponent(Link, Button);

<LinkButton to="/path">
  Router link styled as button
</LinkButton>`}</CodeBlock>
        <DemoArea>
          <DemoLabel>Result</DemoLabel>
          <ButtonGroup>
            <StyledButton>Button</StyledButton>
            <a className={StyledButton.className} href="#polymorphism">
              Anchor (via className)
            </a>
          </ButtonGroup>
        </DemoArea>
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
          variables and <InlineCode>data-theme</InlineCode> attributes. Themes
          are pure CSS—no runtime theme injection.
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
    </FeaturesWrapper>
  );
}
