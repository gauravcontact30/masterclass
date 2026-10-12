/** @jest-environment node */
import { availableProviders, completeWithFallback, completeWithProvider, providerConfigured, providerGrounded, providerModel } from "@/lib/server/ai-providers";

const generateText = jest.fn();
// The AI SDK is ESM-only; the provider layer imports it lazily, so a mock stands in here.
jest.mock("ai", () => ({ generateText: (...args: unknown[]) => generateText(...args) }));

const ENV = { ...process.env };
const reply = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body, text: async () => JSON.stringify(body) });
const answer = (content: string, usage: Record<string, unknown> = { prompt_tokens: 10, completion_tokens: 20 }, message: Record<string, unknown> = {}) => reply({ choices: [{ message: { content, ...message }, finish_reason: "stop" }], usage });
const ONLY = ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "PERPLEXITY_API_KEY", "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "AI_GATEWAY_API_KEY", "AI_GATEWAY_MODEL", "VERCEL_OIDC_TOKEN", "PORTKEY_API_KEY", "PORTKEY_MODEL", "PORTKEY_CONFIG", "OPENAI_API_KEY", "OPENAI_MODEL", "GEMINI_API_KEY", "GEMINI_MODEL", "GROQ_API_KEY", "GROQ_MODEL", "MISTRAL_API_KEY", "MISTRAL_MODEL", "DEEPSEEK_API_KEY", "DEEPSEEK_MODEL"];
const providerCalls = () => (global.fetch as jest.Mock).mock.calls.filter(([url]) => !String(url).includes("supabase"));

beforeEach(() => {
  process.env = { ...ENV };
  for (const key of ONLY) delete process.env[key];
  global.fetch = jest.fn() as jest.Mock;
  generateText.mockReset();
});
afterAll(() => { process.env = ENV; });

test("routers and direct keys are offered only once configured, in a stable order", () => {
  expect(availableProviders()).toEqual([]);
  process.env.OPENROUTER_API_KEY = "sk-or-test";
  process.env.GROQ_API_KEY = "gsk-test";
  // Groq publishes no stable alias, so it needs a model before it counts.
  expect(availableProviders()).toEqual(["openrouter"]);
  process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
  process.env.AI_GATEWAY_API_KEY = "vck-test";
  expect(availableProviders()).toEqual(["openrouter", "gateway", "groq"]);
  expect(providerModel("openrouter")).toBe("openrouter/auto");
  expect(providerModel("gateway")).toBe("anthropic/claude-sonnet-5");
  // Placeholder keys never count.
  process.env.OPENAI_API_KEY = "sk-xxx"; process.env.OPENAI_MODEL = "gpt-5";
  expect(providerConfigured("openai")).toBe(false);
});

test("the gateway also authenticates with a Vercel OIDC token", () => {
  process.env.VERCEL_OIDC_TOKEN = "oidc";
  expect(providerConfigured("gateway")).toBe(true);
});

test("OpenRouter sends attribution headers, opts in to cost, and reports it", async () => {
  process.env.OPENROUTER_API_KEY = "sk-or-test"; process.env.APP_URL = "https://masterclass.example";
  (global.fetch as jest.Mock).mockResolvedValue(answer("Closures keep their scope.", { prompt_tokens: 5, completion_tokens: 7, cost: 0.0012 }, { annotations: [{ url_citation: { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures" } }] }));
  const result = await completeWithProvider("openrouter", "Explain.", [{ role: "user", content: "Closures?" }], 300, undefined, "mentor");
  expect(result).toMatchObject({ provider: "openrouter", model: "openrouter/auto", text: "Closures keep their scope." });
  // Citation annotations are dropped: the app never shows sources.
  expect(result).not.toHaveProperty("sources");
  const [url, init] = providerCalls()[0];
  expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect(init.headers).toMatchObject({ Authorization: "Bearer sk-or-test", "X-Title": "MasterClass", "HTTP-Referer": "https://masterclass.example" });
  expect(JSON.parse(init.body)).toMatchObject({ model: "openrouter/auto", max_tokens: 300, usage: { include: true } });
});

test("an :online OpenRouter model is advertised as grounded", () => {
  process.env.OPENROUTER_API_KEY = "sk-or-test";
  expect(providerGrounded("openrouter")).toBe(false);
  process.env.OPENROUTER_MODEL = "openai/gpt-5:online";
  expect(providerGrounded("openrouter")).toBe(true);
});

test("Portkey authenticates with its own header and forwards a saved config", async () => {
  process.env.PORTKEY_API_KEY = "pk-test"; process.env.PORTKEY_MODEL = "@openai-prod/gpt-5"; process.env.PORTKEY_CONFIG = "pc-fallbacks";
  (global.fetch as jest.Mock).mockResolvedValue(answer("OK"));
  await completeWithProvider("portkey", "s", [{ role: "user", content: "u" }], 50);
  const [url, init] = providerCalls()[0];
  expect(url).toBe("https://api.portkey.ai/v1/chat/completions");
  expect(init.headers["x-portkey-api-key"]).toBe("pk-test");
  expect(init.headers["x-portkey-config"]).toBe("pc-fallbacks");
  expect(init.headers.Authorization).toBeUndefined();
  expect(JSON.parse(init.body).model).toBe("@openai-prod/gpt-5");
});

test("OpenAI gets max_completion_tokens and no custom temperature", async () => {
  process.env.OPENAI_API_KEY = "sk-test"; process.env.OPENAI_MODEL = "gpt-5";
  (global.fetch as jest.Mock).mockResolvedValue(answer("OK"));
  await completeWithProvider("openai", "s", [{ role: "user", content: "u" }], 64);
  const body = JSON.parse(providerCalls()[0][1].body);
  expect(body.max_completion_tokens).toBe(64);
  expect(body.max_tokens).toBeUndefined();
  expect(body.temperature).toBeUndefined();
});

test("Vercel AI Gateway goes through the AI SDK with a vendor/model string", async () => {
  process.env.AI_GATEWAY_API_KEY = "vck-test";
  generateText.mockResolvedValue({ text: " Hooks run after render. ", finishReason: "stop", usage: { inputTokens: 3, outputTokens: 4 } });
  const result = await completeWithProvider("gateway", "Explain.", [{ role: "user", content: "useEffect?" }], 200, undefined, "mentor", { timeoutMs: 5000 });
  expect(result).toEqual({ text: "Hooks run after render.", provider: "gateway", model: "anthropic/claude-sonnet-5", truncated: false });
  expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ model: "anthropic/claude-sonnet-5", system: expect.stringMatching(/^Explain\.[\s\S]*Never include citations/), maxOutputTokens: 200, maxRetries: 0, timeout: 5000 }));
});

test("a gateway refusal falls back to the next configured provider", async () => {
  process.env.AI_GATEWAY_API_KEY = "vck-test"; process.env.OPENROUTER_API_KEY = "sk-or-test";
  generateText.mockRejectedValue(Object.assign(new Error("Insufficient credit"), { statusCode: 402 }));
  (global.fetch as jest.Mock).mockResolvedValue(answer("From OpenRouter."));
  const result = await completeWithFallback("gateway", "s", [{ role: "user", content: "u" }], 50);
  expect(result.provider).toBe("openrouter");
  expect(result.text).toBe("From OpenRouter.");
});
