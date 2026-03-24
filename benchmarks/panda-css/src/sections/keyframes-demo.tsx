/**
 * Keyframes demo components.
 * Defines @keyframes via index.css (global stylesheet)
 * and references them by name in Panda CSS components.
 */
import { css, cx } from "../../styled-system/css";

export function KeyframeStyles() {
  return null;
}

const spinnerStyle = css({
  width: "24px",
  height: "24px",
  border: "3px solid var(--color-primary)",
  borderTopColor: "transparent",
  borderRadius: "50%",
  animation: "ss-docs-spin 1s linear infinite",
});

export function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cx(spinnerStyle, className)} {...props} />;
}

const pulsingDotStyle = css({
  width: "12px",
  height: "12px",
  background: "var(--color-primary)",
  borderRadius: "50%",
  animation: "ss-docs-pulse 2s ease-in-out infinite",
});

export function PulsingDot({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cx(pulsingDotStyle, className)} {...props} />;
}
