// Applies 0023 + 0027 to PGlite and checks the Audience explorer function against 0023's own figures.
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users (id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz, raw_user_meta_data jsonb);
    create table public.monitor_events (id bigint generated always as identity, created_at timestamptz default now(), kind text, action text, resource text, status int, duration_ms int, actor_id text, payload jsonb, details jsonb);`);
  // 0023 also needs tables from earlier migrations; only its site_visits table (and grants) matter here.
  const m0023 = await readFile('supabase/migrations/0023_user_activity.sql', 'utf8');
  await db.exec(m0023.slice(m0023.indexOf('create table if not exists public.site_visits'), m0023.indexOf('-- No monitor_change trigger')));
  await db.exec(await readFile('supabase/migrations/0027_activity_breakdowns.sql', 'utf8'));
  // 20 countries, 30 cities; a bot row that must be ignored; one signed-in visitor; page_leave read times.
  await db.exec(`insert into site_visits(event, visitor_id, session_id, path, country, region, city, new_visitor, referrer_host, user_id, duration_ms, is_bot)
    select 'page_view', 'visitor' || n, 'session' || n, case when n % 3 = 0 then '/dashboard' else '/' end,
      'C' || chr(65 + n % 20), 'Region', 'City' || (n % 30), n % 2 = 0, case when n % 4 = 0 then 'www.google.com' else null end,
      case when n = 1 then '00000000-0000-4000-8000-000000000001'::uuid end, null, false from generate_series(1, 120) n;
    insert into site_visits(event, visitor_id, session_id, path, country, duration_ms) values ('page_leave', 'visitor2', 'session2', '/', 'CC', 40000);
    insert into site_visits(event, visitor_id, session_id, path, country, is_bot) values ('page_view', 'botvisitor1', 'botsession1', '/', 'ZZ', true);`);
  const b = (await db.query('select admin_activity_breakdowns(30) as d')).rows[0].d;
  assert.equal(b.countries.length, 20, 'all countries, not a top-12');
  const combos = (await db.query("select count(distinct (city, region, country))::int n from site_visits where event = 'page_view' and not is_bot")).rows[0].n;
  assert.equal(b.cities.length, combos, 'every city (by city, region and country), not a top-12'); assert(combos > 12);
  assert(!b.countries.some(c => c.country === 'ZZ'), 'bots excluded');
  assert.equal(b.totals.visitors, 120);
  assert.equal(b.countries.reduce((s, c) => s + c.visitors, 0), 120);
  assert.equal(b.countries.find(c => c.country === 'CC').avg_seconds, 40);
  assert.equal(b.countries.reduce((s, c) => s + c.signed_in, 0), 1);
  assert.deepEqual(b.pages.map(p => p.path).sort(), ['/', '/dashboard']);
  assert.equal(b.referrers.find(r => r.referrer === 'www.google.com').views, 30);
  assert(b.countries.every((c, i, a) => i === 0 || a[i - 1].visitors >= c.visitors), 'ordered by visitors');
  for (const role of ['anon', 'authenticated']) { await db.exec(`set role ${role}`); await assert.rejects(db.query('select admin_activity_breakdowns(7)'), /permission denied/); await db.exec('reset role'); }
  console.log('PASS: 0027 complete breakdowns (20 countries, 60 city rows), bot exclusion, signed-in/read-time figures, ordering, role isolation.');
} finally { await db.close(); }
