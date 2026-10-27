import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { authConfigured } from "@/lib/server/config";
import { supabaseServer } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { clientIp, geo, geoPoint, hashIp, maskIp, parseUserAgent } from "@/lib/server/visit-context";
import { isUntrackedEmail, UNTRACKED_COOKIE } from "@/lib/server/tracking-exclusions";
import { HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { recordEvent } from "@/lib/server/monitoring";
import { isOwnTraffic, looksAutomated } from "@/lib/visit-quality";

/*
 * Page-view beacon for the super admin's User activities page (components/visit-tracker.tsx sends it).
 * Not wrapped in api(): that would log every beacon as a request event as well. It always answers 204 quickly,
 * writes after the response, and never fails the page: a missing table (migration 0023 not applied) is ignored.
 */
const VISITOR = "mc_vid", SESSION = "mc_sid";
const SESSION_SECONDS = 30 * 60;
const text = (max: number) => z.string().trim().max(max).optional().nullable().transform(value => value || null);
const bodySchema = z.object({
  type: z.enum(["view", "leave", "ping", "interaction"]),
  path: z.string().trim().min(1).max(300).regex(/^\/(?!\/)[^?#]*$/),
  topic: text(120), option: text(100), target_path: z.string().max(300).regex(/^\/(?!\/)[^?]*$/).optional().nullable(),
  title: text(200), referrer: text(500), language: text(35), timezone: text(60), screen: text(20),
  duration: z.number().int().min(0).max(86_400_000).optional(),
  utm: z.object({ source: text(80), medium: text(80), campaign: text(120) }).partial().optional(),
});

/** At most 120 beacons a minute from one network per server instance: a page view is cheap, a flood is not. */
const recent = new Map<string, { count: number; since: number }>();
function allowed(key: string) {
  const now = Date.now(); const entry = recent.get(key);
  if (!entry || now - entry.since > 60_000) { if (recent.size > 5000) recent.clear(); recent.set(key, { count: 1, since: now }); return true; }
  return ++entry.count <= 120;
}

const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!authConfigured()) return noContent();
  try { sameOrigin(request); } catch { return new Response(null, { status: 403 }); }
  let input: z.infer<typeof bodySchema>;
  try { input = bodySchema.parse(await jsonBody(request, 4000)); } catch (error) { return new Response(null, { status: error instanceof HttpError ? error.status : 400 }); }
  // Super admin pages are not part of the audience being measured.
  if (/^\/(?:dashboard\/)?super-admin(?:\/|$)/.test(input.path) || input.path.startsWith("/api/")) return noContent();

  // A page left in under a second is a 0-second bounce, not a visit (components/visit-tracker.tsx never sends its view).
  if (input.type === "leave" && (input.duration ?? 0) < 1000) return noContent();

  const ip = clientIp(request.headers);
  // The site's own development server is not audience (it shares the production database); TRACK_LOCAL=1 records it.
  if (isOwnTraffic(ip)) return noContent();
  const ipHash = ip ? hashIp(ip) : null;
  if (!allowed(ipHash ?? "unknown")) return new Response(null, { status: 429 });

  const store = await cookies();
  const secure = new URL(request.url).protocol === "https:";
  if (store.get(UNTRACKED_COOKIE)?.value === "1") return noContent();

  let userId: string | null = null;
  try {
    const { data } = await (await supabaseServer()).auth.getClaims();
    userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
    // The owner (and TRACKING_EXCLUDED_EMAILS) are not part of the audience: write nothing, and remember the browser.
    if (isUntrackedEmail(data?.claims?.email)) {
      store.set(UNTRACKED_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 365 * 86400 });
      store.delete(VISITOR); store.delete(SESSION);
      return noContent();
    }
  } catch { /* anonymous */ }

  const known = store.get(VISITOR)?.value;
  const visitorId = known && /^[\w-]{8,64}$/.test(known) ? known : randomUUID();
  const knownSession = store.get(SESSION)?.value;
  const sessionId = knownSession && /^[\w-]{8,64}$/.test(knownSession) ? knownSession : randomUUID();
  // A first-party, HTTP-only id: one per browser for a year, and a session that ends after 30 idle minutes.
  store.set(VISITOR, visitorId, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 365 * 86400 });
  store.set(SESSION, sessionId, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_SECONDS });

  const ua = parseUserAgent(request.headers.get("user-agent") ?? "");
  let referrerHost: string | null = null;
  try { if (input.referrer) { const host = new URL(input.referrer).host; referrerHost = host && host !== new URL(request.url).host ? host.replace(/^www\./, "") : null; } } catch { /* not a URL */ }

  // Carry the session's source across client-side routes and reloads, including midnight.
  const sourceSchema = z.object({ source: text(80), medium: text(80), campaign: text(120), referrer: text(120) });
  let prior: z.infer<typeof sourceSchema> | null = null;
  try { if (knownSession === sessionId) prior = sourceSchema.parse(JSON.parse(store.get("mc_attribution")?.value || "null")); } catch { /* no valid source */ }
  const attribution = input.utm?.source || referrerHost
    ? { source: input.utm?.source || null, medium: input.utm?.medium || null, campaign: input.utm?.campaign || null, referrer: referrerHost }
    : prior || { source: null, medium: null, campaign: null, referrer: null };
  store.set("mc_attribution", JSON.stringify(attribution), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_SECONDS });

  // A heartbeat from a visible page (components/visit-tracker.tsx): one presence row per open page, so the Live
  // visitor stream knows who is still reading and since when. `duration` is how long the page has been visible in
  // its current stretch, which the browser measures; the server only records it against its own clock.
  if (input.type === "ping") {
    if (ua.isBot) return noContent();
    const seen = Date.now();
    const presence = { session_id: sessionId, path: input.path, visitor_id: visitorId, user_id: userId,
      started_at: new Date(seen - (input.duration ?? 0)).toISOString(), seen_at: new Date(seen).toISOString() };
    after(async () => {
      try {
        const { error } = await db().from("site_presence").upsert(presence, { onConflict: "session_id,path" });
        // Before migration 0034 the table does not exist: the stream falls back to the leave beacons alone.
        if (error && error.code !== "42P01" && error.code !== "PGRST205") console.error("presence_write_failed", error.code);
      } catch { console.error("presence_write_unavailable"); }
    });
    return noContent();
  }

  if (input.type === "interaction") {
    if (!input.option || ua.isBot) return noContent();
    after(() => recordEvent({ kind: "site_interaction", action: "click", actor_id: userId, resource: input.path, details: {
      visitor_id: visitorId, session_id: sessionId, topic: input.topic, option: input.option, target_path: input.target_path,
      utm_source: attribution.source, utm_medium: attribution.medium, utm_campaign: attribution.campaign, referrer_host: attribution.referrer,
    } }));
    return noContent();
  }

  const row = {
    event: input.type === "view" ? "page_view" : "page_leave",
    visitor_id: visitorId, session_id: sessionId, user_id: userId,
    new_visitor: input.type === "view" && !known,
    path: input.path, title: input.title, referrer_host: attribution.referrer,
    utm_source: attribution.source, utm_medium: attribution.medium, utm_campaign: attribution.campaign,
    ...geo(request.headers), ip_masked: ip ? maskIp(ip) : null, ip_hash: ipHash,
    browser: ua.browser, os: ua.os, device: ua.device,
    is_bot: ua.isBot || looksAutomated({ timezone: input.timezone, language: input.language, screen: input.screen, device: ua.device }),
    language: input.language, timezone: input.timezone, screen: input.screen,
    duration_ms: input.type === "leave" ? input.duration ?? null : null,
  };
  const point = geoPoint(request.headers);
  after(async () => {
    try {
      let { error } = await db().from("site_visits").insert({ ...row, ...point });
      // Before migration 0030 the postal code and coordinate columns do not exist: keep the visit without them.
      if (error && (error.code === "PGRST204" || error.code === "42703")) ({ error } = await db().from("site_visits").insert(row));
      if (error && error.code !== "42P01" && error.code !== "PGRST205") console.error("visit_write_failed", error.code);
    } catch { console.error("visit_write_unavailable"); }
  });
  return noContent();
}
