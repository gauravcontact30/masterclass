import { dayBounds, reportDay } from "./daily-social";

/*
 * The Overview's "Last 7 days" report: the seven IST calendar days ending today, compared with the seven before them.
 * Days are ranked by visitors; learning paths and contents are ranked by page views. Built from stored page views and
 * page-leave beacons (the time read), already filtered to people by the route (lib/visit-quality.ts).
 */

export type WeekView = {
  created_at: string; visitor_id: string; session_id: string; user_id: string | null; path: string; title?: string | null;
  new_visitor?: boolean | null; device?: string | null; referrer_host?: string | null; utm_source?: string | null; country?: string | null;
};
export type WeekLeave = { created_at: string; session_id: string; path: string; duration_ms: number | null };

export type WeekTotals = {
  visitors: number; newVisitors: number; signedIn: number; sessions: number; views: number;
  engagedSeconds: number; avgSecondsPerVisitor: number; pagesPerSession: number; bounceRate: number;
};
export type WeekDay = WeekTotals & {
  date: string; weekday: string; partial: boolean; rank: number;
  topPath: { name: string; views: number } | null; topContent: { title: string; path: string; views: number } | null;
};
export type WeekPath = { name: string; views: number; visitors: number; engagedSeconds: number };
export type WeekContent = { path: string; title: string; learningPath: string; views: number; visitors: number; avgSeconds: number; days: number };
export type WeekSlice = { name: string; value: number };
export type WeekReport = {
  from: string; to: string; today: string; days: WeekDay[];
  current: WeekTotals; previous: WeekTotals;
  paths: WeekPath[]; contents: WeekContent[];
  devices: WeekSlice[]; sources: WeekSlice[]; countries: WeekSlice[];
};

/** Pages that are not learning content: they count as visits but never as a learning path or content. */
export const NOT_LEARNING = "Site pages";

/**
 * The learning path a page belongs to, across the public pages and the Learning Dashboard (and the old /dashboard
 * paths stored before the 2026-10-25 move). Anything that is not learning content is NOT_LEARNING.
 */
export function learningPath(path: string): string {
  const p = path.toLowerCase().replace(/^\/dashboard(?=\/|$)/, "/learning");
  if (/^\/learning\/(lessons|learn)(\/|$)|^\/(courses|learn)(\/|$)/.test(p)) return "Courses & lessons";
  if (/interview/.test(p)) return "Interview prep";
  if (/workflow/.test(p)) return "Workflows & AI agents";
  if (/^\/compare(\/|$)/.test(p)) return "Tech comparisons";
  if (/^\/learning\/(official-docs|api-docs|techy)(\/|$)|^\/api-reference(\/|$)/.test(p)) return "Docs & API reference";
  if (/^\/learning\/quiz(\/|$)/.test(p)) return "Quiz";
  if (/^\/learning\/certifications(\/|$)/.test(p)) return "Certifications";
  if (/vocab/.test(p)) return "Vocabulary";
  if (/^\/tech-buzz(\/|$)/.test(p)) return "Tech Buzz";
  if (/^\/learning\/coffee-and-code(\/|$)/.test(p)) return "Coffee & Code";
  if (/^\/learning\/compiler(\/|$)/.test(p)) return "Compiler";
  if (/^\/learning\/(notes|bookmark|search|step-by-step|library|mentors)(\/|$)|^\/library(\/|$)/.test(p)) return "Notes & study tools";
  if (/^\/learning\/(plans|settings)(\/|$)/.test(p)) return NOT_LEARNING;
  if (/^\/learning\/[^/]+/.test(p)) return "Preparation guides";
  if (p === "/learning") return "Learning dashboard";
  return NOT_LEARNING;
}

const WEEKDAY = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
/** The IST day a timestamp falls on (YYYY-MM-DD). */
const istDate = (iso: string) => new Date(Date.parse(iso) + 19800_000).toISOString().slice(0, 10);
const shiftDay = (day: string, by: number) => new Date(Date.parse(`${day}T00:00:00Z`) + by * 86400_000).toISOString().slice(0, 10);
const round = (value: number, places = 0) => { const f = 10 ** places; return Math.round(value * f) / f; };
const titleOf = (title: string | null | undefined, path: string) => {
  // Some stored titles carry the brand twice ("… | MasterClass | MasterClass").
  const clean = (title ?? "").replace(/(\s*[|·•–-]\s*Master ?Class( Buddy)?)+\s*$/i, "").trim();
  if (clean) return clean;
  const last = path.split("/").filter(Boolean).at(-1) ?? "Home";
  return last.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};
const REGIONS = new Intl.DisplayNames(["en"], { type: "region" });
/** "IN" → "India"; an unknown or missing code stays as it is. */
function countryName(code: string | null | undefined) {
  if (!code) return null;
  try { return REGIONS.of(code.toUpperCase()) ?? code; } catch { return code; }
}
/** Where a session came from: its campaign, else the referring site, else direct (our own host counts as direct). */
function sourceOf(view: WeekView, ownHosts: string[]): string {
  // Campaign tags are short names ("fb", "ig", "li"); referrers are host names. Both fold into the same families.
  const host = (view.utm_source || view.referrer_host)?.toLowerCase().trim().replace(/^www\./, "");
  if (!host || ownHosts.some(own => host === own || host.endsWith(`.${own}`))) return "Direct";
  if (/^(fb|facebook|ig|instagram|meta)$/.test(host)) return "Meta";
  if (/^(li|linkedin)$/.test(host)) return "LinkedIn";
  if (/^(x|twitter|tw)$/.test(host)) return "X (Twitter)";
  if (/^(google|gsc|google_search)$/.test(host)) return "Google";
  if (/google\./.test(host)) return "Google";
  if (/bing\.|duckduckgo|yahoo\./.test(host)) return "Other search";
  if (/linkedin|lnkd/.test(host)) return "LinkedIn";
  if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(host)) return "X (Twitter)";
  if (/facebook|instagram|fb\./.test(host)) return "Meta";
  if (/chatgpt|openai|perplexity|claude\.ai|gemini/.test(host)) return "AI assistants";
  return host;
}

function totals(views: WeekView[], leaves: WeekLeave[]): WeekTotals {
  const sessions = new Map<string, number>();
  for (const view of views) sessions.set(view.session_id, (sessions.get(view.session_id) ?? 0) + 1);
  const visitors = new Set(views.map(view => view.visitor_id)).size;
  const engagedSeconds = round(leaves.reduce((sum, leave) => sum + (leave.duration_ms ?? 0), 0) / 1000);
  return {
    visitors, views: views.length, sessions: sessions.size,
    newVisitors: new Set(views.filter(view => view.new_visitor).map(view => view.visitor_id)).size,
    signedIn: new Set(views.map(view => view.user_id).filter(Boolean)).size,
    engagedSeconds, avgSecondsPerVisitor: visitors ? round(engagedSeconds / visitors) : 0,
    pagesPerSession: sessions.size ? round(views.length / sessions.size, 2) : 0,
    bounceRate: sessions.size ? round(100 * [...sessions.values()].filter(count => count === 1).length / sessions.size, 1) : 0,
  };
}

/** The top `keep` slices by value, the rest folded into "Other" (a pie never gets more hues than the palette has). */
function slices(counts: Map<string, number>, keep = 5): WeekSlice[] {
  const sorted = [...counts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  if (sorted.length <= keep + 1) return sorted;
  return [...sorted.slice(0, keep), { name: "Other", value: sorted.slice(keep).reduce((sum, slice) => sum + slice.value, 0) }];
}

/**
 * `views`/`leaves` cover the fourteen days from `weekBounds(today).previousFrom`; rows outside them are ignored.
 * `ownHosts` are the site's own domains (a referrer from them is navigation inside the site, not a source).
 */
export function weekReport(views: WeekView[], leaves: WeekLeave[], today = reportDay(), ownHosts: string[] = []): WeekReport {
  // Visits before the 2026-10-25 move are stored under /dashboard: count them with the /learning page they became.
  const canonical = (path: string) => path.replace(/^\/dashboard\/super-admin(?=\/|$)/, "/super-admin").replace(/^\/dashboard(?=\/|$)/, "/learning");
  views = views.map(view => ({ ...view, path: canonical(view.path) }));
  leaves = leaves.map(leave => ({ ...leave, path: canonical(leave.path) }));
  const from = shiftDay(today, -6), previousFrom = shiftDay(today, -13);
  const days = Array.from({ length: 7 }, (_, index) => shiftDay(from, index));
  const inWeek = (iso: string) => { const day = istDate(iso); return day >= from && day <= today; };
  const inPrevious = (iso: string) => { const day = istDate(iso); return day >= previousFrom && day < from; };
  const week = views.filter(view => inWeek(view.created_at));
  const weekLeaves = leaves.filter(leave => inWeek(leave.created_at));

  // Time read per path, and per day per path, from the leave beacons.
  const secondsByPath = new Map<string, number>();
  for (const leave of weekLeaves) secondsByPath.set(leave.path, (secondsByPath.get(leave.path) ?? 0) + (leave.duration_ms ?? 0) / 1000);

  const top = <T,>(items: Map<string, T[]>) => [...items].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))[0];
  const dayStats = days.map(date => {
    const dayViews = week.filter(view => istDate(view.created_at) === date);
    const byPath = new Map<string, WeekView[]>(), byContent = new Map<string, WeekView[]>();
    for (const view of dayViews) {
      const name = learningPath(view.path);
      if (name === NOT_LEARNING) continue;
      (byPath.get(name) ?? byPath.set(name, []).get(name)!).push(view);
      (byContent.get(view.path) ?? byContent.set(view.path, []).get(view.path)!).push(view);
    }
    const path = top(byPath), content = top(byContent);
    return {
      ...totals(dayViews, weekLeaves.filter(leave => istDate(leave.created_at) === date)),
      date, weekday: WEEKDAY.format(new Date(`${date}T12:00:00+05:30`)), partial: date === today, rank: 0,
      topPath: path ? { name: path[0], views: path[1].length } : null,
      topContent: content ? { path: content[0], title: titleOf(content[1].at(-1)?.title, content[0]), views: content[1].length } : null,
    } satisfies WeekDay;
  });
  // Busiest first: visitors, then views, then the earlier day.
  [...dayStats].sort((a, b) => b.visitors - a.visitors || b.views - a.views || a.date.localeCompare(b.date)).forEach((day, index) => { day.rank = index + 1; });

  const pathMap = new Map<string, { views: number; visitors: Set<string>; seconds: number }>();
  const contentMap = new Map<string, { views: number; visitors: Set<string>; days: Set<string>; title: string | null | undefined }>();
  for (const view of week) {
    const name = learningPath(view.path);
    if (name === NOT_LEARNING) continue;
    const entry = pathMap.get(name) ?? { views: 0, visitors: new Set(), seconds: 0 };
    entry.views++; entry.visitors.add(view.visitor_id); pathMap.set(name, entry);
    const content = contentMap.get(view.path) ?? { views: 0, visitors: new Set(), days: new Set(), title: null };
    content.views++; content.visitors.add(view.visitor_id); content.days.add(istDate(view.created_at)); content.title = view.title || content.title; contentMap.set(view.path, content);
  }
  for (const [path, seconds] of secondsByPath) { const entry = pathMap.get(learningPath(path)); if (entry) entry.seconds += seconds; }

  const firstViews = new Map<string, WeekView>();
  for (const view of [...week].sort((a, b) => a.created_at.localeCompare(b.created_at))) if (!firstViews.has(view.session_id)) firstViews.set(view.session_id, view);
  const count = (pick: (view: WeekView) => string | null | undefined) => {
    const counts = new Map<string, number>();
    for (const view of firstViews.values()) { const key = pick(view) || "Unknown"; counts.set(key, (counts.get(key) ?? 0) + 1); }
    return counts;
  };

  return {
    from, to: today, today, days: dayStats,
    current: totals(week, weekLeaves),
    previous: totals(views.filter(view => inPrevious(view.created_at)), leaves.filter(leave => inPrevious(leave.created_at))),
    paths: [...pathMap].map(([name, entry]) => ({ name, views: entry.views, visitors: entry.visitors.size, engagedSeconds: round(entry.seconds) }))
      .sort((a, b) => b.views - a.views || b.visitors - a.visitors || a.name.localeCompare(b.name)),
    contents: [...contentMap].map(([path, entry]) => ({ path, title: titleOf(entry.title, path), learningPath: learningPath(path), views: entry.views, visitors: entry.visitors.size,
      avgSeconds: round((secondsByPath.get(path) ?? 0) / entry.views), days: entry.days.size }))
      .sort((a, b) => b.views - a.views || b.visitors - a.visitors || a.path.localeCompare(b.path)).slice(0, 15),
    // Sessions, judged by their first page: where they came from, on what, and from where.
    devices: slices(count(view => view.device)),
    sources: slices(count(view => sourceOf(view, ownHosts))),
    countries: slices(count(view => countryName(view.country))),
  };
}

/** The fourteen IST days the report reads: this week and the one before it. */
export function weekBounds(today = reportDay()) {
  return { since: dayBounds(shiftDay(today, -13)).since, until: dayBounds(today).until };
}
