import { describe, expect, it } from "vitest";
import {
  createGlobalStyle,
  css,
  cssVariants,
  cx,
  keyframes,
  styled,
  styledVariants,
  withComponent,
} from "./index";

describe("runtime error guards (untransformed calls)", () => {
  it("styled proxy get should throw config error", () => {
    expect(() => styled.button`padding: 1rem;`).toThrow(
      "styled was not transformed at build time"
    );
  });

  it("styled proxy apply should throw config error when called as function", () => {
    // The Proxy uses a function target so the apply trap fires when styled() is called
    // directly at runtime (i.e., the plugin didn't transform styled(Component)`...`).
    expect(() => (styled as any)()).toThrow(
      "styled was not transformed at build time"
    );
  });

  it("css should throw config error", () => {
    expect(() => css`padding: 1rem;`).toThrow(
      "css was not transformed at build time"
    );
  });

  it("keyframes should throw config error", () => {
    expect(() => keyframes`from { opacity: 0; }`).toThrow(
      "keyframes was not transformed at build time"
    );
  });

  it("createGlobalStyle should throw config error", () => {
    expect(() => createGlobalStyle`body { margin: 0; }`).toThrow(
      "createGlobalStyle was not transformed at build time"
    );
  });

  it("styledVariants should throw config error", () => {
    expect(() =>
      styledVariants({
        component: "button",
        css: "",
        variants: {},
      } as any)
    ).toThrow("styledVariants was not transformed at build time");
  });

  it("cssVariants should throw config error", () => {
    expect(() =>
      cssVariants({ css: "", variants: {} } as any)
    ).toThrow("cssVariants was not transformed at build time");
  });

  it("withComponent should throw config error", () => {
    expect(() => withComponent("a" as any, {} as any)).toThrow(
      "withComponent was not transformed at build time"
    );
  });

  it("error message includes plugin setup instructions", () => {
    try {
      css`test`;
    } catch (e: any) {
      expect(e.message).toContain("vite.config.ts");
      expect(e.message).toContain("styledStatic()");
    }
  });
});

describe("cx utility", () => {
  it("should join class names", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("should filter falsy values", () => {
    expect(cx("a", null, undefined, false, "b")).toBe("a b");
  });

  it("should handle empty input", () => {
    expect(cx()).toBe("");
  });

  it("should handle single class", () => {
    expect(cx("only")).toBe("only");
  });

  it("should handle all falsy values", () => {
    expect(cx(false, null, undefined)).toBe("");
  });
});
