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
 * `fitHeight` makes the track as tall as the screen on show instead of its tallest slide, so a short slide leaves
 * no blank band below it; the height follows the slide as its content loads or wraps.
 */
export function usePagedCarousel<T extends HTMLElement>(itemCount: number, perScreen: number, intervalMs: number, { fitHeight = false }: { fitHeight?: boolean } = {}) {
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
  useEffect(() => {
    const el = track.current; if (!fitHeight || !el || typeof ResizeObserver === "undefined") return;
    // Slides keep their own height (not the row's), the track clips the rest of the row to the screen on show.
    el.style.alignItems = "start"; el.style.overflowY = "hidden";
    el.style.transition = reduced ? "" : "height .35s ease";
    let frame = 0;
    const fit = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        const shown = Array.from(el.children).slice(page * perScreen, page * perScreen + perScreen) as HTMLElement[];
        if (shown.length) el.style.height = `${Math.max(...shown.map(slide => slide.offsetHeight))}px`;
      });
    };
    // Every slide is watched (content loads in, text wraps), and slides added after hydration are picked up too.
    const resize = new ResizeObserver(fit);
    const watch = () => { resize.disconnect(); Array.from(el.children).forEach(slide => resize.observe(slide)); fit(); };
    const added = new MutationObserver(watch);
    added.observe(el, { childList: true });
    watch();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); added.disconnect(); };
  }, [fitHeight, page, perScreen, reduced, nearViewport]);
  useEffect(() => { if (!playing || held || !visible || reduced) return; const timer = setTimeout(() => goTo(page + 1), intervalMs); return () => clearTimeout(timer); }, [playing, held, visible, reduced, page, goTo, intervalMs]);

  const holdProps = { onMouseEnter: () => setHeld(true), onMouseLeave: () => setHeld(false), onFocus: () => setHeld(true), onBlur: () => setHeld(false) };
  return { track, nearViewport, page, pages, playing, setPlaying, running: playing && !held && visible && !reduced, goTo, holdProps };
}
