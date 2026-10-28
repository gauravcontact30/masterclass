import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { dayBounds, reportDay } from "@/lib/daily-social";
import { activityHours, type HourClick, type HourVisit } from "@/lib/activity-hours";
import { isAudience, SIGNAL_COLUMNS, type VisitSignals } from "@/lib/visit-quality";

const LIMIT = 20_000;

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const date = new URL(request.url).searchParams.get("date") || reportDay();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > reportDay()) throw new HttpError(400, "invalid_date");
    const { since, until } = dayBounds(date);
    async function readVisits() {
      const visits: HourVisit[] = [];
      for (let offset = 0; offset < LIMIT; offset += 1000) {
        const { data, error } = await db().from("site_visits")
          .select(`id,created_at,visitor_id,session_id,user_id,path,title,new_visitor,city,country,device,browser,${SIGNAL_COLUMNS}`)
          .eq("event", "page_view").eq("is_bot", false)
          .gte("created_at", since).lt("created_at", until)
          .order("created_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
        if (error) adminError(error);
        // Automated browsers and the site's own machines are not visitors (lib/visit-quality.ts); their signals stay here.
        for (const row of (data ?? []) as (HourVisit & VisitSignals)[]) {
          if (!isAudience(row)) continue;
          const visit: Partial<VisitSignals> & HourVisit = { ...row };
          delete visit.screen; delete visit.language; delete visit.timezone; delete visit.ip_masked;
          visits.push(visit);
        }
        if (!data || data.length < 1000) return { visits, capped: false };
      }
      return { visits, capped: true };
    }
    // Clicks on sections and cards (components/visit-tracker.tsx); only UI labels and paths are ever recorded.
    async function readClicks() {
      const clicks: HourClick[] = [];
      for (let offset = 0; offset < LIMIT; offset += 1000) {
        const { data, error } = await db().from("monitor_events").select("id,created_at,actor_id,resource,details").eq("kind", "site_interaction")
          .gte("created_at", since).lt("created_at", until).order("created_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
        if (error) adminError(error);
        for (const row of data ?? []) {
          const detail = (row.details || {}) as Record<string, unknown>;
          if (typeof detail.visitor_id !== "string" || typeof detail.option !== "string") continue;
          clicks.push({ created_at: String(row.created_at), visitor_id: detail.visitor_id, user_id: typeof row.actor_id === "string" ? row.actor_id : null, path: String(row.resource || "/"),
            topic: typeof detail.topic === "string" ? detail.topic : null, option: detail.option, target_path: typeof detail.target_path === "string" ? detail.target_path : null });
        }
        if (!data || data.length < 1000) return { clicks, capped: false };
      }
      return { clicks, capped: true };
    }
    const [{ visits, capped }, { clicks, capped: clicksCapped }] = await Promise.all([readVisits(), readClicks()]);
    // Signed-in learners are shown by email in the hour details.
    const ids = [...new Set(visits.map(visit => visit.user_id).filter((id): id is string => !!id))];
    const emails = new Map<string, string>();
    const client = db();
    for (let offset = 0; offset < ids.length; offset += 10) {
      await Promise.all(ids.slice(offset, offset + 10).map(async id => {
        const { data, error } = await client.auth.admin.getUserById(id);
        if (error && error.status !== 404) throw error;
        if (data.user?.email) emails.set(id, data.user.email);
      }));
    }
    for (const visit of visits) visit.email = visit.user_id ? emails.get(visit.user_id) ?? null : null;
    return Response.json({ ...activityHours(visits, date, clicks), generatedAt: new Date().toISOString(), capped: capped || clicksCapped }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
