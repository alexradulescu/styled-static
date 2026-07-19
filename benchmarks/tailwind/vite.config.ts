import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { showcaseDedupe } from "../../showcase/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: showcaseDedupe },
});
