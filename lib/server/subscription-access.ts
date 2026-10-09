import "server-only";
import { currentUser } from "./auth";
import { account } from "./repository";
import { HttpError } from "./http";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { redirect } from "next/navigation";

/**
 * `currentUser` falls back to a synthetic student ("direct", or the "dev"
 * cookie session) while sign-in is switched off. That account has no row a
 * payment could ever upgrade, so gating it on its tier bounced every sidebar
 * link back to /dashboard?tab=plans. Real Supabase accounts stay gated.
 */
const DIRECT_ACCESS_PROVIDERS=new Set(["direct","dev"]);
function isDirectAccessUser(user:{app_metadata?:{provider?:string}}|null|undefined){return DIRECT_ACCESS_PROVIDERS.has(user?.app_metadata?.provider??"");}
function hasLearningAccess(user:{app_metadata?:{provider?:string};email?:string;email_confirmed_at?:string|null}){return isDirectAccessUser(user)||isSuperAdminUser(user);}
export async function requirePaidAccess(owner:string) {
  const user=await currentUser();
  if (!user || user.id!==owner) throw new HttpError(401,"signin_required");
  if (!hasLearningAccess(user) && (await account(owner)).tier === "free") throw new HttpError(402,"subscription_required");
  return user;
}
/** Gate on the server before any protected learning data is serialized to the browser. */
export async function requireLearningUser() {
  const user=await currentUser();
  if (!user) redirect("/sign-in");
  if (!hasLearningAccess(user) && (await account(user.id)).tier === "free") redirect("/dashboard?tab=plans");
  return user;
}
