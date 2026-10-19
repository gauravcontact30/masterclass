import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { locationBreakdowns, type LocationVisit } from "@/lib/visitor-location";

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const requested = Number(new URL(request.url).searchParams.get("days"));
    const days = [1, 7, 30, 90].includes(requested) ? requested : 7;
    const until = new Date().toISOString();
    const since = new Date(Date.parse(until) - days * 86400000).toISOString();
    const visits: LocationVisit[] = [];
    let capped = true;
    for (let offset = 0; offset < 20000; offset += 1000) {
      const { data, error } = await db().from("site_visits")
        .select("id,created_at,visitor_id,session_id,user_id,country,region,city")
        .eq("event", "page_view").eq("is_bot", false)
        .gte("created_at", since).lt("created_at", until)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
      if (error) adminError(error);
      visits.push(...(data ?? []) as LocationVisit[]);
      if (!data || data.length < 1000) { capped = false; break; }
    }
    return Response.json({ ...locationBreakdowns(visits), days, generatedAt: until, capped }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
