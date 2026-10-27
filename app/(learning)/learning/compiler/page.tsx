import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { OnlineCompiler } from "@/components/online-compiler";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";

export const metadata = { title: "Compiler · Java and C++" };

export default async function Page() {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  return <Workspace initialCategory="compiler" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} notesContent={<OnlineCompiler />}/>;
}
