import { dayBounds } from "./daily-social";

export type HourVisit = {
  created_at: string; visitor_id: string; session_id: string; user_id: string | null; path: string;
  title?: string | null; new_visitor?: boolean | null; city?: string | null; country?: string | null; device?: string | null; browser?: string | null;
  email?: string | null;
};
/** A click from the visit tracker (monitor_events kind site_interaction): the section it was in and the card or button. */
export type HourClick = { created_at: string; visitor_id: string; user_id: string | null; path: string; topic: string | null; option: string; target_path?: string | null; email?: string | null };

// Rows kept per list in each hour, so a busy day's report stays small.
const LIST = 50;
// Visit paths per hour, and the steps kept from each.
const JOURNEYS = 20, JOURNEY_STEPS = 30;
export type JourneyStep = { kind: "view"; at: string; path: string; title: string | null } | { kind: "click"; at: string; path: string; section: string; card: string; target: string | null };
const istHour = (iso: string) => new Date(Date.parse(iso) + 19800_000).getUTCHours();
const span = (times: number[]) => ({ first: new Date(Math.min(...times)).toISOString(), last: new Date(Math.max(...times)).toISOString() });

export function activityHours(visits: HourVisit[], date: string, clicks: HourClick[] = []) {
  const { since, until } = dayBounds(date);
  const start = Date.parse(since), end = Date.parse(until);
  const inDay = (iso: string) => { const timestamp = Date.parse(iso); return timestamp >= start && timestamp < end; };
  const rows = visits.filter(row => inDay(row.created_at));
  const taps = clicks.filter(row => inDay(row.created_at));
  const unique = (items: HourVisit[], key: "visitor_id" | "user_id") => new Set(items.map(row => row[key]).filter(Boolean)).size;
  const sessions = (items: HourVisit[]) => new Set(items.map(row => `${row.visitor_id}:${row.session_id}`)).size;
  const hours = Array.from({ length: 24 }, (_, hour) => {
    const items = rows.filter(row => istHour(row.created_at) === hour);
    const hourClicks = taps.filter(row => istHour(row.created_at) === hour);
    const paths = new Map<string, number>();
    items.forEach(row => paths.set(row.path, (paths.get(row.path) || 0) + 1));
    const timestamps = items.map(row => Date.parse(row.created_at));
    return { hour, views: items.length, visitors: unique(items, "visitor_id"), signedIn: unique(items, "user_id"), sessions: sessions(items),
      routes: paths.size,
      firstSeen: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null,
      lastSeen: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
      pages: [...paths].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views || a.path.localeCompare(b.path)).slice(0, 5),
      details: hourDetails(items, hourClicks) };
  });
  return { date, hours, totals: { views: rows.length, visitors: unique(rows, "visitor_id"), signedIn: unique(rows, "user_id"), sessions: sessions(rows) } };
}

/** What happened in one hour: each page view, the sections and cards clicked, and who the visitors, users and routes were. */
function hourDetails(items: HourVisit[], clicks: HourClick[]) {
  // Each visitor's path through the hour: their page views and the clicks between them, in order. Most recently
  // active visitors first; long paths keep their latest steps.
  const journeys = [...new Set([...items.map(row => row.visitor_id), ...clicks.map(click => click.visitor_id)])].map(id => {
    const views = items.filter(row => row.visitor_id === id), taps = clicks.filter(click => click.visitor_id === id);
    const steps: JourneyStep[] = [
      ...views.map(row => ({ kind: "view" as const, at: row.created_at, path: row.path, title: row.title ?? null })),
      ...taps.map(click => ({ kind: "click" as const, at: click.created_at, path: click.path, section: click.topic || "General", card: click.option, target: click.target_path ?? null })),
    ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    return { visitor: id.slice(0, 8), email: views.find(row => row.email)?.email ?? null, signedIn: views.some(row => row.user_id) || taps.some(click => click.user_id),
      newVisitor: views.some(row => row.new_visitor), views: views.length, clicks: taps.length, total: steps.length,
      first: steps[0].at, last: steps.at(-1)!.at, steps: steps.slice(-JOURNEY_STEPS) };
  }).sort((a, b) => b.last.localeCompare(a.last)).slice(0, JOURNEYS);

  const sections = new Map<string, { clicks: number; visitors: Set<string> }>();
  const cards = new Map<string, { section: string; card: string; target: string | null; path: string; clicks: number; visitors: Set<string> }>();
  for (const click of clicks) {
    const section = click.topic || "General";
    const s = sections.get(section) ?? { clicks: 0, visitors: new Set<string>() };
    s.clicks++; s.visitors.add(click.visitor_id); sections.set(section, s);
    const key = `${click.path}\u0000${section}\u0000${click.option}`;
    const c = cards.get(key) ?? { section, card: click.option, target: click.target_path ?? null, path: click.path, clicks: 0, visitors: new Set<string>() };
    c.clicks++; c.visitors.add(click.visitor_id); cards.set(key, c);
  }

  const byVisitor = new Map<string, HourVisit[]>(), byUser = new Map<string, HourVisit[]>(), byPath = new Map<string, HourVisit[]>();
  for (const row of items) {
    byVisitor.set(row.visitor_id, [...(byVisitor.get(row.visitor_id) ?? []), row]);
    if (row.user_id) byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row]);
    byPath.set(row.path, [...(byPath.get(row.path) ?? []), row]);
  }
  const clicksBy = (match: (click: HourClick) => boolean) => clicks.filter(match).length;
  const visitors = [...byVisitor].map(([id, list]) => {
    const newest = [...list].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)), latest = newest[0];
    // Location and device from the newest view that has them (a view can arrive without geo or user-agent data).
    const placed = newest.find(row => row.city || row.country), device = newest.find(row => row.device || row.browser);
    return { visitor: id.slice(0, 8), email: list.find(row => row.email)?.email ?? null, signedIn: list.some(row => row.user_id), newVisitor: list.some(row => row.new_visitor),
      place: placed ? [placed.city, placed.country].filter(Boolean).join(", ") : null, device: device ? [device.device, device.browser].filter(Boolean).join(" · ") : null,
      views: list.length, routes: new Set(list.map(row => row.path)).size, clicks: clicksBy(click => click.visitor_id === id), lastPath: latest.path,
      ...span(list.map(row => Date.parse(row.created_at))) };
  }).sort((a, b) => b.views - a.views || b.last.localeCompare(a.last)).slice(0, LIST);
  const users = [...byUser].map(([id, list]) => {
    const paths = new Map<string, number>(); list.forEach(row => paths.set(row.path, (paths.get(row.path) ?? 0) + 1));
    return { user: id.slice(0, 8), email: list.find(row => row.email)?.email ?? null, views: list.length, routes: paths.size,
      topRoute: [...paths].sort((a, b) => b[1] - a[1])[0][0], clicks: clicksBy(click => click.user_id === id),
      sessions: new Set(list.map(row => row.session_id)).size, ...span(list.map(row => Date.parse(row.created_at))) };
  }).sort((a, b) => b.views - a.views || b.last.localeCompare(a.last)).slice(0, LIST);
  const routes = [...byPath].map(([path, list]) => ({ path, title: list.find(row => row.title)?.title ?? null, views: list.length,
    visitors: new Set(list.map(row => row.visitor_id)).size, signedIn: new Set(list.map(row => row.user_id).filter(Boolean)).size,
    clicks: clicksBy(click => click.path === path), ...span(list.map(row => Date.parse(row.created_at))) }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path)).slice(0, LIST);

  return {
    journeys,
    clicks: clicks.length,
    sections: [...sections].map(([section, s]) => ({ section, clicks: s.clicks, visitors: s.visitors.size })).sort((a, b) => b.clicks - a.clicks).slice(0, LIST),
    cards: [...cards.values()].map(({ visitors: seen, ...c }) => ({ ...c, visitors: seen.size })).sort((a, b) => b.clicks - a.clicks).slice(0, LIST),
    visitors, users, routes,
  };
}
export type ActivityHours = ReturnType<typeof activityHours> & { generatedAt: string; capped: boolean };
export type HourDetails = ActivityHours["hours"][number]["details"];
