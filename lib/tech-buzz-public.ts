import type { ArticleComment, TechBuzzArticle } from "./tech-buzz-data";
import { DAILY_TAG, isInternalTag } from "./tech-buzz-sections";
import { topicsOf } from "./tech-buzz-favourites";

/**
 * What each Tech Buzz audience may receive. Lists get light cards, everyone gets the free preview of an article, and
 * the rest of the story (sections after the first, the takeaway, the discussion) is served only to members by
 * /api/tech-buzz/[slug]/member. Pages and public APIs must pass articles through these functions before they reach
 * the browser: the paywall is enforced by what is sent, not by what is hidden.
 */
export type TechBuzzSection = TechBuzzArticle["contentSections"][number];

/** Business and policy reports kept for admins but left out of the public technology blog. */
const NOT_TECHNOLOGY = new Set(["bain-company-enterprise-ai-roi-report", "indian-express-sovereign-ai-semiconductor-fabs"]);
export const isTechnologyStory = (article: Pick<TechBuzzArticle, "slug">) => !NOT_TECHNOLOGY.has(article.slug);

/** Third-party blog platforms are never named, linked or shown on Tech Buzz (user rule 2026-10-25): stories carry
 *  MasterClass Buddy as their source, and tags naming a platform are dropped. */
const PLATFORM = /\b(medium|daily\.?dev|dev\.to|indie ?hackers|hashnode|substack|the information|bain|indian express)\b/i;
const OWN_SOURCE: TechBuzzArticle["source"] = { name: "MasterClass Buddy", domain: "masterclass", trustScore: "" };
const ownTags = (tags: string[]) => tags.filter(tag => !PLATFORM.test(tag) && !isInternalTag(tag));
/** The daily 5:00 AM edition a story belongs to, read from its internal tags (lib/tech-buzz-sections.ts). */
const dailyOf = (tags: string[]) => {
  if (!tags.includes(DAILY_TAG)) return undefined;
  const date = tags.find(tag => tag.startsWith("daily:"))?.slice(6);
  const track = tags.find(tag => tag.startsWith("daily-track:"))?.slice(12);
  return date && track ? { date, track } : undefined;
};
const ownText = (text: string | undefined) => (text && !PLATFORM.test(text) ? text : undefined);

/** Learning Dashboard technology ids for stories saved before techId existed, matched on their technology label. */
const TECH_IDS: [RegExp, string][] = [
  [/claude|anthropic/i, "claude"], [/openai|\bgpt/i, "openai"], [/google|gemini|vertex/i, "google"], [/microsoft|azure|copilot|semantic kernel|autogen/i, "microsoft"],
  [/agent frameworks?|crewai|llamaindex/i, "langgraph"], [/ai trends|emerging/i, "agentic-ai"],
  [/next\.?js/i, "nextjs"], [/typescript/i, "typescript"], [/postgres/i, "postgresql"], [/agentic|mcp|rag|reasoning/i, "agentic-ai"],
  [/rust/i, "rust"], [/kubernetes|crossplane|platform engineering|ebpf/i, "kubernetes"],
  [/react/i, "react"], [/python/i, "python"], [/docker/i, "docker"], [/\baws\b/i, "aws"],
  [/langchain/i, "langchain"], [/langgraph/i, "langgraph"], [/langsmith/i, "langsmith"], [/langflow/i, "langflow"],
  [/n8n/i, "n8n"], [/system design|architecture|streaming|kafka|event/i, "system-design"], [/redis/i, "redis"],
  [/playwright/i, "playwright"], [/vitest/i, "vitest"], [/graphql/i, "graphql"],
];
/** Topic names for technologies that several stories share (labels like "Next.js 15 & React 19" are per story). */
const TOPIC_LABELS: Record<string, string> = {
  nextjs: "Next.js 16+", react: "React 19+", typescript: "TypeScript", postgresql: "PostgreSQL 17", "agentic-ai": "Agentic AI",
  rust: "Rust", kubernetes: "Kubernetes", aws: "AWS Cloud", python: "Python", docker: "Docker", "system-design": "System Design",
  langchain: "LangChain", langgraph: "LangGraph", langsmith: "LangSmith", langflow: "LangFlow", n8n: "n8n", redis: "Redis",
  playwright: "Playwright", vitest: "Vitest", graphql: "GraphQL", claude: "Claude Code", openai: "OpenAI", google: "Google AI", microsoft: "Microsoft AI",
};
export const topicLabel = (card: Pick<TechBuzzCard, "techId" | "technology" | "category">) =>
  card.techId ? TOPIC_LABELS[card.techId] ?? card.technology.replace(/\s+(&|\d).*$/, "") : card.category;
export const techIdOf = (article: Pick<TechBuzzArticle, "techId" | "technology">) =>
  article.techId ?? TECH_IDS.find(([pattern]) => pattern.test(article.technology))?.[1];

export type TechBuzzCard = {
  id: string; slug: string; title: string; subtitle: string; category: string; technology: string; techId?: string;
  color: string; publishedAt: string; readTimeMinutes: number; featured: boolean; trendingRank?: number;
  claps: number; likes: number; dislikes: number; reactions: number; commentsCount: number; rating: { average: number; count: number };
  author: { name: string; role: string; avatar: string; verified: boolean }; coverImage: string; tags: string[];
  summary: string[]; milestone?: { label: string; value: string };
  /** Plain-text credit when the cover is an Unsplash photo chosen for the story (lib/server/tech-buzz-storage.ts). */
  photoCredit?: string;
  /** Set on stories of the daily 5:00 AM (IST) edition. */
  daily?: { date: string; track: string };
  /** The "Community favourites" topics it belongs to (lib/tech-buzz-favourites.ts). */
  topics: string[];
  /** The editor's pre-publish score out of 5, when it had one. */
  editorScore?: number;
};

export function toCard(article: TechBuzzArticle): TechBuzzCard {
  const reactions = article.reactions ?? { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 };
  return {
    id: article.id, slug: article.slug, title: article.title, subtitle: article.subtitle, category: article.category,
    technology: article.technology, techId: techIdOf(article), color: article.techBadgeColor, publishedAt: article.publishedAt,
    readTimeMinutes: article.readTimeMinutes, featured: !!article.featured, trendingRank: article.trendingRank,
    claps: article.claps ?? 0, likes: article.likes ?? 0, dislikes: article.dislikes ?? 0, reactions: reactions.heart + reactions.unicorn + reactions.rocket + reactions.mindblown,
    commentsCount: article.commentsCount ?? 0, rating: { average: article.rating?.average ?? 0, count: article.rating?.count ?? 0 },
    author: { name: article.author.name, role: article.author.role, avatar: article.author.avatar, verified: !!article.author.verified },
    coverImage: article.coverImage, tags: ownTags(article.tags).slice(0, 5), summary: article.summaryBullets.slice(0, 3),
    milestone: article.builderMetrics && ownText(article.builderMetrics.metricLabel) && ownText(article.builderMetrics.metricValue)
      ? { label: article.builderMetrics.metricLabel, value: article.builderMetrics.metricValue } : undefined,
    daily: dailyOf(article.tags ?? []),
    topics: topicsOf({ title: article.title, technology: article.technology, tags: article.tags ?? [] }),
    editorScore: article.source?.editorScore,
  };
}

/** The free part of a story: everything but the body, plus its first section's opening paragraphs and an outline. */
export type TechBuzzPreview = Omit<TechBuzzArticle, "contentSections" | "founderTakeaway" | "comments"> & {
  teaser: TechBuzzSection; outline: string[]; lockedCodeSamples: number; photoCredit?: string;
};

export function toPreview(article: TechBuzzArticle): TechBuzzPreview {
  const { contentSections, founderTakeaway, comments, ...rest } = article;
  void founderTakeaway; void comments; // member-only: left out of the preview on purpose
  const [first, ...locked] = contentSections;
  return {
    ...rest,
    tags: ownTags(rest.tags),
    source: OWN_SOURCE,
    newsletterEdition: ownText(rest.newsletterEdition),
    teaser: { heading: first?.heading ?? "", paragraphs: (first?.paragraphs ?? []).slice(0, 2), quote: first?.quote, image: first?.image },
    outline: locked.map(section => section.heading).filter(Boolean),
    lockedCodeSamples: contentSections.filter(section => section.codeSnippet).length,
  };
}

/** The member-only body: every section (the first one in full), the takeaway and the discussion. */
export type TechBuzzMemberContent = { sections: TechBuzzSection[]; founderTakeaway: string; comments: ArticleComment[] };
export const toMemberContent = (article: TechBuzzArticle): TechBuzzMemberContent =>
  ({ sections: article.contentSections, founderTakeaway: article.founderTakeaway, comments: article.comments ?? [] });

/** Popularity for "Most popular": reader signals weighted the same way for every story. */
export const popularity = (card: Pick<TechBuzzCard, "claps" | "likes" | "reactions" | "commentsCount" | "rating">) =>
  card.claps + card.likes * 3 + card.reactions * 2 + card.commentsCount * 5 + card.rating.average * Math.log10(card.rating.count + 1) * 40;

/** Technologies with a logo in public/images/tech (64px PNGs); TanStack Start shares TanStack's. */
const LOGOS = new Set(["agentic-ai","angular","aws","claude","django","docker","express","fastapi","flutter","git","go","google","graphql","javascript","kubernetes","langchain","langflow","langgraph","langsmith","linux","microsoft","n8n","nestjs","nextjs","nodejs","openai","playwright","postgresql","python","react","redis","rust","supabase","system-design","tanstack","typescript","vitest","vue","zustand"]);
const LOGO_ALIAS: Record<string, string> = { "tanstack-start": "tanstack" };
export function techLogo(techId?: string) {
  const id = techId && (LOGO_ALIAS[techId] ?? techId);
  return id && LOGOS.has(id) ? `/images/tech/${id}.png` : undefined;
}
/** A story's or card's logo, resolving stories saved without a techId from their technology label. */
export const logoOf = (item: Pick<TechBuzzArticle, "techId" | "technology">) => techLogo(techIdOf(item));

/** The font-family choices offered everywhere (Application Typography, Tech Buzz, Notepad): Inter and faces like it. */
export interface FontOption {
  id: string;
  name: string;
  category: "Serif" | "Sans-Serif" | "Monospace" | "Display/Creative";
  stack: string;
  rating?: number;
  reviewsCount?: string;
  featured?: boolean;
}

export const READING_FONTS: FontOption[] = [
  // Inter first (the site default), then the Google Fonts closest to it: clean neo-grotesque and humanist sans faces
  // with a large x-height, open apertures and even widths, so switching never changes the layout's rhythm.
  { id: "inter", name: "Inter", category: "Sans-Serif", stack: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif', rating: 5.0, reviewsCount: "48M+", featured: true },
  { id: "inter-tight", name: "Inter Tight", category: "Sans-Serif", stack: '"Inter Tight", "Inter", system-ui, sans-serif', rating: 4.9, reviewsCount: "6M+", featured: true },
  { id: "roboto", name: "Roboto", category: "Sans-Serif", stack: '"Roboto", system-ui, sans-serif', rating: 5.0, reviewsCount: "52M+", featured: true },
  { id: "roboto-flex", name: "Roboto Flex", category: "Sans-Serif", stack: '"Roboto Flex", "Roboto", system-ui, sans-serif', rating: 4.8, reviewsCount: "4M+" },
  { id: "open-sans", name: "Open Sans", category: "Sans-Serif", stack: '"Open Sans", system-ui, sans-serif', rating: 5.0, reviewsCount: "49M+", featured: true },
  { id: "noto-sans", name: "Noto Sans", category: "Sans-Serif", stack: '"Noto Sans", system-ui, sans-serif', rating: 4.9, reviewsCount: "25M+" },
  { id: "source-sans", name: "Source Sans 3", category: "Sans-Serif", stack: '"Source Sans 3", system-ui, sans-serif', rating: 4.9, reviewsCount: "20M+" },
  { id: "ibm-plex-sans", name: "IBM Plex Sans", category: "Sans-Serif", stack: '"IBM Plex Sans", system-ui, sans-serif', rating: 4.9, reviewsCount: "18M+" },
  { id: "public-sans", name: "Public Sans", category: "Sans-Serif", stack: '"Public Sans", system-ui, sans-serif', rating: 4.8, reviewsCount: "9M+" },
  { id: "manrope", name: "Manrope", category: "Sans-Serif", stack: '"Manrope", system-ui, sans-serif', rating: 4.9, reviewsCount: "15M+", featured: true },
  { id: "plus-jakarta", name: "Plus Jakarta Sans", category: "Sans-Serif", stack: '"Plus Jakarta Sans", system-ui, sans-serif', rating: 4.9, reviewsCount: "19M+", featured: true },
  { id: "dm-sans", name: "DM Sans", category: "Sans-Serif", stack: '"DM Sans", system-ui, sans-serif', rating: 4.9, reviewsCount: "18M+" },
  { id: "figtree", name: "Figtree", category: "Sans-Serif", stack: '"Figtree", system-ui, sans-serif', rating: 4.8, reviewsCount: "10M+" },
  { id: "work-sans", name: "Work Sans", category: "Sans-Serif", stack: '"Work Sans", system-ui, sans-serif', rating: 4.9, reviewsCount: "22M+" },
  { id: "nunito-sans", name: "Nunito Sans", category: "Sans-Serif", stack: '"Nunito Sans", system-ui, sans-serif', rating: 4.9, reviewsCount: "21M+" },
  { id: "lato", name: "Lato", category: "Sans-Serif", stack: '"Lato", system-ui, sans-serif', rating: 5.0, reviewsCount: "39M+" },
  { id: "rubik", name: "Rubik", category: "Sans-Serif", stack: '"Rubik", system-ui, sans-serif', rating: 4.9, reviewsCount: "21M+" },
  { id: "heebo", name: "Heebo", category: "Sans-Serif", stack: '"Heebo", system-ui, sans-serif', rating: 4.8, reviewsCount: "11M+" },
  { id: "arimo", name: "Arimo", category: "Sans-Serif", stack: '"Arimo", Arial, sans-serif', rating: 4.8, reviewsCount: "10M+" },
  { id: "hanken-grotesk", name: "Hanken Grotesk", category: "Sans-Serif", stack: '"Hanken Grotesk", system-ui, sans-serif', rating: 4.8, reviewsCount: "3M+" },
  { id: "albert-sans", name: "Albert Sans", category: "Sans-Serif", stack: '"Albert Sans", system-ui, sans-serif', rating: 4.8, reviewsCount: "2M+" },
  { id: "instrument-sans", name: "Instrument Sans", category: "Sans-Serif", stack: '"Instrument Sans", system-ui, sans-serif', rating: 4.8, reviewsCount: "2M+" },
  { id: "schibsted-grotesk", name: "Schibsted Grotesk", category: "Sans-Serif", stack: '"Schibsted Grotesk", system-ui, sans-serif', rating: 4.7, reviewsCount: "1M+" },
  { id: "onest", name: "Onest", category: "Sans-Serif", stack: '"Onest", system-ui, sans-serif', rating: 4.7, reviewsCount: "1M+" },
  { id: "geist", name: "Geist", category: "Sans-Serif", stack: '"Geist", system-ui, sans-serif', rating: 4.9, reviewsCount: "5M+", featured: true },
  { id: "be-vietnam-pro", name: "Be Vietnam Pro", category: "Sans-Serif", stack: '"Be Vietnam Pro", system-ui, sans-serif', rating: 4.8, reviewsCount: "3M+" },
  { id: "red-hat-text", name: "Red Hat Text", category: "Sans-Serif", stack: '"Red Hat Text", system-ui, sans-serif', rating: 4.8, reviewsCount: "8M+" },
  { id: "system-ui", name: "System UI", category: "Sans-Serif", stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', rating: 4.9, reviewsCount: "40M+" },
];

export const DEFAULT_READING_FONT_ID = "inter";

