import type { ApiReference, CodeExample, ExampleFile } from "@/lib/domain";
import { api, file, json, nodePackage, param, project, readme } from "./examples/builders";

// Complete, deliberately small projects. Every local import is supplied here.
// Version-specific framework conventions follow the documentation cited by the guides.
// The `file`/`json`/`project` constructors live in ./examples/builders so the
// per-lesson service examples in that directory build projects the same way.

const python: CodeExample[] = [
  project("concept", "Values, copies and exact totals", "Follow values across module boundaries and compare a list alias with an independent copy.", [
    file("src/values.py", `from decimal import Decimal

def total(prices: list[str]) -> Decimal:
    """prices: decimal strings, e.g. ['0.10']; return their exact Decimal sum."""
    # Parse strings directly: converting a float first preserves its rounding error.
    return sum((Decimal(price) for price in prices), start=Decimal("0"))

def copy_scores(scores: list[int]) -> list[int]:
    """Return a new outer list. Nested mutable values would still be shared."""
    return scores.copy()`, "Pure functions with parameter and return annotations."),
    file("src/main.py", `from values import copy_scores, total

scores = [88, 92]
alias = scores           # Both names point to the same list.
independent = copy_scores(scores)
alias.append(95)         # Mutates scores, but not independent.
print(scores)
print(independent)
print(f"Total: {total(['0.10', '0.20']):.2f}")`, "Entry point supplies actual arguments and prints observable results."),
    file("tests/test_values.py", `import unittest
from decimal import Decimal
from src.values import copy_scores, total

class ValuesTests(unittest.TestCase):
    def test_exact_total(self) -> None:
        self.assertEqual(total(["0.10", "0.20"]), Decimal("0.30"))

    def test_copy_is_independent(self) -> None:
        original = [1]
        copied = copy_scores(original)
        copied.append(2)
        self.assertEqual(original, [1])`, "Tests check exact arithmetic and object independence."),
    readme("Python values", "Requires Python 3.12+; uses only the standard library. No pip packages are needed."),
  ], ["Install Python 3.12+ (python.org).", "python src/main.py", "python -m unittest discover -s tests"], "[88, 92, 95]\n[88, 92]\nTotal: 0.30", [api("total", "total(prices: list[str]) -> Decimal", "Decimal: exact sum; Decimal('0') for an empty list.", [param("prices", "list[str]", "Decimal strings such as ['0.10', '0.20']; malformed strings raise decimal.InvalidOperation.")])]),
  project("application", "A receipt with typed line items", "Separate a data model, receipt calculation, executable entry point and tests.", [
    file("src/models.py", `from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class LineItem:
    """Immutable record: name is a label; unit_price is exact; quantity is positive."""
    name: str
    unit_price: Decimal
    quantity: int = 1

    def __post_init__(self) -> None:
        if self.quantity < 1 or not self.unit_price.is_finite() or self.unit_price < 0:
            raise ValueError("Expected positive quantity and finite, nonnegative price")

    @property
    def subtotal(self) -> Decimal:
        """Return unit_price × quantity without modifying this object."""
        return self.unit_price * self.quantity`, "Dataclass properties, validation and a computed Decimal return value."),
    file("src/receipt.py", `from decimal import Decimal
from src.models import LineItem

def render_receipt(items: list[LineItem]) -> str:
    """items: ordered line items; return a printable receipt, including its total."""
    rows = [f"{item.name} x{item.quantity}: {item.subtotal:.2f}" for item in items]
    total = sum((item.subtotal for item in items), start=Decimal("0"))
    return "\\n".join([*rows, f"Total: {total:.2f}"])`, "Presentation consumes the model through its public properties."),
    file("src/__init__.py", `"""Receipt package: run from the project root with python -m src.main."""`, "Marks src as a Python package."),
    file("src/main.py", `from decimal import Decimal
from src.models import LineItem
from src.receipt import render_receipt

if __name__ == "__main__":
    # Keyword arguments make quantity and price unambiguous at the call site.
    items = [LineItem(name="Notebook", unit_price=Decimal("49.50"), quantity=2)]
    print(render_receipt(items))`, "Module entry point; importing it does not print a receipt."),
    file("tests/test_receipt.py", `import unittest
from decimal import Decimal
from src.models import LineItem
from src.receipt import render_receipt

class ReceiptTests(unittest.TestCase):
    def test_receipt(self) -> None:
        self.assertIn("Total: 99.00", render_receipt([LineItem("Notebook", Decimal("49.50"), 2)]))

    def test_invalid_quantity(self) -> None:
        with self.assertRaises(ValueError):
            LineItem("Notebook", Decimal("49.50"), 0)`, "Tests a successful calculation and invalid input."),
    readme("Receipt", "Python 3.12+, standard library only. The src folder is an importable package."),
  ], ["python -m src.main", "python -m unittest discover -s tests"], "Notebook x2: 99.00\nTotal: 99.00", [api("LineItem", "LineItem(name: str, unit_price: Decimal, quantity: int = 1)", "LineItem: a frozen record. subtotal is a read-only Decimal property.", [param("name", "str", "Display label."), param("unit_price", "Decimal", "Finite nonnegative price; construct from a string."), param("quantity", "int", "Positive count, defaults to 1.")], "class")]),
];

function reactProject(kind: CodeExample["kind"], title: string, description: string, files: ExampleFile[], expected: string, references: ApiReference[], dependencies: Record<string, string> = {}): CodeExample {
  return project(kind, title, description, [
    json("package.json", { private: true, scripts: { dev: "next dev", build: "next build", start: "next start" }, dependencies: { next: "16.3.4", react: "19.2.8", "react-dom": "19.2.8", ...dependencies }, devDependencies: { typescript: "^5", "@types/react": "^19", "@types/react-dom": "^19", "@types/node": "^22" } }, "The same Next.js and React versions as the learning app."),
    json("tsconfig.json", { compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "react-jsx", plugins: [{ name: "next" }] }, include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"], exclude: ["node_modules"] }, "Strict TypeScript and Next.js generated route types."),
    file("next-env.d.ts", '/// <reference types="next" />\n/// <reference types="next/image-types/global" />', "Next.js regenerates this environment declaration when dev starts."),
    file("app/layout.tsx", `import type { ReactNode, JSX } from "react";
/** children: nested route UI; returns the required HTML document shell. */
export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return <html lang="en"><body style={{ fontFamily: "system-ui", padding: 32 }}>{children}</body></html>;
}`, "Required root layout, including html and body."),
    ...files, readme(title, "Requires Node.js 22.12+. Next.js creates .next build files; npm creates node_modules and package-lock.json. Those generated files are not authored source."),
  ], ["Create the files in a new folder. Use Node.js 22.12+.", "npm install", "npm run dev", "Open http://localhost:3000 (or the port printed by Next.js).", "npm run build validates the production app."], expected, references);
}

const stateApi = api("useState", "useState<number>(initialState: number): [number, Dispatch<SetStateAction<number>>]", "Current numeric state and a setter; the setter returns void and schedules a render.", [param("initialState", "number", "Initial value, used for the first render."), param("updater", "(previous: number) => number", "Argument to the setter. Return the next value without mutating state.")], "hook");
const react: CodeExample[] = [
  reactProject("concept", "A counter with a reusable Hook", "Trace a numeric prop through a custom Hook, its functional updater and the rendered button.", [
    file("hooks/use-counter.ts", `"use client";
import { useState } from "react";
/** Public properties returned by the Hook. Commands return void. */
export interface CounterState { count: number; increment: () => void; reset: () => void }
/** initial: starting number (default 0); returns state and two event commands. */
export function useCounter(initial: number = 0): CounterState {
  const [count, setCount] = useState<number>(initial);
  return { count, increment: () => setCount(previous => previous + 1), reset: () => setCount(initial) };
}`, "Hook signature, interface properties and functional state updates."),
    file("components/counter.tsx", `"use client";
import type { JSX } from "react";
import { useCounter } from "../hooks/use-counter";
/** initial is a numeric prop; the component returns a JSX element. */
export function Counter({ initial }: { initial: number }): JSX.Element {
  const { count, increment, reset } = useCounter(initial);
  return <section><p aria-live="polite">Count: {count}</p><button onClick={increment}>Add one</button> <button onClick={reset}>Reset</button></section>;
}`, "Client Component passes function references to click handlers."),
    file("app/page.tsx", `import { Counter } from "../components/counter";
/** Server entry point passes a serializable prop across the client boundary. */
export default function Page() { return <main><h1>Counter lab</h1><Counter initial={2} /></main>; }`, "Route composes the interactive component."),
  ], "Count starts at 2. Add one shows 3. Reset restores 2.", [stateApi, api("useCounter", "useCounter(initial?: number): CounterState", "{ count: number, increment: () => void, reset: () => void }", [param("initial", "number", "Starting/reset value, defaults to zero.")], "custom hook")]),
  reactProject("application", "A shopping basket with a reducer", "Model a typed state transition separately from the UI, then derive a total from the current state.", [
    file("lib/basket.ts", `export interface Product { id: string; name: string; pricePaise: number }
export interface Basket { quantity: number }
export type Action = { type: "add" } | { type: "remove" } | { type: "reset" };
/** state: previous basket; action: discriminated command; returns a NEW basket. */
export function basketReducer(state: Basket, action: Action): Basket {
  switch (action.type) {
    case "add": return { quantity: state.quantity + 1 };
    case "remove": return { quantity: Math.max(0, state.quantity - 1) };
    case "reset": return { quantity: 0 };
  }
}`, "Interfaces describe data; the action union restricts accepted commands."),
    file("components/basket.tsx", `"use client";
import { useReducer, type JSX } from "react";
import { basketReducer, type Product } from "../lib/basket";
/** product is immutable input; returns interactive basket UI. */
export function BasketView({ product }: { product: Product }): JSX.Element {
  const [state, dispatch] = useReducer(basketReducer, { quantity: 0 });
  // Derive totals. Integer paise avoids binary rounding while adding prices.
  const total = (state.quantity * product.pricePaise / 100).toFixed(2);
  return <section><h2>{product.name}</h2><p aria-live="polite">{state.quantity} items · INR {total}</p><button onClick={() => dispatch({ type: "add" })}>Add</button> <button disabled={!state.quantity} onClick={() => dispatch({ type: "remove" })}>Remove</button> <button onClick={() => dispatch({ type: "reset" })}>Clear</button></section>;
}`, "Reducer Hook, typed dispatch arguments and derived state."),
    file("app/page.tsx", `import { BasketView } from "../components/basket";
export default function Page() { return <main><h1>Basket lab</h1><BasketView product={{ id: "book", name: "Notebook", pricePaise: 4950 }} /></main>; }`, "Supplies every product property from the server route."),
  ], "Starts with 0 items. Add twice: 2 items · INR 99.00. Remove cannot make the quantity negative.", [api("basketReducer", "basketReducer(state: Basket, action: Action): Basket", "A new Basket object with a nonnegative quantity.", [param("state", "Basket", "Current { quantity: number } value."), param("action", "Action", "{ type: 'add' | 'remove' | 'reset' } command.")]), api("useReducer", "useReducer(basketReducer, { quantity: 0 })", "[Basket, dispatch]; dispatch(action) returns void.", [], "hook")]),
];

const nextjs: CodeExample[] = [
  reactProject("concept", "A complete dynamic article route", "Use a typed data module and asynchronous route parameters with a real root layout.", [
    file("lib/articles.ts", `export interface Article { slug: string; title: string; body: string }
const articles: Article[] = [{ slug: "hello", title: "Hello App Router", body: "Folders define routes; pages render them." }];
/** slug: URL identifier; returns an article or undefined for unknown slugs. */
export function getArticle(slug: string): Article | undefined { return articles.find(article => article.slug === slug); }`, "Complete in-memory data layer with no missing getArticle implementation."),
    file("app/page.tsx", `import Link from "next/link";
export default function Page() { return <main><h1>Articles</h1><Link href="/articles/hello">Read Hello App Router</Link></main>; }`, "Index links to the known article."),
    file("app/articles/[slug]/page.tsx", `import { notFound } from "next/navigation";
import { getArticle } from "../../../lib/articles";
/** params is a Promise in this Next.js version. Await it before reading slug. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound(); // never return type narrows article below.
  return <article><h1>{article.title}</h1><p>{article.body}</p></article>;
}`, "Dynamic route supplies an explicit not-found branch."),
  ], "/articles/hello renders the article. /articles/missing renders Next.js's not-found UI.", [api("getArticle", "getArticle(slug: string): Article | undefined", "Article when found; undefined otherwise.", [param("slug", "string", "Resolved params.slug, such as 'hello'.")]), api("notFound", "notFound(): never", "Never: interrupts the route and renders its not-found boundary.")]),
  reactProject("application", "Searchable notes with URL state", "Keep filter state in the URL using a Client Component and a Suspense boundary.", [
    file("lib/notes.ts", `export interface Note { id: number; title: string }
export const notes: Note[] = [{ id: 1, title: "Routing" }, { id: 2, title: "Caching" }, { id: 3, title: "Server Actions" }];
/** query: text from the URL; returns a new list of matching notes. */
export function searchNotes(query: string): Note[] { return notes.filter(note => note.title.toLowerCase().includes(query.toLowerCase())); }`, "Typed data and a pure search function."),
    file("components/search.tsx", `"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { searchNotes } from "../lib/notes";
export function Search() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const query = params.get("q") ?? "";
  /** value: input text; returns void after requesting same-route navigation. */
  function updateQuery(value: string): void {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("q", value); else next.delete("q");
    // Keep the destination on our known pathname and encode query arguments.
    router.replace(pathname + (next.size ? "?" + next.toString() : ""), { scroll: false });
  }
  return <section><label>Find notes <input value={query} onChange={event => updateQuery(event.target.value)} /></label><ul>{searchNotes(query).map(note => <li key={note.id}>{note.title}</li>)}</ul></section>;
}`, "Three URL Hooks, encoded query parameters and typed event arguments."),
    file("app/page.tsx", `import { Suspense } from "react";
import { Search } from "../components/search";
export default function Page() { return <main><h1>Notes search</h1><Suspense fallback={<p>Loading search…</p>}><Search /></Suspense></main>; }`, "Suspense contains useSearchParams during production prerendering."),
  ], "Typing cache filters the list to Caching and updates ?q=cache. Clear the field to restore all notes.", [api("useSearchParams", "useSearchParams(): ReadonlyURLSearchParams", "Read-only query parameters in this App Router project.", [], "hook"), api("router.replace", "router.replace(href: string, options?: { scroll?: boolean }): void", "void; replaces the current history entry.", [param("href", "string", "Known local pathname plus encoded search string."), param("options", "{ scroll?: boolean }", "scroll: false preserves the reading position.")], "method")]),
];

function testProjects(runner: "jest" | "vitest"): CodeExample[] {
  const isJest = runner === "jest";
  const ext = isJest ? "cjs" : "js";
  const imports = isJest ? `const { total } = require('../src/total.cjs');` : `import { expect, test } from 'vitest';\nimport { total } from '../src/total.js';`;
  const serviceImport = isJest ? `const { loadUser } = require('../src/users.cjs');` : `import { expect, test, vi } from 'vitest';\nimport { loadUser } from '../src/users.js';`;
  const mock = isJest ? "jest" : "vi";
  const manifest = nodePackage({ test: isJest ? "jest --runInBand" : "vitest run" }, { [runner]: isJest ? "^30" : "^5" });
  return [
    project("concept", `${isJest ? "Jest" : "Vitest"}: test a pure function`, "Run normal, empty and invalid input cases against the actual implementation.", [manifest,
      file(`src/total.${ext}`, `/** @param {number[]} values finite numbers; @returns {number} their sum. */
${isJest ? "" : "export "}function total(values) {
  if (!values.every(Number.isFinite)) throw new TypeError('Expected finite numbers');
  return values.reduce((sum, value) => sum + value, 0);
}
${isJest ? "module.exports = { total };" : ""}`, "Pure source module validates its input."),
      file(`tests/total.test.${ext}`, `${imports}
test.each([[[1, 2, 3], 6], [[], 0], [[-2, 2], 0]])('sums %j', (values, expected) => {
  expect(total(values)).toBe(expected);
});
test('rejects non-finite numbers', () => {
  expect(() => total([Infinity])).toThrow(TypeError);
});`, "Table-driven cases plus an error assertion."),
      readme("Pure function tests", "Node.js 22.12+. Source and test imports use the same module system."),
    ], ["npm install", "npm test"], "4 tests pass. Replacing the reduce initial value with 1 makes the total assertions fail.", [api("total", "total(values: number[]): number", "Sum, or 0 for an empty array; throws TypeError for non-finite numbers.", [param("values", "number[]", "Finite input values.")])]),
    project("application", "Test an asynchronous service boundary", "Inject a transport dependency, verify its arguments, and test the failure branch without network requests.", [manifest,
      file(`src/users.${ext}`, `/** @param {string} id user id; @param {(id:string)=>Promise<object|null>} fetchUser transport
 * @returns {Promise<object>} user record; rejects if the transport returns null. */
${isJest ? "" : "export "}async function loadUser(id, fetchUser) {
  const user = await fetchUser(id);
  if (!user) throw new Error('User not found');
  return user;
}
${isJest ? "module.exports = { loadUser };" : ""}`, "Dependency injection keeps the service independently testable."),
      file(`tests/users.test.${ext}`, `${serviceImport}
test('returns a record and forwards the id', async () => {
  const fetchUser = ${mock}.fn().mockResolvedValue({ id: 'u1', name: 'Asha' });
  await expect(loadUser('u1', fetchUser)).resolves.toEqual({ id: 'u1', name: 'Asha' });
  expect(fetchUser).toHaveBeenCalledWith('u1');
});
test('rejects an unknown user', async () => {
  const fetchUser = ${mock}.fn().mockResolvedValue(null);
  await expect(loadUser('missing', fetchUser)).rejects.toThrow('User not found');
});`, "Mocks have explicit results; every asynchronous assertion is awaited."),
      readme("Service tests", "All data is a local test fixture. No API server or credentials are required."),
    ], ["npm install", "npm test"], "2 tests pass; no HTTP calls are made.", [api("loadUser", "loadUser(id: string, fetchUser: (id: string) => Promise<object | null>): Promise<object>", "Promise resolving to a user; rejects when missing or when the transport rejects.", [param("id", "string", "Identifier forwarded to the transport."), param("fetchUser", "async function", "Injected transport; a mock supplies known results in tests.")])]),
  ];
}

const javascript: CodeExample[] = [
  project("concept", "A Map-backed frequency counter", "Practice iteration, named exports and collection lookup with a runnable Node.js example.", [nodePackage(),
    file("src/frequency.mjs", `/** @param {string[]} words input tokens; @returns {Map<string, number>} counts. */
export function frequency(words) {
  const counts = new Map();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return counts;
}`, "Pure collection transformation; nullish fallback preserves a zero count."),
    file("src/main.mjs", `import { frequency } from './frequency.mjs';
const counts = frequency(['cache', 'route', 'cache']);
console.log(JSON.stringify(Object.fromEntries(counts)));`, "Entry point converts a Map into serializable output."),
    file("test/frequency.test.mjs", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frequency } from '../src/frequency.mjs';
test('counts repeated tokens', () => assert.equal(frequency(['a', 'a']).get('a'), 2));
test('handles empty input', () => assert.equal(frequency([]).size, 0));`, "Built-in Node test runner needs no packages."),
  ], ["Use Node.js 22.12+.", "npm start", "npm test"], '{"cache":2,"route":1}', [api("frequency", "frequency(words: string[]): Map<string, number>", "A new Map, leaving the input array unchanged.", [param("words", "string[]", "Tokens to count, for example ['a', 'a'].")])]),
  project("application", "An asynchronous iterable pipeline", "Consume an async source, normalize its records and return a deterministic report.", [nodePackage(),
    file("src/source.mjs", `/** @param {string[]} values source data; @returns {AsyncGenerator<string>} lazy records. */
export async function* readRecords(values) {
  for (const value of values) { await Promise.resolve(); yield value; }
}`, "Async generator models a stream without external I/O."),
    file("src/report.mjs", `/** @param {AsyncIterable<string>} records; @returns {Promise<string[]>} nonempty uppercase records. */
export async function createReport(records) {
  const result = [];
  for await (const value of records) {
    const normalized = value.trim();
    if (normalized) result.push(normalized.toUpperCase());
  }
  return result;
}`, "for-await consumes the asynchronous protocol and returns one Promise."),
    file("src/main.mjs", `import { readRecords } from './source.mjs';
import { createReport } from './report.mjs';
console.log(JSON.stringify(await createReport(readRecords([' route ', '', 'cache']))));`, "Top-level await is supported in the ES module entry point."),
    file("test/report.test.mjs", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readRecords } from '../src/source.mjs';
import { createReport } from '../src/report.mjs';
test('normalizes a stream', async () => assert.deepEqual(await createReport(readRecords([' a ', ''])), ['A']));`, "Checks the observable result of the whole pipeline."),
  ], ["Use Node.js 22.12+.", "npm start", "npm test"], '["ROUTE","CACHE"]', [api("createReport", "createReport(records: AsyncIterable<string>): Promise<string[]>", "Promise of filtered uppercase records, preserving order.", [param("records", "AsyncIterable<string>", "Any asynchronous string source, including readRecords(...).")])]),
];

const typescript: CodeExample[] = [
  project("concept", "Narrow a discriminated union", "Compile typed source into JavaScript and exhaustively handle success and failure.", [
    nodePackage({ build: "tsc", start: "node dist/main.js" }, { typescript: "^5" }),
    json("tsconfig.json", { compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, outDir: "dist", rootDir: "src", noEmitOnError: true }, include: ["src/**/*.ts"] }, "A stable baseline for the language concepts; compiler migration is covered in the lesson."),
    file("src/result.ts", `export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
/** value is unknown input; returns a tagged result instead of throwing. */
export function parseCount(value: unknown): Result<number> {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? { ok: true, value } : { ok: false, error: 'Expected a nonnegative integer' };
}`, "Generic union and runtime validation work together."),
    file("src/main.ts", `import { parseCount } from './result.js';
const result = parseCount(3);
// The discriminant narrows the available properties in each branch.
console.log(result.ok ? result.value : result.error);`, "NodeNext source imports use emitted .js paths."),
  ], ["npm install", "npm run build", "npm start"], "3", [api("parseCount", "parseCount(value: unknown): Result<number>", "{ ok: true, value: number } or { ok: false, error: string }.", [param("value", "unknown", "Untrusted input is narrowed before use.")])]),
  project("application", "A typed in-memory repository", "Use a class with a generic constraint, a private Map, readonly records and a public interface.", [
    nodePackage({ build: "tsc", start: "node dist/main.js" }, { typescript: "^5" }),
    json("tsconfig.json", { compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, outDir: "dist", rootDir: "src", noEmitOnError: true }, include: ["src/**/*.ts"] }, "Strict checking with explicit Node module resolution."),
    file("src/repository.ts", `export interface Entity { readonly id: string }
export interface Repository<T extends Entity> { save(value: T): void; find(id: string): T | undefined }
export class MemoryRepository<T extends Entity> implements Repository<T> {
  // Each instance owns its Map; private prevents access through the public API.
  private readonly records = new Map<string, T>();
  /** value: an entity with id; returns void after storing by id. */
  save(value: T): void { this.records.set(value.id, value); }
  /** id: lookup key; returns the record or undefined. */
  find(id: string): T | undefined { return this.records.get(id); }
}`, "Class methods implement an interface with a constrained generic type."),
    file("src/main.ts", `import { MemoryRepository, type Entity } from './repository.js';
interface Note extends Entity { readonly title: string }
const notes = new MemoryRepository<Note>();
notes.save({ id: 'n1', title: 'Typed repositories' });
console.log(notes.find('n1')?.title);
console.log(notes.find('missing') === undefined);`, "Concrete type arguments check every supplied record."),
  ], ["npm install", "npm run build", "npm start"], "Typed repositories\ntrue", [api("MemoryRepository<T>", "class MemoryRepository<T extends Entity> implements Repository<T>", "Repository instance; save returns void and find returns T | undefined.", [param("T", "extends Entity", "Record type must contain a readonly string id."), param("records", "Map<string, T>", "Private instance property storing records by id.")], "class")]),
];

const ai: CodeExample[] = [
  project("concept", "Build a context budget", "A deterministic local model of context packing: prioritize required instructions and add documents only while they fit.", [nodePackage(),
    file("src/context.mjs", `/** @param {{text:string, tokens:number}[]} records pre-counted records
 * @param {number} budget maximum tokens; @returns {string[]} selected texts. */
export function packContext(records, budget) {
  if (!Number.isInteger(budget) || budget < 0) throw new RangeError('Invalid budget');
  const selected = [];
  let remaining = budget;
  for (const record of records) {
    if (!Number.isInteger(record.tokens) || record.tokens < 0) throw new RangeError('Invalid token count');
    if (record.tokens <= remaining) { selected.push(record.text); remaining -= record.tokens; }
  }
  return selected;
}`, "Counts are fixtures, not a substitute for the target model's tokenizer."),
    file("src/main.mjs", `import { packContext } from './context.mjs';
console.log(JSON.stringify(packContext([{ text: 'Task', tokens: 4 }, { text: 'Guide', tokens: 8 }, { text: 'Extra', tokens: 5 }], 12)));`, "Supplies an explicit budget and known token costs."),
    file("test/context.test.mjs", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packContext } from '../src/context.mjs';
test('respects the budget', () => assert.deepEqual(packContext([{ text: 'a', tokens: 4 }], 3), []));
test('rejects invalid counts', () => assert.throws(() => packContext([{ text: 'a', tokens: -1 }], 3)));`, "Boundary tests need no LLM calls."),
  ], ["Use Node.js 22.12+; no model account or API key is needed.", "npm start", "npm test"], '["Task","Guide"]', [api("packContext", "packContext(records: { text: string; tokens: number }[], budget: number): string[]", "Selected text strings; total supplied token costs never exceed budget.", [param("records", "record[]", "Ordered, pre-counted context fragments."), param("budget", "number", "Nonnegative integer token limit.")])]),
  project("application", "A bounded tool loop", "Separate a tool registry, argument validation and a loop with an explicit step limit. The model response is a local fixture.", [nodePackage(),
    file("src/tools.mjs", `/** @param {{a:number,b:number}} input finite numeric arguments; @returns {number} sum. */
export function add(input) {
  if (!input || !Number.isFinite(input.a) || !Number.isFinite(input.b)) throw new TypeError('Expected finite a and b');
  return input.a + input.b;
}
export const tools = Object.freeze({ add });`, "Allowlisted tools validate arguments at their own boundary."),
    file("src/loop.mjs", `import { tools } from './tools.mjs';
/** next(history) returns a tool request or a final answer; resolves to string. */
export async function runAgent(next, maxSteps = 3) {
  const history = [];
  for (let step = 0; step < maxSteps; step++) {
    const response = await next(history);
    if (response.type === 'final') return String(response.text);
    if (response.type !== 'tool' || !Object.hasOwn(tools, response.name)) throw new Error('Unknown tool');
    const result = tools[response.name](response.input);
    history.push({ name: response.name, result });
  }
  throw new Error('Step budget exhausted');
}`, "The loop terminates on a final answer or a finite step budget."),
    file("src/main.mjs", `import { runAgent } from './loop.mjs';
// Deterministic fixture: replace this adapter with a provider only when integrating.
const model = async history => history.length ? { type: 'final', text: String(history[0].result) } : { type: 'tool', name: 'add', input: { a: 2, b: 3 } };
console.log(await runAgent(model));`, "Fixture exercises the complete tool cycle without sending data externally."),
    file("test/loop.test.mjs", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgent } from '../src/loop.mjs';
test('enforces the step limit', async () => {
  await assert.rejects(runAgent(async () => ({ type: 'tool', name: 'add', input: { a: 1, b: 2 } }), 1), /budget/);
});`, "Verifies that an endless tool-request sequence stops."),
  ], ["npm start", "npm test"], "5", [api("runAgent", "runAgent(next: (history: object[]) => Promise<object>, maxSteps?: number): Promise<string>", "Final text; rejects for invalid tools, arguments, or exhausted steps.", [param("next", "async function", "Model adapter receiving prior tool results."), param("maxSteps", "number", "Maximum adapter invocations, defaults to 3.")])]),
];

const claude: CodeExample[] = [
  project("concept", "A skill with a local supporting script", "Keep the instruction entry point, reference checklist and deterministic helper in a discoverable skill folder.", [
    file(".claude/skills/review-checklist/SKILL.md", `---
name: review-checklist
description: Review a small code change using the bundled checklist.
disable-model-invocation: true
---
Read references/checklist.md. Inspect the changes requested by the user.
Report each finding with its file path and the reason it matters.
Do not modify files or claim that checks ran unless they were actually run.
Use scripts/check-json.py only when the user asks to validate a JSON file.`, "Skill metadata and focused instructions."),
    file(".claude/skills/review-checklist/references/checklist.md", `# Review checklist
- Does each input have a defined boundary?
- Are errors surfaced where the caller can respond?
- Does each local import resolve to an existing file?
- Do tests assert observable behavior?`, "Supporting content stays separate from the entry point."),
    file(".claude/skills/review-checklist/scripts/check-json.py", `import json
import sys
from pathlib import Path

def validate(path: str) -> None:
    """path: local JSON file; return None, or raise a parse/read exception."""
    json.loads(Path(path).read_text(encoding="utf-8"))
    print("Valid JSON")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python check-json.py <path>")
    validate(sys.argv[1])`, "Helper has one explicit argument and no external services."),
    json("fixtures/example.json", { title: "Learning notes", complete: false }, "Sample argument for the JSON validation helper."),
    readme("Review skill", "The helper requires Python 3.12+. To use the skill itself, open this project in a configured Claude Code installation."),
  ], ["python .claude/skills/review-checklist/scripts/check-json.py fixtures/example.json", "In Claude Code opened at this project root, invoke /review-checklist for a code change."], "The helper prints Valid JSON. The skill produces findings using the bundled checklist.", [api("validate", "validate(path: str) -> None", "None on success; raises on malformed JSON or an unreadable file.", [param("path", "str", "CLI argument identifying a local UTF-8 JSON file.")])]),
  project("application", "Package a reusable review plugin", "Bundle a namespaced skill and its supporting reference under a plugin manifest.", [
    json(".claude-plugin/plugin.json", { name: "study-review", description: "A focused code-review learning plugin", version: "1.0.0" }, "Plugin identity; skill directories live at the plugin root."),
    file("skills/explain-change/SKILL.md", `---
name: explain-change
description: Explain a code change as a short teaching note.
disable-model-invocation: true
---
Read references/format.md in this skill folder.
Explain the user-specified change using that format.
Include file paths, function parameters, return values and a concrete call example.
Distinguish observed behavior from checks that have not been run.`, "The installed command is namespaced by the plugin."),
    file("skills/explain-change/references/format.md", `# Teaching format
1. What the change does
2. Files and their responsibilities
3. Function signature and argument example
4. Expected result and edge case
5. Validation performed`, "Reusable output format stored beside the skill."),
    readme("Study review plugin", "Requires a configured Claude Code installation. Load this local directory with the --plugin-dir option; no marketplace publishing is needed."),
  ], ["Open a terminal in the project root.", "claude --plugin-dir .", "Invoke /study-review:explain-change and describe the change to explain."], "Claude Code discovers study-review and exposes its namespaced explain-change skill.", [api("plugin.json", "{ name: string, description: string, version: string }", "Configuration metadata; no function return value.", [param("name", "string", "Plugin namespace: study-review."), param("version", "string", "Semantic version identifying this bundle.")], "configuration")]),
];

const zustand: CodeExample[] = [
  reactProject("concept", "A typed shared counter store", "Create one store and subscribe to only the state or command each component needs.", [
    file("stores/counter.ts", `"use client";
import { create } from 'zustand';
export interface CounterStore { count: number; increment: () => void }
/** create<T>() returns a typed store Hook; set receives previous state. */
export const useCounterStore = create<CounterStore>()(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));`, "State interface includes both data and action properties."),
    file("components/counter.tsx", `"use client";
import { useCounterStore } from '../stores/counter';
export function Counter() {
  // Primitive selectors avoid allocating a new object for every snapshot.
  const count = useCounterStore(state => state.count);
  const increment = useCounterStore(state => state.increment);
  return <button onClick={increment}>Shared count: {count}</button>;
}`, "Separate selectors subscribe to stable values."),
    file("app/page.tsx", `import { Counter } from '../components/counter';
export default function Page() { return <main><h1>Shared counter</h1><Counter /><Counter /></main>; }`, "Both views observe the same client store."),
  ], "Both counters start at 0 and update together after either button is clicked.", [api("useCounterStore", "useCounterStore<T>(selector: (state: CounterStore) => T): T", "Selected state value; subscribes the component to that value.", [param("selector", "function", "Return count or increment from the state.")], "store hook")], { zustand: "^5" }),
  reactProject("application", "A request-safe store provider", "Create a store instance per provider, seed it through props and expose a typed selector Hook.", [
    file("stores/todos.ts", `import { createStore } from 'zustand/vanilla';
export interface Todo { id: number; title: string; done: boolean }
export interface TodoStore { todos: Todo[]; toggle: (id: number) => void }
/** initial: serializable seed; each call returns a distinct store instance. */
export const createTodoStore = (initial: Todo[]) => createStore<TodoStore>()(set => ({
  todos: initial,
  toggle: id => set(state => ({ todos: state.todos.map(todo => todo.id === id ? { ...todo, done: !todo.done } : todo) })),
}));`, "Immutable record replacement and per-instance store creation."),
    file("components/todos.tsx", `"use client";
import { createContext, useContext, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { createTodoStore, type Todo, type TodoStore } from '../stores/todos';
const StoreContext = createContext<ReturnType<typeof createTodoStore> | null>(null);
export function TodoProvider({ initial, children }: { initial: Todo[]; children: ReactNode }) {
  const [store] = useState(() => createTodoStore(initial));
  return <StoreContext value={store}>{children}</StoreContext>;
}
/** selector returns T; missing provider is a programming error. */
function useTodos<T>(selector: (state: TodoStore) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error('TodoProvider is required');
  return useStore(store, selector);
}
export function TodoList() {
  const todos = useTodos(state => state.todos);
  const toggle = useTodos(state => state.toggle);
  return <ul>{todos.map(todo => <li key={todo.id}><label><input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />{todo.title}</label></li>)}</ul>;
}`, "Provider lifetime, context boundary and selector return type."),
    file("app/page.tsx", `import { TodoProvider, TodoList } from '../components/todos';
export default function Page() { return <main><h1>Study checklist</h1><TodoProvider initial={[{ id: 1, title: 'Read a lesson', done: false }]}><TodoList /></TodoProvider></main>; }`, "Initial state is supplied by the server, without a server singleton."),
  ], "Read a lesson starts unchecked. Toggle it without replacing unrelated todo records.", [api("createTodoStore", "createTodoStore(initial: Todo[]): StoreApi<TodoStore>", "New isolated store exposing getState, setState and subscribe.", [param("initial", "Todo[]", "Initial id, title and done properties for each record.")]), api("useTodos<T>", "useTodos<T>(selector: (state: TodoStore) => T): T", "Reactive selector result.", [], "custom hook")], { zustand: "^5" }),
];

const rtlConfig = [
  nodePackage({ test: "vitest run" }, { vitest: "^5", jsdom: "^26", "@testing-library/react": "^16", "@testing-library/user-event": "^14", "@testing-library/jest-dom": "^6", "@types/react": "^19", "@types/react-dom": "^19", typescript: "^5" }, { react: "19.2.8", "react-dom": "19.2.8" }),
  file("vitest.config.ts", `import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'jsdom', setupFiles: ['./test/setup.ts'] } });`, "DOM environment and explicit matcher setup."),
  file("test/setup.ts", `import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup); // Every test starts with an empty document.`, "Registers DOM matchers and cleanup without depending on global test APIs."),
];
const rtl: CodeExample[] = [
  project("concept", "Test a labelled interaction", "Render a component and test the same accessible button a reader can operate.", [...rtlConfig,
    file("src/Counter.tsx", `import React, { useState } from 'react';
/** initial: starting count; returns a React element with an accessible command. */
export function Counter({ initial = 0 }: { initial?: number }): React.JSX.Element {
  const [count, setCount] = useState(initial);
  return <button onClick={() => setCount(value => value + 1)}>Count: {count}</button>;
}`, "Small component with a numeric prop and functional update."),
    file("test/Counter.test.tsx", `import React from 'react';
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from '../src/Counter';
test('increments the count through its button', async () => {
  const user = userEvent.setup();
  render(<Counter initial={2} />);
  await user.click(screen.getByRole('button', { name: 'Count: 2' }));
  expect(screen.getByRole('button', { name: 'Count: 3' })).toBeVisible();
});`, "Queries by role and accessible name; awaits the simulated interaction."),
  ], ["Use Node.js 22.12+.", "npm install", "npm test"], "One passing DOM test; the button changes from Count: 2 to Count: 3.", [api("render", "render(ui: ReactElement): RenderResult", "Helpers for the rendered component, including unmount and rerender.", [param("ui", "ReactElement", "The component tree under test.")]), api("user.click", "user.click(element: Element): Promise<void>", "Resolves after the simulated interaction.", [], "method")]),
  project("application", "Test a form's async success and error states", "Inject a save function and verify both observable outcomes without a server.", [...rtlConfig,
    file("src/Signup.tsx", `import React, { useState, type FormEvent } from 'react';
export interface SignupProps { save: (email: string) => Promise<void> }
export function Signup({ save }: SignupProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setStatus('Saving');
    try { await save(email); setStatus('Saved'); }
    catch { setStatus('Could not save'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label><button disabled={busy}>Join</button><p role="status">{status}</p></form>;
}`, "Typed callback prop, event parameter and Promise return contract."),
    file("test/Signup.test.tsx", `import React from 'react';
import { test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Signup } from '../src/Signup';
test.each([true, false])('save success=%s', async success => {
  const user = userEvent.setup();
  const save = success ? vi.fn().mockResolvedValue(undefined) : vi.fn().mockRejectedValue(new Error('offline'));
  render(<Signup save={save} />);
  await user.type(screen.getByRole('textbox', { name: 'Email' }), 'learner@example.test');
  await user.click(screen.getByRole('button', { name: 'Join' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(success ? 'Saved' : 'Could not save'));
  expect(save).toHaveBeenCalledWith('learner@example.test');
  expect(screen.getByRole('button', { name: 'Join' })).toBeEnabled();
});`, "Exercises asynchronous outcomes and the exact submitted argument."),
  ], ["npm install", "npm test"], "Two tests pass: success displays Saved; rejection displays Could not save and re-enables Join.", [api("SignupProps", "interface SignupProps { save: (email: string) => Promise<void> }", "Props contract consumed by Signup; save resolves on success or rejects on failure.", [param("save", "async function", "Receives the email entered by the reader.")], "interface")]),
];

const webFixture = file("fixtures/index.html", `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Counter lab</title></head>
<body><h1>Counter lab</h1><button id="add">Add one</button><p role="status">0</p>
<script>
  let count = 0;
  document.querySelector('#add').addEventListener('click', () => {
    document.querySelector('[role="status"]').textContent = String(++count);
  });
</script></body></html>`, "The complete page exercised by the browser tests.");
const playwright: CodeExample[] = [
  project("concept", "A browser test with a complete fixture", "Load a local HTML fixture, use semantic locators and assert the visible count.", [
    nodePackage({ test: "playwright test" }, { "@playwright/test": "^1.58" }), webFixture,
    file("playwright.config.ts", `import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', use: { browserName: 'chromium' } });`, "Explicit test directory and browser."),
    file("tests/counter.spec.ts", `import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
test('increments the visible count', async ({ page }) => {
  await page.setContent(await readFile('fixtures/index.html', 'utf8'));
  await page.getByRole('button', { name: 'Add one' }).click();
  await expect(page.getByRole('status')).toHaveText('1');
});`, "Playwright's page fixture is isolated for every test."),
  ], ["Use Node.js 22.12+.", "npm install", "npx playwright install chromium", "npm test"], "One Chromium test passes. The status changes from 0 to 1.", [api("toHaveText", "await expect(locator).toHaveText(expected: string): Promise<void>", "Resolves when the expected text appears; rejects on timeout.", [param("expected", "string", "The observable text to match.")], "assertion")]),
  project("application", "Test an app with a managed web server", "Start a real local server through Playwright config and reuse typed page-object methods.", [
    nodePackage({ serve: "node server.mjs", test: "playwright test" }, { "@playwright/test": "^1.58" }), webFixture,
    file("server.mjs", `import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
// Only a single fixed fixture is served; request paths cannot read arbitrary files.
const html = await readFile('fixtures/index.html');
createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
}).listen(4173, '127.0.0.1');`, "Self-contained fixture server; no external app dependency."),
    file("playwright.config.ts", `import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: { command: 'npm run serve', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
});`, "Playwright waits for and shuts down the server it starts."),
    file("tests/pages/counter.ts", `import { expect, type Page } from '@playwright/test';
export class CounterPage {
  /** page: isolated browser tab fixture; stored as a readonly property. */
  constructor(readonly page: Page) {}
  async open(): Promise<void> { await this.page.goto('/'); }
  async add(): Promise<void> { await this.page.getByRole('button', { name: 'Add one' }).click(); }
  /** value: expected count; resolves after the auto-retrying assertion succeeds. */
  async expectCount(value: number): Promise<void> { await expect(this.page.getByRole('status')).toHaveText(String(value)); }
}`, "Page object documents constructor property, method arguments and Promise returns."),
    file("tests/counter.spec.ts", `import { test } from '@playwright/test';
import { CounterPage } from './pages/counter';
test('increments twice and resets on reload', async ({ page }) => {
  const counter = new CounterPage(page);
  await counter.open(); await counter.add(); await counter.add();
  await counter.expectCount(2);
  await page.reload(); await counter.expectCount(0);
});`, "Tests an actual navigation and reload lifecycle."),
  ], ["npm install", "npx playwright install chromium", "Ensure local port 4173 is free, then run npm test."], "The browser sees 2 after two clicks and 0 after reload. Playwright manages the fixture server.", [api("CounterPage", "new CounterPage(page: Page)", "Page object; async methods return Promise<void>.", [param("page", "Page", "Browser page supplied by Playwright's test fixture.")], "class")]),
];

const aws: CodeExample[] = [
  project("concept", "Describe a private S3 bucket", "Read a complete CloudFormation template and validate its shape locally before considering a deployment.", [
    json("infra/bucket.json", { AWSTemplateFormatVersion: "2010-09-09", Description: "Private study storage", Resources: { StudyBucket: { Type: "AWS::S3::Bucket", DeletionPolicy: "Retain", UpdateReplacePolicy: "Retain", Properties: { VersioningConfiguration: { Status: "Enabled" }, PublicAccessBlockConfiguration: { BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, RestrictPublicBuckets: true }, BucketEncryption: { ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }] } } } } }, "Resource type, properties and lifecycle policies define the bucket."),
    file("scripts/check.mjs", `import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const template = JSON.parse(await readFile('infra/bucket.json', 'utf8'));
const bucket = template.Resources.StudyBucket;
assert.equal(bucket.Type, 'AWS::S3::Bucket');
assert.equal(bucket.Properties.VersioningConfiguration.Status, 'Enabled');
assert.ok(Object.values(bucket.Properties.PublicAccessBlockConfiguration).every(value => value === true));
console.log('Local checks passed');`, "Checks this example's expected properties; not a substitute for CloudFormation validation."),
    readme("Private bucket", "Run the local checks with Node.js 22.12+. This example does not deploy or create AWS resources. An actual deployment requires AWS credentials, a region and an explicit infrastructure review. Retain means stack deletion keeps the bucket and its data."),
  ], ["node scripts/check.mjs", "Inspect infra/bucket.json and its resource properties."], "Local checks passed. No AWS resource is created.", [api("AWS::S3::Bucket", "Resources.StudyBucket: { Type: 'AWS::S3::Bucket', Properties: {...} }", "Declarative resource definition; no JavaScript return value.", [param("VersioningConfiguration", "object", "Status: Enabled retains object versions."), param("PublicAccessBlockConfiguration", "object", "All four true values block public access configurations.")], "resource")]),
  project("application", "A testable Lambda HTTP handler", "Separate request parsing, response construction and local tests for a serverless endpoint.", [
    nodePackage({ test: "node --test", start: "node scripts/invoke.mjs" }),
    file("src/greeting.mjs", `/** @param {unknown} name untrusted query value; @returns {string} greeting. */
export function greet(name) {
  if (typeof name !== 'string' || !name.trim() || name.length > 80) throw new TypeError('Name must be 1–80 characters');
  return 'Hello, ' + name.trim();
}`, "Domain validation is independent of the Lambda event format."),
    file("src/handler.mjs", `import { greet } from './greeting.mjs';
/** @param {{queryStringParameters?:{name?:string}}} event HTTP API event subset
 * @returns {Promise<{statusCode:number,headers:object,body:string}>} proxy response. */
export async function handler(event) {
  try { return response(200, { message: greet(event.queryStringParameters?.name) }); }
  catch (error) {
    if (error instanceof TypeError) return response(400, { error: error.message });
    throw error;
  }
}
function response(statusCode, body) { return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }`, "Handler accepts a documented event subset and returns serialized JSON."),
    file("scripts/invoke.mjs", `import { handler } from '../src/handler.mjs';
console.log((await handler({ queryStringParameters: { name: 'Asha' } })).body);`, "Local invocation fixture avoids a cloud deployment."),
    file("test/handler.test.mjs", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handler } from '../src/handler.mjs';
test('valid name', async () => assert.equal((await handler({ queryStringParameters: { name: 'Asha' } })).statusCode, 200));
test('missing name', async () => assert.equal((await handler({})).statusCode, 400));`, "Tests success and validation failures locally."),
    readme("Lambda handler", "Run locally with Node.js 22.12+. For a later AWS integration, the Lambda handler export is src/handler.handler and the endpoint expects an HTTP API event. IAM and endpoint deployment are outside this local invocation project."),
  ], ["npm start", "npm test"], '{"message":"Hello, Asha"}\nTwo local tests pass.', [api("handler", "handler(event: { queryStringParameters?: { name?: string } }): Promise<ProxyResponse>", "statusCode, headers and a JSON-encoded body; 400 for invalid input.", [param("event", "HTTP API event subset", "Optional queryStringParameters.name is validated before use.")], "async handler")]),
];

const devops: CodeExample[] = [
  project("concept", "A deterministic CI pipeline", "Keep implementation, tests and workflow together, with a workflow that exits after a single test run.", [nodePackage(),
    file("src/main.mjs", `/** @param {string} value release label; @returns {boolean} whether it is usable. */
export const validLabel = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
console.log(validLabel('study-notes'));`, "Pure validation function used by the pipeline."),
    file("test/labels.test.mjs", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validLabel } from '../src/main.mjs';
test('valid slug', () => assert.equal(validLabel('study-notes'), true));
test('invalid whitespace', () => assert.equal(validLabel('study notes'), false));`, "A failing assertion produces a nonzero exit status."),
    file(".github/workflows/ci.yml", `name: checks
on: [push, pull_request]
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      # No npm install is needed: this example uses only Node built-ins.
      - run: npm test`, "Small workflow with read-only repository permissions."),
  ], ["Use Node.js 22.12+ and run npm test locally.", "To use hosted CI, add these files to your own GitHub repository; the workflow runs on push or pull request."], "Two tests pass locally. The workflow runs the same command when enabled in a repository.", [api("validLabel", "validLabel(value: string): boolean", "true for lowercase alphanumeric words separated by single hyphens.", [param("value", "string", "Candidate release label.")])]),
  project("application", "Containerize a health endpoint", "Supply the app, image recipe, ignore rules and health probe as a small local container project.", [
    nodePackage({ start: "node src/server.mjs" }),
    file("src/server.mjs", `import { createServer } from 'node:http';
/** HTTP callback receives request/response objects and ends every response. */
createServer((request, response) => {
  const healthy = request.url === '/health';
  response.writeHead(healthy ? 200 : 404, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(healthy ? { status: 'ok' } : { error: 'not found' }));
}).listen(3000, '0.0.0.0');`, "Bind to all container interfaces so the published port can reach the service."),
    file("Dockerfile", `FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.mjs"]`, "Non-root runtime with a health command; no package installation is needed."),
    file(".dockerignore", `node_modules
.git
.env*
README.md`, "Prevents local credentials and development data from entering the build context."),
    readme("Health container", "Requires Docker Engine/Desktop. The commands build and run a local example; they do not publish an image. Use Ctrl+C to stop the foreground container."),
  ], ["docker build -t study-health .", "docker run --rm -p 3000:3000 study-health", "In another terminal, open http://localhost:3000/health or request it with curl."], '{"status":"ok"}; unknown routes return HTTP 404.', [api("createServer", "createServer(listener: (request, response) => void): Server", "HTTP server; listen starts accepting connections.", [param("listener", "function", "Must send a status and end the response for each request.")])]),
];

function startProject(kind: CodeExample["kind"], title: string, files: ExampleFile[], expected: string): CodeExample {
  return project(kind, title, "A complete TanStack Start source tree with a route, router registration and document shell.", [
    nodePackage({ dev: "vite dev", build: "vite build" }, { vite: "^8", "@vitejs/plugin-react": "^6", typescript: "^5", "@types/react": "^19", "@types/react-dom": "^19", "@types/node": "^22" }, { "@tanstack/react-start": "^1", "@tanstack/react-router": "^1", react: "19.2.8", "react-dom": "19.2.8" }),
    json("tsconfig.json", { compilerOptions: { jsx: "react-jsx", moduleResolution: "Bundler", module: "ESNext", target: "ES2022", skipLibCheck: true, strict: true, noEmit: true }, include: ["src", "vite.config.ts"] }, "Strict checking for authored and generated routes."),
    file("vite.config.ts", `import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ server: { port: 3000 }, plugins: [tanstackStart(), react()] });`, "The Start plugin precedes the React transform."),
    file("src/router.tsx", `import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
/** Called per router instance; routeTree is generated from the files in routes. */
export function getRouter() { return createRouter({ routeTree, scrollRestoration: true }); }
declare module '@tanstack/react-router' { interface Register { router: ReturnType<typeof getRouter> } }`, "Typed router registration; Vite creates routeTree.gen.ts on first run."),
    file("src/routes/__root.tsx", `import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }] }),
  component: () => <html lang="en"><head><HeadContent /></head><body><Outlet /><Scripts /></body></html>,
});`, "Document shell includes head content, nested routes and hydration scripts."),
    ...files, readme(title, "Node.js 22.12+. Run the Vite dev server once to generate src/routeTree.gen.ts before running an independent type check. The generated route tree, node_modules and lockfile are build/install outputs."),
  ], ["npm install", "npm run dev", "Open http://localhost:3000.", "npm run build"], expected, [api("createFileRoute", "createFileRoute('/')({ loader, component })", "Typed route with loader data available through Route.useLoaderData().", [param("loader", "function", "Returns data for the route; can run on both client and server."), param("component", "React component", "UI for the route.")])]);
}
const tanstack: CodeExample[] = [
  startProject("concept", "A typed route loader", [
    file("src/data/lessons.ts", `export interface Lesson { id: number; title: string }
/** Returns fixture records; safe on the server and in the browser. */
export function listLessons(): Lesson[] { return [{ id: 1, title: 'Routes' }, { id: 2, title: 'Loaders' }]; }`, "Every loader dependency is supplied locally."),
    file("src/routes/index.tsx", `import { createFileRoute } from '@tanstack/react-router';
import { listLessons } from '../data/lessons';
export const Route = createFileRoute('/')({ loader: () => listLessons(), component: Home });
function Home() {
  const lessons = Route.useLoaderData(); // Inferred as Lesson[].
  return <main><h1>Study topics</h1><ul>{lessons.map(lesson => <li key={lesson.id}>{lesson.title}</li>)}</ul></main>;
}`, "Loader return type flows into the component without a cast."),
  ], "The home page lists Routes and Loaders from the local loader."),
  startProject("application", "A server function behind a route loader", [
    file("src/server/catalog.ts", `import { createServerFn } from '@tanstack/react-start';
export interface CatalogItem { id: string; title: string; minutes: number }
/** Handler runs on the server; callers receive a Promise of serializable records. */
export const getCatalog = createServerFn({ method: 'GET' }).handler(async (): Promise<CatalogItem[]> => {
  return [{ id: 'routing', title: 'Routing workshop', minutes: 30 }];
});`, "Explicit server boundary with a typed, complete fixture data source."),
    file("src/routes/index.tsx", `import { createFileRoute } from '@tanstack/react-router';
import { getCatalog } from '../server/catalog';
export const Route = createFileRoute('/')({
  loader: () => getCatalog(),
  pendingComponent: () => <p>Loading catalog…</p>,
  errorComponent: () => <p>Catalog is unavailable.</p>,
  component: Catalog,
});
function Catalog() {
  const items = Route.useLoaderData();
  return <main><h1>Workshop catalog</h1>{items.map(item => <article key={item.id}><h2>{item.title}</h2><p>{item.minutes} minutes</p></article>)}</main>;
}`, "Isomorphic loader calls the server function and supplies pending/error UI."),
  ], "Workshop catalog displays Routing workshop and 30 minutes; the fixture is returned through the server function."),
];

export const TOPIC_PROJECTS: Record<string, CodeExample[]> = {
  python, "react-19": react, "react-19-hooks": react,
  "nextjs-16": nextjs, "nextjs-16-hooks": nextjs,
  jest: testProjects("jest"), vitest: testProjects("vitest"),
  es2026: javascript, "typescript-7": typescript,
  "llm-context-loop-memory": ai, "claude-skills-plugins-mcp": claude, zustand,
  "react-testing-library": rtl, playwright, "aws-popular-services": aws,
  "devops-services": devops, "tanstack-start": tanstack,
};
