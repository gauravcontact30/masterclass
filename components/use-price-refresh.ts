"use client";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import { loadPrices } from "./currency-picker";
import type { Currency, SaleInfo } from "@/lib/pricing";

/** Refresh campaigns on focus, once a minute, and exactly when the displayed campaign expires. */
export function usePriceRefresh<T extends { monthly:number; yearly:number; currency?:Currency; sale?:SaleInfo|null }>(prices:T, setPrices:Dispatch<SetStateAction<T>>) {
  const currency = prices.currency;
  const endsAt = prices.sale?.endsAt;
  useEffect(() => {
    let live = true;
    const refresh = () => { void loadPrices(currency).then(next => { if (live) setPrices(previous => ({ ...previous, ...next })); }).catch(() => {}); };
    const interval = window.setInterval(refresh, 60_000);
    const expiry = endsAt ? window.setTimeout(() => {
      if (live) setPrices(previous => ({ ...previous, sale:null }));
      refresh();
    }, Math.min(2_147_483_647, Math.max(0, Date.parse(endsAt) - Date.now()))) : undefined;
    window.addEventListener("focus", refresh);
    return () => { live = false; window.clearInterval(interval); window.clearTimeout(expiry); window.removeEventListener("focus", refresh); };
  }, [currency, endsAt, setPrices]);
}
