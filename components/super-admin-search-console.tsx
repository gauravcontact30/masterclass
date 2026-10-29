"use client";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { AdminTable } from "./super-admin-table";
import type { SearchConsoleReport, SearchRow } from "@/lib/search-console";
import styles from "./super-admin-promotions.module.css";

const errors: Record<string, string> = {
  search_console_access_denied: "Google denied access. Check that the Search Console API is enabled and the service account has access to the exact property shown below.",
  search_console_auth_failed: "Google authentication failed. Check the server's Search Console service-account credentials.",
  search_console_rate_limited: "Google's request quota was reached. Try again later.",
};
export function SuperAdminSearchConsole({ days, query }: { days: number; query: string }) {
  const [data, setData] = useState<SearchConsoleReport | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending || controller.signal.aborted || document.visibilityState === "hidden") return;
      pending = true; setBusy(true);
      try {
        const response = await fetch(`/api/super-admin/promotions/search-console?days=${days}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(errors[body.error] || "Search Console is unavailable. Try again later.");
        if (!controller.signal.aborted) { setData(body); setError(""); }
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Search Console is unavailable."); }
      finally { pending = false; if (!controller.signal.aborted) setBusy(false); }
    };
    queueMicrotask(() => { setData(null); void load(); });
    const timer = setInterval(() => void load(), 15 * 60_000);
    document.addEventListener("visibilitychange", load);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", load); };
  }, [days, refresh]);
  const rows = (items: SearchRow[]) => items.map(item => ({ dimension: item.keys.join(" / "), clicks: item.clicks, impressions: item.impressions, ctr: `${(item.ctr * 100).toFixed(2)}%`, position: item.impressions ? item.position.toFixed(2) : "Not available" }));
  return <section aria-labelledby="search-console-title">
    <div className={styles.chartHead}><h2 className={styles.heading} id="search-console-title">Google Search · Search Console</h2><button type="button" className={styles.primary} disabled={busy} onClick={() => setRefresh(n => n + 1)}>{busy ? "Loading Search Console…" : "Refresh Search Console"}</button></div>
    <p className={styles.note}>Organic web-search performance reported by Google. This is separate from website referral visits and paid search ads.</p>
    {error && <p role="alert">{error}{data && " Showing the last successful report; it may be stale."}</p>}
    {data && <p className={styles.note}>Property: <strong>{data.property}</strong>. Requested dates: {data.startDate} to {data.endDate}, Pacific time. A URL-prefix property covers only that prefix.</p>}
    {data?.status === "not_configured" && <Card className={styles.chartCard}><p role="status">Search Console credentials are not configured on this server. Search clicks, impressions, queries and rankings are unavailable; website referral tracking continues independently.</p><p className={styles.note}>Add a service account with read access to your verified property, then configure GOOGLE_SEARCH_CONSOLE_PROPERTY, GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL and GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY on the server.</p></Card>}
    {data?.status === "connected" && <>
      <p className={styles.note}>Fetched: {new Date(data.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST. Cached for 15 minutes. Finalized data only; recent days may be missing. Top queries/pages are limited to 100 rows and privacy filtering can hide queries. Totals come from a separate property-level query; table rows may not add up to them.</p>
      {data.totals ? <div className={styles.kpis}>{[["Search clicks", data.totals.clicks.toLocaleString("en-IN")], ["Search impressions", data.totals.impressions.toLocaleString("en-IN")], ["Search CTR", `${(data.totals.ctr * 100).toFixed(2)}%`], ["Average position", data.totals.impressions ? data.totals.position.toFixed(2) : "Not available"]].map(([label, value]) => <Card className={styles.kpi} key={label}><span>{label}</span><strong>{value}</strong></Card>)}</div> : <p>No finalized search data was returned for this property and period.</p>}
      {([["Daily search performance", "Date (Pacific)", data.daily], ["Top search queries", "Query", data.queries], ["Top search pages", "Page", data.pages], ["Search countries", "Country (Google code)", data.countries], ["Search devices", "Device", data.devices]] as const).map(([title, label, items]) => <AdminTable key={title} title={title} query={query} rows={rows(items)} empty="No data returned by Google for this period." columns={[{ key: "dimension", label }, { key: "clicks", label: "Clicks", filter: false }, { key: "impressions", label: "Impressions", filter: false }, { key: "ctr", label: "CTR", filter: false }, { key: "position", label: "Average position", filter: false }]} />)}
    </>}
  </section>;
}
