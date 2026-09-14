import "server-only";
import { AWS_AI_CORE_LESSON_COUNT } from "@/lib/generation/guides/aws-ai";
import { AWS_AI_TOPICS } from "@/lib/generation/guides/aws-ai-expanded";
import { JAVASCRIPT_CORE_LESSON_COUNT } from "@/lib/generation/guides/es2026";
import { JAVASCRIPT_TOPICS } from "@/lib/generation/guides/javascript-fundamentals";
import { TYPESCRIPT_CORE_LESSON_COUNT } from "@/lib/generation/guides/typescript-7";
import { TYPESCRIPT_TOPICS } from "@/lib/generation/guides/typescript-fundamentals";
import { conciseStudyNote, uniqueLearningPoints } from "@/lib/concise-learning";
import { DEFAULT_GUIDES, NEXTJS_16_CORE_LESSON_COUNT } from "@/lib/generation/default-library";
import { buildNotesDirectory, type NoteCard } from "@/lib/notes-directory";
import { REVIEWED_TOPICS } from "@/lib/notes-reviewed-topics";
import type { Lesson, ObjectiveQuestion, VocabularyEntry } from "@/lib/domain";
import type { NotesSummary, NotesTechnology, StudyNote } from "@/lib/notes-study";
import preview from "@/lib/catalog-preview.json";
import { BUILTIN_NOTES_TECHNOLOGIES } from "@/lib/notes-catalog";
import { FUNDAMENTAL_STUDY_NOTES, FUNDAMENTAL_COLLECTIONS, NEXTJS16_STUDY_NOTES } from "@/lib/notes-fundamentals-catalog";
import { NEXTJS16_FUNDAMENTALS } from "@/lib/notes-nextjs-fundamentals";
import { NEXT_HOOK_NOTES, REACT_HOOK_NOTES, NEXT_HOOK_SEEDS, REACT_HOOK_SEEDS } from "@/lib/notes-hooks";
import { NEXTJS_HOOKS_CORE } from "@/lib/generation/guides/nextjs-hooks";
import { REACT_HOOKS_CORE } from "@/lib/generation/guides/react-hooks";
import { PYTHON_CORE_LESSON_COUNT } from "@/lib/generation/guides/python";
import { PYTHON_STUDY_NOTES, PYTHON_FUNDAMENTALS } from "@/lib/notes-python-fundamentals";
import { ZUSTAND_STUDY_NOTES, ZUSTAND_FUNDAMENTALS } from "@/lib/notes-zustand-fundamentals";
import { TANSTACK_STUDY_NOTES, TANSTACK_FUNDAMENTALS } from "@/lib/notes-tanstack-fundamentals";
import { ZUSTAND_CORE_LESSON_COUNT } from "@/lib/generation/guides/zustand";
import { TANSTACK_CORE_LESSON_COUNT } from "@/lib/generation/guides/tanstack-start";
import { LLM_CORE_LESSON_COUNT } from "@/lib/generation/guides/llm-engineering";
import { CLAUDE_EXTENSION_NOTES, CLAUDE_EXTENSION_SEEDS } from "@/lib/notes-claude-extensions";
import { CLAUDE_EXTENSIONS_CORE_COUNT } from "@/lib/generation/guides/claude-ecosystem";
import { TANSTACK_CATEGORY_ORDER, tanstackCategory } from "@/lib/notes-tanstack-ecosystem";
import { NODE_CORE_LESSON_COUNT, NODE_LESSON_SEEDS } from "@/lib/generation/guides/node";
import { GRAPHQL_CORE_LESSON_COUNT, GRAPHQL_LESSON_SEEDS } from "@/lib/generation/guides/graphql";
import { NESTJS_CORE_LESSON_COUNT, NESTJS_LESSON_SEEDS } from "@/lib/generation/guides/nestjs";

const lines = (value: string) => value.split(/\n/).map(line => line.replace(/^\s*[-•]\s*/, "").trim()).filter(Boolean);
const VOCABULARY: VocabularyEntry[] = [
  { word: "explicit", meaning: "Stated clearly instead of left for someone to infer.", example: "An explicit rule tells the reader exactly what to do.", synonyms: ["clear", "stated", "unambiguous"], antonyms: ["implicit", "unclear"] },
  { word: "redundant", meaning: "Unnecessary because the same information or function already exists.", example: "A redundant state field repeats information we can calculate.", synonyms: ["unnecessary", "superfluous"], antonyms: ["essential", "necessary"] },
  { word: "persistent", meaning: "Continuing to exist after the immediate activity ends.", example: "Persistent data remains available after the process exits.", synonyms: ["lasting", "enduring"], antonyms: ["temporary", "transient"] },
  { word: "mutable", meaning: "Able to be changed after creation.", example: "A mutable collection allows its contents to change.", synonyms: ["changeable", "modifiable"], antonyms: ["immutable", "fixed"] },
  { word: "relevant", meaning: "Directly connected to the current question or purpose.", example: "Retrieve relevant documents before writing the answer.", synonyms: ["applicable", "pertinent"], antonyms: ["irrelevant", "unrelated"] },
  { word: "independent", meaning: "Able to operate without relying on another particular thing.", example: "Independent tasks can be considered separately.", synonyms: ["autonomous", "separate"], antonyms: ["dependent", "reliant"] },
  { word: "consistent", meaning: "Agreeing with the same rules or facts across cases.", example: "Consistent output uses the same format for similar inputs.", synonyms: ["uniform", "coherent"], antonyms: ["inconsistent", "contradictory"] },
  { word: "efficient", meaning: "Achieving a result with little wasted effort or resources.", example: "An efficient queue avoids shifting the remaining elements.", synonyms: ["economical", "productive"], antonyms: ["inefficient", "wasteful"] },
];

function vocabularyFor(card: NoteCard): VocabularyEntry[] {
  const text = [card.title, ...card.points, ...card.sections.flatMap(section => section.points)].join(" ").toLowerCase();
  const words = VOCABULARY.filter(word => new RegExp(`\\b${word.word}\\b`, "i").test(text));
  return words.slice(0, 3);
}

function makeStudyNote(card: NoteCard, lesson?: Lesson, priority = 3): StudyNote {
  const description = card.points[0] ?? card.title;
  const examples = lesson ? [{ title: "Example in practice", points: lines(lesson.example), code: lesson.code || undefined }] : card.sections.filter(section => section.code);
  const useCases = lesson?.useCase ? [{ title: "Real-world use case", points: [lesson.useCase.scenario, lesson.useCase.example, lesson.useCase.usage] }] : [];
  const interview = lesson?.interview?.length ? lesson.interview.map(question => ({ question: question.question, points: [...lines(question.definition), ...lines(question.answer)], priority, rationale: "Editorial preparation priority based on the topic's foundational role; not measured interview frequency." })) : [];
  const questions: ObjectiveQuestion[] = lesson?.objectiveQuestions ?? [];
  const vocabulary = lesson?.vocabulary?.length ? lesson.vocabulary : vocabularyFor(card);
  return { ...card, description, examples, useCases, interview, questions, vocabulary,
    kinds: [...new Set([...card.kinds, "Examples", "Interview questions", "Objective questions", "Vocabulary", "Synonyms", "Antonyms"])],
  };
}

const builtIn = DEFAULT_GUIDES.flatMap(guide => buildNotesDirectory([guide]).filter(card => {
  const match = card.id.match(/-lesson-(\d+)$/);
  const coreCounts: Record<string, number> = { "claude-skills-plugins-mcp": CLAUDE_EXTENSIONS_CORE_COUNT, zustand: ZUSTAND_CORE_LESSON_COUNT, "tanstack-start": TANSTACK_CORE_LESSON_COUNT, python: PYTHON_CORE_LESSON_COUNT, "llm-context-loop-memory": LLM_CORE_LESSON_COUNT, "nextjs-16": NEXTJS_16_CORE_LESSON_COUNT, "nextjs-16-hooks": NEXTJS_HOOKS_CORE.lessons.length, "react-19-hooks": REACT_HOOKS_CORE.lessons.length };
  return !match || coreCounts[guide.id] === undefined || Number(match[1]) < coreCounts[guide.id];
}).map(card => {
  const match = card.id.match(/-lesson-(\d+)$/);
  const lesson = match ? guide.curriculum.lessons[Number(match[1])] : undefined;
  const note = makeStudyNote(card, lesson, lesson ? Number(match![1]) < 3 ? 5 : 4 : 3);
  if (guide.id === "aws-ai-services" && match) {
    const index = Number(match[1]);
    return { ...note, category: index < AWS_AI_CORE_LESSON_COUNT ? "Getting started" : AWS_AI_TOPICS[index - AWS_AI_CORE_LESSON_COUNT].category };
  }
  if (guide.id === "es2026" && match) {
    const index = Number(match[1]);
    return { ...note, category: index < JAVASCRIPT_CORE_LESSON_COUNT ? "ES2026 & Upcoming Features" : JAVASCRIPT_TOPICS[index - JAVASCRIPT_CORE_LESSON_COUNT].category };
  }
  if (guide.id === "typescript-7" && match) {
    const index = Number(match[1]);
    return { ...note, category: index < TYPESCRIPT_CORE_LESSON_COUNT ? "TypeScript 7 & Tooling" : TYPESCRIPT_TOPICS[index - TYPESCRIPT_CORE_LESSON_COUNT].category };
  }
  if (guide.id === "node" && match) {
    const index = Number(match[1]);
    return { ...note, category: index < NODE_CORE_LESSON_COUNT ? "Getting started" : NODE_LESSON_SEEDS[index].category };
  }
  if (guide.id === "graphql" && match) {
    const index = Number(match[1]);
    return { ...note, category: index < GRAPHQL_CORE_LESSON_COUNT ? "Getting started" : GRAPHQL_LESSON_SEEDS[index].category };
  }
  if (guide.id === "nestjs" && match) {
    const index = Number(match[1]);
    return { ...note, category: index < NESTJS_CORE_LESSON_COUNT ? "Getting started" : NESTJS_LESSON_SEEDS[index].category };
  }
  return note.technology === "tanstack-start" ? { ...note, category: tanstackCategory(note.id, note.title, note.category) } : note;
}));

const reviewed = REVIEWED_TOPICS.map((topic, index) => {
  const card: NoteCard = { id: `reviewed-${topic.technology}-${index}`, technology: topic.technology, title: topic.title, category: "Core concepts", kinds: ["Technology topics", "Syntax", "Examples"], points: topic.points,
    sections: [{ title: "Syntax & meaning", points: [topic.points[0]], code: topic.syntax }, { title: "Example", points: [topic.example] }],
  };
  const note = makeStudyNote(card, undefined, topic.priority);
  return { ...note, examples: [{ title: "Example in practice", points: [topic.example], code: topic.syntax }], useCases: [{ title: "Real-world use case", points: [topic.example] }],
    interview: [{ question: topic.question, points: [topic.options[topic.correct], ...topic.points.slice(1)], priority: topic.priority, rationale: "Editorial priority for a core implementation decision; not measured interview frequency." }],
    questions: [{ question: topic.question, options: topic.options, correct: topic.correct, shortAnswer: topic.options[topic.correct], explanation: topic.points.join(" ") }],
  };
});

const combined = makeStudyNote({
  id: "claude-ai-concepts", technology: "ai-fundamentals", title: "Claude & AI Concepts", category: "Complete learning guide",
  kinds: ["Technology topics", "Examples"],
  points: ["One learning guide for Claude, AI concepts, LLMs, MCP, context, loop engineering and memory.", `${FUNDAMENTAL_STUDY_NOTES.length} Claude and AI lessons alongside the original LLM engineering chapters.`, "Explore explanations, worked examples, interview preparation, objective questions and vocabulary.", "Search the contents and move between lessons without leaving your notes."],
  sections: [{ title: "Learning path", points: ["Begin with the 20 AI Concepts, explore Claude capabilities, then progress through architectures, agents, training and responsible deployment."] }],
}, undefined, 5);
combined.readerTitle = "LLMs, MCP, Context, Loop Engineering and Memory";
combined.learnInApp = true;
combined.contents = [
  ...FUNDAMENTAL_STUDY_NOTES,
  ...builtIn.filter(note => note.id.startsWith("llm-context-loop-memory-lesson-")),
].map(({ id, title, category }) => ({ id, title, category }));

function courseCard(id: string, title: string, technology: string, guideId: string, lessons: StudyNote[], description: string): StudyNote {
  const chapters = [...builtIn.filter(note => note.id.startsWith(`${guideId}-lesson-`)), ...lessons].map(note => technology === "tanstack-start" ? { ...note, category: tanstackCategory(note.id, note.title, note.category) } : note);
  if (technology === "tanstack-start") chapters.sort((a, b) => TANSTACK_CATEGORY_ORDER.indexOf(a.category as typeof TANSTACK_CATEGORY_ORDER[number]) - TANSTACK_CATEGORY_ORDER.indexOf(b.category as typeof TANSTACK_CATEGORY_ORDER[number]));
  const note = makeStudyNote({ id, title, technology, category: "Complete learning guide", kinds: ["Technology topics", ...(title.includes("Hooks") ? ["Hooks"] : []), "Examples"], points: [description, `${chapters.length} lessons with explanations, syntax, examples and practical decisions.`, "Prepare with interview questions, multiple-choice practice and vocabulary.", "Search by topic or choose a subject to plan your next lesson."], sections: [{ title: "Learning path", points: [description] }] }, undefined, 5);
  return { ...note, learnInApp: true, readerTitle: title, contents: chapters.map(({ id, title, category }) => ({ id, title, category })) };
}
const frameworkCourses = [
  courseCard("node-course", "Node.js", "node", "node", [], "Explore Node.js architecture, core modules, packages, asynchronous flow, web frameworks, databases, validation, authentication, real-time communication, testing, developer tools and advanced performance."),
  courseCard("graphql-course", "GraphQL", "graphql", "graphql", [], "Explore GraphQL core concepts, operations and execution, schema and type system, advanced architecture patterns, security and optimization."),
  courseCard("nestjs-course", "Nest JS", "nestjs", "nestjs", [], "Explore Nest JS fundamentals, request lifecycle, persistence, authentication, advanced techniques, architectural styles, testing and production deployment."),
  courseCard("typescript-7-course", "TypeScript 7", "typescript", "typescript-7", [], "Learn TypeScript from annotations and core types through composition, narrowing, functions, classes, generics, advanced type manipulation, utility types, decorators, modules and compiler safety."),
  courseCard("javascript-es2026-course", "JavaScript ES2026", "javascript", "es2026", [], "Explore modern ECMAScript, closures, prototypes, the event loop, asynchronous programming, classes, functional patterns, DOM APIs, storage, workers, streams and modules with worked JavaScript examples."),
  courseCard("aws-ai-services-course", "AWS AI services", "aws", "aws-ai-services", [], "Explore Bedrock, Nova, Amazon Q, AgentCore, RAG, SageMaker AI, vision, documents, speech, language, enterprise AI and secure cloud architecture through practical workflows."),
  courseCard("claude-skills-plugins-mcp-course", "Claude Skills, Plugins and MCP", "claude", "claude-skills-plugins-mcp", CLAUDE_EXTENSION_NOTES, "Explore Claude Code commands, workflow skills, community plugins and MCP servers, with practical examples, configuration and clear compatibility guidance."),
  courseCard("zustand-5-course", "Zustand 5", "zustand", "zustand", ZUSTAND_STUDY_NOTES, "Learn Zustand stores, selectors, actions, middleware, TypeScript, architecture, SSR and testing in one practical learning path."),
  courseCard("tanstack-course", "TanStack", "tanstack-start", "tanstack-start", TANSTACK_STUDY_NOTES, "Explore 19 TanStack libraries across Frameworks, Data & State, UI & UX, Performance and Tooling, with practical examples and interview preparation."),
  courseCard("python-314-path", "Python: from first steps to Python 3.14", "python", "python", PYTHON_STUDY_NOTES, "Progress from your first Python script through collections, functions, classes, typing, concurrency, practical applications and Python 3.14."),
  courseCard("complete-nextjs-16-path", "Complete Next.js 16 path", "nextjs", "nextjs-16", NEXTJS16_STUDY_NOTES, "Build your Next.js foundation, then explore performance, caching, navigation, request APIs, React integration and developer tooling."),
  courseCard("nextjs-16-hooks-course", "Next.js 16 Hooks", "nextjs", "nextjs-16-hooks", [...NEXT_HOOK_NOTES, ...REACT_HOOK_NOTES], "Learn all nine Next.js routing and utility hooks alongside React's data, state, effect and performance primitives."),
  courseCard("react-19-hooks-course", "React 19+ Hooks", "react", "react-19-hooks", REACT_HOOK_NOTES, "Explore React 19+ Hooks by purpose: Actions, state, context, refs, effects, performance and external stores."),
];
export const STUDY_NOTES: StudyNote[] = [combined, ...frameworkCourses, ...CLAUDE_EXTENSION_NOTES, ...FUNDAMENTAL_STUDY_NOTES, ...NEXTJS16_STUDY_NOTES, ...NEXT_HOOK_NOTES, ...REACT_HOOK_NOTES, ...PYTHON_STUDY_NOTES, ...ZUSTAND_STUDY_NOTES, ...TANSTACK_STUDY_NOTES, ...reviewed, ...builtIn].map(conciseStudyNote);
const byId = new Map(STUDY_NOTES.map(note => [note.id, note]));
export const getStudyNote = (id: string) => byId.get(id);

export const NOTES_TECHNOLOGIES: (NotesTechnology & { sources: { title: string; url: string; retrievedAt: string }[] })[] = [...FUNDAMENTAL_COLLECTIONS.map(({ seeds, ...collection }) => ({
  ...collection,
  reading: [{ title: "Your learning path", points: [`Explore ${seeds.length} lessons grouped by subject. Open a card to study its explanation, example and practice question.`, "Use category filters to focus on a subject, or search for an individual concept."] }],
  sources: [...new Set(seeds.flatMap(seed => seed.sources))].map(url => ({ title: "Curriculum research", url, retrievedAt: "2026-09-13T00:00:00.000Z" })),
})), ...[...new Map([...preview.technologies, ...BUILTIN_NOTES_TECHNOLOGIES].map(technology => [technology.id, technology])).values()].map(technology => ({
  id: technology.id, title: technology.id === "tanstack-start" ? "TanStack" : technology.title, category: technology.category,
  reading: [
    ...REVIEWED_TOPICS.filter(topic => topic.technology === technology.id).map(topic => ({ title: topic.title, points: [...topic.points, topic.example] })),
    ...DEFAULT_GUIDES.filter(guide => guide.request.technologyId === technology.id).map(guide => ({ title: guide.curriculum.title, points: [...lines(guide.curriculum.summary), `Apply your understanding: ${guide.curriculum.project}`] })),
  ],
  sources: [...new Map([
    ...(technology.id === "claude" ? CLAUDE_EXTENSION_SEEDS : technology.id === "nextjs" ? [...NEXTJS16_FUNDAMENTALS, ...NEXT_HOOK_SEEDS, ...REACT_HOOK_SEEDS] : technology.id === "react" ? REACT_HOOK_SEEDS : technology.id === "python" ? PYTHON_FUNDAMENTALS : technology.id === "zustand" ? ZUSTAND_FUNDAMENTALS : technology.id === "tanstack-start" ? TANSTACK_FUNDAMENTALS : []).flatMap(seed => seed.sources.map(url => ({ title: seed.title, url, retrievedAt: "2026-09-13T00:00:00.000Z" }))),
    ...REVIEWED_TOPICS.filter(topic => topic.technology === technology.id).map(topic => ({ title: topic.title, url: topic.source, retrievedAt: "2026-09-13T00:00:00.000Z" })),
    ...DEFAULT_GUIDES.filter(guide => guide.request.technologyId === technology.id).flatMap(guide => guide.curriculum.sources ?? []),
  ].filter(source => /^https:\/\//.test(source.url)).map(source => [source.url, source])).values()],
}))];

/** Only compact summaries cross the initial client boundary. Full lessons load on demand. */
export const NOTES_SUMMARIES: NotesSummary[] = STUDY_NOTES.map(note => {
  const { id, technology, title, category, kinds, description, points } = note;
  const text = [title, description, category, technology, ...kinds, ...points, ...(note.contents ?? []).map(item => `${item.title} ${item.category}`), ...note.sections.flatMap(section => [section.title, ...section.points, section.code ?? ""]), ...note.interview.flatMap(question => [question.question, ...question.points]), ...note.questions.flatMap(question => [question.question, ...question.options]), ...note.vocabulary.flatMap(word => [word.word, word.meaning, ...word.synonyms, ...word.antonyms])].join(" ").toLocaleLowerCase();
  // Unique tokens keep full-content search small, including API names and code symbols.
  const searchText = [...new Set(text.split(/\s+/))].join(" ");
  return { id, technology, title, category, kinds, description, learnInApp: note.learnInApp, points: uniqueLearningPoints(points, [description]).slice(0, 3), searchText, priority: Math.max(3, ...note.interview.map(question => question.priority)) };
});
