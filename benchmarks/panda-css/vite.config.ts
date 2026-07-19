import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { showcaseDedupe } from "../../showcase/vite";

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: showcaseDedupe },
});
