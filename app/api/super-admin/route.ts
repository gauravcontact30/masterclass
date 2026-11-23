import { runtimeHealth } from "@/lib/server/runtime-health";
import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db, check } from "@/lib/server/db";
import { billingConfigured } from "@/lib/server/config";
import { cacheFetch, cacheGet, cacheSet } from "@/lib/redis";
import { inngest } from "@/lib/inngest/client";


export async function GET(request: Request) {
  // The proxy applies Arcjet once for this route. Keep role checks here.

  return api(async () => {
    // 2. Authentication and Authorization Check
    const user = await requireSuperAdmin();

    const url = new URL(request.url);
    const rawDays = Number(url.searchParams.get("days"));
    const days = [1, 7, 30, 90].includes(rawDays) ? rawDays : 7;

    // 3. Upstash / Redis caching: 5 s, matching the Overview's 5-second re-read, so the console never shows figures older
    // than one refresh while several open tabs still share one database read. `snapshotAt` is when the figures were read,
    // so "Updated" on screen is their real age, not the time this cached copy was served.
    const started = performance.now();
    const cacheKey = `superadmin:snapshot:${days}`;

    const data = await cacheFetch(
      cacheKey,
      async () => {
        // The report can hit the database's statement timeout on a busy or cold moment. The last good copy is a better
        // answer than a 500, but it is marked `stale` so the console says so instead of presenting it as live.
        const lastGood = `${cacheKey}:last-good`;
        try {
          const fresh = { ...(check(await db().rpc("super_admin_snapshot", { p_days: days })) as Record<string, unknown>), snapshotAt: new Date().toISOString(), stale: false };
          await cacheSet(lastGood, fresh, 3600);
          return fresh;
        } catch (failure) {
          const previous = await cacheGet<Record<string, unknown>>(lastGood);
          if (previous) return { ...previous, stale: true };
          throw failure;
        }
      },
      5
    );
    const snapshotAt = typeof data.snapshotAt === "string" ? data.snapshotAt : new Date().toISOString();

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
      generatedAt: snapshotAt,
      stale: data.stale === true,
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
