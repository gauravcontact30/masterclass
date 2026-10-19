import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { dailySocial, dayBounds, reportDay, type DailyEvent } from "@/lib/daily-social";

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const day = new URL(request.url).searchParams.get("date") || reportDay();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) throw new HttpError(400, "invalid_date");
    const { since, until } = dayBounds(day);
    // Include the prior 30 minutes for attribution of sessions crossing midnight.
    const lookback = new Date(Date.parse(since) - 1800_000).toISOString();
    async function read(kind: "views" | "clicks") {
      const events: DailyEvent[] = [];
      const limit = 20_000;
      for (let offset = 0; offset < limit; offset += 1000) {
        const query = kind === "views"
          ? db().from("site_visits").select("id,created_at,visitor_id,session_id,user_id,path,referrer_host,utm_source,utm_medium,utm_campaign,event,city,region,country,duration_ms").eq("is_bot", false)
          : db().from("monitor_events").select("id,created_at,actor_id,resource,details").eq("kind", "site_interaction");
        const { data, error } = await query.gte("created_at", lookback).lt("created_at", until).order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
        if (error) adminError(error);
        for (const record of data ?? []) {
          const row = record as unknown as Record<string, unknown>;
          if (kind === "views") events.push({ ...row, id: `view:${row.id}`, event: row.event || "page_view" } as DailyEvent);
          else {
            const detail = (row.details || {}) as Record<string, unknown>;
            if (typeof detail.visitor_id !== "string" || typeof detail.session_id !== "string") continue;
            const string = (key: string) => typeof detail[key] === "string" ? detail[key] as string : null;
            events.push({ id: `click:${row.id}`, event: "interaction", created_at: String(row.created_at), visitor_id: detail.visitor_id, session_id: detail.session_id, user_id: typeof row.actor_id === "string" ? row.actor_id : null, path: String(row.resource || "/"), topic: string("topic"), option: string("option"), target_path: string("target_path"), utm_source: string("utm_source"), utm_medium: string("utm_medium"), utm_campaign: string("utm_campaign"), referrer_host: string("referrer_host") });
          }
        }
        if (!data || data.length < 1000) return { events, capped: false };
      }
      return { events, capped: true };
    }
    const [views, clicks] = await Promise.all([read("views"), read("clicks")]);
    const events = [...views.events, ...clicks.events];
    const ids = [...new Set(events.map(event => event.user_id).filter((id): id is string => !!id))];
    const emails = new Map<string, string>();
    const client = db();
    for (let offset = 0; offset < ids.length; offset += 10) {
      await Promise.all(ids.slice(offset, offset + 10).map(async id => {
        const { data, error } = await client.auth.admin.getUserById(id);
        if (error && error.status !== 404) throw error;
        if (data.user?.email) emails.set(id, data.user.email);
      }));
    }
    for (const event of events) event.email = event.user_id ? emails.get(event.user_id) || null : null;
    return Response.json({ ...dailySocial(events, day), generatedAt: new Date().toISOString(), capped: views.capped || clicks.capped }, { headers: { "Cache-Control": "no-store" } });
  }, request);
}
