import { refreshNews } from "@/lib/server/landing-news";
import { cronAuthorized } from "@/lib/server/visit-retention";

// Ten searches and up to ten pictures; covers past the time budget are painted on the next night's run.
export const maxDuration = 300;

/*
 * The "Fresh in tech" refresh (vercel.json, weekly on Monday at 00:00 IST; nightly until 2026-10-31): does nothing
 * until the stories are 21 days old, then searches all ten slides again and paints each a new cover; covers past the
 * time budget are painted the next week. `?force=1` refreshes now. Needs the cron secret.
 */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response(null, { status: 401 });
  const result = await refreshNews({ force: new URL(request.url).searchParams.get("force") === "1", budgetMs: 220_000 });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
