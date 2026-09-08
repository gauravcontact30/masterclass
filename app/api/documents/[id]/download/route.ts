import { api, userId, HttpError } from "@/lib/server/http";
import { ownedDocument } from "@/lib/server/repository";
import { db, check } from "@/lib/server/db";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  const owner = await userId(); const { id } = await context.params; const item = await ownedDocument(id,owner);
  if (item.status !== "ready" || !item.storage_path) throw new HttpError(409,"not_ready");
  const result = check(await db().storage.from("generated-docs").createSignedUrl(item.storage_path,60,{ download: `masterclass-${id}.${item.request.format}` }));
  if(!result)throw new HttpError(500,"service_error");const {signedUrl}=result;
  return Response.redirect(signedUrl,303);
}); }
