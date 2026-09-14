/** @jest-environment node */
import { GET } from "@/app/api/notes/[id]/route";
import NotesRedirect from "@/app/notes/page";
import { redirect } from "next/navigation";
import { NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

test("legacy notes URLs preserve their filters while redirecting into dashboard", async () => {
  await NotesRedirect({ searchParams: Promise.resolve({ q: "use state", kind: "Hooks" }) });
  expect(redirect).toHaveBeenCalledWith("/dashboard/notes?q=use+state&kind=Hooks");
});
test("the public built-in detail endpoint returns a card and rejects unknown IDs", async () => {
  const id = NOTES_SUMMARIES[0].id;
  const response = await GET(new Request(`http://localhost/api/notes/${id}`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(200);
  expect((await response.json()).note.id).toBe(id);
  const missing = await GET(new Request("http://localhost/api/notes/unknown"), { params: Promise.resolve({ id: "unknown" }) });
  expect(missing.status).toBe(404);
});
