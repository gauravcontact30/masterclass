"use client";
import { ContentImage } from "./content-image";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./learning-picture.module.css";

/**
 * A generated illustration (lib/learning-image.ts) for a learning card or page:
 * an API entry or package, a workflow, an Official Docs technology, a note, a
 * lesson, a guide or a learning path.
 *
 * Which subjects have a picture is not known up front, so this asks and steps
 * aside when the request fails: the layout reads exactly as it did without one. A card in a grid passes `fallback`,
 * which takes the picture's place, so a subject with no picture yet never leaves a blank gap in its card.
 * `card` sits flush across the top of a card; `hero` heads a reading page.
 */
export function LearningPicture({ src, alt, variant = "hero", className, fallback }: { src: string | null; alt: string; variant?: "card" | "hero"; className?: string; fallback?: ReactNode }) {
  // Keyed on the source, so moving to another entry gets a fresh try.
  const [failed, setFailed] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  // A server-rendered image can fail before hydration, when no onError handler is listening yet.
  useEffect(() => {
    const image = box.current?.querySelector("img");
    if (src && image?.complete && !image.naturalWidth) setFailed(src);
  }, [src]);
  if (!src || failed === src) return fallback ? <div className={className ? `${styles[variant]} ${className}` : styles[variant]}>{fallback}</div> : null;
  return <div ref={box} className={className ? `${styles[variant]} ${className}` : styles[variant]}>
    <ContentImage src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(src)} />
  </div>;
}
