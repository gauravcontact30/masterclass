/** @jest-environment node */
import { GET } from "@/app/api/super-admin/activity/new-users/route";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); (requireSuperAdmin as jest.Mock).mockResolvedValue({ id: "admin" }); });

const REAL = "6f1c2a4e-1b2c-4d5e-8f90-123456789abc";

function chainFor(result: unknown) {
  const chain: Record<string, jest.Mock> = {};
  for (const method of ["select", "gte", "order", "eq", "in"]) chain[method] = jest.fn(() => chain);
  chain.limit = jest.fn().mockResolvedValue(result);
  return chain;
}

test("a seeded non-UUID profile id never reaches the uuid site_visits filter", async () => {
  // profiles.id is text, site_visits.user_id is uuid: "student-user" made Postgres reject the whole query (22P02).
  const profiles = chainFor({ error: null, data: [
    { id: REAL, name: "Asha", created_at: "2026-10-19T05:00:00Z" },
    { id: "student-user", name: "Seed", created_at: "2026-10-09T05:00:00Z" },
  ] });
  const visits = chainFor({ error: null, data: [{ user_id: REAL, created_at: "2026-10-19T05:01:00Z", country: "IN", region: "DL", city: "Delhi", postal_code: null, latitude: null, longitude: null }] });
  (db as jest.Mock).mockReturnValue({ from: jest.fn((table: string) => table === "profiles" ? profiles : visits) });
  const response = await GET(new Request("https://example.test/api/super-admin/activity/new-users?days=30"));
  expect(response.status).toBe(200);
  expect(visits.in).toHaveBeenCalledWith("user_id", [REAL]);
  const body = await response.json();
  expect(body).toMatchObject({ days: 30, total: 2, located: 1, coordinates: true });
});

test("looks up visits in chunks so hundreds of ids never build an oversized URL", async () => {
  const ids = Array.from({ length: 250 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
  const profiles = chainFor({ error: null, data: ids.map(id => ({ id, name: null, created_at: "2026-10-19T05:00:00Z" })) });
  const visits = chainFor({ error: null, data: [] });
  (db as jest.Mock).mockReturnValue({ from: jest.fn((table: string) => table === "profiles" ? profiles : visits) });
  expect((await GET(new Request("https://example.test/api/super-admin/activity/new-users?days=90"))).status).toBe(200);
  expect(visits.in).toHaveBeenCalledTimes(3);
  expect(visits.in.mock.calls.map(call => (call[1] as string[]).length)).toEqual([100, 100, 50]);
});
