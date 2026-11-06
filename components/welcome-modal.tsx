"use client";
import { lazy, Suspense, useEffect, useState } from "react";

// The dialog's code loads only when it is about to open, ten seconds after the landing page loads.
const loadPanel = () => import("./welcome-modal-panel");
const WelcomePanel = lazy(loadPanel);
// v2: the redesigned welcome (2026-11-06) shows once to visitors who saw the old one too.
const SEEN_KEY = "mc:welcome:v2";
const DELAY_MS = 10_000;
const RETRY_MS = 4000;

const seen = () => { try { return window.localStorage.getItem(SEEN_KEY) === "1"; } catch { return false; } };
const remember = () => { try { window.localStorage.setItem(SEEN_KEY, "1"); } catch { /* storage blocked: it may show again next visit */ } };
/** Another modal is open (Suggestion Box, a lesson preview…): wait rather than stack on top of it. */
const busy = () => !!document.querySelector("[role=dialog]:not([hidden]), dialog[open], [aria-modal=true]");

/**
 * The welcome window: opens by itself ten seconds after a visitor lands, once per browser. If the tab is hidden or
 * another dialog is open at that moment it waits and tries again instead of giving up. `?welcome` always shows it;
 * `?nowelcome` never does. It shows no prices or plans.
 */
export function WelcomeModal() {
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
  return mounted ? <Suspense fallback={null}><WelcomePanel open={open} onOpenChange={setOpen} /></Suspense> : null;
}
