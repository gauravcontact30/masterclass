import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { account } from "@/lib/server/repository";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { rateLimit } from "@/lib/server/rate-limit";
import { getPublishedTechBuzzArticle } from "@/lib/server/tech-buzz-storage";
import { addHighlight, listHighlights, removeHighlight, topHighlights } from "@/lib/server/tech-buzz-marks";
import { plainProse } from "@/lib/prose-markup";
import { toPreview } from "@/lib/tech-buzz-public";
import type { TechBuzzArticle } from "@/lib/tech-buzz-data";

/*
 * Reader highlights on a Tech Buzz story (migration 0051). GET: the reader's own passages, plus those several readers
 * marked. POST { quote }: saves a passage. DELETE ?id=: removes one of theirs. Passages others highlighted can come from
 * the member-only body, so only members receive them; and a saved quote must be text the reader was actually allowed to
 * see, which also stops the table being used to store arbitrary text.
 */
type Params = { params: Promise<{ slug: string }> };
const bodySchema = z.object({ quote: z.string().trim().min(3).max(600) });

async function story(params: Params["params"]) {
  const article = await getPublishedTechBuzzArticle((await params).slug);
  if (!article) throw new HttpError(404, "not_found");
  return article;
}

const isMember = async (user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) => isSuperAdminUser(user) || (await account(user.id)).tier !== "free";
/** Letters and digits only: the browser's text and the stored markup differ in spacing and punctuation marks. */
const comparable = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const visibleText = (article: TechBuzzArticle, member: boolean) =>
  (member ? article.contentSections.flatMap(section => section.paragraphs) : toPreview(article).teaser.paragraphs).map(plainProse).map(comparable).join("");

export async function GET(request: Request, { params }: Params) {
  return api(async () => {
    const article = await story(params);
    const user = await currentUser();
    if (!user) return Response.json({ signedIn: false, mine: [], top: [] });
    const [mine, top] = await Promise.all([listHighlights(article.id, user.id), isMember(user).then(member => (member ? topHighlights(article.id) : []))]);
    return Response.json({ signedIn: true, mine, top });
  }, request);
}

export async function POST(request: Request, { params }: Params) {
  return api(async () => {
    sameOrigin(request);
    const article = await story(params);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "signin_required");
    await rateLimit(`tech-buzz:highlights:${user.id}`, 30, 60);
    const { quote } = bodySchema.parse(await jsonBody(request, 4000));
    if (!visibleText(article, await isMember(user)).includes(comparable(quote))) throw new HttpError(422, "not_in_story");
    const highlight = await addHighlight(article.id, user.id, quote);
    if (!highlight) throw new HttpError(503, "highlights_unavailable");
    return Response.json({ highlight }, { status: 201 });
  }, request);
}

export async function DELETE(request: Request, { params }: Params) {
  return api(async () => {
    sameOrigin(request);
    const article = await story(params);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "signin_required");
    await rateLimit(`tech-buzz:highlights:${user.id}`, 30, 60);
    const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
    if (!id.success || !await removeHighlight(article.id, id.data, user.id)) throw new HttpError(404, "not_found");
    return Response.json({ ok: true });
  }, request);
}
