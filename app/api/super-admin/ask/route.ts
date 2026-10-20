import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { completeWithFallback, defaultProvider } from "@/lib/server/ai-providers";
import { analyticsSnapshot } from "@/lib/server/admin-metrics";
import { ADMIN_ASK_SYSTEM, askRequestSchema, parseAdminAnswer, type AdminAnswer } from "@/lib/admin-ask";

export const maxDuration = 60;

/** Super Admin "Ask your data": a question in, an answer grounded in the aggregate snapshot out. */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const admin = await requireSuperAdmin();
    const input = askRequestSchema.parse(await jsonBody(request, 4000));
    await rateLimit(`admin-ask:${admin.id}`, 30, 3600);
    const provider = defaultProvider();
    if (!provider) throw new HttpError(503, "ai_unavailable");
    const snapshot = await analyticsSnapshot(input.days);
    const completion = await completeWithFallback(provider, ADMIN_ASK_SYSTEM,
      [{ role: "user", content: JSON.stringify({ question: input.question, snapshot }) }], 900, request.signal, "admin-ask", { timeoutMs: 40000 });
    const parsed = parseAdminAnswer(completion.text);
    if (!parsed) throw new HttpError(502, "invalid_ai_response");
    return Response.json({ ...parsed, question: input.question, days: input.days, model: completion.model, generatedAt: new Date().toISOString() } satisfies AdminAnswer);
  }, request);
}
