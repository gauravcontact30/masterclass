import { api, HttpError } from "@/lib/server/http";
import { getPublishedTechBuzzArticle } from "@/lib/server/tech-buzz-storage";
import { engagementTotals, followerCount } from "@/lib/server/tech-buzz-marks";
import { markKey } from "@/lib/tech-buzz-mark-keys";

/** An open story's live public counts: pages are cached for minutes, so the action bar refreshes them on load. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return api(async () => {
    const article = await getPublishedTechBuzzArticle((await params).slug);
    if (!article) throw new HttpError(404, "not_found");
    const [totals, followers] = await Promise.all([engagementTotals([article.id]), followerCount(markKey(article.author.name))]);
    const own = totals.get(article.id);
    return Response.json({ comments: (article.baseCommentsCount ?? 0) + (own?.comments ?? 0), reposts: own?.reposts ?? 0, followers });
  }, request);
}
