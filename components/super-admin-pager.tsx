import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./super-admin-pager.module.css";

/** Rows per page in the admin tables. */
export const PAGE_SIZE = 5;

/**
 * "Showing 1–5 of 39" with numbered pages. Its own module (no Select, no table) so the public landing comparisons
 * can page without pulling the admin table and Base UI Select into the landing bundle.
 */
export function Pager({ page, pages, total, onPage, size = PAGE_SIZE }: { page: number; pages: number; total: number; onPage: (page: number) => void; size?: number }) {
  if (!total) return null;
  const numbers = [...new Set([1, pages, page - 1, page, page + 1].filter(n => n >= 1 && n <= pages))].sort((a, b) => a - b);
  return <nav className={styles.pager} aria-label="Pages">
    <span>Showing {(page - 1) * size + 1}–{Math.min(total, page * size)} of {total}</span>
    <div>
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
      {numbers.map((n, i) => <span key={n} className={styles.pageGroup}>{i > 0 && n - numbers[i - 1] > 1 && <span className={styles.gap}>…</span>}
        <button type="button" aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}>{n}</button></span>)}
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={14} /></button>
    </div>
  </nav>;
}
