import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { StepByStep } from "@/components/step-by-step";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { SEARCH_FIXED_CATALOGUES } from "@/lib/step-by-step/technologies";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "On The Go" };

export default async function StepByStepPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser("/learning/step-by-step") : null;
  if (authConfigured() && !user) redirect(signInFor("/learning/step-by-step"));
  const { q } = await searchParams;
  const question = typeof q === "string" ? q : "";
  // The same technologies, in the same order, as the Search page's "Explore
  // topics" strip. Only the titles cross to the client; the handbooks stay here.
  const technologies = [...SEARCH_FIXED_CATALOGUES, ...TECHNOLOGY_HANDBOOKS.map(handbook => handbook.title).sort((a, b) => a.localeCompare(b))];
  return <Workspace initialCategory="step-by-step" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<StepByStep key={question} initialQuestion={question} technologies={technologies} />} />;
}
