"use client";
import { lazy, Suspense, useEffect, useState } from "react";
import type { LandingPrices } from "./landing-page";

// The dialog, carousel and plans load only for a first-time visitor, after the page has settled.
const WelcomePanel = lazy(() => import("./welcome-modal-panel"));
const SEEN_KEY = "mc:welcome:v1";
const DELAY_MS = 2500;

const seen = () => { try { return window.localStorage.getItem(SEEN_KEY) === "1"; } catch { return true; } };
const remember = () => { try { window.localStorage.setItem(SEEN_KEY, "1"); } catch { /* storage blocked: it may show again next visit */ } };

/** First-visit welcome: opens once, about 2.5 s after the landing page loads, unless another dialog is already open. */
export function WelcomeModal({ prices }: { prices: LandingPrices | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (seen() || new URLSearchParams(window.location.search).has("nowelcome")) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== "visible" || document.querySelector("[role=dialog]")) return;
      remember(); setMounted(true); setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return mounted ? <Suspense fallback={null}><WelcomePanel open={open} onOpenChange={setOpen} prices={prices} /></Suspense> : null;
}
