import { z } from "zod";
import tracksData from "./tracks.json";
import interviewData from "./interview.json";
import { learningProjectSchema, subjectiveQuestionSchema, objectiveQuestionSchema } from "@/lib/api-learning-schema";

/** A learning track (technology) shared by Lessons, Quiz, Interview and Mentors. */
export type ProTrack = { id: string; name: string; icon: string; focus: string; syllabus: string[] };
export type LessonSection = { h: string; p: string[]; code?: string; key?: string[]; warn?: string[]; list?: string[] };
export type ProLesson = { track: string; id: string; title: string; level: string; minutes: number; tag: string; summary: string; lead: string; sections: LessonSection[]; takeaways: string[] };
export type InterviewItem = { cat: string; lvl: "Easy" | "Medium" | "Hard"; co: string[]; q: string; a: string };

export const PRO_TRACKS: ProTrack[] = tracksData;
export const INTERVIEW_COMPANIES: string[] = interviewData.companies;
export const INTERVIEW_BANK = interviewData.questions as InterviewItem[];
export const PRO_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const INTERVIEW_LEVELS = ["All", "Easy", "Medium", "Hard"] as const;
export const trackById = (id: string | null | undefined) => PRO_TRACKS.find(track => track.id === id);

// Shared by browser and server so a generated payload is validated identically on both sides.
export const vocabSchema = z.object({
  word: z.string().min(1).max(80), sentence: z.string().max(400).optional().default(""), meaning: z.string().max(400).optional().default(""),
  synonyms: z.array(z.string().max(60)).max(6).optional().default([]), antonyms: z.array(z.string().max(60)).max(4).optional().default([]), examples: z.array(z.string().max(300)).max(3).optional().default([]),
});
export const quizQuestionSchema = z.object({
  q: z.string().min(5).max(600), options: z.array(z.string().min(1).max(300)).length(4), answer: z.number().int().min(0).max(3),
  explain: z.string().min(10).max(1600), vocab: z.array(vocabSchema).max(6).optional().default([]),
});
export const lessonSchema = z.object({
  title: z.string().min(3).max(140), tag: z.string().max(40).default("Lesson"), level: z.enum(PRO_LEVELS).catch("Intermediate"), minutes: z.number().int().min(2).max(30).catch(6),
  summary: z.string().max(300).default(""), lead: z.string().max(1500).default(""),
  sections: z.array(z.object({ h: z.string().min(1).max(140), p: z.array(z.string().max(1500)).min(1).max(6), code: z.string().max(4000).optional(), list: z.array(z.string().max(300)).max(10).optional() })).min(2).max(8),
  takeaways: z.array(z.string().max(300)).min(1).max(6),
});
export const generatedInterviewSchema = z.object({
  question: z.string().min(5).max(600), answer: z.string().min(10).max(5000), keyPoints: z.array(z.string().max(300)).max(6).default([]),
  followUps: z.array(z.string().max(300)).max(4).default([]), category: z.string().max(60).default("General"), company: z.string().max(60).default(""), level: z.enum(["Easy", "Medium", "Hard"]).catch("Medium"),
});
export const apiDetailSchema = z.object({
  packageName: z.string().max(120), description: z.string().min(10).max(900), since: z.string().max(80).default(""), signature: z.string().max(2000).default(""),
  parameters: z.array(z.object({ name: z.string().max(80), type: z.string().max(160), description: z.string().max(500) })).max(14).default([]),
  returns: z.string().max(500).default(""), notes: z.array(z.string().max(400)).min(1).max(8), useCases: z.array(z.string().max(300)).max(6).default([]),
  descriptionLong: z.string().max(2500).default(""), code: z.string().max(5000).default(""), related: z.array(z.string().max(120)).max(8).default([]),
  vocabulary: z.array(vocabSchema).max(10).default([]),
  subjective: z.array(subjectiveQuestionSchema).max(8).default([]),
  objective: z.array(objectiveQuestionSchema).max(8).default([]),
  project: learningProjectSchema.nullable().default(null),
});

/** One file of a searched answer's worked example, addressed by its path so the card can draw a tree. */
export const answerFileSchema = z.object({
  path: z.string().min(1).max(160),
  code: z.string().max(6000).default(""),
  note: z.string().max(200).default(""),
});

/**
 * A searched answer: the direct reply first, then the step-by-step flow, then
 * what to watch out for. Shaped so the page can render it without prose
 * parsing, and capped so one answer stays scannable.
 *
 * `definition`, `alternatives`, `useCases` and `files` default rather than being
 * required, so an older or terser model reply still renders as a card instead
 * of failing validation; the card simply omits the sections it has nothing for.
 */
export const searchAnswerSchema = z.object({
  headline: z.string().min(5).max(180),
  definition: z.string().max(500).default(""),
  summary: z.string().min(20).max(900),
  steps: z.array(z.object({
    title: z.string().min(3).max(120),
    detail: z.string().min(10).max(700),
    code: z.string().max(1400).default(""),
  })).min(2).max(8),
  alternatives: z.array(z.object({
    title: z.string().min(2).max(120),
    detail: z.string().max(400).default(""),
    when: z.string().max(200).default(""),
  })).max(5).default([]),
  useCases: z.array(z.object({
    title: z.string().min(2).max(120),
    scenario: z.string().max(500).default(""),
    example: z.string().max(1200).default(""),
  })).max(5).default([]),
  /**
   * One entry per named thing when the question asks about several at once
   * ("explain S3, EC2 and Lambda"). A single-subject question leaves this
   * empty and the answer reads as one document, as before.
   */
  subjects: z.array(z.object({
    name: z.string().min(1).max(80),
    summary: z.string().max(600).default(""),
    details: z.array(z.string().max(400)).max(6).default([]),
    keyPoints: z.array(z.string().max(300)).max(5).default([]),
  })).max(8).default([]),
  files: z.array(answerFileSchema).max(8).default([]),
  keyPoints: z.array(z.string().max(300)).max(6).default([]),
  caveats: z.array(z.union([
    z.string().max(300),
    z.object({ text: z.string().max(300), code: z.string().max(1400).default("") }),
  ])).max(4).default([]),
  followUps: z.array(z.string().max(160)).max(4).default([]),
});
export type AnswerFile = z.infer<typeof answerFileSchema>;
export type SearchAnswer = z.infer<typeof searchAnswerSchema>;

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type GeneratedLesson = z.infer<typeof lessonSchema>;
export type GeneratedInterview = z.infer<typeof generatedInterviewSchema>;
export type GeneratedApiDetail = z.infer<typeof apiDetailSchema>;
export type MentorMessage = { role: "user" | "assistant"; content: string };
/** "ai" when the model produced the content, "library" when it came from the app's own curated banks. */
export type ContentSource = "ai" | "library";
