import { cacheLife, cacheTag } from "next/cache";
import { INDIA_ONLY_PAGES, PUBLIC_PAGES, siteDescription, siteName, siteUrl } from "@/lib/seo";
import { COMPARISONS } from "@/lib/comparisons";
import { TECH_BUZZ_TAG, listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { handbooks, interviewTechs, workflows } from "@/lib/public-learning";
import { ADDRESS_LINE, SOCIAL_PROFILES, SUPPORT } from "@/lib/site-contact";
import { BOARD_FAQ, CATEGORIES, COMPETITIVE_FAQ } from "@/lib/landing-categories";
import { QUALITY_NAME, playlist, playlistQuality, techInfo, techsIn } from "@/lib/streams";

/*
 * /llms.txt (llmstxt.org): a plain-Markdown map of the site for AI assistants and answer engines, read from the same
 * catalogues as app/sitemap.ts so the two never disagree. Lists the public sections and the newest Tech Buzz stories;
 * the signed-in Learning Dashboard is left out because crawlers cannot read it. Cached for a day; publishing a Tech
 * Buzz story expires the tag, so the morning's stories appear the day they go live.
 */
async function body() {
  "use cache";
  cacheLife("days");
  cacheTag(TECH_BUZZ_TAG);
  const origin = siteUrl();
  const link = (title: string, path: string, note?: string) => `- [${title}](${new URL(path, origin).href})${note ? `: ${note}` : ""}`;
  const stories = (await listPublishedTechBuzzArticles())
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 25);
  const pages = PUBLIC_PAGES.filter(page => page.path !== "/" && !INDIA_ONLY_PAGES.has(page.path));
  return [
    `# ${siteName}`,
    "",
    `> ${siteDescription}`,
    "",
    "MasterClass Buddy is an online learning platform covering Tech (for software engineers and college students), Board Exams (Class 10 and 12: UP Board, CBSE, ICSE / ISC), Competitive Exams (NDA, SSC, banks, railways, UPSC, state PSC and more), TET (CTET, UPTET and state Teacher Eligibility Tests) and IELTS preparation (Academic and General Training), in English and Hindi. For Tech it offers weekly technology blogs (Tech Buzz, five every Monday), interview questions with model answers, system design and AI agent workflow blueprints, technology handbooks, side-by-side comparisons and an API reference. The pages below are free to read; courses, certifications and practice tests live in the signed-in Learning Dashboard.",
    "",
    "## Categories",
    ...CATEGORIES.map(category => link(category.title, category.id === "tech" ? "/" : `/#${category.anchor}`, `${category.audience}. ${category.summary}`)),
    "",
    "## Board Exams: frequently asked questions",
    ...BOARD_FAQ.flatMap(item => [`### ${item.question}`, item.answer, ""]),
    "## Competitive Exams: frequently asked questions",
    ...COMPETITIVE_FAQ.flatMap(item => [`### ${item.question}`, item.answer, ""]),
    "## Main pages",
    ...pages.map(page => link(page.label, page.path, page.description)),
    "",
    "## Interview questions with answers",
    link("All technologies", "/interview-questions", "most-asked subjective and objective questions with model answers"),
    ...interviewTechs().map(tech => link(`${tech.title} interview questions`, `/interview-questions/${tech.id}`)),
    "",
    "## System design and AI agent workflow blueprints",
    link("All blueprints", "/workflows", "step-by-step designs with diagrams, tech stack, design decisions and interview questions"),
    ...workflows().filter(item => !item.dashboardOnly).map(item => link(item.title, `/workflows/${item.id}`, item.summary)),
    "",
    // MCB Streams: the playlists shown to everyone that have steps (exam playlists are shown by region, so not here).
    "## MCB Streams: step-by-step video playlists in Full HD and 4K",
    link("All playlists", "/streams", "every step has study notes beside the video; the first step of every course is free"),
    ...techsIn(["tech", "ielts"]).map(id => link(techInfo(id).playlist, `/streams?playlist=${id}`, `${techInfo(id).tagline} ${playlist(id).steps.length} steps, up to ${QUALITY_NAME[playlistQuality(id)]}.`)),
    "",
    "## Technology comparisons",
    ...COMPARISONS.map(item => link(item.question, `/compare/${item.id}`)),
    "",
    "## Technology handbooks and reference",
    link("Handbooks", "/learn"),
    link("API reference for 60 technologies", "/api-reference"),
    link("English vocabulary with meanings and examples", "/vocabulary"),
    `- ${handbooks().length} handbooks, listed in full at ${new URL("/learn", origin).href}`,
    "",
    "## Latest Tech Buzz stories",
    ...stories.map(story => link(story.title, `/tech-buzz/${story.slug}`, story.subtitle)),
    "",
    "## Contact",
    `- Support email: ${SUPPORT.email}`,
    `- Support phone: ${SUPPORT.phone}`,
    `- Address: ${ADDRESS_LINE}`,
    ...SOCIAL_PROFILES.map(item => `- [${item.platform}](${item.href})`),
    link("Contact page", "/contact"),
    "",
    "## Optional",
    link("Full text for AI assistants", "/llms-full.txt", "Tech Buzz key takeaways, comparison summaries and top interview answers in one file"),
    link("Sitemap", "/sitemap.xml"),
    "",
  ].join("\n");
}

export async function GET() {
  return new Response(await body(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
