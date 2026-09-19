import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { monitorAi } from "./ai-monitoring";
import { databaseConfigured } from "./config";

/**
 * One completion interface over the models that can write learning content.
 *
 * Anthropic answers from the model alone. Perplexity searches the web first and
 * returns the pages it used, which is why it is worth having for anything
 * version-sensitive: release notes, deprecations, "what changed in v16".
 *
 * Every caller receives the same shape, so a feature only chooses a provider —
 * it never learns a second API. Citations come back as plain hostnames because
 * generated study content in this app never renders an outbound link.
 */
export const AI_PROVIDERS = ["anthropic", "perplexity"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];
export type ProviderMessage = { role: "user" | "assistant"; content: string };
export type ProviderCompletion = { text: string; provider: AiProvider; model: string; sources: string[]; truncated?: boolean };
/**
 * Per-call overrides. `model` lets a feature pin its own model (the study tutor
 * has STUDY_CHAT_MODEL), `allowTruncated` returns a cut-off answer instead of
 * throwing — a chat reply is still useful mid-sentence, a JSON page is not —
 * and `timeoutMs` shortens the wait for anything a person is sitting in front of.
 */
export type CompleteOptions = { model?: string; allowTruncated?: boolean; timeoutMs?: number };

const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";
/** Perplexity's search-grounded model family; sonar is the smallest and cheapest. */
const PERPLEXITY_DEFAULT_MODEL = "sonar";

export const PROVIDER_LABELS: Record<AiProvider, string> = { anthropic: "Claude", perplexity: "Perplexity" };
const set = (value?: string) => Boolean(value && !value.includes("xxx"));

export function providerModel(provider: AiProvider) {
  return provider === "perplexity" ? (process.env.PERPLEXITY_MODEL ?? PERPLEXITY_DEFAULT_MODEL) : (process.env.ANTHROPIC_MODEL ?? "");
}

/**
 * Paid generation needs credentials and, in production, the database-backed
 * limiter — the same policy for every provider.
 */
export function providerConfigured(provider: AiProvider) {
  if (!databaseConfigured() && process.env.NODE_ENV === "production") return false;
  if (provider === "perplexity") return set(process.env.PERPLEXITY_API_KEY) && Boolean(providerModel("perplexity"));
  return set(process.env.ANTHROPIC_API_KEY) && set(process.env.ANTHROPIC_MODEL);
}

export const availableProviders = (): AiProvider[] => AI_PROVIDERS.filter(providerConfigured);

/**
 * The provider a request without an explicit choice uses. Anthropic leads
 * because the prompts in this app were written and tuned against it; a
 * Perplexity-only deployment still works.
 */
export function defaultProvider(): AiProvider | null {
  return availableProviders()[0] ?? null;
}

/**
 * The provider for generated learning content: study cards, lessons, quizzes,
 * interview items, the tutor and searched answers.
 *
 * Perplexity leads here even though Anthropic is the app-wide default. Learning
 * content is where currency matters most (versions, deprecations, "what
 * changed"), and a search-grounded reply arrives with the pages it read, which
 * is what a card renders as provenance. An explicit choice from the provider
 * picker always wins over this; with no Perplexity key it falls straight back
 * to the default, so nothing depends on the key being set.
 */
export function learningProvider(): AiProvider | null {
  return providerConfigured("perplexity") ? "perplexity" : defaultProvider();
}

/** The provider to honour for a request, or null when it cannot be served. */
export function resolveProvider(requested?: string | null): AiProvider | null {
  if (!requested) return defaultProvider();
  const provider = AI_PROVIDERS.find(item => item === requested);
  return provider && providerConfigured(provider) ? provider : null;
}

/** Hostnames only: a source is provenance the learner can recognise, not a link. */
function hostnames(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const hosts = values.flatMap(value => {
    const url = typeof value === "string" ? value : typeof (value as { url?: unknown })?.url === "string" ? (value as { url: string }).url : "";
    try { return url ? [new URL(url).hostname.replace(/^www\./, "")] : []; } catch { return []; }
  });
  return [...new Set(hosts)].slice(0, 8);
}

type PerplexityResponse = {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  citations?: unknown;
  search_results?: unknown;
};

async function completePerplexity(system: string, messages: ProviderMessage[], maxTokens: number, signal: AbortSignal | undefined, feature: string, options?: CompleteOptions): Promise<ProviderCompletion> {
  const model = options?.model || providerModel("perplexity");
  const response = await monitorAi(feature, model, async () => {
    const result = await fetch(PERPLEXITY_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.2, messages: [{ role: "system", content: system }, ...messages] }),
      signal,
    });
    if (!result.ok) {
      // The body can carry a provider message; only the status reaches the caller.
      await result.text().catch(() => "");
      throw new ProviderError("perplexity", result.status);
    }
    const body = (await result.json()) as PerplexityResponse;
    // Normalised so monitoring records tokens the same way for every provider.
    return { ...body, usage: { input_tokens: body.usage?.prompt_tokens, output_tokens: body.usage?.completion_tokens } };
  });
  const choice = response.choices?.[0];
  const truncated = choice?.finish_reason === "length";
  if (truncated && !options?.allowTruncated) throw new Error("truncated");
  // The reasoning models emit their scratchpad first; it is not part of the answer.
  const text = (choice?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!text) throw new Error("empty_completion");
  return { text, provider: "perplexity", model, sources: hostnames(response.search_results ?? response.citations), truncated };
}

async function completeAnthropic(system: string, messages: ProviderMessage[], maxTokens: number, signal: AbortSignal | undefined, feature: string, options?: CompleteOptions): Promise<ProviderCompletion> {
  const model = options?.model || providerModel("anthropic");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: options?.timeoutMs ?? 75000, maxRetries: 0 });
  const response = await monitorAi(feature, model, () => client.messages.create({ model, max_tokens: maxTokens, system, messages }, { signal }));
  const truncated = response.stop_reason === "max_tokens";
  if (truncated && !options?.allowTruncated) throw new Error("truncated");
  const text = response.content.filter(block => block.type === "text").map(block => block.text).join("").trim();
  return { text, provider: "anthropic", model, sources: [], truncated };
}

/** A provider rejected the request; status is carried so callers can classify it. */
export class ProviderError extends Error {
  constructor(readonly provider: AiProvider, readonly status: number) {
    super(`${provider}_${status}`);
    this.name = "ProviderError";
  }
}

/** The status codes that mean "this provider will keep refusing", not "retry". */
export function providerRefused(failure: unknown) {
  if (failure instanceof ProviderError) return [400, 401, 403, 404].includes(failure.status);
  return failure instanceof Anthropic.APIError && [400, 401, 403, 404].includes(failure.status ?? 0);
}
export function providerRateLimited(failure: unknown) {
  if (failure instanceof ProviderError) return failure.status === 429;
  return failure instanceof Anthropic.APIError && failure.status === 429;
}

/**
 * Complete with `provider`, then with any other configured provider when that
 * one refuses outright or is rate limited.
 *
 * A deployment with two keys should not lose a feature because one account ran
 * out of credit or had its key revoked — that is a billing state, not a reason
 * to show the learner nothing. Only provider-level refusals are retried
 * elsewhere: a truncated or malformed answer is the prompt's problem and would
 * fail the same way on the next model. A pinned `model` belongs to the provider
 * it was chosen for, so it is dropped when falling back to a different one.
 */
export async function completeWithFallback(provider: AiProvider, system: string, messages: ProviderMessage[], maxTokens: number, signal?: AbortSignal, feature = "mentor", options?: CompleteOptions): Promise<ProviderCompletion> {
  const order = [provider, ...availableProviders().filter(item => item !== provider)];
  let refusal: unknown;
  for (const candidate of order) {
    try {
      return await completeWithProvider(candidate, system, messages, maxTokens, signal, feature, candidate === provider ? options : { ...options, model: undefined });
    } catch (failure) {
      if (signal?.aborted) throw failure;
      if (!providerRefused(failure) && !providerRateLimited(failure)) throw failure;
      refusal = failure;
      console.error(JSON.stringify({ event: "ai_provider_fallback", feature, from: candidate, reason: failure instanceof Error ? failure.message.slice(0, 120) : "unknown" }));
    }
  }
  throw refusal;
}

export async function completeWithProvider(provider: AiProvider, system: string, messages: ProviderMessage[], maxTokens: number, signal?: AbortSignal, feature = "mentor", options?: CompleteOptions): Promise<ProviderCompletion> {
  if (!providerConfigured(provider)) throw new Error(`provider_unconfigured:${provider}`);
  // Perplexity's fetch takes the signal directly; a per-call deadline is layered on it.
  const deadline = options?.timeoutMs && provider === "perplexity"
    ? AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(options.timeoutMs)])
    : signal;
  return provider === "perplexity"
    ? completePerplexity(system, messages, maxTokens, deadline, feature, options)
    : completeAnthropic(system, messages, maxTokens, signal, feature, options);
}
