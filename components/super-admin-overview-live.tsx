"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, BookOpenText, Clock, Cpu, Database, Gauge, Globe2, Laptop, LogIn, MousePointerClick, Pause, Play, Radio, RefreshCw, Route, Server, Smartphone, Tablet, Timer, UserRound, Users, Zap, type LucideIcon } from "lucide-react";
import { Flag, countryName } from "./super-admin-audience";
import { Pager } from "./super-admin-table";
import styles from "./super-admin-overview-live.module.css";

type Row = Record<string, unknown>;
type Visit = { created_at: string; event: string; person?: string; email?: string | null; visitor_id: string; session_id: string; new_visitor?: boolean; path: string; title?: string | null; country?: string | null; city?: string | null; region?: string | null; device?: string | null; browser?: string | null; os?: string | null; duration_ms?: number | null; referrer_host?: string | null };
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
  const s = Math.max(0, (now - new Date(String(iso)).getTime()) / 1000);
  return s < 10 ? "now" : s < 60 ? `${Math.round(s)}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`;
};
const spent = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};
// A page still open (no leave beacon) counts as being read for at most the session's 30 idle minutes.
const OPEN_MS = 30 * 60_000;
const bytes = (value: number) => value >= 1 << 30 ? `${(value / (1 << 30)).toFixed(1)} GB` : `${Math.round(value / (1 << 20))} MB`;
const uptime = (seconds: number) => seconds >= 86400 ? `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h` : seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m` : `${Math.round(seconds / 60)}m`;
const DEVICE_ICON: Record<string, LucideIcon> = { mobile: Smartphone, tablet: Tablet, desktop: Laptop };
type TraceFilter = "all" | "client" | "server" | "slow";
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
  const [seen, setSeen] = useState<Set<string>>(new Set());
  // The previous refresh, so visits that arrived since then can be highlighted.
  const previous = useRef<Live | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/super-admin/activity?days=1", { cache: "no-store", signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "service_error");
      // A malformed payload must degrade this panel, never take the whole dashboard down with it.
      if (typeof body?.totals !== "object" || body.totals === null || !Array.isArray(body.recent) || !Array.isArray(body.hours)) throw new Error("service_error");
      if (previous.current) setSeen(new Set(previous.current.recent.map(v => `${v.created_at}${v.visitor_id}`)));
      previous.current = body; setLive(body);
      setError("");
    } catch (e) { if (!signal?.aborted && !(e instanceof DOMException)) setError(e instanceof Error && e.message === "migration_required" ? "Live visitor tracking needs migration 0023 (User activity)." : "Live tracking is unavailable right now; retrying."); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); });
    if (paused) return () => controller.abort();
    const timer = setInterval(() => { if (document.visibilityState === "visible") { void load(controller.signal); onRefreshSnapshot(); } }, REFRESH_MS);
    return () => { controller.abort(); clearInterval(timer); };
  }, [load, paused, onRefreshSnapshot]);
  // A one-second clock keeps the "x seconds ago" labels honest between refreshes.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const visits = useMemo(() => (live?.recent ?? []).filter(v => v.event === "page_view"), [live]);
  // Time spent per stream row: the page's own read time (its leave beacon, or a live clock while still open)
  // and the person's total engaged time on the platform in the 24 h window.
  const timing = useMemo(() => {
    const recent = live?.recent ?? [];
    const leaves = new Map<string, number[]>(), latest = new Map<string, number>(), opened = new Map<string, number>();
    for (const v of recent) {
      const at = Date.parse(v.created_at);
      if (v.event === "page_leave" && v.duration_ms != null) { const key = `${v.session_id}|${v.path}`; leaves.set(key, [...(leaves.get(key) ?? []), at]); }
      if (v.event === "page_view") latest.set(v.session_id, Math.max(latest.get(v.session_id) ?? 0, at));
    }
    const durations = new Map(recent.filter(v => v.event === "page_leave").map(v => [`${v.session_id}|${v.path}|${Date.parse(v.created_at)}`, v.duration_ms ?? 0]));
    const page = (v: Visit) => {
      const at = Date.parse(v.created_at), key = `${v.session_id}|${v.path}`;
      const left = (leaves.get(key) ?? []).filter(t => t >= at).sort((a, b) => a - b)[0];
      if (left != null) return { ms: durations.get(`${key}|${left}`) ?? 0, open: false };
      if (latest.get(v.session_id) === at && now - at < OPEN_MS) return { ms: now - at, open: true };
      return null;
    };
    for (const v of recent) { const p = v.event === "page_view" && v.person ? page(v) : null; if (p?.open) opened.set(v.person!, (opened.get(v.person!) ?? 0) + p.ms); }
    const people = new Map((live?.people ?? []).map(p => [p.person, p]));
    const total = (v: Visit) => { const p = v.person ? people.get(v.person) : undefined; return p ? { seconds: Number(p.engaged_seconds) + (opened.get(p.person) ?? 0) / 1000, sessions: Number(p.sessions) } : null; };
    return { page, total };
  }, [live, now]);
  const lastHour = useMemo(() => (live?.recent ?? []).filter(v => v.event === "page_view" && now - Date.parse(v.created_at) < 3600_000), [live, now]);
  const reading = useMemo(() => {
    const recent = (live?.recent ?? []).filter(v => now - Date.parse(v.created_at) < 30 * 60_000);
    const byPath = new Map<string, { views: number; visitors: Set<string>; readMs: number; reads: number }>();
    for (const v of recent) {
      const entry = byPath.get(v.path) ?? { views: 0, visitors: new Set(), readMs: 0, reads: 0 };
      if (v.event === "page_view") { entry.views++; entry.visitors.add(v.visitor_id); }
      if (v.event === "page_leave" && v.duration_ms) { entry.readMs += v.duration_ms; entry.reads++; }
      byPath.set(v.path, entry);
    }
    return [...byPath].filter(([, e]) => e.views).sort((a, b) => b[1].visitors.size - a[1].visitors.size || b[1].views - a[1].views);
  }, [live, now]);
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
  const visitRows = pageOf(visits, visitPage, STREAM_PAGE), traceRows = pageOf(traces, tracePage, TRACE_PAGE), readRows = pageOf(reading, readPage, READING_PAGE);
  const hours = live?.hours ?? [];
  const peak = Math.max(1, ...hours.map(h => h.views));
  const h = snapshot?.health;

  const kpis: { label: string; value: string; note: string; icon: LucideIcon; tone: string; pulse?: boolean }[] = [
    { label: "On the site now", value: n(live?.totals.liveNow), note: `${n(live?.totals.liveSignedIn)} signed in · last 5 min`, icon: Radio, tone: "mint", pulse: true },
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
        <span className={styles.updated} aria-live="polite">Updated {since(live?.generatedAt, now)}</span>
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
      <article className={`${styles.panel} ${styles.wide}`} data-tone="mint">
        <h3><Radio size={16} aria-hidden="true" />Live visitor stream<span>{visits.length ? `${visits.length} views in 24 h` : ""}</span></h3>
        {visits.length ? <><div className={`${styles.listHead} ${styles.streamHead}`} aria-hidden="true"><span /><span>Visitor · location</span><span>Page · device</span><span>Time spent</span><span>When</span></div><ol className={styles.stream}>{visitRows.map((v, i) => { const id = `${v.created_at}${v.visitor_id}`, key = `${id}-${i}`; const Device = DEVICE_ICON[(v.device || "desktop").toLowerCase()] ?? Laptop; const code = v.country ?? ""; return <li key={key} data-new={live && seen.size > 0 && !seen.has(id) || undefined}>
          <Flag code={code} />
          <span className={styles.who}><b>{v.email ?? (v.new_visitor ? "New visitor" : "Returning visitor")}</b><small>{[v.city, code ? countryName(code) : ""].filter(Boolean).join(", ") || "Location unknown"}</small></span>
          <span className={styles.what}><code title={v.title ?? v.path}>{v.path}</code><small><Device size={12} aria-hidden="true" />{[v.browser, v.os].filter(Boolean).join(" · ") || "Unknown device"}{v.referrer_host ? ` · from ${v.referrer_host}` : ""}</small></span>
          {(() => { const p = timing.page(v), t = timing.total(v); return <span className={styles.spent} title="Time on this page · total time on the platform in the last 24 h">
            <b data-open={p?.open || undefined}><Timer size={12} aria-hidden="true" />{p ? `${spent(p.ms / 1000)}${p.open ? " · reading" : ""}` : "—"}</b>
            <small>{t ? `${spent(t.seconds)} on site · ${t.sessions} ${t.sessions === 1 ? "session" : "sessions"}` : "Total time unknown"}</small>
          </span>; })()}
          <time dateTime={v.created_at}>{since(v.created_at, now)}</time>
        </li>; })}</ol></> : <p className={styles.empty}>{live ? "No page views recorded in the last 24 hours yet." : "Connecting to live tracking…"}</p>}
        <Pager page={Math.min(visitPage, pagesOf(visits, STREAM_PAGE))} pages={pagesOf(visits, STREAM_PAGE)} total={visits.length} size={STREAM_PAGE} onPage={setVisitPage} />
      </article>

      <article className={styles.panel} data-tone="sky">
        <h3><BookOpenText size={16} aria-hidden="true" />Being read right now<span>last 30 min</span></h3>
        {reading.length ? <><div className={`${styles.listHead} ${styles.readingHead}`} aria-hidden="true"><span>Page</span><span>Visitors</span><span>Views</span><span>Avg. read</span></div><ul className={styles.reading}>{readRows.map(([path, e]) => <li key={path}><code>{path}</code><span><Users size={12} aria-hidden="true" />{e.visitors.size}</span><span><MousePointerClick size={12} aria-hidden="true" />{e.views}</span><span><Timer size={12} aria-hidden="true" />{e.reads ? `${Math.round(e.readMs / e.reads / 1000)} s` : "—"}</span></li>)}</ul></> : <p className={styles.empty}>Nobody has opened a page in the last 30 minutes.</p>}
        {reading.length > READING_PAGE && <Pager page={Math.min(readPage, pagesOf(reading, READING_PAGE))} pages={pagesOf(reading, READING_PAGE)} total={reading.length} size={READING_PAGE} onPage={setReadPage} />}
        {devices.length > 0 && <div className={styles.devices}>{devices.map(([device, count]) => { const Icon = DEVICE_ICON[device] ?? Laptop; return <span key={device}><Icon size={13} aria-hidden="true" />{device} <b>{count}</b></span>; })}<small>visitors in the last hour</small></div>}
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

      <article className={`${styles.panel} ${styles.full}`} data-tone="butter">
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
