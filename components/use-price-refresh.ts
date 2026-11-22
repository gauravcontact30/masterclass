"use client";
import { startTransition, useEffect, type Dispatch, type SetStateAction } from "react";
import { loadPrices } from "./currency-picker";
import type { Currency } from "@/lib/pricing";

/** Keeps the same object when nothing changed, so React skips the render: most refreshes return the same prices. */
export function mergePrices<T extends object>(previous: T, next: object): T {
  const merged = { ...previous, ...next } as T;
  return JSON.stringify(merged) === JSON.stringify(previous) ? previous : merged;
}

/** Refresh prices on focus and once a minute while the tab is showing. */
export function usePriceRefresh<T extends { monthly:number; yearly:number; currency?:Currency }>(prices:T, setPrices:Dispatch<SetStateAction<T>>) {
  const currency = prices.currency;
  useEffect(() => {
    let live = true;
    const refresh = () => {
      if (document.hidden) return;
      // A transition: a background price check must never delay a tap.
      void loadPrices(currency).then(next => { if (live) startTransition(() => setPrices(previous => mergePrices(previous, next))); }).catch(() => {});
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { live = false; window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [currency, setPrices]);
}
