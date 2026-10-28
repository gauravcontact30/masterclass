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
/** Gate on the server before any protected learning data is serialized to the browser. `path` is where sign-in returns. */
export async function requireLearningUser(path="/learning") {
  const user=await currentUser();
  if (!user) redirect(signInFor(path));
  if (!isSuperAdminUser(user) && (await account(user.id)).tier === "free") redirect("/learning/plans");
  return user;
}
