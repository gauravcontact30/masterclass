import { generateTechBuzzDaily } from "@/lib/server/tech-buzz-daily";
import { cronAuthorized } from "@/lib/server/visit-retention";
import { istDate } from "@/lib/tech-buzz-sections";

// Five stories researched, written, reviewed and painted in parallel take three to five minutes; see SAVE_BY_MS.
export const maxDuration = 300;

/*
 * The daily Tech Buzz edition (lib/tech-buzz-sections.ts tracks): five researched, editor-reviewed stories, each with a
 * thumbnail and a blog image. vercel.json runs it at 23:30 UTC = 5:00 AM IST and again at 01:30 UTC = 7:00 AM IST: the
 * Hobby plan allows one run per cron job per day and may start it anywhere within that hour, so the two windows
 * (4:30-5:29 and 6:30-7:29 IST) never overlap. A run only writes the tracks still missing for the IST day, so the
 * second run fills a track that timed out or stayed below the editor's 4/5 bar, and is a no-op on a complete edition.
 * Calling it by hand (with the cron secret) does the same; `?date=YYYY-MM-DD` writes another day.
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
