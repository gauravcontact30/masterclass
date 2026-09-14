import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

// Preview by default; --apply upserts only the rows in migration 0014.
const sql = await readFile(new URL("../supabase/migrations/0014_extended_notes_catalog.sql", import.meta.url), "utf8");
const unquote = value => value.replace(/''/g, "'");
const technologies = [...sql.matchAll(/\('((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)'\)/g)]
  .map(match => { const [id, title, title_hi, category] = match.slice(1).map(unquote); return { id, title, title_hi, category }; });
const topics = [...sql.matchAll(/\('((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)',(true|false),'((?:[^']|'')*)'\)/g)]
  .map(match => { const [id, technology_id, title, title_hi] = match.slice(1, 5).map(unquote); return { id, technology_id, title, title_hi, full_track: match[5] === "true", references: JSON.parse(unquote(match[6])) }; });
if (technologies.length !== 5 || topics.length !== 7) throw new Error("Unexpected catalog migration shape; review before applying.");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Database configuration missing. Run with --env-file=.env.local.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
for (const [table, rows] of [["technologies", technologies], ["topics", topics]]) {
  const result = await db.from(table).select("id").in("id", rows.map(row => row.id));
  if (result.error) throw new Error(`${table}: ${result.error.message}`);
  const existing = new Set(result.data.map(row => row.id));
  console.log(`${table}: ${rows.filter(row => !existing.has(row.id)).map(row => row.id).join(", ") || "all registered"}`);
  if (process.argv.includes("--apply")) {
    const write = await db.from(table).upsert(rows, { onConflict: "id" });
    if (write.error) throw new Error(`${table}: ${write.error.message}`);
    console.log(`Synced ${rows.length} ${table} rows.`);
  }
}
