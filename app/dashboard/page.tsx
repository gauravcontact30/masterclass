import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { currentUser } from "@/lib/server/auth";
import { authConfigured,databaseConfigured,billingConfigured } from "@/lib/server/config";
export const dynamic="force-dynamic";
export default async function Dashboard({searchParams}:{searchParams:Promise<{tab?:string}>}){
  const {tab}=await searchParams;const initialTab=tab==="library"||tab==="plans"||tab==="settings"?tab:"dashboard";
  const user=await currentUser();
  return <Workspace initialTab={initialTab} authEnabled={true} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email??"student@masterclass.dev"} />;
}
