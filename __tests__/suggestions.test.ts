/** @jest-environment node */
import { createHash } from "node:crypto";
import { GET, POST } from "@/app/api/suggestions/route";
import { GET as adminGet, PATCH, POST as POST_ADMIN } from "@/app/api/super-admin/suggestions/route";
import { db } from "@/lib/server/db";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { HttpError } from "@/lib/server/http";
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
const input = { name: "Learner", email: "", category: "feature", title: "More practice", body: "Please add more practice examples for beginners." };
const id = "00000000-0000-4000-8000-000000000001";
const request = (body: unknown) => new Request("http://localhost/api/suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("guests can submit; only a hash is stored and the private tracking code is returned", async () => {
  const insert = jest.fn().mockReturnValue({ select: () => ({ single: async () => ({ data: { id }, error: null }) }) });
  (db as jest.Mock).mockReturnValue({ from: () => ({ insert }) });
  const response = await POST(request(input));
  expect(response.status).toBe(201);
  const receipt = await response.json(); const secret = receipt.trackingCode.split(".")[1];
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ access_hash: createHash("sha256").update(secret).digest("hex"), email: null }));
  expect(JSON.stringify(insert.mock.calls)).not.toContain(secret);
  expect(response.headers.get("cache-control")).toContain("no-store");
});
test.each([{ ...input, body: "short" }, { ...input, website: "spam" }, { ...input, status: "completed" }])("rejects invalid public submissions", async body => {
  expect((await POST(request(body))).status).toBe(400); expect(db).not.toHaveBeenCalled();
});
test("invalid tracking credentials never read a suggestion", async () => {
  expect((await GET(new Request("http://localhost/api/suggestions"))).status).toBe(404);
  expect(db).not.toHaveBeenCalled();
});
test("tracking verifies the secret and excludes contact and internal fields", async () => {
  const secret = "a".repeat(64); const eq = jest.fn();
  const builder = { eq, maybeSingle: async () => ({ data: { id, status: "new" }, error: null }) }; eq.mockReturnValue(builder);
  const select = jest.fn().mockReturnValue(builder);
  (db as jest.Mock).mockReturnValue({ from: (name: string) => name === "suggestions" ? { select } : { select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }) } });
  const response = await GET(new Request("http://localhost/api/suggestions", { headers: { Authorization: `Bearer ${id}.${secret}` } }));
  expect(response.status).toBe(200);
  expect(eq).toHaveBeenCalledWith("access_hash", createHash("sha256").update(secret).digest("hex"));
  expect(select.mock.calls[0][0]).not.toMatch(/email|priority|access_hash/);
});
test("admin endpoints reject unauthorized reads and writes before DB access", async () => {
  (requireSuperAdmin as jest.Mock).mockRejectedValue(new HttpError(403, "forbidden"));
  expect((await adminGet(new Request("http://localhost/api/super-admin/suggestions"))).status).toBe(403);
  expect((await PATCH(request({}))).status).toBe(403); expect(db).not.toHaveBeenCalled();
});
test("rate limits stop public inserts", async () => {
  (rateLimit as jest.Mock).mockRejectedValueOnce(new HttpError(429, "rate_limited"));
  expect((await POST(request(input))).status).toBe(429); expect(db).not.toHaveBeenCalled();
});

describe("admin tools (migration 0026)", () => {
  const owner = { id: "owner-1" };
  const adminRequest = (method: string, body: unknown) => new Request("http://localhost/api/super-admin/suggestions", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  beforeEach(() => { (requireSuperAdmin as jest.Mock).mockResolvedValue(owner); (rateLimit as jest.Mock).mockResolvedValue(undefined); });

  test("bulk updates call the service-role function with the acting admin", async () => {
    const rpc = jest.fn().mockResolvedValue({ data: 2, error: null });
    (db as jest.Mock).mockReturnValue({ rpc });
    const response = await POST_ADMIN(adminRequest("POST", { action: "update", ids: [id, id.replace(/1$/, "2")], status: "planned" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ affected: 2 });
    expect(rpc).toHaveBeenCalledWith("admin_bulk_update_suggestions", { p_ids: [id, id.replace(/1$/, "2")], p_status: "planned", p_priority: null, p_actor: "owner-1" });
  });
  test.each([
    { action: "update", ids: [id] },
    { action: "update", ids: [], status: "planned" },
    { action: "update", ids: [id], status: "shipped" },
    { action: "delete", ids: ["not-a-uuid"] },
    { action: "delete", ids: Array.from({ length: 101 }, () => id) },
  ])("rejects malformed bulk actions before any database call (%#)", async body => {
    expect((await POST_ADMIN(adminRequest("POST", body))).status).toBe(400);
    expect(db).not.toHaveBeenCalled();
  });
  test("bulk delete uses the delete function", async () => {
    const rpc = jest.fn().mockResolvedValue({ data: 1, error: null });
    (db as jest.Mock).mockReturnValue({ rpc });
    expect((await POST_ADMIN(adminRequest("POST", { action: "delete", ids: [id] }))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("admin_delete_suggestions", { p_ids: [id] });
  });
  test("listing falls back to the 0025 function until 0026 is applied", async () => {
    const rpc = jest.fn()
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST202", message: "Could not find the function admin_list_suggestions_v2" } })
      .mockResolvedValueOnce({ data: { total: 0, suggestions: [], counts: {} }, error: null });
    (db as jest.Mock).mockReturnValue({ rpc });
    const response = await adminGet(new Request("http://localhost/api/super-admin/suggestions?scope=title&sort=priority&search=x"));
    expect(await response.json()).toEqual({ total: 0, suggestions: [], counts: {}, legacy: true });
    expect(rpc.mock.calls[1][0]).toBe("admin_list_suggestions");
    expect(rpc.mock.calls[1][1]).toEqual(expect.objectContaining({ p_search: "x", p_sort: "newest" }));
  });
  test("CSV export quotes cells and neutralises spreadsheet formulas", async () => {
    const row = { id, created_at: "2026-10-18T00:00:00Z", status: "new", priority: "normal", category: "bug", name: "=HYPERLINK(\"x\")", email: null, title: "Say \"hi\"", body: "+1 line", reply_count: 0 };
    const rpc = jest.fn().mockResolvedValue({ data: { total: 1, suggestions: [row], counts: {} }, error: null });
    (db as jest.Mock).mockReturnValue({ rpc });
    const response = await adminGet(new Request("http://localhost/api/super-admin/suggestions?format=csv&status=new"));
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toMatch(/attachment; filename="suggestions-\d{4}-\d{2}-\d{2}\.csv"/);
    const text = await response.text();
    expect(text).toContain(`"'=HYPERLINK(""x"")"`);
    expect(text).toContain(`"Say ""hi"""`);
    expect(text).toContain(`"'+1 line"`);
    expect(rpc).toHaveBeenCalledWith("admin_list_suggestions_v2", expect.objectContaining({ p_limit: 1000, p_page: 1, p_status: "new" }));
  });
});
