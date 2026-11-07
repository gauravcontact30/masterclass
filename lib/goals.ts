/*
 * Custom goals (user request 2026-11-07, DataFast "Track custom user actions"): the things a visitor does that matter
 * beyond a page view. trackGoal() sends each one to DataFast (window.datafast) and to our own Supabase table
 * (/api/goals, migration 0053), so the super admin Overview shows the same goals without leaving the site.
 * Client-safe, tiny, and never throws: tracking must not break the action it describes.
 */

/** Every goal the site records. Names are lower case letters, digits, hyphens and underscores (max 64). */
export const GOALS = {
  signUp: "sign_up",
  signIn: "sign_in",
  googleSignIn: "google_sign_in_click",
  checkoutStarted: "checkout_started",
  paymentCompleted: "payment_completed",
  welcomeStart: "welcome_start_exploring",
  welcomeCourses: "welcome_see_courses",
  techBuzzOpen: "tech_buzz_story_open",
  pathOpen: "learning_path_open",
} as const;
export type GoalName = (typeof GOALS)[keyof typeof GOALS];
export type GoalParams = Record<string, string | number | boolean | null | undefined>;

export const GOAL_NAME = /^[a-z0-9_-]{1,64}$/;
/** DataFast's limits: ten parameters, short text. Empty values are dropped; never pass an email, a name or a token. */
export function cleanGoalParams(params: GoalParams = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Object.keys(out).length >= 10) break;
    if (value === undefined || value === null || value === "" || !/^[a-z0-9_-]{1,32}$/.test(key)) continue;
    out[key] = String(value).slice(0, 255);
  }
  return out;
}

type DataFast = ((name: string, params?: Record<string, string>) => void) & { q?: unknown[] };

export function trackGoal(name: GoalName, params?: GoalParams) {
  if (typeof window === "undefined" || !GOAL_NAME.test(name)) return;
  const clean = cleanGoalParams(params);
  try {
    const w = window as unknown as { datafast?: DataFast };
    // The DataFast script defines window.datafast when it loads; until then goals queue, as its own snippet does.
    const send: DataFast = w.datafast ??= Object.assign(function (...args: unknown[]) { (send.q ??= []).push(args); } as DataFast);
    send(name, clean);
  } catch { /* an ad blocker or an offline script never blocks the action */ }
  try {
    void fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, path: location.pathname, params: clean }), keepalive: true }).catch(() => undefined);
  } catch { /* offline */ }
}
