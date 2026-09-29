import type { AwsHighlight } from "./aws-highlights";

/**
 * Worked examples, keyed by the catalogue row they belong to.
 *
 * Kept beside the handbooks rather than inside them: a row is one line, and a
 * two-file example written inline would bury the fifty rows around it. Every
 * handbook row whose name appears here is given these files when the handbook
 * is built, and the search modal opens them in its editor, one file per tab.
 */
export const WORKED_EXAMPLES: Record<string, NonNullable<AwsHighlight["code"]>> = {
  "Array.prototype.map": [
    {
      path: "map-basics.js",
      note: "map returns a new array of the same length, in the same order.",
      code: [
        "const rows = [",
        '  { id: 1, name: "Ada", hours: 7 },',
        '  { id: 2, name: "Linus", hours: 3 },',
        "];",
        "",
        "// One output element per input element.",
        "const options = rows.map(row => ({ value: row.id, label: row.name }));",
        "",
        "// The index is the second argument — no counter needed.",
        "const numbered = rows.map((row, index) => (index + 1) + \". \" + row.name);",
        "",
        "console.log(options.length === rows.length); // true: map never drops elements",
        'console.log(numbered); // ["1. Ada", "2. Linus"]',
      ].join("\n"),
    },
    {
      path: "map-vs-flatmap.js",
      note: "Use flatMap when some elements should disappear instead of becoming undefined.",
      code: [
        "const cart = [",
        '  { sku: "a", qty: 2 },',
        '  { sku: "b", qty: 0 },',
        "];",
        "",
        "// Wrong: a filtering map leaves holes behind.",
        "const wrong = cart.map(line => (line.qty > 0 ? line.sku : undefined));",
        "",
        "// Right: flatMap returns zero or many items per element.",
        "const shipped = cart.flatMap(line => (line.qty > 0 ? [line.sku] : []));",
        "",
        'console.log(wrong);   // ["a", undefined]',
        'console.log(shipped); // ["a"]',
      ].join("\n"),
    },
  ],
  "Array.prototype.reduce": [
    {
      path: "reduce-total.js",
      note: "The initial value is what makes reduce safe on an empty array.",
      code: [
        "const invoice = [",
        '  { item: "Keyboard", price: 4500, qty: 1 },',
        '  { item: "Cable", price: 300, qty: 3 },',
        "];",
        "",
        "// Pass the initial value: an empty array throws without it.",
        "const total = invoice.reduce((sum, line) => sum + line.price * line.qty, 0);",
        "",
        "console.log(total); // 5400",
        "console.log([].reduce((a, b) => a + b, 0)); // 0, not a TypeError",
      ].join("\n"),
    },
    {
      path: "reduce-group-by.js",
      note: "Grouping in a single pass — the classic interview use of reduce.",
      code: [
        "const people = [",
        '  { name: "Ada", team: "core" },',
        '  { name: "Grace", team: "infra" },',
        '  { name: "Linus", team: "core" },',
        "];",
        "",
        "const byTeam = people.reduce((groups, person) => {",
        "  (groups[person.team] ??= []).push(person.name);",
        "  return groups;",
        "}, {});",
        "",
        'console.log(byTeam); // { core: ["Ada", "Linus"], infra: ["Grace"] }',
      ].join("\n"),
    },
  ],
  "Promise.all and Promise.allSettled": [
    {
      path: "load-page-data.js",
      note: "Concurrent, not sequential: three round trips in the time of the slowest.",
      code: [
        "async function loadDashboard(userId, signal) {",
        "  const [user, permissions, alerts] = await Promise.all([",
        '    fetch("/api/users/" + userId, { signal }).then(r => r.json()),',
        '    fetch("/api/users/" + userId + "/permissions", { signal }).then(r => r.json()),',
        '    fetch("/api/alerts", { signal }).then(r => r.json()),',
        "  ]);",
        "  return { user, permissions, alerts };",
        "}",
        "",
        "// Promise.all rejects as soon as any input rejects; the rest keep running",
        "// unless the shared AbortController is aborted.",
      ].join("\n"),
    },
    {
      path: "partial-results.js",
      note: "allSettled never rejects, so one failing panel cannot blank the page.",
      code: [
        "const results = await Promise.allSettled([loadProfile(), loadBilling()]);",
        "",
        "for (const result of results) {",
        '  if (result.status === "fulfilled") render(result.value);',
        "  else showInlineError(result.reason);",
        "}",
        "",
        "// Results keep input order, whichever settled first.",
      ].join("\n"),
    },
  ],
  "JSON.parse and the reviver": [
    {
      path: "safe-parse.js",
      note: "Untrusted text: a SyntaxError here must not reach the render.",
      code: [
        "export function readDraft(key) {",
        "  const stored = localStorage.getItem(key);",
        "  if (!stored) return null;",
        "  try {",
        "    return JSON.parse(stored, (field, value) =>",
        '      field === "savedAt" ? new Date(value) : value);',
        "  } catch {",
        "    localStorage.removeItem(key);",
        "    return null;",
        "  }",
        "}",
      ].join("\n"),
    },
    {
      path: "round-trip.js",
      note: "What a JSON round trip loses, and what structuredClone keeps.",
      code: [
        "const draft = { title: \"Notes\", savedAt: new Date(), tags: new Set([\"a\"]) };",
        "",
        "const throughJson = JSON.parse(JSON.stringify(draft));",
        "console.log(throughJson.savedAt instanceof Date); // false — now a string",
        "console.log(throughJson.tags); // {} — a Set does not survive",
        "",
        "const cloned = structuredClone(draft);",
        "console.log(cloned.savedAt instanceof Date, cloned.tags.has(\"a\")); // true true",
      ].join("\n"),
    },
  ],
};
