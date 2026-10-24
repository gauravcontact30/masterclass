/** @jest-environment node */
import { activeSale, forgetFestiveSales, saleOffer, type FestiveSaleRow } from "@/lib/server/festive-sale";
import { visitorPrices } from "@/lib/server/pricing";
import { CURRENCIES } from "@/lib/pricing";
import { db } from "@/lib/server/db";
jest.mock("@/lib/server/db", () => ({ db:jest.fn() }));
jest.mock("next/cache", () => ({ cacheLife:jest.fn(), cacheTag:jest.fn() }));
let row:FestiveSaleRow;
beforeEach(() => {
  forgetFestiveSales();
  process.env.PRO_MONTHLY_PRICE_INR = "299";
  process.env.PRO_YEARLY_PRICE_INR = "2999";
  process.env.INTERNATIONAL_BILLING = "true";
  row = { slug:"diwali-2026", title:"Diwali", title_hi:null, discount_percent:25, active:true, starts_at:"2020-01-01T00:00:00Z", ends_at:"2090-01-01T00:00:00Z", razorpay_plan_monthly:"plan_monthlySale", razorpay_plan_yearly:"plan_yearlySale" };
  jest.mocked(db).mockReturnValue({ from:() => ({ select:() => ({ order:async () => ({ data:[row], error:null }) }) }) } as never);
  global.fetch = jest.fn().mockResolvedValue({ ok:true, json:async () => ({ result:"success", rates:Object.fromEntries(CURRENCIES.map(c => [c, c === "INR" ? 1 : c === "JPY" ? 1.8 : 0.012])) }) });
});
test("both plans receive whole integer prices without fractions", async () => {
  expect((await activeSale())?.plans).toEqual({ monthly:{ planId:"plan_monthlySale", inr:225 }, yearly:{ planId:"plan_yearlySale", inr:2250 } });
});
test.each(CURRENCIES)("%s uses the same discounted INR charge with converted display", async currency => {
  const prices = await visitorPrices(new Headers(), currency);
  expect(prices.currency).toBe(currency);
  expect(prices.sale?.inr).toEqual({ monthly:225, yearly:2250 });
  const round = (n:number) => currency === "JPY" ? Math.round(n) : Math.round(n*100)/100;
  expect(prices.sale?.monthly).toBe(round(225*prices.rate));
  expect(prices.sale?.yearly).toBe(round(2250*prices.rate));
});
test("sale starts inclusively and ends exclusively", async () => {
  expect(await activeSale(Date.parse(row.starts_at)-1)).toBeNull();
  expect(await activeSale(Date.parse(row.starts_at))).not.toBeNull();
  expect(await activeSale(Date.parse(row.ends_at))).toBeNull();
});
test("checkout bypasses cached campaign after admin disables it", async () => {
  await activeSale();
  row = { ...row, active:false };
  expect(await saleOffer("monthly")).toBeNull();
});
test("database failure cannot silently charge full price", async () => {
  jest.mocked(db).mockImplementation(() => { throw new Error("offline"); });
  await expect(saleOffer("monthly")).rejects.toThrow("festive_sale_unavailable");
});
