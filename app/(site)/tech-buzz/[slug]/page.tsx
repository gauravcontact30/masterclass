import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/seo";
import { getPublishedTechBuzzArticle, listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { TechBuzzArticleView } from "@/components/tech-buzz-article-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Articles published from Super Admin are read from the database, so their pages prerender too.
export async function generateStaticParams() {
  const articles = await listPublishedTechBuzzArticles();
  return articles.map(article => ({
    slug: article.slug
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedTechBuzzArticle(slug);

  if (!article) {
    return {
      robots: { index: false, follow: true },
      title: "Article Not Found | Tech Buzz — MasterClass",
      description: "The requested Tech Buzz article could not be located."
    };
  }

  const canonicalUrl = `/tech-buzz/${article.slug}`;

  const ogImageUrl = `/tech-buzz/${article.slug}/opengraph-image`;

  return {
    title: `${article.title} | Tech Buzz — MasterClass Buddy`,
    description: article.subtitle,
    keywords: [
      article.technology,
      article.category,
      ...article.tags,
      `${article.technology} tutorial`,
      `${article.technology} best practices`,
      `${article.technology} ${article.category.toLowerCase()} guide`,
      "Tech Buzz",
      "technology blog",
      "software engineering deep dive",
      "developer blog India",
      "MasterClass Buddy blogs"
    ],
    authors: [{ name: article.author.name }],
    category: article.category,
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
  const article = await getPublishedTechBuzzArticle(slug);

  if (!article) {
    notFound();
  }

  const origin = siteUrl().href;
  const pageUrl = new URL(`/tech-buzz/${article.slug}`, origin).href;
  const image = new URL(article.coverImage, origin).href;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.subtitle,
    image: [image, new URL(`/tech-buzz/${article.slug}/opengraph-image`, origin).href],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    url: pageUrl,
    keywords: [article.technology, article.category, ...article.tags].join(", "),
    articleSection: article.category,
    timeRequired: `PT${article.readTimeMinutes || 5}M`,
    inLanguage: "en",
    author: {
      "@type": "Person",
      name: article.author.name,
      jobTitle: article.author.role
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: origin,
      logo: { "@type": "ImageObject", url: new URL("/apple-icon", origin).href }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl
    }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: origin },
      { "@type": "ListItem", position: 2, name: "Tech Buzz", item: new URL("/tech-buzz", origin).href },
      { "@type": "ListItem", position: 3, name: article.title, item: pageUrl }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, breadcrumbSchema]).replace(/</g, "\\u003c") }}
      />
      <TechBuzzArticleView article={article} />
    </>
  );
}
