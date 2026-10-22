import { revalidateTag } from "next/cache";
import { generateLandingFresh } from "@/lib/server/landing-fresh";
import { istDay } from "@/lib/server/landing-daily";
import { cronAuthorized, pruneVisits } from "@/lib/server/visit-retention";

// Text plus three pictures, painted side by side, takes one to two minutes.
export const maxDuration = 300;

/*
 * The nightly landing job (vercel.json, 00:05 IST): writes the day's AI additions through the Vercel AI Gateway
 * (lib/server/landing-fresh.ts) and publishes them at once, then applies the 5-day visit retention.
 * `?force=1` rewrites today's set. Needs the cron secret.
 */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response(null, { status: 401 });
  const force = new URL(request.url).searchParams.get("force") === "1";
  let fresh: { ok: boolean; pictures?: number; error?: string };
  try {
    const set = await generateLandingFresh(istDay(), force);
    revalidateTag("landing", { expire: 0 });
    fresh = { ok: true, pictures: [set.interview?.image, set.difference?.image, set.doc?.image].filter(Boolean).length };
  } catch (error) {
    console.error("landing_fresh_failed", String(error).slice(0, 300));
    fresh = { ok: false, error: "generation_failed" };
  }
  const retention = await pruneVisits();
  return Response.json({ fresh, retention }, { status: fresh.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
