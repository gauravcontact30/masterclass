/** @jest-environment node */
import { summarizeAiEvents, type AiEventRow } from "@/lib/ai-insights";

const call = (over: Partial<AiEventRow> & { details?: Record<string, unknown> }): AiEventRow => ({ created_at: "2026-09-20T10:00:00Z", resource: "mentor", action: "completion", status: 200, duration_ms: 1000, ...over, details: { provider: "anthropic", model: "claude-sonnet-5", input_tokens: 100, output_tokens: 50, ...over.details } });

test("an empty window says so instead of inventing findings", () => {
  const result = summarizeAiEvents([]);
  expect(result.totals.calls).toBe(0);
  expect(result.findings).toEqual(["No AI calls were recorded in this window."]);
});

test("calls are grouped by provider, model, feature and UTC day with percentiles and tokens", () => {
  const rows = [
    call({ duration_ms: 800 }), call({ duration_ms: "1200" }), call({ resource: "answer", duration_ms: 3000, details: { provider: "perplexity", model: "sonar" } }),
    call({ created_at: "2026-09-21T01:00:00Z", status: 429, duration_ms: 200, details: { provider: "perplexity", model: "sonar", input_tokens: undefined, output_tokens: undefined } }),
    call({ details: { provider: "openrouter", model: "openrouter/auto", cost_usd: 0.002 } }),
    { created_at: "2026-09-21T01:00:01Z", resource: "answer", action: "fallback", status: 429, duration_ms: null, details: { provider: "perplexity" } },
  ];
  const result = summarizeAiEvents(rows);
  expect(result.totals).toMatchObject({ calls: 5, failures: 1, fallbacks: 1, inputTokens: 400, outputTokens: 200, tokens: 600, costUsd: 0.002, costedCalls: 1 });
  expect(result.totals.p50).toBe(1000);
  // Equal call counts are broken by fallbacks, so the provider that keeps refusing surfaces first.
  expect(result.providers.map(item => item.key)).toEqual(["perplexity", "anthropic", "openrouter"]);
  const perplexity = result.providers.find(item => item.key === "perplexity")!;
  expect(perplexity).toMatchObject({ calls: 2, failures: 1, errorRate: 0.5, fallbacks: 1, costUsd: null });
  expect(result.models.map(item => item.key)).toContain("perplexity · sonar");
  expect(result.daily).toEqual([{ day: "2026-09-20", calls: 4, failures: 0, tokens: 600 }, { day: "2026-09-21", calls: 1, failures: 1, tokens: 0 }]);
  expect(result.errors).toEqual([{ status: 429, count: 1 }]);
  expect(result.slowest[0]).toMatchObject({ feature: "answer", provider: "perplexity", duration_ms: 3000 });
  expect(result.findings.some(item => item.includes("rate limited"))).toBe(true);
});

test("rows recorded before provider tracking count as Anthropic", () => {
  const result = summarizeAiEvents([{ created_at: "2026-09-01T00:00:00Z", resource: "curriculum", action: "completion", status: 200, duration_ms: 10, details: { model: "claude" } }]);
  expect(result.providers[0].key).toBe("anthropic");
});

test("a failing provider and a slow feature are called out", () => {
  const rows = [...Array(6)].map((_, i) => call({ resource: "lesson", duration_ms: 25000, status: i < 3 ? 500 : 200, details: { provider: "groq", model: "llama" } }));
  const findings = summarizeAiEvents(rows).findings.join(" ");
  expect(findings).toContain("groq fails 50%");
  expect(findings).toContain("lesson has a p95 latency of 25s");
});
