import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { locationBreakdowns, type LocationVisit } from "@/lib/visitor-location";
import { isAudience, SIGNAL_COLUMNS, type VisitSignals } from "@/lib/visit-quality";

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
        .select(`id,created_at,visitor_id,session_id,user_id,country,region,city,device,${SIGNAL_COLUMNS}`)
        .eq("event", "page_view").eq("is_bot", false)
        .gte("created_at", since).lt("created_at", until)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
      if (error) adminError(error);
      // Automated browsers and the site's own machines are not visitors (lib/visit-quality.ts).
      for (const row of (data ?? []) as (LocationVisit & VisitSignals)[]) {
        if (isAudience(row)) visits.push({ created_at: row.created_at, visitor_id: row.visitor_id, session_id: row.session_id, user_id: row.user_id, country: row.country, region: row.region, city: row.city });
      }
      if (!data || data.length < 1000) { capped = false; break; }
    }
    return Response.json({ ...locationBreakdowns(visits), days, generatedAt: until, capped }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
