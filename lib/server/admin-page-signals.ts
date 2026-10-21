import "server-only";
import { db } from "./db";
import { briefingMetrics } from "./admin-metrics";
import { runtimeHealth } from "./runtime-health";
import type { CopilotPage } from "@/lib/admin-pages";
import type { Finding, Kpi, PageSignals, Watch } from "@/lib/admin-copilot";

/*
 * What each Super Admin copilot page knows, read from Supabase: KPIs against the previous window of equal length,
 * the records that need attention (shown to the admin only), rule findings, and aggregate facts for the model.
 * Facts never carry an email, IP, user id or visitor id. Row reads are capped at ROWS and report it.
 */
const DAY = 86_400_000;
const ROWS = 10_000;
type Win = { days: number; now: number; since: string; prevSince: string };
type Built = Omit<PageSignals, "page" | "days" | "generatedAt">;

async function rows<T>(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  try { const { data, error } = await query; return error || !Array.isArray(data) ? [] : data as T[]; } catch { return []; }
}
async function count(query: PromiseLike<{ count: number | null; error: unknown }>) {
  try { const { count, error } = await query; return error ? 0 : count ?? 0; } catch { return 0; }
}
const head = (table: string, column = "id") => db().from(table).select(column, { count: "exact", head: true });
const pct = (part: number, whole: number) => whole ? Math.round((part / whole) * 1000) / 10 : null;
const quantile = (values: number[], q: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]);
};
const tally = (values: (string | null | undefined)[], limit = 10) => [...values.reduce((m, v) => v ? m.set(v, (m.get(v) ?? 0) + 1) : m, new Map<string, number>())]
  .sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
const istDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const perDay = (dates: string[]) => Object.fromEntries(tally(dates.map(istDay), 400).sort((a, b) => a.name.localeCompare(b.name)).map(d => [d.name, d.count]));
/** Percent change, or null when there is no previous value to compare with. */
const change = (current: number, previous: number) => previous ? Math.round(((current - previous) / previous) * 100) : null;
const minutesSince = (iso: string, now: number) => Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
const shorten = (text: unknown, max: number) => { const s = String(text ?? "").replace(/\s+/g, " ").trim(); return s.length > max ? `${s.slice(0, max - 1)}…` : s; };
const isoAgo = (now: number, ms: number) => new Date(now - ms).toISOString();

/** A drop or rise worth flagging, as a finding; nothing when the change is small or there is no baseline. */
function trend(label: string, current: number, previous: number, days: number, badWhen: "down" | "up", threshold = 30): Finding | null {
  const delta = change(current, previous);
  if (delta === null || Math.abs(delta) < threshold || (badWhen === "down" ? delta > 0 : delta < 0)) return null;
  return { severity: Math.abs(delta) >= 60 ? "high" : "medium", title: `${label} ${delta > 0 ? "up" : "down"} ${Math.abs(delta)}% vs previous ${days} day${days === 1 ? "" : "s"}`, detail: `${current.toLocaleString("en-IN")} now against ${previous.toLocaleString("en-IN")} in the previous window.` };
}
const compact = (items: (Finding | null | false | undefined)[]) => items.filter((item): item is Finding => !!item);

type Progress = { user_id: string; document_id: string; page: number; completed: boolean; updated_at: string };
async function analytics(w: Win): Promise<Built> {
  const [progress, previous, created, prevCreated, stalled, liveNow] = await Promise.all([
    rows<Progress>(db().from("learning_progress").select("user_id,document_id,page,completed,updated_at").gte("updated_at", w.since).limit(ROWS)),
    rows<{ user_id: string }>(db().from("learning_progress").select("user_id").gte("updated_at", w.prevSince).lt("updated_at", w.since).limit(ROWS)),
    count(head("documents").gte("created_at", w.since)),
    count(head("documents").gte("created_at", w.prevSince).lt("created_at", w.since)),
    count(head("learning_progress", "user_id").eq("completed", false).lt("updated_at", isoAgo(w.now, 7 * DAY)).gte("updated_at", isoAgo(w.now, 37 * DAY))),
    count(head("learning_presence", "user_id").gte("last_seen_at", isoAgo(w.now, 5 * 60_000))),
  ]);
  const learners = new Set(progress.map(r => r.user_id)).size, prevLearners = new Set(previous.map(r => r.user_id)).size;
  const completed = progress.filter(r => r.completed).length;
  const docs = new Map<string, { learners: number; completed: number; pages: number }>();
  for (const r of progress) { const d = docs.get(r.document_id) ?? { learners: 0, completed: 0, pages: 0 }; d.learners++; d.pages += r.page; if (r.completed) d.completed++; docs.set(r.document_id, d); }
  const stalling = [...docs].map(([id, d]) => ({ id, ...d, open: d.learners - d.completed })).filter(d => d.open > 0).sort((a, b) => b.open - a.open || a.completed / a.learners - b.completed / b.learners).slice(0, 15);
  const titles = new Map((await rows<{ id: string; title: string }>(stalling.length ? db().from("documents").select("id,title").in("id", stalling.map(d => d.id)) : Promise.resolve({ data: [], error: null }))).map(d => [d.id, d.title]));
  const watchRows = stalling.map(d => ({ document: titles.get(d.id) ?? "Removed document", learners: d.learners, completed: d.completed, completion: `${pct(d.completed, d.learners) ?? 0}%`, avg_page: Math.round(d.pages / d.learners) }));
  const rate = pct(completed, progress.length);
  const pages = progress.map(r => r.page);
  return {
    kpis: [
      { label: "Active learners", value: learners, previous: prevLearners, note: "Learners who opened or advanced a document", better: "up" },
      { label: "Studying now", value: liveNow, note: "Learning sessions seen in the last 5 minutes", better: "up" },
      { label: "Completion rate", value: rate, format: "percent", note: `${completed} of ${progress.length} documents in progress were finished`, better: "up" },
      { label: "Documents created", value: created, previous: prevCreated, note: "New learning documents requested", better: "up" },
      { label: "Stalled 7+ days", value: stalled, note: "Unfinished documents untouched for a week (last 37 days)", better: "down" },
    ],
    watch: { note: "Documents with the most learners who started but have not finished, from progress updated in this window.", columns: [{ key: "document", label: "Document" }, { key: "learners", label: "Learners" }, { key: "completed", label: "Completed" }, { key: "completion", label: "Completion" }, { key: "avg_page", label: "Avg. page reached" }], rows: watchRows },
    findings: compact([
      trend("Active learners", learners, prevLearners, w.days, "down"),
      rate !== null && progress.length >= 10 && rate < 20 && { severity: "medium", title: `Only ${rate}% of documents in progress are completed`, detail: "Check the documents with the most unfinished learners below; long or failing documents are the usual cause." },
      stalled > learners && learners > 0 && { severity: "medium", title: `${stalled} documents stalled for over a week`, detail: "More stalled documents than active learners: a reminder announcement or email may bring learners back." },
    ]),
    facts: { activeLearners: learners, previousActiveLearners: prevLearners, progressRows: progress.length, completed, completionRate: rate, documentsCreated: created, previousDocumentsCreated: prevCreated, stalledOverWeek: stalled, studyingNow: liveNow, medianPageReached: quantile(pages, 0.5), activityPerDay: perDay(progress.map(r => r.updated_at)), stallingDocuments: watchRows.map(({ document, learners, completion, avg_page }) => ({ document, learners, completion, avg_page })) },
    capped: progress.length >= ROWS,
  };
}

type AiEvent = { resource: string | null; action: string; status: number | null; duration_ms: number | null; details: Record<string, unknown> | null; created_at: string };
async function ai(w: Win): Promise<Built> {
  const [events, prevCalls, prevFailures] = await Promise.all([
    rows<AiEvent>(db().from("monitor_events").select("resource,action,status,duration_ms,details,created_at").eq("kind", "ai").gte("created_at", w.since).limit(ROWS)),
    count(head("monitor_events").eq("kind", "ai").gte("created_at", w.prevSince).lt("created_at", w.since)),
    count(head("monitor_events").eq("kind", "ai").gte("status", 400).gte("created_at", w.prevSince).lt("created_at", w.since)),
  ]);
  const features = new Map<string, { calls: number; failures: number; fallbacks: number; ms: number[]; tokens: number; cost: number; errors: string[] }>();
  for (const e of events) {
    const f = features.get(e.resource ?? "unknown") ?? { calls: 0, failures: 0, fallbacks: 0, ms: [], tokens: 0, cost: 0, errors: [] };
    f.calls++;
    if (e.action === "fallback") f.fallbacks++;
    if (Number(e.status) >= 400) { f.failures++; if (e.details?.error) f.errors.push(shorten(e.details.error, 60)); }
    if (e.duration_ms) f.ms.push(Number(e.duration_ms));
    f.tokens += (Number(e.details?.input_tokens) || 0) + (Number(e.details?.output_tokens) || 0);
    f.cost += Number(e.details?.cost_usd) || 0;
    features.set(e.resource ?? "unknown", f);
  }
  const list = [...features].map(([feature, f]) => ({ feature, calls: f.calls, failures: f.failures, failure_rate: pct(f.failures, f.calls) ?? 0, fallbacks: f.fallbacks, p95_ms: quantile(f.ms, 0.95), tokens: f.tokens, cost_usd: Math.round(f.cost * 100) / 100, top_error: tally(f.errors, 1)[0]?.name ?? null }))
    .sort((a, b) => b.failures - a.failures || b.calls - a.calls);
  const calls = events.length, failures = list.reduce((s, f) => s + f.failures, 0), fallbacks = list.reduce((s, f) => s + f.fallbacks, 0);
  const tokens = list.reduce((s, f) => s + f.tokens, 0), cost = Math.round(list.reduce((s, f) => s + f.cost_usd, 0) * 100) / 100;
  const p95 = quantile(events.map(e => Number(e.duration_ms)).filter(Boolean), 0.95);
  return {
    kpis: [
      { label: "AI calls", value: calls, previous: prevCalls, note: "Completions and fallbacks across features" },
      { label: "Failure rate", value: pct(failures, calls), previous: pct(prevFailures, prevCalls), format: "percent", note: `${failures} failed calls`, better: "down" },
      { label: "Fallbacks", value: fallbacks, note: "Calls handed to a backup provider", better: "down" },
      { label: "p95 latency", value: p95, format: "ms", note: "95% of AI calls finished within this time", better: "down" },
      { label: "Tokens", value: tokens, note: "Input + output tokens reported by providers" },
      { label: "Reported cost", value: cost, format: "money", currency: "USD", note: "Only providers that report cost", better: "down" },
    ],
    watch: { note: "Every AI feature in the window, failures first.", columns: [{ key: "feature", label: "Feature" }, { key: "calls", label: "Calls" }, { key: "failures", label: "Failures" }, { key: "failure_rate", label: "Failure %" }, { key: "fallbacks", label: "Fallbacks" }, { key: "p95_ms", label: "p95 ms" }, { key: "top_error", label: "Top error" }], rows: list.slice(0, 25) },
    findings: compact([
      ...list.filter(f => f.calls >= 5 && f.failure_rate >= 5).slice(0, 3).map((f): Finding => ({ severity: f.failure_rate >= 15 ? "high" : "medium", title: `${f.feature}: ${f.failure_rate}% of AI calls fail`, detail: `${f.failures} of ${f.calls} calls failed${f.top_error ? `; most often “${f.top_error}”` : ""}. Check the provider key, credits and rate limits.` })),
      p95 !== null && p95 > 20_000 && { severity: "medium", title: `AI p95 latency is ${Math.round(p95 / 1000)} s`, detail: "Slow completions risk timeouts; consider a faster model for the slowest feature." },
      trend("AI calls", calls, prevCalls, w.days, "up", 80),
    ]),
    facts: { calls, previousCalls: prevCalls, failures, previousFailures: prevFailures, fallbacks, p95Ms: p95, tokens, reportedCostUsd: cost, providers: tally(events.map(e => String(e.details?.provider ?? "unknown"))), models: tally(events.map(e => e.details?.model ? String(e.details.model) : null)), features: list.slice(0, 20), callsPerDay: perDay(events.map(e => e.created_at)) },
    capped: events.length >= ROWS,
  };
}

type Visit = { visitor_id: string; session_id: string; new_visitor: boolean; referrer_host: string | null; utm_source: string | null; user_id: string | null; path: string; country: string | null; created_at: string };
async function insights(w: Win): Promise<Built> {
  const views = () => db().from("site_visits").select("id", { count: "exact", head: true }).eq("event", "page_view").eq("is_bot", false);
  const [visits, prevViews, prevNew, newUsers, prevUsers] = await Promise.all([
    rows<Visit>(db().from("site_visits").select("visitor_id,session_id,new_visitor,referrer_host,utm_source,user_id,path,country,created_at").eq("event", "page_view").eq("is_bot", false).gte("created_at", w.since).limit(ROWS)),
    count(views().gte("created_at", w.prevSince).lt("created_at", w.since)),
    count(views().eq("new_visitor", true).gte("created_at", w.prevSince).lt("created_at", w.since)),
    count(head("profiles").gte("created_at", w.since)),
    count(head("profiles").gte("created_at", w.prevSince).lt("created_at", w.since)),
  ]);
  const sessions = new Map<string, number>();
  for (const v of visits) sessions.set(v.session_id, (sessions.get(v.session_id) ?? 0) + 1);
  const newVisitors = visits.filter(v => v.new_visitor).length;
  const channels = new Map<string, { visitors: Set<string>; fresh: number; sessions: Set<string>; signedIn: Set<string>; views: number }>();
  for (const v of visits) {
    const name = v.utm_source || v.referrer_host || "Direct";
    const c = channels.get(name) ?? { visitors: new Set(), fresh: 0, sessions: new Set(), signedIn: new Set(), views: 0 };
    c.visitors.add(v.visitor_id); c.sessions.add(v.session_id); c.views++; if (v.new_visitor) c.fresh++; if (v.user_id) c.signedIn.add(v.user_id);
    channels.set(name, c);
  }
  const channelRows = [...channels].map(([channel, c]) => ({ channel, visitors: c.visitors.size, new_visitors: c.fresh, sessions: c.sessions.size, signed_in: c.signedIn.size, pages_per_session: Math.round((c.views / c.sessions.size) * 10) / 10 })).sort((a, b) => b.visitors - a.visitors);
  const bounce = pct([...sessions.values()].filter(n => n === 1).length, sessions.size);
  const signupRate = pct(newUsers, newVisitors);
  const top = channelRows[0];
  const totalVisitors = new Set(visits.map(v => v.visitor_id)).size;
  return {
    kpis: [
      { label: "Page views", value: visits.length, previous: prevViews, note: "Human page views (bots excluded)", better: "up" },
      { label: "New visitors", value: newVisitors, previous: prevNew, note: "First visits from new browsers", better: "up" },
      { label: "Sign-ups", value: newUsers, previous: prevUsers, note: "New accounts created", better: "up" },
      { label: "Sign-up rate", value: signupRate, previous: pct(prevUsers, prevNew), format: "percent", note: "Sign-ups per new visitor", better: "up" },
      { label: "Bounce rate", value: bounce, format: "percent", note: `${sessions.size} sessions; one page and gone`, better: "down" },
    ],
    watch: { note: "Where visitors came from in this window (campaign tag, else referring site).", columns: [{ key: "channel", label: "Channel" }, { key: "visitors", label: "Visitors" }, { key: "new_visitors", label: "New visitors" }, { key: "sessions", label: "Sessions" }, { key: "signed_in", label: "Signed-in learners" }, { key: "pages_per_session", label: "Pages / session" }], rows: channelRows.slice(0, 25) },
    findings: compact([
      trend("Page views", visits.length, prevViews, w.days, "down"),
      trend("Sign-ups", newUsers, prevUsers, w.days, "down"),
      newVisitors >= 100 && signupRate !== null && signupRate < 1 && { severity: "medium", title: `Sign-up rate is ${signupRate}% of new visitors`, detail: "Test the sign-up flow end to end and make the landing page call to action clearer." },
      top && channelRows.length > 1 && top.visitors / Math.max(1, totalVisitors) > 0.7 && { severity: "low", title: `${top.channel} brings ${Math.round((top.visitors / totalVisitors) * 100)}% of visitors`, detail: "Traffic depends on one channel; a second channel would reduce the risk." },
    ]),
    facts: { pageViews: visits.length, previousPageViews: prevViews, newVisitors, previousNewVisitors: prevNew, visitors: totalVisitors, sessions: sessions.size, bounceRate: bounce, signups: newUsers, previousSignups: prevUsers, signupRate, pageViewsPerDay: perDay(visits.map(v => v.created_at)), topPages: tally(visits.map(v => v.path)), countries: tally(visits.map(v => v.country)), channels: channelRows.slice(0, 15) },
    capped: visits.length >= ROWS,
  };
}

async function support(w: Win): Promise<Built> {
  const [failed, prevFailed, subs, openSuggestions, urgent] = await Promise.all([
    rows<{ user_id: string; error_code: string | null; created_at: string; refunded: boolean }>(db().from("documents").select("user_id,error_code,created_at,refunded").eq("status", "failed").gte("created_at", w.since).limit(ROWS)),
    count(head("documents").eq("status", "failed").gte("created_at", w.prevSince).lt("created_at", w.since)),
    rows<{ user_id: string; status: string; tier: string; grace_until: string | null; current_period_end: string | null }>(db().from("subscriptions").select("user_id,status,tier,grace_until,current_period_end").limit(ROWS)),
    count(head("suggestions").in("status", ["new", "reviewing"])),
    count(head("suggestions").in("status", ["new", "reviewing"]).in("priority", ["high", "urgent"])),
  ]);
  const membership = new Map(subs.map(s => [s.user_id, s]));
  const grace = subs.filter(s => s.grace_until && Date.parse(s.grace_until) > w.now);
  const learners = new Map<string, { failures: number; last: string; code: string | null; unrefunded: number }>();
  for (const d of failed) {
    const l = learners.get(d.user_id) ?? { failures: 0, last: d.created_at, code: d.error_code, unrefunded: 0 };
    l.failures++; if (!d.refunded) l.unrefunded++;
    if (d.created_at >= l.last) { l.last = d.created_at; l.code = d.error_code; }
    learners.set(d.user_id, l);
  }
  const helpRows = [
    ...[...learners].sort((a, b) => b[1].failures - a[1].failures).map(([user, l]) => ({ learner: user, issue: "Failed generations", count: l.failures, detail: `${l.code ?? "unknown error"}${l.unrefunded ? ` · ${l.unrefunded} not refunded` : ""}`, membership: membership.get(user)?.status ?? "free", last_seen: l.last })),
    ...grace.map(s => ({ learner: s.user_id, issue: "Payment grace period", count: 1, detail: `${s.tier} · grace until ${new Date(s.grace_until!).toLocaleDateString("en-IN")}`, membership: s.status, last_seen: s.grace_until })),
  ].slice(0, 50);
  const codes = tally(failed.map(d => d.error_code ?? "unknown"));
  const unrefunded = failed.filter(d => !d.refunded).length;
  return {
    kpis: [
      { label: "Learners affected", value: learners.size, note: "Learners with at least one failed generation", better: "down" },
      { label: "Failed generations", value: failed.length, previous: prevFailed, note: "Documents that could not be generated", better: "down" },
      { label: "Not refunded", value: unrefunded, note: "Failed generations whose credit was not returned", better: "down" },
      { label: "In payment grace", value: grace.length, note: "Paid members whose renewal failed", better: "down" },
      { label: "Open suggestions", value: openSuggestions, note: `${urgent} marked high or urgent`, better: "down" },
    ],
    watch: { note: "Learners hit by failures or payment problems in this window. Open Users & access or Learner support search to act.", columns: [{ key: "learner", label: "Learner ID" }, { key: "issue", label: "Issue" }, { key: "count", label: "Count" }, { key: "detail", label: "Detail" }, { key: "membership", label: "Membership" }, { key: "last_seen", label: "Latest" }], rows: helpRows },
    findings: compact([
      unrefunded > 0 && { severity: "medium", title: `${unrefunded} failed generations kept the learner's credit`, detail: "Refund the credit from Learner support so affected learners are not charged for a failure." },
      codes[0] && failed.length >= 5 && codes[0].count / failed.length >= 0.5 && { severity: "high", title: `“${codes[0].name}” causes ${Math.round((codes[0].count / failed.length) * 100)}% of failures`, detail: "One error dominates: fixing it removes most learner-facing failures. See Generation queue." },
      grace.length > 0 && { severity: "medium", title: `${grace.length} member${grace.length === 1 ? "" : "s"} in payment grace`, detail: "Their renewal failed. A friendly reminder to update the payment method can prevent churn." },
      urgent > 0 && { severity: "medium", title: `${urgent} high-priority suggestions are waiting`, detail: "Reply from the Suggestion Box; contributors see replies in their tracking view." },
      trend("Failed generations", failed.length, prevFailed, w.days, "up"),
    ]),
    facts: { learnersAffected: learners.size, failedGenerations: failed.length, previousFailedGenerations: prevFailed, notRefunded: unrefunded, errorCodes: codes, inPaymentGrace: grace.length, openSuggestions, urgentSuggestions: urgent, failuresPerDay: perDay(failed.map(d => d.created_at)) },
    capped: failed.length >= ROWS,
  };
}

type Report = { id: string; path: string; reason: string; description: string; status: string; created_at: string; updated_at: string };
async function moderation(w: Win): Promise<Built> {
  const [open, recent, prevNew] = await Promise.all([
    rows<Report>(db().from("content_reports").select("id,path,reason,description,status,created_at,updated_at").in("status", ["open", "reviewing"]).order("created_at", { ascending: true }).limit(200)),
    rows<Report>(db().from("content_reports").select("status,reason,path,created_at,updated_at").gte("created_at", w.since).limit(ROWS)),
    count(head("content_reports").gte("created_at", w.prevSince).lt("created_at", w.since)),
  ]);
  const closed = recent.filter(r => r.status === "resolved" || r.status === "dismissed");
  const medianHours = quantile(closed.map(r => (Date.parse(r.updated_at) - Date.parse(r.created_at)) / 3_600_000), 0.5);
  const oldest = open[0] ? Math.round(minutesSince(open[0].created_at, w.now) / 60) : null;
  const refs = open.map((r, i) => ({ ...r, ref: `R${i + 1}` }));
  const repeated = tally(open.map(r => r.path)).filter(p => p.count >= 3);
  return {
    kpis: [
      { label: "Open reports", value: open.length, note: `${open.filter(r => r.status === "reviewing").length} already in review`, better: "down" },
      { label: "Oldest open", value: oldest, format: "hours", note: "Hours since the oldest open report", better: "down" },
      { label: "New reports", value: recent.length, previous: prevNew, note: "Reports filed in this window", better: "down" },
      { label: "Closed", value: closed.length, note: "Resolved or dismissed in this window", better: "up" },
      { label: "Median time to close", value: medianHours, format: "hours", note: "From report to resolution", better: "down" },
    ],
    watch: { note: "Open and in-review reports, oldest first. Generate AI triage to rank them by severity; resolve them in the queue below.", columns: [{ key: "ref", label: "Ref" }, { key: "path", label: "Page" }, { key: "reason", label: "Reason" }, { key: "status", label: "Status" }, { key: "age_hours", label: "Age (h)" }, { key: "description", label: "Report" }], rows: refs.slice(0, 50).map(r => ({ ref: r.ref, path: r.path, reason: r.reason, status: r.status, age_hours: Math.round(minutesSince(r.created_at, w.now) / 60), description: shorten(r.description, 140) })) },
    findings: compact([
      oldest !== null && oldest > 72 && { severity: "high", title: `A report has waited ${oldest} hours`, detail: "Reports older than three days erode trust; resolve or dismiss the oldest first." },
      open.some(r => r.reason === "inappropriate") && { severity: "high", title: `${open.filter(r => r.reason === "inappropriate").length} open reports of inappropriate content`, detail: "Review these first; hide or correct the content if confirmed." },
      ...repeated.slice(0, 2).map((p): Finding => ({ severity: "medium", title: `${p.name} reported ${p.count} times`, detail: "Repeated reports on one page usually point to a real problem in its content." })),
      trend("New reports", recent.length, prevNew, w.days, "up", 50),
    ]),
    facts: { open: open.length, oldestOpenHours: oldest, newReports: recent.length, previousNewReports: prevNew, closed: closed.length, medianHoursToClose: medianHours, byReason: tally(recent.map(r => r.reason)), repeatedPages: repeated, openReports: refs.slice(0, 15).map(r => ({ ref: r.ref, reason: r.reason, path: r.path, status: r.status, ageHours: Math.round(minutesSince(r.created_at, w.now) / 60), description: shorten(r.description, 300) })) },
  };
}

type Announcement = { title: string; body: string; tone: string; active: boolean; starts_at: string; ends_at: string | null; created_at: string };
async function announcements(w: Win): Promise<Built> {
  const [list, platform] = await Promise.all([
    rows<Announcement>(db().from("announcements").select("title,body,tone,active,starts_at,ends_at,created_at").order("created_at", { ascending: false }).limit(100)),
    briefingMetrics(w.days),
  ]);
  const state = (a: Announcement) => !a.active ? "Off" : Date.parse(a.starts_at) > w.now ? "Scheduled" : a.ends_at && Date.parse(a.ends_at) <= w.now ? "Expired" : "Live";
  const live = list.filter(a => state(a) === "Live"), scheduled = list.filter(a => state(a) === "Scheduled");
  const stale = live.filter(a => !a.ends_at && w.now - Date.parse(a.starts_at) > 14 * DAY);
  const age = (a: Announcement) => Math.round((w.now - Date.parse(a.starts_at)) / DAY);
  return {
    kpis: [
      { label: "Live now", value: live.length, note: "Shown to learners right now" },
      { label: "Scheduled", value: scheduled.length, note: "Start later" },
      { label: "Stale", value: stale.length, note: "Live over 14 days with no end date", better: "down" },
      { label: "Published in window", value: list.filter(a => a.created_at >= w.since).length, note: `Last ${w.days} day${w.days === 1 ? "" : "s"}` },
      { label: "Server errors", value: platform.serverErrors, note: "Context: may deserve a status notice", better: "down" },
    ],
    watch: { note: "Every announcement, newest first, with its current state.", columns: [{ key: "title", label: "Title" }, { key: "tone", label: "Tone" }, { key: "state", label: "State" }, { key: "starts", label: "Starts" }, { key: "ends", label: "Ends" }, { key: "age_days", label: "Age (days)" }], rows: list.slice(0, 50).map(a => ({ title: a.title, tone: a.tone, state: state(a), starts: a.starts_at, ends: a.ends_at, age_days: age(a) })) },
    findings: compact([
      ...stale.slice(0, 2).map((a): Finding => ({ severity: "low", title: `“${shorten(a.title, 60)}” has run ${age(a)} days`, detail: "Set an end date or switch it off so learners keep reading announcements." })),
      live.length > 3 && { severity: "low", title: `${live.length} announcements are live at once`, detail: "Too many banners get ignored; keep one or two." },
      platform.serverErrors >= 20 && !live.some(a => a.tone === "maintenance" || a.tone === "warning") && { severity: "medium", title: `${platform.serverErrors} server errors with no status notice live`, detail: "If learners are affected, publish a short warning while it is fixed." },
    ]),
    facts: { live: live.map(a => ({ title: a.title, tone: a.tone, ageDays: age(a), hasEndDate: !!a.ends_at, body: shorten(a.body, 200) })), scheduled: scheduled.map(a => ({ title: a.title, tone: a.tone, startsAt: a.starts_at })), stale: stale.length, platform },
  };
}

type Ledger = { event: string; amount: number | null; currency: string | null; created_at: string };
async function billing(w: Win): Promise<Built> {
  const [ledger, prevLedger, subs] = await Promise.all([
    rows<Ledger>(db().from("billing_ledger").select("event,amount,currency,created_at").gte("created_at", w.since).limit(ROWS)),
    rows<Ledger>(db().from("billing_ledger").select("event,amount,currency,created_at").gte("created_at", w.prevSince).lt("created_at", w.since).limit(ROWS)),
    rows<{ user_id: string; status: string; tier: string; current_period_end: string | null; grace_until: string | null; cancel_at_cycle_end: boolean }>(db().from("subscriptions").select("user_id,status,tier,current_period_end,grace_until,cancel_at_cycle_end").limit(ROWS)),
  ]);
  const captured = (e: Ledger) => /captured|charged|paid/i.test(e.event) && !/refund/i.test(e.event);
  const revenue = (list: Ledger[]) => list.filter(captured).reduce<Record<string, number>>((m, e) => { const c = (e.currency ?? "INR").toUpperCase(); m[c] = (m[c] ?? 0) + (Number(e.amount) || 0) / 100; return m; }, {});
  const now = revenue(ledger), before = revenue(prevLedger);
  const payments = ledger.filter(captured).length, failedPayments = ledger.filter(e => /failed|halted/i.test(e.event)).length;
  const refunds = ledger.filter(e => /refund/i.test(e.event)).length;
  const active = subs.filter(s => s.status === "active");
  const soon = (iso: string | null) => !!iso && Date.parse(iso) > w.now && Date.parse(iso) - w.now < 7 * DAY;
  const risk = subs.map(s => ({ s, reason: s.cancel_at_cycle_end ? "Cancels at period end" : s.grace_until && Date.parse(s.grace_until) > w.now ? "Payment failed (grace)" : !["active", "authenticated"].includes(s.status) ? `Status: ${s.status}` : soon(s.current_period_end) ? "Renews within 7 days" : "" })).filter(r => r.reason);
  const churnRisk = risk.filter(r => r.reason !== "Renews within 7 days").length;
  return {
    kpis: [
      { label: "Captured (INR)", value: Math.round((now.INR ?? 0) * 100) / 100, previous: Math.round((before.INR ?? 0) * 100) / 100, format: "money", currency: "INR", note: Object.keys(now).filter(c => c !== "INR").length ? `Plus ${Object.entries(now).filter(([c]) => c !== "INR").map(([c, v]) => `${c} ${v.toFixed(2)}`).join(", ")}` : "Payments captured in this window", better: "up" },
      { label: "Payments", value: payments, previous: prevLedger.filter(captured).length, note: "Captured payment events", better: "up" },
      { label: "Payment failure rate", value: pct(failedPayments, failedPayments + payments), format: "percent", note: `${failedPayments} failed · ${refunds} refunds`, better: "down" },
      { label: "Active members", value: active.length, note: `${active.filter(s => s.tier === "yearly").length} yearly · ${active.filter(s => s.tier === "monthly").length} monthly`, better: "up" },
      { label: "At churn risk", value: churnRisk, note: "Cancelling, in grace or not active", better: "down" },
    ],
    watch: { note: "Memberships cancelling, in payment grace, not active, or renewing within seven days. Open Transactions for payment detail.", columns: [{ key: "member", label: "Member ID" }, { key: "tier", label: "Plan" }, { key: "status", label: "Status" }, { key: "risk", label: "Risk" }, { key: "period_end", label: "Period ends" }], rows: risk.slice(0, 50).map(({ s, reason }) => ({ member: s.user_id, tier: s.tier, status: s.status, risk: reason, period_end: s.current_period_end })) },
    findings: compact([
      trend("Captured INR revenue", Math.round(now.INR ?? 0), Math.round(before.INR ?? 0), w.days, "down"),
      failedPayments >= 3 && (pct(failedPayments, failedPayments + payments) ?? 0) >= 10 && { severity: "high", title: `${pct(failedPayments, failedPayments + payments)}% of payment attempts failed`, detail: "Check Transactions for the failure reasons (UPI mandate, card declines) and Razorpay's dashboard for outages." },
      risk.filter(r => r.reason === "Cancels at period end").length > 0 && { severity: "medium", title: `${risk.filter(r => r.reason === "Cancels at period end").length} members have cancelled renewal`, detail: "A win-back offer or a short survey before their period ends can save some of them." },
    ]),
    facts: { revenueByCurrency: now, previousRevenueByCurrency: before, payments, failedPayments, refunds, ledgerEvents: tally(ledger.map(e => e.event)), activeMembers: active.length, membersByTierAndStatus: tally(subs.map(s => `${s.tier} · ${s.status}`)), cancellingAtPeriodEnd: subs.filter(s => s.cancel_at_cycle_end).length, inGrace: subs.filter(s => s.grace_until && Date.parse(s.grace_until) > w.now).length, renewingIn7Days: subs.filter(s => soon(s.current_period_end)).length, revenuePerDay: perDay(ledger.filter(captured).map(e => e.created_at)) },
    capped: ledger.length >= ROWS,
  };
}

async function content(w: Win): Promise<Built> {
  const [docs, prevDocs, audit, prevAudit] = await Promise.all([
    rows<{ status: string; error_code: string | null }>(db().from("documents").select("status,error_code").gte("created_at", w.since).limit(ROWS)),
    count(head("documents").gte("created_at", w.prevSince).lt("created_at", w.since)),
    rows<{ resource: string | null; action: string; actor_id: string | null; created_at: string }>(db().from("monitor_events").select("resource,action,actor_id,created_at").eq("kind", "audit").gte("created_at", w.since).order("created_at", { ascending: false }).limit(ROWS)),
    count(head("monitor_events").eq("kind", "audit").gte("created_at", w.prevSince).lt("created_at", w.since)),
  ]);
  const ready = docs.filter(d => d.status === "ready").length, failed = docs.filter(d => d.status === "failed").length;
  const success = pct(ready, ready + failed);
  const verb = (a: string) => /insert|create/i.test(a) ? "inserts" : /delete|remove/i.test(a) ? "deletes" : "updates";
  const resources = new Map<string, { inserts: number; updates: number; deletes: number; actors: Set<string>; last: string }>();
  for (const e of audit) {
    const r = resources.get(e.resource ?? "unknown") ?? { inserts: 0, updates: 0, deletes: 0, actors: new Set(), last: e.created_at };
    r[verb(e.action)]++; if (e.actor_id) r.actors.add(e.actor_id); if (e.created_at > r.last) r.last = e.created_at;
    resources.set(e.resource ?? "unknown", r);
  }
  const list = [...resources].map(([resource, r]) => ({ resource, changes: r.inserts + r.updates + r.deletes, inserts: r.inserts, updates: r.updates, deletes: r.deletes, actors: r.actors.size, last_change: r.last })).sort((a, b) => b.changes - a.changes);
  const deletes = list.reduce((s, r) => s + r.deletes, 0);
  return {
    kpis: [
      { label: "Documents generated", value: docs.length, previous: prevDocs, note: "Learning documents requested in the window", better: "up" },
      { label: "Generation success", value: success, format: "percent", note: `${ready} ready · ${failed} failed`, better: "up" },
      { label: "Audited changes", value: audit.length, previous: prevAudit, note: "Writes recorded by the audit trigger" },
      { label: "Deletions", value: deletes, note: "Rows removed from audited tables", better: "down" },
      { label: "Distinct actors", value: new Set(audit.map(e => e.actor_id).filter(Boolean)).size, note: "Accounts that changed data" },
    ],
    watch: { note: "Tables changed most in this window, from the database audit trail.", columns: [{ key: "resource", label: "Table / resource" }, { key: "changes", label: "Changes" }, { key: "inserts", label: "Inserts" }, { key: "updates", label: "Updates" }, { key: "deletes", label: "Deletes" }, { key: "actors", label: "Actors" }, { key: "last_change", label: "Last change" }], rows: list.slice(0, 30) },
    findings: compact([
      deletes >= 50 && deletes / Math.max(1, audit.length) >= 0.2 && { severity: "high", title: `${deletes} deletions (${pct(deletes, audit.length)}% of changes)`, detail: "Unusually many deletes: confirm they were intended in the audit trail below." },
      success !== null && ready + failed >= 10 && success < 90 && { severity: "medium", title: `Only ${success}% of generations succeeded`, detail: "Open Generation queue for the failure reasons." },
      trend("Audited changes", audit.length, prevAudit, w.days, "up", 100),
    ]),
    facts: { documents: docs.length, previousDocuments: prevDocs, documentsByStatus: tally(docs.map(d => d.status)), errorCodes: tally(docs.filter(d => d.status === "failed").map(d => d.error_code ?? "unknown")), auditedChanges: audit.length, previousAuditedChanges: prevAudit, deletions: deletes, changesByResource: list.slice(0, 15).map(({ last_change, ...r }) => ({ ...r, lastChangeDay: istDay(last_change) })), changesPerDay: perDay(audit.map(e => e.created_at)) },
    capped: audit.length >= ROWS || docs.length >= ROWS,
  };
}

type Job = { id: string; title: string; status: string; attempts: number; created_at: string; available_at: string; lease_until: string | null; error_code: string | null };
async function queue(w: Win): Promise<Built> {
  const [pending, recent, prevReady] = await Promise.all([
    rows<Job>(db().from("documents").select("id,title,status,attempts,created_at,available_at,lease_until,error_code").in("status", ["queued", "generating"]).order("created_at", { ascending: true }).limit(500)),
    rows<{ status: string; error_code: string | null; created_at: string }>(db().from("documents").select("status,error_code,created_at").gte("created_at", w.since).limit(ROWS)),
    count(head("documents").eq("status", "ready").gte("created_at", w.prevSince).lt("created_at", w.since)),
  ]);
  const stuck = pending.filter(j => j.status === "generating" && j.lease_until && Date.parse(j.lease_until) < w.now);
  const retrying = pending.filter(j => j.attempts >= 2);
  const waiting = pending.filter(j => j.status === "queued" && Date.parse(j.available_at) <= w.now);
  const oldest = waiting[0] ? minutesSince(waiting[0].available_at, w.now) : null;
  const ready = recent.filter(d => d.status === "ready").length, failed = recent.filter(d => d.status === "failed").length;
  const issue = (j: Job) => stuck.includes(j) ? "Lease expired (stuck)" : j.attempts >= 2 ? `Retry ${j.attempts}` : Date.parse(j.available_at) > w.now ? "Backing off" : "Waiting";
  return {
    kpis: [
      { label: "Backlog", value: pending.length, note: `${waiting.length} waiting · ${pending.length - waiting.length} generating or backing off`, better: "down" },
      { label: "Oldest waiting", value: oldest, format: "minutes", note: "Minutes the oldest ready-to-run job has waited", better: "down" },
      { label: "Stuck", value: stuck.length, note: "Generating with an expired worker lease", better: "down" },
      { label: "Retrying", value: retrying.length, note: "Jobs on a second or later attempt", better: "down" },
      { label: "Completed", value: ready, previous: prevReady, note: "Documents generated in the window", better: "up" },
      { label: "Failure rate", value: pct(failed, ready + failed), format: "percent", note: `${failed} failed in the window`, better: "down" },
    ],
    watch: { note: "Queued and generating jobs, stuck and retrying first.", columns: [{ key: "job", label: "Job" }, { key: "title", label: "Document" }, { key: "status", label: "Status" }, { key: "attempts", label: "Attempts" }, { key: "waiting_min", label: "Age (min)" }, { key: "issue", label: "Issue" }], rows: [...stuck, ...retrying.filter(j => !stuck.includes(j)), ...pending.filter(j => !stuck.includes(j) && j.attempts < 2)].slice(0, 50).map(j => ({ job: j.id.slice(0, 8), title: shorten(j.title, 70), status: j.status, attempts: j.attempts, waiting_min: minutesSince(j.created_at, w.now), issue: issue(j) })) },
    findings: compact([
      stuck.length > 0 && { severity: "high", title: `${stuck.length} job${stuck.length === 1 ? " is" : "s are"} stuck with an expired lease`, detail: "The worker stopped mid-generation. Retry them from the queue below; check worker logs if it repeats." },
      oldest !== null && oldest > 30 && { severity: "medium", title: `Oldest job has waited ${oldest} minutes`, detail: "The worker may not be running or is overloaded; check the cron/worker invocation." },
      ready + failed >= 10 && (pct(failed, ready + failed) ?? 0) >= 10 && { severity: "medium", title: `${pct(failed, ready + failed)}% of generations failed`, detail: `Most common reason: ${tally(recent.filter(d => d.status === "failed").map(d => d.error_code ?? "unknown"), 1)[0]?.name ?? "unknown"}.` },
    ]),
    facts: { backlog: pending.length, waiting: waiting.length, oldestWaitingMinutes: oldest, stuck: stuck.length, retrying: retrying.length, completed: ready, previousCompleted: prevReady, failed, failureReasons: tally(recent.filter(d => d.status === "failed").map(d => d.error_code ?? "unknown")), completedPerDay: perDay(recent.filter(d => d.status === "ready").map(d => d.created_at)) },
    capped: recent.length >= ROWS,
  };
}

type RequestEvent = { resource: string | null; status: number | null; duration_ms: number | null; bytes: number | null; created_at: string; details?: Record<string, unknown> | null };
function routeStats(list: RequestEvent[]) {
  const routes = new Map<string, { ms: number[]; bytes: number; errors: number; last: string | null }>();
  for (const e of list) {
    const r = routes.get(e.resource ?? "unknown") ?? { ms: [], bytes: 0, errors: 0, last: null };
    if (e.duration_ms !== null) r.ms.push(Number(e.duration_ms));
    r.bytes += Number(e.bytes) || 0;
    if (Number(e.status) >= 500) { r.errors++; if (!r.last || e.created_at > r.last) r.last = e.created_at; }
    routes.set(e.resource ?? "unknown", r);
  }
  return [...routes].map(([route, r]) => ({ route, requests: r.ms.length, p50_ms: quantile(r.ms, 0.5), p95_ms: quantile(r.ms, 0.95), total_ms: r.ms.reduce((s, v) => s + v, 0), mb: Math.round((r.bytes / 1_048_576) * 100) / 100, errors: r.errors, error_rate: pct(r.errors, r.ms.length) ?? 0, last_error: r.last }));
}

async function infra(w: Win): Promise<Built> {
  const [requests, prevRequests, host] = await Promise.all([
    rows<RequestEvent>(db().from("monitor_events").select("resource,status,duration_ms,bytes,created_at").eq("kind", "request").gte("created_at", w.since).limit(ROWS)),
    count(head("monitor_events").eq("kind", "request").gte("created_at", w.prevSince).lt("created_at", w.since)),
    runtimeHealth(),
  ]);
  const routes = routeStats(requests).sort((a, b) => b.total_ms - a.total_ms);
  const bytes = requests.reduce((s, e) => s + (Number(e.bytes) || 0), 0);
  const hostUsed = pct(host.hostUsedMemory, host.hostMemory);
  const free = host.storage ? pct(host.storage.available, host.storage.total) : null;
  const p95 = quantile(requests.map(e => Number(e.duration_ms)).filter(n => !Number.isNaN(n)), 0.95);
  return {
    kpis: [
      { label: "Requests", value: requests.length, previous: prevRequests, note: `${Math.round((requests.length / (w.days * 1440)) * 100) / 100} per minute on average` },
      { label: "p95 latency", value: p95, format: "ms", note: "Across recorded API requests", better: "down" },
      { label: "Data served", value: bytes, format: "bytes", note: "Response bytes recorded for API routes" },
      { label: "Process memory", value: host.processMemory, format: "bytes", note: `Heap ${Math.round(host.heapUsed / 1_048_576)} MB · ${host.cpuCores} CPU cores`, better: "down" },
      { label: "Host memory used", value: hostUsed, format: "percent", note: "This serverless instance's host", better: "down" },
      { label: "Free disk", value: free, format: "percent", note: "Writable storage on this instance", better: "up" },
    ],
    watch: { note: "API routes ranked by total server time (requests × latency): where capacity goes.", columns: [{ key: "route", label: "Route" }, { key: "requests", label: "Requests" }, { key: "p50_ms", label: "p50 ms" }, { key: "p95_ms", label: "p95 ms" }, { key: "mb", label: "MB served" }, { key: "errors", label: "5xx" }], rows: routes.slice(0, 30).map(({ total_ms, error_rate, last_error, ...r }) => r) },
    findings: compact([
      ...routes.filter(r => r.requests >= 20 && (r.p95_ms ?? 0) > 2000).slice(0, 3).map((r): Finding => ({ severity: (r.p95_ms ?? 0) > 5000 ? "high" : "medium", title: `${r.route} p95 is ${((r.p95_ms ?? 0) / 1000).toFixed(1)} s`, detail: `${r.requests} requests; add caching or move slow work to a background job.` })),
      hostUsed !== null && hostUsed > 85 && { severity: "high", title: `Host memory ${hostUsed}% used`, detail: "Instances near their memory limit restart; check for large in-memory work." },
      free !== null && free < 10 && { severity: "high", title: `Only ${free}% disk free`, detail: "Temporary files may be filling the instance." },
      trend("Request volume", requests.length, prevRequests, w.days, "up", 100),
    ]),
    facts: { requests: requests.length, previousRequests: prevRequests, p95Ms: p95, bytesServed: bytes, host: { processMemoryMb: Math.round(host.processMemory / 1_048_576), heapMb: Math.round(host.heapUsed / 1_048_576), hostMemoryUsedPercent: hostUsed, cpuCores: host.cpuCores, cpuPercent: host.cpuPercent, freeDiskPercent: free, uptimeSeconds: host.processUptime, environment: host.environment }, heaviestRoutes: routes.slice(0, 15).map(({ last_error, ...r }) => r), requestsPerDay: perDay(requests.map(e => e.created_at)) },
    capped: requests.length >= ROWS,
  };
}

async function health(w: Win): Promise<Built> {
  const started = performance.now();
  const probe = await Promise.resolve(head("profiles").limit(1)).then(({ error }) => !error, () => false);
  const dbMs = probe ? Math.round(performance.now() - started) : null;
  const [requests, previous] = await Promise.all([
    rows<RequestEvent>(db().from("monitor_events").select("resource,status,duration_ms,bytes,created_at").eq("kind", "request").gte("created_at", w.since).limit(ROWS)),
    rows<{ status: number | null; duration_ms: number | null }>(db().from("monitor_events").select("status,duration_ms").eq("kind", "request").gte("created_at", w.prevSince).lt("created_at", w.since).limit(ROWS)),
  ]);
  const errors = requests.filter(e => Number(e.status) >= 500), prevErrors = previous.filter(e => Number(e.status) >= 500);
  const clientErrors = requests.filter(e => Number(e.status) >= 400 && Number(e.status) < 500).length;
  const availability = requests.length ? Math.round((1 - errors.length / requests.length) * 10000) / 100 : null;
  const prevAvailability = previous.length ? Math.round((1 - prevErrors.length / previous.length) * 10000) / 100 : null;
  const p95 = quantile(requests.map(e => Number(e.duration_ms)).filter(n => !Number.isNaN(n)), 0.95), prevP95 = quantile(previous.map(e => Number(e.duration_ms)).filter(n => !Number.isNaN(n)), 0.95);
  const lastHour = errors.filter(e => w.now - Date.parse(e.created_at) < 3_600_000).length;
  const failing = routeStats(requests).filter(r => r.errors > 0 || (r.p95_ms ?? 0) > 3000).sort((a, b) => b.errors - a.errors || (b.p95_ms ?? 0) - (a.p95_ms ?? 0));
  return {
    kpis: [
      { label: "Availability", value: availability, previous: prevAvailability, format: "percent", note: "Requests answered without a 5xx error", better: "up" },
      { label: "Server errors", value: errors.length, previous: prevErrors.length, note: `${lastHour} in the last hour`, better: "down" },
      { label: "Client errors", value: clientErrors, note: "4xx responses (sign-in, validation, limits)", better: "down" },
      { label: "p95 latency", value: p95, previous: prevP95, format: "ms", note: "95% of requests completed within this time", better: "down" },
      { label: "Database round trip", value: dbMs, format: "ms", note: dbMs === null ? "The database did not answer" : "Measured just now from this server", better: "down" },
    ],
    watch: { note: "Routes with server errors or a p95 above 3 s, most errors first.", columns: [{ key: "route", label: "Route" }, { key: "requests", label: "Requests" }, { key: "errors", label: "5xx" }, { key: "error_rate", label: "Error %" }, { key: "p95_ms", label: "p95 ms" }, { key: "last_error", label: "Last error" }], rows: failing.slice(0, 30).map(({ total_ms, mb, p50_ms, ...r }) => r) },
    findings: compact([
      lastHour >= 10 && { severity: "high", title: `Possible incident: ${lastHour} server errors in the last hour`, detail: `Busiest failing route: ${failing[0]?.route ?? "unknown"}. Check Application logs for the error signature.` },
      availability !== null && availability < 99 && { severity: availability < 95 ? "high" : "medium", title: `Availability ${availability}%`, detail: `${errors.length} of ${requests.length} requests failed with a server error.` },
      p95 !== null && prevP95 !== null && prevP95 > 0 && p95 > prevP95 * 1.5 && p95 > 500 && { severity: "medium", title: `p95 latency rose from ${prevP95} to ${p95} ms`, detail: "Compare the slowest routes below with recent deploys." },
      dbMs === null && { severity: "high", title: "The database did not answer", detail: "Check Supabase status and the service-role key; every page that reads data is affected." },
      dbMs !== null && dbMs > 800 && { severity: "medium", title: `Database round trip ${dbMs} ms`, detail: "Check the function region matches the database region (vercel.json)." },
    ]),
    facts: { requests: requests.length, previousRequests: previous.length, serverErrors: errors.length, previousServerErrors: prevErrors.length, serverErrorsLastHour: lastHour, clientErrors, availability, previousAvailability: prevAvailability, p95Ms: p95, previousP95Ms: prevP95, databaseRoundTripMs: dbMs, statusCodes: tally(requests.map(e => String(e.status ?? "none"))), errorsPerDay: perDay(errors.map(e => e.created_at)), failingRoutes: failing.slice(0, 15).map(({ last_error, total_ms, ...r }) => r) },
    capped: requests.length >= ROWS,
  };
}

type LogEvent = { kind: string; resource: string | null; status: number | null; details: Record<string, unknown> | null; created_at: string };
const signature = (e: LogEvent) => [e.kind, e.resource ?? "", e.status ?? "", shorten(e.details?.code ?? e.details?.error ?? "", 60)].filter(Boolean).join(" · ");
async function logs(w: Win): Promise<Built> {
  const [errors, prevErrors, total, prevTotal] = await Promise.all([
    rows<LogEvent>(db().from("monitor_events").select("kind,resource,status,details,created_at").gte("status", 400).gte("created_at", w.since).order("created_at", { ascending: false }).limit(ROWS)),
    rows<LogEvent>(db().from("monitor_events").select("kind,resource,status,details,created_at").gte("status", 400).gte("created_at", w.prevSince).lt("created_at", w.since).limit(ROWS)),
    count(head("monitor_events").gte("created_at", w.since)),
    count(head("monitor_events").gte("created_at", w.prevSince).lt("created_at", w.since)),
  ]);
  const known = new Set(prevErrors.map(signature));
  const groups = new Map<string, { kind: string; count: number; first: string; last: string }>();
  for (const e of errors) {
    const key = signature(e), g = groups.get(key) ?? { kind: e.kind, count: 0, first: e.created_at, last: e.created_at };
    g.count++; if (e.created_at < g.first) g.first = e.created_at; if (e.created_at > g.last) g.last = e.created_at;
    groups.set(key, g);
  }
  const list = [...groups].map(([sig, g]) => ({ signature: sig, kind: g.kind, count: g.count, first_seen: g.first, last_seen: g.last, new: known.has(sig) ? "No" : "New" })).sort((a, b) => (a.new === "New" ? 0 : 1) - (b.new === "New" ? 0 : 1) || b.count - a.count);
  const fresh = list.filter(s => s.new === "New");
  return {
    kpis: [
      { label: "Events logged", value: total, previous: prevTotal, note: "Requests, AI calls, exports, audit and more" },
      { label: "Error events", value: errors.length, previous: prevErrors.length, note: "Events with a 4xx or 5xx status", better: "down" },
      { label: "Error signatures", value: list.length, note: "Distinct kind · route · status · code groups", better: "down" },
      { label: "New signatures", value: fresh.length, note: "Not seen in the previous window", better: "down" },
    ],
    watch: { note: "Errors grouped by signature; new ones (absent in the previous window) first.", columns: [{ key: "signature", label: "Signature" }, { key: "kind", label: "Kind" }, { key: "count", label: "Events" }, { key: "first_seen", label: "First seen" }, { key: "last_seen", label: "Last seen" }, { key: "new", label: "New?" }], rows: list.slice(0, 50) },
    findings: compact([
      ...fresh.filter(s => s.count >= 5).slice(0, 3).map((s): Finding => ({ severity: s.signature.includes(" · 5") ? "high" : "medium", title: `New error: ${shorten(s.signature, 80)}`, detail: `${s.count} events since ${new Date(s.first_seen).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST; not seen in the previous window.` })),
      list[0] && errors.length >= 20 && list[0].count / errors.length >= 0.5 && { severity: "medium", title: `One signature is ${Math.round((list[0].count / errors.length) * 100)}% of errors`, detail: `${shorten(list[0].signature, 100)}: fixing it removes most of the noise.` },
      trend("Error events", errors.length, prevErrors.length, w.days, "up", 50),
    ]),
    facts: { events: total, previousEvents: prevTotal, errorEvents: errors.length, previousErrorEvents: prevErrors.length, kinds: tally(errors.map(e => e.kind)), signatures: list.slice(0, 25).map(({ first_seen, last_seen, ...s }) => ({ ...s, firstSeenDay: istDay(first_seen), lastSeenDay: istDay(last_seen) })), errorsPerDay: perDay(errors.map(e => e.created_at)) },
    capped: errors.length >= ROWS,
  };
}

const REFUSED = [401, 403, 405, 413, 429];
async function security(w: Win): Promise<Built> {
  const [refused, prevRefused, limits] = await Promise.all([
    rows<RequestEvent>(db().from("monitor_events").select("resource,status,details,created_at").eq("kind", "request").in("status", REFUSED).gte("created_at", w.since).order("created_at", { ascending: false }).limit(ROWS)),
    count(head("monitor_events").eq("kind", "request").in("status", REFUSED).gte("created_at", w.prevSince).lt("created_at", w.since)),
    rows<{ key: string; hits: number; started_at: string }>(db().from("rate_limits").select("key,hits,started_at").order("hits", { ascending: false }).limit(200)),
  ]);
  const probes = refused.filter(e => (e.resource ?? "").startsWith("/api/super-admin") && [401, 403].includes(Number(e.status)));
  const crossSite = refused.filter(e => e.details?.code === "invalid_origin").length;
  const limited = refused.filter(e => e.status === 429).length;
  const sources = new Map<string, { refused: number; auth: number; limited: number; paths: string[]; last: string; ua: string }>();
  for (const e of refused) {
    const ip = String(e.details?.ip ?? "unknown"), s = sources.get(ip) ?? { refused: 0, auth: 0, limited: 0, paths: [], last: e.created_at, ua: shorten(e.details?.ua, 50) };
    s.refused++; if ([401, 403].includes(Number(e.status))) s.auth++; if (e.status === 429) s.limited++; s.paths.push(e.resource ?? "");
    if (e.created_at > s.last) s.last = e.created_at;
    sources.set(ip, s);
  }
  const list = [...sources].map(([source, s]) => ({ source, refused: s.refused, auth_refused: s.auth, rate_limited: s.limited, paths: tally(s.paths, 2).map(p => p.name).join(", "), last_seen: s.last, user_agent: s.ua })).sort((a, b) => b.refused - a.refused);
  const hot = tally(limits.map(l => l.key.split(":")[0]), 10).map(p => ({ limiter: p.name, keys: p.count, hits: limits.filter(l => l.key.startsWith(`${p.name}:`) || l.key === p.name).reduce((s, l) => s + l.hits, 0) }));
  const loudest = list[0];
  return {
    kpis: [
      { label: "Refused requests", value: refused.length, previous: prevRefused, note: "401, 403, 405, 413 and 429 responses", better: "down" },
      { label: "Admin API probes", value: probes.length, note: "Refused calls to /api/super-admin", better: "down" },
      { label: "Rate limited", value: limited, note: "Requests over a limit (429)", better: "down" },
      { label: "Cross-site blocked", value: crossSite, note: "Requests from another origin", better: "down" },
      { label: "Distinct sources", value: sources.size, note: "Client addresses behind refused requests" },
    ],
    watch: { note: "Client addresses behind refused requests, most first. Block persistent offenders in the Vercel firewall.", columns: [{ key: "source", label: "Source IP" }, { key: "refused", label: "Refused" }, { key: "auth_refused", label: "401/403" }, { key: "rate_limited", label: "429" }, { key: "paths", label: "Top paths" }, { key: "last_seen", label: "Last seen" }, { key: "user_agent", label: "User agent" }], rows: list.slice(0, 50) },
    findings: compact([
      loudest && loudest.refused >= 50 && { severity: "high", title: `One source made ${loudest.refused} refused requests`, detail: `Mostly ${loudest.paths || "various paths"}. Consider a firewall rule for it.` },
      probes.length >= 5 && { severity: "high", title: `${probes.length} refused calls to the admin API`, detail: "Someone without access is trying admin endpoints; confirm admin accounts use strong sign-in." },
      crossSite > 0 && { severity: "medium", title: `${crossSite} cross-site requests blocked`, detail: "Another site tried to call this app's API; the origin check stopped it." },
      trend("Refused requests", refused.length, prevRefused, w.days, "up", 100),
    ]),
    facts: { refused: refused.length, previousRefused: prevRefused, adminProbes: probes.length, rateLimited: limited, crossSiteBlocked: crossSite, distinctSources: sources.size, loudestSourceShare: loudest ? pct(loudest.refused, refused.length) : null, byStatus: tally(refused.map(e => String(e.status))), byCode: tally(refused.map(e => e.details?.code ? String(e.details.code) : null)), topPaths: tally(refused.map(e => e.resource)), hotRateLimiters: hot, refusedPerDay: perDay(refused.map(e => e.created_at)) },
    capped: refused.length >= ROWS,
  };
}

const BUILDERS: Record<CopilotPage, (w: Win) => Promise<Built>> = { analytics, ai, insights, support, moderation, announcements, billing, content, queue, infra, health, logs, security };

/** One page's signals for the window, read fresh from the database. */
export async function pageSignals(page: CopilotPage, days: number): Promise<PageSignals> {
  const now = Date.now();
  const built = await BUILDERS[page]({ days, now, since: isoAgo(now, days * DAY), prevSince: isoAgo(now, 2 * days * DAY) });
  return { page, days, generatedAt: new Date(now).toISOString(), ...built, watch: built.watch satisfies Watch, kpis: built.kpis satisfies Kpi[] };
}

export const pageTitle = (page: CopilotPage) => ({ analytics: "Learning analytics", ai: "AI analytics", insights: "Growth insights", support: "Learner support", moderation: "Moderation", announcements: "Announcements", billing: "Revenue & billing", content: "Content & audit", queue: "Generation queue", infra: "Infrastructure", health: "System health", logs: "Application logs", security: "Security" } satisfies Record<CopilotPage, string>)[page];
