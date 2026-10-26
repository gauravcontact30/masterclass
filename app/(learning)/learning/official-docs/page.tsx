import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { OfficialDocs } from "@/components/official-docs";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";

export const metadata = { title: "Official Docs · Comprehensive Developer Reference" };

export default async function OfficialDocsPage() {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");

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
