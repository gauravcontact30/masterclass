/** @jest-environment node */
import { GET, POST } from "@/app/api/study/[id]/route";
import { GET as list } from "@/app/api/study/route";
import { userId } from "@/lib/server/http";
import { preparationAccess } from "@/lib/server/preparations";
import { account } from "@/lib/server/repository";
jest.mock("@/lib/server/http", () => ({ ...jest.requireActual("@/lib/server/http"), userId: jest.fn() }));
jest.mock("@/lib/server/preparations", () => ({ preparationAccess: jest.fn() }));
jest.mock("@/lib/server/repository", () => ({ account: jest.fn() }));
const context = (id: string) => ({ params: Promise.resolve({ id }) });
beforeEach(() => { jest.mocked(userId).mockResolvedValue("student"); jest.mocked(preparationAccess).mockResolvedValue({ selections: ["cbse-10"], isSuperAdmin: false }); jest.mocked(account).mockResolvedValue({ tier: "free", used: 0, limit: 3, subscription: null, creditBalance: 0 }); });
test("list returns only selected preparation and forged URLs do not expose other notes", async () => {
  const response = await list(new Request("http://localhost/api/study")); const data = await response.json(); expect(data.courses).toHaveLength(8);
  const denied = await GET(new Request("http://localhost/api/study/neet"), context("neet")); expect(denied.status).toBe(404);
  const deniedDesign = await GET(new Request("http://localhost/api/study/design-payments?admin=true"), context("design-payments")); expect(deniedDesign.status).toBe(404);
});
test("client query parameters cannot bypass subscription access", async () => {
  const response = await GET(new Request("http://localhost/api/study/cbse-10-maths?tier=yearly"), context("cbse-10-maths"));
  expect(response.status).toBe(402); expect(await response.json()).toEqual({error:"subscription_required"});
  const invalid = await GET(new Request("http://localhost/api/study/cbse-10-maths?language=fr"), context("cbse-10-maths")); expect(invalid.status).toBe(400);
});
test("grading rejects hidden question IDs and cross-origin submissions", async () => {
  jest.mocked(account).mockResolvedValue({tier:"monthly",used:0,limit:50,subscription:null,creditBalance:0});
  const request = (answers: object, origin = "http://localhost") => new Request("http://localhost/api/study/cbse-10-maths", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ paperId: "cbse-10-maths-practice", language: "en", answers }) });
  expect((await POST(request({ "forged-question": 0 }), context("cbse-10-maths"))).status).toBe(400);
  expect((await POST(request({}, "https://elsewhere.example"), context("cbse-10-maths"))).status).toBe(403);
  const response = await POST(request({}), context("cbse-10-maths")); expect(response.status).toBe(200); expect((await response.json()).result.unanswered).toBe(3);
});
test("verified server admin access includes every published guide", async () => {
  jest.mocked(preparationAccess).mockResolvedValue({ selections: [], isSuperAdmin: true });
  expect((await (await list(new Request("http://localhost/api/study"))).json()).courses).toHaveLength(200);
  const response = await GET(new Request("http://localhost/api/study/design-payments"), context("design-payments"));
  expect((await response.json()).pack.lessons).toHaveLength(8);
});
