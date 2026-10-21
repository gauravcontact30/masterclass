"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useVisiblePlayback } from "./use-visible-playback";
import { useNearViewport } from "./use-near-viewport";

const motionQuery = "(prefers-reduced-motion: reduce)";
const readMotion = () => window.matchMedia?.(motionQuery).matches ?? false;
const serverMotion = () => false;
function subscribeMotion(update: () => void) {
  const query = window.matchMedia?.(motionQuery);
  query?.addEventListener("change", update);
  return () => query?.removeEventListener("change", update);
}

/**
 * A scroll-snap track that turns one screen (one track width) at a time, with autoplay that waits `intervalMs`
 * per screen, pauses while held (hover or focus), loops at the end and starts paused for reduced motion.
 */
export function usePagedCarousel<T extends HTMLElement>(itemCount: number, perScreen: number, intervalMs: number) {
  const track = useRef<T>(null);
  const visible = useVisiblePlayback(track);
  const nearViewport = useNearViewport(track);
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(Math.ceil(itemCount / perScreen));
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);

  // A track with no width yet (hidden, or not laid out) would give NaN pages, so it keeps the last good values.
  const measure = useCallback(() => { const el = track.current; if (!el || !el.clientWidth) return; setPages(Math.max(1, Math.round(el.scrollWidth / el.clientWidth))); setPage(Math.round(el.scrollLeft / el.clientWidth)); }, []);
  const goTo = useCallback((next: number) => { const el = track.current; if (!el) return; const wrapped = ((next % pages) + pages) % pages; el.scrollTo({ left: wrapped * el.clientWidth, behavior: "smooth" }); }, [pages]);

  useEffect(() => {
    const el = track.current; if (!el) return;
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(); });
    };
    // No synchronous measure on mount: reading scrollWidth right after hydration forced a layout per carousel
    // (~400 ms on the landing page). ResizeObserver reports the first size once layout has run anyway.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (observer) observer.observe(el); else schedule();
    el.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      el.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    };
  }, [measure]);
  useEffect(() => { if (!playing || held || !visible || reduced) return; const timer = setTimeout(() => goTo(page + 1), intervalMs); return () => clearTimeout(timer); }, [playing, held, visible, reduced, page, goTo, intervalMs]);

  const holdProps = { onMouseEnter: () => setHeld(true), onMouseLeave: () => setHeld(false), onFocus: () => setHeld(true), onBlur: () => setHeld(false) };
  return { track, nearViewport, page, pages, playing, setPlaying, running: playing && !held && visible && !reduced, goTo, holdProps };
}
