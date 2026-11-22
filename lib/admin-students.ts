/** Super Admin → Students: the four audiences and the report shapes (shared by the API and the dashboard). */
export const STUDENT_SEGMENTS = {
  tech: { label: "Tech Professional", audience: "Tech Pro learners: courses, interview prep, Tech Buzz" },
  boards: { label: "Board Exams", audience: "Board Scholars: UP Board, CBSE and ICSE, Class 10 and 12" },
  competitive: { label: "Competitive Exams", audience: "Exam Aspirants: NDA, banks, railways, SSC, UPSC and more (TET has its own section)" },
  tet: { label: "TET Exams", audience: "Teacher Eligibility Test learners (CTET, UPTET) inside Exam Aspirants" },
} as const;
export type StudentSegment = keyof typeof STUDENT_SEGMENTS;
export const isStudentSegment = (value: string): value is StudentSegment => value in STUDENT_SEGMENTS;

export type StudentRow = {
  accountId: string; authUserId: string; name: string | null; email: string; joinedAt: string;
  access: "free" | "trial" | "monthly" | "yearly"; trialEndsAt: string | null;
  lastActive: string | null; views: number; answers: number; accuracy: number | null; focus: string | null;
};
export type ScopeRow = { scope: string; label: string; answers: number; students: number; accuracy: number };
export type StudentsReport = {
  segment: StudentSegment; label: string; windowDays: number; available: boolean;
  summary: { students: number; newInWindow: number; trial: number; paying: number; expired: number; active: number; answers: number; accuracy: number | null; views: number } | null;
  scopes: ScopeRow[]; students: StudentRow[]; generatedAt: string;
};
export type StudentTrace = { events: { kind: "view" | "answer"; at: string; title: string; detail: string; correct?: boolean | null }[] };
