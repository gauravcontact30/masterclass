import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, isIndexable, siteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexable()) return [];
  const origin = siteUrl();
  return PUBLIC_PAGES.map(({ path, changeFrequency, priority }) => ({ url: new URL(path, origin).href, changeFrequency, priority }));
}
