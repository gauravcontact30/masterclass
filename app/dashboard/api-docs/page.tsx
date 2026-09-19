import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { ApiDocs } from "@/components/api-docs";
import { currentUser } from "@/lib/server/auth";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "API Docs · Developer Reference" };

export default async function Page() {
  const user = authConfigured() ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  return <Workspace initialCategory="api-docs" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null} notesContent={<Suspense fallback={<p role="status">Loading API reference…</p>}><ApiDocs/></Suspense>}/>;
}
