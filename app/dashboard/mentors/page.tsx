import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { currentUser } from "@/lib/server/auth";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";
import { proSectionContent } from "@/lib/server/pro-learn-pages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentors · Profissional Learn" };

export default async function Page() {
  const user = authConfigured() ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  return <Workspace initialCategory="mentors" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} notesContent={proSectionContent("mentors")}/>;
}
