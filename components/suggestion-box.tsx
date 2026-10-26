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
/** `iconOnly`: a round icon button (the label becomes its accessible name and tooltip), as in the landing header. */
export function SuggestionBox({ label = "Suggestion Box", iconOnly = false }: { label?: string; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const preload = () => { void loadPanel(); };
  return <>
    <button ref={trigger} type="button" className={styles.trigger} aria-haspopup="dialog" aria-expanded={open}
      data-icon-only={iconOnly || undefined} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}
      onPointerEnter={preload} onFocus={preload} onClick={() => { setMounted(true); setOpen(true); }}>
      <span className={styles.triggerIcon} aria-hidden="true"><MessageSquarePlus size={16} strokeWidth={2} /></span>
      {!iconOnly && <span className={styles.triggerLabel}>{label}</span>}
      <span className={styles.liveDot} aria-hidden="true" />
    </button>
    {mounted && <Suspense fallback={null}><SuggestionBoxPanel open={open} onOpenChange={setOpen} returnFocus={trigger} /></Suspense>}
  </>;
}
