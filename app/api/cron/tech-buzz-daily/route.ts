import { generateTechBuzzDaily } from "@/lib/server/tech-buzz-daily";
import { cronAuthorized } from "@/lib/server/visit-retention";
import { istDate } from "@/lib/tech-buzz-sections";

// Five stories written and ten pictures painted in parallel take two to four minutes.
export const maxDuration = 300;

/*
 * The daily Tech Buzz edition (vercel.json, 23:30 UTC = 5:00 AM IST): five new stories, one per track in
 * lib/tech-buzz-sections.ts, each with a thumbnail and a blog image. Re-running the same IST day only writes the
 * tracks still missing, so the 05:00 UTC (10:30 IST) `?retry=1` entry only fills tracks that failed or timed out at
 * dawn. `?date=YYYY-MM-DD` writes another day. Needs the cron secret.
 */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response(null, { status: 401 });
  const asked = new URL(request.url).searchParams.get("date");
  const date = asked && /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : istDate();
  try {
    const run = await generateTechBuzzDaily(date);
    return Response.json(run, { status: run.failed.length && !run.written.length ? 500 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("tech_buzz_daily_failed", String(error).slice(0, 300));
    return Response.json({ date, error: "generation_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
