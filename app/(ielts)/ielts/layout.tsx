import { ExamLocaleProvider } from "@/components/exam-locale";
import { examMetadata } from "@/lib/seo";
// The dashboards' shared frame styles (app shell, sidebar, top bar, workspace), as in the exam portals.
import "@/app/dashboard.css";

/*
 * IELTS Achievers (2026-11-24): the IELTS portal, with its own sign-up, sign-in, dashboard and plans and its own
 * account (lib/portal.ts, lib/server/portal.ts). Unlike the exam portals it is open worldwide. The public guide
 * stays at /ielts-preparation; Tech Pro keeps its own IELTS hub at /learning/ielts.
 */
const portal = examMetadata({ title: "IELTS Achievers", path: "/ielts/dashboard", description: "IELTS Academic and General Training preparation: sample papers, timed practice tests, a learning library and 860+ questions with answers." });
export const metadata = { ...portal, title: { default: "IELTS Achievers", template: "%s · MasterClass IELTS" }, robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ExamLocaleProvider>{children}</ExamLocaleProvider>;
}
