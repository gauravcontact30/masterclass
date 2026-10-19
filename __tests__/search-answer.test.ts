/** @jest-environment node */
import { searchAnswerSchema } from "@/lib/pro-learn/types";

jest.mock("@/lib/redis", () => ({ cacheGet: jest.fn().mockResolvedValue(null), cacheSet: jest.fn().mockResolvedValue(undefined) }));

const ENV = { ...process.env };
const load = async () => import("@/lib/server/pro-learn-ai");
const answer = {
  headline: "Run next upgrade, then fix what it reports.",
  summary: "Next.js 16.1 and later ship an upgrade command that raises the packages and applies the mechanical codemods.",
  steps: [
    { title: "Record a baseline", detail: "Capture versions, a passing test run and a successful build first.", code: "npm test && npm run build" },
    { title: "Run the codemod", detail: "Raise the packages and apply the mechanical rewrites.", code: "npx next upgrade" },
  ],
  definition: "next upgrade is the first-party codemod runner for a Next.js major release.",
  alternatives: [{ title: "Upgrade by hand", detail: "Raise each dependency yourself.", when: "A monorepo pins versions centrally." }],
  useCases: [{ title: "A weekly release train", scenario: "40 routes and no week to freeze.", example: "git switch -c upgrade/next-16" }],
  files: [{ path: "/app/page.tsx", code: "export default function Page() { return <h1>Hi</h1>; }", note: "The home route." }],
  keyPoints: ["Turbopack is the default bundler."], caveats: ["A green typecheck proves nothing about a form."], followUps: ["What changed in next/image?"],
};
const perplexityReply = (content: unknown) => ({
  ok: true, status: 200,
  json: async () => ({ choices: [{ message: { content: JSON.stringify(content) }, finish_reason: "stop" }], usage: {}, search_results: [{ url: "https://nextjs.org/docs" }] }),
  text: async () => "",
});

beforeEach(() => {
  process.env = { ...ENV };
  for (const key of Object.keys(process.env)) if (key.endsWith("_API_KEY") || key === "VERCEL_OIDC_TOKEN") delete process.env[key];
  global.fetch = jest.fn() as jest.Mock;
});
afterAll(() => { process.env = ENV; });

test("the answer shape is what the card renders: definition, ordered steps, alternatives, use cases and files", () => {
  const parsed = searchAnswerSchema.parse(answer);
  expect(parsed.steps.length).toBeGreaterThanOrEqual(2);
  expect(parsed.definition).toContain("codemod runner");
  expect(parsed.alternatives[0].when).toBe("A monorepo pins versions centrally.");
  expect(parsed.useCases[0].example).toBe("git switch -c upgrade/next-16");
  expect(parsed.files[0]).toEqual({ path: "/app/page.tsx", code: "export default function Page() { return <h1>Hi</h1>; }", note: "The home route." });
  expect(searchAnswerSchema.safeParse({ ...answer, steps: [answer.steps[0]] }).success).toBe(false);
  // Every card section defaults rather than being required of the model, so a
  // terser reply still renders instead of failing validation.
  const minimal = searchAnswerSchema.parse({ headline: answer.headline, summary: answer.summary, steps: answer.steps });
  expect(minimal).toMatchObject({ definition: "", keyPoints: [], alternatives: [], useCases: [], files: [] });
});

test("the library is searched whether or not a model answers", async () => {
  const { libraryMatches, searchAnswer } = await load();
  const matches = libraryMatches("turbopack bundler");
  expect(matches.length).toBeGreaterThan(0);
  expect(matches[0]).toHaveProperty("title");
  expect(matches[0]).toHaveProperty("description");

  const result = await searchAnswer("turbopack bundler");
  expect(result.answer).toBeNull();
  expect(result.source).toBe("library");
  expect(result.reason).toBe("ai_unavailable");
  expect(result.matches.length).toBeGreaterThan(0);
  expect(global.fetch).not.toHaveBeenCalled();
});

test("Perplexity is preferred for search, and provider citations stay out of the learner response", async () => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  process.env.ANTHROPIC_MODEL = "claude-sonnet-5";
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  (global.fetch as jest.Mock).mockResolvedValue(perplexityReply(answer));

  const result = await (await load()).searchAnswer("How do I upgrade to Next.js 16?");
  // Anthropic is the default provider elsewhere; a searched answer wants the web.
  expect(result.provider).toBe("perplexity");
  expect(result.source).toBe("ai");
  expect(result.answer!.steps).toHaveLength(2);
  expect(result).not.toHaveProperty("sources");
  expect(result.matches).toBeDefined();
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("https://api.perplexity.ai/chat/completions");
});

test("AI Mode off answers from the library without spending a provider call", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  const result = await (await load()).searchAnswer("turbopack bundler", undefined, undefined, false);
  expect(result.answer).toBeNull();
  expect(result.reason).toBe("ai_mode_off");
  expect(result.matches.length).toBeGreaterThan(0);
  expect(global.fetch).not.toHaveBeenCalled();
});

test("a provider failure degrades to the library instead of erroring the page", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429, json: async () => ({}), text: async () => "" });
  const result = await (await load()).searchAnswer("How do I upgrade to Next.js 16?");
  expect(result.answer).toBeNull();
  expect(result.reason).toBe("ai_rate_limited");
  expect(result.matches).toBeDefined();
});
