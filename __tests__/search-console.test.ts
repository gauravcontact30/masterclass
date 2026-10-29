/** @jest-environment node */
import { searchConsoleWindow } from "@/lib/search-console";
import { searchConsoleReport } from "@/lib/server/search-console";
import { GET } from "@/app/api/super-admin/promotions/search-console/route";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { HttpError } from "@/lib/server/http";
import { JWT } from "google-auth-library";
jest.mock("google-auth-library", () => ({ JWT: jest.fn().mockImplementation(() => ({ getAccessToken: async () => ({ token: "test-token" }) })) }));
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
const originalEnv = { ...process.env };
let property = 0;
beforeEach(() => {
  process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY = `sc-domain:example-${++property}.test`;
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL = "service@example.test";
  process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY = "test-key";
  jest.mocked(requireSuperAdmin).mockResolvedValue({ id: "admin" } as never);
  global.fetch = jest.fn();
});
afterAll(() => { process.env = originalEnv; });
test("uses the previous Pacific calendar day and handles DST boundaries", () => {
  expect(searchConsoleWindow(7, new Date("2026-03-09T06:00:00Z"))).toEqual({ startDate: "2026-03-01", endDate: "2026-03-07" });
  expect(searchConsoleWindow(1, new Date("2026-11-02T07:00:00Z"))).toEqual({ startDate: "2026-10-31", endDate: "2026-10-31" });
});
test("missing credentials returns an explicit unavailable state without fabricated metrics", async () => {
  delete process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
  expect(await searchConsoleReport(30)).toMatchObject({ status: "not_configured", totals: null });
  expect(fetch).not.toHaveBeenCalled();
});
test("authorization precedes every report, including cached reads", async () => {
  jest.mocked(requireSuperAdmin).mockRejectedValueOnce(new HttpError(403, "forbidden"));
  const response = await GET(new Request("https://example.test/api/super-admin/promotions/search-console"));
  expect(response.status).toBe(403);
  expect(fetch).not.toHaveBeenCalled();
});
test("uses finalized data, separate totals, encoded property, and coalesces concurrent reads", async () => {
  jest.mocked(fetch).mockImplementation(async (_url, options) => {
    const { dimensions } = JSON.parse(options!.body as string);
    return Response.json({ rows: [{ clicks: dimensions.length ? 2 : 19, impressions: 100, ctr: dimensions.length ? .02 : .19, position: 3.7, keys: dimensions.length ? [dimensions[0] === "date" ? "2026-10-01" : "Example"] : [] }] });
  });
  const [first, second] = await Promise.all([searchConsoleReport(30), searchConsoleReport(30)]);
  expect(first).toEqual(second);
  expect(first.totals?.clicks).toBe(19);
  expect(first.queries[0].clicks).toBe(2);
  expect(fetch).toHaveBeenCalledTimes(6);
  expect(JWT).toHaveBeenCalledWith(expect.objectContaining({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] }));
  for (const [url, options] of jest.mocked(fetch).mock.calls) {
    expect(url).toContain(encodeURIComponent(process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY!));
    expect(JSON.parse(options!.body as string)).toMatchObject({ dataState: "final", type: "web" });
  }
  const response = await GET(new Request("https://example.test/api/super-admin/promotions/search-console?days=30"));
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(fetch).toHaveBeenCalledTimes(6);
});
test("provider failures are sanitized and not cached as zero data", async () => {
  jest.mocked(fetch).mockResolvedValue(new Response("private upstream error", { status: 403 }));
  await expect(searchConsoleReport(30)).rejects.toMatchObject({ code: "search_console_access_denied" });
  jest.mocked(fetch).mockImplementation(async () => Response.json({}));
  expect(await searchConsoleReport(30)).toMatchObject({ status: "connected", totals: null, queries: [] });
});
test("invalid provider metrics fail rather than inventing values", async () => {
  jest.mocked(fetch).mockImplementation(async () => Response.json({ rows: [{ clicks: -1 }] }));
  await expect(searchConsoleReport(30)).rejects.toMatchObject({ code: "search_console_invalid_response" });
});
