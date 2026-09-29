import type { AwsHighlight } from "../aws-highlights";
import { conciseFocus, emptyAnswer, type PreparedExplanation } from "../prepared-explanation";
import { MATHS_LESSONS } from "./maths-lessons";
import { PHYSICS_LESSONS, CHEMISTRY_LESSONS } from "./science-lessons";
import { ENGLISH_LESSONS, EXAM_LESSONS } from "./language-exam-lessons";
import type { RevisionUnit } from "./lesson-types";

const BANKS: Record<string, RevisionUnit[]> = { maths: MATHS_LESSONS, physics: PHYSICS_LESSONS, chemistry: CHEMISTRY_LESSONS, english: ENGLISH_LESSONS };

function examSubject(name: string): string | undefined {
  if (/at a glance|eligib|selection|physical|current affairs/i.test(name)) return;
  if (/english|grammar|vocab|comprehension|language/i.test(name)) return "english";
  if (/chemistr|organic|inorganic/i.test(name)) return "chemistry";
  if (/physics|mechanic|optic|electric/i.test(name)) return "physics";
  if (/math|quantitative|arithmetic|number|percent|ratio|profit|loss|interest|mensuration|algebra|geometry|time.*work|time.*distance|statistic|probability/i.test(name)) return "maths";
}

export function classroomExplanation(subject: string, topic: AwsHighlight): PreparedExplanation {
  const bank = BANKS[subject] ?? BANKS[examSubject(topic.name) ?? ""] ?? EXAM_LESSONS;
  const match = bank.find(unit => unit.match.test(topic.name)) ?? bank.find(unit => unit.match.test(topic.summary));
  const focus = topic.summary.replace(/^.*? · /, "");
  const answer = emptyAnswer(topic.name, focus);
  if (match) {
    answer.summary = match.fact;
    // No title: the step is one line of working, and the list is numbered
    // already, so "Step 1" above it says nothing the number did not.
    answer.steps = match.working.map(detail => ({ title: "", detail, code: "" }));
    answer.formulas = match.formula ? [{ name: match.title, expression: match.formula, meaning: match.symbols }] : [];
    answer.worked = [{ question: match.question, steps: match.working.map(detail => ({ detail, expression: "" })), answer: match.answer }];
    answer.keyPoints = [focus, match.fact, ...(match.symbols ? [match.symbols] : []), `Avoid the common error: ${match.trap}`];
    answer.caveats = [match.trap];
    answer.subjects = [
      { name: `Question: What is ${match.title}?`, summary: `Answer: ${match.fact}`, details: match.symbols ? [match.symbols] : [], keyPoints: [] },
      { name: `Question: How do you solve a typical problem?`, summary: `Answer: ${match.answer}`, details: match.working, keyPoints: [] },
      { name: `Question: What mistake should you avoid?`, summary: `Answer: ${match.trap}`, details: [], keyPoints: [] },
    ];
    if (!match.match.test(topic.name)) answer.subjects.unshift({ name: `Supporting foundation: ${match.title}`, summary: "The worked example below reviews a foundation from this topic's chapter.", details: [], keyPoints: [] });
  } else {
    // No unrelated numerical example is substituted for a syllabus topic.
    const facts = focus.split(/;\s*|\.\s+(?=[A-Z])/).filter(Boolean);
    answer.summary = `${topic.category} revision focus: ${focus}`;
    answer.steps = [
      { title: "What this topic covers", detail: focus, code: "" },
      { title: "Build the exam answer", detail: `Explain the meaning of ${topic.name.toLowerCase()}, then address each part of the syllabus focus: ${focus}`, code: "" },
      { title: "Check the scope", detail: "Use the question's stated conditions and definitions. Include units for measured quantities and label the relationships in any diagram.", code: "" },
    ];
    answer.keyPoints = [...new Set([...facts, `Use the stated conditions and definitions before choosing a method.`])];
    answer.subjects = [
      { name: `Question: What is the main idea in ${topic.name}?`, summary: `Answer: ${focus}`, details: [], keyPoints: [] },
      { name: `Question: How should you approach it?`, summary: `Answer: Start with the definition, then apply the syllabus conditions step by step.`, details: [], keyPoints: [] },
      { name: `Question: What should you check?`, summary: "Answer: Check units, signs, labels, and whether the result satisfies the original conditions.", details: [], keyPoints: [] },
    ];
    answer.worked = [{ question: `What is the central revision objective for ${topic.name}?`, steps: [{ detail: `Identify the requested topic: ${topic.name}.`, expression: "" }, { detail: focus, expression: "" }], answer: focus }];
  }
  return { answer, kind: "exam", focus: conciseFocus(focus) };
}
