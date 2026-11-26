import type { CSSProperties } from "react";
import { Lock } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { TECH_ICON } from "./streams-icons";
import { clockTime, playlist, playlistQuality, quality, QUALITY_NAME, techInfo, type StreamStep, type StreamTech } from "@/lib/streams";
import styles from "./streams-cover.module.css";

/*
 * Master Class Buddy covers for Streams (2026-11-26): a picture only, never a sentence, so nothing can overlap. The MCB
 * mark, the subject's icon large in a glass tile, the measured quality and a short label (step count, or "Step 04"
 * and the length). Titles go under the cover, in the card. Drawn with CSS: a page of covers downloads no images, and
 * its sizes follow the cover's own width (container query units), from a 112px playlist row to a wide card.
 */
type CoverProps = { size?: "sm" | "md"; locked?: boolean; stepWord?: string };

export function McbCover({ tech, step, size = "md", locked = false, stepWord = "Step", stepsWord = "steps" }: CoverProps & { tech: StreamTech; step?: StreamStep; stepsWord?: string }) {
  const info = techInfo(tech); const Icon = TECH_ICON[tech];
  const q = step ? quality(step.id) : playlistQuality(tech);
  return <span className={styles.cover} data-size={size} data-locked={locked || undefined} style={{ "--accent": info.color } as CSSProperties} aria-hidden="true">
    <span className={styles.brand}><span className={styles.mark}><BrandMark size={40} /></span>{size === "md" && <b>MCB</b>}</span>
    {size === "md" && <span className={styles.quality} data-q={q}>{!step && q !== "1080p" ? `Up to ${q === "4K" ? "4K" : "1440p"}` : QUALITY_NAME[q]}</span>}
    <span className={styles.icon}>{locked ? <Lock /> : <Icon strokeWidth={1.6} />}</span>
    <span className={styles.label}>{step ? `${stepWord} ${String(step.step).padStart(2, "0")}` : `${playlist(tech).steps.length} ${stepsWord}`}</span>
    {step && size === "md" && <span className={styles.time}>{clockTime(step.seconds)}</span>}
  </span>;
}
