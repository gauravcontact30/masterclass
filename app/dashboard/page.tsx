import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { DashboardLearning } from "@/components/dashboard-learning";
import { landingDaily } from "@/lib/server/landing-daily";
import { officialTechDocs } from "@/lib/server/official-tech-docs";
import { account } from "@/lib/server/repository";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { currentUser } from "@/lib/server/auth";
import { authConfigured,databaseConfigured,billingConfigured } from "@/lib/server/config";
export default async function Dashboard({searchParams}:{searchParams:Promise<{tab?:string}>}){
  const {tab}=await searchParams;const initialTab=tab==="library"||tab==="plans"||tab==="settings"?tab:"dashboard";
  const user=authConfigured()?await currentUser():null;
  if(authConfigured()&&!user)redirect("/sign-in");
  // Members, trial users and the super admin get the full sections; an unpaid account after its trial gets previews.
  // If the account can't be read these stay open: they show public documentation, and the learning APIs gate themselves.
  const locked=!!user&&!isSuperAdminUser(user)&&await account(user.id).then(a=>a.tier==="free",()=>false);
  return <Workspace initialTab={initialTab} authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email??null} learning={<DashboardLearning daily={landingDaily()} techDocs={await officialTechDocs()} locked={locked} />} />;
}
