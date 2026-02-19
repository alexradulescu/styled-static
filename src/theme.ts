/**
 * Theme helpers for styled-static
 *
 * Provides simple, framework-agnostic utilities for theme switching.
 * Uses CSS custom properties with data-theme attribute on documentElement.
 *
 * @example
 * ```tsx
 * import { initTheme, setTheme, getTheme } from '@alex.radulescu/styled-static';
 *
 * // Initialize on app load
 * initTheme({ defaultTheme: 'light', useSystemPreference: true });
 *
 * // Get current theme
 * const current = getTheme(); // 'light' | 'dark' | etc.
 *
 * // Change theme
 * setTheme('dark');
 * setTheme('pokemon', false); // Don't persist to localStorage
 * ```
 */

const DEFAULT_STORAGE_KEY = "theme";
const DEFAULT_THEME = "light";

/**
 * Options for initializing the theme system.
 */
export interface InitThemeOptions {
  /**
   * The default theme to use when no stored preference exists.
   * @default 'light'
   */
  defaultTheme?: string;

  /**
   * The localStorage key used to persist the theme.
   * @default 'theme'
   */
  storageKey?: string;

  /**
   * Whether to use the system's color scheme preference as a fallback.
   * When enabled, checks `prefers-color-scheme: dark` media query.
   * @default false
   */
  useSystemPreference?: boolean;

  /**
   * Custom attribute name to set on documentElement.
   * @default 'data-theme'
   */
  attribute?: string;
}

/**
 * Get the current theme from the document.
 *
 * @param attribute - The attribute to read from (default: 'data-theme')
 * @returns The current theme name, or 'light' if not set
 *
 * @example
 * const theme = getTheme(); // 'light', 'dark', 'pokemon', etc.
 */
export function getTheme(attribute = "data-theme"): string {
  if (typeof document === "undefined") return DEFAULT_THEME;

  // Handle both data-* and regular attributes
  if (attribute.startsWith("data-")) {
    // dataset uses camelCase keys: data-color-mode → colorMode
    const key = attribute.slice(5).replace(/-([a-z])/g, (_, l: string) => l.toUpperCase());
    return document.documentElement.dataset[key] || DEFAULT_THEME;
  }
  return document.documentElement.getAttribute(attribute) || DEFAULT_THEME;
}

/**
 * Set the theme on the document and optionally persist to localStorage.
 *
 * @param theme - The theme name to set (e.g., 'dark', 'pokemon', 'star-trek')
 * @param persist - Whether to save to localStorage (default: true)
 * @param options - Additional options for attribute and storage key
 *
 * @example
 * // Set theme and persist
 * setTheme('dark');
 *
 * // Set theme without persisting (e.g., for preview)
 * setTheme('pokemon', false);
 */
export function setTheme(
  theme: string,
  persist = true,
  options: { storageKey?: string; attribute?: string } = {}
): void {
  const { storageKey = DEFAULT_STORAGE_KEY, attribute = "data-theme" } =
    options;

  if (typeof document === "undefined") return;

  // Handle both data-* and regular attributes
  if (attribute.startsWith("data-")) {
    // dataset uses camelCase keys: data-color-mode → colorMode
    const key = attribute.slice(5).replace(/-([a-z])/g, (_, l: string) => l.toUpperCase());
    document.documentElement.dataset[key] = theme;
  } else {
    document.documentElement.setAttribute(attribute, theme);
  }

  if (persist && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // localStorage might be unavailable (private browsing, etc.)
    }
  }
}

/**
 * Initialize the theme system on page load.
 *
 * Applies the theme in this priority order:
 * 1. Stored theme from localStorage
 * 2. System preference (if `useSystemPreference` is true)
 * 3. Default theme
 *
 * @param options - Configuration options
 * @returns The theme that was applied
 *
 * @example
 * // Basic usage
 * initTheme();
 *
 * // With system preference detection
 * initTheme({ useSystemPreference: true });
 *
 * // Full configuration
 * initTheme({
 *   defaultTheme: 'light',
 *   storageKey: 'my-app-theme',
 *   useSystemPreference: true,
 * });
 */
export function initTheme(options: InitThemeOptions = {}): string {
  const {
    defaultTheme = DEFAULT_THEME,
    storageKey = DEFAULT_STORAGE_KEY,
    useSystemPreference = false,
    attribute = "data-theme",
  } = options;

  if (typeof document === "undefined") return defaultTheme;

  // Priority 1: Check localStorage
  let theme: string | null = null;
  if (typeof localStorage !== "undefined") {
    try {
      theme = localStorage.getItem(storageKey);
    } catch {
      // localStorage might be unavailable
    }
  }

  if (theme) {
    setTheme(theme, false, { storageKey, attribute });
    return theme;
  }

  // Priority 2: System preference (opt-in)
  if (useSystemPreference && typeof matchMedia !== "undefined") {
    const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
    theme = prefersDark ? "dark" : "light";
    setTheme(theme, false, { storageKey, attribute });
    return theme;
  }

  // Priority 3: Default theme
  setTheme(defaultTheme, false, { storageKey, attribute });
  return defaultTheme;
}

/**
 * Subscribe to system theme changes.
 *
 * Useful when `useSystemPreference` is enabled and you want to
 * react to the user changing their OS theme.
 *
 * @param callback - Function called when system preference changes
 * @returns Unsubscribe function
 *
 * @example
 * const unsubscribe = onSystemThemeChange((isDark) => {
 *   if (!localStorage.getItem('theme')) {
 *     setTheme(isDark ? 'dark' : 'light', false);
 *   }
 * });
 *
 * // Later: stop listening
 * unsubscribe();
 */
export function onSystemThemeChange(
  callback: (prefersDark: boolean) => void
): () => void {
  if (typeof matchMedia === "undefined") {
    return () => {};
  }

  const mediaQuery = matchMedia("(prefers-color-scheme: dark)");

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  // React 19 requires Safari 15.4+, which has addEventListener on MediaQueryList
  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}
