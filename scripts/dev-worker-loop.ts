/*
 * Runs alongside `next dev` (see scripts/dev.mjs) so a document generated
 * locally actually gets processed without a second manual command. In
 * production this same work happens through POST /api/internal/worker (see
 * app/api/internal/worker/route.ts), which needs a real scheduler — a Vercel
 * Cron Job or any periodic call carrying `Authorization: Bearer
 * $WORKER_SECRET` — hitting it every minute or so.
 *
 * Errors are logged and swallowed rather than thrown, since one bad
 * generation attempt should never take down the polling loop for the rest of
 * the dev session.
 */
import { processOne } from "@/lib/server/worker";
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// An empty queue backs the poll off from 4 s to 30 s, so an idle dev session no longer asks the database every few
// seconds all day; any processed job resets it.
const IDLE_MIN = 4000, IDLE_MAX = 30_000;
async function loop() {
  await sleep(3000); // let the dev server finish its own startup first
  let idle = IDLE_MIN;
  for (;;) {
    try {
      const result = await processOne();
      if (result.processed) console.log(`[worker] ${JSON.stringify(result)}`);
      idle = result.processed ? IDLE_MIN : Math.min(IDLE_MAX, idle * 1.5);
      await sleep(result.processed ? 500 : idle);
    } catch (error) {
      console.error("[worker] error:", error instanceof Error ? error.message : error);
      await sleep(IDLE_MAX);
    }
  }
}
loop();
