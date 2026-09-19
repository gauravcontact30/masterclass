import "server-only";
import { currentUser } from "./auth";
import { HttpError } from "./http";
import { isSuperAdminUser } from "@/lib/study/preparations";

export async function requireSuperAdmin() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "signin_required");
  if (!isSuperAdminUser(user)) throw new HttpError(403, "forbidden");
  return user;
}
