/**
 * Theme Helper Tests (Browser environment)
 *
 * These tests verify the theme helper functions in a browser-like
 * environment using jsdom.
 *
 * SSR tests are in theme.test.ts
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTheme,
  initTheme,
  onSystemThemeChange,
  setTheme,
} from "./theme";

describe("theme helpers (browser environment)", () => {
  beforeEach(() => {
    // Reset document state
    document.documentElement.removeAttribute("data-theme");
    delete document.documentElement.dataset.theme;
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTheme", () => {
    it("should read from data-theme attribute", () => {
      document.documentElement.dataset.theme = "dark";
      expect(getTheme()).toBe("dark");
    });

    it("should return light when no theme set", () => {
      expect(getTheme()).toBe("light");
    });

    it("should read from custom attribute", () => {
      document.documentElement.setAttribute("color-mode", "sepia");
      expect(getTheme("color-mode")).toBe("sepia");
    });

    it("should handle data-* prefix in custom attribute", () => {
      document.documentElement.dataset.colorMode = "high-contrast";
      expect(getTheme("data-colorMode")).toBe("high-contrast");
    });
  });

  describe("setTheme", () => {
    it("should set data-theme attribute", () => {
      setTheme("dark");
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("should persist to localStorage by default", () => {
      setTheme("dark");
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("should not persist when persist=false", () => {
      setTheme("dark", false);
      expect(localStorage.getItem("theme")).toBeNull();
    });

    it("should use custom storage key", () => {
      setTheme("dark", true, { storageKey: "my-theme" });
      expect(localStorage.getItem("my-theme")).toBe("dark");
    });

    it("should use custom attribute", () => {
      setTheme("sepia", true, { attribute: "color-mode" });
      expect(document.documentElement.getAttribute("color-mode")).toBe("sepia");
    });

    it("should handle localStorage errors gracefully", () => {
      const mockSetItem = vi.spyOn(Storage.prototype, "setItem");
      mockSetItem.mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      expect(() => setTheme("dark")).not.toThrow();
    });
  });

  describe("initTheme", () => {
    it("should use stored theme from localStorage", () => {
      localStorage.setItem("theme", "dark");
      const result = initTheme();
      expect(result).toBe("dark");
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("should use custom storage key", () => {
      localStorage.setItem("my-app-theme", "sepia");
      const result = initTheme({ storageKey: "my-app-theme" });
      expect(result).toBe("sepia");
    });

    it("should use system preference when enabled and no stored theme", () => {
      const matchMediaMock = vi.fn().mockReturnValue({ matches: true });
      vi.stubGlobal("matchMedia", matchMediaMock);

      const result = initTheme({ useSystemPreference: true });
      expect(result).toBe("dark");
      expect(matchMediaMock).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("should use light when system prefers light", () => {
      const matchMediaMock = vi.fn().mockReturnValue({ matches: false });
      vi.stubGlobal("matchMedia", matchMediaMock);

      const result = initTheme({ useSystemPreference: true });
      expect(result).toBe("light");
    });

    it("should fall back to defaultTheme", () => {
      const result = initTheme({ defaultTheme: "sepia" });
      expect(result).toBe("sepia");
    });

    it("should handle localStorage errors gracefully", () => {
      const mockGetItem = vi.spyOn(Storage.prototype, "getItem");
      mockGetItem.mockImplementation(() => {
        throw new Error("SecurityError");
      });
      expect(() => initTheme()).not.toThrow();
      expect(initTheme()).toBe("light");
    });

    it("should use custom attribute", () => {
      localStorage.setItem("theme", "dark");
      initTheme({ attribute: "color-mode" });
      expect(document.documentElement.getAttribute("color-mode")).toBe("dark");
    });
  });

  describe("onSystemThemeChange", () => {
    it("should subscribe to system theme changes", () => {
      const addEventListenerMock = vi.fn();
      const removeEventListenerMock = vi.fn();
      const matchMediaMock = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      });
      vi.stubGlobal("matchMedia", matchMediaMock);

      const callback = vi.fn();
      const unsubscribe = onSystemThemeChange(callback);

      expect(addEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));

      unsubscribe();
      expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("should call callback when system theme changes", () => {
      let changeHandler: ((e: { matches: boolean }) => void) | null = null;
      const matchMediaMock = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: (_event: string, handler: (e: { matches: boolean }) => void) => {
          changeHandler = handler;
        },
        removeEventListener: vi.fn(),
      });
      vi.stubGlobal("matchMedia", matchMediaMock);

      const callback = vi.fn();
      onSystemThemeChange(callback);

      // Simulate system theme change
      changeHandler?.({ matches: true });
      expect(callback).toHaveBeenCalledWith(true);
    });

    it("should use addEventListener and return a working unsubscribe function", () => {
      // React 19 requires Safari 15.4+, so we only support the modern addEventListener API.
      // This test verifies addEventListener/removeEventListener are used (not the removed legacy API).
      const addEventListenerMock = vi.fn();
      const removeEventListenerMock = vi.fn();
      const matchMediaMock = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      });
      vi.stubGlobal("matchMedia", matchMediaMock);

      const callback = vi.fn();
      const unsubscribe = onSystemThemeChange(callback);

      expect(addEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));

      unsubscribe();
      expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
    });
  });

  describe("non-data-* attribute support", () => {
    it("getTheme should use getAttribute for non-data-* attributes", () => {
      document.documentElement.setAttribute("class", "dark-theme");
      expect(getTheme("class")).toBe("dark-theme");
    });

    it("getTheme should return DEFAULT_THEME when non-data-* attribute is absent", () => {
      document.documentElement.removeAttribute("aria-label");
      expect(getTheme("aria-label")).toBe("light");
    });

    it("setTheme should use setAttribute for non-data-* attributes", () => {
      setTheme("dark", false, { attribute: "aria-theme" });
      expect(document.documentElement.getAttribute("aria-theme")).toBe("dark");
    });
  });

  describe("kebab-case data attributes", () => {
    it("getTheme should convert kebab data attribute to camelCase for dataset", () => {
      // data-color-mode maps to dataset.colorMode
      document.documentElement.dataset.colorMode = "dark";
      expect(getTheme("data-color-mode")).toBe("dark");
    });

    it("setTheme should convert kebab data attribute to camelCase for dataset", () => {
      setTheme("dark", false, { attribute: "data-color-mode" });
      expect(document.documentElement.dataset.colorMode).toBe("dark");
    });
  });

  describe("initTheme without localStorage", () => {
    it("should skip localStorage check when localStorage is undefined", () => {
      vi.stubGlobal("localStorage", undefined);
      // Falls through to system preference check (false) then default theme
      const result = initTheme({ defaultTheme: "dark" });
      expect(result).toBe("dark");
    });
  });
});
