import { revalidateTag } from "next/cache";
import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { subscriptionPrice } from "@/lib/server/config";
import { validateSubscriptionPlan } from "@/lib/server/billing";
import { activeSale, BUILT_IN_SALE, festiveSales, forgetFestiveSales, SALE_PLAN_ID } from "@/lib/server/festive-sale";

/*
 * Super Admin → Revenue & billing → Festive sale. GET: the sales, which one is in force and whether each plan is
 * chargeable (has a Razorpay discounted plan id). PUT: edit one sale (migration 0035). A save refreshes the cached landing page
 * so the offer appears or disappears at once.
 */
const offer = z.string().trim().regex(SALE_PLAN_ID, "Razorpay discounted plan ids look like plan_XXXXXXXXXXXXXX").nullable().or(z.literal("").transform(() => null));
const inputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,40}$/),
  title: z.string().trim().min(3).max(80), title_hi: z.string().trim().max(80).nullable().optional(),
  discount_percent: z.number().int().min(1).max(90),
  starts_at: z.iso.datetime({ offset: true }), ends_at: z.iso.datetime({ offset: true }),
  active: z.boolean(),
  razorpay_plan_monthly: offer.optional(), razorpay_plan_yearly: offer.optional(),
}).refine(value => Date.parse(value.ends_at) > Date.parse(value.starts_at), { message: "The sale must end after it starts.", path: ["ends_at"] });

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const { rows, stored } = await festiveSales(true);
    const sale = await activeSale();
    return Response.json({ stored, rows, active: sale, prices: { monthly: subscriptionPrice("monthly"), yearly: subscriptionPrice("yearly") },
      envOffers: { monthly: Boolean(BUILT_IN_SALE.razorpay_plan_monthly), yearly: Boolean(BUILT_IN_SALE.razorpay_plan_yearly) } }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}

export async function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const admin = await requireSuperAdmin();
    const input = inputSchema.parse(await jsonBody(request));
    if (input.active) {
      for (const cycle of ["monthly", "yearly"] as const) {
        const planId = cycle === "monthly" ? input.razorpay_plan_monthly : input.razorpay_plan_yearly;
        if (!planId) throw new HttpError(400, "invalid_request");
        await validateSubscriptionPlan(cycle, { planId, amountInr: Math.round(subscriptionPrice(cycle) * (100 - input.discount_percent)) / 100 });
      }
    }
    const { error } = await db().from("festive_sales").upsert({ ...input, title_hi: input.title_hi || null, updated_at: new Date().toISOString(), updated_by: admin.email ?? admin.id }, { onConflict: "slug" });
    if (error) throw new HttpError(error.code === "PGRST205" || error.code === "42P01" ? 503 : 500, error.code === "PGRST205" || error.code === "42P01" ? "migration_required" : "service_error");
    forgetFestiveSales();
    revalidateTag("landing", { expire: 0 });
    return Response.json({ ok: true, active: await activeSale() });
  }, request);
}
