import type { Metadata, MetadataRoute } from "next";
import { ADDRESS, SOCIAL_PROFILES, SUPPORT } from "./site-contact";
import { HINDI_ENABLED } from "./i18n";
import { EXAM_GUIDES } from "./exam-guides";

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
// Carries the home page's most-used words (interview questions, system design), so the title, description and headings
// agree on the topic; the technologies are in the description and the h1. 55 characters: SEO checkers flag titles over
// 60 and Google truncates them.
// Since 2026-11-22 the site has three categories (Tech, Board Exams, Competitive Exams), so the title names all three. 56 characters.
export const siteTitle = "MasterClass Buddy | Tech, Board & Competitive Exam Prep";
/** Under 160 characters so Google shows it whole; it names what the site teaches today (the search snippet and link previews). */
// Since 2026-11-22 the exam learning content is also in Hindi, and the hero leads with defence, banking, railway and civil-services exams.
export const siteDescription = "Tech interview prep and AI courses, Class 10 & 12 board exams (UP, CBSE, ICSE), NDA, SSC, bank, railway, UPSC and TET exams, and IELTS, in English & Hindi.";
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
  // Python, cloud and DSA (the home slider since 2026-10-30): /learn/docker, /learn/kubernetes, /learn/devops-with-aws-ci-cd,
  // /compare/docker-kubernetes, the daily Python-with-AI and AWS Tech Buzz stories and the DSA-patterns story
  "Python for AI tutorial", "AWS tutorial for developers", "Docker tutorial", "Kubernetes tutorial", "Docker vs Kubernetes",
  "DSA patterns for coding interviews",
  // Interview preparation (/interview-questions)
  "interview questions and answers", "React interview questions", "Next.js interview questions", "JavaScript interview questions",
  "TypeScript interview questions", "Node.js interview questions", "Python interview questions", "AWS interview questions",
  "LangChain interview questions", "Redis interview questions", "system design interview questions",
  // System design (/workflows) and comparisons (/compare)
  "system design examples", "LangChain vs LangGraph",
  // Blogs (/tech-buzz)
  "weekly tech blogs", "AI engineering blog",
  // Vocabulary (/vocabulary)
  "English vocabulary with Hindi meanings", "corporate English vocabulary",
  // Board Exams (the home page's Board Exams category and /exams/board-exams)
  "board exam preparation", "UP Board important questions", "CBSE Class 10 important questions", "CBSE Class 12 important questions",
  "ICSE Class 10 important questions", "ISC Class 12 important questions", "Class 10 Maths important questions", "Class 12 Physics important questions",
  "board exam previous year papers", "UP Board 2027 exam date",
  // Competitive Exams (the home page's Competitive Exams category and /exams/competitive-exams)
  "competitive exam preparation", "government exam preparation", "NDA exam preparation", "NDA previous year questions", "CTET preparation",
  "UPTET questions and answers", "TET child development and pedagogy questions", "SSC CGL questions", "bank exam questions", "RRB NTPC questions",
  // Board Exams, more searches (2026-11-22): the home page's Board Exams section and its subject packs
  "UP Board Class 10 important questions", "UP Board Class 12 important questions", "CBSE board exam preparation",
  "ICSE board exam preparation", "board exam MCQ questions with answers", "Class 10 Science important questions",
  "Class 12 Chemistry important questions", "Class 12 Maths important questions", "board exam mock test",
  // Competitive Exams, more searches (2026-11-22): the home page's Competitive Exams section
  "government job exam preparation", "SSC CHSL questions", "IBPS PO questions", "SBI PO preparation", "RRB Group D questions",
  "UPSC prelims questions", "NDA maths questions", "defence exam preparation", "police exam questions",
  "general knowledge questions with answers", "reasoning questions with answers", "quantitative aptitude questions",
  // TET (2026-11-22): the TET exam in the Competitive Exams section
  "CTET questions and answers", "CTET Paper 1 preparation", "CTET Paper 2 preparation", "UPTET preparation",
  "child development and pedagogy MCQ", "Piaget Vygotsky Kohlberg questions",
  // Hindi (2026-11-22): the exam material reads in Hindi too
  "board exam questions in Hindi", "competitive exam questions in Hindi", "TET questions in Hindi",
  // IELTS (2026-11-22): /vocabulary and the IELTS course on /courses
  "IELTS vocabulary", "IELTS preparation", "IELTS vocabulary with Hindi meanings",
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
  { path: "/library", title: "Free learning library", label: "Library", description: "Free interview questions for 31 technologies, system design and AI agent blueprints, an API reference for 60 technologies, handbooks and English vocabulary.", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", title: "About MasterClass", label: "About", description: `MasterClass Buddy is ${HINDI_ENABLED ? "a bilingual English and Hindi" : "a"} learning space for tech careers worldwide: courses, interview prep, Tech Buzz blogs, IELTS English, worked answers and mock tests.`, changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", title: "Contact & support", label: "Contact", description: "Get help with your MasterClass account, membership, billing or study content, and find answers to common questions.", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", title: "Privacy policy", label: "Privacy", description: "How MasterClass collects, uses and protects your account, payment and learning data, and what stays only in your browser.", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", title: "Terms & conditions", label: "Terms", description: "The terms that apply when you create a MasterClass account, buy a membership and use study content and AI-assisted answers.", changeFrequency: "yearly", priority: 0.3 },
  { path: "/tech-buzz", title: "Tech Buzz — Weekly Technology Blogs on Agentic AI, LangChain & Next.js", label: "Tech Buzz", description: "Five new tech blogs every Monday at 00:00 IST, one per track: Agentic AI with LangChain, LangGraph and n8n, System Design, AWS & DevOps, Kubernetes & Docker, and Next.js & React. Reviewed, rated and clapped by developers.", changeFrequency: "weekly", priority: 0.95 },
  { path: "/board-exams", title: "UP Board, CBSE & ICSE Class 10–12 Questions", label: "Board Exams", description: "Class 10 and 12 board exam prep for UP Board, CBSE and ICSE: chapter-wise questions with worked answers, MCQs, most-asked questions and past papers, in English and Hindi.", changeFrequency: "weekly", priority: 0.9 },
  { path: "/competitive-exams", title: "SSC, Bank, Railway, NDA & UPSC Exam Questions", label: "Competitive Exams", description: "Government exam prep for SSC, banks, railways, NDA, UPSC, state PSC, police and more: 400+ objective questions per exam with explanations, model answers and marking schemes.", changeFrequency: "weekly", priority: 0.9 },
  { path: "/tet-exam", title: "CTET & UPTET Exam Prep: Child Pedagogy", label: "TET Exams", description: "CTET, UPTET and state TET preparation: child development and pedagogy, Piaget, Vygotsky, learning theories, inclusive education and EVS pedagogy, with answers, in English and Hindi.", changeFrequency: "weekly", priority: 0.85 },
  { path: "/ielts-preparation", title: "IELTS Writing, Speaking & Band Calculator", label: "IELTS Preparation", description: "IELTS Academic and General Training prep: practice for all four skills, 30 Writing Task 2 and Speaking topics with vocabulary, a band score calculator and a study plan.", changeFrequency: "weekly", priority: 0.85 },
  { path: "/site-map", title: "Site map: every technology and learning page", label: "Site map", description: "Find any free MasterClass page: interview questions, handbooks and API reference for each technology, plus system design blueprints, comparisons, vocabulary and Tech Buzz.", changeFrequency: "weekly", priority: 0.6 },
  { path: "/refund-policy", title: "Cancellation & refund policy", label: "Refunds", description: "How to cancel a MasterClass membership, how long your access continues, and when payments are refunded, including duplicate and failed charges.", changeFrequency: "yearly", priority: 0.3 },
];

/** Public pages shown to visitors in India only (proxy.ts redirects everyone else): left out of the sitemap and llms.txt,
 *  because a crawler outside India is redirected away from them. */
export const INDIA_ONLY_PAGES = new Set<string>(["/board-exams", "/competitive-exams", "/tet-exam"]);

export function publicPage(path: PublicPage["path"]): PublicPage {
  const page = PUBLIC_PAGES.find(entry => entry.path === path);
  if (!page) throw new Error(`${path} is not a registered public page`);
  return page;
}

/** Bump the version when the picture changes: social networks cache a preview by its URL. */
export const ogImagePath = "/opengraph-image?v=2026-11-22b";
/** What the home card shows (components/og-card.tsx HomeOgCard), for every page that shares it. */
export const ogImageAlt = `${siteName}: tech careers, board exams and government exams, in English and Hindi. Interview prep and AI courses across Agentic AI, LangChain, Next.js, AWS and 40+ technologies; UP Board, CBSE and ICSE Class 10 and 12; NDA, SSC, banking, railway, UPSC and TET exams; IELTS English`;
const ogImage = { url: ogImagePath, width: 1200, height: 630, alt: ogImageAlt };

/**
 * Complete metadata for a public page. Next.js replaces (not merges) nested
 * objects such as openGraph between segments, so each page gets the full set.
 */
/**
 * Keywords for each public page, limited to what that page actually shows (checked against the live pages
 * 2026-10-28). Legal and policy pages carry none: nobody searches for them, and they only inherit the site list.
 */
const PAGE_KEYWORDS: Partial<Record<PublicPage["path"], string[]>> = {
  "/board-exams": EXAM_GUIDES["/board-exams"].keywords,
  "/competitive-exams": EXAM_GUIDES["/competitive-exams"].keywords,
  "/tet-exam": EXAM_GUIDES["/tet-exam"].keywords,
  "/ielts-preparation": EXAM_GUIDES["/ielts-preparation"].keywords,
  "/courses": [
    "system design course", "system design case studies", "payment gateway system design", "WhatsApp system design",
    "Netflix system design", "React 19 Next.js TypeScript course", "IELTS vocabulary for tech professionals",
    "IELTS preparation course", "IELTS Academic writing task 1 and 2", "IELTS speaking practice"
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
    "Tech Buzz", "weekly tech blogs", "Agentic AI blog", "LangChain blog", "LangGraph blog", "n8n automation blog",
    "system design blog", "AWS DevOps blog", "Kubernetes Docker blog", "Next.js 16 blog", "AI engineering news"
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
export function learningMetadata({ path, title, description: full, keywords }: { path: `/${string}`; title: string; description: string; keywords?: string[] }): Metadata {
  const description = snippet(full);
  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, siteName, title: `${title} | ${siteName}`, description, locale: "en_IN", images: [ogImage] },
    twitter: { card: "summary_large_image", title: `${title} | ${siteName}`, description, images: [ogImage.url] },
  };
}

/**
 * Metadata for the Exams portal (login-gated and never indexed): a shared link still previews with the page's own
 * title and description. Next.js replaces nested openGraph objects, so each exam page needs the full set.
 */
export const EXAM_PORTAL_COPY = {
  boards: { title: "Board Exams · UP Board, CBSE and ICSE", description: "Class 10 and 12 board exam prep for UP Board, CBSE and ICSE: chapter-wise questions, worked answers, past papers and mock tests, in English and Hindi." },
  competitive: { title: "Competitive Exams · NDA, Defence, Banks, Railways, SSC, UPSC, CBI and Income Tax", description: "Government exam prep for NDA, defence, banks, railways, SSC, UPSC, TET and more: most-asked questions, model answers and mock tests, in English and Hindi." },
} as const;
export function examMetadata({ title, description, path }: { title: string; description: string; path: `/${string}` }): Metadata {
  const full = `${title} · MasterClass Exams`, text = snippet(description);
  return {
    title, description: text,
    openGraph: { type: "website", url: path, siteName, title: full, description: text, locale: "en_IN", images: [ogImage] },
    twitter: { card: "summary_large_image", title: full, description: text, images: [ogImage.url] },
  };
}

/** Search results show about 160 characters; generated descriptions (a technology's tagline appended) ran past that,
 *  so they end at the last whole word that fits instead of being cut mid-word by the search engine. */
function snippet(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:–—-]+$/, "")}…`;
}

/** BreadcrumbList structured data for a trail of [name, path] pairs, starting after Home. */
export function breadcrumbSchema(trail: readonly (readonly [string, `/${string}`])[]) {
  const origin = siteUrl().href;
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"] as const, ...trail].map(([name, path], index) => ({ "@type": "ListItem", position: index + 1, name, item: new URL(path, origin).href })),
  };
}

/**
 * When the static catalogues (handbooks, vocabulary, interview questions, blueprints, comparisons, company pages) last
 * changed: the visible "Last updated" date and dateModified on those pages. Bump it when their content changes; never
 * set it from the build date, which would claim freshness on every deploy.
 */
export const CONTENT_UPDATED = "2026-11-02";

/** A YYYY-MM-DD date as people read it: 1 November 2026. */
export function readableDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

export function websiteSchema() {
  const url = siteUrl().href;
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${url}#website`, url, name: siteName, alternateName: ["Master Class Buddy", "masterclassbuddy.com"], description: siteDescription, inLanguage: HINDI_ENABLED ? ["en", "hi"] : "en", keywords: siteKeywords.join(", "), publisher: { "@id": `${url}#organization` } };
}

export function organizationSchema(prices?: { monthly:number; yearly:number }) {
  const url = siteUrl().href;
  // The membership, as search engines should describe the business: one plan, monthly or yearly, in rupees.
  const offer = (name: string, price: number, unit: "MON" | "ANN") => ({
    "@type": "Offer", name, price: String(price), priceCurrency: "INR", url: new URL("/subscribe", url).href, availability: "https://schema.org/InStock",
    priceSpecification: { "@type": "UnitPriceSpecification", price: String(price), priceCurrency: "INR", unitCode: unit, referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: unit } },
  });
  return {
    "@context": "https://schema.org", "@type": ["Organization", "EducationalOrganization", "LocalBusiness"], "@id": `${url}#organization`, name: siteName, alternateName: ["Master Class Buddy", "masterclassbuddy.com"], url,
    // A raster logo (Google's logo guidance asks for a crawlable image of at least 112×112); the SVG stays the favicon.
    logo: { "@type": "ImageObject", url: new URL("/brand/masterclass-mark-512.png", url).href, width: 512, height: 512 },
    image: new URL(ogImagePath, url).href,
    description: siteDescription, slogan: "Your buddy for tech careers, board exams and competitive exams.", areaServed: "IN", knowsLanguage: HINDI_ENABLED ? ["en", "hi"] : ["en"],
    // Support contact, postal address and social profiles (lib/site-contact.ts); the address makes it a LocalBusiness.
    // No email: it would put a plaintext address in every page's HTML for harvesters (and SEO checkers' plaintext-email
    // test); the Contact page URL stands in, and components/email-link.tsx shows the address there.
    telephone: SUPPORT.phone, address: { "@type": "PostalAddress", ...ADDRESS },
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: new URL("/contact", url).href, telephone: SUPPORT.phone, areaServed: "IN", availableLanguage: ["English"] },
    sameAs: SOCIAL_PROFILES.map(item => item.href),
    knowsAbout: [
      "React 19", "Next.js 16", "TypeScript", "JavaScript", "Python 3.12", "Node.js", "System design",
      "Agentic AI", "AI agents", "Model Context Protocol MCP", "Claude Code", "LangChain", "LangGraph", "LangSmith", "LangFlow", "n8n", "TanStack Start",
      "AWS", "Docker", "Kubernetes", "Linux", "Git", "PostgreSQL", "Redis", "FastAPI", "Go", "Rust", "Zustand", "TanStack Query",
      "Vitest", "Playwright", "Tech interview preparation", "English vocabulary with Hindi meanings",
      "Board exam preparation", "UP Board", "CBSE", "ICSE", "Class 10 and Class 12 Mathematics, Physics, Chemistry and English",
      "Competitive exam preparation", "NDA", "Defence exams", "Teacher Eligibility Test (CTET, UPTET)", "SSC", "Banking exams", "Railway exams", "UPSC Civil Services", "State PSC exams", "IELTS preparation"
    ],
    ...(prices ? { hasOfferCatalog: { "@type": "OfferCatalog", name: "MasterClass membership", itemListElement: [
      offer("Monthly membership", prices.monthly, "MON"),
      offer("Yearly membership", prices.yearly, "ANN"),
    ] } } : {}),
  };
}

export function webPageSchema(path: PublicPage["path"], updated: string = CONTENT_UPDATED) {
  const { title, description } = publicPage(path);
  const origin = siteUrl().href, url = new URL(path, origin).href;
  return {
    "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#webpage`, url, name: title, description, inLanguage: "en", dateModified: updated,
    isPartOf: { "@id": `${origin}#website` },
    ...(path === "/" ? {} : { breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: origin }, { "@type": "ListItem", position: 2, name: title, item: url }] } }),
  };
}

/** WebPage data for a generated learning page, which is not in PUBLIC_PAGES. */
export function learningPageSchema({ path, title, description, updated = CONTENT_UPDATED }: { path: `/${string}`; title: string; description: string; updated?: string }) {
  const origin = siteUrl().href, url = new URL(path, origin).href;
  return { "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#webpage`, url, name: title, description, inLanguage: "en", dateModified: updated, isPartOf: { "@id": `${origin}#website` } };
}

export function howToSchema(name: string, steps: readonly string[]) {
  return { "@context": "https://schema.org", "@type": "HowTo", name, step: steps.map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })) };
}

export function faqSchema(items: readonly { question: string; answer: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
