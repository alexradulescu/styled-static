import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  Atom,
  Ban,
  Code2,
  Github,
  Globe,
  HeartCrack,
  Info,
  Lightbulb,
  Moon,
  Palette,
  PartyPopper,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Sun,
  Target,
  Zap,
} from "lucide-react";
import {
  createGlobalStyle,
  css,
  cssVariants,
  getTheme,
  initTheme,
  onSystemThemeChange,
  setTheme,
  styled,
} from "styled-static";
import { CodeBlock } from "./sections/shared";

// Lazy-loaded sections for code splitting
const ApiSection = lazy(() =>
  import("./sections/ApiSection").then((m) => ({ default: m.ApiSection }))
);
const FeaturesSection = lazy(() =>
  import("./sections/FeaturesSection").then((m) => ({
    default: m.FeaturesSection,
  }))
);

// =============================================================================
// Theme & Global Styles
// =============================================================================

const GlobalStyle = createGlobalStyle`
  :root {
    --color-bg: #ffffff;
    --color-bg-sidebar: #fafafa;
    --color-bg-code: #0f0f0f;
    --color-bg-callout: #f0fdf4;
    --color-border: #e2e8f0;
    --color-border-subtle: #f1f5f9;
    --color-text: #0f172a;
    --color-text-secondary: #64748b;
    --color-text-muted: #94a3b8;
    --color-primary: #10b981;
    --color-primary-hover: #059669;
    --color-nav-active: rgba(16, 185, 129, 0.08);
    --sidebar-width: 260px;
    --header-height: 60px;
    --mobile-header-height: 56px;
    --content-max-width: 720px;
    --radius: 8px;
    --radius-lg: 12px;
    --transition: 0.15s ease;
    --scrollbar-thumb: rgba(0, 0, 0, 0.12);
    --scrollbar-thumb-hover: rgba(0, 0, 0, 0.2);

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
    --color-bg: #0a0a0a;
    --color-bg-sidebar: #111111;
    --color-bg-code: #0f0f0f;
    --color-bg-callout: #0c2915;
    --color-border: #1f1f1f;
    --color-border-subtle: #171717;
    --color-text: #f1f5f9;
    --color-text-secondary: #94a3b8;
    --color-text-muted: #64748b;
    --scrollbar-thumb: rgba(255, 255, 255, 0.12);
    --scrollbar-thumb-hover: rgba(255, 255, 255, 0.2);
  }

  * {
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) transparent;
  }

  /* Webkit scrollbar styling */
  *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }

  *::-webkit-scrollbar-corner {
    background: transparent;
  }

  html {
    scroll-behavior: smooth;
    scroll-padding-top: calc(var(--header-height) + 2rem);
  }

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.65;
    color: var(--color-text);
    background: var(--color-bg);
    transition: background var(--transition), color var(--transition);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
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
  overflow-x: hidden;
`;

const MobileHeader = styled.header`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--mobile-header-height);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  padding: 0 12px;
  align-items: center;
  justify-content: space-between;
  z-index: 150;
  transition: background var(--transition), border-color var(--transition);

  @media (max-width: 767px) {
    display: flex;
  }
`;

const BurgerButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;

  span {
    display: block;
    width: 20px;
    height: 2px;
    background: var(--color-text);
    border-radius: 1px;
    transition: background var(--transition);
  }
`;

const HeaderTitle = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text);
`;

const Overlay = styled.div`
  display: none;

  @media (max-width: 767px) {
    display: block;
    position: fixed;
    inset: var(--mobile-header-height) 0 0 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 99;

    &[data-visible="true"] {
      opacity: 1;
      pointer-events: auto;
    }
  }
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
  transition:
    background var(--transition),
    border-color var(--transition);

  [data-theme="light"] & {
    box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
  }

  @media (max-width: 767px) {
    top: var(--mobile-header-height);
    height: calc(100vh - var(--mobile-header-height));
    transform: translateX(-100%);
    transition:
      background var(--transition),
      border-color var(--transition),
      transform 0.2s ease;

    &[data-open="true"] {
      transform: translateX(0);
    }
  }
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
  transition:
    border-color var(--transition),
    background var(--transition);

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
  padding: 0.5rem 0.5rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.25rem;
`;

const activeNavItem = css`
  background: var(--color-nav-active);
  color: var(--color-primary);
  font-weight: 500;
  border-left: 2px solid var(--color-primary);
  padding-left: calc(0.75rem - 2px);
`;

const NavItem = styled.a`
  display: block;
  padding: 0.4375rem 0.75rem;
  margin: 0.0625rem 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: 6px;
  border-left: 2px solid transparent;
  transition: all var(--transition);

  &:hover {
    color: var(--color-text);
    background: var(--color-border-subtle);
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
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  font-family: inherit;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);

  &:hover {
    background: var(--color-border-subtle);
    color: var(--color-text);
    border-color: var(--color-text-secondary);
  }
`;

const IconLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
  text-decoration: none;

  &:hover {
    background: var(--color-border-subtle);
    color: var(--color-text);
    border-color: var(--color-text-secondary);
  }
`;

const Main = styled.main`
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  min-width: 0;

  @media (max-width: 767px) {
    margin-left: 0;
    margin-top: var(--mobile-header-height);
  }
`;

const Content = styled.div`
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 3rem 2rem 6rem;

  @media (max-width: 767px) {
    max-width: 100%;
    padding: 2rem 12px 4rem;
  }
`;

// =============================================================================
// Typography - Inline for Getting Started
// =============================================================================

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;

  @media (max-width: 767px) {
    font-size: 1.75rem;
  }
`;

const PageSubtitle = styled.p`
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0 0 1.5rem;
  line-height: 1.6;
`;

const HeroBanner = styled.div`
  height: 140px;
  margin: 0 0 3rem;
  background: linear-gradient(135deg, #0a0a0a 0%, #0f1f12 50%, #0a1a0d 100%);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;

  /* Geometric pattern using pseudo-elements */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      linear-gradient(135deg, transparent 40%, rgba(16, 185, 129, 0.08) 40%, rgba(16, 185, 129, 0.08) 60%, transparent 60%),
      linear-gradient(225deg, transparent 30%, rgba(16, 185, 129, 0.05) 30%, rgba(16, 185, 129, 0.05) 50%, transparent 50%);
  }

  &::after {
    content: '';
    position: absolute;
    top: 20%;
    right: 10%;
    width: 200px;
    height: 200px;
    background: linear-gradient(45deg, transparent 45%, rgba(16, 185, 129, 0.12) 45%, rgba(16, 185, 129, 0.12) 55%, transparent 55%);
    transform: rotate(15deg);
  }

  @media (max-width: 767px) {
    height: 100px;
    margin: 0 0 2rem;
    border-radius: var(--radius);
  }
`;

const Section = styled.section`
  margin-bottom: 4rem;
  scroll-margin-top: calc(var(--header-height) + 2rem);

  @media (max-width: 767px) {
    margin-bottom: 3rem;
    scroll-margin-top: calc(var(--mobile-header-height) + 1rem);
  }
`;

const Breadcrumb = styled.span`
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.625rem;
  font-weight: 600;
  margin: 0 0 1.25rem;
  letter-spacing: -0.02em;

  @media (max-width: 767px) {
    font-size: 1.375rem;
  }
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
// Callout (inline for Getting Started)
// =============================================================================

const calloutStyles = cssVariants({
  css: css`
    display: flex;
    gap: 0.875rem;
    padding: 1.125rem 1.25rem;
    margin: 1.5rem 0;
    border-radius: var(--radius);
    font-size: 0.9375rem;
    line-height: 1.6;
  `,
  variants: {
    type: {
      note: css`
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        [data-theme="dark"] & {
          background: #1e3a5f;
          border-color: #2563eb40;
        }
      `,
      tip: css`
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        [data-theme="dark"] & {
          background: #0c2915;
          border-color: #10b98140;
        }
      `,
      warning: css`
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
// Loading Spinner
// =============================================================================

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
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
    id: "keyframes",
    title: "keyframes",
    group: "API",
    keywords: ["keyframes", "animation", "spin", "pulse", "rotate"],
  },
  {
    id: "attrs",
    title: "attrs",
    group: "API",
    keywords: ["attrs", "attributes", "default", "type", "input"],
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
  {
    id: "theming",
    title: "Theming",
    group: "Features",
    keywords: ["theme", "dark", "light", "mode", "toggle", "custom"],
  },
];

// =============================================================================
// Main App
// =============================================================================

export function App() {
  const [theme, setThemeState] = useState<string>(() => {
    // Initialize theme from localStorage or system preference
    return initTheme({ useSystemPreference: true });
  });
  const [activeSection, setActiveSection] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme toggle using styled-static helpers
  const toggleTheme = () => {
    const current = getTheme();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  // Subscribe to system theme changes
  useEffect(() => {
    return onSystemThemeChange((prefersDark) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem("theme")) {
        const next = prefersDark ? "dark" : "light";
        setTheme(next, false);
        setThemeState(next);
      }
    });
  }, []);

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

  // Scroll spy with MutationObserver to handle lazy-loaded sections
  useEffect(() => {
    const observedElements = new Set<Element>();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    // Function to observe any new sections that appear in the DOM
    const observeSections = () => {
      sections.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el && !observedElements.has(el)) {
          intersectionObserver.observe(el);
          observedElements.add(el);
        }
      });
    };

    // Initial observation
    observeSections();

    // Use MutationObserver to detect when lazy-loaded sections are added
    const mutationObserver = new MutationObserver(() => {
      observeSections();
    });

    // Observe the document body for added nodes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  // Filter sections based on search query
  const filteredSections = searchQuery
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.keywords.some((k) =>
            k.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : sections;

  // Group sections by their group
  const groupedSections = filteredSections.reduce(
    (acc, section) => {
      const group = section.group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(section);
      return acc;
    },
    {} as Record<string, SectionInfo[]>
  );

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <GlobalStyle />
      <Layout>
        <MobileHeader>
          <HeaderTitle>styled-static</HeaderTitle>
          <BurgerButton
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
          </BurgerButton>
        </MobileHeader>
        <Overlay data-visible={sidebarOpen} onClick={closeSidebar} />
        <Sidebar data-open={sidebarOpen}>
          <SidebarHeader>
            <Logo href="#">
              <Palette size={24} />
              styled-static
            </Logo>
            <SearchInput>
              <SearchIcon>
                <Search size={16} />
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
                <NavGroupTitle>
                  {group === "Getting Started" && <Rocket size={12} />}
                  {group === "API" && <Code2 size={12} />}
                  {group === "Features" && <Sparkles size={12} />}
                  {group}
                </NavGroupTitle>
                {items.map((item) => (
                  <NavItem
                    key={item.id}
                    href={`#${item.id}`}
                    className={activeSection === item.id ? activeNavItem : ""}
                    onClick={() => {
                      setSearchQuery("");
                      closeSidebar();
                    }}
                  >
                    {item.title}
                  </NavItem>
                ))}
              </NavGroup>
            ))}
          </NavSection>

          <SidebarFooter>
            <ThemeToggle onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </ThemeToggle>
            <IconLink
              href="https://github.com/nicholascostadev/styled-static"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            >
              <Github size={18} />
            </IconLink>
          </SidebarFooter>
        </Sidebar>

        <Main>
          <Content>
            {/* Hero */}
            <PageTitle>styled-static</PageTitle>
            <PageSubtitle>
              Zero-runtime CSS-in-JS for React 19+ with Vite. Write
              styled-components syntax, get static CSS extracted at build time.
            </PageSubtitle>
            <HeroBanner />

            {/* ========================================== */}
            {/* GETTING STARTED - Inline (not lazy loaded) */}
            {/* ========================================== */}

            {/* Quick Overview */}
            <Section id="quick-overview">
              <Breadcrumb>Getting Started</Breadcrumb>
              <SectionTitle>Quick Overview</SectionTitle>
              <Paragraph>
                All the APIs you need at a glance. styled-static provides 6 core
                functions that cover most CSS-in-JS use cases:
              </Paragraph>
              <CodeBlock>{`// Style elements
const Button = styled.button\`padding: 0.5rem 1rem;\`;

// Extend components
const Primary = styled(Button)\`font-weight: bold;\`;

// Get class string
const active = css\`outline: 2px solid;\`;

// Global styles
const GlobalStyle = createGlobalStyle\`* { box-sizing: border-box; }\`;

// Scoped keyframes
const spin = keyframes\`from { transform: rotate(0deg); } to { transform: rotate(360deg); }\`;

// Type-safe variants
const Btn = styledVariants({
  component: 'button',
  css: css\`padding: 0.5rem;\`,
  variants: { size: { sm: css\`font-size: 0.875rem;\`, lg: css\`font-size: 1.125rem;\` } }
});`}</CodeBlock>
            </Section>

            {/* Why styled-static? */}
            <Section id="why">
              <Breadcrumb>Getting Started</Breadcrumb>
              <SectionTitle>Why styled-static?</SectionTitle>

              <div className={calloutStyles({ type: "tip" })}>
                <CalloutIcon>
                  <Globe size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>CSS & browsers have evolved.</strong> Native CSS
                  nesting, CSS variables, container queries, and fewer vendor
                  prefixes mean the gap between CSS and CSS-in-JS has never been
                  smaller.
                </CalloutContent>
              </div>

              <div className={calloutStyles({ type: "note" })}>
                <CalloutIcon>
                  <HeartCrack size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>CSS-in-JS fatigue is real.</strong> Most libraries are
                  now obsolete, overly complex, or have large runtime overhead.
                  The ecosystem needs simpler solutions.
                </CalloutContent>
              </div>

              <div className={calloutStyles({ type: "tip" })}>
                <CalloutIcon>
                  <Sparkles size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>Syntactic sugar over CSS modules.</strong> Most
                  projects don't need runtime interpolation. They need a better
                  DX for writing and organizing CSS.
                </CalloutContent>
              </div>

              <div className={calloutStyles({ type: "warning" })}>
                <CalloutIcon>
                  <Shield size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>Supply chain security matters.</strong> Zero
                  dependencies means a minimal attack surface. No transitive
                  dependencies to audit or worry about.
                </CalloutContent>
              </div>

              <div className={calloutStyles({ type: "tip" })}>
                <CalloutIcon>
                  <Target size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>Intentionally simple.</strong> 95% native browser
                  foundation + 5% sprinkles on top. We leverage what browsers
                  already do well.
                </CalloutContent>
              </div>

              <div className={calloutStyles({ type: "note" })}>
                <CalloutIcon>
                  <PartyPopper size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>Built for fun.</strong> Sometimes the best projects
                  come from curiosity and the joy of building something useful.
                </CalloutContent>
              </div>
            </Section>

            {/* What We Don't Do */}
            <Section id="what-we-dont-do">
              <Breadcrumb>Getting Started</Breadcrumb>
              <SectionTitle>What We Don't Do</SectionTitle>
              <Paragraph>
                styled-static is intentionally limited. Here's what we don't
                support—and why:
              </Paragraph>

              <div className={calloutStyles({ type: "warning" })}>
                <CalloutIcon>
                  <Ban size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>No runtime interpolation.</strong> You can't write{" "}
                  <InlineCode>{`\${props => props.color}`}</InlineCode>. CSS is
                  extracted at build time, so values must be static. Use CSS
                  variables, data attributes, or the Variants API for dynamic
                  styles.
                </CalloutContent>
              </div>

              <div className={calloutStyles({ type: "note" })}>
                <CalloutIcon>
                  <Atom size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>React 19+ only.</strong> We rely on automatic ref
                  forwarding instead of <InlineCode>forwardRef</InlineCode>.
                  This keeps the runtime tiny but requires React 19.
                </CalloutContent>
              </div>

              <div className={calloutStyles({ type: "note" })}>
                <CalloutIcon>
                  <Zap size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>Vite only.</strong> The plugin uses Vite's built-in
                  AST parser and virtual module system. No Webpack, Rollup, or
                  other bundler support.
                </CalloutContent>
              </div>

              <div className={calloutStyles({ type: "tip" })}>
                <CalloutIcon>
                  <Lightbulb size={20} />
                </CalloutIcon>
                <CalloutContent>
                  <strong>Why these constraints?</strong> Each limitation
                  removes complexity. No runtime interpolation means no runtime
                  CSS parsing. React 19 means no forwardRef wrapper. Vite-only
                  means one excellent integration instead of many mediocre ones.
                </CalloutContent>
              </div>
            </Section>

            {/* Installation */}
            <Section id="installation">
              <Breadcrumb>Getting Started</Breadcrumb>
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
              <div className={calloutStyles({ type: "note" })}>
                <CalloutIcon>
                  <Info size={20} />
                </CalloutIcon>
                <CalloutContent>
                  The plugin must be placed <strong>before</strong> the React
                  plugin in the plugins array.
                </CalloutContent>
              </div>
            </Section>

            {/* ========================================== */}
            {/* API SECTION - Lazy loaded */}
            {/* ========================================== */}
            <Suspense
              fallback={<LoadingWrapper>Loading API docs...</LoadingWrapper>}
            >
              <ApiSection />
            </Suspense>

            {/* ========================================== */}
            {/* FEATURES SECTION - Lazy loaded */}
            {/* ========================================== */}
            <Suspense
              fallback={
                <LoadingWrapper>Loading Features docs...</LoadingWrapper>
              }
            >
              <FeaturesSection theme={theme} toggleTheme={toggleTheme} />
            </Suspense>
          </Content>
        </Main>
      </Layout>
    </>
  );
}
