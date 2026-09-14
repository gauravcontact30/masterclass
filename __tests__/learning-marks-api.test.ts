/** @jest-environment node */
import { GET, PUT, DELETE, POST } from "@/app/api/learning-marks/route";

let mockOwner: string | null = "alice";
const mockList = jest.fn(async () => ({ marks: [], nextCursor: null as string | null }));
const mockSave = jest.fn(async (_owner: string, mark: unknown) => mark);
const mockRemove = jest.fn(async () => {});
jest.mock("@/lib/server/config", () => ({ authConfigured: () => true }));
jest.mock("@/lib/server/auth", () => ({ supabaseServer: async () => ({ auth: { getUser: async () => ({ data: { user: mockOwner ? { id: mockOwner } : null } }) } }) }));
jest.mock("@/lib/server/learning-marks", () => ({ listLearningMarks: (...args: unknown[]) => mockList(...args as []), saveLearningMark: (...args: [string, unknown]) => mockSave(...args), removeLearningMark: (...args: unknown[]) => mockRemove(...args as []) }));
const id = "00000000-0000-4000-8000-000000000001";
const body = { id, expectedUserId: "alice", contentKey: "lesson", kind: "highlight", color: "teal", quote: "event loop", prefix: "", suffix: "", start: 0, end: 10 };
const request = (method: string, value: unknown = body, origin = "http://localhost") => new Request("http://localhost/api/learning-marks", { method, headers: { origin, "Content-Type": "application/json" }, body: method === "GET" ? undefined : JSON.stringify(value) });
beforeEach(() => { mockOwner = "alice"; mockList.mockResolvedValue({ marks: [], nextCursor: null }); });
test.each([GET, PUT, DELETE, POST])("requires a signed-in account", async route => {
  mockOwner = null;
  const response = await route(request(route === GET ? "GET" : route === PUT ? "PUT" : route === DELETE ? "DELETE" : "POST"));
  expect(response.status).toBe(401); expect(mockSave).not.toHaveBeenCalled();
});
test("hover batches validate every owner and report individual save failures for retry", async () => {
  expect((await POST(request("POST", { marks: [{ ...body, expectedUserId: "bob" }] }))).status).toBe(409);
  expect((await POST(request("POST", { marks: [body, body] }))).status).toBe(400);
  mockSave.mockRejectedValueOnce(Error("offline"));
  const response = await POST(request("POST", { marks: [body] }));
  expect(await response.json()).toMatchObject({ marks: [], failedIds: [id] });
});
test("rejects forged origins, changed accounts, unsupported colors and inconsistent anchors", async () => {
  expect((await PUT(request("PUT", body, "https://other.test"))).status).toBe(403);
  expect((await PUT(request("PUT", { ...body, expectedUserId: "bob" }))).status).toBe(409);
  expect((await PUT(request("PUT", { ...body, color: "url(javascript:bad)" }))).status).toBe(400);
  expect((await PUT(request("PUT", { ...body, end: 9 }))).status).toBe(400);
  expect(mockSave).not.toHaveBeenCalled();
});
test("saves under the server-authenticated owner and returns a non-cacheable record", async () => {
  const response = await PUT(request("PUT"));
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(mockSave).toHaveBeenCalledWith("alice", expect.objectContaining({ id, color: "teal" }));
  expect((await response.json()).mark).toMatchObject({ contentKey: "lesson", start: 0, end: 10 });
});
test("deletion and listing are owner-scoped; list supports more than one database page", async () => {
  await DELETE(request("DELETE", { id, expectedUserId: "alice" }));
  expect(mockRemove).toHaveBeenCalledWith("alice", id);
  mockList.mockResolvedValue({ marks: [], nextCursor: "250" });
  const response = await GET(request("GET")); const data = await response.json();
  expect(mockList).toHaveBeenCalledWith("alice", 0); expect(data.nextCursor).toBe("250");
});
