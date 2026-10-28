import "server-only";
import { createHash } from "node:crypto";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { OFFICIAL_DOCS } from "@/lib/official-docs-data";
import { fetchDocumentation } from "@/lib/generation/sources";
import type { DocumentationRecord, DocumentationUpdate } from "@/lib/documentation-updates";
import { db } from "./db";
import { HttpError } from "./http";

const bucket = "documentation-updates";
// Reads for the GET route are cached (every record is a Storage download, and the list fetched all of them per
// request, a 2.8 s median in Request tracing); each write expires the record's tag and the list's.
const LIST_TAG = "documentation-updates";
const recordTag = (id: string) => `documentation-update:${id}`;
let provision: Promise<void> | undefined;
async function storage() {
  const client = db().storage;
  provision ??= (async () => {
    const found = await client.getBucket(bucket);
    if (found.data) {
      if (found.data.public) throw new HttpError(503, "documentation_storage_unavailable");
      return;
    }
    const created = await client.createBucket(bucket, { public: false, fileSizeLimit: 500000, allowedMimeTypes: ["application/json"] });
    if (created.error) {
      const retry = await client.getBucket(bucket);
      if (!retry.data || retry.data.public) throw new HttpError(503, "documentation_storage_unavailable");
    }
  })().catch(error => { provision = undefined; throw error; });
  await provision;
  return client.from(bucket);
}

function technology(id: string) {
  const doc = OFFICIAL_DOCS.find(item => item.id === id);
  if (!doc) throw new HttpError(404, "documentation_not_found");
  return doc;
}

export async function readDocumentation(id: string): Promise<DocumentationRecord | null> {
  technology(id);
  const { data, error } = await (await storage()).download(`${id}.json`);
  if (error) {
    if ("statusCode" in error && ["404", "400"].includes(String(error.statusCode)) && /not found|does not exist/i.test(error.message)) return null;
    throw new HttpError(503, "documentation_storage_unavailable");
  }
  if (!data) throw new HttpError(503, "documentation_storage_unavailable");
  return JSON.parse(await data.text()) as DocumentationRecord;
}

export function documentationStatus(id: string, record: DocumentationRecord | null): DocumentationUpdate {
  const doc = technology(id);
  return {
    id, title: doc.title, officialUrl: doc.officialUrl,
    checkedAt: record?.checkedAt ?? null, importedAt: record?.importedAt ?? null,
    status: !record ? "unchecked" : !record.published ? "available" : record.pending.hash !== record.published.hash ? "changed" : "current",
  };
}

/** readDocumentation for the GET route, cached until the record is next written. */
export async function cachedDocumentation(id: string): Promise<DocumentationRecord | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(recordTag(id), LIST_TAG);
  return readDocumentation(id);
}

export async function listDocumentationUpdates() {
  "use cache";
  cacheLife("hours");
  cacheTag(LIST_TAG);
  const { data, error } = await (await storage()).list("", { limit: 1000 });
  if (error || !data) throw new HttpError(503, "documentation_storage_unavailable");
  const names = new Set(data.map(file => file.name));
  // One 20-wide pool instead of rounds of five run one after another: "use cache" is per instance, so every new
  // instance pays this read (GET p50 was 726 ms, p95 4 s).
  const result: DocumentationUpdate[] = new Array(OFFICIAL_DOCS.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(20, OFFICIAL_DOCS.length) }, async () => {
    while (next < OFFICIAL_DOCS.length) {
      const at = next++, doc = OFFICIAL_DOCS[at];
      result[at] = documentationStatus(doc.id, names.has(`${doc.id}.json`) ? await readDocumentation(doc.id) : null);
    }
  }));
  return result;
}

async function writeDocumentation(id: string, record: DocumentationRecord) {
  const { error } = await (await storage()).upload(`${id}.json`, JSON.stringify(record), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new HttpError(503, "documentation_storage_unavailable");
  revalidateTag(recordTag(id), { expire: 0 });
  revalidateTag(LIST_TAG, { expire: 0 });
  return documentationStatus(id, record);
}

// One in-flight operation per technology in this process. Content hashes also
// protect imports from accepting a different revision than the one reviewed.
const operations = new Map<string, Promise<DocumentationUpdate>>();
export function checkDocumentation(id: string): Promise<DocumentationUpdate> {
  const existing = operations.get(id);
  if (existing) return existing;
  const operation = (async () => {
    const doc = technology(id);
    const record = await readDocumentation(id);
    if (record && Date.now() - Date.parse(record.checkedAt) < 60000) return documentationStatus(id, record);
    const [source] = await fetchDocumentation([doc.officialUrl]);
    const hash = createHash("sha256").update(source.text.replace(/\s+/g, " ").trim()).digest("hex");
    // Re-read after the network request to preserve an import from another request.
    const latest = await readDocumentation(id);
    return writeDocumentation(id, { checkedAt: source.retrievedAt, importedAt: latest?.importedAt ?? null, published: latest?.published ?? null, pending: { ...source, hash } });
  })().finally(() => operations.delete(id));
  operations.set(id, operation);
  return operation;
}

export async function importDocumentation(id: string, expectedHash: string) {
  const running = operations.get(id);
  if (running) await running;
  const record = await readDocumentation(id);
  if (!record || record.pending.hash !== expectedHash) throw new HttpError(409, "documentation_changed_check_again");
  return writeDocumentation(id, { ...record, importedAt: new Date().toISOString(), published: record.pending });
}
