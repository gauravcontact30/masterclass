import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { OfficialDocs } from "@/components/official-docs";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "Official Docs · Comprehensive Developer Reference" };

export default async function OfficialDocsPage() {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser("/learning/official-docs") : null;
  if (authConfigured() && !user) redirect(signInFor("/learning/official-docs"));

  return (
    <Workspace
      initialCategory="official-docs"
      authEnabled={authConfigured()}
      configured={databaseConfigured()}
      billingEnabled={billingConfigured()}
      userEmail={user?.email ?? null}
      notesContent={
        <OfficialDocs />
      }
    />
  );
}
