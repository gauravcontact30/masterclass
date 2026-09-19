import catalog from "./api-docs-catalog.json";

export type ApiEntry = { name: string; kind: string; status: string };
export type ApiPackage = { id: string; name: string; icon: string; description: string; docs: string; accent: string; topics: string[]; entries: ApiEntry[] };
export const API_PACKAGES: ApiPackage[] = catalog.packages;
export const API_TYPES = catalog.types;
export const API_STATUSES = [{ id: "s", label: "Stable" }, { id: "p", label: "Developer Preview" }, { id: "x", label: "Experimental" }, { id: "d", label: "Deprecated" }];

export function filterApiPackages(query: string, packageId: string, kinds: string[], statuses: string[]) {
  const normalized = query.trim().toLowerCase();
  return API_PACKAGES.filter(pkg => packageId === "all" || pkg.id === packageId).map(pkg => ({ ...pkg, entries: pkg.entries.filter(entry =>
    (!kinds.length || kinds.includes(entry.kind)) && statuses.includes(entry.status) && (!normalized || `${pkg.name} ${entry.name}`.toLowerCase().includes(normalized)),
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
