"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Enter-on-scroll state for a landing section. Starts undefined so server HTML
 * and no-JS readers see everything; only a section the observer reports as
 * below the fold is hidden ("wait") and then revealed ("in") once. CSS gates
 * the hidden state behind prefers-reduced-motion: no-preference.
 */
export function useReveal<T extends Element>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<"wait" | "in">();
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setState("in"); observer.disconnect(); }
      else setState(current => current ?? "wait");
    }, { rootMargin: "0px 0px -12% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, state] as const;
}
