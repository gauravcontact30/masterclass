export type LocationVisit = { visitor_id: string; session_id: string; user_id?: string | null; created_at: string; country?: string | null; region?: string | null; city?: string | null };
let countryNames: Intl.DisplayNames | undefined;

export function countryLabel(value: unknown): string {
  const code = typeof value === "string" ? value.trim() : "";
  if (!code) return "Not available";
  if (!/^[a-z]{2}$/i.test(code)) return code;
  try { countryNames ??= new Intl.DisplayNames(["en"], { type: "region" }); return countryNames.of(code.toUpperCase()) || code; } catch { return code; }
}

export function locationLabel(row: { city?: unknown; region?: unknown; country?: unknown }) {
  return [row.city, row.region, row.country ? countryLabel(row.country) : null].filter(Boolean).join(", ") || "Not available";
}

/** Distinct visitors are counted within each location, never by adding city totals. */
export function locationBreakdowns(visits: LocationVisit[]) {
  function group(level: "country" | "region" | "city") {
    const groups = new Map<string, { country: string; region: string; city: string; views: number; lastSeen: string; visitors: Set<string>; sessions: Set<string>; users: Set<string> }>();
    for (const row of visits) {
      const country = row.country || "";
      const region = level !== "country" ? row.region || "" : "";
      const city = level === "city" ? row.city || "" : "";
      const key = JSON.stringify([country, region, city]);
      const item = groups.get(key) || { country, region, city, views: 0, lastSeen: row.created_at, visitors: new Set<string>(), sessions: new Set<string>(), users: new Set<string>() };
      item.views++;
      item.visitors.add(row.visitor_id);
      item.sessions.add(`${row.visitor_id}:${row.session_id}`);
      if (row.user_id) item.users.add(row.user_id);
      if (Date.parse(row.created_at) > Date.parse(item.lastSeen)) item.lastSeen = row.created_at;
      groups.set(key, item);
    }
    return [...groups.values()].map(row => ({ country: countryLabel(row.country), countryCode: row.country || "Not available", region: row.region || "Not available", city: row.city || "Not available", views: row.views, visitors: row.visitors.size, sessions: row.sessions.size, signedIn: row.users.size, lastSeen: row.lastSeen })).sort((a,b) => b.visitors-a.visitors || b.views-a.views);
  }
  return { countries: group("country"), regions: group("region"), cities: group("city"), locatedViews: visits.filter(row => row.country || row.region || row.city).length, views: visits.length };
}
export type LocationReport = ReturnType<typeof locationBreakdowns> & { days: number; generatedAt: string; capped: boolean };
