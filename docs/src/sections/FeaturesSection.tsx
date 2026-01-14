/**
 * Features Section - Lazy loaded
 * Contains: withComponent, CSS nesting, theming
 */
import { styled } from "@alex.radulescu/styled-static";
import { Moon, Sun } from "lucide-react";
import {
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
          Every styled component exposes a static{" "}
          <InlineCode>.className</InlineCode> property for manual composition.
          For rendering one component with another's styles, use{" "}
          <InlineCode>withComponent</InlineCode>.
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
import { withComponent } from '@alex.radulescu/styled-static';

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
          CSS-first theming with CSS variables and{" "}
          <InlineCode>data-theme</InlineCode> attributes:
        </Paragraph>

        <CodeBlock>{`const GlobalStyle = createGlobalStyle\`
  :root, [data-theme="light"] { --bg: #fff; --text: #1a1a1a; }
  [data-theme="dark"] { --bg: #0a0a0a; --text: #f1f5f9; }
  [data-theme="pokemon"] { --bg: #ffcb05; --text: #2a75bb; }
\`;

const Card = styled.div\`
  background: var(--bg);
  color: var(--text);
\`;`}</CodeBlock>

        <SubsectionTitle>Theme Helpers</SubsectionTitle>
        <CodeBlock>{`import { initTheme, setTheme, getTheme, onSystemThemeChange } from '@alex.radulescu/styled-static';

// Initialize (reads localStorage → system preference → default)
initTheme({ defaultTheme: 'light', useSystemPreference: true });

// Switch themes
setTheme('dark');              // persists to localStorage
setTheme('pokemon', false);    // no persist (preview)

// Read current
const current = getTheme();    // 'light' | 'dark' | etc.

// React to OS changes
const unsub = onSystemThemeChange((prefersDark) => {
  if (!localStorage.getItem('theme')) setTheme(prefersDark ? 'dark' : 'light', false);
});`}</CodeBlock>

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
      </Section>
    </FeaturesWrapper>
  );
}
