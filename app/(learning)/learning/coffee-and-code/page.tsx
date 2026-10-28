import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { CoffeeAndCode } from "@/components/coffee-and-code";
import { ContentProvider } from "@/components/content-editing";
import { BLOG_POSTS, BLOG_TOPICS } from "@/lib/coffee-and-code";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { contentOverrides } from "@/lib/server/content-overrides";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";

export const metadata = { title: "Coffee & Code" };

export default async function CoffeeAndCodePage() {
  const authEnabled = authConfigured();
  const user = (authEnabled || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authEnabled && !user) redirect(signInFor("/learning/coffee-and-code"));
  const overrides = await contentOverrides();
  return <Workspace initialCategory="coffee-and-code" authEnabled={authEnabled}
    configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<ContentProvider overrides={overrides} canEdit={isSuperAdminUser(user)}><CoffeeAndCode posts={BLOG_POSTS} topics={BLOG_TOPICS} /></ContentProvider>} />;
}
