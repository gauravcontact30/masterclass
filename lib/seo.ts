import type { Metadata } from "next";

// Never derive canonical URLs from a request Host header or a preview hostname.
export function siteUrl(): URL {
  const value = process.env.APP_URL || "http://localhost:3000";
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("APP_URL must be an absolute HTTP(S) origin without a path, credentials, query, or fragment");
  }
  return url;
}

export function isIndexable(): boolean {
  const url = siteUrl();
  return process.env.SEO_INDEXABLE === "true" && url.protocol === "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}

export const siteTitle = "MasterClass | Learn in App · Exams, School & System Design";
export const siteDescription = "Build your preparation dashboard with English and Hindi study notes, school and exam foundations, worked answers, practice tests and detailed system-design case studies. Learn in App with monthly or yearly membership.";
export const privateMetadata: Metadata = { robots: { index: false, follow: false } };

export function websiteSchema() {
  const url = siteUrl().href;
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${url}#website`, url, name: "MasterClass", description: siteDescription, inLanguage: ["en", "hi"] };
}
