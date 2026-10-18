import "server-only";
import { OWNER_EMAIL } from "@/lib/study/preparations";

/**
 * Accounts kept out of the Super Admin's audience numbers (User activities, Audience, live presence): the owner,
 * plus any address in TRACKING_EXCLUDED_EMAILS (comma-separated). Their own browsing would otherwise skew every chart.
 */
export function untrackedEmails() {
  const extra = (process.env.TRACKING_EXCLUDED_EMAILS ?? "").split(",").map(email => email.trim().toLowerCase()).filter(Boolean);
  return new Set([OWNER_EMAIL, ...extra]);
}
export function isUntrackedEmail(email: unknown) {
  return typeof email === "string" && untrackedEmails().has(email.trim().toLowerCase());
}

/**
 * Set on a browser once an untracked account is seen in it, so its signed-out visits stay out of the numbers too.
 * Anyone can set it to opt out of page-view analytics, which is harmless: it grants nothing.
 */
export const UNTRACKED_COOKIE = "mc_untracked";
