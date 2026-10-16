"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Lock, LockOpen, ShieldCheck } from "lucide-react";
import type { LockedTeaser } from "@/lib/landing-daily-types";
import { openOrderCheckout } from "@/lib/razorpay-checkout";
import pulse from "./landing-ai-pulse.module.css";
import styles from "./landing-locked-card.module.css";

type State = "checking" | "locked" | "paying" | "verifying" | "unlocked" | "unavailable";
const ERRORS: Record<string, [string, string]> = {
  payment_failed: ["The payment did not go through. Nothing was charged; please try again.", "भुगतान पूरा नहीं हुआ। कोई राशि नहीं कटी; फिर कोशिश करें।"],
  payment_unavailable: ["The payment window could not open. Check your connection and try again.", "भुगतान विंडो नहीं खुली। कनेक्शन जाँचें और फिर कोशिश करें।"],
  payment_verification_failed: ["We could not confirm this payment. If you were charged, it will be refunded automatically.", "भुगतान की पुष्टि नहीं हो सकी। राशि कटी हो तो अपने आप लौट आएगी।"],
  card_expired: ["Paid, but this card has rotated out for the day. Your payment is recorded; contact support for a refund.", "भुगतान हो गया, पर यह कार्ड बदल चुका है। भुगतान दर्ज है; रिफ़ंड के लिए सहायता से संपर्क करें।"],
  rate_limited: ["Too many tries. Wait a minute and try again.", "बहुत सारी कोशिशें। एक मिनट बाद फिर कोशिश करें।"],
  setup_required: ["Payments are not available right now.", "भुगतान अभी उपलब्ध नहीं है।"],
};

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/landing/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "service_error");
  return data as T;
}

/**
 * The last card of a landing carousel: blurred and locked until the reader pays ₹2 through Razorpay.
 * The card's content comes from the server only after the payment is verified (or was bought before),
 * and then renders exactly like its neighbours through `render`.
 */
export function LockedCard({ teaser, index, total, text, render }: { teaser: LockedTeaser; index: number; total: number; text: (en: string, hindi: string) => string; render: (card: unknown) => ReactNode }) {
  const [state, setState] = useState<State>("checking");
  const [card, setCard] = useState<unknown>(null);
  const [price, setPrice] = useState(2);
  const [error, setError] = useState("");

  // A card bought earlier (this browser, or this account on another device) opens straight away.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/landing/unlock?${new URLSearchParams({ kind: teaser.kind, day: teaser.day, id: teaser.id })}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.card) { setCard(data.card); setState("unlocked"); return; }
        if (typeof data.price === "number") setPrice(data.price);
        setState(data.available === false ? "unavailable" : "locked");
      })
      .catch(() => { if (!controller.signal.aborted) setState("locked"); });
    return () => controller.abort();
  }, [teaser.kind, teaser.day, teaser.id]);

  async function unlock() {
    setError(""); setState("paying");
    try {
      const order = await post<{ unlocked?: boolean; card?: unknown; key: string; order_id: string; amount: number; currency: string; name: string; description: string }>({ action: "order", kind: teaser.kind, day: teaser.day, id: teaser.id });
      if (order.unlocked && order.card) { setCard(order.card); setState("unlocked"); return; }
      const payment = await openOrderCheckout({ key: order.key, order_id: order.order_id, amount: order.amount, currency: order.currency, name: order.name, description: order.description });
      if (!payment) { setState("locked"); return; }
      setState("verifying");
      const result = await post<{ card: unknown }>({ action: "verify", ...payment });
      setCard(result.card); setState("unlocked");
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      const [en, hi] = ERRORS[code] ?? ["Something went wrong. Please try again.", "कुछ गलत हुआ। फिर कोशिश करें।"];
      setError(text(en, hi)); setState("locked");
    }
  }

  if (state === "unlocked" && card) return <>{render(card)}</>;
  const busy = state === "paying" || state === "verifying" || state === "checking";
  return <li className={`${pulse.card} ${styles.locked}`} data-tone={teaser.tone} aria-roledescription="slide" aria-label={`${index + 1} / ${total}: ${text("Locked card", "लॉक कार्ड")}`}>
    <div className={styles.picture}>
      {teaser.image && /* eslint-disable-next-line @next/next/no-img-element -- the same pre-sized picture as the open cards, blurred. */
        <img src={teaser.image} alt="" loading="lazy" decoding="async" />}
      <span className={styles.ribbon}><Lock size={12} aria-hidden="true" />{text("Bonus card", "बोनस कार्ड")}</span>
    </div>
    <div className={styles.body}>
      {/* Stand-in lines, blurred: the real content is not on the page until it is unlocked. */}
      <div className={styles.ghost} aria-hidden="true">
        <span className={styles.ghostTag}>{teaser.tag}</span>
        <span className={styles.ghostTitle}>{teaser.kind === "pulse" ? teaser.title : "Wordsmith"}</span>
        {Array.from({ length: 9 }, (_, i) => <span key={i} className={styles.ghostLine} style={{ width: `${[96, 88, 72, 94, 80, 66, 90, 76, 58][i]}%` }} />)}
      </div>
      <div className={styles.overlay}>
        <span className={styles.lockBadge} aria-hidden="true">{state === "verifying" ? <LockOpen size={22} /> : <Lock size={22} />}</span>
        <p className={styles.kicker}>{text("Today's bonus", "आज का बोनस")} · {teaser.tag}</p>
        <h3 className={styles.title}>{teaser.kind === "pulse" ? teaser.title : text("A bonus word, with its picture, sounds and pairs", "एक बोनस शब्द: चित्र, उच्चारण और जोड़े")}</h3>
        <p className={styles.copy}>{text(`Unlock this card for ₹${price}: the full lesson, opened instantly in this browser${teaser.kind === "pulse" ? "" : ""}.`, `₹${price} में यह कार्ड खोलें: पूरा पाठ, तुरंत इसी ब्राउज़र में।`)}</p>
        {state === "unavailable"
          ? <p className={styles.note}>{text("Unlocking is not available right now.", "अभी अनलॉक उपलब्ध नहीं है।")}</p>
          : <button type="button" className={styles.unlock} disabled={busy} onClick={() => void unlock()}>
            <Lock size={15} aria-hidden="true" />
            {state === "checking" ? text("Checking…", "जाँच हो रही है…") : state === "paying" ? text("Opening payment…", "भुगतान खुल रहा है…") : state === "verifying" ? text("Confirming payment…", "भुगतान की पुष्टि…") : text(`Unlock for ₹${price}`, `₹${price} में अनलॉक करें`)}
          </button>}
        <p className={styles.secure}><ShieldCheck size={13} aria-hidden="true" />{text("One-time · secure payment by Razorpay · UPI, cards, netbanking", "एक बार · Razorpay द्वारा सुरक्षित भुगतान · UPI, कार्ड, नेटबैंकिंग")}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </div>
  </li>;
}
