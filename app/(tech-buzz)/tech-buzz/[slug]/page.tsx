import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/seo";
import { getPublishedTechBuzzArticle, listPublishedTechBuzzArticles, withUnsplashCovers } from "@/lib/server/tech-buzz-storage";
import { TechBuzzArticleView } from "@/components/tech-buzz-article-view";
import { isTechnologyStory, techIdOf, toCard, toPreview } from "@/lib/tech-buzz-public";

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
      title: "Story not found | Tech Buzz",
      description: "The requested Tech Buzz article could not be located."
    };
  }

  const canonicalUrl = `/tech-buzz/${article.slug}`;

  return {
    title: `${article.title} | Tech Buzz`,
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
      alternateLocale: ["hi_IN"],
      // The card comes from ./opengraph-image.tsx (and ./twitter-image.tsx); Next serves them at hashed URLs.
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | Tech Buzz`,
      description: article.subtitle
    }
  };
}

export default async function TechBuzzArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getPublishedTechBuzzArticle(slug);

  if (!article) {
    notFound();
  }

  // Related stories (same technology, then same category, then the rest) and the neighbours in the feed, as light
  // cards: the browser never receives another story's body.
  const stories = (await listPublishedTechBuzzArticles()).filter(isTechnologyStory);
  const index = stories.findIndex(story => story.id === article.id);
  const rank = (story: (typeof stories)[number]) => (story.technology === article.technology ? 0 : story.category === article.category ? 1 : 2);
  const related = await withUnsplashCovers(stories.filter(story => story.id !== article.id).sort((a, b) => rank(a) - rank(b)).slice(0, 9).map(toCard));
  const prevStory = index > 0 ? toCard(stories[index - 1]) : null;
  const nextStory = index >= 0 && index < stories.length - 1 ? toCard(stories[index + 1]) : null;
  const [preview] = await withUnsplashCovers([{ ...toPreview(article), techId: techIdOf(article) }]);

  const origin = siteUrl().href;
  const pageUrl = new URL(`/tech-buzz/${article.slug}`, origin).href;
  const image = preview.photoCredit ? `${preview.coverImage}&w=1200&q=80&auto=format&fit=crop` : new URL(preview.coverImage, origin).href;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.subtitle,
    image: [image],
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
      logo: { "@type": "ImageObject", url: new URL("/brand/masterclass-mark-512.png", origin).href, width: 512, height: 512 }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl
    },
    // Member-only beyond the preview: tells Google the gated part is a paywall, not cloaking.
    isAccessibleForFree: false,
    hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: ".paywalled-story" }
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
      <TechBuzzArticleView article={preview} related={related} prevStory={prevStory} nextStory={nextStory} />
    </>
  );
}
