import "server-only";
import { check, db } from "./db";
import type { Technology, Topic } from "@/lib/domain";
import { BUILTIN_NOTES_TECHNOLOGIES, BUILTIN_NOTES_TOPICS } from "@/lib/notes-catalog";

// Continue until an empty page, even if the server's row cap is below our range.
export async function catalogRows<T>(table: "technologies" | "topics", technologyId?: string): Promise<T[]> {
  const client = db();
  const rows: T[] = [];
  while (true) {
    let query = client.from(table).select("*").order("title").order("id").range(rows.length, rows.length + 499);
    if (technologyId) query = query.eq("technology_id", technologyId);
    const page = check(await query) as T[];
    if (!page.length) return rows;
    rows.push(...page);
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
