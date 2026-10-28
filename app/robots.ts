import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: "*", disallow: "/" } };
  // Leave noindex pages crawlable so search engines can read their directives.
  // The API reference (~3,000 short pages) has its own sitemap, so Search Console reports its indexing apart from the rest.
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] }, sitemap: ["/sitemap.xml", "/api-reference/sitemap.xml"].map(path => new URL(path, siteUrl()).href) };
}
