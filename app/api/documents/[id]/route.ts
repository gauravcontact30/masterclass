import { api, userId } from "@/lib/server/http";
import { ownedDocument, signedPath } from "@/lib/server/repository";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  const owner = await userId(); const { id } = await context.params; const item = await ownedDocument(id,owner);
  const url = item.status === "ready" && item.storage_path ? await signedPath(item.storage_path) : null;
  const previews = item.status === "ready" ? await Promise.all(item.preview_paths.map(signedPath)) : [];
  return Response.json({ document: item, url, previews });
}); }
