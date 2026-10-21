/** @jest-environment node */
import { copilotSystem, parseCopilot } from "@/lib/admin-copilot";
import { COPILOT_META, COPILOT_PAGES, isCopilotPage } from "@/lib/admin-pages";

const NOW = Date.now();
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

/** A Supabase stand-in: every filter is accepted and each table resolves to its fixture rows (and their count). */
function fakeDb(tables: Record<string, unknown[]>) {
  return () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      for (const name of ["select", "eq", "gte", "lt", "in", "like", "or", "order", "limit"]) chain[name] = () => chain;
      chain.then = (resolve: (v: unknown) => void) => resolve({ data: tables[table] ?? [], count: (tables[table] ?? []).length, error: null });
      return chain;
    },
  });
}
const AI_KEYS = ["ANTHROPIC_API_KEY", "PERPLEXITY_API_KEY", "OPENROUTER_API_KEY", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "MISTRAL_API_KEY", "DEEPSEEK_API_KEY", "PORTKEY_API_KEY"];

test("every copilot page has a description, a focus list and suggested questions", () => {
  expect(COPILOT_PAGES).toHaveLength(13);
  for (const page of COPILOT_PAGES) {
    expect(COPILOT_META[page].description.length).toBeGreaterThan(40);
    expect(COPILOT_META[page].questions.length).toBeGreaterThanOrEqual(3);
  }
  expect(isCopilotPage("queue")).toBe(true);
  expect(isCopilotPage("notepad")).toBe(false);
});

test("a model reply is accepted only in the copilot shape, with page extras", () => {
  const good = parseCopilot('```json\n{"summary":"Queue is healthy.","findings":[{"severity":"low","title":"t","detail":"d"}],"actions":[],"triage":[{"ref":"R1","severity":"high","label":"Spam","reason":"Links only."}]}\n```');
  expect(good?.triage?.[0].ref).toBe("R1");
  expect(parseCopilot('{"summary":"x","findings":[{"severity":"urgent","title":"t","detail":"d"}]}')).toBeNull();
  expect(parseCopilot("not json")).toBeNull();
  expect(copilotSystem("moderation", "Moderation")).toContain('"triage"');
  expect(copilotSystem("announcements", "Announcements")).toContain('"draft"');
  expect(copilotSystem("queue", "Generation queue", "Is it ok?")).toContain('"answer"');
  expect(copilotSystem("queue", "Generation queue")).not.toContain('"answer"');
});

describe("page signals", () => {
  beforeEach(() => { jest.resetModules(); });
  const load = async (tables: Record<string, unknown[]>) => {
    jest.doMock("@/lib/server/db", () => ({ db: fakeDb(tables) }));
    jest.doMock("@/lib/server/runtime-health", () => ({ runtimeHealth: async () => ({ processUptime: 60, processMemory: 1 << 27, heapUsed: 1 << 26, hostMemory: 100, hostUsedMemory: 90, cpuCores: 2, cpuPercent: 5, storage: null, environment: "test" }) }));
    return import("@/lib/server/admin-page-signals");
  };

  test("the queue flags stuck and retrying jobs first", async () => {
    const { pageSignals } = await load({ documents: [
      { id: "aaaaaaaa-1", title: "Stuck doc", status: "generating", attempts: 1, created_at: ago(90), available_at: ago(90), lease_until: ago(5), error_code: null },
      { id: "bbbbbbbb-2", title: "Retry doc", status: "queued", attempts: 3, created_at: ago(60), available_at: ago(45), lease_until: null, error_code: null },
      { id: "cccccccc-3", title: "Fresh doc", status: "queued", attempts: 0, created_at: ago(2), available_at: ago(2), lease_until: null, error_code: null },
    ] });
    const s = await pageSignals("queue", 7);
    expect(s.kpis.find(k => k.label === "Stuck")?.value).toBe(1);
    expect(s.watch.rows.map(r => r.issue)).toEqual(["Lease expired (stuck)", "Retry 3", "Waiting"]);
    expect(s.findings[0]).toMatchObject({ severity: "high" });
  });

  test("security lists sources for the admin but never sends an IP to the model", async () => {
    const refused = Array.from({ length: 60 }, (_, i) => ({ resource: i % 2 ? "/api/super-admin/users" : "/api/account", status: i % 3 ? 403 : 429, details: { ip: "203.0.113.9", code: "forbidden", ua: "curl/8" }, created_at: ago(i) }));
    const { pageSignals } = await load({ monitor_events: refused, rate_limits: [{ key: "admin-ask:u1", hits: 30, started_at: ago(5) }] });
    const s = await pageSignals("security", 1);
    expect(s.watch.rows[0]).toMatchObject({ source: "203.0.113.9", refused: 60 });
    expect(JSON.stringify(s.facts)).not.toContain("203.0.113.9");
    expect(s.findings.map(f => f.severity)).toContain("high");
  });

  test("moderation refs each open report and passes them for triage", async () => {
    const { pageSignals } = await load({ content_reports: [
      { id: "1", path: "/learn/dsa", reason: "incorrect", description: "The complexity table is wrong for heaps.", status: "open", created_at: ago(5000), updated_at: ago(5000) },
      { id: "2", path: "/learn/dsa", reason: "inappropriate", description: "Offensive example text in the quiz.", status: "open", created_at: ago(60), updated_at: ago(60) },
    ] });
    const s = await pageSignals("moderation", 7);
    expect(s.watch.rows.map(r => r.ref)).toEqual(["R1", "R2"]);
    expect((s.facts.openReports as { ref: string }[]).map(r => r.ref)).toEqual(["R1", "R2"]);
    expect(s.findings.some(f => /inappropriate/.test(f.title))).toBe(true);
  });
});

describe("/api/super-admin/copilot", () => {
  const ENV = { ...process.env };
  afterAll(() => { process.env = ENV; });
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENV };
    for (const key of AI_KEYS) delete process.env[key];
    jest.doMock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn().mockResolvedValue({ id: "admin" }) }));
    jest.doMock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
    jest.doMock("@/lib/server/http", () => ({
      ...jest.requireActual("@/lib/server/http"),
      sameOrigin: jest.fn(),
    }));
    jest.doMock("@/lib/server/admin-page-signals", () => ({
      pageTitle: () => "Generation queue",
      pageSignals: jest.fn().mockResolvedValue({ page: "queue", days: 7, generatedAt: new Date().toISOString(), kpis: [{ label: "Stuck", value: 2, note: "n" }], watch: { note: "", columns: [], rows: [{ job: "abc" }] }, findings: [{ severity: "high", title: "2 jobs are stuck", detail: "Retry them." }], facts: { stuck: 2 } }),
    }));
  });
  const post = (body: unknown) => new Request("http://localhost/api/super-admin/copilot", { method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost" }, body: JSON.stringify(body) });

  test("GET returns the page's signals and rejects unknown pages", async () => {
    const { GET } = await import("@/app/api/super-admin/copilot/route");
    const ok = await GET(new Request("http://localhost/api/super-admin/copilot?page=queue&days=7"));
    expect((await ok.json()).watch.rows).toHaveLength(1);
    expect((await GET(new Request("http://localhost/api/super-admin/copilot?page=notepad"))).status).toBe(400);
  });

  test("without a model the analysis falls back to rule findings, and questions are refused", async () => {
    const { POST } = await import("@/app/api/super-admin/copilot/route");
    const analysis = await (await POST(post({ page: "queue", days: 7 }))).json();
    expect(analysis).toMatchObject({ source: "rules", findings: [{ title: "2 jobs are stuck" }] });
    expect(analysis.summary).toMatch(/1 of them high priority/);
    expect((await POST(post({ page: "queue", days: 7, question: "Is it healthy?" }))).status).toBe(503);
  });

  test("with a model, only aggregates are sent and the parsed reply is returned", async () => {
    const complete = jest.fn().mockResolvedValue({ text: '{"summary":"Two jobs stuck.","findings":[],"actions":[{"priority":"high","title":"Retry stuck jobs","detail":"Use Retry."}],"answer":"No, two are stuck."}', model: "test-model" });
    jest.doMock("@/lib/server/ai-providers", () => ({ defaultProvider: () => "anthropic", completeWithFallback: complete }));
    const { POST } = await import("@/app/api/super-admin/copilot/route");
    const answer = await (await POST(post({ page: "queue", days: 7, question: "Is it healthy?" }))).json();
    expect(answer).toMatchObject({ source: "ai", model: "test-model", answer: "No, two are stuck.", question: "Is it healthy?" });
    const sent = JSON.parse(complete.mock.calls[0][2][0].content);
    expect(sent.signals.facts).toEqual({ stuck: 2 });
    expect(JSON.stringify(sent)).not.toContain('"rows"');
  });
});
