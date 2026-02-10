import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  Atom,
  Ban,
  Code2,
  Github,
  Globe,
  HeartCrack,
  Info,
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
import { css, cx, cva } from "../styled-system/css";
import { getTheme, initTheme, onSystemThemeChange, setTheme } from "./theme";
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
const HowItWorksSection = lazy(() =>
  import("./sections/HowItWorksSection").then((m) => ({
    default: m.HowItWorksSection,
  }))
);

// =============================================================================
// Panda CSS styles
// =============================================================================

const layoutStyle = css({
  display: "flex",
  minHeight: "100vh",
  overflowX: "hidden",
});

const mobileHeaderStyle = css({
  display: "none",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: "var(--mobile-header-height)",
  background: "var(--color-bg)",
  borderBottom: "1px solid var(--color-border)",
  padding: "0 12px",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 150,
  transition: "background var(--transition), border-color var(--transition)",
  "@media (max-width: 767px)": {
    display: "flex",
  },
});

const burgerButtonStyle = css({
  background: "none",
  border: "none",
  padding: "8px",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  "& span": {
    display: "block",
    width: "20px",
    height: "2px",
    background: "var(--color-text)",
    borderRadius: "1px",
    transition: "background var(--transition)",
  },
});

const headerTitleStyle = css({
  fontWeight: 600,
  fontSize: "1rem",
  color: "var(--color-text)",
});

const overlayStyle = css({
  display: "none",
  "@media (max-width: 767px)": {
    display: "block",
    position: "fixed",
    inset: "var(--mobile-header-height) 0 0 0",
    background: "rgba(0, 0, 0, 0.5)",
    opacity: 0,
    pointerEvents: "none",
    transition: "opacity 0.2s ease",
    zIndex: 99,
    '&[data-visible="true"]': {
      opacity: 1,
      pointerEvents: "auto",
    },
  },
});

const sidebarStyle = css({
  position: "fixed",
  top: 0,
  left: 0,
  width: "var(--sidebar-width)",
  height: "100vh",
  background: "var(--color-bg-sidebar)",
  borderRight: "1px solid var(--color-border)",
  display: "flex",
  flexDirection: "column",
  zIndex: 100,
  transition: "background var(--transition), border-color var(--transition)",
  _light: {
    boxShadow: "1px 0 3px rgba(0, 0, 0, 0.02)",
  },
  "@media (max-width: 767px)": {
    top: "var(--mobile-header-height)",
    height: "calc(100vh - var(--mobile-header-height))",
    transform: "translateX(-100%)",
    transition: "background var(--transition), border-color var(--transition), transform 0.2s ease",
    '&[data-open="true"]': {
      transform: "translateX(0)",
    },
  },
});

const sidebarHeaderStyle = css({
  padding: "1rem 1.25rem",
  borderBottom: "1px solid var(--color-border)",
});

const logoStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "var(--color-text)",
  textDecoration: "none",
  "&:hover": {
    color: "var(--color-primary)",
  },
});

const searchInputStyle = css({
  position: "relative",
  marginTop: "1rem",
});

const searchIconStyle = css({
  position: "absolute",
  left: "0.75rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: "var(--color-text-secondary)",
  pointerEvents: "none",
});

const searchFieldStyle = css({
  width: "100%",
  padding: "0.5rem 0.75rem 0.5rem 2.25rem",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  color: "var(--color-text)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
  outline: "none",
  transition: "border-color var(--transition), background var(--transition)",
  "&::placeholder": {
    color: "var(--color-text-secondary)",
  },
  "&:focus": {
    borderColor: "var(--color-primary)",
  },
});

const searchHintStyle = css({
  position: "absolute",
  right: "0.75rem",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "0.75rem",
  color: "var(--color-text-secondary)",
  background: "var(--color-bg-sidebar)",
  padding: "0.125rem 0.375rem",
  borderRadius: "4px",
  border: "1px solid var(--color-border)",
  pointerEvents: "none",
});

const navSectionStyle = css({
  flex: 1,
  overflowY: "auto",
  padding: "1rem 0",
});

const navGroupStyle = css({
  padding: "0 0.75rem",
  marginBottom: "1rem",
});

const navGroupTitleStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 0.5rem 0.375rem",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginTop: "0.25rem",
});

const activeNavItemStyle = css({
  background: "var(--color-nav-active)",
  color: "var(--color-primary)",
  fontWeight: 500,
  borderLeft: "2px solid var(--color-primary)",
  paddingLeft: "calc(0.75rem - 2px)",
});

const navItemStyle = css({
  display: "block",
  padding: "0.4375rem 0.75rem",
  margin: "0.0625rem 0",
  fontSize: "0.875rem",
  color: "var(--color-text-secondary)",
  textDecoration: "none",
  borderRadius: "6px",
  borderLeft: "2px solid transparent",
  transition: "all var(--transition)",
  "&:hover": {
    color: "var(--color-text)",
    background: "var(--color-border-subtle)",
  },
});

const sidebarFooterStyle = css({
  padding: "1rem",
  borderTop: "1px solid var(--color-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const themeToggleStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  padding: 0,
  fontFamily: "inherit",
  color: "var(--color-text-secondary)",
  background: "transparent",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
  cursor: "pointer",
  transition: "all var(--transition)",
  "&:hover": {
    background: "var(--color-border-subtle)",
    color: "var(--color-text)",
    borderColor: "var(--color-text-secondary)",
  },
});

const iconLinkStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  padding: 0,
  color: "var(--color-text-secondary)",
  background: "transparent",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
  cursor: "pointer",
  transition: "all var(--transition)",
  textDecoration: "none",
  "&:hover": {
    background: "var(--color-border-subtle)",
    color: "var(--color-text)",
    borderColor: "var(--color-text-secondary)",
  },
});

const mainStyle = css({
  flex: 1,
  marginLeft: "var(--sidebar-width)",
  minHeight: "100vh",
  minWidth: 0,
  "@media (max-width: 767px)": {
    marginLeft: 0,
    marginTop: "var(--mobile-header-height)",
  },
});

const contentStyle = css({
  maxWidth: "var(--content-max-width)",
  margin: "0 auto",
  padding: "3rem 2rem 6rem",
  "@media (max-width: 767px)": {
    maxWidth: "100%",
    padding: "2rem 12px 4rem",
  },
});

// =============================================================================
// Typography - Inline for Getting Started
// =============================================================================

const pageTitleStyle = css({
  fontSize: "2.5rem",
  fontWeight: 700,
  margin: "0 0 1rem",
  letterSpacing: "-0.02em",
  "@media (max-width: 767px)": {
    fontSize: "1.75rem",
  },
});

const pageSubtitleStyle = css({
  fontSize: "1.125rem",
  color: "var(--color-text-secondary)",
  margin: "0 0 1.5rem",
  lineHeight: 1.6,
});

const heroBannerStyle = css({
  height: "140px",
  margin: "0 0 3rem",
  background: "linear-gradient(135deg, #0a0a0a 0%, #0f1f12 50%, #0a1a0d 100%)",
  borderRadius: "var(--radius-lg)",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, transparent 40%, rgba(16, 185, 129, 0.08) 40%, rgba(16, 185, 129, 0.08) 60%, transparent 60%), linear-gradient(225deg, transparent 30%, rgba(16, 185, 129, 0.05) 30%, rgba(16, 185, 129, 0.05) 50%, transparent 50%)",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    top: "20%",
    right: "10%",
    width: "200px",
    height: "200px",
    background: "linear-gradient(45deg, transparent 45%, rgba(16, 185, 129, 0.12) 45%, rgba(16, 185, 129, 0.12) 55%, transparent 55%)",
    transform: "rotate(15deg)",
  },
  "@media (max-width: 767px)": {
    height: "100px",
    margin: "0 0 2rem",
    borderRadius: "var(--radius)",
  },
});

const sectionStyle = css({
  marginBottom: "4rem",
  scrollMarginTop: "calc(var(--header-height) + 2rem)",
  "@media (max-width: 767px)": {
    marginBottom: "3rem",
    scrollMarginTop: "calc(var(--mobile-header-height) + 1rem)",
  },
});

const breadcrumbStyle = css({
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "var(--color-primary)",
  marginBottom: "0.5rem",
});

const sectionTitleStyle = css({
  fontSize: "1.625rem",
  fontWeight: 600,
  margin: "0 0 1.25rem",
  letterSpacing: "-0.02em",
  "@media (max-width: 767px)": {
    fontSize: "1.375rem",
  },
});

const paragraphStyle = css({
  margin: "0 0 1rem",
  color: "var(--color-text)",
});

const inlineCodeStyle = css({
  padding: "0.2rem 0.4rem",
  fontSize: "0.875em",
  fontFamily: '"Fira Code", "Monaco", monospace',
  background: "var(--color-border)",
  borderRadius: "4px",
});

// =============================================================================
// Callout (inline for Getting Started)
// =============================================================================

const calloutVariants = cva({
  base: {
    display: "flex",
    gap: "0.875rem",
    padding: "1.125rem 1.25rem",
    margin: "1.5rem 0",
    borderRadius: "var(--radius)",
    fontSize: "0.9375rem",
    lineHeight: 1.6,
  },
  variants: {
    type: {
      note: {
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        _dark: {
          background: "#1e3a5f",
          borderColor: "#2563eb40",
        },
      },
      tip: {
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        _dark: {
          background: "#0c2915",
          borderColor: "#10b98140",
        },
      },
      warning: {
        background: "#fffbeb",
        border: "1px solid #fde68a",
        _dark: {
          background: "#3d2e0a",
          borderColor: "#d9790640",
        },
      },
    },
  },
});

const calloutIconStyle = css({
  fontSize: "1.25rem",
  flexShrink: 0,
});

const calloutContentStyle = css({
  flex: 1,
});

// =============================================================================
// Loading Spinner
// =============================================================================

const loadingWrapperStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4rem 2rem",
  color: "var(--color-text-secondary)",
});

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
    id: "polymorphism",
    title: "Polymorphism",
    group: "Features",
    keywords: ["as", "polymorphic", "element", "render", "withComponent", "className"],
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
  {
    id: "how-it-works",
    title: "Overview",
    group: "Internals",
    keywords: ["how", "works", "build", "compile", "transform"],
  },
  {
    id: "transformation",
    title: "Build-Time Transformation",
    group: "Internals",
    keywords: ["transform", "ast", "vite", "plugin", "compile"],
  },
  {
    id: "virtual-css",
    title: "Virtual CSS Modules",
    group: "Internals",
    keywords: ["virtual", "css", "modules", "import", "extract"],
  },
  {
    id: "runtime",
    title: "Runtime Wrappers",
    group: "Internals",
    keywords: ["runtime", "wrapper", "component", "size"],
  },
  {
    id: "comparison",
    title: "Library Comparison",
    group: "Internals",
    keywords: ["comparison", "bundle", "size", "emotion", "linaria", "panda", "css-in-js", "alternatives"],
  },
];

// =============================================================================
// Main App
// =============================================================================

export function App() {
  const [theme, setThemeState] = useState<string>(() => {
    return initTheme();
  });
  const [activeSection, setActiveSection] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme toggle
  const toggleTheme = () => {
    const current = getTheme();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  // Subscribe to system theme changes
  useEffect(() => {
    return onSystemThemeChange((prefersDark) => {
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

    const observeSections = () => {
      sections.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el && !observedElements.has(el)) {
          intersectionObserver.observe(el);
          observedElements.add(el);
        }
      });
    };

    observeSections();

    const mutationObserver = new MutationObserver(() => {
      observeSections();
    });

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
    <div className={layoutStyle}>
      <header className={mobileHeaderStyle}>
        <span className={headerTitleStyle}>styled-static</span>
        <button
          className={burgerButtonStyle}
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
        </button>
      </header>
      <div className={overlayStyle} data-visible={sidebarOpen} onClick={closeSidebar} />
      <aside className={sidebarStyle} data-open={sidebarOpen}>
        <div className={sidebarHeaderStyle}>
          <a href="#" className={logoStyle}>
            <Palette size={24} />
            styled-static
          </a>
          <div className={searchInputStyle}>
            <span className={searchIconStyle}>
              <Search size={16} />
            </span>
            <input
              ref={searchInputRef}
              className={searchFieldStyle}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={searchHintStyle}>&#x2318;K</span>
          </div>
        </div>

        <nav className={navSectionStyle}>
          {Object.entries(groupedSections).map(([group, items]) => (
            <div key={group} className={navGroupStyle}>
              <div className={navGroupTitleStyle}>
                {group === "Getting Started" && <Rocket size={12} />}
                {group === "API" && <Code2 size={12} />}
                {group === "Features" && <Sparkles size={12} />}
                {group}
              </div>
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cx(navItemStyle, activeSection === item.id && activeNavItemStyle)}
                  onClick={() => {
                    setSearchQuery("");
                    closeSidebar();
                  }}
                >
                  {item.title}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className={sidebarFooterStyle}>
          <button className={themeToggleStyle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <a
            href="https://github.com/alexradulescu/styled-static"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className={iconLinkStyle}
          >
            <Github size={18} />
          </a>
        </div>
      </aside>

      <main className={mainStyle}>
        <div className={contentStyle}>
          {/* Hero */}
          <h1 className={pageTitleStyle}>styled-static</h1>
          <p className={pageSubtitleStyle}>
            Near-zero-runtime CSS-in-JS for React 19+ with Vite. Write
            styled-components syntax, get static CSS extracted at build time.
          </p>
          <div className={heroBannerStyle} />

          {/* ========================================== */}
          {/* GETTING STARTED - Inline (not lazy loaded) */}
          {/* ========================================== */}

          {/* Quick Overview */}
          <section id="quick-overview" className={sectionStyle}>
            <span className={breadcrumbStyle}>Getting Started</span>
            <h2 className={sectionTitleStyle}>Quick Overview</h2>
            <p className={paragraphStyle}>
              All the APIs you need at a glance. styled-static provides 10
              core functions that cover most CSS-in-JS use cases:
            </p>
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

// Type-safe component variants
const Btn = styledVariants({
  component: 'button',
  css: css\`padding: 0.5rem;\`,
  variants: { size: { sm: css\`font-size: 0.875rem;\` } }
});

// Type-safe class variants
const badge = cssVariants({
  css: css\`padding: 0.25rem;\`,
  variants: { color: { blue: css\`background: #e0f2fe;\` } }
});
<span className={badge({ color: 'blue' })}>Info</span>

// Combine classes conditionally
<div className={cx('base', isActive && activeClass)} />

// Default attributes
const Input = styled.input.attrs({ type: 'password' })\`padding: 0.5rem;\`;

// Polymorphism
const LinkButton = withComponent(Link, Button);`}</CodeBlock>
          </section>

          {/* Why styled-static? */}
          <section id="why" className={sectionStyle}>
            <span className={breadcrumbStyle}>Getting Started</span>
            <h2 className={sectionTitleStyle}>Why styled-static?</h2>

            <div className={calloutVariants({ type: "tip" })}>
              <span className={calloutIconStyle}>
                <Globe size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>CSS evolved.</strong> Native nesting, CSS variables,
                container queries—the gap between CSS and CSS-in-JS is smaller
                than ever.
              </div>
            </div>

            <div className={calloutVariants({ type: "note" })}>
              <span className={calloutIconStyle}>
                <HeartCrack size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>CSS-in-JS fatigue.</strong> Most libraries are
                obsolete, complex, or have large runtime overhead.
              </div>
            </div>

            <div className={calloutVariants({ type: "tip" })}>
              <span className={calloutIconStyle}>
                <Sparkles size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>Syntactic sugar over CSS modules.</strong> Better DX
                for writing CSS, without runtime interpolation.
              </div>
            </div>

            <div className={calloutVariants({ type: "warning" })}>
              <span className={calloutIconStyle}>
                <Shield size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>Zero dependencies.</strong> Minimal attack surface.
                Nothing to audit.
              </div>
            </div>

            <div className={calloutVariants({ type: "tip" })}>
              <span className={calloutIconStyle}>
                <Target size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>Intentionally simple.</strong> 95% native browser + 5%
                sprinkles.
              </div>
            </div>

            <div className={calloutVariants({ type: "note" })}>
              <span className={calloutIconStyle}>
                <PartyPopper size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>Built for fun.</strong> Curiosity-driven, useful code.
              </div>
            </div>
          </section>

          {/* What We Don't Do */}
          <section id="what-we-dont-do" className={sectionStyle}>
            <span className={breadcrumbStyle}>Getting Started</span>
            <h2 className={sectionTitleStyle}>What We Don't Do</h2>

            <div className={calloutVariants({ type: "warning" })}>
              <span className={calloutIconStyle}>
                <Ban size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>No runtime interpolation</strong> — Can't write{" "}
                <code className={inlineCodeStyle}>{`\${props => props.color}`}</code>. Use
                variants, CSS variables, or data attributes.
              </div>
            </div>

            <div className={calloutVariants({ type: "note" })}>
              <span className={calloutIconStyle}>
                <Atom size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>React 19+ only</strong> — Uses automatic ref
                forwarding (no <code className={inlineCodeStyle}>forwardRef</code>).
              </div>
            </div>

            <div className={calloutVariants({ type: "note" })}>
              <span className={calloutIconStyle}>
                <Zap size={20} />
              </span>
              <div className={calloutContentStyle}>
                <strong>Vite only</strong> — Uses Vite's AST parser and
                virtual modules. No Webpack/Rollup.
              </div>
            </div>

            <p className={paragraphStyle} style={{ marginTop: "1rem", color: "var(--color-text-secondary)" }}>
              Each constraint removes complexity—no CSS parsing, no
              forwardRef, one great integration.
            </p>
          </section>

          {/* Installation */}
          <section id="installation" className={sectionStyle}>
            <span className={breadcrumbStyle}>Getting Started</span>
            <h2 className={sectionTitleStyle}>Installation</h2>
            <p className={paragraphStyle}>
              Install the package with your preferred package manager:
            </p>
            <CodeBlock filename="terminal">{`npm install styled-static
# or
bun add styled-static`}</CodeBlock>
            <p className={paragraphStyle}>Configure the Vite plugin:</p>
            <CodeBlock filename="vite.config.ts">{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { styledStatic } from 'styled-static/vite';

export default defineConfig({
  plugins: [styledStatic(), react()],
});`}</CodeBlock>
            <div className={calloutVariants({ type: "note" })}>
              <span className={calloutIconStyle}>
                <Info size={20} />
              </span>
              <div className={calloutContentStyle}>
                The plugin must be placed <strong>before</strong> the React
                plugin in the plugins array.
              </div>
            </div>

            <p className={paragraphStyle} style={{ marginTop: "1.5rem" }}>
              <strong>Optional: Lightning CSS</strong> for autoprefixing and
              faster CSS processing:
            </p>
            <CodeBlock filename="terminal">{`npm install lightningcss`}</CodeBlock>
            <CodeBlock filename="vite.config.ts">{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { styledStatic } from 'styled-static/vite';

export default defineConfig({
  css: { transformer: 'lightningcss' },
  plugins: [styledStatic(), react()],
});`}</CodeBlock>
            <div className={calloutVariants({ type: "tip" })}>
              <span className={calloutIconStyle}>
                <Zap size={20} />
              </span>
              <div className={calloutContentStyle}>
                Lightning CSS provides automatic vendor prefixes, better
                minification, and faster builds than PostCSS.
              </div>
            </div>
          </section>

          {/* ========================================== */}
          {/* API SECTION - Lazy loaded */}
          {/* ========================================== */}
          <Suspense
            fallback={<div className={loadingWrapperStyle}>Loading API docs...</div>}
          >
            <ApiSection />
          </Suspense>

          {/* ========================================== */}
          {/* FEATURES SECTION - Lazy loaded */}
          {/* ========================================== */}
          <Suspense
            fallback={
              <div className={loadingWrapperStyle}>Loading Features docs...</div>
            }
          >
            <FeaturesSection theme={theme} toggleTheme={toggleTheme} />
          </Suspense>

          {/* ========================================== */}
          {/* HOW IT WORKS SECTION - Lazy loaded */}
          {/* ========================================== */}
          <Suspense
            fallback={
              <div className={loadingWrapperStyle}>Loading How It Works docs...</div>
            }
          >
            <HowItWorksSection />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
