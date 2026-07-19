import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: false,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  outdir: "styled-system",
});
