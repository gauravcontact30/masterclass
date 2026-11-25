import "server-only";
import { createHash } from "node:crypto";

/*
 * Instant updates for the Super Admin Overview through Supabase Realtime (broadcast). After /api/track has stored a
 * page view or leave beacon it sends an empty "visit" message; the Overview, subscribed to the same topic, then reads
 * the new rows at once through /api/super-admin/activity/stream (admin-only, filtered as always) instead of waiting for
 * its next 5-second read. The message carries no visitor data at all.
 *
 * The topic is derived from the service-role key, so it cannot be guessed; only /api/super-admin/activity/stream,
 * which requires a super admin, hands it out. Outsiders can neither listen for visits nor send fake ones.
 */
export function visitTopic(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return key ? `super-admin-visits-${createHash("sha256").update(`visit-signal:${key}`).digest("hex").slice(0, 32)}` : null;
}

/** Sends the "visit" signal through Supabase's REST broadcast endpoint. Never throws: the Overview still reads every 5 s. */
export async function signalVisit(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY, topic = visitTopic();
  if (!url || !key || !topic) return;
  try {
    const response = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic, event: "visit", payload: {} }] }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) console.error("visit_signal_failed", response.status);
  } catch { console.error("visit_signal_unavailable"); }
}
