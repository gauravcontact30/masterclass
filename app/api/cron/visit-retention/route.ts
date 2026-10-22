import { cronAuthorized, pruneVisits } from "@/lib/server/visit-retention";

/*
 * Retention for visit tracking: permanently deletes site_visits rows older than VISIT_RETENTION_DAYS. The daily
 * landing job (app/api/cron/landing-daily) runs it every night; this route runs it on its own. Needs the cron secret.
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
