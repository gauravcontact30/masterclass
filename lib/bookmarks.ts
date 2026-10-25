import { z } from "zod";

export const bookmarkDraftSchema = z.object({
  sourceKey: z.string().min(1).max(500),
  title: z.string().trim().min(1).max(500),
  technology: z.string().trim().min(1).max(200),
  href: z.string().max(1500).refine(value => /^\/learning(?:[/?#]|$)/.test(value) && !/[\\\r\n]/.test(value), "Use a dashboard source link"),
  points: z.array(z.string().trim().min(1).max(12000)).min(1).max(200),
}).strict();
export const bookmarkSchema = bookmarkDraftSchema.extend({ id: z.string().regex(/^[a-f0-9]{64}$/), savedAt: z.iso.datetime() });
export type BookmarkDraft = z.infer<typeof bookmarkDraftSchema>;
export type SavedBookmark = z.infer<typeof bookmarkSchema>;
export type BookmarkSource = Omit<BookmarkDraft, "points">;
export { bookmarkIdentity } from "./bookmark-identity";
export function bookmarkText(items: SavedBookmark[]) {
  return items.map(item => `${item.title}\n${item.technology}\n${item.points.map(point => `- ${point}`).join("\n")}\nSource: ${item.href}`).join("\n\n");
}
