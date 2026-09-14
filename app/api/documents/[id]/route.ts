import { api, HttpError, sameOrigin, userId } from "@/lib/server/http";
import { ownedDocument } from "@/lib/server/repository";
import { isSharedLibraryPath } from "@/lib/server/default-library";
import { check, db } from "@/lib/server/db";
/** The full notes document, curriculum included, for the Learn in App reader and for copying. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  const owner = await userId(); const { id } = await context.params;
  return Response.json({ document: await ownedDocument(id,owner) });
}); }
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  sameOrigin(request); const owner = await userId(); const { id } = await context.params;
  const item = await ownedDocument(id,owner,false);
  // A worker may still be generating a queued or generating job; only ready
  // or failed documents are safe to remove.
  if (item.status === "queued" || item.status === "generating") throw new HttpError(409,"delete_in_progress");
  // Notes carry no files, but documents from before notes became the only
  // format may still own uploads. Shared seeded objects are never removed.
  const paths = [item.storage_path, ...(item.preview_paths ?? [])].filter((p): p is string => Boolean(p)).filter(p => !isSharedLibraryPath(p));
  if (paths.length) await db().storage.from("generated-docs").remove(paths);
  check(await db().from("documents").delete().eq("id",id).eq("user_id",owner));
  return Response.json({ ok: true });
}); }
