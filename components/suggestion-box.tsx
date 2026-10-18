"use client";
import { lazy, Suspense, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import styles from "./suggestion-box.module.css";

// The dialog, form and tracking view load on first use, so the landing navbar ships only this button.
const loadPanel = () => import("./suggestion-box-panel");
const SuggestionBoxPanel = lazy(loadPanel);

/**
 * The landing header's Suggestion Box: a pill that cross-fades through six light tones (one every ten seconds),
 * with a slow shimmer and a "live" dot. Below desktop widths it becomes a round icon button with the same motion.
 */
export function SuggestionBox({ label = "Suggestion Box" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const preload = () => { void loadPanel(); };
  return <>
    <button ref={trigger} type="button" className={styles.trigger} aria-haspopup="dialog" aria-expanded={open}
      onPointerEnter={preload} onFocus={preload} onClick={() => { setMounted(true); setOpen(true); }}>
      <span className={styles.triggerIcon} aria-hidden="true"><MessageSquarePlus size={16} strokeWidth={2} /></span>
      <span className={styles.triggerLabel}>{label}</span>
      <span className={styles.liveDot} aria-hidden="true" />
    </button>
    {mounted && <Suspense fallback={null}><SuggestionBoxPanel open={open} onOpenChange={setOpen} returnFocus={trigger} /></Suspense>}
  </>;
}
