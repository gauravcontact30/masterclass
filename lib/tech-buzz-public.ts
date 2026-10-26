import type { ArticleComment, TechBuzzArticle } from "./tech-buzz-data";

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
const ownTags = (tags: string[]) => tags.filter(tag => !PLATFORM.test(tag));
const ownText = (text: string | undefined) => (text && !PLATFORM.test(text) ? text : undefined);

/** Learning Dashboard technology ids for stories saved before techId existed, matched on their technology label. */
const TECH_IDS: [RegExp, string][] = [
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
  playwright: "Playwright", vitest: "Vitest", graphql: "GraphQL",
};
export const topicLabel = (card: Pick<TechBuzzCard, "techId" | "technology" | "category">) =>
  card.techId ? TOPIC_LABELS[card.techId] ?? card.technology.replace(/\s+(&|\d).*$/, "") : card.category;
export const techIdOf = (article: Pick<TechBuzzArticle, "techId" | "technology">) =>
  article.techId ?? TECH_IDS.find(([pattern]) => pattern.test(article.technology))?.[1];

export type TechBuzzCard = {
  id: string; slug: string; title: string; subtitle: string; category: string; technology: string; techId?: string;
  color: string; publishedAt: string; readTimeMinutes: number; featured: boolean; trendingRank?: number;
  claps: number; likes: number; reactions: number; commentsCount: number; rating: { average: number; count: number };
  author: { name: string; role: string; avatar: string; verified: boolean }; coverImage: string; tags: string[];
  summary: string[]; milestone?: { label: string; value: string };
  /** Plain-text credit when the cover is an Unsplash photo chosen for the story (lib/server/tech-buzz-storage.ts). */
  photoCredit?: string;
};

export function toCard(article: TechBuzzArticle): TechBuzzCard {
  const reactions = article.reactions ?? { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 };
  return {
    id: article.id, slug: article.slug, title: article.title, subtitle: article.subtitle, category: article.category,
    technology: article.technology, techId: techIdOf(article), color: article.techBadgeColor, publishedAt: article.publishedAt,
    readTimeMinutes: article.readTimeMinutes, featured: !!article.featured, trendingRank: article.trendingRank,
    claps: article.claps ?? 0, likes: article.likes ?? 0, reactions: reactions.heart + reactions.unicorn + reactions.rocket + reactions.mindblown,
    commentsCount: article.commentsCount ?? 0, rating: { average: article.rating?.average ?? 0, count: article.rating?.count ?? 0 },
    author: { name: article.author.name, role: article.author.role, avatar: article.author.avatar, verified: !!article.author.verified },
    coverImage: article.coverImage, tags: ownTags(article.tags).slice(0, 5), summary: article.summaryBullets.slice(0, 3),
    milestone: article.builderMetrics && ownText(article.builderMetrics.metricLabel) && ownText(article.builderMetrics.metricValue)
      ? { label: article.builderMetrics.metricLabel, value: article.builderMetrics.metricValue } : undefined,
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
    teaser: { heading: first?.heading ?? "", paragraphs: (first?.paragraphs ?? []).slice(0, 2), quote: first?.quote },
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
const LOGOS = new Set(["agentic-ai","angular","aws","claude","django","docker","express","fastapi","flutter","git","go","graphql","javascript","kubernetes","langchain","langflow","langgraph","langsmith","linux","n8n","nestjs","nextjs","nodejs","playwright","postgresql","python","react","redis","rust","supabase","system-design","tanstack","typescript","vitest","vue","zustand"]);
const LOGO_ALIAS: Record<string, string> = { "tanstack-start": "tanstack" };
export function techLogo(techId?: string) {
  const id = techId && (LOGO_ALIAS[techId] ?? techId);
  return id && LOGOS.has(id) ? `/images/tech/${id}.png` : undefined;
}

/** 75+ popular reading font-family options curated from Google Fonts library & editorial typography. */
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
  // ── Serif (Editorial & Book Reading) ──────────────────────────
  { id: "georgia", name: "Georgia", category: "Serif", stack: 'Georgia, "Nirmala UI", "Times New Roman", serif', rating: 5.0, reviewsCount: "45M+", featured: true },
  { id: "merriweather", name: "Merriweather", category: "Serif", stack: '"Merriweather", Georgia, serif', rating: 5.0, reviewsCount: "32M+", featured: true },
  { id: "lora", name: "Lora", category: "Serif", stack: '"Lora", Georgia, serif', rating: 4.9, reviewsCount: "28M+", featured: true },
  { id: "charter", name: "Charter", category: "Serif", stack: '"Charter", "Bitstream Charter", Georgia, serif', rating: 4.9, reviewsCount: "16M+" },
  { id: "source-serif", name: "Source Serif 4", category: "Serif", stack: '"Source Serif 4", Georgia, serif', rating: 4.9, reviewsCount: "14M+" },
  { id: "newsreader", name: "Newsreader", category: "Serif", stack: '"Newsreader", Georgia, serif', rating: 4.8, reviewsCount: "9M+" },
  { id: "literata", name: "Literata", category: "Serif", stack: '"Literata", Georgia, serif', rating: 4.8, reviewsCount: "8M+" },
  { id: "spectral", name: "Spectral", category: "Serif", stack: '"Spectral", Georgia, serif', rating: 4.8, reviewsCount: "7M+" },
  { id: "crimson-text", name: "Crimson Text", category: "Serif", stack: '"Crimson Text", Garamond, serif', rating: 4.9, reviewsCount: "19M+" },
  { id: "crimson-pro", name: "Crimson Pro", category: "Serif", stack: '"Crimson Pro", Georgia, serif', rating: 4.8, reviewsCount: "11M+" },
  { id: "playfair", name: "Playfair Display", category: "Serif", stack: '"Playfair Display", Georgia, serif', rating: 4.9, reviewsCount: "26M+", featured: true },
  { id: "baskerville", name: "Baskerville", category: "Serif", stack: '"Baskerville", "Baskerville Old Face", Georgia, serif', rating: 4.9, reviewsCount: "15M+" },
  { id: "libre-baskerville", name: "Libre Baskerville", category: "Serif", stack: '"Libre Baskerville", Georgia, serif', rating: 4.9, reviewsCount: "21M+" },
  { id: "pt-serif", name: "PT Serif", category: "Serif", stack: '"PT Serif", Georgia, serif', rating: 4.8, reviewsCount: "12M+" },
  { id: "noto-serif", name: "Noto Serif", category: "Serif", stack: '"Noto Serif", Georgia, serif', rating: 4.9, reviewsCount: "16M+" },
  { id: "roboto-serif", name: "Roboto Serif", category: "Serif", stack: '"Roboto Serif", Georgia, serif', rating: 4.9, reviewsCount: "15M+" },
  { id: "eb-garamond", name: "EB Garamond", category: "Serif", stack: '"EB Garamond", Garamond, Georgia, serif', rating: 4.9, reviewsCount: "18M+" },
  { id: "cinzel", name: "Cinzel", category: "Serif", stack: '"Cinzel", Georgia, serif', rating: 4.8, reviewsCount: "10M+" },
  { id: "bitter", name: "Bitter", category: "Serif", stack: '"Bitter", Georgia, serif', rating: 4.8, reviewsCount: "9M+" },
  { id: "cormorant-garamond", name: "Cormorant Garamond", category: "Serif", stack: '"Cormorant Garamond", Georgia, serif', rating: 4.8, reviewsCount: "11M+" },
  { id: "domine", name: "Domine", category: "Serif", stack: '"Domine", Georgia, serif', rating: 4.8, reviewsCount: "6M+" },
  { id: "bodoni-moda", name: "Bodoni Moda", category: "Serif", stack: '"Bodoni Moda", Georgia, serif', rating: 4.8, reviewsCount: "7M+" },
  { id: "frank-ruhl-libre", name: "Frank Ruhl Libre", category: "Serif", stack: '"Frank Ruhl Libre", Georgia, serif', rating: 4.7, reviewsCount: "5M+" },
  { id: "cardo", name: "Cardo", category: "Serif", stack: '"Cardo", Georgia, serif', rating: 4.8, reviewsCount: "6M+" },
  { id: "faustina", name: "Faustina", category: "Serif", stack: '"Faustina", Georgia, serif', rating: 4.7, reviewsCount: "4M+" },
  { id: "vollkorn", name: "Vollkorn", category: "Serif", stack: '"Vollkorn", Georgia, serif', rating: 4.8, reviewsCount: "8M+" },
  { id: "marcellus", name: "Marcellus", category: "Serif", stack: '"Marcellus", Georgia, serif', rating: 4.8, reviewsCount: "7M+" },
  { id: "alegreya", name: "Alegreya", category: "Serif", stack: '"Alegreya", Georgia, serif', rating: 4.8, reviewsCount: "9M+" },
  { id: "besley", name: "Besley", category: "Serif", stack: '"Besley", Georgia, serif', rating: 4.7, reviewsCount: "4M+" },
  { id: "castoro", name: "Castoro", category: "Serif", stack: '"Castoro", Georgia, serif', rating: 4.7, reviewsCount: "3M+" },
  { id: "ibm-plex-serif", name: "IBM Plex Serif", category: "Serif", stack: '"IBM Plex Serif", Georgia, serif', rating: 4.8, reviewsCount: "9M+" },

  // ── Sans-Serif (Modern & Crisp) ───────────────────────────────
  { id: "inter", name: "Inter", category: "Sans-Serif", stack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', rating: 5.0, reviewsCount: "48M+", featured: true },
  { id: "arial", name: "Arial", category: "Sans-Serif", stack: 'Arial, Helvetica, sans-serif', rating: 4.9, reviewsCount: "50M+" },
  { id: "helvetica", name: "Helvetica", category: "Sans-Serif", stack: '"Helvetica Neue", Helvetica, Arial, sans-serif', rating: 5.0, reviewsCount: "45M+" },
  { id: "system-ui", name: "System UI", category: "Sans-Serif", stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', rating: 4.9, reviewsCount: "40M+" },
  { id: "roboto", name: "Roboto", category: "Sans-Serif", stack: '"Roboto", -apple-system, sans-serif', rating: 5.0, reviewsCount: "52M+", featured: true },
  { id: "open-sans", name: "Open Sans", category: "Sans-Serif", stack: '"Open Sans", -apple-system, sans-serif', rating: 5.0, reviewsCount: "49M+", featured: true },
  { id: "lato", name: "Lato", category: "Sans-Serif", stack: '"Lato", -apple-system, sans-serif', rating: 5.0, reviewsCount: "39M+", featured: true },
  { id: "plus-jakarta", name: "Plus Jakarta Sans", category: "Sans-Serif", stack: '"Plus Jakarta Sans", -apple-system, sans-serif', rating: 4.9, reviewsCount: "19M+", featured: true },
  { id: "work-sans", name: "Work Sans", category: "Sans-Serif", stack: '"Work Sans", -apple-system, sans-serif', rating: 4.9, reviewsCount: "22M+" },
  { id: "source-sans", name: "Source Sans 3", category: "Sans-Serif", stack: '"Source Sans 3", -apple-system, sans-serif', rating: 4.9, reviewsCount: "20M+" },
  { id: "montserrat", name: "Montserrat", category: "Sans-Serif", stack: '"Montserrat", -apple-system, sans-serif', rating: 5.0, reviewsCount: "41M+", featured: true },
  { id: "poppins", name: "Poppins", category: "Sans-Serif", stack: '"Poppins", -apple-system, sans-serif', rating: 5.0, reviewsCount: "36M+", featured: true },
  { id: "nunito", name: "Nunito", category: "Sans-Serif", stack: '"Nunito", -apple-system, sans-serif', rating: 4.9, reviewsCount: "24M+" },
  { id: "nunito-sans", name: "Nunito Sans", category: "Sans-Serif", stack: '"Nunito Sans", -apple-system, sans-serif', rating: 4.9, reviewsCount: "21M+" },
  { id: "raleway", name: "Raleway", category: "Sans-Serif", stack: '"Raleway", -apple-system, sans-serif', rating: 4.9, reviewsCount: "27M+" },
  { id: "ubuntu", name: "Ubuntu", category: "Sans-Serif", stack: '"Ubuntu", -apple-system, sans-serif', rating: 4.9, reviewsCount: "23M+" },
  { id: "rubik", name: "Rubik", category: "Sans-Serif", stack: '"Rubik", -apple-system, sans-serif', rating: 4.9, reviewsCount: "21M+" },
  { id: "dm-sans", name: "DM Sans", category: "Sans-Serif", stack: '"DM Sans", -apple-system, sans-serif', rating: 4.9, reviewsCount: "18M+" },
  { id: "manrope", name: "Manrope", category: "Sans-Serif", stack: '"Manrope", -apple-system, sans-serif', rating: 4.9, reviewsCount: "15M+" },
  { id: "mulish", name: "Mulish", category: "Sans-Serif", stack: '"Mulish", -apple-system, sans-serif', rating: 4.8, reviewsCount: "13M+" },
  { id: "quicksand", name: "Quicksand", category: "Sans-Serif", stack: '"Quicksand", -apple-system, sans-serif', rating: 4.9, reviewsCount: "19M+" },
  { id: "karla", name: "Karla", category: "Sans-Serif", stack: '"Karla", -apple-system, sans-serif', rating: 4.8, reviewsCount: "14M+" },
  { id: "barlow", name: "Barlow", category: "Sans-Serif", stack: '"Barlow", -apple-system, sans-serif', rating: 4.8, reviewsCount: "16M+" },
  { id: "heebo", name: "Heebo", category: "Sans-Serif", stack: '"Heebo", -apple-system, sans-serif', rating: 4.8, reviewsCount: "11M+" },
  { id: "outfit", name: "Outfit", category: "Sans-Serif", stack: '"Outfit", -apple-system, sans-serif', rating: 5.0, reviewsCount: "17M+", featured: true },
  { id: "figtree", name: "Figtree", category: "Sans-Serif", stack: '"Figtree", -apple-system, sans-serif', rating: 4.8, reviewsCount: "10M+" },
  { id: "jost", name: "Jost", category: "Sans-Serif", stack: '"Jost", -apple-system, sans-serif', rating: 4.8, reviewsCount: "12M+" },
  { id: "red-hat-display", name: "Red Hat Display", category: "Sans-Serif", stack: '"Red Hat Display", -apple-system, sans-serif', rating: 4.8, reviewsCount: "9M+" },
  { id: "red-hat-text", name: "Red Hat Text", category: "Sans-Serif", stack: '"Red Hat Text", -apple-system, sans-serif', rating: 4.8, reviewsCount: "8M+" },
  { id: "titillium-web", name: "Titillium Web", category: "Sans-Serif", stack: '"Titillium Web", -apple-system, sans-serif', rating: 4.8, reviewsCount: "14M+" },
  { id: "cabin", name: "Cabin", category: "Sans-Serif", stack: '"Cabin", -apple-system, sans-serif', rating: 4.8, reviewsCount: "11M+" },
  { id: "arimo", name: "Arimo", category: "Sans-Serif", stack: '"Arimo", -apple-system, sans-serif', rating: 4.8, reviewsCount: "10M+" },
  { id: "assistant", name: "Assistant", category: "Sans-Serif", stack: '"Assistant", -apple-system, sans-serif', rating: 4.7, reviewsCount: "7M+" },
  { id: "overpass", name: "Overpass", category: "Sans-Serif", stack: '"Overpass", -apple-system, sans-serif', rating: 4.8, reviewsCount: "8M+" },
  { id: "urbanist", name: "Urbanist", category: "Sans-Serif", stack: '"Urbanist", -apple-system, sans-serif', rating: 4.9, reviewsCount: "13M+" },
  { id: "lexend", name: "Lexend", category: "Sans-Serif", stack: '"Lexend", -apple-system, sans-serif', rating: 4.8, reviewsCount: "11M+" },
  { id: "public-sans", name: "Public Sans", category: "Sans-Serif", stack: '"Public Sans", -apple-system, sans-serif', rating: 4.8, reviewsCount: "9M+" },
  { id: "noto-sans", name: "Noto Sans", category: "Sans-Serif", stack: '"Noto Sans", -apple-system, sans-serif', rating: 4.9, reviewsCount: "25M+" },
  { id: "ibm-plex-sans", name: "IBM Plex Sans", category: "Sans-Serif", stack: '"IBM Plex Sans", -apple-system, sans-serif', rating: 4.9, reviewsCount: "18M+" },
  { id: "verdana", name: "Verdana", category: "Sans-Serif", stack: 'Verdana, Geneva, sans-serif', rating: 4.8, reviewsCount: "35M+" },

  // ── Monospace & Technical ─────────────────────────────────────
  { id: "jetbrains-mono", name: "JetBrains Mono", category: "Monospace", stack: '"JetBrains Mono", "Courier New", monospace', rating: 5.0, reviewsCount: "24M+", featured: true },
  { id: "fira-code", name: "Fira Code", category: "Monospace", stack: '"Fira Code", monospace', rating: 5.0, reviewsCount: "26M+", featured: true },
  { id: "source-code-pro", name: "Source Code Pro", category: "Monospace", stack: '"Source Code Pro", monospace', rating: 4.9, reviewsCount: "22M+", featured: true },
  { id: "roboto-mono", name: "Roboto Mono", category: "Monospace", stack: '"Roboto Mono", monospace', rating: 4.9, reviewsCount: "28M+" },
  { id: "inconsolata", name: "Inconsolata", category: "Monospace", stack: '"Inconsolata", monospace', rating: 4.9, reviewsCount: "19M+" },
  { id: "space-mono", name: "Space Mono", category: "Monospace", stack: '"Space Mono", monospace', rating: 4.8, reviewsCount: "11M+" },
  { id: "ibm-plex-mono", name: "IBM Plex Mono", category: "Monospace", stack: '"IBM Plex Mono", monospace', rating: 4.8, reviewsCount: "14M+" },
  { id: "pt-mono", name: "PT Mono", category: "Monospace", stack: '"PT Mono", monospace', rating: 4.8, reviewsCount: "9M+" },
  { id: "ubuntu-mono", name: "Ubuntu Mono", category: "Monospace", stack: '"Ubuntu Mono", monospace', rating: 4.8, reviewsCount: "10M+" },
  { id: "dm-mono", name: "DM Mono", category: "Monospace", stack: '"DM Mono", monospace', rating: 4.8, reviewsCount: "8M+" },
  { id: "cousine", name: "Cousine", category: "Monospace", stack: '"Cousine", monospace', rating: 4.7, reviewsCount: "5M+" },
  { id: "anonymous-pro", name: "Anonymous Pro", category: "Monospace", stack: '"Anonymous Pro", monospace', rating: 4.8, reviewsCount: "7M+" },
  { id: "overpass-mono", name: "Overpass Mono", category: "Monospace", stack: '"Overpass Mono", monospace', rating: 4.7, reviewsCount: "6M+" },
  { id: "red-hat-mono", name: "Red Hat Mono", category: "Monospace", stack: '"Red Hat Mono", monospace', rating: 4.8, reviewsCount: "7M+" },

  // ── Display & Creative ────────────────────────────────────────
  { id: "caveat", name: "Caveat", category: "Display/Creative", stack: '"Caveat", cursive', rating: 4.9, reviewsCount: "18M+", featured: true },
  { id: "shadows-into-light", name: "Shadows Into Light", category: "Display/Creative", stack: '"Shadows Into Light", cursive', rating: 4.8, reviewsCount: "15M+" },
  { id: "patrick-hand", name: "Patrick Hand", category: "Display/Creative", stack: '"Patrick Hand", cursive', rating: 4.8, reviewsCount: "12M+" },
  { id: "comfortaa", name: "Comfortaa", category: "Display/Creative", stack: '"Comfortaa", sans-serif', rating: 4.8, reviewsCount: "14M+" },
  { id: "dancing-script", name: "Dancing Script", category: "Display/Creative", stack: '"Dancing Script", cursive', rating: 4.9, reviewsCount: "22M+", featured: true },
  { id: "pacifico", name: "Pacifico", category: "Display/Creative", stack: '"Pacifico", cursive', rating: 4.9, reviewsCount: "21M+", featured: true },
  { id: "oswald", name: "Oswald", category: "Display/Creative", stack: '"Oswald", sans-serif', rating: 4.9, reviewsCount: "25M+" },
  { id: "lobster", name: "Lobster", category: "Display/Creative", stack: '"Lobster", cursive', rating: 4.8, reviewsCount: "19M+" },
];

export const DEFAULT_READING_FONT_ID = "georgia";

