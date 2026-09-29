"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { TechnologyHandbook } from "@/lib/pro-learn/technology-handbooks";

// Authored public course content only. Bound retained data on memory-constrained devices.
const cache = new Map<string, TechnologyHandbook>();

export function DeferredHandbook({ title, children }: { title: string; children: (book: TechnologyHandbook) => ReactNode }) {
  const [book, setBook] = useState(() => cache.get(title));
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (book) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/pro-learn/handbook?title=${encodeURIComponent(title)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Could not load handbook");
        const result: TechnologyHandbook = await response.json();
        if (controller.signal.aborted) return;
        if (cache.size >= 4) cache.delete(cache.keys().next().value!);
        cache.set(title, result);
        setBook(result);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [title, book, attempt]);
  if (book) return children(book);
  return <section aria-label={title} aria-busy={!error} style={{ minHeight: 520, padding: 20 }}>
    <h2>{title}</h2>
    {error ? <><p role="alert">This catalogue could not be loaded.</p><button type="button" onClick={() => { setError(false); setAttempt(value => value + 1); }}>Try again</button></>
      : <p role="status">Loading topics…</p>}
  </section>;
}
