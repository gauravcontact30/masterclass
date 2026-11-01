/**
 * A Tech Buzz story as the landing sections link to it (lib/server/landing-buzz.ts): no body, no preview text. The card
 * fields (subtitle, cover, reader signals, the reviewer's stars) are the ones toCard already sends to every visitor.
 */
export type LandingBuzz = {
  slug: string; title: string; topic: string; techId: string | null; technology: string; minutes: number; publishedAt: string; tags: string[];
  logo?: string | null; subtitle?: string; cover?: string; likes?: number; dislikes?: number; claps?: number;
  rating?: { average: number; count: number }; stars?: number | null;
};

/**
 * The stories most related to a set of keywords (technology names, identifiers), newest first among equals; with no
 * match the newest stories stand in, so a section always has something fresh to offer.
 */
export function relatedBuzz(stories: LandingBuzz[], keywords: string[], count = 3): { stories: LandingBuzz[]; matched: boolean } {
  const words = keywords.map(word => word.toLowerCase().trim()).filter(word => word.length > 1);
  const scored = stories.map((story, index) => {
    const haystack = `${story.title} ${story.topic} ${story.technology} ${story.techId ?? ""} ${story.tags.join(" ")}`.toLowerCase();
    return { story, index, score: words.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0) };
  });
  const hits = scored.filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).map(item => item.story);
  return hits.length ? { stories: hits.slice(0, count), matched: true } : { stories: stories.slice(0, count), matched: false };
}
