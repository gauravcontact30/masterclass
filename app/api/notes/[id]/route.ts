import { getStudyNote } from "@/lib/server/notes-study-catalog";
import { api, userId } from "@/lib/server/http";
import { requirePaidAccess } from "@/lib/server/subscription-access";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return api(async () => {
  await requirePaidAccess(await userId());
  const { id } = await params;
  const note = getStudyNote(id);
  if (!note) return Response.json({ error: "Note not found" }, { status: 404 });
  return Response.json({ note });
  }, _request);
}
