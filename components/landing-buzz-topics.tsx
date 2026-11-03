"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import styles from "./landing-tech-buzz.module.css";

/** How long each set of four technologies stays (user request 2026-11-03). */
const INTERVAL = 5_000;

/*
 * The moving part of the technology pills in the Tech Buzz article (components/landing-tech-buzz.tsx). Every set is
 * server-rendered and they share one grid cell, so the row keeps its height; this only flips `data-active`, without a
 * React render. It waits while off screen, hovered or in a hidden tab, and the pause button stops it (WCAG 2.2.2).
 */
export function BuzzTopics({ count, label, hi = false, children }: Readonly<{ count: number; label: string; hi?: boolean; children: ReactNode }>) {
  const [paused, setPaused] = useState(false);
  const sets = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  const shown = useRef(0);
  useEffect(() => {
    const box = sets.current;
    if (paused || count < 2 || !box) return;
    let seen = false;
    const observer = new IntersectionObserver(entries => { seen = entries.some(entry => entry.isIntersecting); });
    observer.observe(box);
    const timer = window.setInterval(() => {
      if (!seen || held.current || document.visibilityState !== "visible") return;
      shown.current = (shown.current + 1) % count;
      [...box.children].forEach((set, at) => set.toggleAttribute("data-active", at === shown.current));
    }, INTERVAL);
    return () => { window.clearInterval(timer); observer.disconnect(); };
  }, [paused, count]);
  return <div className={styles.topics} role="group" aria-label={label} onMouseEnter={() => { held.current = true; }} onMouseLeave={() => { held.current = false; }}>
    <div className={styles.topicsHead}>
      <span>{label}</span>
      {count > 1 && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? (hi ? "चलाएँ" : "Play technologies") : (hi ? "रोकें" : "Pause technologies")}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>}
    </div>
    <div ref={sets} className={styles.topicSets}>{children}</div>
  </div>;
}
