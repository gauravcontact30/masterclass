import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { BoardExams } from "@/components/board-exams";
import { ExamLocaleProvider } from "@/components/exam-locale";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
import { isSuperAdminUser } from "@/lib/study/preparations";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;
export const metadata = { title: "Board Exams · UP Board, CBSE and ICSE" };

const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

/** Board Exams (UP Board, CBSE, ICSE/ISC; Class 10 and 12) inside the Learning Dashboard (this address used to forward to the Exams portal). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const authEnabled = authConfigured();
  const user = (authEnabled || process.env.NODE_ENV === "production") ? await currentUser("/learning/board-exams") : null;
  if (authEnabled && !user) redirect(signInFor("/learning/board-exams"));
  const query = await searchParams;
  return <Workspace initialCategory="board-exams" authEnabled={authEnabled}
    configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} initialSuperAdmin={isSuperAdminUser(user)}
    notesContent={<ExamLocaleProvider><BoardExams context="learning" initial={{ board: one(query.board), cls: one(query.class), subject: one(query.subject), view: one(query.view) }} /></ExamLocaleProvider>} />;
}
