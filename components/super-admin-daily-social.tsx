"use client";
import { countryLabel } from "@/lib/visitor-location";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, CalendarDays, Users, Eye, MousePointerClick, Clock, MapPin, Mail, Timer } from "lucide-react";
import { reportDay, REPORT_TIMEZONE, type DailySocialData } from "@/lib/daily-social";
import { SocialPlatformIcon } from "./social-platform-icon";
import { AdminTable } from "./super-admin-table";
import styles from "./super-admin-daily-social.module.css";

const time = (value: unknown) => value ? new Date(String(value)).toLocaleString("en-IN", { timeZone: REPORT_TIMEZONE, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "No visits yet";

function duration(value: unknown) {
  if (typeof value !== "number") return "Not recorded";
  const seconds = Math.floor(value / 1000);
  return seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m` : seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}

export function SuperAdminDailySocial({ query = "" }: { query?: string }) {
  const [day, setDay] = useState(""); // Empty follows today across midnight.
  const [today, setToday] = useState("");
  const [data, setData] = useState<DailySocialData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState("All platforms");
  const [page, setPage] = useState("All pages");
  const load = useCallback(async (signal: AbortSignal) => {
    setBusy(true);
    setToday(reportDay());
    try {
      const response = await fetch(`/api/super-admin/promotions/daily${day ? `?date=${day}` : ""}`, { cache: "no-store", signal });
      if (!response.ok) throw new Error("Daily tracking is unavailable. Try refreshing again.");
      const body: DailySocialData = await response.json();
      if (!signal.aborted) { setData(body); setError(""); }
    } catch { if (!signal.aborted) setError("Daily tracking is unavailable. Try refreshing again."); }
    finally { if (!signal.aborted) setBusy(false); }
  }, [day]);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const run = async () => { if (pending || controller.signal.aborted || document.visibilityState === "hidden") return; pending = true; await load(controller.signal); pending = false; };
    queueMicrotask(() => void run());
    const interval = setInterval(() => { if (document.visibilityState === "visible") void run(); }, 30_000);
    const visible = () => { if (document.visibilityState === "visible") void run(); };
    document.addEventListener("visibilitychange", visible);
    return () => { controller.abort(); clearInterval(interval); document.removeEventListener("visibilitychange", visible); };
  }, [load, refresh]);
  const matches = (row: { platform: string; page: string }) => (platform === "All platforms" || row.platform === platform) && (page === "All pages" || row.page === page);
  const current = data && (!day || data.day === day) ? data : null;
  return <section className={styles.section} aria-labelledby="daily-social-title">
    <header className={styles.header}><div><p className={styles.eyebrow}><CalendarDays size={14} aria-hidden="true"/> DAILY VISITOR TRACKING</p><h2 id="daily-social-title">Social platforms, Google Search & visitor journeys</h2><p>Landing page, Learning dashboard, topics, options and routes.</p></div><button type="button" disabled={busy} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={14} />{busy ? "Refreshing…" : "Refresh daily tracking"}</button></header>
    <div className={styles.filters}>
      <label>Report date (IST)<input aria-label="Daily tracking date" type="date" value={day || today} onChange={e => { setDay(e.target.value); setData(null); }} /></label>
      <button type="button" onClick={() => { setDay(""); setRefresh(value => value + 1); }}>Today</button>
      <label>Platform<select aria-label="Daily tracking platform" value={platform} onChange={e => setPlatform(e.target.value)}><option>All platforms</option>{(current?.platforms || []).map(row => <option key={row.platform}>{row.platform}</option>)}</select></label>
      <label>Page area<select aria-label="Daily tracking page area" value={page} onChange={e => setPage(e.target.value)}>{["All pages", "Landing page", "Learning dashboard", "Other pages"].map(value => <option key={value}>{value}</option>)}</select></label>
      <div className={styles.updated} role="status">{current ? <><b>{current.day === reportDay(new Date(current.generatedAt)) ? "Today" : "Report day"}: {current.day}</b><span>Latest refresh: {time(current.generatedAt)} IST</span></> : <><b>{day ? "Report day" : "Today"}: {day || today}</b><span>{error ? "No successful refresh yet" : "Loading daily tracking…"}</span></>}<span>Updates every 30 seconds · India time</span></div>
    </div>
    {error && <p className={styles.error} role="alert">{error}{current && " Showing the last successful refresh."}</p>}
    {current && <>
      <div className={styles.summary}><span><Users size={16} aria-hidden="true"/><b>{current.totals.visitors}</b> unique browsers</span><span><Eye size={16} aria-hidden="true"/><b>{current.totals.views}</b> page views</span><span><MousePointerClick size={16} aria-hidden="true"/><b>{current.totals.clicks}</b> option clicks</span></div>
      <p className={styles.note}>Daily totals cover all sources. Filters apply to the matrix and visitor trail. Platform sources come from tracked links or referrers; unattributed traffic is Direct / unknown. Anonymous visitors use browser IDs, not social-media identities. Bots and excluded accounts are omitted.</p>
      {current.capped && <p className={styles.error} role="alert">High-volume day: results are limited to the latest 20,000 visit records and 20,000 interactions. Totals may be incomplete.</p>}
      <div className={styles.platforms}>{current.platforms.filter(row => platform === "All platforms" || row.platform === platform).map(row => <article key={row.platform} className={styles.platform}><h3><SocialPlatformIcon platform={row.platform}/>{row.platform}</h3><strong>{row.visitors}<small> unique browsers</small></strong><dl><div><dt>Landing views</dt><dd>{row.landing}</dd></div><div><dt>Dashboard views</dt><dd>{row.dashboard}</dd></div><div><dt>All page views</dt><dd>{row.views}</dd></div><div><dt>Option clicks</dt><dd>{row.clicks}</dd></div></dl><p><Clock size={12} aria-hidden="true"/> Last visit / click: {time(row.latest)}{row.latest ? " IST" : ""}</p></article>)}</div>
      <AdminTable title="Daily platform, topic and route matrix" rows={current.matrix.filter(matches)} query={query} empty="No matching activity recorded for this day." columns={["platform", "page", "route", "topic", "option", "visitors", "views", "clicks", { key: "latest", label: "Latest activity (IST)", render: row => time(row.latest) }]} />
      <AdminTable title="Daily visitor locations" rows={current.visitors.filter(row => (platform === "All platforms" || row.platform === platform) && (page === "All pages" || row.pages.includes(page))).map(row => ({ email: row.email, city: row.city, region: row.region || "Not available", country: countryLabel(row.country), platform: row.platform, pages: row.pages.join(", "), time: row.time }))} query={query} note="Approximate IP-based location, not GPS or a street address. State/region may be an ISO code. VPNs and mobile networks can affect accuracy. Missing locations are shown as Not available." columns={[{ key: "email", label: "Email ID" }, "city", { key: "region", label: "State / region" }, "country", "platform", { key: "pages", label: "Page areas" }, { key: "time", label: "First activity (IST)", render: row => time(row.time) }]} />
      <AdminTable title="Daily visitor trace" rows={current.visitors.filter(row => (platform === "All platforms" || row.platform === platform) && (page === "All pages" || row.pages.includes(page))).map(({ email, city, time, duration }) => ({ email, city, time, duration }))} query={query} empty="No matching visitors recorded for this day." note="One row per visitor session, labelled with its latest observed source. Time is the first recorded activity today (IST). Duration totals recorded reading time on this website, not time spent on social media. Anonymous email and unavailable city or duration are shown explicitly." columns={[{ key: "email", label: "Email ID", render: row => <span className={styles.traceValue}><Mail size={14} aria-hidden="true"/>{String(row.email)}</span> }, { key: "city", label: "City", render: row => <span className={styles.traceValue}><MapPin size={14} aria-hidden="true"/>{String(row.city)}</span> }, { key: "time", label: "Time (IST)", render: row => <span className={styles.traceValue}><Clock size={14} aria-hidden="true"/>{time(row.time)}</span> }, { key: "duration", label: "Duration", render: row => <span className={styles.traceValue}><Timer size={14} aria-hidden="true"/>{duration(row.duration)}</span> }]} />
    </>}
  </section>;
}
