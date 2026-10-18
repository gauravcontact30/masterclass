// TEMPORARY responsive-audit harness — delete before commit.
import { Workspace } from "@/components/workspace";
import { DashboardLearning } from "@/components/dashboard-learning";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";
import { landingDaily } from "@/lib/server/landing-daily";
export default async function Preview({ params }: { params: Promise<{ which: string }> }) {
  const { which } = await params;
  if (which === "admin") return <SuperAdminDashboard />;
  return <Workspace initialTab="dashboard" authEnabled={false} configured={false} billingEnabled={false} userEmail="learner@example.com" learning={<DashboardLearning daily={landingDaily()} />} />;
}
