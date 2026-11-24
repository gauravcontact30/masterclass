/*
 * Visitor reports for Super Admin → Overview and User activities, counted from the Live visitor stream's people
 * (lib/live-visits.ts: one person per signed-in account or linked device; bots, automated browsers and page loads
 * with no time on screen left out). Every figure on both pages comes from these same people, read from the
 * site_visits table by /api/super-admin/activity/stream, so no two panels can disagree (user request 2026-11-24).
 * The SQL reports counted every browser cookie that loaded a page, which let scraper farms (one deep page each, no
 * referrer, no leave beacon or heartbeat) read as dozens of real visitors.
 *
 * Every person in a period is in exactly one group (user request 2026-11-24, "new / old / returning"):
 *   new       — their first visit ever was in the period: the tracker saw a browser with no visitor cookie
 *               (site_visits.new_visitor) and they were not signed in on that first page;
 *   returning — their first visit ever is in the records but before the period, so when they first came is known;
 *   old       — their browser was already known before the records begin (visits are kept VISIT_RETENTION_DAYS
 *               days), or they were signed in on their first recorded page, so the account existed before. How long
 *               ago they first came is not known and is never guessed: it reads "before <records start>".
 * Signed in is a separate fact about any of the three.
 * Pure: safe in the client bundle and in tests.
 */
import { classifySource, SOURCE_LABEL, type SourceId } from "./traffic-sources";
import { getCleanTitle, type StreamVisit, type StreamVisitor, type VisitSummary } from "./live-visits";

export type VisitorGroup = "new" | "returning" | "old";
export const GROUP_LABEL: Record<VisitorGroup, string> = { new: "New", returning: "Returning", old: "Old" };
export type Count = { key: string; label: string; people: number; visits: number };

/** One person in the period, with what is known about them; the shape every visitor list on both pages uses. */
export type VisitorRow = {
  key: string; timelineKey: string; label: string; email: string | null; group: VisitorGroup; signedIn: boolean;
  /** When they first came: their first visit ever for new and returning visitors; null for old (before the records). */
  firstSeen: string | null;
  /** This period: when they arrived, the visits and pages, visible time, where they came from and landed. */
  arrived: string; visitsInPeriod: number; viewsInPeriod: number; readingInPeriodMs: number;
  source: SourceId; sourceLabel: string; referrer: string | null; campaign: string | null; landing: string; landingTitle: string;
  /** Across the records: visits before this period, the end of the last one, days with a visit, all visible time. */
  visitsBefore: number; lastVisitBefore: number | null; activeDays: number; totalVisits: number; totalReadingMs: number;
  /** The page they spent longest on in the records. */
  favourite: { path: string; title: string; ms: number } | null;
  live: boolean; lastAt: number; lastPage: string; place: string; country: string | null; city: string | null; device: string; browser: string | null; os: string | null;
  privateWindow: boolean; stage: string;
};
/** @deprecated kept for older imports: a new visitor is a VisitorRow in the "new" group. */
export type NewVisitor = VisitorRow;
export type PersonRow = VisitorRow;
export type VisitRow = { key: string; timelineKey: string; who: string; group: VisitorGroup; start: number; end: number; open: boolean; entry: string; exit: string | null; views: number; readingMs: number; source: string; campaign: string | null; place: string; device: string };
export type GroupSummary = {
  people: number; signedIn: number; live: number; explored: number; bounced: number; avgReadingMs: number | null;
  /** New: came back for a second visit. Returning and old: visits before this period (average), and how soon they came back. */
  cameBack: number; avgVisitsBefore: number | null; medianGapMs: number | null;
};
export type VisitorReport = {
  from: number; to: number; people: number; signedIn: number;
  groups: Record<VisitorGroup, GroupSummary>;
  rows: VisitorRow[];
  /** How many visits each person has made in the records, and how long returning and old visitors stayed away. */
  frequency: Count[]; gaps: Count[];
  sources: Count[]; groupSources: Record<VisitorGroup, Count[]>; groupLandings: Record<VisitorGroup, Count[]>;
  countries: Count[]; cities: Count[]; landings: Count[]; campaigns: Count[]; visits: VisitRow[];
  // Older names, still read by callers.
  newVisitors: VisitorRow[]; newSummary: { total: number; guests: number; signedUp: number; live: number; bounced: number; returnedAgain: number; avgReadingMs: number | null };
  newSources: Count[]; newLandings: Count[]; people_: VisitorRow[];
};

const place = (v: StreamVisit) => [v.city, v.country].filter(Boolean).join(", ") || "Location not reported";
const deviceOf = (v: StreamVisit) => [v.device, v.browser, v.os].filter(Boolean).join(" · ") || "Device not reported";
const istDay = (ms: number) => new Date(ms + 19_800_000).toISOString().slice(0, 10);
/** The id /api/super-admin/activity?person= accepts: an account id, or the browser's visitor id. */
export const timelineKey = (v: StreamVisitor) => v.signedIn && v.first.user_id ? v.first.user_id : v.current.user_id ?? `visitor:${v.first.visitor_id}`;

/** Which group a person is in for a period starting at `from` (see the header). */
export function visitorGroup(v: Pick<StreamVisitor, "first">, from: number): VisitorGroup {
  const firstEver = Boolean(v.first.new_visitor) && !v.first.user_id;
  if (!firstEver) return "old";
  return Date.parse(v.first.created_at) >= from ? "new" : "returning";
}

function counter() {
  const map = new Map<string, { label: string; people: Set<string>; visits: number }>();
  return {
    add(key: string, label: string, person: string, visits = 1) { const entry = map.get(key) ?? { label, people: new Set<string>(), visits: 0 }; entry.people.add(person); entry.visits += visits; map.set(key, entry); },
    list(): Count[] { return [...map].map(([key, e]) => ({ key, label: e.label, people: e.people.size, visits: e.visits })).sort((a, b) => b.people - a.people || b.visits - a.visits || a.label.localeCompare(b.label)); },
  };
}
const median = (values: number[]) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b), mid = sorted.length >> 1; return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2); };

/** Which platform a visit came from (lib/traffic-sources.ts rules), from its first page's campaign tag or referrer. */
export function visitSource(visit: Pick<VisitSummary, "source">, first: StreamVisit | null, ownHosts: readonly string[] = []): SourceId {
  return first ? classifySource({ utm_source: first.utm_source ?? null, utm_medium: first.utm_medium ?? null, referrer_host: first.referrer_host ?? visit.source }, ownHosts)
    : classifySource({ utm_source: visit.source, referrer_host: visit.source }, ownHosts);
}

const FREQUENCY: [string, (n: number) => boolean][] = [["1 visit", n => n === 1], ["2 visits", n => n === 2], ["3–5 visits", n => n >= 3 && n <= 5], ["6+ visits", n => n >= 6]];
const GAPS: [string, (ms: number) => boolean][] = [["Same day", ms => ms < 86_400_000], ["1–2 days", ms => ms < 3 * 86_400_000], ["3+ days", () => true]];

/**
 * The report for visits opened in [from, to). A person counts when one of their page views falls in the window and is
 * in exactly one group; signed in is shown on top of the group.
 */
export function visitorReport(everyone: StreamVisitor[], from: number, to = Infinity, ownHosts: readonly string[] = []): VisitorReport {
  const inWindow = (ms: number) => ms >= from && ms < to;
  const sources = counter(), countries = counter(), cities = counter(), landings = counter(), campaigns = counter(), frequency = counter(), gaps = counter();
  const groupSources = { new: counter(), returning: counter(), old: counter() }, groupLandings = { new: counter(), returning: counter(), old: counter() };
  const rows: VisitorRow[] = [], visitRows: VisitRow[] = [];
  for (const v of everyone) {
    const visits = v.visits.filter(visit => visit.steps.some(step => inWindow(step.at)));
    if (!visits.length) continue;
    const group = visitorGroup(v, from);
    const before = v.visits.filter(visit => visit.start < from && !visits.includes(visit));
    const firstHere = visits[0], entry = firstHere.steps.find(step => inWindow(step.at)) ?? firstHere.steps[0];
    // The visit's own first page carries its referrer; the person's very first page also has the campaign columns.
    const source = visitSource(firstHere, firstHere === v.visits[0] ? v.first : null, ownHosts);
    const label = v.email ?? `Visitor ${v.key.replace(/^(visitor|device):/, "").slice(0, 8)}`;
    const pageMs = new Map<string, { title: string; ms: number }>();
    for (const visit of v.visits) for (const step of visit.steps) { const e = pageMs.get(step.path) ?? { title: getCleanTitle(step.title, step.path), ms: 0 }; e.ms += step.ms ?? 0; pageMs.set(step.path, e); }
    const favourite = [...pageMs].sort((a, b) => b[1].ms - a[1].ms)[0];
    const lastVisitBefore = before.length ? Math.max(...before.map(visit => visit.end)) : null;
    const row: VisitorRow = {
      key: v.key, timelineKey: timelineKey(v), label, email: v.email, group, signedIn: v.signedIn,
      firstSeen: group === "old" ? null : v.first.created_at,
      arrived: new Date(firstHere.start).toISOString(), visitsInPeriod: visits.length,
      viewsInPeriod: visits.reduce((sum, visit) => sum + visit.steps.filter(step => inWindow(step.at)).length, 0),
      readingInPeriodMs: visits.reduce((sum, visit) => sum + visit.readingMs, 0),
      source, sourceLabel: SOURCE_LABEL[source], referrer: firstHere === v.visits[0] ? v.first.referrer_host ?? null : firstHere.source,
      campaign: firstHere.campaign ?? (firstHere === v.visits[0] ? v.first.utm_campaign ?? null : null),
      landing: entry.path, landingTitle: getCleanTitle(entry.title, entry.path),
      visitsBefore: before.length, lastVisitBefore, activeDays: new Set(v.visits.map(visit => istDay(visit.start))).size,
      totalVisits: v.visits.length, totalReadingMs: v.totalReadingMs,
      favourite: favourite && favourite[1].ms > 0 ? { path: favourite[0], title: favourite[1].title, ms: favourite[1].ms } : null,
      live: v.live, lastAt: v.lastAt, lastPage: v.current.path, place: place(v.current), country: v.current.country ?? v.first.country ?? null, city: v.current.city ?? v.first.city ?? null,
      device: deviceOf(v.current), browser: v.current.browser ?? null, os: v.current.os ?? null, privateWindow: Boolean(v.privateWindow), stage: v.stage,
    };
    rows.push(row);
    countries.add(row.country ?? "Unknown", row.country ?? "Unknown", v.key, visits.length);
    if (row.city) cities.add(`${row.city}|${row.country ?? ""}`, [row.city, row.country].filter(Boolean).join(", "), v.key, visits.length);
    groupSources[group].add(source, SOURCE_LABEL[source], v.key);
    groupLandings[group].add(entry.path, row.landingTitle, v.key);
    const visitsKnown = v.visits.length;
    const bucket = FREQUENCY.find(([, test]) => test(visitsKnown))![0];
    frequency.add(bucket, bucket, v.key);
    if (group !== "new" && lastVisitBefore != null) { const gap = GAPS.find(([, test]) => test(firstHere.start - lastVisitBefore))![0]; gaps.add(gap, gap, v.key); }
    else if (group === "old") gaps.add("First visit in the records", "First visit in the records", v.key);
    for (const visit of visits) {
      const visitSourceId = visit === firstHere ? source : visitSource(visit, visit === v.visits[0] ? v.first : null, ownHosts);
      const first = visit.steps.find(step => inWindow(step.at)) ?? visit.steps[0];
      sources.add(visitSourceId, SOURCE_LABEL[visitSourceId], v.key);
      landings.add(first.path, getCleanTitle(first.title, first.path), v.key);
      if (visit.campaign) campaigns.add(`${visit.source ?? "untagged"}|${visit.campaign}`, [visit.source ?? "untagged", visit.campaign].filter(Boolean).join(" · "), v.key);
      visitRows.push({ key: `${v.key}|${visit.sessionId}`, timelineKey: row.timelineKey, who: label, group, start: visit.start, end: visit.end, open: visit.open, entry: visit.entry, exit: visit.exit,
        views: visit.views, readingMs: visit.readingMs, source: SOURCE_LABEL[visitSourceId], campaign: visit.campaign, place: row.place, device: row.device });
    }
  }
  rows.sort((a, b) => b.lastAt - a.lastAt);
  visitRows.sort((a, b) => b.start - a.start);
  const summarise = (group: VisitorGroup): GroupSummary => {
    const list = rows.filter(r => r.group === group), read = list.filter(r => r.readingInPeriodMs > 0);
    const gapsMs = list.filter(r => r.lastVisitBefore != null).map(r => Date.parse(r.arrived) - r.lastVisitBefore!);
    return {
      people: list.length, signedIn: list.filter(r => r.signedIn).length, live: list.filter(r => r.live).length,
      explored: list.filter(r => r.viewsInPeriod > 1).length, bounced: list.filter(r => r.viewsInPeriod === 1).length,
      avgReadingMs: read.length ? Math.round(read.reduce((sum, r) => sum + r.readingInPeriodMs, 0) / read.length) : null,
      cameBack: group === "new" ? list.filter(r => r.visitsInPeriod > 1).length : list.filter(r => r.visitsBefore > 0).length,
      avgVisitsBefore: group === "new" || !list.length ? null : Math.round((list.reduce((sum, r) => sum + r.visitsBefore, 0) / list.length) * 10) / 10,
      medianGapMs: median(gapsMs),
    };
  };
  const groups = { new: summarise("new"), returning: summarise("returning"), old: summarise("old") };
  const newRows = rows.filter(r => r.group === "new").sort((a, b) => Date.parse(b.arrived) - Date.parse(a.arrived));
  const order = new Map(FREQUENCY.map(([label], i) => [label, i]));
  const gapOrder = new Map([...GAPS.map(([label], i) => [label, i] as const), ["First visit in the records", 9] as const]);
  return {
    from, to, people: rows.length, signedIn: rows.filter(r => r.signedIn).length, groups, rows,
    frequency: frequency.list().sort((a, b) => (order.get(a.key) ?? 9) - (order.get(b.key) ?? 9)),
    gaps: gaps.list().sort((a, b) => (gapOrder.get(a.key) ?? 9) - (gapOrder.get(b.key) ?? 9)),
    sources: sources.list(), groupSources: { new: groupSources.new.list(), returning: groupSources.returning.list(), old: groupSources.old.list() },
    groupLandings: { new: groupLandings.new.list(), returning: groupLandings.returning.list(), old: groupLandings.old.list() },
    countries: countries.list(), cities: cities.list(), landings: landings.list(), campaigns: campaigns.list(), visits: visitRows,
    newVisitors: newRows,
    newSummary: { total: groups.new.people, guests: groups.new.people - groups.new.signedIn, signedUp: groups.new.signedIn, live: groups.new.live, bounced: groups.new.bounced, returnedAgain: groups.new.cameBack, avgReadingMs: groups.new.avgReadingMs },
    newSources: groupSources.new.list(), newLandings: groupLandings.new.list(), people_: rows,
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
