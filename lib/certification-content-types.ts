/** The shape of lib/certification-content/<track>.json (scripts/generate-certification-content.ts). */
export type Difficulty = "easy" | "medium" | "hard";
/** The code, config, CLI command or query a question is about (exam-style questions only). */
export type QuestionCode = { language: string; code: string } | null;
export type ObjectiveQuestion = { question: string; code?: QuestionCode; options: string[]; answer: number; explanation: string; difficulty: Difficulty };
export type SubjectiveQuestion = { question: string; code?: QuestionCode; answer: string; keyPoints: string[]; difficulty: Difficulty };
/** A complete multi-file sample project for the step, shown file by file in the Apple-style editor. */
export type StepProject = { title: string; summary: string; run: string; files: { path: string; code: string }[] };
export type StepContent = {
  overview: string; objectives: string[]; concepts: { term: string; explanation: string }[]; keyFacts: string[];
  example: { caption: string; language: string; code: string }; project?: StepProject; pitfalls: string[];
  workflow: { title: string; steps: { label: string; detail: string }[] }; icons: string[]; image: string | null;
  objective: ObjectiveQuestion[]; subjective: SubjectiveQuestion[];
};
export type TrackContent = { track: string; generatedAt: string; model: string; source: string | null; steps: StepContent[] };
