import { istWeek, weekStartDate } from "./ist-week";
import { DAILY_TRACKS, TECH_BUZZ_TRACKED, dailyDateTag, dailyTrackTag } from "./tech-buzz-sections";
import { FAVOURITE_TOPICS, topicsOf } from "./tech-buzz-favourites";

/*
 * The Super Admin "Tech-Buzz - Blogs" report (app/api/super-admin/tech-buzz/analytics): every /tech-buzz page from
 * site_visits, every click from the visit tracker's site_interaction events (which carry the named section,
 * TECH_BUZZ_TRACKED), and every story's own counters. Bots are excluded upstream; 0-second visits never exist
 * (lib/server/zero-engagement.ts).
 */
export type BuzzVisit = { created_at: string; event: string; visitor_id: string; session_id: string; user_id: string | null; path: string; title: string | null;
  referrer_host: string | null; utm_source: string | null; device: string | null; country: string | null; duration_ms: number | null; new_visitor: boolean | null };
export type BuzzClick = { created_at: string; actor_id: string | null; resource: string; details: { visitor_id?: string; topic?: string | null; option?: string | null; target_path?: string | null } | null };
export type BuzzStory = { slug: string; title: string; technology: string; tags: string[]; publishedAt: string; likes: number; dislikes: number; claps: number;
  rating: { average: number; count: number }; commentsCount: number; editorScore?: number; color: string };

export type Tally = { label: string; count: number };
export type BuzzPage = { path: string; kind: "hub" | "story"; title: string; views: number; visitors: number; avgReadMs: number | null; clicks: number;
  likes: number; dislikes: number; claps: number; rating: number; ratingCount: number; editorScore: number | null; comments: number; publishedAt: string | null; daily: string | null; topics: string[] };
export type BuzzSection = { section: string; where: "hub" | "story" | "other"; clicks: number; clickers: number; opens: number; top: Tally[] };
export type TechBuzzReport = {
  days: number; generatedAt: string;
  totals: { views: number; visitors: number; sessions: number; signedIn: number; newVisitors: number; avgReadMs: number | null; hubViews: number; storyViews: number;
    storiesRead: number; clicks: number; clickers: number; opens: number; openRate: number | null; paywallClicks: number };
  content: { published: number; publishedInWindow: number; likes: number; dislikes: number; claps: number; comments: number; avgRating: number | null; rated: number; avgEditor: number | null };
  trend: { date: string; views: number; visitors: number; clicks: number }[];
  sections: BuzzSection[];
  pages: BuzzPage[];
  daily: { date: string; tracks: { id: string; label: string; color: string; slug: string | null; title?: string; editorScore?: number | null; views?: number }[] }[];
  topics: { id: string; label: string; color: string; stories: number; views: number; likes: number }[];
  sources: Tally[]; devices: Tally[]; countries: Tally[];
};

const HUB = "/tech-buzz";
const istDay = (iso: string) => new Date(Date.parse(iso) + 19_800_000).toISOString().slice(0, 10);
const tally = (values: (string | null | undefined)[], limit = 8): Tally[] => {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, count]) => ({ label, count }));
};
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const storyPath = (path: string) => path.startsWith(`${HUB}/`) ? path.replace(/\/+$/, "") : null;
const HUB_SECTIONS = new Set<string>([TECH_BUZZ_TRACKED.daily, TECH_BUZZ_TRACKED.fresh, TECH_BUZZ_TRACKED.stars, TECH_BUZZ_TRACKED.favourites, TECH_BUZZ_TRACKED.n8n,
  TECH_BUZZ_TRACKED.technologies, TECH_BUZZ_TRACKED.tracks, TECH_BUZZ_TRACKED.roadmaps, TECH_BUZZ_TRACKED.topics, TECH_BUZZ_TRACKED.featured,
  TECH_BUZZ_TRACKED.categories, TECH_BUZZ_TRACKED.feed, TECH_BUZZ_TRACKED.highlights]);
const ORDER = Object.values(TECH_BUZZ_TRACKED) as string[];

export function techBuzzReport({ days, visits, clicks, stories, now = Date.now() }: { days: number; visits: BuzzVisit[]; clicks: BuzzClick[]; stories: BuzzStory[]; now?: number }): TechBuzzReport {
  const since = now - days * 86_400_000;
  const views = visits.filter(row => row.event === "page_view");
  const leaves = visits.filter(row => row.event === "page_leave" && (row.duration_ms ?? 0) >= 1000);
  const visitors = (rows: BuzzVisit[]) => new Set(rows.map(row => row.user_id ?? row.visitor_id)).size;
  const readMs = (rows: BuzzVisit[]) => average(rows.map(row => row.duration_ms!));
  const opens = clicks.filter(click => click.resource === HUB && click.details?.target_path?.startsWith(`${HUB}/`));
  const hubViews = views.filter(row => row.path === HUB).length;
  const bySlug = new Map(stories.map(story => [`${HUB}/${story.slug}`, story]));

  // Every page that was read or exists: the hub, each story with traffic, and every published story (zeros included).
  const paths = new Set<string>([HUB, ...views.map(row => storyPath(row.path)).filter((path): path is string => !!path), ...bySlug.keys()]);
  const pages: BuzzPage[] = [...paths].map((path): BuzzPage => {
    const pageViews = views.filter(row => (storyPath(row.path) ?? row.path) === path);
    const pageLeaves = leaves.filter(row => (storyPath(row.path) ?? row.path) === path);
    const story = bySlug.get(path);
    const dailyTag = story?.tags.find(tag => tag.startsWith("daily-track:"));
    return {
      path, kind: path === HUB ? "hub" : "story", title: story?.title ?? pageViews.find(row => row.title)?.title ?? (path === HUB ? "Tech Buzz home" : path),
      views: pageViews.length, visitors: visitors(pageViews), avgReadMs: readMs(pageLeaves), clicks: clicks.filter(click => click.resource === path).length,
      likes: story?.likes ?? 0, dislikes: story?.dislikes ?? 0, claps: story?.claps ?? 0, rating: story?.rating.count ? story.rating.average : 0, ratingCount: story?.rating.count ?? 0,
      editorScore: story?.editorScore ?? null, comments: story?.commentsCount ?? 0, publishedAt: story?.publishedAt ?? null,
      daily: dailyTag ? DAILY_TRACKS.find(track => dailyTrackTag(track.id) === dailyTag)?.short ?? null : null,
      topics: story ? topicsOf(story) : [],
    };
  }).sort((a, b) => (b.kind === "hub" ? 1 : 0) - (a.kind === "hub" ? 1 : 0) || b.views - a.views || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

  const sectionNames = [...new Set(clicks.map(click => click.details?.topic?.trim() || "Other"))];
  const sections: BuzzSection[] = sectionNames.map((section): BuzzSection => {
    const items = clicks.filter(click => (click.details?.topic?.trim() || "Other") === section);
    const onHub = items.filter(click => click.resource === HUB).length;
    return {
      section, where: HUB_SECTIONS.has(section) ? "hub" : ORDER.includes(section) ? "story" : onHub > items.length / 2 ? "hub" : "other",
      clicks: items.length, clickers: new Set(items.map(click => click.actor_id ?? click.details?.visitor_id).filter(Boolean)).size,
      opens: items.filter(click => click.details?.target_path?.startsWith(`${HUB}/`)).length, top: tally(items.map(click => click.details?.option), 5),
    };
  }).sort((a, b) => {
    const rank = (name: string) => { const index = ORDER.indexOf(name); return index < 0 ? ORDER.length : index; };
    return b.clicks - a.clicks || rank(a.section) - rank(b.section);
  });

  const trendDays = Math.min(days, 30);
  const trend = Array.from({ length: trendDays }, (_, i) => istDay(new Date(now - (trendDays - 1 - i) * 86_400_000).toISOString())).map(date => {
    const dayViews = views.filter(row => istDay(row.created_at) === date);
    return { date, views: dayViews.length, visitors: visitors(dayViews), clicks: clicks.filter(click => istDay(click.created_at) === date).length };
  });

  // The edition board: the last seven weekly editions (Monday dates, lib/ist-week.ts), newest first.
  const daily = Array.from({ length: 7 }, (_, i) => weekStartDate(istWeek(now) - i)).map(date => ({
    date, tracks: DAILY_TRACKS.map(track => {
      const story = stories.find(item => item.tags.includes(dailyDateTag(date)) && item.tags.includes(dailyTrackTag(track.id)));
      const page = story && pages.find(item => item.path === `${HUB}/${story.slug}`);
      return { id: track.id, label: track.short, color: track.color, slug: story?.slug ?? null, title: story?.title, editorScore: story?.editorScore ?? null, views: page?.views ?? 0 };
    }),
  }));

  const rated = stories.filter(story => story.rating.count > 0);
  const scored = stories.map(story => story.editorScore).filter((score): score is number => typeof score === "number");
  const storyViews = views.filter(row => storyPath(row.path));
  return {
    days, generatedAt: new Date(now).toISOString(),
    totals: {
      views: views.length, visitors: visitors(views), sessions: new Set(views.map(row => row.session_id)).size, signedIn: new Set(views.map(row => row.user_id).filter(Boolean)).size,
      newVisitors: new Set(views.filter(row => row.new_visitor).map(row => row.visitor_id)).size, avgReadMs: readMs(leaves), hubViews, storyViews: storyViews.length,
      storiesRead: new Set(storyViews.map(row => storyPath(row.path))).size, clicks: clicks.length,
      clickers: new Set(clicks.map(click => click.actor_id ?? click.details?.visitor_id).filter(Boolean)).size,
      opens: opens.length, openRate: hubViews ? opens.length / hubViews : null,
      paywallClicks: clicks.filter(click => click.details?.topic === TECH_BUZZ_TRACKED.paywall).length,
    },
    content: {
      published: stories.length, publishedInWindow: stories.filter(story => Date.parse(story.publishedAt) >= since).length,
      likes: stories.reduce((sum, story) => sum + story.likes, 0), dislikes: stories.reduce((sum, story) => sum + story.dislikes, 0),
      claps: stories.reduce((sum, story) => sum + story.claps, 0), comments: stories.reduce((sum, story) => sum + story.commentsCount, 0),
      avgRating: average(rated.map(story => story.rating.average)), rated: rated.length, avgEditor: average(scored),
    },
    trend, sections, pages, daily,
    topics: FAVOURITE_TOPICS.map(topic => {
      const inTopic = pages.filter(page => page.topics.includes(topic.id));
      return { id: topic.id, label: topic.label, color: topic.color, stories: inTopic.length, views: inTopic.reduce((sum, page) => sum + page.views, 0), likes: inTopic.reduce((sum, page) => sum + page.likes, 0) };
    }),
    sources: tally(views.map(row => row.utm_source ?? row.referrer_host ?? "Direct / none")),
    devices: tally(views.map(row => row.device ?? "Unknown")),
    countries: tally(views.map(row => row.country ?? "Unknown")),
  };
}
