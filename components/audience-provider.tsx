"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

export const useIndiaAccess = () => useContext(IndiaAccess);
