import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { account } from "@/lib/server/repository";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { rateLimit } from "@/lib/server/rate-limit";
import { getPublishedTechBuzzArticle } from "@/lib/server/tech-buzz-storage";
import { addComment, removeComment } from "@/lib/server/tech-buzz-marks";

/*
 * The discussion on a Tech Buzz story (migration 0051), part of what membership unlocks. The thread itself is read through
 * /api/tech-buzz/[slug]/member. POST { text }: posts under the reader's account name. DELETE ?id=: removes their own
 * comment, or any comment for a super admin.
 */
type Params = { params: Promise<{ slug: string }> };
const bodySchema = z.object({ text: z.string().trim().min(1).max(1000) });

async function story(params: Params["params"]) {
  const article = await getPublishedTechBuzzArticle((await params).slug);
  if (!article) throw new HttpError(404, "not_found");
  return article;
}

export async function POST(request: Request, { params }: Params) {
  return api(async () => {
    sameOrigin(request);
    const article = await story(params);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "signin_required");
    if (!isSuperAdminUser(user) && (await account(user.id)).tier === "free") throw new HttpError(402, "subscription_required");
    await rateLimit(`tech-buzz:comments:${user.id}`, 10, 60);
    const comment = await addComment(article.id, user, bodySchema.parse(await jsonBody(request, 4000)).text);
    if (!comment) throw new HttpError(503, "comments_unavailable");
    return Response.json({ comment }, { status: 201 });
  }, request);
}

export async function DELETE(request: Request, { params }: Params) {
  return api(async () => {
    sameOrigin(request);
    const article = await story(params);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "signin_required");
    await rateLimit(`tech-buzz:comments:${user.id}`, 10, 60);
    const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
    if (!id.success || !await removeComment(article.id, id.data, user.id, isSuperAdminUser(user))) throw new HttpError(404, "not_found");
    return Response.json({ ok: true });
  }, request);
}
