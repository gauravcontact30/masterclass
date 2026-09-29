import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { AnswerSearch } from "@/components/answer-search";
import { awsCategories, awsHighlights } from "@/lib/pro-learn/aws-highlights";
import { aiCategories, aiTerms } from "@/lib/pro-learn/ai-glossary";
import { pythonCategories, pythonTopics } from "@/lib/pro-learn/python-handbook";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { prepareHandbooks, prepareSearchTopics } from "@/lib/server/prepared-catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  const { q } = await searchParams;
  const question = typeof q === "string" ? q : "";
  // Only the first visible handbook is serialized into the initial response.
  // Inactive tabs fetch their complete content when selected.
  const ordered = [...TECHNOLOGY_HANDBOOKS].sort((a, b) => a.title.localeCompare(b.title));
  const first = ordered.slice(0, 1);
  const deferred = ordered.slice(1).map(({ topics, ...metadata }) => { void topics; return metadata; });
  const services = prepareSearchTopics(awsHighlights(), "AWS");
  return <Workspace initialCategory="search" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<AnswerSearch key={question} initialQuestion={question} awsServices={services} awsCategories={awsCategories(services)}
      aiGlossary={prepareSearchTopics(aiTerms(), "AI terms")} aiGlossaryCategories={aiCategories()}
      pythonHandbook={prepareSearchTopics(pythonTopics(), "Python")} pythonCategories={pythonCategories()} technologyHandbooks={prepareHandbooks(first)} deferredHandbooks={deferred} />} />;
}
