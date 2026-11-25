"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

const IndiaAccess = createContext(false);

/** The globally cached HTML is Tech-only. India content mounts only after a fresh server decision. */
export function AudienceProvider({ children }: { children: ReactNode }) {
  const [india, setIndia] = useState(false);
  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      setIndia(false);
      fetch("/api/geo", { cache: "no-store", signal: current.signal })
        .then(response => response.ok ? response.json() : null)
        .then(data => { if (active && !current.signal.aborted) setIndia(data?.indiaAccess === true); })
        .catch(() => { /* Offline or unknown country: retain the worldwide experience. */ });
    };
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    refresh();
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; controller?.abort(); window.removeEventListener("pageshow", refresh); document.removeEventListener("visibilitychange", visible); };
  }, []);
  return <IndiaAccess.Provider value={india}>{children}</IndiaAccess.Provider>;
}

const noSubscribe = () => () => {};
/**
 * Whether India content may show. While a part of the page hydrates it is always false, as in the server HTML: a part
 * that hydrates late (the footer, inside a Suspense boundary) would otherwise render the India links before React has
 * matched it against HTML that has none, and React reported a hydration mismatch. It turns true right after.
 */
export const useIndiaAccess = () => {
  const india = useContext(IndiaAccess);
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return india && hydrated;
};
