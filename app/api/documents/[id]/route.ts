import { api, HttpError, sameOrigin, userId } from "@/lib/server/http";
import { ownedDocument, signedPath } from "@/lib/server/repository";
import { check, db } from "@/lib/server/db";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  const owner = await userId(); const { id } = await context.params; const item = await ownedDocument(id,owner);
  const url = item.status === "ready" && item.storage_path ? await signedPath(item.storage_path) : null;
  const previews = item.status === "ready" ? await Promise.all(item.preview_paths.map(signedPath)) : [];
  return Response.json({ document: item, url, previews });
}); }
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  sameOrigin(request); const owner = await userId(); const { id } = await context.params;
  const item = await ownedDocument(id,owner);
  // A worker may still be about to write to storage_path for a queued or
  // generating job; deleting the row out from under it would orphan that
  // upload. Only ready or failed documents are safe to remove.
  if (item.status === "queued" || item.status === "generating") throw new HttpError(409,"delete_in_progress");
  const paths = [item.storage_path, ...item.preview_paths].filter((p): p is string => Boolean(p));
  if (paths.length) await db().storage.from("generated-docs").remove(paths);
  check(await db().from("documents").delete().eq("id",id).eq("user_id",owner));
  return Response.json({ ok: true });
}); }
