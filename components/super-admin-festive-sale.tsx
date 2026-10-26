"use client";
import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, CircleAlert, Percent, Save, Sparkles, Ticket } from "lucide-react";
import { requestJson } from "@/lib/client";
import { formatPrice } from "@/lib/pricing";
import { useLanguage } from "./language-provider";
import styles from "./super-admin-festive-sale.module.css";

type Row = { slug: string; title: string; title_hi: string | null; discount_percent: number; starts_at: string; ends_at: string; active: boolean; razorpay_plan_monthly: string | null; razorpay_plan_yearly: string | null; updated_at?: string; updated_by?: string | null };
type Data = { stored: boolean; rows: Row[]; active: { slug: string; plans: Partial<Record<"monthly" | "yearly", { planId: string; inr: number }>> } | null; prices: { monthly: number; yearly: number }; envOffers: { monthly: boolean; yearly: boolean } };

// datetime-local works in the browser's zone; the sale is defined in IST, so convert explicitly.
const IST = 330 * 60_000;
const toInput = (iso: string) => new Date(Date.parse(iso) + IST).toISOString().slice(0, 16);
const fromInput = (value: string) => `${value}:00+05:30`;
const ist = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/**
 * Super Admin → Revenue & billing → Festive sale (lib/server/festive-sale.ts, migration 0035). The discount is charged
 * by Razorpay on every payment through a dedicated recurring plan, so each plan goes live only once its discounted plan id is
 * entered; the status line says which plans are being charged at the sale price right now.
 */
export function SuperAdminFestiveSale() {
  const { language } = useLanguage();
  const [data, setData] = useState<Data | null>(null);
  const [form, setForm] = useState<Row | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  // The window check needs the time; it ticks each minute rather than being read during render.
  const [now, setNow] = useState(0);
  useEffect(() => { const tick = () => setNow(Date.now()); tick(); const timer = window.setInterval(tick, 60_000); return () => window.clearInterval(timer); }, []);
  const load = () => requestJson<Data>("/api/super-admin/festive-sale").then(next => { setData(next); setForm(current => current ?? next.rows[0] ?? null); }).catch(() => setMessage("The festive sale could not be loaded."));
  useEffect(() => { void load(); }, []);

  if (!data || !form) return <section className={styles.panel} aria-busy="true"><p className={styles.muted}>{message || "Loading the festive sale…"}</p></section>;
  const set = <K extends keyof Row>(key: K, value: Row[K]) => { setForm({ ...form, [key]: value }); setState("idle"); };
  const inWindow = Date.parse(form.starts_at) <= now && now < Date.parse(form.ends_at);
  const percent = form.discount_percent, price = (cycle: "monthly" | "yearly") => Math.round(data.prices[cycle] * (100 - percent)) / 100;
  const planStatus = (cycle: "monthly" | "yearly") => {
    const live = data.active?.slug === form.slug && data.active.plans[cycle];
    const offer = (cycle === "monthly" ? form.razorpay_plan_monthly : form.razorpay_plan_yearly) || (form.slug === "diwali-2026" && data.envOffers[cycle] ? "set in environment" : null);
    return { live: Boolean(live), offer, reason: !form.active ? "Sale is switched off" : !inWindow ? (now < Date.parse(form.starts_at) ? "Starts later" : "Ended") : !offer ? "Needs its Razorpay discounted plan id" : live ? "Charging the sale price now" : "Saved settings not live yet" };
  };
  async function save() {
    if (!form) return;
    setState("saving"); setMessage("");
    try {
      await requestJson("/api/super-admin/festive-sale", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, razorpay_plan_monthly: form.razorpay_plan_monthly || null, razorpay_plan_yearly: form.razorpay_plan_yearly || null }) });
      setState("saved"); setData(await requestJson<Data>("/api/super-admin/festive-sale"));
    } catch (error) {
      setState("error"); setMessage(error instanceof Error && /migration_required/.test(error.message) ? "Apply migration 0035 (festive sales) in Supabase first; the campaign cannot be activated without its database table." : "The sale could not be saved. Check the fields and try again.");
    }
  }

  return <section className={styles.panel} aria-labelledby="festive-title">
    <header className={styles.head}>
      <div><p className={styles.kicker}><Sparkles size={14} aria-hidden="true" />Festive sale</p><h2 id="festive-title">{form.title}</h2>
        <p className={styles.muted}>{percent}% off the every payment of Monthly and Yearly · {ist(form.starts_at)} – {ist(form.ends_at)} IST</p></div>
      <label className={styles.switch}><input type="checkbox" checked={form.active} onChange={event => set("active", event.target.checked)} /><span aria-hidden="true" /><b>{form.active ? "Switched on" : "Switched off"}</b></label>
    </header>
    {!data.stored && <p className={styles.warn}><CircleAlert size={15} aria-hidden="true" />Migration 0035 (festive sales) is not applied yet. Apply the migration before enabling the sale.</p>}

    <div className={styles.status}>{(["monthly", "yearly"] as const).map(cycle => { const status = planStatus(cycle); return <div key={cycle} className={styles.plan} data-live={status.live || undefined}>
      {status.live ? <CheckCircle2 size={18} aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}
      <div><b>{cycle === "monthly" ? "Monthly" : "Yearly"} · {formatPrice(price(cycle), "INR")} <s>{formatPrice(data.prices[cycle], "INR")}</s></b><small>{status.reason}</small></div>
    </div>; })}</div>

    <div className={styles.grid}>
      <label><span>Sale name</span><input value={form.title} maxLength={80} onChange={event => set("title", event.target.value)} /></label>
      {language === "hi" && <label><span>Name in Hindi</span><input value={form.title_hi ?? ""} maxLength={80} onChange={event => set("title_hi", event.target.value)} /></label>}
      <label><span><Percent size={13} aria-hidden="true" />Discount on every payment (%)</span><input type="number" min={1} max={90} value={percent} onChange={event => set("discount_percent", Math.max(1, Math.min(90, Number(event.target.value) || 1)))} /></label>
      <label><span><CalendarClock size={13} aria-hidden="true" />Starts (IST)</span><input type="datetime-local" value={toInput(form.starts_at)} onChange={event => event.target.value && set("starts_at", fromInput(event.target.value))} /></label>
      <label><span><CalendarClock size={13} aria-hidden="true" />Ends (IST)</span><input type="datetime-local" value={toInput(form.ends_at)} onChange={event => event.target.value && set("ends_at", fromInput(event.target.value))} /></label>
      <label><span><Ticket size={13} aria-hidden="true" />Razorpay discounted plan id · Monthly</span><input value={form.razorpay_plan_monthly ?? ""} placeholder="plan_XXXXXXXXXXXXXX" onChange={event => set("razorpay_plan_monthly", event.target.value.trim() || null)} /></label>
      <label><span><Ticket size={13} aria-hidden="true" />Razorpay discounted plan id · Yearly</span><input value={form.razorpay_plan_yearly ?? ""} placeholder="plan_XXXXXXXXXXXXXX" onChange={event => set("razorpay_plan_yearly", event.target.value.trim() || null)} /></label>
    </div>
    <details className={styles.help}><summary>Discounted recurring plans</summary>
      <p>Create dedicated Monthly and Yearly Razorpay plans priced at {percent}% below the regular plans. Use their plan IDs above. Saving an active sale validates both prices, INR currency and billing intervals with Razorpay.</p>
      <p>Every renewal retains the discounted plan. Ending this campaign only stops new enrolments; existing subscriptions are unchanged.</p>
    </details>
    <div className={styles.actions}>
      <button type="button" className={styles.save} onClick={() => void save()} disabled={state === "saving"}><Save size={15} aria-hidden="true" />{state === "saving" ? "Saving…" : "Save festive sale"}</button>
      {state === "saved" && <span className={styles.ok} role="status"><CheckCircle2 size={15} aria-hidden="true" />Saved. The landing page and prices update within a minute.</span>}
      {message && <span className={styles.error} role="alert">{message}</span>}
      {form.updated_at && <small className={styles.muted}>Last saved {ist(form.updated_at)}{form.updated_by ? ` by ${form.updated_by}` : ""}</small>}
    </div>
  </section>;
}
