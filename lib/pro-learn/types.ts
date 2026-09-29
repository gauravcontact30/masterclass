import { z } from "zod";
import { learningDiagramSchema } from "./learning-diagram";
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
  diagrams: z.array(learningDiagramSchema).max(3).optional(),
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
   * The problems this topic's technology removes, named by the sector that has
   * them.
   *
   * These belong to the whole technology rather than to one topic, so they are
   * shown here and never on a catalogue card — a sentence that is true of every
   * row in a category teaches nothing repeated down a grid of six, and reads
   * well when one topic is open. Defaulted rather than required: answers stored
   * before this field existed still parse.
   */
  industries: z.array(z.object({
    industry: z.string().min(2).max(80),
    problem: z.string().max(400),
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
  /**
   * The equations a Maths, Physics or Chemistry answer turns on.
   *
   * Kept as structured rows rather than left inside the prose so the page can
   * set them apart and a reader can find the formula without reading the
   * paragraph around it. `expression` is plain text, not LaTeX: it is rendered
   * as-is, and a half-parsed macro reads worse than a plain equation.
   */
  formulas: z.array(z.object({
    name: z.string().min(1).max(120),
    expression: z.string().min(1).max(220),
    meaning: z.string().max(300).default(""),
  })).max(6).default([]),
  /**
   * One exam-style question taken all the way to its answer.
   *
   * The steps list is the working, one line at a time: `detail` says what is
   * being done and `expression` is the line of algebra it produces, so a reader
   * can follow the reasoning and the arithmetic separately.
   */
  worked: z.array(z.object({
    question: z.string().min(3).max(300),
    steps: z.array(z.object({
      detail: z.string().max(300),
      expression: z.string().max(220).default(""),
    })).max(8).default([]),
    answer: z.string().max(220).default(""),
  })).max(3).default([]),
  files: z.array(answerFileSchema).max(8).default([]),
  /**
   * Raised from six: a prepared answer carries the topic's own points plus the
   * technology's authored essentials, and the searched answers read in the same
   * modal should not stop at half that.
   */
  keyPoints: z.array(z.string().max(300)).max(12).default([]),
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
