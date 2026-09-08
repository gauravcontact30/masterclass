import { api, userId, jsonBody, sameOrigin, HttpError } from "@/lib/server/http";
import { ownedDocument } from "@/lib/server/repository";
import { db, check } from "@/lib/server/db";
import { progressSchema } from "@/lib/domain";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  sameOrigin(request); const owner = await userId(); const { id } = await context.params; const item = await ownedDocument(id,owner);
  const data = progressSchema.parse(await jsonBody(request,100000));
  if(item.status !== "ready" || data.page > item.page_titles.length || data.bookmarks.some(page => page > item.page_titles.length)) throw new HttpError(400,"invalid_request");
  check(await db().from("learning_progress").upsert({ ...data, user_id: owner, document_id:id, updated_at: new Date().toISOString() },{ onConflict:"user_id,document_id" }));
  return Response.json({ ok:true });
}); }
