"use client";
import { useId } from "react";
import { Globe2 } from "lucide-react";
import { requestJson } from "@/lib/client";
import { CURRENCY_LABELS, formatPrice, isCurrency, type Currency, type ShownPrices } from "@/lib/pricing";
import styles from "./currency-picker.module.css";

/*
 * The currency prices are shown in. The server picks it from the visitor's country; this picker lets them choose
 * another (it only appears when there is more than one), and the choice is remembered in this browser. Charges are
 * always in rupees, so wherever a converted price shows, BilledNote says what is actually billed.
 */
export type VisitorPrices = ShownPrices & { enabled?: boolean; proLimit?: number };
const KEY = "masterclass:currency";

export function rememberedCurrency(): Currency | null {
  try { const value = localStorage.getItem(KEY); return isCurrency(value) ? value : null; } catch { return null; }
}
function remember(currency: Currency) {
  try { localStorage.setItem(KEY, currency); } catch { /* storage unavailable: the choice lasts this visit */ }
}
/** Prices from /api/billing in `currency`, or in the remembered choice, or wherever the visitor is. */
export function loadPrices(currency: Currency | null = rememberedCurrency()) {
  return requestJson<VisitorPrices & { enabled: boolean }>(`/api/billing${currency ? `?currency=${currency}` : ""}`);
}

export function CurrencyPicker({ value, options, onChange, disabled, hi = false }: { value: Currency; options?: Currency[]; onChange: (currency: Currency) => void; disabled?: boolean; hi?: boolean }) {
  const id = useId();
  if (!options || options.length < 2) return null;
  return <div className={styles.picker}>
    <label htmlFor={id}><Globe2 size={14} aria-hidden="true" />{hi ? "मुद्रा" : "Currency"}</label>
    <select id={id} value={value} disabled={disabled} onChange={event => { const next = event.target.value; if (isCurrency(next)) { remember(next); onChange(next); } }}>
      {options.map(currency => <option key={currency} value={currency}>{CURRENCY_LABELS[currency]}</option>)}
    </select>
  </div>;
}

/** "Billed as ₹299 / month · converted at today's rate", under a converted price; nothing for rupees. */
export function BilledNote({ prices, cycle, hi = false, className }: { prices: Partial<Pick<ShownPrices, "currency" | "inr">>; cycle: "monthly" | "yearly"; hi?: boolean; className?: string }) {
  if (!prices.currency || prices.currency === "INR" || !prices.inr) return null;
  const inr = formatPrice(prices.inr[cycle], "INR", hi);
  return <small className={`${styles.billed} ${className ?? ""}`}>{hi
    ? `${inr} ${cycle === "monthly" ? "/ माह" : "/ वर्ष"} के रूप में बिल · आज की दर से बदला गया, आपका बैंक थोड़ी अलग दर लगा सकता है`
    : `Billed as ${inr} ${cycle === "monthly" ? "/ month" : "/ year"} · converted at today's rate; your bank's rate may differ slightly`}</small>;
}
