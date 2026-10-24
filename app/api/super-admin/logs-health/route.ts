import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { runtimeHealth } from "@/lib/server/runtime-health";
import { billingConfigured, razorpayConfigured } from "@/lib/server/config";
import { availableProviders, providerConfigured } from "@/lib/server/ai-providers";
import { redis } from "@/lib/redis";
import { analyse, detectIssues, healthScore, toLog, type MonitorRow } from "@/lib/logs-health";

/*
 * Super Admin → Logs & Health. One read gives the page everything: live checks of each dependency (each timed and
 * capped at 5 s), the server's runtime, and the monitoring window analysed into backend, frontend and AI sections,
 * detected issues, a health score and the newest log lines. `?hours=` picks the window (1 to 168).
 */
const KINDS = ["request", "page", "web_vitals", "client_error", "ai"];
const LIMIT = 8000, PAGE = 1000, LOGS = 600;

async function timed(label: string, id: string, probe: () => Promise<{ ok: boolean; note?: string }>) {
  const started = performance.now();
  try {
    const result = await Promise.race([probe(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))]);
    return { id, label, ok: result.ok, ms: Math.round(performance.now() - started), note: result.note };
  } catch (error) {
    return { id, label, ok: false, ms: Math.round(performance.now() - started), note: error instanceof Error && error.message === "timeout" ? "No answer within 5 seconds." : "The check failed." };
  }
}

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const asked = Number(new URL(request.url).searchParams.get("hours"));
    const hours = [1, 6, 24, 72, 168].includes(asked) ? asked : 24;
    const since = new Date(Date.now() - hours * 3_600_000).toISOString();
    const client = db();
    const upstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

    const checks = Promise.all([
      timed("Database", "database", async () => { const { error } = await client.from("profiles").select("id", { head: true, count: "exact" }).limit(1); return { ok: !error, note: error ? `Query failed (${error.code})` : "Postgres answers queries." }; }),
      timed("Authentication", "auth", async () => { const { error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 }); return { ok: !error, note: error ? "Supabase Auth refused the admin call." : "Supabase Auth answers." }; }),
      timed("File storage", "storage", async () => { const { error } = await client.storage.listBuckets(); return { ok: !error, note: error ? "Supabase Storage refused the call." : "Supabase Storage answers." }; }),
      timed("Cache", "cache", async () => upstash ? { ok: (await redis.ping()) === "PONG", note: "Upstash Redis answers." } : { ok: true, note: "In-memory cache (Upstash is not configured): fine for one instance, not shared." }),
      timed("AI Gateway", "ai", async () => ({ ok: providerConfigured("gateway") || availableProviders().length > 0, note: providerConfigured("gateway") ? `Configured · ${availableProviders().length} AI providers available` : availableProviders().length ? `Gateway not set · ${availableProviders().join(", ")} available` : "No AI provider is configured." })),
      timed("Payments", "payments", async () => ({ ok: razorpayConfigured(), note: billingConfigured() ? "Razorpay checkout is enabled." : razorpayConfigured() ? "Razorpay keys set; checkout is switched off." : "Razorpay is not configured." })),
    ]);

    const read = (offset: number, count = false) => client.from("monitor_events").select("id,created_at,kind,action,resource,status,duration_ms,details", count ? { count: "exact" } : undefined)
      .in("kind", KINDS).gte("created_at", since).order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + PAGE - 1);
    const [head, runtime, checked] = await Promise.all([read(0, true), runtimeHealth(), checks]);
    if (head.error) adminError(head.error);
    const rows = [...(head.data ?? [])] as MonitorRow[];
    const total = Math.min(head.count ?? rows.length, LIMIT);
    const rest = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(total / PAGE) - 1) }, (_, i) => read((i + 1) * PAGE)));
    for (const page of rest) { if (page.error) adminError(page.error); rows.push(...(page.data ?? []) as MonitorRow[]); }

    const analysis = analyse(rows, hours);
    const memoryPercent = runtime.hostMemory ? Math.round(runtime.hostUsedMemory / runtime.hostMemory * 100) : null;
    const issues = detectIssues(analysis, checked, { memoryPercent });
    return Response.json({
      generatedAt: new Date().toISOString(), hours, sampled: (head.count ?? 0) > LIMIT, events: rows.length,
      score: healthScore(issues), issues, checks: checked,
      runtime: { ...runtime, memoryPercent, region: process.env.VERCEL_REGION ?? null, deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null, env: process.env.VERCEL_ENV ?? process.env.NODE_ENV },
      ...analysis, logs: rows.slice(0, LOGS).map(toLog),
    }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
