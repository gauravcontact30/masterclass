import "server-only";
import { check, db } from "./db";
import { lessonTitles, monthKey } from "@/lib/domain";
import { DEFAULT_GUIDES, DefaultGuide, defaultLibraryRequest } from "@/lib/generation/default-library";

/**
 * Every library opens with the hand-authored notes guides in
 * lib/generation/default-library.ts. A notes document is its curriculum —
 * the reader, copy and download all render from it — so seeding an account
 * is a couple of row inserts, with no files to render or upload.
 */

/**
 * Rows seeded before notes became the only format still point at shared
 * objects under this prefix; deleting such a row must never remove them.
 */
export const SHARED_LIBRARY_PREFIX = "_defaults/";
export const isSharedLibraryPath = (path: string) => path.startsWith(SHARED_LIBRARY_PREFIX);

/** Deterministic per-guide key, so a re-seed can never duplicate a row and never collides with a generated document. */
export const seedCacheKey = (guide: DefaultGuide) => `default-library:${guide.id}`;

/**
 * profiles.default_library_guides records "<guide id>@<version>" for each
 * guide already seeded into the account. A guide absent from the list is
 * seeded; one recorded at an older version has its seeded copy refreshed in
 * place. Either way the list is then stamped, so a learner who deletes a
 * seeded copy does not get it back on the next dashboard load.
 */
export function parseSeeded(list: readonly string[] | null | undefined): Map<string, number> {
  const seeded = new Map<string, number>();
  for (const item of list ?? []) {
    const [id, version] = item.split("@");
    if (id) seeded.set(id, Number(version) || 1);
  }
  return seeded;
}

/** Guides this account has not seen at their current version yet. */
export function dueGuides(seeded: Map<string, number>): DefaultGuide[] {
  return DEFAULT_GUIDES.filter(guide => (seeded.get(guide.id) ?? 0) < guide.version);
}

/**
 * The rows for guides new to this account. The library lists newest first,
 * so created_at steps back one second per guide to keep DEFAULT_GUIDES order.
 */
export function seedRows(userId: string, guides: DefaultGuide[], now = Date.now()) {
  return guides.map(guide => {
    const index = DEFAULT_GUIDES.indexOf(guide);
    return {
      user_id: userId,
      title: guide.curriculum.title,
      request: defaultLibraryRequest(guide),
      cache_key: seedCacheKey(guide),
      period: monthKey(),
      status: "ready",
      curriculum: guide.curriculum,
      storage_path: null,
      preview_paths: [],
      page_titles: lessonTitles(guide.curriculum),
      created_at: new Date(now - index * 1000).toISOString(),
    };
  });
}

async function seedGuides(userId: string, guides: DefaultGuide[]) {
  if (!guides.length) return;
  const existing = check(await db().from("documents").select("cache_key").eq("user_id", userId).in("cache_key", guides.map(seedCacheKey))) as { cache_key: string }[];
  const have = new Set(existing.map(row => row.cache_key));
  const rows = seedRows(userId, guides.filter(guide => !have.has(seedCacheKey(guide))));
  if (!rows.length) return;
  // documents_reuse is a partial unique index (status <> 'failed'), which
  // ON CONFLICT cannot target, so this is a plain insert guarded by the
  // select above. A concurrent request that seeds first therefore surfaces
  // as a duplicate-key error, which is the desired no-op, not a failure.
  const { error } = await db().from("documents").insert(rows);
  if (error && !/duplicate key|unique constraint/i.test(error.message)) throw new Error(error.message);
}

/**
 * Points an account's seeded copy at the guide's new curriculum. Copies seeded
 * before notes became the only format carry an older cache key but still sit
 * on the shared prefix, which is what marks them as seeded; a learner's own
 * generated documents are never touched.
 */
async function refreshGuide(userId: string, guide: DefaultGuide) {
  const patch = { title: guide.curriculum.title, curriculum: guide.curriculum, page_titles: lessonTitles(guide.curriculum) };
  check(await db().from("documents").update(patch).eq("user_id", userId).eq("cache_key", seedCacheKey(guide)));
  check(await db().from("documents").update(patch).eq("user_id", userId).like("storage_path", `${SHARED_LIBRARY_PREFIX}%`)
    .eq("request->>format", "notes").eq("request->>topicId", guide.request.topicId));
}

export async function ensureDefaultLibrary(userId: string): Promise<void> {
  const owner = check(await db().from("profiles").select("default_library_guides").eq("id", userId).maybeSingle()) as { default_library_guides: string[] | null } | null;
  const seeded = parseSeeded(owner?.default_library_guides);
  const due = dueGuides(seeded);
  if (!due.length) return;
  for (const guide of due.filter(item => seeded.has(item.id))) await refreshGuide(userId, guide);
  await seedGuides(userId, due.filter(item => !seeded.has(item.id)));
  for (const guide of due) seeded.set(guide.id, guide.version);
  const stamp = [...seeded].map(([id, version]) => `${id}@${version}`);
  check(await db().from("profiles").update({ default_library_guides: stamp, default_library_at: new Date().toISOString() }).eq("id", userId));
}
