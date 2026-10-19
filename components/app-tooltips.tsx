"use client";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./app-tooltips.module.css";

const CONTROLS = "button,a[href],summary,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=option],[role=menuitem],[role=checkbox],[role=radio],[role=switch],[data-tooltip]";
const ICONS = "svg.lucide,svg[aria-label],[data-feature-icon]";
const clean = (value: string | null | undefined) => value?.replace(/\s+/g, " ").trim() ?? "";

/** Prefer the control's authored name. Never expose input values as tooltip text. */
function labelFor(element: Element): string {
  const described = clean(element.getAttribute("data-tooltip"));
  if (described) return described;
  const labelledBy = clean(element.getAttribute("aria-labelledby")).split(" ").filter(Boolean).map(id => document.getElementById(id)?.textContent).join(" ");
  const authored = clean(labelledBy) || clean(element.getAttribute("aria-label")) || clean(element.getAttribute("title"));
  if (authored) return authored;
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return clean(Array.from(element.labels ?? []).map(label => label.textContent).join(" ")) || clean(element.getAttribute("placeholder"));
  }
  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll("svg,[aria-hidden=true],[hidden],[role=tooltip]").forEach(node => node.remove());
  const text = clean(copy.textContent);
  if (text) return text;
  const icon = element.matches(ICONS) ? element : element.querySelector(ICONS);
  const iconLabel = clean(icon?.getAttribute("aria-label")) || clean(icon?.querySelector("title")?.textContent);
  if (iconLabel) return iconLabel;
  if (element.matches(ICONS)) {
    const context = clean(element.parentElement?.textContent);
    if (context && context.length <= 160) return context;
  }
  // Icon-only controls should have aria-label; the glyph name provides a last-resort hover description.
  const iconName = Array.from(icon?.classList ?? []).find(name => name.startsWith("lucide-") && name !== "lucide-icon");
  return iconName ? iconName.slice(7).replace(/-/g, " ").replace(/^./, value => value.toUpperCase()) : "";
}

/** Delegated events cover every route, portal menu and controls added after hydration. */
export function AppTooltips() {
  const id = useId();
  const [tip, setTip] = useState<{ label: string; left: number; top: number; above: boolean } | null>(null);
  useEffect(() => {
    let active: Element | null = null;
    let originalTitle: string | null = null;
    let dismissed: Element | null = null;
    function hide() {
      if (active) {
        const references = clean(active.getAttribute("aria-describedby")).split(" ").filter(value => value && value !== id);
        if (references.length) active.setAttribute("aria-describedby", references.join(" ")); else active.removeAttribute("aria-describedby");
        if (originalTitle !== null && !active.hasAttribute("title")) active.setAttribute("title", originalTitle);
      }
      active = null; originalTitle = null; setTip(null);
    }
    function show(event: Event) {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[role=tooltip]")) return;
      const target = event.target.closest(CONTROLS) ?? event.target.closest(ICONS);
      if (!target || target === active || target === dismissed) return;
      // Keep the existing collapsed-sidebar tooltip and other explicitly managed tooltips.
      if (target.closest(".sidebar-collapsed .sidebar,[data-tooltip-disabled]")) { hide(); return; }
      const existing = clean(target.getAttribute("aria-describedby")).split(" ").some(ref => document.getElementById(ref)?.getAttribute("role") === "tooltip");
      if (existing) { hide(); return; }
      const label = labelFor(target);
      hide();
      if (!label) return;
      active = target;
      originalTitle = target.getAttribute("title");
      if (originalTitle !== null) target.removeAttribute("title");
      target.setAttribute("aria-describedby", [target.getAttribute("aria-describedby"), id].filter(Boolean).join(" "));
      const rect = target.getBoundingClientRect();
      const above = window.innerHeight - rect.bottom < 160 && rect.top > 160;
      setTip({ label: label.length > 280 ? `${label.slice(0, 277)}…` : label, left: Math.max(8, Math.min(rect.left, window.innerWidth - 296)), top: above ? rect.top - 8 : rect.bottom + 8, above });
    }
    function leave(event: Event) {
      const next = event instanceof MouseEvent || event instanceof FocusEvent ? event.relatedTarget : null;
      if (next instanceof Node && (active?.contains(next) || document.getElementById(id)?.contains(next))) return;
      dismissed = null; hide();
    }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { dismissed = active; hide(); } }
    document.addEventListener("mouseover", show);
    document.addEventListener("focusin", show);
    document.addEventListener("mouseout", leave);
    document.addEventListener("focusout", leave);
    document.addEventListener("click", hide);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      hide();
      document.removeEventListener("mouseover", show); document.removeEventListener("focusin", show);
      document.removeEventListener("mouseout", leave); document.removeEventListener("focusout", leave);
      document.removeEventListener("click", hide); document.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", hide, true); window.removeEventListener("resize", hide);
    };
  }, [id]);
  return tip ? createPortal(<div id={id} role="tooltip" className={styles.tooltip} style={{ left: tip.left, top: tip.top }} data-above={tip.above}>{tip.label}</div>, document.body) : null;
}
