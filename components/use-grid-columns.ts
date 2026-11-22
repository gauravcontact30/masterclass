"use client";
import { useEffect, useState, type RefObject } from "react";

/** How many cards fit in one row of a CSS grid right now, read from its resolved columns (so a page can be N full rows). */
export function useGridColumns(ref: RefObject<HTMLElement | null>, fallback = 4) {
  const [columns, setColumns] = useState(fallback);
  useEffect(() => {
    const grid = ref.current; if (!grid) return;
    const read = () => setColumns(Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length));
    read(); const observer = new ResizeObserver(read); observer.observe(grid);
    return () => observer.disconnect();
  }, [ref]);
  return columns;
}
