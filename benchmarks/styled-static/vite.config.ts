import { styledStatic } from "../../src/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { type PluginOption, defineConfig } from "vite";

export default defineConfig({
  base: "/",
  css: {
    transformer: "lightningcss",
  },
  plugins: [react(), styledStatic() as PluginOption],
  resolve: {
    alias: [
      {
        find: "@alex.radulescu/styled-static/runtime",
        replacement: path.resolve(__dirname, "../../src/runtime/index.ts"),
      },
      {
        find: "@alex.radulescu/styled-static/vite",
        replacement: path.resolve(__dirname, "../../src/vite.ts"),
      },
      {
        find: "@alex.radulescu/styled-static",
        replacement: path.resolve(__dirname, "../../src/index.ts"),
      },
    ],
  },
});
