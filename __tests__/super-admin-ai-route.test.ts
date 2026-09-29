/** @jest-environment node */
import { GET, POST } from "@/app/api/super-admin/ai/route";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { completeWithFallback, completeWithProvider } from "@/lib/server/ai-providers";

jest.mock("@/lib/server/auth", () => ({ currentUser: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; } }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/ai-providers", () => {
  const actual = jest.requireActual("@/lib/server/ai-providers");
  return { ...actual, completeWithFallback: jest.fn(), completeWithProvider: jest.fn(), providerConfigured: (id: string) => id === "anthropic", defaultProvider: () => "anthropic", learningProvider: () => "anthropic", providerModel: (id: string) => id === "anthropic" ? "claude-sonnet-5" : "" };
});

const owner = { id: "owner", email: "garvcontact30@gmail.com", email_confirmed_at: "2026-01-01" };
function eventsQuery(rows: unknown[]) {
  const query = { select: jest.fn(), eq: jest.fn(), gte: jest.fn(), order: jest.fn(), range: jest.fn() };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.gte.mockReturnValue(query); query.order.mockReturnValue(query);
  query.range.mockResolvedValue({ data: rows, error: null });
  (db as jest.Mock).mockReturnValue({ from: jest.fn(() => query) });
  return query;
}
const post = (body: unknown) => new Request("http://localhost/api/super-admin/ai", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost" }, body: JSON.stringify(body) });
const rows = [{ created_at: "2026-09-20T10:00:00Z", resource: "mentor", action: "completion", status: 200, duration_ms: 900, details: { provider: "anthropic", model: "claude-sonnet-5", input_tokens: 10, output_tokens: 5 } }];

test("non-owners are refused before any database read", async () => {
  (currentUser as jest.Mock).mockResolvedValue({ id: "x", email: "other@gmail.com", email_confirmed_at: "2026-01-01" });
  const response = await GET(new Request("http://localhost/api/super-admin/ai"));
  expect(response.status).toBe(403);
  expect(db).not.toHaveBeenCalled();
});

test("the owner gets insights and every provider's status, without credentials", async () => {
  (currentUser as jest.Mock).mockResolvedValue(owner);
  const query = eventsQuery(rows);
  const response = await GET(new Request("http://localhost/api/super-admin/ai?days=7"));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(query.eq).toHaveBeenCalledWith("kind", "ai");
  expect(body.days).toBe(7);
  expect(body.insights.totals.calls).toBe(1);
  expect(body.providers).toHaveLength(10);
  expect(body.providers[0]).toEqual({ id: "anthropic", label: "Claude", configured: true, model: "claude-sonnet-5", grounded: false, isDefault: true, isLearning: true });
  expect(body.providers.find((item: { id: string }) => item.id === "openrouter")).toMatchObject({ configured: false, model: null });
  expect(JSON.stringify(body)).not.toMatch(/api_key|sk-/i);
});

test("a probe reports latency, and an unconfigured provider is refused", async () => {
  (currentUser as jest.Mock).mockResolvedValue(owner);
  (completeWithProvider as jest.Mock).mockResolvedValue({ text: "OK", provider: "anthropic", model: "claude-sonnet-5", sources: [] });
  const ok = await POST(post({ action: "probe", provider: "anthropic" }));
  expect(await ok.json()).toMatchObject({ ok: true, model: "claude-sonnet-5" });
  expect((await POST(post({ action: "probe", provider: "groq" }))).status).toBe(409);
});

test("analysis sends aggregated metrics only and returns the written recommendations", async () => {
  (currentUser as jest.Mock).mockResolvedValue(owner);
  eventsQuery(rows);
  (completeWithFallback as jest.Mock).mockResolvedValue({ text: "1. **Healthy**", provider: "anthropic", model: "claude-sonnet-5", sources: [] });
  const response = await POST(post({ action: "analyze", days: 30 }));
  expect(await response.json()).toMatchObject({ analysis: "1. **Healthy**", label: "Claude" });
  const prompt = (completeWithFallback as jest.Mock).mock.calls[0][2][0].content as string;
  expect(prompt).toContain("\"calls\":1");
  expect(prompt).not.toContain("slowest");
});
