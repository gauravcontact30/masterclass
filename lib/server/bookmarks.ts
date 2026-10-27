import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { bookmarkIdentity, bookmarkSchema, type BookmarkDraft, type SavedBookmark } from "../bookmarks";

const bucket = "note-bookmarks";
let provision: Promise<void> | undefined;
async function storage() {
  const client = db().storage;
  provision ??= (async () => {
    const found = await client.getBucket(bucket);
    if (found.data) { if (found.data.public) throw new Error("Bookmarks must be private"); return; }
    const created = await client.createBucket(bucket, { public: false, fileSizeLimit: 3000000, allowedMimeTypes: ["application/json"] });
    if (created.error) {
      const retry = await client.getBucket(bucket);
      if (!retry.data || retry.data.public) throw new Error("Bookmark storage unavailable");
    }
  })().catch(error => { provision = undefined; throw error; });
  await provision;
  return client.from(bucket);
}
const folder = (owner: string) => encodeURIComponent(owner);
export async function listBookmarks(owner: string, offset: number) {
  const store = await storage();
  const { data, error } = await store.list(folder(owner), { limit: 101, offset, sortBy: { column: "name", order: "asc" } });
  if (error || !data) throw new Error("Cannot load bookmarks");
  const bookmarks: SavedBookmark[] = [];
  for (let index = 0; index < Math.min(data.length, 100); index += 10) {
    const results = await Promise.all(data.slice(index, Math.min(index + 10, 100)).map(async file => {
      const path = `${folder(owner)}/${file.name}`;
      const result = await store.download(path);
      if (result.error || !result.data) throw new Error("Cannot load bookmark");
      const raw = JSON.parse(await result.data.text()) as { href?: unknown };
      // Saved before the Learning Dashboard moved from /dashboard to /learning (2026-10-25): the stored link no
      // longer passed the schema, which turned the whole list into a 400. The id does not depend on the link, so the
      // corrected copy is written back to the same file.
      const legacy = typeof raw.href === "string" && /^\/dashboard(?:[/?#]|$)/.test(raw.href);
      if (legacy) raw.href = (raw.href as string).replace(/^\/dashboard(?:\/super-admin)?/, "/learning");
      const parsed = bookmarkSchema.safeParse(raw);
      // One unreadable file must not hide every other bookmark.
      if (!parsed.success || `${parsed.data.id}.json` !== file.name) { console.error("bookmark_unreadable", file.name.slice(0, 16)); return null; }
      if (legacy) void store.upload(path, JSON.stringify(parsed.data), { upsert: true, contentType: "application/json", cacheControl: "0" }).catch(() => {});
      return parsed.data;
    }));
    bookmarks.push(...results.filter((value): value is SavedBookmark => value !== null));
  }
  return { bookmarks, nextCursor: data.length > 100 ? offset + 100 : null };
}
export async function saveBookmark(owner: string, draft: BookmarkDraft) {
  const id = createHash("sha256").update(bookmarkIdentity(draft)).digest("hex");
  const bookmark = { ...draft, id, savedAt: new Date().toISOString() };
  const result = await (await storage()).upload(`${folder(owner)}/${id}.json`, JSON.stringify(bookmark), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (result.error) throw new Error("Cannot save bookmark");
  return bookmark;
}
export async function removeBookmark(owner: string, id: string) {
  const result = await (await storage()).remove([`${folder(owner)}/${id}.json`]);
  if (result.error) throw new Error("Cannot remove bookmark");
}
