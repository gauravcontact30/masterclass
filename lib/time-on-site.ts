import type { StreamVisitor, VisitSummary } from "./live-visits";
import { SOURCE_LABEL } from "./traffic-sources";
import { visitorGroup, visitSource, type VisitorGroup } from "./visitor-report";

/*
 * "Time on site" for the Overview (today) and User activities (the reporting window): how long visitors stay, measured
 * from the Live visitor stream's own timing (lib/live-visits.ts), never estimated from page counts:
 *  - on screen: the visible stretches of a visit's pages, merged (a hidden tab or a second window does not count twice),
 *    from each page's leave beacons plus the heartbeat of a page still open. This is the "time spent" figure.
 *  - visit length: arrival to the last activity, or to now while a page is still open (includes hidden-tab time).
 * Both are the figures the visitor cards show, so every panel agrees. Crawlers, automated browsers and visitors under a
 * second are already left out of `everyone`.
 */

export const STAY_BUCKETS: [label: string, maxMs: number][] = [
  ["Under 10 s", 10_000], ["10–30 s", 30_000], ["30 s – 1 min", 60_000], ["1–3 min", 180_000],
  ["3–10 min", 600_000], ["10–30 min", 1_800_000], ["30 min +", Infinity],
];
/** Visitors with at least this much time on screen in the window are "engaged"; at least DEEP_MS, "deep readers". */
export const ENGAGED_MS = 30_000, DEEP_MS = 180_000;

export type LiveStay = {
  key: string; who: string; signedIn: boolean; group: VisitorGroup;
  /** This visit: arrival to now, and its time on screen so far (both at the read's clock). */
  stayMs: number; onScreenMs: number; pageMs: number | null; reading: boolean;
  page: string; pageTitle: string; pagesThisVisit: number; visitsBefore: number;
  arrivedAt: number; source: string; country: string | null; city: string | null; device: string; browser: string | null;
};
export type LongVisit = { key: string; who: string; start: number; open: boolean; onScreenMs: number; stayMs: number; views: number; entry: string; exit: string | null; source: string; country: string | null; city: string | null; device: string };
export type Engagement = { key: string; label: string; people: number; visits: number; avgOnScreenMs: number; bounceRate: number };
export type PageAttention = { path: string; title: string; views: number; people: number; totalMs: number; avgMs: number | null };
export type ExitPage = { path: string; exits: number; views: number; exitRate: number };

export type TimeOnSite = {
  people: number; visits: number;
  totalOnScreenMs: number;
  avgOnScreenMs: number | null; medianOnScreenMs: number | null;
  avgVisitMs: number | null; medianVisitMs: number | null; longestVisitMs: number | null;
  engaged: number; deep: number; bounced: number;
  buckets: { label: string; people: number }[];
  /** How each visit's time is known: every page closed with its beacon, still running (heartbeat), or partly missing. */
  timing: { recorded: number; live: number; partial: number };
  live: LiveStay[];
  longest: LongVisit[];
  sources: Engagement[]; countries: Engagement[]; devices: Engagement[];
  pages: PageAttention[];
  exits: ExitPage[];
};

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const whoOf = (v: StreamVisitor) => v.email ?? `Visitor ${v.key.replace(/^(visitor|device):/, "").slice(0, 8)}`;

export function timeOnSite(everyone: StreamVisitor[], from: number, to = Infinity, ownHosts: readonly string[] = []): TimeOnSite {
  const inPeriod = (ms: number) => ms >= from && ms < to;
  const perPerson: { onScreen: number; stay: number }[] = [];
  const visitLengths: number[] = [];
  const timing = { recorded: 0, live: 0, partial: 0 };
  const longest: LongVisit[] = [];
  const groups = { sources: new Map<string, Agg>(), countries: new Map<string, Agg>(), devices: new Map<string, Agg>() };
  const pages = new Map<string, { title: string; views: number; people: Set<string>; totalMs: number; closedMs: number; closed: number }>();
  const exits = new Map<string, number>(), viewsByPath = new Map<string, number>();
  let visits = 0, bounced = 0, totalOnScreen = 0;

  for (const v of everyone) {
    const mine = v.visits.filter(visit => visit.steps.some(step => inPeriod(step.at)));
    if (!mine.length) continue;
    const onScreen = mine.reduce((sum, visit) => sum + visit.readingMs, 0), stay = mine.reduce((sum, visit) => sum + visit.stayMs, 0);
    perPerson.push({ onScreen, stay });
    totalOnScreen += onScreen;
    const country = v.current.country ?? v.first.country ?? null, device = (v.current.device || "Desktop");
    for (const visit of mine) {
      visits++; visitLengths.push(visit.stayMs); timing[visit.timing]++;
      if (visit.views === 1) bounced++;
      const source = SOURCE_LABEL[visitSource(visit, visit === v.visits[0] ? v.first : null, ownHosts)] ?? "Other";
      add(groups.sources, source, v.key, visit);
      add(groups.countries, country ?? "Unknown", v.key, visit);
      add(groups.devices, device, v.key, visit);
      longest.push({ key: `${v.key}|${visit.sessionId}`, who: whoOf(v), start: visit.start, open: visit.open, onScreenMs: visit.readingMs, stayMs: visit.stayMs, views: visit.views,
        entry: visit.entry, exit: visit.open ? null : visit.exit, source, country, city: v.current.city ?? v.first.city ?? null, device });
      for (const step of visit.steps) {
        if (!inPeriod(step.at)) continue;
        viewsByPath.set(step.path, (viewsByPath.get(step.path) ?? 0) + 1);
        const page = pages.get(step.path) ?? { title: step.title, views: 0, people: new Set<string>(), totalMs: 0, closedMs: 0, closed: 0 };
        page.views++; page.people.add(v.key);
        if (step.ms != null) { page.totalMs += step.ms; if (!step.open) { page.closedMs += step.ms; page.closed++; } }
        pages.set(step.path, page);
      }
      // Where the visit ended: only visits that are over have an exit page.
      if (!visit.open && visit.exit) exits.set(visit.exit, (exits.get(visit.exit) ?? 0) + 1);
    }
  }

  const onScreens = perPerson.map(p => p.onScreen);
  const live = everyone.filter(v => v.live).map((v): LiveStay => ({
    key: v.key, who: whoOf(v), signedIn: v.signedIn, group: visitorGroup(v, from),
    stayMs: v.stayDurationMs, onScreenMs: v.sessionEngagedMs, pageMs: v.page?.ms ?? null, reading: Boolean(v.page?.open),
    page: v.current.path, pageTitle: v.currentStep?.title ?? v.current.title ?? v.current.path, pagesThisVisit: v.visit.views, visitsBefore: Math.max(0, v.visits.length - 1),
    arrivedAt: v.visit.start, source: SOURCE_LABEL[visitSource(v.visit, v.visit === v.visits[0] ? v.first : null, ownHosts)] ?? "Other",
    country: v.current.country ?? v.first.country ?? null, city: v.current.city ?? v.first.city ?? null, device: v.current.device || "Desktop", browser: v.current.browser ?? null,
  })).sort((a, b) => b.stayMs - a.stayMs);

  return {
    people: perPerson.length, visits, totalOnScreenMs: totalOnScreen,
    avgOnScreenMs: perPerson.length ? totalOnScreen / perPerson.length : null, medianOnScreenMs: median(onScreens),
    avgVisitMs: visitLengths.length ? visitLengths.reduce((a, b) => a + b, 0) / visitLengths.length : null, medianVisitMs: median(visitLengths),
    longestVisitMs: visitLengths.length ? Math.max(...visitLengths) : null,
    engaged: onScreens.filter(ms => ms >= ENGAGED_MS).length, deep: onScreens.filter(ms => ms >= DEEP_MS).length, bounced,
    buckets: STAY_BUCKETS.map(([label, max], i) => ({ label, people: onScreens.filter(ms => ms < max && ms >= (i ? STAY_BUCKETS[i - 1][1] : 0)).length })),
    timing, live,
    longest: longest.sort((a, b) => b.onScreenMs - a.onScreenMs || b.stayMs - a.stayMs).slice(0, 10),
    sources: rank(groups.sources), countries: rank(groups.countries), devices: rank(groups.devices),
    pages: [...pages].map(([path, p]) => ({ path, title: p.title, views: p.views, people: p.people.size, totalMs: p.totalMs, avgMs: p.closed ? p.closedMs / p.closed : null }))
      .sort((a, b) => b.totalMs - a.totalMs || b.people - a.people).slice(0, 10),
    exits: [...exits].map(([path, n]) => ({ path, exits: n, views: viewsByPath.get(path) ?? n, exitRate: Math.round((n / Math.max(n, viewsByPath.get(path) ?? n)) * 100) }))
      .sort((a, b) => b.exits - a.exits || a.path.localeCompare(b.path)).slice(0, 10),
  };
}

type Agg = { people: Set<string>; visits: number; onScreen: Map<string, number>; bounced: number };
function add(map: Map<string, Agg>, key: string, person: string, visit: VisitSummary) {
  const agg = map.get(key) ?? { people: new Set<string>(), visits: 0, onScreen: new Map<string, number>(), bounced: 0 };
  agg.people.add(person); agg.visits++; agg.onScreen.set(person, (agg.onScreen.get(person) ?? 0) + visit.readingMs);
  if (visit.views === 1) agg.bounced++;
  map.set(key, agg);
}
/** Average time on screen per visitor (not per visit), so a person with many short visits is one visitor. */
function rank(map: Map<string, Agg>): Engagement[] {
  return [...map].map(([key, a]) => ({ key, label: key, people: a.people.size, visits: a.visits,
    avgOnScreenMs: [...a.onScreen.values()].reduce((x, y) => x + y, 0) / a.people.size, bounceRate: Math.round((a.bounced / a.visits) * 100) }))
    .sort((a, b) => b.people - a.people || b.avgOnScreenMs - a.avgOnScreenMs).slice(0, 8);
}

/** "4m 05s", "1h 12m", "38s": a duration for the tables. */
export function stayText(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
}
/** "00:04:05": a running clock, HH:MM:SS. */
export function stayClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(x => String(x).padStart(2, "0")).join(":");
}
