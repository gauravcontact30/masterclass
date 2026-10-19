import "server-only";
import { check, db } from "./db";
import type { Technology, Topic } from "@/lib/domain";
import { BUILTIN_NOTES_TECHNOLOGIES, BUILTIN_NOTES_TOPICS } from "@/lib/notes-catalog";

// Continue until an empty page, even if the server's row cap is below our range.
const PAGE = 500;
/** The catalogue changes rarely and is read on every dashboard page, so each table read is kept for a minute. */
const cache = new Map<string, { at: number; rows: Promise<unknown[]> }>();
export async function catalogRows<T>(table: "technologies" | "topics", technologyId?: string): Promise<T[]> {
  const key = `${table}:${technologyId ?? ""}`; const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60_000) return hit.rows as Promise<T[]>;
  const rows = readRows<T>(table, technologyId);
  cache.set(key, { at: Date.now(), rows });
  // A failed read is not cached.
  rows.catch(() => { if (cache.get(key)?.rows === rows) cache.delete(key); });
  return rows;
}
async function readRows<T>(table: "technologies" | "topics", technologyId?: string): Promise<T[]> {
  const client = db();
  const rows: T[] = [];
  while (true) {
    let query = client.from(table).select("*").order("title").order("id").range(rows.length, rows.length + PAGE - 1);
    if (technologyId) query = query.eq("technology_id", technologyId);
    const page = check(await query) as T[];
    rows.push(...page);
    // A short page is the last one, so small tables take one round trip instead of two.
    if (page.length < PAGE) return rows;
  }
}
// These technologies exist in the catalogue (seeded for future coverage) but
// aren't ready for learners yet — no curated marquee entry, no verified
// generation quality bar cleared. Hidden everywhere a learner picks a
// technology (landing marquee, dashboard generator) until that catches up.
export const HIDDEN_TECHNOLOGY_IDS = new Set(["firebase","github-actions","postgres","sql","go","rust","kotlin","mongodb","kubernetes","swift","tailwind","cpp","php","ruby"]);
export const catalogTechnologies = async () => [...new Map([...BUILTIN_NOTES_TECHNOLOGIES, ...await catalogRows<Technology>("technologies")].map(item => [item.id, item])).values()].filter(item => !HIDDEN_TECHNOLOGY_IDS.has(item.id));
export const catalogTopics = async (technologyId?: string) => {
  if (technologyId && HIDDEN_TECHNOLOGY_IDS.has(technologyId)) return [];
  const builtins = BUILTIN_NOTES_TOPICS.filter(item => !technologyId || item.technology_id === technologyId);
  return [...new Map([...builtins, ...await catalogRows<Topic>("topics", technologyId)].map(item => [item.id, item])).values()].filter(item => !HIDDEN_TECHNOLOGY_IDS.has(item.technology_id));
};
