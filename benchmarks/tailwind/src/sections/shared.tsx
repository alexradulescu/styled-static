/**
 * Shared components and utilities for documentation sections.
 * These are used by the lazy-loaded API and Features sections.
 */
import { type ReactNode, useState } from "react";
import { AlertTriangle, Check, Copy, Info, Lightbulb } from "lucide-react";
import clsx from "clsx";
import { tv } from "tailwind-variants";
import { highlight } from "sugar-high";

// =============================================================================
// Typography Components
// =============================================================================

export function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={clsx(
        "mb-16 scroll-mt-[calc(var(--header-height)+2rem)]",
        "max-[767px]:mb-12 max-[767px]:scroll-mt-[calc(var(--mobile-header-height)+1rem)]",
        className,
      )}
      {...props}
    />
  );
}

export function Breadcrumb({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={clsx(
        "block text-[0.8125rem] font-medium text-[var(--color-primary)] mb-2",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={clsx(
        "text-[1.625rem] font-semibold mb-5 tracking-[-0.02em] mt-0",
        "max-[767px]:text-[1.375rem]",
        className,
      )}
      {...props}
    />
  );
}

export function SubsectionTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={clsx("text-lg font-semibold mt-8 mb-4 text-[var(--color-text)]", className)}
      {...props}
    />
  );
}

export function Paragraph({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={clsx("mb-4 mt-0 text-[var(--color-text)]", className)} {...props} />;
}

export function InlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      className={clsx(
        "px-1.5 py-0.5 text-[0.875em] font-[Fira_Code,Monaco,monospace]",
        "bg-[var(--color-border)] rounded",
        className,
      )}
      {...props}
    />
  );
}

// =============================================================================
// Demo Components
// =============================================================================

export function DemoArea({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "p-6 my-6 bg-[var(--color-bg-sidebar)]",
        "border border-[var(--color-border)] rounded-[var(--radius)]",
        "max-w-full overflow-x-auto",
        "max-[767px]:p-4 max-[767px]:my-4",
        className,
      )}
      {...props}
    />
  );
}

export function DemoLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "text-xs font-semibold text-[var(--color-text-secondary)]",
        "uppercase tracking-[0.05em] mb-4",
        className,
      )}
      {...props}
    />
  );
}

export function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("flex flex-wrap gap-2", className)} {...props} />;
}

// Demo button using tv() for variants
const button = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "py-2 px-4 text-sm font-medium font-[inherit]",
    "border-none rounded-md cursor-pointer",
    "transition-all duration-200",
    "focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.3)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  variants: {
    variant: {
      primary: [
        "bg-[var(--color-primary)] text-white",
        "hover:enabled:bg-[var(--color-primary-hover)]",
      ],
      secondary: [
        "bg-[var(--color-border)] text-[var(--color-text)]",
        "hover:enabled:bg-[var(--color-text-secondary)] hover:enabled:text-white",
      ],
      ghost: [
        "bg-transparent text-[var(--color-text-secondary)]",
        "hover:enabled:bg-[var(--color-border)] hover:enabled:text-[var(--color-text)]",
      ],
    },
    size: {
      sm: "py-1.5 px-3 text-[0.8125rem]",
      md: "py-2 px-4 text-sm",
      lg: "py-3 px-6 text-base",
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
  return <button className={button({ variant, size: size || "md", className })} {...props} />;
}

// Example styled components for demos
export function StyledButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "styled-button",
        "py-2 px-4 text-sm font-[inherit]",
        "bg-[var(--color-primary)] text-white",
        "border-none rounded-md cursor-pointer",
        "hover:bg-[var(--color-primary-hover)]",
        className,
      )}
      {...props}
    />
  );
}

export function ExtendedButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "py-2 px-4 text-sm font-[inherit]",
        "bg-[var(--color-primary)] text-white",
        "border-none rounded-md cursor-pointer",
        "hover:bg-[var(--color-primary-hover)]",
        "font-semibold uppercase tracking-[0.05em]",
        className,
      )}
      {...props}
    />
  );
}

export const highlightClass = "shadow-[0_0_0_3px_var(--color-primary)]";

export function Counter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx("flex items-center gap-4 text-2xl font-semibold", "tabular-nums", className)}
      {...props}
    />
  );
}

// =============================================================================
// Multi-Level Extension Demo
// =============================================================================

export function BigPrimaryButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "py-2 px-4 text-sm font-[inherit]",
        "bg-[var(--color-primary)] text-white",
        "border-none rounded-md cursor-pointer",
        "hover:bg-[var(--color-primary-hover)]",
        "font-semibold uppercase tracking-[0.05em]",
        "text-base py-3 px-6 bg-[#2563eb] hover:bg-[#1d4ed8]",
        className,
      )}
      {...props}
    />
  );
}

// =============================================================================
// withComponent Demo
// =============================================================================

export function AnchorButton({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      className={clsx(
        "py-2 px-4 text-sm font-[inherit]",
        "bg-[var(--color-primary)] text-white",
        "border-none rounded-md cursor-pointer",
        "hover:bg-[var(--color-primary-hover)]",
        "no-underline inline-flex items-center",
        className,
      )}
      {...props}
    />
  );
}

// =============================================================================
// CSS Nesting Demo Card
// =============================================================================

export function NestingCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "nesting-card",
        "p-5 bg-[var(--color-bg)]",
        "border border-[var(--color-border)] rounded-[var(--radius)]",
        "transition-all duration-200 relative",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-[var(--color-primary)]",
        "max-[640px]:p-3",
        "[&_h3]:m-0 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_p]:m-0 [&_p]:text-sm [&_p]:text-[var(--color-text-secondary)]",
        className,
      )}
      {...props}
    />
  );
}

// =============================================================================
// Attrs Demo Components
// =============================================================================

export function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="password"
      className={clsx(
        "py-2 px-4 text-sm font-[inherit]",
        "border border-[var(--color-border)] rounded-md",
        "bg-[var(--color-bg)] text-[var(--color-text)]",
        "outline-none w-full",
        "transition-[border-color] duration-150",
        "focus:border-[var(--color-primary)]",
        "placeholder:text-[var(--color-text-muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function SubmitButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="submit"
      aria-label="Submit form"
      className={clsx(
        "py-2 px-4 text-sm font-medium font-[inherit]",
        "bg-[#3b82f6] text-white",
        "border-none rounded-md cursor-pointer",
        "transition-[background] duration-200",
        "hover:bg-[#2563eb]",
        className,
      )}
      {...props}
    />
  );
}

// =============================================================================
// cssVariants Badge Demo
// =============================================================================

const badgeVariants = {
  info: "bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0c4a6e] dark:text-[#7dd3fc]",
  success: "bg-[#dcfce7] text-[#166534] dark:bg-[#052e16] dark:text-[#86efac]",
  warning: "bg-[#fef3c7] text-[#92400e] dark:bg-[#451a03] dark:text-[#fcd34d]",
};

export function badgeCss({ variant }: { variant: "info" | "success" | "warning" }) {
  return clsx(
    "inline-flex items-center px-[0.625rem] py-1 rounded-full text-xs font-medium leading-[1.4]",
    badgeVariants[variant],
  );
}

// Keyframes demo components live in a separate file.
export { Spinner, PulsingDot } from "./keyframes-demo";

// =============================================================================
// Code Block
// =============================================================================

function CodeBlockWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "my-6 rounded-[var(--radius-lg)] overflow-hidden",
        "border border-[#2a2a2a] bg-[var(--color-bg-code)] max-w-full",
        className,
      )}
      {...props}
    />
  );
}

function CodeBlockHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between px-4",
        "bg-[#1a1a1a] border-b border-[#2a2a2a] min-h-[44px]",
        className,
      )}
      {...props}
    />
  );
}

function TabLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={clsx(
        "inline-flex items-center h-[44px] px-3 mr-1",
        "text-[0.8125rem] font-medium text-[#e5e7eb]",
        "bg-[var(--color-bg-code)] rounded-t-lg",
        "relative top-px",
        className,
      )}
      {...props}
    />
  );
}

function CodeBlockContent({ className, ...props }: React.ComponentProps<"pre">) {
  return (
    <pre
      className={clsx(
        "m-0 px-4 py-5 bg-[var(--color-bg-code)] text-[#e5e7eb]",
        "font-[Fira_Code,Monaco,monospace] text-[0.8125rem] leading-[1.7]",
        "overflow-x-auto max-w-full",
        "max-[767px]:px-3 max-[767px]:py-4 max-[767px]:text-xs",
        className,
      )}
      {...props}
    />
  );
}

function CopyButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "flex items-center gap-1.5 px-2.5 py-1.5",
        "text-xs font-[inherit] text-[#9ca3af]",
        "bg-transparent border border-[#3a3a3a] rounded-md cursor-pointer",
        "transition-all duration-150",
        "hover:bg-[#2a2a2a] hover:text-[#e5e7eb] hover:border-[#4a4a4a]",
        className,
      )}
      {...props}
    />
  );
}

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

const calloutVariant = tv({
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
  return <span className={clsx("text-xl shrink-0", className)} {...props} />;
}

function CalloutContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={clsx("flex-1", className)} {...props} />;
}

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
    <div className={calloutVariant({ type })}>
      <CalloutIcon>{icon}</CalloutIcon>
      <CalloutContent>{children}</CalloutContent>
    </div>
  );
}

// Re-export icons for convenience
export { Info, Lightbulb, AlertTriangle };
// Re-export clsx as cx for compatibility
export { clsx as cx };
