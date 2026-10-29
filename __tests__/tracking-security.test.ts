/** @jest-environment node */
import { POST } from "@/app/api/track/route";
import { cookies } from "next/headers";
import { after } from "next/server";
import { supabaseServer } from "@/lib/server/auth";
import { api, HttpError, sameOrigin } from "@/lib/server/http";
import { recordEvent } from "@/lib/server/monitoring";
import { isUntrackedEmail } from "@/lib/server/tracking-exclusions";
jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));
jest.mock("@/lib/server/config", () => ({ authConfigured: () => true }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
const request = (body: string, headers = {}) => new Request("https://example.com/api/track", {
  method: "POST", headers: { "x-forwarded-for": "203.0.113.10", ...headers }, body,
});
beforeEach(() => {
  (cookies as jest.Mock).mockResolvedValue({ get: jest.fn(), set: jest.fn(), delete: jest.fn() });
  (supabaseServer as jest.Mock).mockResolvedValue({ auth: { getClaims: async () => ({ data: { claims: { sub: "owner", email: "GarvContact30@gmail.com" } } }) } });
});
test("email matching is normalized and does not exclude other learners", () => {
  expect(isUntrackedEmail(" GARVCONTACT30@gmail.com ")).toBe(true);
  expect(isUntrackedEmail("learner@example.com")).toBe(false);
});
test("excluded user gets an opt-out cookie and schedules no visit write", async () => {
  expect((await POST(request(JSON.stringify({ type: "view", path: "/learning" })))).status).toBe(204);
  expect((await cookies()).set).toHaveBeenCalledWith("mc_untracked", "1", expect.objectContaining({ httpOnly: true, secure: true }));
  expect(after).not.toHaveBeenCalled();
});
test("regular learner still schedules a visit", async () => {
  (supabaseServer as jest.Mock).mockResolvedValue({ auth: { getClaims: async () => ({ data: { claims: { sub: "learner", email: "learner@example.com" } } }) } });
  expect((await POST(request(JSON.stringify({ type: "view", path: "/learning" })))).status).toBe(204);
  expect(after).toHaveBeenCalledTimes(1);
});

test("an expired session cannot inherit an old platform attribution cookie", async () => {
  (supabaseServer as jest.Mock).mockResolvedValue({ auth: { getClaims: async () => ({ data: { claims: {} } }) } });
  const values = new Map([["mc_attribution", JSON.stringify({ source: "instagram", medium: "social", campaign: "old", referrer: null })]]);
  const store = { get: jest.fn((key: string) => values.has(key) ? { value: values.get(key) } : undefined), set: jest.fn((key: string, value: string) => { values.set(key, value); }), delete: jest.fn() };
  (cookies as jest.Mock).mockResolvedValue(store);
  await POST(request(JSON.stringify({ type: "view", path: "/" })));
  expect(JSON.parse(values.get("mc_attribution")!)).toMatchObject({ source: null, campaign: null });
});

test("campaign-only tags update the session campaign and Google search persists across routes", async () => {
  (supabaseServer as jest.Mock).mockResolvedValue({ auth: { getClaims: async () => ({ data: { claims: {} } }) } });
  const values = new Map([["mc_sid", "session-1234"], ["mc_vid", "browser-1234"]]);
  (cookies as jest.Mock).mockResolvedValue({ get: (key: string) => values.has(key) ? { value: values.get(key) } : undefined, set: (key: string, value: string) => values.set(key, value) });
  await POST(request(JSON.stringify({ type: "view", path: "/", referrer: "https://www.google.co.in/search?q=private" })));
  expect(JSON.parse(values.get("mc_attribution")!)).toMatchObject({ referrer: "google.co.in", source: null });
  await POST(request(JSON.stringify({ type: "view", path: "/learning", utm: { campaign: "Follow-Up" } })));
  expect(JSON.parse(values.get("mc_attribution")!)).toMatchObject({ referrer: "google.co.in", campaign: "follow-up" });
  expect(values.get("mc_attribution")).not.toContain("private");
});

test("option clicks use the interaction log and retain the visitor session", async () => {
  (supabaseServer as jest.Mock).mockResolvedValue({ auth: { getClaims: async () => ({ data: { claims: { sub: "learner", email: "learner@example.com" } } }) } });
  (after as jest.Mock).mockImplementationOnce(fn => fn());
  const response = await POST(request(JSON.stringify({ type: "interaction", path: "/learning/notes", topic: "React", option: "Next topic", target_path: "/learning/techy" }), { "user-agent": "Mozilla/5.0 Chrome/130.0 Safari/537.36" }));
  expect(response.status).toBe(204);
  expect(recordEvent).toHaveBeenCalledWith(expect.objectContaining({ kind: "site_interaction", action: "click", resource: "/learning/notes", details: expect.objectContaining({ topic: "React", option: "Next topic", visitor_id: expect.any(String), session_id: expect.any(String) }) }));
});

test("query strings cannot be recorded as page paths", async () => {
  expect((await POST(request(JSON.stringify({ type: "interaction", path: "/learning?secret=private", option: "Next" })))).status).toBe(400);
  expect(after).not.toHaveBeenCalled();
});
test("oversized bodies without Content-Length are rejected", async () => {
  expect((await POST(request(JSON.stringify({ type: "view", path: "/", title: "x".repeat(5000) })))).status).toBe(413);
  expect(after).not.toHaveBeenCalled();
});
test("cross-site requests without Origin are rejected", async () => {
  const req = request("{}", { "sec-fetch-site": "cross-site" });
  expect(() => sameOrigin(req)).toThrow(HttpError);
  expect((await POST(req)).status).toBe(403);
});
test("analytics opt-out cannot suppress failed-request security telemetry", async () => {
  (after as jest.Mock).mockImplementationOnce(fn => fn());
  await api(async () => { throw new HttpError(403, "forbidden"); }, request("{}", { cookie: "mc_untracked=1" }));
  expect(recordEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
});
