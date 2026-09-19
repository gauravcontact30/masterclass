import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin, userId } from "@/lib/server/http";
import { authConfigured } from "@/lib/server/config";
import { bookmarkDraftSchema, bookmarkSchema } from "@/lib/bookmarks";
import { listBookmarks, removeBookmark, saveBookmark } from "@/lib/server/bookmarks";

export async function GET(request: Request) {
  return api(async () => {
    if (!authConfigured()) return Response.json({ userId: "demo", bookmarks: [], nextCursor: null });
    const owner = await userId();
    const offset = z.coerce.number().int().min(0).max(10000000).parse(new URL(request.url).searchParams.get("after") ?? 0);
    return Response.json({ userId: owner, ...await listBookmarks(owner, offset) });
  }, request);
}
export async function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await userId();
    const value = z.object({ expectedUserId: z.string(), bookmark: bookmarkDraftSchema }).strict().parse(await jsonBody(request, 3000000));
    if (value.expectedUserId !== owner) throw new HttpError(409, "account_changed");
    return Response.json({ userId: owner, bookmark: await saveBookmark(owner, value.bookmark) });
  }, request);
}
export async function DELETE(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await userId();
    const value = z.object({ expectedUserId: z.string(), id: bookmarkSchema.shape.id }).strict().parse(await jsonBody(request));
    if (value.expectedUserId !== owner) throw new HttpError(409, "account_changed");
    await removeBookmark(owner, value.id);
    return Response.json({ userId: owner });
  }, request);
}
