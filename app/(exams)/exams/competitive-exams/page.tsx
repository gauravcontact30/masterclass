import { ExamsShell } from "@/components/exams-shell";
import { CompetitiveExams } from "@/components/competitive-exams";
import { requireExamUser } from "@/lib/server/portal";
import { EXAM_PORTAL_COPY, examMetadata } from "@/lib/seo";
// Signed-in page: renders once the Exam Aspirants account and its plan are read.
export const instant = false;
export const metadata = examMetadata({ ...EXAM_PORTAL_COPY.competitive, path: "/exams/competitive-exams" });

const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // An Exam Aspirants account on its trial or with a membership; Tech Pro and Board Scholars accounts do not open this page.
  const { user } = await requireExamUser("competitive", "/exams/competitive-exams");
  const query = await searchParams;
  const exam = one(query.exam); const tet = exam === "tet";
  // Keyed so the sidebar's TET Exams and Competitive Exams links (same page, other query) start the view afresh.
  return <ExamsShell portal="competitive" active={tet ? "tet" : "home"} email={user.email}><CompetitiveExams key={tet ? "tet" : "all"} initial={{ exam, type: one(query.type) }} /></ExamsShell>;
}
