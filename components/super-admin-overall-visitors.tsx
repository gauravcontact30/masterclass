"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import type { OverallVisitors } from "@/lib/overall-visitors";
import { countryLabel } from "@/lib/visitor-location";
import { AdminTable } from "./super-admin-table";
import styles from "./super-admin-daily-social.module.css";

const when = (value: string | null) => value ? new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "No recorded visits";

export function SuperAdminOverallVisitors({ query = "" }: { query?: string }) {
  const [data, setData] = useState<OverallVisitors | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending || controller.signal.aborted || document.visibilityState === "hidden") return;
      pending = true; setBusy(true);
      try {
        const response = await fetch("/api/super-admin/promotions/overall", { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error === "migration_required" ? "Apply migration 0040_overall_visitor_tracking.sql to enable this report." : "Overall visitor tracking is unavailable. Try refreshing.");
        if (!controller.signal.aborted) { setData(body); setError(""); }
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to refresh visitor tracking."); }
      finally { pending = false; if (!controller.signal.aborted) setBusy(false); }
    };
    const onVisible = () => { void load(); };
    queueMicrotask(onVisible);
    const timer = setInterval(onVisible, 30_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);
  return <section className={styles.section} aria-labelledby="overall-visitors-title">
    <header className={styles.header}><div><p className={styles.eyebrow}><Users size={14} aria-hidden="true" /> ALL RECORDED SOURCES</p><h2 id="overall-visitors-title">Overall Visitors Tracking</h2><p>All retained website visits, including direct, search, referral and promotional traffic.</p></div><button type="button" disabled={busy} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={14} aria-hidden="true" />{busy ? "Refreshing…" : "Refresh overall tracking"}</button></header>
    <p className={styles.note} role="status">{data ? `Last successful refresh: ${when(data.generatedAt)} IST. ` : "Waiting for the first successful refresh. "}Updates every 30 seconds while this page is visible.</p>
    {error && <p className={styles.error} role="alert">{error}{data && " Showing the last successful report."}</p>}
    {data && <>
      <div className={styles.summary}>{[["unique browsers", data.totals.visitors], ["page views", data.totals.views], ["sessions", data.totals.sessions], ["signed-in accounts", data.totals.accounts], ["browsers with a page view in the last 5 minutes", data.totals.recent]].map(([label, value]) => <span key={label}><b>{Number(value).toLocaleString("en-IN")}</b>{label}</span>)}</div>
      <p className={styles.note}>Recorded range: {when(data.totals.first)} — {when(data.totals.latest)} IST. Visit retention is configured for {data.retentionDays} days; this is not a lifetime total. Unique browsers are counted once across all sources. Tracking blockers, cleared cookies and missing referrals affect coverage. Known bots and admin routes are excluded.</p>
      <AdminTable title="Overall daily visitors (IST)" rows={data.daily} query={query} columns={["day", "visitors", "sessions", "views"]} empty="No visitor activity has been recorded." />
      <AdminTable title="Overall traffic sources" rows={data.sources} query={query} columns={["source", "visitors", "views"]} note="Top 50 recorded UTM sources or referrer hosts. Direct / unknown means no source was available. A browser may appear under multiple sources; use the overall total for distinct browsers." />
      <AdminTable title="Overall pages visited" rows={data.pages} query={query} columns={["path", "visitors", "views"]} note="Top 50 pages by recorded page views. Totals above include every page." />
      <AdminTable title="Overall visitor countries" rows={data.countries.map(row => ({ ...row, country: countryLabel(row.country) }))} query={query} columns={["country", "visitors", "views"]} note="Top 50 countries from approximate network location. Unknown locations are not guessed." />
    </>}
  </section>;
}
