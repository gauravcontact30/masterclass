/** @jest-environment node */
import { POST } from "@/app/api/monitoring/presence/route";
import { db } from "@/lib/server/db";
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({data}: {data: unknown}) => data }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
jest.mock("@/lib/server/config", () => ({ authConfigured: () => true }));
jest.mock("@/lib/server/auth", () => ({ currentUser: async () => ({ id: "test-user", email: "learner@example.com" }) }));
jest.mock("@/lib/server/http", () => ({ ...jest.requireActual("@/lib/server/http"), userId: async () => "test-user" }));

test("missing optional monitoring schema stops heartbeats and retries after the cooldown", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-10-09T12:00:00Z"));
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  const upsert = jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST205" } });
  (db as jest.Mock).mockReturnValue({from: () => ({upsert})});
  const request = () => new Request("http://localhost/api/monitoring/presence", {method:"POST",headers:{origin:"http://localhost"},body:JSON.stringify({sessionId:"63a61031-e24e-40b5-bc53-d148b3ec7675",path:"/learning",view:false})});
  try {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ok:false,enabled:false,reason:"monitoring_setup_required"});
    await POST(request());
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(300001);
    upsert.mockResolvedValue({data:null,error:null});
    expect(await (await POST(request())).json()).toEqual({ok:true});
  } finally { warn.mockRestore(); jest.useRealTimers(); }
});
