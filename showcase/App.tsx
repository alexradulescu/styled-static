import { useState, type ComponentType } from "react";
import { showcaseContent as copy } from "./content";

export interface ShowcaseStyles {
  Styles?: ComponentType;
  page: string;
  shell: string;
  header: string;
  brand: string;
  nav: string;
  hero: string;
  kicker: string;
  title: string;
  lede: string;
  actions: string;
  primary: string;
  secondary: string;
  section: string;
  grid: string;
  card: string;
  cardTitle: string;
  code: string;
  counter: string;
  themes: string;
  themeButton: string;
  activeTheme: string;
  footer: string;
}

const themes = ["system", "light", "dark", "copper"] as const;
type Theme = (typeof themes)[number];

function resolvedTheme(theme: Theme): Exclude<Theme, "system"> {
  if (theme !== "system") return theme;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ShowcaseApp({ styles }: { styles: ShowcaseStyles }) {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState<Theme>("system");
  const Styles = styles.Styles;

  function chooseTheme(nextTheme: Theme): void {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = resolvedTheme(nextTheme);
  }

  return (
    <div className={styles.page}>
      {Styles ? <Styles /> : null}
      <header className={styles.header}>
        <div className={styles.shell}>
          <a className={styles.brand} href="#top">
            {copy.brand}
          </a>
          <nav className={styles.nav} aria-label="Primary navigation">
            <a href="#features">Features</a>
            <a href="#example">Example</a>
            <a href="#themes">Themes</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className={`${styles.hero} ${styles.shell}`}>
          <p className={styles.kicker}>{copy.kicker}</p>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.lede}>{copy.lede}</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#example">
              See the API
            </a>
            <a className={styles.secondary} href="https://github.com/alexradulescu/styled-static">
              GitHub
            </a>
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.shell}`}
          id="features"
          aria-labelledby="features-title"
        >
          <h2 id="features-title">Why it stays simple</h2>
          <div className={styles.grid}>
            {copy.features.map(([title, description]) => (
              <article className={styles.card} key={title}>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.shell}`}
          id="example"
          aria-labelledby="example-title"
        >
          <h2 id="example-title">One static definition</h2>
          <pre className={styles.code}>
            <code>{`const Button = styled.button\`
  padding: 0.65rem 1rem;
  background: royalblue;
  color: white;
\`;`}</code>
          </pre>
          <div className={styles.counter}>
            <button
              className={styles.primary}
              onClick={() => setCount((value) => value + 1)}
              type="button"
            >
              Count: {count}
            </button>
            <span>State stays ordinary React state.</span>
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.shell}`}
          id="themes"
          aria-labelledby="themes-title"
        >
          <h2 id="themes-title">Application-owned themes</h2>
          <p>Choose system, light, dark, or a custom copper palette.</p>
          <div className={styles.themes} role="group" aria-label="Theme">
            {themes.map((choice) => (
              <button
                className={`${styles.themeButton} ${theme === choice ? styles.activeTheme : ""}`}
                key={choice}
                onClick={() => chooseTheme(choice)}
                type="button"
              >
                {choice}
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className={`${styles.footer} ${styles.shell}`}>React 19 · Vite 8 · Node 24+</footer>
    </div>
  );
}
