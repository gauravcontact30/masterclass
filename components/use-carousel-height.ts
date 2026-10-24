"use client";

import { useEffect, type RefObject } from "react";

/** Fit a horizontal track to the cards currently in view, not its tallest offscreen card. */
export function useCarouselHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const track = ref.current;
    if (!track) return;
    const previousHeight = track.style.height;
    let frame = 0;
    let visible = typeof IntersectionObserver === "undefined";
    const measure = () => {
      frame = 0;
      // Offscreen tracks otherwise measure every card during initial image loads,
      // forcing layout while the hero and the user's current interaction need it.
      if (!visible) return;
      const viewport = track.getBoundingClientRect();
      if (!viewport.width) return;
      let height = 0;
      for (const card of Array.from(track.children)) {
        const rect = card.getBoundingClientRect();
        if (rect.right > viewport.left + 1 && rect.left < viewport.right - 1) {
          height = Math.max(height, rect.height);
        }
      }
      const next = `${Math.ceil(height)}px`;
      if (height > 0 && track.style.height !== next) track.style.height = next;
    };
    const schedule = () => {
      if (visible && !frame) frame = requestAnimationFrame(measure);
    };
    const visibility = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) schedule();
    }, { rootMargin: "300px 0px" });
    visibility?.observe(track);
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    const observe = () => {
      resize?.disconnect();
      resize?.observe(track);
      for (const card of Array.from(track.children)) resize?.observe(card);
      schedule();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(track, { childList: true });
    observe();
    track.addEventListener("scroll", schedule, { passive: true });
    track.addEventListener("load", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      mutations.disconnect();
      visibility?.disconnect();
      track.removeEventListener("scroll", schedule);
      track.removeEventListener("load", schedule, true);
      window.removeEventListener("resize", schedule);
      track.style.height = previousHeight;
    };
  }, [ref]);
}
