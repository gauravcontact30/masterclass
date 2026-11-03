import { cacheLife, cacheTag } from "next/cache";
import { listTechBuzzArticles, TECH_BUZZ_TAG } from "@/lib/server/tech-buzz-storage";
import { meetsReviewBar, withReview } from "@/lib/tech-buzz-reviews";
import { techIdOf, techLogo, topicLabel } from "@/lib/tech-buzz-public";
import type { LandingBuzz, LandingTopic } from "@/lib/landing-buzz-types";

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
        technology: story.technology, minutes: story.readTimeMinutes, publishedAt: story.publishedAt, tags: (story.tags ?? []).filter(tag => !/^(daily|_)/i.test(tag)).slice(0, 4), logo: techLogo(techId ?? undefined) ?? null,
        // Card fields only (toCard sends the same to every visitor); the subtitle is capped so 24 stories stay light.
        subtitle: story.subtitle.length > 170 ? `${story.subtitle.slice(0, 167).trimEnd()}…` : story.subtitle, cover: story.coverImage || undefined,
        likes: story.likes ?? 0, dislikes: story.dislikes ?? 0, claps: story.claps ?? 0,
        rating: { average: story.rating?.average ?? 0, count: story.rating?.count ?? 0 },
        stars: (withReview({ slug: story.slug }).review ?? story.source?.review)?.stars ?? null };
    });
  } catch {
    // A landing section without fresh stories still renders; a failed read must never break the home page.
    return [];
  }
}

/** Every technology with a published story and a logo, the most written about first, for the landing page's pills. */
export async function landingBuzzTopics(): Promise<LandingTopic[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("landing", TECH_BUZZ_TAG);
  try {
    const topics = new Map<string, LandingTopic>();
    for (const story of (await listTechBuzzArticles(false, true)).filter(meetsReviewBar)) {
      const techId = techIdOf(story), logo = techLogo(techId ?? undefined);
      if (!logo) continue;
      const name = topicLabel({ techId, technology: story.technology, category: story.category });
      // A subject filed under a technology ("API Design" under Node.js) has no logo of its own, so it gets no pill.
      if (!name.toLowerCase().replace(/[^a-z0-9]/g, "").includes((techId ?? "").replace(/-/g, ""))) continue;
      const known = topics.get(name);
      if (known) known.stories += 1;
      else topics.set(name, { name, logo, stories: 1 });
    }
    return [...topics.values()].sort((a, b) => b.stories - a.stories || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
