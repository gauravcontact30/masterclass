/** @jest-environment node */
const lt = jest.fn(async () => ({ count: 42, error: null }));
const del = jest.fn(() => ({ lt }));
const from = jest.fn(() => ({ delete: del }));
jest.mock("@/lib/server/db", () => ({ db: () => ({ from }) }));
import { GET } from "@/app/api/cron/visit-retention/route";

const call = (auth?: string) => GET(new Request("https://example.com/api/cron/visit-retention", { headers: auth ? { authorization: auth } : {} }));

beforeEach(() => { jest.clearAllMocks(); process.env.CRON_SECRET = "s3cret"; });
afterAll(() => { delete process.env.CRON_SECRET; });

test("refuses calls without the cron secret and deletes nothing", async () => {
  expect((await call()).status).toBe(401);
  expect((await call("Bearer wrong")).status).toBe(401);
  delete process.env.CRON_SECRET;
  expect((await call("Bearer undefined")).status).toBe(401);
  expect(from).not.toHaveBeenCalled();
});

test("deletes site_visits rows older than five days", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-10-22T20:30:00Z"));
  const response = await call("Bearer s3cret");
  jest.useRealTimers();
  expect(response.status).toBe(200);
  expect(from).toHaveBeenCalledWith("site_visits");
  expect(del).toHaveBeenCalledWith({ count: "exact" });
  expect(lt).toHaveBeenCalledWith("created_at", "2026-10-17T20:30:00.000Z");
  expect(await response.json()).toMatchObject({ ok: true, deleted: 42 });
});
