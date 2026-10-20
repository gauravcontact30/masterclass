import "server-only";
import { db } from "./db";
import type { BriefingMetrics } from "@/lib/admin-briefing";

/** Exact counts only (no rows): each is one cheap HEAD query. A missing table counts as zero. */
export async function briefingMetrics(days: number): Promise<BriefingMetrics> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const count = async (build: () => PromiseLike<{ count: number | null; error: unknown }>) => { try { const { count, error } = await build(); return error ? 0 : count ?? 0; } catch { return 0; } };
  const events = (kind: string) => db().from("monitor_events").select("id", { count: "exact", head: true }).eq("kind", kind).gte("created_at", since);
  const [requests, serverErrors, blocked, rateLimited, crossSite, adminProbes, aiCalls, aiFailures, exports, pageViews, newUsers, activeSubscriptions] = await Promise.all([
    count(() => events("request")),
    count(() => events("request").gte("status", 500)),
    count(() => events("request").in("status", [401, 403, 405, 413, 429])),
    count(() => events("request").eq("status", 429)),
    count(() => events("request").eq("details->>code", "invalid_origin")),
    count(() => events("request").in("status", [401, 403]).like("resource", "/api/super-admin%")),
    count(() => events("ai")),
    count(() => events("ai").or("action.eq.fallback,status.gte.400")),
    count(() => events("export")),
    count(() => db().from("site_visits").select("id", { count: "exact", head: true }).eq("event", "page_view").eq("is_bot", false).gte("created_at", since)),
    count(() => db().from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since)),
    count(() => db().from("subscriptions").select("user_id", { count: "exact", head: true }).eq("status", "active")),
  ]);
  const visitors = await count(() => db().from("site_visits").select("id", { count: "exact", head: true }).eq("event", "page_view").eq("is_bot", false).eq("new_visitor", true).gte("created_at", since));
  return { days, requests, serverErrors, blocked, rateLimited, crossSite, adminProbes, aiCalls, aiFailures, exports, pageViews, visitors, newUsers, activeSubscriptions };
}

const ROWS = 10000;
const top = (values: (string | null | undefined)[], limit = 10) => [...values.reduce((m, v) => v ? m.set(v, (m.get(v) ?? 0) + 1) : m, new Map<string, number>())]
  .sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
const istDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/**
 * Everything Ask-your-data may answer from, as aggregates only: counts, top-10 lists and per-day series. No email,
 * name, IP, visitor or user id is ever included, so the model cannot leak one. Row reads are capped and say so.
 */
export async function analyticsSnapshot(days: number) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [totals, visits, signups, ai, subscriptions] = await Promise.all([
    briefingMetrics(days),
    db().from("site_visits").select("created_at,path,country,region,city,referrer_host,utm_source,device,browser,os,new_visitor").eq("event", "page_view").eq("is_bot", false).gte("created_at", since).limit(ROWS),
    db().from("profiles").select("created_at").gte("created_at", since).limit(ROWS),
    db().from("monitor_events").select("resource,action,status,duration_ms").eq("kind", "ai").gte("created_at", since).limit(ROWS),
    db().from("subscriptions").select("tier,status").limit(ROWS),
  ]);
  const v = visits.data ?? [], s = signups.data ?? [], a = ai.data ?? [];
  const perDay = (rows: { created_at: string }[]) => Object.fromEntries(top(rows.map(r => istDay(r.created_at)), 400).sort((x, y) => x.name.localeCompare(y.name)).map(d => [d.name, d.count]));
  const aiByFeature = [...a.reduce((m, r) => {
    const key = String(r.resource ?? "unknown"); const e = m.get(key) ?? { feature: key, calls: 0, fallbacks: 0, failures: 0, totalMs: 0 };
    e.calls++; if (r.action === "fallback") e.fallbacks++; if (Number(r.status) >= 400) e.failures++; e.totalMs += Number(r.duration_ms) || 0;
    return m.set(key, e);
  }, new Map<string, { feature: string; calls: number; fallbacks: number; failures: number; totalMs: number }>()).values()]
    .sort((x, y) => y.calls - x.calls).map(({ totalMs, ...e }) => ({ ...e, avgMs: e.calls ? Math.round(totalMs / e.calls) : 0 }));
  return {
    window: { days, since, timezone: "Asia/Kolkata" },
    totals,
    pageViewsPerDay: perDay(v), signupsPerDay: perDay(s),
    topPages: top(v.map(r => r.path)), countries: top(v.map(r => r.country)), regions: top(v.map(r => r.region && `${r.region}, ${r.country ?? ""}`)),
    cities: top(v.map(r => r.city)), referrers: top(v.map(r => r.referrer_host)), campaigns: top(v.map(r => r.utm_source)),
    devices: top(v.map(r => r.device)), browsers: top(v.map(r => r.browser)), operatingSystems: top(v.map(r => r.os)),
    aiByFeature,
    subscriptions: top((subscriptions.data ?? []).map(r => `${r.tier ?? "unknown"} · ${r.status ?? "unknown"}`)),
    capped: { pageViews: v.length >= ROWS, signups: s.length >= ROWS, ai: a.length >= ROWS },
  };
}
export type AnalyticsSnapshot = Awaited<ReturnType<typeof analyticsSnapshot>>;
