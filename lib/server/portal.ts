import "server-only";
import { indiaAccess } from "./audience";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { db } from "./db";
import { currentUser } from "./auth";
import { account } from "./repository";
import { EXAMS_COOKIE, PORTALS, isExamPortal, isPortal, type ExamPortal, type Portal } from "@/lib/portal";
import { isSuperAdminUser } from "@/lib/study/preparations";

/*
 * Portal accounts (migrations 0054 and 0055). One login identity can hold a Tech Pro account, a Board Scholars
 * account and an Exam Aspirants account. They are separate accounts: the Tech account's id is the auth user id (as it
 * always was), each exam account's id is a UUID derived from it, and each id owns its own profile, trial,
 * subscription and data.
 *
 * Accounts opened between 2026-11-15 and the split are stored with portal 'exams'. Such a legacy Exams account keeps
 * opening both exam portals with its one id, so nobody loses a membership they paid for.
 *
 * Until the migration is applied the table does not exist. The Tech portal then behaves exactly as before
 * (fail open: every identity is a Tech account); the exam portals stay closed (fail closed).
 */
const NAMESPACE = Buffer.from("6f0c1c5e3b0a4d579d537a1e2b9c4e10", "hex");
const uuidV5 = (...parts: string[]) => {
  const hash = createHash("sha1").update(NAMESPACE);
  for (const part of parts) hash.update(part);
  const bytes = hash.digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
/** The legacy shared Exams account id for a login identity: UUID v5 of the auth user id. */
export const examsAccountId = (authUserId: string): string => uuidV5(authUserId);
/** A new exam portal's own account id: UUID v5 of the portal and the auth user id, never equal to the legacy id. */
export const examPortalAccountId = (authUserId: string, portal: ExamPortal): string => uuidV5(`${portal}:`, authUserId);

/** What an identity holds: the portals it can open, and whether its exam access comes from a legacy Exams account. */
export type Holdings = { portals: Portal[]; legacyExams: boolean };
/** The portals this identity has an account in, or null when the table cannot be read (migration not applied). */
export async function holdingsOf(authUserId: string): Promise<Holdings | null> {
  const { data, error } = await db().from("portal_accounts").select("portal").eq("auth_user_id", authUserId);
  if (error) return null;
  const raw = (data ?? []).map(row => String(row.portal));
  const legacyExams = raw.includes("exams");
  const portals = new Set<Portal>(raw.filter(isPortal));
  if (legacyExams) { portals.add("boards"); portals.add("competitive"); }
  return { portals: [...portals], legacyExams };
}
/** The portals this identity has an account in (legacy Exams counts as both exam portals), or null when unreadable. */
export async function portalsOf(authUserId: string): Promise<Portal[] | null> {
  return (await holdingsOf(authUserId))?.portals ?? null;
}
/** The account id `portal` uses for this identity. */
export const accountIdFor = (authUserId: string, portal: Portal, holdings?: Holdings | null) =>
  portal === "tech" ? authUserId : holdings?.legacyExams ? examsAccountId(authUserId) : examPortalAccountId(authUserId, portal);

/** The portal a brand-new identity signed up through (sent with sign-up); Tech for accounts older than the portals. */
const firstPortal = (user: User): Portal => {
  const value = user.user_metadata?.portal;
  return value === "exams" ? "boards" : isPortal(value) ? value : "tech";
};

export type EnterResult =
  | { ok: true; accountId: string; created: boolean }
  | { ok: false; reason: "no_portal_account" | "portal_unavailable" | "region_unavailable"; hasOther: boolean };

/**
 * Open `portal` for a signed-in identity. Sign-up creates the account. Sign-in needs one to exist, except for an
 * identity with no accounts yet whose sign-up was for this portal (the confirmation link was opened elsewhere).
 */
export async function enterPortal(user: User, portal: Portal, intent: "signin" | "signup"): Promise<EnterResult> {
  if (isExamPortal(portal) && !await indiaAccess()) return { ok: false, reason: "region_unavailable", hasOther: false };
  const holdings = await holdingsOf(user.id);
  const accountId = accountIdFor(user.id, portal, holdings);
  if (holdings === null) return portal === "tech" ? { ok: true, accountId, created: false } : { ok: false, reason: "portal_unavailable", hasOther: true };
  const held = holdings.portals;
  if (held.includes(portal)) return { ok: true, accountId, created: false };
  if (intent !== "signup" && !(held.length === 0 && firstPortal(user) === portal)) return { ok: false, reason: "no_portal_account", hasOther: held.length > 0 };
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim().slice(0, 80) : null;
  // An exam account is its own profile: a new created_at, so its trial starts now, and no subscription.
  const profile = await db().from("profiles").upsert(portal === "tech" ? { id: accountId } : { id: accountId, name }, { onConflict: "id", ignoreDuplicates: true });
  if (profile.error) return { ok: false, reason: "portal_unavailable", hasOther: held.length > 0 };
  const linked = await db().from("portal_accounts").upsert({ auth_user_id: user.id, portal, account_id: accountId }, { onConflict: "auth_user_id,portal", ignoreDuplicates: true });
  if (linked.error) return { ok: false, reason: "portal_unavailable", hasOther: held.length > 0 };
  return { ok: true, accountId, created: true };
}

/** Mark this browser as signed in to the exam portals for `authUserId` (30 days, like the session it rides on). */
export async function startExamsSession(authUserId: string) {
  (await cookies()).set(EXAMS_COOKIE, authUserId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 86400 });
}
export async function endExamsSession() { (await cookies()).delete(EXAMS_COOKIE); }

/** The account id of `portal` when `authUserId` is signed in to the exam portals in this browser and holds that account. */
export async function examAccountOf(authUserId: string, portal: ExamPortal): Promise<string | null> {
  if (!await indiaAccess()) return null;
  if ((await cookies()).get(EXAMS_COOKIE)?.value !== authUserId) return null;
  const holdings = await holdingsOf(authUserId);
  return holdings?.portals.includes(portal) ? accountIdFor(authUserId, portal, holdings) : null;
}
/** The signed-in user of an exam portal and that portal's account id, or null. */
export async function examSession(portal: ExamPortal) {
  const user = await currentUser();
  if (!user) return null;
  const accountId = await examAccountOf(user.id, portal);
  return accountId ? { user, accountId } : null;
}
/** The exam portals this browser's signed-in login can open now (for the /exams chooser). */
export async function openExamPortals(): Promise<{ user: User; portals: ExamPortal[] } | null> {
  const user = await currentUser();
  if (!user || !await indiaAccess()) return null;
  if ((await cookies()).get(EXAMS_COOKIE)?.value !== user.id) return { user, portals: [] };
  const held = await portalsOf(user.id);
  return { user, portals: (held ?? []).filter(isExamPortal) };
}
/**
 * Gate an exam portal page on the server. `member`: the page shows paid material, so an ended trial goes to Plans.
 * A login signed in to the other exam portal only is offered this portal's own account (/portal/join).
 */
export async function requireExamUser(portal: ExamPortal, path: string, { member = true }: { member?: boolean } = {}) {
  if (!await indiaAccess()) redirect("/");
  const session = await examSession(portal);
  if (!session) {
    const user = await currentUser();
    const signedInElsewhere = user && (await cookies()).get(EXAMS_COOKIE)?.value === user.id;
    redirect(signedInElsewhere ? `/portal/join?portal=${portal}` : `${PORTALS[portal].signIn}?redirect=${encodeURIComponent(path)}`);
  }
  const plan = await account(session.accountId);
  if (member && plan.tier === "free" && !isSuperAdminUser(session.user)) redirect(PORTALS[portal].plans);
  return { ...session, plan };
}
/** Gate a Tech page: an identity that only has exam accounts is offered a Tech account instead of the dashboard. */
export async function requireTechAccount(user: User) {
  const entered = await enterPortal(user, "tech", "signin");
  if (!entered.ok) redirect("/portal/join?portal=tech");
}
