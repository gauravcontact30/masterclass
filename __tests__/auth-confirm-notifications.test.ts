/** @jest-environment node */
import { GET as confirm } from "@/app/auth/confirm/route";
import { GET as list, PATCH as mark } from "@/app/api/notifications/route";
import { supabaseServer } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { userId } from "@/lib/server/http";

jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("@/lib/server/http", () => ({ ...jest.requireActual("@/lib/server/http"), userId: jest.fn() }));

const request = (url: string, init?: RequestInit) => new Request(url, init) as unknown as Parameters<typeof confirm>[0];

describe("GET /auth/confirm (token-hash links, any device)", () => {
  test("a valid link verifies the email, signs the learner in and says so on the dashboard", async () => {
    const verifyOtp = jest.fn().mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    (supabaseServer as jest.Mock).mockResolvedValue({ auth: { verifyOtp } });
    const response = await confirm(request("http://localhost:3000/auth/confirm?token_hash=pkce_abcdef123456&type=email"));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "pkce_abcdef123456", type: "email" });
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard?notice=verified");
  });
  test("an expired link is explained on the sign-in page", async () => {
    (supabaseServer as jest.Mock).mockResolvedValue({ auth: { verifyOtp: jest.fn().mockResolvedValue({ data: {}, error: { code: "otp_expired" } }) } });
    const response = await confirm(request("http://localhost:3000/auth/confirm?token_hash=abcdefghijkl&type=signup"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in?error=link_expired");
  });
  test.each(["?type=email", "?token_hash=abcdefghijkl&type=admin", "?token_hash=<script>&type=email"])("a malformed link (%s) never reaches Supabase", async query => {
    const verifyOtp = jest.fn();
    (supabaseServer as jest.Mock).mockResolvedValue({ auth: { verifyOtp } });
    const response = await confirm(request(`http://localhost:3000/auth/confirm${query}`));
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in?error=link_invalid");
  });
});

/** A chainable query mock that records every filter and resolves with `result`. */
function query(result: unknown) {
  const calls: [string, unknown[]][] = [];
  const chain: Record<string, unknown> = {};
  for (const name of ["select", "eq", "is", "in", "order", "limit", "update"]) chain[name] = (...args: unknown[]) => { calls.push([name, args]); return chain; };
  chain.then = (resolve: (value: unknown) => void) => resolve(result);
  return { chain, calls };
}

describe("/api/notifications", () => {
  beforeEach(() => (userId as jest.Mock).mockResolvedValue("user-1"));

  test("lists only the signed-in learner's notifications, with the unread count", async () => {
    const rows = query({ data: [{ id: "n1", kind: "sign_in", title: "Signed in successfully", body: "", link: null, created_at: "2026-10-20T00:00:00Z", read_at: null }], error: null });
    const count = query({ count: 3, error: null });
    const from = jest.fn().mockReturnValueOnce(rows.chain).mockReturnValueOnce(count.chain);
    (db as jest.Mock).mockReturnValue({ from });
    const response = await list(new Request("http://localhost/api/notifications"));
    expect(await response.json()).toMatchObject({ unread: 3, setup: true, notifications: [{ id: "n1" }] });
    expect(rows.calls).toContainEqual(["eq", ["user_id", "user-1"]]);
    expect(count.calls).toContainEqual(["eq", ["user_id", "user-1"]]);
  });

  test("before the migration the list is simply empty", async () => {
    const missing = query({ data: null, error: { code: "42P01", message: "relation does not exist" } });
    (db as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(missing.chain) });
    const response = await list(new Request("http://localhost/api/notifications"));
    expect(await response.json()).toEqual({ notifications: [], unread: 0, setup: false });
  });

  test("marking read is scoped to the learner, and requires this site's origin", async () => {
    const update = query({ error: null });
    (db as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(update.chain) });
    const body = JSON.stringify({ ids: ["0b4f5c1e-2d3a-4b5c-8d6e-7f8091a2b3c4"] });
    const ok = await mark(new Request("http://localhost/api/notifications", { method: "PATCH", body, headers: { "Content-Type": "application/json", origin: "http://localhost" } }));
    expect(ok.status).toBe(200);
    expect(update.calls).toContainEqual(["eq", ["user_id", "user-1"]]);
    expect(update.calls).toContainEqual(["in", ["id", ["0b4f5c1e-2d3a-4b5c-8d6e-7f8091a2b3c4"]]]);
    const foreign = await mark(new Request("http://localhost/api/notifications", { method: "PATCH", body, headers: { "Content-Type": "application/json", origin: "https://evil.example" } }));
    expect(foreign.status).toBe(403);
  });

  test("signed-out visitors get nothing", async () => {
    const { HttpError } = jest.requireActual("@/lib/server/http");
    (userId as jest.Mock).mockRejectedValue(new HttpError(401, "signin_required"));
    expect((await list(new Request("http://localhost/api/notifications"))).status).toBe(401);
  });
});
