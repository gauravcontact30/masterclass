/** @jest-environment node */
import { GET, POST } from "@/app/api/billing/route";
import { db } from "@/lib/server/db";
import { razorpay } from "@/lib/server/billing";
import { savePreparations } from "@/lib/server/preparations";
import { quota } from "@/lib/server/config";
jest.mock("@/lib/server/http", () => ({ ...jest.requireActual("@/lib/server/http"), userId: jest.fn().mockResolvedValue("student") }));
jest.mock("@/lib/server/repository", () => ({ profile: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/preparations", () => ({ savePreparations: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; } }));
jest.mock("@/lib/server/billing", () => ({ ...jest.requireActual("@/lib/server/billing"), razorpay: jest.fn(), reconcileSubscription: jest.fn() }));
function request(body: unknown) { return new Request("http://localhost/api/billing", { method: "POST", headers: { origin: "http://localhost", "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
const checkout = { action: "checkout", tier: "monthly", selections: ["nda"] };
function table(existing: unknown = null, conflict = false) {
  const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: existing }), single: jest.fn().mockResolvedValue({ data: { provider_ref: "sub_new" } }), insert: jest.fn().mockReturnThis(), update: jest.fn().mockImplementation(() => { query.maybeSingle.mockResolvedValue({ data: conflict ? null : { provider_ref: "sub_new" } }); return query; }) };
  jest.mocked(db).mockReturnValue({ from: () => query } as unknown as ReturnType<typeof db>); return query;
}
beforeEach(() => { jest.clearAllMocks(); jest.mocked(savePreparations).mockResolvedValue(undefined); process.env.RAZORPAY_MONTHLY_PLAN_ID = "plan_monthly"; process.env.RAZORPAY_YEARLY_PLAN_ID = "plan_yearly"; delete process.env.PRO_MONTHLY_PRICE_INR; delete process.env.PRO_YEARLY_PRICE_INR; table(); });
test("public pricing offers only monthly and yearly; inactive accounts have zero allowance", async () => {
  process.env.FREE_MONTHLY_GENERATIONS = "100";
  const data = await (await GET()).json(); expect(data).toMatchObject({ monthly: 299, yearly: 2999 });
  expect(data).not.toHaveProperty("freeLimit"); expect(data).not.toHaveProperty("perDownload"); expect(quota("free")).toBe(0);
});
test.each([{ action: "buyDownloadCredit" }, { ...checkout, tier: "free" }, { ...checkout, selections: [] }, { ...checkout, selections: ["isSuperAdmin"] }])("rejects retired plans and invalid preparation before payment: %j", async body => {
  expect((await POST(request(body))).status).toBe(400); expect(razorpay).not.toHaveBeenCalled(); expect(savePreparations).not.toHaveBeenCalled();
});
test("checkout saves preparation and creates pending access, never an active entitlement", async () => {
  const query = table(); jest.mocked(razorpay).mockResolvedValue({ id: "sub_new", plan_id: "plan_monthly", status: "created", short_url: "https://rzp.io/new" });
  expect((await POST(request(checkout))).status).toBe(200); expect(savePreparations).toHaveBeenCalledWith("student", ["nda"]);
  expect(jest.mocked(savePreparations).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(razorpay).mock.invocationCallOrder[0]);
  expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ status: "created", current_period_end: null, tier: "monthly" }));
});
test("unfinished checkout cannot silently charge a different selected billing cycle", async () => {
  table({ provider_ref: "sub_old" }); jest.mocked(razorpay).mockResolvedValue({ id: "sub_old", plan_id: "plan_yearly", status: "created", short_url: "https://rzp.io/old" });
  const response = await POST(request(checkout)); expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: "checkout_plan_conflict" }); expect(razorpay).toHaveBeenCalledTimes(1);
});
test("a concurrent replacement cancels the extra remote subscription", async () => {
  const query = table({ provider_ref: "sub_old", current_period_end: "2020-01-01" }, true);
  jest.mocked(razorpay).mockResolvedValueOnce({ id: "sub_old", plan_id: "plan_monthly", status: "expired", current_end: 1 }).mockResolvedValueOnce({ id: "sub_new", plan_id: "plan_monthly", status: "created", short_url: "https://rzp.io/new" }).mockResolvedValueOnce({});
  expect((await POST(request(checkout))).status).toBe(409);
  expect(query.eq).toHaveBeenCalledWith("provider_ref", "sub_old"); expect(razorpay).toHaveBeenLastCalledWith("subscriptions/sub_new/cancel", { cancel_at_cycle_end: 0 });
});
