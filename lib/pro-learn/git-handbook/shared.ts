import type { AwsHighlight } from "../aws-highlights";
import { emptyAnswer, conciseFocus } from "../prepared-explanation";

/**
 * One Git command, taught as a process rather than as a definition.
 *
 * The other handbooks describe an API surface, where a one-line summary and a
 * few key points are enough. Git is a set of operations a reader performs at a
 * terminal, and the thing they actually need is the order to type them in and
 * what to check between the steps — so every row here carries its own numbered
 * walkthrough, authored with the real commands, rather than a generated one.
 *
 * `points` and `useCase` are what the catalogue card shows before the row is
 * opened; `steps`, `pitfall` and `questions` are what the answer adds once it
 * is.
 */
export type GitRow = {
  /** The command, or the concept, exactly as a reader would search for it. */
  name: string;
  category: string;
  /** What it is, in one sentence. The card's definition. */
  summary: string;
  /**
   * The command's general form, before any particular example fills it in.
   *
   * A walkthrough shows one way of running something; the syntax shows the
   * shape of every way, which is what a reader needs when their situation is
   * not the one the example used. Several lines where a command has genuinely
   * distinct forms. A concept row carries the form of the command it explains.
   */
  syntax: string[];
  /** Three things worth knowing before using it. The card's key points. */
  points: [string, string, string];
  /** The situation that makes a reader reach for it, and what it costs not to. */
  useCase: { title: string; scenario: string };
  /** The process, in the order it is performed. `code` is what gets typed. */
  steps: { title: string; detail: string; code?: string }[];
  /** The mistake this command is best known for. */
  pitfall: string;
  /** What an interviewer, or a colleague at a review, actually asks about it. */
  questions?: { question: string; answer: string }[];
};

const SOURCES = [{ title: "Git reference manual", url: "https://git-scm.com/docs", reviewedAt: "2026-09-22" }];

/**
 * Turn an authored row into a catalogue topic with its answer already prepared.
 *
 * Prepared here rather than on the server: `prepareSearchTopics` leaves a row
 * that already carries an explanation alone, and the generated one it would
 * otherwise build cannot invent the command sequence that is the whole point of
 * this handbook.
 */
export function gitTopic(row: GitRow): AwsHighlight {
  const answer = emptyAnswer(row.name, row.summary);
  answer.summary = `${row.name} in practice: the syntax, the order to run it in, and what to check between the steps.`;
  // Syntax leads the walkthrough rather than sitting beside it: a reader who
  // already knows the command wants the form and nothing else, and one who does
  // not needs it in front of them while they read the steps.
  answer.steps = [
    { title: "Syntax", detail: "The general form. Everything in angle brackets is yours to fill in; everything in square brackets is optional.", code: row.syntax.join("\n") },
    ...row.steps.map(step => ({ title: step.title, detail: step.detail, code: step.code ?? "" })),
  ];
  answer.keyPoints = [...row.points];
  answer.useCases = [{ ...row.useCase, example: "" }];
  answer.caveats = [row.pitfall];
  answer.subjects = (row.questions ?? []).map(entry => ({
    name: entry.question, summary: entry.answer, details: [], keyPoints: [],
  }));
  return {
    name: row.name, category: row.category, summary: row.summary,
    points: [...row.points], useCase: row.useCase, syntax: [...row.syntax],
    prepared: { answer, focus: conciseFocus(row.summary), kind: "interview", sources: SOURCES, walkthrough: "git" },
  };
}

export const GIT_SOURCES = SOURCES;
