import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";
import { isLocalAddress, looksAutomated } from "@/lib/visit-quality";

/*
 * The Overview's Live visitor stream: every page view and leave beacon of the last VISIT_RETENTION_DAYS days (bots
 * excluded), newest first, plus the page heartbeats (site_presence, migration 0034) that say who is reading now.
 * Older rows are deleted daily by app/api/cron/visit-retention, so this window is everything the table still holds.
 * `?since=<ISO time>` returns only rows from that moment on: the panel loads the window once, then asks every 15 s
 * for what is new instead of downloading five days again. Visitor-to-account linking happens in the browser
 * (lib/live-visits.ts), because an incremental read does not see a visitor's older rows.
 */
const LIMIT = 20_000, PAGE = 1000;
/** Read only to judge a row (lib/visit-quality.ts); never sent to the browser. */
const PRIVATE = new Set(["timezone", "language", "ip_masked"]);
const BASE_COLUMNS = "id,created_at,event,visitor_id,session_id,user_id,new_visitor,path,title,referrer_host,utm_source,country,region,city,postal_code,device,browser,os,duration_ms,screen,timezone,language,ip_masked,ip_hash";
/** private_mode arrives with migration 0048; until then the stream reads without it and private windows show as "likely" only. */
const COLUMNS = `${BASE_COLUMNS},private_mode`;

// Account emails change rarely; one lookup per account every ten minutes per server instance is plenty.
const emailCache = new Map<string, { email: string | null; at: number }>();
const EMAIL_TTL = 10 * 60_000;

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const windowStart = new Date(Date.now() - VISIT_RETENTION_DAYS * 86_400_000).toISOString();
    const asked = new URL(request.url).searchParams.get("since");
    if (asked && !Number.isFinite(Date.parse(asked))) throw new HttpError(400, "invalid_since");
    const since = asked && Date.parse(asked) > Date.parse(windowStart) ? new Date(asked).toISOString() : windowStart;

    const client = db();
    let columns = COLUMNS;
    const page = (offset: number, count = false) => client.from("site_visits").select(columns, count ? { count: "exact" } : undefined)
      .eq("is_bot", false).in("event", ["page_view", "page_leave"]).gte("created_at", since)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + PAGE - 1);
    // The first page also says how many rows there are; the rest are read four at a time instead of one by one.
    const [first, presence] = await Promise.all([page(0, true), readPresence(since)]);
    let head = first;
    if (head.error?.code === "42703") { columns = BASE_COLUMNS; head = await page(0, true); }
    if (head.error) adminError(head.error);
    const rows: Record<string, unknown>[] = [...(head.data ?? []) as unknown as Record<string, unknown>[]];
    const total = Math.min(head.count ?? rows.length, LIMIT);
    for (let offset = PAGE; offset < total; offset += PAGE * 4) {
      const batch = await Promise.all([0, 1, 2, 3].map(i => offset + i * PAGE).filter(start => start < total).map(start => page(start)));
      for (const result of batch) { if (result.error) adminError(result.error); rows.push(...(result.data ?? []) as unknown as Record<string, unknown>[]); }
    }

    // Rows recorded before /api/track learned to spot them (lib/visit-quality.ts): headless data-centre browsers, judged
    // by their page view and dropped with the rest of their session, and the development server's own beacons.
    const automated = new Set(rows.filter(row => row.event === "page_view" && looksAutomated(row as Parameters<typeof looksAutomated>[0])).map(row => String(row.session_id)));
    const genuine = rows.filter(row => !automated.has(String(row.session_id)) && (process.env.TRACK_LOCAL === "1" || process.env.NODE_ENV !== "production" || !isLocalAddress(row.ip_masked as string | null)))
      // The signals stay on the server; the panel only needs the screen and the keyed network hash to join a visitor whose
      // in-app browser dropped its cookie.
      .map(row => Object.fromEntries(Object.entries(row).filter(([key]) => !PRIVATE.has(key))));
    const ids = [...new Set(genuine.map(row => row.user_id).filter((id): id is string => typeof id === "string"))];
    const now = Date.now(), missing = ids.filter(id => (emailCache.get(id)?.at ?? 0) < now - EMAIL_TTL);
    for (let offset = 0; offset < missing.length; offset += 10) {
      await Promise.all(missing.slice(offset, offset + 10).map(async id => {
        const { data, error } = await client.auth.admin.getUserById(id);
        if (error && error.status !== 404) throw error;
        emailCache.set(id, { email: data.user?.email ?? null, at: now });
      }));
    }
    if (emailCache.size > 5000) emailCache.clear();
    const emails = Object.fromEntries(ids.flatMap(id => { const email = emailCache.get(id)?.email; return email ? [[id, email]] : []; }));
    const visits = genuine.map(row => ({ ...row, email: typeof row.user_id === "string" ? emails[row.user_id] ?? null : null }));
    return Response.json({ days: VISIT_RETENTION_DAYS, since, incremental: Boolean(asked), visits, emails, presence, hidden: rows.length - genuine.length,
      capped: (head.count ?? 0) > LIMIT, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}

/** Heartbeats seen since `since`; null before migration 0034, so the panel keeps its older rule for open pages. */
async function readPresence(since: string) {
  const { data, error } = await db().from("site_presence").select("session_id,path,started_at,seen_at").gte("seen_at", since).order("seen_at", { ascending: false }).limit(5000);
  if (error) return null;
  return data ?? [];
}
