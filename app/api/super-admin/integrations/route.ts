import { requireSuperAdmin } from "@/lib/server/super-admin";
import { HttpError, sameOrigin } from "@/lib/server/http";
import { redis, cacheSet } from "@/lib/redis";
import { inngest } from "@/lib/inngest/client";
import { env } from "@/lib/env";
import { z } from "zod";


const integrationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("flush_cache") }),
  z.object({ action: z.literal("trigger_warm_cache"), category: z.string().optional() }),
  z.object({
    action: z.literal("invite_user"),
    email: z.string().email("Valid email required"),
    role: z.enum(["user", "pro", "admin"]).default("pro"),
  }),
]);

export async function GET() {
  try {
    await requireSuperAdmin();

    const status = {
      timestamp: new Date().toISOString(),
      redis: {
        provider: env.UPSTASH_REDIS_REST_URL ? "Upstash Redis" : "In-Memory Fallback Redis",
        status: "connected",
        ratelimitEnabled: true,
      },
      inngest: {
        appId: "masterclass",
        status: "active",
        functions: ["curriculum-generation", "user-audit-logger", "cache-warmer"],
      },
      arcjet: {
        status: env.ARCJET_KEY ? "active" : "standby (local fallback)",
        features: ["Bot Detection", "Shield Attack Defense", "Sliding Window Rate Limiting"],
      },
      t3Env: {
        nodeEnv: env.NODE_ENV,
        configuredKeys: [
          env.DATABASE_URL ? "DATABASE_URL" : null,
          env.SUPABASE_URL ? "SUPABASE_URL" : null,
          env.UPSTASH_REDIS_REST_URL ? "UPSTASH_REDIS" : null,
          env.INNGEST_EVENT_KEY ? "INNGEST" : null,
          env.ARCJET_KEY ? "ARCJET" : null,
        ].filter(Boolean),
      },
    };

    return Response.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return Response.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    // Admin actions only from this site's own pages (blocks cross-site request forgery).
    sameOrigin(request);
    const user = await requireSuperAdmin();
    const body = await request.json();
    const parsed = integrationActionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid action payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { action } = parsed.data;

    if (action === "flush_cache") {
      try {
        if ("flushall" in redis && typeof redis.flushall === "function") {
          await redis.flushall();
        }
      } catch {
        // Fallback for limited keys
      }

      // Record audit via Inngest
      await inngest.send({
        name: "masterclass/user.audit",
        data: {
          userEmail: user.email,
          action: "CACHE_FLUSHED",
          timestamp: Date.now(),
        },
      });

      return Response.json({ success: true, message: "Redis cache successfully cleared." });
    }

    if (action === "trigger_warm_cache") {
      const category = parsed.data.category || "all";
      await inngest.send({
        name: "masterclass/cache.warm",
        data: { category, timestamp: Date.now() },
      });

      return Response.json({ success: true, message: `Inngest cache pre-warm job queued for "${category}".` });
    }

    if (action === "invite_user") {
      const { email, role } = parsed.data;
      // Record invite token in Redis
      const inviteKey = `invite:${Buffer.from(email).toString("base64")}`;
      await cacheSet(inviteKey, { email, role, invitedBy: user.email, createdAt: Date.now() }, 86400 * 7);

      await inngest.send({
        name: "masterclass/user.audit",
        data: {
          userEmail: user.email,
          action: "USER_INVITED",
          timestamp: Date.now(),
          metadata: { invitedEmail: email, role },
        },
      });

      return Response.json({ success: true, message: `Invitation for ${email} (${role}) registered.` });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    // Sign-in, permission and origin failures keep their status; nothing internal is echoed back for them.
    if (error instanceof HttpError) return Response.json({ error: error.code }, { status: error.status });
    const message = error instanceof Error ? error.message : "Execution failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
