"use client";
import { useEffect } from "react";

/** The containers that make one accordion group: opening a panel closes the others open in the same one. */
const GROUP = "[data-accordion-group], ul, ol, section, article, dialog, [role='dialog'], form, main";

/**
 * App-wide rule: opening an accordion (any <details>) closes the one opened before it in the same group, so a
 * reader only ever has one answer open at a time. Panels nested inside each other are left alone, and a
 * <details data-accordion="free"> (a file tree's folders, say) opts out. Mounted once in the root layout;
 * accordions driven by React state follow the same rule in their own components.
 */
export function ExclusiveAccordions() {
  useEffect(() => {
    // `toggle` does not bubble, so it is caught on the way down.
    const onToggle = (event: Event) => {
      const opened = event.target;
      if (!(opened instanceof HTMLDetailsElement) || !opened.open || opened.dataset.accordion === "free") return;
      const group = opened.parentElement?.closest(GROUP) ?? document.body;
      for (const other of group.querySelectorAll<HTMLDetailsElement>("details[open]")) {
        if (other !== opened && other.dataset.accordion !== "free" && !other.contains(opened) && !opened.contains(other)) other.open = false;
      }
    };
    document.addEventListener("toggle", onToggle, true);
    return () => document.removeEventListener("toggle", onToggle, true);
  }, []);
  return null;
}
