"use client";
import { useState } from "react";
import { hardNavigate } from "@/lib/hard-navigate";
import { PORTALS, type Portal } from "@/lib/portal";

/** Creates this login's account in `portal` (app/api/portal/enter, intent sign-up) and opens that portal. */
export function PortalJoin({ portal, className }: { portal: Portal; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function join() {
    setBusy(true); setFailed(false);
    try {
      const response = await fetch("/api/portal/enter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ portal, intent: "signup" }) });
      if (!response.ok) throw new Error("failed");
      hardNavigate(PORTALS[portal].home);
    } catch { setFailed(true); setBusy(false); }
  }
  return <><button type="button" className={className} disabled={busy} onClick={() => void join()}>{busy ? "Creating…" : `Create my ${PORTALS[portal].name} account`}</button>
    {failed && <p role="alert">That did not work. Please try again in a moment.</p>}</>;
}
