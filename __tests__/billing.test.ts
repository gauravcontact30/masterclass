/** @jest-environment node */
import { GET, POST } from "@/app/api/billing/route";
import { supabaseServer } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { createDownloadOrder } from "@/lib/server/billing";

jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));
jest.mock("@/lib/server/db", () => ({
  db: jest.fn(),
  check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; },
}));
jest.mock("@/lib/server/billing", () => ({
  ...jest.requireActual("@/lib/server/billing"),
  createDownloadOrder: jest.fn(),
}));

beforeEach(() => {
  delete process.env.PRO_MONTHLY_PRICE_INR;
  delete process.env.PRO_YEARLY_PRICE_INR;
  delete process.env.DOWNLOAD_CREDIT_PRICE_INR;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
});

test("returns a default per-download price alongside subscription pricing", async () => {
  const response = await GET();
  const body = await response.json();
  expect(body.perDownload).toBe(49);
  expect(body.monthly).toBe(299);
  expect(body.yearly).toBe(2999);
});

test("honors a configured per-download price override", async () => {
  process.env.DOWNLOAD_CREDIT_PRICE_INR = "79";
  const response = await GET();
  const body = await response.json();
  expect(body.perDownload).toBe(79);
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/billing", { method: "POST", body: JSON.stringify(body) });
}

test("buyDownloadCredit creates a one-time order without touching subscription state", async () => {
  (supabaseServer as jest.Mock).mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: "u1" } }, error: null }) } });
  const rpc = jest.fn().mockResolvedValue({ data: true, error: null });
  const profileTable = { upsert: jest.fn().mockResolvedValue({ data: null, error: null }), select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: "u1" }, error: null }) };
  const subscriptionsSelect = jest.fn();
  (db as jest.Mock).mockReturnValue({ from: (table: string) => table === "profiles" ? profileTable : { select: subscriptionsSelect }, rpc });
  (createDownloadOrder as jest.Mock).mockResolvedValue({ id: "order_1", amount: 4900, currency: "INR" });

  const response = await POST(makeRequest({ action: "buyDownloadCredit" }));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual({ orderId: "order_1", amount: 4900, currency: "INR", keyId: "rzp_test_key" });
  expect(createDownloadOrder).toHaveBeenCalledWith("u1");
  expect(subscriptionsSelect).not.toHaveBeenCalled();
});
