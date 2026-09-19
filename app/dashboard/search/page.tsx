import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { AnswerSearch } from "@/components/answer-search";
import { awsCategories, awsHighlights } from "@/lib/pro-learn/aws-highlights";
import { aiCategories, aiTerms } from "@/lib/pro-learn/ai-glossary";
import { pythonCategories, pythonTopics } from "@/lib/pro-learn/python-handbook";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { currentUser } from "@/lib/server/auth";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = authConfigured() ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  const { q } = await searchParams;
  const question = typeof q === "string" ? q : "";
  // Built once per request on the server; the client receives trimmed rows only.
  const services = awsHighlights();
  return <Workspace initialCategory="search" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<AnswerSearch key={question} initialQuestion={question} awsServices={services} awsCategories={awsCategories(services)}
      aiGlossary={aiTerms()} aiGlossaryCategories={aiCategories()}
      pythonHandbook={pythonTopics()} pythonCategories={pythonCategories()} technologyHandbooks={TECHNOLOGY_HANDBOOKS} />} />;
}
