import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { Techy } from "@/components/techy";
import { currentUser } from "@/lib/server/auth";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Techy · Profissional Learn" };

export default async function Page() {
  const user = authConfigured() ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  return <Workspace initialCategory="techy" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} notesContent={<Techy/>}/>;
}
