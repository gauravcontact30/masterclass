/*
 * Visitor reports for Super Admin → Overview and User activities, counted from the Live visitor stream's people
 * (lib/live-visits.ts: one person per signed-in account or linked device; bots, automated browsers and page loads
 * with no time on screen left out). Every figure on both pages comes from these same people, read from the
 * site_visits table by /api/super-admin/activity/stream, so no two panels can disagree (user request 2026-11-24).
 * The SQL reports counted every browser cookie that loaded a page, which let scraper farms (one deep page each, no
 * referrer, no leave beacon or heartbeat) read as dozens of real visitors.
 * Pure: safe in the client bundle and in tests.
 */
import { classifySource, SOURCE_LABEL, type SourceId } from "./traffic-sources";
import { getCleanTitle, type StreamVisit, type StreamVisitor, type VisitSummary } from "./live-visits";

export type Count = { key: string; label: string; people: number; visits: number };
export type NewVisitor = {
  key: string; timelineKey: string; arrived: string; place: string; country: string | null; source: SourceId; sourceLabel: string; referrer: string | null;
  campaign: string | null; landing: string; landingTitle: string; views: number; pages: number; readingMs: number; visits: number;
  device: string; browser: string | null; os: string | null; live: boolean; lastAt: number; signedUp: boolean; email: string | null;
  privateWindow: boolean; stage: string; trail: string[];
};
export type PersonRow = {
  key: string; timelineKey: string; label: string; email: string | null; status: "On the site" | "Left"; kind: "New" | "Returning" | "Signed in";
  firstSeen: string; lastSeen: number; visits: number; views: number; readingMs: number; lastPage: string; place: string; device: string; source: string;
};
export type VisitRow = { key: string; timelineKey: string; who: string; start: number; end: number; open: boolean; entry: string; exit: string | null; views: number; readingMs: number; source: string; campaign: string | null; place: string; device: string };
export type VisitorReport = {
  from: number; to: number;
  people: number; newVisitors: NewVisitor[];
  newSummary: { total: number; guests: number; signedUp: number; live: number; bounced: number; returnedAgain: number; avgReadingMs: number | null };
  sources: Count[]; newSources: Count[]; countries: Count[]; cities: Count[]; landings: Count[]; newLandings: Count[];
  campaigns: Count[]; people_: PersonRow[]; visits: VisitRow[];
};

const place = (v: StreamVisit) => [v.city, v.country].filter(Boolean).join(", ") || "Location not reported";
const deviceOf = (v: StreamVisit) => [v.device, v.browser, v.os].filter(Boolean).join(" · ") || "Device not reported";
/** The id /api/super-admin/activity?person= accepts: an account id, or the browser's visitor id. */
export const timelineKey = (v: StreamVisitor) => v.signedIn && v.first.user_id ? v.first.user_id : v.current.user_id ?? `visitor:${v.first.visitor_id}`;

function counter() {
  const map = new Map<string, { label: string; people: Set<string>; visits: number }>();
  return {
    add(key: string, label: string, person: string, visits = 1) { const entry = map.get(key) ?? { label, people: new Set<string>(), visits: 0 }; entry.people.add(person); entry.visits += visits; map.set(key, entry); },
    list(): Count[] { return [...map].map(([key, e]) => ({ key, label: e.label, people: e.people.size, visits: e.visits })).sort((a, b) => b.people - a.people || b.visits - a.visits || a.label.localeCompare(b.label)); },
  };
}

/** Which platform a visit came from (lib/traffic-sources.ts rules), from its first page's campaign tag or referrer. */
export function visitSource(visit: Pick<VisitSummary, "source">, first: StreamVisit, ownHosts: readonly string[] = []): SourceId {
  return classifySource({ utm_source: first.utm_source ?? null, utm_medium: first.utm_medium ?? null, referrer_host: first.referrer_host ?? visit.source }, ownHosts);
}

/**
 * The report for visits opened in [from, to). A person counts when one of their page views falls in the window; a
 * new visitor is someone whose first page view ever (the browser had no visitor cookie) was in the window, whether
 * they stayed a guest or signed up afterwards.
 */
export function visitorReport(everyone: StreamVisitor[], from: number, to = Infinity, ownHosts: readonly string[] = []): VisitorReport {
  const inWindow = (ms: number) => ms >= from && ms < to;
  const sources = counter(), newSources = counter(), countries = counter(), cities = counter(), landings = counter(), newLandings = counter(), campaigns = counter();
  const newVisitors: NewVisitor[] = [], people: PersonRow[] = [], visitRows: VisitRow[] = [];
  let count = 0;
  for (const v of everyone) {
    const visits = v.visits.filter(visit => visit.steps.some(step => inWindow(step.at)));
    if (!visits.length) continue;
    count++;
    const isNew = Boolean(v.first.new_visitor) && inWindow(Date.parse(v.first.created_at));
    const firstSource = visitSource(v.visits[0], v.first, ownHosts);
    const loc = v.current.country ?? v.first.country;
    countries.add(loc ?? "Unknown", loc ?? "Unknown", v.key, visits.length);
    const city = v.current.city ?? v.first.city;
    if (city) cities.add(`${city}|${loc ?? ""}`, [city, loc].filter(Boolean).join(", "), v.key, visits.length);
    const label = v.email ?? `Visitor ${v.key.replace(/^(visitor|device):/, "").slice(0, 8)}`;
    for (const visit of visits) {
      // A visit's own first page carries its referrer; later visits by the same person can come from somewhere else.
      const entryView = visit.steps[0];
      const source = visit === v.visits[0] ? firstSource : classifySource({ referrer_host: visit.source, utm_source: visit.source }, ownHosts);
      sources.add(source, SOURCE_LABEL[source], v.key);
      landings.add(entryView.path, getCleanTitle(entryView.title, entryView.path), v.key);
      if (visit.campaign || v.first.utm_campaign) campaigns.add(`${visit.source ?? "untagged"}|${visit.campaign ?? ""}`, [visit.source ?? "untagged", visit.campaign].filter(Boolean).join(" · "), v.key);
      visitRows.push({ key: `${v.key}|${visit.sessionId}`, timelineKey: timelineKey(v), who: label, start: visit.start, end: visit.end, open: visit.open, entry: visit.entry, exit: visit.exit,
        views: visit.views, readingMs: visit.readingMs, source: SOURCE_LABEL[source], campaign: visit.campaign, place: place(v.current), device: deviceOf(v.current) });
    }
    people.push({ key: v.key, timelineKey: timelineKey(v), label, email: v.email, status: v.live ? "On the site" : "Left", kind: v.signedIn ? "Signed in" : isNew ? "New" : "Returning",
      firstSeen: v.first.created_at, lastSeen: v.lastAt, visits: visits.length, views: visits.reduce((sum, visit) => sum + visit.steps.filter(step => inWindow(step.at)).length, 0),
      readingMs: visits.reduce((sum, visit) => sum + visit.readingMs, 0), lastPage: v.current.path, place: place(v.current), device: deviceOf(v.current), source: SOURCE_LABEL[firstSource] });
    if (!isNew) continue;
    newSources.add(firstSource, SOURCE_LABEL[firstSource], v.key);
    newLandings.add(v.first.path, getCleanTitle(v.first.title, v.first.path), v.key);
    newVisitors.push({
      key: v.key, timelineKey: timelineKey(v), arrived: v.first.created_at, place: place(v.first), country: v.first.country ?? null, source: firstSource, sourceLabel: SOURCE_LABEL[firstSource],
      referrer: v.first.referrer_host ?? null, campaign: v.first.utm_campaign ?? null, landing: v.first.path, landingTitle: getCleanTitle(v.first.title, v.first.path),
      views: v.views, pages: v.pages, readingMs: v.totalReadingMs, visits: v.visits.length, device: deviceOf(v.first), browser: v.first.browser ?? null, os: v.first.os ?? null,
      live: v.live, lastAt: v.lastAt, signedUp: v.signedIn, email: v.email, privateWindow: Boolean(v.privateWindow), stage: v.stage, trail: v.trail,
    });
  }
  newVisitors.sort((a, b) => Date.parse(b.arrived) - Date.parse(a.arrived));
  people.sort((a, b) => b.lastSeen - a.lastSeen);
  visitRows.sort((a, b) => b.start - a.start);
  const read = newVisitors.filter(n => n.readingMs > 0);
  return {
    from, to, people: count, newVisitors,
    newSummary: {
      total: newVisitors.length, guests: newVisitors.filter(n => !n.signedUp).length, signedUp: newVisitors.filter(n => n.signedUp).length,
      live: newVisitors.filter(n => n.live).length, bounced: newVisitors.filter(n => n.views === 1).length, returnedAgain: newVisitors.filter(n => n.visits > 1).length,
      avgReadingMs: read.length ? Math.round(read.reduce((sum, n) => sum + n.readingMs, 0) / read.length) : null,
    },
    sources: sources.list(), newSources: newSources.list(), countries: countries.list(), cities: cities.list(), landings: landings.list(), newLandings: newLandings.list(),
    campaigns: campaigns.list(), people_: people, visits: visitRows,
  };
}

/**
 * Page loads the stream does not count, from the rows it read: browsers with a page view in the window that belong to
 * no counted person. They are scrapers, link prefetchers and tabs closed before anything showed, and the reason the
 * database's per-cookie counts run higher. Shown so the gap is explained, never added to any figure.
 */
export function uncountedBrowsers(rows: Pick<StreamVisit, "visitor_id" | "session_id" | "event" | "created_at">[], everyone: StreamVisitor[], from: number, to = Infinity): number {
  // Matched by session, not browser id: one person can own several browsers (a sign-in link, an in-app browser that
  // dropped its cookie), and only some of them are named on the person.
  const counted = new Set<string>();
  for (const v of everyone) for (const visit of v.visits) counted.add(visit.sessionId);
  // A browser any of whose sessions was counted belongs to a counted person.
  const known = new Set(rows.filter(row => counted.has(row.session_id)).map(row => row.visitor_id));
  const seen = new Set<string>();
  for (const row of rows) {
    const ms = Date.parse(row.created_at);
    if (row.event === "page_view" && ms >= from && ms < to && !known.has(row.visitor_id)) seen.add(row.visitor_id);
  }
  return seen.size;
}
