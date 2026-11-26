"use client";
import { useMemo } from "react";
import { ExamSamplePapers } from "./exam-sample-papers";
import { buildIeltsPracticeTests } from "@/lib/ielts/practice";

/*
 * IELTS Dashboard · Practice Tests (2026-11-26): the second IELTS bank (lib/ielts/practice.ts) as practice tests,
 * timed tests and the full question bank, with Task 1 charts, process diagrams, maps and Listening forms as pictures.
 * Loaded only when the tab opens (components/ielts-dashboard.tsx), so its pictures and text cost nothing elsewhere.
 */
export function IeltsPracticeTests() {
  const set = useMemo(() => buildIeltsPracticeTests(), []);
  const objective = set.asked.filter(q => q.options).length;
  return <ExamSamplePapers set={set} boardName="IELTS" title="IELTS" copy={{
    sampleTab: "Practice tests", mockTab: "Timed tests", askedTab: "Question bank",
    lede: <>IELTS Academic and General Training practice tests: {set.asked.length} questions with answers ({objective} objective, {set.asked.length - objective} written), in {set.sample.length + set.mock.length} tests of {set.sample[0]?.questions.length} questions. Listening note completion, Reading matching headings, Task 1 charts, diagrams and maps, vocabulary, idioms, collocations, spelling, paraphrasing, Task 2 essays, General Training letters and Speaking Part 2, each with a model answer. Original practice material, not official IELTS questions.</>,
    askedNote: "Every question in the bank, highest rated first. Five stars marks the task types in every IELTS test; it is our editorial rating, not an official count.",
    mockNote: <>Timed at {set.mock[0]?.minutes} minutes. Start the test, answer the objective questions, write the Task 1 report and the essay or letter, and speak the Part 2 answer aloud, then submit to see your score and every model answer.</>,
  }} />;
}
