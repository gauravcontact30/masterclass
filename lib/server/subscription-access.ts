import "server-only";
import { currentUser } from "./auth";
import { account } from "./repository";
import { HttpError } from "./http";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { redirect } from "next/navigation";

export async function requirePaidAccess(owner:string) {
  const user=await currentUser();
  if (!user || user.id!==owner) throw new HttpError(401,"signin_required");
  if (!isSuperAdminUser(user) && (await account(owner)).tier === "free") throw new HttpError(402,"subscription_required");
  return user;
}
/** Gate on the server before any protected learning data is serialized to the browser. */
export async function requireLearningUser() {
  const user=await currentUser();
  if (!user) redirect("/sign-in");
  if (!isSuperAdminUser(user) && (await account(user.id)).tier === "free") redirect("/learning/plans");
  return user;
}
