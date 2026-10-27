/*
 * What a learner ticks off on each in-depth course topic, shared by the topic page's checklist, the coloured topic
 * cards (course overview, /learning/lessons) and the dashboard's course progress. Client-safe.
 */

export const TOPIC_CHECKLIST = [
  { id: "steps", label: "Step by step explanation", anchor: "steps" },
  { id: "syntax", label: "Syntax", anchor: "syntax" },
  { id: "example", label: "Example and its output", anchor: "example" },
  { id: "simple", label: "Simple example", anchor: "simple" },
  { id: "moderate", label: "Moderate example", anchor: "moderate" },
  { id: "complex", label: "Complex example", anchor: "complex" },
  { id: "assignments", label: "Assignment questions", anchor: "assignments" },
  { id: "alternates", label: "Alternate ways", anchor: "alternates" },
  { id: "questions", label: "Interview and exam questions", anchor: "subjective" },
] as const;

export type ChecklistId = typeof TOPIC_CHECKLIST[number]["id"];
export const CHECKLIST_IDS = TOPIC_CHECKLIST.map(item => item.id) as ChecklistId[];

/** One topic's progress: the checklist items ticked, whether it is complete, and when it last changed (ms). */
export type TopicProgress = { checklist: ChecklistId[]; completed: boolean; updatedAt: number };
/** Keyed `${courseId}/${topicId}`. */
export type ProgressMap = Record<string, TopicProgress>;

export const progressKey = (courseId: string, topicId: string) => `${courseId}/${topicId}`;

/** 0..1: a completed topic counts in full; otherwise its share of the checklist. */
export function topicShare(entry: TopicProgress | undefined) {
  if (!entry) return 0;
  return entry.completed ? 1 : entry.checklist.length / TOPIC_CHECKLIST.length;
}

/** Light tints for topic cards, one per topic in turn, so neighbouring cards never share a colour. */
export const TOPIC_TINTS = [
  { tint: "#eef4fd", ink: "#1d4f91" }, { tint: "#f1eefd", ink: "#4c2f9b" }, { tint: "#eaf7f0", ink: "#1d6b45" }, { tint: "#fdf3e6", ink: "#8a4b0f" },
  { tint: "#fdeef3", ink: "#9b2550" }, { tint: "#e9f6f8", ink: "#155e6b" }, { tint: "#f6f5e6", ink: "#66600f" }, { tint: "#f3eef8", ink: "#6b2f7d" },
] as const;
export const topicTint = (index: number) => TOPIC_TINTS[index % TOPIC_TINTS.length];
