/** @jest-environment node */
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/billing", () => ({ razorpay: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));

const payment = { id: "pay_deleted", amount: 29900, currency: "INR", status: "captured", invoice_id: "inv_shared", email: "deleted@example.com", method: "card", created_at: 1792407600 };
const remaining = { ...payment, id: "pay_remaining", email: "remaining@example.com", status: "failed", method: "upi" };
let route: typeof import("@/app/api/super-admin/transactions/route");
let provider: jest.Mock, auth: jest.Mock, rpc: jest.Mock, selectIds: jest.Mock;
let deleted: Set<string>;
const request = (query = "") => new Request(`http://localhost/api/super-admin/transactions${query}`);
const remove = (id = payment.id, headers = {}) => route.DELETE(new Request(request().url, { method: "DELETE", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ id }) }));

beforeEach(async () => {
  jest.resetModules();
  deleted = new Set();
  route = await import("@/app/api/super-admin/transactions/route");
  const { requireSuperAdmin } = await import("@/lib/server/super-admin");
  const { razorpay } = await import("@/lib/server/billing");
  const { db } = await import("@/lib/server/db");
  auth = requireSuperAdmin as jest.Mock;
  provider = razorpay as jest.Mock;
  auth.mockResolvedValue({ id: "admin" });
  provider.mockImplementation(async (path: string) => path.startsWith("payments?") ? { items: [payment, remaining] } : payment);
  selectIds = jest.fn(async (_column, ids: string[]) => ({ data: ids.filter(id => deleted.has(id)).map(payment_id => ({ payment_id })), error: null }));
  rpc = jest.fn(async (_name, args) => { deleted.add(args.p_payment_id); return { error: null }; });
  jest.mocked(db).mockReturnValue({ from: () => ({ select: () => ({ in: selectIds }) }), rpc } as never);
});

test("deletion is persisted before success and excluded from refreshed rows, reports, facets and CSV", async () => {
  expect((await (await route.GET(request())).json()).total).toBe(2);
  expect((await remove()).status).toBe(200);
  expect(rpc).toHaveBeenCalledWith("delete_transaction", { p_payment_id: payment.id, p_actor: "admin" });
  const body = await (await route.GET(request())).json();
  expect(body.rows.map((row: { id: string }) => row.id)).toEqual([remaining.id]);
  expect(body.summary).toMatchObject({ count: 1, captured: 0, failed: 1 });
  expect(body.insights).toMatchObject({ recovered: 0, net: 0, customers: 1 });
  expect(body.facets).toMatchObject({ statuses: ["failed"], methods: ["upi"] });
  expect(await (await route.GET(request("?format=csv"))).text()).not.toContain(payment.id);
  const search = await (await route.GET(request("?q=deleted"))).json();
  expect(search.total).toBe(0);
  expect(search.suggestions).toEqual([]);
});

test("database markers apply to cached results, including deletions from another server", async () => {
  await route.GET(request());
  deleted.add(payment.id);
  const body = await (await route.GET(request())).json();
  expect(body.total).toBe(1);
  expect(provider).toHaveBeenCalledTimes(1);
});

test("a fresh server reads existing database markers without a preceding DELETE", async () => {
  deleted.add(payment.id);
  expect((await (await route.GET(request())).json()).rows.map((row: { id: string }) => row.id)).toEqual([remaining.id]);
});

test("failed database deletion cannot report success or hide the row", async () => {
  rpc.mockResolvedValue({ error: { message: "database unavailable" } });
  const response = await remove();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "transaction_delete_failed" });
  expect((await (await route.GET(request())).json()).total).toBe(2);
});

test("database read failures do not silently restore deleted transactions", async () => {
  selectIds.mockResolvedValue({ data: null, error: { message: "unavailable" } });
  expect((await route.GET(request())).status).toBe(503);
});

test("another product's payment cannot be deleted", async () => {
  provider.mockResolvedValue({ ...payment, notes: { product: "other" } });
  expect((await remove()).status).toBe(404);
  expect(rpc).not.toHaveBeenCalled();
});

test("requires admin access, same origin and a valid payment ID", async () => {
  const { HttpError } = await import("@/lib/server/http");
  auth.mockRejectedValueOnce(new HttpError(403, "forbidden"));
  expect((await remove()).status).toBe(403);
  expect((await remove(payment.id, { origin: "https://other.example" })).status).toBe(403);
  expect((await remove("../payments")).status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
  expect(provider).not.toHaveBeenCalled();
});
