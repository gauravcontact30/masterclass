/** @jest-environment node */
import type { StudyChatRequest } from "@/lib/study-chat";

const ENV = { ...process.env };
const load = async () => import("@/lib/server/study-chat");
const ask = (content = "Explain JavaScript closures"): StudyChatRequest => ({ mode: "study", messages: [{ role: "user", content }] });

const perplexityReply = (content: string, finish = "stop") => ({
  ok: true, status: 200,
  json: async () => ({ choices: [{ message: { content }, finish_reason: finish }], usage: {}, search_results: [{ url: "https://developer.mozilla.org/docs" }] }),
  text: async () => "",
});

beforeEach(() => {
  jest.resetModules();
  // The tutor needs the database for its shared public rate limit.
  process.env = { ...ENV, NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role-test" };
  for (const key of ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "STUDY_CHAT_MODEL", "PERPLEXITY_API_KEY", "PERPLEXITY_MODEL", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN"]) delete process.env[key];
  global.fetch = jest.fn() as jest.Mock;
});
afterAll(() => { process.env = ENV; });

test("the tutor answers through Perplexity, the same provider as the rest of the learning content", async () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  process.env.ANTHROPIC_MODEL = "claude-sonnet-5";
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  (global.fetch as jest.Mock).mockResolvedValue(perplexityReply("A closure is a function that keeps access to the scope it was created in."));

  const reply = await (await load()).answerStudyQuestion(ask());
  expect(reply.mode).toBe("ai");
  expect(reply.answer).toContain("keeps access to the scope");
  // Anthropic is configured too, but learning content prefers the searched answer.
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("https://api.perplexity.ai/chat/completions");
});

test("a truncated reply is kept and offers to continue, rather than falling back to the notes", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  (global.fetch as jest.Mock).mockResolvedValue(perplexityReply("A closure is a function that keeps", "length"));

  const reply = await (await load()).answerStudyQuestion(ask());
  expect(reply.mode).toBe("ai");
  expect(reply.answer).toContain("A closure is a function that keeps");
  expect(reply.answer).toContain("Ask me to continue for more detail.");
});

test("STUDY_CHAT_MODEL pins the tutor's model, but only while Anthropic is the one answering", async () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  process.env.ANTHROPIC_MODEL = "claude-opus-5";
  process.env.STUDY_CHAT_MODEL = "claude-haiku-4-5-20251001";
  const create = jest.fn().mockResolvedValue({ content: [{ type: "text", text: "A closure captures its scope." }], stop_reason: "end_turn" });
  jest.doMock("@anthropic-ai/sdk", () => ({ __esModule: true, default: class { messages = { create }; static APIError = class extends Error {}; } }));

  const reply = await (await load()).answerStudyQuestion(ask());
  expect(reply.mode).toBe("ai");
  expect(create.mock.calls[0][0].model).toBe("claude-haiku-4-5-20251001");
});

test("with no provider configured the tutor still answers from the app's own notes", async () => {
  const reply = await (await load()).answerStudyQuestion(ask("Explain JavaScript closures"));
  expect(reply.mode).toBe("notes");
  expect(reply.answer.length).toBeGreaterThan(0);
  expect(global.fetch).not.toHaveBeenCalled();
});

test("a provider failure degrades to the notes instead of erroring the chat", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429, json: async () => ({}), text: async () => "" });

  const reply = await (await load()).answerStudyQuestion(ask("Explain JavaScript closures"));
  expect(reply.mode).toBe("notes");
  expect(reply.answer.length).toBeGreaterThan(0);
});
