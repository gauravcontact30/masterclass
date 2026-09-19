import { api, userId, HttpError } from "@/lib/server/http";
import { ownedDocument } from "@/lib/server/repository";
import { curriculumNotes } from "@/lib/notes";
import { recordEvent } from "@/lib/server/monitoring";
/** The notes as a UTF-8 text file (with a BOM, so Windows editors detect Devanagari). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  const owner = await userId(); const { id } = await context.params; const item = await ownedDocument(id,owner);
  if (item.status !== "ready" || !item.curriculum) throw new HttpError(409,"not_ready");
  const body = "\uFEFF"+curriculumNotes(item.curriculum,item.title,item.request.language);
  await recordEvent({ kind: "export", action: "download_notes", actor_id: owner, resource: id, bytes: Buffer.byteLength(body) });
  return new Response(body, {headers:{
    "Content-Type":"text/plain; charset=utf-8",
    "Content-Disposition":`attachment; filename="masterclass-${id.replace(/[^a-zA-Z0-9-]/g, "")}-notes.txt"`,
    "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff",
  }});
}, _request); }
