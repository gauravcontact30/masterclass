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
  method: "POST", headers, body,
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
  expect((await POST(request(JSON.stringify({ type: "view", path: "/dashboard" })))).status).toBe(204);
  expect((await cookies()).set).toHaveBeenCalledWith("mc_untracked", "1", expect.objectContaining({ httpOnly: true, secure: true }));
  expect(after).not.toHaveBeenCalled();
});
test("regular learner still schedules a visit", async () => {
  (supabaseServer as jest.Mock).mockResolvedValue({ auth: { getClaims: async () => ({ data: { claims: { sub: "learner", email: "learner@example.com" } } }) } });
  expect((await POST(request(JSON.stringify({ type: "view", path: "/dashboard" })))).status).toBe(204);
  expect(after).toHaveBeenCalledTimes(1);
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
