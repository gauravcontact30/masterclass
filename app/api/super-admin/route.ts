import {runtimeHealth} from "@/lib/server/runtime-health";
import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db, check } from "@/lib/server/db";
import { billingConfigured } from "@/lib/server/config";
export const runtime = "nodejs";
export async function GET(request: Request) { return api(async () => {
  await requireSuperAdmin();
  const days = Number(new URL(request.url).searchParams.get("days"));
  const started = performance.now();
  const data = check(await db().rpc("super_admin_snapshot", { p_days: [1,7,30,90].includes(days) ? days : 30 }));
  return Response.json({ ...data, generatedAt: new Date().toISOString(), health: {
    databaseMs: Math.round(performance.now()-started), ...(await runtimeHealth()),
    billingConfigured: billingConfigured(),

  }, prices: { monthly: Number(process.env.PRO_MONTHLY_PRICE_INR??299), yearly: Number(process.env.PRO_YEARLY_PRICE_INR??2999) } });
}, request); }
