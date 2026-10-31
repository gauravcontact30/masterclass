import { revalidateTag } from "next/cache";
import { generateLandingFresh } from "@/lib/server/landing-fresh";
import { scheduledWeek } from "@/lib/ist-week";
import { cronAuthorized } from "@/lib/server/visit-retention";

// Text plus three pictures, painted side by side, takes one to two minutes.
export const maxDuration = 300;

/*
 * The weekly landing job (vercel.json, Monday 00:00 IST; daily until 2026-10-31): writes the week's AI additions
 * through the Vercel AI Gateway (lib/server/landing-fresh.ts) and publishes them at once. Visit retention runs on its
 * own daily cron (app/api/cron/visit-retention). `?force=1` rewrites this week's set. Needs the cron secret.
 */
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return new Response(null, { status: 401 });
  const force = new URL(request.url).searchParams.get("force") === "1";
  let fresh: { ok: boolean; pictures?: number; error?: string };
  try {
    const set = await generateLandingFresh(scheduledWeek(), force);
    revalidateTag("landing", { expire: 0 });
    fresh = { ok: true, pictures: [set.interview?.image, set.difference?.image, set.doc?.image].filter(Boolean).length };
  } catch (error) {
    console.error("landing_fresh_failed", String(error).slice(0, 300));
    fresh = { ok: false, error: "generation_failed" };
  }
  return Response.json({ fresh }, { status: fresh.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
