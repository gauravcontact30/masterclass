import "server-only";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { db } from "./db";
import { TECH_BUZZ_ARTICLES, type TechBuzzArticle } from "@/lib/tech-buzz-data";
import { HttpError } from "./http";

const isMissing = (err: { code?: string; message: string } | null) =>
  !err ? false : (
    err.code === "42P01" ||
    err.code === "42703" ||
    err.code === "PGRST205" ||
    err.code === "PGRST202" ||
    /could not find the table|relation .* does not exist/i.test(err.message)
  );

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
      count: Number(row.rating_count) || 1,
      breakdown: (row.rating_breakdown as any) || { 1: 0, 2: 0, 3: 2, 4: 15, 5: 80 },
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
    rating_count: article.rating?.count || 1,
    rating_breakdown: article.rating?.breakdown || { 1: 0, 2: 0, 3: 2, 4: 15, 5: 80 },
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
export async function listTechBuzzArticles(includeDrafts = false): Promise<TechBuzzArticle[]> {
  try {
    const client = db();
    let query = client.from("tech_buzz_articles").select("*");
    if (!includeDrafts) {
      query = query.eq("status", "published");
    }
    query = query.order("published_at", { ascending: false });

    const result = await query;
    if (result.error) {
      if (isMissing(result.error)) {
        return TECH_BUZZ_ARTICLES;
      }
      console.warn("Tech Buzz Supabase query error:", result.error.message);
      return TECH_BUZZ_ARTICLES;
    }

    if (!result.data || result.data.length === 0) {
      return TECH_BUZZ_ARTICLES;
    }

    const dbArticles = (result.data as TechBuzzRow[]).map(rowToArticle);
    
    // Merge database articles with default articles (avoid duplicates by slug)
    const existingSlugs = new Set(dbArticles.map(a => a.slug));
    const merged = [...dbArticles];
    for (const def of TECH_BUZZ_ARTICLES) {
      if (!existingSlugs.has(def.slug)) {
        merged.push(def);
      }
    }
    return merged;
  } catch (err) {
    console.warn("Failed to fetch from tech_buzz_articles table, using default fallback:", err);
    return TECH_BUZZ_ARTICLES;
  }
}

/** Cache tag for every public Tech Buzz read; admin writes expire it so a publish shows at once. */
const TECH_BUZZ_TAG = "tech-buzz";
const expirePublic = () => { try { revalidateTag(TECH_BUZZ_TAG, { expire: 0 }); } catch { /* outside a request (scripts) */ } };

/**
 * Published articles for the public feed, API and article pages, cached for minutes so a visit costs no
 * database round trip (the database is in Tokyo; most visitors are not).
 */
export async function listPublishedTechBuzzArticles(): Promise<TechBuzzArticle[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TECH_BUZZ_TAG);
  return listTechBuzzArticles(false);
}

/** One published article by slug or id, from the cached list; drafts are never served publicly. */
export async function getPublishedTechBuzzArticle(slug: string): Promise<TechBuzzArticle | null> {
  const articles = await listPublishedTechBuzzArticles();
  return articles.find(article => article.slug === slug || article.id === slug) ?? null;
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

  const result = await client
    .from("tech_buzz_articles")
    .insert(rowData)
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
