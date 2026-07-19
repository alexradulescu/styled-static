export const showcaseContent = {
  brand: "styled-static",
  kicker: "Static CSS. Familiar React.",
  title: "Styled components without a styling runtime.",
  lede: "Write readable component styles. Let Vite extract, bundle, and cache ordinary CSS.",
  features: [
    ["Build-time CSS", "CSS is extracted before it reaches the browser."],
    ["Readable output", "Stable class names point back to local declarations."],
    ["Precise HMR", "Only styles owned by the changed module are refreshed."],
    ["Library ready", "Colocated CSS imports preserve chunk-level tree shaking."],
  ],
} as const;
