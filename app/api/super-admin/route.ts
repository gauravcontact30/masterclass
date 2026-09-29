import { runtimeHealth } from "@/lib/server/runtime-health";
import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db, check } from "@/lib/server/db";
import { billingConfigured } from "@/lib/server/config";
import { protectWithArcjet } from "@/lib/arcjet";
import { cacheFetch } from "@/lib/redis";
import { inngest } from "@/lib/inngest/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // 1. Arcjet Security Shield Check
  const arcjetCheck = await protectWithArcjet(request);
  if (!arcjetCheck.allowed) {
    return Response.json(
      { error: "ACCESS_DENIED", message: arcjetCheck.reason },
      { status: arcjetCheck.status || 403 }
    );
  }

  return api(async () => {
    // 2. Authentication and Authorization Check
    const user = await requireSuperAdmin();

    const url = new URL(request.url);
    const rawDays = Number(url.searchParams.get("days"));
    const days = [1, 7, 30, 90].includes(rawDays) ? rawDays : 30;

    // 3. Upstash / Redis Caching Layer (Cache snapshot for 30s to reduce DB load)
    const started = performance.now();
    const cacheKey = `superadmin:snapshot:${days}`;

    const data = await cacheFetch(
      cacheKey,
      async () => {
        return check(await db().rpc("super_admin_snapshot", { p_days: days }));
      },
      30
    );

    // 4. Inngest Asynchronous Background Audit Logging
    void inngest.send({
      name: "masterclass/user.audit",
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "SUPER_ADMIN_SNAPSHOT_ACCESSED",
        timestamp: Date.now(),
        metadata: { days, databaseMs: Math.round(performance.now() - started) },
      },
    }).catch(() => {});

    return Response.json({
      ...data,
      generatedAt: new Date().toISOString(),
      health: {
        databaseMs: Math.round(performance.now() - started),
        ...(await runtimeHealth()),
        billingConfigured: billingConfigured(),
      },
      prices: {
        monthly: Number(process.env.PRO_MONTHLY_PRICE_INR ?? 299),
        yearly: Number(process.env.PRO_YEARLY_PRICE_INR ?? 2999),
      },
    });
  }, request);
}
