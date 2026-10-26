# Permanent transaction deletion

Apply `supabase/migrations/0039_transaction_deletion.sql` before deploying the corresponding application changes. It requires migration 0018. The migration is safe to run again and does not delete existing transactions by itself.

The Super Admin Transactions delete action now atomically deletes every `billing_ledger` row whose `entity_id` matches the selected payment and saves its payment ID, deletion time and administrator in `deleted_transactions`. A database trigger prevents subsequent writes from restoring that payment's ledger rows. Other payments sharing an order, invoice or subscription are unaffected.

Every transactions API read checks the persisted markers, including cached Razorpay responses, CSV exports, suggestions, totals and insights. A failed database write returns an error instead of reporting success. The dashboard reloads its table and summary after a successful deletion.

The original payment remains in Razorpay: its Payments API does not expose a delete operation. Deleting a local transaction does not refund a payment or cancel a subscription. Card unlock access is preserved separately in `card_unlock_entitlements`, backfilled by this migration and maintained by the ledger trigger.

Earlier deletions existed only in server memory and cannot be recovered after that process exits. Those entries must be deleted again after migration and deployment.

Validation: `npm test -- --runTestsByPath __tests__/transactions-api.test.ts __tests__/super-admin-transactions.test.tsx` and `node scripts/test-transaction-deletion.mjs`.
