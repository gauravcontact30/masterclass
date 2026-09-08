import "server-only";
export function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("xxx")) throw new Error(`CONFIG:${name}`);
  return value;
}
export const databaseConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const authConfigured = () => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
export function quota(tier: string) {
  const amount = Number(process.env[tier === "free" ? "FREE_MONTHLY_GENERATIONS" : "PRO_MONTHLY_GENERATIONS"] ?? (tier === "free" ? 3 : 50));
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("CONFIG:quota");
  return amount;
}
export function billingConfigured() { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_MONTHLY_PLAN_ID && process.env.RAZORPAY_YEARLY_PLAN_ID && process.env.BILLING_ENABLED === "true"); }
