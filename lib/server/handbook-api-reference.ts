import "server-only";
import { API_PACKAGES, API_TYPES, type ApiEntry, type ApiPackage } from "@/lib/api-docs";
import { API_DETAILS } from "@/lib/api-docs-details";
import { officialApiDetail } from "@/lib/official-content/apply";
import type { OfficialCard } from "@/lib/official-content/card";
import type { AwsHighlight } from "@/lib/pro-learn/aws-highlights";
import { apiReferenceRow } from "@/lib/pro-learn/api-reference-rows";
import type { TechnologyHandbook } from "@/lib/pro-learn/technology-handbooks";
import { catalogReference } from "./api-reference-fallback";
import { officialApiCard } from "./official-content";

/**
 * The API Docs reference each Search tab carries, by tab title.
 *
 * Only entries with real content come across: a hand-curated reference, or an
 * official card verified against the entry's documentation page. The catalog's
 * generic fallback is left on the API Docs page, so a tab grows only by rows
 * worth reading. As the official-content pipeline verifies more entries, they
 * appear here without any change to this file.
 */
export const TAB_API_PACKAGES: Record<string, string[]> = {
  "LangChain": ["langchain"],
  "LangGraph": ["langgraph"],
  "LangSmith": ["langsmith"],
  "Agentic AI": ["deepagents", "integrations", "agents", "ai", "aitools"],
  "Next.js 16+ APIs — Directives, Functions, Hooks & Config": ["nextjs"],
  "React 19+ — Components, Actions & Server UI": ["react"],
  "JavaScript (ECMAScript 2026) — Language & Runtime": ["javascript", "jspuzzles"],
  "TypeScript 7 — Types, Compiler & Migration": ["typescript"],
  "Node.js — Runtime, APIs, Streams & Operations": ["node"],
  "Node.js Packages — Modules, Libraries & Middleware": ["express"],
  "Python Packages — Standard Library & Ecosystem": ["python", "numpy", "pandas"],
  // Every other mapped package with authored content, so a new tab only needs a line here.
  "Redis caching solutions": ["redis"],
  "Upstash": ["upstash"],
  "Vitest — Fast Unit Testing & Mocks": ["vitest"],
  "Playwright Automation — Browser Testing & Debugging": ["playwright"],
  "Zod validation libraries": ["zod"],
  "Zustand": ["zustand"],
  "Redux Toolkit": ["redux"],
  "TanStack Query": ["tanstack"],
  "Prisma": ["prisma"],
  "Drizzle ORM": ["drizzle"],
  "Neon": ["neon"],
  "BetterAuth": ["betterauth"],
  "Clerk user management": ["clerk"],
  "Authentication with Auth.js & Kinde Auth": ["authjs", "kinde"],
  "Inngest services": ["inngest"],
  "Arcjet": ["arcjet"],
  "Conform - Validation libraries": ["conform"],
  "T3 environment": ["t3"],
  "System Design": ["systemdesign"],
  "GraphQL — Schema, Servers, Clients & Tooling": ["graphql"],
  "Jest — Unit Testing, Mocks & Coverage": ["jest"],
  "React Testing Library — User-Centered UI Tests": ["rtl"],
  "Cypress — End-to-End Testing & Network Control": ["cypress"],
  "DevOps with AWS CI/CD": ["devops"],
};

const kindLabel = (kind: string) => API_TYPES.find(type => type.k === kind)?.label ?? "Reference";
const key = (name: string) => name.trim().toLowerCase();

/** A row is rebuilt only when the content behind it changes; prepared answers are cached by row identity. */
const rows = new Map<string, { source: object; row: AwsHighlight }>();

function referenceFor(pkg: ApiPackage, entry: ApiEntry, category: string): AwsHighlight | undefined {
  const curated = API_DETAILS[`${pkg.id}:${entry.name}`];
  const official: OfficialCard | undefined = curated ? undefined : officialApiCard(pkg.id, entry.name);
  const source = curated ?? official;
  if (!source) return undefined;
  const cacheKey = `${pkg.id}:${entry.name}:${category}`;
  const cached = rows.get(cacheKey);
  if (cached?.source === source) return cached.row;
  const detail = curated ?? officialApiDetail(official!, catalogReference(pkg, entry));
  const row = apiReferenceRow(entry.name, category, detail, entry.status === "p");
  rows.set(cacheKey, { source, row });
  return row;
}

/** The API Docs rows a tab gains, skipping names the tab (or an earlier package) already has. */
export function apiReferenceTopics(title: string, existing: readonly AwsHighlight[]): AwsHighlight[] {
  const packages = (TAB_API_PACKAGES[title] ?? []).flatMap(id => API_PACKAGES.filter(pkg => pkg.id === id));
  const seen = new Set(existing.map(topic => key(topic.name)));
  const added: AwsHighlight[] = [];
  for (const pkg of packages) {
    for (const entry of pkg.entries) {
      if (seen.has(key(entry.name))) continue;
      // One package: group by what the entry is. Several: group by package, so each stays findable.
      const category = packages.length > 1 ? `API docs: ${pkg.name}` : `API docs: ${kindLabel(entry.kind)}`;
      const row = referenceFor(pkg, entry, category);
      if (!row) continue;
      seen.add(key(entry.name));
      added.push(row);
    }
  }
  return added;
}

/**
 * Each official-card lookup stats its file, so a tab's rows are reused for a
 * minute rather than re-derived on every page load; a verification run still
 * shows up within that minute.
 */
const REFRESH_MS = 60_000;
const memo = new Map<string, { at: number; base: readonly AwsHighlight[]; extra: AwsHighlight[] }>();

function extraFor(title: string, topics: readonly AwsHighlight[]) {
  const hit = memo.get(title);
  if (hit && hit.base === topics && Date.now() - hit.at < REFRESH_MS) return hit.extra;
  const extra = apiReferenceTopics(title, topics);
  memo.set(title, { at: Date.now(), base: topics, extra });
  return extra;
}

/** Each handbook with its API Docs reference appended after its own rows. */
export function withApiReference<T extends TechnologyHandbook>(handbooks: readonly T[]): T[] {
  return handbooks.map(handbook => {
    if (!TAB_API_PACKAGES[handbook.title]) return handbook;
    const extra = extraFor(handbook.title, handbook.topics);
    if (!extra.length) return handbook;
    const counts = new Map(handbook.categories.map(category => [category.name, category.count]));
    for (const topic of extra) counts.set(topic.category, (counts.get(topic.category) ?? 0) + 1);
    return { ...handbook, topics: [...handbook.topics, ...extra], categories: [...counts].map(([name, count]) => ({ name, count })) } as T;
  });
}
