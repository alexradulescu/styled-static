/**
 * Theme Helper Tests
 *
 * These tests verify the theme helper functions.
 * Since we're running in Node.js (no DOM), we test:
 * 1. SSR fallback behavior (when document is undefined)
 * 2. Export verification
 */
import { describe, expect, it } from "vitest";
import {
  type InitThemeOptions,
  getTheme,
  initTheme,
  onSystemThemeChange,
  setTheme,
} from "./theme";

// =============================================================================
// SSR / Node.js Environment Tests
// =============================================================================

describe("theme helpers (SSR/Node.js environment)", () => {
  describe("getTheme", () => {
    it("should return 'light' as default when document is undefined", () => {
      // In Node.js, document is undefined
      expect(getTheme()).toBe("light");
    });
  });

  describe("setTheme", () => {
    it("should not throw when document is undefined", () => {
      // Should gracefully handle missing document
      expect(() => setTheme("dark")).not.toThrow();
    });

    it("should not throw when persist=false", () => {
      expect(() => setTheme("dark", false)).not.toThrow();
    });
  });

  describe("initTheme", () => {
    it("should return defaultTheme when document is undefined", () => {
      const result = initTheme({ defaultTheme: "pokemon" });
      expect(result).toBe("pokemon");
    });

    it("should return 'light' when no options provided", () => {
      const result = initTheme();
      expect(result).toBe("light");
    });
  });

  describe("onSystemThemeChange", () => {
    it("should return a no-op unsubscribe function when matchMedia is undefined", () => {
      const callback = () => {};
      const unsubscribe = onSystemThemeChange(callback);

      expect(typeof unsubscribe).toBe("function");
      // Should not throw when called
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});

// =============================================================================
// Type Tests
// =============================================================================

describe("theme types", () => {
  it("should export InitThemeOptions type", () => {
    // Type assertion - if this compiles, types are correct
    const options: InitThemeOptions = {
      defaultTheme: "dark",
      storageKey: "my-theme",
      useSystemPreference: true,
      attribute: "data-color-mode",
    };
    expect(options).toBeDefined();
  });

  it("should allow partial InitThemeOptions", () => {
    const options: InitThemeOptions = {};
    expect(options).toBeDefined();
  });
});

// =============================================================================
// Export Verification
// =============================================================================

describe("theme exports", () => {
  it("should export getTheme function", () => {
    expect(typeof getTheme).toBe("function");
  });

  it("should export setTheme function", () => {
    expect(typeof setTheme).toBe("function");
  });

  it("should export initTheme function", () => {
    expect(typeof initTheme).toBe("function");
  });

  it("should export onSystemThemeChange function", () => {
    expect(typeof onSystemThemeChange).toBe("function");
  });
});
