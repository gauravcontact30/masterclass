import "server-only";
import { db } from "./db";
import type { TechBuzzArticle } from "@/lib/tech-buzz-data";

/** Medium's limit: one reader can give a story at most this many claps, over any number of presses. */
export const MAX_CLAPS = 50;

export type ClapState = { total: number; clappers: number; mine: number };

// Before migration 0042 the table and functions do not exist: claps then read as none and cannot be given.
const missing = (code?: string) => code === "42P01" || code === "42883" || code === "PGRST202" || code === "PGRST205";

type TotalRow = { article_key: string; total: number | string; clappers: number | string; mine: number | string };

/** Readers' claps for many stories (keyed by article id), with one reader's own claps when userId is given. */
export async function clapTotals(ids: string[], userId?: string | null): Promise<Map<string, ClapState>> {
  const totals = new Map<string, ClapState>();
  if (!ids.length) return totals;
  const { data, error } = await db().rpc("tech_buzz_clap_totals", { p_keys: ids, p_user: userId ?? null });
  if (error) {
    if (!missing(error.code)) console.error("tech_buzz_clap_totals_failed", error.code);
    return totals;
  }
  for (const row of (data ?? []) as TotalRow[]) totals.set(row.article_key, { total: Number(row.total) || 0, clappers: Number(row.clappers) || 0, mine: Number(row.mine) || 0 });
  return totals;
}

/** Adds readers' claps to each story's starting count, keeping that count in `baseClaps`. */
export async function withReaderClaps(articles: TechBuzzArticle[]): Promise<TechBuzzArticle[]> {
  const totals = await clapTotals(articles.map(article => article.id)).catch(() => new Map<string, ClapState>());
  return articles.map(article => {
    const base = article.baseClaps ?? article.claps ?? 0;
    return { ...article, baseClaps: base, claps: base + (totals.get(article.id)?.total ?? 0) };
  });
}

/** One story's live clap state for a reader (signed out: mine is 0). `total` includes the story's starting count. */
export async function clapState(article: TechBuzzArticle, userId: string | null): Promise<ClapState> {
  const own = (await clapTotals([article.id], userId)).get(article.id);
  return { total: (article.baseClaps ?? article.claps ?? 0) + (own?.total ?? 0), clappers: own?.clappers ?? 0, mine: own?.mine ?? 0 };
}

/** Adds `count` claps from a reader (capped at MAX_CLAPS in all), or undoes theirs with count 0. */
export async function giveClaps(article: TechBuzzArticle, userId: string, count: number): Promise<ClapState | null> {
  const { data, error } = await db().rpc("tech_buzz_clap", { p_key: article.id, p_user: userId, p_delta: count });
  if (error) {
    if (missing(error.code)) return null;
    throw new Error(error.message);
  }
  const row = (data as { mine: number; total: number | string; clappers: number | string }[] | null)?.[0];
  return { total: (article.baseClaps ?? article.claps ?? 0) + (Number(row?.total) || 0), clappers: Number(row?.clappers) || 0, mine: Number(row?.mine) || 0 };
}
