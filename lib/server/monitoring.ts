import "server-only";
import { db } from "./db";
type Event = { kind: string; action: string; actor_id?: string | null; resource?: string; status?: number; duration_ms?: number; bytes?: number; details?: Record<string, unknown> };
export async function recordEvent(event: Event) {
  try {
    const { error } = await db().from("monitor_events").insert(event);
    if (error) console.error("monitoring_write_failed", error.code);
  } catch { console.error("monitoring_unavailable"); }
}
