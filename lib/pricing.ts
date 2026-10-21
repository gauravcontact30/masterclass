/*
 * Membership prices in the visitor's currency. Every membership is charged in rupees (PRO_*_PRICE_INR on the
 * server, Razorpay plans in INR); a visitor elsewhere sees the exact amount converted at today's exchange rate in
 * their own currency, beside the rupee amount actually billed, and their card's bank converts the charge. The
 * currency comes from the visitor's country, and a picker lets them choose another. Client-safe: the landing page
 * formats these.
 */
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD", "JPY", "CHF", "SAR", "QAR", "NZD", "ZAR", "MYR", "NPR", "LKR", "BDT"] as const;
export type Currency = (typeof CURRENCIES)[number];
export type Cycle = "monthly" | "yearly";
export const isCurrency = (value: unknown): value is Currency => typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);

export const CURRENCY_LABELS: Record<Currency, string> = {
  INR: "₹ INR · Indian rupee", USD: "$ USD · US dollar", EUR: "€ EUR · Euro", GBP: "£ GBP · British pound", AED: "AED · UAE dirham",
  SGD: "S$ SGD · Singapore dollar", CAD: "C$ CAD · Canadian dollar", AUD: "A$ AUD · Australian dollar", JPY: "¥ JPY · Japanese yen",
  CHF: "CHF · Swiss franc", SAR: "SAR · Saudi riyal", QAR: "QAR · Qatari riyal", NZD: "NZ$ NZD · New Zealand dollar", ZAR: "R ZAR · South African rand",
  MYR: "RM MYR · Malaysian ringgit", NPR: "NPR · Nepalese rupee", LKR: "LKR · Sri Lankan rupee", BDT: "৳ BDT · Bangladeshi taka",
};

// Eurozone members (ISO 3166-1 alpha-2), plus the European microstates that use the euro.
const EURO = "AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES AD MC SM VA ME XK".split(" ");
const BY_COUNTRY: Record<string, Currency> = {
  IN: "INR", US: "USD", GB: "GBP", AE: "AED", SG: "SGD", CA: "CAD", AU: "AUD", JP: "JPY", CH: "CHF", LI: "CHF", SA: "SAR", QA: "QAR",
  NZ: "NZD", ZA: "ZAR", MY: "MYR", NP: "NPR", LK: "LKR", BD: "BDT", ...Object.fromEntries(EURO.map(code => [code, "EUR" as const])),
};
/** The currency a country uses where we show it, US dollars for any other country, rupees in India or when unknown. */
export function currencyForCountry(country: string | null | undefined): Currency {
  const code = country?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return "INR";
  return BY_COUNTRY[code] ?? "USD";
}

/** Currencies with no minor unit in everyday prices. */
const WHOLE: readonly Currency[] = ["INR", "JPY"];
/** "₹299", "₹250", "$3.58", "€3.29", "¥538": rupees and yen whole, everything else to the cent, as converted. */
export function formatPrice(amount: number, currency: Currency = "INR", hi = false) {
  const digits = WHOLE.includes(currency) ? 0 : 2;
  return new Intl.NumberFormat(hi ? "hi-IN" : "en-IN", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
}
/** Prices as the client receives them: in `currency`, and the rupee amounts actually billed. */
export type ShownPrices = { currency: Currency; monthly: number; yearly: number; inr: Record<Cycle, number>; rate: number; rateDate?: string | null; currencies: Currency[] };
