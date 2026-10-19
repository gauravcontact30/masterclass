/** @jest-environment node */
import { GET } from "@/app/api/super-admin/promotions/daily/route";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
beforeEach(() => { (requireSuperAdmin as jest.Mock).mockResolvedValue({ id: "admin" }); });

test("daily endpoint enforces admin authorization before reading data", async () => {
  (requireSuperAdmin as jest.Mock).mockRejectedValue(new HttpError(403, "forbidden"));
  const response = await GET(new Request("https://example.test/api/super-admin/promotions/daily"));
  expect(response.status).toBe(403);
  expect(db).not.toHaveBeenCalled();
});

test("rejects impossible report dates", async () => {
  expect((await GET(new Request("https://example.test/api/super-admin/promotions/daily?date=2026-02-31"))).status).toBe(400);
});

test("combines page views and option events without counting clicks as visits", async () => {
  (db as jest.Mock).mockReturnValue({ from: (table: string) => {
    const chain: Record<string, jest.Mock> = {};
    for (const method of ["select", "eq", "gte", "lt", "order"]) chain[method] = jest.fn(() => chain);
    chain.range = jest.fn().mockResolvedValue({ error: null, data: table === "site_visits" ? [{ id: 1, created_at: "2026-10-19T05:00:00Z", visitor_id: "browser-1", session_id: "session-1", user_id: null, path: "/", utm_source: "instagram", utm_campaign: "launch" }] : [{ id: 2, created_at: "2026-10-19T05:01:00Z", actor_id: null, resource: "/", details: { visitor_id: "browser-1", session_id: "session-1", topic: "React", option: "Learn more" } }] });
    return chain;
  } });
  const response = await GET(new Request("https://example.test/api/super-admin/promotions/daily?date=2026-10-19"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  const body = await response.json();
  expect(body.totals).toEqual({ visitors: 1, views: 1, clicks: 1 });
  expect(body.traces[0]).toMatchObject({ platform: "Instagram", topic: "React", option: "Learn more" });
});
