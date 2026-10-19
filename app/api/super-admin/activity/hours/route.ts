import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { dayBounds, reportDay } from "@/lib/daily-social";
import { activityHours, type HourVisit } from "@/lib/activity-hours";

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const date = new URL(request.url).searchParams.get("date") || reportDay();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > reportDay()) throw new HttpError(400, "invalid_date");
    const { since, until } = dayBounds(date);
    const visits: HourVisit[] = [];
    let capped = true;
    for (let offset = 0; offset < 20_000; offset += 1000) {
      const { data, error } = await db().from("site_visits")
        .select("id,created_at,visitor_id,session_id,user_id,path")
        .eq("event", "page_view").eq("is_bot", false)
        .gte("created_at", since).lt("created_at", until)
        .order("created_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
      if (error) adminError(error);
      visits.push(...(data ?? []) as HourVisit[]);
      if (!data || data.length < 1000) { capped = false; break; }
    }
    return Response.json({ ...activityHours(visits, date), generatedAt: new Date().toISOString(), capped }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
