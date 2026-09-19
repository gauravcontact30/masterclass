/** @jest-environment node */
import { AI_PROVIDERS, availableProviders, learningProvider, completeWithFallback, completeWithProvider, defaultProvider, providerConfigured, providerModel, providerRateLimited, providerRefused, resolveProvider } from "@/lib/server/ai-providers";

const ENV = { ...process.env };
const reply = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body, text: async () => JSON.stringify(body) });
const answer = (content: string, extra: Record<string, unknown> = {}) => reply({ choices: [{ message: { content }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 20 }, ...extra });

beforeEach(() => {
  process.env = { ...ENV, ANTHROPIC_API_KEY: "sk-ant-test", ANTHROPIC_MODEL: "claude-sonnet-5", PERPLEXITY_API_KEY: "pplx-test", PERPLEXITY_MODEL: "sonar" };
  global.fetch = jest.fn() as jest.Mock;
});
afterAll(() => { process.env = ENV; });

test("both providers are offered once configured, and placeholder keys do not count", () => {
  expect(AI_PROVIDERS).toEqual(["anthropic", "perplexity"]);
  expect(availableProviders()).toEqual(["anthropic", "perplexity"]);
  expect(defaultProvider()).toBe("anthropic");

  process.env.ANTHROPIC_API_KEY = "sk-ant-xxx";
  expect(providerConfigured("anthropic")).toBe(false);
  expect(availableProviders()).toEqual(["perplexity"]);
  // A Perplexity-only deployment still generates, with Perplexity as the default.
  expect(defaultProvider()).toBe("perplexity");

  delete process.env.PERPLEXITY_API_KEY;
  expect(availableProviders()).toEqual([]);
  expect(defaultProvider()).toBeNull();
});

test("learning content prefers Perplexity, and falls back the moment its key is gone", () => {
  // Anthropic leads app-wide, but study and search cards want the searched answer.
  expect(defaultProvider()).toBe("anthropic");
  expect(learningProvider()).toBe("perplexity");

  process.env.PERPLEXITY_API_KEY = "pplx-xxx";
  expect(learningProvider()).toBe("anthropic");
  delete process.env.ANTHROPIC_API_KEY;
  expect(learningProvider()).toBeNull();
});

test("a requested provider is honoured only when it is configured", () => {
  expect(resolveProvider("perplexity")).toBe("perplexity");
  expect(resolveProvider(undefined)).toBe("anthropic");
  expect(resolveProvider("gemini")).toBeNull();
  delete process.env.PERPLEXITY_API_KEY;
  expect(resolveProvider("perplexity")).toBeNull();
});

test("the Perplexity model defaults to sonar and honours the override", () => {
  expect(providerModel("perplexity")).toBe("sonar");
  process.env.PERPLEXITY_MODEL = "sonar-pro";
  expect(providerModel("perplexity")).toBe("sonar-pro");
  delete process.env.PERPLEXITY_MODEL;
  expect(providerModel("perplexity")).toBe("sonar");
});

test("a Perplexity completion sends a bearer-authenticated chat request and returns the answer with its sources", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(answer("Turbopack is the default bundler in Next.js 16.", {
    search_results: [{ url: "https://nextjs.org/docs/app/guides/upgrading/version-16" }, { url: "https://www.nextjs.org/blog" }, { url: "https://react.dev/blog" }],
  }));
  const result = await completeWithProvider("perplexity", "You write reference pages.", [{ role: "user", content: "What changed in Next.js 16?" }], 900, undefined, "api-reference");

  expect(result.provider).toBe("perplexity");
  expect(result.model).toBe("sonar");
  expect(result.text).toBe("Turbopack is the default bundler in Next.js 16.");
  // Hostnames only, de-duplicated and without www: provenance, never an outbound link.
  expect(result.sources).toEqual(["nextjs.org", "react.dev"]);

  const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(url).toBe("https://api.perplexity.ai/chat/completions");
  expect(init.method).toBe("POST");
  expect(init.headers.Authorization).toBe("Bearer pplx-test");
  const body = JSON.parse(init.body);
  expect(body.model).toBe("sonar");
  expect(body.max_tokens).toBe(900);
  expect(body.messages).toEqual([
    { role: "system", content: "You write reference pages." },
    { role: "user", content: "What changed in Next.js 16?" },
  ]);
});

test("citations are accepted when the response has no search_results", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(answer("Answer.", { citations: ["https://react.dev/reference/react/use", "not a url"] }));
  const result = await completeWithProvider("perplexity", "system", [{ role: "user", content: "q" }], 500);
  expect(result.sources).toEqual(["react.dev"]);
});

test("a reasoning model's scratchpad is removed before the answer is used", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(answer("<think>Let me search for the release notes.</think>\n{\"answer\":true}"));
  const result = await completeWithProvider("perplexity", "system", [{ role: "user", content: "q" }], 500);
  expect(result.text).toBe('{"answer":true}');
});

test("a truncated response raises the error the JSON repair path understands", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(reply({ choices: [{ message: { content: "{\"partial\":" }, finish_reason: "length" }] }));
  await expect(completeWithProvider("perplexity", "system", [{ role: "user", content: "q" }], 500)).rejects.toThrow("truncated");
});

test("an empty completion is a failure rather than an empty page", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(answer("   "));
  await expect(completeWithProvider("perplexity", "system", [{ role: "user", content: "q" }], 500)).rejects.toThrow("empty_completion");
});

test("provider errors are classified so a refusal and a rate limit are told apart", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(reply({ error: { message: "invalid model" } }, false, 400));
  const refused = await completeWithProvider("perplexity", "system", [{ role: "user", content: "q" }], 500).catch(error => error);
  expect(providerRefused(refused)).toBe(true);
  expect(providerRateLimited(refused)).toBe(false);

  (global.fetch as jest.Mock).mockResolvedValue(reply({}, false, 429));
  const limited = await completeWithProvider("perplexity", "system", [{ role: "user", content: "q" }], 500).catch(error => error);
  expect(providerRateLimited(limited)).toBe(true);
  expect(providerRefused(limited)).toBe(false);
  // A network failure is neither: it is worth retrying.
  expect(providerRefused(new TypeError("fetch failed"))).toBe(false);
  expect(providerRateLimited(new TypeError("fetch failed"))).toBe(false);
});

test("an unconfigured provider is refused before any request is made", async () => {
  delete process.env.PERPLEXITY_API_KEY;
  await expect(completeWithProvider("perplexity", "system", [{ role: "user", content: "q" }], 500)).rejects.toThrow("provider_unconfigured:perplexity");
  expect(global.fetch).not.toHaveBeenCalled();
});

test("a provider that is out of credit hands the request to the other one instead of failing", async () => {
  // A 400 from Anthropic is how an empty credit balance arrives. With a second
  // provider configured the learner must still get an answer.
  // The refusal has to be a real Anthropic.APIError, because that is what the
  // classifier recognises; a look-alike plain Error would not be retried.
  class FakeApiError extends Error { status = 400; }
  const create = jest.fn().mockRejectedValue(new FakeApiError("credit balance is too low"));
  jest.doMock("@anthropic-ai/sdk", () => ({ __esModule: true, default: class { messages = { create }; static APIError = FakeApiError; } }));
  jest.resetModules();
  const providers = await import("@/lib/server/ai-providers");
  (global.fetch as jest.Mock).mockResolvedValue(answer("Perplexity answered instead.", { search_results: [{ url: "https://nextjs.org/docs" }] }));

  const completion = await providers.completeWithFallback("anthropic", "system", [{ role: "user", content: "hi" }], 500);
  expect(completion.provider).toBe("perplexity");
  expect(completion.text).toBe("Perplexity answered instead.");
  expect(completion.sources).toEqual(["nextjs.org"]);
});

test("a fallback is only for a refusal: a malformed answer would fail the same way elsewhere", async () => {
  // An empty completion is the prompt's problem, so it must not burn a second
  // paid request on the other provider.
  (global.fetch as jest.Mock).mockResolvedValue(answer(""));
  await expect(completeWithFallback("perplexity", "system", [{ role: "user", content: "hi" }], 500)).rejects.toThrow("empty_completion");
  // Counting provider calls specifically: monitoring and the Anthropic SDK also use fetch.
  const asked = (global.fetch as jest.Mock).mock.calls.filter(([url]) => `${url}`.includes("api.perplexity.ai"));
  expect(asked).toHaveLength(1);
});

test("with no other provider configured, the refusal is what the caller sees", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401, json: async () => ({}), text: async () => "" });
  await expect(completeWithFallback("perplexity", "system", [{ role: "user", content: "hi" }], 500)).rejects.toThrow("perplexity_401");
});
