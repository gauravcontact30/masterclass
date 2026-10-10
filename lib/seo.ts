import type { Metadata, MetadataRoute } from "next";

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

export const siteName = "MasterClass";
export const siteTitle = "MasterClass | Learn in App · Exams, School & System Design";
export const siteDescription = "Build your preparation dashboard with English and Hindi study notes, school and exam foundations, worked answers, practice tests and detailed system-design case studies. Learn in App with monthly or yearly membership.";
export const siteKeywords = ["MasterClass", "online learning", "study notes in Hindi", "CBSE", "NCERT", "ICSE", "ISC", "SSC", "JEE", "NEET", "IELTS vocabulary", "system design", "technology interview preparation", "practice tests"];
export const privateMetadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Every page a search engine may index. The sitemap, footer "Company" links and
 * per-page metadata all read from here, so adding a public page is one entry.
 */
export type PublicPage = { path: `/${string}`; title: string; label: string; description: string; changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>; priority: number };
export const PUBLIC_PAGES: readonly PublicPage[] = [
  { path: "/", title: siteTitle, label: "Home", description: siteDescription, changeFrequency: "weekly", priority: 1 },
  { path: "/courses", title: "Courses & learning paths", label: "Courses", description: "Browse every MasterClass learning path: CBSE, NCERT, ICSE and ISC school foundations, SSC, banking, railways, defence, JEE and NEET exam preparation, IELTS vocabulary, technology interviews and system design.", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", title: "About MasterClass", label: "About", description: "MasterClass is a bilingual English and Hindi learning space for school, competitive exams and technology careers, with study notes, worked answers and timed practice in one dashboard.", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", title: "Contact & support", label: "Contact", description: "Get help with your MasterClass account, membership, billing or study content, and find answers to common questions.", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", title: "Privacy policy", label: "Privacy", description: "How MasterClass collects, uses and protects your account, payment and learning data, and what stays only in your browser.", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", title: "Terms of service", label: "Terms", description: "The terms that apply when you create a MasterClass account, buy a membership and use study content and AI-assisted answers.", changeFrequency: "yearly", priority: 0.3 },
];

export function publicPage(path: PublicPage["path"]): PublicPage {
  const page = PUBLIC_PAGES.find(entry => entry.path === path);
  if (!page) throw new Error(`${path} is not a registered public page`);
  return page;
}

const ogImage = { url: "/opengraph-image", width: 1200, height: 630, alt: `${siteName} — School, exam and technology learning in English and Hindi` };

/**
 * Complete metadata for a public page. Next.js replaces (not merges) nested
 * objects such as openGraph between segments, so each page gets the full set.
 */
export function pageMetadata(path: PublicPage["path"]): Metadata {
  const { title, description } = publicPage(path);
  const home = path === "/";
  return {
    // The home title already carries the brand; skip the "%s | MasterClass" template.
    title: home ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName, title: home ? title : `${title} | ${siteName}`, description, locale: "en_IN", alternateLocale: ["hi_IN"], images: [ogImage] },
    twitter: { card: "summary_large_image", title: home ? title : `${title} | ${siteName}`, description, images: [ogImage.url] },
  };
}

export function websiteSchema() {
  const url = siteUrl().href;
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${url}#website`, url, name: siteName, description: siteDescription, inLanguage: ["en", "hi"], publisher: { "@id": `${url}#organization` } };
}

export function organizationSchema() {
  const url = siteUrl().href;
  return { "@context": "https://schema.org", "@type": "EducationalOrganization", "@id": `${url}#organization`, name: siteName, url, logo: new URL("/icon.svg", url).href, description: siteDescription, areaServed: "IN", knowsLanguage: ["en", "hi"] };
}

export function webPageSchema(path: PublicPage["path"]) {
  const { title, description } = publicPage(path);
  const origin = siteUrl().href, url = new URL(path, origin).href;
  return {
    "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#webpage`, url, name: title, description, inLanguage: "en",
    isPartOf: { "@id": `${origin}#website` },
    breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: origin }, { "@type": "ListItem", position: 2, name: title, item: url }] },
  };
}

export function faqSchema(items: readonly { question: string; answer: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
