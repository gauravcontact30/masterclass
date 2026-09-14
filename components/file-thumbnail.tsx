import type { CSSProperties } from "react";
import styles from "./file-thumbnail.module.css";

/*
 * Library card art: a small, pure-CSS spiral-bound notebook page rather than
 * a generic file icon, so the list costs no extra network work. Each
 * technology gets its own accent (spine tab, margin rule, bullet dots) so a
 * shelf of guides reads apart at a glance.
 *
 * Everything is sized in `em`, so a wrapper can scale the whole object by
 * setting `--thumb-size`. Decorative: the card around it carries the title.
 */
const ACCENTS: Record<string, string> = {
  python: "#2f6ea5", claude: "#c1583a", "claude-code": "#c1583a", ai: "#6a4fd8", "llm-engineering": "#6a4fd8",
  jest: "#99425b", rtl: "#c42b2a", vitest: "#5f8a12", playwright: "#23893a", nextjs: "#1f2328", react: "#087ea4",
  zustand: "#8a5a2b", javascript: "#9a7b00", typescript: "#3178c6", aws: "#b86e00", devops: "#0f766e", "tanstack-start": "#0e7490",
};

/** A stable accent per technology; unknown ids get a deterministic hue so they still differ from each other. */
export function technologyAccent(technologyId: string) {
  if (ACCENTS[technologyId]) return ACCENTS[technologyId];
  let hash = 0;
  for (const char of technologyId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 55% 36%)`;
}

export function NotesThumbnail({ title, technologyId = "", label = "" }: { title: string; technologyId?: string; label?: string }) {
  return (
    <div className={styles.thumb} aria-hidden="true" style={{ "--th-accent": technologyAccent(technologyId) } as CSSProperties}>
      <div className={styles.notebook}>
        <span className={styles.rings}>{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</span>
        <span className={styles.margin} />
        {label && <span className={styles.tab}>{label}</span>}
        <span className={styles.noteTitle}>{title}</span>
        <span className={styles.noteRows}>
          {[88, 64, 76, 52].map((width, i) => <span key={i}><i /><b style={{ width: `${width}%` }} /></span>)}
        </span>
      </div>
    </div>
  );
}
