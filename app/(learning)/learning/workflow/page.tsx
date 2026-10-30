import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { AgenticWorkflowDashboard } from "@/components/agentic-workflow";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = {
  title: "Agentic AI Workflow Architectures & Topologies",
  description:
    "Engineering specifications, runtime mechanics, and multi-file production implementations for single and multi-agent workflows using LangChain v0.3+, LangGraph v0.2+, and LangSmith v0.2+.",
};

export default async function Page() {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser("/learning/workflow") : null;
  if (authConfigured() && !user) redirect(signInFor("/learning/workflow"));

  return (
    <Workspace
      initialCategory="workflow"
      authEnabled={authConfigured()}
      configured={databaseConfigured()}
      billingEnabled={billingConfigured()}
      userEmail={user?.email ?? null}
      notesContent={<AgenticWorkflowDashboard />}
    />
  );
}
