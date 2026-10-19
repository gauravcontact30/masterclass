import { dayBounds } from "./daily-social";

export type HourVisit = { created_at: string; visitor_id: string; session_id: string; user_id: string | null; path: string };
export function activityHours(visits: HourVisit[], date: string) {
  const { since, until } = dayBounds(date);
  const start = Date.parse(since), end = Date.parse(until);
  const rows = visits.filter(row => { const timestamp = Date.parse(row.created_at); return timestamp >= start && timestamp < end; });
  const unique = (items: HourVisit[], key: "visitor_id" | "user_id") => new Set(items.map(row => row[key]).filter(Boolean)).size;
  const sessions = (items: HourVisit[]) => new Set(items.map(row => `${row.visitor_id}:${row.session_id}`)).size;
  const hours = Array.from({ length: 24 }, (_, hour) => {
    const items = rows.filter(row => new Date(Date.parse(row.created_at) + 19800_000).getUTCHours() === hour);
    const paths = new Map<string, number>();
    items.forEach(row => paths.set(row.path, (paths.get(row.path) || 0) + 1));
    const timestamps = items.map(row => Date.parse(row.created_at));
    return { hour, views: items.length, visitors: unique(items, "visitor_id"), signedIn: unique(items, "user_id"), sessions: sessions(items),
      routes: paths.size,
      firstSeen: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null,
      lastSeen: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
      pages: [...paths].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views || a.path.localeCompare(b.path)).slice(0, 5) };
  });
  return { date, hours, totals: { views: rows.length, visitors: unique(rows, "visitor_id"), signedIn: unique(rows, "user_id"), sessions: sessions(rows) } };
}
export type ActivityHours = ReturnType<typeof activityHours> & { generatedAt: string; capped: boolean };
