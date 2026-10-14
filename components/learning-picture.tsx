"use client";

import { useState } from "react";
import styles from "./learning-picture.module.css";

/**
 * A generated illustration (lib/learning-image.ts) for a learning card or page:
 * an API entry or package, a workflow, an Official Docs technology, a note, a
 * lesson, a guide or a learning path.
 *
 * Which subjects have a picture is not known up front, so this asks and steps
 * aside when the request fails: the layout reads exactly as it did without one.
 * `card` sits flush across the top of a card; `hero` heads a reading page.
 */
export function LearningPicture({ src, alt, variant = "hero", className }: { src: string | null; alt: string; variant?: "card" | "hero"; className?: string }) {
  // Keyed on the source, so moving to another entry gets a fresh try.
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return null;
  return <div className={className ? `${styles[variant]} ${className}` : styles[variant]}>
    {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP from the storage bucket; re-optimising it would only add cost. */}
    <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(src)} />
  </div>;
}
