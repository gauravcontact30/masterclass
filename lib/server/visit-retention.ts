import "server-only";
import { db } from "./db";
import { equalSecret } from "./secrets";
import { pruneZeroEngagement } from "./zero-engagement";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";

/** Permanently deletes site_visits rows older than VISIT_RETENTION_DAYS; a missing table (before migration 0023) is not an error. */
export async function pruneVisits(now = Date.now()) {
  const cutoff = new Date(now - VISIT_RETENTION_DAYS * 86_400_000).toISOString();
  const { count, error } = await db().from("site_visits").delete({ count: "exact" }).lt("created_at", cutoff);
  if (error && error.code !== "42P01" && error.code !== "PGRST205") return { ok: false as const, cutoff, error: error.code as string };
  // Page heartbeats (migration 0034) follow the same window; a missing table is fine.
  await db().from("site_presence").delete().lt("seen_at", cutoff);
  // Frontend vitals and script errors (components/client-monitor.tsx) are kept 30 days; prune_monitoring predates them.
  await db().from("monitor_events").delete().in("kind", ["web_vitals", "client_error"]).lt("created_at", new Date(now - 30 * 86_400_000).toISOString());
  // Finished sessions with 0 seconds of engaged time never count as visitors (lib/server/zero-engagement.ts).
  const zero = await pruneZeroEngagement(now).catch(() => ({ ok: false, sessions: 0 }));
  return { ok: true as const, cutoff, deleted: count ?? 0, zeroEngagementSessions: zero.sessions };
}

/** Vercel Cron calls with `Authorization: Bearer $CRON_SECRET`; without the secret set, every call is refused. */
export const cronAuthorized = (request: Request) => {
  const secret = process.env.CRON_SECRET;
  // Constant-time, so response timing does not leak how much of a guessed secret matched.
  return Boolean(secret) && equalSecret(request.headers.get("authorization") ?? "", `Bearer ${secret}`);
};
