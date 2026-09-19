"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./pager.module.css";

/**
 * The pages to draw: all of them while they fit, otherwise the first, the last,
 * the current and its neighbours, with a gap standing in for each run skipped.
 * A row of thirteen numbered buttons is not navigation, it is a wall.
 */
export function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index);
  const near = new Set([0, pages - 1, page, page - 1, page + 1]);
  // Keep the row a constant width: near an end, spend the freed slots there.
  if (page <= 2) [1, 2, 3].forEach(index => near.add(index));
  if (page >= pages - 3) [pages - 2, pages - 3, pages - 4].forEach(index => near.add(index));
  const shown = [...near].filter(index => index >= 0 && index < pages).sort((a, b) => a - b);
  return shown.flatMap((index, position) =>
    position && index - shown[position - 1] > 1 ? ["gap" as const, index] : [index]);
}

/** One pager, used by the answer history and by every catalogue grid. */
export function Pager({ page, pages, onPage, label }: {
  page: number; pages: number; onPage: (page: number) => void; label: string;
}) {
  return <nav className={styles.pager} aria-label={label}>
    <button type="button" className={styles.pagerStep} disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page">
      <ChevronLeft size={15} aria-hidden="true" />
    </button>
    <div className={styles.pagerPages}>
      {pageWindow(page, pages).map((index, position) => index === "gap"
        ? <span key={`gap-${position}`} className={styles.pagerGap} aria-hidden="true">…</span>
        : <button key={index} type="button" className={styles.pagerPage}
            aria-label={`Page ${index + 1}`} aria-current={index === page ? "page" : undefined} onClick={() => onPage(index)}>{index + 1}</button>)}
    </div>
    <button type="button" className={styles.pagerStep} disabled={page === pages - 1} onClick={() => onPage(page + 1)} aria-label="Next page">
      <ChevronRight size={15} aria-hidden="true" />
    </button>
  </nav>;
}
