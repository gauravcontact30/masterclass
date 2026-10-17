/** @jest-environment node */
import { api, HttpError } from "@/lib/server/http";
import { recordEvent } from "@/lib/server/monitoring";
jest.mock("next/server", () => ({ after: (fn: () => void) => fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));

test.each([200, 400])("response %s shares a generated ID with its monitoring entry", async status => {
  const response = await api(async () => {
    if (status === 400) throw new HttpError(400, "invalid_request");
    return Response.json({ ok: true });
  }, new Request("http://localhost/api/example?secret=hidden", { headers: { "X-Request-ID": "untrusted" } }));
  const id = response.headers.get("X-Request-ID");
  expect(id).toMatch(/^[a-f0-9-]{36}$/);
  expect(recordEvent).toHaveBeenCalledWith(expect.objectContaining({ status, resource: "/api/example", details: { request_id: id } }));
  expect(JSON.stringify((recordEvent as jest.Mock).mock.calls)).not.toContain("secret");
});
