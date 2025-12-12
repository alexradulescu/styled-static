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
 * Filters out transient props (those starting with $).
 * This prevents React warnings about invalid DOM attributes.
 *
 * SECURITY: Uses Object.keys() instead of for...in to prevent prototype
 * pollution attacks where Object.prototype properties could be copied to DOM elements.
 */
export function filterTransientProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (key[0] !== "$") {
      filtered[key] = props[key];
    }
  }
  return filtered;
}

/**
 * Merges class names in the correct order for CSS cascade.
 * Order: styled class(es) first, user className last
 * This allows user classes to override styled classes when needed.
 */
export function mergeClassNames(styledClass: string, userClass?: string): string {
  return userClass ? `${styledClass} ${userClass}` : styledClass;
}
