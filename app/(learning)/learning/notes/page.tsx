import { redirect } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { NotesExplorer } from "@/components/notes-explorer";
import { NOTES_SUMMARIES, NOTES_TECHNOLOGIES, getStudyNote } from "@/lib/server/notes-study-catalog";
import { STUDY_FILTERS } from "@/lib/notes-study";
import { requireLearningUser as currentUser } from "@/lib/server/subscription-access";
import { authConfigured, databaseConfigured, billingConfigured } from "@/lib/server/config";

export const metadata = { title: "Notes" };
type Filters = { q?: string | string[]; technology?: string | string[]; kind?: string | string[]; note?: string | string[] };
const scalar = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

export default async function NotesPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const params = await searchParams;
  const user = (authConfigured() || process.env.NODE_ENV === "production") ? await currentUser() : null;
  if (authConfigured() && !user) redirect("/sign-in");
  const selected = getStudyNote(scalar(params.note));
  const technology = selected?.technology ?? (NOTES_TECHNOLOGIES.some(item => item.id === scalar(params.technology)) ? scalar(params.technology) : "");
  return <Workspace initialCategory="notes" authEnabled={authConfigured()} configured={databaseConfigured()} billingEnabled={billingConfigured()} userEmail={user?.email ?? null}
    notesContent={<NotesExplorer key={`${scalar(params.q)}:${technology}:${scalar(params.kind)}:${selected?.id ?? ""}`} notes={NOTES_SUMMARIES} technologies={NOTES_TECHNOLOGIES.map(({ id, title, category, reading }) => ({ id, title, category, reading }))} initialQuery={selected ? "" : scalar(params.q)} initialTechnology={technology} initialKind={selected ? "" : STUDY_FILTERS.find(kind => kind === scalar(params.kind)) ?? ""} initialNote={selected?.id} />} />;
}
