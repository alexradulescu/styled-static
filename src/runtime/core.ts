/**
 * styled-static runtime core utilities
 *
 * Shared utilities used by multiple runtime modules.
 * This module has no dependencies and exports pure functions.
 */

/**
 * Dangerous HTML elements that should not be used with the `as` prop.
 * These elements can execute scripts, embed external content, or inject styles.
 *
 * SECURITY: Defense-in-depth to prevent XSS via polymorphic rendering.
 * While the developer controls the code, this prevents accidental misuse
 * where user input might flow into the `as` prop.
 */
export const DANGEROUS_ELEMENTS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "style",
  "link",
  "meta",
  "base",
  "noscript",
  "template",
]);

/**
 * Validates that an element is safe to render.
 * Returns the safe tag, or falls back to the default if dangerous.
 */
export function validateAsTag(as: unknown, defaultTag: string): string {
  if (typeof as !== "string") {
    return defaultTag;
  }
  const normalized = as.toLowerCase();
  if (DANGEROUS_ELEMENTS.has(normalized)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[styled-static] Blocked dangerous element "${as}" in "as" prop. ` +
          `Falling back to "${defaultTag}".`
      );
    }
    return defaultTag;
  }
  return as;
}

/**
 * Merges class names in the correct order for CSS cascade.
 * Order: styled class(es) first, user className last
 * This allows user classes to override styled classes when needed.
 */
export function mergeClassNames(styledClass: string, userClass?: string): string {
  return userClass ? `${styledClass} ${userClass}` : styledClass;
}

/**
 * Debug logging helper for styled components.
 * Logs component render info in a grouped console output.
 * Dead-code eliminated in production builds.
 *
 * @param name - Component display name
 * @param entries - Array of [label, value] pairs to log
 */
export function debugLog(name: string, entries: [string, unknown][]): void {
  if (process.env.NODE_ENV !== "production") {
    console.group(`[${name}] Render Debug`);
    for (const [label, value] of entries) {
      console.log(`${label}:`, value);
    }
    console.groupEnd();
  }
}
