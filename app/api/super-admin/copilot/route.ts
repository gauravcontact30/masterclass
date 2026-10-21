import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { completeWithFallback, defaultProvider } from "@/lib/server/ai-providers";
import { pageSignals, pageTitle } from "@/lib/server/admin-page-signals";
import { copilotRequestSchema, copilotSystem, parseCopilot, type CopilotAnalysis } from "@/lib/admin-copilot";
import { isCopilotPage } from "@/lib/admin-pages";

export const maxDuration = 60;
const WINDOWS = [1, 7, 30, 90];
const headers = { "Cache-Control": "private, no-store" };

/** A page's database signals (KPIs, records needing attention, rule findings). No model call, so it is cheap. */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const url = new URL(request.url);
    const page = url.searchParams.get("page") ?? "";
    if (!isCopilotPage(page)) throw new HttpError(400, "unknown_page");
    const requested = Number(url.searchParams.get("days"));
    return Response.json(await pageSignals(page, WINDOWS.includes(requested) ? requested : 7), { headers });
  }, request);
}

/**
 * The page's AI analysis, or an answer to the admin's question about the page. Only the aggregate facts and KPIs go
 * to the model, never the record list. Without a model (or with an unusable reply) an analysis falls back to the rule
 * findings, labelled as such; a question needs a model.
 */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const admin = await requireSuperAdmin();
    const input = copilotRequestSchema.parse(await jsonBody(request, 4000));
    if (!isCopilotPage(input.page)) throw new HttpError(400, "unknown_page");
    await rateLimit(`admin-copilot:${admin.id}`, 60, 3600);
    const signals = await pageSignals(input.page, input.days);
    const generatedAt = new Date().toISOString();
    const provider = defaultProvider();
    if (provider) {
      try {
        const completion = await completeWithFallback(provider, copilotSystem(input.page, pageTitle(input.page), input.question),
          [{ role: "user", content: JSON.stringify({ ...(input.question ? { question: input.question } : {}), signals: { window: { days: input.days, timezone: "Asia/Kolkata" }, kpis: signals.kpis, ruleFindings: signals.findings, facts: signals.facts, capped: !!signals.capped } }) }],
          1400, request.signal, `admin-copilot-${input.page}`, { timeoutMs: 45000 });
        const parsed = parseCopilot(completion.text);
        if (parsed) return Response.json({ ...parsed, source: "ai", model: completion.model, generatedAt, question: input.question } satisfies CopilotAnalysis, { headers });
      } catch (failure) {
        if (request.signal.aborted) throw failure;
        console.error(JSON.stringify({ event: "admin_copilot_ai_failed", page: input.page, reason: failure instanceof Error ? failure.message.slice(0, 200) : "unknown" }));
      }
    }
    if (input.question) throw new HttpError(503, "ai_unavailable");
    const high = signals.findings.filter(f => f.severity === "high").length;
    const summary = signals.findings.length
      ? `${signals.findings.length} thing${signals.findings.length === 1 ? "" : "s"} on this page crossed a threshold in the last ${input.days} day${input.days === 1 ? "" : "s"}${high ? `, ${high} of them high priority` : ""}.`
      : `Nothing on this page crossed a threshold in the last ${input.days} day${input.days === 1 ? "" : "s"}.`;
    return Response.json({ summary, findings: signals.findings.slice(0, 5), actions: [], source: "rules", generatedAt } satisfies CopilotAnalysis, { headers });
  }, request);
}
