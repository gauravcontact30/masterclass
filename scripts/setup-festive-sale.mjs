// Run after migration 0035: node --env-file=.env scripts/setup-festive-sale.mjs --apply
// Creates/reuses pricing templates, never a customer subscription or payment.
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';

const apply = process.argv.includes('--apply');
const key = process.env.RAZORPAY_KEY_ID;
if (!key || !process.env.RAZORPAY_KEY_SECRET) throw new Error('Razorpay configuration missing');
if (apply && key.startsWith('rzp_live_') && process.env.ALLOW_LIVE_BILLING !== 'true') throw new Error('Live billing is disabled');
async function request(path, body) {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Razorpay ${path.split('/')[0]} failed (${response.status})`);
  return response.json();
}
const existing = [];
for (let skip = 0; ; skip += 100) {
  const page = await request(`plans?count=100&skip=${skip}`);
  existing.push(...page.items);
  if (page.items.length < 100) break;
}
const plans = {};
for (const cycle of ['monthly', 'yearly']) {
  const regular = Number(process.env[cycle === 'monthly' ? 'PRO_MONTHLY_PRICE_INR' : 'PRO_YEARLY_PRICE_INR'] ?? (cycle === 'monthly' ? 299 : 2999));
  const amount = Math.round(regular * 75);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Invalid price');
  const name = `MasterClass Diwali 2026 ${cycle} 25% recurring`;
  let plan = existing.find(p => p.period === cycle && p.interval === 1 && p.item?.currency === 'INR' && p.item?.amount === amount && p.item?.name === name);
  if (!plan && apply) plan = await request('plans', { period: cycle, interval: 1, item: { name, amount, currency: 'INR', description: '25% discount on every payment, including renewals, for Diwali 2026 enrolments.' } });
  plans[cycle] = { id: plan?.id ?? null, amountInr: amount / 100 };
}
console.log(JSON.stringify({ mode: key.startsWith('rzp_live_') ? 'live' : 'test', plans }, null, 2));
if (apply) {
  const row = { slug: 'diwali-2026', title: 'Diwali Festive Sale', title_hi: 'दिवाली फ़ेस्टिव सेल', discount_percent: 25, starts_at: '2026-10-24T00:00:00+05:30', ends_at: '2026-11-15T23:59:59+05:30', active: true, razorpay_plan_monthly: plans.monthly.id, razorpay_plan_yearly: plans.yearly.id };
  // Public plan IDs and prices only; no credentials in this deployment record.
  await writeFile('supabase/diwali-2026-plans.json', JSON.stringify(row, null, 2) + '\n');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await client.from('festive_sales').upsert(row, { onConflict: 'slug' });
  if (error) throw new Error(`Plans saved; database activation requires migration 0035 (${error.code}). Rerun this command after applying it.`);
  console.log('Supabase campaign activated. Existing subscriptions were not modified.');
}
