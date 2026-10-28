import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";
import { proSectionContent } from "@/lib/server/pro-learn-pages";
import { signInFor } from "@/lib/safe-redirect";

export const metadata = { title: "Lessons · Professional Learn" };

export default async function Page() {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authConfigured() && !user) redirect(signInFor("/learning/lessons"));
  return <Workspace initialCategory="lessons" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} notesContent={proSectionContent("lessons")}/>;
}
