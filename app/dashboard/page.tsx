import { Workspace } from "@/components/workspace";
import { authConfigured,databaseConfigured,billingConfigured } from "@/lib/server/config";
import { auth } from "@clerk/nextjs/server";
export const dynamic="force-dynamic";
export default async function Dashboard(){if(authConfigured())await auth.protect();return <Workspace authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} />;}
