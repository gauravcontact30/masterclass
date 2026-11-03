import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { ApiDocs } from "@/components/api-docs";
import { agenticIndex, apiGuideCards, apiPreviews, apiRowSummaries } from "@/lib/server/api-previews";
import { learningViewer } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
import { isSuperAdminUser } from "@/lib/study/preparations";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "API Docs · Developer Reference" };

export default async function Page() {
  const viewer = (authConfigured() || process.env.NODE_ENV === "production") ? await learningViewer("/learning/api-docs") : null;
  if (authConfigured() && !viewer) redirect(signInFor("/learning/api-docs"));
  const member = viewer?.member ?? true;
  return <Workspace initialCategory="api-docs" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={viewer?.user.email ?? null} initialSuperAdmin={isSuperAdminUser(viewer?.user ?? null)}
    notesContent={<ApiDocs member={member} previews={apiPreviews()} summaries={member ? apiRowSummaries() : {}} agentic={agenticIndex()} guides={apiGuideCards()} />} />;
}
