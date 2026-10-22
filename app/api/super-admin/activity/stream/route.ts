import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";

/*
 * The Overview's Live visitor stream: every page view and leave beacon of the last VISIT_RETENTION_DAYS days (bots
 * excluded), newest first, in the shape the stream reads. Older rows are deleted daily by
 * app/api/cron/visit-retention, so this window is everything the table still holds.
 */
const LIMIT = 10_000;

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const since = new Date(Date.now() - VISIT_RETENTION_DAYS * 86_400_000).toISOString();
    const rows: Record<string, unknown>[] = [];
    let capped = true;
    for (let offset = 0; offset < LIMIT; offset += 1000) {
      const { data, error } = await db().from("site_visits")
        .select("id,created_at,event,visitor_id,session_id,user_id,new_visitor,path,title,referrer_host,country,region,city,device,browser,os,duration_ms")
        .eq("is_bot", false).gte("created_at", since)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
      if (error) adminError(error);
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) { capped = false; break; }
    }
    // A signed-in visitor shows by email; one browser's visits before and after signing in stay one person.
    const ids = [...new Set(rows.map(row => row.user_id).filter((id): id is string => typeof id === "string"))];
    const emails = new Map<string, string>();
    const client = db();
    for (let offset = 0; offset < ids.length; offset += 10) {
      await Promise.all(ids.slice(offset, offset + 10).map(async id => {
        const { data, error } = await client.auth.admin.getUserById(id);
        if (error && error.status !== 404) throw error;
        if (data.user?.email) emails.set(id, data.user.email);
      }));
    }
    const linked = new Map<string, string>();
    for (const row of rows) if (typeof row.user_id === "string" && !linked.has(String(row.visitor_id))) linked.set(String(row.visitor_id), row.user_id);
    const visits = rows.map(row => {
      const user = typeof row.user_id === "string" ? row.user_id : linked.get(String(row.visitor_id)) ?? null;
      return { ...row, person: user ?? `visitor:${row.visitor_id}`, email: user ? emails.get(user) ?? null : null };
    });
    return Response.json({ days: VISIT_RETENTION_DAYS, since, visits, capped, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
