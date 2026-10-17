/** @jest-environment node */
import { createHash } from "node:crypto";
import { GET, POST } from "@/app/api/suggestions/route";
import { GET as adminGet, PATCH } from "@/app/api/super-admin/suggestions/route";
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
