import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { newUserLocations, type NewUser, type UserVisit } from "@/lib/new-user-locations";

/** Accounts created in the window (newest 500) and where each one was first seen, for the new-user location cards. */
const USERS = 500;
const BASE = "user_id,created_at,country,region,city";
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
      const read = (columns: string) => db().from("site_visits").select(columns).in("user_id", chunk).eq("event", "page_view").eq("is_bot", false)
        .gte("created_at", since).order("created_at", { ascending: true }).limit(5000);
      let result = await read(coordinates ? `${BASE},postal_code,latitude,longitude` : BASE);
      // Before migration 0030 there are no postal code or coordinate columns; report without them.
      if (result.error && coordinates && (result.error.code === "42703" || result.error.code === "PGRST204" || /column/i.test(result.error.message))) { coordinates = false; result = await read(BASE); }
      if (result.error) adminError(result.error);
      visits.push(...((result.data ?? []) as unknown as UserVisit[]));
    }
    return Response.json({ ...newUserLocations(users, visits), days, generatedAt, coordinates }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
