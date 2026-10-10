/** @jest-environment node */
import { createHmac } from "node:crypto";
import { POST } from "@/app/api/billing/guest/route";
import { fulfilGuestCheckout } from "@/lib/server/guest-billing";
import { db } from "@/lib/server/db";
import { supabaseServer } from "@/lib/server/auth";
import { razorpay, reconcileSubscription } from "@/lib/server/billing";
import { savePreparations } from "@/lib/server/preparations";
import { PREPARATIONS } from "@/lib/study/preparations";

jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/preparations", () => ({ savePreparations: jest.fn() }));
jest.mock("@/lib/server/repository", () => ({ account: jest.fn(async () => ({ tier: remote.status === "active" ? "monthly" : "free" })) }));
jest.mock("@/lib/server/billing", () => ({ ...jest.requireActual("@/lib/server/billing"), razorpay: jest.fn(), reconcileSubscription: jest.fn(), validateSubscriptionPlan: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; } }));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Query-builder fixture rows.
type Row = Record<string, any>;
let tables: Record<string, Row[]>;
let users: Row[];
let remote: Row;
let signedInUser: Row | null;
const verifyOtp = jest.fn(async () => ({ error: null }));
const prep = PREPARATIONS[0].id;
const sign = (text: string) => createHmac("sha256", "checkout-secret").update(text).digest("hex");
const post = (body: unknown) => POST(new Request("http://localhost/api/billing/guest", { method: "POST", headers: { origin: "http://localhost", "Content-Type": "application/json" }, body: JSON.stringify(body) }));
const checkout = (extra: Row = {}) => post({ action: "checkout", tier: "monthly", email: " Asha@Example.com ", name: "Asha", selections: [prep], ...extra });
const verify = (checkoutId: string, ref = remote.id) => post({ action: "verify", checkoutId, razorpay_payment_id: "pay_1", razorpay_subscription_id: ref, razorpay_signature: sign(`pay_1|${ref}`) });

function query(table: string) {
  let operation: "read" | "insert" | "update" = "read"; let value: Row = {}; const filters: [string, unknown][] = [];
  const rows = () => (tables[table] ??= []).filter(row => filters.every(([key, v]) => row[key] === v));
  const run = (one: boolean) => {
    if (operation === "insert") {
      if (table === "subscriptions" && tables.subscriptions.some(row => row.user_id === value.user_id)) return { data: null, error: new Error("duplicate") };
      // Column defaults from migration 0022.
      const row = table === "guest_checkouts" ? { status: "created", user_id: null, created_user: false, claimed_at: null, created_at: new Date().toISOString(), ...value } : { ...value };
      tables[table].push(row); return { data: { ...row }, error: null };
    }
    const matched = rows();
    if (operation === "update") matched.forEach(row => Object.assign(row, value));
    return { data: one ? (matched[0] ? { ...matched[0] } : null) : matched.map(row => ({ ...row })), error: null };
  };
  const q: Row = {
    select: () => q, order: () => q, limit: () => q, gte: () => q,
    eq: (key: string, v: unknown) => { filters.push([key, v]); return q; },
    is: (key: string, v: unknown) => { filters.push([key, v]); return q; },
    insert: (v: Row) => { operation = "insert"; value = v; return q; },
    update: (v: Row) => { operation = "update"; value = v; return q; },
    single: async () => run(true), maybeSingle: async () => run(true),
    then: (resolve: (v: unknown) => void) => Promise.resolve(run(false)).then(resolve),
  };
  return q;
}

beforeEach(() => {
  Object.assign(process.env, { NEXT_PUBLIC_SUPABASE_URL: "http://supabase", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "service", RAZORPAY_KEY_ID: "rzp_test_key", RAZORPAY_KEY_SECRET: "checkout-secret", RAZORPAY_WEBHOOK_SECRET: "webhook-secret", RAZORPAY_MONTHLY_PLAN_ID: "plan_monthly", RAZORPAY_YEARLY_PLAN_ID: "plan_yearly", BILLING_ENABLED: "true", ALLOW_LIVE_BILLING: "false", PRO_MONTHLY_PRICE_INR: "299", PRO_YEARLY_PRICE_INR: "2999" });
  tables = { guest_checkouts: [], subscriptions: [] }; users = []; signedInUser = null;
  remote = { id: "sub_guest", plan_id: "plan_monthly", status: "created", paid_count: 0 };
  jest.clearAllMocks();
  jest.mocked(supabaseServer).mockResolvedValue({ auth: { getUser: async () => ({ data: { user: signedInUser } }), verifyOtp } } as never);
  jest.mocked(razorpay).mockImplementation(async (path: string, body?: unknown) => {
    if (path === "subscriptions") { remote = { ...remote, notes: (body as Row).notes }; return remote; }
    if (path.endsWith("/cancel")) { remote = { ...remote, status: "cancelled" }; return remote; }
    return remote;
  });
  jest.mocked(db).mockReturnValue({
    from: query,
    rpc: async (name: string, p: Row) => name === "auth_user_id_by_email" ? { data: users.find(user => user.email === p.p_email)?.id ?? null, error: null } : { data: null, error: new Error("Unexpected RPC") },
    auth: { admin: {
      createUser: async ({ email }: Row) => { const user = { id: `user_${users.length + 1}`, email }; users.push(user); return { data: { user }, error: null }; },
      generateLink: async () => ({ data: { properties: { hashed_token: "hashed" } }, error: null }),
    } },
  } as never);
});

test("checkout creates a Razorpay subscription tagged with the guest checkout", async () => {
  const response = await checkout();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ subscriptionId: "sub_guest", keyId: "rzp_test_key", amount: 29900, prefill: { email: "asha@example.com", name: "Asha" } });
  expect(remote.notes).toEqual({ guest_checkout: body.checkoutId, email: "asha@example.com" });
  expect(tables.guest_checkouts[0]).toMatchObject({ id: body.checkoutId, email: "asha@example.com", tier: "monthly", selections: [prep], provider_ref: "sub_guest" });
});

test("an unpaid checkout for the same email and plan is reused, not duplicated", async () => {
  const first = await (await checkout()).json();
  const second = await (await checkout()).json();
  expect(second.checkoutId).toBe(first.checkoutId);
  expect(jest.mocked(razorpay).mock.calls.filter(([path]) => path === "subscriptions")).toHaveLength(1);
});

test("emails that already have an account are sent to sign in, before any mandate exists", async () => {
  users.push({ id: "user_existing", email: "asha@example.com" });
  const response = await checkout();
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: "account_exists" });
  expect(razorpay).not.toHaveBeenCalledWith("subscriptions", expect.anything());
});

test("signed-in visitors use the member checkout", async () => {
  signedInUser = { id: "member" };
  expect((await checkout()).status).toBe(409);
});

test("verification rejects a forged signature or a different subscription", async () => {
  const { checkoutId } = await (await checkout()).json();
  const forged = await post({ action: "verify", checkoutId, razorpay_payment_id: "pay_1", razorpay_subscription_id: "sub_guest", razorpay_signature: "0".repeat(64) });
  expect(forged.status).toBe(400);
  expect((await verify(checkoutId, "sub_other")).status).toBe(404);
  expect(users).toHaveLength(0);
});

test("a paid checkout creates the account, attaches the membership and signs the buyer in once", async () => {
  const { checkoutId } = await (await checkout()).json();
  remote = { ...remote, status: "active", paid_count: 1 };
  const response = await verify(checkoutId);
  expect(await response.json()).toEqual({ status: "active", email: "asha@example.com", signedIn: true, newAccount: true });
  expect(users).toEqual([{ id: "user_1", email: "asha@example.com" }]);
  expect(tables.subscriptions).toEqual([expect.objectContaining({ user_id: "user_1", provider_ref: "sub_guest", tier: "monthly" })]);
  expect(savePreparations).toHaveBeenCalledWith("user_1", [prep]);
  expect(reconcileSubscription).toHaveBeenCalledWith("sub_guest", expect.stringMatching(/^guest-verify:/));
  expect(verifyOtp).toHaveBeenCalledTimes(1);
  // A replayed verification never mints a second session.
  expect((await (await verify(checkoutId)).json()).signedIn).toBe(false);
  expect(verifyOtp).toHaveBeenCalledTimes(1);
  expect(users).toHaveLength(1);
});

test("an abandoned checkout creates no account", async () => {
  await checkout();
  const row = await fulfilGuestCheckout("sub_guest", "evt_1");
  expect(row?.user_id).toBeNull();
  expect(users).toHaveLength(0);
  expect(reconcileSubscription).not.toHaveBeenCalled();
});

test("the webhook path links a paid checkout even if the browser never returned", async () => {
  await checkout();
  remote = { ...remote, status: "authenticated" };
  const row = await fulfilGuestCheckout("sub_guest", "evt_2");
  expect(row).toMatchObject({ status: "fulfilled", user_id: "user_1", created_user: true, claimed_at: null });
  expect(reconcileSubscription).toHaveBeenCalledWith("sub_guest", "evt_2");
  expect(await fulfilGuestCheckout("sub_unknown", "evt_3")).toBeNull();
});

test("a second live membership for the same account is stopped and flagged for refund", async () => {
  const { checkoutId } = await (await checkout()).json();
  // The account was created and subscribed elsewhere between checkout and payment.
  users.push({ id: "user_existing", email: "asha@example.com" });
  tables.subscriptions.push({ user_id: "user_existing", provider_ref: "sub_member", status: "active", current_period_end: new Date(Date.now() + 86400000).toISOString() });
  remote = { ...remote, status: "active", paid_count: 1 };
  jest.spyOn(console, "error").mockImplementation(() => {});
  const body = await (await verify(checkoutId)).json();
  expect(body).toMatchObject({ status: "conflict", signedIn: false });
  expect(razorpay).toHaveBeenCalledWith("subscriptions/sub_guest/cancel", { cancel_at_cycle_end: 0 });
  expect(tables.subscriptions).toEqual([expect.objectContaining({ provider_ref: "sub_member" })]);
  expect(verifyOtp).not.toHaveBeenCalled();
});
