import "server-only";
import { after } from "next/server";
import { db } from "./db";
type Event = { kind: string; action: string; actor_id?: string | null; resource?: string; status?: number; duration_ms?: number; bytes?: number; details?: Record<string, unknown> };
export async function recordEvent(event: Event) {
  try {
    const { error } = await db().from("monitor_events").insert(event);
    if (error) console.error("monitoring_write_failed", error.code);
  } catch { console.error("monitoring_unavailable"); }
}

/**
 * Records after the response has gone out, so monitoring never adds a database round trip to what a learner waits
 * for (the database is in Tokyo; an awaited insert added ~100–300 ms to every AI answer). Outside a request (a
 * script), the write simply runs in the background.
 */
export function recordEventLater(event: Event) {
  try { after(() => recordEvent(event)); } catch { void recordEvent(event); }
}
