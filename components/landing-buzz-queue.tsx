"use client";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import carousel from "./landing-carousel.module.css";
import styles from "./landing-tech-buzz.module.css";

/** Story cards per page of the picker; `data-near` marks the page that holds the current story. */
const PAGE = 4;

/*
 * The moving part of the Tech Buzz reading list (components/landing-tech-buzz.tsx): which story shows, autoplay, pause,
 * arrows, the pager and the story cards. Covers and cards are server-rendered and passed in, so the browser never re-renders them;
 * like CarouselShell this only flips attributes on them. Hovering, focusing inside it, a hidden tab or the pause button
 * stop it (WCAG 2.2.2), and the timer starts over afterwards, so `data-held` empties the row's progress line to match.
 */
export function BuzzQueue({ count, label, interval, hi = false, head, covers, rows }: Readonly<{
  count: number; label: string; interval: number; hi?: boolean; head: ReactNode; covers: ReactNode; rows: ReactNode;
}>) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const queue = useRef<HTMLOListElement>(null);
  const page = Math.floor(index / PAGE);
  const pages = Math.ceil(count / PAGE);
  const go = useCallback((step: number) => setIndex(current => (current + step + count) % count), [count]);
  useEffect(() => {
    if (paused || held || count < 2) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") go(1); }, interval);
    return () => window.clearInterval(timer);
  }, [paused, held, count, interval, go, index]);
  // The server renders story 0 active and the rest inert; this keeps that true for whichever story is current.
  useEffect(() => {
    [...(viewport.current?.children ?? [])].forEach((slide, at) => {
      slide.toggleAttribute("data-active", at === index);
      (slide as HTMLElement).inert = at !== index;
    });
    [...(queue.current?.children ?? [])].forEach((row, at) => {
      row.toggleAttribute("data-active", at === index);
      row.toggleAttribute("data-near", Math.floor(at / PAGE) === page);
      if (at === index) row.querySelector("button")?.setAttribute("aria-current", "true");
      else row.querySelector("button")?.removeAttribute("aria-current");
    });
  }, [index, page]);
  const pick = (event: MouseEvent<HTMLOListElement>) => {
    const at = (event.target as Element).closest<HTMLElement>("[data-at]")?.dataset.at;
    if (at !== undefined) setIndex(Number(at));
  };
  return <div ref={root} className={styles.board} role="region" aria-roledescription="carousel" aria-label={label} data-held={paused || held || undefined}
    onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
    onFocus={() => setHeld(true)} onBlur={event => { if (!root.current?.contains(event.relatedTarget as Node)) setHeld(false); }}>
    {head}
    <div ref={viewport} className={carousel.viewport} aria-live={paused || held ? "polite" : "off"}>{covers}</div>
    <div className={styles.queueHead}>
      <span>{hi ? "एक कहानी चुनिए" : "Pick a story"}</span>
      {pages > 1 && <div className={styles.queuePages}>{Array.from({ length: pages }, (_, at) => <button type="button" key={at} aria-label={hi ? `पेज ${at + 1}` : `Page ${at + 1} of ${pages}`} aria-current={at === page || undefined} onClick={() => setIndex(at * PAGE)}>{at + 1}</button>)}</div>}
      {count > 1 && <div className={styles.queueControls}>
        <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? (hi ? "चलाएँ" : "Play slideshow") : (hi ? "रोकें" : "Pause slideshow")}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
        <button type="button" onClick={() => go(-1)} aria-label={hi ? "पिछला" : "Previous"}><ChevronLeft size={16} /></button>
        <button type="button" onClick={() => go(1)} aria-label={hi ? "अगला" : "Next"}><ChevronRight size={16} /></button>
      </div>}
    </div>
    <ol ref={queue} className={styles.queue} onClick={pick}>{rows}</ol>
  </div>;
}
