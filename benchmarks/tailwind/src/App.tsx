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
import clsx from "clsx";
import { tv } from "tailwind-variants";
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
// Layout Components
// =============================================================================

function Layout({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx("flex min-h-screen overflow-x-hidden", className)}
      {...props}
    />
  );
}

function MobileHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      className={clsx(
        "hidden fixed top-0 left-0 right-0 h-[var(--mobile-header-height)]",
        "bg-[var(--color-bg)] border-b border-[var(--color-border)]",
        "px-3 items-center justify-between z-[150]",
        "transition-[background,border-color] duration-150 ease-linear",
        "max-[767px]:flex",
        className
      )}
      {...props}
    />
  );
}

function BurgerButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "bg-transparent border-none p-2 cursor-pointer flex flex-col gap-[5px]",
        className
      )}
      {...props}
    >
      <span className="block w-5 h-0.5 bg-[var(--color-text)] rounded-sm transition-[background] duration-150" />
      <span className="block w-5 h-0.5 bg-[var(--color-text)] rounded-sm transition-[background] duration-150" />
    </button>
  );
}

function HeaderTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={clsx("font-semibold text-base text-[var(--color-text)]", className)}
      {...props}
    />
  );
}

function Overlay({
  className,
  ...props
}: React.ComponentProps<"div"> & { "data-visible"?: boolean }) {
  const isVisible = props["data-visible"];
  return (
    <div
      className={clsx(
        "hidden",
        "max-[767px]:block max-[767px]:fixed max-[767px]:inset-[var(--mobile-header-height)_0_0_0]",
        "max-[767px]:bg-black/50 max-[767px]:transition-opacity max-[767px]:duration-200 max-[767px]:z-[99]",
        isVisible
          ? "max-[767px]:opacity-100 max-[767px]:pointer-events-auto"
          : "max-[767px]:opacity-0 max-[767px]:pointer-events-none",
        className
      )}
      {...props}
    />
  );
}

function Sidebar({
  className,
  ...props
}: React.ComponentProps<"aside"> & { "data-open"?: boolean }) {
  const isOpen = props["data-open"];
  return (
    <aside
      className={clsx(
        "sidebar-light-shadow",
        "fixed top-0 left-0 w-[var(--sidebar-width)] h-screen",
        "bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border)]",
        "flex flex-col z-[100]",
        "transition-[background,border-color] duration-150 ease-linear",
        "max-[767px]:top-[var(--mobile-header-height)] max-[767px]:h-[calc(100vh-var(--mobile-header-height))]",
        "max-[767px]:transition-[background,border-color,transform] max-[767px]:duration-200",
        isOpen
          ? "max-[767px]:translate-x-0"
          : "max-[767px]:-translate-x-full",
        className
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "px-5 py-4 border-b border-[var(--color-border)]",
        className
      )}
      {...props}
    />
  );
}

function Logo({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      className={clsx(
        "flex items-center gap-2 text-xl font-bold text-[var(--color-text)] no-underline",
        "hover:text-[var(--color-primary)]",
        className
      )}
      {...props}
    />
  );
}

function SearchInputWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("relative mt-4", className)} {...props} />;
}

function SearchIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={clsx(
        "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none",
        className
      )}
      {...props}
    />
  );
}

function SearchField({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={clsx(
        "w-full py-2 pr-3 pl-9 text-sm font-[inherit]",
        "text-[var(--color-text)] bg-[var(--color-bg)]",
        "border border-[var(--color-border)] rounded-[var(--radius)] outline-none",
        "transition-[border-color,background] duration-150",
        "placeholder:text-[var(--color-text-secondary)]",
        "focus:border-[var(--color-primary)]",
        className
      )}
      {...props}
    />
  );
}

function SearchHint({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={clsx(
        "absolute right-3 top-1/2 -translate-y-1/2",
        "text-xs text-[var(--color-text-secondary)]",
        "bg-[var(--color-bg-sidebar)] px-1.5 py-0.5 rounded border border-[var(--color-border)]",
        "pointer-events-none",
        className
      )}
      {...props}
    />
  );
}

function NavSection({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      className={clsx("flex-1 overflow-y-auto py-4", className)}
      {...props}
    />
  );
}

function NavGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={clsx("px-3 mb-4", className)} {...props} />
  );
}

function NavGroupTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-2 pt-2 pb-1.5",
        "text-[0.6875rem] font-semibold text-[var(--color-text-muted)]",
        "uppercase tracking-[0.06em] mt-1",
        className
      )}
      {...props}
    />
  );
}

const activeNavItemClass = clsx(
  "!bg-[var(--color-nav-active)] !text-[var(--color-primary)] !font-medium",
  "!border-l-2 !border-l-[var(--color-primary)] !pl-[calc(0.75rem-2px)]"
);

function NavItem({
  className,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      className={clsx(
        "block py-[0.4375rem] px-3 my-px text-sm text-[var(--color-text-secondary)]",
        "no-underline rounded-md border-l-2 border-transparent",
        "transition-all duration-150",
        "hover:text-[var(--color-text)] hover:bg-[var(--color-border-subtle)]",
        className
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "p-4 border-t border-[var(--color-border)] flex items-center justify-between",
        className
      )}
      {...props}
    />
  );
}

function ThemeToggle({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "flex items-center justify-center w-9 h-9 p-0 font-[inherit]",
        "text-[var(--color-text-secondary)] bg-transparent",
        "border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer",
        "transition-all duration-150",
        "hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-text)] hover:border-[var(--color-text-secondary)]",
        className
      )}
      {...props}
    />
  );
}

function IconLink({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      className={clsx(
        "flex items-center justify-center w-9 h-9 p-0",
        "text-[var(--color-text-secondary)] bg-transparent",
        "border border-[var(--color-border)] rounded-[var(--radius)] cursor-pointer",
        "transition-all duration-150 no-underline",
        "hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-text)] hover:border-[var(--color-text-secondary)]",
        className
      )}
      {...props}
    />
  );
}

function Main({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={clsx(
        "flex-1 ml-[var(--sidebar-width)] min-h-screen min-w-0",
        "max-[767px]:ml-0 max-[767px]:mt-[var(--mobile-header-height)]",
        className
      )}
      {...props}
    />
  );
}

function Content({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "max-w-[var(--content-max-width)] mx-auto px-8 pt-12 pb-24",
        "max-[767px]:max-w-full max-[767px]:px-3 max-[767px]:pt-8 max-[767px]:pb-16",
        className
      )}
      {...props}
    />
  );
}

// =============================================================================
// Typography - Inline for Getting Started
// =============================================================================

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={clsx(
        "text-[2.5rem] font-bold mb-4 tracking-[-0.02em] mt-0",
        "max-[767px]:text-[1.75rem]",
        className
      )}
      {...props}
    />
  );
}

function PageSubtitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={clsx(
        "text-lg text-[var(--color-text-secondary)] mb-6 leading-[1.6] mt-0",
        className
      )}
      {...props}
    />
  );
}

function HeroBanner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "hero-banner",
        "h-[140px] mb-12 rounded-[var(--radius-lg)] relative overflow-hidden",
        "bg-gradient-to-br from-[#0a0a0a] via-[#0f1f12] to-[#0a1a0d]",
        "max-[767px]:h-[100px] max-[767px]:mb-8 max-[767px]:rounded-[var(--radius)]",
        className
      )}
      {...props}
    />
  );
}

function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={clsx(
        "mb-16 scroll-mt-[calc(var(--header-height)+2rem)]",
        "max-[767px]:mb-12 max-[767px]:scroll-mt-[calc(var(--mobile-header-height)+1rem)]",
        className
      )}
      {...props}
    />
  );
}

function Breadcrumb({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={clsx(
        "block text-[0.8125rem] font-medium text-[var(--color-primary)] mb-2",
        className
      )}
      {...props}
    />
  );
}

function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={clsx(
        "text-[1.625rem] font-semibold mb-5 tracking-[-0.02em] mt-0",
        "max-[767px]:text-[1.375rem]",
        className
      )}
      {...props}
    />
  );
}

function Paragraph({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={clsx("mb-4 mt-0 text-[var(--color-text)]", className)}
      {...props}
    />
  );
}

function InlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      className={clsx(
        "px-1.5 py-0.5 text-[0.875em] font-[Fira_Code,Monaco,monospace]",
        "bg-[var(--color-border)] rounded",
        className
      )}
      {...props}
    />
  );
}

// =============================================================================
// Callout (inline for Getting Started)
// =============================================================================

const callout = tv({
  base: "flex gap-3.5 px-5 py-[1.125rem] my-6 rounded-[var(--radius)] text-[0.9375rem] leading-[1.6]",
  variants: {
    type: {
      note: "bg-[#eff6ff] border border-[#bfdbfe] dark:bg-[#1e3a5f] dark:border-[#2563eb40]",
      tip: "bg-[#f0fdf4] border border-[#bbf7d0] dark:bg-[#0c2915] dark:border-[#10b98140]",
      warning: "bg-[#fffbeb] border border-[#fde68a] dark:bg-[#3d2e0a] dark:border-[#d9790640]",
    },
  },
});

function CalloutIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={clsx("text-xl shrink-0", className)}
      {...props}
    />
  );
}

function CalloutContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("flex-1", className)} {...props} />;
}

// =============================================================================
// Loading Spinner
// =============================================================================

function LoadingWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center px-8 py-16 text-[var(--color-text-secondary)]",
        className
      )}
      {...props}
    />
  );
}

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
    <Layout>
      <MobileHeader>
        <HeaderTitle>styled-static</HeaderTitle>
        <BurgerButton
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle menu"
        />
      </MobileHeader>
      <Overlay data-visible={sidebarOpen} onClick={closeSidebar} />
      <Sidebar data-open={sidebarOpen}>
        <SidebarHeader>
          <Logo href="#">
            <Palette size={24} />
            styled-static
          </Logo>
          <SearchInputWrapper>
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
          </SearchInputWrapper>
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
                  className={activeSection === item.id ? activeNavItemClass : ""}
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
            Near-zero-runtime CSS-in-JS for React 19+ with Vite. Write
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
              All the APIs you need at a glance. styled-static provides 10
              core functions that cover most CSS-in-JS use cases:
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
          </Section>

          {/* Why styled-static? */}
          <Section id="why">
            <Breadcrumb>Getting Started</Breadcrumb>
            <SectionTitle>Why styled-static?</SectionTitle>

            <div className={callout({ type: "tip" })}>
              <CalloutIcon>
                <Globe size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>CSS evolved.</strong> Native nesting, CSS variables,
                container queries—the gap between CSS and CSS-in-JS is smaller
                than ever.
              </CalloutContent>
            </div>

            <div className={callout({ type: "note" })}>
              <CalloutIcon>
                <HeartCrack size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>CSS-in-JS fatigue.</strong> Most libraries are
                obsolete, complex, or have large runtime overhead.
              </CalloutContent>
            </div>

            <div className={callout({ type: "tip" })}>
              <CalloutIcon>
                <Sparkles size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>Syntactic sugar over CSS modules.</strong> Better DX
                for writing CSS, without runtime interpolation.
              </CalloutContent>
            </div>

            <div className={callout({ type: "warning" })}>
              <CalloutIcon>
                <Shield size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>Zero dependencies.</strong> Minimal attack surface.
                Nothing to audit.
              </CalloutContent>
            </div>

            <div className={callout({ type: "tip" })}>
              <CalloutIcon>
                <Target size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>Intentionally simple.</strong> 95% native browser + 5%
                sprinkles.
              </CalloutContent>
            </div>

            <div className={callout({ type: "note" })}>
              <CalloutIcon>
                <PartyPopper size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>Built for fun.</strong> Curiosity-driven, useful code.
              </CalloutContent>
            </div>
          </Section>

          {/* What We Don't Do */}
          <Section id="what-we-dont-do">
            <Breadcrumb>Getting Started</Breadcrumb>
            <SectionTitle>What We Don't Do</SectionTitle>

            <div className={callout({ type: "warning" })}>
              <CalloutIcon>
                <Ban size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>No runtime interpolation</strong> — Can't write{" "}
                <InlineCode>{`\${props => props.color}`}</InlineCode>. Use
                variants, CSS variables, or data attributes.
              </CalloutContent>
            </div>

            <div className={callout({ type: "note" })}>
              <CalloutIcon>
                <Atom size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>React 19+ only</strong> — Uses automatic ref
                forwarding (no <InlineCode>forwardRef</InlineCode>).
              </CalloutContent>
            </div>

            <div className={callout({ type: "note" })}>
              <CalloutIcon>
                <Zap size={20} />
              </CalloutIcon>
              <CalloutContent>
                <strong>Vite only</strong> — Uses Vite's AST parser and
                virtual modules. No Webpack/Rollup.
              </CalloutContent>
            </div>

            <Paragraph style={{ marginTop: "1rem", color: "var(--color-text-secondary)" }}>
              Each constraint removes complexity—no CSS parsing, no
              forwardRef, one great integration.
            </Paragraph>
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
            <div className={callout({ type: "note" })}>
              <CalloutIcon>
                <Info size={20} />
              </CalloutIcon>
              <CalloutContent>
                The plugin must be placed <strong>before</strong> the React
                plugin in the plugins array.
              </CalloutContent>
            </div>

            <Paragraph style={{ marginTop: "1.5rem" }}>
              <strong>Optional: Lightning CSS</strong> for autoprefixing and
              faster CSS processing:
            </Paragraph>
            <CodeBlock filename="terminal">{`npm install lightningcss`}</CodeBlock>
            <CodeBlock filename="vite.config.ts">{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { styledStatic } from 'styled-static/vite';

export default defineConfig({
  css: { transformer: 'lightningcss' },
  plugins: [styledStatic(), react()],
});`}</CodeBlock>
            <div className={callout({ type: "tip" })}>
              <CalloutIcon>
                <Zap size={20} />
              </CalloutIcon>
              <CalloutContent>
                Lightning CSS provides automatic vendor prefixes, better
                minification, and faster builds than PostCSS.
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

          {/* ========================================== */}
          {/* HOW IT WORKS SECTION - Lazy loaded */}
          {/* ========================================== */}
          <Suspense
            fallback={
              <LoadingWrapper>Loading How It Works docs...</LoadingWrapper>
            }
          >
            <HowItWorksSection />
          </Suspense>
        </Content>
      </Main>
    </Layout>
  );
}
