/** Read-only by default. --repair fills only missing tracks for the week of --date=YYYY-MM-DD (this week by default). */
import { db } from "../lib/server/db";
import { DAILY_TRACKS, dailyDateTag, dailyTrackTag } from "../lib/tech-buzz-sections";
import { istWeek, weekOfDate, weekStartDate } from "../lib/ist-week";

async function main() {
  const asked = process.argv.find(value => value.startsWith("--date="))?.slice(7);
  if (asked && (!/^\d{4}-\d{2}-\d{2}$/.test(asked) || new Date(`${asked}T00:00:00Z`).toISOString().slice(0, 10) !== asked)) throw new Error("Invalid edition date");
  // Weekly editions are dated by their Monday.
  const date = asked ? weekOfDate(asked) : weekStartDate(istWeek());
  const result = await db().from("tech_buzz_articles").select("slug,status,tags,published_at").contains("tags", [dailyDateTag(date)]);
  if (result.error) throw new Error(`Edition lookup failed: ${result.error.code}`);
  console.log(JSON.stringify({ date, configuration: {
    gateway: Boolean(process.env.AI_GATEWAY_API_KEY), cron: Boolean(process.env.CRON_SECRET),
    inngest: Boolean(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY),
  }, tracks: DAILY_TRACKS.map(track => ({ track: track.id, articles: result.data.filter(row => row.tags.includes(dailyTrackTag(track.id))) })) }, null, 2));
  if (process.argv.includes("--repair")) {
    const { generateTechBuzzDaily, SCRIPT_BUDGET } = await import("../lib/server/tech-buzz-daily");
    // No route limit here: the draft gets the script's time and the model's own thinking.
    const run = await generateTechBuzzDaily(date, SCRIPT_BUDGET);
    console.log(JSON.stringify(run, null, 2));
    if (run.failed.length) process.exitCode = 1;
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Daily edition check failed"); process.exitCode = 1; });
