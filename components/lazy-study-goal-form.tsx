"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// The form brings Conform and zod (~400 KB raw). On the landing page it sits far
// below the fold, so it loads as the visitor scrolls toward it, not with the page.
const placeholder = <div style={{ minHeight: 320 }} />;
const ConformStudyGoalForm = dynamic(() => import("./conform-form").then(m => m.ConformStudyGoalForm), { ssr: false, loading: () => placeholder });

export function LazyStudyGoalForm({ defaultCategory }: { defaultCategory?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // The reserved height keeps content below from shifting while the chunk is in flight.
  return <div ref={ref}>{near ? <ConformStudyGoalForm defaultCategory={defaultCategory} /> : placeholder}</div>;
}
