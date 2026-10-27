import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { getPublishedTechBuzzArticle } from "@/lib/server/tech-buzz-storage";
import { clapState, giveClaps, MAX_CLAPS } from "@/lib/server/tech-buzz-claps";

/*
 * Medium-style claps on a Tech Buzz story (migration 0042). GET: the story's total, how many readers clapped and the
 * signed-in reader's own claps. POST { count }: adds a batch of claps (the button sends a press-and-hold burst as one
 * request), capped at MAX_CLAPS per reader per story. DELETE: undoes the reader's claps. Giving claps needs a session.
 */
type Params = { params: Promise<{ slug: string }> };
const bodySchema = z.object({ count: z.number().int().min(1).max(MAX_CLAPS) });

async function story(params: Params["params"]) {
  const article = await getPublishedTechBuzzArticle((await params).slug);
  if (!article) throw new HttpError(404, "not_found");
  return article;
}

export async function GET(request: Request, { params }: Params) {
  return api(async () => {
    const article = await story(params);
    const user = await currentUser();
    return Response.json({ ...(await clapState(article, user?.id ?? null)), max: MAX_CLAPS, signedIn: !!user });
  }, request);
}

async function change(request: Request, params: Params["params"], count: (body: unknown) => number) {
  sameOrigin(request);
  const article = await story(params);
  const user = await currentUser();
  if (!user) throw new HttpError(401, "signin_required");
  await rateLimit(`tech-buzz:claps:${user.id}`, 40, 60);
  const state = await giveClaps(article, user.id, count(request.method === "POST" ? await jsonBody(request, 200) : null));
  if (!state) throw new HttpError(503, "claps_unavailable");
  return Response.json({ ...state, max: MAX_CLAPS, signedIn: true });
}

export async function POST(request: Request, { params }: Params) {
  return api(() => change(request, params, body => bodySchema.parse(body).count), request);
}

export async function DELETE(request: Request, { params }: Params) {
  return api(() => change(request, params, () => 0), request);
}
