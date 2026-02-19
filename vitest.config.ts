import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],

    // Default environment for plugin and SSR tests
    environment: "node",
    // Browser-specific tests (e.g. theme DOM APIs) use jsdom
    environmentMatchGlobs: [["src/**/*.browser.test.ts", "jsdom"]],

    coverage: {
      provider: "v8",

      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/types.ts"],

      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },

      reporter: ["text", "text-summary", "json"],
    },
  },
});
