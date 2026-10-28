import "server-only";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { db } from "./db";
import { TECH_BUZZ_ARTICLES, type TechBuzzArticle } from "@/lib/tech-buzz-data";
import { HttpError } from "./http";
import { withReaderClaps } from "./tech-buzz-claps";

const isMissing = (err: { code?: string; message: string } | null) =>
  !err ? false : (
    err.code === "42P01" ||
    err.code === "42703" ||
    err.code === "PGRST205" ||
    err.code === "PGRST202" ||
    /could not find the table|relation .* does not exist/i.test(err.message)
  );

/** PostgREST's "column not in schema cache" for the likes/dislikes columns migration 0041 adds. */
const missingCounterColumns = (err: { code?: string; message: string }) =>
  (err.code === "PGRST204" || err.code === "42703") && /likes|dislikes/.test(err.message);

type TechBuzzRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  technology: string;
  tech_badge_color: string;
  read_time_minutes: number;
  featured: boolean;
  trending_rank: number | null;
  claps: number;
  rating_average: number | string;
  rating_count: number;
  rating_breakdown?: Record<string, number>;
  author: TechBuzzArticle["author"];
  cover_image: string;
  tags: string[];
  likes?: number;
  dislikes?: number;
  upvotes: number;
  ranking_score: number | string;
  source: TechBuzzArticle["source"];
  summary_bullets: string[];
  reactions: TechBuzzArticle["reactions"];
  comments_count: number;
  comments: TechBuzzArticle["comments"];
  series?: TechBuzzArticle["series"];
  tech_stack: string[];
  audio_voiceover?: TechBuzzArticle["audioVoiceover"];
  newsletter_edition?: string;
  membership_tier: TechBuzzArticle["membershipTier"];
  builder_metrics?: TechBuzzArticle["builderMetrics"];
  founder_takeaway?: string;
  content_sections: TechBuzzArticle["contentSections"];
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
};

function rowToArticle(row: TechBuzzRow): TechBuzzArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    technology: row.technology,
    techBadgeColor: row.tech_badge_color || "#ea580c",
    readTimeMinutes: Number(row.read_time_minutes) || 5,
    featured: Boolean(row.featured),
    trendingRank: row.trending_rank ? Number(row.trending_rank) : undefined,
    likes: Number(row.likes) || Number(row.upvotes) || 0,
    dislikes: Number(row.dislikes) || 0,
    upvotes: Number(row.upvotes) || Number(row.likes) || 0,
    claps: Number(row.claps) || 0,
    rating: {
      average: Number(row.rating_average) || 4.9,
      // 0 means not rated yet (daily stories start there).
      count: row.rating_count == null ? 0 : Number(row.rating_count),
      breakdown: (row.rating_breakdown as any) || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    author: row.author || {
      name: "Study Buddy Team",
      role: "Principal Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      handle: "@studybuddy",
      verified: true,
    },
    coverImage: row.cover_image,
    tags: row.tags || [],
    rankingScore: Number(row.ranking_score) || 98.0,
    source: row.source || {
      name: "Tech Buzz Radar",
      domain: "masterclass.internal",
      trustScore: "99.2",
    },
    summaryBullets: row.summary_bullets || [],
    reactions: row.reactions || { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 },
    commentsCount: Number(row.comments_count) || (row.comments ? row.comments.length : 0),
    comments: row.comments || [],
    series: row.series,
    techStack: row.tech_stack || [],
    audioVoiceover: row.audio_voiceover || {
      durationMinutes: row.read_time_minutes || 5,
      narrator: "Study Buddy AI Voice",
      waveformSeed: [35, 60, 45, 90, 80, 50, 70, 95, 60, 40],
    },
    newsletterEdition: row.newsletter_edition,
    membershipTier: row.membership_tier || "Pro Member",
    builderMetrics: row.builder_metrics || {
      metricLabel: "Architecture Ready",
      metricValue: "100%",
    },
    founderTakeaway: row.founder_takeaway || "",
    publishedAt: row.published_at || row.created_at,
    contentSections: row.content_sections || [],
  };
}

function articleToRow(article: Partial<TechBuzzArticle>, userId?: string) {
  const slug = (article.slug || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 99);

  return {
    slug,
    title: article.title,
    subtitle: article.subtitle || "",
    category: article.category || "System Architecture",
    technology: article.technology || "Next.js 15",
    tech_badge_color: article.techBadgeColor || "#ea580c",
    read_time_minutes: article.readTimeMinutes || 5,
    featured: Boolean(article.featured),
    trending_rank: article.trendingRank || null,
    claps: article.claps || 0,
    rating_average: article.rating?.average || 4.95,
    rating_count: article.rating?.count ?? 0,
    rating_breakdown: article.rating?.breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    author: article.author || {
      name: "Study Buddy Team",
      role: "Principal Systems Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      handle: "@studybuddy",
      verified: true,
    },
    cover_image: article.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    tags: article.tags || [],
    likes: article.likes ?? article.upvotes ?? 0,
    dislikes: article.dislikes ?? 0,
    upvotes: article.upvotes ?? article.likes ?? 0,
    ranking_score: article.rankingScore || 98.0,
    source: article.source || {
      name: "Tech Buzz Radar",
      domain: "masterclass.internal",
      trustScore: "99.4",
    },
    summary_bullets: article.summaryBullets || [],
    reactions: article.reactions || { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 },
    comments_count: article.commentsCount || 0,
    comments: article.comments || [],
    series: article.series || null,
    tech_stack: article.techStack || [],
    audio_voiceover: article.audioVoiceover || {
      durationMinutes: article.readTimeMinutes || 5,
      narrator: "Study Buddy Narration",
      waveformSeed: [40, 75, 55, 80, 95, 60, 85, 70, 50, 65],
    },
    newsletter_edition: article.newsletterEdition || null,
    membership_tier: article.membershipTier || "Pro Member",
    builder_metrics: article.builderMetrics || null,
    founder_takeaway: article.founderTakeaway || null,
    content_sections: article.contentSections || [],
    status: (article as any).status || "published",
    ...(userId ? { created_by: userId } : {}),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch all published Tech Buzz articles from Supabase.
 * Falls back to in-memory TECH_BUZZ_ARTICLES if the database table is empty or missing.
 */
const SUMMARY_COLUMNS = "id,slug,title,subtitle,category,technology,tech_badge_color,read_time_minutes,featured,trending_rank,claps,rating_average,rating_count,author,cover_image,tags,likes,dislikes,upvotes,ranking_score,source,summary_bullets,reactions,comments_count,builder_metrics,published_at,created_at";
const summarize = (article: TechBuzzArticle): TechBuzzArticle => ({ ...article, contentSections: [], comments: [] });

export async function listTechBuzzArticles(includeDrafts = false, summariesOnly = false): Promise<TechBuzzArticle[]> {
  const defaults = summariesOnly ? TECH_BUZZ_ARTICLES.map(summarize) : TECH_BUZZ_ARTICLES;
  try {
    const client = db();
    // Typed as string: Supabase's select parser cannot read a column list chosen at runtime.
    const columns: string = summariesOnly ? SUMMARY_COLUMNS : "*";
    let query = client.from("tech_buzz_articles").select(columns);
    if (!includeDrafts) {
      query = query.eq("status", "published");
    }
    query = query.order("published_at", { ascending: false });

    let result = await query;
    // Older installs can still read summaries before the counters migration.
    if (summariesOnly && result.error && missingCounterColumns(result.error)) {
      const legacyColumns: string = SUMMARY_COLUMNS.replace("likes,dislikes,", "");
      let legacy = client.from("tech_buzz_articles").select(legacyColumns);
      if (!includeDrafts) legacy = legacy.eq("status", "published");
      result = await legacy.order("published_at", { ascending: false });
    }
    if (result.error) {
      if (isMissing(result.error)) {
        return defaults;
      }
      console.warn("Tech Buzz Supabase query error:", result.error.message);
      return defaults;
    }

    if (!result.data || result.data.length === 0) {
      return defaults;
    }

    const dbArticles = (result.data as unknown as TechBuzzRow[]).map(rowToArticle);
    
    // Merge database articles with default articles (avoid duplicates by slug)
    const existingSlugs = new Set(dbArticles.map(a => a.slug));
    const merged = [...dbArticles];
    for (const def of defaults) {
      if (!existingSlugs.has(def.slug)) {
        merged.push(def);
      }
    }
    return merged;
  } catch (err) {
    console.warn("Failed to fetch from tech_buzz_articles table, using default fallback:", err);
    return defaults;
  }
}

/** Cache tag for every public Tech Buzz read; admin writes expire it so a publish shows at once. */
export const TECH_BUZZ_TAG = "tech-buzz";
const expirePublic = () => { try { revalidateTag(TECH_BUZZ_TAG, { expire: 0 }); } catch { /* outside a request (scripts) */ } };

/**
 * Published articles for the public feed, API and article pages, cached for minutes so a visit costs no
 * database round trip (the database is in Tokyo; most visitors are not).
 */
export async function listPublishedTechBuzzArticles(): Promise<TechBuzzArticle[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TECH_BUZZ_TAG);
  // Readers' claps (migration 0042) join each story's count here, so lists stay within minutes of the live total.
  return withReaderClaps(await listTechBuzzArticles(false));
}

/** Feed, sitemap and related-card queries exclude article bodies and comment threads. */
export async function listPublishedTechBuzzSummaries(): Promise<TechBuzzArticle[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TECH_BUZZ_TAG);
  return withReaderClaps(await listTechBuzzArticles(false, true));
}

/** Fetch only the requested published article, rather than loading the entire archive's bodies. */
export async function getPublishedTechBuzzArticle(slug: string): Promise<TechBuzzArticle | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TECH_BUZZ_TAG);
  const field = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug) ? "id" : "slug";
  let article: TechBuzzArticle | undefined;
  try {
    const result = await db().from("tech_buzz_articles").select("*").eq("status", "published").eq(field, slug).maybeSingle();
    if (result.data) article = rowToArticle(result.data as TechBuzzRow);
    else if (result.error && !isMissing(result.error)) console.warn("Tech Buzz article read failed:", result.error.code);
  } catch { /* Static stories remain available when the database is unavailable. */ }
  article ??= TECH_BUZZ_ARTICLES.find(item => item.slug === slug || item.id === slug);
  return article ? (await withReaderClaps([article]))[0] : null;
}

/**
 * Fetch a single Tech Buzz article by slug from Supabase or fallback.
 */
export async function getTechBuzzArticleBySlug(slug: string): Promise<TechBuzzArticle | null> {
  try {
    const client = db();
    const result = await client
      .from("tech_buzz_articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (result.error && !isMissing(result.error)) {
      console.warn("Tech buzz single article query error:", result.error.message);
    }

    if (result.data) {
      return rowToArticle(result.data as TechBuzzRow);
    }
  } catch (err) {
    console.warn("Error fetching article by slug from DB:", err);
  }

  // Fallback to static articles
  return TECH_BUZZ_ARTICLES.find(a => a.slug === slug) || null;
}

/**
 * Insert a new Tech Buzz article into Supabase (Super Admin / Owner).
 */
export async function createTechBuzzArticle(input: Partial<TechBuzzArticle>, userId?: string): Promise<TechBuzzArticle> {
  const client = db();
  const rowData = articleToRow(input, userId);

  let result = await client
    .from("tech_buzz_articles")
    .insert(rowData)
    .select("*")
    .single();
  // Before migration 0041 the table has no likes/dislikes columns: store likes as upvotes and drop dislikes.
  if (result.error && missingCounterColumns(result.error)) {
    const { likes, dislikes, ...legacy } = rowData;
    void likes; void dislikes;
    result = await client.from("tech_buzz_articles").insert(legacy).select("*").single();
  }

  if (result.error) {
    if (isMissing(result.error)) {
      throw new HttpError(503, "migration_required: Apply supabase/migrations/0037_tech_buzz_blogs.sql in Supabase");
    }
    throw new Error(result.error.message);
  }

  expirePublic();
  return rowToArticle(result.data as TechBuzzRow);
}

/**
 * Update an existing Tech Buzz article by ID or slug in Supabase.
 */
export async function updateTechBuzzArticle(idOrSlug: string, input: Partial<TechBuzzArticle>): Promise<TechBuzzArticle> {
  const client = db();
  const rowData = articleToRow(input);

  // Determine whether idOrSlug is a UUID or slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const filterCol = isUuid ? "id" : "slug";

  const result = await client
    .from("tech_buzz_articles")
    .update(rowData)
    .eq(filterCol, idOrSlug)
    .select("*")
    .single();

  if (result.error) {
    if (isMissing(result.error)) {
      throw new HttpError(503, "migration_required: Apply supabase/migrations/0037_tech_buzz_blogs.sql in Supabase");
    }
    throw new Error(result.error.message);
  }

  expirePublic();
  return rowToArticle(result.data as TechBuzzRow);
}

/** Replaces only a story's written content (refined stories keep their slug, pictures, counters and ratings). */
export async function updateTechBuzzContent(slug: string, content: Pick<TechBuzzArticle, "subtitle" | "summaryBullets" | "founderTakeaway" | "contentSections" | "source" | "techStack" | "readTimeMinutes">) {
  const { error } = await db().from("tech_buzz_articles").update({
    subtitle: content.subtitle, summary_bullets: content.summaryBullets, founder_takeaway: content.founderTakeaway,
    content_sections: content.contentSections, source: content.source, tech_stack: content.techStack,
    read_time_minutes: content.readTimeMinutes, updated_at: new Date().toISOString(),
  }).eq("slug", slug);
  if (error) throw new Error(error.message);
  expirePublic();
}

/**
 * Delete a Tech Buzz article by ID or slug from Supabase.
 */
export async function deleteTechBuzzArticle(idOrSlug: string): Promise<void> {
  const client = db();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const filterCol = isUuid ? "id" : "slug";

  const result = await client
    .from("tech_buzz_articles")
    .delete()
    .eq(filterCol, idOrSlug);

  if (result.error) {
    if (isMissing(result.error)) {
      throw new HttpError(503, "migration_required: Apply supabase/migrations/0037_tech_buzz_blogs.sql in Supabase");
    }
    throw new Error(result.error.message);
  }
  expirePublic();
}

/**
 * Seed all default curated articles into Supabase table if it's empty.
 */
export async function syncDefaultArticlesToSupabase(): Promise<{ count: number }> {
  const client = db();
  const rowsToInsert = TECH_BUZZ_ARTICLES.map(a => articleToRow(a));

  const result = await client
    .from("tech_buzz_articles")
    .upsert(rowsToInsert, { onConflict: "slug" })
    .select("id");

  if (result.error) {
    if (isMissing(result.error)) {
      throw new HttpError(503, "migration_required: Apply supabase/migrations/0037_tech_buzz_blogs.sql in Supabase");
    }
    throw new Error(result.error.message);
  }

  expirePublic();
  return { count: result.data?.length || 0 };
}

/* ── Unsplash cover photos ─────────────────────────────────────────────────────────────────────────────────────────
 * Stories without a hand-picked cover get a real photo from the Unsplash API (UNSPLASH_ACCESS_KEY, a free Access Key
 * from unsplash.com/developers), found by the story's technology. Searches are cached for weeks, so a few dozen API
 * calls cover every story (the free tier allows 50 an hour); stories on the same technology get different photos.
 * Photos are hotlinked from images.unsplash.com and credited in plain text, as Unsplash's API guidelines ask (no links,
 * per the site rule). Without a key, or when Unsplash fails, the story keeps its existing cover. */
const PHOTO_QUERIES: Record<string, string> = {
  langchain: "chain links technology", langgraph: "network nodes connections", langflow: "flowchart whiteboard planning",
  langsmith: "monitoring dashboard screen", openrouter: "network cables router", "ai-gateway": "data center servers",
  n8n: "automation workflow factory", "agentic-ai": "artificial intelligence robot", nextjs: "web development laptop code",
  react: "javascript code screen", angular: "web developer coding", vue: "green code editor", tanstack: "data dashboard laptop",
  "tanstack-start": "full stack developer laptop", zustand: "brown bear forest", "redux-toolkit": "toolbox tools workshop",
  javascript: "javascript code", nodejs: "server terminal programming", express: "api backend programming",
  nestjs: "software architecture diagram", graphql: "graph network connections", python: "python programming laptop",
  redis: "server room lights", postgresql: "database server racks", supabase: "database developer laptop",
  salesforce: "business team crm", docker: "shipping containers port", kubernetes: "container ship ocean",
  aws: "cloud computing data center", git: "tree branches", "github-actions": "assembly line automation",
  playwright: "theatre stage spotlight", cypress: "software testing laptop", jest: "quality inspection checklist",
  vitest: "lightning storm", rtl: "user interface design", "system-design": "architecture blueprint",
  dsa: "algorithm whiteboard", oops: "building blocks", typescript: "programming code monitor",
};
const CATEGORY_QUERIES: Record<string, string> = {
  "Artificial Intelligence": "artificial intelligence", "Frontend Engineering": "web design laptop", "Backend & APIs": "server programming",
  "Cloud & DevOps": "cloud data center", "Testing & Quality": "quality testing", "Computer Science": "mathematics whiteboard",
  "System Architecture": "architecture blueprint", "Full-Stack Development": "software developer desk", "Enterprise Platforms": "business office team",
};
type UnsplashPhoto = { url: string; credit: string; downloadLocation: string };
type CoverFields = { slug: string; techId?: string; technology: string; category: string; coverImage: string };

const photoQuery = (story: CoverFields) => PHOTO_QUERIES[story.techId ?? ""] ?? CATEGORY_QUERIES[story.category] ?? story.technology;
const needsPhoto = (story: CoverFields) => story.coverImage.startsWith("/");

/** Up to 15 landscape photos for a query. Throws on any API failure so a failure is never cached. */
async function unsplashSearch(query: string): Promise<UnsplashPhoto[]> {
  "use cache";
  cacheLife("weeks");
  cacheTag("tech-buzz-photos");
  const params = new URLSearchParams({ query, per_page: "15", orientation: "landscape", content_filter: "high" });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, "Accept-Version": "v1" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Unsplash search failed: ${res.status}`);
  const data = await res.json() as { results: { urls: { raw: string }; user: { name: string }; links: { download_location: string } }[] };
  // Unsplash+ photos are licensed separately and live on another host; only free photos are used.
  return data.results.filter(photo => photo.urls.raw.startsWith("https://images.unsplash.com/"))
    .map(photo => ({ url: photo.urls.raw, credit: `Photo: ${photo.user.name} / Unsplash`, downloadLocation: photo.links.download_location }));
}

/** Unsplash asks apps to report each photo they use (it counts as a download for the photographer); once per photo. */
async function reportPhotoUse(downloadLocation: string) {
  "use cache";
  cacheLife("max");
  await fetch(downloadLocation, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }, signal: AbortSignal.timeout(6000) }).catch(() => undefined);
  return true;
}

/**
 * Gives each story that has only a stock local cover a real Unsplash photo for its technology, plus the photo credit.
 * Positions among all published stories sharing a query pick the photo, so a story gets the same photo on every page
 * and its neighbours on the same technology get different ones.
 */
export async function withUnsplashCovers<T extends CoverFields>(stories: T[]): Promise<(T & { photoCredit?: string })[]> {
  if (!process.env.UNSPLASH_ACCESS_KEY || !stories.some(needsPhoto)) return stories;
  const everyone = (await listPublishedTechBuzzSummaries()).filter(needsPhoto).map(story => ({ slug: story.slug, query: photoQuery(story) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const queries = [...new Set(stories.filter(needsPhoto).map(photoQuery))];
  const found = new Map(await Promise.all(queries.map(async query => [query, await unsplashSearch(query).catch(() => [] as UnsplashPhoto[])] as const)));
  return Promise.all(stories.map(async story => {
    if (!needsPhoto(story)) return story;
    const query = photoQuery(story);
    const photos = found.get(query) ?? [];
    if (!photos.length) return story;
    const position = everyone.filter(other => other.query === query).findIndex(other => other.slug === story.slug);
    const photo = photos[Math.max(0, position) % photos.length];
    await reportPhotoUse(photo.downloadLocation).catch(() => undefined);
    return { ...story, coverImage: photo.url, photoCredit: photo.credit };
  }));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type TechBuzzCounter = "likes" | "dislikes" | "claps";

/**
 * One reader reaction on a stored story (the built-in stories have no row and keep their in-memory counts). Uses the
 * atomic tech_buzz_bump() from migration 0041; before it lands, likes and claps are written with a plain update
 * (likes into upvotes) and dislikes are not stored. Returns the new counts, or null when the story has no row.
 */
export async function bumpTechBuzzCounter(id: string, field: TechBuzzCounter, delta: number): Promise<{ likes: number; dislikes: number; claps: number } | null> {
  if (!UUID.test(id)) return null;
  const client = db();
  const rpc = await client.rpc("tech_buzz_bump", { p_id: id, p_field: field, p_delta: delta });
  if (!rpc.error) {
    const row = (rpc.data as { likes: number; dislikes: number; claps: number }[] | null)?.[0];
    return row ? { likes: Number(row.likes), dislikes: Number(row.dislikes), claps: Number(row.claps) } : null;
  }
  if (!isMissing(rpc.error)) throw new Error(rpc.error.message);
  const current = await client.from("tech_buzz_articles").select("upvotes, claps").eq("id", id).eq("status", "published").maybeSingle();
  if (current.error || !current.data) return null;
  const counts = { likes: Number(current.data.upvotes) || 0, dislikes: 0, claps: Number(current.data.claps) || 0 };
  if (field === "dislikes") return counts;
  counts[field] = Math.max(0, counts[field] + delta);
  const update = await client.from("tech_buzz_articles").update(field === "likes" ? { upvotes: counts.likes } : { claps: counts.claps }).eq("id", id);
  if (update.error) throw new Error(update.error.message);
  return counts;
}

/** Whether the daily edition for an IST date (YYYY-MM-DD) is already stored, so the 5:00 AM job never doubles up. */
export async function dailyEditionSlugs(date: string): Promise<string[]> {
  const result = await db().from("tech_buzz_articles").select("slug").contains("tags", [`daily:${date}`]);
  if (result.error) {
    if (isMissing(result.error)) throw new HttpError(503, "migration_required: Apply supabase/migrations/0037_tech_buzz_blogs.sql in Supabase");
    throw new Error(result.error.message);
  }
  return (result.data ?? []).map(row => row.slug as string);
}

/** Titles of a daily track's most recent stories, newest first, so the writer never repeats a topic. */
export async function recentDailyTitles(trackTag: string, limit = 30): Promise<string[]> {
  const result = await db().from("tech_buzz_articles").select("title").contains("tags", [trackTag]).order("published_at", { ascending: false }).limit(limit);
  if (result.error) return [];
  return (result.data ?? []).map(row => row.title as string);
}

export { expirePublic as expireTechBuzzCache };
