/** @jest-environment node */
import { GET } from "@/app/api/notes/[id]/route";
import NotesRedirect from "@/app/notes/page";
import { redirect } from "next/navigation";
import { NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";
import { requirePaidAccess } from "@/lib/server/subscription-access";
jest.mock("@/lib/server/http",()=>({...jest.requireActual("@/lib/server/http"),userId:jest.fn().mockResolvedValue("learner")}));
jest.mock("@/lib/server/subscription-access",()=>({requirePaidAccess:jest.fn().mockResolvedValue({id:"learner"})}));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

test("legacy notes URLs preserve their filters while redirecting into dashboard", async () => {
  await NotesRedirect({ searchParams: Promise.resolve({ q: "use state", kind: "Hooks" }) });
  expect(redirect).toHaveBeenCalledWith("/learning/notes?q=use+state&kind=Hooks");
});
test("the paid built-in detail endpoint returns a card and rejects unknown IDs", async () => {
  const id = NOTES_SUMMARIES[0].id;
  const response = await GET(new Request(`http://localhost/api/notes/${id}`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(200);
  expect((await response.json()).note.id).toBe(id);
  expect(requirePaidAccess).toHaveBeenCalledWith("learner");
  expect(response.headers.get("cache-control")).toContain("private, no-store");
  const missing = await GET(new Request("http://localhost/api/notes/unknown"), { params: Promise.resolve({ id: "unknown" }) });
  expect(missing.status).toBe(404);
});

test("unpaid users cannot bypass membership using a direct note URL",async()=>{
  const {HttpError}=jest.requireActual("@/lib/server/http");
  jest.mocked(requirePaidAccess).mockRejectedValueOnce(new HttpError(402,"subscription_required"));
  const response=await GET(new Request("http://localhost/api/notes/direct"),{params:Promise.resolve({id:NOTES_SUMMARIES[0].id})});
  expect(response.status).toBe(402);
});
