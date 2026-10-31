import { cronAuthorized, pruneVisits } from "@/lib/server/visit-retention";

/*
 * Retention for visit tracking: permanently deletes site_visits rows older than VISIT_RETENTION_DAYS. Its own daily
 * cron (vercel.json, 00:05 IST) since the landing job became weekly; it generates no content. Needs the cron secret.
 */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response(null, { status: 401 });
  const result = await pruneVisits();
  if (!result.ok) {
    console.error("visit_retention_failed", result.error);
    return Response.json(result, { status: 500 });
  }
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
