/** @jest-environment node */
import { createDownloadOrder, reconcileDownloadCredit } from "@/lib/server/billing";
import { db } from "@/lib/server/db";

jest.mock("@/lib/server/db", () => ({
  db: jest.fn(),
  check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; },
}));

beforeEach(() => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
  process.env.RAZORPAY_KEY_SECRET = "secret";
  process.env.RAZORPAY_MONTHLY_PLAN_ID = "plan_monthly";
  process.env.RAZORPAY_YEARLY_PLAN_ID = "plan_yearly";
  process.env.BILLING_ENABLED = "true";
  process.env.DOWNLOAD_CREDIT_PRICE_INR = "49";
});

test("creates a one-time Razorpay order for a single download credit, tagged with the owner and kind", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "order_1", amount: 4900, currency: "INR", notes: { user_id: "u1", kind: "download_credit" } }) }) as unknown as typeof fetch;

  const order = await createDownloadOrder("u1");

  expect(order.id).toBe("order_1");
  expect(order.amount).toBe(4900);
  expect(fetch).toHaveBeenCalledWith("https://api.razorpay.com/v1/orders", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ amount: 4900, currency: "INR", notes: { user_id: "u1", kind: "download_credit" } }),
  }));
});

test("reconciling a download-credit order credits the order's own owner, not a client-supplied id", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "order_1", amount: 4900, currency: "INR", notes: { user_id: "u1", kind: "download_credit" } }) }) as unknown as typeof fetch;
  const rpc = jest.fn().mockResolvedValue({ data: true, error: null });
  const maybeSingle = jest.fn().mockResolvedValue({ data: { id: "u1" }, error: null });
  (db as jest.Mock).mockReturnValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }), rpc });

  await reconcileDownloadCredit("order_1", "evt_1");

  expect(rpc).toHaveBeenCalledWith("credit_download", { p_event: "evt_1", p_user: "u1", p_credits: 1 });
});

test("rejects reconciling an order that is not a download-credit purchase", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "order_2", amount: 100, currency: "INR", notes: {} }) }) as unknown as typeof fetch;

  await expect(reconcileDownloadCredit("order_2", "evt_2")).rejects.toThrow();
});
