/**
 * Where sign-in, sign-up and the emailed auth links may send a reader afterwards: same-site paths under these
 * sections only, never another origin. Shared by components/auth-page.tsx, app/auth/callback and app/auth/confirm.
 * /dashboard stays for links saved before the Learning Dashboard moved to /learning (2026-10-25); /reset-password is
 * where password-reset links land.
 */
const ALLOWED = /^\/(learning|super-admin|dashboard|notes|subscribe|tech-buzz|reset-password)(\/|\?|$)/;

export const isSafeRedirect = (target: string | null | undefined): target is string =>
  Boolean(target && ALLOWED.test(target) && !target.startsWith("//") && !target.includes("\\"));

/** The sign-in page, sending the reader back to `path` (a page that needed a session) afterwards. */
export const signInFor = (path: string) => `/sign-in?redirect=${encodeURIComponent(path)}`;
