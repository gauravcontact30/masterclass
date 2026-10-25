"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import styles from "./back-to-top.module.css";

const RING = 2 * Math.PI * 22;

/**
 * "Move to top" on the landing page, the learning dashboard, and the super admin dashboard: a round button that appears after the first
 * screen, cycles through five light tones (one every five seconds), draws scroll progress around its edge and
 * shows a tooltip on hover or focus. It sits above the Study Buddy launcher on the same edge.
 */
export function BackToTop() {
  const pathname = usePathname();
  const enabled = pathname === "/" || pathname?.startsWith("/learning") || pathname?.startsWith("/tech-buzz");
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [enabled, pathname]);

  if (!enabled) return null;
  const toTop = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    // Keyboard users continue from the top of the page, not from the button.
    document.querySelector<HTMLElement>("main, [role=main]")?.focus?.({ preventScroll: true });
  };
  return <button type="button" className={styles.button} data-visible={visible || undefined} aria-label="Move to top" aria-hidden={!visible || undefined} tabIndex={visible ? 0 : -1} onClick={toTop}>
    <svg className={styles.ring} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" className={styles.track} />
      <circle cx="24" cy="24" r="22" className={styles.progress} strokeDasharray={RING} strokeDashoffset={RING * (1 - progress)} />
    </svg>
    <ArrowUp size={18} strokeWidth={2.4} className={styles.arrow} aria-hidden="true" />
    <span className={styles.tooltip} role="tooltip">Move to top</span>
  </button>;
}
