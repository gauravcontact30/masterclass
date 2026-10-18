import "server-only";
import { ZodError } from "zod";
import { authConfigured } from "./config";
import { supabaseServer } from "./auth";
import { after } from "next/server";
import { recordEvent } from "./monitoring";
import { UNTRACKED_COOKIE } from "./tracking-exclusions";
export class HttpError extends Error { constructor(public status: number, public code: string) { super(code); } }
export async function userId() {
  if (!authConfigured()) throw new HttpError(503, "setup_required");
  const { data } = await (await supabaseServer()).auth.getUser();
  if (!data.user) throw new HttpError(401, "signin_required");
  return data.user.id;
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
export async function api(action: () => Promise<Response>, request?: Request) {
  const started = performance.now();
  const requestId = crypto.randomUUID();
  function monitor(response: Response) {
    response.headers.set("X-Request-ID", requestId);
    // Opt out of successful-request analytics, but never let a client-set cookie hide security failures.
    const untracked = request?.headers.get("cookie")?.split(/;\s*/).includes(`${UNTRACKED_COOKIE}=1`);
    if (request && (!untracked || response.status >= 400) && !new URL(request.url).pathname.startsWith("/api/super-admin")) {
      const event = { kind: "request", action: request.method, resource: new URL(request.url).pathname, status: response.status, duration_ms: Math.round(performance.now() - started), details: { request_id: requestId } };
      // Never log query strings, cookies, request bodies or authorization headers.
      try { after(() => recordEvent(event)); } catch { /* No request context in direct unit tests. */ }
    }
    return response;
  }
  try { const response = await action(); response.headers.set("Cache-Control", "private, no-store"); return monitor(response); }
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
    return monitor(Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } }));
  }
}
