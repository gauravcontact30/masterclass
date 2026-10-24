/*
 * The Super Admin "Logs & Health" page's arithmetic: monitor_events rows in, the page's sections out. Pure, so the
 * API route stays a thin reader and the numbers can be checked by hand. Event kinds it reads:
 *  - request      every tracked API call (lib/server/http.ts api()): method, path, status, server time;
 *  - page         a dashboard page load measured in the browser (/api/monitoring/presence): load time;
 *  - web_vitals   one page's Core Web Vitals (components/client-monitor.tsx);
 *  - client_error an uncaught script error or rejected promise in the browser;
 *  - ai           a model call (lib/server/ai-monitoring.ts): feature, provider, model, latency, tokens, cost, fallbacks.
 */
export type MonitorRow = { id: number | string; created_at: string; kind: string; action: string | null; resource: string | null; status: number | null; duration_ms: number | null; details: Record<string, unknown> | null; actor_id?: string | null };
export type LogLevel = "error" | "warn" | "info";
export type LogSource = "backend" | "frontend" | "ai" | "security" | "system";
export type LogEntry = { id: string; at: string; level: LogLevel; source: LogSource; title: string; detail: string; path: string | null; status: number | null; ms: number | null };
export type Percentiles = { count: number; p50: number | null; p95: number | null; p99: number | null; avg: number | null; max: number | null };
export type Issue = { id: string; severity: "critical" | "serious" | "warning"; area: LogSource; title: string; detail: string };

/** Google's Core Web Vitals thresholds: [good up to, poor from]. Measured at the 75th percentile, as Google does. */
export const VITAL_THRESHOLDS = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], FCP: [1800, 3000], TTFB: [800, 1800] } as const;
export type VitalName = keyof typeof VITAL_THRESHOLDS;
/** A route whose p95 passes this many milliseconds is reported as slow. */
export const SLOW_MS = 1500;

const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const str = (value: unknown) => typeof value === "string" ? value : "";
/** The value below which `q` of the sorted values fall (nearest rank). */
export function quantile(sorted: number[], q: number) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))] : null; }
export function percentiles(values: number[]): Percentiles {
  const sorted = values.filter(value => Number.isFinite(value)).sort((a, b) => a - b);
  return { count: sorted.length, p50: quantile(sorted, .5), p95: quantile(sorted, .95), p99: quantile(sorted, .99),
    avg: sorted.length ? Math.round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length) : null, max: sorted.at(-1) ?? null };
}
export const vitalRating = (name: VitalName, value: number | null) => value == null ? null : value <= VITAL_THRESHOLDS[name][0] ? "good" : value < VITAL_THRESHOLDS[name][1] ? "needs-improvement" : "poor";

/** One log line per event, in plain words, for the log explorer. */
export function toLog(row: MonitorRow): LogEntry {
  const d = row.details ?? {}, status = row.status, ms = row.duration_ms, path = row.resource;
  const base = { id: String(row.id), at: row.created_at, path, status, ms };
  if (row.kind === "request") {
    const security = d.security === true, code = str(d.code);
    const level: LogLevel = (status ?? 0) >= 500 ? "error" : (status ?? 0) >= 400 || (ms ?? 0) >= SLOW_MS ? "warn" : "info";
    return { ...base, level, source: security ? "security" : "backend", title: `${row.action ?? "GET"} ${path ?? ""} → ${status ?? "—"}`,
      detail: [code && `code ${code}`, ms != null && `${ms} ms on the server`, (ms ?? 0) >= SLOW_MS && "slow", str(d.request_id) && `request ${str(d.request_id).slice(0, 8)}`].filter(Boolean).join(" · ") };
  }
  if (row.kind === "client_error") {
    return { ...base, level: "error", source: "frontend", title: str(d.message) || "Script error",
      detail: [row.action === "rejection" ? "Unhandled promise rejection" : "Uncaught error", str(d.source) && `${str(d.source)}${num(d.line) ? `:${num(d.line)}` : ""}`, str(d.browser), str(d.device)].filter(Boolean).join(" · ") };
  }
  if (row.kind === "web_vitals") {
    const lcp = num(d.LCP), inp = num(d.INP), cls = num(d.CLS);
    const poor = (lcp != null && vitalRating("LCP", lcp) === "poor") || (inp != null && vitalRating("INP", inp) === "poor") || (cls != null && vitalRating("CLS", cls) === "poor");
    return { ...base, level: poor ? "warn" : "info", source: "frontend", title: `Page performance · ${path ?? ""}`,
      detail: [lcp != null && `LCP ${Math.round(lcp)} ms`, inp != null && `INP ${Math.round(inp)} ms`, cls != null && `CLS ${cls}`, str(d.device), str(d.connection)].filter(Boolean).join(" · ") };
  }
  if (row.kind === "page") {
    return { ...base, level: (ms ?? 0) >= 4000 ? "warn" : "info", source: "frontend", title: `Page load · ${path ?? ""}`, detail: ms != null ? `${ms} ms to load in the browser` : "" };
  }
  if (row.kind === "ai") {
    const failed = (status ?? 200) >= 400, fallback = row.action === "fallback";
    return { ...base, level: failed ? (fallback ? "warn" : "error") : (ms ?? 0) >= 30_000 ? "warn" : "info", source: "ai",
      title: fallback ? `AI fallback · ${path ?? "feature"} left ${str(d.provider)}` : `AI ${failed ? "failure" : "call"} · ${path ?? "feature"}`,
      detail: [str(d.provider), str(d.model), ms != null && `${(ms / 1000).toFixed(1)} s`, num(d.input_tokens) != null && `${num(d.input_tokens)} in / ${num(d.output_tokens) ?? 0} out tokens`, failed && `status ${status}`].filter(Boolean).join(" · ") };
  }
  return { ...base, level: (status ?? 0) >= 500 ? "error" : (status ?? 0) >= 400 ? "warn" : "info", source: "system", title: `${row.kind} · ${row.action ?? ""}`.trim(), detail: path ?? "" };
}

/** Buckets for the throughput and latency charts: 5 minutes up to 6 h, 30 minutes up to a day, then 3 hours. */
export function bucketMs(hours: number) { return hours <= 6 ? 5 * 60_000 : hours <= 24 ? 30 * 60_000 : 3 * 3_600_000; }

export function analyse(rows: MonitorRow[], hours: number, now = Date.now()) {
  const requests = rows.filter(row => row.kind === "request"), ai = rows.filter(row => row.kind === "ai");
  const vitals = rows.filter(row => row.kind === "web_vitals"), loads = rows.filter(row => row.kind === "page" && row.duration_ms != null);
  const clientErrors = rows.filter(row => row.kind === "client_error");
  const ms = (list: MonitorRow[]) => list.map(row => row.duration_ms ?? NaN);

  // Throughput and latency over time.
  const size = bucketMs(hours), start = Math.floor((now - hours * 3_600_000) / size) * size;
  const series = Array.from({ length: Math.ceil((now - start) / size) }, (_, i) => ({ t: start + i * size, requests: 0, errors: 0, durations: [] as number[], ai: 0, aiErrors: 0, clientErrors: 0 }));
  const slot = (iso: string) => series[Math.min(series.length - 1, Math.max(0, Math.floor((Date.parse(iso) - start) / size)))];
  for (const row of requests) { const s = slot(row.created_at); s.requests++; if ((row.status ?? 0) >= 500) s.errors++; if (row.duration_ms != null) s.durations.push(row.duration_ms); }
  for (const row of ai) if (row.action === "completion") { const s = slot(row.created_at); s.ai++; if ((row.status ?? 200) >= 400) s.aiErrors++; }
  for (const row of clientErrors) slot(row.created_at).clientErrors++;

  // Backend: every route with its own percentiles and its latest failure.
  const routes = new Map<string, MonitorRow[]>();
  for (const row of requests) { const key = row.resource ?? "—"; (routes.get(key) ?? routes.set(key, []).get(key)!).push(row); }
  const routeRows = [...routes].map(([route, list]) => {
    const lastError = list.filter(row => (row.status ?? 0) >= 500).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return { route, methods: [...new Set(list.map(row => row.action ?? "GET"))], calls: list.length, errors5xx: list.filter(row => (row.status ?? 0) >= 500).length,
      errors4xx: list.filter(row => (row.status ?? 0) >= 400 && (row.status ?? 0) < 500).length, ...percentiles(ms(list)), lastError: lastError?.created_at ?? null };
  }).sort((a, b) => b.calls - a.calls);

  // Frontend: vitals at p75 overall and per page, page loads, grouped script errors.
  const vital = (name: VitalName, list = vitals) => quantile(list.map(row => num(row.details?.[name])).filter((value): value is number => value != null).sort((a, b) => a - b), .75);
  const pages = new Map<string, MonitorRow[]>();
  for (const row of vitals) { const key = row.resource ?? "—"; (pages.get(key) ?? pages.set(key, []).get(key)!).push(row); }
  const pageRows = [...pages].map(([path, list]) => ({ path, samples: list.length, LCP: vital("LCP", list), INP: vital("INP", list), CLS: vital("CLS", list), TTFB: vital("TTFB", list) }))
    .sort((a, b) => (b.LCP ?? 0) - (a.LCP ?? 0));
  const errorGroups = new Map<string, { message: string; count: number; last: string; paths: Set<string>; source: string; kind: string }>();
  for (const row of clientErrors) {
    const message = str(row.details?.message) || "Script error", group = errorGroups.get(message) ?? { message, count: 0, last: row.created_at, paths: new Set<string>(), source: str(row.details?.source), kind: row.action ?? "error" };
    group.count++; if (row.created_at > group.last) group.last = row.created_at; if (row.resource) group.paths.add(row.resource);
    errorGroups.set(message, group);
  }

  // AI: per feature and per provider/model, with failures, fallbacks, tokens and reported cost.
  const completions = ai.filter(row => row.action === "completion"), fallbacks = ai.filter(row => row.action === "fallback");
  const aiGroup = (key: (row: MonitorRow) => string) => {
    const map = new Map<string, MonitorRow[]>();
    for (const row of completions) { const k = key(row); (map.get(k) ?? map.set(k, []).get(k)!).push(row); }
    return [...map].map(([name, list]) => ({ name, calls: list.length, failures: list.filter(row => (row.status ?? 200) >= 400).length, ...percentiles(ms(list)),
      tokens: list.reduce((sum, row) => sum + (num(row.details?.input_tokens) ?? 0) + (num(row.details?.output_tokens) ?? 0), 0),
      cost: list.reduce((sum, row) => sum + (num(row.details?.cost) ?? 0), 0) })).sort((a, b) => b.calls - a.calls);
  };

  const backend = { ...percentiles(ms(requests)), errors5xx: requests.filter(row => (row.status ?? 0) >= 500).length, errors4xx: requests.filter(row => (row.status ?? 0) >= 400 && (row.status ?? 0) < 500).length,
    slow: requests.filter(row => (row.duration_ms ?? 0) >= SLOW_MS).length, perMinute: Math.round((requests.length / (hours * 60)) * 100) / 100 };
  const aiTotals = { ...percentiles(ms(completions)), failures: completions.filter(row => (row.status ?? 200) >= 400).length, fallbacks: fallbacks.length,
    tokensIn: completions.reduce((sum, row) => sum + (num(row.details?.input_tokens) ?? 0), 0), tokensOut: completions.reduce((sum, row) => sum + (num(row.details?.output_tokens) ?? 0), 0),
    cost: completions.reduce((sum, row) => sum + (num(row.details?.cost) ?? 0), 0) };
  const vitalsP75 = Object.fromEntries((Object.keys(VITAL_THRESHOLDS) as VitalName[]).map(name => [name, vital(name)])) as Record<VitalName, number | null>;

  return {
    series: series.map(({ durations, ...s }) => ({ ...s, p95: quantile(durations.sort((a, b) => a - b), .95) })),
    backend, routes: routeRows,
    frontend: { vitals: vitalsP75, samples: vitals.length, loads: percentiles(ms(loads)), pages: pageRows, errors: [...errorGroups.values()].map(group => ({ ...group, paths: [...group.paths].slice(0, 5) })).sort((a, b) => b.count - a.count) },
    ai: { ...aiTotals, calls: completions.length, features: aiGroup(row => row.resource ?? "—"), models: aiGroup(row => `${str(row.details?.provider) || "?"} · ${str(row.details?.model) || "default"}`) },
  };
}
export type Analysis = ReturnType<typeof analyse>;

/** What needs attention, most serious first, from the analysis and the live checks. */
export function detectIssues(analysis: Analysis, checks: { id: string; label: string; ok: boolean; ms: number | null; note?: string }[], runtime: { memoryPercent: number | null }): Issue[] {
  const issues: Issue[] = [];
  for (const check of checks) if (!check.ok) issues.push({ id: `check:${check.id}`, severity: "critical", area: "system", title: `${check.label} is not responding`, detail: check.note ?? "The live check failed." });
  for (const check of checks) if (check.ok && check.ms != null && check.ms > 800) issues.push({ id: `slowcheck:${check.id}`, severity: "warning", area: "system", title: `${check.label} is slow`, detail: `The live check took ${check.ms} ms (healthy is under 800 ms).` });
  const { backend, ai, frontend } = analysis;
  if (backend.count >= 20 && backend.errors5xx / backend.count > .02) issues.push({ id: "backend:errors", severity: backend.errors5xx / backend.count > .05 ? "critical" : "serious", area: "backend", title: `Server error rate ${(backend.errors5xx / backend.count * 100).toFixed(1)}%`, detail: `${backend.errors5xx} of ${backend.count} API calls failed with a 5xx status.` });
  for (const route of analysis.routes.filter(route => route.calls >= 5 && (route.p95 ?? 0) >= SLOW_MS).slice(0, 5)) issues.push({ id: `slow:${route.route}`, severity: (route.p95 ?? 0) >= 5000 ? "serious" : "warning", area: "backend", title: `Slow route ${route.route}`, detail: `p95 ${route.p95} ms over ${route.calls} calls (target under ${SLOW_MS} ms).` });
  if (ai.calls >= 5 && ai.failures / ai.calls > .05) issues.push({ id: "ai:failures", severity: ai.failures / ai.calls > .2 ? "critical" : "serious", area: "ai", title: `AI failure rate ${(ai.failures / ai.calls * 100).toFixed(0)}%`, detail: `${ai.failures} of ${ai.calls} model calls failed; ${ai.fallbacks} moved to a fallback provider.` });
  if (ai.calls >= 5 && (ai.p95 ?? 0) > 45_000) issues.push({ id: "ai:slow", severity: "warning", area: "ai", title: "AI answers are slow", detail: `p95 ${((ai.p95 ?? 0) / 1000).toFixed(1)} s per model call.` });
  for (const name of ["LCP", "INP", "CLS"] as const) {
    const rating = vitalRating(name, frontend.vitals[name]);
    if (frontend.samples >= 5 && rating && rating !== "good") issues.push({ id: `vital:${name}`, severity: rating === "poor" ? "serious" : "warning", area: "frontend", title: `${name} ${rating === "poor" ? "is poor" : "needs improvement"}`, detail: `75th percentile ${name === "CLS" ? frontend.vitals[name] : `${Math.round(frontend.vitals[name] ?? 0)} ms`} across ${frontend.samples} page views.` });
  }
  if (frontend.errors.length) issues.push({ id: "frontend:errors", severity: frontend.errors.reduce((sum, error) => sum + error.count, 0) > 20 ? "serious" : "warning", area: "frontend", title: `${frontend.errors.length} distinct script ${frontend.errors.length === 1 ? "error" : "errors"} in browsers`, detail: `Most frequent: "${frontend.errors[0].message.slice(0, 90)}" (${frontend.errors[0].count}×).` });
  if (runtime.memoryPercent != null && runtime.memoryPercent > 85) issues.push({ id: "memory", severity: runtime.memoryPercent > 95 ? "critical" : "warning", area: "system", title: `Host memory at ${runtime.memoryPercent}%`, detail: "The server instance is close to its memory limit." });
  const order = { critical: 0, serious: 1, warning: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** 0–100: starts at 100 and loses points per issue by severity; a failed live check caps it at 40. */
export function healthScore(issues: Issue[]) {
  const score = issues.reduce((value, issue) => value - (issue.severity === "critical" ? 30 : issue.severity === "serious" ? 12 : 4), 100);
  return Math.max(0, Math.min(issues.some(issue => issue.id.startsWith("check:")) ? 40 : 100, score));
}
