import { GlobalStyles, css, type CSSObject } from "restyle";
import { ShowcaseApp, type ShowcaseStyles } from "../../../showcase/App";

const styleComponents: Array<[string, () => React.JSX.Element]> = [];
function classFor(style: CSSObject): string {
  const [className, Styles] = css(style);
  styleComponents.push([className, Styles]);
  return className;
}
function Styles() {
  return (
    <>
      <GlobalStyles>
        {{
          ":root, [data-theme=light]": {
            "--bg": "#fff",
            "--surface": "#f7f8fb",
            "--text": "#182033",
            "--muted": "#5d687f",
            "--accent": "#3157d5",
            "--line": "#dfe4ee",
            colorScheme: "light",
          },
          "[data-theme=dark]": {
            "--bg": "#111522",
            "--surface": "#191f30",
            "--text": "#f2f5ff",
            "--muted": "#abb5cb",
            "--accent": "#89a5ff",
            "--line": "#30394e",
            colorScheme: "dark",
          },
          "[data-theme=copper]": {
            "--bg": "#24150f",
            "--surface": "#321d14",
            "--text": "#ffe2c4",
            "--muted": "#d5aa86",
            "--accent": "#e39358",
            "--line": "#65402c",
            colorScheme: "dark",
          },
          "*": { boxSizing: "border-box" },
          body: { margin: 0 },
          "button, a": { font: "inherit" },
          a: { color: "inherit" },
        }}
      </GlobalStyles>
      {styleComponents.map(([className, Style]) => (
        <Style key={className} />
      ))}
    </>
  );
}

const styles: ShowcaseStyles = {
  Styles,
  page: classFor({
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    font: "16px/1.6 system-ui, sans-serif",
  }),
  shell: classFor({ width: "min(1080px, calc(100% - 2rem))", marginInline: "auto" }),
  header: classFor({
    position: "sticky",
    top: 0,
    zIndex: 10,
    borderBottom: "1px solid var(--line)",
    background: "var(--bg)",
    "& > div": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: "4rem",
    },
  }),
  brand: classFor({ fontWeight: 800, textDecoration: "none", letterSpacing: "-0.03em" }),
  nav: classFor({
    display: "flex",
    gap: "1rem",
    "& a": { color: "var(--muted)", textDecoration: "none" },
  }),
  hero: classFor({ paddingBlock: "clamp(5rem, 12vw, 9rem)" }),
  kicker: classFor({
    margin: "0 0 1rem",
    color: "var(--accent)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  }),
  title: classFor({
    maxWidth: 850,
    margin: 0,
    fontSize: "clamp(2.7rem, 8vw, 6rem)",
    lineHeight: 0.98,
    letterSpacing: "-0.06em",
  }),
  lede: classFor({
    maxWidth: 690,
    margin: "1.5rem 0 0",
    color: "var(--muted)",
    fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
  }),
  actions: classFor({ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "2rem" }),
  primary: classFor({
    display: "inline-flex",
    border: "1px solid var(--accent)",
    borderRadius: "0.6rem",
    padding: "0.65rem 1rem",
    background: "var(--accent)",
    color: "var(--bg)",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
  }),
  secondary: classFor({
    display: "inline-flex",
    border: "1px solid var(--line)",
    borderRadius: "0.6rem",
    padding: "0.65rem 1rem",
    textDecoration: "none",
  }),
  section: classFor({
    paddingBlock: "4rem",
    borderTop: "1px solid var(--line)",
    "& > h2": { marginTop: 0, fontSize: "2rem", letterSpacing: "-0.035em" },
  }),
  grid: classFor({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1rem",
  }),
  card: classFor({
    border: "1px solid var(--line)",
    borderRadius: "0.8rem",
    padding: "1.25rem",
    background: "var(--surface)",
    "& p": { marginBottom: 0, color: "var(--muted)" },
  }),
  cardTitle: classFor({ margin: 0, fontSize: "1.05rem" }),
  code: classFor({
    overflow: "auto",
    border: "1px solid var(--line)",
    borderRadius: "0.8rem",
    padding: "1.25rem",
    background: "#0c1020",
    color: "#dce6ff",
  }),
  counter: classFor({
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginTop: "1rem",
    color: "var(--muted)",
  }),
  themes: classFor({ display: "flex", flexWrap: "wrap", gap: "0.5rem" }),
  themeButton: classFor({
    border: "1px solid var(--line)",
    borderRadius: 999,
    padding: "0.45rem 0.8rem",
    background: "var(--surface)",
    color: "var(--text)",
    textTransform: "capitalize",
    cursor: "pointer",
  }),
  activeTheme: classFor({ borderColor: "var(--accent)", outline: "2px solid var(--accent)" }),
  footer: classFor({
    paddingBlock: "3rem",
    borderTop: "1px solid var(--line)",
    color: "var(--muted)",
  }),
};

export function App() {
  return <ShowcaseApp styles={styles} />;
}
export default App;
