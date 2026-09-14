import { createClient } from "@supabase/supabase-js";

/**
 * One-off cleanup after retiring the PDF and PPTX formats. The app already
 * hides those documents (lib/server/repository.ts lists notes only); this
 * removes the rows, their learning progress (cascade) and their stored files,
 * including the shared _defaults/ PDF/PPTX renders of the seeded guides.
 *
 * Dry run (default, changes nothing):  npm run purge:legacy
 * Apply:                               npm run purge:legacy -- --apply
 */
const BUCKET = "generated-docs";
const apply = process.argv.includes("--apply");

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (try --env-file=.env.local).");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type Row = { id: string; status: string; storage_path: string | null; preview_paths: string[] | null };

async function legacyRows(db: ReturnType<typeof client>) {
  const rows: Row[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db.from("documents").select("id,status,storage_path,preview_paths")
      .in("request->>format", ["pdf", "pptx"]).range(from, from + 499);
    if (error) throw new Error(error.message);
    rows.push(...(data as Row[]));
    if (!data.length || data.length < 500) return rows;
  }
}

/** Every file under a storage prefix, recursing into folders. */
async function listFiles(db: ReturnType<typeof client>, prefix: string): Promise<string[]> {
  const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(error.message);
  const files: string[] = [];
  for (const entry of data ?? []) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id) files.push(path);
    else files.push(...(await listFiles(db, path)));
  }
  return files;
}

async function main() {
  const db = client();
  const rows = (await legacyRows(db)).filter(row => row.status !== "queued" && row.status !== "generating");
  const userFiles = rows.flatMap(row => [row.storage_path, ...(row.preview_paths ?? [])]).filter((p): p is string => Boolean(p) && !p!.startsWith("_defaults/"));
  const sharedFiles = (await listFiles(db, "_defaults")).filter(path => /\/(guide\.(pdf|pptx)|(pdf|pptx)-page-\d+\.png)$/.test(path));

  console.log(`${rows.length} PDF/PPTX documents, ${userFiles.length} per-user files, ${sharedFiles.length} shared default-guide files.`);
  if (!apply) { console.log("Dry run: nothing deleted. Re-run with --apply to delete."); return; }

  const files = [...userFiles, ...sharedFiles];
  for (let start = 0; start < files.length; start += 100) {
    const { error } = await db.storage.from(BUCKET).remove(files.slice(start, start + 100));
    if (error) throw new Error(error.message);
  }
  for (let start = 0; start < rows.length; start += 100) {
    const { error } = await db.from("documents").delete().in("id", rows.slice(start, start + 100).map(row => row.id));
    if (error) throw new Error(error.message);
  }
  console.log(`Deleted ${rows.length} documents and ${files.length} files.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
