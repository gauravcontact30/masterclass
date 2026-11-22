"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { browserAuth } from "@/lib/supabase-browser-lazy";
import { hardNavigate } from "@/lib/hard-navigate";

/**
 * Signs out of the exam portals (Board Scholars and Exam Aspirants) in this browser. A login that also has a Tech Pro
 * account stays signed in there; a login with no Tech Pro account is signed out completely (app/api/portal/leave).
 */
export function ExamsSignOut({ className, to = "/exams" }: { className?: string; to?: string }) {
  const [busy, setBusy] = useState(false);
  async function leave() {
    setBusy(true);
    try {
      const response = await fetch("/api/portal/leave", { method: "POST" });
      const body = await response.json().catch(() => ({})) as { signOut?: boolean };
      if (body.signOut) await (await browserAuth()).signOut();
    } catch { /* leaving the page below still ends the visit */ }
    hardNavigate(to);
  }
  return <button type="button" className={className} disabled={busy} onClick={() => void leave()}><LogOut size={15} aria-hidden="true" />{busy ? "Signing out…" : "Sign out"}</button>;
}
