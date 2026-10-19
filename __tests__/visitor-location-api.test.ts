/** @jest-environment node */
import { GET } from "@/app/api/super-admin/activity/locations/route";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); (requireSuperAdmin as jest.Mock).mockResolvedValue({ id: "admin" }); });

test("rejects non-admins before querying location data", async () => {
  (requireSuperAdmin as jest.Mock).mockRejectedValue(new HttpError(403, "forbidden"));
  expect((await GET(new Request("https://example.test/api/super-admin/activity/locations"))).status).toBe(403);
  expect(db).not.toHaveBeenCalled();
});

test("filters bots and non-page events, and returns private aggregate data", async () => {
  const chain: Record<string, jest.Mock> = {};
  for (const method of ["select", "eq", "gte", "lt", "order"]) chain[method] = jest.fn(() => chain);
  chain.range = jest.fn().mockResolvedValue({ error: null, data: [{ visitor_id: "browser", session_id: "session", country: "IN", region: "DL", city: "Delhi", created_at: "2026-10-19T05:00:00Z" }] });
  (db as jest.Mock).mockReturnValue({ from: jest.fn(() => chain) });
  const response = await GET(new Request("https://example.test/api/super-admin/activity/locations?days=30"));
  expect(response.status).toBe(200);
  expect(chain.eq).toHaveBeenCalledWith("is_bot", false);
  expect(chain.eq).toHaveBeenCalledWith("event", "page_view");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const body = await response.json();
  expect(body).toMatchObject({ days: 30, capped: false, regions: [{ country: "India", region: "DL", visitors: 1 }] });
  expect(JSON.stringify(body)).not.toContain('"browser"');
});
