/**
 * Shared components and utilities for documentation sections.
 * These are used by the lazy-loaded API and Features sections.
 */
import { type ReactNode, useState } from "react";
import { AlertTriangle, Check, Copy, Info, Lightbulb } from "lucide-react";
import { css, cx, cva } from "../../styled-system/css";
import { highlight } from "sugar-high";

// =============================================================================
// Typography Components
// =============================================================================

const sectionStyle = css({
  marginBottom: "4rem",
  scrollMarginTop: "calc(var(--header-height) + 2rem)",
  "@media (max-width: 767px)": {
    marginBottom: "3rem",
    scrollMarginTop: "calc(var(--mobile-header-height) + 1rem)",
  },
});

export function Section({ id, children, className, ...props }: React.ComponentProps<"section">) {
  return (
    <section id={id} className={cx(sectionStyle, className)} {...props}>
      {children}
    </section>
  );
}

const breadcrumbStyle = css({
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "var(--color-primary)",
  marginBottom: "0.5rem",
});

export function Breadcrumb({ children, className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cx(breadcrumbStyle, className)} {...props}>
      {children}
    </span>
  );
}

const sectionTitleStyle = css({
  fontSize: "1.625rem",
  fontWeight: 600,
  margin: "0 0 1.25rem",
  letterSpacing: "-0.02em",
  "@media (max-width: 767px)": {
    fontSize: "1.375rem",
  },
});

export function SectionTitle({ children, className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cx(sectionTitleStyle, className)} {...props}>
      {children}
    </h2>
  );
}

const subsectionTitleStyle = css({
  fontSize: "1.125rem",
  fontWeight: 600,
  margin: "2rem 0 1rem",
  color: "var(--color-text)",
});

export function SubsectionTitle({ children, className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={cx(subsectionTitleStyle, className)} {...props}>
      {children}
    </h3>
  );
}

const paragraphStyle = css({
  margin: "0 0 1rem",
  color: "var(--color-text)",
});

export function Paragraph({ children, className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cx(paragraphStyle, className)} {...props}>
      {children}
    </p>
  );
}

const inlineCodeStyle = css({
  padding: "0.2rem 0.4rem",
  fontSize: "0.875em",
  fontFamily: '"Fira Code", "Monaco", monospace',
  background: "var(--color-border)",
  borderRadius: "4px",
});

export function InlineCode({ children, className, ...props }: React.ComponentProps<"code">) {
  return (
    <code className={cx(inlineCodeStyle, className)} {...props}>
      {children}
    </code>
  );
}

// =============================================================================
// Demo Components
// =============================================================================

const demoAreaStyle = css({
  padding: "1.5rem",
  margin: "1.5rem 0",
  background: "var(--color-bg-sidebar)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
  maxWidth: "100%",
  overflowX: "auto",
  "@media (max-width: 767px)": {
    padding: "1rem",
    margin: "1rem 0",
  },
});

export function DemoArea({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cx(demoAreaStyle, className)} {...props}>
      {children}
    </div>
  );
}

const demoLabelStyle = css({
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "1rem",
});

export function DemoLabel({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cx(demoLabelStyle, className)} {...props}>
      {children}
    </div>
  );
}

const buttonGroupStyle = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
});

export function ButtonGroup({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cx(buttonGroupStyle, className)} {...props}>
      {children}
    </div>
  );
}

// Demo button using cva variants
const button = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    fontFamily: "inherit",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:focus": {
      outline: "none",
      boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.3)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  variants: {
    variant: {
      primary: {
        background: "var(--color-primary)",
        color: "white",
        "&:hover:not(:disabled)": {
          background: "var(--color-primary-hover)",
        },
      },
      secondary: {
        background: "var(--color-border)",
        color: "var(--color-text)",
        "&:hover:not(:disabled)": {
          background: "var(--color-text-secondary)",
          color: "white",
        },
      },
      ghost: {
        background: "transparent",
        color: "var(--color-text-secondary)",
        "&:hover:not(:disabled)": {
          background: "var(--color-border)",
          color: "var(--color-text)",
        },
      },
    },
    size: {
      sm: {
        padding: "0.375rem 0.75rem",
        fontSize: "0.8125rem",
      },
      md: {
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
      },
      lg: {
        padding: "0.75rem 1.5rem",
        fontSize: "1rem",
      },
    },
  },
});

export function Button({
  variant,
  size,
  className,
  ...props
}: {
  variant: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
} & React.ComponentProps<"button">) {
  return <button className={cx(button({ variant, size }), className)} {...props} />;
}

// Example styled components for demos
const styledButtonStyle = css({
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  background: "var(--color-primary)",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  "&:hover": {
    background: "var(--color-primary-hover)",
  },
});

function StyledButtonBase({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cx(styledButtonStyle, className)} {...props} />;
}

export const StyledButton = Object.assign(StyledButtonBase, {
  className: styledButtonStyle,
});

const extendedButtonStyle = css({
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

export function ExtendedButton({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cx(styledButtonStyle, extendedButtonStyle, className)} {...props} />;
}

export const highlightClass = css({
  boxShadow: "0 0 0 3px var(--color-primary)",
});

const counterStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  fontSize: "1.5rem",
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums",
});

export function Counter({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cx(counterStyle, className)} {...props}>
      {children}
    </div>
  );
}

// Keyframes demo components live in a separate file
export { Spinner, PulsingDot } from "./keyframes-demo";

// =============================================================================
// Attrs Demo Components
// =============================================================================

const passwordInputStyle = css({
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  border: "1px solid var(--color-border)",
  borderRadius: "6px",
  background: "var(--color-bg)",
  color: "var(--color-text)",
  outline: "none",
  width: "100%",
  transition: "border-color var(--transition)",
  "&:focus": {
    borderColor: "var(--color-primary)",
  },
  "&::placeholder": {
    color: "var(--color-text-muted)",
  },
});

export function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input type="password" className={cx(passwordInputStyle, className)} {...props} />;
}

const submitButtonStyle = css({
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  fontFamily: "inherit",
  background: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "background 0.2s ease",
  "&:hover": {
    background: "#2563eb",
  },
});

export function SubmitButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="submit"
      aria-label="Submit form"
      className={cx(submitButtonStyle, className)}
      {...props}
    />
  );
}

// =============================================================================
// cva Badge Demo
// =============================================================================

const badgeCvaFn = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.25rem 0.625rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 500,
    lineHeight: 1.4,
  },
  variants: {
    variant: {
      info: {
        background: "#e0f2fe",
        color: "#0369a1",
        _dark: {
          background: "#0c4a6e",
          color: "#7dd3fc",
        },
      },
      success: {
        background: "#dcfce7",
        color: "#166534",
        _dark: {
          background: "#052e16",
          color: "#86efac",
        },
      },
      warning: {
        background: "#fef3c7",
        color: "#92400e",
        _dark: {
          background: "#451a03",
          color: "#fcd34d",
        },
      },
    },
  },
});

export const badgeCss = badgeCvaFn;

// =============================================================================
// CSS Nesting Demo Card
// =============================================================================

const nestingCardStyle = css({
  padding: "1.25rem",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius)",
  transition: "all 0.2s ease",
  position: "relative",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    borderColor: "var(--color-primary)",
  },
  "& h3": {
    margin: "0 0 0.5rem",
    fontSize: "1rem",
    fontWeight: 600,
  },
  "& p": {
    margin: 0,
    fontSize: "0.875rem",
    color: "var(--color-text-secondary)",
  },
  "@media (max-width: 640px)": {
    padding: "0.75rem",
  },
  "&::after": {
    content: '"hover me"',
    position: "absolute",
    top: "0.5rem",
    right: "0.75rem",
    fontSize: "0.6875rem",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "opacity 0.2s ease",
  },
  "&:hover::after": {
    opacity: 0,
  },
});

export function NestingCard({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cx(nestingCardStyle, className)} {...props}>
      {children}
    </div>
  );
}

// =============================================================================
// Multi-Level Extension Demo
// =============================================================================

const bigPrimaryButtonStyle = css({
  fontSize: "1rem",
  padding: "0.75rem 1.5rem",
  background: "#2563eb",
  "&:hover": {
    background: "#1d4ed8",
  },
});

export function BigPrimaryButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cx(styledButtonStyle, extendedButtonStyle, bigPrimaryButtonStyle, className)}
      {...props}
    />
  );
}

// =============================================================================
// withComponent Demo (AnchorButton)
// =============================================================================

function AnchorButtonBase({ className, ...props }: React.ComponentProps<"a">) {
  return <a className={cx(styledButtonStyle, className)} {...props} />;
}

export const AnchorButton = Object.assign(AnchorButtonBase, { className: styledButtonStyle });

// =============================================================================
// Code Block
// =============================================================================

const codeBlockWrapperStyle = css({
  margin: "1.5rem 0",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
  border: "1px solid #2a2a2a",
  background: "var(--color-bg-code)",
  maxWidth: "100%",
});

const codeBlockHeaderStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 1rem",
  background: "#1a1a1a",
  borderBottom: "1px solid #2a2a2a",
  minHeight: "44px",
});

const tabLabelStyle = css({
  display: "inline-flex",
  alignItems: "center",
  height: "44px",
  padding: "0 0.75rem",
  marginRight: "0.25rem",
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "#e5e7eb",
  background: "var(--color-bg-code)",
  borderRadius: "8px 8px 0 0",
  position: "relative",
  top: "1px",
});

const codeBlockContentStyle = css({
  margin: 0,
  padding: "1.25rem 1rem",
  background: "var(--color-bg-code)",
  color: "#e5e7eb",
  fontFamily: '"Fira Code", "Monaco", monospace',
  fontSize: "0.8125rem",
  lineHeight: 1.7,
  overflowX: "auto",
  maxWidth: "100%",
  "@media (max-width: 767px)": {
    padding: "1rem 0.75rem",
    fontSize: "0.75rem",
  },
});

const copyButtonStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "0.375rem",
  padding: "0.375rem 0.625rem",
  fontSize: "0.75rem",
  fontFamily: "inherit",
  color: "#9ca3af",
  background: "transparent",
  border: "1px solid #3a3a3a",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "all var(--transition)",
  "&:hover": {
    background: "#2a2a2a",
    color: "#e5e7eb",
    borderColor: "#4a4a4a",
  },
});

export function CodeBlock({ filename, children }: { filename?: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sugar High returns HTML string with syntax highlighting
  const highlightedCode = highlight(children);

  return (
    <div className={codeBlockWrapperStyle}>
      <div className={codeBlockHeaderStyle}>
        <span className={tabLabelStyle}>{filename || "code"}</span>
        <button className={copyButtonStyle} onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={14} /> Copied
            </>
          ) : (
            <>
              <Copy size={14} /> Copy
            </>
          )}
        </button>
      </div>
      <pre
        className={codeBlockContentStyle}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </div>
  );
}

// =============================================================================
// Callout Component
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

export function Callout({
  type,
  icon,
  children,
}: {
  type: "note" | "tip" | "warning";
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={calloutVariants({ type })}>
      <span className={calloutIconStyle}>{icon}</span>
      <div className={calloutContentStyle}>{children}</div>
    </div>
  );
}

// Re-export icons for convenience
export { Info, Lightbulb, AlertTriangle };
export { cx };
