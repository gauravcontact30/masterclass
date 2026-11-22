import { ExamBlogPost, blogParams, blogPostMetadata } from "@/components/exam-portal-pages";

export const generateStaticParams = () => blogParams("competitive");
export const generateMetadata = ({ params }: { params: Promise<{ slug: string }> }) => blogPostMetadata("competitive", params);
export default function Page({ params }: { params: Promise<{ slug: string }> }) { return <ExamBlogPost portal="competitive" params={params} />; }
