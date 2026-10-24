import type { Metadata, MetadataRoute } from "next";

// Never derive canonical URLs from a request Host header or a preview hostname.
export function siteUrl(): URL {
  const value = process.env.APP_URL || "https://www.masterclassbuddy.com";
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
export const siteTitle = "MasterClass Buddy | Tech Learning, AI Agents & Interview Prep";
export const siteDescription = "Technology learning for professionals in English and Hindi, with an AI tutor and audio lectures: coding, cloud, system design, AI agents, certifications and interview questions.";
/**
 * Site-wide keywords, grouped by what MasterClass sells: bilingual learning, the AI tutor, coding and interview
 * preparation, AI engineering, certifications and the membership. Google ignores the keywords tag; Bing and others
 * still read it, and the same terms are used in titles, descriptions and structured data, which do count.
 */
export const siteKeywords = [
  // Brand
  "MasterClass", "MasterClass Buddy",
  // Bilingual, AI-assisted learning
  "online learning platform India", "learn in Hindi and English", "Hindi medium study notes", "study notes in Hindi", "AI tutor", "AI study assistant", "ask doubts online", "personalised study plan",
  "audio lectures", "listen to lessons online", "learn by listening", "AI search for students", "online courses for international students",
  // Certifications
  "AWS certification preparation", "system design interview preparation", "Claude Code certification", "n8n certification", "agentic AI certification", "DevOps certification preparation",
  // Coding and careers
  "learn coding online", "learn coding in Hindi", "coding tutorials", "programming for beginners", "full stack developer course", "React tutorial", "Next.js tutorial", "Python tutorials", "JavaScript interview questions", "React interview questions", "technology interview preparation", "coding interview preparation", "frontend interview questions", "Node.js interview questions", "Python interview questions", "system design", "system design interview questions", "system design course",
  "Next.js 16 tutorial", "React hooks explained", "AWS tutorial", "AWS services explained", "AWS interview questions",
  // AI engineering
  "agentic AI course", "AI agents tutorial", "AI agent workflows", "generative AI course", "generative AI in Hindi", "LangChain tutorial", "LangGraph tutorial", "LangSmith tutorial", "LangFlow tutorial", "n8n automation tutorial", "latest AI news for developers",
  // Vocabulary and communication
  "English vocabulary with Hindi meanings", "spoken English words", "corporate English vocabulary", "word of the day with Hindi meaning",
  // Articles
  "Coffee & Code", "software engineering articles", "web development blog",
  // Membership
  "affordable online courses", "learning membership India",
];
export const privateMetadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Every page a search engine may index. The sitemap, footer "Company" links and
 * per-page metadata all read from here, so adding a public page is one entry.
 */
export type PublicPage = { path: `/${string}`; title: string; label: string; description: string; changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>; priority: number };
export const PUBLIC_PAGES: readonly PublicPage[] = [
  { path: "/", title: siteTitle, label: "Home", description: siteDescription, changeFrequency: "weekly", priority: 1 },
  { path: "/courses", title: "Courses & learning paths", label: "Courses", description: "Browse every MasterClass learning path: technology handbooks and interviews, system design case studies, and IELTS and professional vocabulary.", changeFrequency: "weekly", priority: 0.9 },
  { path: "/library", title: "Free learning library", label: "Library", description: "Interview questions with answers for 31 technologies, system design and AI agent workflow blueprints, an API reference for 60 technologies, technology handbooks and English vocabulary with Hindi meanings, free to read.", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", title: "About MasterClass", label: "About", description: "MasterClass Buddy is a bilingual English and Hindi learning space for tech professionals: technology courses, AI agents, certifications and interview preparation, with study notes, worked answers and timed practice in one dashboard.", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", title: "Contact & support", label: "Contact", description: "Get help with your MasterClass account, membership, billing or study content, and find answers to common questions.", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", title: "Privacy policy", label: "Privacy", description: "How MasterClass collects, uses and protects your account, payment and learning data, and what stays only in your browser.", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", title: "Terms & conditions", label: "Terms", description: "The terms that apply when you create a MasterClass account, buy a membership and use study content and AI-assisted answers.", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refund-policy", title: "Cancellation & refund policy", label: "Refunds", description: "How to cancel a MasterClass membership, how long your access continues, and when payments are refunded, including duplicate and failed charges.", changeFrequency: "yearly", priority: 0.3 },
];

export function publicPage(path: PublicPage["path"]): PublicPage {
  const page = PUBLIC_PAGES.find(entry => entry.path === path);
  if (!page) throw new Error(`${path} is not a registered public page`);
  return page;
}

const ogImage = { url: "/opengraph-image", width: 1200, height: 630, alt: `${siteName} — Technology learning for professionals in English and Hindi` };

/**
 * Complete metadata for a public page. Next.js replaces (not merges) nested
 * objects such as openGraph between segments, so each page gets the full set.
 */
/** Keywords for each public page, matched to what that page actually offers. */
const PAGE_KEYWORDS: Partial<Record<PublicPage["path"], string[]>> = {
  "/courses": ["online courses India", "technology learning paths", "system design course", "technology interview preparation", "IELTS vocabulary", "learning paths in Hindi"],
  "/library": ["free learning library", "free programming tutorials", "interview questions with answers", "React interview questions", "system design blueprints", "AI agent workflows", "API reference", "technology handbooks", "English vocabulary with Hindi meanings"],
  "/about": ["about MasterClass", "bilingual learning platform", "Hindi and English education", "online learning India", "AI tutor for developers"],
  "/contact": ["MasterClass support", "membership help", "billing support", "contact MasterClass"],
};

export function pageMetadata(path: PublicPage["path"]): Metadata {
  const { title, description } = publicPage(path);
  const home = path === "/";
  const keywords = PAGE_KEYWORDS[path] ?? (home ? siteKeywords : undefined);
  return {
    // The home title already carries the brand; skip the "%s | MasterClass" template.
    title: home ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName, title: home ? title : `${title} | ${siteName}`, description, locale: "en_IN", alternateLocale: ["hi_IN"], images: [ogImage] },
    twitter: { card: "summary_large_image", title: home ? title : `${title} | ${siteName}`, description, images: [ogImage.url] },
  };
}

/**
 * Complete metadata for a generated learning page (interview questions, blueprints, API reference, vocabulary,
 * handbooks), which is not in PUBLIC_PAGES: canonical URL, Open Graph and Twitter cards, all from one title and
 * description.
 */
export function learningMetadata({ path, title, description, keywords }: { path: `/${string}`; title: string; description: string; keywords?: string[] }): Metadata {
  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, siteName, title: `${title} | ${siteName}`, description, locale: "en_IN", images: [ogImage] },
    twitter: { card: "summary_large_image", title: `${title} | ${siteName}`, description, images: [ogImage.url] },
  };
}

/** BreadcrumbList structured data for a trail of [name, path] pairs, starting after Home. */
export function breadcrumbSchema(trail: readonly (readonly [string, `/${string}`])[]) {
  const origin = siteUrl().href;
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"] as const, ...trail].map(([name, path], index) => ({ "@type": "ListItem", position: index + 1, name, item: new URL(path, origin).href })),
  };
}

export function websiteSchema() {
  const url = siteUrl().href;
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${url}#website`, url, name: siteName, alternateName: "MasterClass Buddy", description: siteDescription, inLanguage: ["en", "hi"], keywords: siteKeywords.join(", "), publisher: { "@id": `${url}#organization` } };
}

export function organizationSchema() {
  const url = siteUrl().href;
  // The membership, as search engines should describe the business: one plan, monthly or yearly, in rupees.
  const offer = (name: string, price: number, unit: "MON" | "ANN") => ({
    "@type": "Offer", name, price: String(price), priceCurrency: "INR", url: new URL("/subscribe", url).href, availability: "https://schema.org/InStock",
    priceSpecification: { "@type": "UnitPriceSpecification", price: String(price), priceCurrency: "INR", unitCode: unit, referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: unit } },
  });
  return {
    "@context": "https://schema.org", "@type": "EducationalOrganization", "@id": `${url}#organization`, name: siteName, alternateName: "MasterClass Buddy", url,
    logo: new URL("/icon.svg", url).href, description: siteDescription, slogan: "Learn in English and Hindi, with an AI tutor beside you.", areaServed: "IN", knowsLanguage: ["en", "hi"],
    knowsAbout: ["IELTS vocabulary", "JavaScript", "TypeScript", "React", "Next.js", "Python", "Node.js", "System design", "AWS", "Git", "AI agents", "Agentic AI", "Generative AI", "LangChain", "LangGraph", "LangSmith", "LangFlow", "n8n", "English vocabulary"],
    hasOfferCatalog: { "@type": "OfferCatalog", name: "MasterClass membership", itemListElement: [
      offer("Monthly membership", Number(process.env.PRO_MONTHLY_PRICE_INR ?? 299), "MON"),
      offer("Yearly membership", Number(process.env.PRO_YEARLY_PRICE_INR ?? 2999), "ANN"),
    ] },
  };
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
