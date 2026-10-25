import { Suspense } from "react";
import { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/seo";
import { TechBuzzFeed } from "@/components/tech-buzz-feed";
import { listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";

/**
 * The published articles, cached on the server, so the feed renders them without a client round trip, plus an
 * ItemList of their URLs so crawlers find every article from this hub.
 */
async function Feed() {
  const articles = await listPublishedTechBuzzArticles();
  const origin = siteUrl().href;
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tech Buzz articles",
    numberOfItems: articles.length,
    itemListElement: articles.slice(0, 50).map((article, index) => ({ "@type": "ListItem", position: index + 1, url: new URL(`/tech-buzz/${article.slug}`, origin).href, name: article.title }))
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />
    <TechBuzzFeed initialArticles={articles} />
  </>;
}

export const metadata: Metadata = {
  title: "Tech Buzz — Medium-Style Technology Blogs & Community Ratings | MasterClass",
  description: "Explore community-rated deep dives into the most popular technologies shaping the industry: Agentic AI, Model Context Protocol, Next.js 15, TypeScript 5.8, Rust, and PostgreSQL 17.",
  keywords: [
    "Tech Buzz",
    "Medium tech blogs",
    "technology blogs with star ratings",
    "Agentic AI",
    "Model Context Protocol MCP",
    "Next.js 15 React 19",
    "TypeScript 5.8",
    "Rust microservices",
    "PostgreSQL 17 vector search",
    "AWS Bedrock cloud architecture",
    "eBPF runtime security",
    "Kubernetes platform engineering"
  ],
  alternates: { canonical: "/tech-buzz" },
  openGraph: {
    type: "website",
    url: "/tech-buzz",
    siteName,
    title: "Tech Buzz — Master Class Buddy Blogs | Developer-Rated Engineering Deep Dives",
    description: "Explore community-rated deep dives into the most popular technologies: Agentic AI, MCP, Next.js 15, TypeScript 5.8, Rust, and PostgreSQL 17.",
    locale: "en_IN",
    alternateLocale: ["hi_IN", "es_ES", "ja_JP", "de_DE", "fr_FR", "zh_CN"],
    images: [{ url: "/tech-buzz/opengraph-image", width: 1200, height: 630, alt: "Tech Buzz — Master Class Buddy Blogs" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Buzz — Master Class Buddy Blogs | Developer-Rated Engineering Deep Dives",
    description: "Explore community-rated deep dives into the most popular technologies: Agentic AI, MCP, Next.js 15, TypeScript 5.8, Rust, and PostgreSQL 17.",
    images: ["/tech-buzz/opengraph-image"]
  }
};

export default function TechBuzzPage() {
  const origin = siteUrl().href;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: origin
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tech Buzz",
        item: new URL("/tech-buzz", origin).href
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }}
      />
      <Suspense fallback={null}>
        <Feed />
      </Suspense>
    </>
  );
}
