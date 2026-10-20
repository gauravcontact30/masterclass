import { z } from "zod";
import { api } from "@/lib/server/http";
import { db } from "@/lib/server/db";
import { requireSuperAdmin } from "@/lib/server/super-admin";

/*
 * The Super Admin Security page's data: every blocked request (sign-in, permission, cross-site origin, size and
 * rate limits, recorded by lib/server/http.ts with its code and source address), aggregated by attacker, target
 * and time, plus server errors and a posture check of the protective secrets (true/false only, never values).
 * `logs` adds one feed per protection (privileged changes, data exports, webhooks and integrations, AI provider
 * fallbacks, rate limits, cross-site blocks) and `implementations` whether each protective layer is configured here.
 */
type Feed = { created_at: string; kind: string; action: string; actor_id: string | null; resource: string | null; status: number | null; details: Record<string, unknown> | null };
type Row = { created_at: string; resource: string | null; action: string; status: number | null; details: { security?: boolean; code?: string; ip?: string; ua?: string; request_id?: string } | null };

const SECRETS: [string, string][] = [
  ["RAZORPAY_WEBHOOK_SECRET", "Payment webhooks are signature-checked"], ["WORKER_SECRET", "Background worker calls are authenticated"],
  ["INTEGRATION_ENCRYPTION_KEY", "Integration credentials are encrypted at rest"], ["VISIT_HASH_SECRET", "Visitor identifiers are hashed"],
  ["URL_SIGNING_SECRET", "Download links are signed"], ["FIGMA_WEBHOOK_SECRET", "Figma webhooks are signature-checked"],
];
const label = (code: string) => ({
  signin_required: "Not signed in", forbidden: "Not allowed (admin only)", owner_only: "Owner only", invalid_origin: "Cross-site request blocked",
  rate_limited: "Rate limit hit", request_too_large: "Oversized request", invalid_signature: "Bad webhook signature", "405": "Wrong method",
}[code] ?? code);

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const days = z.coerce.number().int().min(1).max(90).default(7).parse(new URL(request.url).searchParams.get("days") ?? undefined);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data, error } = await db().from("monitor_events").select("created_at,resource,action,status,details")
      .eq("kind", "request").gte("created_at", since).gte("status", 400).order("created_at", { ascending: false }).limit(5000);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Row[];
    // The other security-relevant feeds: database audit trail (role and ban changes included), admin actions, exports,
    // integration calls and AI provider fallbacks. A missing kind simply yields an empty log.
    const feedResult = await db().from("monitor_events").select("created_at,kind,action,actor_id,resource,status,details")
      .in("kind", ["audit", "admin", "export", "integration", "ai"]).gte("created_at", since).order("created_at", { ascending: false }).limit(2000);
    if (feedResult.error) throw new Error(feedResult.error.message);
    const feed = (feedResult.data ?? []) as Feed[];
    const blocked = rows.filter(r => r.details?.security || [401, 403, 405, 413, 429].includes(r.status ?? 0));
    const count = <K extends string>(list: Row[], key: (r: Row) => K) => [...list.reduce((m, r) => m.set(key(r), (m.get(key(r)) ?? 0) + 1), new Map<K, number>())].sort((a, b) => b[1] - a[1]);

    const ips = new Map<string, { ip: string; count: number; last: string; codes: Set<string>; paths: Set<string>; admin: number }>();
    for (const r of blocked) {
      const ip = r.details?.ip ?? "unknown"; const hit = ips.get(ip) ?? { ip, count: 0, last: r.created_at, codes: new Set(), paths: new Set(), admin: 0 };
      hit.count += 1; if (r.created_at > hit.last) hit.last = r.created_at;
      hit.codes.add(label(r.details?.code ?? String(r.status))); if (r.resource) hit.paths.add(r.resource);
      if (r.resource?.startsWith("/api/super-admin")) hit.admin += 1;
      ips.set(ip, hit);
    }
    // Hourly for a day, daily otherwise.
    const bucket = (iso: string) => days <= 1 ? iso.slice(0, 13) + ":00" : iso.slice(0, 10);
    const timeline = count(blocked, r => bucket(r.created_at)).sort((a, b) => a[0].localeCompare(b[0]));
    const adminProbes = blocked.filter(r => r.resource?.startsWith("/api/super-admin")).length;

    return Response.json({
      days, generatedAt: new Date().toISOString(), truncated: rows.length === 5000,
      totals: {
        blocked: blocked.length, unauthenticated: blocked.filter(r => r.status === 401).length, forbidden: blocked.filter(r => r.status === 403).length,
        rateLimited: blocked.filter(r => r.status === 429).length, crossSite: blocked.filter(r => r.details?.code === "invalid_origin").length,
        adminProbes, serverErrors: rows.filter(r => (r.status ?? 0) >= 500).length, uniqueSources: ips.size,
      },
      byCode: count(blocked, r => label(r.details?.code ?? String(r.status))).map(([name, n]) => ({ name, count: n })),
      targets: count(blocked, r => `${r.action} ${r.resource ?? ""}`).slice(0, 10).map(([name, n]) => ({ name, count: n })),
      sources: [...ips.values()].sort((a, b) => b.count - a.count).slice(0, 12).map(s => ({ ...s, codes: [...s.codes], paths: [...s.paths].slice(0, 5), suspicious: s.count >= 20 || s.admin >= 5 })),
      timeline: timeline.map(([at, n]) => ({ at, count: n })),
      recent: blocked.slice(0, 500).map(r => ({ at: r.created_at, method: r.action, path: r.resource, status: r.status, reason: label(r.details?.code ?? String(r.status)), ip: r.details?.ip ?? null, ua: r.details?.ua ?? null, requestId: r.details?.request_id ?? null })),
      logs: securityLogs(blocked, feed),
      implementations: {
        arcjet: !!process.env.ARCJET_KEY, rateLimitStore: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
        webhookSignatures: !!process.env.RAZORPAY_WEBHOOK_SECRET, encryption: !!process.env.INTEGRATION_ENCRYPTION_KEY, visitorHashing: !!process.env.VISIT_HASH_SECRET,
      },
      posture: SECRETS.map(([name, what]) => ({ name, what, configured: !!process.env[name] })),
    });
  }, request);
}

/** Most recent entries per log, newest first. */
const LOG_ROWS = 25;
type LogEntry = { at: string; actor: string | null; action: string; target: string | null; status: number | null; detail: string | null };
const brief = (details: Record<string, unknown> | null | undefined, keys: string[]) =>
  keys.map(key => details?.[key] == null ? null : `${key.replace(/_/g, " ")}: ${String(details[key]).slice(0, 60)}`).filter(Boolean).join(" · ") || null;

/** One feed per protection, each with its full count in the window and its latest LOG_ROWS entries. */
function securityLogs(blocked: Row[], feed: Feed[]) {
  const fromFeed = (rows: Feed[], keys: string[]) => ({ count: rows.length, rows: rows.slice(0, LOG_ROWS).map((r): LogEntry => ({ at: r.created_at, actor: r.actor_id, action: r.action, target: r.resource, status: r.status, detail: brief(r.details, keys) })) });
  const fromBlocked = (rows: Row[]) => ({ count: rows.length, rows: rows.slice(0, LOG_ROWS).map((r): LogEntry => ({ at: r.created_at, actor: r.details?.ip ?? null, action: `${r.action} ${r.resource ?? ""}`.trim(), target: label(r.details?.code ?? String(r.status)), status: r.status, detail: r.details?.ua?.slice(0, 60) ?? null })) });
  const code = (r: Row) => r.details?.code ?? String(r.status);
  return {
    privileged: fromFeed(feed.filter(r => r.kind === "admin" || (r.kind === "audit" && r.action === "access_changed")), ["previous_role", "role", "banned_until", "reason", "delta"]),
    audit: fromFeed(feed.filter(r => r.kind === "audit" && r.action !== "access_changed"), ["record_id", "table"]),
    exports: fromFeed(feed.filter(r => r.kind === "export"), ["format", "rows"]),
    integrations: {
      ...fromFeed(feed.filter(r => r.kind === "integration"), ["provider"]),
      rejected: fromBlocked(blocked.filter(r => code(r) === "invalid_signature")),
    },
    ai: fromFeed(feed.filter(r => r.kind === "ai" && (r.action === "fallback" || (r.status ?? 0) >= 400)), ["provider"]),
    rateLimits: fromBlocked(blocked.filter(r => r.status === 429)),
    crossSite: fromBlocked(blocked.filter(r => code(r) === "invalid_origin")),
    oversized: fromBlocked(blocked.filter(r => r.status === 413)),
  };
}
