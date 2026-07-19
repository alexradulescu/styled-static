import { css } from "../styled-system/css/css";
import { ShowcaseApp, type ShowcaseStyles } from "../../../showcase/App";

const styles: ShowcaseStyles = {
  page: css({
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    fontFamily: "system-ui, sans-serif",
    lineHeight: "1.6",
  }),
  shell: css({ width: "min(1080px, calc(100% - 2rem))", marginInline: "auto" }),
  header: css({
    position: "sticky",
    top: 0,
    zIndex: 10,
    borderBottom: "1px solid var(--line)",
    background: "color-mix(in srgb, var(--bg) 88%, transparent)",
    backdropFilter: "blur(12px)",
    "& > div": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: "4rem",
    },
  }),
  brand: css({ fontWeight: "800", textDecoration: "none", letterSpacing: "-0.03em" }),
  nav: css({
    display: "flex",
    gap: "1rem",
    "& a": { color: "var(--muted)", textDecoration: "none" },
    "& a:hover": { color: "var(--text)" },
  }),
  hero: css({ paddingBlock: "clamp(5rem, 12vw, 9rem)" }),
  kicker: css({
    margin: "0 0 1rem",
    color: "var(--accent)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  }),
  title: css({
    maxWidth: "850px",
    margin: "0",
    fontSize: "clamp(2.7rem, 8vw, 6rem)",
    lineHeight: "0.98",
    letterSpacing: "-0.06em",
  }),
  lede: css({
    maxWidth: "690px",
    margin: "1.5rem 0 0",
    color: "var(--muted)",
    fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
  }),
  actions: css({ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "2rem" }),
  primary: css({
    display: "inline-flex",
    border: "1px solid var(--accent)",
    borderRadius: "0.6rem",
    padding: "0.65rem 1rem",
    background: "var(--accent)",
    color: "var(--bg)",
    fontWeight: "700",
    textDecoration: "none",
    cursor: "pointer",
  }),
  secondary: css({
    display: "inline-flex",
    border: "1px solid var(--line)",
    borderRadius: "0.6rem",
    padding: "0.65rem 1rem",
    textDecoration: "none",
  }),
  section: css({
    paddingBlock: "4rem",
    borderTop: "1px solid var(--line)",
    "& > h2": { marginTop: 0, fontSize: "2rem", letterSpacing: "-0.035em" },
  }),
  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
  }),
  card: css({
    border: "1px solid var(--line)",
    borderRadius: "0.8rem",
    padding: "1.25rem",
    background: "var(--surface)",
    "& p": { marginBottom: 0, color: "var(--muted)" },
  }),
  cardTitle: css({ margin: 0, fontSize: "1.05rem" }),
  code: css({
    overflow: "auto",
    border: "1px solid var(--line)",
    borderRadius: "0.8rem",
    padding: "1.25rem",
    background: "#0c1020",
    color: "#dce6ff",
  }),
  counter: css({
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginTop: "1rem",
    color: "var(--muted)",
  }),
  themes: css({ display: "flex", flexWrap: "wrap", gap: "0.5rem" }),
  themeButton: css({
    border: "1px solid var(--line)",
    borderRadius: "999px",
    padding: "0.45rem 0.8rem",
    background: "var(--surface)",
    color: "var(--text)",
    textTransform: "capitalize",
    cursor: "pointer",
  }),
  activeTheme: css({
    borderColor: "var(--accent)",
    outline: "2px solid color-mix(in srgb, var(--accent) 35%, transparent)",
  }),
  footer: css({ paddingBlock: "3rem", borderTop: "1px solid var(--line)", color: "var(--muted)" }),
};

export function App() {
  return <ShowcaseApp styles={styles} />;
}
export default App;
