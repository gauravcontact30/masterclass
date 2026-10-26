import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const db = new PGlite();
try {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  const monitoring = await readFile("supabase/migrations/0018_super_admin_monitoring.sql", "utf8");
  await db.exec(monitoring.split("-- Record keys")[0]);
  await db.exec("insert into billing_ledger(event_id,event,entity_id,user_id,subscription_ref) values ('unlock','card_unlock.captured','pay_delete','reader','unlock:word:day:one');");
  const migration = await readFile("supabase/migrations/0039_transaction_deletion.sql", "utf8");
  await db.exec(migration);
  await db.exec(migration);
  await db.exec(`insert into billing_ledger(event_id,event,entity_id,invoice_id) values
    ('one','payment.failed','pay_delete','inv_shared'),
    ('two','payment.captured','pay_delete','inv_shared'),
    ('three','payment.captured','pay_keep','inv_shared');`);
  await db.exec("set role service_role; select delete_transaction('pay_delete','admin'); reset role;");
  assert.deepEqual((await db.query("select entity_id from billing_ledger")).rows, [{ entity_id: "pay_keep" }]);
  assert.equal((await db.query("select deleted_by from deleted_transactions where payment_id='pay_delete'")).rows[0].deleted_by, "admin");
  assert.deepEqual((await db.query("select * from card_unlock_entitlements")).rows, [{ user_id: "reader", unlock_key: "unlock:word:day:one" }], "deletion preserves existing card access");
  await db.exec("select delete_transaction('pay_delete','other-admin');");
  assert.equal((await db.query("select count(*)::int as n from deleted_transactions")).rows[0].n, 1);
  await db.exec(`set role service_role;
    insert into billing_ledger(event_id,event,entity_id) values ('retry','payment.captured','pay_delete');
    update billing_ledger set entity_id='pay_delete' where event_id='three';
    reset role;`);
  assert.deepEqual((await db.query("select entity_id from billing_ledger")).rows, [{ entity_id: "pay_keep" }], "webhook inserts and updates cannot restore a deleted payment");
  await db.exec("insert into billing_ledger(event_id,event,entity_id,user_id,subscription_ref) values ('unlock-retry','card_unlock.captured','pay_delete','reader','unlock:word:day:two');");
  assert.equal((await db.query("select count(*)::int as n from card_unlock_entitlements")).rows[0].n, 2, "verified unlocks still grant access after report deletion");
  assert.equal((await db.query("select count(*)::int as n from billing_ledger")).rows[0].n, 1);

  // A failure during the physical delete must roll back the marker too.
  await db.exec(`create function reject_delete() returns trigger language plpgsql as $$ begin raise exception 'simulated failure'; end $$;
    create trigger reject_delete before delete on billing_ledger for each row execute function reject_delete();`);
  await assert.rejects(db.query("select delete_transaction('pay_keep','admin')"), /simulated failure/);
  assert.equal((await db.query("select count(*)::int as n from deleted_transactions where payment_id='pay_keep'")).rows[0].n, 0);
  assert.equal((await db.query("select count(*)::int as n from billing_ledger")).rows[0].n, 1);

  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role};`);
    await assert.rejects(db.query("select * from deleted_transactions"), /permission denied/);
    await assert.rejects(db.query("select * from card_unlock_entitlements"), /permission denied/);
    await assert.rejects(db.query("select delete_transaction('pay_keep','admin')"), /permission denied/);
    await db.exec("reset role;");
  }
  console.log("PASS: physical deletion, persistent markers, idempotence, webhook protection, atomic rollback and database permissions.");
} finally {
  await db.close();
}
