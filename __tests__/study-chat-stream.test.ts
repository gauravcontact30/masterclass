/** @jest-environment node */
import type { StudyChatEvent, StudyChatRequest } from "@/lib/study-chat";

const ENV = { ...process.env };
const load = async () => import("@/lib/server/study-chat");
const ask = (extra: Partial<StudyChatRequest> = {}): StudyChatRequest => ({ mode: "study", messages: [{ role: "user", content: "Explain JavaScript closures" }], stream: true, ...extra });

/** A provider's server-sent-event reply, one data line per piece. */
const sse = (pieces: string[], finish = "stop") => new Response(
  [...pieces.map(content => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`), `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finish }] })}\n\n`, "data: [DONE]\n\n"].join(""),
  { status: 200, headers: { "Content-Type": "text/event-stream" } },
);
async function events(stream: ReadableStream<Uint8Array>) {
  const text = await new Response(stream).text();
  return text.split("\n").filter(Boolean).map(line => JSON.parse(line) as StudyChatEvent);
}
const deltas = (list: StudyChatEvent[]) => list.filter(e => e.type === "delta").map(e => (e as { text: string }).text);

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ENV, NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-role-test" };
  for (const key of ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "STUDY_CHAT_MODEL", "PERPLEXITY_API_KEY", "PERPLEXITY_MODEL", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "DEEPSEEK_API_KEY", "OPENROUTER_API_KEY"]) delete process.env[key];
  global.fetch = jest.fn() as jest.Mock;
});
afterAll(() => { process.env = ENV; });

test("streams the answer piece by piece, then the final cleaned answer", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  (global.fetch as jest.Mock).mockResolvedValue(sse(["<think>plan</think>A closure ", "keeps its scope[1]", ". Example: a counter."]));
  const list = await events((await load()).streamStudyAnswer(ask()));
  expect(list[0]).toMatchObject({ type: "meta" });
  // The reasoning block and the citation marker never reach the reader, even mid-stream.
  expect(deltas(list).join("")).toBe("A closure keeps its scope. Example: a counter.");
  expect(list.at(-1)).toEqual({ type: "done", answer: "A closure keeps its scope. Example: a counter.", mode: "ai", truncated: false });
  const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
  expect(body.stream).toBe(true);
});

test("the page being read and the Hindi reading language reach the tutor as context", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  (global.fetch as jest.Mock).mockResolvedValue(sse(["ठीक है"]));
  await events((await load()).streamStudyAnswer(ask({ page: { path: "/learning/workflow", title: "Workflow blueprints" }, language: "hi" })));
  const system = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).messages[0].content as string;
  expect(system).toContain('"Workflow blueprints" (/learning/workflow)');
  expect(system).toContain("answer in clear, simple Hindi");
});

test("a provider that refuses before writing anything hands over to the next one", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  process.env.DEEPSEEK_API_KEY = "ds-test";
  // Monitoring writes go through fetch too; answer each URL on its own terms.
  (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
    url.includes("perplexity") ? new Response("no credit", { status: 402 }) : url.includes("deepseek") ? sse(["From DeepSeek."]) : new Response("{}", { status: 201 }));
  const list = await events((await load()).streamStudyAnswer(ask()));
  expect((global.fetch as jest.Mock).mock.calls.map(call => call[0])).toContain("https://api.deepseek.com/chat/completions");
  expect(list.at(-1)).toMatchObject({ type: "done", answer: "From DeepSeek.", mode: "ai" });
});

test("a truncated reply is kept and offers to continue", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  (global.fetch as jest.Mock).mockResolvedValue(sse(["Closures are"], "length"));
  const list = await events((await load()).streamStudyAnswer(ask()));
  expect(list.at(-1)).toMatchObject({ type: "done", truncated: true, answer: "Closures are\n\nAsk me to continue for more detail." });
});

test("with no provider the stream still answers from the app's notes", async () => {
  const list = await events((await load()).streamStudyAnswer(ask()));
  expect(global.fetch).not.toHaveBeenCalled();
  expect(list.at(-1)).toMatchObject({ type: "done", mode: "notes" });
  expect(deltas(list).join("").length).toBeGreaterThan(20);
});

describe("visible stream text", () => {
  test("hides reasoning, citation markers and a half-arrived marker", async () => {
    const { visibleStreamText } = await import("@/lib/server/ai-providers");
    expect(visibleStreamText("<think>secret")).toBe("");
    expect(visibleStreamText("<think>x</think>Hello world[1].")).toBe("Hello world.");
    expect(visibleStreamText("Arrays [")).toBe("Arrays ");
    expect(visibleStreamText("Use arr[0] here")).toContain("arr[0]");
  });
});

describe("rate limits", () => {
  const request = (ua: string, ip = "203.0.113.7") => new Request("http://localhost/api/study-chat", { method: "POST", headers: { "x-forwarded-for": ip, "user-agent": ua } });
  test("a visitor cannot mint fresh allowances by rotating the User-Agent", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY; // local (in-memory) limiter
    const { limitStudyChat } = await load();
    for (let i = 0; i < 8; i++) await limitStudyChat(request(`agent-${i}`));
    await expect(limitStudyChat(request("agent-new"))).rejects.toMatchObject({ status: 429 });
    // Another network still has its own allowance.
    await expect(limitStudyChat(request("agent-new", "198.51.100.2"))).resolves.toBeUndefined();
  });
});
