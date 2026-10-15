import "server-only";
import type { AwsHighlight } from "@/lib/pro-learn/aws-highlights";
import type { TechnologyHandbook } from "@/lib/pro-learn/technology-handbooks";
import { STUDY_NOTES } from "./notes-study-catalog";
import { summaryExplanation } from "@/lib/pro-learn/prepared-explanation";
import { agenticAiLearningPaths } from "@/lib/generation/guides/agentic-ai-learning-paths";
import { withOfficialCard } from "@/lib/official-content/apply";
import type { OfficialCard } from "@/lib/official-content/card";
import { officialSearchCard } from "./official-content";

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const indexed = STUDY_NOTES.filter(note => !note.learnInApp).map(note => ({ note, key: normalize(note.title) }));
const cache = new Map<string, { source: AwsHighlight; official?: OfficialCard; result: AwsHighlight }>();

function technologyIds(title: string): string[] {
  if (/aws/i.test(title)) return ["aws", "aws-ai-services"];
  if (/agentic|langchain|langgraph|langsmith|ai terms/i.test(title)) return ["agentic-ai", "llm-engineering", "llm-context-loop-memory"];
  const patterns: [RegExp, string][] = [[/next/i, "nextjs"], [/react/i, "react"], [/typescript/i, "typescript"], [/javascript/i, "javascript"], [/node/i, "node"], [/nest/i, "nestjs"], [/graphql/i, "graphql"], [/python|uv package/i, "python"], [/tanstack/i, "tanstack-start"], [/zustand/i, "zustand"]];
  return patterns.filter(([pattern]) => pattern.test(title)).map(([, id]) => id);
}

/** Prepared on the server from authored library content, never a click-time model call. */
export function prepareSearchTopics(items: AwsHighlight[], technology: string, sources?: TechnologyHandbook["sources"]): AwsHighlight[] {
  const ids = technologyIds(technology);
  return items.map(item => {
    if (item.vocabulary) return item;
    // Verified against the row's official documentation (lib/official-content):
    // added to whatever the row already carries, authored walkthroughs included.
    const official = officialSearchCard(technology, item.category, item.name);
    if (item.prepared) return official ? { ...item, prepared: withOfficialCard(item.prepared, official) } : item;
    const key = `${technology}:${item.category}:${item.name}`;
    const cached = cache.get(key);
    // Rebuild when authored or official content changes, including during development refreshes.
    if (cached?.source === item && cached.official === official) return cached.result;
    const prepared = summaryExplanation(item.name, item.summary, item.category);
    prepared.sources = sources;
    const needle = normalize(item.name);
    const candidates = indexed.filter(({ note }) => ids.some(id => note.technology === id || note.technology.startsWith(`${id}-`)));
    const exact = candidates.find(row => row.key === needle);
    const matching = exact ?? candidates.find(row => needle.length >= 8 && (row.key.startsWith(`${needle} `) || needle.startsWith(`${row.key} `)));
    const note = matching?.note;
    if (note) {
      const answer = prepared.answer;
      answer.summary = note.description === item.summary ? "" : note.description;
      // A note's self-check questions are not steps, and the answer carries
      // none of their answers — so they are left out rather than listed bare.
      answer.steps = note.sections.filter(section => (section.points.length || section.code) && !/check your understanding/i.test(section.title)).map(section => ({
        title: section.title, detail: section.points.join("\n\n"), code: section.code ?? "",
      }));
      if (!answer.steps.length) answer.steps = note.points.map((detail, index) => ({ title: `Key idea ${index + 1}`, detail, code: "" }));
      answer.keyPoints = note.points;
      answer.useCases = note.useCases.map(example => ({ title: example.title, scenario: example.points.join("\n\n"), example: "" }));
      answer.subjects = note.interview.map(interview => ({ name: interview.question, summary: interview.points.join("\n\n"), details: [], keyPoints: [] }));
    } else if (technology === "Agentic AI") {
      const categories = ["Generative AI", "Agentic AI with LangChain and LangGraph", "RAG", "Vectorless RAG", "Deep Agents", "Guardrails", "LLM Evaluation", "LLM Gateways"];
      const lesson = agenticAiLearningPaths[categories.indexOf(item.category)];
      if (lesson) {
        prepared.answer.steps.push({ title: `Foundation: ${lesson.title}`, detail: lesson.explanation, code: "" },
          { title: "Worked example", detail: lesson.example, code: lesson.code },
          { title: "Practice", detail: lesson.exercise, code: "" });
        prepared.answer.caveats = [lesson.mistake];
      }
    }
    // Authored on the row itself, applied last: a hand-written point about this
    // topic outranks both the generated sentences and the points a matched
    // study note contributed, which belong to the note's own subject.
    if (item.points?.length) prepared.answer.keyPoints = [...new Set([...item.points, ...prepared.answer.keyPoints])];
    if (item.useCase) prepared.answer.useCases = [{ ...item.useCase, example: "" }, ...prepared.answer.useCases];
    if (item.interview?.length) prepared.answer.subjects = [...item.interview.map(entry => ({ name: entry.question, summary: entry.answer, details: [], keyPoints: [] })), ...prepared.answer.subjects].slice(0, 8);
    if (item.code?.length) prepared.answer.files = item.code.map(file => ({ ...file, note: file.note ?? "" }));
    const result = { ...item, prepared: official ? withOfficialCard(prepared, official) : prepared };
    cache.set(key, { source: item, official, result });
    return result;
  });
}

export function prepareHandbooks(handbooks: readonly TechnologyHandbook[]): TechnologyHandbook[] {
  return handbooks.map(handbook => ({ ...handbook, topics: prepareSearchTopics(handbook.topics, handbook.title, handbook.sources) }));
}
