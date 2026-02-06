import { styledStatic } from "@alex.radulescu/styled-static/vite";
import react from "@vitejs/plugin-react";
import { type PluginOption, defineConfig } from "vite";

export default defineConfig({
  base: "/",
  css: {
    transformer: "lightningcss",
  },
  plugins: [styledStatic() as PluginOption, react()],
});
