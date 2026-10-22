import { countryLabel } from "./visitor-location";
import { nearbyCity, stateLabel } from "./nearby-city";

/*
 * Where each new application user was when they first used the site, for the Super Admin Overview and User
 * activities pages: country, state, city, postal (PIN) area and the nearest major city, all from the hosting
 * platform's IP geolocation. A village is never inferred: IP data does not resolve that finely.
 * Also how much each one has used the site since: engaged time per India-calendar day (from the page-leave
 * beacon's duration), sessions, pages, device and how they arrived.
 */
export type NewUser = { id: string; name: string | null; created_at: string };
export type UserVisit = {
  user_id: string; created_at: string; event?: string | null; session_id?: string | null; path?: string | null; duration_ms?: number | null;
  device?: string | null; browser?: string | null; os?: string | null; referrer_host?: string | null;
  country?: string | null; region?: string | null; city?: string | null; postal_code?: string | null; latitude?: number | null; longitude?: number | null;
};
/** Engaged time on one India-calendar day (YYYY-MM-DD). */
export type DayTime = { day: string; ms: number };
export type UserActivity = { totalMs: number; todayMs: number; activeDays: number; avgPerDayMs: number; sessions: number; pages: number; lastSeenAt: string | null; days: DayTime[] };
export type NewUserLocation = {
  id: string; name: string; joinedAt: string; firstSeenAt: string | null;
  country: string | null; countryCode: string | null; state: string | null; city: string | null; postalCode: string | null;
  nearby: { name: string; region: string; country: string; km: number } | null;
  device: string | null; browser: string | null; firstPage: string | null; referrer: string | null;
  activity: UserActivity;
};
/** One row of a location card: the place, how many new users, and for filtering, whether it is in India. */
export type Tally = { name: string; count: number; country?: string | null; detail?: string };
export type NewUserLocationReport = {
  days: number; generatedAt: string; coordinates: boolean;
  total: number; located: number; users: NewUserLocation[];
  countries: Tally[]; states: Tally[]; cities: Tally[]; postalAreas: Tally[]; nearby: Tally[];
  coverage: { postal: number; nearby: number };
  time: { totalMs: number; todayMs: number; activeToday: number; avgPerUserDayMs: number };
};

const isView = (v: UserVisit) => !v.event || v.event === "page_view";
const located = (v: UserVisit) => Boolean(v.country || v.region || v.city);
/** The India-calendar date of a timestamp, so a day turns over at midnight IST like the rest of the admin. */
export const istDate = (iso: string) => new Date(Date.parse(iso) + 5.5 * 3600_000).toISOString().slice(0, 10);

function tally<T>(rows: T[], key: (row: T) => string | null, extra?: (row: T) => Omit<Tally, "name" | "count">): Tally[] {
  const out = new Map<string, Tally>();
  for (const row of rows) {
    const name = key(row);
    if (!name) continue;
    const held = out.get(name);
    if (held) held.count++; else out.set(name, { name, count: 1, ...extra?.(row) });
  }
  return [...out.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Engaged time per day from the leave beacons; sessions and pages from the views. */
function activity(visits: UserVisit[], today: string): UserActivity {
  const perDay = new Map<string, number>();
  let totalMs = 0, pages = 0, lastSeenAt: string | null = null;
  const sessions = new Set<string>();
  for (const v of visits) {
    if (!lastSeenAt || v.created_at > lastSeenAt) lastSeenAt = v.created_at;
    if (isView(v)) { pages++; if (v.session_id) sessions.add(v.session_id); }
    else if (v.event === "page_leave" && v.duration_ms) {
      totalMs += v.duration_ms;
      const day = istDate(v.created_at);
      perDay.set(day, (perDay.get(day) ?? 0) + v.duration_ms);
    }
  }
  const days = [...perDay].map(([day, ms]) => ({ day, ms })).sort((a, b) => b.day.localeCompare(a.day));
  return { totalMs, todayMs: perDay.get(today) ?? 0, activeDays: days.length, avgPerDayMs: days.length ? Math.round(totalMs / days.length) : 0, sessions: sessions.size, pages, lastSeenAt, days };
}

/** Each new user's first located visit (or their first visit at all) and their use of the site, newest users first. */
export function newUserLocations(users: NewUser[], visits: UserVisit[], now = Date.now()) {
  const today = istDate(new Date(now).toISOString());
  const sorted = [...visits].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const place = new Map<string, UserVisit>(), first = new Map<string, UserVisit>(), byUser = new Map<string, UserVisit[]>();
  for (const visit of sorted) {
    byUser.set(visit.user_id, [...(byUser.get(visit.user_id) ?? []), visit]);
    if (!isView(visit)) continue;
    if (!first.has(visit.user_id)) first.set(visit.user_id, visit);
    const held = place.get(visit.user_id);
    if (!held || (!located(held) && located(visit))) place.set(visit.user_id, visit);
  }
  const rows: NewUserLocation[] = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(user => {
    const v = place.get(user.id), entry = first.get(user.id);
    const code = v?.country || null;
    return {
      id: user.id, name: user.name?.trim() || "Unnamed learner", joinedAt: user.created_at, firstSeenAt: entry?.created_at ?? null,
      country: code ? countryLabel(code) : null, countryCode: code, state: stateLabel(v?.region, code), city: v?.city || null, postalCode: v?.postal_code || null,
      nearby: nearbyCity(v?.latitude, v?.longitude, v?.city),
      device: entry?.device || null, browser: [entry?.browser, entry?.os].filter(Boolean).join(" · ") || null, firstPage: entry?.path || null, referrer: entry?.referrer_host || null,
      activity: activity(byUser.get(user.id) ?? [], today),
    };
  });
  const inCountry = (r: NewUserLocation) => ({ country: r.countryCode });
  const nearby = tally(rows.filter(r => r.nearby), r => r.nearby!.name, r => ({ country: r.nearby!.country }));
  for (const row of nearby) {
    const near = rows.filter(r => r.nearby?.name === row.name).map(r => r.nearby!);
    row.detail = `${near[0].region} · avg ${Math.round(near.reduce((sum, n) => sum + n.km, 0) / near.length)} km`;
  }
  const active = rows.filter(r => r.activity.activeDays);
  return {
    total: rows.length, located: rows.filter(r => r.country || r.state || r.city).length, users: rows,
    countries: tally(rows, r => r.country, inCountry),
    states: tally(rows, r => r.state && `${r.state}${r.country ? `, ${r.country}` : ""}`, inCountry),
    cities: tally(rows, r => r.city && [r.city, r.state].filter(Boolean).join(", "), inCountry),
    postalAreas: tally(rows, r => r.postalCode && `PIN ${r.postalCode}`, r => ({ ...inCountry(r), detail: [r.city, r.state].filter(Boolean).join(", ") || undefined })),
    nearby,
    coverage: { postal: rows.filter(r => r.postalCode).length, nearby: rows.filter(r => r.nearby).length },
    time: {
      totalMs: rows.reduce((sum, r) => sum + r.activity.totalMs, 0), todayMs: rows.reduce((sum, r) => sum + r.activity.todayMs, 0),
      activeToday: rows.filter(r => r.activity.todayMs).length,
      avgPerUserDayMs: active.length ? Math.round(active.reduce((sum, r) => sum + r.activity.avgPerDayMs, 0) / active.length) : 0,
    },
  };
}
