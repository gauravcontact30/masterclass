import "server-only";
import { createHash } from "node:crypto";
import { authConfigured, databaseConfigured } from "./config";
import { supabaseServer } from "./auth";
import { rateLimit } from "./rate-limit";
import { HttpError } from "./http";

/*
 * Allowances for the small AI features (path finder, onboarding plan, dashboard coach): a signed-in learner has their
 * own bucket, a visitor is keyed by network address alone (never the User-Agent, which can be rotated), and all
 * visitors share one paid budget. Without a database (local development) the buckets live in memory.
 */
type Window = [max: number, seconds: number];
const localBuckets = new Map<string, { count: number; expires: number }>();
function localLimit(key: string, max: number, seconds: number) {
  const now = Date.now();
  for (const [id, bucket] of localBuckets) if (bucket.expires <= now) localBuckets.delete(id);
  if (!localBuckets.has(key) && localBuckets.size >= 1000) throw new HttpError(429, "rate_limited");
  const bucket = localBuckets.get(key) ?? { count: 0, expires: now + seconds * 1000 };
  if (++bucket.count > max) throw new HttpError(429, "rate_limited");
  localBuckets.set(key, bucket);
}

/** The signed-in user's id from the session JWT (verified locally, no network round trip), or null. */
export async function signedInUserId() {
  if (!authConfigured()) return null;
  try {
    const { data } = await (await supabaseServer()).auth.getClaims();
    return typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  } catch { return null; }
}

export async function limitAiFeature(request: Request, feature: string, windows: { user: Window; visitor?: Window; budget?: Window }) {
  const limit = databaseConfigured() ? rateLimit : async (key: string, max: number, seconds: number) => localLimit(key, max, seconds);
  const user = await signedInUserId();
  if (user) { await limit(`${feature}:user:${user}`, ...windows.user); return user; }
  if (!windows.visitor) throw new HttpError(401, "signin_required");
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
  await limit(`${feature}:visitor:${createHash("sha256").update(address).digest("hex")}`, ...windows.visitor);
  if (windows.budget) await limit(`${feature}:public-budget`, ...windows.budget);
  return null;
}
