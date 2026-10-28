import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { PUBLIC_PAGES, isIndexable, siteUrl } from "@/lib/seo";
import { COMPARISONS } from "@/lib/comparisons";
import { TECH_BUZZ_TAG, listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { handbookSlug, handbooks, interviewTechs, vocabularyGroups, workflows } from "@/lib/public-learning";

/**
 * Every indexable URL but the API reference: the registered public pages plus the learning library (interview
 * questions, blueprints, handbooks, comparisons and vocabulary), read from the same catalogues the pages prerender
 * from. The API reference's ~3,000 identifier pages are listed in app/(site)/api-reference/sitemap.ts.
 * Cached for a day, so a content release appears in the sitemap without a rebuild of this route; publishing a
 * Tech Buzz story expires the tag at once, so the 5:00 AM stories are listed the morning they go live.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("days");
  cacheTag(TECH_BUZZ_TAG);
  if (!isIndexable()) return [];
  const origin = siteUrl();
  const url = (path: string) => new URL(path, origin).href;
  const library = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly") => ({ url: url(path), changeFrequency, priority });
  // Tech Buzz articles change daily; lastModified lets crawlers pick up new ones without recrawling the rest.
  const buzz = (await listPublishedTechBuzzArticles()).map(article => ({ url: url(`/tech-buzz/${article.slug}`), lastModified: new Date(article.publishedAt), changeFrequency: "weekly" as const, priority: article.featured ? 0.85 : 0.75 }));
  const latestStory = buzz.reduce<Date | undefined>((latest, story) => !latest || story.lastModified > latest ? story.lastModified : latest, undefined);
  return [
    ...PUBLIC_PAGES.map(({ path, changeFrequency, priority }) => ({ url: url(path), changeFrequency, priority, ...(path === "/tech-buzz" && latestStory ? { lastModified: latestStory } : {}) })),
    library("/interview-questions", 0.9, "weekly"), ...interviewTechs().map(tech => library(`/interview-questions/${tech.id}`, 0.8)),
    library("/workflows", 0.9, "weekly"), ...workflows().map(item => library(`/workflows/${item.id}`, 0.8)),
    library("/learn", 0.9, "weekly"), ...handbooks().map(item => library(`/learn/${handbookSlug(item)}`, 0.7)),
    library("/api-reference", 0.8, "weekly"),
    library("/compare", 0.9, "weekly"), ...COMPARISONS.map(item => library(`/compare/${item.id}`, 0.8)),
    library("/vocabulary", 0.8, "weekly"), ...vocabularyGroups().map(group => library(`/vocabulary/${group.slug}`, 0.6)),
    ...buzz,
  ];
}
