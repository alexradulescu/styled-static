/**
 * Keyframes demo components.
 * Defines @keyframes via index.css and references them via Tailwind animation utility classes.
 */
import React from "react";
import clsx from "clsx";

export function KeyframeStyles() {
  return null;
}

export function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "w-6 h-6 border-[3px] border-[var(--color-primary)] border-t-transparent rounded-full",
        "animate-ss-spin",
        className,
      )}
      {...props}
    />
  );
}

export function PulsingDot({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={clsx("w-3 h-3 bg-[var(--color-primary)] rounded-full animate-ss-pulse", className)}
      {...props}
    />
  );
}
