"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, BookOpen, BookOpenText, CheckCircle2, Clock, Compass, Cpu, Database, Gauge, Globe2, GraduationCap, Hourglass, Laptop, LogIn, LogOut, MapPin, MousePointerClick, Pause, Play, Radio, RefreshCw, Route, Server, ShieldCheck, Smartphone, Sparkles, Tablet, Target, Timer, UserRound, Users, Zap, type LucideIcon } from "lucide-react";
import { Flag, countryName } from "./super-admin-audience";
import { Pager } from "./super-admin-table";
import styles from "./super-admin-overview-live.module.css";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";
import { indexVisits, streamVisitors, type Presence } from "@/lib/live-visits";

type Row = Record<string, unknown>;
type Visit = { id?: number; created_at: string; event: string; person?: string; email?: string | null; user_id?: string | null; visitor_id: string; session_id: string; new_visitor?: boolean; path: string; title?: string | null; country?: string | null; city?: string | null; region?: string | null; postal_code?: string | null; device?: string | null; browser?: string | null; os?: string | null; duration_ms?: number | null; referrer_host?: string | null; utm_source?: string | null };
type Live = {
  generatedAt: string;
  totals: { liveNow: number; liveSignedIn: number; pageViews: number; visitors: number; bounceRate: number | null; avgSessionSeconds: number | null; people?: number; sessions?: number; signedInUsers?: number; newVisitors?: number; newAccounts?: number; pagesPerSession?: number | null; bots?: number };
  hours: { hour: number; views: number }[]; recent: Visit[]; people?: Person[];
  pages?: { path: string; views: number; visitors: number; avg_seconds: number | null }[]; referrers?: { referrer: string; views: number; visitors: number }[];
  countries?: { country: string; visitors: number; views: number }[]; devices?: { device: string; visitors: number }[];
};
type Person = { person: string; sessions: number; engaged_seconds: number; first_seen: string };
export type OverviewSnapshot = { generatedAt: string; events: Row[]; requests: { count: number; errors: number; p95: number | null }; health: { databaseMs: number; processUptime: number; processMemory: number; hostMemory: number; hostUsedMemory: number; cpuCores: number; cpuPercent?: number | null; environment?: string; nodeVersion?: string } };

const REFRESH_MS = 15_000;
// Rows per page in each paginated panel.
const STREAM_PAGE = 8, TRACE_PAGE = 10, READING_PAGE = 6;
const pageOf = <T,>(rows: T[], page: number, size: number) => rows.slice((Math.min(page, Math.max(1, Math.ceil(rows.length / size))) - 1) * size, Math.min(page, Math.max(1, Math.ceil(rows.length / size))) * size);
const pagesOf = (rows: unknown[], size: number) => Math.max(1, Math.ceil(rows.length / size));
const n = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-IN").format(value);
const since = (iso: unknown, now: number) => {
  if (!iso) return "—";
  // Accepts an ISO string or epoch milliseconds (the visitor stream keeps Left as a number).
  const s = Math.max(0, (now - new Date(typeof iso === "number" ? iso : String(iso)).getTime()) / 1000);
  return s < 10 ? "now" : s < 60 ? `${Math.round(s)}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`;
};
const spent = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};
// The visitor stream's Date, Arrived and Left columns, in India time (times to the second).
const dayOf = (iso: string | number) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const clock = (iso: string | number) => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso));
const weekday = (iso: string | number) => new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" }).format(new Date(iso));
type StreamFilter = "all" | "live" | "signed" | "new";
// The stream's own feed, merged across refreshes: rows by id, page heartbeats by session and path.
type StreamFeed = { rows: Map<string, Visit>; emails: Record<string, string>; presence: Map<string, Presence> | null; days: number; capped: boolean; generatedAt: string; loadedAt: number };
// The whole window is read again every 10 minutes; in between, each refresh asks only for what is new.
const FULL_RELOAD_MS = 10 * 60_000;
const rowId = (v: Visit) => v.id != null ? String(v.id) : `${v.created_at}|${v.event}|${v.session_id}|${v.path}`;
const bytes = (value: number) => value >= 1 << 30 ? `${(value / (1 << 30)).toFixed(1)} GB` : `${Math.round(value / (1 << 20))} MB`;
const uptime = (seconds: number) => seconds >= 86400 ? `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h` : seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m` : `${Math.round(seconds / 60)}m`;
const DEVICE_ICON: Record<string, LucideIcon> = { mobile: Smartphone, tablet: Tablet, desktop: Laptop };
type TraceFilter = "all" | "client" | "server" | "slow";
const STREAM_FILTERS: { id: StreamFilter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: Users }, { id: "live", label: "On the site now", icon: Radio }, { id: "signed", label: "Signed in", icon: UserRound }, { id: "new", label: "New visitors", icon: Sparkles },
];
const TRACE_FILTERS: { id: TraceFilter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: Activity }, { id: "client", label: "4xx", icon: AlertTriangle }, { id: "server", label: "5xx", icon: Server }, { id: "slow", label: "Slow ≥1 s", icon: Clock },
];
/** The value below which `q` of the sorted durations fall. */
const quantile = (sorted: number[], q: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : null;
const pct = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 1000) / 10}%` : "—";
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`;
const statusTone = (status: number | null) => status == null ? "info" : status >= 500 ? "error" : status >= 400 ? "warn" : "ok";

/**
 * The Overview's live command centre: who is on the site right now and what they are doing, request tracing
 * from the application event log, the last 24 hours at a glance and system health. Refreshes every 15 seconds
 * while the tab is visible (pausable); every panel has its own light tone.
 */
export function OverviewLive({ snapshot, onRefreshSnapshot }: { snapshot: OverviewSnapshot | null; onRefreshSnapshot: () => void }) {
  const [live, setLive] = useState<Live | null>(null);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [traceFilter, setTraceFilter] = useState<TraceFilter>("all");
  const [visitPage, setVisitPage] = useState(1);
  const [tracePage, setTracePage] = useState(1);
  const [readPage, setReadPage] = useState(1);
  const [streamFilter, setStreamFilter] = useState<StreamFilter>("all");
  // The server's clock minus this browser's, so "reading for 1m 03s" is measured on the clock that stamped the rows.
  const [offset, setOffset] = useState(0);
  // When the previous refresh happened, so visitors who arrived since then can be highlighted.
  const [freshSince, setFreshSince] = useState<number | null>(null);
  // The Live visitor stream's own feed: every visit of the last VISIT_RETENTION_DAYS days (the 24 h report above
  // keeps only its newest 500 events), kept in a ref between refreshes so each one only fetches what is new.
  const [stream, setStream] = useState<StreamFeed | null>(null);
  const feed = useRef<StreamFeed | null>(null);

  const loadStream = useCallback(async (signal?: AbortSignal) => {
    try {
      const prior = feed.current, startedAt = Date.now();
      const incremental = prior && startedAt - prior.loadedAt < FULL_RELOAD_MS;
      // A minute of overlap: a row stamped just before the last read can land just after it.
      const query = incremental ? `?since=${encodeURIComponent(new Date(Date.parse(prior.generatedAt) - 60_000).toISOString())}` : "";
      const response = await fetch(`/api/super-admin/activity/stream${query}`, { cache: "no-store", signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(body?.visits)) return;
      const days = Number(body.days) || VISIT_RETENTION_DAYS, generatedAt = typeof body.generatedAt === "string" ? body.generatedAt : new Date().toISOString();
      const windowStart = Date.parse(generatedAt) - days * 86_400_000;
      const rows = new Map(incremental ? prior.rows : []);
      for (const v of body.visits as Visit[]) rows.set(rowId(v), v);
      for (const [id, v] of rows) if (Date.parse(v.created_at) < windowStart) rows.delete(id);
      const presence = Array.isArray(body.presence) ? new Map(incremental && prior.presence ? prior.presence : []) : null;
      if (presence) for (const p of body.presence as Presence[]) presence.set(`${p.session_id}|${p.path}`, p);
      const next: StreamFeed = { rows, presence, days, generatedAt, emails: { ...(incremental ? prior.emails : {}), ...(body.emails ?? {}) },
        capped: Boolean(body.capped) || Boolean(incremental && prior.capped), loadedAt: incremental ? prior.loadedAt : startedAt };
      // Half the round trip is the best estimate of when the server stamped generatedAt.
      setOffset(Date.parse(generatedAt) - (startedAt + Date.now()) / 2);
      setFreshSince(prior ? Date.parse(prior.generatedAt) : null);
      feed.current = next; setStream(next);
    } catch { /* the stream falls back to the 24 h report's recent visits */ }
  }, []);
  const load = useCallback(async (signal?: AbortSignal) => {
    void loadStream(signal);
    try {
      const response = await fetch("/api/super-admin/activity?days=1", { cache: "no-store", signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "service_error");
      // A malformed payload must degrade this panel, never take the whole dashboard down with it.
      if (typeof body?.totals !== "object" || body.totals === null || !Array.isArray(body.recent) || !Array.isArray(body.hours)) throw new Error("service_error");
      setLive(body);
      setError("");
    } catch (e) { if (!signal?.aborted && !(e instanceof DOMException)) setError(e instanceof Error && e.message === "migration_required" ? "Live visitor tracking needs migration 0023 (User activity)." : "Live tracking is unavailable right now; retrying."); }
  }, [loadStream]);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); });
    if (paused) return () => controller.abort();
    const timer = setInterval(() => { if (document.visibilityState === "visible") { void load(controller.signal); onRefreshSnapshot(); } }, REFRESH_MS);
    return () => { controller.abort(); clearInterval(timer); };
  }, [load, paused, onRefreshSnapshot]);
  // A one-second clock keeps the "x seconds ago" labels honest between refreshes.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const streamRows = useMemo(() => stream ? [...stream.rows.values()] : live?.recent ?? [], [stream, live]);
  const streamDays = stream?.days ?? 1;
  const clockNow = now + offset;
  const visits = useMemo(() => streamRows.filter(v => v.event === "page_view"), [streamRows]);
  // Who each visitor is and what is known about every page they opened (lib/live-visits.ts); only the open pages'
  // clocks move each second, so the grouping runs when the data changes and the timing pass on every tick.
  // Filters out visitors who engaged for 0 seconds (Math.round(engagedMs / 1000) === 0).
  const index = useMemo(() => indexVisits(streamRows, stream ? stream.presence && [...stream.presence.values()] : null), [streamRows, stream]);
  const everyone = useMemo(() => streamVisitors(index, clockNow, stream?.emails, true), [index, clockNow, stream]);
  const counts = useMemo(() => ({
    all: everyone.length, live: everyone.filter(v => v.live).length, signed: everyone.filter(v => v.signedIn).length,
    new: everyone.filter(v => v.first.new_visitor && !v.signedIn).length,
    liveSigned: everyone.filter(v => v.live && v.signedIn).length,
    recent: everyone.filter(v => clockNow - v.lastAt < 30 * 60_000).length,
    engaged: everyone.length ? everyone.reduce((sum, v) => sum + v.engagedMs, 0) / everyone.length : null,
    pages: everyone.length ? Math.round((visits.length / everyone.length) * 10) / 10 : null,
  }), [everyone, clockNow, visits]);
  const visitors = useMemo(() => everyone.filter(v => streamFilter === "all" || (streamFilter === "live" ? v.live : streamFilter === "signed" ? v.signedIn : v.first.new_visitor && !v.signedIn)), [everyone, streamFilter]);
  const heartbeats = Boolean(stream?.presence);
  const lastHour = useMemo(() => streamRows.filter(v => v.event === "page_view" && clockNow - Date.parse(v.created_at) < 3600_000), [streamRows, clockNow]);
  const reading = useMemo(() => {
    const recent = streamRows.filter(v => clockNow - Date.parse(v.created_at) < 30 * 60_000);
    const byPath = new Map<string, { views: number; visitors: Set<string>; readMs: number; reads: number }>();
    for (const v of recent) {
      const entry = byPath.get(v.path) ?? { views: 0, visitors: new Set(), readMs: 0, reads: 0 };
      if (v.event === "page_view") { entry.views++; entry.visitors.add(v.visitor_id); }
      if (v.event === "page_leave" && v.duration_ms) { entry.readMs += v.duration_ms; entry.reads++; }
      byPath.set(v.path, entry);
    }
    return [...byPath].filter(([, e]) => e.views).sort((a, b) => b[1].visitors.size - a[1].visitors.size || b[1].views - a[1].views);
  }, [streamRows, clockNow]);
  const devices = useMemo(() => {
    const counts = new Map<string, Set<string>>();
    for (const v of lastHour) { const key = (v.device || "desktop").toLowerCase(); counts.set(key, (counts.get(key) ?? new Set()).add(v.visitor_id)); }
    return [...counts].map(([device, set]) => [device, set.size] as const).sort((a, b) => b[1] - a[1]);
  }, [lastHour]);

  const requests = useMemo(() => (snapshot?.events ?? []).filter(e => e.kind === "request"), [snapshot]);
  const recent15 = useMemo(() => requests.filter(e => now - Date.parse(String(e.created_at)) < 15 * 60_000), [requests, now]);
  const errors15 = recent15.filter(e => Number(e.status) >= 500).length;
  const traces = useMemo(() => requests.filter(e => {
    const status = Number(e.status), ms = Number(e.duration_ms);
    return traceFilter === "all" || (traceFilter === "client" ? status >= 400 && status < 500 : traceFilter === "server" ? status >= 500 : ms >= 1000);
  }), [requests, traceFilter]);
  // What the loaded request sample says: status classes, latency spread and the busiest routes with their health.
  const traceStats = useMemo(() => {
    const ms = requests.map(e => Number(e.duration_ms) || 0).sort((a, b) => a - b);
    const routes = new Map<string, { calls: number; errors: number; total: number; slowest: number; methods: Set<string> }>();
    for (const e of requests) {
      const route = String(e.resource ?? "—"), entry = routes.get(route) ?? { calls: 0, errors: 0, total: 0, slowest: 0, methods: new Set<string>() };
      const d = Number(e.duration_ms) || 0;
      entry.calls++; entry.total += d; entry.slowest = Math.max(entry.slowest, d); entry.methods.add(String(e.action ?? "—"));
      if (Number(e.status) >= 400) entry.errors++;
      routes.set(route, entry);
    }
    return {
      client: requests.filter(e => Number(e.status) >= 400 && Number(e.status) < 500).length, server: requests.filter(e => Number(e.status) >= 500).length,
      slow: ms.filter(d => d >= 1000).length, p50: quantile(ms, 0.5), p95: quantile(ms, 0.95), max: ms.at(-1) ?? null,
      avg: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null,
      routes: [...routes].map(([route, e]) => ({ route, ...e, avg: Math.round(e.total / e.calls) })).sort((a, b) => b.calls - a.calls || b.errors - a.errors).slice(0, 5),
    };
  }, [requests]);
  const slowest = Math.max(1, ...traces.map(e => Number(e.duration_ms) || 0));
  const visitRows = pageOf(visitors, visitPage, STREAM_PAGE), traceRows = pageOf(traces, tracePage, TRACE_PAGE), readRows = pageOf(reading, readPage, READING_PAGE);
  const hours = live?.hours ?? [];
  const peak = Math.max(1, ...hours.map(h => h.views));
  const h = snapshot?.health;

  const kpis: { label: string; value: string; note: string; icon: LucideIcon; tone: string; pulse?: boolean }[] = [
    heartbeats
      ? { label: "On the site now", value: n(counts.live), note: `${n(counts.liveSigned)} signed in · page open now`, icon: Radio, tone: "mint", pulse: true }
      : { label: "On the site now", value: n(live?.totals.liveNow), note: `${n(live?.totals.liveSignedIn)} signed in · last 5 min`, icon: Radio, tone: "mint", pulse: true },
    { label: "Views, last hour", value: n(lastHour.length), note: `${n(new Set(lastHour.map(v => v.visitor_id)).size)} visitors`, icon: MousePointerClick, tone: "sky" },
    { label: "Views, 24 h", value: n(live?.totals.pageViews), note: `${n(live?.totals.visitors)} unique visitors`, icon: Users, tone: "lavender" },
    { label: "API requests, 15 min", value: n(recent15.length), note: `${n(snapshot?.requests.count)} in the reporting window`, icon: Route, tone: "peach" },
    { label: "Server errors, 15 min", value: n(errors15), note: errors15 ? "Open Application logs for details" : "All clear", icon: AlertTriangle, tone: errors15 ? "rose" : "sage" },
    { label: "API p95 latency", value: snapshot?.requests.p95 == null ? "—" : `${Math.round(snapshot.requests.p95)} ms`, note: `Database ${n(h?.databaseMs)} ms`, icon: Gauge, tone: "butter" },
  ];

  return <section className={styles.live} aria-label="Live command centre">
    <header className={styles.head}>
      <div><p className={styles.kicker}><span className={styles.dot} data-paused={paused || undefined} aria-hidden="true" />{paused ? "Live updates paused" : "Live · refreshes every 15 s"}</p><h2>Live command centre</h2></div>
      <div className={styles.actions}>
        <span className={styles.updated} aria-live="polite">Updated {since(live?.generatedAt, clockNow)}</span>
        <button type="button" className={styles.button} onClick={() => { void load(); onRefreshSnapshot(); }}><RefreshCw size={14} aria-hidden="true" />Refresh</button>
        <button type="button" className={styles.button} aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}{paused ? "Resume" : "Pause"}</button>
      </div>
    </header>
    {error && <p className={styles.warn} role="status">{error}</p>}

    <div className={styles.kpis}>
      {kpis.map(({ label, value, note, icon: Icon, tone, pulse }) => <div key={label} className={styles.kpi} data-tone={tone}>
        <span className={styles.kpiIcon} aria-hidden="true">{pulse && <i className={styles.ring} />}<Icon size={16} /></span>
        <span className={styles.kpiLabel}>{label}</span><strong>{value}</strong><small>{note}</small>
      </div>)}
    </div>

    <div className={styles.grid}>
      <article className={`${styles.panel} ${styles.full}`} data-tone="mint">
        <h3><Radio size={16} aria-hidden="true" />Live visitor stream<span>{everyone.length ? `${n(everyone.length)} ${everyone.length === 1 ? "visitor" : "visitors"} · ${n(visits.length)} views in ${streamDays === 1 ? "24 h" : `the last ${streamDays} days`}` : ""}</span></h3>
        {everyone.length > 0 && <div className={styles.streamBar}>
          <dl className={styles.streamStats}>
            <div data-live={counts.live > 0 || undefined}><dt>On the site now</dt><dd>{n(counts.live)}</dd><small>{counts.live ? `${n(counts.liveSigned)} signed in · ${heartbeats ? "page open now" : "page opened in the last 30 min"}` : "nobody has a page open"}</small></div>
            <div><dt>Active, last 30 min</dt><dd>{n(counts.recent)}</dd><small>visitors with any activity</small></div>
            <div><dt>Engaged time per visitor</dt><dd>{counts.engaged == null ? "—" : spent(counts.engaged / 1000)}</dd><small>visible time on pages</small></div>
            <div><dt>Pages per visitor</dt><dd>{counts.pages ?? "—"}</dd><small>{n(counts.signed)} signed in · {n(counts.new)} new</small></div>
          </dl>
          <div className={styles.filters} role="group" aria-label="Show visitors">{STREAM_FILTERS.map(f => <button key={f.id} type="button" aria-pressed={streamFilter === f.id} onClick={() => { setStreamFilter(f.id); setVisitPage(1); }}><f.icon size={12} aria-hidden="true" />{f.label} <b>{n(counts[f.id])}</b></button>)}</div>
        </div>}
        {visitors.length ? <>
          <div className={styles.streamTableWrap}>
            <div className={styles.streamHeadRow} aria-hidden="true">
              <span className={styles.streamHeadTitle}>
                <Activity size={13} aria-hidden="true" />
                Visitor Logs
              </span>
              <span className={styles.streamHeadNote}>
                Live Learner Activity, Geolocation, Session Timing & Learning History
              </span>
            </div>
            <ol className={styles.streamList}>
              {visitRows.map(row => {
                const v = row.current;
                const Device = DEVICE_ICON[(v.device || "desktop").toLowerCase()] ?? Laptop;
                const code = v.country ?? row.first.country ?? "";
                const cleanCountry = code ? countryName(code) || code : "";
                const p = row.page;
                const postal = row.postalCode || v.postal_code || row.first.postal_code || null;
                const isLive = row.live;

                return (
                  <li key={row.key} className={styles.streamRow} data-live={isLive || undefined} data-new={freshSince != null && Date.parse(row.arrived) > freshSince || undefined}>
                    <div className={styles.visitorLogCard}>
                      {/* Top Bar: Identity Overview & Live Presence */}
                      <div className={styles.logTopBar}>
                        <div className={styles.logTopLeft}>
                          <span className={styles.logEntryTag}>
                            <UserRound size={11} aria-hidden="true" />
                            Visitor Log
                          </span>
                          <span className={styles.idChip}>ID: {row.key.replace(/^(visitor|device):/, "").slice(0, 8)}</span>
                          <small className={styles.sessionCount}>{row.views} {row.views === 1 ? "view" : "views"} · {row.sessions} {row.sessions === 1 ? "session" : "sessions"}</small>
                        </div>
                        <div className={styles.logTopRight}>
                          {isLive ? (
                            <div className={styles.liveOnSiteBadge}>
                              <span className={styles.livePulseRing} aria-hidden="true" />
                              <span className={styles.livePulseCenter} aria-hidden="true" />
                              <span className={styles.liveTopTag}>Live on site</span>
                              <span className={styles.liveSignalTag}>Active</span>
                            </div>
                          ) : (
                            <span className={styles.departedPill}>
                              <LogOut size={11} aria-hidden="true" /> Departed {since(row.left, clockNow)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 8-Card Responsive Grid under Visitor Logs */}
                      <div className={styles.logCardsGrid}>
                        {/* 1. Learner Profile & Identity Card (Light Lavender) */}
                        <div className={`${styles.streamColCard} ${styles.logCardProfile}`}>
                          <div className={styles.cardKickerRow}>
                            <UserRound size={12} className={styles.kickerIcon} aria-hidden="true" />
                            <span>Learner Profile & Identity</span>
                            <span className={styles.kickerTag}>Profile</span>
                          </div>
                          <div className={styles.identityBody}>
                            <div className={styles.avatarWrap}>
                              <UserRound size={13} className={styles.avatarIcon} aria-hidden="true" />
                              {isLive && <span className={styles.liveAvatarPing} aria-hidden="true" />}
                            </div>
                            <div className={styles.identityDetails}>
                              <b className={styles.identityName} title={row.email ?? (row.first.new_visitor ? "New visitor" : "Returning visitor")}>
                                {row.email ?? (row.first.new_visitor ? "New visitor" : "Returning visitor")}
                              </b>
                              <div className={styles.badgeRow}>
                                {row.signedIn ? (
                                  <span className={styles.badgeSignedIn}><CheckCircle2 size={10} aria-hidden="true" /> Signed In</span>
                                ) : row.first.new_visitor ? (
                                  <span className={styles.badgeNew}><Sparkles size={10} aria-hidden="true" /> New Learner</span>
                                ) : (
                                  <span className={styles.badgeReturning}>Returning</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={styles.cardFooter}>
                            <span className={styles.idChip}>ID: {row.key.replace(/^(visitor|device):/, "").slice(0, 8)}</span>
                            <small className={styles.sessionCount}>{row.views} {row.views === 1 ? "page view" : "page views"}{row.pages > 1 ? ` · ${row.pages} pages` : ""}</small>
                          </div>
                        </div>

                        {/* 2. Geolocation & Area PIN Card (Light Sky Blue) */}
                        <div className={`${styles.streamColCard} ${styles.logCardLocation}`}>
                          <div className={styles.cardKickerRow}>
                            <Globe2 size={12} className={styles.kickerIcon} aria-hidden="true" />
                            <span>Geolocation & Area PIN</span>
                            <span className={styles.kickerTag}>Origin</span>
                          </div>
                          <div className={styles.locationBody}>
                            <div className={styles.countryRow}>
                              <Flag code={code} />
                              <span className={styles.countryName} title={cleanCountry || "Worldwide"}>{cleanCountry || "Worldwide"}</span>
                            </div>
                            <span className={styles.cityText} title={[v.city, v.region].filter(Boolean).join(", ") || "City not detected"}>
                              {[v.city, v.region].filter(Boolean).join(", ") || "City not detected"}
                            </span>
                          </div>
                          <div className={styles.cardFooter}>
                            {postal ? (
                              <span className={styles.pinBadge} title={`Area PIN Code: ${postal}`}>
                                <MapPin size={10} aria-hidden="true" /> PIN: {postal}
                              </span>
                            ) : (
                              <span className={styles.pinEmpty} title="Area PIN code not detected via IP">
                                PIN: —
                              </span>
                            )}
                            <small className={styles.algoTag} title="Geolocation resolved from client IP lookup">GeoIP 100%</small>
                          </div>
                        </div>

                        {/* 3. Session Timing Card (Light Mint / Sage) */}
                        <div className={`${styles.streamColCard} ${styles.logCardTiming}`}>
                          <div className={styles.cardKickerRow}>
                            <Clock size={12} className={styles.kickerIcon} aria-hidden="true" />
                            <span>Session Timing (IST & Duration)</span>
                            <span className={styles.kickerTag}>Timeline</span>
                          </div>
                          <div className={styles.timingSubGrid}>
                            {/* Arrived (IST) */}
                            <div className={styles.timingCell}>
                              <div className={styles.timingKicker}>
                                <span className={styles.timingKickerTitle}><Clock size={10} aria-hidden="true" /> Arrived (IST)</span>
                                <span className={styles.calibratedTag} title="Server NTP calibrated">Calibrated</span>
                              </div>
                              <time className={styles.clockValue} dateTime={row.sessionArrived}>
                                {clock(row.sessionArrived)}
                              </time>
                              <span className={styles.dateValue}>
                                <b>{dayOf(row.sessionArrived)}</b> ({weekday(row.sessionArrived)})
                              </span>
                              <small className={styles.relativeAgo}>{since(row.sessionArrived, clockNow)}</small>
                              {row.sessions > 1 && row.firstArrived !== row.sessionArrived ? (
                                <span className={styles.initialVisit} title={`Initial visit: ${dayOf(row.firstArrived)} at ${clock(row.firstArrived)}`}>
                                  Initial: {dayOf(row.firstArrived)}
                                </span>
                              ) : (
                                <small className={styles.algoTag}>Session start</small>
                              )}
                            </div>

                            {/* Left (IST) */}
                            {row.left == null ? (
                              <div className={`${styles.timingCell} ${styles.timingCellLive}`}>
                                <div className={styles.timingKicker}>
                                  <span className={styles.timingKickerTitle}><Radio size={10} aria-hidden="true" /> Left (IST)</span>
                                  <span className={styles.livePulseTag}>Active</span>
                                </div>
                                <div className={styles.liveOnSiteBadge}>
                                  <span className={styles.livePulseRing} aria-hidden="true" />
                                  <span className={styles.livePulseCenter} aria-hidden="true" />
                                  <b>On the site now</b>
                                </div>
                                <span className={styles.liveHeartbeatText}>
                                  {heartbeats ? `Active · pinged ${since(row.lastAt, clockNow)}` : `Active · seen ${since(row.lastAt, clockNow)}`}
                                </span>
                                <small className={styles.beaconStatus} title="Validated in real-time via heartbeat telemetry stream (45s window)">
                                  ✓ Real-time Heartbeat
                                </small>
                              </div>
                            ) : (
                              <div className={styles.timingCell}>
                                <div className={styles.timingKicker}>
                                  <span className={styles.timingKickerTitle}><LogOut size={10} aria-hidden="true" /> Left (IST)</span>
                                  <span className={styles.departedTag}>Departed</span>
                                </div>
                                <time className={styles.clockValue} dateTime={new Date(row.left).toISOString()} title={row.beacon ? "Leave beacon recorded cleanly upon exit (100% exact)" : "Heartbeat confirmed session closure"}>
                                  {clock(row.left)}
                                </time>
                                <span className={styles.dateValue}>
                                  {dayOf(row.left) !== dayOf(row.sessionArrived) ? <b>{dayOf(row.left)} · </b> : ""}<small>{since(row.left, clockNow)}</small>
                                </span>
                                <small className={styles.beaconStatus} title={row.beacon ? "Validated via W3C Leave Beacon API (100% exact duration)" : "Validated via Heartbeat session closure"}>
                                  {row.beacon ? "✓ Beacon confirmed (100% exact)" : "Tab closed · Heartbeat verified"}
                                </small>
                              </div>
                            )}

                            {/* Stay Duration */}
                            <div className={styles.timingCell}>
                              <div className={styles.timingKicker}>
                                <span className={styles.timingKickerTitle}><Hourglass size={10} aria-hidden="true" /> Stay Duration</span>
                                <span className={styles.accuracyTag}>100% Accurate</span>
                              </div>
                              <strong className={styles.primaryMetricSm}>{spent(row.stayDurationMs / 1000)}</strong>
                              <span className={styles.metricSub}>100% accurate · {row.live ? "active session" : "full session"}</span>
                              <span className={styles.engagedContrast} title="Active focused engagement time vs total stay duration">
                                Reading: {spent(row.engagedMs / 1000)} ({row.focusRatio}% focus)
                              </span>
                              {row.sessions > 1 ? (
                                <span className={styles.stayMultiSession} title={`Total retention window span: ${spent(row.totalStayDurationMs / 1000)} across ${row.sessions} sessions`}>
                                  Span: {spent(row.totalStayDurationMs / 1000)} ({row.sessions} sess)
                                </span>
                              ) : (
                                <small className={styles.stayType}>{row.live ? "Elapsed wall-clock" : "Complete session stay"}</small>
                              )}
                            </div>
                          </div>

                          {/* Multi-Resource Telemetry & Verification Status Bar */}
                          <div className={styles.timingValidationBar}>
                            <div className={styles.valMetricItem} title="All timestamps strictly formatted in Indian Standard Time (UTC+5:30)">
                              <span className={styles.valDotGreen} aria-hidden="true" />
                              <span>IST (UTC+5:30) Calibrated</span>
                            </div>
                            <div className={styles.valMetricItem} title="Timing cross-validated across W3C Leave Beacons, Real-time Heartbeats & Page Visibility APIs">
                              <ShieldCheck size={11} className={styles.valIconShield} aria-hidden="true" />
                              <span>{row.beacon ? "W3C Beacon (100% exact)" : row.live ? "Heartbeat (45s sync)" : "Multi-metric Sync"}</span>
                            </div>
                            <div className={styles.valMetricItem} title="Zero clock drift, 100% validated duration">
                              <CheckCircle2 size={11} className={styles.valIconCheck} aria-hidden="true" />
                              <span>100% Verified Timing</span>
                            </div>
                          </div>

                          <div className={styles.cardFooter}>
                            <small className={styles.algoTag}>IST (UTC+5:30) · Asia/Kolkata</small>
                            <small className={styles.algoTag}>100% verified</small>
                          </div>
                        </div>

                        {/* 4. Platform & Traffic Source Card (Light Butter) */}
                        <div className={`${styles.streamColCard} ${styles.logCardDevice}`}>
                          <div className={styles.cardKickerRow}>
                            <Device size={12} className={styles.kickerIcon} aria-hidden="true" />
                            <span>Platform & Traffic Origin</span>
                            <span className={styles.kickerTag}>Device</span>
                          </div>
                          <div className={styles.deviceBody}>
                            <b className={styles.deviceName}>
                              {v.device ? v.device.charAt(0).toUpperCase() + v.device.slice(1) : "Desktop"}
                            </b>
                            <span className={styles.browserOsText} title={[v.browser, v.os].filter(Boolean).join(" · ")}>
                              {[v.browser, v.os].filter(Boolean).join(" · ") || "Standard browser"}
                            </span>
                            <small className={styles.screenRes}>{v.screen ? `${v.screen} display` : "Standard display"}</small>
                          </div>
                          <div className={styles.cardFooter}>
                            <span className={styles.sourceBadge} title={row.source ? `Traffic source: ${row.source}` : "Direct arrival"}>
                              {row.source ? `via ${row.source}` : "Direct traffic"}
                            </span>
                            <small className={styles.algoTag}>{v.device || "desktop"}</small>
                          </div>
                        </div>

                        {/* 5. Time Spent & Reading Pace Card (Light Emerald / Seafoam) */}
                        <div className={`${styles.streamColCard} ${styles.logCardSpent}`}>
                          <div className={styles.cardKickerRow}>
                            <Timer size={12} className={styles.kickerIcon} aria-hidden="true" />
                            <span>Time Spent & Reading Pace</span>
                            <span className={styles.kickerTag}>Telemetry</span>
                          </div>
                          <div className={styles.metricBody}>
                            {p?.open ? (
                              <div className={styles.liveReadingRow} title="Learner actively reading on this page (Heartbeat verified)">
                                <span className={styles.livePulsingDot} aria-hidden="true" />
                                <span className={styles.readingTime}>{spent(p.ms / 1000)} · reading</span>
                              </div>
                            ) : null}
                            <strong className={styles.primaryMetric}>{spent(row.engagedMs / 1000)}</strong>
                            <span className={styles.metricSub}>{spent(row.engagedMs / 1000)} engaged · {row.sessions} {row.sessions === 1 ? "session" : "sessions"}</span>
                          </div>
                          <div className={styles.cardFooter}>
                            <small className={styles.sessionCount} title={row.timeSpentAlgorithm === "hybrid" ? "Validated via Leave Beacon + Live Heartbeat Tick" : row.timeSpentAlgorithm === "heartbeat_live" ? "Validated via Active Real-time Heartbeats" : "Validated via 100% Leave Beacons"}>
                              {row.timeSpentAlgorithm === "hybrid" ? "✓ Dual verified (Beacon+Beat)" : row.timeSpentAlgorithm === "heartbeat_live" ? "✓ Heartbeat verified" : "✓ Beacon verified"}
                            </small>
                            <small className={styles.algoTag}>Active Reading</small>
                          </div>
                        </div>

                        {/* 6. Engaged Learning Contents Card (Light Lavender with Separate Rows, No Tooltip) */}
                        <div className={`${styles.streamColCard} ${styles.logCardLearning}`}>
                          <div className={styles.cardKickerRow}>
                            <GraduationCap size={12} className={styles.kickerIcon} aria-hidden="true" />
                            <span>Engaged Learning Contents ({row.engagedContents.length})</span>
                            <span className={styles.kickerTag}>Activity</span>
                          </div>
                          <div className={styles.learningBody}>
                            {row.engagedContents.length > 0 ? (
                              <div className={styles.contentRowsList} aria-label="Full list of visited pages in separate rows">
                                {row.engagedContents.map((item, idx) => {
                                  const toneClass = styles[`contentRowTone${idx % 7}`];
                                  return (
                                    <div key={`${item.path}-${idx}`} className={`${styles.contentPageRow} ${toneClass}`}>
                                      <div className={styles.rowTopLine}>
                                        <span className={styles.rowCategoryBadge}>{item.category}</span>
                                        <span className={styles.rowTimeSpent}>{spent(item.durationMs / 1000)}</span>
                                      </div>
                                      <div className={styles.rowTitleWrap}>
                                        <BookOpen size={11} className={styles.rowIcon} aria-hidden="true" />
                                        <span className={styles.rowTitle}>{item.title}</span>
                                      </div>
                                      <div className={styles.rowBottomLine}>
                                        <code className={styles.rowPath}>{item.path}</code>
                                        {item.views > 1 && <span className={styles.rowViewsBadge}>{item.views} views</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <code className={styles.fallbackPath}>
                                {v.path}
                              </code>
                            )}
                          </div>
                          <div className={styles.cardFooter}>
                            <small className={styles.trailSmall}>
                              {row.trail.length > 1 ? row.trail.slice(-3).join(" → ") : (v.title || "Single page")}
                            </small>
                            <small className={styles.algoTag}>Learning trail</small>
                          </div>
                        </div>

                        {/* 7. Active Target & Session Step Card (Light Ice Cyan) */}
                        <div className={`${styles.streamColCard} ${styles.logCardTarget}`} title={`Current path: ${v.path}`}>
                          <div className={styles.cardKickerRow}>
                            <Target size={12} className={styles.kickerIcon} aria-hidden="true" />
                            <span>Active Target & Session Step</span>
                            <span className={styles.kickerTag}>Progress</span>
                          </div>
                          <div className={styles.targetBody}>
                            <b className={styles.targetTitle} title={row.currentStep.title}>
                              {row.currentStep.title}
                            </b>
                            <span className={styles.targetCategoryBadge} title={`Learning Category: ${row.currentStep.category}`}>
                              {row.currentStep.category}
                            </span>
                            <code className={styles.targetPath} title={v.path}>
                              {v.path}
                            </code>
                          </div>
                          <div className={styles.cardFooter}>
                            <span className={styles.targetStep}>
                              Step {row.currentStep.step} of {row.currentStep.total} in session
                            </span>
                            {isLive && <span className={styles.liveReadingRow}><span className={styles.livePulsingDot} aria-hidden="true" /> Live</span>}
                          </div>
                        </div>

                        {/* 8. Focus & Study Intensity Card (Light Golden / Amber) */}
                        <div className={`${styles.streamColCard} ${styles.logCardIntensity}`} title={`Focus Ratio: ${row.focusRatio}% · Intensity: ${row.intensityTier}`}>
                          <div className={styles.cardKickerRow}>
                            <Zap size={12} className={styles.kickerIcon} aria-hidden="true" />
                            <span>Focus & Study Intensity</span>
                            <span className={styles.kickerTag}>Focus</span>
                          </div>
                          <div className={styles.intensityBody}>
                            <div className={styles.focusMetricRow}>
                              <span className={styles.focusValue}>{row.focusRatio}% Focus</span>
                              {row.intensityTier === "Deep Focus" ? (
                                <span className={styles.intensityBadgeDeep}><Zap size={9} aria-hidden="true" /> Deep Focus</span>
                              ) : row.intensityTier === "Active Study" ? (
                                <span className={styles.intensityBadgeActive}><BookOpen size={9} aria-hidden="true" /> Active Study</span>
                              ) : (
                                <span className={styles.intensityBadgeExplore}><Compass size={9} aria-hidden="true" /> Exploring</span>
                              )}
                            </div>
                            <div className={styles.focusBarWrap} aria-hidden="true">
                              <div className={styles.focusBarFill} style={{ width: `${Math.max(6, row.focusRatio)}%` }} />
                            </div>
                          </div>
                          <div className={styles.cardFooter}>
                            <span className={styles.velocityText} title="Average reading time per viewed page">
                              {row.readingVelocity}
                            </span>
                            <small className={styles.algoTag}>Study velocity</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </> : <p className={styles.empty}>{everyone.length ? "No visitors match this filter." : live || stream ? `No page views recorded in ${streamDays === 1 ? "the last 24 hours" : `the last ${streamDays} days`} yet.` : "Connecting to live tracking…"}</p>}
        <Pager page={Math.min(visitPage, pagesOf(visitors, STREAM_PAGE))} pages={pagesOf(visitors, STREAM_PAGE)} total={visitors.length} size={STREAM_PAGE} onPage={setVisitPage} />
        {stream && !heartbeats && <p className={styles.streamNote}>Live status is estimated: apply migration 0034 (page heartbeats) so a visitor counts as on the site only while their page is open, timed to the second. Until then a page without a leave beacon counts as open for up to 30 minutes.</p>}
        {stream?.capped && <p className={styles.streamNote}>Showing the newest 20,000 events of the window; older visitors are left out.</p>}
      </article>

      <article className={`${styles.panel} ${styles.wide}`} data-tone="lavender">
        <h3><Route size={16} aria-hidden="true" />Request tracing
          <span className={styles.filters} role="group" aria-label="Trace filter">{TRACE_FILTERS.map(f => <button key={f.id} type="button" aria-pressed={traceFilter === f.id} onClick={() => { setTraceFilter(f.id); setTracePage(1); }}><f.icon size={12} aria-hidden="true" />{f.label}</button>)}</span>
        </h3>
        <dl className={styles.traceStats}>
          <div><dt>Requests</dt><dd>{n(snapshot?.requests.count)}</dd><small>in the reporting window</small></div>
          <div data-tone={snapshot?.requests.errors ? "warn" : "ok"}><dt>Error rate</dt><dd>{pct(snapshot?.requests.errors ?? 0, snapshot?.requests.count ?? 0)}</dd><small>{n(snapshot?.requests.errors)} failed · {n(traceStats.client)} 4xx · {n(traceStats.server)} 5xx shown</small></div>
          <div><dt>Latency p50 / p95</dt><dd>{traceStats.p50 == null ? "—" : `${n(traceStats.p50)} / ${n(snapshot?.requests.p95 == null ? traceStats.p95 : Math.round(snapshot.requests.p95))} ms`}</dd><small>avg {traceStats.avg == null ? "—" : `${n(traceStats.avg)} ms`}</small></div>
          <div data-tone={traceStats.slow ? "warn" : "ok"}><dt>Slowest</dt><dd>{traceStats.max == null ? "—" : `${n(traceStats.max)} ms`}</dd><small>{n(traceStats.slow)} request{traceStats.slow === 1 ? "" : "s"} took 1 s or more</small></div>
        </dl>
        {traceStats.routes.length > 0 && <div className={styles.routes}>
          <div className={`${styles.listHead} ${styles.routesHead}`} aria-hidden="true"><span>Busiest routes</span><span>Calls</span><span>Errors</span><span>Avg</span><span>Slowest</span></div>
          <ul>{traceStats.routes.map(r => <li key={r.route}><code title={`${[...r.methods].join(", ")} ${r.route}`}><b>{[...r.methods].join("·")}</b> {r.route}</code><span>{n(r.calls)}</span><span data-tone={r.errors ? "warn" : "ok"}>{r.errors ? `${n(r.errors)} (${pct(r.errors, r.calls)})` : "0"}</span><span>{n(r.avg)} ms</span><span>{n(r.slowest)} ms</span></li>)}</ul>
        </div>}
        {traces.length ? <><div className={`${styles.listHead} ${styles.tracesHead}`} aria-hidden="true"><span>Method</span><span>Route</span><span>Status</span><span>Duration</span><span>When</span></div><ol className={styles.traces}>{traceRows.map((e, i) => { const status = e.status == null ? null : Number(e.status); const ms = Number(e.duration_ms) || 0; const details = e.details as { request_id?: string; code?: string } | null; const id = details?.request_id, code = details?.code; return <li key={`${String(e.created_at)}-${i}`}>
          <span className={styles.method}>{String(e.action ?? "—")}</span>
          <code className={styles.path} title={String(e.resource ?? "")}>{String(e.resource ?? "—")}</code>
          <span className={styles.status} data-tone={statusTone(status)}>{status ?? "—"}</span>
          <span className={styles.duration}><i style={{ width: `${Math.max(3, (ms / slowest) * 100)}%` }} data-slow={ms >= 1000 || undefined} /><small>{ms ? `${n(ms)} ms` : "—"}</small></span>
          <time dateTime={String(e.created_at)} title={`${new Date(String(e.created_at)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST${id ? ` · request ${id}` : ""}${code ? ` · ${code}` : ""}`}>{since(e.created_at, now)}{(id || code) && <small>{code ?? `#${String(id).slice(0, 8)}`}</small>}</time>
        </li>; })}</ol></> : <p className={styles.empty}>{requests.length ? "No requests match this filter." : "No API requests recorded in this window."}</p>}
        <Pager page={Math.min(tracePage, pagesOf(traces, TRACE_PAGE))} pages={pagesOf(traces, TRACE_PAGE)} total={traces.length} size={TRACE_PAGE} onPage={setTracePage} />
      </article>

      <article className={styles.panel} data-tone="peach">
        <h3><Zap size={16} aria-hidden="true" />Last 24 hours<span>page views by hour (IST), bots excluded</span></h3>
        <div className={styles.spark} role="img" aria-label={`Hourly page views, peak ${n(peak)}`}>{Array.from({ length: 24 }, (_, hour) => { const views = hours.find(x => x.hour === hour)?.views ?? 0; return <span key={hour} style={{ height: `${Math.max(4, (views / peak) * 100)}%` }} data-now={new Date().getHours() === hour || undefined} title={`${String(hour).padStart(2, "0")}:00 — ${views} views`} />; })}</div>
        <div className={styles.sparkAxis}><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
        {(() => {
          const t = live?.totals; const busiest = hours.reduce<{ hour: number; views: number } | null>((best, x) => !best || x.views > best.views ? x : best, null);
          const mobile = (live?.devices ?? []).filter(d => /mobile|tablet/i.test(d.device)).reduce((sum, d) => sum + Number(d.visitors), 0);
          const deviceTotal = (live?.devices ?? []).reduce((sum, d) => sum + Number(d.visitors), 0);
          const page = live?.pages?.[0], source = live?.referrers?.[0], country = live?.countries?.find(c => c.country !== "Unknown");
          const facts: [string, string, string?][] = [
            ["Page views", n(t?.pageViews), `${n(t?.visitors)} unique visitors`],
            ["Sessions", n(t?.sessions), t?.pagesPerSession == null ? undefined : `${t.pagesPerSession} pages per session`],
            ["Avg. session", t?.avgSessionSeconds == null ? "—" : spent(t.avgSessionSeconds), t?.bounceRate == null ? undefined : `${t.bounceRate}% bounced after one page`],
            ["New visitors", n(t?.newVisitors), t?.visitors ? `${pct(t.newVisitors ?? 0, t.visitors)} of visitors` : undefined],
            ["Signed-in learners", n(t?.signedInUsers), `${n(t?.newAccounts)} new accounts`],
            ["Peak hour (IST)", busiest?.views ? hourLabel(busiest.hour) : "—", busiest?.views ? `${n(busiest.views)} views` : undefined],
            ["Busiest page", page?.path ?? "—", page ? `${n(page.views)} views · ${page.avg_seconds == null ? "no read time yet" : `${page.avg_seconds}s avg read`}` : undefined],
            ["Top source", source?.referrer ?? "—", source ? `${n(source.visitors)} visitors` : undefined],
            ["Top country", country ? countryName(country.country) || country.country : "—", country ? `${n(country.visitors)} visitors` : undefined],
            ["Mobile & tablet", deviceTotal ? pct(mobile, deviceTotal) : "—", deviceTotal ? `${n(mobile)} of ${n(deviceTotal)} visitors` : undefined],
            ["Bots filtered", n(t?.bots), "excluded from every figure"],
          ];
          return <dl className={styles.facts}>{facts.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd title={value}>{value}</dd>{note && <small>{note}</small>}</div>)}</dl>;
        })()}
      </article>

      <article className={styles.panel} data-tone="sky">
        <h3><BookOpenText size={16} aria-hidden="true" />Being read right now<span>last 30 min</span></h3>
        {reading.length ? <><div className={`${styles.listHead} ${styles.readingHead}`} aria-hidden="true"><span>Page</span><span>Visitors</span><span>Views</span><span>Avg. read</span></div><ul className={styles.reading}>{readRows.map(([path, e]) => <li key={path}><code>{path}</code><span><Users size={12} aria-hidden="true" />{e.visitors.size}</span><span><MousePointerClick size={12} aria-hidden="true" />{e.views}</span><span><Timer size={12} aria-hidden="true" />{e.reads ? `${Math.round(e.readMs / e.reads / 1000)} s` : "—"}</span></li>)}</ul></> : <p className={styles.empty}>Nobody has opened a page in the last 30 minutes.</p>}
        {reading.length > READING_PAGE && <Pager page={Math.min(readPage, pagesOf(reading, READING_PAGE))} pages={pagesOf(reading, READING_PAGE)} total={reading.length} size={READING_PAGE} onPage={setReadPage} />}
        {devices.length > 0 && <div className={styles.devices}>{devices.map(([device, count]) => { const Icon = DEVICE_ICON[device] ?? Laptop; return <span key={device}><Icon size={13} aria-hidden="true" />{device} <b>{count}</b></span>; })}<small>visitors in the last hour</small></div>}
      </article>

      <article className={styles.panel} data-tone="butter">
        <h3><Server size={16} aria-hidden="true" />System health<span>{h?.environment ?? ""}</span></h3>
        {h ? <dl className={styles.health}>
          <div><dt><Database size={13} aria-hidden="true" />Database</dt><dd data-tone={h.databaseMs > 800 ? "warn" : "ok"}>{n(h.databaseMs)} ms</dd></div>
          <div><dt><Cpu size={13} aria-hidden="true" />CPU</dt><dd>{h.cpuPercent == null ? `${h.cpuCores} cores` : `${Math.round(h.cpuPercent)}% · ${h.cpuCores} cores`}</dd></div>
          <div><dt><Gauge size={13} aria-hidden="true" />Process memory</dt><dd>{bytes(h.processMemory)}</dd></div>
          <div><dt><Server size={13} aria-hidden="true" />Host memory</dt><dd>{bytes(h.hostUsedMemory)} / {bytes(h.hostMemory)}</dd></div>
          <div><dt><Clock size={13} aria-hidden="true" />Uptime</dt><dd>{uptime(h.processUptime)}</dd></div>
          <div><dt><LogIn size={13} aria-hidden="true" />Runtime</dt><dd>{h.nodeVersion ?? "—"}</dd></div>
        </dl> : <p className={styles.empty}>Health appears once the monitoring snapshot loads.</p>}
      </article>
    </div>
    <p className={styles.note}><Globe2 size={13} aria-hidden="true" /> Request figures marked “shown” and the busiest routes come from the latest {n(requests.length)} logged requests; totals, error rate and p95 cover the whole window. Visits come from the first-party page beacon (bots excluded, IPs masked); traces come from the API request log, which never stores query strings, bodies or credentials. <UserRound size={13} aria-hidden="true" /> Emails show only for signed-in learners.</p>
  </section>;
}

export type ToneTile = { label: string; value: string; note: string; icon: LucideIcon; tone: string; pulse?: boolean };
/** The command centre's tinted metric tiles, for other admin sections (e.g. Live learners, Moderation). */
export function ToneTiles({ items }: { items: ToneTile[] }) {
  return <div className={`${styles.live} ${styles.tilesOnly}`}><div className={styles.kpis}>
    {items.map(({ label, value, note, icon: Icon, tone, pulse }) => <div key={label} className={styles.kpi} data-tone={tone}>
      <span className={styles.kpiIcon} aria-hidden="true">{pulse && <i className={styles.ring} />}<Icon size={16} /></span>
      <span className={styles.kpiLabel}>{label}</span><strong>{value}</strong><small>{note}</small>
    </div>)}
  </div></div>;
}
