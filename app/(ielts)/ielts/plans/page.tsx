import { ExamPlansPage } from "@/components/exam-portal-pages";
// Signed-in page: renders once the account and its plan are read.
export const instant = false;
export const metadata = { title: "Plans" };
export default function Page() { return <ExamPlansPage portal="ielts" />; }
