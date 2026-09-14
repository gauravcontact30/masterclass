import { notFound, redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { CATEGORY_LABELS } from "@/lib/study/preparations";
import { currentUser } from "@/lib/server/auth";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
export const dynamic = "force-dynamic";
export default async function PreparationPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{preparation?:string;course?:string}> }) {
  const { category } = await params; const {preparation,course}=await searchParams;
  if (!Object.hasOwn(CATEGORY_LABELS, category)) notFound();
  const user = authConfigured() ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  return <Workspace key={category+":"+(preparation??"")+":"+(course??"")} initialCategory={category} initialPreparation={preparation} initialCourse={course} authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} />;
}
