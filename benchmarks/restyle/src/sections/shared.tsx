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

// BigPrimaryButton: extends ExtendedButton with additional styles
const bigPrimaryExtraCss = css({
  fontSize: "1rem",
  padding: "0.75rem 1.5rem",
  background: "#2563eb",
  "&:hover": {
    background: "#1d4ed8",
  },
});

export function BigPrimaryButton(props: React.ComponentProps<typeof StyledButton>) {
  const [extCls, ExtStyles] = extendedCss;
  const [bigCls, BigStyles] = bigPrimaryExtraCss;
  return (
    <>
      <StyledButton {...props} className={cx(extCls, bigCls, props.className)} />
      <ExtStyles />
      <BigStyles />
    </>
  );
}

// AnchorButton: renders an <a> with StyledButton styles (polymorphism demo)
// Exposes a static className for composition like StyledButton.className in the docs
// css() is evaluated at module scope, so the className is available immediately
const [_anchorBtnClass] = styledButtonCss;
export const AnchorButton = Object.assign(
  function AnchorButtonFn({ className, ...props }: React.ComponentProps<"a">) {
    const [btnCls, BtnStyles] = styledButtonCss;
    return (
      <>
        <a className={cx(btnCls, className)} {...props} />
        <BtnStyles />
      </>
    );
  },
  { className: _anchorBtnClass }
);

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
// Attrs Demo Components
// =============================================================================

// PasswordInput: wrapper component with hardcoded type="password" (Restyle has no .attrs())
const passwordInputCss = css({
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
  const [cls, Styles] = passwordInputCss;
  return (
    <>
      <input type="password" className={cx(cls, className)} {...props} />
      <Styles />
    </>
  );
}

// SubmitButton: wrapper component with hardcoded type="submit" and aria-label
const submitButtonCss = css({
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
  const [cls, Styles] = submitButtonCss;
  return (
    <>
      <button type="submit" aria-label="Submit form" className={cx(cls, className)} {...props} />
      <Styles />
    </>
  );
}

// =============================================================================
// cssVariants Badge Demo
// =============================================================================

const badgeBaseCss = css({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.25rem 0.625rem",
  borderRadius: "9999px",
  fontSize: "0.75rem",
  fontWeight: 500,
  lineHeight: 1.4,
});

const badgeInfoCss = css({
  background: "#e0f2fe",
  color: "#0369a1",
  '[data-theme="dark"] &': {
    background: "#0c4a6e",
    color: "#7dd3fc",
  },
});

const badgeSuccessCss = css({
  background: "#dcfce7",
  color: "#166534",
  '[data-theme="dark"] &': {
    background: "#052e16",
    color: "#86efac",
  },
});

const badgeWarningCss = css({
  background: "#fef3c7",
  color: "#92400e",
  '[data-theme="dark"] &': {
    background: "#451a03",
    color: "#fcd34d",
  },
});

const badgeVariantMap = {
  info: badgeInfoCss,
  success: badgeSuccessCss,
  warning: badgeWarningCss,
};

export function badgeCss(opts: { variant: "info" | "success" | "warning" }): [string, React.FC] {
  const [baseClass, BaseStyles] = badgeBaseCss;
  const [varClass, VarStyles] = badgeVariantMap[opts.variant];
  const combined = cx(baseClass, varClass);
  const CombinedStyles = () => (
    <>
      <BaseStyles />
      <VarStyles />
    </>
  );
  return [combined, CombinedStyles];
}

// =============================================================================
// CSS Nesting Demo Card
// =============================================================================

export const NestingCard = styled("div", {
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

// =============================================================================
// Keyframes re-exports
// =============================================================================

export { Spinner, PulsingDot } from "./keyframes-demo";

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
