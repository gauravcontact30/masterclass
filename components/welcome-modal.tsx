"use client";
import { lazy, Suspense, useEffect, useState } from "react";
import type { LandingPrices } from "./landing-page";

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
 * First-visit welcome: opens once, three seconds after the landing page loads. If the tab is hidden or another
 * dialog is open at that moment it waits and tries again, instead of giving up. `?welcome` always shows it.
 */
export function WelcomeModal({ prices }: { prices: LandingPrices | null }) {
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
    timer = window.setTimeout(attempt, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return mounted ? <Suspense fallback={null}><WelcomePanel open={open} onOpenChange={setOpen} prices={prices} /></Suspense> : null;
}
