import { ExamBlogPost, blogParams, blogPostMetadata } from "@/components/exam-portal-pages";

export const generateStaticParams = () => blogParams("boards");
export const generateMetadata = ({ params }: { params: Promise<{ slug: string }> }) => blogPostMetadata("boards", params);
export default function Page({ params }: { params: Promise<{ slug: string }> }) { return <ExamBlogPost portal="boards" params={params} />; }
