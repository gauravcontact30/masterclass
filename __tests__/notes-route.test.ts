/** @jest-environment node */
import { GET } from "@/app/api/notes/[id]/route";
import nextConfig from "@/next.config";
import { NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";
import { requirePaidAccess } from "@/lib/server/subscription-access";
jest.mock("@/lib/server/http",()=>({...jest.requireActual("@/lib/server/http"),userId:jest.fn().mockResolvedValue("learner")}));
jest.mock("@/lib/server/subscription-access",()=>({requirePaidAccess:jest.fn().mockResolvedValue({id:"learner"})}));

// The legacy /notes page became a permanent redirect in next.config.ts (a page-level redirect() was prerendered as a
// 200 shell); Next.js carries the query string across a config redirect, so filters survive.
test("legacy notes URLs redirect permanently into the dashboard", async () => {
  const rules = await nextConfig.redirects!();
  expect(rules).toContainEqual(expect.objectContaining({ source: "/notes", destination: "/learning/notes", permanent: true }));
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
