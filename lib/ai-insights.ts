/**
 * Aggregates for the super admin AI analytics, computed from raw `monitor_events`
 * rows of kind "ai". Pure, so it is tested without a database and can run on
 * any row source. Rows written before provider tracking was added carry no
 * provider; they count as Anthropic, the only provider that existed then.
 */
export type AiEventRow = { created_at: string; resource: string | null; action: string; status: number | null; duration_ms: number | string | null; details: Record<string, unknown> | null };

export type AiBreakdown = { key: string; calls: number; failures: number; errorRate: number; p50: number | null; p95: number | null; inputTokens: number; outputTokens: number; costUsd: number | null; fallbacks: number };
export type AiDay = { day: string; calls: number; failures: number; tokens: number };
export type AiInsights = {
  totals: AiBreakdown & { tokens: number; costedCalls: number };
  providers: AiBreakdown[]; models: AiBreakdown[]; features: AiBreakdown[];
  daily: AiDay[]; errors: { status: number; count: number }[];
  slowest: { created_at: string; feature: string; provider: string; model: string; duration_ms: number; status: number }[];
  findings: string[];
};

const num = (value: unknown) => { const n = typeof value === "string" ? Number(value) : value; return typeof n === "number" && Number.isFinite(n) ? n : 0; };
const text = (value: unknown, fallback: string) => typeof value === "string" && value ? value : fallback;
function percentile(sorted: number[], p: number) {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return Math.round(sorted[index]);
}

type Bucket = { calls: number; failures: number; latencies: number[]; input: number; output: number; cost: number; costed: number; fallbacks: number };
const empty = (): Bucket => ({ calls: 0, failures: 0, latencies: [], input: 0, output: 0, cost: 0, costed: 0, fallbacks: 0 });
function finish(key: string, bucket: Bucket): AiBreakdown {
  const sorted = [...bucket.latencies].sort((a, b) => a - b);
  return {
    key, calls: bucket.calls, failures: bucket.failures, errorRate: bucket.calls ? bucket.failures / bucket.calls : 0,
    p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95), inputTokens: bucket.input, outputTokens: bucket.output,
    costUsd: bucket.costed ? Math.round(bucket.cost * 10000) / 10000 : null, fallbacks: bucket.fallbacks,
  };
}

export function summarizeAiEvents(rows: AiEventRow[]): AiInsights {
  const total = empty();
  const groups = { providers: new Map<string, Bucket>(), models: new Map<string, Bucket>(), features: new Map<string, Bucket>() };
  const days = new Map<string, AiDay>();
  const errors = new Map<number, number>();
  const completions: AiInsights["slowest"] = [];
  const bucket = (map: Map<string, Bucket>, key: string) => { let b = map.get(key); if (!b) map.set(key, b = empty()); return b; };

  for (const row of rows) {
    const details = row.details ?? {};
    const provider = text(details.provider, "anthropic");
    const feature = text(row.resource, "unknown");
    const status = num(row.status) || 200;
    if (row.action === "fallback") {
      total.fallbacks++;
      bucket(groups.providers, provider).fallbacks++;
      bucket(groups.features, feature).fallbacks++;
      continue;
    }
    const model = text(details.model, "unknown");
    const failed = status >= 400;
    const latency = num(row.duration_ms);
    const input = num(details.input_tokens), output = num(details.output_tokens);
    const cost = typeof details.cost_usd === "number" ? details.cost_usd : null;
    for (const b of [total, bucket(groups.providers, provider), bucket(groups.models, `${provider} · ${model}`), bucket(groups.features, feature)]) {
      b.calls++; if (failed) b.failures++; if (latency) b.latencies.push(latency);
      b.input += input; b.output += output; if (cost !== null) { b.cost += cost; b.costed++; }
    }
    if (failed) errors.set(status, (errors.get(status) ?? 0) + 1);
    const day = row.created_at.slice(0, 10);
    const entry = days.get(day) ?? { day, calls: 0, failures: 0, tokens: 0 };
    entry.calls++; if (failed) entry.failures++; entry.tokens += input + output;
    days.set(day, entry);
    completions.push({ created_at: row.created_at, feature, provider, model, duration_ms: latency, status });
  }

  const ranked = (map: Map<string, Bucket>) => [...map].map(([key, b]) => finish(key, b)).sort((a, b) => b.calls - a.calls || b.fallbacks - a.fallbacks);
  const summary = finish("all", total);
  const insights: AiInsights = {
    totals: { ...summary, tokens: total.input + total.output, costedCalls: total.costed },
    providers: ranked(groups.providers), models: ranked(groups.models), features: ranked(groups.features),
    daily: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
    errors: [...errors].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    slowest: completions.sort((a, b) => b.duration_ms - a.duration_ms).slice(0, 10),
    findings: [],
  };
  insights.findings = findings(insights);
  return insights;
}

/**
 * Plain-language observations that need no model: thresholds an operator
 * would check by eye. The "Analyze with AI" action goes further; these are
 * always available, even with no provider configured.
 */
function findings({ totals, providers, features, errors }: AiInsights): string[] {
  const out: string[] = [];
  if (!totals.calls && !totals.fallbacks) return ["No AI calls were recorded in this window."];
  const pct = (value: number) => `${Math.round(value * 100)}%`;
  if (totals.errorRate >= 0.05) out.push(`${pct(totals.errorRate)} of AI calls failed in this window; investigate before learners notice.`);
  for (const provider of providers) {
    if (provider.calls >= 5 && provider.errorRate >= 0.2) out.push(`${provider.key} fails ${pct(provider.errorRate)} of its calls; check its key, credit balance and model id.`);
    if (provider.fallbacks >= 3) out.push(`${provider.key} handed ${provider.fallbacks} requests to another provider after refusing or rate limiting.`);
  }
  const rateLimited = errors.find(item => item.status === 429);
  if (rateLimited) out.push(`${rateLimited.count} calls were rate limited (429); consider a higher tier or spreading load across providers.`);
  const slow = features.filter(item => item.calls >= 5 && (item.p95 ?? 0) > 20000);
  for (const feature of slow) out.push(`${feature.key} has a p95 latency of ${Math.round((feature.p95 ?? 0) / 1000)}s; a faster model or a smaller max-token budget would help.`);
  const heavy = [...features].sort((a, b) => (b.outputTokens + b.inputTokens) - (a.outputTokens + a.inputTokens))[0];
  if (heavy && totals.tokens && (heavy.inputTokens + heavy.outputTokens) / totals.tokens >= 0.5 && features.length > 1) out.push(`${heavy.key} uses ${pct((heavy.inputTokens + heavy.outputTokens) / totals.tokens)} of all tokens.`);
  if (!out.length) out.push("AI traffic looks healthy: failure rate, fallbacks and latency are within normal ranges.");
  return out;
}
