import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { Techy } from "@/components/techy";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";

export const metadata = { title: "Techy · Professional Learn" };

export default async function Page() {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser("/learning/techy") : null;
  if (authConfigured() && !user) redirect(signInFor("/learning/techy"));
  return <Workspace initialCategory="techy" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} notesContent={<Techy/>}/>;
}
