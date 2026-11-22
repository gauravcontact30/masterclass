import { ExamsShell } from "@/components/exams-shell";
import { BoardExams } from "@/components/board-exams";
import { requireExamUser } from "@/lib/server/portal";
import { EXAM_PORTAL_COPY, examMetadata } from "@/lib/seo";
// Signed-in page: renders once the Board Scholars account and its plan are read.
export const instant = false;
export const metadata = examMetadata({ ...EXAM_PORTAL_COPY.boards, path: "/exams/board-exams" });

const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // A Board Scholars account on its trial or with a membership; Tech Pro and Exam Aspirants accounts do not open this page.
  const { user } = await requireExamUser("boards", "/exams/board-exams");
  const query = await searchParams;
  return <ExamsShell portal="boards" active="home" email={user.email}><BoardExams initial={{ board: one(query.board), cls: one(query.class), subject: one(query.subject), view: one(query.view) }} /></ExamsShell>;
}
