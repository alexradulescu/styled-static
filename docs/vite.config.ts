import { styledStatic } from "@alex.radulescu/styled-static/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { type PluginOption, defineConfig } from "vite";

export default defineConfig({
  base: "/styled-static/",
  css: {
    transformer: "lightningcss",
  },
  plugins: [styledStatic() as PluginOption, react()],
  resolve: {
    alias: {
      // Map styled-static imports to local source for development
      "styled-static/runtime": path.resolve(
        __dirname,
        "../src/runtime/index.ts"
      ),
      "styled-static": path.resolve(__dirname, "../src/index.ts"),
    },
  },
});
