import { ExamPlansPage } from "@/components/exam-portal-pages";
import { EXAM_PORTAL_COPY, examMetadata } from "@/lib/seo";
// Signed-in page: renders once the account and its plan are read.
export const instant = false;
export const metadata = examMetadata({ title: "Plans", description: `Monthly or yearly membership for ${EXAM_PORTAL_COPY.boards.description.charAt(0).toLowerCase()}${EXAM_PORTAL_COPY.boards.description.slice(1)}`, path: "/exams/board-exams/plans" });
export default function Page() { return <ExamPlansPage portal="boards" />; }
