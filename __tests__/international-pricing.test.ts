/** @jest-environment node */
import { currencyForCountry, formatPrice } from "@/lib/pricing";
import { visitorCurrency, visitorPrices } from "@/lib/server/pricing";

// The daily rate lookup is cached with Next's "use cache"; tests give it fixed rates instead.
jest.mock("next/cache", () => ({ cacheLife: jest.fn(), cacheTag: jest.fn() }));
const env = { ...process.env };
const geo = (country?: string) => new Headers(country ? { "x-vercel-ip-country": country } : {});
const rates = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, AED: 0.044, JPY: 1.8 };
beforeEach(() => {
  process.env = { ...env, PRO_MONTHLY_PRICE_INR: "299", PRO_YEARLY_PRICE_INR: "2999", INTERNATIONAL_BILLING: "true" };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ result: "success", rates, time_last_update_utc: "Wed, 21 Oct 2026 00:02:32 +0000" }) });
});
afterAll(() => { process.env = env; });

describe("international pricing", () => {
  it("maps countries to their currency, US dollars elsewhere, rupees in India", () => {
    expect(currencyForCountry("IN")).toBe("INR");
    expect(currencyForCountry("de")).toBe("EUR");
    expect(currencyForCountry("AE")).toBe("AED");
    expect(currencyForCountry("BR")).toBe("USD");
    expect(currencyForCountry(null)).toBe("INR");
  });
  it("shows the exact converted price with the rupee amount billed", async () => {
    const prices = await visitorPrices(geo("GB"));
    expect(prices).toMatchObject({ currency: "GBP", monthly: 2.84, yearly: 28.49, inr: { monthly: 299, yearly: 2999 }, rateDate: "2026-10-21" });
    expect(prices.currencies).toEqual(["INR", "USD", "EUR", "GBP", "AED", "JPY"]);
    expect(await visitorPrices(geo("JP"))).toMatchObject({ currency: "JPY", monthly: 538 });
  });
  it("honours the picker, falls back to dollars without a rate, and stays in rupees in India", async () => {
    expect(await visitorPrices(geo("IN"))).toMatchObject({ currency: "INR", monthly: 299, yearly: 2999 });
    expect(await visitorPrices(geo("IN"), "EUR")).toMatchObject({ currency: "EUR", monthly: 3.29 });
    expect(await visitorPrices(geo("ZA"))).toMatchObject({ currency: "USD", monthly: 3.59 });
  });
  it("shows rupees to everyone when international billing is off or no rates can be had", async () => {
    delete process.env.INTERNATIONAL_BILLING;
    expect(visitorCurrency(geo("US"))).toBe("INR");
    expect(await visitorPrices(geo("US"))).toMatchObject({ currency: "INR", monthly: 299, currencies: ["INR"] });
    process.env.INTERNATIONAL_BILLING = "true";
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
    expect(await visitorPrices(geo("US"))).toMatchObject({ currency: "INR", monthly: 299 });
  });
  it("formats rupees and yen whole and other currencies to the cent", () => {
    expect(formatPrice(299, "INR")).toBe("₹299");
    expect(formatPrice(2999 / 12, "INR")).toBe("₹249.92");
    expect(formatPrice(224.25, "INR")).toBe("₹224.25");
    expect(formatPrice(3.15, "USD")).toBe("$3.15");
    expect(formatPrice(3, "USD")).toBe("$3.00");
  });
});
