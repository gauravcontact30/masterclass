import { z } from "zod";
import { api, jsonBody, sameOrigin, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { db, check } from "@/lib/server/db";
import { AI_PROVIDERS, PROVIDER_LABELS, completeWithFallback, completeWithProvider, defaultProvider, learningProvider, providerConfigured, providerGrounded, providerModel, ProviderError } from "@/lib/server/ai-providers";
import { summarizeAiEvents, type AiEventRow } from "@/lib/ai-insights";


const PAGE = 1000;
/** Enough for a busy 90-day window; beyond this the response says the sample was capped. */
const MAX_ROWS = 20000;
const windowDays = (value: unknown) => [1, 7, 30, 90].includes(Number(value)) ? Number(value) : 30;

async function aiEvents(days: number) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const rows: AiEventRow[] = [];
  // PostgREST caps each response, so the window is read page by page.
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const page = check(await db().from("monitor_events").select("created_at,resource,action,status,duration_ms,details").eq("kind", "ai").gte("created_at", since).order("created_at", { ascending: false }).range(from, from + PAGE - 1)) as AiEventRow[] | null;
    rows.push(...(page ?? []));
    if (!page || page.length < PAGE) return { rows, capped: false };
  }
  return { rows, capped: true };
}

/** Which providers exist, which are configured and with what model. Credentials never leave the server. */
function providerStatus() {
  const fallback = defaultProvider(), learning = learningProvider();
  return AI_PROVIDERS.map(id => {
    const configured = providerConfigured(id);
    return { id, label: PROVIDER_LABELS[id], configured, model: configured ? providerModel(id) : null, grounded: configured && providerGrounded(id), isDefault: id === fallback, isLearning: id === learning };
  });
}

export async function GET(request: Request) { return api(async () => {
  await requireSuperAdmin();
  const days = windowDays(new URL(request.url).searchParams.get("days"));
  const { rows, capped } = await aiEvents(days);
  return Response.json({ generatedAt: new Date().toISOString(), days, capped, sampled: rows.length, insights: summarizeAiEvents(rows), providers: providerStatus() });
}, request); }

const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("probe"), provider: z.enum(AI_PROVIDERS) }).strict(),
  z.object({ action: z.literal("analyze"), days: z.number().int().optional() }).strict(),
]);

const ANALYST = `You are the reliability and cost analyst for MasterClass, an Indian learning app whose study features (tutor, search answers, lessons, quizzes, interview prep, API references) call several LLM providers.
You receive aggregated AI usage metrics for one reporting window: calls, failures, latency percentiles in milliseconds, tokens, provider-reported cost in USD, fallbacks between providers, HTTP error codes, and per-feature and per-model breakdowns. There is no user data.
Write 3 to 6 prioritised recommendations as a numbered list. Each item: one bold headline, then one or two sentences that cite the specific numbers behind it and name a concrete action (switch or pin a model, add a fallback provider, lower a max-token budget, cache a feature, investigate a key or credit balance). Do not invent numbers or features that are not in the data. If the data is too thin to judge, say so in one line.`;

export async function POST(request: Request) { return api(async () => {
  const admin = await requireSuperAdmin(); sameOrigin(request);
  await rateLimit(`super-admin-ai:${admin.id}`, 10, 60);
  const body = input.parse(await jsonBody(request, 2000));

  if (body.action === "probe") {
    if (!providerConfigured(body.provider)) throw new HttpError(409, "provider_unconfigured");
    const started = performance.now();
    try {
      const reply = await completeWithProvider(body.provider, "Reply with the single word OK.", [{ role: "user", content: "Health check." }], 16, undefined, "admin-probe", { timeoutMs: 20000, allowTruncated: true });
      return Response.json({ ok: true, provider: body.provider, model: reply.model, latencyMs: Math.round(performance.now() - started) });
    } catch (failure) {
      // Only a status or short code: provider bodies can echo request details.
      const reason = failure instanceof ProviderError ? `HTTP ${failure.status}` : failure instanceof Error ? failure.message.slice(0, 60) : "failed";
      return Response.json({ ok: false, provider: body.provider, latencyMs: Math.round(performance.now() - started), reason });
    }
  }

  const chosen = defaultProvider();
  if (!chosen) throw new HttpError(409, "provider_unconfigured");
  const days = windowDays(body.days);
  const { rows } = await aiEvents(days);
  const insights = summarizeAiEvents(rows);
  // The slowest-call list repeats what the breakdowns already say; leaving it out keeps the prompt small.
  const { slowest: _slowest, ...metrics } = insights; void _slowest;
  const reply = await completeWithFallback(chosen, ANALYST, [{ role: "user", content: `Reporting window: last ${days} days.\n${JSON.stringify(metrics)}` }], 900, request.signal, "admin-insights", { timeoutMs: 60000, allowTruncated: true });
  return Response.json({ analysis: reply.text, provider: reply.provider, label: PROVIDER_LABELS[reply.provider], model: reply.model, days });
}, request); }
