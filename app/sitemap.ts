import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return isIndexable() ? [{ url: siteUrl().href }] : [];
}
