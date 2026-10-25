import type { Language, Tier } from "@/lib/domain";
import type { Appearance } from "./schemas";
export type { Appearance } from "./schemas";

export type Bilingual = Record<Language, string>;
export const bi = (en: string, hi: string, extra?: Partial<Record<Language, string>>): Bilingual => ({
  en,
  hi,
  es: extra?.es ?? en,
  ja: extra?.ja ?? en,
  de: extra?.de ?? en,
  fr: extra?.fr ?? en,
  zh: extra?.zh ?? en,
});
export const localize = (text: Bilingual, language: Language) => text[language] ?? text.en;
// School boards and their classes, and the government and entrance exams, were removed on 2026-10-24 (see ./catalog.ts).
export type StudySubject = "english" | "vocabulary" | "ielts" | "synonyms" | "antonyms" | "system-design";
export type StudyCourse = { id: string; title: Bilingual; category: "exam" | "course"; subject?: StudySubject; subjects: StudySubject[]; aliases: string[]; sourceUrl: string; scope: Bilingual };
export type StudyUnit = {
  id: string; subject: StudySubject; minGrade: number; maxGrade: number; title: Bilingual;
  idea: Bilingual; rule: Bilingual; example: Bilingual; solution: Bilingual; mistake: Bilingual;
  question: Bilingual; options: Bilingual[]; correct: number; explanation: Bilingual;
};
export type StudyQuestion = {
  id: string; unitId: string; type: "objective" | "subjective"; prompt: string;
  options?: string[]; correct?: number; answer: string; explanation: string; marks: number;
  rubric: string[]; importance: "high" | "medium"; importanceReason: string;
  origin: "original" | "past-paper-adaptation"; appearances: Appearance[];
};
export type StudyLesson = { id: string; title: string; diagram?: string[]; keyPoints: { tone: "key" | "tip" | "warning"; title: string; text: string }[] };
export type StudyPaper = { id: string; title: string; kind: "practice" | "sample"; minutes: number; questionIds: string[]; marksPerCorrect: number; negativeMarks: number; instructions: string };
export type StudyPack = {
  course: StudyCourse; language: Language; title: string; lessons: StudyLesson[]; questions: StudyQuestion[]; papers: StudyPaper[];
  access: { tier: Tier; preview: boolean; totalLessons: number; totalQuestions: number; viewerKey: string };
  coverage: string; sources: { title: string; url: string }[];
  reviewedPaperIds?: string[];
};
export type StudySection = "notes" | "subjectives" | "objectives" | "papers" | "samples" | "most-asked" | "important" | "years";
export const STUDY_SECTIONS: { id: StudySection; label: Bilingual }[] = [
  { id: "notes", label: bi("Study notes", "अध्ययन नोट्स") },
  { id: "subjectives", label: bi("Subjectives", "विषयनिष्ठ प्रश्न") },
  { id: "objectives", label: bi("Objectives", "वस्तुनिष्ठ प्रश्न") },
  { id: "papers", label: bi("Test Papers", "परीक्षण पत्र") },
  { id: "samples", label: bi("Sample Test Papers", "नमूना प्रश्न पत्र") },
  { id: "most-asked", label: bi("Most Asked · Ask rating", "सर्वाधिक पूछे गए · आवृत्ति") },
  { id: "important", label: bi("Most Important Questions", "अति महत्वपूर्ण प्रश्न") },
  { id: "years", label: bi("Year of Ask · Examinations", "पूछे जाने का वर्ष · परीक्षा") },
];

/** Frequency in the verified corpus, never a prediction of a future examination. */
export function askRating(appearances: Appearance[], reviewedPaperIds: string[]) {
  const corpus = new Set(reviewedPaperIds);
  const matches = new Set(appearances.filter(item => item.verified).map(item => `${item.exam}:${item.year}:${item.paper}`).filter(id => corpus.has(id)));
  return { occurrences: matches.size, reviewed: corpus.size, percent: corpus.size ? Math.round(matches.size / corpus.size * 100) : null };
}

export function gradePaper(paper: StudyPaper, questions: StudyQuestion[], answers: Record<string, number>) {
  const included = new Set(paper.questionIds);
  const objective = questions.filter(question => included.has(question.id) && question.type === "objective");
  if (Object.keys(answers).some(id => !objective.some(question => question.id === id))) throw new Error("invalid_answers");
  let correct = 0, wrong = 0;
  const review = objective.map(question => {
    const chosen = answers[question.id];
    if (chosen !== undefined && (chosen < 0 || chosen >= (question.options?.length ?? 0))) throw new Error("invalid_answers");
    const isCorrect = chosen !== undefined && chosen === question.correct;
    if (isCorrect) correct++; else if (chosen !== undefined) wrong++;
    return { id: question.id, chosen: chosen ?? null, correct: question.correct, isCorrect, explanation: question.explanation };
  });
  return { correct, wrong, unanswered: objective.length - correct - wrong, score: correct * paper.marksPerCorrect - wrong * paper.negativeMarks, maximum: objective.length * paper.marksPerCorrect, review };
}
