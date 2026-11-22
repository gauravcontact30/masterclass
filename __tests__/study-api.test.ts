/** @jest-environment node */
import { GET, POST } from "@/app/api/study/[id]/route";
import { GET as list } from "@/app/api/study/route";
import { userId } from "@/lib/server/http";
import { preparationAccess } from "@/lib/server/preparations";
import { account } from "@/lib/server/repository";
import { STUDY_COURSES } from "@/lib/study/catalog";
jest.mock("@/lib/server/http", () => ({ ...jest.requireActual("@/lib/server/http"), userId: jest.fn() }));
jest.mock("@/lib/server/preparations", () => ({ preparationAccess: jest.fn() }));
jest.mock("@/lib/server/repository", () => ({ account: jest.fn() }));
const context = (id: string) => ({ params: Promise.resolve({ id }) });
// The study catalogue now holds IELTS and the system design case studies (board courses moved to the exam portals).
// "system-design" unlocks every design case study; counts come from the catalogue so the tests follow it.
const DESIGN = STUDY_COURSES.filter(course => course.category === "course");
beforeEach(() => { jest.mocked(userId).mockResolvedValue("student"); jest.mocked(preparationAccess).mockResolvedValue({ selections: ["system-design"], isSuperAdmin: false }); jest.mocked(account).mockResolvedValue({ tier: "free", used: 0, limit: 3, subscription: null, creditBalance: 0 }); });
test("list returns only selected preparation and forged URLs do not expose other notes", async () => {
  const response = await list(new Request("http://localhost/api/study")); const data = await response.json(); expect(data.courses).toHaveLength(DESIGN.length);
  const denied = await GET(new Request("http://localhost/api/study/ielts"), context("ielts")); expect(denied.status).toBe(404);
  const deniedForged = await GET(new Request("http://localhost/api/study/ielts?admin=true"), context("ielts")); expect(deniedForged.status).toBe(404);
});
test("client query parameters cannot bypass subscription access", async () => {
  const response = await GET(new Request("http://localhost/api/study/design-payments?tier=yearly"), context("design-payments"));
  expect(response.status).toBe(402); expect(await response.json()).toEqual({error:"subscription_required"});
  const invalid = await GET(new Request("http://localhost/api/study/design-payments?language=fr"), context("design-payments")); expect(invalid.status).toBe(400);
});
test("grading rejects hidden question IDs and cross-origin submissions", async () => {
  jest.mocked(account).mockResolvedValue({tier:"monthly",used:0,limit:50,subscription:null,creditBalance:0});
  const pack = (await (await GET(new Request("http://localhost/api/study/design-payments"), context("design-payments"))).json()).pack;
  const paper = pack.papers[0];
  const request = (answers: object, origin = "http://localhost") => new Request("http://localhost/api/study/design-payments", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ paperId: paper.id, language: "en", answers }) });
  expect((await POST(request({ "forged-question": 0 }), context("design-payments"))).status).toBe(400);
  expect((await POST(request({}, "https://elsewhere.example"), context("design-payments"))).status).toBe(403);
  const response = await POST(request({}), context("design-payments")); expect(response.status).toBe(200); expect((await response.json()).result.unanswered).toBeGreaterThan(0);
});
test("verified server admin access includes every published guide", async () => {
  jest.mocked(preparationAccess).mockResolvedValue({ selections: [], isSuperAdmin: true });
  expect((await (await list(new Request("http://localhost/api/study"))).json()).courses).toHaveLength(STUDY_COURSES.length);
  const response = await GET(new Request("http://localhost/api/study/ielts"), context("ielts"));
  expect((await response.json()).pack.lessons.length).toBeGreaterThan(0);
});
