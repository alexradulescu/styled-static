/**
 * Shared components and utilities for documentation sections.
 * These are used by the lazy-loaded API and Features sections.
 */
import { type ReactNode, useState } from "react";
import { AlertTriangle, Check, Copy, Info, Lightbulb } from "lucide-react";
import { css, cssVariants, cx, styled, styledVariants } from "styled-static";
import { highlight } from "sugar-high";

// =============================================================================
// Typography Components
// =============================================================================

export const Section = styled.section`
  margin-bottom: 4rem;
  scroll-margin-top: calc(var(--header-height) + 2rem);
`;

export const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  letter-spacing: -0.01em;
`;

export const SubsectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: var(--color-text);
`;

export const Paragraph = styled.p`
  margin: 0 0 1rem;
  color: var(--color-text);
`;

export const InlineCode = styled.code`
  padding: 0.2rem 0.4rem;
  font-size: 0.875em;
  font-family: "Fira Code", "Monaco", monospace;
  background: var(--color-border);
  border-radius: 4px;
`;

// =============================================================================
// Demo Components
// =============================================================================

export const DemoArea = styled.div`
  padding: 1.5rem;
  margin: 1.5rem 0;
  background: var(--color-bg-sidebar);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
`;

export const DemoLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

// Demo button using styledVariants with css`` for syntax highlighting
export const Button = styledVariants({
  component: "button",
  css: css`
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
      primary: css`
        background: var(--color-primary);
        color: white;
        &:hover:not(:disabled) {
          background: var(--color-primary-hover);
        }
      `,
      secondary: css`
        background: var(--color-border);
        color: var(--color-text);
        &:hover:not(:disabled) {
          background: var(--color-text-secondary);
          color: white;
        }
      `,
      ghost: css`
        background: transparent;
        color: var(--color-text-secondary);
        &:hover:not(:disabled) {
          background: var(--color-border);
          color: var(--color-text);
        }
      `,
    },
    size: {
      sm: css`
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      `,
      md: css`
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      `,
      lg: css`
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
      `,
    },
  },
});

// Example styled components for demos
export const StyledButton = styled.button`
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

export const ExtendedButton = styled(StyledButton)`
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const highlightClass = css`
  box-shadow: 0 0 0 3px var(--color-primary);
`;

export const Counter = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
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
// Callout Component
// =============================================================================

const calloutStyles = cssVariants({
  css: css`
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
    <div className={calloutStyles({ type })}>
      <CalloutIcon>{icon}</CalloutIcon>
      <CalloutContent>{children}</CalloutContent>
    </div>
  );
}

// Re-export icons for convenience
export { Info, Lightbulb, AlertTriangle };
export { cx };
