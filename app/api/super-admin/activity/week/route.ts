import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { dayBounds, reportDay } from "@/lib/daily-social";
import { siteUrl } from "@/lib/seo";
import { weekReport, type WeekLeave, type WeekView } from "@/lib/week-report";
import { isAudience, SIGNAL_COLUMNS, type VisitSignals } from "@/lib/visit-quality";

/** Rows read per day and kind; a day past it is reported as capped rather than read without end. */
const DAY_LIMIT = 20_000;
const VIEW_COLUMNS = `id,created_at,visitor_id,session_id,user_id,path,title,new_visitor,device,referrer_host,utm_source,country,${SIGNAL_COLUMNS}`;

/** The Overview's "Last 7 days" report (components/super-admin-week.tsx): this week and the one before, by IST day. */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const today = reportDay();
    const days = Array.from({ length: 14 }, (_, index) => new Date(Date.parse(`${today}T00:00:00Z`) - index * 86400_000).toISOString().slice(0, 10));
    async function read<T>(event: "page_view" | "page_leave", columns: string, day: string) {
      const { since, until } = dayBounds(day);
      const rows: T[] = [];
      for (let offset = 0; offset < DAY_LIMIT; offset += 1000) {
        const { data, error } = await db().from("site_visits").select(columns).eq("event", event).eq("is_bot", false)
          .gte("created_at", since).lt("created_at", until).order("id", { ascending: true }).range(offset, offset + 999);
        if (error) adminError(error);
        rows.push(...(data ?? []) as T[]);
        if (!data || data.length < 1000) return { rows, capped: false };
      }
      return { rows, capped: true };
    }
    // Fourteen days of views and leave beacons, each day read on its own so they load side by side.
    const [viewDays, leaveDays] = await Promise.all([
      Promise.all(days.map(day => read<WeekView & VisitSignals>("page_view", VIEW_COLUMNS, day))),
      Promise.all(days.map(day => read<WeekLeave>("page_leave", "id,created_at,session_id,path,duration_ms", day))),
    ]);
    // People only (lib/visit-quality.ts): an automated browser or the site's own machine drops its whole session,
    // leave beacons included, as the activity reports do (migration 0046).
    const dropped = new Set<string>();
    for (const day of viewDays) for (const row of day.rows) if (!isAudience(row)) dropped.add(row.session_id);
    const views: WeekView[] = viewDays.flatMap(day => day.rows).filter(row => !dropped.has(row.session_id))
      .map(({ created_at, visitor_id, session_id, user_id, path, title, new_visitor, device, referrer_host, utm_source, country }) =>
        ({ created_at, visitor_id, session_id, user_id, path, title, new_visitor, device, referrer_host, utm_source, country }));
    const people = new Set(views.map(view => view.session_id));
    const leaves = leaveDays.flatMap(day => day.rows).filter(row => people.has(row.session_id));
    const host = siteUrl().hostname.replace(/^www\./, "");
    const report = weekReport(views, leaves, today, [host, "localhost"]);
    return Response.json({ ...report, capped: [...viewDays, ...leaveDays].some(day => day.capped), generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
