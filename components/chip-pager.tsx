"use client";

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import styles from "./chip-pager.module.css";

/*
 * A row of filter chips that never scrolls: the chips are measured and packed into pages that exactly fit the row,
 * with first / previous / next / last buttons and a "2 / 4" counter. The page holding the selected chip is shown whenever
 * the selection or the row's width changes; Page Up / Page Down page through as well.
 */

export type Chip = { id: string; node: ReactNode; selected: boolean; onSelect: () => void };

const GAP = 6;
// The controls' width, reserved on every page except when everything fits on one.
const CONTROLS = 188;
// Narrower rows put the controls on their own line under the chips.
const STACK_BELOW = 560;
const LINES_STACKED = 3;

export function ChipPager({ chips, label, className, chipClassName }: { chips: Chip[]; label: string; className?: string; chipClassName?: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>(() => [chips.map((_, i) => i)]);
  const [stacked, setStacked] = useState(false);
  const selected = chips.findIndex(chip => chip.selected);
  const signature = chips.map(chip => chip.id).join("|");

  useLayoutEffect(() => {
    const row = rowRef.current, measure = measureRef.current;
    if (!row || !measure) return;
    const pack = () => {
      const widths = [...measure.children].map(child => (child as HTMLElement).offsetWidth);
      const total = widths.reduce((sum, width) => sum + width + GAP, -GAP);
      const room = row.clientWidth;
      if (total <= room) { setPages([widths.map((_, i) => i)]); return; }
      const below = room < STACK_BELOW;
      setStacked(below);
      const budget = below ? room : room - CONTROLS;
      // Pack chips into lines that fit, then lines into pages: one line a page, or LINES_STACKED under the controls.
      const lines: number[][] = [[]];
      let used = 0;
      widths.forEach((width, i) => {
        const line = lines[lines.length - 1];
        const needed = (line.length ? GAP : 0) + width;
        if (line.length && used + needed > budget) { lines.push([i]); used = width; }
        else { line.push(i); used += needed; }
      });
      const perPage = below ? LINES_STACKED : 1;
      const next = Array.from({ length: Math.ceil(lines.length / perPage) }, (_, p) => lines.slice(p * perPage, p * perPage + perPage).flat());
      setPages(next);
    };
    pack();
    const observer = new ResizeObserver(pack);
    observer.observe(row);
    return () => observer.disconnect();
  }, [signature]);

  // The page holding the selected chip, until the reader pages away; a new selection or packing brings it back.
  const home = useMemo(() => Math.max(0, pages.findIndex(indices => indices.includes(selected))), [pages, selected]);
  const [manual, setManual] = useState<{ home: number; page: number } | null>(null);
  const count = pages.length;
  const current = Math.min(manual?.home === home ? manual.page : home, count - 1);
  const go = (next: number) => setManual({ home, page: Math.max(0, Math.min(count - 1, next)) });
  const onKeyDown = (event: KeyboardEvent) => {
    if (count < 2) return;
    if (event.key === "PageDown") { event.preventDefault(); go(current + 1); }
    if (event.key === "PageUp") { event.preventDefault(); go(current - 1); }
  };

  return <div ref={rowRef} className={`${styles.row} ${className ?? ""}`} data-stacked={stacked && pages.length > 1 ? "" : undefined} onKeyDown={onKeyDown}>
    {/* Every chip, invisible and out of the flow, so each page can be packed from real widths. */}
    <div ref={measureRef} className={styles.measure} aria-hidden="true" inert>
      {chips.map(chip => <button key={chip.id} type="button" tabIndex={-1} className={chipClassName} aria-pressed={chip.selected}>{chip.node}</button>)}
    </div>
    <div className={styles.chips} role="toolbar" aria-label={count > 1 ? `${label}, page ${current + 1} of ${count}` : label}>
      {(pages[current] ?? []).map(i => { const chip = chips[i]; return chip && <button key={chip.id} type="button" className={chipClassName} aria-pressed={chip.selected} onClick={chip.onSelect}>{chip.node}</button>; })}
    </div>
    {count > 1 && <nav className={styles.controls} aria-label={`${label} pages`}>
      <button type="button" onClick={() => go(0)} disabled={current === 0} aria-label="First page"><ChevronsLeft size={15} aria-hidden="true" /></button>
      <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Previous page"><ChevronLeft size={15} aria-hidden="true" /></button>
      <span className={styles.count} aria-live="polite"><b>{current + 1}</b> / {count}</span>
      <button type="button" onClick={() => go(current + 1)} disabled={current >= count - 1} aria-label="Next page"><ChevronRight size={15} aria-hidden="true" /></button>
      <button type="button" onClick={() => go(count - 1)} disabled={current >= count - 1} aria-label="Last page"><ChevronsRight size={15} aria-hidden="true" /></button>
    </nav>}
  </div>;
}
