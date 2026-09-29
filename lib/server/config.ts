import "server-only";
export function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("xxx")) throw new Error(`CONFIG:${name}`);
  return value;
}

export const databaseConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const authConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export function quota(tier: string) {
  // Legacy persisted "free" denotes an account without a paid subscription.
  if (tier !== "monthly" && tier !== "yearly") return 0;
  const amount = Number(process.env.PRO_MONTHLY_GENERATIONS ?? 50);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("CONFIG:quota");
  return amount;
}
export function razorpayConfigured() {
  const key = process.env.RAZORPAY_KEY_ID;
  return Boolean(key && process.env.RAZORPAY_KEY_SECRET &&
    (!key.startsWith("rzp_live_") || process.env.ALLOW_LIVE_BILLING === "true"));
}
export function billingConfigured() {
  return Boolean(razorpayConfigured() && process.env.RAZORPAY_WEBHOOK_SECRET &&
    process.env.RAZORPAY_MONTHLY_PLAN_ID && process.env.RAZORPAY_YEARLY_PLAN_ID && process.env.BILLING_ENABLED === "true");
}
export function subscriptionPrice(tier: "monthly" | "yearly") {
  const value = Number(process.env[tier === "monthly" ? "PRO_MONTHLY_PRICE_INR" : "PRO_YEARLY_PRICE_INR"] ?? (tier === "monthly" ? 299 : 2999));
  if (!Number.isFinite(value) || value <= 0 || !Number.isSafeInteger(Math.round(value * 100)) || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw new Error("CONFIG:subscription_price");
  return value;
}
