import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db=new PGlite();
try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);`);
  await db.exec(await readFile("supabase/migrations/0001_masterclass.sql","utf8"));
  await db.exec(await readFile("supabase/migrations/0002_download_credits.sql","utf8"));
  await db.exec(await readFile("supabase/seed.sql","utf8"));
  await db.exec("insert into profiles(id) values('alice'),('bob'),('carol');");
  async function reserve(owner,key,limit=3){return (await db.query("select (reserve_document($1,$2,'Test','{}'::jsonb,$3)).*",[owner,key,limit])).rows[0];}
  const requests=await Promise.allSettled(Array.from({length:6},(_,i)=>reserve("alice",`key-${i}`)));
  assert.equal(requests.filter(r=>r.status==="fulfilled").length,3,"only 3 reservations accepted");
  const first=requests.find(r=>r.status==="fulfilled").value;
  assert.equal((await reserve("alice",first.cache_key)).id,first.id,"reuses document without charging at quota limit");
  let job=(await db.query("select * from claim_document()")).rows[0];
  await db.query("update documents set attempts=3 where id=$1",[job.id]);
  await db.query("select fail_document($1,$2)",[job.id,job.lease]);
  await db.query("select fail_document($1,$2)",[job.id,job.lease]);
  assert.equal((await db.query("select used from usage_periods where user_id='alice'")).rows[0].used,2,"failed reservation refunded once");
  job=(await db.query("select * from claim_document()")).rows[0];
  assert.equal((await db.query("select finish_document($1,gen_random_uuid(),'{}','p','[]','[]') as done",[job.id])).rows[0].done,false,"stale worker cannot commit");
  await db.query("update documents set attempts=3,lease_until=now()-interval '1 second' where id=$1",[job.id]);
  await db.query("select * from claim_document()");
  assert.equal((await db.query("select status from documents where id=$1",[job.id])).rows[0].status,"failed","expired final lease recovered");

  // Pay-per-download credits: quota exhaustion falls back to a purchased credit, not a hard rejection.
  await reserve("carol","c0");await reserve("carol","c1");await reserve("carol","c2");
  await assert.rejects(reserve("carol","c3"),/quota_exceeded/,"no download credit available yet");
  await db.query("update profiles set credit_balance=1 where id='carol'");
  const creditDoc=await reserve("carol","c3");
  assert.equal(creditDoc.used_credit,true,"credit-funded reservation is flagged");
  assert.equal((await db.query("select credit_balance from profiles where id='carol'")).rows[0].credit_balance,0,"credit spent on reservation");
  assert.equal((await db.query("select used from usage_periods where user_id='carol' and period=date_trunc('month',now() at time zone 'UTC')::date")).rows[0].used,3,"credit spend does not touch the monthly quota");
  const lease=(await db.query("update documents set status='generating',lease=gen_random_uuid(),attempts=3,lease_until=now()+interval '10 minutes' where id=$1 returning lease",[creditDoc.id])).rows[0].lease;
  await db.query("select fail_document($1,$2)",[creditDoc.id,lease]);
  assert.equal((await db.query("select credit_balance from profiles where id='carol'")).rows[0].credit_balance,1,"a failed credit-funded document refunds the credit, not the quota");
  assert.equal((await db.query("select used from usage_periods where user_id='carol' and period=date_trunc('month',now() at time zone 'UTC')::date")).rows[0].used,3,"quota usage is untouched by a credit refund");
  assert.equal((await db.query("select credit_download('dl-event-1','carol',1) as applied")).rows[0].applied,true);
  assert.equal((await db.query("select credit_balance from profiles where id='carol'")).rows[0].credit_balance,2,"credit_download increments the balance");
  assert.equal((await db.query("select credit_download('dl-event-1','carol',1) as applied")).rows[0].applied,false,"duplicate download-credit webhook event ignored");
  assert.equal((await db.query("select credit_balance from profiles where id='carol'")).rows[0].credit_balance,2,"duplicate event does not double-credit");

  await reserve("bob","private");
  await db.exec("grant usage on schema public,auth to authenticated;grant select on all tables in schema public to authenticated;set role authenticated;set request.jwt.claims = '{\"sub\":\"bob\"}';");
  assert.equal((await db.query("select * from documents")).rows.length,1,"RLS only exposes the caller's documents");
  await assert.rejects(db.query("select reserve_document('alice','evil','X','{}',999)"),/permission denied/i);
  await db.exec("reset role;");
  const args=["event-1","alice","sub_test","monthly","active","2027-01-01T00:00:00Z","2026-09-08T00:00:00Z",false];
  const apply="select apply_subscription($1,$2,$3,$4,$5,$6,$7,$8) as applied";
  assert.equal((await db.query(apply,args)).rows[0].applied,true);
  assert.equal((await db.query(apply,args)).rows[0].applied,false,"duplicate billing event ignored");
  await db.query(apply,["event-old","alice","sub_test","monthly","created",null,"2026-09-07T00:00:00Z",false]);
  assert.equal((await db.query("select status from subscriptions where user_id='alice'")).rows[0].status,"active","out-of-order event cannot roll back membership");
  console.log("PASS: migrations, catalog seed, quota reservations, reuse, refunds, expired leases, stale workers, owner RLS, RPC permissions, duplicate and out-of-order billing events, pay-per-download credits.");
}finally{await db.close();}
