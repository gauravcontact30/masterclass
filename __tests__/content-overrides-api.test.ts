/** @jest-environment node */
import { POST } from "@/app/api/content-overrides/route";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { HttpError } from "@/lib/server/http";
import { parseContentChange } from "@/lib/server/content-overrides";
import { revalidateTag } from "next/cache";
jest.mock("@/lib/server/super-admin", () => ({ requireSuperAdmin: jest.fn() }));
jest.mock("@/lib/server/db", () => ({ db: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));
jest.mock("next/cache", () => ({ cacheLife: jest.fn(), cacheTag: jest.fn(), revalidateTag: jest.fn() }));

const post = (body: unknown) => POST(new Request("https://example.test/api/content-overrides", { method: "POST", headers: { "Content-Type": "application/json", origin: "https://example.test" }, body: JSON.stringify(body) }));
beforeEach(() => { jest.clearAllMocks(); (requireSuperAdmin as jest.Mock).mockResolvedValue({ id: "owner", email: "owner@example.com" }); });

function fakeDb(existing: unknown) {
  const calls: Record<string, unknown[]> = { upsert: [], delete: [], insert: [] };
  const table = {
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existing, error: null }) }) }),
    upsert: async (row: unknown) => { calls.upsert.push(row); return { error: null }; },
    delete: () => ({ eq: async (_: string, key: string) => { calls.delete.push(key); return { error: null }; } }),
    insert: async (row: unknown) => { calls.insert.push(row); return { error: null }; },
  };
  (db as jest.Mock).mockReturnValue({ from: () => table });
  return calls;
}

test("a non-admin cannot change content, and nothing is read or written", async () => {
  (requireSuperAdmin as jest.Mock).mockRejectedValue(new HttpError(403, "forbidden"));
  expect((await post({ action: "delete", key: "pulse:a" })).status).toBe(403);
  expect(db).not.toHaveBeenCalled();
});

test("an edit is saved, recorded in the history and published to every page at once", async () => {
  const calls = fakeDb({ fields: { category: "Old" }, deleted: false });
  const response = await post({ action: "edit", key: "pulse:a", field: "title", value: "  New title  " });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ key: "pulse:a", override: { fields: { category: "Old", title: "New title" }, deleted: false } });
  expect(calls.upsert[0]).toMatchObject({ key: "pulse:a", fields: { category: "Old", title: "New title" }, updated_by: "owner@example.com" });
  expect(calls.insert[0]).toMatchObject({ key: "pulse:a", action: "edit", field: "title", after: "New title" });
  expect(revalidateTag).toHaveBeenCalledWith("content-overrides", { expire: 0 });
  expect(revalidateTag).toHaveBeenCalledWith("landing", { expire: 0 });
});

test("resetting the last edited field removes the row, so the built-in content returns", async () => {
  const calls = fakeDb({ fields: { title: "Edited" }, deleted: false });
  await post({ action: "reset", key: "pulse:a", field: "title" });
  expect(calls.delete).toEqual(["pulse:a"]);
  expect(calls.upsert).toHaveLength(0);
});

test("rejects malformed keys, fields and empty or oversized text", () => {
  expect(() => parseContentChange({ action: "edit", key: "no-colon", field: "title", value: "x" })).toThrow(HttpError);
  expect(() => parseContentChange({ action: "edit", key: "pulse:a", field: "__proto__", value: "x" })).toThrow(HttpError);
  expect(() => parseContentChange({ action: "edit", key: "pulse:a", field: "title", value: "   " })).toThrow(HttpError);
  expect(() => parseContentChange({ action: "edit", key: "pulse:a", field: "title", value: "x".repeat(20001) })).toThrow(HttpError);
  expect(() => parseContentChange({ action: "drop", key: "pulse:a" })).toThrow(HttpError);
});
