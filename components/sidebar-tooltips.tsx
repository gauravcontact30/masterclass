"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./sidebar-tooltips.module.css";

/** Render outside the scrolling sidebar so tooltips cannot be clipped by its overflow. */
export function SidebarTooltips({ collapsed }: { collapsed: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);
  const id = useId();
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);
  useEffect(() => {
    if (!collapsed) return;
    const sidebar = marker.current?.closest("aside");
    if (!sidebar) return;
    let active: HTMLElement | null = null;
    let previous: string | null = null;
    function hide() {
      if (active) { if (previous === null) active.removeAttribute("aria-describedby"); else active.setAttribute("aria-describedby", previous); }
      active = null; setTip(null);
    }
    function show(event: Event) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button,a") : null;
      if (!target || !sidebar?.contains(target) || target === active) return;
      const label = target.getAttribute("aria-label") || target.getAttribute("title") || target.querySelector(".sidebar-tooltip")?.textContent || target.textContent;
      if (!label?.trim()) return;
      hide(); active = target; previous = target.getAttribute("aria-describedby");
      target.setAttribute("aria-describedby", [previous, id].filter(Boolean).join(" "));
      const rect = target.getBoundingClientRect();
      setTip({ label: label.trim(), top: Math.max(24, Math.min(window.innerHeight - 24, rect.top + rect.height / 2)), left: rect.right + 12 });
    }
    function leave(event: Event) { if (active && (!(event instanceof MouseEvent || event instanceof FocusEvent) || !(event.relatedTarget instanceof Node) || !active.contains(event.relatedTarget))) hide(); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") hide(); }
    sidebar.addEventListener("mouseover", show); sidebar.addEventListener("focusin", show);
    sidebar.addEventListener("mouseout", leave); sidebar.addEventListener("focusout", leave);
    window.addEventListener("scroll", hide, true); window.addEventListener("resize", hide); window.addEventListener("keydown", escape);
    return () => { hide(); sidebar.removeEventListener("mouseover", show); sidebar.removeEventListener("focusin", show); sidebar.removeEventListener("mouseout", leave); sidebar.removeEventListener("focusout", leave); window.removeEventListener("scroll", hide, true); window.removeEventListener("resize", hide); window.removeEventListener("keydown", escape); };
  }, [collapsed, id]);
  return <><span ref={marker} hidden />{collapsed && tip && createPortal(<div id={id} role="tooltip" className={styles.tooltip} style={{ top: tip.top, left: tip.left }}>{tip.label}</div>, document.body)}</>;
}
