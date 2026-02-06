/**
 * Shared components and utilities for documentation sections.
 * These are used by the lazy-loaded API and Features sections.
 * Converted from styled-static to Restyle.
 */
import { type ReactNode, useState } from "react";
import { AlertTriangle, Check, Copy, Info, Lightbulb } from "lucide-react";
import { styled, css } from "restyle";
import { highlight } from "sugar-high";

// =============================================================================
// cx utility (replaces styled-static's cx)
// =============================================================================

export function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// =============================================================================
// Typography Components
// =============================================================================

export const Section = styled("section", {
  marginBottom: "4rem",
  scrollMarginTop: "calc(var(--header-height) + 2rem)",
  "@media (max-width: 767px)": {
    marginBottom: "3rem",
    scrollMarginTop: "calc(var(--mobile-header-height) + 1rem)",
  },
});

export const Breadcrumb = styled("span", {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "var(--color-primary)",
  marginBottom: "0.5rem",
});

export const SectionTitle = styled("h2", {
  fontSize: "1.625rem",
  fontWeight: 600,
  margin: "0 0 1.25rem",
  letterSpacing: "-0.02em",
  "@media (max-width: 767px)": {
    fontSize: "1.375rem",
  },
});

export const SubsectionTitle = styled("h3", {
  fontSize: "1.125rem",
  fontWeight: 600,
  margin: "2rem 0 1rem",
  color: "var(--color-text)",
});

export const Paragraph = styled("p", {
  margin: "0 0 1rem",
  color: "var(--color-text)",
});

export const InlineCode = styled("code", {
  padding: "0.2rem 0.4rem",
  fontSize: "0.875em",
  fontFamily: '"Fira Code", "Monaco", monospace',
  background: "var(--color-border)",
  borderRadius: "4px",
});

// =============================================================================
// Demo Components
// =============================================================================

export const DemoArea = styled("div", {
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

export const DemoLabel = styled("div", {
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "1rem",
});

export const ButtonGroup = styled("div", {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
});

// =============================================================================
// Button with variants (manual variant function)
// =============================================================================

const buttonBaseCss = css({
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
});

const variantPrimaryCss = css({
  background: "var(--color-primary)",
  color: "white",
  "&:hover:not(:disabled)": {
    background: "var(--color-primary-hover)",
  },
});

const variantSecondaryCss = css({
  background: "var(--color-border)",
  color: "var(--color-text)",
  "&:hover:not(:disabled)": {
    background: "var(--color-text-secondary)",
    color: "white",
  },
});

const variantGhostCss = css({
  background: "transparent",
  color: "var(--color-text-secondary)",
  "&:hover:not(:disabled)": {
    background: "var(--color-border)",
    color: "var(--color-text)",
  },
});

const sizeSmCss = css({
  padding: "0.375rem 0.75rem",
  fontSize: "0.8125rem",
});

const sizeMdCss = css({
  padding: "0.5rem 1rem",
  fontSize: "0.875rem",
});

const sizeLgCss = css({
  padding: "0.75rem 1.5rem",
  fontSize: "1rem",
});

const variantMap = {
  primary: variantPrimaryCss,
  secondary: variantSecondaryCss,
  ghost: variantGhostCss,
};

const sizeMap = {
  sm: sizeSmCss,
  md: sizeMdCss,
  lg: sizeLgCss,
};

export function Button({
  variant,
  size,
  className,
  ...props
}: {
  variant: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
} & React.ComponentProps<"button">) {
  const [baseClass, BaseStyles] = buttonBaseCss;
  const [varClass, VarStyles] = variantMap[variant];
  const [szClass, SzStyles] = sizeMap[size || "md"];
  return (
    <>
      <button className={cx(baseClass, varClass, szClass, className)} {...props} />
      <BaseStyles />
      <VarStyles />
      <SzStyles />
    </>
  );
}

// =============================================================================
// Example styled components for demos
// =============================================================================

// CSS for the styled button (shared for className composition)
export const styledButtonCss = css({
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

export const StyledButton = styled("button", {
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

// ExtendedButton: composition workaround since Restyle doesn't support styled(Base)
const extendedCss = css({
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

export function ExtendedButton(props: React.ComponentProps<typeof StyledButton>) {
  const [cls, ExtStyles] = extendedCss;
  return (
    <>
      <StyledButton {...props} className={cx(cls, props.className)} />
      <ExtStyles />
    </>
  );
}

export const highlightCss = css({
  boxShadow: "0 0 0 3px var(--color-primary)",
});

export const Counter = styled("div", {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  fontSize: "1.5rem",
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums",
});

// =============================================================================
// Code Block
// =============================================================================

const CodeBlockWrapper = styled("div", {
  margin: "1.5rem 0",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
  border: "1px solid #2a2a2a",
  background: "var(--color-bg-code)",
  maxWidth: "100%",
});

const CodeBlockHeader = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 1rem",
  background: "#1a1a1a",
  borderBottom: "1px solid #2a2a2a",
  minHeight: "44px",
});

const TabLabel = styled("span", {
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

const CodeBlockContent = styled("pre", {
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

const CopyButton = styled("button", {
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

export function CodeBlock({
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
      <CodeBlockHeader>
        <TabLabel>{filename || "code"}</TabLabel>
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
      <CodeBlockContent dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </CodeBlockWrapper>
  );
}

// =============================================================================
// Callout Component
// =============================================================================

const calloutBaseCss = css({
  display: "flex",
  gap: "0.875rem",
  padding: "1.125rem 1.25rem",
  margin: "1.5rem 0",
  borderRadius: "var(--radius)",
  fontSize: "0.9375rem",
  lineHeight: 1.6,
});

const calloutNoteCss = css({
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  '[data-theme="dark"] &': {
    background: "#1e3a5f",
    borderColor: "#2563eb40",
  },
});

const calloutTipCss = css({
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  '[data-theme="dark"] &': {
    background: "#0c2915",
    borderColor: "#10b98140",
  },
});

const calloutWarningCss = css({
  background: "#fffbeb",
  border: "1px solid #fde68a",
  '[data-theme="dark"] &': {
    background: "#3d2e0a",
    borderColor: "#d9790640",
  },
});

const calloutVariantMap = {
  note: calloutNoteCss,
  tip: calloutTipCss,
  warning: calloutWarningCss,
};

const CalloutIcon = styled("span", {
  fontSize: "1.25rem",
  flexShrink: 0,
});

const CalloutContent = styled("div", {
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
  const [baseClass, BaseStyles] = calloutBaseCss;
  const [variantClass, VariantStyles] = calloutVariantMap[type];
  return (
    <>
      <div className={cx(baseClass, variantClass)}>
        <CalloutIcon>{icon}</CalloutIcon>
        <CalloutContent>{children}</CalloutContent>
      </div>
      <BaseStyles />
      <VariantStyles />
    </>
  );
}

// Re-export icons for convenience
export { Info, Lightbulb, AlertTriangle };
