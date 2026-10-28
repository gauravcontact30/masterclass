import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { isIndexable, siteUrl } from "@/lib/seo";
import { apiPackageEntries, apiPackages } from "@/lib/public-learning";

/**
 * /api-reference/sitemap.xml: each technology's reference page and every identifier page with a checked card.
 * Kept apart from /sitemap.xml (both are listed in robots.txt) so Search Console's page-indexing report shows
 * how many of these short pages Google keeps, separately from the articles and guides.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("days");
  if (!isIndexable()) return [];
  const origin = siteUrl();
  const entry = (path: string, priority: number, lastModified?: Date) => ({ url: new URL(path, origin).href, changeFrequency: "monthly" as const, priority, ...(lastModified ? { lastModified } : {}) });
  const packages = await Promise.all(apiPackages().map(async pkg => [
    entry(`/api-reference/${pkg.id}`, 0.6),
    ...(await apiPackageEntries(pkg.id)).filter(item => item.card).map(item => entry(`/api-reference/${pkg.id}/${item.slug}`, 0.5, new Date(item.card!.checkedAt))),
  ]));
  return packages.flat();
}
