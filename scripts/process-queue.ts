/*
 * Drives the generation queue locally. In production this same work happens
 * through POST /api/internal/worker (see app/api/internal/worker/route.ts),
 * which needs an external scheduler — a Vercel Cron Job or any periodic HTTP
 * call carrying `Authorization: Bearer $WORKER_SECRET` — hitting it every
 * minute or so. Nothing in this repo currently does that, so a document sits
 * at status "queued" forever unless something calls processOne(). This script
 * is that "something" for local development: `npm run worker`.
 */
import { processOne } from "@/lib/server/worker";
async function main() {
  let iterations = 0;
  for (;;) {
    const result = await processOne();
    iterations++;
    console.log(JSON.stringify(result));
    if (!result.processed || iterations >= 50) break;
  }
  console.log(iterations === 0 ? "Queue was already empty." : `Stopped after ${iterations} job(s).`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
