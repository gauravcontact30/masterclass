import { ExamAuthPage, authMetadata } from "@/components/exam-portal-pages";
import { privateMetadata } from "@/lib/seo";

export const metadata = { ...privateMetadata, ...authMetadata("ielts", "signup") };
export default function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return <ExamAuthPage portal="ielts" mode="signup" searchParams={searchParams} />;
}
