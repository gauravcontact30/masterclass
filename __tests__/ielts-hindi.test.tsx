/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/components/language-provider";
import { ExamLocaleProvider } from "@/components/exam-locale";
import { IeltsPreparation } from "@/components/ielts-preparation";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ieltsGuidance } from "@/lib/ielts-guidance";
import { LISTENING, READING, SPEAKING_CUE_CARDS, WRITING } from "@/lib/ielts-content";
import { IELTS_TOPICS } from "@/lib/ielts-topics";
import { HINDI_SHARDS } from "@/lib/locales/hi";

const read = (name: string) => JSON.parse(readFileSync(path.join(process.cwd(), "lib/locales/hi", name), "utf8"));
const shard: Record<string, string> = read("ielts.json");

test("every piece of IELTS guidance has Hindi in the ielts shard", () => {
  expect(HINDI_SHARDS.ielts).toBeDefined();
  const missing = ieltsGuidance().filter(text => !shard[text] || !/[ऀ-ॿ]/.test(shard[text]));
  expect(missing).toEqual([]);
});

test("the English test material itself is never translated", () => {
  const material = [
    ...LISTENING.map(exercise => exercise.script),
    ...Object.values(READING).flatMap(set => [set.passage, ...set.tfng.map(item => item.q), set.completion.prompt]),
    ...Object.values(WRITING).flatMap(type => Object.values(type).map(task => task.prompt)),
    ...SPEAKING_CUE_CARDS.flatMap(card => [card.title, ...card.part3]),
    ...IELTS_TOPICS.flatMap(topic => [topic.task2, ...topic.part1, ...topic.part3, ...topic.words.map(([word, , example]) => `${word}|${example}`)]),
  ];
  expect(material.filter(text => text in shard)).toEqual([]);
});

test("a Hindi reader sees IELTS guidance in Hindi while the passage stays English", async () => {
  localStorage.setItem("mc-language", "hi");
  render(<LanguageProvider><ExamLocaleProvider><IeltsPreparation /></ExamLocaleProvider></LanguageProvider>);
  expect(await screen.findByText(shard["Bring the same valid ID document you used when you booked the test."])).toBeInTheDocument();
  expect(screen.getByText(shard["Use the time before each part to read the questions and predict the type of answer (a number, a name, a noun)."])).toBeInTheDocument();
  expect(screen.queryByText("Bring the same valid ID document you used when you booked the test.")).not.toBeInTheDocument();
  localStorage.clear();
});

test("published Hindi covers every translatable Board, Competitive, TET and IELTS string", () => {
  const coverage = read("coverage.json");
  expect(coverage.rejectedPendingReview).toBe(0);
  expect(coverage.translatedStrings).toBeGreaterThanOrEqual(coverage.translatable);
});
