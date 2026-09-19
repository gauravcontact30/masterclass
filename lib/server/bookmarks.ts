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
      const result = await store.download(`${folder(owner)}/${file.name}`);
      if (result.error || !result.data) throw new Error("Cannot load bookmark");
      const value = bookmarkSchema.parse(JSON.parse(await result.data.text()));
      if (`${value.id}.json` !== file.name) throw new Error("Invalid bookmark");
      return value;
    }));
    bookmarks.push(...results);
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
