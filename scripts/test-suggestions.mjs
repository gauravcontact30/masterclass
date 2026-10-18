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
  await db.exec('reset role');

  // 0026: scoped search, replied filter, reply counts, priority sort, export page size, bulk update and delete.
  await db.exec(await readFile('supabase/migrations/0026_suggestion_box_admin.sql', 'utf8'));
  const v2 = async (args = {}) => (await db.query(`select admin_list_suggestions_v2(p_search=>$1,p_scope=>$2,p_replied=>$3,p_page=>$4,p_limit=>$5,p_sort=>$6,p_priority=>$7) as data`,
    [args.search ?? '', args.scope ?? 'all', args.replied ?? '', args.page ?? 1, args.limit ?? 10, args.sort ?? 'newest', args.priority ?? ''])).rows[0].data;
  const all = await v2();
  assert.equal(all.total,23); assert.equal(all.suggestions.length,10);
  assert(!JSON.stringify(all).includes('access_hash') && !JSON.stringify(all).includes('"rn"'));
  assert.equal(all.awaitingReply,22); assert.equal((await v2({ replied:'yes' })).total,1); assert.equal((await v2({ replied:'no' })).total,22);
  assert.equal((await v2({ replied:'yes' })).suggestions[0].reply_count,1);
  assert.equal((await v2({ search:'We are working on this', scope:'reply' })).total,1);
  assert.equal((await v2({ search:'We are working on this', scope:'title' })).total,0);
  assert.equal((await v2({ search:'person7@', scope:'contributor' })).total,1);
  assert.equal((await v2({ search:'Suggestion 1', scope:'title' })).total,11);
  assert.equal((await v2({ limit:1000 })).suggestions.length,23);
  assert.equal((await v2({ page:3 })).suggestions.length,3);
  const newest = all.suggestions.map(s => s.created_at); assert.deepEqual(newest,[...newest].sort().reverse());
  assert.equal((await v2({ sort:'priority' })).suggestions[0].priority,'high');
  const picked = (await v2({ limit:5, sort:'oldest' })).suggestions; const ids = picked.map(s => s.id);
  const versions = Object.fromEntries(picked.map(s => [s.id, s.version]));
  assert.equal((await db.query("select admin_bulk_update_suggestions($1,'planned',null,'owner') n",[ids])).rows[0].n,5);
  assert.equal((await db.query("select admin_bulk_update_suggestions($1,'planned',null,'owner') n",[ids])).rows[0].n,0, 'no-op changes write no history');
  assert.equal((await db.query("select count(*)::int n from suggestion_updates where status='planned'")).rows[0].n,5);
  for (const row of (await db.query('select id,status,version from suggestions where id = any($1)',[ids])).rows) {
    assert.equal(row.status,'planned'); assert.equal(row.version,versions[row.id]+1, 'bulk updates bump the edit version');
  }
  assert.equal((await db.query("select admin_bulk_update_suggestions($1,null,'urgent','owner') n",[ids.slice(0,2)])).rows[0].n,2);
  assert.equal((await v2({ priority:'urgent' })).total,2); assert.equal((await v2()).urgent,2);
  await assert.rejects(db.query("select admin_bulk_update_suggestions($1,null,null,'owner')",[ids]),/invalid_request/);
  await assert.rejects(db.query("select admin_bulk_update_suggestions($1,'bogus',null,'owner')",[ids]),/check constraint/);
  const other = ids.find(x => x !== id);
  assert.equal((await db.query('select admin_delete_suggestions($1) n',[[id, other]])).rows[0].n,2);
  assert.equal((await v2()).total,21);
  assert.equal((await db.query('select count(*)::int n from suggestion_updates where suggestion_id=$1',[id])).rows[0].n,0, 'history cascades');
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query('select admin_list_suggestions_v2()'),/permission denied/);
    await assert.rejects(db.query('select admin_bulk_update_suggestions($1,\'new\',null,\'x\')',[ids]),/permission denied/);
    await assert.rejects(db.query('select admin_delete_suggestions($1)',[ids]),/permission denied/);
    await db.exec('reset role');
  }
  console.log('PASS: suggestion migrations 0025+0026: 10-row pagination, scoped search, replied filter, reply counts, priority sort, export size, bulk update/delete with history, private fields and role isolation.');
} finally { await db.close(); }
