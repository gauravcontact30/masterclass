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

/** Learning Dashboard technology ids for stories saved before techId existed, matched on their technology label. */
const TECH_IDS: [RegExp, string][] = [
  [/next\.?js/i, "nextjs"], [/typescript/i, "typescript"], [/postgres/i, "postgresql"], [/agentic|mcp/i, "agentic-ai"],
  [/rust/i, "rust"], [/kubernetes|crossplane|platform engineering/i, "kubernetes"],
  [/react/i, "react"], [/python/i, "python"], [/docker/i, "docker"], [/\baws\b/i, "aws"],
];
/** Topic names for technologies that several stories share (labels like "Next.js 15 & React 19" are per story). */
const TOPIC_LABELS: Record<string, string> = {
  nextjs: "Next.js", react: "React", typescript: "TypeScript", postgresql: "PostgreSQL", "agentic-ai": "Agentic AI",
  rust: "Rust", kubernetes: "Kubernetes", aws: "AWS", python: "Python", docker: "Docker", "system-design": "System Design",
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
    coverImage: article.coverImage, tags: article.tags.slice(0, 5), summary: article.summaryBullets.slice(0, 3),
    milestone: article.builderMetrics ? { label: article.builderMetrics.metricLabel, value: article.builderMetrics.metricValue } : undefined,
  };
}

/** The free part of a story: everything but the body, plus its first section's opening paragraphs and an outline. */
export type TechBuzzPreview = Omit<TechBuzzArticle, "contentSections" | "founderTakeaway" | "comments"> & {
  teaser: TechBuzzSection; outline: string[]; lockedCodeSamples: number;
};

export function toPreview(article: TechBuzzArticle): TechBuzzPreview {
  const { contentSections, founderTakeaway, comments, ...rest } = article;
  void founderTakeaway; void comments; // member-only: left out of the preview on purpose
  const [first, ...locked] = contentSections;
  return {
    ...rest,
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
