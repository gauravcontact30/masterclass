import { cacheLife, cacheTag } from "next/cache";
import { listTechBuzzArticles, TECH_BUZZ_TAG } from "@/lib/server/tech-buzz-storage";
import { meetsReviewBar } from "@/lib/tech-buzz-reviews";
import { techIdOf, topicLabel } from "@/lib/tech-buzz-public";
import type { LandingBuzz } from "@/lib/landing-buzz-types";

/**
 * The newest published Tech Buzz stories, as the few fields a landing section links with: title, technology, read time
 * and when. Never a body or preview (lib/tech-buzz-public.ts: the paywall is what is sent). Cached hourly like the
 * landing page itself, so the page's cache life is not cut to Tech Buzz's minutes; a publish expires it via the tag.
 */
export async function landingBuzz(limit = 24): Promise<LandingBuzz[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("landing", TECH_BUZZ_TAG);
  try {
    const stories = (await listTechBuzzArticles(false, true)).filter(meetsReviewBar)
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, limit);
    return stories.map(story => {
      const techId = techIdOf(story);
      return { slug: story.slug, title: story.title, topic: topicLabel({ techId, technology: story.technology, category: story.category }), techId: techId ?? null,
        technology: story.technology, minutes: story.readTimeMinutes, publishedAt: story.publishedAt, tags: (story.tags ?? []).filter(tag => !/^(daily|_)/i.test(tag)).slice(0, 4) };
    });
  } catch {
    // A landing section without fresh stories still renders; a failed read must never break the home page.
    return [];
  }
}
