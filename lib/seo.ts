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

// One name everywhere (title, og:site_name, WebSite and Organization data): Google picks the site name it shows in
// results from these, and mixed spellings ("Master Class Buddy") left it falling back to the bare domain.
export const siteName = "MasterClass Buddy";
export const siteTitle = "MasterClass Buddy | Agentic AI, LangChain, n8n & Next.js";
/** Under 160 characters so Google shows it whole; it names what the site teaches today (the search snippet and link previews). */
export const siteDescription = "Learn Agentic AI, LangChain, LangGraph, LangSmith, LangFlow, n8n, Next.js, TanStack Start & Zustand with daily Tech Buzz blogs, system design and interview prep.";
/**
 * Site-wide keywords: only searches that an indexed page answers (Tech Buzz, /interview-questions, /workflows,
 * /learn, /compare, /api-reference, /vocabulary), phrased the way people search. Google ignores the keywords tag
 * and treats long lists as stuffing in the WebSite schema; Bing still reads it. Add a term only with a page behind it.
 */
export const siteKeywords = [
  // Brand
  "MasterClass Buddy", "masterclassbuddy.com",
  // Agentic AI (the home title, Tech Buzz and /workflows)
  "agentic AI course", "AI agents tutorial", "LangChain tutorial", "LangGraph tutorial", "LangSmith tutorial", "LangFlow tutorial",
  "n8n workflow automation tutorial", "RAG tutorial", "Model Context Protocol MCP", "AI agent workflow examples",
  // Web stack (Tech Buzz, /learn handbooks, /api-reference)
  "Next.js tutorial", "React tutorial", "TypeScript tutorial", "TanStack Start tutorial", "TanStack Query tutorial", "Zustand tutorial",
  // Interview preparation (/interview-questions)
  "interview questions and answers", "React interview questions", "Next.js interview questions", "JavaScript interview questions",
  "TypeScript interview questions", "Node.js interview questions", "Python interview questions", "AWS interview questions",
  "LangChain interview questions", "Redis interview questions", "system design interview questions",
  // System design (/workflows) and comparisons (/compare)
  "system design examples", "LangChain vs LangGraph",
  // Blogs (/tech-buzz)
  "daily tech blogs", "AI engineering blog",
  // Vocabulary (/vocabulary)
  "English vocabulary with Hindi meanings", "corporate English vocabulary",
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
  { path: "/tech-buzz", title: "Tech Buzz — Daily Technology Blogs on Agentic AI, LangChain & Next.js", label: "Tech Buzz", description: "Five new tech blogs every morning at 5 AM IST on Agentic AI, LangChain, LangGraph, n8n, Next.js, TanStack Start and Zustand, rated and clapped by developers.", changeFrequency: "daily", priority: 0.95 },
  { path: "/refund-policy", title: "Cancellation & refund policy", label: "Refunds", description: "How to cancel a MasterClass membership, how long your access continues, and when payments are refunded, including duplicate and failed charges.", changeFrequency: "yearly", priority: 0.3 },
];

export function publicPage(path: PublicPage["path"]): PublicPage {
  const page = PUBLIC_PAGES.find(entry => entry.path === path);
  if (!page) throw new Error(`${path} is not a registered public page`);
  return page;
}

const ogImage = { url: "/opengraph-image", width: 1200, height: 630, alt: `${siteName} — Agentic AI, LangChain, LangGraph, LangSmith, LangFlow, n8n, Next.js, TanStack Start and Zustand` };

/**
 * Complete metadata for a public page. Next.js replaces (not merges) nested
 * objects such as openGraph between segments, so each page gets the full set.
 */
/**
 * Keywords for each public page, limited to what that page actually shows (checked against the live pages
 * 2026-10-28). Legal and policy pages carry none: nobody searches for them, and they only inherit the site list.
 */
const PAGE_KEYWORDS: Partial<Record<PublicPage["path"], string[]>> = {
  "/courses": [
    "system design course", "system design case studies", "payment gateway system design", "WhatsApp system design",
    "Netflix system design", "React 19 Next.js TypeScript course", "IELTS vocabulary for tech professionals"
  ],
  "/library": [
    "free learning library", "free programming tutorials", "interview questions with answers", "React interview questions",
    "Next.js interview questions", "Python interview questions", "system design blueprints", "AI agent workflows",
    "API reference for 60 technologies", "technology handbooks", "English vocabulary with Hindi meanings",
    "LangChain vs LangGraph comparison"
  ],
  "/about": ["about MasterClass Buddy", "MasterClass Buddy"],
  "/contact": ["contact MasterClass Buddy", "MasterClass Buddy support"],
  "/tech-buzz": [
    "Tech Buzz", "daily tech blogs", "Agentic AI blog", "LangChain blog", "LangGraph blog", "n8n automation blog",
    "Next.js 16 blog", "TanStack Start blog", "Zustand blog", "AI engineering news"
  ],
};
/** Pages whose metadata carries no keywords at all (rather than inheriting the site-wide list). */
const NO_KEYWORDS = new Set<PublicPage["path"]>(["/privacy", "/terms", "/refund-policy"]);

export function pageMetadata(path: PublicPage["path"]): Metadata {
  const { title, description } = publicPage(path);
  const home = path === "/";
  const keywords = PAGE_KEYWORDS[path] ?? (home ? siteKeywords : undefined);
  return {
    // The home title already carries the brand; skip the "%s | MasterClass" template.
    title: home ? { absolute: title } : title,
    description,
    // A page without its own keywords inherits the root layout's; null clears them.
    ...(NO_KEYWORDS.has(path) ? { keywords: null } : keywords ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName, title: home ? title : `${title} | ${siteName}`, description, locale: "en_IN", images: [ogImage] },
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
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${url}#website`, url, name: siteName, alternateName: ["Master Class Buddy", "masterclassbuddy.com"], description: siteDescription, inLanguage: "en", keywords: siteKeywords.join(", "), publisher: { "@id": `${url}#organization` } };
}

export function organizationSchema(prices?: { monthly:number; yearly:number; endsAt?:string }) {
  const url = siteUrl().href;
  // The membership, as search engines should describe the business: one plan, monthly or yearly, in rupees.
  const offer = (name: string, price: number, unit: "MON" | "ANN") => ({
    "@type": "Offer", name, price: String(price), priceCurrency: "INR", url: new URL("/subscribe", url).href, availability: "https://schema.org/InStock",
    priceSpecification: { "@type": "UnitPriceSpecification", price: String(price), priceCurrency: "INR", unitCode: unit, referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: unit } },
  });
  return {
    "@context": "https://schema.org", "@type": "EducationalOrganization", "@id": `${url}#organization`, name: siteName, alternateName: ["Master Class Buddy", "masterclassbuddy.com"], url,
    // A raster logo (Google's logo guidance asks for a crawlable image of at least 112×112); the SVG stays the favicon.
    logo: { "@type": "ImageObject", url: new URL("/brand/masterclass-mark-512.png", url).href, width: 512, height: 512 },
    image: new URL("/opengraph-image", url).href,
    description: siteDescription, slogan: "Your buddy for mastering Agentic AI and the modern web stack.", areaServed: "IN", knowsLanguage: ["en"],
    knowsAbout: [
      "React 19", "Next.js 16", "TypeScript", "JavaScript", "Python 3.12", "Node.js", "System design",
      "Agentic AI", "AI agents", "Model Context Protocol MCP", "Claude Code", "LangChain", "LangGraph", "LangSmith", "LangFlow", "n8n", "TanStack Start",
      "AWS", "Docker", "Kubernetes", "Linux", "Git", "PostgreSQL", "Redis", "FastAPI", "Go", "Rust", "Zustand", "TanStack Query",
      "Vitest", "Playwright", "Tech interview preparation", "English vocabulary with Hindi meanings"
    ],
    ...(prices ? { hasOfferCatalog: { "@type": "OfferCatalog", name: "MasterClass membership", itemListElement: [
      { ...offer("Monthly membership", prices.monthly, "MON"), ...(prices.endsAt ? { priceValidUntil:prices.endsAt } : {}) },
      { ...offer("Yearly membership", prices.yearly, "ANN"), ...(prices.endsAt ? { priceValidUntil:prices.endsAt } : {}) },
    ] } } : {}),
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
