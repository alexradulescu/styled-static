import { css, globalCss } from "@alex.radulescu/styled-static";
import type { ShowcaseStyles } from "../showcase/App";

globalCss`
  :root, [data-theme="light"] { --bg: #fff; --surface: #f7f8fb; --text: #182033; --muted: #5d687f; --accent: #3157d5; --line: #dfe4ee; color-scheme: light; }
  [data-theme="dark"] { --bg: #111522; --surface: #191f30; --text: #f2f5ff; --muted: #abb5cb; --accent: #89a5ff; --line: #30394e; color-scheme: dark; }
  [data-theme="copper"] { --bg: #24150f; --surface: #321d14; --text: #ffe2c4; --muted: #d5aa86; --accent: #e39358; --line: #65402c; color-scheme: dark; }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; }
  button, a { font: inherit; }
  a { color: inherit; }
`;

const page = css`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font:
    16px/1.6 Inter,
    ui-sans-serif,
    system-ui,
    sans-serif;
`;
const shell = css`
  width: min(1080px, calc(100% - 2rem));
  margin-inline: auto;
`;
const header = css`
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(12px);
  & > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 4rem;
  }
`;
const brand = css`
  font-weight: 800;
  text-decoration: none;
  letter-spacing: -0.03em;
`;
const nav = css`
  display: flex;
  gap: 1rem;
  & a {
    color: var(--muted);
    text-decoration: none;
  }
  & a:hover {
    color: var(--text);
  }
`;
const hero = css`
  padding-block: clamp(5rem, 12vw, 9rem);
`;
const kicker = css`
  margin: 0 0 1rem;
  color: var(--accent);
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;
const title = css`
  max-width: 850px;
  margin: 0;
  font-size: clamp(2.7rem, 8vw, 6rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
`;
const lede = css`
  max-width: 690px;
  margin: 1.5rem 0 0;
  color: var(--muted);
  font-size: clamp(1.1rem, 2vw, 1.35rem);
`;
const actions = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
`;
const primary = css`
  display: inline-flex;
  border: 1px solid var(--accent);
  border-radius: 0.6rem;
  padding: 0.65rem 1rem;
  background: var(--accent);
  color: var(--bg);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
`;
const secondary = css`
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 0.6rem;
  padding: 0.65rem 1rem;
  text-decoration: none;
`;
const section = css`
  padding-block: 4rem;
  border-top: 1px solid var(--line);
  & > h2 {
    margin-top: 0;
    font-size: 2rem;
    letter-spacing: -0.035em;
  }
`;
const grid = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
`;
const card = css`
  border: 1px solid var(--line);
  border-radius: 0.8rem;
  padding: 1.25rem;
  background: var(--surface);
  & p {
    margin-bottom: 0;
    color: var(--muted);
  }
`;
const cardTitle = css`
  margin: 0;
  font-size: 1.05rem;
`;
const code = css`
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 0.8rem;
  padding: 1.25rem;
  background: #0c1020;
  color: #dce6ff;
`;
const counter = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  color: var(--muted);
`;
const themes = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
const themeButton = css`
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  background: var(--surface);
  color: var(--text);
  text-transform: capitalize;
  cursor: pointer;
`;
const activeTheme = css`
  border-color: var(--accent);
  outline: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
`;
const footer = css`
  padding-block: 3rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
`;

export const styledStaticStyles: ShowcaseStyles = {
  page,
  shell,
  header,
  brand,
  nav,
  hero,
  kicker,
  title,
  lede,
  actions,
  primary,
  secondary,
  section,
  grid,
  card,
  cardTitle,
  code,
  counter,
  themes,
  themeButton,
  activeTheme,
  footer,
};
