import type { ObjectiveQuestion, VocabularyEntry } from "./domain";
import type { NoteCard, NoteSection } from "./notes-directory";

export type InterviewNote = { question: string; points: string[]; priority: number; rationale: string };
export type StudyNote = NoteCard & {
  learnInApp?: boolean;
  readerTitle?: string;
  contents?: { id: string; title: string; category: string }[];
  description: string; examples: NoteSection[]; useCases: NoteSection[];
  interview: InterviewNote[]; questions: ObjectiveQuestion[]; vocabulary: VocabularyEntry[];
};
export type NotesSummary = Pick<StudyNote, "id" | "technology" | "title" | "category" | "kinds" | "description" | "points" | "learnInApp"> & { searchText: string; priority: number };
export type NotesTechnology = { id: string; title: string; category: string; reading: NoteSection[] };

export const STUDY_FILTERS = ["All content", "Technology topics", "AWS services", "Methods", "Functions", "Interfaces", "Hooks", "Properties", "Classes", "Syntax", "Examples", "Interview questions", "Objective questions", "Vocabulary", "Synonyms", "Antonyms", "Glossary"];
export const NOTES_PAGE_SIZE = 4;

export function searchStudyNotes(notes: NotesSummary[], query: string, kind: string, minimumPriority = 0) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return notes.filter(note => (!kind || kind === "All content" || note.kinds.includes(kind)) && note.priority >= minimumPriority && terms.every(term => note.searchText.includes(term)));
}

export function notesPage<T>(items: T[], requested: number, size = NOTES_PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.max(1, Math.floor(requested) || 1), pages);
  return { page, pages, items: items.slice((page - 1) * size, page * size), start: items.length ? (page - 1) * size + 1 : 0, end: Math.min(page * size, items.length) };
}
