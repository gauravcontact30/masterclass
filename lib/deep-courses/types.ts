/**
 * Deep courses: topic-by-topic study material for whole technologies (Core Java, Spring Boot, C++, DSA…).
 * Each topic carries everything a learner needs in one place — what it is, when to use it, a multi-file
 * example, tips, and exam/interview questions split into subjective answers and objective MCQs.
 */
export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

/** One tab in the example editor. `path` may include folders; the tree is built from it. */
export type CourseFile = { path: string; code: string; note?: string };

export type SubjectiveQuestion = { q: string; a: string };
export type ObjectiveQuestion = { q: string; options: [string, string, string, string]; answer: 0 | 1 | 2 | 3; explain: string };

/**
 * The topic distilled for revision, shown above the Description: the one idea everything else rests on, the precise
 * answer to "explain <topic>" an interviewer or examiner expects, and the points a learner must not forget.
 */
export type TopicEssentials = { core: string; answer: string; keyPoints: string[] };

export type CourseTopic = {
  id: string;
  title: string;
  /** Module heading the topic is grouped under on the course page. */
  module: string;
  level: CourseLevel;
  minutes: number;
  summary: string;
  /** Core concept, precise answer and key points (./essentials/<course>.ts, or written with a generated topic). */
  essentials?: TopicEssentials;
  description: string[];
  usage: string[];
  files: CourseFile[];
  tips: string[];
  subjective: SubjectiveQuestion[];
  objective: ObjectiveQuestion[];
  /** The hands-on lab (./labs/<course>.ts): syntax, worked examples with their output, assignments, alternates. */
  lab?: TopicLab;
  /** A generated course's topic that has not been written yet (lib/server/course-generator.ts). */
  pending?: boolean;
  /** A generated topic's editor score (1-5) and the official documentation it was researched from, named not linked. */
  review?: { score: number | null; sources: { title: string; site: string }[] };
};

/** A runnable example and exactly what it prints. `file` names the editor tab (Main.java, main.cpp…). */
export type LabExample = { title: string; file: string; code: string; output: string; explain?: string };

/**
 * Everything a learner practises a topic with, in study order: how it works step by step, the syntax, one worked
 * example with its result, three graded examples, assignments with model answers, and the same job done other ways.
 */
export type TopicLab = {
  steps: string[];
  syntax: { file: string; code: string; notes: string[] };
  example: LabExample;
  simple: LabExample;
  moderate: LabExample;
  complex: LabExample;
  assignments: { q: string; a: string; code?: string }[];
  alternates: { title: string; why: string; file: string; code: string }[];
};

export type CourseId = "core-java" | "advanced-java" | "spring-boot" | "cpp" | "dsa" | "java-basic-to-advanced";

/** Card-sized facts about a course: safe to import into client bundles. */
export type CourseMeta = { id: string; name: string; glyph: string; tint: string; blurb: string; audience: string; highlights: string[] };

export type DeepCourse = CourseMeta & { intro: string[]; topics: CourseTopic[]; /** Official documentation a generated course was researched from, credited as plain text. */ sources?: { title: string; site: string }[] };
