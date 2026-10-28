/** Read-only by default. --repair fills only missing tracks for --date=YYYY-MM-DD (today in IST by default). */
import { db } from "../lib/server/db";
import { DAILY_TRACKS, dailyDateTag, dailyTrackTag, istDate } from "../lib/tech-buzz-sections";

async function main() {
  const date = process.argv.find(value => value.startsWith("--date="))?.slice(7) ?? istDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error("Invalid edition date");
  const result = await db().from("tech_buzz_articles").select("slug,status,tags,published_at").contains("tags", [dailyDateTag(date)]);
  if (result.error) throw new Error(`Edition lookup failed: ${result.error.code}`);
  console.log(JSON.stringify({ date, configuration: {
    gateway: Boolean(process.env.AI_GATEWAY_API_KEY), cron: Boolean(process.env.CRON_SECRET),
    inngest: Boolean(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY),
  }, tracks: DAILY_TRACKS.map(track => ({ track: track.id, articles: result.data.filter(row => row.tags.includes(dailyTrackTag(track.id))) })) }, null, 2));
  if (process.argv.includes("--repair")) {
    const { generateTechBuzzDaily } = await import("../lib/server/tech-buzz-daily");
    const run = await generateTechBuzzDaily(date);
    console.log(JSON.stringify(run, null, 2));
    if (run.failed.length) process.exitCode = 1;
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Daily edition check failed"); process.exitCode = 1; });
