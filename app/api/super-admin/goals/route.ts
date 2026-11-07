import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";

/** The Overview's Goals panel: custom goals (lib/goals.ts, table site_goals from migration 0053) over the last 7 days. */
const DAYS = 7, CAP = 20_000;
const istDay = (ms: number) => new Date(ms + 19_800_000).toISOString().slice(0, 10);

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
    const result = await db().from("site_goals").select("name, created_at, visitor_id, user_id, path, params").gte("created_at", since).order("created_at", { ascending: false }).limit(CAP);
    if (result.error) {
      if (result.error.code === "42P01" || result.error.code === "PGRST205") throw new HttpError(503, "migration_required");
      throw new HttpError(500, "service_error");
    }
    const rows = result.data ?? [];
    const today = istDay(Date.now());
    const days = Array.from({ length: DAYS }, (_, i) => istDay(Date.now() - (DAYS - 1 - i) * 86_400_000));
    const byName = new Map<string, { total: number; today: number; people: Set<string>; daily: number[] }>();
    for (const row of rows) {
      const entry = byName.get(row.name) ?? { total: 0, today: 0, people: new Set<string>(), daily: days.map(() => 0) };
      const day = istDay(Date.parse(row.created_at));
      entry.total++;
      if (day === today) entry.today++;
      const slot = days.indexOf(day);
      if (slot >= 0) entry.daily[slot]++;
      const who = row.user_id ?? row.visitor_id;
      if (who) entry.people.add(who);
      byName.set(row.name, entry);
    }
    return Response.json({
      days, capped: rows.length >= CAP, generatedAt: new Date().toISOString(),
      goals: [...byName].map(([name, e]) => ({ name, total: e.total, today: e.today, people: e.people.size, daily: e.daily })).sort((a, b) => b.total - a.total),
      recent: rows.slice(0, 8).map(row => ({ name: row.name, at: row.created_at, path: row.path, params: row.params, signedIn: Boolean(row.user_id) })),
    }, { headers: { "Cache-Control": "no-store" } });
  }, request);
}
