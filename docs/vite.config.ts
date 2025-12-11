import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { styledStatic } from "../src/vite";
import path from "path";

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
