import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
try {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key, email text);");
  const visits = await readFile("supabase/migrations/0023_user_activity.sql", "utf8");
  await db.exec(visits.split("-- --------------------------------------------------------------- the activity page")[0] + "commit;");
  await db.exec(await readFile("supabase/migrations/0040_overall_visitor_tracking.sql", "utf8"));
  await db.exec(`insert into site_visits(event,visitor_id,session_id,path,utm_source,created_at)
    select 'page_view','browser1','session1','/',case when i % 2 = 0 then 'instagram' else 'telegram' end,now()-interval '1 minute'
    from generate_series(1,20005) i;
    insert into site_visits(event,visitor_id,session_id,path,is_bot) values
    ('page_view','browser2','session2','/learning',false),
    ('page_leave','browser2','session2','/learning',false),
    ('page_view','browser3','session3','/',true),
    ('page_view','browser4','session4','/super-admin',false),
    ('page_view','browser5','session5','/dashboard/super-admin',false);
    set role service_role;`);
  const data = (await db.query("select overall_visitor_tracking() as report")).rows[0].report;
  assert.equal(data.totals.views, 20006);
  assert.equal(data.totals.visitors, 2);
  assert.equal(data.totals.sessions, 2);
  assert.equal(data.totals.recent, 2);
  assert.equal(data.daily.reduce((sum, row) => sum + row.views, 0), 20006);
  assert.equal(data.sources.length, 3);
  assert.equal(data.pages[0].views, 20005);
  await db.exec("reset role; set role authenticated;");
  await assert.rejects(db.query("select overall_visitor_tracking()"), /permission denied/);
  console.log("PASS: uncapped database totals, browser deduplication, event/bot/admin exclusions and service-only permissions.");
} finally { await db.close(); }
