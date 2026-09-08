import "server-only";
import { check, db } from "./db";
import { HttpError } from "./http";
export async function rateLimit(key: string, max = 10, seconds = 60) {
  if (!check(await db().rpc("rate_limit", { p_key: key, p_max: max, p_seconds: seconds }))) throw new HttpError(429, "rate_limited");
}
