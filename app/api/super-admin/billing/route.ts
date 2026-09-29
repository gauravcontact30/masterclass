import { api, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { billingConfigured, subscriptionPrice } from "@/lib/server/config";
import { validateSubscriptionPlan } from "@/lib/server/billing";
import { rateLimit } from "@/lib/server/rate-limit";

export async function GET(request:Request) {
  return api(async()=>{
    await requireSuperAdmin();
    const keys=["RAZORPAY_KEY_ID","RAZORPAY_KEY_SECRET","RAZORPAY_WEBHOOK_SECRET","RAZORPAY_MONTHLY_PLAN_ID","RAZORPAY_YEARLY_PLAN_ID"];
    return Response.json({enabled:billingConfigured(),mode:process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_")?"live":"test",
      checks:keys.map(name=>({name,configured:Boolean(process.env[name])})),
      monthly:subscriptionPrice("monthly"),yearly:subscriptionPrice("yearly"),
      webhookPath:"/api/webhooks/razorpay"});
  },request);
}
export async function POST(request:Request) {
  return api(async()=>{
    sameOrigin(request);const user=await requireSuperAdmin();
    await rateLimit(`billing:validate:${user.id}`,5,60);
    await Promise.all([validateSubscriptionPlan("monthly"),validateSubscriptionPlan("yearly")]);
    return Response.json({ok:true});
  },request);
}
