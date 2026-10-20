/** @jest-environment node */
import { parseBriefing, ruleBriefing, type BriefingMetrics } from "@/lib/admin-briefing";

const base: BriefingMetrics = { days: 7, requests: 1000, serverErrors: 0, blocked: 0, rateLimited: 0, crossSite: 0, adminProbes: 0, aiCalls: 100, aiFailures: 0, exports: 0, pageViews: 500, visitors: 200, newUsers: 10, activeSubscriptions: 3 };

test("a quiet window gets a calm summary and no alarms", () => {
  const b = ruleBriefing(base);
  expect(b.actions.every(a => a.priority === "low")).toBe(true);
  expect(b.summary).toContain("500 page views");
});

test("thresholds raise prioritised actions, high first in importance", () => {
  const b = ruleBriefing({ ...base, serverErrors: 80, adminProbes: 9, rateLimited: 40, aiFailures: 12, newUsers: 0 });
  expect(b.actions.map(a => [a.area, a.priority])).toEqual(expect.arrayContaining([["reliability", "high"], ["security", "high"], ["security", "medium"], ["ai", "medium"], ["growth", "medium"]]));
  expect(b.actions.length).toBeLessThanOrEqual(5);
  expect(b.summary).toMatch(/2 high-priority items/);
});

test("a model reply is accepted only when it matches the briefing shape", () => {
  const good = parseBriefing('Here you go:\n```json\n{"summary":"All fine.","actions":[{"priority":"low","area":"growth","title":"Share the quiz","detail":"Post it."}]}\n```');
  expect(good?.actions[0].area).toBe("growth");
  expect(parseBriefing('{"summary":"x","actions":[{"priority":"urgent","area":"growth","title":"t","detail":"d"}]}')).toBeNull();
  expect(parseBriefing("no json here")).toBeNull();
});

describe("POST /api/super-admin/briefing", () => {
  const ENV = { ...process.env };
  afterAll(() => { process.env = ENV; });
  beforeEach(() => { jest.resetModules(); });

  test("without a model it still answers, from the rules, labelled as such", async () => {
    process.env = { ...ENV };
    for (const key of ["ANTHROPIC_API_KEY", "PERPLEXITY_API_KEY", "OPENROUTER_API_KEY", "AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "MISTRAL_API_KEY", "DEEPSEEK_API_KEY", "PORTKEY_API_KEY"]) delete process.env[key];
    jest.doMock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn().mockResolvedValue({ id: "admin" }) }));
    jest.doMock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
    const head = { count: 4, error: null };
    const chain: Record<string, unknown> = {};
    for (const name of ["select", "eq", "gte", "in", "like", "or"]) chain[name] = () => chain;
    chain.then = (resolve: (v: unknown) => void) => resolve(head);
    jest.doMock("@/lib/server/db", () => ({ db: () => ({ from: () => chain }) }));
    jest.doMock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
    const { POST } = await import("@/app/api/super-admin/briefing/route");
    const response = await POST(new Request("http://localhost/api/super-admin/briefing?days=7", { method: "POST", headers: { origin: "http://localhost" } }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ source: "rules", metrics: { days: 7, requests: 4, newUsers: 4 } });
  });

  test("non-admins are refused before any data is read", async () => {
    const { HttpError } = jest.requireActual("@/lib/server/http");
    const from = jest.fn();
    jest.doMock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn().mockRejectedValue(new HttpError(403, "forbidden")) }));
    jest.doMock("@/lib/server/db", () => ({ db: () => ({ from }) }));
    jest.doMock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
    const { POST } = await import("@/app/api/super-admin/briefing/route");
    const response = await POST(new Request("http://localhost/api/super-admin/briefing", { method: "POST", headers: { origin: "http://localhost" } }));
    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
