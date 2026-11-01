import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { DashboardLearning } from "@/components/dashboard-learning";
import { istWeek, landingDaily } from "@/lib/server/landing-daily";
import { officialTechDocs, previewTechDocs, slimTechDocs } from "@/lib/server/official-tech-docs";
import { TECH_CONCEPTS } from "@/lib/tech-docs-concepts";
import { account } from "@/lib/server/repository";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { currentUser } from "@/lib/server/auth";
import { authConfigured,databaseConfigured,billingConfigured } from "@/lib/server/config";
import { legacyDashboardRoute } from "@/lib/dashboard-routes";
import { contentOverrides } from "@/lib/server/content-overrides";
import { db } from "@/lib/server/db";

/** Whether the reader has a guide in progress, i.e. the dashboard will show a Resume strip. A failed read reserves nothing. */
async function hasUnfinishedGuide(id: string) {
  const { data, error } = await db().from("learning_progress").select("document_id").eq("user_id", id).eq("completed", false).limit(1);
  return !error && Boolean(data?.length);
}
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;
export default async function Dashboard({searchParams}:{searchParams:Promise<{tab?:string|string[]}>}){
  const {tab}=await searchParams;
  if(tab!==undefined)redirect(legacyDashboardRoute(tab));
  const user=authConfigured()?await currentUser():null;
  if(authConfigured()&&!user)redirect("/sign-in");
  // Members, trial users and the super admin get the full sections; an unpaid account after its trial gets previews.
  // If the account can't be read these stay open: they show public documentation, and the learning APIs gate themselves.
  const superAdmin=!!user&&isSuperAdminUser(user);
  // The plan and whether a guide is unfinished are read here too, so the trial banner and the Resume strip's space are in
  // the first paint: they used to appear only once /api/account answered, pushing the whole sheet down (field CLS 0.15).
  const [plan,overrides,docs,unfinished]=await Promise.all([!!user&&!superAdmin?account(user.id).catch(()=>null):null,contentOverrides(),officialTechDocs(),user&&databaseConfigured()?hasUnfinishedGuide(user.id):false]);
  const locked=plan?.tier==="free";
  return <Workspace authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email??null} initialSuperAdmin={isSuperAdminUser(user)} initialPlan={plan?{tier:plan.tier,trialEndsAt:plan.trialEndsAt??null}:null} reserveResume={unfinished} learning={<DashboardLearning daily={landingDaily()} today={istWeek()} techDocs={locked?previewTechDocs(docs):slimTechDocs(docs)} concepts={locked?undefined:TECH_CONCEPTS} locked={locked} overrides={overrides} canEdit={superAdmin} />} />;
}
