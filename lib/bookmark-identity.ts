import type { BookmarkDraft } from "./bookmarks";

/**
 * Kept apart from the zod schemas in ./bookmarks so the bookmark provider in
 * the root layout can compare bookmarks during render without shipping zod to
 * every page. Only the type is imported, and types are erased at build time.
 */
export function bookmarkIdentity(value: BookmarkDraft) {
  return JSON.stringify([value.sourceKey, value.technology, value.points.map(point => point.trim())]);
}
