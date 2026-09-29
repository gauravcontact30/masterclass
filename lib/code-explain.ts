import type { CodeLanguage } from "./code-highlight";

/**
 * Deterministic, rule-based reading of a snippet: a comment per line, the API
 * surface it touches, and — for routing code — how a URL decomposes into
 * pathname, search params and dynamic params.
 *
 * Every rule matches a shape it can describe exactly. Anything unrecognised
 * returns `null` rather than a vague guess, so a line note is always something
 * the code actually says.
 */

export type SymbolKind =
  | "package"
  | "module"
  | "directive"
  | "hook"
  | "function"
  | "method"
  | "class"
  | "interface"
  | "type"
  | "property"
  | "variable";

export type CodeSymbol = { name: string; kind: SymbolKind; detail: string };

const list = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];

/** Well-known bindings get a precise description instead of a generic one. */
const KNOWN: Record<string, string> = {
  useSearchParams: "Client Component hook returning a read-only URLSearchParams for the current query string.",
  usePathname: "Client Component hook returning the current URL's pathname.",
  useParams: "Client Component hook returning the route's filled-in dynamic params.",
  useRouter: "Client Component hook returning the router for programmatic navigation.",
  useLinkStatus: "Client Component hook reporting whether a parent Link navigation is pending.",
  useSelectedLayoutSegment: "Client Component hook returning the active route segment one level below this layout.",
  redirect: "Server function that stops rendering and sends the visitor to another route.",
  notFound: "Server function that renders the nearest not-found boundary.",
  revalidatePath: "Server function that purges the cached render for a path.",
};

function describeImport(name: string, from: string): CodeSymbol {
  const known = KNOWN[name];
  const kind: SymbolKind = /^use[A-Z]/.test(name) ? "hook" : /^[A-Z]/.test(name) ? "class" : "function";
  return { name, kind, detail: known ?? `Imported from ${from}.` };
}

// ---------------------------------------------------------------- line notes

const JS_RULES: { test: RegExp; note: (match: RegExpMatchArray) => string }[] = [
  {
    test: /^\s*['"]use (client|server)['"]\s*;?\s*$/,
    note: m =>
      m[1] === "client"
        ? "Directive: marks the module as a Client Component entry point, so it and its imports also run in the browser."
        : "Directive: marks the exports below as Server Functions callable from the client.",
  },
  {
    test: /^\s*import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/,
    note: m => `Imports ${list(m[1].split(",").map(n => n.trim().split(/\s+as\s+/).pop()!).filter(Boolean))} from ${m[2]}.`,
  },
  {
    test: /^\s*import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,
    note: m => `Imports the default export of ${m[2]} as ${m[1]}.`,
  },
  {
    test: /^\s*import\s+['"]([^'"]+)['"]/,
    note: m => `Loads ${m[1]} for its side effects only.`,
  },
  {
    test: /^\s*export\s+default\s+(?:async\s+)?function\s+(\w+)/,
    note: m => `Declares ${m[1]} as this module's default export.`,
  },
  {
    test: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
    note: m => `Declares ${m[1]}${m[2].trim() ? `, taking ${list(m[2].split(",").map(p => p.trim().split(/[:=\s]/)[0]).filter(Boolean))}` : ", taking no arguments"}.`,
  },
  {
    test: /^\s*(?:export\s+)?(?:const|let|var)\s+\{([^}]+)\}\s*=\s*(\w+)\s*\(/,
    note: m => `Destructures ${list(m[1].split(",").map(n => n.trim()).filter(Boolean))} out of the ${m[2]}() result.`,
  },
  {
    test: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(use[A-Z]\w*)\s*\(/,
    note: m => `Calls the ${m[2]} hook and keeps its result in ${m[1]}.`,
  },
  {
    test: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\.(\w+)\s*\(([^)]*)\)/,
    note: m => `Calls ${m[2]}.${m[3]}(${m[4]}) and stores the result in ${m[1]}.`,
  },
  {
    test: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(?[^=]*\)?\s*=>/,
    note: m => `Defines ${m[1]} as an arrow function.`,
  },
  {
    test: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*\(/,
    note: m => `Calls ${m[2]}() and stores the result in ${m[1]}.`,
  },
  {
    test: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/,
    note: m => `Declares ${m[1]}.`,
  },
  {
    test: /^\s*(?:export\s+)?(?:interface|type)\s+(\w+)/,
    note: m => `Declares the ${m[1]} type, erased at build time.`,
  },
  { test: /^\s*(?:export\s+)?class\s+(\w+)/, note: m => `Declares the ${m[1]} class.` },
  {
    test: /^\s*(\w+)\.(\w+)\s*\(([^)]*)\)\s*;?\s*$/,
    note: m => `Calls ${m[1]}.${m[2]}(${m[3]}) for its result or effect.`,
  },
  { test: /^\s*return\s+(.+?);?\s*$/, note: m => `Returns ${m[1].length > 60 ? "the value below" : m[1]}.` },
  { test: /^\s*if\s*\((.+)\)/, note: m => `Runs the block below only when ${m[1]}.` },
  { test: /^\s*for\s*\(/, note: () => "Loops over the range or collection." },
  { test: /^\s*(?:export\s+)?default\s+/, note: () => "Default export of this module." },
];

const PY_RULES: { test: RegExp; note: (match: RegExpMatchArray) => string }[] = [
  { test: /^\s*from\s+([\w.]+)\s+import\s+(.+)$/, note: m => `Imports ${m[2].trim()} from the ${m[1]} module.` },
  { test: /^\s*import\s+([\w.]+)/, note: m => `Imports the ${m[1]} module.` },
  {
    test: /^\s*def\s+(\w+)\s*\(([^)]*)\)/,
    note: m => `Defines ${m[1]}${m[2].trim() ? `, taking ${list(m[2].split(",").map(p => p.trim().split(/[:=\s]/)[0]).filter(Boolean))}` : ", taking no arguments"}.`,
  },
  { test: /^\s*class\s+(\w+)/, note: m => `Defines the ${m[1]} class.` },
  { test: /^\s*print\s*\((.*)\)\s*$/, note: m => `Prints ${m[1] || "a blank line"} to standard output.` },
  { test: /^\s*return\s+(.+)$/, note: m => `Returns ${m[1]}.` },
  { test: /^\s*(\w+)\s*=\s*(.+)$/, note: m => `Binds ${m[1]} to ${m[2].length > 50 ? "the expression on this line" : m[2]}.` },
];

const isComment = (line: string) => /^\s*(\/\/|\/\*|\*|#)/.test(line);

/** One note per source line, or `null` where no rule matches with confidence. */
export function explainLines(code: string, language: CodeLanguage = "javascript"): (string | null)[] {
  const rules = language === "python" ? PY_RULES : JS_RULES;
  return code.split("\n").map(line => {
    if (!line.trim() || isComment(line)) return null;
    for (const rule of rules) {
      const match = line.match(rule.test);
      if (match) return rule.note(match);
    }
    return null;
  });
}

// ------------------------------------------------------------------ symbols

/** The API surface a snippet touches, grouped so a learner can revise from it. */
export function extractSymbols(code: string, language: CodeLanguage = "javascript"): CodeSymbol[] {
  const found = new Map<string, CodeSymbol>();
  const add = (symbol: CodeSymbol) => {
    if (!found.has(symbol.name)) found.set(symbol.name, symbol);
  };

  for (const match of code.matchAll(/^\s*['"]use (client|server)['"]/gm)) {
    add({
      name: `'use ${match[1]}'`,
      kind: "directive",
      detail: match[1] === "client" ? "Client Component boundary." : "Server Function boundary.",
    });
  }

  if (language === "python") {
    for (const match of code.matchAll(/^\s*(?:from\s+([\w.]+)\s+import\s+(.+)|import\s+([\w.]+))/gm)) {
      // Not named `module`: that identifier is CommonJS's own, and assigning
      // to it is an error under the Next.js rules even inside a block.
      const imported = match[1] ?? match[3];
      add({ name: imported, kind: "module", detail: "Imported module." });
      for (const name of (match[2] ?? "").split(",").map(n => n.trim()).filter(Boolean)) {
        add({ name, kind: "function", detail: `Imported from ${imported}.` });
      }
    }
    for (const match of code.matchAll(/^\s*def\s+(\w+)/gm)) add({ name: match[1], kind: "function", detail: "Defined in this file." });
    for (const match of code.matchAll(/^\s*class\s+(\w+)/gm)) add({ name: match[1], kind: "class", detail: "Defined in this file." });
    return [...found.values()];
  }

  for (const match of code.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g)) {
    const from = match[3];
    add({
      name: from,
      kind: from.startsWith(".") ? "module" : "package",
      detail: from.startsWith(".") ? "Local module in this project." : "External package.",
    });
    if (match[2]) add({ name: match[2], kind: "function", detail: `Default export of ${from}.` });
    for (const raw of (match[1] ?? "").split(",")) {
      const name = raw.trim().split(/\s+as\s+/).pop();
      if (name) add(describeImport(name, from));
    }
  }

  for (const match of code.matchAll(/\b(use[A-Z]\w*)\s*\(/g)) {
    add({ name: match[1], kind: "hook", detail: KNOWN[match[1]] ?? "React hook called in this component." });
  }
  for (const match of code.matchAll(/\b(\w+)\.(\w+)\s*\(/g)) {
    add({ name: `${match[1]}.${match[2]}()`, kind: "method", detail: `Method called on ${match[1]}.` });
  }
  for (const match of code.matchAll(/^\s*(?:export\s+)?interface\s+(\w+)/gm)) {
    add({ name: match[1], kind: "interface", detail: "Type-only contract, erased at build time." });
  }
  for (const match of code.matchAll(/^\s*(?:export\s+)?type\s+(\w+)/gm)) {
    add({ name: match[1], kind: "type", detail: "Type alias, erased at build time." });
  }
  for (const match of code.matchAll(/^\s*(?:export\s+)?class\s+(\w+)/gm)) {
    add({ name: match[1], kind: "class", detail: "Declared in this file." });
  }
  for (const match of code.matchAll(/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm)) {
    add({ name: match[1], kind: "function", detail: "Declared in this file." });
  }
  return [...found.values()];
}

// ---------------------------------------------------------------- URL anatomy

export type UrlAnatomy = {
  route: string;
  url: string;
  pathname: string;
  searchParams: { key: string; value: string }[];
  params: { key: string; value: string }[];
};

const SAMPLE_QUERY: Record<string, string> = {
  q: "running-shoes",
  query: "running-shoes",
  search: "my-project",
  page: "2",
  sort: "price",
  tab: "overview",
  filter: "in-stock",
  lang: "en",
  id: "42",
};

const SAMPLE_PARAM: Record<string, string> = {
  tag: "shoes",
  item: "nike-air-max-97",
  category: "shoes",
  slug: "hello-world",
  id: "42",
};

/**
 * Reads the routing surface a snippet touches and shows one worked URL against
 * it. The keys are taken from the code; the values are illustrative, which the
 * UI states, because a snippet never carries a real request.
 */
export function urlAnatomy(code: string): UrlAnatomy | null {
  const queryKeys = [
    ...new Set([...code.matchAll(/searchParams\s*\.\s*(?:get|getAll|has)\s*\(\s*['"]([\w-]+)['"]/g)].map(m => m[1])),
  ];
  const paramKeys = [
    ...new Set([
      ...[...code.matchAll(/useParams\s*<\s*\{([^}]*)\}/g)].flatMap(m =>
        [...m[1].matchAll(/(\w+)\s*[?:]/g)].map(inner => inner[1]),
      ),
      ...[...code.matchAll(/\bparams\s*\.\s*(\w+)/g)].map(m => m[1]),
      ...[...code.matchAll(/\bparams\s*\)?\s*;?\s*\/\/.*?\[(\w+)\]/g)].map(m => m[1]),
    ]),
  ];
  const usesPathname = /usePathname\s*\(/.test(code);
  const usesSearch = /useSearchParams\s*\(/.test(code) || queryKeys.length > 0;
  const usesParams = /useParams\s*\(/.test(code) || paramKeys.length > 0;
  if (!usesPathname && !usesSearch && !usesParams) return null;

  const segments = paramKeys.length ? paramKeys : [];
  const route = segments.length ? `/shop/${segments.map(key => `[${key}]`).join("/")}` : "/dashboard";
  const params = segments.map(key => ({ key, value: SAMPLE_PARAM[key] ?? "value" }));
  const pathname = segments.length ? `/shop/${params.map(item => item.value).join("/")}` : "/dashboard";
  const searchParams = queryKeys.map(key => ({ key, value: SAMPLE_QUERY[key] ?? "value" }));
  const query = searchParams.map(item => `${item.key}=${item.value}`).join("&");
  return { route, url: pathname + (query ? `?${query}` : ""), pathname, searchParams, params };
}
