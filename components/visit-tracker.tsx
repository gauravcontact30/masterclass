"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Set by the early page-view beacon in <head> (lib/early-track.ts). */
declare global { interface Window { __mcEarly?: { path: string; sent: boolean; taken: boolean } } }

/** The referrer belongs to the page load, not to every client-side navigation after it. */
let referrerSent = false;

function send(body: Record<string, unknown>) {
  const data = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([data], { type: "application/json" }))) return;
  } catch { /* fall through */ }
  fetch("/api/track", { method: "POST", body: data, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
}

/** How often a visible page tells the Live visitor stream it is still being read (see app/api/track). */
const HEARTBEAT_MS = 45_000;

/**
 * Records page views and time on page for the super admin's User activities page (/api/track).
 * Time on page counts only while the page is visible: hiding the tab sends a leave beacon for the stretch so far,
 * and coming back starts a new stretch (with a heartbeat, so the visitor shows as reading again at once).
 * Kept tiny and dependency-free because it rides in the root layout on every page.
 */
export function VisitTracker() {
  const pathname = usePathname();
  // The open page and when its current visible stretch began (null while the tab is hidden).
  const open = useRef<{ path: string; since: number | null } | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/super-admin")) return;
    const pause = () => {
      const page = open.current; if (page?.since == null) return;
      send({ type: "leave", path: page.path, duration: Math.round(performance.now() - page.since) });
      page.since = null;
    };
    const leave = () => { pause(); open.current = null; };
    leave();
    // The first page's view was already sent by the early beacon in <head> (lib/early-track.ts): adopt it, timing the
    // page from navigation start so the seconds before hydration count too.
    const early = window.__mcEarly;
    if (early && !early.taken && early.sent && early.path === pathname) {
      early.taken = true;
      referrerSent = true;
      open.current = { path: pathname, since: document.visibilityState === "hidden" ? null : 0 };
    }
    if (early) early.taken = true;
    // Wait a moment so document.title is the new page's, not the previous one's.
    const timer = setTimeout(() => {
      if (open.current?.path === pathname) return;
      const params = new URLSearchParams(location.search);
      send({
        type: "view", path: pathname, title: document.title,
        referrer: referrerSent ? null : document.referrer || null,
        utm: { source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign") },
        language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: `${screen.width}x${screen.height}`,
      });
      referrerSent = true;
      open.current = { path: pathname, since: document.visibilityState === "hidden" ? null : performance.now() };
    }, 400);
    const beat = () => {
      const page = open.current;
      if (page?.since != null && document.visibilityState === "visible") send({ type: "ping", path: page.path, duration: Math.round(performance.now() - page.since) });
    };
    const heartbeat = setInterval(beat, HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") return pause();
      if (open.current && open.current.since == null) { open.current.since = performance.now(); beat(); }
    };
    // Only UI labels and route paths: never typed text, form values or query strings.
    const onClick = (event: MouseEvent) => {
      if (pathname !== "/" && !pathname.startsWith("/learning")) return;
      const control = event.target instanceof Element ? event.target.closest<HTMLElement>("a,button,summary,[data-track-option]") : null;
      if (!control || control.closest('form,[contenteditable="true"],[data-track-ignore]')) return;
      const option = (control.dataset.trackOption || control.getAttribute("aria-label") || control.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100);
      if (!option) return;
      let targetPath: string | null = null;
      if (control instanceof HTMLAnchorElement) {
        try { const url = new URL(control.href); if (url.origin === location.origin) targetPath = `${url.pathname}${url.hash}`.slice(0, 300); } catch { /* not navigable */ }
      }
      const container = control.closest("[data-track-topic],article,section");
      const topic = (container?.getAttribute("data-track-topic") || container?.querySelector("h2,h3,h1")?.textContent || container?.id || pathname.split("/").filter(Boolean).slice(1).join(" / ") || "General").trim().slice(0, 120);
      send({ type: "interaction", path: pathname, topic, option, target_path: targetPath });
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onClick);
    return () => { clearTimeout(timer); clearInterval(heartbeat); document.removeEventListener("visibilitychange", onVisibility); document.removeEventListener("click", onClick); leave(); };
  }, [pathname]);

  return null;
}
