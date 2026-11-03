import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { ApiTechGuide } from "@/components/api-tech-guide";
import { API_PACKAGES } from "@/lib/api-docs";
import { fieldGuide } from "@/lib/api-field-guides";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { apiMapRows, apiPreview } from "@/lib/server/api-previews";
import { learningViewer } from "@/lib/server/subscription-access";
import { isSuperAdminUser } from "@/lib/study/preparations";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

type Props = { params: Promise<{ packageId: string }> };

export async function generateMetadata({ params }: Props) {
  const { packageId } = await params;
  const pkg = API_PACKAGES.find(item => item.id === packageId);
  return { title: pkg ? `${pkg.name} · API Docs` : "API Docs" };
}

export default async function Page({ params }: Props) {
  const { packageId } = await params;
  const pkg = API_PACKAGES.find(item => item.id === packageId), guide = fieldGuide(packageId);
  if (!pkg) redirect("/learning/api-docs");
  const signedIn = authConfigured() || process.env.NODE_ENV === "production";
  const viewer = signedIn ? await learningViewer(`/learning/api-docs/${packageId}`) : null;
  const member = viewer?.member ?? true;
  return <Workspace initialCategory="api-docs" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={viewer?.user.email ?? null} initialSuperAdmin={isSuperAdminUser(viewer?.user ?? null)}
    notesContent={<ApiTechGuide pkg={pkg} guide={guide} free={apiPreview(pkg)} rows={apiMapRows(pkg, member)} member={member} />} />;
}
