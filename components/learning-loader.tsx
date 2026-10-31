import styles from "./learning-loader.module.css";

/** The five learning symbols that orbit the book, one per subject family, each in its own palette colour. */
const ORBIT = [
  { glyph: "</>", tone: "clay" },
  { glyph: "Aa", tone: "blue" },
  { glyph: "∑", tone: "green" },
  { glyph: "AI", tone: "lavender" },
  { glyph: "?", tone: "amber" },
] as const;

/** Rotating captions; the first one is also the screen-reader label when none is given. */
const CAPTIONS = ["Opening your next lesson…", "Shelving this week's cards…", "Warming up the code lab…", "Turning to the right page…"];

/**
 * The app's loading state: an open book whose page keeps turning, the Claude spark above it and five learning
 * symbols in orbit, over a rotating caption and a multicolour progress bar. Pure CSS, no client JavaScript, so it
 * can be a route's loading.tsx or a dynamic import's fallback. `size="page"` fills a screen area; `"inline"` sits
 * inside a panel while a section's content loads. Motion stops for people who prefer reduced motion.
 */
export function LearningLoader({ label, size = "page" }: Readonly<{ label?: string; size?: "page" | "inline" }>) {
  return <div className={styles.loader} data-size={size} role="status" aria-live="polite">
    <span className={styles.srOnly}>{label ?? CAPTIONS[0]}</span>
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.orbit}>
        {ORBIT.map((item, i) => <span key={item.glyph} className={styles.planet} data-tone={item.tone} style={{ "--i": i } as React.CSSProperties}><b>{item.glyph}</b></span>)}
      </div>
      <svg className={styles.spark} viewBox="0 0 24 24"><path d="M12 1.5l1.6 7.1 6.2-3.9-3.9 6.2 7.1 1.6-7.1 1.6 3.9 6.2-6.2-3.9L12 22.5l-1.6-7.1-6.2 3.9 3.9-6.2L1 12.1l7.1-1.6-3.9-6.2 6.2 3.9z" /></svg>
      <div className={styles.book}>
        <span className={styles.pageLeft} />
        <span className={styles.pageRight} />
        <span className={styles.flip} />
        <span className={styles.flip} />
        <span className={styles.spine} />
      </div>
    </div>
    <p className={styles.captions} aria-hidden="true">{label ? <span>{label}</span> : CAPTIONS.map(caption => <span key={caption}>{caption}</span>)}</p>
    <span className={styles.bar} aria-hidden="true"><i /></span>
  </div>;
}
