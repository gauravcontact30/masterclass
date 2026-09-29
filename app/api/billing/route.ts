import { z } from "zod";
import { randomUUID } from "node:crypto";
import { api, userId, jsonBody, sameOrigin, HttpError } from "@/lib/server/http";
import { required, billingConfigured, quota, subscriptionPrice } from "@/lib/server/config";
import { profile } from "@/lib/server/repository";
import { rateLimit } from "@/lib/server/rate-limit";
import { razorpay, billingSubscription, reconcileSubscription, validateSubscriptionPlan } from "@/lib/server/billing";
import { db, check } from "@/lib/server/db";
import { savePreparations } from "@/lib/server/preparations";
import { preparationSchema } from "@/lib/study/preparations";
import { verifyHmac } from "@/lib/server/secrets";
import { entitlementTier } from "@/lib/domain";

export const runtime = "nodejs";
const terminal = ["cancelled", "completed", "expired"];
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action:z.literal("checkout"), tier:z.enum(["monthly","yearly"]), selections:preparationSchema }).strict(),
  z.object({ action:z.literal("verify"), razorpay_payment_id:z.string().regex(/^pay_[a-zA-Z0-9]+$/), razorpay_subscription_id:z.string().regex(/^sub_[a-zA-Z0-9]+$/), razorpay_signature:z.string().regex(/^[a-f0-9]{64}$/i) }).strict(),
  z.object({ action:z.literal("cancel") }).strict(),
  z.object({ action:z.literal("refresh") }).strict(),
]);
function checkoutResponse(remote: z.infer<typeof billingSubscription>, tier: "monthly" | "yearly") {
  return Response.json({ subscriptionId:remote.id, keyId:required("RAZORPAY_KEY_ID"), tier, amount:Math.round(subscriptionPrice(tier)*100), currency:"INR" });
}
export async function GET(request?: Request) {
  return api(async () => Response.json({ enabled:billingConfigured(), currency:"INR", proLimit:quota("monthly"), monthly:subscriptionPrice("monthly"), yearly:subscriptionPrice("yearly") }), request);
}
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await userId();
    const input = inputSchema.parse(await jsonBody(request));
    await profile(owner);
    await rateLimit(`billing:${input.action}:${owner}`, input.action === "checkout" ? 3 : 15, 60);
    const existing = check(await db().from("subscriptions").select("*").eq("user_id",owner).maybeSingle());
    if (input.action === "verify") {
      // Use the server-owned reference, never a client-selected subscription in the HMAC.
      if (!existing || existing.provider_ref !== input.razorpay_subscription_id) throw new HttpError(404,"not_found");
      if (!verifyHmac(`${input.razorpay_payment_id}|${existing.provider_ref}`, input.razorpay_signature, required("RAZORPAY_KEY_SECRET"))) throw new HttpError(400,"payment_verification_failed");
      await reconcileSubscription(existing.provider_ref, `verify:${randomUUID()}`);
      const subscription = check(await db().from("subscriptions").select("*").eq("user_id",owner).maybeSingle());
      return Response.json({ verified:true, active:entitlementTier(subscription) !== "free" });
    }
    if (input.action === "refresh") {
      if (existing) await reconcileSubscription(existing.provider_ref, `refresh:${randomUUID()}`);
      return Response.json({ ok:true });
    }
    if (input.action === "cancel") {
      if (!existing) throw new HttpError(404,"not_found");
      const remote = billingSubscription.parse(await razorpay(`subscriptions/${encodeURIComponent(existing.provider_ref)}`));
      if (!terminal.includes(remote.status) && !existing.cancel_at_cycle_end) {
        // An unauthorised/failed subscription has no paid cycle to wait for.
        const atEnd = remote.status === "active" && Boolean(remote.current_end && remote.current_end * 1000 > Date.now());
        await razorpay(`subscriptions/${encodeURIComponent(existing.provider_ref)}/cancel`, { cancel_at_cycle_end:atEnd ? 1 : 0 });
        check(await db().from("subscriptions").update({ cancel_at_cycle_end:true }).eq("user_id",owner).eq("provider_ref",existing.provider_ref));
      }
      await reconcileSubscription(existing.provider_ref, `cancel:${randomUUID()}`);
      return Response.json({ ok:true });
    }
    if (!billingConfigured()) throw new HttpError(503,"setup_required");
    const planId = required(input.tier === "monthly" ? "RAZORPAY_MONTHLY_PLAN_ID" : "RAZORPAY_YEARLY_PLAN_ID");
    if (existing) {
      const remote = billingSubscription.parse(await razorpay(`subscriptions/${encodeURIComponent(existing.provider_ref)}`));
      if (["created","authenticated"].includes(remote.status) && !existing.cancel_at_cycle_end) {
        if (remote.plan_id !== planId) throw new HttpError(409,"checkout_plan_conflict");
        await validateSubscriptionPlan(input.tier);
        await savePreparations(owner,input.selections);
        return checkoutResponse(remote,input.tier);
      }
      const paidUntil = Math.max(remote.current_end ? remote.current_end * 1000 : 0, Date.parse(existing.current_period_end ?? "") || 0);
      if (!terminal.includes(remote.status) || paidUntil > Date.now()) throw new HttpError(409,"subscription_exists");
    }
    await validateSubscriptionPlan(input.tier);
    await savePreparations(owner,input.selections);
    const remote = billingSubscription.parse(await razorpay("subscriptions", { plan_id:planId, total_count:input.tier === "monthly" ? 120 : 10, quantity:1, customer_notify:1, notes:{ user_id:owner } }));
    // A created mandate is never a paid entitlement. Webhooks/verification establish access.
    const row = { user_id:owner, provider_ref:remote.id, tier:input.tier, status:"created", synced_at:new Date(0).toISOString(), current_period_end:null, grace_until:null, cancel_at_cycle_end:false };
    const inserted = existing
      ? await db().from("subscriptions").update(row).eq("user_id",owner).eq("provider_ref",existing.provider_ref).select("provider_ref").maybeSingle()
      : await db().from("subscriptions").insert(row).select("provider_ref").single();
    if (inserted.error || !inserted.data) {
      const winner = check(await db().from("subscriptions").select("provider_ref").eq("user_id",owner).maybeSingle());
      if (winner?.provider_ref === remote.id) return checkoutResponse(remote,input.tier);
      await razorpay(`subscriptions/${encodeURIComponent(remote.id)}/cancel`, { cancel_at_cycle_end:0 });
      throw new HttpError(409,"subscription_exists");
    }
    return checkoutResponse(remote,input.tier);
  }, request);
}
