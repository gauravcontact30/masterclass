import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { AnswerSearch } from "@/components/answer-search";
import { awsCategories, popularAwsHighlights } from "@/lib/pro-learn/aws-highlights";
import { aiCategories, aiTerms } from "@/lib/pro-learn/ai-glossary";
import { pythonCategories, pythonTopics } from "@/lib/pro-learn/python-handbook";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { prepareHandbooks, prepareSearchTopics } from "@/lib/server/prepared-catalog";
import { withApiReference } from "@/lib/server/handbook-api-reference";
import { signInFor } from "@/lib/safe-redirect";
// Signed-in page: renders once the user is read, like its layout (instant = false there does not cover pages).
export const instant = false;

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser("/learning/search") : null;
  if (authConfigured() && !user) redirect(signInFor("/learning/search"));
  const { q } = await searchParams;
  const question = typeof q === "string" ? q : "";
  // Only the first visible handbook is serialized into the initial response.
  // Inactive tabs fetch their complete content when selected.
  // Each tab also carries the API Docs reference for its technology.
  const ordered = withApiReference(TECHNOLOGY_HANDBOOKS).sort((a, b) => a.title.localeCompare(b.title));
  const first = ordered.slice(0, 1);
  const deferred = ordered.slice(1).map(({ topics, ...metadata }) => { void topics; return metadata; });
  const services = prepareSearchTopics(popularAwsHighlights(), "AWS");
  return <Workspace initialCategory="search" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<AnswerSearch key={question} initialQuestion={question} awsServices={services} awsCategories={awsCategories(services)}
      aiGlossary={prepareSearchTopics(aiTerms(), "AI terms")} aiGlossaryCategories={aiCategories()}
      pythonHandbook={prepareSearchTopics(pythonTopics(), "Python")} pythonCategories={pythonCategories()} technologyHandbooks={prepareHandbooks(first)} deferredHandbooks={deferred} />} />;
}
