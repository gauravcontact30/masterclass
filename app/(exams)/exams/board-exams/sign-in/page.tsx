import { ExamAuthPage, authMetadata } from "@/components/exam-portal-pages";
import { privateMetadata } from "@/lib/seo";

export const metadata = { ...privateMetadata, ...authMetadata("boards", "signin") };
export default function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return <ExamAuthPage portal="boards" mode="signin" searchParams={searchParams} />;
}
