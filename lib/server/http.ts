import "server-only";
import { indiaAccess } from "./audience";
import { ZodError } from "zod";
import { authConfigured } from "./config";
import { authUser, sessionUserId } from "./auth";
import { after } from "next/server";
import { recordEvent } from "./monitoring";
import { UNTRACKED_COOKIE } from "./tracking-exclusions";
import { AUTH_USER, requestOnce, withRequestCache } from "./request-cache";
import { headers } from "next/headers";
import { PORTAL_HEADER, isExamPortal } from "@/lib/portal";
import { HttpError } from "./http-error";
export { HttpError };
export async function userId() {
  if (!authConfigured()) throw new HttpError(503, "setup_required");
  const user = await requestOnce(AUTH_USER, authUser);
  if (!user) throw new HttpError(401, "signin_required");
  return portalScoped(user.id);
}
/**
 * Requests from an exam portal's pages carry `x-portal: boards` or `x-portal: competitive` (lib/client.ts) and act
 * on the caller's account in that portal, a separate profile with its own trial and membership (lib/server/portal.ts).
 * The header only selects between accounts the caller owns: an exam account needs this browser's Exams session and
 * a row in portal_accounts.
 */
async function portalScoped(authUserId: string) {
  const portal = (await headers()).get(PORTAL_HEADER);
  if (!isExamPortal(portal)) return authUserId;
  if (!await indiaAccess()) throw new HttpError(403, "region_unavailable");
  // Loaded here, not at the top: portal.ts → repository.ts → … import this module back, and a static import made
  // that cycle leave exports uninitialised for whichever module loaded first.
  const { examAccountOf } = await import("./portal");
  const accountId = await examAccountOf(authUserId, portal);
  if (!accountId) throw new HttpError(401, "signin_required");
  return accountId;
}
/** userId for GET routes that only read the caller's own data (see sessionUserId). Anything that changes data uses userId. */
export async function readerId() {
  if (!authConfigured()) throw new HttpError(503, "setup_required");
  const id = await sessionUserId();
  if (!id) throw new HttpError(401, "signin_required");
  return portalScoped(id);
}
export async function jsonBody(request: Request, max = 30000) {
  if (Number(request.headers.get("content-length")) > max) throw new HttpError(413, "request_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "invalid_request");
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); throw new HttpError(413, "request_too_large"); } chunks.push(value); }
  const body = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(body); } catch { throw new HttpError(400, "invalid_request"); }
}
export function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new HttpError(403, "invalid_origin");
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, "invalid_origin");
}
const SECURITY_STATUSES = new Set([401, 403, 405, 413, 429]);
const SECURITY_CODES = new Set(["invalid_origin", "forbidden", "owner_only", "signin_required", "rate_limited", "request_too_large", "invalid_signature"]);
/** The caller's address as the platform reports it (first X-Forwarded-For hop), for tracing blocked requests. */
export function clientIp(request: Request) {
  return (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}
/** The visit a request belongs to, from the first-party tracking cookies (app/api/track): random ids, so the Live visitor stream can list each visitor's API routes. */
function visitIds(request: Request) {
  const cookie = (name: string) => request.headers.get("cookie")?.split(/;\s*/).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
  const valid = (value?: string) => value && /^[\w-]{8,64}$/.test(value) ? value : undefined;
  const session = valid(cookie("mc_sid")), visitor = valid(cookie("mc_vid"));
  return session ? { session_id: session, ...(visitor ? { visitor_id: visitor } : {}) } : {};
}
export async function api(action: () => Promise<Response>, request?: Request) {
  const started = performance.now();
  const requestId = crypto.randomUUID();
  function monitor(response: Response, code?: string) {
    response.headers.set("X-Request-ID", requestId);
    response.headers.append("Server-Timing", `app;dur=${(performance.now() - started).toFixed(1)}`);
    // Opt out of successful-request analytics, but never let a client-set cookie hide security failures.
    const untracked = request?.headers.get("cookie")?.split(/;\s*/).includes(`${UNTRACKED_COOKIE}=1`);
    // Successful admin calls stay out of analytics; failed ones are always recorded, so attacks on the admin API leave a trace.
    const admin = request ? new URL(request.url).pathname.startsWith("/api/super-admin") : false;
    if (request && (!untracked || response.status >= 400) && (!admin || response.status >= 400)) {
      // A blocked request (sign-in, permission, origin, size or rate limit) is a security event: keep its code and
      // where it came from, for the Super Admin Security page. Pruned with other request events after 90 days.
      const security = SECURITY_STATUSES.has(response.status) || (!!code && SECURITY_CODES.has(code));
      const details = security
        ? { request_id: requestId, ...visitIds(request), security: true, code: code ?? String(response.status), ip: clientIp(request), ua: (request.headers.get("user-agent") ?? "").slice(0, 160) }
        : { request_id: requestId, ...visitIds(request) };
      const event = { kind: "request", action: request.method, resource: new URL(request.url).pathname, status: response.status, duration_ms: Math.round(performance.now() - started), details };
      // Never log query strings, other cookies, request bodies or authorization headers.
      try { after(() => recordEvent(event)); } catch { /* No request context in direct unit tests. */ }
    }
    return response;
  }
  try { const response = await withRequestCache(action); response.headers.set("Cache-Control", "private, no-store"); return monitor(response); }
  catch (error) {
    const status = error instanceof HttpError ? error.status : error instanceof ZodError ? 400 : error instanceof Error && error.message.startsWith("CONFIG:") ? 503 : 500;
    const code = error instanceof HttpError ? error.code : error instanceof ZodError ? "invalid_request" : status === 503 ? "setup_required" : "service_error";
    // A 500 with no route and no message is not diagnosable. The pathname and
    // the error's own message are safe to log; the rule above still holds, so
    // no query string, cookie, body or authorization header goes near this.
    if (status >= 500) console.error(JSON.stringify({ event: "api_error", code, request_id: requestId,
      route: request ? new URL(request.url).pathname : undefined,
      errorType: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : undefined }));
    return monitor(Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } }), code);
  }
}
