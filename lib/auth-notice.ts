/**
 * A one-shot notice carried across the full-page navigation that follows sign-in or sign-up, so the dashboard can
 * confirm what just happened. Emailed links carry theirs as ?notice= instead (app/auth/confirm, app/auth/callback).
 * Read and cleared by components/auth-notice-toast.tsx. Dependency-free: it ships with the auth page.
 */
export type AuthNotice = "signed_in" | "created" | "verified" | "recovery" | "password_updated";
export const AUTH_NOTICES: readonly AuthNotice[] = ["signed_in", "created", "verified", "recovery", "password_updated"];
const KEY = "mc:auth-notice";

export function setAuthNotice(notice: AuthNotice) {
  try { sessionStorage.setItem(KEY, notice); } catch { /* storage blocked: the toast is a nicety */ }
}

export function takeAuthNotice(): AuthNotice | null {
  try {
    const value = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY);
    return AUTH_NOTICES.includes(value as AuthNotice) ? value as AuthNotice : null;
  } catch { return null; }
}
