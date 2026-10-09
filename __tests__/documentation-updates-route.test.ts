/** @jest-environment node */
import { GET, POST } from "@/app/api/documentation-updates/route";
import { checkDocumentation, importDocumentation, listDocumentationUpdates } from "@/lib/server/documentation-updates";
import { rateLimit } from "@/lib/server/rate-limit";

jest.mock("@/lib/server/documentation-updates", () => ({ checkDocumentation: jest.fn(), importDocumentation: jest.fn(), listDocumentationUpdates: jest.fn(), readDocumentation: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));

const request = (body: unknown, origin = "http://localhost") => new Request("http://localhost/api/documentation-updates", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => jest.clearAllMocks());

test("rejects cross-origin updates before accessing storage", async () => {
  expect((await POST(request({ action: "check", ids: ["react"] }, "https://attacker.test"))).status).toBe(403);
  expect(checkDocumentation).not.toHaveBeenCalled();
});
test("rejects arbitrary URLs and oversized batches", async () => {
  expect((await POST(request({ action: "check", ids: ["https://localhost"] }))).status).toBe(400);
  expect((await POST(request({ action: "check", ids: ["react", "next", "rust", "python"] }))).status).toBe(400);
  expect(checkDocumentation).not.toHaveBeenCalled();
});
test("reports partial failures without claiming every source is current", async () => {
  (checkDocumentation as jest.Mock).mockResolvedValueOnce({ id: "react", status: "changed" }).mockRejectedValueOnce(new Error("timeout"));
  const response = await POST(request({ action: "check", ids: ["react", "nextjs"] }));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.results[0].update.status).toBe("changed");
  expect(body.results[1].error).toMatch(/could not be checked/);
  expect(rateLimit).toHaveBeenCalledWith("documentation-updates:public-sources", 120, 3600);
});
test("imports only the exact reviewed source revision", async () => {
  const hash = "a".repeat(64);
  (importDocumentation as jest.Mock).mockResolvedValue({ id: "react", status: "current" });
  expect((await POST(request({ action: "import", id: "react", hash }))).status).toBe(200);
  expect(importDocumentation).toHaveBeenCalledWith("react", hash);
  expect((await POST(request({ action: "import", id: "react" }))).status).toBe(400);
});
test("status reads never fetch from an official website", async () => {
  (listDocumentationUpdates as jest.Mock).mockResolvedValue([]);
  expect((await GET(new Request("http://localhost/api/documentation-updates"))).status).toBe(200);
  expect(checkDocumentation).not.toHaveBeenCalled();
});
