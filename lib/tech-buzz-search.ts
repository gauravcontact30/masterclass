/** The story search shared by the Tech Buzz header's live results and the feed, so both find the same stories. */
export type TechBuzzSearchStory = { slug: string; title: string; subtitle: string; technology: string; category: string; author: string; tags: string[]; minutes: number };

/** Every word must appear in one of the fields, so "docker image" finds a story that says both, in any order. */
export function matchesStorySearch(query: string, fields: readonly string[]) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = fields.join(" ").toLowerCase();
  return words.every(word => text.includes(word));
}

/** Best matches first: a word in the title counts for more than one only in the tags or the subtitle. */
export function searchStories(stories: readonly TechBuzzSearchStory[], query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const score = (story: TechBuzzSearchStory) => words.filter(word => story.title.toLowerCase().includes(word)).length * 2 + words.filter(word => story.technology.toLowerCase().includes(word)).length;
  return stories
    .filter(story => matchesStorySearch(query, [story.title, story.subtitle, story.technology, story.category, story.author, ...story.tags]))
    .map(story => ({ story, rank: score(story) }))
    .sort((a, b) => b.rank - a.rank)
    .map(({ story }) => story);
}
