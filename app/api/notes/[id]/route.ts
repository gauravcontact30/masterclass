import { getStudyNote } from "@/lib/server/notes-study-catalog";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = getStudyNote(id);
  if (!note) return Response.json({ error: "Note not found" }, { status: 404 });
  return Response.json({ note }, { headers: { "Cache-Control": "public, max-age=300" } });
}
