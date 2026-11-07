import { cookies } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { authConfigured } from "@/lib/server/config";
import { supabaseServer } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { clientIp, geo, hashIp, parseUserAgent } from "@/lib/server/visit-context";
import { isUntrackedEmail, UNTRACKED_COOKIE } from "@/lib/server/tracking-exclusions";
import { HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { isOwnTraffic } from "@/lib/visit-quality";
import { GOAL_NAME, cleanGoalParams } from "@/lib/goals";

/*
 * Custom goals (lib/goals.ts): one row in site_goals per completed goal. Like /api/track it answers 204 quickly, writes
 * after the response and never fails the page; a missing table (migration 0053 not applied) is ignored. Bots, the
 * owner and super admin pages are not recorded. The visitor and session ids are read from the cookies /api/track set.
 */
const bodySchema = z.object({
  name: z.string().regex(GOAL_NAME),
  path: z.string().trim().min(1).max(300).regex(/^\/(?!\/)[^?#]*$/),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

const recent = new Map<string, { count: number; since: number }>();
function allowed(key: string) {
  const now = Date.now(); const entry = recent.get(key);
  if (!entry || now - entry.since > 60_000) { if (recent.size > 5000) recent.clear(); recent.set(key, { count: 1, since: now }); return true; }
  return ++entry.count <= 30;
}
const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!authConfigured()) return noContent();
  try { sameOrigin(request); } catch { return new Response(null, { status: 403 }); }
  let input: z.infer<typeof bodySchema>;
  try { input = bodySchema.parse(await jsonBody(request, 3000)); } catch (error) { return new Response(null, { status: error instanceof HttpError ? error.status : 400 }); }
  if (/^\/(?:dashboard\/)?super-admin(?:\/|$)/.test(input.path) || input.path.startsWith("/api/")) return noContent();

  const ip = clientIp(request.headers);
  if (isOwnTraffic(ip)) return noContent();
  if (!allowed(ip ? hashIp(ip) : "unknown")) return new Response(null, { status: 429 });
  const ua = parseUserAgent(request.headers.get("user-agent") ?? "");
  if (ua.isBot) return noContent();

  const store = await cookies();
  if (store.get(UNTRACKED_COOKIE)?.value === "1") return noContent();
  let userId: string | null = null;
  try {
    const { data } = await (await supabaseServer()).auth.getClaims();
    userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    if (isUntrackedEmail(data?.claims?.email)) return noContent();
  } catch { /* anonymous */ }

  const id = (value: string | undefined) => value && /^[\w-]{8,64}$/.test(value) ? value : null;
  let attribution: { source?: string | null; medium?: string | null; campaign?: string | null; referrer?: string | null } = {};
  try { attribution = JSON.parse(store.get("mc_attribution")?.value || "{}") ?? {}; } catch { /* none */ }
  const short = (value: unknown, max: number) => typeof value === "string" && value ? value.slice(0, max) : null;
  const row = {
    name: input.name, params: cleanGoalParams(input.params ?? {}), path: input.path,
    visitor_id: id(store.get("mc_vid")?.value), session_id: id(store.get("mc_sid")?.value), user_id: userId,
    utm_source: short(attribution.source, 80), utm_medium: short(attribution.medium, 80), utm_campaign: short(attribution.campaign, 120), referrer_host: short(attribution.referrer, 120),
    country: geo(request.headers).country ?? null, device: ua.device,
  };
  after(async () => {
    try {
      const { error } = await db().from("site_goals").insert(row);
      if (error && error.code !== "42P01" && error.code !== "PGRST205") console.error("goal_write_failed", error.code);
    } catch { console.error("goal_write_unavailable"); }
  });
  return noContent();
}
