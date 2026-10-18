import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { api, jsonBody, sameOrigin, HttpError } from "@/lib/server/http";
import { required, subscriptionPrice, authConfigured } from "@/lib/server/config";
import { supabaseServer } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { verifyHmac } from "@/lib/server/secrets";
import { account } from "@/lib/server/repository";
import { preparationSchema } from "@/lib/study/preparation-schema";
import { createGuestCheckout, fulfilGuestCheckout, guestCheckoutById, guestEmail } from "@/lib/server/guest-billing";

const inputSchema = z.discriminatedUnion("action", [
  z.object({ action:z.literal("checkout"), tier:z.enum(["monthly","yearly"]), email:guestEmail, name:z.string().trim().min(1).max(80), selections:preparationSchema.optional() }).strict(),
  z.object({ action:z.literal("verify"), checkoutId:z.uuid(), razorpay_payment_id:z.string().regex(/^pay_[a-zA-Z0-9]+$/), razorpay_subscription_id:z.string().regex(/^sub_[a-zA-Z0-9]+$/), razorpay_signature:z.string().regex(/^[a-f0-9]{64}$/i) }).strict(),
]);
const client = (request: Request) => createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous").digest("hex").slice(0, 32);

/** Buy a membership without signing in. Signed-in visitors use /api/billing instead. */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    if (!authConfigured()) throw new HttpError(503, "setup_required");
    const input = inputSchema.parse(await jsonBody(request));
    if (input.action === "checkout") {
      if ((await (await supabaseServer()).auth.getUser()).data.user) throw new HttpError(409, "use_account_checkout");
      await rateLimit(`billing:guest:checkout:${client(request)}`, 6, 600);
      await rateLimit(`billing:guest:email:${input.email}`, 4, 600);
      const checkout = await createGuestCheckout({ ...input, selections:input.selections ?? [] });
      return Response.json({ ...checkout, keyId:required("RAZORPAY_KEY_ID"), tier:input.tier, amount:Math.round(subscriptionPrice(input.tier) * 100), currency:"INR", prefill:{ email:input.email, name:input.name } });
    }
    await rateLimit(`billing:guest:verify:${client(request)}`, 20, 60);
    const row = await guestCheckoutById(input.checkoutId);
    // The HMAC covers the server-held subscription, never a client-chosen one.
    if (!row || row.provider_ref !== input.razorpay_subscription_id) throw new HttpError(404, "not_found");
    if (!verifyHmac(`${input.razorpay_payment_id}|${row.provider_ref}`, input.razorpay_signature, required("RAZORPAY_KEY_SECRET"))) throw new HttpError(400, "payment_verification_failed");
    const result = await fulfilGuestCheckout(row.provider_ref, `guest-verify:${randomUUID()}`);
    if (!result || result.status === "conflict") return Response.json({ status:"conflict", email:row.email, newAccount:false });
    if (!result.user_id) return Response.json({ status:"processing", email:row.email, newAccount:false });
    // Never sign this browser in: paying does not prove the buyer owns the email.
    // Access comes only through a sign-in link delivered to that inbox.
    // Paid tier only: a brand-new account is on its trial, which is not proof of payment.
    const active = (await account(result.user_id)).paidTier !== "free";
    return Response.json({ status:active ? "active" : "processing", email:row.email, newAccount:result.created_user });
  }, request);
}
