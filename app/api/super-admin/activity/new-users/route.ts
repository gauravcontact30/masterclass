import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { newUserLocations, type NewUser, type UserVisit } from "@/lib/new-user-locations";

/** Accounts created in the window (newest 500), where each one was first seen and how much they have used the site
 *  since (time per day from the leave beacons), for the new-user location cards. */
const USERS = 500;
const BASE = "user_id,visitor_id,created_at,event,session_id,path,duration_ms,device,browser,os,referrer_host,country,region,city";
/** PostgREST returns at most 1,000 rows per request, so each chunk of users is read a page at a time. */
const PAGE = 1000, MAX_PAGES = 20;
const CHUNK = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const requested = Number(new URL(request.url).searchParams.get("days"));
    const days = [1, 7, 30, 90].includes(requested) ? requested : 7;
    const generatedAt = new Date().toISOString();
    const since = new Date(Date.parse(generatedAt) - days * 86400000).toISOString();
    const profiles = await db().from("profiles").select("id,name,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(USERS);
    if (profiles.error) adminError(profiles.error);
    const users = (profiles.data ?? []) as NewUser[];
    // profiles.id is text but site_visits.user_id is uuid: one seeded id such as "student-user" fails the whole query
    // with 22P02. Such accounts cannot have visits, so only real UUIDs are looked up (in chunks, to keep URLs short).
    const ids = users.map(user => user.id).filter(id => UUID.test(id));
    const visits: UserVisit[] = [];
    let coordinates = true;
    for (let start = 0; start < ids.length; start += CHUNK) {
      const chunk = ids.slice(start, start + CHUNK);
      // Views give location, sessions and pages; leave beacons carry the time spent on each page.
      const read = (columns: string, page: number) => db().from("site_visits").select(columns).in("user_id", chunk).in("event", ["page_view", "page_leave"]).eq("is_bot", false)
        .gte("created_at", since).order("created_at", { ascending: true }).order("id", { ascending: true }).range(page * PAGE, page * PAGE + PAGE - 1);
      for (let page = 0; page < MAX_PAGES; page++) {
        let result = await read(coordinates ? `${BASE},postal_code,latitude,longitude` : BASE, page);
        // Before migration 0030 there are no postal code or coordinate columns; report without them.
        if (result.error && coordinates && (result.error.code === "42703" || result.error.code === "PGRST204" || /column/i.test(result.error.message))) { coordinates = false; result = await read(BASE, page); }
        if (result.error) adminError(result.error);
        const rows = (result.data ?? []) as unknown as UserVisit[];
        visits.push(...rows);
        if (rows.length < PAGE) break;
      }
    }
    if (coordinates) visits.push(...await signedOutVisits(visits, since));
    return Response.json({ ...newUserLocations(users, visits), days, generatedAt, coordinates }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}

/**
 * Most people browse signed out before creating an account, from the same browser (visitor_id). Those earlier page
 * views often carry a more precise IP location (a locality PIN) than the visits after sign-up, so they are read too,
 * from a week before the window, and credited to the account for location only (never for time or sessions).
 */
async function signedOutVisits(visits: UserVisit[], since: string): Promise<UserVisit[]> {
  const owner = new Map<string, string>();
  for (const visit of visits) if (visit.visitor_id && !owner.has(visit.visitor_id)) owner.set(visit.visitor_id, visit.user_id);
  const browsers = [...owner.keys()];
  const from = new Date(Date.parse(since) - 7 * 86400000).toISOString();
  const chunks = Array.from({ length: Math.ceil(browsers.length / CHUNK) }, (_, i) => browsers.slice(i * CHUNK, i * CHUNK + CHUNK));
  const results = await Promise.all(chunks.map(chunk => db().from("site_visits").select("visitor_id,created_at,country,region,city,postal_code,latitude,longitude")
    .in("visitor_id", chunk).is("user_id", null).eq("event", "page_view").eq("is_bot", false).gte("created_at", from).not("postal_code", "is", null).limit(PAGE)));
  return results.flatMap(result => {
    if (result.error) return []; // Location enrichment is best effort; the report stands without it.
    return (result.data ?? []).map(row => ({ ...row, user_id: owner.get(row.visitor_id as string)!, event: "page_view", inherited: true }) as UserVisit);
  });
}
