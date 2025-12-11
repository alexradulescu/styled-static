import react from "@vitejs/plugin-react";
import path from "path";
import { type PluginOption, defineConfig } from "vite";
import { styledStatic } from "../src/vite";
import { styledStatic } from "../src/vite";

export default defineConfig({
  base: "/styled-static/",
  plugins: [styledStatic() as PluginOption, react()],
  resolve: {
    alias: {
      // Map styled-static imports to local source for development
      "styled-static/runtime": path.resolve(__dirname, "../src/runtime.tsx"),
      "styled-static": path.resolve(__dirname, "../src/index.ts"),
    },
  },
});
