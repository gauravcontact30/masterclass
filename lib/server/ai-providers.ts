import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { monitorAi, recordFallback } from "./ai-monitoring";
import { databaseConfigured } from "./config";
import { stripCompletionCitations } from "@/lib/strip-citations";

/**
 * One completion interface over the models that can write learning content.
 *
 * Anthropic answers from the model alone. Perplexity searches the web first and
 * returns the pages it used, which is why it is worth having for anything
 * version-sensitive: release notes, deprecations, "what changed in v16".
 * OpenRouter, Portkey and Vercel AI Gateway are routers: one key reaches many
 * vendors, with the router's own fallbacks, caching and spend tracking. OpenAI,
 * Gemini, Groq, Mistral and DeepSeek are direct keys for teams that have them.
 *
 * Every caller receives the same shape, so a feature only chooses a provider —
 * it never learns a second API. The app shows no citations or source lists, so
 * every provider is told not to write them and any that slip through are
 * stripped before the text reaches a caller.
 */
export const AI_PROVIDERS = ["anthropic", "perplexity", "openrouter", "gateway", "portkey", "openai", "gemini", "groq", "mistral", "deepseek"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];
export type ProviderMessage = { role: "user" | "assistant"; content: string };
export type ProviderCompletion = { text: string; provider: AiProvider; model: string; truncated?: boolean };
/**
 * Per-call overrides. `model` lets a feature pin its own model (the study tutor
 * has STUDY_CHAT_MODEL), `allowTruncated` returns a cut-off answer instead of
 * throwing — a chat reply is still useful mid-sentence, a JSON page is not —
 * and `timeoutMs` shortens the wait for anything a person is sitting in front of.
 */
export type CompleteOptions = { model?: string; allowTruncated?: boolean; timeoutMs?: number };

/**
 * The providers that speak the OpenAI chat-completions dialect, as data. Each
 * names its endpoint, the env vars holding its key and model, and anything its
 * API does differently. A model default exists only where the provider
 * publishes a stable alias; elsewhere the deployment must name one, because a
 * guessed model id fails on every call.
 */
type CompatibleProvider = Exclude<AiProvider, "anthropic" | "gateway">;
type CompatibleSpec = {
  endpoint: string; keyEnv: string; modelEnv: string; defaultModel?: string;
  /** Request headers carrying the credential; Bearer unless the provider says otherwise. */
  auth?: (key: string) => Record<string, string>;
  /** Extra body fields, e.g. OpenRouter's opt-in for per-call cost in `usage`. */
  body?: Record<string, unknown>;
  /** OpenAI's current models take max_completion_tokens and reject a custom temperature. */
  openAiLimits?: boolean;
};
const COMPATIBLE: Record<CompatibleProvider, CompatibleSpec> = {
  perplexity: { endpoint: "https://api.perplexity.ai/chat/completions", keyEnv: "PERPLEXITY_API_KEY", modelEnv: "PERPLEXITY_MODEL", defaultModel: "sonar" },
  // openrouter/auto lets OpenRouter pick a model per prompt; pin one with OPENROUTER_MODEL.
  openrouter: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions", keyEnv: "OPENROUTER_API_KEY", modelEnv: "OPENROUTER_MODEL", defaultModel: "openrouter/auto",
    auth: key => ({ Authorization: `Bearer ${key}`, "X-Title": "MasterClass", ...(process.env.APP_URL ? { "HTTP-Referer": process.env.APP_URL } : {}) }),
    body: { usage: { include: true } },
  },
  // PORTKEY_MODEL is a Model Catalog id such as "@openai-prod/gpt-5"; a saved config
  // (fallbacks, caching, guardrails) or a legacy virtual key can be layered on.
  portkey: {
    endpoint: "https://api.portkey.ai/v1/chat/completions", keyEnv: "PORTKEY_API_KEY", modelEnv: "PORTKEY_MODEL",
    auth: key => ({ "x-portkey-api-key": key, ...(process.env.PORTKEY_CONFIG ? { "x-portkey-config": process.env.PORTKEY_CONFIG } : {}), ...(process.env.PORTKEY_VIRTUAL_KEY ? { "x-portkey-virtual-key": process.env.PORTKEY_VIRTUAL_KEY } : {}) }),
  },
  openai: { endpoint: "https://api.openai.com/v1/chat/completions", keyEnv: "OPENAI_API_KEY", modelEnv: "OPENAI_MODEL", openAiLimits: true },
  gemini: { endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", keyEnv: "GEMINI_API_KEY", modelEnv: "GEMINI_MODEL" },
  groq: { endpoint: "https://api.groq.com/openai/v1/chat/completions", keyEnv: "GROQ_API_KEY", modelEnv: "GROQ_MODEL" },
  mistral: { endpoint: "https://api.mistral.ai/v1/chat/completions", keyEnv: "MISTRAL_API_KEY", modelEnv: "MISTRAL_MODEL" },
  deepseek: { endpoint: "https://api.deepseek.com/chat/completions", keyEnv: "DEEPSEEK_API_KEY", modelEnv: "DEEPSEEK_MODEL", defaultModel: "deepseek-chat" },
};
/** Vercel AI Gateway model ids are "vendor/model"; override with AI_GATEWAY_MODEL. */
const GATEWAY_DEFAULT_MODEL = "anthropic/claude-sonnet-5";

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  anthropic: "Claude", perplexity: "Perplexity", openrouter: "OpenRouter", gateway: "Vercel AI Gateway", portkey: "Portkey",
  openai: "OpenAI", gemini: "Gemini", groq: "Groq", mistral: "Mistral", deepseek: "DeepSeek",
};
const set = (value?: string) => Boolean(value && !value.includes("xxx"));
const isCompatible = (provider: AiProvider): provider is CompatibleProvider => provider in COMPATIBLE;

export function providerModel(provider: AiProvider) {
  if (provider === "anthropic") return process.env.ANTHROPIC_MODEL ?? "";
  if (provider === "gateway") return process.env.AI_GATEWAY_MODEL || GATEWAY_DEFAULT_MODEL;
  const spec = COMPATIBLE[provider];
  return process.env[spec.modelEnv] || spec.defaultModel || "";
}

/** Whether answers from this provider arrive with the web pages they were grounded on. */
export function providerGrounded(provider: AiProvider) {
  return provider === "perplexity" || (provider === "openrouter" && providerModel("openrouter").endsWith(":online"));
}

/**
 * Paid generation needs credentials and, in production, the database-backed
 * limiter — the same policy for every provider.
 */
export function providerConfigured(provider: AiProvider) {
  if (!databaseConfigured() && process.env.NODE_ENV === "production") return false;
  if (provider === "anthropic") return set(process.env.ANTHROPIC_API_KEY) && set(process.env.ANTHROPIC_MODEL);
  // On Vercel the gateway authenticates with the deployment's OIDC token; elsewhere it needs a key.
  if (provider === "gateway") return set(process.env.AI_GATEWAY_API_KEY) || Boolean(process.env.VERCEL_OIDC_TOKEN);
  return set(process.env[COMPATIBLE[provider].keyEnv]) && Boolean(providerModel(provider));
}

export const availableProviders = (): AiProvider[] => AI_PROVIDERS.filter(providerConfigured);

/**
 * The provider a request without an explicit choice uses. Anthropic leads
 * because the prompts in this app were written and tuned against it; a
 * deployment with any other single key still works.
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

type CompatibleResponse = {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
};

async function completeCompatible(provider: CompatibleProvider, system: string, messages: ProviderMessage[], maxTokens: number, signal: AbortSignal | undefined, feature: string, options?: CompleteOptions): Promise<ProviderCompletion> {
  const spec = COMPATIBLE[provider];
  const model = options?.model || providerModel(provider);
  const key = process.env[spec.keyEnv] ?? "";
  const response = await monitorAi(feature, model, async () => {
    const result = await fetch(spec.endpoint, {
      method: "POST",
      headers: { ...(spec.auth ? spec.auth(key) : { Authorization: `Bearer ${key}` }), "Content-Type": "application/json" },
      body: JSON.stringify({
        model, ...(spec.openAiLimits ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens, temperature: 0.2 }),
        messages: [{ role: "system", content: system }, ...messages], ...spec.body,
      }),
      signal,
    });
    if (!result.ok) {
      // The body can carry a provider message; only the status reaches the caller.
      await result.text().catch(() => "");
      throw new ProviderError(provider, result.status);
    }
    const body = (await result.json()) as CompatibleResponse;
    // Normalised so monitoring records tokens the same way for every provider.
    return { ...body, usage: { input_tokens: body.usage?.prompt_tokens, output_tokens: body.usage?.completion_tokens, cost: body.usage?.cost } };
  }, provider);
  const choice = response.choices?.[0];
  const truncated = choice?.finish_reason === "length";
  if (truncated && !options?.allowTruncated) throw new Error("truncated");
  // The reasoning models emit their scratchpad first; it is not part of the answer.
  const text = (choice?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!text) throw new Error("empty_completion");
  return { text, provider, model, truncated };
}

/**
 * Vercel AI Gateway through the AI SDK. The SDK is ESM-only and loads on first
 * use, so no other route pays for it. A plain "vendor/model" string resolves
 * through the gateway, which brings its own provider fallbacks, spend limits
 * and observability in the Vercel dashboard.
 */
async function completeGateway(system: string, messages: ProviderMessage[], maxTokens: number, signal: AbortSignal | undefined, feature: string, options?: CompleteOptions): Promise<ProviderCompletion> {
  const model = options?.model || providerModel("gateway");
  const response = await monitorAi(feature, model, async () => {
    const { generateText } = await import("ai");
    try {
      const result = await generateText({ model, system, messages, maxOutputTokens: maxTokens, temperature: 0.2, maxRetries: 0, abortSignal: signal, ...(options?.timeoutMs ? { timeout: options.timeoutMs } : {}) });
      return { text: result.text, finishReason: result.finishReason, usage: { input_tokens: result.usage.inputTokens, output_tokens: result.usage.outputTokens } };
    } catch (failure) {
      // APICallError carries the HTTP status; surfacing it lets refusals fall back.
      const status = (failure as { statusCode?: unknown })?.statusCode;
      if (typeof status === "number") throw new ProviderError("gateway", status);
      throw failure;
    }
  }, "gateway");
  const truncated = response.finishReason === "length";
  if (truncated && !options?.allowTruncated) throw new Error("truncated");
  const text = response.text.trim();
  if (!text) throw new Error("empty_completion");
  return { text, provider: "gateway", model, truncated };
}

async function completeAnthropic(system: string, messages: ProviderMessage[], maxTokens: number, signal: AbortSignal | undefined, feature: string, options?: CompleteOptions): Promise<ProviderCompletion> {
  const model = options?.model || providerModel("anthropic");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: options?.timeoutMs ?? 75000, maxRetries: 0 });
  const response = await monitorAi(feature, model, () => client.messages.create({ model, max_tokens: maxTokens, system, messages }, { signal }), "anthropic");
  const truncated = response.stop_reason === "max_tokens";
  if (truncated && !options?.allowTruncated) throw new Error("truncated");
  const text = response.content.filter(block => block.type === "text").map(block => block.text).join("").trim();
  return { text, provider: "anthropic", model, truncated };
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
  if (failure instanceof ProviderError) return [400, 401, 402, 403, 404].includes(failure.status);
  return failure instanceof Anthropic.APIError && [400, 401, 403, 404].includes(failure.status ?? 0);
}
export function providerRateLimited(failure: unknown) {
  if (failure instanceof ProviderError) return failure.status === 429;
  return failure instanceof Anthropic.APIError && failure.status === 429;
}
const failureStatus = (failure: unknown) => failure instanceof ProviderError ? failure.status : failure instanceof Anthropic.APIError ? failure.status ?? null : null;

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
 * Each hop is recorded, so the super admin can see which provider keeps failing.
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
      await recordFallback(feature, candidate, failureStatus(failure));
    }
  }
  throw refusal;
}

/** Appended to every system prompt: the app never shows citations, footnotes or source lists. */
const NO_CITATIONS = "Never include citations, citation markers such as [1], footnotes, reference lists, Sources lines or source URLs in your answer.";

export async function completeWithProvider(provider: AiProvider, system: string, messages: ProviderMessage[], maxTokens: number, signal?: AbortSignal, feature = "mentor", options?: CompleteOptions): Promise<ProviderCompletion> {
  const completion = await completeRaw(provider, `${system}\n\n${NO_CITATIONS}`, messages, maxTokens, signal, feature, options);
  // Grounded models can still mark claims with "[1][5]"; the markers never reach a reader.
  return { ...completion, text: stripCompletionCitations(completion.text) };
}

async function completeRaw(provider: AiProvider, system: string, messages: ProviderMessage[], maxTokens: number, signal: AbortSignal | undefined, feature: string, options?: CompleteOptions): Promise<ProviderCompletion> {
  if (!providerConfigured(provider)) throw new Error(`provider_unconfigured:${provider}`);
  if (provider === "anthropic") return completeAnthropic(system, messages, maxTokens, signal, feature, options);
  if (provider === "gateway") return completeGateway(system, messages, maxTokens, signal, feature, options);
  // A plain fetch takes the signal directly; a per-call deadline is layered on it.
  const deadline = options?.timeoutMs
    ? AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(options.timeoutMs)])
    : signal;
  if (isCompatible(provider)) return completeCompatible(provider, system, messages, maxTokens, deadline, feature, options);
  throw new Error(`provider_unknown:${provider}`);
}
