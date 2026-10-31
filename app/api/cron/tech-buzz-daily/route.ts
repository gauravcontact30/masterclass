import { generateTechBuzzDaily } from "@/lib/server/tech-buzz-daily";
import { cronAuthorized } from "@/lib/server/visit-retention";
import { scheduledWeek, weekOfDate, weekStartDate } from "@/lib/ist-week";

// Five stories researched, written, reviewed and painted in parallel take three to five minutes; see SAVE_BY_MS.
export const maxDuration = 300;

/*
 * The weekly Tech Buzz edition (lib/tech-buzz-sections.ts tracks; daily until 2026-10-31): five researched,
 * editor-reviewed stories, each with a thumbnail and a blog image, dated by the week's Monday. vercel.json runs it on
 * Monday at 18:30 UTC Sunday = 00:00 IST Monday, and again at 20:30 UTC = 2:00 AM IST: the Hobby plan may start a
 * cron anywhere within its hour, so the two windows never overlap, and a run that starts before midnight writes the
 * coming week (scheduledWeek). A run only writes the tracks still missing for the week, so the second run fills a
 * track that timed out or stayed below the editor's 4/5 bar, and is a no-op on a complete edition.
 * Calling it by hand (with the cron secret) does the same; `?date=YYYY-MM-DD` writes the week that date falls in.
 */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response(null, { status: 401 });
  const asked = new URL(request.url).searchParams.get("date");
  const date = asked && /^\d{4}-\d{2}-\d{2}$/.test(asked) ? weekOfDate(asked) : weekStartDate(scheduledWeek());
  try {
    const run = await generateTechBuzzDaily(date);
    return Response.json(run, { status: run.failed.length && !run.written.length ? 500 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("tech_buzz_daily_failed", String(error).slice(0, 300));
    return Response.json({ date, error: "generation_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
