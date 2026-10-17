import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await db.exec(await readFile('supabase/migrations/0025_suggestion_box.sql', 'utf8'));
  await db.exec(`insert into suggestions(name,email,category,title,body,access_hash)
    select 'Contributor '||n, 'person'||n||'@example.com', 'feature', 'Suggestion '||n,
    'Please add more practice examples for learners.', repeat('a',64) from generate_series(1,23) n;`);
  const list = async (search='',page=1) => (await db.query('select admin_list_suggestions($1,\'\',\'\',\'\',$2) as data',[search,page])).rows[0].data;
  const first = await list();
  assert.equal(first.total,23); assert.equal(first.suggestions.length,10);
  assert.equal((await list('',3)).suggestions.length,3);
  assert.equal(first.counts.new,23);
  assert(!JSON.stringify(first).includes('access_hash'));
  assert.equal((await list('person23@example.com')).total,1);
  const id=first.suggestions[0].id;
  await db.query("select admin_update_suggestion($1,1,'in_progress','high','We are working on this.','owner')",[id]);
  assert.equal((await list('We are working on this')).total,1);
  await assert.rejects(db.query("select admin_update_suggestion($1,1,'completed','normal','Stale reply','owner')",[id]),/conflict/);
  assert.equal((await db.query('select count(*)::int n from suggestion_updates')).rows[0].n,1);
  await assert.rejects(db.query("select admin_update_suggestion($1,2,'invalid','normal','bad status','owner')",[id]),/check constraint/);
  assert.equal((await db.query('select version from suggestions where id=$1',[id])).rows[0].version,2);
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query('select * from suggestions'),/permission denied/);
    await assert.rejects(db.query('select * from suggestion_updates'),/permission denied/);
    await assert.rejects(db.query('select admin_list_suggestions()'),/permission denied/);
    await assert.rejects(db.query("select admin_update_suggestion($1,2,'completed','normal','','fake')",[id]),/permission denied/);
    await db.exec('reset role');
  }
  await db.exec('set role service_role');
  assert.equal((await list()).total,23);
  console.log('PASS: suggestion migration, 10-row pagination, search including replies, private fields, atomic updates, stale-edit rejection and role isolation.');
} finally { await db.close(); }
