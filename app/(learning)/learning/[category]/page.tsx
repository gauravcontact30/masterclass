import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { CATEGORY_LABELS } from "@/lib/study/preparations";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  return { title: Object.hasOwn(CATEGORY_LABELS, category) ? CATEGORY_LABELS[category].en : "Your learning dashboard" };
}
export default async function PreparationPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{preparation?:string;course?:string}> }) {
  const { category } = await params; const {preparation,course}=await searchParams;
  // An unknown or retired category opens the dashboard rather than a dead end.
  if (!Object.hasOwn(CATEGORY_LABELS, category)) redirect("/learning");
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser(`/learning/${category}`) : null;
  if (authConfigured() && !user) redirect(signInFor(`/learning/${category}`));
  return <Workspace key={category+":"+(preparation??"")+":"+(course??"")} initialCategory={category} initialPreparation={preparation} initialCourse={course} authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} />;
}
