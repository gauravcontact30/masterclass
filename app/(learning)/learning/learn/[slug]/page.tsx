import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { LearningCustomPage } from "@/components/learning-custom-page";
import { learningPage } from "@/lib/server/learning-uploads";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { signInFor } from "@/lib/safe-redirect";

/** A page the owner added to the Learning Dashboard from Upload Learning › Learning pages. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = databaseConfigured() ? await learningPage(slug).catch(() => null) : null;
  return { title: page?.title ?? "Your learning dashboard" };
}
export default async function LearningCustomRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser(`/learning/learn/${slug}`) : null;
  if (authConfigured() && !user) redirect(signInFor(`/learning/learn/${slug}`));
  const page = databaseConfigured() && /^[a-z0-9][a-z0-9-]{0,59}$/.test(slug) ? await learningPage(slug) : null;
  if (!page) notFound();
  return <Workspace initialCategory="learn" learnSlug={page.slug} learnTitle={page.title} authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<LearningCustomPage slug={page.slug} title={page.title} description={page.description} />} />;
}
