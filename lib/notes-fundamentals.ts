import type { StudyNote } from "./notes-study";
import type { VocabularyEntry } from "./domain";

/** Original teaching notes. Source metadata is consumed only by the server catalog. */
export type FundamentalSeed = {
  id: string; title: string; category: string; facts: string; example: string; workflow: string;
  quiz: [question: string, answer: string, distractor1: string, distractor2: string, distractor3: string];
  sources: string[];
  vocabulary?: VocabularyEntry[];
};
export const lesson = (id: string, title: string, category: string, facts: string, example: string, workflow: string, quiz: FundamentalSeed["quiz"], ...sources: string[]): FundamentalSeed => ({ id, title, category, facts, example, workflow, quiz, sources });
export const CLAUDE_COLLECTION = { id: "claude-fundamentals", title: "Claude Fundamentals", category: "Artificial intelligence" };
export const AI_COLLECTION = { id: "ai-fundamentals", title: "AI Fundamentals", category: "Artificial intelligence" };

const words: VocabularyEntry[] = [
  { word: "explicit", meaning: "Clearly stated rather than implied.", example: "An explicit instruction specifies the output format.", synonyms: ["clear", "unambiguous"], antonyms: ["implicit", "ambiguous"] },
  { word: "persistent", meaning: "Continuing to exist after a task or session ends.", example: "Persistent memory keeps approved preferences between sessions.", synonyms: ["lasting", "durable"], antonyms: ["temporary", "ephemeral"] },
  { word: "relevant", meaning: "Directly connected to the question being considered.", example: "A retriever selects relevant passages for a question.", synonyms: ["pertinent", "applicable"], antonyms: ["irrelevant", "unrelated"] },
  { word: "approximate", meaning: "Close to a target value without being exact.", example: "An approximate index trades some recall for faster retrieval.", synonyms: ["estimated", "rough"], antonyms: ["exact", "precise"] },
  { word: "autonomous", meaning: "Able to act within a scope without constant direction.", example: "An autonomous agent still needs limits and oversight.", synonyms: ["independent", "self-directed"], antonyms: ["dependent", "supervised"] },
  { word: "robust", meaning: "Able to work reliably under difficult or changing conditions.", example: "A robust evaluation includes unusual inputs.", synonyms: ["resilient", "reliable"], antonyms: ["fragile", "unreliable"] },
  { word: "sparse", meaning: "Having relatively few nonzero or occupied entries.", example: "A sparse representation stores a few active term weights.", synonyms: ["scattered", "limited"], antonyms: ["dense", "abundant"] },
  { word: "iterative", meaning: "Using repeated steps to refine a result.", example: "Iterative training updates parameters over many batches.", synonyms: ["repeated", "successive"], antonyms: ["one-off", "nonrepeating"] },
];

export function buildFundamentals(seeds: FundamentalSeed[], technology: string): StudyNote[] {
  return seeds.map(seed => {
    const points = seed.facts.split("|");
    const correct = [...seed.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
    const [question, answer, ...distractors] = seed.quiz;
    const options = [...distractors];
    options.splice(correct, 0, answer);
    const text = `${seed.facts} ${seed.example}`.toLowerCase();
    const matchingWords = words.filter(word => text.includes(word.word));
    return {
      id: `${technology}-${seed.id}`, technology, title: seed.title, category: seed.category,
      description: points[0], points, learnInApp: true,
      kinds: ["Technology topics", "Syntax", "Examples", "Interview questions", "Objective questions", "Vocabulary", "Synonyms", "Antonyms"],
      sections: [{ title: "Workflow & meaning (illustrative)", points: ["Read this as a worked outline. Named steps describe the application logic; this is not an executable integration."], code: seed.workflow }, { title: "Key distinction", points: points.slice(1) }],
      examples: [{ title: "Worked example", points: [seed.example] }],
      useCases: [{ title: "Apply it in practice", points: [seed.example, `Decision to check: ${question}`, answer] }],
      interview: [{ question, points: [answer, ...points.slice(1)], priority: seed.category === "20 AI Concepts" ? 5 : 4, rationale: "Editorial study priority for explaining the concept and its tradeoffs; not measured interview frequency." }],
      questions: [{ question, options, correct, shortAnswer: answer, explanation: `${points.join(" ")} ${seed.example}` }],
      vocabulary: seed.vocabulary ?? (matchingWords.length ? matchingWords.slice(0, 2) : [{ ...words[0], example: `An explicit explanation makes ${seed.title} easier to apply.` }]),
    };
  });
}
