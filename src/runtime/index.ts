/**
 * styled-static minimal runtime
 *
 * This is the entire runtime for styled-static (~50 bytes minified).
 * All component creation happens at build time via the Vite plugin.
 *
 * ## Why so small?
 *
 * The Vite plugin generates inline component functions at build time.
 * The only runtime operation needed is merging className strings.
 *
 * ## `mergeClassNames`
 *
 * Merges the styled component's base class with any user-provided className.
 * Order: base class first, user class last.
 *
 * @example
 * mergeClassNames("ss-btn", undefined)     // → "ss-btn"
 * mergeClassNames("ss-btn", "custom")      // → "ss-btn custom"
 * mergeClassNames("ss-btn ss-primary", "") // → "ss-btn ss-primary"
 */

/**
 * Merge base className with user className.
 * Returns base class if no user class, otherwise combines them.
 */
export function mergeClassNames(baseClassName: string, userClassName?: string): string {
  return userClassName ? `${baseClassName} ${userClassName}` : baseClassName;
}
