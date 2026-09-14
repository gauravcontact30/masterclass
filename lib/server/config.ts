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
export function billingConfigured() { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_MONTHLY_PLAN_ID && process.env.RAZORPAY_YEARLY_PLAN_ID && process.env.BILLING_ENABLED === "true"); }
