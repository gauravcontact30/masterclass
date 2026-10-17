import tracksData from "./tracks.json";
import interviewData from "./interview.json";

/*
 * Tracks and interview constants for Lessons, Quiz, Interview and Mentors. Kept apart from ./types.ts, whose zod
 * schemas would otherwise ship to every dashboard page through the sidebar's track list. ./types.ts re-exports these.
 */
/** A learning track (technology) shared by Lessons, Quiz, Interview and Mentors. */
export type ProTrack = { id: string; name: string; icon: string; focus: string; syllabus: string[] };
export type InterviewItem = { cat: string; lvl: "Easy" | "Medium" | "Hard"; co: string[]; q: string; a: string };
export const PRO_TRACKS: ProTrack[] = tracksData;
export const INTERVIEW_COMPANIES: string[] = interviewData.companies;
export const INTERVIEW_BANK = interviewData.questions as InterviewItem[];
export const PRO_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const INTERVIEW_LEVELS = ["All", "Easy", "Medium", "Hard"] as const;
export const trackById = (id: string | null | undefined) => PRO_TRACKS.find(track => track.id === id);
