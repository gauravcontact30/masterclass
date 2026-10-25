import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { CATEGORY_LABELS } from "@/lib/study/preparations";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  return { title: Object.hasOwn(CATEGORY_LABELS, category) ? CATEGORY_LABELS[category].en : "Your learning dashboard" };
}
export default async function PreparationPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{preparation?:string;course?:string}> }) {
  const { category } = await params; const {preparation,course}=await searchParams;
  // An unknown or retired category opens the dashboard rather than a dead end.
  if (!Object.hasOwn(CATEGORY_LABELS, category)) redirect("/learning");
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  return <Workspace key={category+":"+(preparation??"")+":"+(course??"")} initialCategory={category} initialPreparation={preparation} initialCourse={course} authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} />;
}
