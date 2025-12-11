import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { styledStatic } from "./src/vite";

export default defineConfig({
  plugins: [styledStatic(), react()],
});
