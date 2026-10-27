import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { techBuzzReport, type BuzzClick, type BuzzVisit } from "@/lib/tech-buzz-analytics";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";

/*
 * The Super Admin "Tech-Buzz - Blogs" page: every /tech-buzz page's visits (site_visits), every click on it with the
 * section it came from (monitor_events kind site_interaction, written by components/visit-tracker.tsx) and each
 * story's counters, folded into one report by lib/tech-buzz-analytics.ts. Reads are keyset-paged so a busy window
 * stays complete.
 */
const PAGE = 1000;

async function paged<T extends { id: number }>(query: (cursor: number) => PromiseLike<{ data: unknown[] | null; error: { code?: string; message: string } | null }>) {
  const rows: T[] = [];
  for (let cursor = 0; ;) {
    const { data, error } = await query(cursor);
    if (error) adminError(error);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
    cursor = page.at(-1)!.id;
  }
}

/** monitor_events ids are uuids, so its clicks page by offset in time order. */
async function allClicks(since: string) {
  const rows: BuzzClick[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db().from("monitor_events").select("created_at,actor_id,resource,details").eq("kind", "site_interaction")
      .like("resource", "/tech-buzz%").gte("created_at", since).order("created_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + PAGE - 1);
    if (error) adminError(error);
    rows.push(...((data ?? []) as BuzzClick[]));
    if (!data || data.length < PAGE) return rows;
  }
}

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const days = Math.floor(Math.min(90, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 7)));
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const [visits, clicks, stories] = await Promise.all([
      paged<BuzzVisit & { id: number }>(cursor => db().from("site_visits")
        .select("id,created_at,event,visitor_id,session_id,user_id,path,title,referrer_host,utm_source,device,country,duration_ms,new_visitor")
        .eq("is_bot", false).like("path", "/tech-buzz%").gte("created_at", since).gt("id", cursor).order("id", { ascending: true }).limit(PAGE)),
      allClicks(since),
      listPublishedTechBuzzArticles(),
    ]);
    const report = techBuzzReport({
      days, visits, clicks,
      stories: stories.map(story => ({ slug: story.slug, title: story.title, technology: story.technology, tags: story.tags ?? [], publishedAt: story.publishedAt,
        likes: story.likes ?? 0, dislikes: story.dislikes ?? 0, claps: story.claps ?? 0, rating: { average: story.rating?.average ?? 0, count: story.rating?.count ?? 0 },
        commentsCount: story.commentsCount ?? 0, editorScore: story.source?.editorScore, color: story.techBadgeColor })),
    });
    return Response.json({ ...report, retentionDays: VISIT_RETENTION_DAYS }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
