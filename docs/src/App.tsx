import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  styled,
  css,
  createGlobalStyle,
  styledVariants,
  cssVariants,
  cx,
} from "styled-static";
import { highlight } from "sugar-high";
import {
  Globe,
  HeartCrack,
  Sparkles,
  Shield,
  Target,
  PartyPopper,
  Ban,
  Atom,
  Zap,
  Lightbulb,
  Info,
  Copy,
  Check,
  Sun,
  Moon,
  Search,
  Github,
  Palette,
  AlertTriangle,
} from "lucide-react";

// =============================================================================
// Theme & Global Styles
// =============================================================================

const GlobalStyle = createGlobalStyle`
  :root {
    --color-bg: #ffffff;
    --color-bg-sidebar: #f9fafb;
    --color-bg-code: #1e1e1e;
    --color-bg-callout: #f0fdf4;
    --color-border: #e5e7eb;
    --color-text: #1a1a1a;
    --color-text-secondary: #6b7280;
    --color-primary: #10b981;
    --color-primary-hover: #059669;
    --color-nav-active: rgba(16, 185, 129, 0.1);
    --sidebar-width: 260px;
    --header-height: 60px;
    --content-max-width: 720px;
    --radius: 8px;
    --transition: 0.2s ease;

    /* Sugar High syntax highlighting (dark theme for code blocks) */
    --sh-class: #4ec9b0;
    --sh-identifier: #9cdcfe;
    --sh-sign: #d4d4d4;
    --sh-property: #9cdcfe;
    --sh-entity: #4fc1ff;
    --sh-jsxliterals: #ce9178;
    --sh-string: #ce9178;
    --sh-keyword: #c586c0;
    --sh-comment: #6a9955;
  }

  [data-theme="dark"] {
    --color-bg: #0f0f0f;
    --color-bg-sidebar: #1a1a1a;
    --color-bg-code: #1e1e1e;
    --color-bg-callout: #0c2915;
    --color-border: #2a2a2a;
    --color-text: #e5e7eb;
    --color-text-secondary: #9ca3af;
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
    scroll-padding-top: calc(var(--header-height) + 2rem);
  }

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: var(--color-text);
    background: var(--color-bg);
    transition: background var(--transition), color var(--transition);
  }

  ::selection {
    background: var(--color-primary);
    color: white;
  }
`;

// =============================================================================
// Layout Components
// =============================================================================

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: background var(--transition), border-color var(--transition);
`;

const SidebarHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
`;

const Logo = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  text-decoration: none;

  &:hover {
    color: var(--color-primary);
  }
`;

const SearchInput = styled.div`
  position: relative;
  margin-top: 1rem;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  pointer-events: none;
`;

const SearchField = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  outline: none;
  transition: border-color var(--transition), background var(--transition);

  &::placeholder {
    color: var(--color-text-secondary);
  }

  &:focus {
    border-color: var(--color-primary);
  }
`;

const SearchHint = styled.span`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background: var(--color-bg-sidebar);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  pointer-events: none;
`;

const NavSection = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
`;

const NavGroup = styled.div`
  padding: 0 0.75rem;
  margin-bottom: 1rem;
`;

const NavGroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const activeNavItem = css`
  background: var(--color-nav-active);
  color: var(--color-primary);
  font-weight: 500;
`;

const NavItem = styled.a`
  display: block;
  padding: 0.5rem 0.75rem;
  margin: 0.125rem 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: 6px;
  transition: all var(--transition);

  &:hover {
    color: var(--color-text);
    background: var(--color-border);
  }
`;

const SidebarFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ThemeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);

  &:hover {
    background: var(--color-border);
    color: var(--color-text);
  }
`;

const Main = styled.main`
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
`;

const Content = styled.div`
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 3rem 2rem 6rem;
`;

// =============================================================================
// Typography
// =============================================================================

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
`;

const PageSubtitle = styled.p`
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0 0 3rem;
  line-height: 1.6;
`;

const Section = styled.section`
  margin-bottom: 4rem;
  scroll-margin-top: calc(var(--header-height) + 2rem);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  letter-spacing: -0.01em;
`;

const SubsectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: var(--color-text);
`;

const Paragraph = styled.p`
  margin: 0 0 1rem;
  color: var(--color-text);
`;

const InlineCode = styled.code`
  padding: 0.2rem 0.4rem;
  font-size: 0.875em;
  font-family: "Fira Code", "Monaco", monospace;
  background: var(--color-border);
  border-radius: 4px;
`;

// =============================================================================
// Code Block
// =============================================================================

const CodeBlockWrapper = styled.div`
  margin: 1.5rem 0;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--color-border);
`;

const CodeBlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #2d2d2d;
  border-bottom: 1px solid #3a3a3a;
  font-size: 0.8125rem;
  color: #9ca3af;
`;

const CodeBlockContent = styled.pre`
  margin: 0;
  padding: 1rem;
  background: var(--color-bg-code);
  color: #e5e7eb;
  font-family: "Fira Code", "Monaco", monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-family: inherit;
  color: #9ca3af;
  background: transparent;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--transition);

  &:hover {
    background: #3a3a3a;
    color: white;
  }
`;

// =============================================================================
// Callout Component
// =============================================================================

const calloutStyles = cssVariants({
  css: `
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: var(--radius);
    font-size: 0.9375rem;
    line-height: 1.6;
  `,
  variants: {
    type: {
      note: `
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        [data-theme="dark"] & {
          background: #1e3a5f;
          border-color: #2563eb40;
        }
      `,
      tip: `
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        [data-theme="dark"] & {
          background: #0c2915;
          border-color: #10b98140;
        }
      `,
      warning: `
        background: #fffbeb;
        border: 1px solid #fde68a;
        [data-theme="dark"] & {
          background: #3d2e0a;
          border-color: #d9790640;
        }
      `,
    },
  },
});

const CalloutIcon = styled.span`
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const CalloutContent = styled.div`
  flex: 1;
`;

// =============================================================================
// Demo Components
// =============================================================================

const DemoArea = styled.div`
  padding: 1.5rem;
  margin: 1.5rem 0;
  background: var(--color-bg-sidebar);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
`;

const DemoLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

// Demo button using styledVariants
const Button = styledVariants({
  component: "button",
  css: `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: inherit;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
  variants: {
    variant: {
      primary: `
        background: var(--color-primary);
        color: white;
        &:hover:not(:disabled) { background: var(--color-primary-hover); }
      `,
      secondary: `
        background: var(--color-border);
        color: var(--color-text);
        &:hover:not(:disabled) { background: var(--color-text-secondary); color: white; }
      `,
      ghost: `
        background: transparent;
        color: var(--color-text-secondary);
        &:hover:not(:disabled) { background: var(--color-border); color: var(--color-text); }
      `,
    },
    size: {
      sm: `padding: 0.375rem 0.75rem; font-size: 0.8125rem;`,
      md: `padding: 0.5rem 1rem; font-size: 0.875rem;`,
      lg: `padding: 0.75rem 1.5rem; font-size: 1rem;`,
    },
  },
});

// Example styled components for demos
const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-family: inherit;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-hover);
  }
`;

const ExtendedButton = styled(StyledButton)`
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const highlightClass = css`
  box-shadow: 0 0 0 3px var(--color-primary);
`;

const Counter = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

// =============================================================================
// Section Data
// =============================================================================

interface SectionInfo {
  id: string;
  title: string;
  group?: string;
  keywords: string[];
}

const sections: SectionInfo[] = [
  {
    id: "quick-overview",
    title: "Quick Overview",
    group: "Getting Started",
    keywords: ["overview", "quick", "summary", "api", "all"],
  },
  {
    id: "why",
    title: "Why styled-static?",
    group: "Getting Started",
    keywords: ["why", "motivation", "reason", "benefits"],
  },
  {
    id: "what-we-dont-do",
    title: "What We Don't Do",
    group: "Getting Started",
    keywords: ["limitations", "no", "interpolation", "runtime"],
  },
  {
    id: "installation",
    title: "Installation",
    group: "Getting Started",
    keywords: ["install", "setup", "npm", "bun", "yarn"],
  },
  {
    id: "styled",
    title: "styled",
    group: "API",
    keywords: ["styled", "component", "element", "html"],
  },
  {
    id: "extension",
    title: "Component Extension",
    group: "API",
    keywords: ["extend", "inherit", "base"],
  },
  {
    id: "css",
    title: "css Helper",
    group: "API",
    keywords: ["css", "class", "classname", "helper"],
  },
  {
    id: "cx",
    title: "cx Utility",
    group: "API",
    keywords: ["cx", "classnames", "conditional", "join"],
  },
  {
    id: "variants",
    title: "Variants API",
    group: "API",
    keywords: ["variant", "styledVariants", "cssVariants", "props"],
  },
  {
    id: "global",
    title: "Global Styles",
    group: "API",
    keywords: ["global", "createGlobalStyle", "reset", "root"],
  },
  {
    id: "as-prop",
    title: "Polymorphic as Prop",
    group: "Features",
    keywords: ["as", "polymorphic", "element", "render"],
  },
  {
    id: "transient",
    title: "Transient Props",
    group: "Features",
    keywords: ["transient", "$", "filter", "dom"],
  },
  {
    id: "nesting",
    title: "CSS Nesting",
    group: "Features",
    keywords: ["nesting", "&", "hover", "pseudo"],
  },
];

// =============================================================================
// Callout Component
// =============================================================================

function Callout({
  type,
  icon,
  children,
}: {
  type: "note" | "tip" | "warning";
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={calloutStyles({ type })}>
      <CalloutIcon>{icon}</CalloutIcon>
      <CalloutContent>{children}</CalloutContent>
    </div>
  );
}

// =============================================================================
// CodeBlock Component
// =============================================================================

function CodeBlock({
  filename,
  children,
}: {
  filename?: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sugar High returns HTML string with syntax highlighting
  const highlightedCode = highlight(children);

  return (
    <CodeBlockWrapper>
      {filename && (
        <CodeBlockHeader>
          <span>{filename}</span>
          <CopyButton onClick={handleCopy}>
            {copied ? (
              <>
                <Check size={14} /> Copied
              </>
            ) : (
              <>
                <Copy size={14} /> Copy
              </>
            )}
          </CopyButton>
        </CodeBlockHeader>
      )}
      <CodeBlockContent dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </CodeBlockWrapper>
  );
}

// =============================================================================
// Main App
// =============================================================================

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("theme") as "light" | "dark") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
      );
    }
    return "light";
  });
  const [activeSection, setActiveSection] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState(0);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchInputRef.current?.blur();
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Filter sections based on search
  const filteredSections = searchQuery
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.keywords.some((k) => k.includes(searchQuery.toLowerCase()))
      )
    : sections;

  // Group sections
  const groupedSections = filteredSections.reduce((acc, section) => {
    const group = section.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(section);
    return acc;
  }, {} as Record<string, SectionInfo[]>);

  return (
    <>
      <GlobalStyle />
      <Layout>
        <Sidebar>
          <SidebarHeader>
            <Logo href="#">
              <Palette size={20} />
              <span>styled-static</span>
            </Logo>
            <SearchInput>
              <SearchIcon>
                <Search size={14} />
              </SearchIcon>
              <SearchField
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchHint>⌘K</SearchHint>
            </SearchInput>
          </SidebarHeader>

          <NavSection>
            {Object.entries(groupedSections).map(([group, items]) => (
              <NavGroup key={group}>
                <NavGroupTitle>{group}</NavGroupTitle>
                {items.map((section) => (
                  <NavItem
                    key={section.id}
                    href={`#${section.id}`}
                    className={cx(
                      activeSection === section.id && activeNavItem
                    )}
                    onClick={() => setSearchQuery("")}
                  >
                    {section.title}
                  </NavItem>
                ))}
              </NavGroup>
            ))}
          </NavSection>

          <SidebarFooter>
            <ThemeToggle onClick={toggleTheme}>
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              {theme === "light" ? "Dark" : "Light"}
            </ThemeToggle>
            <a
              href="https://github.com/alexradulescu/styled-static"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <Github size={16} />
              GitHub
            </a>
          </SidebarFooter>
        </Sidebar>

        <Main>
          <Content>
            <PageTitle>styled-static</PageTitle>
            <PageSubtitle>
              Zero-runtime CSS-in-JS for React 19+ with Vite. Write
              styled-components syntax, get static CSS extracted at build time.
            </PageSubtitle>

            {/* Quick Overview */}
            <Section id="quick-overview">
              <SectionTitle>Quick Overview</SectionTitle>
              <Paragraph>
                All the APIs you need at a glance. styled-static provides 6 core
                functions that cover most CSS-in-JS use cases:
              </Paragraph>

              <SubsectionTitle>styled.element</SubsectionTitle>
              <Paragraph>Style HTML elements with template literals:</Paragraph>
              <CodeBlock>{`const Button = styled.button\`
  padding: 0.5rem 1rem;
  background: blue;
  color: white;
\`;`}</CodeBlock>

              <SubsectionTitle>styled(Component)</SubsectionTitle>
              <Paragraph>Extend existing styled components:</Paragraph>
              <CodeBlock>{`const PrimaryButton = styled(Button)\`
  font-weight: bold;
  background: darkblue;
\`;`}</CodeBlock>

              <SubsectionTitle>css</SubsectionTitle>
              <Paragraph>Get a scoped class name string:</Paragraph>
              <CodeBlock>{`const activeClass = css\`
  outline: 2px solid blue;
\`;

<Button className={isActive ? activeClass : ''}>Click</Button>`}</CodeBlock>

              <SubsectionTitle>createGlobalStyle</SubsectionTitle>
              <Paragraph>Define global (unscoped) styles:</Paragraph>
              <CodeBlock>{`const GlobalStyle = createGlobalStyle\`
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui; }
\`;

<GlobalStyle /> // Render once at app root`}</CodeBlock>

              <SubsectionTitle>styledVariants</SubsectionTitle>
              <Paragraph>
                Create components with type-safe variant props:
              </Paragraph>
              <CodeBlock>{`const Button = styledVariants({
  component: 'button',
  css: \`padding: 0.5rem 1rem; border-radius: 4px;\`,
  variants: {
    size: {
      sm: \`font-size: 0.875rem;\`,
      lg: \`font-size: 1.125rem;\`,
    },
  },
});

<Button size="lg">Large Button</Button>`}</CodeBlock>

              <SubsectionTitle>cssVariants</SubsectionTitle>
              <Paragraph>Get variant class strings for any element:</Paragraph>
              <CodeBlock>{`const badgeCss = cssVariants({
  css: \`padding: 0.25rem 0.5rem; border-radius: 4px;\`,
  variants: {
    color: {
      blue: \`background: #e0f2fe; color: #0369a1;\`,
      green: \`background: #dcfce7; color: #166534;\`,
    },
  },
});

<span className={badgeCss({ color: 'blue' })}>Info</span>`}</CodeBlock>

              <DemoArea>
                <DemoLabel>Interactive Demo</DemoLabel>
                <Counter>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setCount((c) => c - 1)}
                  >
                    −
                  </Button>
                  <span>{count}</span>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCount((c) => c + 1)}
                  >
                    +
                  </Button>
                </Counter>
              </DemoArea>
            </Section>

            {/* Why styled-static? */}
            <Section id="why">
              <SectionTitle>Why styled-static?</SectionTitle>

              <Callout type="tip" icon={<Globe size={20} />}>
                <strong>CSS & browsers have evolved.</strong> Native CSS
                nesting, CSS variables, container queries, and fewer vendor
                prefixes mean the gap between CSS and CSS-in-JS has never been
                smaller.
              </Callout>

              <Callout type="note" icon={<HeartCrack size={20} />}>
                <strong>CSS-in-JS fatigue is real.</strong> Most libraries are
                now obsolete, overly complex, or have large runtime overhead.
                The ecosystem needs simpler solutions.
              </Callout>

              <Callout type="tip" icon={<Sparkles size={20} />}>
                <strong>Syntactic sugar over CSS modules.</strong> Most projects
                don't need runtime interpolation. They need a better DX for
                writing and organizing CSS.
              </Callout>

              <Callout type="warning" icon={<Shield size={20} />}>
                <strong>Supply chain security matters.</strong> Zero
                dependencies means a minimal attack surface. No transitive
                dependencies to audit or worry about.
              </Callout>

              <Callout type="tip" icon={<Target size={20} />}>
                <strong>Intentionally simple.</strong> 95% native browser
                foundation + 5% sprinkles on top. We leverage what browsers
                already do well.
              </Callout>

              <Callout type="note" icon={<PartyPopper size={20} />}>
                <strong>Built for fun.</strong> Sometimes the best projects come
                from curiosity and the joy of building something useful.
              </Callout>
            </Section>

            {/* What We Don't Do */}
            <Section id="what-we-dont-do">
              <SectionTitle>What We Don't Do</SectionTitle>
              <Paragraph>
                styled-static is intentionally limited. Here's what we don't
                support—and why:
              </Paragraph>

              <Callout type="warning" icon={<Ban size={20} />}>
                <strong>No runtime interpolation.</strong> You can't write{" "}
                <InlineCode>{`\${props => props.color}`}</InlineCode>. CSS is
                extracted at build time, so values must be static. Use CSS
                variables, data attributes, or the Variants API for dynamic
                styles.
              </Callout>

              <Callout type="note" icon={<Atom size={20} />}>
                <strong>React 19+ only.</strong> We rely on automatic ref
                forwarding instead of <InlineCode>forwardRef</InlineCode>. This
                keeps the runtime tiny but requires React 19.
              </Callout>

              <Callout type="note" icon={<Zap size={20} />}>
                <strong>Vite only.</strong> The plugin uses Vite's built-in AST
                parser and virtual module system. No Webpack, Rollup, or other
                bundler support.
              </Callout>

              <Callout type="tip" icon={<Lightbulb size={20} />}>
                <strong>Why these constraints?</strong> Each limitation removes
                complexity. No runtime interpolation means no runtime CSS
                parsing. React 19 means no forwardRef wrapper. Vite-only means
                one excellent integration instead of many mediocre ones.
              </Callout>
            </Section>

            {/* Installation */}
            <Section id="installation">
              <SectionTitle>Installation</SectionTitle>
              <Paragraph>
                Install the package with your preferred package manager:
              </Paragraph>
              <CodeBlock filename="terminal">{`npm install styled-static
# or
bun add styled-static`}</CodeBlock>
              <Paragraph>Configure the Vite plugin:</Paragraph>
              <CodeBlock filename="vite.config.ts">{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { styledStatic } from 'styled-static/vite';

export default defineConfig({
  plugins: [styledStatic(), react()],
});`}</CodeBlock>
              <Callout type="note" icon={<Info size={20} />}>
                The plugin must be placed <strong>before</strong> the React
                plugin in the plugins array.
              </Callout>
            </Section>

            {/* styled */}
            <Section id="styled">
              <SectionTitle>styled</SectionTitle>
              <Paragraph>
                Create styled components using template literals. All HTML
                elements are available as methods on the{" "}
                <InlineCode>styled</InlineCode> object.
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
              <SectionTitle>Component Extension</SectionTitle>
              <Paragraph>
                Extend existing styled components by passing them to{" "}
                <InlineCode>styled()</InlineCode>. The new component inherits
                all styles from the base.
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
              <SectionTitle>css Helper</SectionTitle>
              <Paragraph>
                The <InlineCode>css</InlineCode> helper returns a scoped class
                name string. Use it for conditional styles or to mix with styled
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
              <SectionTitle>cx Utility</SectionTitle>
              <Paragraph>
                A minimal (~40 byte) utility for conditionally joining class
                names. Filters out falsy values automatically.
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

            {/* Variants */}
            <Section id="variants">
              <SectionTitle>Variants API</SectionTitle>
              <Paragraph>
                For type-safe variant handling, use{" "}
                <InlineCode>styledVariants</InlineCode> to create components
                with variant props, or <InlineCode>cssVariants</InlineCode> to
                get class functions.
              </Paragraph>
              <SubsectionTitle>styledVariants</SubsectionTitle>
              <CodeBlock>{`import { styledVariants } from 'styled-static';

const Button = styledVariants({
  component: 'button',
  css: \`padding: 0.5rem 1rem; border-radius: 6px;\`,
  variants: {
    variant: {
      primary: \`background: #10b981; color: white;\`,
      secondary: \`background: #e5e7eb; color: #1a1a1a;\`,
    },
    size: {
      sm: \`font-size: 0.875rem;\`,
      lg: \`font-size: 1.125rem;\`,
    },
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
              <CodeBlock>{`import { cssVariants } from 'styled-static';

const badgeCss = cssVariants({
  css: \`padding: 0.25rem 0.5rem; border-radius: 4px;\`,
  variants: {
    color: {
      info: \`background: #eff6ff; color: #1d4ed8;\`,
      success: \`background: #f0fdf4; color: #166534;\`,
    },
  },
});

// Returns class string
<span className={badgeCss({ color: 'success' })}>
  Success
</span>`}</CodeBlock>
            </Section>

            {/* Global Styles */}
            <Section id="global">
              <SectionTitle>Global Styles</SectionTitle>
              <Paragraph>
                Use <InlineCode>createGlobalStyle</InlineCode> for global CSS
                like resets, CSS variables, or base styles.
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
                The component renders nothing at runtime. All CSS is extracted
                and injected via imports.
              </Callout>
            </Section>

            {/* as prop */}
            <Section id="as-prop">
              <SectionTitle>Polymorphic as Prop</SectionTitle>
              <Paragraph>
                Change the rendered element using the{" "}
                <InlineCode>as</InlineCode> prop. Useful for semantic HTML or
                accessibility.
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
              <SectionTitle>Transient Props</SectionTitle>
              <Paragraph>
                Props prefixed with <InlineCode>$</InlineCode> are filtered out
                before reaching the DOM. Use them to pass data to your component
                logic without polluting HTML attributes.
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
                Transient props are for DOM filtering only. For dynamic CSS
                based on props, use the Variants API instead.
              </Callout>
            </Section>

            {/* CSS Nesting */}
            <Section id="nesting">
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
          </Content>
        </Main>
      </Layout>
    </>
  );
}
