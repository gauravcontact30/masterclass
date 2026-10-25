import { Suspense } from "react";
import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/seo";
import { TechBuzzBlog, type TechBuzzTopic } from "@/components/tech-buzz-blog";
import { listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { communityPosts } from "@/lib/server/community-feed";
import { isTechnologyStory, toCard, topicLabel } from "@/lib/tech-buzz-public";

const DESCRIPTION = "Reader-rated technology blogs on Next.js 16, React 19, TypeScript, LangChain, LangGraph, AI agents, Node.js, Python, Docker, AWS, testing and system design, plus fresh developer community headlines.";

/**
 * Stories as light cards (bodies stay behind the member paywall), technology topics with their story counts, and
 * community headlines, all rendered on the server so the HTML carries every story link; an ItemList lists them too.
 */
async function Blog() {
  const [articles, community] = await Promise.all([listPublishedTechBuzzArticles(), communityPosts().catch(() => [])]);
  const cards = articles.filter(isTechnologyStory).map(toCard);
  const counts = new Map<string, TechBuzzTopic>();
  for (const card of cards) {
    const id = card.techId ?? card.category;
    const topic = counts.get(id) ?? { id, label: topicLabel(card), count: 0 };
    topic.count += 1;
    counts.set(id, topic);
  }
  const topics = [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const origin = siteUrl().href;
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tech Buzz technology stories",
    numberOfItems: cards.length,
    itemListElement: cards.map((card, index) => ({ "@type": "ListItem", position: index + 1, url: new URL(`/tech-buzz/${card.slug}`, origin).href, name: card.title }))
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />
    <TechBuzzBlog cards={cards} topics={topics} community={community} />
  </>;
}

export const metadata: Metadata = {
  title: "Tech Buzz: Technology Blogs Rated by Developers",
  description: DESCRIPTION,
  keywords: [
    "technology blogs", "developer blog India", "Next.js 16 blog", "React 19 tutorial", "TypeScript guide", "LangChain tutorial",
    "LangGraph agents", "AI agents blog", "Node.js best practices", "Python backend", "Docker best practices", "AWS for developers",
    "Playwright testing", "system design interview", "DSA patterns", "Zustand vs Redux", "TanStack Query", "n8n automation"
  ],
  alternates: { canonical: "/tech-buzz" },
  openGraph: {
    type: "website",
    url: "/tech-buzz",
    siteName,
    title: "Tech Buzz: Technology Blogs Rated by Developers",
    description: DESCRIPTION,
    locale: "en_IN",
    images: [{ url: "/tech-buzz/opengraph-image", width: 1200, height: 630, alt: "Tech Buzz by MasterClass Buddy" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Buzz: Technology Blogs Rated by Developers",
    description: DESCRIPTION,
    images: ["/tech-buzz/opengraph-image"]
  }
};

export default function TechBuzzPage() {
  const origin = siteUrl().href;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: "Tech Buzz", item: new URL("/tech-buzz", origin).href }
      ]
    },
    { "@context": "https://schema.org", "@type": "Blog", name: "Tech Buzz", url: new URL("/tech-buzz", origin).href, description: DESCRIPTION, inLanguage: "en", publisher: { "@type": "Organization", name: siteName, url: origin } }
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <Suspense fallback={<div style={{ minHeight: "100vh" }} aria-busy="true" />}>
        <Blog />
      </Suspense>
    </>
  );
}
