import "server-only";
import { db } from "./db";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";

/** Permanently deletes site_visits rows older than VISIT_RETENTION_DAYS; a missing table (before migration 0023) is not an error. */
export async function pruneVisits(now = Date.now()) {
  const cutoff = new Date(now - VISIT_RETENTION_DAYS * 86_400_000).toISOString();
  const { count, error } = await db().from("site_visits").delete({ count: "exact" }).lt("created_at", cutoff);
  if (error && error.code !== "42P01" && error.code !== "PGRST205") return { ok: false as const, cutoff, error: error.code as string };
  return { ok: true as const, cutoff, deleted: count ?? 0 };
}

/** Vercel Cron calls with `Authorization: Bearer $CRON_SECRET`; without the secret set, every call is refused. */
export const cronAuthorized = (request: Request) => {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
};
