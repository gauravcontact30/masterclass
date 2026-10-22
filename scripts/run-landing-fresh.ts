/**
 * Writes today's landing additions now (what the nightly job app/api/cron/landing-daily does), e.g. to fill a new
 * environment. Run: npx tsx --conditions=react-server --env-file=.env scripts/run-landing-fresh.ts [--force]
 */
import { generateLandingFresh } from "../lib/server/landing-fresh";
import { istDay } from "../lib/server/landing-daily";

async function main() {
  const set = await generateLandingFresh(istDay(), process.argv.includes("--force"));
  console.log(JSON.stringify({ day: set.day, goals: set.goals.map(goal => goal.tech), interview: set.interview?.question, difference: set.difference?.title, doc: set.doc?.title, pictures: [set.interview?.image, set.difference?.image, set.doc?.image] }, null, 2));
}
void main();
