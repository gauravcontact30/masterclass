"use client";
import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { requestJson } from "@/lib/client";
import { openSubscriptionCheckout } from "@/lib/razorpay-checkout";
import { loadPrices, type VisitorPrices } from "./currency-picker";
import { formatPrice } from "@/lib/pricing";
import type { Tier } from "@/lib/domain";
import { PORTALS, type ScopedPortal } from "@/lib/portal";
import styles from "./exams-shell.module.css";

/*
 * Membership for a Board Scholars or Exam Aspirants account. Each is separate from the other and from Tech Pro:
 * requests made from that portal's pages carry the portal header (lib/client.ts), so /api/billing creates, verifies
 * and cancels the subscription of that account only.
 */
type Plan = { tier: Tier; paidTier: Tier; trialEndsAt: string | null; subscription: { tier?: "monthly" | "yearly"; status: string; current_period_end: string | null; cancel_at_cycle_end: boolean } | null };
const MESSAGES: Record<string, string> = {
  pricing_changed: "Pricing has changed. Reload this page to see the latest price before paying.",
  subscription_exists: "This account already has an active membership.",
  checkout_plan_conflict: "A checkout for the other plan is still open. Finish or cancel it first.",
  rate_limited: "Too many attempts. Please wait a minute and try again.",
  signin_required: "Your session has ended. Sign in again.",
  setup_required: "Payments are not enabled yet. Please check back soon.",
  payment_unavailable: "The payment window could not open. Check your connection and try again.",
};
const INCLUDED: Record<ScopedPortal, string[]> = {
  ielts: ["IELTS Academic and General Training", "Sample papers, timed mock tests and 12 years of practice sets", "480 questions with answers: Reading, vocabulary, grammar, band scores, Writing Task 2 and Speaking Part 3", "Topic vocabulary, essay plans and model answers for 30 recurring themes"],
  boards: ["UP Board, CBSE and ICSE / ISC, Class 10 and 12", "Maths, Physics, Chemistry and English, chapter and topic wise", "Most asked questions with year asked and star ratings", "Official past papers for 20 years, upcoming exam dates and the Scholars Journal"],
  competitive: ["NDA, Defence, Banks, Railways, SSC, UPSC, CBI, Income Tax and more", "400+ objective questions per exam with answers and short explanations", "Subjective answers and 200+ quick answers per exam", "Exam calendar with official sites, and the Aspirants Digest"],
};
const day = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));

export function ExamsPlans({ portal }: { portal: ScopedPortal }) {
  const name = PORTALS[portal].name;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [prices, setPrices] = useState<VisitorPrices | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = useCallback(async () => { setPlan((await requestJson<{ account: Plan }>("/api/exams/account")).account); }, []);
  useEffect(() => {
    queueMicrotask(() => { refresh().catch(caught => setError(MESSAGES[caught instanceof Error ? caught.message : ""] ?? `Your ${name} account could not load. Reload the page.`)); });
    loadPrices().then(setPrices).catch(() => setError("Prices could not load. Reload the page."));
  }, [refresh, name]);

  const post = (body: unknown) => requestJson<Record<string, unknown>>("/api/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  async function run(key: string, work: () => Promise<void>) {
    setBusy(key); setError(null); setNotice(null);
    try { await work(); await refresh(); }
    catch (caught) { setError(MESSAGES[caught instanceof Error ? caught.message : ""] ?? "Something went wrong. Please try again."); }
    finally { setBusy(null); }
  }
  const buy = (tier: "monthly" | "yearly") => run(tier, async () => {
    const checkout = await post({ action: "checkout", tier, currency: prices?.currency, expectedAmountPaise: prices?.inr ? Math.round(prices.inr[tier] * 100) : undefined }) as { subscriptionId?: string; keyId?: string };
    if (!checkout.subscriptionId || !checkout.keyId) throw new Error("payment_unavailable");
    const payment = await openSubscriptionCheckout({ key: checkout.keyId, subscription_id: checkout.subscriptionId, name: `MasterClass ${name}`, description: `${name} membership, ${tier}` });
    if (!payment) { setNotice("Checkout was closed before payment. Nothing was charged."); return; }
    const verified = await post({ action: "verify", ...payment }) as { active?: boolean };
    setNotice(verified.active ? `Payment received. Your ${name} membership is active.` : "Payment received. Your membership will be active in a moment; reload if it does not update.");
  });
  const cancel = () => run("cancel", async () => { await post({ action: "cancel" }); setNotice("Renewal is cancelled. Your access continues until the end of the paid period."); });

  const active = plan && plan.paidTier !== "free";
  const money = (amount: number) => prices ? formatPrice(amount, prices.currency, false) : "…";
  return <div className={styles.stack}>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {notice && <p className={styles.status} role="status">{notice}</p>}
    {plan && <p className={styles.status} data-tone={plan.tier === "free" ? "warn" : undefined} role="status">
      {active ? <><b>{name} membership: {plan.subscription?.tier === "yearly" ? "Yearly" : "Monthly"}.</b>{plan.subscription?.current_period_end && <span>{plan.subscription.cancel_at_cycle_end ? "Access until" : "Renews on"} {day(plan.subscription.current_period_end)}.</span>}</>
        : plan.tier === "trial" && plan.trialEndsAt ? <><b>Free trial is running.</b><span>Full access until {day(plan.trialEndsAt)}. Choose a plan to keep it.</span></>
        : <><b>Your {name} trial has ended.</b><span>Choose a plan to open {portal === "boards" ? "Board Exams" : portal === "ielts" ? "the IELTS Dashboard" : "Competitive Exams"} again.</span></>}
    </p>}
    <div className={styles.plans}>
      {(["monthly", "yearly"] as const).map(tier => <section key={tier} className={styles.plan} data-best={tier === "yearly" || undefined} aria-label={`${tier} plan`}>
        <h2>{tier === "monthly" ? "Monthly" : "Yearly"}</h2>
        <p className={styles.price}>{prices ? money(prices[tier]) : "…"}<small> / {tier === "monthly" ? "month" : "year"}</small></p>
        <ul>{INCLUDED[portal].map(line => <li key={line}><Check size={15} aria-hidden="true" /><span>{line}</span></li>)}</ul>
        <button type="button" className={styles.primary} disabled={!plan || !prices || prices.enabled === false || Boolean(busy) || Boolean(active && !plan.subscription?.cancel_at_cycle_end)} onClick={() => void buy(tier)}>
          {busy === tier ? "Opening checkout…" : active && plan.subscription?.tier === tier ? "Your current plan" : `Start ${tier} membership`}</button>
      </section>)}
    </div>
    {active && !plan.subscription?.cancel_at_cycle_end && <button type="button" className={styles.ghost} style={{ justifySelf: "start" }} disabled={Boolean(busy)} onClick={() => void cancel()}>{busy === "cancel" ? "Cancelling…" : "Cancel renewal"}</button>}
    <p className={styles.note}>You are charged in Indian rupees through Razorpay. This membership belongs to your {name} account only. Tech Pro, Board Scholars and Exam Aspirants are separate accounts, each with its own membership.</p>
  </div>;
}
