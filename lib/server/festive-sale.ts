import "server-only";
import { db } from "./db";
import { subscriptionPrice } from "./config";
import type { Cycle } from "@/lib/pricing";

/** Time-limited enrolment in discounted recurring Razorpay plans. Renewals retain the agreed price. */
export type FestiveSaleRow = {
  slug: string; title: string; title_hi: string | null; discount_percent: number; starts_at: string; ends_at: string; active: boolean;
  razorpay_plan_monthly: string | null; razorpay_plan_yearly: string | null; updated_at?: string; updated_by?: string | null;
};
export const SALE_PLAN_ID = /^plan_[A-Za-z0-9]{6,40}$/;
const env = (name: string) => { const value = process.env[name]?.trim(); return value && SALE_PLAN_ID.test(value) ? value : null; };
export const BUILT_IN_SALE: FestiveSaleRow = {
  slug: "diwali-2026", title: "Diwali Festive Sale", title_hi: "दिवाली फ़ेस्टिव सेल", discount_percent: 25,
  starts_at: "2026-10-24T00:00:00+05:30", ends_at: "2026-11-15T23:59:59+05:30", active: true,
  razorpay_plan_monthly: env("RAZORPAY_SALE_MONTHLY_PLAN_ID") || "plan_TrjkQxuDPMdSPZ", razorpay_plan_yearly: env("RAZORPAY_SALE_YEARLY_PLAN_ID") || "plan_TrjkRGAB51CRu6",
};

let cached: { at: number; rows: FestiveSaleRow[]; stored: boolean } | null = null;
const FRESH_MS = 60_000;

/** Every sale row, newest first; `stored` is false before migration 0035 (the built-in sale stands in). */
export async function festiveSales(fresh = false): Promise<{ rows: FestiveSaleRow[]; stored: boolean }> {
  if (!fresh && cached && Date.now() - cached.at < FRESH_MS) return cached;
  try {
    const { data, error } = await db().from("festive_sales").select("*").order("starts_at", { ascending: false });
    if (error) throw error;
    cached = { at: Date.now(), rows: (data ?? []) as FestiveSaleRow[], stored: true };
  } catch {
    cached = { at: Date.now(), rows: [BUILT_IN_SALE], stored: false };
  }
  return cached;
}
export function forgetFestiveSales() { cached = null; }

/** What a visitor and checkout need to know about the sale in force. */
export type ActiveSale = {
  slug: string; title: string; titleHi: string; percent: number; startsAt: string; endsAt: string;
  /** Per plan: the Razorpay plan, and the discounted recurring payment in rupees (to the paisa, as Razorpay charges it). */
  plans: Partial<Record<Cycle, { planId: string; inr: number }>>;
};
const percentOff = (price: number, percent: number) => {
  if (percent === 25) {
    if (price === 299) return 225;
    if (price === 2999) return 2250;
  }
  return Math.ceil(price * (100 - percent) / 100);
};

export async function activeSale(now = Date.now(), fresh = false): Promise<ActiveSale | null> {
  const { rows, stored } = await festiveSales(fresh);
  // Checkout requires the database campaign, never an environment fallback after an outage.
  if (!stored) {
    if (fresh) throw new Error("festive_sale_unavailable");
    return null;
  }
  const sale = rows.find(row => row.active && Date.parse(row.starts_at) <= now && now < Date.parse(row.ends_at));
  if (!sale) return null;
  const plans: ActiveSale["plans"] = {};
  for (const cycle of ["monthly", "yearly"] as const) {
    // The environment plan IDs also serve the stored Diwali row, so setting two variables is enough to switch it on.
    const builtIn = sale.slug === BUILT_IN_SALE.slug ? (cycle === "monthly" ? BUILT_IN_SALE.razorpay_plan_monthly : BUILT_IN_SALE.razorpay_plan_yearly) : null;
    const planId = (cycle === "monthly" ? sale.razorpay_plan_monthly : sale.razorpay_plan_yearly) || builtIn;
    if (planId && SALE_PLAN_ID.test(planId)) plans[cycle] = { planId, inr: percentOff(subscriptionPrice(cycle), sale.discount_percent) };
  }
  if (!Object.keys(plans).length) return null;
  return { slug: sale.slug, title: sale.title, titleHi: sale.title_hi || sale.title, percent: sale.discount_percent, startsAt: sale.starts_at, endsAt: sale.ends_at, plans };
}

/** The offer to attach when creating a subscription for this plan now, or null at the normal price. */
export async function saleOffer(cycle: Cycle) {
  const sale = await activeSale(Date.now(), true);
  const plan = sale?.plans[cycle];
  return sale && plan ? { slug: sale.slug, planId: plan.planId, amountInr: plan.inr } : null;
}
