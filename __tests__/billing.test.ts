/** @jest-environment node */
import { GET, POST } from "@/app/api/billing/route";
import { db } from "@/lib/server/db";
import { razorpay } from "@/lib/server/billing";
import { savePreparations } from "@/lib/server/preparations";
import { quota } from "@/lib/server/config";
import { saleOffer } from "@/lib/server/festive-sale";
jest.mock("@/lib/server/festive-sale", () => ({ saleOffer: jest.fn().mockResolvedValue(null), activeSale: jest.fn().mockResolvedValue(null) }));
jest.mock("@/lib/server/http", () => ({ ...jest.requireActual("@/lib/server/http"), userId: jest.fn().mockResolvedValue("student") }));
jest.mock("@/lib/server/repository", () => ({ profile: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/preparations", () => ({ savePreparations: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; } }));
jest.mock("@/lib/server/billing", () => ({ ...jest.requireActual("@/lib/server/billing"), razorpay: jest.fn(), reconcileSubscription: jest.fn(), validateSubscriptionPlan: jest.fn().mockResolvedValue("plan_monthly") }));
function request(body: unknown) { return new Request("http://localhost/api/billing", { method: "POST", headers: { origin: "http://localhost", "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
const checkout = { action: "checkout", tier: "monthly", selections: ["system-design"] };
function table(existing: unknown = null, conflict = false) {
  const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: existing }), single: jest.fn().mockResolvedValue({ data: { provider_ref: "sub_new" } }), insert: jest.fn().mockReturnThis(), update: jest.fn().mockImplementation(() => { query.maybeSingle.mockResolvedValue({ data: conflict ? null : { provider_ref: "sub_new" } }); return query; }) };
  jest.mocked(db).mockReturnValue({ from: () => query } as unknown as ReturnType<typeof db>); return query;
}
beforeEach(() => { jest.clearAllMocks(); Object.assign(process.env,{RAZORPAY_KEY_ID:"rzp_test_key",RAZORPAY_KEY_SECRET:"secret",RAZORPAY_WEBHOOK_SECRET:"webhook",BILLING_ENABLED:"true"}); jest.mocked(savePreparations).mockResolvedValue(undefined); process.env.RAZORPAY_MONTHLY_PLAN_ID = "plan_monthly"; process.env.RAZORPAY_YEARLY_PLAN_ID = "plan_yearly"; delete process.env.PRO_MONTHLY_PRICE_INR; delete process.env.PRO_YEARLY_PRICE_INR; table(); });
test("public pricing offers only monthly and yearly; inactive accounts have zero allowance", async () => {
  process.env.FREE_MONTHLY_GENERATIONS = "100";
  const data = await (await GET(new Request("http://localhost/api/billing"))).json(); expect(data).toMatchObject({ monthly: 299, yearly: 2999 });
  expect(data).not.toHaveProperty("freeLimit"); expect(data).not.toHaveProperty("perDownload"); expect(quota("free")).toBe(0);
});
test.each([{ action: "buyDownloadCredit" }, { ...checkout, tier: "free" }, { ...checkout, selections: [] }, { ...checkout, selections: ["isSuperAdmin"] }, { ...checkout, selections: ["nda"] }])("rejects retired plans and invalid preparation before payment: %j", async body => {
  expect((await POST(request(body))).status).toBe(400); expect(razorpay).not.toHaveBeenCalled(); expect(savePreparations).not.toHaveBeenCalled();
});
test("during the Diwali sale a member subscribes to the 25%-off plan and is charged the discounted amount", async () => {
  jest.mocked(saleOffer).mockResolvedValueOnce({ slug: "diwali-2026", planId: "plan_saleMonthly", amountInr: 225 });
  const query = table(); jest.mocked(razorpay).mockResolvedValue({ id: "sub_sale", plan_id: "plan_saleMonthly", status: "created", short_url: "https://rzp.io/sale" });
  const response = await POST(request({ ...checkout, expectedSale: "diwali-2026", expectedAmountPaise: 22500 }));
  expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ amount: 22500, currency: "INR", discounted: true });
  expect(razorpay).toHaveBeenCalledWith("subscriptions", expect.objectContaining({ plan_id: "plan_saleMonthly" }));
  expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ festive_sale: "diwali-2026", razorpay_plan_id: "plan_saleMonthly", recurring_amount_inr: 225 }));
});
test("a checkout priced for the sale is refused once the sale has ended", async () => {
  const response = await POST(request({ ...checkout, expectedSale: "diwali-2026", expectedAmountPaise: 22500 }));
  expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: "pricing_changed" }); expect(razorpay).not.toHaveBeenCalled();
});
test("checkout saves preparation and creates pending access, never an active entitlement", async () => {
  const query = table(); jest.mocked(razorpay).mockResolvedValue({ id: "sub_new", plan_id: "plan_monthly", status: "created", short_url: "https://rzp.io/new" });
  expect((await POST(request(checkout))).status).toBe(200); expect(savePreparations).toHaveBeenCalledWith("student", ["system-design"]);
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
