/**
 * Writes the researched story for each "Community favourites" topic on /tech-buzz (lib/tech-buzz-favourites.ts)
 * that does not have one yet: official-documentation research, the editor's review (published only at 4/5 or
 * above) and a painted cover, tagged `fav:<id>`. Re-running only fills the topics still missing.
 *
 *   npm run tech-buzz:favourites -- --dry-run          # list the topics that would be written
 *   npm run tech-buzz:favourites -- --only claude-code # one topic
 *   npm run tech-buzz:favourites                       # every missing topic
 */
import { FAVOURITE_TOPICS, favouriteTag } from "../lib/tech-buzz-favourites";
import { writeFavouriteStory } from "../lib/server/tech-buzz-daily";
import { listTechBuzzArticles } from "../lib/server/tech-buzz-storage";

const option = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };

async function main() {
  const stories = await listTechBuzzArticles(false);
  const only = option("only");
  const todo = FAVOURITE_TOPICS.filter(topic => (!only || topic.id === only) && !stories.some(story => story.tags.includes(favouriteTag(topic.id))));
  console.log(`${todo.length} topics to write: ${todo.map(topic => topic.id).join(", ") || "none"}`);
  if (process.argv.includes("--dry-run")) return;
  // Two at a time: each makes a Perplexity call, up to four model calls and two pictures.
  for (let i = 0; i < todo.length; i += 2) {
    await Promise.all(todo.slice(i, i + 2).map(async topic => {
      try {
        const story = await writeFavouriteStory(topic);
        console.log(`✓ ${topic.id}  ${story.source.editorScore?.toFixed(1)}/5  /tech-buzz/${story.slug}`);
      } catch (error) {
        console.log(`✗ ${topic.id}  ${String(error instanceof Error ? error.message : error).slice(0, 160)}`);
      }
    }));
  }
}
void main();
