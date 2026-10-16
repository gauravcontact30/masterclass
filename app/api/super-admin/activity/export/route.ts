import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { recordEvent } from "@/lib/server/monitoring";

const COLUMNS = ["created_at", "event", "user_id", "visitor_id", "session_id", "new_visitor", "path", "title", "referrer_host", "utm_source", "utm_medium", "utm_campaign",
  "country", "region", "city", "ip_masked", "browser", "os", "device", "is_bot", "language", "timezone", "screen", "duration_ms"] as const;

/** One CSV cell; a value a spreadsheet would run as a formula is prefixed with an apostrophe. */
function cell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** The window's visit log as CSV (up to 20,000 rows, newest first). The export itself is recorded as an admin event. */
export async function GET(request: Request) {
  return api(async () => {
    const admin = await requireSuperAdmin();
    const days = Number(new URL(request.url).searchParams.get("days"));
    const window = [1, 7, 30, 90].includes(days) ? days : 7;
    const since = new Date(Date.now() - window * 86_400_000).toISOString();
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; from < 20_000; from += 1000) {
      const { data, error } = await db().from("site_visits").select(COLUMNS.join(",")).gte("created_at", since).order("created_at", { ascending: false }).range(from, from + 999);
      if (error) adminError(error);
      rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
      if (!data || data.length < 1000) break;
    }
    await recordEvent({ kind: "export", action: "user_activity_csv", actor_id: admin.id, resource: "site_visits", details: { days: window, rows: rows.length } });
    const csv = [COLUMNS.join(","), ...rows.map(row => COLUMNS.map(column => cell(row[column])).join(","))].join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="user-activity-${window}d-${new Date().toISOString().slice(0, 10)}.csv"` } });
  }, request);
}
