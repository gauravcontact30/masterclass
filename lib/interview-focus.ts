/**
 * Interview focus narrows every study note to the material that actually gets
 * asked about, without deleting anything: the toggle is reversible and the
 * hidden sections come straight back when it is switched off.
 */

export type StudySectionId =
  | "points"
  | "code"
  | "useCases"
  | "interview"
  | "questions"
  | "vocabulary"
  | "concepts";

export const STUDY_SECTIONS: { id: StudySectionId; title: string; interview: boolean }[] = [
  { id: "points", title: "Key points", interview: true },
  { id: "code", title: "Syntax, meaning & examples", interview: true },
  { id: "concepts", title: "Concepts & practice", interview: true },
  { id: "interview", title: "Interview questions & answers", interview: true },
  { id: "questions", title: "Objective questions", interview: true },
  // Narrative and language-learning material: valuable, but not what an
  // interviewer asks, so it is what gets folded away first.
  { id: "useCases", title: "Real-world use cases", interview: false },
  { id: "vocabulary", title: "Vocabulary, synonyms & antonyms", interview: false },
];

const INTERVIEW_IDS = new Set(STUDY_SECTIONS.filter(section => section.interview).map(section => section.id));

/** Hidden sections are the only difference between the two modes. */
export const showsSection = (id: StudySectionId, focused: boolean) => !focused || INTERVIEW_IDS.has(id);

export const hiddenSectionTitles = () => STUDY_SECTIONS.filter(section => !section.interview).map(section => section.title);

export const INTERVIEW_FOCUS_STORAGE_KEY = "masterclass:interview-focus";
