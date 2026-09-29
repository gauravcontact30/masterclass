import type { SearchAnswer } from "../types";

export type RevisionUnit = {
  match: RegExp;
  title: string;
  fact: string;
  formula: string;
  symbols: string;
  question: string;
  working: string[];
  answer: string;
  trap: string;
};

export const unit = (match: RegExp, title: string, fact: string, formula: string, symbols: string,
  question: string, working: string[], answer: string, trap: string): RevisionUnit =>
  ({ match, title, fact, formula, symbols, question, working, answer, trap });

export type ClassroomLesson = { subject: string; name: string; category: string; examFocus: string; answer: SearchAnswer };
