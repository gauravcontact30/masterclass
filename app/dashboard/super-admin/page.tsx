import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { authConfigured } from "@/lib/server/config";
import { isOwnerUser, isSuperAdminUser } from "@/lib/study/preparations";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";
export const metadata = { title: "Super admin", robots: { index: false, follow: false } };
export default async function SuperAdminPage() {
  if (!authConfigured()) notFound();
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!isSuperAdminUser(user)) notFound();
  return <SuperAdminDashboard userId={user.id} isOwner={isOwnerUser(user)} />;
}
