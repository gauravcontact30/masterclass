import { ExamAuthPage, authMetadata } from "@/components/exam-portal-pages";
import { privateMetadata } from "@/lib/seo";

export const metadata = { ...privateMetadata, ...authMetadata("ielts", "signin") };
export default function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return <ExamAuthPage portal="ielts" mode="signin" searchParams={searchParams} />;
}
