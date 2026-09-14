/** @jest-environment node */
import { POST, runtime } from "@/app/api/generate/notebook/route";
import { HttpError, userId } from "@/lib/server/http";
import { account } from "@/lib/server/repository";
import { rateLimit } from "@/lib/server/rate-limit";

// Mock lib/server/http as the download-route test does, but keep its real
// jsonBody/sameOrigin/api so body limits, origin checks and error mapping
// are exercised; only the session lookup is replaced. Supabase is never touched.
jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));
jest.mock("@/lib/server/http", () => ({ ...jest.requireActual("@/lib/server/http"), userId: jest.fn() }));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: jest.fn() }));

jest.mock("@/lib/server/repository",()=>({account:jest.fn().mockResolvedValue({tier:"monthly"})}));
jest.mock("@/lib/server/preparations",()=>({preparationAccess:jest.fn().mockResolvedValue({isSuperAdmin:false,selections:[]})}));

const URL_ = "http://localhost/api/generate/notebook";
const payload = {
  title: "Hashing: \"fast\" lookups / <v2>",
  theme: "high-contrast-dark",
  sections: [{
    heading: "Hash tables",
    markdown: "Average lookup is $O(1)$.",
    code: [{ source: "table = {'a': 1}\nprint(table['a'])" }],
    recall: [{ question: "Why is lookup O(1) on average?", answer: "The hash jumps straight to a bucket." }],
  }],
  summary: ["Hashing trades memory for speed."],
};
const post = (body: string, headers: Record<string, string> = {}) =>
  POST(new Request(URL_, { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost", ...headers }, body }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(account).mockResolvedValue({tier:"monthly",used:0,limit:50,subscription:null,creditBalance:0});
  (userId as jest.Mock).mockResolvedValue("alice");
  (rateLimit as jest.Mock).mockResolvedValue(undefined);
});

test("runs on the Node.js runtime", () => {
  expect(runtime).toBe("nodejs");
});

test("returns a valid .ipynb attachment with private, sanitised download headers", async () => {
  const response = await post(JSON.stringify(payload));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/x-ipynb+json; charset=utf-8");
  expect(response.headers.get("content-disposition")).toBe('attachment; filename="hashing-fast-lookups-v2.ipynb"');
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  const notebook = JSON.parse(await response.text());
  expect(notebook).toMatchObject({ nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { name: "python3" }, artistic_notes: { theme: "high-contrast-dark" } } });
  expect(notebook.cells.some((cell: { cell_type: string; source: string[] }) => cell.cell_type === "code" && cell.source.join("") === "table = {'a': 1}\nprint(table['a'])")).toBe(true);
  expect(rateLimit).toHaveBeenCalledWith("artistic-notes:notebook:alice", 20);
});

test("answers 400 invalid_request for a body that fails the schema", async () => {
  const invalid: Partial<typeof payload> = { ...payload };
  delete invalid.summary;
  const response = await post(JSON.stringify(invalid));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "invalid_request" });
  expect(response.headers.get("cache-control")).toBe("no-store");
});

test("answers 400 for unknown keys and for malformed JSON", async () => {
  expect((await post(JSON.stringify({ ...payload, kernel: "julia" }))).status).toBe(400);
  const malformed = await post("{\"title\": ");
  expect(malformed.status).toBe(400);
  expect(await malformed.json()).toEqual({ error: "invalid_request" });
});

test("answers 413 before parsing a body over the notebook limit", async () => {
  const huge = JSON.stringify({ ...payload, sections: [{ ...payload.sections[0], markdown: "x".repeat(210_000) }] });
  const response = await post(huge);
  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({ error: "request_too_large" });
  const declared = await post(JSON.stringify(payload), { "content-length": "500000" });
  expect(declared.status).toBe(413);
});

test("rejects cross-origin posts before authenticating", async () => {
  const response = await post(JSON.stringify(payload), { origin: "https://evil.example" });
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "invalid_origin" });
  expect(userId).not.toHaveBeenCalled();
  expect(rateLimit).not.toHaveBeenCalled();
});

test("requires a signed-in user", async () => {
  (userId as jest.Mock).mockRejectedValue(new HttpError(401, "signin_required"));
  const response = await post(JSON.stringify(payload));
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "signin_required" });
  expect(rateLimit).not.toHaveBeenCalled();
});

test("stops at the rate limit without building anything", async () => {
  (rateLimit as jest.Mock).mockRejectedValue(new HttpError(429, "rate_limited"));
  const response = await post(JSON.stringify(payload));
  expect(response.status).toBe(429);
  expect(await response.json()).toEqual({ error: "rate_limited" });
});

test("unsubscribed accounts cannot export notebooks",async()=>{jest.mocked(account).mockResolvedValue({tier:"free",used:0,limit:0,subscription:null,creditBalance:0});const response=await post(JSON.stringify(payload));expect(response.status).toBe(402);expect(await response.json()).toEqual({error:"subscription_required"});});
