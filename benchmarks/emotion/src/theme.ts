export function initTheme(): "light" | "dark" {
  const stored = localStorage.getItem("theme");
  const theme = stored === "dark" || stored === "light"
    ? stored
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

export function setTheme(theme: "light" | "dark", persist = true): void {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) {
    localStorage.setItem("theme", theme);
  }
}

export function getTheme(): "light" | "dark" {
  return (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
}

export function onSystemThemeChange(cb: (theme: "light" | "dark") => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => cb(e.matches ? "dark" : "light");
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
