"use client";
import { useEffect, useState, type RefObject } from "react";

/** Load optional content once, shortly before it scrolls into view. */
export function useNearViewport<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      // Older browsers must still be able to access the content.
      const timer = setTimeout(() => setReady(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin: "600px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return ready;
}
