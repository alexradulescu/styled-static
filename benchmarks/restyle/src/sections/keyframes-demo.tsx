/**
 * Keyframes demo components.
 * Restyle doesn't have a keyframes helper, so we inject global keyframes
 * via a <style> tag and reference them by name in styled components.
 */
import { styled } from "restyle";

export function KeyframeStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      @keyframes ss-docs-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes ss-docs-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `,
      }}
    />
  );
}

export const Spinner = styled("div", {
  width: "24px",
  height: "24px",
  border: "3px solid var(--color-primary)",
  borderTopColor: "transparent",
  borderRadius: "50%",
  animation: "ss-docs-spin 1s linear infinite",
});

export const PulsingDot = styled("div", {
  width: "12px",
  height: "12px",
  background: "var(--color-primary)",
  borderRadius: "50%",
  animation: "ss-docs-pulse 2s ease-in-out infinite",
});
