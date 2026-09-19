/** @jest-environment node */
import { GET, PUT, DELETE } from "@/app/api/bookmarks/route";
import { bookmarkDraftSchema, bookmarkIdentity } from "@/lib/bookmarks";

let mockOwner: string | null = "alice";
const mockList = jest.fn(async (_owner: string, _offset: number) => ({ bookmarks: [], nextCursor: 100 }));
const mockSave = jest.fn(async (_owner: string, bookmark: unknown) => bookmark);
const mockRemove = jest.fn(async (_owner: string, _id: string) => {});
jest.mock("@/lib/server/config", () => ({ authConfigured: () => true }));
jest.mock("@/lib/server/auth", () => ({ supabaseServer: async () => ({ auth: { getUser: async () => ({ data: { user: mockOwner ? { id: mockOwner } : null } }) } }) }));
jest.mock("@/lib/server/bookmarks", () => ({ listBookmarks: (...args: [string, number]) => mockList(...args), saveBookmark: (...args: [string, unknown]) => mockSave(...args), removeBookmark: (...args: [string, string]) => mockRemove(...args) }));
const bookmark = { sourceKey: "agentic-ai-lesson-6", title: "Agentic AI essentials", technology: "agentic-ai", href: "/dashboard/notes?note=agentic-ai-lesson-6", points: ["Use bounded tool loops."] };
const request = (method: string, body: unknown, origin = "https://app.test") => new Request("https://app.test/api/bookmarks", { method, headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { mockOwner = "alice"; });
test("saves privately under the authenticated owner", async () => {
  const response = await PUT(request("PUT", { expectedUserId: "alice", bookmark }));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(mockSave).toHaveBeenCalledWith("alice", bookmark);
});
test("rejects account mismatch, cross-origin writes, unsafe links and signed-out requests", async () => {
  expect((await PUT(request("PUT", { expectedUserId: "bob", bookmark }))).status).toBe(409);
  expect((await PUT(request("PUT", { expectedUserId: "alice", bookmark }, "https://other.test"))).status).toBe(403);
  expect((await PUT(request("PUT", { expectedUserId: "alice", bookmark: { ...bookmark, href: "javascript:alert(1)" } }))).status).toBe(400);
  mockOwner = null;
  expect((await PUT(request("PUT", { expectedUserId: "alice", bookmark }))).status).toBe(401);
  expect(mockSave).not.toHaveBeenCalled();
});
test("lists paginated records and deletes only within the owner's folder", async () => {
  const response = await GET(new Request("https://app.test/api/bookmarks?after=100"));
  expect(mockList).toHaveBeenCalledWith("alice", 100);
  expect((await response.json()).nextCursor).toBe(100);
  expect((await DELETE(request("DELETE", { expectedUserId: "alice", id: "a".repeat(64) }))).status).toBe(200);
  expect(mockRemove).toHaveBeenCalledWith("alice", "a".repeat(64));
  expect((await DELETE(request("DELETE", { expectedUserId: "alice", id: "../bob" }))).status).toBe(400);
});
test("identity deduplicates the same key point and retains distinct sources", () => {
  expect(bookmarkIdentity(bookmark)).toBe(bookmarkIdentity({ ...bookmark, points: [" Use bounded tool loops. "] }));
  expect(bookmarkIdentity(bookmark)).not.toBe(bookmarkIdentity({ ...bookmark, sourceKey: "other" }));
  expect(bookmarkDraftSchema.safeParse({ ...bookmark, points: [] }).success).toBe(false);
  expect(bookmarkDraftSchema.safeParse({ ...bookmark, href: "//attacker.test/dashboard" }).success).toBe(false);
});
