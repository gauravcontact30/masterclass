"use client";
import { useEffect, useState } from "react";

/**
 * A counter that goes up every `ms` while the tab is visible, and at once when the tab becomes visible again.
 * Put it in a loader effect's dependencies so a super admin report re-reads itself and never shows stale visitor
 * figures (user request 2026-11-23: Overview and User activities always fresh). Hidden tabs make no requests.
 */
export function useLiveTick(ms = 30_000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => { if (document.visibilityState === "visible") setTick(value => value + 1); };
    const timer = setInterval(bump, ms);
    document.addEventListener("visibilitychange", bump);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", bump); };
  }, [ms]);
  return tick;
}
