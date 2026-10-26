import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/seo";
import { TechBuzzBlog, type TechBuzzGroup } from "@/components/tech-buzz-blog";
import { listPublishedTechBuzzArticles, withUnsplashCovers } from "@/lib/server/tech-buzz-storage";
import { isTechnologyStory, toCard, topicLabel } from "@/lib/tech-buzz-public";

// Renders only once its content is ready: no loading screen is ever shown in its place (no loading.tsx, no fallback).
export const instant = false;

const DESCRIPTION = "Reader-rated technology blogs and engineering masterclasses on Agentic AI, LangChain, LangGraph, LangSmith, LangFlow, n8n, Next.js 16+, React 19+, System Design, TypeScript, and Cloud Architecture.";

/**
 * Stories as light cards (bodies stay behind the member paywall) and technology topics with their story counts,
 * rendered on the server so the HTML carries every story link; an ItemList lists them too.
 */
async function Blog() {
  const articles = await listPublishedTechBuzzArticles();
  const cards = await withUnsplashCovers(articles.filter(isTechnologyStory).map(toCard));
  // Categories (largest first), each with the technologies written about in it.
  const byCategory = new Map<string, TechBuzzGroup>();
  for (const card of cards) {
    const group = byCategory.get(card.category) ?? { category: card.category, count: 0, topics: [] };
    group.count += 1;
    if (card.techId) {
      let topic = group.topics.find(item => item.id === card.techId);
      if (!topic) group.topics.push(topic = { id: card.techId, label: topicLabel(card), count: 0 });
      topic.count += 1;
    }
    byCategory.set(card.category, group);
  }
  const groups = [...byCategory.values()].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
    .map(group => ({ ...group, topics: group.topics.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)) }));
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
    <TechBuzzBlog cards={cards} groups={groups} showcase />
  </>;
}

export const metadata: Metadata = {
  title: "Tech Buzz: Technology Blogs Rated by Developers",
  description: DESCRIPTION,
  keywords: [
    "technology blogs", "developer blog India", "Agentic AI tutorial", "LangChain tutorial", "LangGraph agents",
    "LangSmith evals", "LangFlow visual", "n8n automation", "Next.js 16 blog", "React 19 tutorial", "System Design interview",
    "TypeScript guide", "Node.js best practices", "Python backend", "Docker best practices", "AWS for developers",
    "Playwright testing", "DSA patterns", "Zustand vs Redux", "TanStack Query", "PostgreSQL 17 vector"
  ],
  alternates: { canonical: "/tech-buzz" },
  openGraph: {
    type: "website",
    url: "/tech-buzz",
    siteName,
    title: "Tech Buzz: Technology Blogs Rated by Developers",
    description: DESCRIPTION,
    locale: "en_IN"
    // The card comes from ./opengraph-image.tsx; Next serves it at a hashed URL, so it is never named here.
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Buzz: Technology Blogs Rated by Developers",
    description: DESCRIPTION
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
      <Blog />
    </>
  );
}
