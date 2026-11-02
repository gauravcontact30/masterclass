import "server-only";
import type { User } from "@supabase/supabase-js";
import { db } from "./db";
import { MARK_KINDS, type MarkKind } from "@/lib/tech-buzz-mark-keys";
import type { ArticleComment, TechBuzzArticle } from "@/lib/tech-buzz-data";

/** Readers' follows, reposts, saved stories, hidden stories and comments (migration 0051). */

export type Engagement = { comments: number; reposts: number };
type Failure = { code?: string; message: string } | null;

// Before migration 0051 the tables and function do not exist: reads come back empty and writes report null.
const missing = (error: Failure) => !!error && ["42P01", "42883", "PGRST202", "PGRST205"].includes(error.code ?? "");
/** Reads return `fallback` when the migration is pending or the query fails; only an unexpected failure is logged. */
function read<T>(label: string, error: Failure, value: T, fallback: T): T {
  if (!error) return value;
  if (!missing(error)) console.error(label, error.code);
  return fallback;
}

/** The reader's marks by kind, or null before migration 0051. */
export async function listMarks(userId: string): Promise<Record<MarkKind, string[]> | null> {
  const { data, error } = await db().from("tech_buzz_marks").select("kind,key").eq("user_id", userId).limit(5000);
  if (missing(error)) return null;
  if (error) throw new Error(error.message);
  const marks = Object.fromEntries(MARK_KINDS.map(kind => [kind, [] as string[]])) as Record<MarkKind, string[]>;
  for (const row of (data ?? []) as { kind: MarkKind; key: string }[]) marks[row.kind]?.push(row.key);
  return marks;
}

/** Sets or clears marks for a reader; false before migration 0051. */
export async function setMarks(userId: string, kind: MarkKind, keys: string[], on: boolean): Promise<boolean> {
  const table = db().from("tech_buzz_marks");
  const { error } = on
    ? await table.upsert(keys.map(key => ({ user_id: userId, kind, key })), { onConflict: "user_id,kind,key", ignoreDuplicates: true })
    : await table.delete().eq("user_id", userId).eq("kind", kind).in("key", keys);
  if (missing(error)) return false;
  if (error) throw new Error(error.message);
  return true;
}

export type Highlight = { id: string; quote: string };
export type TopHighlight = { quote: string; readers: number };

/** A reader's highlights on a story. */
export async function listHighlights(articleId: string, userId: string): Promise<Highlight[]> {
  const { data, error } = await db().from("tech_buzz_highlights").select("id,quote").eq("article_key", articleId).eq("user_id", userId).limit(200);
  return read("tech_buzz_highlights_failed", error, (data ?? []) as Highlight[], []);
}

/** Passages at least two readers highlighted. */
export async function topHighlights(articleId: string): Promise<TopHighlight[]> {
  const { data, error } = await db().rpc("tech_buzz_top_highlights", { p_key: articleId });
  const rows = read("tech_buzz_top_highlights_failed", error, data as { quote: string; readers: number | string }[] | null, null);
  return (rows ?? []).map(row => ({ quote: row.quote, readers: Number(row.readers) || 0 }));
}

/** Saves a highlight (saving the same passage twice returns the first); null before migration 0051. */
export async function addHighlight(articleId: string, userId: string, quote: string): Promise<Highlight | null> {
  const { data, error } = await db().from("tech_buzz_highlights")
    .upsert({ article_key: articleId, user_id: userId, quote }, { onConflict: "article_key,user_id,quote" }).select("id,quote").single();
  if (missing(error)) return null;
  if (error) throw new Error(error.message);
  return data as Highlight;
}

/** Deletes one of the reader's highlights. False when it was not theirs or does not exist. */
export async function removeHighlight(articleId: string, id: string, userId: string): Promise<boolean> {
  const { data, error } = await db().from("tech_buzz_highlights").delete().eq("id", id).eq("article_key", articleId).eq("user_id", userId).select("id");
  if (missing(error)) return false;
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/** Comments and reposts recorded for many stories, keyed by article id. */
export async function engagementTotals(ids: string[]): Promise<Map<string, Engagement>> {
  const totals = new Map<string, Engagement>();
  if (!ids.length) return totals;
  const { data, error } = await db().rpc("tech_buzz_engagement_totals", { p_keys: ids });
  const rows = read("tech_buzz_engagement_totals_failed", error, data as { article_key: string; comments: number | string; reposts: number | string }[] | null, null);
  for (const row of rows ?? []) totals.set(row.article_key, { comments: Number(row.comments) || 0, reposts: Number(row.reposts) || 0 });
  return totals;
}

/** Adds readers' comments and reposts to each story's counts, keeping the starting comment count in `baseCommentsCount`. */
export async function withReaderEngagement(articles: TechBuzzArticle[]): Promise<TechBuzzArticle[]> {
  const totals = await engagementTotals(articles.map(article => article.id)).catch(() => new Map<string, Engagement>());
  return articles.map(article => {
    const base = article.baseCommentsCount ?? article.commentsCount ?? 0;
    const own = totals.get(article.id);
    return { ...article, baseCommentsCount: base, commentsCount: base + (own?.comments ?? 0), reposts: own?.reposts ?? 0 };
  });
}

/** How many readers follow an author. */
export async function followerCount(authorKey: string): Promise<number> {
  const { count, error } = await db().from("tech_buzz_marks").select("user_id", { count: "exact", head: true }).eq("kind", "author").eq("key", authorKey);
  return read("tech_buzz_followers_failed", error, count ?? 0, 0);
}

type CommentRow = { id: string; user_id: string; author_name: string; author_avatar: string; body: string; created_at: string };

const toComment = (row: CommentRow, viewerId: string | null, viewerIsAdmin: boolean): ArticleComment => ({
  id: row.id,
  author: { name: row.author_name, role: "Member", avatar: row.author_avatar, handle: "Member" },
  text: row.body,
  createdAt: row.created_at,
  likes: 0,
  canDelete: viewerIsAdmin || row.user_id === viewerId,
});

/** A story's stored discussion, newest first. */
export async function listComments(articleId: string, viewerId: string | null, viewerIsAdmin = false): Promise<ArticleComment[]> {
  const { data, error } = await db().from("tech_buzz_comments").select("id,user_id,author_name,author_avatar,body,created_at")
    .eq("article_key", articleId).order("created_at", { ascending: false }).limit(200);
  return read("tech_buzz_comments_failed", error, (data ?? []) as CommentRow[], []).map(row => toComment(row, viewerId, viewerIsAdmin));
}

/** Posts a comment under the reader's account name and picture; null before migration 0051. */
export async function addComment(articleId: string, user: User, body: string): Promise<ArticleComment | null> {
  const meta = user.user_metadata ?? {};
  const name = String(meta.full_name ?? meta.name ?? "").trim() || "MasterClass Buddy member";
  const avatar = typeof meta.avatar_url === "string" && meta.avatar_url.startsWith("https://") ? meta.avatar_url : "";
  const { data, error } = await db().from("tech_buzz_comments")
    .insert({ article_key: articleId, user_id: user.id, author_name: name.slice(0, 120), author_avatar: avatar, body })
    .select("id,user_id,author_name,author_avatar,body,created_at").single();
  if (missing(error)) return null;
  if (error) throw new Error(error.message);
  return toComment(data as CommentRow, user.id, false);
}

/** Deletes a comment: its author's own, or any for an admin. False when nothing was deleted. */
export async function removeComment(articleId: string, commentId: string, userId: string, isAdmin: boolean): Promise<boolean> {
  let query = db().from("tech_buzz_comments").delete().eq("id", commentId).eq("article_key", articleId);
  if (!isAdmin) query = query.eq("user_id", userId);
  const { data, error } = await query.select("id");
  if (missing(error)) return false;
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}
