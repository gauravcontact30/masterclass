/**
 * Cross-checks the Super Admin visitor figures against the database (read-only).
 *
 *   npx tsx --conditions=react-server --env-file=.env scripts/audit-visitor-figures.mts
 *
 * Today (from 00:00 IST) it counts, side by side:
 *   raw     — site_visits page views as stored (bots excluded), per browser cookie;
 *   stream  — the Overview's Live visitor stream: the same rows read and filtered exactly as
 *             /api/super-admin/activity/stream does, then counted by lib/live-visits.ts (one person per account or
 *             linked device, visitors under a second left out);
 *   sql     — admin_user_activity_since, the database report the panels fall back to.
 * and lists every new visitor the stream counts, so each one can be checked by hand.
 */
import { db } from "@/lib/server/db";
import { adminRpc } from "@/lib/server/admin-rpc";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";
import { isLocalAddress, looksAutomated } from "@/lib/visit-quality";
import { isUntrackedEmail } from "@/lib/server/tracking-exclusions";
import { indexVisits, periodSummary, streamVisitors, type Presence, type StreamVisit } from "@/lib/live-visits";

const PAGE = 1000;
const COLUMNS = "id,created_at,event,visitor_id,session_id,user_id,new_visitor,path,title,referrer_host,utm_source,utm_medium,utm_campaign,country,region,city,postal_code,device,browser,os,duration_ms,screen,timezone,language,ip_masked,ip_hash,private_mode";

async function readAll<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await read(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) return rows;
  }
}

const now = Date.now();
const dayStart = Date.parse(`${new Date(now + 5.5 * 3600_000).toISOString().slice(0, 10)}T00:00:00+05:30`);
const since = new Date(now - VISIT_RETENTION_DAYS * 86_400_000).toISOString();
const client = db();

const rows = await readAll<Record<string, unknown>>((from, to) => client.from("site_visits").select(COLUMNS).eq("is_bot", false).in("event", ["page_view", "page_leave"])
  .gte("created_at", since).order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, to));
const presence = await readAll<Presence>((from, to) => client.from("site_presence").select("session_id,path,started_at,seen_at").gte("seen_at", since).order("seen_at", { ascending: false }).range(from, to));

// The stream route's filters, unchanged.
const automated = new Set(rows.filter(row => row.event === "page_view" && looksAutomated(row as Parameters<typeof looksAutomated>[0])).map(row => String(row.session_id)));
const genuine = rows.filter(row => !automated.has(String(row.session_id)) && (process.env.TRACK_LOCAL === "1" || process.env.NODE_ENV !== "production" || !isLocalAddress(row.ip_masked as string | null)));
const ids = [...new Set(genuine.map(row => row.user_id).filter((id): id is string => typeof id === "string"))];
const emails: Record<string, string> = {};
for (const id of ids) { const { data } = await client.auth.admin.getUserById(id); if (data.user?.email) emails[id] = data.user.email; }
const excluded = new Set(genuine.filter(row => typeof row.user_id === "string" && isUntrackedEmail(emails[row.user_id])).map(row => String(row.visitor_id)));
for (const row of genuine) if (excluded.has(String(row.visitor_id))) automated.add(String(row.session_id));
const visits = genuine.filter(row => !automated.has(String(row.session_id))) as unknown as StreamVisit[];

const everyone = streamVisitors(indexVisits(visits, presence), now, emails);
const today = periodSummary(everyone, dayStart);

// Raw, per cookie, today.
const views = rows.filter(row => row.event === "page_view" && Date.parse(String(row.created_at)) >= dayStart);
const raw = {
  pageViews: views.length,
  browsers: new Set(views.map(v => v.visitor_id)).size,
  newBrowsers: new Set(views.filter(v => v.new_visitor).map(v => v.visitor_id)).size,
  signedInAccounts: new Set(views.map(v => v.user_id).filter(Boolean)).size,
  automatedSessionsDropped: new Set(views.filter(v => automated.has(String(v.session_id))).map(v => v.session_id)).size,
};
let sql: Record<string, unknown> | string;
try { sql = ((await adminRpc<{ totals: Record<string, unknown> }>("admin_user_activity_since", { p_since: new Date(dayStart).toISOString() })).totals); } catch (error) { sql = String(error); }

const fresh = everyone.filter(v => !v.signedIn && v.first.new_visitor && Date.parse(v.first.created_at) >= dayStart);
console.log(JSON.stringify({
  window: { from: new Date(dayStart).toISOString(), to: new Date(now).toISOString(), streamRows: rows.length, keptRows: visits.length },
  raw, stream: { people: today.people, views: today.views, newVisitors: today.newVisitors, signedIn: today.signedIn, returning: today.returning, sessions: today.sessions, live: everyone.filter(v => v.live).length },
  sql,
  newVisitorsToday: fresh.map(v => ({ arrived: v.first.created_at, place: [v.first.city, v.first.country].filter(Boolean).join(", "), source: v.first.utm_source || v.first.referrer_host || "direct", landing: v.first.path, views: v.views, readingS: Math.round(v.engagedMs / 1000), device: [v.first.device, v.first.browser, v.first.os].filter(Boolean).join(" · "), live: v.live, private: v.privateWindow })),
}, null, 2));

// Browsers with a page view today that the stream does not count, and why.
if (process.argv.includes("--dropped")) {
  const counted = new Set(everyone.flatMap(v => [v.first.visitor_id, v.last.visitor_id, v.current.visitor_id]));
  const keyOf = new Map(everyone.flatMap(v => v.visits.length ? [[v.first.visitor_id, v.key]] : []));
  const dropped = [...new Set(views.map(v => String(v.visitor_id)))].filter(id => !counted.has(id) && !keyOf.has(id));
  console.log("DROPPED", dropped.length);
  for (const id of dropped) {
    const mine = rows.filter(r => r.visitor_id === id);
    const v = mine.find(r => r.event === "page_view")!;
    const leaves = mine.filter(r => r.event === "page_leave");
    const beats = presence.filter(p => mine.some(r => r.session_id === p.session_id));
    console.log(JSON.stringify({ at: v.created_at, place: [v.city, v.country].join(", "), path: v.path, ref: v.referrer_host, tz: v.timezone, lang: v.language, screen: v.screen, device: `${v.device}/${v.browser}/${v.os}`, leaves: leaves.map(l => l.duration_ms), heartbeats: beats.length }));
  }
}

// The new report module over the same people: its figures must match the stream's.
{
  const { visitorReport, uncountedBrowsers } = await import("@/lib/visitor-report");
  const report = visitorReport(everyone, dayStart);
  console.log("REPORT", JSON.stringify({ people: report.people, newSummary: report.newSummary, newSources: report.newSources, sources: report.sources.slice(0, 6), countries: report.countries.slice(0, 6),
    uncounted: uncountedBrowsers(rows as unknown as StreamVisit[], everyone, dayStart), rawBrowsers: raw.browsers }, null, 1));
}
