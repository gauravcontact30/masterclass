import { cacheLife, cacheTag } from "next/cache";
import { PUBLIC_PAGES, siteDescription, siteName, siteUrl } from "@/lib/seo";
import { COMPARISONS } from "@/lib/comparisons";
import { TECH_BUZZ_TAG, listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";
import { handbooks, interviewTechs, workflows } from "@/lib/public-learning";
import { ADDRESS_LINE, SOCIAL_PROFILES, SUPPORT } from "@/lib/site-contact";

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
  const pages = PUBLIC_PAGES.filter(page => page.path !== "/");
  return [
    `# ${siteName}`,
    "",
    `> ${siteDescription}`,
    "",
    "MasterClass Buddy is an online learning platform for software engineers and students: daily technology blogs, interview questions with model answers, system design and AI agent workflow blueprints, technology handbooks, side-by-side comparisons and an API reference. The pages below are free to read; courses, certifications and practice tests live in the signed-in Learning Dashboard.",
    "",
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
    "## Technology comparisons",
    ...COMPARISONS.map(item => link(item.question, `/compare/${item.id}`)),
    "",
    "## Technology handbooks and reference",
    link("Handbooks", "/learn"),
    link("API reference for 60 technologies", "/api-reference"),
    link("English vocabulary with Hindi meanings", "/vocabulary"),
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
    link("Sitemap", "/sitemap.xml"),
    "",
  ].join("\n");
}

export async function GET() {
  return new Response(await body(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
