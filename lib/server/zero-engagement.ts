import "server-only";
import { db } from "./db";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";

/*
 * Visitors with 0 seconds of engaged time are not visitors (user rule 2026-10-27): no Super Admin page may count,
 * list or trace them. New ones are never recorded (lib/early-track.ts and components/visit-tracker.tsx wait for 1 s of
 * visibility), but older rows and sessions whose leave beacon was lost still read as 0 s. This deletes them at the
 * source, so the Overview, User activities, live stream, promotions, users and exports all agree without each query
 * filtering on its own.
 *
 * A session is finished once it has been idle for SESSION_IDLE_MS (the tracker's 30-minute session cookie). A finished
 * session is removed when none of its pages was seen for at least MIN_ENGAGED_MS: no leave beacon of a second or more
 * and no presence heartbeat spanning a second or more. Sessions still open are left alone, because their time on page
 * only arrives when the visitor leaves.
 */
const MIN_ENGAGED_MS = 1000;
const SESSION_IDLE_MS = 30 * 60_000;
const PAGE = 1000;
/** Super Admin requests trigger a sweep at most this often per server instance; the nightly job runs one too. */
const SWEEP_EVERY_MS = 2 * 60_000;

type VisitRow = { session_id: string | null; event: string; duration_ms: number | null; created_at: string };
type PresenceRow = { session_id: string; started_at: string; seen_at: string };

// Before migrations 0023/0034 the tables do not exist: nothing to sweep.
const missing = (code?: string) => code === "42P01" || code === "PGRST205" || code === "42703" || code === "PGRST204";

async function readAll<T>(table: string, columns: string, since: string, timeColumn: string): Promise<T[] | null> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db().from(table).select(columns).gte(timeColumn, since).order(timeColumn, { ascending: true }).range(from, from + PAGE - 1);
    if (error) { if (missing(error.code)) return rows; console.error("zero_engagement_read_failed", table, error.code); return null; }
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

/** Deletes every finished session with no engaged time. Returns how many sessions were removed. */
export async function pruneZeroEngagement(now = Date.now()): Promise<{ ok: boolean; sessions: number }> {
  const since = new Date(now - (VISIT_RETENTION_DAYS + 1) * 86_400_000).toISOString();
  const [visits, presence] = await Promise.all([
    readAll<VisitRow>("site_visits", "session_id,event,duration_ms,created_at", since, "created_at"),
    readAll<PresenceRow>("site_presence", "session_id,started_at,seen_at", since, "seen_at"),
  ]);
  if (!visits || !presence) return { ok: false, sessions: 0 };

  const sessions = new Map<string, { engaged: boolean; last: number }>();
  const touch = (id: string, at: number, engaged: boolean) => {
    const entry = sessions.get(id) ?? { engaged: false, last: 0 };
    entry.engaged ||= engaged; entry.last = Math.max(entry.last, at);
    sessions.set(id, entry);
  };
  for (const row of visits) if (row.session_id) touch(row.session_id, Date.parse(row.created_at), row.event === "page_leave" && (row.duration_ms ?? 0) >= MIN_ENGAGED_MS);
  for (const row of presence) touch(row.session_id, Date.parse(row.seen_at), Date.parse(row.seen_at) - Date.parse(row.started_at) >= MIN_ENGAGED_MS);

  const doomed = [...sessions].filter(([, entry]) => !entry.engaged && now - entry.last > SESSION_IDLE_MS).map(([id]) => id);
  for (let index = 0; index < doomed.length; index += 100) {
    const chunk = doomed.slice(index, index + 100);
    const [visitDelete, presenceDelete] = await Promise.all([
      db().from("site_visits").delete().in("session_id", chunk),
      db().from("site_presence").delete().in("session_id", chunk),
    ]);
    if (visitDelete.error && !missing(visitDelete.error.code)) { console.error("zero_engagement_delete_failed", visitDelete.error.code); return { ok: false, sessions: index }; }
    if (presenceDelete.error && !missing(presenceDelete.error.code)) console.error("zero_engagement_presence_delete_failed", presenceDelete.error.code);
  }
  return { ok: true, sessions: doomed.length };
}

let lastSweep = 0;
let sweeping: Promise<unknown> | null = null;

/** Runs a sweep before Super Admin data is read, at most every SWEEP_EVERY_MS; never fails the request. */
export async function sweepZeroEngagement() {
  if (sweeping) return sweeping.then(() => undefined, () => undefined);
  if (Date.now() - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = Date.now();
  sweeping = pruneZeroEngagement().catch(error => console.error("zero_engagement_sweep_failed", String(error).slice(0, 200))).finally(() => { sweeping = null; });
  await sweeping;
}
