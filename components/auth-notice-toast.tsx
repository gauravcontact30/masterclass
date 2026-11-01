"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { takeAuthNotice, AUTH_NOTICES, type AuthNotice } from "@/lib/auth-notice";
import { useLanguage } from "./language-provider";

const NOTICES: Record<AuthNotice, [en: string, hi: string, enBody: string, hiBody: string]> = {
  signed_in: ["Signed in successfully", "सफलतापूर्वक साइन इन हुआ", "Welcome back. Pick up where you left off.", "वापसी पर स्वागत है। जहाँ छोड़ा था वहीं से शुरू करें।"],
  created: ["Account created successfully", "खाता सफलतापूर्वक बन गया", "Your 1-day free trial has started.", "आपका 1 दिन का निःशुल्क ट्रायल शुरू हो गया है।"],
  verified: ["Email verified. You are signed in", "ईमेल सत्यापित हुआ। आप साइन इन हैं", "Your account is confirmed and ready to use.", "आपका खाता सत्यापित है और उपयोग के लिए तैयार है।"],
  recovery: ["Signed in from your reset link", "रीसेट लिंक से साइन इन हुआ", "Choose a new password at /reset-password.", "/reset-password पर नया पासवर्ड चुनें।"],
  password_updated: ["Password updated", "पासवर्ड बदल दिया गया", "Use your new password the next time you sign in.", "अगली बार साइन इन करते समय नया पासवर्ड इस्तेमाल करें।"],
};

/**
 * The confirmation toast for what just happened (sign-in, sign-up, verified email…), once per page load, from ?notice=
 * or the auth page's one-shot notice (lib/auth-notice.ts). Mounted by the dashboard layout, not inside the Workspace:
 * there it waited for the whole dashboard to hydrate and showed seconds late (user report 2026-11-01). This component
 * is tiny and hydrates with the layout, and the Toaster lives in the root providers, so the toast shows at once.
 */
export function AuthNoticeToast() {
  const { language } = useLanguage();
  useEffect(() => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get("notice");
    const notice = (AUTH_NOTICES as readonly string[]).includes(param ?? "") ? param as AuthNotice : takeAuthNotice();
    if (param) { url.searchParams.delete("notice"); window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`); }
    if (!notice) return;
    const [en, hindi, enBody, hiBody] = NOTICES[notice];
    // Next task, not now: the root Toaster mounts later in the same commit (its effects run after this one), and sonner
    // drops a toast published before the Toaster has subscribed. Not cancelled on cleanup: the notice is one-shot
    // (already taken from storage), so Strict Mode's second effect run would otherwise find nothing to show.
    setTimeout(() => toast.success(language === "hi" ? hindi : en, { description: language === "hi" ? hiBody : enBody, duration: 6000 }), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per page load, in the language at that moment.
  }, []);
  return null;
}
