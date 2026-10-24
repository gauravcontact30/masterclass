import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { subscriptionPrice } from "./config";
import { activeSale } from "./festive-sale";
import { CURRENCIES, currencyForCountry, isCurrency, type Currency, type SaleInfo, type ShownPrices } from "@/lib/pricing";

/*
 * The membership price in the visitor's currency. Charges are always the rupee plans; this converts the rupee price
 * at today's exchange rate for display, so a visitor abroad sees exactly what ₹299 is in their money. Rates come
 * from open.er-api.com (daily, includes AED and the Gulf currencies), with Frankfurter (ECB) as a fallback, cached
 * for the day. With INTERNATIONAL_BILLING off, or when no rate can be had, everyone sees rupees.
 */
export const internationalBilling = () => process.env.INTERNATIONAL_BILLING === "true";

type Rates = { rates: Partial<Record<Currency, number>>; date: string | null };
/** Units of each currency per rupee, fetched at most once a day per server cache. */
export async function inrRates(): Promise<Rates> {
  "use cache";
  cacheLife("hours");
  cacheTag("fx-rates");
  const pick = (source: Record<string, unknown>) => Object.fromEntries(CURRENCIES.flatMap(code => typeof source[code] === "number" && source[code] > 0 ? [[code, source[code] as number]] : [])) as Rates["rates"];
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/INR", { signal: AbortSignal.timeout(6_000) });
    const body = await response.json() as { result?: string; rates?: Record<string, unknown>; time_last_update_utc?: string };
    if (response.ok && body.result === "success" && body.rates) return { rates: pick(body.rates), date: body.time_last_update_utc ? new Date(body.time_last_update_utc).toISOString().slice(0, 10) : null };
  } catch { /* try the fallback */ }
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=INR", { signal: AbortSignal.timeout(6_000) });
    const body = await response.json() as { rates?: Record<string, unknown>; date?: string };
    if (response.ok && body.rates) return { rates: pick(body.rates), date: body.date ?? null };
  } catch { /* no rates today */ }
  return { rates: {}, date: null };
}

/** The country Vercel (or a CDN in front of it) located the request in, if any. */
export function requestCountry(headers: Headers) {
  return headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || null;
}
/** The currency for this request: the visitor's choice, else their country's (US dollars where we have no own). */
export function visitorCurrency(headers: Headers, chosen?: string | null): Currency {
  if (!internationalBilling()) return "INR";
  return isCurrency(chosen) ? chosen : currencyForCountry(requestCountry(headers));
}
const round = (value: number, currency: Currency) => currency === "JPY" ? Math.round(value) : Math.round(value * 100) / 100;

/** The prices a visitor sees: converted into their currency, with the rupee amounts billed and the currencies offered. */
export async function visitorPrices(headers: Headers, chosen?: string | null): Promise<ShownPrices & { country: string | null }> {
  const inr = { monthly: subscriptionPrice("monthly"), yearly: subscriptionPrice("yearly") };
  const country = requestCountry(headers);
  const sale = await activeSale().catch(() => null);
  const saleIn = (rate: number, currency: Currency): SaleInfo | null => sale && {
    slug: sale.slug, title: sale.title, titleHi: sale.titleHi, percent: sale.percent, endsAt: sale.endsAt,
    monthly: sale.plans.monthly ? round(sale.plans.monthly.inr * rate, currency) : null, yearly: sale.plans.yearly ? round(sale.plans.yearly.inr * rate, currency) : null,
    inr: { monthly: sale.plans.monthly?.inr ?? null, yearly: sale.plans.yearly?.inr ?? null },
  };
  const base = { currency: "INR" as Currency, ...inr, inr, rate: 1, rateDate: null as string | null, currencies: ["INR"] as Currency[], country, sale: saleIn(1, "INR") };
  if (!internationalBilling()) return base;
  const { rates, date } = await inrRates().catch(() => ({ rates: {}, date: null }) as Rates);
  const currencies = CURRENCIES.filter(code => code === "INR" || rates[code]);
  const wanted = visitorCurrency(headers, chosen);
  const currency = wanted === "INR" || rates[wanted] ? wanted : rates.USD ? "USD" : "INR";
  const rate = currency === "INR" ? 1 : rates[currency]!;
  const local = currencyForCountry(country);
  return { ...base, currency, monthly: round(inr.monthly * rate, currency), yearly: round(inr.yearly * rate, currency), rate, rateDate: date, currencies, local: currencies.includes(local) ? local : undefined, sale: saleIn(rate, currency) };
}
