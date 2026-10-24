import { z } from "zod";
import { jsonBody, sameOrigin } from "@/lib/server/http";
import { clientIp, parseUserAgent } from "@/lib/server/visit-context";
import { recordEventLater } from "@/lib/server/monitoring";
import { isLocalAddress } from "@/lib/visit-quality";

/*
 * Frontend performance and errors from components/client-monitor.tsx, for the super admin's Logs & Health page.
 * One beacon per page: its Core Web Vitals become one `web_vitals` event and each distinct uncaught error one
 * `client_error` event in monitor_events. Like /api/track it answers 204 at once, writes after the response and never
 * fails the page; it is not wrapped in api(), which would log every beacon as a request as well.
 */
const metric = (max: number) => z.number().min(0).max(max).optional();
const bodySchema = z.object({
  path: z.string().trim().min(1).max(300).regex(/^\/(?!\/)[^?#]*$/),
  vitals: z.object({ LCP: metric(120_000), INP: metric(60_000), CLS: metric(100), FCP: metric(120_000), TTFB: metric(120_000) }).default({}),
  errors: z.array(z.object({ message: z.string().max(200), source: z.string().max(80), line: z.number().int().min(0).max(10_000_000).nullable(), kind: z.enum(["error", "rejection"]) })).max(5).default([]),
  connection: z.string().max(10).nullable().optional(),
  width: z.number().int().min(0).max(20_000).optional(),
});

/** At most 30 beacons a minute from one network per server instance. */
const recent = new Map<string, { count: number; since: number }>();
function allowed(key: string) {
  const now = Date.now(), entry = recent.get(key);
  if (!entry || now - entry.since > 60_000) { if (recent.size > 5000) recent.clear(); recent.set(key, { count: 1, since: now }); return true; }
  return ++entry.count <= 30;
}
const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try { sameOrigin(request); } catch { return new Response(null, { status: 403 }); }
  const ip = clientIp(request.headers);
  if (isLocalAddress(ip) && process.env.TRACK_LOCAL !== "1") return noContent();
  if (!allowed(ip ?? "unknown")) return new Response(null, { status: 429 });
  let input: z.infer<typeof bodySchema>;
  try { input = bodySchema.parse(await jsonBody(request, 4000)); } catch { return new Response(null, { status: 400 }); }
  const ua = parseUserAgent(request.headers.get("user-agent") ?? "");
  if (ua.isBot || input.path.startsWith("/api/")) return noContent();
  const context = { device: ua.device, browser: ua.browser, os: ua.os, connection: input.connection ?? null, width: input.width ?? null };
  if (Object.keys(input.vitals).length) {
    recordEventLater({ kind: "web_vitals", action: "page", resource: input.path, duration_ms: input.vitals.LCP != null ? Math.round(input.vitals.LCP) : undefined, details: { ...input.vitals, ...context } });
  }
  for (const error of input.errors) {
    recordEventLater({ kind: "client_error", action: error.kind, resource: input.path, status: 0, details: { message: error.message, source: error.source, line: error.line, ...context } });
  }
  return noContent();
}
