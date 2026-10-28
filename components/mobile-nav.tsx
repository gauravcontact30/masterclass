"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "./brand-mark";

/*
 * Phones and small tablets (≤ 760 px, globals.css "Mobile drawer"): the dashboard sidebar becomes an off-canvas drawer
 * and the top bar a compact sticky header with a menu button and the brand mark. Shared by the Learning dashboard and
 * Super Admin, whose shells are both `.app-shell.compact-workspace` with an `aside.sidebar` and a `header.topbar`.
 * The drawer closes on Escape, on the scrim, and when a link or section in it is chosen.
 */
export function useMobileNav(label: string) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    // The page behind the drawer stays put while it is open.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [open]);

  /** On the aside: choosing a destination closes the drawer; switches and search fields keep it open. */
  const onAsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest("[role=switch], [aria-pressed], input, .sidebar-toggle")) return;
    if (target.closest("a[href], nav button")) setOpen(false);
  };

  const toggle = <span className="mobile-nav-lead">
    <button type="button" className="mobile-nav-button" aria-label={open ? `Close ${label}` : `Open ${label}`} aria-expanded={open} onClick={() => setOpen(value => !value)}>
      {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
    </button>
    <span className="mobile-nav-mark" aria-hidden="true"><BrandMark /></span>
  </span>;
  const scrim = open ? <button type="button" className="mobile-nav-scrim" aria-label={`Close ${label}`} tabIndex={-1} onClick={() => setOpen(false)} /> : null;

  return { open, toggle, scrim, shellProps: { "data-nav-open": open || undefined }, onAsideClick };
}
