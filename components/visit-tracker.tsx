"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** The referrer belongs to the page load, not to every client-side navigation after it. */
let referrerSent = false;

function send(body: Record<string, unknown>) {
  const data = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([data], { type: "application/json" }))) return;
  } catch { /* fall through */ }
  fetch("/api/track", { method: "POST", body: data, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
}

/**
 * Records page views and time on page for the super admin's User activities page (/api/track).
 * Kept tiny and dependency-free because it rides in the root layout on every page.
 */
export function VisitTracker() {
  const pathname = usePathname();
  const open = useRef<{ path: string; started: number } | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/dashboard/super-admin")) return;
    const leave = () => {
      const page = open.current; if (!page) return;
      open.current = null;
      send({ type: "leave", path: page.path, duration: Math.round(performance.now() - page.started) });
    };
    leave();
    // Wait a moment so document.title is the new page's, not the previous one's.
    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      send({
        type: "view", path: pathname, title: document.title,
        referrer: referrerSent ? null : document.referrer || null,
        utm: { source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign") },
        language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: `${screen.width}x${screen.height}`,
      });
      referrerSent = true;
      open.current = { path: pathname, started: performance.now() };
    }, 400);
    const onHide = () => { if (document.visibilityState === "hidden") leave(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", onHide); };
  }, [pathname]);

  return null;
}
