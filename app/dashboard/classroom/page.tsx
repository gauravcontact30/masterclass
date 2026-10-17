import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { AnswerSearch } from "@/components/answer-search";
import { CLASSROOM_CATALOGUES } from "@/lib/pro-learn/classroom";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, billingConfigured, databaseConfigured } from "@/lib/server/config";
import { classroomExplanation } from "@/lib/pro-learn/classroom/lessons";

const preparedCatalogues = CLASSROOM_CATALOGUES.map(catalogue => ({ ...catalogue,
  topics: catalogue.topics.map(topic => ({ ...topic, prepared: classroomExplanation(catalogue.id, topic) })),
}));

export const metadata = { title: "Class Room" };

export default async function ClassRoomPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  const { q } = await searchParams;
  const question = typeof q === "string" ? q : "";
  return <Workspace initialCategory="classroom" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<AnswerSearch key={question} initialQuestion={question}
      heading="Class Room" emptyNoun="topic" search={false}
      intro="Every subject from Class 6 to Class 12, and the exams that follow them. Pick a topic to have it explained."
      catalogues={preparedCatalogues} />} />;
}
