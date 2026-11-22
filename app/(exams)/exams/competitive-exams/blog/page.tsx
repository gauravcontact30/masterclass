import { ExamBlogIndex, blogMetadata } from "@/components/exam-portal-pages";

export const metadata = blogMetadata("competitive");
export default function Page() { return <ExamBlogIndex portal="competitive" />; }
