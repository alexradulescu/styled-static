import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  css: { transformer: "lightningcss" },
  plugins: [react({ jsxImportSource: "@emotion/react" })],
});
