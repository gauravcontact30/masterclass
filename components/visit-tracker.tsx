"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Set by the early page-view beacon in <head> (lib/early-track.ts). */
declare global { interface Window { __mcEarly?: { path: string; sent: boolean; taken: boolean; since?: number | null; pending?: Promise<unknown>; priv?: boolean | null } } }

/** The referrer belongs to the page load, not to every client-side navigation after it. */
let referrerSent = false;
let pending: Promise<unknown> | undefined;

function send(body: Record<string, unknown>) {
  const data = JSON.stringify(body);
  // Await the first response's Set-Cookie before sending a heartbeat/leave. Concurrent first beacons
  // otherwise create different visitor/session IDs and can overwrite the source cookie.
  pending = (pending ?? window.__mcEarly?.pending ?? Promise.resolve()).then(() =>
    fetch("/api/track", { method: "POST", body: data, keepalive: true, signal: AbortSignal.timeout(10_000), headers: { "content-type": "application/json" } })
  ).catch(() => {});
}

/** A page must stay visible this long before it counts as a visit: 0-second bounces are never recorded (lib/early-track.ts). */
const MIN_SEEN_MS = 1000;
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
    if (!pathname || /^\/(?:dashboard\/)?super-admin(?:\/|$)/.test(pathname)) return;
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
    // The page load itself (not a later client-side navigation), whose view the early beacon has not sent yet.
    const firstPage = !!early && !early.taken && early.path === pathname;
    if (early && !early.taken && early.sent && early.path === pathname) {
      early.taken = true;
      referrerSent = true;
      open.current = { path: pathname, since: document.visibilityState === "hidden" ? null : early.since ?? performance.now() };
    }
    if (early) early.taken = true;
    // Send the view once the page has been visible for MIN_SEEN_MS (which also lets document.title become the new
    // page's): a page closed or left sooner is not recorded at all. Time on page still counts from when it opened.
    let opened = firstPage ? early?.since ?? performance.now() : performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const record = () => {
      if (open.current?.path === pathname) return;
      if (document.visibilityState === "hidden") return;
      const params = new URLSearchParams(location.search);
      send({
        type: "view", path: pathname, title: document.title,
        referrer: referrerSent ? null : document.referrer || null,
        utm: { source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign") },
        language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: `${screen.width}x${screen.height}`,
        // Asked once per page load by the early beacon: a private window stays private across client-side navigation.
        private: window.__mcEarly?.priv ?? null,
      });
      referrerSent = true;
      open.current = { path: pathname, since: opened };
      // The first heartbeat goes with the view, so the Live stream shows this reader's real time at once instead of
      // 0 s until the next HEARTBEAT_MS tick.
      beat();
    };
    // The first page counts from navigation start, so the seconds before hydration count towards the minimum.
    const seen = () => { clearTimeout(timer); if (document.visibilityState === "visible") timer = setTimeout(record, Math.max(400, MIN_SEEN_MS - (performance.now() - opened))); };
    seen();
    const beat = () => {
      const page = open.current;
      if (page?.since != null && document.visibilityState === "visible") send({ type: "ping", path: page.path, duration: Math.round(performance.now() - page.since) });
    };
    const heartbeat = setInterval(beat, HEARTBEAT_MS);
    const onVisibility = () => {
      // Hidden before it counted: nothing is sent until the page is visible again.
      if (!open.current) {
        if (document.visibilityState === "hidden") { clearTimeout(timer); return; }
        opened = performance.now();
        seen();
        return;
      }
      if (document.visibilityState === "hidden") return pause();
      if (open.current && open.current.since == null) { open.current.since = performance.now(); beat(); }
    };
    // Only UI labels and route paths: never typed text, form values or query strings.
    const onClick = (event: MouseEvent) => {
      if (pathname !== "/" && !pathname.startsWith("/learning") && !pathname.startsWith("/tech-buzz")) return;
      const control = event.target instanceof Element ? event.target.closest<HTMLElement>("a,button,summary,[data-track-option]") : null;
      if (!control || control.closest('form,[contenteditable="true"],[data-track-ignore]')) return;
      const option = (control.dataset.trackOption || control.getAttribute("aria-label") || control.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100);
      if (!option) return;
      let targetPath: string | null = null;
      if (control instanceof HTMLAnchorElement) {
        try { const url = new URL(control.href); if (url.origin === location.origin) targetPath = `${url.pathname}${url.hash}`.slice(0, 300); } catch { /* not navigable */ }
      }
      // A named section (data-track-topic) wins over a card's own <article> inside it.
      const container = control.closest("[data-track-topic]") ?? control.closest("article,section");
      const topic = (container?.getAttribute("data-track-topic") || container?.querySelector("h2,h3,h1")?.textContent || container?.id || pathname.split("/").filter(Boolean).slice(1).join(" / ") || "General").trim().slice(0, 120);
      send({ type: "interaction", path: pathname, topic, option, target_path: targetPath });
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onClick);
    // pagehide also covers navigation/unload paths where visibilitychange is absent. pause is idempotent.
    const onPageHide = () => { clearTimeout(timer); pause(); };
    const onPageShow = () => { if (document.visibilityState === "visible") onVisibility(); };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => { clearTimeout(timer); clearInterval(heartbeat); document.removeEventListener("visibilitychange", onVisibility); document.removeEventListener("click", onClick); window.removeEventListener("pagehide", onPageHide); window.removeEventListener("pageshow", onPageShow); leave(); };
  }, [pathname]);

  return null;
}
