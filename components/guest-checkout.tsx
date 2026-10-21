"use client";

import { useState } from "react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Languages, LockKeyhole, MailCheck, PartyPopper } from "lucide-react";
import { Wordmark } from "./brand-mark";
import { ExpandedText } from "./expanded-text";
import { useLanguage } from "./language-provider";
import { requestJson, errorKey } from "@/lib/client";
import { openSubscriptionCheckout, type SubscriptionPayment } from "@/lib/razorpay-checkout";
import type { TranslationKey } from "@/lib/i18n";
import { landingFont } from "./landing-fonts";
import { BilledNote, CurrencyPicker, loadPrices, rememberedCurrency, type VisitorPrices } from "./currency-picker";
import { formatPrice } from "@/lib/pricing";
import styles from "./guest-checkout.module.css";

type Tier = "monthly" | "yearly";
type Checkout = { checkoutId: string; subscriptionId: string; keyId: string; prefill: { email: string; name: string } };
type Outcome = { status: "active" | "processing" | "conflict"; email: string; newAccount: boolean };

/**
 * Membership checkout for visitors who are not signed in. Payment comes first;
 * the server then finds or creates the account for the email given here.
 */
export function GuestCheckout({ initialTier, enabled, prices: located }: { initialTier: Tier; enabled: boolean; prices: Pick<VisitorPrices, "monthly" | "yearly"> & Partial<VisitorPrices> }) {
  const { t, language, setLanguage } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const [tier, setTier] = useState<Tier>(initialTier);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [notice, setNotice] = useState<TranslationKey | null>(null);
  const [paid, setPaid] = useState<{ checkoutId: string; payment: SubscriptionPayment } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // Priced where the visitor is (on the server); a currency they picked before replaces it.
  const [prices, setPrices] = useState<VisitorPrices>(() => ({ currency: "INR", currencies: ["INR"], rate: 1, ...located, inr: located.inr ?? { monthly: located.monthly, yearly: located.yearly } }));
  useEffect(() => {
    const chosen = rememberedCurrency();
    if (!chosen || chosen === located.currency || !located.currencies?.includes(chosen)) return;
    let live = true;
    loadPrices(chosen).then(next => { if (live) setPrices(current => ({ ...current, ...next })); }, () => {});
    return () => { live = false; };
  }, [located]);
  const switchCurrency = (currency: VisitorPrices["currency"]) => { setError(null); loadPrices(currency).then(next => setPrices(current => ({ ...current, ...next })), caught => setError(errorKey(caught))); };
  const money = (amount: number) => formatPrice(amount, prices.currency, hi);
  const saving = Math.max(0, Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100));
  const json = (body: unknown) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  async function verify(checkoutId: string, payment: SubscriptionPayment) {
    const result = await requestJson<Outcome>("/api/billing/guest", json({ action: "verify", checkoutId, ...payment }));
    setOutcome(current => ({ ...result, newAccount: result.newAccount || Boolean(current?.newAccount) }));
  }

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      const checkout = await requestJson<Checkout>("/api/billing/guest", json({ action: "checkout", tier, currency: prices.currency, email, name }));
      const payment = await openSubscriptionCheckout({ key: checkout.keyId, subscription_id: checkout.subscriptionId, name: "MasterClass", description: tier === "yearly" ? t("yearly") : t("monthly"), prefill: checkout.prefill });
      if (!payment) { setNotice("checkout_closed"); return; }
      setPaid({ checkoutId: checkout.checkoutId, payment });
      await verify(checkout.checkoutId, payment);
    } catch (caught) { setError(errorKey(caught)); } finally { setBusy(false); }
  }

  async function checkAgain() {
    if (!paid) return;
    setBusy(true); setError(null);
    try { await verify(paid.checkoutId, paid.payment); } catch (caught) { setError(errorKey(caught)); } finally { setBusy(false); }
  }

  return <div className={`${styles.page} ${landingFont(language === "hi").variable}`}>
    <header className={styles.top}>
      <Link href="/" className={styles.back}><ArrowLeft size={15} aria-hidden="true" /><ExpandedText text={text("Home", "होम")} /></Link>
      <Link href="/" aria-label="MasterClass" className={styles.brand}><Wordmark /></Link>
      <div className={styles.topActions}>
        <div className={styles.lang} role="group" aria-label={text("Language", "भाषा")}>
          <Languages size={13} aria-hidden="true" />
          <button type="button" aria-pressed={!hi} onClick={() => setLanguage("en", false)}>EN</button>
          <button type="button" lang="hi" aria-pressed={hi} onClick={() => setLanguage("hi", false)}>HI</button>
        </div>
        {!outcome && <Link href="/sign-in" className={styles.signin}><ExpandedText text={text("Sign in", "साइन इन")} /></Link>}
      </div>
    </header>

    <main className={styles.main}>
      {outcome ? <PaymentOutcome outcome={outcome} busy={busy} error={error} onCheckAgain={() => void checkAgain()} text={text} t={t} /> : <>
        <div className={styles.intro}>
          <p className={styles.eyebrow}><LockKeyhole size={13} aria-hidden="true" /><ExpandedText text={text("No account needed to start", "शुरू करने के लिए खाता ज़रूरी नहीं")} /></p>
          <h1><ExpandedText text={text("Start your membership", "अपनी सदस्यता शुरू करें")} /></h1>
          <p><ExpandedText text={text("One membership unlocks every course and category. Pick a plan and pay securely. We set up your account with the email you give here.", "एक सदस्यता से हर कोर्स और श्रेणी खुलती है। योजना चुनें और सुरक्षित भुगतान करें। आपका खाता यहाँ दिए गए ईमेल से बनाया जाएगा।")} /></p>
        </div>

        {!enabled && <p className={styles.banner} role="status"><CircleAlert size={16} aria-hidden="true" /><ExpandedText text={text("Checkout is not enabled yet. Please check back soon.", "भुगतान अभी सक्षम नहीं है। कृपया जल्द फिर देखें।")} /></p>}
        {notice && <p className={styles.banner} role="status"><ExpandedText text={t(notice)} /></p>}
        {error && <p className={`${styles.banner} ${styles.bannerError}`} role="alert"><CircleAlert size={16} aria-hidden="true" /><span><ExpandedText text={t(error)} />{error === "account_exists" && <> <Link href={`/sign-in?email=${encodeURIComponent(email)}`}><ExpandedText text={text("Sign in", "साइन इन")} /></Link></>}</span></p>}

        <form className={styles.layout} onSubmit={pay}>
          <div className={styles.steps}>
            <section className={styles.step} aria-labelledby="step-plan">
              <h2 id="step-plan"><span>1</span><ExpandedText text={text("Choose a plan", "योजना चुनें")} /></h2>
              <CurrencyPicker value={prices.currency} options={prices.currencies} local={prices.local} onChange={switchCurrency} disabled={busy} hi={hi} />
              <div className={styles.plans} role="radiogroup" aria-labelledby="step-plan">
                {(["monthly", "yearly"] as const).map(value => <button key={value} type="button" role="radio" aria-checked={tier === value} className={styles.plan} onClick={() => setTier(value)} disabled={busy}>
                  <span className={styles.planName}><ExpandedText text={value === "monthly" ? text("Monthly", "मासिक") : text("Yearly", "वार्षिक")} />{value === "yearly" && saving > 0 && <em><ExpandedText text={text(`Save ${saving}%`, `${saving}% बचाएँ`)} /></em>}</span>
                  <strong>{money(prices[value])}<small><ExpandedText text={value === "monthly" ? text(" / month", " / माह") : text(" / year", " / वर्ष")} /></small></strong>
                  <small><ExpandedText text={value === "monthly" ? text("Flexible, cancel any time", "लचीला, कभी भी रद्द करें") : text(`${money(prices.yearly / 12)}/month, billed yearly`, `${money(prices.yearly / 12)}/माह, वार्षिक भुगतान`)} /></small>
                  <BilledNote prices={prices} cycle={value} hi={hi} />
                </button>)}
              </div>
            </section>

            <section className={styles.step} aria-labelledby="step-you">
              <h2 id="step-you"><span>2</span><ExpandedText text={text("Your details", "आपका विवरण")} /></h2>
              <div className={styles.fields}>
                <label className={styles.field}><span><ExpandedText text={text("Full name", "पूरा नाम")} /></span><input type="text" autoComplete="name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} disabled={busy} /></label>
                <label className={styles.field}><span><ExpandedText text={text("Email", "ईमेल")} /></span><input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} aria-describedby="guest-email-hint" /></label>
              </div>
              <small id="guest-email-hint" className={styles.hint}><ExpandedText text={text("Your account and receipts use this email. Already have an account? Sign in and subscribe from your dashboard.", "आपका खाता और रसीदें इसी ईमेल पर होंगी। पहले से खाता है? साइन इन करके डैशबोर्ड से सदस्यता लें।")} /></small>
            </section>
          </div>

          <aside className={styles.summary} aria-label={text("Order summary", "ऑर्डर सारांश")}>
            <p className={styles.summaryLabel}>LEARN IN APP</p>
            <p className={styles.summaryPlan}><ExpandedText text={tier === "monthly" ? text("Monthly membership", "मासिक सदस्यता") : text("Yearly membership", "वार्षिक सदस्यता")} /></p>
            <p className={styles.summaryPrice}>{money(prices[tier])}<small><ExpandedText text={tier === "monthly" ? text(" / month", " / माह") : text(" / year", " / वर्ष")} /></small></p>
            <BilledNote prices={prices} cycle={tier} hi={hi} />
            <ul>{[text("Every course & category included", "हर कोर्स और श्रेणी शामिल"), text("Published lessons & worked answers", "प्रकाशित पाठ और हल सहित उत्तर"), text("Timed practice", "समयबद्ध अभ्यास"), text("English / Hindi", "अंग्रेज़ी / हिन्दी")].map(item => <li key={item}><Check size={14} aria-hidden="true" /><ExpandedText text={item} /></li>)}</ul>
            <p className={styles.summaryMeta}><ExpandedText text={text("No course selection needed — focus your dashboard any time after you join.", "कोर्स चुनने की ज़रूरत नहीं — जुड़ने के बाद कभी भी अपना डैशबोर्ड केंद्रित करें।")} /></p>
            <button type="submit" className={styles.pay} disabled={busy || !enabled}>
              <ExpandedText text={busy ? t("loading") : text(`Pay ${money(prices[tier])} securely`, `${money(prices[tier])} सुरक्षित भुगतान करें`)} />{!busy && <ArrowRight size={16} aria-hidden="true" />}
            </button>
            <p className={styles.fine}><ExpandedText text={t("billing_renewal_notice")} /></p>
            <p className={styles.fine}>{hi
              ? <>भुगतान करके आप हमारे <Link href="/terms">नियम और शर्तें</Link>, <Link href="/privacy">गोपनीयता नीति</Link> और <Link href="/refund-policy">रद्दीकरण व रिफ़ंड नीति</Link> स्वीकार करते हैं।</>
              : <>By paying you agree to our <Link href="/terms">Terms &amp; conditions</Link>, <Link href="/privacy">Privacy policy</Link> and <Link href="/refund-policy">Cancellation &amp; refund policy</Link>.</>}</p>
          </aside>
        </form>
      </>}
    </main>
  </div>;
}

function PaymentOutcome({ outcome, busy, error, onCheckAgain, text, t }: { outcome: Outcome; busy: boolean; error: TranslationKey | null; onCheckAgain: () => void; text: (en: string, hi: string) => string; t: (key: TranslationKey) => string }) {
  const signInHref = `/sign-in?email=${encodeURIComponent(outcome.email)}`;
  if (outcome.status === "conflict") return <section className={styles.result}>
    <span className={`${styles.resultIcon} ${styles.resultWarn}`}><CircleAlert size={22} aria-hidden="true" /></span>
    <h1><ExpandedText text={text("This email already has a membership", "इस ईमेल पर पहले से सदस्यता है")} /></h1>
    <p><ExpandedText text={text(`${outcome.email} already has an active membership, so this new one will not renew. Contact support with your payment ID for a refund of this payment.`, `${outcome.email} पर पहले से सक्रिय सदस्यता है, इसलिए यह नई सदस्यता नवीनीकृत नहीं होगी। इस भुगतान की वापसी के लिए अपने भुगतान ID के साथ सहायता से संपर्क करें।`)} /></p>
    <Link className={styles.pay} href={signInHref}><ExpandedText text={text("Sign in", "साइन इन")} /><ArrowRight size={16} aria-hidden="true" /></Link>
  </section>;
  const active = outcome.status === "active";
  return <section className={styles.result}>
    <span className={styles.resultIcon}>{active ? <PartyPopper size={22} aria-hidden="true" /> : <MailCheck size={22} aria-hidden="true" />}</span>
    <h1><ExpandedText text={active ? text("Your membership is active", "आपकी सदस्यता सक्रिय है") : text("Payment received", "भुगतान प्राप्त हुआ")} /></h1>
    <p><ExpandedText text={active
      ? text(`Welcome to MasterClass. Your membership is on the account for ${outcome.email}.`, `MasterClass में स्वागत है। आपकी सदस्यता ${outcome.email} वाले खाते पर है।`)
      : text("Razorpay is confirming your first payment. This usually takes under a minute. Do not pay again.", "Razorpay आपका पहला भुगतान पुष्टि कर रहा है। आमतौर पर एक मिनट से कम लगता है। दोबारा भुगतान न करें।")} /></p>
    {error && <p className={`${styles.banner} ${styles.bannerError}`} role="alert"><ExpandedText text={t(error)} /></p>}
    {!active && <button type="button" className={styles.secondary} disabled={busy} onClick={onCheckAgain}><ExpandedText text={busy ? t("loading") : text("Check again", "फिर जाँचें")} /></button>}
    {outcome.newAccount ? <SignInLink email={outcome.email} text={text} /> : <>
      <p className={styles.hint}><ExpandedText text={text("Sign in to this account to start learning.", "सीखना शुरू करने के लिए इस खाते में साइन इन करें।")} /></p>
      <Link className={styles.pay} href={signInHref}><ExpandedText text={text("Sign in", "साइन इन")} /><ArrowRight size={16} aria-hidden="true" /></Link>
    </>}
  </section>;
}

/**
 * A new account has no password and this browser is not signed in: paying does not prove the
 * buyer owns the email. The sign-in link goes to that inbox, so only its owner can use it.
 */
function SignInLink({ email, text }: { email: string; text: (en: string, hi: string) => string }) {
  const [state, setState] = useState<"sending" | "sent" | "error">("sending");
  const sentOnce = useRef(false);
  async function send() {
    setState("sending");
    try {
      // Loaded on use: the Supabase SDK and its Buffer polyfill are ~250 KB the checkout never needs before payment.
      const { supabaseBrowser } = await import("@/lib/supabase-browser");
      const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback` } });
      setState(error ? "error" : "sent");
    } catch { setState("error"); }
  }
  useEffect(() => { if (sentOnce.current) return; sentOnce.current = true; void send(); });
  return <div className={styles.password}>
    <p className={styles.saved} role="status"><MailCheck size={16} aria-hidden="true" /><ExpandedText text={state === "sending"
      ? text("Sending your sign-in link…", "आपका साइन-इन लिंक भेजा जा रहा है…")
      : state === "sent" ? text(`We emailed a sign-in link to ${email}. Open it on this device to start learning.`, `हमने ${email} पर साइन-इन लिंक भेजा है। सीखना शुरू करने के लिए इसे इसी डिवाइस पर खोलें।`)
      : text("We could not send the sign-in link. Try again, or use “Email me a sign-in link” on the sign-in page.", "साइन-इन लिंक नहीं भेजा जा सका। फिर कोशिश करें, या साइन-इन पेज पर “मुझे साइन-इन लिंक ईमेल करें” चुनें।")} /></p>
    <button type="button" className={styles.secondary} disabled={state === "sending"} onClick={() => void send()}><ExpandedText text={text("Resend link", "लिंक फिर भेजें")} /></button>
  </div>;
}
