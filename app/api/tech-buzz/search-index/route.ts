import { connection } from "next/server";
import { listPublishedTechBuzzSummaries } from "@/lib/server/tech-buzz-storage";
import { isTechnologyStory, toCard } from "@/lib/tech-buzz-public";
import type { TechBuzzSearchStory } from "@/lib/tech-buzz-search";

/**
 * What the Tech Buzz header searches: the same stories as the feed, with the card fields it matches on and no bodies.
 * Fetched the first time a reader focuses the search box.
 */
export async function GET() {
  await connection();
  try {
    const stories: TechBuzzSearchStory[] = (await listPublishedTechBuzzSummaries()).filter(isTechnologyStory).map(toCard).map(card => ({
      slug: card.slug, title: card.title, subtitle: card.subtitle, technology: card.technology, category: card.category, author: card.author.name, tags: card.tags, minutes: card.readTimeMinutes,
    }));
    return Response.json({ stories }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600" } });
  } catch (error) {
    console.error("Tech Buzz search index error:", error);
    return Response.json({ error: "Failed to load stories" }, { status: 500 });
  }
}
