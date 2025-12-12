import react from "@vitejs/plugin-react";
import path from "path";
import { type PluginOption, defineConfig } from "vite";
import { styledStatic } from "../src/vite";

export default defineConfig({
  base: "/styled-static/",
  plugins: [styledStatic() as PluginOption, react()],
  resolve: {
    alias: {
      // Map styled-static imports to local source for development
      "styled-static/runtime/core": path.resolve(__dirname, "../src/runtime/core.ts"),
      "styled-static/runtime/styled": path.resolve(__dirname, "../src/runtime/styled.ts"),
      "styled-static/runtime/variants": path.resolve(__dirname, "../src/runtime/variants.ts"),
      "styled-static/runtime/global": path.resolve(__dirname, "../src/runtime/global.ts"),
      "styled-static": path.resolve(__dirname, "../src/index.ts"),
    },
  },
});
