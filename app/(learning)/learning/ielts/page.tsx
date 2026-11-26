import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { IeltsPreparation } from "@/components/ielts-preparation";
import { ExamLocaleProvider } from "@/components/exam-locale";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
import { isSuperAdminUser } from "@/lib/study/preparations";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "IELTS preparation" };

/** The IELTS preparation hub, inside the Learning Dashboard (it used to be the public /ielts page, which now redirects here). */
export default async function IeltsPage() {
  const authEnabled = authConfigured();
  const user = (authEnabled || process.env.NODE_ENV === "production") ? await currentUser("/learning/ielts") : null;
  if (authEnabled && !user) redirect(signInFor("/learning/ielts"));
  return <Workspace initialCategory="ielts" authEnabled={authEnabled}
    configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} initialSuperAdmin={isSuperAdminUser(user)}
    notesContent={<ExamLocaleProvider><IeltsPreparation /></ExamLocaleProvider>} />;
}
