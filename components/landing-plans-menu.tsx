"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, Crown } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./landing-home.module.css";
import { formatPrice, type Currency } from "@/lib/pricing";
import { BilledNote, CurrencyPicker } from "./currency-picker";

type Cycle = "monthly" | "yearly";
const CYCLES: Cycle[] = ["monthly", "yearly"];

/**
 * The navbar's "Subscribe" dropdown: Monthly / Yearly tabs over one plan card,
 * each linking straight into guest checkout with that plan preselected.
 * Prices are null until the landing page has loaded them, and show as "—".
 */
export type PlansMenuPrices = { monthly: number; yearly: number; currency?: Currency; currencies?: Currency[]; local?: Currency; inr?: { monthly: number; yearly: number } };
export function LandingPlansMenu({ prices, open, onOpenChange, onCurrency }: { prices: PlansMenuPrices | null; open: boolean; onOpenChange: (open: boolean) => void; onCurrency?: (currency: Currency) => void }) {
  const { language } = useLanguage();
  const hi = language === "hi";
  const text = (en: string, hindi: string) => hi ? hindi : en;
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const money = (value: number) => formatPrice(value, prices?.currency, hi);
  const savings = prices && prices.monthly > 0 ? Math.max(0, Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100)) : 0;

  // Closes on Escape (returning focus to the trigger) and on any click outside. The currency list is portalled to
  // <body>, so a click or Escape in it belongs to the menu and must not close it.
  useEffect(() => {
    if (!open) return;
    const inCurrencyList = (target: EventTarget | null) => target instanceof Element && !!target.closest('[data-slot="select-content"]');
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape" && !inCurrencyList(event.target)) { onOpenChange(false); buttonRef.current?.focus(); } };
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node) && !inCurrencyList(event.target)) onOpenChange(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open, onOpenChange]);

  // Arrow keys, Home and End move between tabs, as in the WAI-ARIA tabs pattern.
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const index = CYCLES.indexOf(cycle);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: CYCLES.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = CYCLES[(next + CYCLES.length) % CYCLES.length];
    setCycle(target);
    document.getElementById(`${id}-tab-${target}`)?.focus();
  }

  return <div ref={rootRef} className={styles.plans}>
    <button ref={buttonRef} type="button" className={styles.plansButton} aria-label={text("Subscribe", "सदस्यता")} aria-expanded={open} aria-controls={`${id}-menu`} onClick={() => onOpenChange(!open)}>
      <Crown size={16} strokeWidth={2} aria-hidden="true" /><span aria-hidden="true">{text("Subscribe", "सदस्यता")}</span>
    </button>
    {open && <div id={`${id}-menu`} className={styles.plansMenu} role="group" aria-label={text("Membership plans", "सदस्यता योजनाएँ")}>
      <div className={styles.plansTabs} role="tablist" aria-label={text("Billing period", "भुगतान अवधि")}>
        {CYCLES.map(value => <button key={value} id={`${id}-tab-${value}`} type="button" role="tab" aria-selected={cycle === value} aria-controls={`${id}-panel`} tabIndex={cycle === value ? 0 : -1}
          onClick={() => setCycle(value)} onKeyDown={onTabKey}>
          {value === "monthly" ? text("Monthly", "मासिक") : text("Yearly", "वार्षिक")}
          {value === "yearly" && savings > 0 && <span>{text(`Save ${savings}%`, `${savings}% बचत`)}</span>}
        </button>)}
      </div>
      <div id={`${id}-panel`} className={styles.plansPanel} role="tabpanel" aria-labelledby={`${id}-tab-${cycle}`}>
        {prices && onCurrency && prices.currency && <CurrencyPicker value={prices.currency} options={prices.currencies} local={prices.local} onChange={onCurrency} hi={hi} />}
        <p className={styles.plansPrice}>{prices ? money(prices[cycle]) : "—"}<small>{cycle === "monthly" ? text("/ month", "/ माह") : text("/ year", "/ वर्ष")}</small></p>
        <p className={styles.plansNote}>{cycle === "yearly" && prices
          ? text(`${money(prices.yearly / 12)}/month equivalent, billed yearly.`, `${money(prices.yearly / 12)}/माह के बराबर, वार्षिक भुगतान।`)
          : text("Billed monthly. Cancel renewal any time.", "मासिक भुगतान। नवीनीकरण कभी भी रद्द करें।")}</p>
        {prices && <BilledNote prices={prices} cycle={cycle} hi={hi} />}
        <ul>{[text("Every course & category", "हर कोर्स और श्रेणी"), text("Notes, worked answers & practice", "नोट्स, हल सहित उत्तर और अभ्यास"), text("English / Hindi", "अंग्रेज़ी / हिन्दी")].map(item => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul>
        <Link className={styles.plansCta} href={`/subscribe?plan=${cycle}`} onClick={() => onOpenChange(false)}>
          {cycle === "monthly" ? text("Subscribe monthly", "मासिक सदस्यता लें") : text("Subscribe yearly", "वार्षिक सदस्यता लें")}<ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>}
  </div>;
}
