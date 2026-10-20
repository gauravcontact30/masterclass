import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { DashboardLearning } from "@/components/dashboard-learning";
import { landingDaily } from "@/lib/server/landing-daily";
import { officialTechDocs, previewTechDocs, slimTechDocs } from "@/lib/server/official-tech-docs";
import { TECH_CONCEPTS } from "@/lib/tech-docs-concepts";
import { account } from "@/lib/server/repository";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { currentUser } from "@/lib/server/auth";
import { authConfigured,databaseConfigured,billingConfigured } from "@/lib/server/config";
import { legacyDashboardRoute } from "@/lib/dashboard-routes";
import { contentOverrides } from "@/lib/server/content-overrides";
export default async function Dashboard({searchParams}:{searchParams:Promise<{tab?:string|string[]}>}){
  const {tab}=await searchParams;
  if(tab!==undefined)redirect(legacyDashboardRoute(tab));
  const user=authConfigured()?await currentUser():null;
  if(authConfigured()&&!user)redirect("/sign-in");
  // Members, trial users and the super admin get the full sections; an unpaid account after its trial gets previews.
  // If the account can't be read these stay open: they show public documentation, and the learning APIs gate themselves.
  const superAdmin=!!user&&isSuperAdminUser(user);
  const [locked,overrides,docs]=await Promise.all([!!user&&!superAdmin&&account(user.id).then(a=>a.tier==="free",()=>false),contentOverrides(),officialTechDocs()]);
  return <Workspace authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email??null} learning={<DashboardLearning daily={landingDaily()} techDocs={locked?previewTechDocs(docs):slimTechDocs(docs)} concepts={locked?undefined:TECH_CONCEPTS} locked={locked} overrides={overrides} canEdit={superAdmin} />} />;
}
