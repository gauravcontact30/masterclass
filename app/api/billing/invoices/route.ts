import { z } from "zod";
import { api, userId } from "@/lib/server/http";
import { db, check } from "@/lib/server/db";
import { razorpay } from "@/lib/server/billing";
import { rateLimit } from "@/lib/server/rate-limit";

const invoiceSchema = z.object({
  id:z.string(), subscription_id:z.string(), status:z.string(),
  amount:z.number().nullable(), amount_paid:z.number().nullable(), currency:z.string(),
  created_at:z.number(), paid_at:z.number().nullable().optional(), short_url:z.string().nullable().optional(),
});
export async function GET(request:Request) {
  return api(async () => {
    const owner = await userId();
    await rateLimit(`billing:invoices:${owner}`, 20, 60);
    const subscription = check(await db().from("subscriptions").select("provider_ref").eq("user_id",owner).maybeSingle());
    if (!subscription) return Response.json({ invoices:[] });
    const result = z.object({ items:z.array(invoiceSchema) }).parse(await razorpay(`invoices?subscription_id=${encodeURIComponent(subscription.provider_ref)}&count=30`));
    // Scope again before returning; never expose customer/address/card details from the API.
    return Response.json({ invoices:result.items.filter(item => item.subscription_id === subscription.provider_ref).map(item => {
      let url:string|null=null;
      if (item.short_url) {
        const parsed=URL.parse(item.short_url);
        if (parsed?.protocol === "https:" && ["rzp.io","razorpay.com"].some(host => parsed.hostname===host || parsed.hostname.endsWith(`.${host}`))) url=parsed.href;
      }
      return { id:item.id, status:item.status, amount:item.amount, amountPaid:item.amount_paid, currency:item.currency, createdAt:new Date(item.created_at*1000).toISOString(), url };
    }) });
  },request);
}
