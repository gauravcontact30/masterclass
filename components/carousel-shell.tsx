"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import styles from "./landing-carousel.module.css";

/*
 * The moving part of CoverCarousel (components/landing-carousel.tsx): which card shows, autoplay, pause, arrows and dots.
 * The cards themselves are rendered by the server and passed in as children, so the browser never re-renders them;
 * the shell only flips `data-active` and `inert` on them. It moves on every `interval` ms; hovering, focusing inside
 * it, a hidden tab or the pause button stop it (WCAG 2.2.2).
 */
export function CarouselShell({ count, titles, label, idBase, hi = false, interval = 15_000, children }: Readonly<{
  count: number; titles: string[]; label: string; idBase: string; hi?: boolean; interval?: number; children: ReactNode;
}>) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const go = useCallback((step: number) => setIndex(current => (current + step + count) % count), [count]);
  useEffect(() => {
    if (paused || held || count < 2) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") go(1); }, interval);
    return () => window.clearInterval(timer);
  }, [paused, held, count, interval, go, index]);
  // The server renders card 0 active and the rest inert; this keeps that true for whichever card is current.
  useEffect(() => {
    [...(viewport.current?.children ?? [])].forEach((slide, at) => {
      slide.toggleAttribute("data-active", at === index);
      (slide as HTMLElement).inert = at !== index;
    });
  }, [index]);
  return <div ref={root} className={styles.carousel} role="region" aria-roledescription="carousel" aria-label={label}
    onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
    onFocus={() => setHeld(true)} onBlur={event => { if (!root.current?.contains(event.relatedTarget as Node)) setHeld(false); }}>
    <div ref={viewport} className={styles.viewport} aria-live={paused || held ? "polite" : "off"}>{children}</div>
    {count > 1 && <div className={styles.controls}>
      <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? (hi ? "चलाएँ" : "Play slideshow") : (hi ? "रोकें" : "Pause slideshow")}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
      <button type="button" onClick={() => go(-1)} aria-label={hi ? "पिछला" : "Previous"}><ChevronLeft size={16} /></button>
      <div className={styles.dots}>{titles.map((title, at) => <button type="button" key={`${at}-${title}`} aria-label={`${at + 1} / ${count}: ${title}`} aria-current={at === index || undefined} aria-controls={`${idBase}-${at}`} onClick={() => setIndex(at)} />)}</div>
      <button type="button" onClick={() => go(1)} aria-label={hi ? "अगला" : "Next"}><ChevronRight size={16} /></button>
    </div>}
  </div>;
}
