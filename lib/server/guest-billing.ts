import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { required, billingConfigured } from "./config";
import { HttpError } from "./http";
import { db, check } from "./db";
import { razorpay, billingSubscription, reconcileSubscription, validateSubscriptionPlan } from "./billing";
import { savePreparationsFor } from "./preparations";
import { profile } from "./repository";

export type GuestCheckout = { id:string; email:string; name:string; tier:"monthly"|"yearly"; selections:string[]; provider_ref:string; status:"created"|"fulfilled"|"conflict"; user_id:string|null; created_user:boolean; created_at:string };
const terminal = ["cancelled","completed","expired"];
/** A mandate the customer has authorised (Razorpay charges the first cycle with it). */
const paid = (remote: z.infer<typeof billingSubscription>) => ["authenticated","active"].includes(remote.status) || (remote.paid_count ?? 0) > 0;
/** An unpaid guest checkout is reused for this long instead of creating another mandate. */
const REUSE_MS = 30 * 60 * 1000;

export const guestEmail = z.string().trim().toLowerCase().pipe(z.email().max(254));
export async function accountIdByEmail(email: string): Promise<string | null> {
  return check(await db().rpc("auth_user_id_by_email", { p_email: email })) as string | null;
}
async function guestRow(filter: "id" | "provider_ref", value: string) {
  return check(await db().from("guest_checkouts").select("*").eq(filter, value).maybeSingle()) as GuestCheckout | null;
}
export const guestCheckoutById = (id: string) => guestRow("id", id);

export async function createGuestCheckout(input: { tier:"monthly"|"yearly"; email:string; name:string; selections:string[] }) {
  if (!billingConfigured()) throw new HttpError(503, "setup_required");
  // An existing account subscribes from its dashboard, so the purchase lands on the right account.
  if (await accountIdByEmail(input.email)) throw new HttpError(409, "account_exists");
  const planId = required(input.tier === "monthly" ? "RAZORPAY_MONTHLY_PLAN_ID" : "RAZORPAY_YEARLY_PLAN_ID");
  const recent = check(await db().from("guest_checkouts").select("*").eq("email", input.email).eq("tier", input.tier).eq("status", "created").order("created_at", { ascending:false }).limit(1).maybeSingle()) as GuestCheckout | null;
  if (recent && Date.now() - Date.parse(recent.created_at) < REUSE_MS) {
    const remote = billingSubscription.parse(await razorpay(`subscriptions/${encodeURIComponent(recent.provider_ref)}`));
    if (remote.status === "created" && remote.plan_id === planId) {
      check(await db().from("guest_checkouts").update({ name:input.name, selections:input.selections }).eq("id", recent.id));
      return { checkoutId:recent.id, subscriptionId:remote.id };
    }
  }
  await validateSubscriptionPlan(input.tier);
  const id = randomUUID();
  const remote = billingSubscription.parse(await razorpay("subscriptions", { plan_id:planId, total_count:input.tier === "monthly" ? 120 : 10, quantity:1, customer_notify:1, notes:{ guest_checkout:id, email:input.email } }));
  const inserted = await db().from("guest_checkouts").insert({ id, email:input.email, name:input.name, tier:input.tier, selections:input.selections, provider_ref:remote.id }).select("id").single();
  if (inserted.error || !inserted.data) {
    await razorpay(`subscriptions/${encodeURIComponent(remote.id)}/cancel`, { cancel_at_cycle_end:0 }).catch(() => undefined);
    throw new HttpError(503, "service_error");
  }
  return { checkoutId:id, subscriptionId:remote.id };
}

/**
 * Find the account for the checkout's email, creating it when there is none. It is created
 * without a password and no session is issued, so only the inbox owner can get in (by emailed link).
 */
async function ensureAccount(row: GuestCheckout) {
  const existing = await accountIdByEmail(row.email);
  if (existing) { await profile(existing); return { id:existing, created:false }; }
  const { data, error } = await db().auth.admin.createUser({ email:row.email, email_confirm:true, user_metadata:{ full_name:row.name } });
  // Subscriptions and this checkout reference profiles; don't depend on the auth trigger's timing.
  if (data?.user) { await profile(data.user.id); return { id:data.user.id, created:true }; }
  // A concurrent fulfilment (webhook vs. browser) may have created it first.
  const raced = await accountIdByEmail(row.email);
  if (raced) { await profile(raced); return { id:raced, created:false }; }
  throw new Error(error?.message ?? "guest_account_failed");
}

/** Give the account this subscription unless it already holds a live one. Returns false on conflict. */
async function attachSubscription(owner: string, row: GuestCheckout) {
  const local = { user_id:owner, provider_ref:row.provider_ref, tier:row.tier, status:"created", synced_at:new Date(0).toISOString(), current_period_end:null, grace_until:null, cancel_at_cycle_end:false };
  const current = check(await db().from("subscriptions").select("provider_ref,status,current_period_end").eq("user_id", owner).maybeSingle()) as { provider_ref:string; status:string; current_period_end:string|null } | null;
  if (!current) {
    const inserted = await db().from("subscriptions").insert(local).select("provider_ref").maybeSingle();
    if (!inserted.error && inserted.data) return true;
    const winner = check(await db().from("subscriptions").select("provider_ref").eq("user_id", owner).maybeSingle()) as { provider_ref:string } | null;
    return winner?.provider_ref === row.provider_ref;
  }
  if (current.provider_ref === row.provider_ref) return true;
  const paidUntil = Date.parse(current.current_period_end ?? "") || 0;
  const replaceable = current.status === "created" || (terminal.includes(current.status) && paidUntil <= Date.now());
  if (!replaceable) return false;
  if (current.status === "created") await razorpay(`subscriptions/${encodeURIComponent(current.provider_ref)}/cancel`, { cancel_at_cycle_end:0 }).catch(() => undefined);
  const updated = check(await db().from("subscriptions").update(local).eq("user_id", owner).eq("provider_ref", current.provider_ref).select("provider_ref").maybeSingle());
  return Boolean(updated);
}

/**
 * Link a paid guest subscription to its account and sync its state. Safe to run
 * repeatedly and concurrently (browser verify, webhook, scheduled sweep).
 * Returns null when the reference is not a guest checkout.
 */
export async function fulfilGuestCheckout(ref: string, eventId: string): Promise<GuestCheckout | null> {
  let row = await guestRow("provider_ref", ref);
  if (!row) return null;
  if (row.status === "conflict") return row;
  if (!row.user_id) {
    const remote = billingSubscription.parse(await razorpay(`subscriptions/${encodeURIComponent(ref)}`));
    // Nothing has been paid yet: no account is created for an abandoned checkout.
    if (!paid(remote)) return row;
    const account = await ensureAccount(row);
    const linked = check(await db().from("guest_checkouts").update({ user_id:account.id, created_user:account.created, status:"fulfilled", fulfilled_at:new Date().toISOString() }).eq("id", row.id).is("user_id", null).select("*").maybeSingle()) as GuestCheckout | null;
    if (linked) {
      if (!(await attachSubscription(account.id, linked))) {
        // The account already has a live membership: stop this one renewing and flag it for a refund.
        await razorpay(`subscriptions/${encodeURIComponent(ref)}/cancel`, { cancel_at_cycle_end:0 }).catch(() => undefined);
        check(await db().from("guest_checkouts").update({ status:"conflict" }).eq("id", row.id));
        console.error(JSON.stringify({ event:"guest_checkout_conflict", checkout:row.id, subscription:ref }));
        return { ...linked, status:"conflict" };
      }
      // There is no browser session here (webhook / guest verify), so save as the server.
      // A preference failure must not block access the customer has paid for.
      if (linked.selections.length) await savePreparationsFor(account.id, linked.selections).catch(() => undefined);
    }
    row = (await guestRow("id", row.id))!;
    if (row.status === "conflict") return row;
  }
  await reconcileSubscription(ref, eventId);
  return row;
}

/** Re-check guest checkouts whose webhook may have been missed. */
export async function sweepGuestCheckouts(limit = 10) {
  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const rows = check(await db().from("guest_checkouts").select("provider_ref").eq("status", "created").gte("created_at", since).order("created_at", { ascending:true }).limit(limit)) as { provider_ref:string }[] | null;
  let fulfilled = 0, failed = 0;
  for (const row of rows ?? []) {
    try { const result = await fulfilGuestCheckout(row.provider_ref, `guest-sweep:${randomUUID()}`); if (result?.user_id) fulfilled++; }
    catch { failed++; }
  }
  return { fulfilled, failed };
}
