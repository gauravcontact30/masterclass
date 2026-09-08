import "server-only";
import { auth } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import { authConfigured } from "./config";
export class HttpError extends Error { constructor(public status: number, public code: string) { super(code); } }
export async function userId() {
  if (!authConfigured()) throw new HttpError(503, "setup_required");
  const { userId } = await auth();
  if (!userId) throw new HttpError(401, "signin_required");
  return userId;
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
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, "invalid_origin");
}
export async function api(action: () => Promise<Response>) {
  try { const response = await action(); response.headers.set("Cache-Control", "private, no-store"); return response; }
  catch (error) {
    const status = error instanceof HttpError ? error.status : error instanceof ZodError ? 400 : error instanceof Error && error.message.startsWith("CONFIG:") ? 503 : 500;
    const code = error instanceof HttpError ? error.code : error instanceof ZodError ? "invalid_request" : status === 503 ? "setup_required" : "service_error";
    if (status >= 500) console.error(JSON.stringify({ event: "api_error", code, errorType: error instanceof Error ? error.name : "unknown" }));
    return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
