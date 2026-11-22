import { ExamLocaleProvider } from "@/components/exam-locale";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { indiaAccess } from "@/lib/server/audience";
import { examMetadata } from "@/lib/seo";
// The dashboards' shared frame styles (app shell, sidebar, top bar, workspace): the exam portals use the Tech
// Learning Dashboard's frame (components/exams-frame.tsx), and without these the top bar stacks and the sidebar covers the page.
import "@/app/dashboard.css";

const portal = examMetadata({ title: "Exams portal", path: "/exams", description: "Class 10 and 12 board exam and government exam preparation for India, in English and Hindi: most-asked questions, worked answers and mock tests." });
export const metadata = { ...portal, title: { default: "Exams portal", template: "%s · MasterClass Exams" }, robots: { index: false, follow: false } };
async function IndiaOnly({ children }: { children: React.ReactNode }) {
  if (!await indiaAccess()) redirect("/");
  return <ExamLocaleProvider>{children}</ExamLocaleProvider>;
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}><IndiaOnly>{children}</IndiaOnly></Suspense>;
}
