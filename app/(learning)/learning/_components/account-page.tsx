import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import type { WorkspaceTab } from "@/lib/dashboard-routes";
import { currentUser } from "@/lib/server/auth";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";

export async function AccountPage({ tab }: { tab: Exclude<WorkspaceTab, "dashboard"> }) {
  const authEnabled = authConfigured();
  const user = authEnabled ? await currentUser() : null;
  if (authEnabled && !user) redirect(signInFor(`/learning/${tab}`));
  return <Workspace key={tab} initialTab={tab} authEnabled={authEnabled} configured={databaseConfigured()}
    billingEnabled={billingConfigured()} userEmail={user?.email ?? null} />;
}
