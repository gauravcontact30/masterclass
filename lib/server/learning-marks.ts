import "server-only";
import { db } from "./db";
import type { LearningMark } from "../learning-marks";

const bucketName = "learning-marks";
let provision: Promise<void> | undefined;
/** Dedicated private storage; only authenticated, owner-scoped routes use it. */
async function storage() {
  const client = db().storage;
  provision ??= (async () => {
    const existing = await client.getBucket(bucketName);
    if (existing.data) {
      if (existing.data.public) throw new Error("Learning storage must be private");
      return;
    }
    const created = await client.createBucket(bucketName, { public: false, fileSizeLimit: 80000, allowedMimeTypes: ["application/json"] });
    if (created.error) {
      const retry = await client.getBucket(bucketName);
      if (!retry.data || retry.data.public) throw new Error("Learning storage unavailable");
    }
  })().catch(error => { provision = undefined; throw error; });
  await provision;
  return client.from(bucketName);
}
function folder(owner: string) { return encodeURIComponent(owner); }
function path(owner: string, id: string) { return `${folder(owner)}/${id}.json`; }

export async function listLearningMarks(owner: string, offset = 0) {
  const store = await storage();
  const { data, error } = await store.list(folder(owner), { limit: 251, offset, sortBy: { column: "name", order: "asc" } });
  if (error || !data) throw new Error("Learning edits unavailable");
  const files = data.slice(0, 250);
  const marks: LearningMark[] = [];
  for (let index = 0; index < files.length; index += 10) {
    const loaded = await Promise.all(files.slice(index, index + 10).map(async file => {
      const result = await store.download(`${folder(owner)}/${file.name}`);
      if (result.error || !result.data) {
        if (String(result.error?.message).toLowerCase().includes("not found")) return null;
        throw new Error("Learning edit could not load");
      }
      const mark = JSON.parse(await result.data.text()) as LearningMark;
      if (`${mark.id}.json` !== file.name) throw new Error("Invalid learning edit");
      return mark;
    }));
    marks.push(...loaded.filter((mark): mark is LearningMark => mark !== null));
  }
  return { marks, nextCursor: data.length > 250 ? String(offset + 250) : null };
}
export async function saveLearningMark(owner: string, mark: Omit<LearningMark, "updatedAt">): Promise<LearningMark> {
  const saved = { ...mark, updatedAt: new Date().toISOString() };
  const result = await (await storage()).upload(path(owner, mark.id), JSON.stringify(saved), { contentType: "application/json", upsert: true, cacheControl: "0" });
  if (result.error) throw new Error("Learning edit could not save");
  return saved;
}
export async function removeLearningMark(owner: string, id: string) {
  const result = await (await storage()).remove([path(owner, id)]);
  if (result.error) throw new Error("Learning edit could not be removed");
}
