import "server-only";
import { currentUser } from "./auth";
import { account } from "./repository";
import { HttpError } from "./http";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { redirect } from "next/navigation";
import { signInFor } from "@/lib/safe-redirect";

export async function requirePaidAccess(owner:string) {
  const user=await currentUser();
  if (!user || user.id!==owner) throw new HttpError(401,"signin_required");
  if (!isSuperAdminUser(user) && (await account(owner)).tier === "free") throw new HttpError(402,"subscription_required");
  return user;
}
export type StudyBuddyAccess = { access: true; reason: null } | { access: false; reason: "signin_required" | "subscription_required" };
/** Study Buddy answers members only (user rule 2026-10-31): a signed-in account whose plan is not free, or a super admin. */
export async function studyBuddyAccess(): Promise<StudyBuddyAccess> {
  const user = await currentUser();
  if (!user) return { access: false, reason: "signin_required" };
  if (!isSuperAdminUser(user) && (await account(user.id)).tier === "free") return { access: false, reason: "subscription_required" };
  return { access: true, reason: null };
}
/** Throws 401/402 before a Study Buddy request reaches the model. */
export async function requireStudyBuddyAccess() {
  const result = await studyBuddyAccess();
  if (!result.access) throw new HttpError(result.reason === "signin_required" ? 401 : 402, result.reason);
}
/** Gate on the server before any protected learning data is serialized to the browser. `path` is where sign-in returns. */
export async function requireLearningUser(path="/learning") {
  const user=await currentUser();
  if (!user) redirect(signInFor(path));
  if (!isSuperAdminUser(user) && (await account(user.id)).tier === "free") redirect("/learning/plans");
  return user;
}
