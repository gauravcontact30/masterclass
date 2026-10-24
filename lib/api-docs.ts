import catalog from "./api-docs-catalog.json";

export type ApiEntry = { name: string; kind: string; status: string };
export type ApiPackage = { id: string; name: string; icon: string; description: string; docs: string; accent: string; topics: string[]; entries: ApiEntry[] };
export const API_PACKAGES: ApiPackage[] = catalog.packages;
export const API_TYPES = catalog.types;
export const API_STATUSES = [{ id: "s", label: "Stable" }, { id: "p", label: "Developer Preview" }, { id: "x", label: "Experimental" }, { id: "d", label: "Deprecated" }];

// Entry objects are stable catalog data; reuse normalized text across the three filter passes.
const searchText = new WeakMap<ApiEntry, string>();
function entrySearchText(pkg: ApiPackage, entry: ApiEntry) {
  let text = searchText.get(entry);
  if (text === undefined) {
    text = `${pkg.name} ${entry.name}`.toLowerCase();
    searchText.set(entry, text);
  }
  return text;
}

export function filterApiPackages(query: string, packageId: string, kinds: string[], statuses: string[]) {
  const normalized = query.trim().toLowerCase();
  return API_PACKAGES.filter(pkg => packageId === "all" || pkg.id === packageId).map(pkg => ({ ...pkg, entries: pkg.entries.filter(entry =>
    (!kinds.length || kinds.includes(entry.kind)) && statuses.includes(entry.status) && (!normalized || entrySearchText(pkg, entry).includes(normalized)),
  ) })).filter(pkg => pkg.entries.length);
}

export function javascriptGroup(name: string) {
  if (name.startsWith("Math.")) return "Math methods";
  if (name.startsWith("Object.")) return "Object methods";
  if (name.startsWith("Promise") || ["AbortController", "fetch", "queueMicrotask"].includes(name)) return "Promise & async";
  if (["map", "filter", "reduce", "reduceRight", "forEach", "find", "findIndex", "findLast", "findLastIndex", "some", "every", "flat", "flatMap", "includes", "slice", "splice", "concat", "join", "sort", "toSorted", "reverse", "toReversed", "toSpliced", "indexOf", "push", "pop", "shift", "unshift", "at", "with", "entries", "keys", "values"].includes(name)) return "Array methods";
  if (["split", "replace", "replaceAll", "trim", "trimStart", "trimEnd", "padStart", "padEnd", "startsWith", "endsWith", "repeat", "match", "matchAll", "substring", "charAt", "toUpperCase", "toLowerCase"].includes(name)) return "String methods";
  return "Core objects & utilities";
}

/**
 * Reading order for the reference index. Every package belongs to exactly one
 * category; anything added to the catalog later lands in "More technologies"
 * until it is placed here.
 */
export const API_CATEGORIES: { id: string; label: string; packages: string[] }[] = [
  { id: "agentic", label: "Agentic AI frameworks", packages: ["deepagents", "langchain", "langgraph", "integrations", "langsmith", "langflow"] },
  { id: "ai", label: "AI, ML & data science", packages: ["ai", "aitools", "agents", "numpy", "pandas", "polars", "scipy", "sklearn", "tensorflow", "pytorch", "keras", "seaborn", "plotly"] },
  { id: "languages", label: "Languages & runtimes", packages: ["javascript", "jspuzzles", "typescript", "python", "node"] },
  { id: "frontend", label: "Frontend & state", packages: ["nextjs", "react", "angular", "tanstack", "zustand", "redux", "t3"] },
  { id: "backend", label: "Backend, APIs & validation", packages: ["express", "fastapi", "graphql", "requests", "httpx", "scrapy", "pydantic", "zod", "conform"] },
  { id: "auth", label: "Auth & security", packages: ["authjs", "clerk", "kinde", "betterauth", "arcjet"] },
  { id: "data", label: "Databases & storage", packages: ["drizzle", "prisma", "neon", "redis", "upstash"] },
  { id: "testing", label: "Testing", packages: ["jest", "vitest", "rtl", "playwright", "cypress"] },
  { id: "platform", label: "Cloud, jobs & architecture", packages: ["aws", "devops", "inngest", "systemdesign"] },
];

const PACKAGE_CATEGORY = new Map(API_CATEGORIES.flatMap(category => category.packages.map(id => [id, category.id] as const)));

/** Group packages under their category, keeping category order and dropping empty ones. */
export function groupByCategory<T extends { id: string }>(packages: T[]) {
  const buckets = new Map<string, T[]>();
  for (const pkg of packages) {
    const id = PACKAGE_CATEGORY.get(pkg.id) ?? "more";
    buckets.set(id, [...(buckets.get(id) ?? []), pkg]);
  }
  const ordered = [...API_CATEGORIES, { id: "more", label: "More technologies", packages: [] }];
  return ordered
    .filter(category => buckets.has(category.id))
    .map(category => {
      const rank = (id: string) => { const index = category.packages.indexOf(id); return index === -1 ? Number.MAX_SAFE_INTEGER : index; };
      return { id: category.id, label: category.label, packages: buckets.get(category.id)!.sort((a, b) => rank(a.id) - rank(b.id)) };
    });
}
