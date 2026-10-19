/** @jest-environment node */
import { GET } from "@/app/api/super-admin/security/route";
import { api, HttpError } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { recordEvent } from "@/lib/server/monitoring";
jest.mock("@/lib/server/auth", () => ({ currentUser: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn(), check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; } }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
// after() needs a request scope; run the callback straight away in tests.
jest.mock("next/server", () => ({ ...jest.requireActual("next/server"), after: (fn: () => void) => fn() }));

const owner = { id: "owner", email: "garvcontact30@gmail.com", email_confirmed_at: "2026-01-01" };
const event = (status: number, resource: string, details: Record<string, unknown>, at = new Date().toISOString()) => ({ created_at: at, resource, action: "POST", status, details: { request_id: crypto.randomUUID(), ...details } });

describe("security API", () => {
  test.each([[null, 401], [{ id: "x", email: "someone@gmail.com", email_confirmed_at: "2026-01-01" }, 403]])("refuses non-admins before reading events", async (user, status) => {
    (currentUser as jest.Mock).mockResolvedValue(user);
    const response = await GET(new Request("http://localhost/api/super-admin/security"));
    expect(response.status).toBe(status);
    expect(db).not.toHaveBeenCalled();
  });

  test("aggregates blocked requests by reason, source and target", async () => {
    (currentUser as jest.Mock).mockResolvedValue(owner);
    const rows = [
      ...Array.from({ length: 6 }, () => event(403, "/api/super-admin/users", { security: true, code: "forbidden", ip: "203.0.113.9", ua: "curl/8" })),
      event(429, "/api/track", { security: true, code: "rate_limited", ip: "198.51.100.4" }),
      event(403, "/api/documents", { security: true, code: "invalid_origin", ip: "198.51.100.4" }),
      event(500, "/api/catalog", {}),
    ];
    const query = { select: jest.fn(), eq: jest.fn(), gte: jest.fn(), order: jest.fn(), limit: jest.fn().mockResolvedValue({ data: rows, error: null }) };
    for (const key of ["select", "eq", "gte", "order"] as const) query[key].mockReturnValue(query);
    (db as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue(query) });
    const response = await GET(new Request("http://localhost/api/super-admin/security?days=7"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totals).toMatchObject({ blocked: 8, forbidden: 7, rateLimited: 1, crossSite: 1, adminProbes: 6, serverErrors: 1, uniqueSources: 2 });
    expect(body.sources[0]).toMatchObject({ ip: "203.0.113.9", count: 6, admin: 6, suspicious: true });
    expect(body.byCode[0]).toEqual({ name: "Not allowed (admin only)", count: 6 });
    expect(body.recent[0]).toMatchObject({ ip: "203.0.113.9", reason: "Not allowed (admin only)" });
    expect(body.posture.every((p: { configured: unknown }) => typeof p.configured === "boolean")).toBe(true);
  });
});

describe("api() security events", () => {
  beforeEach(() => (recordEvent as jest.Mock).mockClear());
  test("a refused admin call is recorded with its reason and source", async () => {
    const request = new Request("http://localhost/api/super-admin/users", { method: "POST", headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1", "user-agent": "curl/8" } });
    const response = await api(async () => { throw new HttpError(403, "forbidden"); }, request);
    expect(response.status).toBe(403);
    expect(recordEvent).toHaveBeenCalledWith(expect.objectContaining({ resource: "/api/super-admin/users", status: 403, details: expect.objectContaining({ security: true, code: "forbidden", ip: "203.0.113.9", ua: "curl/8" }) }));
  });
  test("successful admin calls stay out of analytics; ordinary requests carry no address", async () => {
    await api(async () => Response.json({ ok: true }), new Request("http://localhost/api/super-admin/users"));
    expect(recordEvent).not.toHaveBeenCalled();
    await api(async () => Response.json({ ok: true }), new Request("http://localhost/api/catalog", { headers: { "x-forwarded-for": "203.0.113.9" } }));
    expect((recordEvent as jest.Mock).mock.calls[0][0].details).toEqual({ request_id: expect.any(String) });
  });
});
