import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { authConfigured, razorpayConfigured, required } from "@/lib/server/config";
import { supabaseServer } from "@/lib/server/auth";
import { razorpay } from "@/lib/server/billing";
import { verifyHmac } from "@/lib/server/secrets";
import { rateLimit } from "@/lib/server/rate-limit";
import { clientIp, hashIp } from "@/lib/server/visit-context";
import { lockedCard } from "@/lib/server/landing-daily";
import { hasUnlock, recordUnlock, rememberUnlock, UNLOCK_PRICE_INR, unlockKey } from "@/lib/server/landing-unlock";

/*
 * The locked last card of the landing page's AI pulse and Word power carousels.
 * GET returns the card's content when this reader has unlocked it, else `{ locked, price }`; POST "order" opens a Razorpay order for
 * ₹2, and POST "verify" checks the Checkout signature, re-reads the payment from Razorpay, records it and
 * returns the content. The content is never in the page HTML, so blurring cannot be undone in the browser.
 */
const card = { kind: z.enum(["pulse", "word"]), day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), id: z.string().min(1).max(300) };
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("order"), ...card }).strict(),
  z.object({ action: z.literal("verify"), razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i) }).strict(),
]);
const orderSchema = z.object({ id: z.string(), amount: z.number(), currency: z.string(), notes: z.record(z.string(), z.unknown()).or(z.array(z.unknown())).optional() }).passthrough();
const paymentSchema = z.object({ id: z.string(), order_id: z.string().nullable(), status: z.string(), amount: z.number(), currency: z.string() }).passthrough();

async function viewer() {
  if (!authConfigured()) return null;
  try { const { data } = await (await supabaseServer()).auth.getClaims(); return typeof data?.claims?.sub === "string" ? data.claims.sub : null; } catch { return null; }
}

export async function GET(request: Request) {
  return api(async () => {
    const params = new URL(request.url).searchParams;
    const input = z.object(card).parse({ kind: params.get("kind"), day: params.get("day"), id: params.get("id") });
    const found = lockedCard(input.kind, input.day, input.id);
    if (!found) throw new HttpError(404, "not_found");
    if (!(await hasUnlock(unlockKey(input.kind, input.day, input.id), await viewer()))) {
      // Still locked is the expected answer for most readers, not a failure: a 200 keeps it out of the error counts.
      return Response.json({ locked: true, price: UNLOCK_PRICE_INR, available: razorpayConfigured() });
    }
    return Response.json({ card: found });
  }, request);
}

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const ip = clientIp(request.headers);
    await rateLimit(`landing-unlock:${ip ? hashIp(ip) : "unknown"}`, 20, 60);
    const input = inputSchema.parse(await jsonBody(request, 2000));
    const userId = await viewer();

    if (input.action === "order") {
      const found = lockedCard(input.kind, input.day, input.id);
      if (!found) throw new HttpError(404, "not_found");
      const key = unlockKey(input.kind, input.day, input.id);
      if (await hasUnlock(key, userId)) return Response.json({ unlocked: true, card: found });
      const title = "title" in found ? found.title : found.word;
      const order = orderSchema.parse(await razorpay("orders", {
        amount: UNLOCK_PRICE_INR * 100, currency: "INR", receipt: `unlock-${Date.now().toString(36)}`,
        // The order carries what was bought; verify reads it back from Razorpay instead of trusting the browser.
        notes: { kind: "card_unlock", unlock_kind: input.kind, unlock_day: input.day, unlock_id: input.id.slice(0, 250), title: title.slice(0, 120), user_id: userId ?? "" },
      }));
      return Response.json({
        key: required("RAZORPAY_KEY_ID"), order_id: order.id, amount: order.amount, currency: order.currency,
        name: "MasterClass", description: `Unlock: ${input.kind === "pulse" ? title : "this week's bonus word"}`.slice(0, 250),
      });
    }

    // The signature proves Checkout completed this order; the order and payment are then read from Razorpay itself.
    if (!verifyHmac(`${input.razorpay_order_id}|${input.razorpay_payment_id}`, input.razorpay_signature, required("RAZORPAY_KEY_SECRET"))) throw new HttpError(400, "payment_verification_failed");
    const [order, payment] = await Promise.all([
      razorpay(`orders/${encodeURIComponent(input.razorpay_order_id)}`).then(value => orderSchema.parse(value)),
      razorpay(`payments/${encodeURIComponent(input.razorpay_payment_id)}`).then(value => paymentSchema.parse(value)),
    ]);
    const notes = order.notes && !Array.isArray(order.notes) ? order.notes : {};
    if (notes.kind !== "card_unlock" || payment.order_id !== order.id || payment.amount !== order.amount || !["captured", "authorized"].includes(payment.status)) throw new HttpError(400, "payment_verification_failed");
    const kind = z.enum(["pulse", "word"]).parse(notes.unlock_kind), day = String(notes.unlock_day), id = String(notes.unlock_id);
    const found = lockedCard(kind, day, id, Date.now());
    const key = unlockKey(kind, day, id);
    await recordUnlock({ paymentId: payment.id, orderId: order.id, key, userId: userId ?? (typeof notes.user_id === "string" && notes.user_id ? notes.user_id : null), amount: payment.amount, currency: payment.currency });
    await rememberUnlock(key, new URL(request.url).protocol === "https:");
    // Paid but the day has since moved on twice: the payment stands in the ledger; the card is no longer served.
    if (!found) throw new HttpError(410, "card_expired");
    return Response.json({ unlocked: true, card: found });
  }, request);
}
