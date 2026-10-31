"use client";
import { useCallback, useEffect, useRef } from "react";
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
  // Web Vitals describe a document navigation, not a client-side route. Keep their original route until unload.
  const navigation = useRef<{ path: string; vitals: Vitals; sent: boolean }>({ path: pathname, vitals: {}, sent: false });
  const page = useRef<{ path: string; errors: ClientError[] }>({ path: pathname, errors: [] });

  const report = useCallback<Parameters<typeof useReportWebVitals>[0]>(metric => {
    if (metric.name in { LCP: 1, INP: 1, CLS: 1, FCP: 1, TTFB: 1 }) navigation.current.vitals[metric.name as keyof Vitals] = Math.round(metric.value * (metric.name === "CLS" ? 1000 : 1)) / (metric.name === "CLS" ? 1000 : 1);
  }, []);
  useReportWebVitals(report);

  useEffect(() => {
    const context = () => ({ connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType ?? null, width: window.innerWidth });
    const flushErrors = () => {
      const current = page.current;
      if (!current.path.startsWith("/super-admin") && current.errors.length) send({ path: current.path, errors: current.errors, ...context() });
      current.errors = [];
    };
    const flush = () => {
      const current = navigation.current;
      if (!current.sent && !current.path.startsWith("/super-admin") && Object.keys(current.vitals).length) {
        current.sent = true;
        send({ path: current.path, vitals: current.vitals, ...context() });
      }
      flushErrors();
    };
    // Route changes flush errors only. Do not erase buffered FCP/TTFB or relabel document LCP/CLS/INP.
    flushErrors();
    page.current = { path: pathname, errors: [] };
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
      flushErrors();
    };
  }, [pathname]);

  return null;
}
