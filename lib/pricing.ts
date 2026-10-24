/*
 * Membership prices in the visitor's currency. Every membership is charged in rupees (PRO_*_PRICE_INR on the
 * server, Razorpay plans in INR); a visitor elsewhere sees the exact amount converted at today's exchange rate in
 * their own currency, beside the rupee amount actually billed, and their card's bank converts the charge. The
 * currency comes from the visitor's country, and a picker lets them choose another. Client-safe: the landing page
 * formats these.
 */
// The ten most used currencies for this audience, rupees first (the default). A visitor whose country uses another
// currency sees US dollars.
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SAR", "SGD", "CAD", "AUD", "JPY"] as const;
export type Currency = (typeof CURRENCIES)[number];
export type Cycle = "monthly" | "yearly";
export const isCurrency = (value: unknown): value is Currency => typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);

export const CURRENCY_INFO: Record<Currency, { symbol: string; name: string; hiName: string }> = {
  INR: { symbol: "₹", name: "Indian rupee", hiName: "भारतीय रुपया" }, USD: { symbol: "$", name: "US dollar", hiName: "अमेरिकी डॉलर" },
  EUR: { symbol: "€", name: "Euro", hiName: "यूरो" }, GBP: { symbol: "£", name: "British pound", hiName: "ब्रिटिश पाउंड" },
  AED: { symbol: "د.إ", name: "UAE dirham", hiName: "यूएई दिरहम" }, SAR: { symbol: "﷼", name: "Saudi riyal", hiName: "सऊदी रियाल" },
  SGD: { symbol: "S$", name: "Singapore dollar", hiName: "सिंगापुर डॉलर" }, CAD: { symbol: "C$", name: "Canadian dollar", hiName: "कनाडाई डॉलर" },
  AUD: { symbol: "A$", name: "Australian dollar", hiName: "ऑस्ट्रेलियाई डॉलर" }, JPY: { symbol: "¥", name: "Japanese yen", hiName: "जापानी येन" },
};

// Eurozone members (ISO 3166-1 alpha-2), plus the European microstates that use the euro.
const EURO = "AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES AD MC SM VA ME XK".split(" ");
const BY_COUNTRY: Record<string, Currency> = {
  // Nepal and Bhutan peg to the rupee, which is accepted there.
  IN: "INR", NP: "INR", BT: "INR", US: "USD", GB: "GBP", AE: "AED", SA: "SAR", SG: "SGD", CA: "CAD", AU: "AUD", JP: "JPY",
  ...Object.fromEntries(EURO.map(code => [code, "EUR" as const])),
};
/** The currency a country uses where we show it, US dollars for any other country, rupees in India or when unknown. */
export function currencyForCountry(country: string | null | undefined): Currency {
  const code = country?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return "INR";
  return BY_COUNTRY[code] ?? "USD";
}

/** Currencies with no minor unit in everyday prices. */
const WHOLE: readonly Currency[] = ["INR", "JPY"];
/**
 * "₹299", "₹250", "$3.58", "€3.29", "¥538": rupees and yen whole, everything else to the cent, as converted. A rupee
 * amount with paise (a sale price such as ₹224.25) keeps them, because that is exactly what Razorpay charges.
 */
export function formatPrice(amount: number, currency: Currency = "INR", hi = false) {
  const digits = currency === "INR" && !Number.isInteger(Math.round(amount * 100) / 100) ? 2 : WHOLE.includes(currency) ? 0 : 2;
  return new Intl.NumberFormat(hi ? "hi-IN" : "en-IN", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
}
/** Prices as the client receives them: in `currency`, and the rupee amounts actually billed. */
/** `local`: the currency of the country the visitor was located in, marked in the picker. */
export type ShownPrices = { currency: Currency; monthly: number; yearly: number; inr: Record<Cycle, number>; rate: number; rateDate?: string | null; currencies: Currency[]; local?: Currency; sale?: SaleInfo | null };
/**
 * A festive sale in force (lib/server/festive-sale.ts): a percentage off EVERY payment. `monthly`/`yearly` are the
 * discounted recurring payments in the shown currency and `inr` in rupees as charged; null for a plan not on sale.
 */
export type SaleInfo = { slug: string; title: string; titleHi: string; percent: number; endsAt: string; monthly: number | null; yearly: number | null; inr: Record<Cycle, number | null> };
/**
 * The sale price of a plan, or null. The server only sends a sale while it is in force; pass `now` (from an effect or
 * timer, never during render) to also drop it once its end time has passed in this browser.
 */
export function salePrice(sale: SaleInfo | null | undefined, cycle: Cycle, now?: number) {
  if (!sale || (now != null && now >= Date.parse(sale.endsAt))) return null;
  return sale[cycle];
}
