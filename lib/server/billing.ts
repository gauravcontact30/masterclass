import "server-only";
import { z } from "zod";
import { required,razorpayConfigured,subscriptionPrice } from "./config";
import { HttpError } from "./http";
import { db,check } from "./db";
export const billingSubscription=z.object({id:z.string(),plan_id:z.string(),status:z.string(),paid_count:z.number().int().nonnegative().optional(),current_end:z.number().nullable().optional(),short_url:z.string().url().optional(),notes:z.object({user_id:z.string().optional()}).passthrough().optional(),has_scheduled_changes:z.boolean().optional()}).passthrough();
export async function razorpay(path:string,body?:unknown) {
  // Disabling new checkouts must not disable renewals, cancellations or webhooks.
  if(!razorpayConfigured())throw new HttpError(503,"setup_required");
  const key=required("RAZORPAY_KEY_ID");
  if(key.startsWith("rzp_live_")&&process.env.ALLOW_LIVE_BILLING!=="true")throw new HttpError(503,"setup_required");
  const response=await fetch(`https://api.razorpay.com/v1/${path}`,{method:body?"POST":"GET",headers:{Authorization:`Basic ${Buffer.from(`${key}:${required("RAZORPAY_KEY_SECRET")}`).toString("base64")}`,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000),cache:"no-store"});
  if(!response.ok)throw new HttpError(502,"service_error");return response.json();
}
export const razorpayOrder=z.object({id:z.string(),amount:z.number(),currency:z.string(),notes:z.object({user_id:z.string().optional(),kind:z.string().optional()}).passthrough().optional()}).passthrough();
export async function createDownloadOrder(userId:string) {
  const amount=Number(process.env.DOWNLOAD_CREDIT_PRICE_INR??49)*100;
  return razorpayOrder.parse(await razorpay("orders",{amount,currency:"INR",notes:{user_id:userId,kind:"download_credit"}}));
}
export async function reconcileDownloadCredit(orderId:string,eventId:string) {
  // Read the order's own owner from Razorpay; never trust a client-supplied user id.
  const order=razorpayOrder.parse(await razorpay(`orders/${encodeURIComponent(orderId)}`));
  const owner=order.notes?.user_id;
  if(!owner||order.notes?.kind!=="download_credit")throw new HttpError(400,"invalid_request");
  const existing=check(await db().from("profiles").select("id").eq("id",owner).maybeSingle());
  if(!existing)throw new HttpError(400,"invalid_request");
  check(await db().rpc("credit_download",{p_event:eventId,p_user:owner,p_credits:1}));
}
export async function reconcileSubscription(ref:string,eventId:string) {
  // Read authoritative current state; do not apply potentially stale event payload state.
  const syncedAt=new Date().toISOString();
  const remote=billingSubscription.parse(await razorpay(`subscriptions/${encodeURIComponent(ref)}`));
  const local=check(await db().from("subscriptions").select("user_id,provider_ref,cancel_at_cycle_end,current_period_end").eq("provider_ref",remote.id).maybeSingle());
  const owner=local?.user_id??remote.notes?.user_id;
  if(!owner)throw new HttpError(400,"invalid_request");
  const existing=check(await db().from("profiles").select("id").eq("id",owner).maybeSingle());
  if(!existing)throw new HttpError(400,"invalid_request");
  const tier=remote.plan_id===required("RAZORPAY_MONTHLY_PLAN_ID")?"monthly":remote.plan_id===required("RAZORPAY_YEARLY_PLAN_ID")?"yearly":null;
  if(!tier)throw new HttpError(400,"invalid_request");
  const current=check(await db().from("subscriptions").select("provider_ref").eq("user_id",owner).maybeSingle());
  // A delayed webhook for a finished subscription must not affect its replacement.
  // apply_subscription also checks the reference atomically if a replacement races this read.
  if(current&&current.provider_ref!==remote.id)return;
  const end = remote.paid_count === 0 ? null : remote.current_end ? new Date(remote.current_end*1000).toISOString() :
    ["cancelled", "completed", "pending", "halted", "paused"].includes(remote.status) ? local?.current_period_end ?? null : null;
  check(await db().rpc("apply_subscription",{p_event:eventId,p_user:owner,p_ref:remote.id,p_tier:tier,p_status:remote.status,p_end:end,p_synced:syncedAt,p_cancel:remote.status === "cancelled" || (local?.cancel_at_cycle_end??false)}));
  return remote;
}

/** Never charge a plan whose price or billing interval differs from the offer. */
export async function validateSubscriptionPlan(tier: "monthly" | "yearly") {
  const id = required(tier === "monthly" ? "RAZORPAY_MONTHLY_PLAN_ID" : "RAZORPAY_YEARLY_PLAN_ID");
  const plan = z.object({ id:z.string(), period:z.string(), interval:z.number(), item:z.object({ amount:z.number(), currency:z.string() }) }).parse(await razorpay(`plans/${encodeURIComponent(id)}`));
  if (plan.id !== id || plan.period !== tier || plan.interval !== 1 || plan.item.currency !== "INR" || plan.item.amount !== Math.round(subscriptionPrice(tier) * 100)) throw new HttpError(503, "billing_plan_mismatch");
  return id;
}
