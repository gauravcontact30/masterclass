import "server-only";
import type { ApiEntry, ApiPackage } from "@/lib/api-docs";
import type { ApiDetail } from "@/lib/api-docs-details";
import { apiCodeLanguage, catalogApiDetail } from "@/lib/api-learning";
import { NEXT_HOOK_SEEDS, REACT_HOOK_SEEDS } from "@/lib/notes-hooks";

/**
 * The reference an identifier shows when it has no hand-authored page and the
 * model is unavailable.
 *
 * Where this app already holds authored teaching content for an identifier, the
 * page uses it: the 29 React and Next.js Hook seeds in lib/notes-hooks.ts carry
 * a real one-line meaning, the distinction that matters, the import path, a
 * worked example and a usage snippet. Everything else falls back to the facts
 * the catalog itself holds, and invents no signature.
 *
 * Server-only on purpose: the Hook seeds pull in the whole fundamentals
 * catalogue, which has no business in a client bundle.
 */
type Seed = (typeof REACT_HOOK_SEEDS)[number];

const authored = new Map<string, Seed>([
  ...REACT_HOOK_SEEDS.map(seed => [`react:${seed.id}`, seed] as const),
  ...NEXT_HOOK_SEEDS.map(seed => [`nextjs:${seed.id}`, seed] as const),
]);

/** The seed's workflow is a `'use client'` header, an import, a comment, then the call. */
function splitWorkflow(workflow: string) {
  const lines = workflow.split("\n");
  const importLine = lines.find(line => line.startsWith("import ")) ?? "";
  const commentAt = lines.findIndex(line => line.trim().startsWith("//"));
  const call = (commentAt >= 0 ? lines.slice(commentAt + 1) : lines.filter(line => !line.startsWith("import ") && !line.startsWith("'use client'"))).join("\n").trim();
  return { importLine, call };
}

function authoredDetail(pkg: ApiPackage, entry: ApiEntry, seed: Seed): ApiDetail {
  const [meaning, distinction, importRule] = seed.facts.split("|");
  const { importLine, call } = splitWorkflow(seed.workflow);
  const related = [...authored.values()]
    .filter(other => other.category === seed.category && other.id !== seed.id)
    .map(other => other.id)
    .filter(name => pkg.entries.some(item => item.name === name))
    .slice(0, 6);
  return {
    packageName: importLine.match(/from '([^']+)'/)?.[1] ?? pkg.name,
    description: meaning,
    // A real call form from the authored snippet, with its import above it.
    signature: [importLine, call].filter(Boolean).join("\n\n"),
    parameters: [],
    returns: "",
    notes: [
      distinction,
      importRule,
      `Grouped under ${seed.category} in this app's Hooks reference.`,
      `Verify against the official page for the version you have installed: ${seed.sources[0]}`,
    ].filter(Boolean),
    useCases: [seed.example, ...pkg.topics.slice(0, 3).map(topic => `${topic}: where ${entry.name} tends to appear`)],
    code: seed.workflow,
    language: apiCodeLanguage(pkg.id),
    source: seed.sources[0] ?? pkg.docs,
    related,
  };
}

/** Authored content when this app has it, catalog facts otherwise. */
export function catalogReference(pkg: ApiPackage, entry: ApiEntry): ApiDetail {
  const seed = authored.get(`${pkg.id}:${entry.name}`);
  return seed ? authoredDetail(pkg, entry, seed) : catalogApiDetail(pkg, entry);
}

/** True when the reference came from authored teaching content, not just the catalog. */
export const hasAuthoredReference = (packageId: string, name: string) => authored.has(`${packageId}:${name}`);
