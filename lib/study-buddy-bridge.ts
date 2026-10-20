/**
 * Opens Study Buddy (components/student-chatbot.tsx) from anywhere, optionally asking a question at once: the
 * landing page's "Ask Study Buddy" strip and the dashboard's "Ask AI" button use it. Dependency-free on purpose,
 * because the landing page imports it (no zod or Supabase on that page).
 */
export type StudyBuddyMode = "study" | "interview" | "javascript";
export type StudyBuddyRequest = { question?: string; mode?: StudyBuddyMode };
export const STUDY_BUDDY_EVENT = "study-buddy:ask";

export function askStudyBuddy(request: StudyBuddyRequest = {}) {
  const question = request.question?.trim().slice(0, 6000);
  window.dispatchEvent(new CustomEvent<StudyBuddyRequest>(STUDY_BUDDY_EVENT, { detail: { question: question || undefined, mode: request.mode } }));
}
