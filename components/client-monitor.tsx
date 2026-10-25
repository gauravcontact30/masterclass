"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

type Vitals = Partial<Record<"LCP" | "INP" | "CLS" | "FCP" | "TTFB", number>>;
type ClientError = { message: string; source: string; line: number | null; kind: "error" | "rejection" };
/** At most this many distinct errors per page view, so a render loop cannot flood the log. */
const MAX_ERRORS = 5;

function send(body: Record<string, unknown>) {
  const data = JSON.stringify(body);
  try { if (navigator.sendBeacon?.("/api/monitoring/client", new Blob([data], { type: "application/json" }))) return; } catch { /* fall through */ }
  fetch("/api/monitoring/client", { method: "POST", body: data, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
}

/**
 * Frontend performance and errors for the super admin's Logs & Health page (/api/monitoring/client): the page's Core
 * Web Vitals and any uncaught script errors, sent once per page as one beacon when the page is hidden or left. Only
 * metric values, the route path and an error's first line and file name are sent; never page content or input.
 */
export function ClientMonitor() {
  const pathname = usePathname();
  const page = useRef<{ path: string; vitals: Vitals; errors: ClientError[]; sent: boolean }>({ path: pathname, vitals: {}, errors: [], sent: false });

  useReportWebVitals(metric => {
    if (metric.name in { LCP: 1, INP: 1, CLS: 1, FCP: 1, TTFB: 1 }) page.current.vitals[metric.name as keyof Vitals] = Math.round(metric.value * (metric.name === "CLS" ? 1000 : 1)) / (metric.name === "CLS" ? 1000 : 1);
  });

  useEffect(() => {
    if (pathname.startsWith("/super-admin")) return;
    const flush = () => {
      const current = page.current;
      if (current.sent || (!Object.keys(current.vitals).length && !current.errors.length)) return;
      current.sent = true;
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType ?? null;
      send({ path: current.path, vitals: current.vitals, errors: current.errors, connection, width: window.innerWidth });
    };
    // A client-side navigation ends the previous page: report it, then start counting for this one.
    flush();
    page.current = { path: pathname, vitals: {}, errors: [], sent: false };
    const record = (error: ClientError) => {
      const list = page.current.errors;
      if (list.length < MAX_ERRORS && !list.some(item => item.message === error.message)) list.push(error);
    };
    const onError = (event: ErrorEvent) => record({ message: String(event.message || "Script error").slice(0, 200), source: (event.filename || "").split("/").pop()?.split("?")[0]?.slice(0, 80) ?? "", line: event.lineno || null, kind: "error" });
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : typeof event.reason === "string" ? event.reason : "Unhandled promise rejection";
      // Aborted fetches are the app cancelling its own requests, not failures.
      if (/abort/i.test(reason)) return;
      record({ message: reason.slice(0, 200), source: "", line: null, kind: "rejection" });
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  return null;
}
