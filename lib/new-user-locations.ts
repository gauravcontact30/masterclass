import { countryLabel } from "./visitor-location";
import { nearbyCity, stateLabel } from "./nearby-city";

/*
 * Where each new application user was when they first used the site, for the Super Admin Overview and User
 * activities pages: country, state, city, postal (PIN) area and the nearest major city, all from the hosting
 * platform's IP geolocation. A village is never inferred: IP data does not resolve that finely.
 */
export type NewUser = { id: string; name: string | null; created_at: string };
export type UserVisit = { user_id: string; created_at: string; country?: string | null; region?: string | null; city?: string | null; postal_code?: string | null; latitude?: number | null; longitude?: number | null };
export type NewUserLocation = {
  id: string; name: string; joinedAt: string; firstSeenAt: string | null;
  country: string | null; countryCode: string | null; state: string | null; city: string | null; postalCode: string | null;
  nearby: { name: string; region: string; country: string; km: number } | null;
};
export type Tally = { name: string; count: number };
export type NewUserLocationReport = {
  days: number; generatedAt: string; coordinates: boolean;
  total: number; located: number; users: NewUserLocation[];
  countries: Tally[]; states: Tally[]; cities: Tally[]; postalAreas: Tally[]; nearby: Tally[];
};

const located = (v: UserVisit) => Boolean(v.country || v.region || v.city);
const tally = (values: (string | null)[]) => [...values.reduce((m, v) => v ? m.set(v, (m.get(v) ?? 0) + 1) : m, new Map<string, number>())]
  .map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

/** Each new user's first located visit (or their first visit at all), newest users first. */
export function newUserLocations(users: NewUser[], visits: UserVisit[]) {
  const first = new Map<string, UserVisit>();
  for (const visit of [...visits].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const held = first.get(visit.user_id);
    if (!held || (!located(held) && located(visit))) first.set(visit.user_id, visit);
  }
  const rows: NewUserLocation[] = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(user => {
    const v = first.get(user.id);
    const code = v?.country || null;
    return {
      id: user.id, name: user.name?.trim() || "Unnamed learner", joinedAt: user.created_at, firstSeenAt: v?.created_at ?? null,
      country: code ? countryLabel(code) : null, countryCode: code, state: stateLabel(v?.region, code), city: v?.city || null, postalCode: v?.postal_code || null,
      nearby: nearbyCity(v?.latitude, v?.longitude, v?.city),
    };
  });
  return {
    total: rows.length, located: rows.filter(r => r.country || r.state || r.city).length, users: rows,
    countries: tally(rows.map(r => r.country)), states: tally(rows.map(r => r.state && `${r.state}${r.country ? `, ${r.country}` : ""}`)),
    cities: tally(rows.map(r => r.city && [r.city, r.state].filter(Boolean).join(", "))), postalAreas: tally(rows.map(r => r.postalCode && [r.postalCode, r.city].filter(Boolean).join(" · "))),
    nearby: tally(rows.map(r => r.nearby?.name ?? null)),
  };
}
