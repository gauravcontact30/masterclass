import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { Certifications } from "@/components/certifications";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";

export const metadata = { title: "Certifications · Professional Learn" };

export default async function Page({ searchParams }: { searchParams: Promise<{ track?: string | string[] }> }) {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser("/learning/certifications") : null;
  if (authConfigured() && !user) redirect(signInFor("/learning/certifications"));
  const { track } = await searchParams;
  return <Workspace initialCategory="certifications" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<Certifications initialTrack={typeof track === "string" ? track : undefined} />} />;
}
