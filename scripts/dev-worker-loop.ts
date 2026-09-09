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
async function loop() {
  await sleep(3000); // let the dev server finish its own startup first
  for (;;) {
    try {
      const result = await processOne();
      if (result.processed) console.log(`[worker] ${JSON.stringify(result)}`);
      await sleep(result.processed ? 500 : 4000);
    } catch (error) {
      console.error("[worker] error:", error instanceof Error ? error.message : error);
      await sleep(4000);
    }
  }
}
loop();
