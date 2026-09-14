import type { TechnologyGuide } from "./index";
import { buildFundamentals, type FundamentalSeed } from "@/lib/notes-fundamentals";
import { studyNotesToLessons } from "@/lib/notes-fundamentals-catalog";

/** Keep the library file and the notes course backed by the same lessons. */
export function backendGuide(id: string, title: string, seeds: FundamentalSeed[], project: string): TechnologyGuide {
  const notes = buildFundamentals(seeds, id);
  return {
    id, technologyId: id, topicId: `${id}-full`, level: "intermediate", version: 1,
    curriculum: {
      title, minutes: seeds.length * 30,
      objectives: [`Explain ${title} fundamentals and apply its core APIs.`, "Build, validate, test and operate a small backend application."],
      prerequisites: ["JavaScript modules, promises and async/await.", "Basic TypeScript and HTTP request/response concepts."],
      summary: `Learn ${title} through core concepts, code examples, practical exercises and interview questions.`,
      project,
      lessons: studyNotesToLessons(notes).map((lesson, index) => ({ ...lesson, code: seeds[index].workflow })),
      glossary: seeds.slice(0, 20).map(seed => ({ term: seed.title, definition: seed.facts.split("|")[0] })),
      sources: [...new Set(seeds.flatMap(seed => seed.sources))].map(url => ({ title: `${title} official documentation`, url, retrievedAt: "2026-09-13T00:00:00.000Z" })),
    },
  };
}
