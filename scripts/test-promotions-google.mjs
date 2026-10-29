import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
try {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  const visits = await readFile("supabase/migrations/0023_user_activity.sql", "utf8");
  await db.exec(visits.split("-- --------------------------------------------------------------- the activity page")[0] + "commit;");
  for (const file of ["0024_promotions.sql", "0038_promotions_publishing_platforms.sql", "0047_promotions_google_search.sql"]) await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  const insert = "insert into promotions(platform,title,utm_campaign,format,platform_metrics) values($1,'Search campaign','search-launch','ad',$2) returning id,platform";
  const result = await db.query(insert, ["google_search", {}]);
  assert.equal(result.rows[0].platform, "google_search");
  await db.query(insert, ["instagram", { saves: 4, link_clicks: 10 }]);
  await assert.rejects(db.query(insert, ["unknown_platform", {}]), /promotions_platform_check/);
  await assert.rejects(db.query(insert, ["google_search", []]), /promotions_platform_metrics_object/);
  await db.exec("set role authenticated;");
  await assert.rejects(db.query("select * from promotions"), /permission denied/);
  await db.exec("reset role;");
  // Idempotent migration preserves previously registered promotions.
  await db.exec(await readFile("supabase/migrations/0047_promotions_google_search.sql", "utf8"));
  assert.equal((await db.query("select count(*)::int as n from promotions")).rows[0].n, 2);
  console.log("PASS: Google/social promotion storage, validation, migration rerun and restricted access.");
} finally { await db.close(); }
