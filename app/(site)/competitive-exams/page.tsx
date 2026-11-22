import { ExamGuide } from "@/components/exam-guide";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/competitive-exams");

/** Public, indexable guide (lib/exam-guides.ts); the full material is in the signed-in dashboard. */
export default function Page() {
  return <ExamGuide path="/competitive-exams" />;
}
