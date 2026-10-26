import { ImageResponse } from "next/og";
import { OgCard } from "@/components/og-card";
import { siteUrl } from "@/lib/seo";
import { getTechBuzzArticles } from "@/lib/tech-buzz-data";
import { isInternalTag } from "@/lib/tech-buzz-sections";
import { getPublishedTechBuzzArticle, listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const articles = await listPublishedTechBuzzArticles();
  return articles.map(article => ({
    slug: article.slug
  }));
}

interface ImageProps {
  params: Promise<{ slug: string }>;
}

/** Each story's link preview: its headline, subtitle and topics in the shared white card (components/og-card.tsx). */
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const article = await getPublishedTechBuzzArticle(slug) || getTechBuzzArticles()[0];
  const chips = [article.technology, ...article.tags.filter(tag => !isInternalTag(tag))].filter((chip, i, all) => chip && all.indexOf(chip) === i);
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(article.publishedAt));
  return new ImageResponse(<OgCard
    eyebrow={`MCB - Tech Buzz · ${article.category}`}
    title={article.title}
    subtitle={article.subtitle}
    chips={chips}
    footer={`${date} · ${article.readTimeMinutes} min read · ${siteUrl().host}`}
    accent={article.techBadgeColor || undefined}
  />, size);
}
