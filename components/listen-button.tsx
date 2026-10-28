"use client";
import { useSyncExternalStore, type MouseEvent } from "react";
import { Loader2, Pause } from "lucide-react";
import { audioState, listen, serverAudioState, subscribe } from "@/lib/audio-lecture";
import { useLanguage } from "./language-provider";
import styles from "./listen-button.module.css";

/**
 * "Listen" on a learning card: reads the card aloud as an audio lecture in the learner's chosen voice and speed
 * (the dock that appears holds the controls). `text` may be plain text or HTML, or a function given the button (to
 * read the card around it when pressed); `id` must be unique per card so
 * pressing the same card's button again pauses and resumes it. It is an icon everywhere, with "Listen" (or Pause,
 * Resume) as its hover tooltip; `compact` is the smaller size used inside cards.
 */
export function ListenButton({ id, title, text, compact = false, tone = "light", className }: { id: string; title: string; text: string | ((button: HTMLButtonElement) => string); compact?: boolean; tone?: "light" | "dark"; className?: string }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const audio = useSyncExternalStore(subscribe, audioState, serverAudioState);
  const mine = audio.id === id;
  const status = mine ? audio.status : "idle";
  const label = status === "playing" ? (hi ? "रोकें" : "Pause") : status === "paused" ? (hi ? "जारी रखें" : "Resume") : status === "loading" ? (hi ? "लोड हो रहा है" : "Loading") : (hi ? "सुनें" : "Listen");
  const press = (event: MouseEvent<HTMLButtonElement>) => {
    // Cards are often links or open a modal on click; the button only ever plays.
    event.preventDefault(); event.stopPropagation();
    listen(id, title, typeof text === "function" ? text(event.currentTarget) : text);
  };
  const Icon = status === "playing" ? Pause : status === "loading" ? Loader2 : null;
  return <button type="button" className={`${styles.listen} ${className ?? ""}`} data-tone={tone} data-compact={compact || undefined} data-state={status} onClick={press}
    aria-label={`${label}: ${title}`} aria-pressed={mine && (status === "playing" || status === "loading")} data-tooltip={label} suppressHydrationWarning>
    {/* The idle speaker is a CSS mask, not an inline SVG: the landing page alone renders ~60 of these buttons. */}
    {Icon ? <Icon size={compact ? 15 : 16} aria-hidden="true" className={status === "loading" ? styles.spin : undefined} /> : <span className={styles.speaker} aria-hidden="true" />}
    {status === "playing" && <span className={styles.bars} aria-hidden="true"><i /><i /><i /></span>}
  </button>;
}
