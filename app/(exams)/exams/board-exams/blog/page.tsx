import { ExamBlogIndex, blogMetadata } from "@/components/exam-portal-pages";

export const metadata = blogMetadata("boards");
export default function Page() { return <ExamBlogIndex portal="boards" />; }
