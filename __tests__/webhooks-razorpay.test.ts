/** @jest-environment node */
import { POST } from "@/app/api/webhooks/razorpay/route";
import { verifyHmac } from "@/lib/server/secrets";
import { reconcileSubscription, reconcileDownloadCredit } from "@/lib/server/billing";
import { db } from "@/lib/server/db";

jest.mock("@/lib/server/secrets", () => ({ verifyHmac: jest.fn() }));
jest.mock("@/lib/server/billing", () => ({ reconcileSubscription: jest.fn(), reconcileDownloadCredit: jest.fn() }));
jest.mock("@/lib/server/db", () => ({
  db: jest.fn(),
  check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; },
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/webhooks/razorpay", { method: "POST", headers: { "x-razorpay-signature": "sig" }, body: JSON.stringify(body) });
}

beforeEach(() => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
  (verifyHmac as jest.Mock).mockReturnValue(true);
  const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  (db as jest.Mock).mockReturnValue({ from: () => ({ upsert: jest.fn().mockResolvedValue({data:null,error:null}), select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) }) });
});

test("rejects a request with an invalid signature", async () => {
  (verifyHmac as jest.Mock).mockReturnValue(false);
  const response = await POST(makeRequest({ event: "subscription.activated", payload: { subscription: { entity: { id: "sub_1" } } } }));
  expect(response.status).toBe(401);
  expect(reconcileSubscription).not.toHaveBeenCalled();
});

test("reconciles a subscription lifecycle event", async () => {
  const response = await POST(makeRequest({ event: "subscription.activated", payload: { subscription: { entity: { id: "sub_1" } } } }));
  expect(response.status).toBe(200);
  expect(reconcileSubscription).toHaveBeenCalledWith("sub_1", expect.any(String));
  expect(reconcileDownloadCredit).not.toHaveBeenCalled();
});

test("credits a download purchase on payment.captured for a download_credit order", async () => {
  const response = await POST(makeRequest({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_1", notes: { kind: "download_credit" } } } } }));
  expect(response.status).toBe(200);
  expect(reconcileDownloadCredit).toHaveBeenCalledWith("order_1", expect.any(String));
});

test("ignores a payment.captured event unrelated to download credits", async () => {
  const response = await POST(makeRequest({ event: "payment.captured", payload: { payment: { entity: { id: "pay_2", order_id: "order_2", notes: {} } } } }));
  const body = await response.json();
  expect(body).toEqual({ ignored: true });
  expect(reconcileDownloadCredit).not.toHaveBeenCalled();
});

test("ignores unrelated event types", async () => {
  const response = await POST(makeRequest({ event: "invoice.paid", payload: {} }));
  const body = await response.json();
  expect(body).toEqual({ ignored: true });
});
