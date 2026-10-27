/**
 * Rewrites stored Tech Buzz stories with the daily edition's pipeline: research from the track's official
 * documentation, numbered steps and bullet points, and the editor's review (published only at 4/5 or above).
 * Slugs, titles, pictures, claps and reader ratings are kept.
 *
 *   npm run tech-buzz:refine -- --dry-run                 # rewrite and score, write nothing
 *   npm run tech-buzz:refine -- --slug <slug>             # one story
 *   npm run tech-buzz:refine -- --limit 5                 # the 5 newest published stories
 */
import { refineTechBuzzStory } from "../lib/server/tech-buzz-daily";
import { listPublishedTechBuzzArticles } from "../lib/server/tech-buzz-storage";

const option = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const one = option("slug");
  const slugs = one ? [one] : (await listPublishedTechBuzzArticles())
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, Number(option("limit") ?? 1000)).map(story => story.slug);
  console.log(`${dryRun ? "Dry run: " : ""}${slugs.length} stories`);
  // Two at a time: each one makes a Perplexity call and up to four model calls.
  for (let i = 0; i < slugs.length; i += 2) {
    await Promise.all(slugs.slice(i, i + 2).map(async slug => {
      try {
        const result = await refineTechBuzzStory(slug, { dryRun });
        console.log(`✓ ${result.score.toFixed(1)}/5  sources=${result.sources}  ${slug}`);
      } catch (error) {
        console.log(`✗ ${String(error instanceof Error ? error.message : error).slice(0, 160)}  ${slug}`);
      }
    }));
  }
}
void main();
