import { ShowcaseApp, type ShowcaseStyles } from "../../../showcase/App";

const styles: ShowcaseStyles = {
  page: "min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans leading-relaxed",
  shell: "w-[min(1080px,calc(100%-2rem))] mx-auto",
  header:
    "sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-xl [&>div]:flex [&>div]:min-h-16 [&>div]:items-center [&>div]:justify-between",
  brand: "font-extrabold no-underline tracking-[-0.03em]",
  nav: "flex gap-4 [&_a]:text-[var(--muted)] [&_a]:no-underline hover:[&_a]:text-[var(--text)]",
  hero: "py-[clamp(5rem,12vw,9rem)]",
  kicker: "m-0 mb-4 text-[var(--accent)] font-bold uppercase tracking-[0.08em]",
  title:
    "max-w-[850px] m-0 text-[clamp(2.7rem,8vw,6rem)] font-bold leading-[0.98] tracking-[-0.06em]",
  lede: "max-w-[690px] mt-6 mb-0 text-[var(--muted)] text-[clamp(1.1rem,2vw,1.35rem)]",
  actions: "flex flex-wrap gap-3 mt-8",
  primary:
    "inline-flex border border-[var(--accent)] rounded-[.6rem] py-[.65rem] px-4 bg-[var(--accent)] text-[var(--bg)] font-bold no-underline cursor-pointer",
  secondary:
    "inline-flex border border-[var(--line)] rounded-[.6rem] py-[.65rem] px-4 no-underline",
  section:
    "py-16 border-t border-[var(--line)] [&>h2]:mt-0 [&>h2]:text-3xl [&>h2]:tracking-[-.035em]",
  grid: "grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4",
  card: "border border-[var(--line)] rounded-[.8rem] p-5 bg-[var(--surface)] [&_p]:mb-0 [&_p]:text-[var(--muted)]",
  cardTitle: "m-0 text-[1.05rem]",
  code: "overflow-auto border border-[var(--line)] rounded-[.8rem] p-5 bg-[#0c1020] text-[#dce6ff]",
  counter: "flex items-center gap-4 mt-4 text-[var(--muted)]",
  themes: "flex flex-wrap gap-2",
  themeButton:
    "border border-[var(--line)] rounded-full py-[.45rem] px-[.8rem] bg-[var(--surface)] text-[var(--text)] capitalize cursor-pointer",
  activeTheme:
    "border-[var(--accent)] outline-2 outline-[color-mix(in_srgb,var(--accent)_35%,transparent)]",
  footer: "py-12 border-t border-[var(--line)] text-[var(--muted)]",
};

export function App() {
  return <ShowcaseApp styles={styles} />;
}
export default App;
