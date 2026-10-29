/** @jest-environment node */
import { GET, POST, PATCH } from "@/app/api/super-admin/promotions/route";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
const request = (body: unknown, method = "POST") => new Request("https://example.test/api/super-admin/promotions", { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json", Origin: "https://example.test" } });
const fields = { platform: "google_search", title: "Search campaign", utm_campaign: "launch", format: "ad" };
const id = "9d4bc1ab-98d8-46a1-8453-ce1d5e581afa";
beforeEach(() => { jest.mocked(requireSuperAdmin).mockResolvedValue({ id: "admin" } as never); });
test("unauthorized promotion reads and writes never touch storage", async () => {
  jest.mocked(requireSuperAdmin).mockRejectedValue(new HttpError(403, "forbidden"));
  expect((await GET(new Request("https://example.test/api/super-admin/promotions"))).status).toBe(403);
  expect((await POST(request(fields))).status).toBe(403);
  expect(db).not.toHaveBeenCalled();
});
test("Google promotions persist via the existing authorized CRUD endpoint", async () => {
  const insert = jest.fn(() => ({ select: () => ({ single: async () => ({ data: { id, ...fields }, error: null }) }) }));
  jest.mocked(db).mockReturnValue({ from: () => ({ insert }) } as never);
  expect((await POST(request(fields))).status).toBe(201);
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ platform: "google_search", created_by: "admin" }));
});
test("wrong-platform and fractional count metrics are rejected", async () => {
  expect((await POST(request({ ...fields, platform: "instagram", platform_metrics: { enrollments: 10 } }))).status).toBe(400);
  expect((await POST(request({ ...fields, platform: "instagram", platform_metrics: { likes: 1.5 } }))).status).toBe(400);
  expect((await POST(request({ ...fields, platform_metrics: null }))).status).toBe(400);
  expect(db).not.toHaveBeenCalled();
});
test("switching to Google clears incompatible manual metrics", async () => {
  const update = jest.fn(() => ({ eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: { id, ...fields }, error: null }) }) }) }));
  jest.mocked(db).mockReturnValue({ from: () => ({ update, select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { platform: "instagram" }, error: null }) }) }) }) } as never);
  expect((await PATCH(request({ id, platform: "google_search" }, "PATCH"))).status).toBe(200);
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ platform_metrics: {} }));
});
test("repeating the same platform in a partial update preserves existing figures", async () => {
  const update = jest.fn(() => ({ eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: { id }, error: null }) }) }) }));
  jest.mocked(db).mockReturnValue({ from: () => ({ update, select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { platform: "instagram" }, error: null }) }) }) }) } as never);
  expect((await PATCH(request({ id, platform: "instagram", title: "Updated title" }, "PATCH"))).status).toBe(200);
  expect(update.mock.calls[0][0]).not.toHaveProperty("platform_metrics");
});
test("old platform constraint returns a migration error instead of an unexplained failure", async () => {
  jest.mocked(db).mockReturnValue({ from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ error: { code: "23514", message: 'violates "promotions_platform_check"' } }) }) }) }) } as never);
  const response = await POST(request(fields));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "migration_required" });
});
