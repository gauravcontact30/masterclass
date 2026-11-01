"use client";
import { startTransition, useEffect, type Dispatch, type SetStateAction } from "react";
import { loadPrices } from "./currency-picker";
import type { Currency, SaleInfo } from "@/lib/pricing";

/** Keeps the same object when nothing changed, so React skips the render: most refreshes return the same prices. */
export function mergePrices<T extends object>(previous: T, next: object): T {
  const merged = { ...previous, ...next } as T;
  return JSON.stringify(merged) === JSON.stringify(previous) ? previous : merged;
}

/** Refresh campaigns on focus, once a minute while the tab is showing, and exactly when the displayed campaign expires. */
export function usePriceRefresh<T extends { monthly:number; yearly:number; currency?:Currency; sale?:SaleInfo|null }>(prices:T, setPrices:Dispatch<SetStateAction<T>>) {
  const currency = prices.currency;
  const endsAt = prices.sale?.endsAt;
  useEffect(() => {
    let live = true;
    const refresh = () => {
      if (document.hidden) return;
      // A transition: a background price check must never delay a tap.
      void loadPrices(currency).then(next => { if (live) startTransition(() => setPrices(previous => mergePrices(previous, next))); }).catch(() => {});
    };
    const interval = window.setInterval(refresh, 60_000);
    const expiry = endsAt ? window.setTimeout(() => {
      if (live) setPrices(previous => ({ ...previous, sale:null }));
      refresh();
    }, Math.min(2_147_483_647, Math.max(0, Date.parse(endsAt) - Date.now()))) : undefined;
    window.addEventListener("focus", refresh);
    return () => { live = false; window.clearInterval(interval); window.clearTimeout(expiry); window.removeEventListener("focus", refresh); };
  }, [currency, endsAt, setPrices]);
}
