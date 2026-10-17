"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A scroll-snap track that turns one screen (one track width) at a time, with autoplay that waits `intervalMs`
 * per screen, pauses while held (hover or focus), loops at the end and starts paused for reduced motion.
 */
export function usePagedCarousel<T extends HTMLElement>(itemCount: number, perScreen: number, intervalMs: number) {
  const track = useRef<T>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(Math.ceil(itemCount / perScreen));
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);

  // A track with no width yet (hidden, or not laid out) would give NaN pages, so it keeps the last good values.
  const measure = useCallback(() => { const el = track.current; if (!el || !el.clientWidth) return; setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth))); setPage(Math.round(el.scrollLeft / el.clientWidth)); }, []);
  const goTo = useCallback((next: number) => { const el = track.current; if (!el) return; const wrapped = ((next % pages) + pages) % pages; el.scrollTo({ left: wrapped * el.clientWidth, behavior: "smooth" }); }, [pages]);

  useEffect(() => {
    const el = track.current; if (!el) return; measure();
    el.addEventListener("scroll", measure, { passive: true }); window.addEventListener("resize", measure);
    return () => { el.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [measure]);
  useEffect(() => { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setPlaying(false); }, []);
  useEffect(() => { if (!playing || held) return; const timer = setTimeout(() => goTo(page + 1), intervalMs); return () => clearTimeout(timer); }, [playing, held, page, goTo, intervalMs]);

  const holdProps = { onMouseEnter: () => setHeld(true), onMouseLeave: () => setHeld(false), onFocus: () => setHeld(true), onBlur: () => setHeld(false) };
  return { track, page, pages, playing, setPlaying, running: playing && !held, goTo, holdProps };
}
