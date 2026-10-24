import { createClient } from '@supabase/supabase-js';

const key = process.env.RAZORPAY_KEY_ID;
const secret = process.env.RAZORPAY_KEY_SECRET;
if (!key || !secret) throw new Error('Razorpay config missing');

async function request(path, body) {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Razorpay failed (${response.status}) ${await response.text()}`);
  return response.json();
}

const existing = (await request('plans?count=100')).items;

const targetPlans = {
  monthly: { amount: 22500, inr: 225, name: 'MasterClass Diwali 2026 monthly 25% recurring (₹225)' },
  yearly: { amount: 225000, inr: 2250, name: 'MasterClass Diwali 2026 yearly 25% recurring (₹2250)' },
};

const plans = {};
for (const cycle of ['monthly', 'yearly']) {
  const conf = targetPlans[cycle];
  let plan = existing.find(p => p.period === cycle && p.item?.currency === 'INR' && p.item?.amount === conf.amount && p.item?.name === conf.name);
  if (!plan) {
    console.log(`Creating plan for ${cycle}: amount ${conf.amount} paise...`);
    plan = await request('plans', {
      period: cycle,
      interval: 1,
      item: {
        name: conf.name,
        amount: conf.amount,
        currency: 'INR',
        description: '25% discount (₹' + conf.inr + ') on every payment, including renewals, for Diwali 2026.'
      }
    });
  }
  plans[cycle] = plan.id;
  console.log(`${cycle} plan id:`, plan.id, 'amount:', conf.amount);
}

// Update Supabase festive_sales
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase.from('festive_sales').update({
  razorpay_plan_monthly: plans.monthly,
  razorpay_plan_yearly: plans.yearly,
  updated_at: new Date().toISOString()
}).eq('slug', 'diwali-2026').select('*');

if (error) {
  console.error('Supabase update error:', error);
} else {
  console.log('Supabase festive_sales updated successfully:', JSON.stringify(data, null, 2));
}
