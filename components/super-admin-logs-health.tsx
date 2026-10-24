"use client";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, AlertOctagon, AlertTriangle, BrainCircuit, CheckCircle2, Clock, Cpu, Database, Filter, Gauge, Globe2, HardDrive, Info, KeyRound, Layers, MonitorSmartphone,
  Pause, Play, RefreshCw, Search, Server, ShieldAlert, Sparkles, Wallet, X, Zap, type LucideIcon } from "lucide-react";
import { requestJson } from "@/lib/client";
import { VITAL_THRESHOLDS, vitalRating, type Issue, type LogEntry, type LogLevel, type LogSource, type Percentiles, type VitalName } from "@/lib/logs-health";
import { Pager } from "./super-admin-pager";
import styles from "./super-admin-logs-health.module.css";

type Check = { id: string; label: string; ok: boolean; ms: number | null; note?: string };
type Route = Percentiles & { route: string; methods: string[]; calls: number; errors5xx: number; errors4xx: number; lastError: string | null };
type Group = Percentiles & { name: string; calls: number; failures: number; tokens: number; cost: number };
type Report = {
  generatedAt: string; hours: number; sampled: boolean; events: number; score: number; issues: Issue[]; checks: Check[];
  runtime: { processUptime: number; processMemory: number; heapUsed: number; hostMemory: number; hostUsedMemory: number; memoryPercent: number | null; cpuCores: number; cpuPercent: number | null; nodeVersion: string; region: string | null; deployment: string | null; env?: string };
  series: { t: number; requests: number; errors: number; p95: number | null; ai: number; aiErrors: number; clientErrors: number }[];
  backend: Percentiles & { errors5xx: number; errors4xx: number; slow: number; perMinute: number }; routes: Route[];
  frontend: { vitals: Record<VitalName, number | null>; samples: number; loads: Percentiles; pages: { path: string; samples: number; LCP: number | null; INP: number | null; CLS: number | null; TTFB: number | null }[]; errors: { message: string; count: number; last: string; paths: string[]; source: string; kind: string }[] };
  ai: Percentiles & { calls: number; failures: number; fallbacks: number; tokensIn: number; tokensOut: number; cost: number; features: Group[]; models: Group[] };
  logs: LogEntry[];
};

const REFRESH_MS = 30_000;
const WINDOWS = [[1, "1 h"], [6, "6 h"], [24, "24 h"], [72, "3 days"], [168, "7 days"]] as const;
const CHECK_ICON: Record<string, LucideIcon> = { database: Database, auth: KeyRound, storage: HardDrive, cache: Layers, ai: BrainCircuit, payments: Wallet };
const SOURCE: Record<LogSource, { label: string; icon: LucideIcon }> = { backend: { label: "Backend", icon: Server }, frontend: { label: "Frontend", icon: MonitorSmartphone }, ai: { label: "AI", icon: BrainCircuit }, security: { label: "Security", icon: ShieldAlert }, system: { label: "System", icon: Cpu } };
const LEVEL: Record<LogLevel, { label: string; icon: LucideIcon }> = { error: { label: "Errors", icon: AlertOctagon }, warn: { label: "Warnings", icon: AlertTriangle }, info: { label: "Info", icon: Info } };
const SEVERITY: Record<Issue["severity"], { label: string; icon: LucideIcon }> = { critical: { label: "Critical", icon: AlertOctagon }, serious: { label: "Serious", icon: AlertTriangle }, warning: { label: "Warning", icon: Info } };
const LOG_PAGE = 12, ROUTE_PAGE = 8;

const n = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-IN").format(value);
const ms = (value: number | null | undefined) => value == null ? "—" : value >= 10_000 ? `${(value / 1000).toFixed(1)} s` : `${n(Math.round(value))} ms`;
const bytes = (value: number) => value >= 1 << 30 ? `${(value / (1 << 30)).toFixed(1)} GB` : `${Math.round(value / (1 << 20))} MB`;
const pct = (part: number, whole: number) => whole ? `${(part / whole * 100).toFixed(part / whole < .1 ? 1 : 0)}%` : "—";
const uptime = (s: number) => s >= 86400 ? `${Math.floor(s / 86400)}d ${Math.floor(s % 86400 / 3600)}h` : s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m` : `${Math.max(1, Math.round(s / 60))}m`;
const clock = (iso: string | number) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const page = <T,>(rows: T[], at: number, size: number) => rows.slice((at - 1) * size, at * size);
const pages = (rows: unknown[], size: number) => Math.max(1, Math.ceil(rows.length / size));
const scoreTone = (score: number) => score >= 85 ? "good" : score >= 60 ? "warn" : "bad";

/**
 * Super Admin → Logs & Health: is the application healthy right now, and if not, where. Live checks of every dependency,
 * the server's runtime, backend latency per route, frontend Core Web Vitals and script errors, AI latency, failures
 * and cost, detected issues, and a searchable log of every event behind those figures. Refreshes every 30 seconds
 * while the tab is visible (pausable).
 */
export function SuperAdminLogsHealth() {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  // Each live check's latency over the last refreshes, for the sparklines.
  const [history, setHistory] = useState<Record<string, number[]>>({});

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const next = await requestJson<Report>(`/api/super-admin/logs-health?hours=${hours}`, { signal, cache: "no-store" });
      setHistory(current => Object.fromEntries(next.checks.map(check => [check.id, [...(current[check.id] ?? []), check.ms ?? 0].slice(-20)])));
      setData(next); setError("");
    } catch (caught) { if (!signal?.aborted) setError(caught instanceof Error && /forbidden|signin/.test(caught.message) ? "Only a Super Admin can read application health." : "Health data could not be loaded; retrying."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [hours]);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); });
    if (paused) return () => controller.abort();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(controller.signal); }, REFRESH_MS);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [load, paused]);

  return <section className={styles.root} aria-label="Logs and health">
    <header className={styles.bar}>
      <div className={styles.windows} role="group" aria-label="Time window">{WINDOWS.map(([value, label]) => <button key={value} type="button" aria-pressed={hours === value} onClick={() => setHours(value)}><Clock size={13} aria-hidden="true" />{label}</button>)}</div>
      <div className={styles.barActions}>
        {data && <span className={styles.updated}>Updated {clock(data.generatedAt)} IST · {n(data.events)} events{data.sampled ? " (newest 8,000)" : ""}</span>}
        <button type="button" className={styles.button} onClick={() => void load()} disabled={loading}><RefreshCw size={14} aria-hidden="true" className={loading ? styles.spin : undefined} />Refresh</button>
        <button type="button" className={styles.button} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}{paused ? "Resume" : "Pause"}</button>
      </div>
    </header>
    {error && <p className={styles.warn} role="status">{error}</p>}
    {!data ? <p className={styles.empty}>{error ? "" : "Checking every service…"}</p> : <>
      <Pulse data={data} paused={paused} />
      <div className={styles.checks}>{data.checks.map(check => <CheckCard key={check.id} check={check} history={history[check.id] ?? []} />)}</div>
      <Kpis data={data} />
      <div className={styles.charts}>
        <Panel tone="sky" icon={Activity} title="Throughput" note="API requests per interval; failed (5xx) in red">
          <Bars series={data.series} hours={data.hours} />
        </Panel>
        <Panel tone="lavender" icon={Gauge} title="API latency" note="95th percentile server time per interval">
          <Line series={data.series} hours={data.hours} />
        </Panel>
      </div>
      <Issues issues={data.issues} />
      <Backend data={data} />
      <Frontend data={data} />
      <Ai data={data} />
      <Runtime data={data} />
      <LogExplorer logs={data.logs} />
    </>}
  </section>;
}

function Panel({ tone, icon: Icon, title, note, children, actions }: { tone: string; icon: LucideIcon; title: string; note?: string; children: ReactNode; actions?: ReactNode }) {
  return <article className={styles.panel} data-tone={tone}>
    <h3><Icon size={16} aria-hidden="true" />{title}{note && <span>{note}</span>}{actions}</h3>
    {children}
  </article>;
}

/** The live monitor: a heartbeat line that beats while the app is healthy, flattens and turns red when it is not. */
function Pulse({ data, paused }: { data: Report; paused: boolean }) {
  const tone = scoreTone(data.score), down = data.checks.filter(check => !check.ok);
  const status = down.length ? `${down.map(check => check.label).join(", ")} ${down.length === 1 ? "is" : "are"} not responding` : data.issues.length ? `${data.issues.length} ${data.issues.length === 1 ? "thing needs" : "things need"} attention` : "All systems healthy";
  return <div className={styles.pulse} data-tone={tone} data-paused={paused || undefined}>
    <div className={styles.score} style={{ ["--score" as string]: data.score }} role="img" aria-label={`Health score ${data.score} out of 100`}>
      <span><b>{data.score}</b><small>/ 100</small></span>
    </div>
    <div className={styles.pulseText}>
      <p className={styles.live}><i aria-hidden="true" />{paused ? "Live updates paused" : "Live · every 30 s"}</p>
      <h2>{status}</h2>
      <p>{data.checks.filter(check => check.ok).length} of {data.checks.length} services answering · API p95 {ms(data.backend.p95)} · {pct(data.backend.errors5xx, data.backend.count)} server errors · {data.runtime.env ?? "—"}{data.runtime.region ? ` · ${data.runtime.region}` : ""}</p>
    </div>
    <svg className={styles.ecg} viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
      <path className={styles.ecgGrid} d="M0 30H600M0 60H600M0 90H600" />
      <path className={styles.ecgLine} d={tone === "bad" ? "M0 60 H600" : "M0 60 H90 L105 60 L115 42 L125 60 H170 L182 60 L190 18 L202 102 L212 60 H260 L275 50 L292 60 H390 L405 60 L415 42 L425 60 H470 L482 60 L490 18 L502 102 L512 60 H560 L575 50 L592 60 H600"} />
    </svg>
  </div>;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className={styles.sparkEmpty}>building history…</span>;
  const max = Math.max(1, ...values), w = 100, h = 26;
  const points = values.map((value, i) => `${(i / (values.length - 1)) * w},${h - 2 - (value / max) * (h - 4)}`).join(" ");
  return <svg className={styles.spark} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`Latency over the last ${values.length} checks, up to ${max} ms`}><polyline points={points} /></svg>;
}

function CheckCard({ check, history }: { check: Check; history: number[] }) {
  const Icon = CHECK_ICON[check.id] ?? Server;
  const slow = check.ok && (check.ms ?? 0) > 800;
  return <div className={styles.check} data-state={!check.ok ? "down" : slow ? "slow" : "up"} title={check.note}>
    <span className={styles.checkIcon} aria-hidden="true"><Icon size={17} /></span>
    <div className={styles.checkBody}>
      <b>{check.label}</b>
      <small>{!check.ok ? <><AlertOctagon size={12} aria-hidden="true" />Down</> : slow ? <><AlertTriangle size={12} aria-hidden="true" />Slow</> : <><CheckCircle2 size={12} aria-hidden="true" />Healthy</>} · {ms(check.ms)}</small>
    </div>
    <Sparkline values={history} />
    <p className={styles.checkNote}>{check.note}</p>
  </div>;
}

function Kpis({ data }: { data: Report }) {
  const lcp = data.frontend.vitals.LCP, lcpRating = vitalRating("LCP", lcp);
  const items: { label: string; value: string; note: string; icon: LucideIcon; tone: string }[] = [
    { label: "API requests", value: n(data.backend.count), note: `${data.backend.perMinute} / min · ${n(data.backend.slow)} slow`, icon: Zap, tone: "sky" },
    { label: "Server error rate", value: pct(data.backend.errors5xx, data.backend.count), note: `${n(data.backend.errors5xx)} 5xx · ${n(data.backend.errors4xx)} 4xx`, icon: AlertOctagon, tone: data.backend.errors5xx ? "rose" : "sage" },
    { label: "API latency p95", value: ms(data.backend.p95), note: `p50 ${ms(data.backend.p50)} · p99 ${ms(data.backend.p99)}`, icon: Gauge, tone: "lavender" },
    { label: "AI latency p95", value: ms(data.ai.p95), note: `${n(data.ai.calls)} calls · ${pct(data.ai.failures, data.ai.calls)} failed`, icon: BrainCircuit, tone: "peach" },
    { label: "Page LCP p75", value: ms(lcp), note: lcpRating ? `${lcpRating === "good" ? "Good" : lcpRating === "poor" ? "Poor" : "Needs improvement"} · ${n(data.frontend.samples)} page views` : "Collecting Web Vitals", icon: MonitorSmartphone, tone: lcpRating === "poor" ? "rose" : lcpRating === "needs-improvement" ? "butter" : "mint" },
    { label: "Script errors", value: n(data.frontend.errors.reduce((sum, item) => sum + item.count, 0)), note: `${n(data.frontend.errors.length)} distinct in browsers`, icon: AlertTriangle, tone: data.frontend.errors.length ? "butter" : "sage" },
  ];
  return <div className={styles.kpis}>{items.map(({ label, value, note, icon: Icon, tone }) => <div key={label} className={styles.kpi} data-tone={tone}>
    <span className={styles.kpiIcon} aria-hidden="true"><Icon size={16} /></span><span className={styles.kpiLabel}>{label}</span><strong>{value}</strong><small>{note}</small>
  </div>)}</div>;
}

const tick = (t: number, hours: number) => new Intl.DateTimeFormat("en-IN", hours > 24 ? { day: "numeric", month: "short", timeZone: "Asia/Kolkata" } : { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date(t));

/** Requests per interval as bars: successful in the tone, failed stacked on top in red, with a hover tooltip per bar. */
function Bars({ series, hours }: { series: Report["series"]; hours: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const peak = Math.max(1, ...series.map(s => s.requests));
  if (!series.some(s => s.requests)) return <p className={styles.empty}>No API requests in this window.</p>;
  const point = hover != null ? series[hover] : null;
  return <div className={styles.chart}>
    <div className={styles.bars} role="img" aria-label={`API requests per interval, peak ${peak}`} onMouseLeave={() => setHover(null)}>
      {series.map((s, i) => <span key={s.t} className={styles.barSlot} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1}>
        <i className={styles.barOk} style={{ height: `${((s.requests - s.errors) / peak) * 100}%` }} />
        {s.errors > 0 && <i className={styles.barBad} style={{ height: `${Math.max(3, (s.errors / peak) * 100)}%` }} />}
      </span>)}
    </div>
    <div className={styles.axis}><span>{tick(series[0].t, hours)}</span><span>{tick(series[Math.floor(series.length / 2)].t, hours)}</span><span>now</span></div>
    <p className={styles.tooltip} aria-live="polite">{point ? `${tick(point.t, hours)} · ${n(point.requests)} requests · ${n(point.errors)} failed · p95 ${ms(point.p95)}` : `Peak ${n(peak)} requests in one interval. Hover a bar for its figures.`}</p>
  </div>;
}

/** p95 latency per interval as one line, with a crosshair and readout on hover. */
function Line({ series, hours }: { series: Report["series"]; hours: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const values = series.map(s => s.p95);
  const peak = Math.max(1, ...values.filter((v): v is number => v != null));
  if (!values.some(v => v != null)) return <p className={styles.empty}>No timed requests in this window.</p>;
  const w = 600, h = 150, x = (i: number) => series.length < 2 ? w / 2 : (i / (series.length - 1)) * w, y = (v: number) => h - 6 - (v / peak) * (h - 16);
  const path = values.map((v, i) => v == null ? null : `${x(i)},${y(v)}`).filter(Boolean).join(" ");
  const point = hover != null ? series[hover] : null;
  return <div className={styles.chart}>
    <svg className={styles.line} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`API p95 latency per interval, peak ${ms(peak)}`}
      onMouseMove={event => { const box = event.currentTarget.getBoundingClientRect(); setHover(Math.round(((event.clientX - box.left) / box.width) * (series.length - 1))); }} onMouseLeave={() => setHover(null)}>
      <path className={styles.lineGrid} d={`M0 ${y(peak)}H${w}M0 ${y(peak / 2)}H${w}M0 ${h - 6}H${w}`} />
      <polyline className={styles.lineMark} points={path} />
      {hover != null && <line className={styles.crosshair} x1={x(hover)} x2={x(hover)} y1="0" y2={h} />}
      {hover != null && values[hover] != null && <circle className={styles.dot} cx={x(hover)} cy={y(values[hover]!)} r="5" />}
    </svg>
    <div className={styles.axis}><span>{tick(series[0].t, hours)}</span><span>{tick(series[Math.floor(series.length / 2)].t, hours)}</span><span>now</span></div>
    <p className={styles.tooltip} aria-live="polite">{point ? `${tick(point.t, hours)} · p95 ${ms(point.p95)} · ${n(point.requests)} requests` : `Peak p95 ${ms(peak)}. Move across the chart for each interval.`}</p>
  </div>;
}

function Issues({ issues }: { issues: Issue[] }) {
  return <Panel tone={issues.length ? "rose" : "mint"} icon={issues.length ? AlertTriangle : CheckCircle2} title="Detected issues" note={issues.length ? `${issues.length} need attention` : "Nothing needs attention"}>
    {issues.length ? <ul className={styles.issues}>{issues.map(issue => { const Icon = SEVERITY[issue.severity].icon, Area = SOURCE[issue.area].icon; return <li key={issue.id} data-severity={issue.severity}>
      <span className={styles.severity}><Icon size={14} aria-hidden="true" />{SEVERITY[issue.severity].label}</span>
      <div><b>{issue.title}</b><small>{issue.detail}</small></div>
      <span className={styles.area}><Area size={13} aria-hidden="true" />{SOURCE[issue.area].label}</span>
    </li>; })}</ul> : <p className={styles.allClear}><Sparkles size={15} aria-hidden="true" />Every service answers, error rates and latency are within target, and browsers report good Web Vitals.</p>}
  </Panel>;
}

function SearchBox({ value, onChange, placeholder, suggestions = [] }: { value: string; onChange: (value: string) => void; placeholder: string; suggestions?: string[] }) {
  const [open, setOpen] = useState(false);
  const shown = value.trim() ? suggestions.filter(item => item.toLowerCase().includes(value.trim().toLowerCase()) && item.toLowerCase() !== value.trim().toLowerCase()).slice(0, 6) : [];
  return <div className={styles.search}>
    <Search size={15} aria-hidden="true" />
    <input type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={event => { onChange(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} />
    {value && <button type="button" className={styles.clear} onClick={() => onChange("")} aria-label="Clear search"><X size={14} /></button>}
    {open && shown.length > 0 && <ul className={styles.suggest} role="listbox">{shown.map(item => <li key={item}><button type="button" role="option" aria-selected="false" onMouseDown={event => event.preventDefault()} onClick={() => { onChange(item); setOpen(false); }}><Search size={12} aria-hidden="true" />{item}</button></li>)}</ul>}
  </div>;
}

function Backend({ data }: { data: Report }) {
  const [query, setQuery] = useState(""), [sort, setSort] = useState<"calls" | "p95" | "errors">("calls"), [at, setAt] = useState(1);
  const rows = useMemo(() => data.routes.filter(route => route.route.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === "p95" ? (b.p95 ?? 0) - (a.p95 ?? 0) : sort === "errors" ? b.errors5xx - a.errors5xx || b.errors4xx - a.errors4xx : b.calls - a.calls), [data.routes, query, sort]);
  const slowest = Math.max(1, ...data.routes.map(route => route.p95 ?? 0));
  return <Panel tone="sky" icon={Server} title="Backend latency by route" note={`${n(data.routes.length)} routes · server time measured in api()`}>
    <div className={styles.tools}>
      <SearchBox value={query} onChange={value => { setQuery(value); setAt(1); }} placeholder="Search routes" suggestions={data.routes.map(route => route.route)} />
      <div className={styles.chips} role="group" aria-label="Sort routes">{([["calls", "Busiest", Activity], ["p95", "Slowest", Clock], ["errors", "Most errors", AlertOctagon]] as const).map(([id, label, Icon]) =>
        <button key={id} type="button" aria-pressed={sort === id} onClick={() => { setSort(id); setAt(1); }}><Icon size={13} aria-hidden="true" />{label}</button>)}</div>
    </div>
    {rows.length ? <div className={styles.tableWrap}><table className={styles.table}>
      <thead><tr><th>Route</th><th>Calls</th><th>Errors</th><th>p50</th><th>p95</th><th>p95 vs slowest</th><th>Max</th></tr></thead>
      <tbody>{page(rows, at, ROUTE_PAGE).map(route => <tr key={route.route}>
        <td><code>{route.route}</code><small>{route.methods.join(" · ")}{route.lastError ? ` · last 5xx ${clock(route.lastError)}` : ""}</small></td>
        <td>{n(route.calls)}</td>
        <td data-tone={route.errors5xx ? "bad" : route.errors4xx ? "warn" : "ok"}>{route.errors5xx ? `${n(route.errors5xx)} 5xx` : route.errors4xx ? `${n(route.errors4xx)} 4xx` : "0"}</td>
        <td>{ms(route.p50)}</td><td>{ms(route.p95)}</td>
        <td><span className={styles.meter}><i style={{ width: `${Math.max(3, ((route.p95 ?? 0) / slowest) * 100)}%` }} data-slow={(route.p95 ?? 0) >= 1500 || undefined} /></span></td>
        <td>{ms(route.max)}</td>
      </tr>)}</tbody>
    </table></div> : <p className={styles.empty}>{query ? "No route matches this search." : "No API requests in this window."}</p>}
    <Pager page={Math.min(at, pages(rows, ROUTE_PAGE))} pages={pages(rows, ROUTE_PAGE)} total={rows.length} size={ROUTE_PAGE} onPage={setAt} />
  </Panel>;
}

function Frontend({ data }: { data: Report }) {
  const [at, setAt] = useState(1);
  const { vitals, samples, pages: pagesList, errors, loads } = data.frontend;
  const label = (name: VitalName, value: number | null) => value == null ? "—" : name === "CLS" ? value.toFixed(3) : ms(value);
  const names: [VitalName, string][] = [["LCP", "Largest Contentful Paint"], ["INP", "Interaction to Next Paint"], ["CLS", "Cumulative Layout Shift"], ["FCP", "First Contentful Paint"], ["TTFB", "Time to First Byte"]];
  return <Panel tone="mint" icon={MonitorSmartphone} title="Frontend performance" note={`Core Web Vitals at the 75th percentile · ${n(samples)} page views${loads.count ? ` · dashboard load p95 ${ms(loads.p95)}` : ""}`}>
    <div className={styles.vitals}>{names.map(([name, full]) => { const value = vitals[name], rating = vitalRating(name, value), [good, poor] = VITAL_THRESHOLDS[name];
      const fill = value == null ? 0 : Math.min(100, (value / (poor * 1.25)) * 100);
      return <div key={name} className={styles.vital} data-rating={rating ?? "none"}>
        <span className={styles.vitalName}>{name}<small>{full}</small></span>
        <strong>{label(name, value)}</strong>
        <span className={styles.gauge} aria-hidden="true"><i style={{ width: `${fill}%` }} /><b style={{ left: `${(good / (poor * 1.25)) * 100}%` }} /><b style={{ left: `${(poor / (poor * 1.25)) * 100}%` }} /></span>
        <small className={styles.rating}>{rating === "good" ? <><CheckCircle2 size={12} aria-hidden="true" />Good</> : rating === "poor" ? <><AlertOctagon size={12} aria-hidden="true" />Poor</> : rating ? <><AlertTriangle size={12} aria-hidden="true" />Needs improvement</> : "No data yet"} · good ≤ {name === "CLS" ? good : ms(good)}</small>
      </div>; })}</div>
    {pagesList.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
      <thead><tr><th>Page</th><th>Views</th><th>LCP</th><th>INP</th><th>CLS</th><th>TTFB</th></tr></thead>
      <tbody>{page(pagesList, at, ROUTE_PAGE).map(row => <tr key={row.path}><td><code>{row.path}</code></td><td>{n(row.samples)}</td>
        {(["LCP", "INP", "CLS", "TTFB"] as VitalName[]).map(name => <td key={name} data-tone={vitalRating(name, row[name as "LCP"]) === "poor" ? "bad" : vitalRating(name, row[name as "LCP"]) === "needs-improvement" ? "warn" : "ok"}>{label(name, row[name as "LCP"])}</td>)}</tr>)}</tbody>
    </table></div>}
    <Pager page={Math.min(at, pages(pagesList, ROUTE_PAGE))} pages={pages(pagesList, ROUTE_PAGE)} total={pagesList.length} size={ROUTE_PAGE} onPage={setAt} />
    <h4 className={styles.sub}><AlertTriangle size={14} aria-hidden="true" />Script errors in browsers</h4>
    {errors.length ? <ul className={styles.errors}>{errors.slice(0, 8).map(item => <li key={item.message}><b>{item.message}</b><small>{item.count}× · {item.kind === "rejection" ? "unhandled rejection" : "uncaught error"}{item.source ? ` · ${item.source}` : ""} · last {clock(item.last)} · {item.paths.join(", ")}</small></li>)}</ul>
      : <p className={styles.empty}>No script errors reported by browsers in this window.</p>}
  </Panel>;
}

function GroupTable({ rows, label }: { rows: Group[]; label: string }) {
  const [at, setAt] = useState(1);
  if (!rows.length) return <p className={styles.empty}>No AI calls in this window.</p>;
  return <><div className={styles.tableWrap}><table className={styles.table}>
    <thead><tr><th>{label}</th><th>Calls</th><th>Failed</th><th>p50</th><th>p95</th><th>Tokens</th><th>Cost</th></tr></thead>
    <tbody>{page(rows, at, 6).map(row => <tr key={row.name}><td><code>{row.name}</code></td><td>{n(row.calls)}</td><td data-tone={row.failures ? "bad" : "ok"}>{row.failures ? `${n(row.failures)} (${pct(row.failures, row.calls)})` : "0"}</td><td>{ms(row.p50)}</td><td>{ms(row.p95)}</td><td>{n(row.tokens)}</td><td>{row.cost ? `$${row.cost.toFixed(3)}` : "—"}</td></tr>)}</tbody>
  </table></div><Pager page={Math.min(at, pages(rows, 6))} pages={pages(rows, 6)} total={rows.length} size={6} onPage={setAt} /></>;
}

function Ai({ data }: { data: Report }) {
  const { ai } = data;
  const facts: [string, string, string][] = [["Model calls", n(ai.calls), `${pct(ai.calls - ai.failures, ai.calls)} succeeded`], ["Failures", n(ai.failures), `${n(ai.fallbacks)} moved to a fallback provider`], ["Latency p50 / p95", `${ms(ai.p50)} / ${ms(ai.p95)}`, `slowest ${ms(ai.max)}`], ["Tokens", n(ai.tokensIn + ai.tokensOut), `${n(ai.tokensIn)} in · ${n(ai.tokensOut)} out`], ["Reported cost", ai.cost ? `$${ai.cost.toFixed(2)}` : "—", "only providers that report cost"]];
  return <Panel tone="peach" icon={BrainCircuit} title="AI performance" note="Every model call: feature, provider, latency, tokens">
    <dl className={styles.facts}>{facts.map(([dt, dd, small]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd><small>{small}</small></div>)}</dl>
    <div className={styles.twoUp}><div><h4 className={styles.sub}><Sparkles size={14} aria-hidden="true" />By feature</h4><GroupTable rows={ai.features} label="Feature" /></div>
      <div><h4 className={styles.sub}><Cpu size={14} aria-hidden="true" />By provider and model</h4><GroupTable rows={ai.models} label="Provider · model" /></div></div>
  </Panel>;
}

function Runtime({ data }: { data: Report }) {
  const r = data.runtime;
  const items: [LucideIcon, string, string, number | null][] = [
    [HardDrive, "Host memory", `${bytes(r.hostUsedMemory)} of ${bytes(r.hostMemory)}`, r.memoryPercent],
    [Cpu, "CPU", r.cpuPercent == null ? `${r.cpuCores} cores` : `${Math.round(r.cpuPercent)}% · ${r.cpuCores} cores`, r.cpuPercent == null ? null : Math.min(100, Math.round(r.cpuPercent))],
    [Layers, "Process memory", `${bytes(r.processMemory)} · heap ${bytes(r.heapUsed)}`, null],
    [Clock, "Instance uptime", uptime(r.processUptime), null],
    [Globe2, "Region · deployment", `${r.region ?? "local"} · ${r.deployment ?? "dev"}`, null],
    [Server, "Runtime", `${r.nodeVersion} · ${r.env ?? ""}`, null],
  ];
  return <Panel tone="butter" icon={Cpu} title="Server runtime" note="This server instance, read live">
    <dl className={styles.runtime}>{items.map(([Icon, label, value, meter]) => <div key={label}><dt><Icon size={13} aria-hidden="true" />{label}</dt><dd>{value}</dd>
      {meter != null && <span className={styles.meter}><i style={{ width: `${meter}%` }} data-slow={meter > 85 || undefined} /></span>}</div>)}</dl>
  </Panel>;
}

function LogExplorer({ logs }: { logs: LogEntry[] }) {
  const [query, setQuery] = useState(""), [source, setSource] = useState<LogSource | "all">("all"), [level, setLevel] = useState<LogLevel | "all">("all"), [at, setAt] = useState(1), [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => logs.filter(log => (source === "all" || log.source === source) && (level === "all" || log.level === level)
    && (!query.trim() || `${log.title} ${log.detail} ${log.path ?? ""} ${log.status ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))), [logs, source, level, query]);
  const suggestions = useMemo(() => [...new Set(logs.flatMap(log => [log.path ?? "", log.status ? String(log.status) : ""]).filter(Boolean))], [logs]);
  const count = (key: "source" | "level", value: string) => logs.filter(log => log[key] === value).length;
  const reset = () => { setQuery(""); setSource("all"); setLevel("all"); setAt(1); };
  return <Panel tone="lavender" icon={Filter} title="Log explorer" note={`${n(rows.length)} of ${n(logs.length)} newest events`}>
    <div className={styles.tools}>
      <SearchBox value={query} onChange={value => { setQuery(value); setAt(1); }} placeholder="Search logs: path, status, message" suggestions={suggestions} />
      {(query || source !== "all" || level !== "all") && <button type="button" className={styles.button} onClick={reset}><X size={14} aria-hidden="true" />Clear filters</button>}
    </div>
    <div className={styles.chips} role="group" aria-label="Filter by source">
      <button type="button" aria-pressed={source === "all"} onClick={() => { setSource("all"); setAt(1); }}><Layers size={13} aria-hidden="true" />All <b>{n(logs.length)}</b></button>
      {(Object.keys(SOURCE) as LogSource[]).map(id => { const Icon = SOURCE[id].icon; return <button key={id} type="button" aria-pressed={source === id} onClick={() => { setSource(id); setAt(1); }}><Icon size={13} aria-hidden="true" />{SOURCE[id].label} <b>{n(count("source", id))}</b></button>; })}
    </div>
    <div className={styles.chips} role="group" aria-label="Filter by level">
      {(Object.keys(LEVEL) as LogLevel[]).map(id => { const Icon = LEVEL[id].icon; return <button key={id} type="button" data-level={id} aria-pressed={level === id} onClick={() => { setLevel(level === id ? "all" : id); setAt(1); }}><Icon size={13} aria-hidden="true" />{LEVEL[id].label} <b>{n(count("level", id))}</b></button>; })}
    </div>
    {rows.length ? <ol className={styles.logs}>{page(rows, at, LOG_PAGE).map(log => { const Source = SOURCE[log.source].icon, Level = LEVEL[log.level].icon; return <li key={log.id} data-level={log.level}>
      <button type="button" aria-expanded={open === log.id} onClick={() => setOpen(open === log.id ? null : log.id)}>
        <span className={styles.logLevel}><Level size={14} aria-label={LEVEL[log.level].label} /></span>
        <span className={styles.logSource}><Source size={13} aria-hidden="true" />{SOURCE[log.source].label}</span>
        <span className={styles.logTitle}>{log.title}</span>
        <time dateTime={log.at}>{clock(log.at)}</time>
      </button>
      {open === log.id && <p className={styles.logDetail}>{log.detail || "No further detail recorded."}{log.ms != null ? ` · ${ms(log.ms)}` : ""}{log.status != null ? ` · status ${log.status}` : ""}</p>}
    </li>; })}</ol> : <p className={styles.empty}>No events match these filters.</p>}
    <Pager page={Math.min(at, pages(rows, LOG_PAGE))} pages={pages(rows, LOG_PAGE)} total={rows.length} size={LOG_PAGE} onPage={setAt} />
  </Panel>;
}
