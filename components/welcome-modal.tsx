"use client";
import { lazy, Suspense, useEffect, useState } from "react";
import type { LandingPrices } from "./landing-page";
import type { Currency } from "@/lib/pricing";

// The dialog, carousel and plans load only for a first-time visitor, after the page has settled.
const loadPanel = () => import("./welcome-modal-panel");
const WelcomePanel = lazy(loadPanel);
const SEEN_KEY = "mc:welcome:v1";
const DELAY_MS = 3000;
const RETRY_MS = 4000;

const seen = () => { try { return window.localStorage.getItem(SEEN_KEY) === "1"; } catch { return false; } };
const remember = () => { try { window.localStorage.setItem(SEEN_KEY, "1"); } catch { /* storage blocked: it may show again next visit */ } };
/** Another modal is open (Suggestion Box, a lesson preview…): wait rather than stack on top of it. */
const busy = () => !!document.querySelector("[role=dialog]:not([hidden]), dialog[open], [aria-modal=true]");

/**
 * First-visit welcome: opens once, three seconds after the visitor first scrolls, taps or types. Waiting for that
 * first input keeps its large photo from becoming the page's Largest Contentful Paint, which browsers stop measuring
 * at the first input. If the tab is hidden or another dialog is open at that moment it waits and tries again,
 * instead of giving up. `?welcome` always shows it, three seconds after load.
 */
export function WelcomeModal({ prices, onCurrency }: { prices: LandingPrices | null; onCurrency?: (currency: Currency) => void }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("nowelcome") || (seen() && !params.has("welcome"))) return;
    let timer = 0;
    const attempt = () => {
      if (document.visibilityState !== "visible" || busy()) { timer = window.setTimeout(attempt, RETRY_MS); return; }
      void loadPanel().then(() => { remember(); setMounted(true); setOpen(true); });
    };
    if (params.has("welcome")) { timer = window.setTimeout(attempt, DELAY_MS); return () => window.clearTimeout(timer); }
    const inputs = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;
    const arm = () => { inputs.forEach(type => window.removeEventListener(type, arm)); timer = window.setTimeout(attempt, DELAY_MS); };
    inputs.forEach(type => window.addEventListener(type, arm, { once: true, passive: true }));
    return () => { inputs.forEach(type => window.removeEventListener(type, arm)); window.clearTimeout(timer); };
  }, []);
  return mounted ? <Suspense fallback={null}><WelcomePanel open={open} onOpenChange={setOpen} prices={prices} onCurrency={onCurrency} /></Suspense> : null;
}
