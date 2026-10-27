"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/*
 * No `#fragment` routes anywhere in the app. In-page links (`#pricing`, `/#pricing` on the landing page, the skip
 * link, on-page tables of contents) scroll to their section without touching the address bar, so they no longer
 * stack history entries that make the browser's Back button seem to do nothing. A link to a section on another
 * page navigates to that page's plain URL, then scrolls once the section has rendered. A URL that arrives with a
 * fragment (an old bookmark or an outside link) scrolls to it and drops the fragment, keeping Next's history state.
 */
const PENDING = "masterclass:pending-section";

function prefersReducedMotion() { return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches; }

let settling: (() => void) | undefined;

/**
 * Sections below the fold skip rendering until they near the viewport (content-visibility in the landing styles), so
 * their heights are estimates until the scroll passes them and the target can drift as they render. Once scrolling
 * settles, this re-aligns the target until it stays put; the reader scrolling themselves cancels it.
 */
function settleOn(target: HTMLElement) {
  settling?.();
  let tries = 0, aligned = 0, lastY = -1, timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => { clearTimeout(timer); for (const type of ["wheel", "touchstart", "keydown"]) removeEventListener(type, stop); settling = undefined; };
  const check = () => {
    // About six seconds: client-loaded sections above the target keep growing the page for a while after load.
    if (++tries > 50 || !target.isConnected) return stop();
    const settled = Math.abs(scrollY - lastY) < 1;
    lastY = scrollY;
    if (settled) {
      const off = target.getBoundingClientRect().top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      // Aligned twice in a row (or as close as it gets: a section near the end of the page cannot reach the top).
      if (Math.abs(off) <= 4 || (off > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2)) { if (++aligned >= 2) return stop(); }
      else { aligned = 0; target.scrollIntoView({ behavior: "auto", block: "start" }); }
    }
    timer = setTimeout(check, 120);
  };
  for (const type of ["wheel", "touchstart", "keydown"]) addEventListener(type, stop, { passive: true });
  settling = stop;
  timer = setTimeout(check, 120);
}

/** Scrolls to a section and moves focus there for keyboard and screen-reader users. Returns false if it is not on the page. */
export function scrollToSection(id: string) {
  if (!id || id === "top") { window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" }); return true; }
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  settleOn(target);
  if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  return true;
}

/** Sections can render after navigation (streamed or client-loaded), so look for a few seconds. */
function scrollWhenReady(id: string) {
  let tries = 0;
  const attempt = () => { if (scrollToSection(id) || ++tries > 30) return; setTimeout(attempt, 100); };
  attempt();
}

/** Drops a fragment from the address bar without adding or losing a history entry (Next keeps its state in history.state). */
function stripHash() {
  if (!location.hash) return;
  history.replaceState(history.state, "", `${location.pathname}${location.search}`);
}

export function HashlessNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const raw = link.getAttribute("href") ?? "";
      if (!raw.includes("#")) return;
      let url: URL;
      try { url = new URL(link.href); } catch { return; }
      if (url.origin !== location.origin) return;
      const id = decodeURIComponent(url.hash.slice(1));
      event.preventDefault();
      if (url.pathname === location.pathname && url.search === location.search) { scrollToSection(id); stripHash(); return; }
      // Another page: go to its plain address and scroll there after it renders.
      try { if (id) sessionStorage.setItem(PENDING, id); } catch { /* storage blocked: the page still opens */ }
      router.push(`${url.pathname}${url.search}`);
    };
    // Capture phase, so this runs before next/link would push a `#fragment` URL.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  useEffect(() => {
    let pending: string | null = null;
    try { pending = sessionStorage.getItem(PENDING); sessionStorage.removeItem(PENDING); } catch { /* no storage */ }
    const fromUrl = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
    stripHash();
    const id = pending || fromUrl;
    if (id) scrollWhenReady(id);
  }, [pathname]);

  return null;
}
