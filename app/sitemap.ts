import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { PUBLIC_PAGES, isIndexable, siteUrl } from "@/lib/seo";
import { apiPackageEntries, apiPackages, handbookSlug, handbooks, interviewTechs, vocabularyGroups, workflows } from "@/lib/public-learning";

/**
 * Every indexable URL: the registered public pages plus the whole learning library (interview questions,
 * blueprints, handbooks, API reference and vocabulary), read from the same catalogues the pages prerender from.
 * Cached for a day, so a content release appears in the sitemap without a rebuild of this route.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("days");
  if (!isIndexable()) return [];
  const origin = siteUrl();
  const url = (path: string) => new URL(path, origin).href;
  const library = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly") => ({ url: url(path), changeFrequency, priority });
  const api = await Promise.all(apiPackages().map(async pkg => [
    library(`/api-reference/${pkg.id}`, 0.6),
    ...(await apiPackageEntries(pkg.id)).filter(entry => entry.card).map(entry => library(`/api-reference/${pkg.id}/${entry.slug}`, 0.5)),
  ]));
  return [
    ...PUBLIC_PAGES.map(({ path, changeFrequency, priority }) => ({ url: url(path), changeFrequency, priority })),
    library("/interview-questions", 0.9, "weekly"), ...interviewTechs().map(tech => library(`/interview-questions/${tech.id}`, 0.8)),
    library("/workflows", 0.9, "weekly"), ...workflows().map(item => library(`/workflows/${item.id}`, 0.8)),
    library("/learn", 0.9, "weekly"), ...handbooks().map(item => library(`/learn/${handbookSlug(item)}`, 0.7)),
    library("/api-reference", 0.8, "weekly"), ...api.flat(),
    library("/vocabulary", 0.8, "weekly"), ...vocabularyGroups().map(group => library(`/vocabulary/${group.slug}`, 0.6)),
  ];
}
