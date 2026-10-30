import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { authConfigured } from "@/lib/server/config";
import { isOwnerUser, isSuperAdminUser } from "@/lib/study/preparations";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";
import { signInFor } from "@/lib/safe-redirect";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;
export const metadata = { title: "Super admin", robots: { index: false, follow: false } };
export default async function SuperAdminPage() {
  if (!authConfigured()) notFound();
  const user = await currentUser();
  if (!user) redirect(signInFor("/super-admin"));
  if (!isSuperAdminUser(user)) notFound();
  return <SuperAdminDashboard userId={user.id} isOwner={isOwnerUser(user)} />;
}
