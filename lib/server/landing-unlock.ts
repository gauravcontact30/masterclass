import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { required } from "./config";
import { equalSecret } from "./secrets";
import type { UnlockKind } from "@/lib/landing-daily-types";

/** The price of opening one locked landing card, in rupees. */
export const UNLOCK_PRICE_INR = Math.max(1, Number(process.env.LANDING_UNLOCK_PRICE_INR ?? 2));
const COOKIE = "mc_unlocks";
const KEEP = 60;

export const unlockKey = (kind: UnlockKind, day: string, id: string) => `${kind}:${day}:${id}`;
const secret = () => process.env.LANDING_UNLOCK_SECRET || required("RAZORPAY_KEY_SECRET");
const sign = (payload: string) => createHmac("sha256", secret()).update(`landing-unlock:${payload}`).digest("base64url");

/** Unlocks bought in this browser, from a signed cookie: a tampered or forged cookie reads as none. */
export async function cookieUnlocks(): Promise<string[]> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return [];
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !equalSecret(sign(payload), signature)) return [];
  try { const keys: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return Array.isArray(keys) ? keys.filter((key): key is string => typeof key === "string") : []; }
  catch { return []; }
}

export async function rememberUnlock(key: string, secure: boolean) {
  const keys = [...new Set([...(await cookieUnlocks()), key])].slice(-KEEP);
  const payload = Buffer.from(JSON.stringify(keys)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 400 * 86400 });
}

/** A card is open to this reader when this browser bought it, or their account did (on any device). */
export async function hasUnlock(key: string, userId: string | null) {
  if ((await cookieUnlocks()).includes(key)) return true;
  if (!userId) return false;
  const { data } = await db().from("billing_ledger").select("event_id").eq("user_id", userId).eq("subscription_ref", `unlock:${key}`).limit(1);
  return !!data?.length;
}

/** Every unlock is written to the billing ledger, idempotently by payment, beside the webhook's own payment events. */
export async function recordUnlock(entry: { paymentId: string; orderId: string; key: string; userId: string | null; amount: number; currency: string }) {
  const { error } = await db().from("billing_ledger").upsert({
    event_id: `unlock:${entry.paymentId}`, event: "card_unlock.captured", entity_id: entry.paymentId, subscription_ref: `unlock:${entry.key}`,
    user_id: entry.userId, amount: entry.amount, currency: entry.currency, invoice_id: entry.orderId,
  }, { onConflict: "event_id", ignoreDuplicates: true });
  if (error) console.error("unlock_ledger_failed", error.code);
}
