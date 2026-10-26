/** @jest-environment node */
import { GET } from "@/app/api/super-admin/promotions/overall/route";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { adminRpc } from "@/lib/server/admin-rpc";
import { HttpError } from "@/lib/server/http";
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/admin-rpc", () => ({ adminRpc: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
const request = () => new Request("https://example.com/api/super-admin/promotions/overall");
test("overall data is private and super-admin only", async () => {
  jest.mocked(requireSuperAdmin).mockRejectedValueOnce(new HttpError(403, "forbidden"));
  expect((await GET(request())).status).toBe(403);
  expect(adminRpc).not.toHaveBeenCalled();
});
test("returns database aggregates with actual retention and no response cache", async () => {
  jest.mocked(requireSuperAdmin).mockResolvedValue({ id: "admin" } as never);
  jest.mocked(adminRpc).mockResolvedValue({ totals: { visitors: 12, views: 100 } });
  const response = await GET(request());
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(await response.json()).toMatchObject({ totals: { visitors: 12, views: 100 }, retentionDays: 5 });
});
