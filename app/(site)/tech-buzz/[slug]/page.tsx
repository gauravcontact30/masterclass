import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/seo";
import {
  getTechBuzzArticleBySlug,
  getTechBuzzArticles
} from "@/lib/tech-buzz-data";
import { TechBuzzArticleView } from "@/components/tech-buzz-article-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getTechBuzzArticles();
  return articles.map(article => ({
    slug: article.slug
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getTechBuzzArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | Tech Buzz — MasterClass",
      description: "The requested Tech Buzz article could not be located."
    };
  }

  const origin = siteUrl().href;
  const canonicalUrl = `/tech-buzz/${article.slug}`;

  const ogImageUrl = `/tech-buzz/${article.slug}/opengraph-image`;

  return {
    title: `${article.title} | Tech Buzz — MasterClass Buddy`,
    description: article.subtitle,
    keywords: [
      article.technology,
      article.category,
      ...article.tags,
      "Tech Buzz",
      "Medium style tech blog",
      "architecture deep dive",
      "daily.dev ranked article",
      "Indie Hackers metrics",
      "MasterClass Buddy blogs"
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName,
      title: `${article.title} | Tech Buzz`,
      description: article.subtitle,
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      tags: article.tags,
      locale: "en_IN",
      alternateLocale: ["hi_IN", "es_ES", "ja_JP", "de_DE", "fr_FR", "zh_CN"],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${article.title} — MasterClass Buddy Tech Buzz`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | Tech Buzz`,
      description: article.subtitle,
      images: [ogImageUrl]
    }
  };
}

export default async function TechBuzzArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getTechBuzzArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const origin = siteUrl().href;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.subtitle,
    image: [article.coverImage],
    datePublished: article.publishedAt,
    author: {
      "@type": "Person",
      name: article.author.name,
      jobTitle: article.author.role
    },
    publisher: {
      "@type": "Organization",
      name: "MasterClass",
      url: origin
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": new URL(`/tech-buzz/${article.slug}`, origin).href
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <TechBuzzArticleView article={article} />
    </>
  );
}
