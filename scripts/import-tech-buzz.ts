/**
 * Writes Tech Buzz stories from the best community posts on dev.to, Medium, daily.dev and Indie Hackers
 * (lib/server/tech-buzz-imports.ts): only posts rated 4.5 stars or more (--min-stars to change), rewritten from official
 * documentation into a fresh lesson with its own thumbnail, and published only when that lesson's own review reaches
 * the same bar. Each story is tagged with the learning path it serves (lib/tech-buzz-paths.ts).
 * Re-running skips posts already imported.
 *
 *   npm run tech-buzz:import -- --dry-run                       # review candidates, write nothing
 *   npm run tech-buzz:import -- --platforms devto,medium --per 2
 *   npm run tech-buzz:import                                    # 3 stories per platform, 4.5 stars and above
 */
import { IMPORT_PLATFORMS, importTechBuzzStories, type ImportPlatform } from "../lib/server/tech-buzz-imports";

const option = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };

async function main() {
  const platforms = (option("platforms")?.split(",") ?? IMPORT_PLATFORMS).filter((value): value is ImportPlatform => IMPORT_PLATFORMS.includes(value as ImportPlatform));
  const written = await importTechBuzzStories({
    platforms, perPlatform: Number(option("per") ?? 3), maxReviewed: Number(option("review") ?? 20), minStars: Number(option("min-stars") ?? 4.5), dryRun: process.argv.includes("--dry-run"),
    log: entry => console.log(`${entry.platform.padEnd(12)} ${entry.stars === undefined ? "   " : entry.stars.toFixed(1)}  ${(entry.track ?? "").padEnd(13)} ${entry.title.slice(0, 70).padEnd(70)}  ${entry.result}`),
  });
  console.log(`\n${written.length} stories written${written.length ? `:\n${written.map(slug => `  /tech-buzz/${slug}`).join("\n")}` : ""}`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
