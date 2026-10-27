import "server-only";
import { currentUser } from "./auth";
import { HttpError } from "./http";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { sweepZeroEngagement } from "./zero-engagement";

export async function requireSuperAdmin() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "signin_required");
  if (!isSuperAdminUser(user)) throw new HttpError(403, "forbidden");
  // 0-second visitors are removed before any Super Admin page reads visits (lib/server/zero-engagement.ts).
  await sweepZeroEngagement();
  return user;
}
