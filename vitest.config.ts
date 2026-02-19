import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default environment is Node.js (for plugin and SSR tests)
    environment: "node",
    // Browser tests use jsdom via @vitest-environment comment or workspace config
    environmentMatchGlobs: [
      // theme.browser.test.ts uses jsdom for DOM APIs
      ["src/**/*.browser.test.ts", "jsdom"],
    ],
  },
});
