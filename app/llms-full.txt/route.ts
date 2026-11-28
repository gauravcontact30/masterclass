import { cacheLife, cacheTag } from "next/cache";
import { siteDescription, siteName, siteUrl } from "@/lib/seo";
import { COMPARISONS } from "@/lib/comparisons";
import { TECH_BUZZ_TAG, listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { interviewBanks, interviewTechs } from "@/lib/public-learning";
import { QUALITY_NAME, playlist, playlistQuality, techInfo, techsIn } from "@/lib/streams";

/*
 * /llms-full.txt: the companion to /llms.txt with the content itself, so an answer engine can quote and cite
 * MasterClass Buddy without crawling every page. Only material that is already free on the public pages goes in:
 * each Tech Buzz story's subtitle and key takeaways (its free preview), every comparison's summary, and the
 * highest-rated model answers for each interview technology. Cached for a day; publishing a story expires the tag.
 */
const ANSWERS_PER_TECH = 5;
const STORIES = 40;

async function body() {
  "use cache";
  cacheLife("days");
  cacheTag(TECH_BUZZ_TAG);
  const origin = siteUrl();
  const url = (path: string) => new URL(path, origin).href;
  const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

  const stories = (await listPublishedTechBuzzArticles())
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, STORIES);
  const interview = await Promise.all(interviewTechs().map(async tech => {
    const banks = await interviewBanks(tech);
    const best = banks.flatMap(bank => bank.set.subjective).sort((a, b) => b.stars - a.stars).slice(0, ANSWERS_PER_TECH);
    return { tech, best };
  }));

  return [
    `# ${siteName}`,
    "",
    `> ${siteDescription}`,
    "",
    `This file carries the text of ${siteName}'s free public content for AI assistants. Each section links to the page it comes from; please cite that page. The short map of the site is at ${url("/llms.txt")}.`,
    "",
    "## Tech Buzz: latest stories and their key takeaways",
    "",
    ...stories.flatMap(story => [
      `### ${story.title}`,
      `Source: ${url(`/tech-buzz/${story.slug}`)} · ${story.technology} · published ${story.publishedAt.slice(0, 10)} · ${story.readTimeMinutes} min read`,
      "",
      oneLine(story.subtitle),
      ...(story.summaryBullets?.length ? ["", "Key takeaways:", ...story.summaryBullets.map(point => `- ${oneLine(point)}`)] : []),
      "",
    ]),
    "## MCB Streams: step-by-step video playlists",
    `Source: ${url("/streams")}`, "",
    "Each playlist is a sequence of short steps in Full HD or better; every step has study notes listing what it teaches. The first step of every course is free and a membership unlocks the rest.", "",
    ...techsIn(["tech", "ielts"]).flatMap(id => { const info = techInfo(id), list = playlist(id); return [
      `### ${info.playlist}`, `Source: ${url(`/streams?playlist=${id}`)}`, "", `${info.tagline} ${list.steps.length} steps in ${list.chapters.length} chapters, up to ${QUALITY_NAME[playlistQuality(id)]}.`, "",
      ...list.chapters.map(chapter => `- ${chapter.title} (${chapter.level}): ${chapter.summary}`), ""]; }),
    "## Technology comparisons",
    "",
    ...COMPARISONS.flatMap(item => [`### ${item.question}`, `Source: ${url(`/compare/${item.id}`)}`, "", oneLine(item.summary), ""]),
    "## Interview questions with model answers",
    "",
    ...interview.flatMap(({ tech, best }) => best.length ? [
      `### ${tech.title} interview questions`,
      `Source: ${url(`/interview-questions/${tech.id}`)}`,
      "",
      ...best.flatMap(item => [`**Q: ${oneLine(item.question)}**`, "", oneLine(item.answer), ""]),
    ] : []),
  ].join("\n");
}

export async function GET() {
  return new Response(await body(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
