import type { CSSProperties } from "react";
import { Lock } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { TECH_ICON } from "./streams-icons";
import { clockTime, quality, techInfo, type StreamStep } from "@/lib/streams";
import styles from "./streams-poster.module.css";

/*
 * Master Class Buddy's own thumbnails for Streams, drawn with CSS and the brand mark: every step and playlist gets the
 * same MCB look in its technology's colour, and a page of cards downloads no images at all. Type scales with the
 * thumbnail's own width (container query units), so one design serves a 112px playlist row and a full-width player.
 */
const QUALITY_LABEL = { "4K": "4K UHD", "1440p": "1440p", "1080p": "1080p HD" } as const;

export function McbPoster({ step, size = "card", locked = false, stepWord = "Step" }: { step: StreamStep; size?: "card" | "stage" | "thumb"; locked?: boolean; stepWord?: string }) {
  const info = techInfo(step.tech); const Icon = TECH_ICON[step.tech]; const q = quality(step.id);
  return <span className={styles.poster} data-size={size} style={{ "--accent": info.color } as CSSProperties} aria-hidden="true">
    <span className={styles.brand}><span className={styles.mark}><BrandMark size={48} /></span>{size !== "thumb" && <span className={styles.brandText}><b>Master Class Buddy</b><small>MCB Streams</small></span>}</span>
    {size !== "thumb" && <span className={styles.quality} data-q={q}>{QUALITY_LABEL[q]}</span>}
    <Icon className={styles.watermark} strokeWidth={1.2} />
    <span className={styles.body}>
      <small>{stepWord} {String(step.step).padStart(2, "0")}</small>
      <b>{step.title}</b>
      {size !== "thumb" && <em>{info.name} · {step.chapter.title}</em>}
    </span>
    {size !== "thumb" && <span className={styles.time}>{clockTime(step.seconds)}</span>}
    {locked && <span className={styles.lock}><Lock /></span>}
  </span>;
}
