import { z } from "zod";
import { randomUUID } from "node:crypto";
import { api, userId, jsonBody, sameOrigin, HttpError } from "@/lib/server/http";
import { required, billingConfigured, quota, subscriptionPrice } from "@/lib/server/config";
import { visitorPrices } from "@/lib/server/pricing";
import { CURRENCIES } from "@/lib/pricing";
import { profile } from "@/lib/server/repository";
import { rateLimit } from "@/lib/server/rate-limit";
import { razorpay, billingSubscription, reconcileSubscription, validateSubscriptionPlan } from "@/lib/server/billing";
import { db, check } from "@/lib/server/db";
import { savePreparations } from "@/lib/server/preparations";
import { preparationSchema } from "@/lib/study/preparation-schema";
import { verifyHmac } from "@/lib/server/secrets";
import { entitlementTier } from "@/lib/domain";
import { saleOffer } from "@/lib/server/festive-sale";

const terminal = ["cancelled", "completed", "expired"];
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action:z.literal("checkout"), tier:z.enum(["monthly","yearly"]), currency:z.enum(CURRENCIES).optional(), expectedAmountPaise:z.number().int().positive().optional(), expectedSale:z.string().max(41).nullable().optional(), selections:preparationSchema.optional() }).strict(),
  z.object({ action:z.literal("verify"), razorpay_payment_id:z.string().regex(/^pay_[a-zA-Z0-9]+$/), razorpay_subscription_id:z.string().regex(/^sub_[a-zA-Z0-9]+$/), razorpay_signature:z.string().regex(/^[a-f0-9]{64}$/i) }).strict(),
  z.object({ action:z.literal("cancel") }).strict(),
  z.object({ action:z.literal("refresh") }).strict(),
]);
/** Every visitor is charged in rupees; their own currency is shown converted (see lib/server/pricing). */
/** `amountInr`: the discounted recurring payment for the campaign plan. */
function checkoutResponse(remote: z.infer<typeof billingSubscription>, tier: "monthly" | "yearly", amountInr = subscriptionPrice(tier)) {
  return Response.json({ subscriptionId:remote.id, keyId:required("RAZORPAY_KEY_ID"), tier, amount:Math.round(amountInr*100), currency:"INR", discounted:amountInr < subscriptionPrice(tier) });
}
/** Prices converted into the visitor's currency (located by country, or `?currency=` from the picker), with the rupee amounts billed. */
export async function GET(request: Request) {
  return api(async () => {
    const prices = await visitorPrices(request.headers, new URL(request.url).searchParams.get("currency"));
    return Response.json({ enabled:billingConfigured(), proLimit:quota("monthly"), ...prices }, { headers:{ "Cache-Control":"private, no-store", Vary:"x-vercel-ip-country" } });
  }, request);
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
    // `currency` is only the one the visitor was shown; the charge is always the rupee plan.
    const offer = await saleOffer(input.tier);
    const planId = offer?.planId ?? required(input.tier === "monthly" ? "RAZORPAY_MONTHLY_PLAN_ID" : "RAZORPAY_YEARLY_PLAN_ID");
    if (input.expectedSale !== undefined && input.expectedSale !== (offer?.slug ?? null)) throw new HttpError(409,"pricing_changed");
    if (input.expectedAmountPaise !== undefined && input.expectedAmountPaise !== Math.round((offer?.amountInr ?? subscriptionPrice(input.tier)) * 100)) throw new HttpError(409,"pricing_changed");
    let renewFrom: number | null = null;
    if (existing) {
      const remote = billingSubscription.parse(await razorpay(`subscriptions/${encodeURIComponent(existing.provider_ref)}`));
      if (["created","authenticated"].includes(remote.status) && !existing.cancel_at_cycle_end) {
        if (existing.tier !== input.tier) throw new HttpError(409,"checkout_plan_conflict");
        await validateSubscriptionPlan(input.tier, offer ?? undefined);
        if (input.selections) await savePreparations(owner,input.selections);
        // Never reopen a full-price mandate under a newly advertised discount (or an expired offer).
        if (remote.plan_id !== planId) {
          if (remote.status === "authenticated") throw new HttpError(409,"checkout_plan_conflict");
          await razorpay(`subscriptions/${encodeURIComponent(remote.id)}/cancel`, { cancel_at_cycle_end:0 });
        } else {
          return checkoutResponse(remote,input.tier,offer?.amountInr);
        }
      }
      if (![...terminal, "created"].includes(remote.status)) throw new HttpError(409,"subscription_exists");
      // Cancelled with paid time left (a UPI mandate revoked from the customer's app, or renewal
      // cancelled here): the new subscription's first charge falls when that time ends.
      const paidUntil = Math.max(remote.current_end ? remote.current_end * 1000 : 0, Date.parse(existing.current_period_end ?? "") || 0);
      if (paidUntil > Date.now()) renewFrom = paidUntil;
    }
    await validateSubscriptionPlan(input.tier, offer ?? undefined);
    if (input.selections) await savePreparations(owner,input.selections);
    // A dedicated discounted plan keeps the same price on every renewal.
    const remote = billingSubscription.parse(await razorpay("subscriptions", { plan_id:planId, total_count:input.tier === "monthly" ? 120 : 10, quantity:1, customer_notify:1, notes:{ user_id:owner }, ...(renewFrom ? { start_at:Math.ceil(renewFrom / 1000) } : {}) }));
    // A created mandate is never a paid entitlement. Webhooks/verification establish access;
    // a renewal only carries forward the period already paid for.
    const row = { user_id:owner, provider_ref:remote.id, tier:input.tier, status:"created", synced_at:new Date(0).toISOString(), current_period_end:renewFrom ? new Date(renewFrom).toISOString() : null, grace_until:null, cancel_at_cycle_end:false, festive_sale:offer?.slug ?? null, razorpay_plan_id:planId, recurring_amount_inr:offer?.amountInr ?? subscriptionPrice(input.tier) };
    const inserted = existing
      ? await db().from("subscriptions").update(row).eq("user_id",owner).eq("provider_ref",existing.provider_ref).select("provider_ref").maybeSingle()
      : await db().from("subscriptions").insert(row).select("provider_ref").single();
    if (inserted.error || !inserted.data) {
      const winner = check(await db().from("subscriptions").select("provider_ref").eq("user_id",owner).maybeSingle());
      if (winner?.provider_ref === remote.id) return checkoutResponse(remote,input.tier,offer?.amountInr);
      await razorpay(`subscriptions/${encodeURIComponent(remote.id)}/cancel`, { cancel_at_cycle_end:0 });
      throw new HttpError(409,"subscription_exists");
    }
    return checkoutResponse(remote,input.tier,offer?.amountInr);
  }, request);
}
