import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { CompetitiveExams } from "@/components/competitive-exams";
import { ExamLocaleProvider } from "@/components/exam-locale";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
import { isSuperAdminUser } from "@/lib/study/preparations";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;
export const metadata = { title: "Competitive Exams · NDA, Defence, Banks, Railways" };

const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

/** Competitive (government) exams inside the Learning Dashboard (this address used to forward to the Exams portal). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const authEnabled = authConfigured();
  const user = (authEnabled || process.env.NODE_ENV === "production") ? await currentUser("/learning/competitive-exams") : null;
  if (authEnabled && !user) redirect(signInFor("/learning/competitive-exams"));
  const query = await searchParams;
  return <Workspace initialCategory="competitive-exams" authEnabled={authEnabled}
    configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} initialSuperAdmin={isSuperAdminUser(user)}
    notesContent={<ExamLocaleProvider><CompetitiveExams context="learning" initial={{ exam: one(query.exam), type: one(query.type) }} /></ExamLocaleProvider>} />;
}
