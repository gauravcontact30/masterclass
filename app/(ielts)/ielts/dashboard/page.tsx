import { ExamsShell } from "@/components/exams-shell";
import { IeltsDashboard, type IeltsView } from "@/components/ielts-dashboard";
import { requireExamUser } from "@/lib/server/portal";
// Signed-in page: renders once the IELTS Achievers account and its plan are read.
export const instant = false;
export const metadata = { title: "IELTS Dashboard" };
// The dashboard tabs a ?view= link can open (a client module's constants are not readable here).
const VIEWS: IeltsView[] = ["papers", "practice", "library", "hub"];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // An IELTS Achievers account on its trial or with a membership; the other portals' accounts do not open this page.
  const { user } = await requireExamUser("ielts", "/ielts/dashboard");
  const view = (await searchParams).view;
  return <ExamsShell portal="ielts" active="home" email={user.email}><IeltsDashboard initialView={VIEWS.includes(view as IeltsView) ? view as IeltsView : "papers"} /></ExamsShell>;
}
