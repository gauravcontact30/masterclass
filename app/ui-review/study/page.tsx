import { notFound } from "next/navigation";
import { buildStudyPack } from "@/lib/study/content";
import { findStudyCourse } from "@/lib/study/catalog";
import { StudyReview } from "./review";
export default async function StudyPreview({ searchParams }: { searchParams: Promise<{ course?: string; language?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams; const course = findStudyCourse(query.course ?? "design-ecommerce");
  if (!course) notFound();
  return <StudyReview pack={buildStudyPack(course, query.language === "hi" ? "hi" : "en", "monthly", "development-fixture")} />;
}
