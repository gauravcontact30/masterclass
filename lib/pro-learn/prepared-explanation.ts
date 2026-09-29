import type { SearchAnswer } from "./types";

export type PreparedExplanation = {
  walkthrough?: "git";
  answer: SearchAnswer;
  focus: string;
  kind: "exam" | "interview";
  sources?: { title: string; url: string }[];
};

export function emptyAnswer(title: string, summary: string): SearchAnswer {
  return { headline: title, definition: summary, summary: "", steps: [], alternatives: [], useCases: [], industries: [], subjects: [],
    formulas: [], worked: [], files: [], keyPoints: [], caveats: [], followUps: [], diagrams: [] };
}

export function conciseFocus(summary: string, limit = 150) {
  const text = summary.replace(/^.*? · /, "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function summaryExplanation(name: string, summary: string, category: string): PreparedExplanation {
  const answer = emptyAnswer(name, summary);
  const facts = [...new Set(summary.split(/(?<=[.;])\s+|\s+—\s+/).map(item => item.trim()).filter(Boolean))];
  const focus = facts[0] ?? summary;
  const secondFact = facts[1] ?? `It is commonly used when working with ${category.toLowerCase()}.`;
  answer.summary = `Learn ${name} through its purpose, behavior, and practical trade-offs. ${summary}`;
  answer.steps = [
    { title: "Core concept", detail: focus, code: "" },
    { title: "How it fits", detail: secondFact, code: "" },
    { title: "Check your understanding", detail: `Before using ${name}, identify the input, the expected result, and the constraint that matters most in this context.`, code: "" },
  ];
  answer.keyPoints = [...new Set([focus, secondFact, `Choose ${name} when its ${category.toLowerCase()} behavior matches the problem.`])];
  answer.subjects = [
    { name: `Question: What is ${name}?`, summary: `Answer: ${focus}`, details: facts.slice(1), keyPoints: [] },
    { name: `Question: Why does ${name} matter?`, summary: `Answer: ${secondFact}`, details: [`It gives you a predictable way to reason about ${category.toLowerCase()} decisions.`], keyPoints: [] },
    { name: `Question: What should you verify before using it?`, summary: `Answer: Match the feature to the problem rather than choosing it by name alone.`, details: [`Check inputs, outputs, limits, and the failure case.`], keyPoints: [] },
  ];
  return { answer, focus: conciseFocus(summary), kind: "interview" };
}
