import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: "*", disallow: "/" } };
  // Leave noindex pages crawlable so search engines can read their directives.
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] }, sitemap: new URL("/sitemap.xml", siteUrl()).href };
}
