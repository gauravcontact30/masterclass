import "server-only";
/**
 * Reads the verified official cards written by scripts/generate-official-content.ts.
 *
 * One JSON file per Search tab and per API package under content/official/,
 * read from disk on first use rather than imported, so thousands of cards never
 * enter a bundle (next.config.ts traces the folder into the server output). A
 * file is re-read when it changes, so a run in progress shows up without a
 * restart; a missing or malformed file just means no official cards yet.
 */
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { officialCardSchema, officialSlug, searchCardKey, type OfficialCard } from "@/lib/official-content/card";

export const OFFICIAL_CONTENT_DIR = join(process.cwd(), "content", "official");

const files = new Map<string, { mtime: number; cards: Map<string, OfficialCard> }>();

function load(path: string): Map<string, OfficialCard> | undefined {
  let mtime: number;
  try { mtime = statSync(path).mtimeMs; } catch { return undefined; }
  const cached = files.get(path);
  if (cached?.mtime === mtime) return cached.cards;
  const cards = new Map<string, OfficialCard>();
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    for (const [key, value] of Object.entries(raw)) {
      const parsed = officialCardSchema.safeParse(value);
      if (parsed.success) cards.set(key, parsed.data);
    }
  } catch {}
  files.set(path, { mtime, cards });
  return cards;
}

export const officialSearchCard = (technology: string, category: string, name: string) =>
  load(join(OFFICIAL_CONTENT_DIR, "search", `${officialSlug(technology)}.json`))?.get(searchCardKey(category, name));

export const officialApiCard = (packageId: string, name: string) =>
  load(join(OFFICIAL_CONTENT_DIR, "api", `${officialSlug(packageId)}.json`))?.get(name);
