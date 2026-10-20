import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { newUserLocations, type NewUser, type UserVisit } from "@/lib/new-user-locations";

/** Accounts created in the window (newest 500) and where each one was first seen, for the new-user location cards. */
const USERS = 500;
const BASE = "user_id,created_at,country,region,city";

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
    const ids = users.map(user => user.id);
    let visits: UserVisit[] = [];
    let coordinates = true;
    if (ids.length) {
      const read = (columns: string) => db().from("site_visits").select(columns).in("user_id", ids).eq("event", "page_view").eq("is_bot", false)
        .gte("created_at", since).order("created_at", { ascending: true }).limit(5000);
      let result = await read(`${BASE},postal_code,latitude,longitude`);
      // Before migration 0030 there are no postal code or coordinate columns; report without them.
      if (result.error && (result.error.code === "42703" || result.error.code === "PGRST204" || /column/i.test(result.error.message))) { coordinates = false; result = await read(BASE); }
      if (result.error) adminError(result.error);
      visits = (result.data ?? []) as unknown as UserVisit[];
    }
    return Response.json({ ...newUserLocations(users, visits), days, generatedAt, coordinates }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
