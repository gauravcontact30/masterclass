import { classifyPlatform, PLATFORMS, PLATFORM_LABEL, type VisitRow } from "./promotions";

export const REPORT_TIMEZONE = "Asia/Kolkata";
export function reportDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: REPORT_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function dayBounds(day: string) {
  const start = new Date(`${day}T00:00:00+05:30`);
  return { since: start.toISOString(), until: new Date(start.getTime() + 86400_000).toISOString() };
}
export type DailyEvent = VisitRow & { id: string; event: "page_view" | "page_leave" | "interaction"; email?: string | null; city?: string | null; region?: string | null; country?: string | null; duration_ms?: number | null; topic?: string | null; option?: string | null; target_path?: string | null };
export type Trace = { id: string; time: string; visitor: string; account: string; session: string; platform: string; campaign: string; page: string; route: string; topic: string; option: string; destination: string; event: string };
export function dailySocial(events: DailyEvent[], day: string) {
  const { since, until } = dayBounds(day);
  const sorted = [...events].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const sessions = new Map<string, { platform: string; campaign: string }>();
  const traces: Trace[] = [];
  const visitors = new Map<string, { id: string; email: string; city: string; region: string; country: string; time: string; duration: number | null; platform: string; pages: string[] }>();
  for (const row of sorted) {
    const sessionKey = `${row.visitor_id}:${row.session_id}`;
    const source = classifyPlatform(row);
    const previous = sessions.get(sessionKey);
    const attribution = row.utm_source || row.referrer_host ? { platform: source ? PLATFORM_LABEL[source] : "Direct / unknown", campaign: row.utm_campaign || "—" } : previous || { platform: "Direct / unknown", campaign: row.utm_campaign || "—" };
    sessions.set(sessionKey, attribution);
    if (Date.parse(row.created_at) < Date.parse(since) || Date.parse(row.created_at) >= Date.parse(until) || /^\/(dashboard\/)?super-admin(\/|$)/.test(row.path)) continue;
    const page = row.path === "/" ? "Landing page" : /^\/(learning|dashboard)(\/|$)/.test(row.path) ? "Learning dashboard" : "Other pages";
    const visitor = visitors.get(sessionKey) || { id: sessionKey, email: "Anonymous", city: "Not available", region: "Not available", country: "", time: row.created_at, duration: null, platform: attribution.platform, pages: [] };
    if (row.user_id) visitor.email = row.email || "Email unavailable";
    if (row.city) visitor.city = row.city;
    if (row.region) visitor.region = row.region;
    if (row.country) visitor.country = row.country;
    if (source) visitor.platform = attribution.platform;
    if (!visitor.pages.includes(page)) visitor.pages.push(page);
    if (row.event === "page_leave" && typeof row.duration_ms === "number" && row.duration_ms >= 0) {
      // Only the portion of recorded reading time inside this report day.
      const end = Date.parse(row.created_at);
      visitor.duration = (visitor.duration ?? 0) + Math.max(0, end - Math.max(Date.parse(since), end - row.duration_ms));
    }
    visitors.set(sessionKey, visitor);
    if (row.event === "page_leave") continue;
    const parts = row.path.split("/").filter(Boolean);
    traces.push({ id: row.id, time: row.created_at, visitor: row.visitor_id, account: row.user_id || "Anonymous", session: row.session_id, platform: attribution.platform, campaign: attribution.campaign, page, route: row.path, topic: row.topic || (page === "Learning dashboard" && parts.length > 1 ? parts.slice(1).join(" / ") : "General"), option: row.option || "Page opened", destination: row.target_path || "—", event: row.event === "page_view" ? "Page view" : "Option click" });
  }
  const platforms = [...PLATFORMS.map(p => PLATFORM_LABEL[p]), "Direct / unknown"].map(platform => {
    const rows = traces.filter(row => row.platform === platform);
    return { platform, visitors: new Set(rows.map(row => row.visitor)).size, views: rows.filter(row => row.event === "Page view").length, clicks: rows.filter(row => row.event === "Option click").length, landing: rows.filter(row => row.page === "Landing page" && row.event === "Page view").length, dashboard: rows.filter(row => row.page === "Learning dashboard" && row.event === "Page view").length, latest: rows.at(-1)?.time || null };
  });
  const grouped = new Map<string, { platform: string; page: string; route: string; topic: string; option: string; views: number; clicks: number; visitorSet: Set<string>; latest: string }>();
  for (const row of traces) {
    const key = JSON.stringify([row.platform, row.page, row.route, row.topic, row.option]);
    const item = grouped.get(key) || { platform: row.platform, page: row.page, route: row.route, topic: row.topic, option: row.option, views: 0, clicks: 0, visitorSet: new Set<string>(), latest: row.time };
    if (row.event === "Page view") item.views++; else item.clicks++;
    item.visitorSet.add(row.visitor); item.latest = row.time; grouped.set(key, item);
  }
  return { visitors: [...visitors.values()].sort((a, b) => Date.parse(b.time) - Date.parse(a.time)), day, timezone: REPORT_TIMEZONE, platforms, matrix: [...grouped.values()].map(({ visitorSet, ...row }) => ({ ...row, visitors: visitorSet.size })).sort((a, b) => b.latest.localeCompare(a.latest)), traces: traces.reverse(), totals: { visitors: new Set(traces.map(row => row.visitor)).size, views: traces.filter(row => row.event === "Page view").length, clicks: traces.filter(row => row.event === "Option click").length } };
}
export type DailySocialData = ReturnType<typeof dailySocial> & { generatedAt: string; capped: boolean };
