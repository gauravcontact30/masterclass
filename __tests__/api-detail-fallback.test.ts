/** @jest-environment node */
import { API_PACKAGES } from "@/lib/api-docs";
import { API_DETAILS } from "@/lib/api-docs-details";
import { catalogApiDetail, enrichApiLearning } from "@/lib/api-learning";
import { apiDetailSchema } from "@/lib/pro-learn/types";

const pkg = API_PACKAGES.find(item => item.id === "react")!;
const entry = pkg.entries.find(item => item.name === "useDeferredValue")!;

async function apiDetail(packageId: string, name: string, signal?: AbortSignal, provider?: "anthropic" | "perplexity") {
  const { apiDetail: load } = await import("@/lib/server/pro-learn-ai");
  return load(packageId, name, signal, provider);
}

const ENV = { ...process.env };
beforeEach(() => {
  process.env = { ...ENV };
  for (const key of ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "PERPLEXITY_API_KEY", "PERPLEXITY_MODEL"]) delete process.env[key];
});
afterAll(() => { process.env = ENV; });

test("the catalog reference states only what the catalog knows and invents no API shape", () => {
  const detail = apiDetailSchema.parse(enrichApiLearning(pkg, entry, catalogApiDetail(pkg, entry)));
  expect(detail.description).toContain(entry.name);
  expect(detail.description).toContain(pkg.name);
  expect(detail.signature).toBe("");
  expect(detail.code).toBe("");
  expect(detail.parameters).toEqual([]);
  expect(detail.notes.join(" ")).toContain(pkg.docs);
  expect(detail.useCases.length).toBeGreaterThan(0);
  expect(detail.vocabulary.length).toBeGreaterThan(0);
  expect(detail.subjective.length).toBeGreaterThanOrEqual(3);
  expect(detail.objective.length).toBeGreaterThan(0);
});

test("an identifier with no authored page still returns learning content when AI is unavailable", async () => {
  expect(API_DETAILS[`${pkg.id}:${entry.name}`]).toBeUndefined();
  const result = await apiDetail(pkg.id, entry.name);
  expect(result.source).toBe("library");
  expect(result.reason).toBe("ai_unavailable");
  expect(apiDetailSchema.safeParse(result.detail).success).toBe(true);
  expect(result.detail.notes.length).toBeGreaterThan(0);
});

test("a hand-authored page still wins over the catalog summary, and unknown identifiers stay 404", async () => {
  const curated = await apiDetail("react", "useState");
  expect(curated.source).toBe("library");
  expect(curated.reason).toBeUndefined();
  expect(curated.detail.signature).not.toBe("");
  expect(curated.detail.project).not.toBeNull();
  await expect(apiDetail("react", "notAnIdentifier")).rejects.toMatchObject({ status: 404 });
});

const generated = {
  packageName: "react", description: "Defer a value so urgent updates stay responsive.", since: "React 18", signature: "const deferred = useDeferredValue(value)",
  parameters: [{ name: "value", type: "T", description: "The value to defer." }], returns: "The previous value during a background re-render.",
  notes: ["Shows stale content while a fresh render happens in the background."], useCases: ["Keep a filter input responsive over a large list"],
  descriptionLong: "", code: "const deferred = useDeferredValue(query);", related: ["useTransition"],
  vocabulary: [{ word: "defer", meaning: "Postpone deliberately.", sentence: "We defer the expensive render so typing stays smooth.", synonyms: ["postpone"], antonyms: ["expedite"], examples: [] }],
  subjective: [{ question: "When would you reach for useDeferredValue?", answer: "When a large re-render must not block typing, and stale content is acceptable meanwhile.", followUp: "" }],
  objective: [{ question: "What does useDeferredValue return while a fresh render is pending?", options: ["The previous value", "null", "A promise", "An error"], answer: 0, explanation: "It keeps the last value so the UI stays interactive." }],
  project: {
    title: "Deferred filter", template: "react-ts", entry: "/App.tsx", dependencies: { react: "19.2.8" },
    files: [{ path: "/App.tsx", code: "export default function App() { return <main/>; }" }, { path: "/README.md", code: "Run it." }],
    instructions: ["Click Run, then type in the filter."],
  },
};
const perplexityReply = (content: unknown) => ({
  ok: true, status: 200,
  json: async () => ({
    choices: [{ message: { content: JSON.stringify(content) }, finish_reason: "stop" }],
    usage: { prompt_tokens: 12, completion_tokens: 30 },
    search_results: [{ url: "https://react.dev/reference/react/useDeferredValue" }],
  }),
  text: async () => "",
});

test("a learner can ask for Perplexity, and the page records which model answered but never its sources", async () => {
  process.env.PERPLEXITY_API_KEY = "pplx-test";
  process.env.PERPLEXITY_MODEL = "sonar";
  global.fetch = jest.fn().mockResolvedValue(perplexityReply(generated)) as jest.Mock;

  const result = await apiDetail(pkg.id, entry.name, undefined, "perplexity");
  expect(result.source).toBe("ai");
  expect(result.provider).toBe("perplexity");
  expect(result).not.toHaveProperty("sources");
  expect(result.detail.signature).toBe("const deferred = useDeferredValue(value)");
  expect(result.detail.project).not.toBeNull();
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe("https://api.perplexity.ai/chat/completions");
});

test("asking for an unconfigured provider falls back to the catalog summary rather than failing", async () => {
  global.fetch = jest.fn() as jest.Mock;
  const result = await apiDetail(pkg.id, entry.name, undefined, "perplexity");
  expect(result.source).toBe("library");
  expect(result.reason).toBe("ai_unavailable");
  expect(global.fetch).not.toHaveBeenCalled();
});

test("a React Hook with authored teaching content renders every section with real syntax and an example", async () => {
  const result = await apiDetail("react", "useDeferredValue");
  expect(result.source).toBe("library");
  const { detail } = result;
  // To-the-point definition, not a catalog placeholder.
  expect(detail.description).not.toContain("is a hook in");
  expect(detail.description.length).toBeLessThan(200);
  // Syntax: a real import path and a real call form.
  expect(detail.packageName).toBe("react");
  expect(detail.signature).toContain("import { useDeferredValue } from 'react'");
  expect(detail.signature).toContain("useDeferredValue(");
  // Example code, key features and use cases all carry content.
  expect(detail.code).toContain("'use client'");
  expect(detail.notes.length).toBeGreaterThanOrEqual(4);
  expect(detail.notes.join(" ")).toContain("Import useDeferredValue from react");
  // Notes carry no source links; the official page is only the detail's source field.
  expect(detail.notes.join(" ")).not.toMatch(/https?:\/\//);
  expect(detail.source).toBe("https://react.dev/reference/react/useDeferredValue");
  expect(detail.useCases.length).toBeGreaterThanOrEqual(3);
  expect(detail.related.length).toBeGreaterThan(0);
  expect(detail.related.every(name => name !== "useDeferredValue")).toBe(true);
  // The learning sections the page renders below the reference.
  expect(detail.vocabulary.length).toBeGreaterThan(0);
  expect(detail.subjective.length).toBeGreaterThanOrEqual(3);
  expect(detail.objective.length).toBeGreaterThan(0);
});

test("an authored Next.js Hook resolves its own entry point rather than the package name", async () => {
  const link = await apiDetail("nextjs", "useLinkStatus");
  expect(link.detail.packageName).toBe("next/link");
  expect(link.detail.signature).toContain("from 'next/link'");
  // useRouter and usePathname are hand-authored, so pick a Hook that is not.
  const params = await apiDetail("nextjs", "useParams");
  expect(params.detail.packageName).toBe("next/navigation");
  // A fragment must not be assembled into a Next.js project that exports nothing.
  expect(params.detail.project).toBeNull();
});

test("an identifier with no authored content still states only what the catalog knows", async () => {
  const result = await apiDetail("react", "useSyncExternalStore");
  expect(result.detail.signature).not.toBe("");
  const plain = await apiDetail("javascript", "structuredClone");
  expect(plain.detail.description).toContain("structuredClone");
  expect(plain.detail.signature).toBe("");
  expect(plain.detail.notes.join(" ")).toContain("states no signature");
});
