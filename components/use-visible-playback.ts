"use client";

import { useEffect, useState, type RefObject } from "react";

/** Stop carousel work when its section or the browser tab is out of view. */
export function useVisiblePlayback(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let intersecting = true;
    const update = () => setVisible(intersecting && document.visibilityState !== "hidden");
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    });
    if (ref.current) observer?.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [ref]);
  return visible;
}
