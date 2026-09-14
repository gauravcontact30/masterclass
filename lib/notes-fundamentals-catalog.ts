import type { Lesson } from "./domain";
import type { StudyNote } from "./notes-study";
import { NEXTJS16_FUNDAMENTALS } from "./notes-nextjs-fundamentals";
import { AI_CONCEPTS } from "./notes-ai-concepts";
import { AI_FUNDAMENTALS } from "./notes-ai-fundamentals";
import { CLAUDE_FUNDAMENTALS } from "./notes-claude-fundamentals";
import { AI_COLLECTION, CLAUDE_COLLECTION, buildFundamentals } from "./notes-fundamentals";

export const FUNDAMENTAL_STUDY_NOTES = [
  ...buildFundamentals(CLAUDE_FUNDAMENTALS, CLAUDE_COLLECTION.id),
  ...buildFundamentals(AI_CONCEPTS, AI_COLLECTION.id),
  ...buildFundamentals(AI_FUNDAMENTALS, AI_COLLECTION.id),
];
export const studyNotesToLessons = (notes: StudyNote[]): Lesson[] => notes.map(note => ({
  title: note.title,
  explanation: note.points.map(point => `- ${point}`).join("\n"),
  example: note.examples[0].points.join("\n"),
  code: `# Illustrative workflow, not executable code\n${note.sections[0].code}`,
  keyPoints: note.points.slice(1).map(text => ({ tone: "key" as const, text })),
  useCase: { scenario: note.useCases[0].points[0], example: note.examples[0].points[0], usage: note.questions[0].shortAnswer },
  exercise: `Apply this concept to a small example of your own. ${note.interview[0].question}`,
  checkpoint: note.questions[0].question,
  mistake: note.points[note.points.length - 1],
  vocabulary: note.vocabulary,
  interview: note.interview.map(item => ({ question: item.question, definition: note.description, answer: item.points.join("\n"), similar: [] })),
  objectiveQuestions: note.questions,
}));
export const FUNDAMENTAL_LESSONS = studyNotesToLessons(FUNDAMENTAL_STUDY_NOTES);
export const NEXTJS16_STUDY_NOTES = buildFundamentals(NEXTJS16_FUNDAMENTALS, "nextjs");
export const NEXTJS16_LESSONS = studyNotesToLessons(NEXTJS16_STUDY_NOTES);

export const FUNDAMENTAL_COLLECTIONS = [
  { ...CLAUDE_COLLECTION, seeds: CLAUDE_FUNDAMENTALS },
  { ...AI_COLLECTION, seeds: [...AI_CONCEPTS, ...AI_FUNDAMENTALS] },
];
