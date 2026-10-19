"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./navigation-progress.module.css";

/*
 * Immediate feedback for every navigation: a thin bar at the top starts the moment an internal link is clicked
 * and completes when the new route renders. Fast navigations finish before its 120 ms fade-in, so it only shows
 * when a route actually takes time (Next's guidance for slow networks; see linking-and-navigating docs).
 * Dependency-free on purpose: it rides in the root layout on every page.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      let url: URL;
      try { url = new URL(link.href); } catch { return; }
      // Same page (or a section on it) is not a navigation.
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      setState("loading");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The route changed: finish the bar, then hide it.
  useEffect(() => {
    queueMicrotask(() => setState(current => current === "loading" ? "done" : current));
    const timer = setTimeout(() => setState(current => current === "done" ? "idle" : current), 350);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  // Never leave a bar stuck if a navigation was cancelled.
  useEffect(() => {
    if (state !== "loading") return;
    const timer = setTimeout(() => setState("idle"), 10000);
    return () => clearTimeout(timer);
  }, [state]);

  return <div className={styles.bar} data-state={state} aria-hidden="true" />;
}
