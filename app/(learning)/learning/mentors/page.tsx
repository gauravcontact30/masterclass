import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";
import { proSectionContent } from "@/lib/server/pro-learn-pages";
import { signInFor } from "@/lib/safe-redirect";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "Mentors · Professional Learn" };

export default async function Page() {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser("/learning/mentors") : null;
  if (authConfigured() && !user) redirect(signInFor("/learning/mentors"));
  return <Workspace initialCategory="mentors" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} notesContent={proSectionContent("mentors")}/>;
}
