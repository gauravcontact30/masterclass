"use client";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import styles from "./landing-daily-card.module.css";

/**
 * The "New today" card a landing section shows above its own content: the day's AI-written addition
 * (lib/server/landing-fresh.ts) with its painted picture, or the section's icon when the picture failed.
 * Pictures come from the learning-images bucket, so they are plain <img> like the other card pictures.
 */
export function DailyCard({ kicker, title, image, icon, day, children }: Readonly<{ kicker: string; title: string; image: string | null; icon: ReactNode; day: string; children: ReactNode }>) {
  return <article className={styles.card} aria-label={`${kicker}: ${title}`}>
    <div className={styles.picture}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the learning-images bucket. */}
      {image ? <img src={image} alt="" loading="lazy" decoding="async" /> : <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span className={styles.badge}><Sparkles size={12} aria-hidden="true" />New today · <time dateTime={day}>{new Date(`${day}T12:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}</time></span>
    </div>
    <div className={styles.body}>
      <p className={styles.kicker}>{kicker}</p>
      <h3 className={styles.title}>{title}</h3>
      {children}
    </div>
  </article>;
}

/** The day's multiple-choice question, answer hidden until opened. */
export function DailyChoice({ question, options, answer, why, reveal }: Readonly<{ question: string; options: string[]; answer: number; why: string; reveal: string }>) {
  return <details>
    <summary>{question}</summary>
    <ol className={styles.options}>{options.map((option, k) => <li key={k} data-correct={k === answer || undefined}>{option}</li>)}</ol>
    <p><b>{reveal}</b> {why}</p>
  </details>;
}
