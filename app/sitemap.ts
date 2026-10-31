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
 * Each story also lists its cover photo (image sitemap), so Google Images can find it from the story's URL. Only pages
 * whose content really changes with the stories (/tech-buzz and /library, which counts them) carry a lastmod: a
 * made-up date on unchanged pages teaches Google to ignore lastmod altogether.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("days");
  cacheTag(TECH_BUZZ_TAG);
  if (!isIndexable()) return [];
  const origin = siteUrl();
  const url = (path: string) => new URL(path, origin).href;
  // Next writes sitemap values into the XML as they are, unescaped: an Unsplash cover's "?w=1200&auto=format" broke the
  // whole file. Page URLs never carry query strings; image URLs do.
  const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const library = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly") => ({ url: url(path), changeFrequency, priority });
  // Tech Buzz articles change daily; lastModified lets crawlers pick up new ones without recrawling the rest.
  const buzz = (await listPublishedTechBuzzArticles()).map(article => ({
    url: url(`/tech-buzz/${article.slug}`), lastModified: new Date(article.publishedAt), changeFrequency: "weekly" as const, priority: article.featured ? 0.85 : 0.75,
    ...(article.coverImage ? { images: [xml(url(article.coverImage))] } : {}),
  }));
  const latestStory = buzz.reduce<Date | undefined>((latest, story) => !latest || story.lastModified > latest ? story.lastModified : latest, undefined);
  return [
    ...PUBLIC_PAGES.map(({ path, changeFrequency, priority }) => ({ url: url(path), changeFrequency, priority,
      ...(path === "/" ? { images: [url("/images/landing/hero-interviews-ads9.webp"), url("/images/landing/hero-interviews-ads17.webp")] } : {}),
      ...((path === "/tech-buzz" || path === "/library") && latestStory ? { lastModified: latestStory } : {}) })),
    library("/interview-questions", 0.9, "weekly"), ...interviewTechs().map(tech => library(`/interview-questions/${tech.id}`, 0.8)),
    library("/workflows", 0.9, "weekly"), ...workflows().map(item => library(`/workflows/${item.id}`, 0.8)),
    library("/learn", 0.9, "weekly"), ...handbooks().map(item => library(`/learn/${handbookSlug(item)}`, 0.7)),
    library("/api-reference", 0.8, "weekly"),
    library("/compare", 0.9, "weekly"), ...COMPARISONS.map(item => library(`/compare/${item.id}`, 0.8)),
    library("/vocabulary", 0.8, "weekly"), ...vocabularyGroups().map(group => library(`/vocabulary/${group.slug}`, 0.6)),
    ...buzz,
  ];
}
