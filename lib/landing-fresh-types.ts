/**
 * The landing page's daily AI-written additions (lib/server/landing-fresh.ts), written each night through the
 * Vercel AI Gateway: the "Or try" goals, an interview question of the day, a difference of the day and a docs tip
 * of the day, each with its own picture. Client-safe types only.
 */
export type FreshGoal = { tech: string; hiTech: string; goal: string; hiGoal: string };
/** `day` (YYYY-MM-DD, India) is when each item was written, shown on its card. */
export type FreshQuestion = {
  day: string; techId: string; tech: string; question: string; answer: string;
  objective: { question: string; options: string[]; answer: number; why: string };
  image: string | null;
};
export type FreshDifference = { day: string; comparisonId: string; title: string; answer: string; points: string[]; image: string | null };
export type FreshDocTip = { day: string; docId: string; doc: string; title: string; summary: string; steps: string[]; code: { language: string; code: string } | null; image: string | null };
export type LandingFresh = { day: string; generatedAt: string; goals: FreshGoal[]; interview: FreshQuestion | null; difference: FreshDifference | null; doc: FreshDocTip | null };
