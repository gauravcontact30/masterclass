import type { DocsProject } from "./official-docs-projects";
import type { AnswerFile } from "./pro-learn/types";

const file = (path: string, code: string): AnswerFile => ({ path, code: code.trim() + "\n", note: "" });

function example(title: string, summary: string, files: AnswerFile[], command: string, verify: string[], prerequisites = ["Node.js 22.12+."]): DocsProject {
  return { title, summary, files, commands: [{ command, description: "Run from a new folder containing the displayed files." }], verify, prerequisites, points: [] };
}

function javascript(title: string, summary: string, code: string, verify: string[]): DocsProject {
  return example(title, summary, [file("solution.mjs", code)], "node solution.mjs", verify);
}

function nodeExample(title: string, summary: string, code: string, dependencies: Record<string, string>, verify: string[]): DocsProject {
  const result = javascript(title, summary, code, verify);
  result.files.push(file("package.json", JSON.stringify({ private: true, type: "module", scripts: { start: "node solution.mjs" }, dependencies }, null, 2)));
  result.commands.unshift({ command: "npm install", description: "Install the dependencies from package.json." });
  return result;
}

const budget = javascript("Fit lessons into a study break", "Given a time budget, select lessons in priority order without exceeding the available minutes. Reject invalid durations instead of silently producing a wrong plan.", `import assert from 'node:assert/strict';
function planStudy(lessons, budget) {
  if (!Number.isInteger(budget) || budget < 0) throw new Error('Invalid budget');
  const selected = [];
  let remaining = budget;
  for (const lesson of lessons) {
    if (!Number.isInteger(lesson.minutes) || lesson.minutes <= 0) throw new Error('Invalid duration');
    if (lesson.minutes <= remaining) {
      selected.push(lesson.title);
      remaining -= lesson.minutes;
    }
  }
  return { selected, remaining };
}
const lessons = [{ title: 'Arrays', minutes: 15 }, { title: 'Async', minutes: 25 }, { title: 'Maps', minutes: 10 }];
assert.deepEqual(planStudy(lessons, 30), { selected: ['Arrays', 'Maps'], remaining: 5 });
assert.deepEqual(planStudy(lessons, 0), { selected: [], remaining: 0 });
assert.throws(() => planStudy([{ title: 'Bad data', minutes: -1 }], 30));
console.log(planStudy(lessons, 30));`, ["Arrays and Maps are selected, with 5 minutes left.", "This is a priority-preserving greedy plan, not a maximum-value optimizer; all three assertions pass."]);

const deduplicate = javascript("Remove duplicate notification recipients", "Normalize imported addresses and remove duplicates while preserving their first-seen order. Blank rows are ignored; this exercise does not claim to validate email delivery.", `import assert from 'node:assert/strict';
function recipients(rows) {
  return [...new Set(rows.map(row => row.trim().toLowerCase()).filter(Boolean))];
}
const result = recipients([' ADA@example.com ', '', 'ada@example.com', 'lin@example.com']);
assert.deepEqual(result, ['ada@example.com', 'lin@example.com']);
assert.deepEqual(recipients([]), []);
console.log(result);`, ["Only ada@example.com and lin@example.com appear, once each."]);

const python = example("Summarize a support-ticket backlog", "Count open tickets by priority so a support team can decide which queue needs attention. Closed tickets do not inflate the backlog.", [file("backlog.py", `from collections import Counter

def backlog(tickets):
    return dict(Counter(ticket['priority'] for ticket in tickets if ticket['status'] == 'open'))

tickets = [
    {'priority': 'high', 'status': 'open'},
    {'priority': 'high', 'status': 'closed'},
    {'priority': 'normal', 'status': 'open'},
    {'priority': 'high', 'status': 'open'},
]
assert backlog(tickets) == {'high': 2, 'normal': 1}
assert backlog([]) == {}
print(backlog(tickets))`)], "python backlog.py", ["Prints {'high': 2, 'normal': 1}; the empty-input assertion also passes."], ["Python 3.12+; no third-party packages."]);

const filterApp = `import React, { useState } from 'react';
const products = [{ id: 1, name: 'Notebook', stock: 4 }, { id: 2, name: 'Pencil', stock: 0 }, { id: 3, name: 'Pen', stock: 8 }];
export default function App() {
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const visible = products.filter(product => product.name.toLowerCase().includes(query.trim().toLowerCase()) && (!availableOnly || product.stock > 0));
  return <main><h1>Find available supplies</h1>
    <label>Search products <input value={query} onChange={event => setQuery(event.target.value)} /></label>
    <label><input type="checkbox" checked={availableOnly} onChange={event => setAvailableOnly(event.target.checked)} /> In stock only</label>
    <p role="status">{visible.length} products found</p>
    <ul>{visible.map(product => <li key={product.id}>{product.name}: {product.stock} in stock</li>)}</ul>
    {!visible.length && <p>No matching products. Try another search.</p>}
  </main>;
}`;

const react = example("Find products that are actually in stock", "Combine a text search and an availability filter to keep shoppers from selecting unavailable products. Includes a useful empty state and the complete app setup.", [
  file("src/App.jsx", filterApp),
  file("src/main.jsx", `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
createRoot(document.getElementById('root')).render(<App />);`),
  file("index.html", `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Available supplies</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`),
  file("package.json", JSON.stringify({ private: true, type: "module", scripts: { start: "vite --host 127.0.0.1" }, dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" }, devDependencies: { vite: "^7.0.0" } }, null, 2)),
], "npm start", ["Run npm install first, then visit http://localhost:5173.", "Search for pen: two products appear. Select In stock only: only Pen remains.", "Search for missing: the result count is zero and the empty state appears."], ["Node.js 22.12+ and npm.", "Run npm install in the folder containing package.json before starting the app."]);
react.commands.unshift({ command: "npm install", description: "Install the dependencies declared in package.json." });

const next = example("Share a filtered product search", "Read a search term on the server and return only matching products. A native GET form keeps the search bookmarkable and works without client-side JavaScript.", [
  file("app/page.js", `const products = ['Notebook', 'Pencil', 'Pen'];
export default async function Page({ searchParams }) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  const results = products.filter(name => name.toLowerCase().includes(query.toLowerCase()));
  return <main><h1>Product search</h1><form>
    <label>Search <input name="q" defaultValue={query} /></label><button>Find</button>
  </form><p>{results.length} products found</p>
    <ul>{results.map(name => <li key={name}>{name}</li>)}</ul>
    {!results.length && <p>No matching products.</p>}
  </main>;
}`),
  file("app/layout.js", `export default function Layout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}`),
  file("package.json", JSON.stringify({ private: true, scripts: { start: "next dev" }, dependencies: { next: "^16.3.6", react: "^19.2.0", "react-dom": "^19.2.0" } }, null, 2)),
], "npm start", ["Visit http://localhost:3000/?q=pen: Pencil and Pen appear.", "Search for missing: the empty state appears. Reloading preserves the search."], ["Node.js 22.12+ and npm; port 3000 available."]);
next.commands.unshift({ command: "npm install", description: "Install the dependencies in package.json." });

export const PRACTICAL_SIMPLE: Record<string, DocsProject> = {
  react, "react-hooks": react, nextjs: next, "nextjs-hooks": next,
  python, uv: { ...python, commands: [{ command: "uv run --python 3.12 backlog.py", description: "Let uv select Python and run the dependency-free script." }], prerequisites: ["uv installed; it can download Python 3.12 if needed."] },
  "javascript-info": budget, "javascript-features": deduplicate,
  nodejs: javascript("Count failed requests in a log", "Turn raw access-log records into an error summary without mistaking redirects or successful requests for failures.", `import assert from 'node:assert/strict';
const records = [{ path: '/checkout', status: 503 }, { path: '/catalog', status: 200 }, { path: '/checkout', status: 500 }, { path: '/login', status: 401 }];
function errorsByRoute(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (row.status >= 400) counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
}
assert.deepEqual(errorsByRoute(records), { '/checkout': 2, '/login': 1 });
assert.deepEqual(errorsByRoute([]), {});
console.log(errorsByRoute(records));`, ["Reports two checkout errors and one login error; /catalog is omitted."]),
  "javascript-puzzles": javascript("Prevent duplicate background work", "Use a closure to share one in-flight promise among concurrent callers. The finally block allows a later retry after success or failure.", `import assert from 'node:assert/strict';
function singleFlight(task) {
  let pending;
  return () => {
    pending ??= Promise.resolve().then(task).finally(() => { pending = undefined; });
    return pending;
  };
}
let calls = 0;
const load = singleFlight(async () => ++calls);
assert.deepEqual(await Promise.all([load(), load(), load()]), [1, 1, 1]);
assert.equal(await load(), 2);
let attempts = 0;
const retry = singleFlight(() => { if (++attempts === 1) throw new Error('Offline'); return 'Recovered'; });
await assert.rejects(retry, /Offline/);
assert.equal(await retry(), 'Recovered');
console.log('Concurrent requests deduplicated; failed requests can retry.');`, ["The first three callers trigger one operation; a later call starts a fresh operation.", "A rejected operation does not permanently block future calls."]),
  "system-design": javascript("Calculate workers for a queue", "Estimate worker count from arrival rate, processing time, and target utilization. Round up so fractional capacity does not hide an overloaded queue.", `import assert from 'node:assert/strict';
function workersPerSecond(arrivals, secondsPerJob, utilization = 0.7) {
  if (![arrivals, secondsPerJob, utilization].every(Number.isFinite) || arrivals < 0 || secondsPerJob <= 0 || utilization <= 0 || utilization >= 1) throw new Error('Invalid capacity inputs');
  return Math.ceil(arrivals * secondsPerJob / utilization);
}
assert.equal(workersPerSecond(20, 0.2), 6);
assert.equal(workersPerSecond(0, 0.2), 0);
assert.throws(() => workersPerSecond(20, 0.2, 1));
console.log('Required workers:', workersPerSecond(20, 0.2));`, ["Prints Required workers: 6.", "This steady-state estimate assumes independent jobs; measure burstiness and processing-time distribution before choosing production capacity."]),
  zustand: nodeExample("Prevent overselling the last item", "Keep available stock in a store and reject reservations once it reaches zero. This local store example makes the inventory rule explicit.", `import assert from 'node:assert/strict';
import { createStore } from 'zustand/vanilla';
const stock = createStore((set, get) => ({
  available: 2,
  reserve() {
    if (get().available === 0) return false;
    set(state => ({ available: state.available - 1 }));
    return true;
  },
}));
assert.equal(stock.getState().reserve(), true);
assert.equal(stock.getState().reserve(), true);
assert.equal(stock.getState().reserve(), false);
assert.equal(stock.getState().available, 0);
console.log('Two reservations accepted; the third was rejected.');`, { zustand: "^5.0.0" }, ["Two reservations succeed and the third returns false; stock never becomes negative.", "A server transaction is still required when multiple users reserve shared inventory."]),
  redux: nodeExample("Track unread notifications", "Use explicit actions to receive notifications and mark them read without losing unrelated state.", `import assert from 'node:assert/strict';
import { legacy_createStore as createStore } from 'redux';
function reducer(state = { unread: [] }, action) {
  if (action.type === 'received' && !state.unread.includes(action.id)) return { ...state, unread: [...state.unread, action.id] };
  if (action.type === 'read') return { ...state, unread: state.unread.filter(id => id !== action.id) };
  return state;
}
const store = createStore(reducer);
store.dispatch({ type: 'received', id: 'ticket-17' });
store.dispatch({ type: 'received', id: 'ticket-17' });
assert.equal(store.getState().unread.length, 1);
store.dispatch({ type: 'read', id: 'ticket-17' });
assert.deepEqual(store.getState().unread, []);
console.log('Duplicate notification ignored; inbox is now clear.');`, { redux: "^5.0.0" }, ["Receiving the same ID twice creates one unread item; reading it clears the inbox."]),
  rtk: nodeExample("Maintain a unique saved-items list", "Use a Redux Toolkit slice to add and remove saved product IDs while preventing duplicate bookmarks.", `import assert from 'node:assert/strict';
import { configureStore, createSlice } from '@reduxjs/toolkit';
const saved = createSlice({ name: 'saved', initialState: [], reducers: {
  add(state, action) { if (!state.includes(action.payload)) state.push(action.payload); },
  remove(state, action) { return state.filter(id => id !== action.payload); },
} });
const store = configureStore({ reducer: saved.reducer });
store.dispatch(saved.actions.add('notebook'));
store.dispatch(saved.actions.add('notebook'));
assert.deepEqual(store.getState(), ['notebook']);
store.dispatch(saved.actions.remove('notebook'));
assert.deepEqual(store.getState(), []);
console.log('Saved items stay unique and can be removed.');`, { "@reduxjs/toolkit": "^2.0.0" }, ["All assertions pass: duplicate saves are ignored and removal clears the item."]),
  tanstack: nodeExample("Avoid fetching the same product twice", "Use a query key and freshness window to reuse a product lookup. Invalidate it when the source changes so the next caller gets fresh data.", `import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
const client = new QueryClient();
let requests = 0;
const options = { queryKey: ['product', 'notebook'], staleTime: 60000,
  queryFn: async () => ({ name: 'Notebook', revision: ++requests }) };
try {
  await client.fetchQuery(options);
  await client.fetchQuery(options);
  assert.equal(requests, 1);
  await client.invalidateQueries({ queryKey: ['product', 'notebook'] });
  assert.equal((await client.fetchQuery(options)).revision, 2);
  console.log('Cache reused; invalidation triggered a fresh lookup.');
} finally { client.clear(); }`, { "@tanstack/react-query": "^5.0.0", react: "^19.2.0" }, ["Two reads share one lookup; a read after invalidation performs the second lookup."]),
  zod: nodeExample("Reject invalid delivery quantities", "Validate an external request before a delivery is scheduled. Require a nonblank item and an integer quantity within the available batch size.", `import assert from 'node:assert/strict';
import { z } from 'zod';
const Delivery = z.object({ item: z.string().trim().min(1), quantity: z.number().int().min(1).max(20) }).strict();
assert.deepEqual(Delivery.parse({ item: ' Notebook ', quantity: 3 }), { item: 'Notebook', quantity: 3 });
for (const quantity of [0, -1, 1.5, 21]) {
  assert.equal(Delivery.safeParse({ item: 'Notebook', quantity }).success, false);
}
assert.equal(Delivery.safeParse({ item: ' ', quantity: 1 }).success, false);
console.log('Valid delivery accepted; invalid quantities and blank items rejected.');`, { zod: "^4.0.0" }, ["The item is trimmed and five invalid payloads are rejected."]),
  typescript: example("Handle a lookup without null errors", "A discriminated union forces callers to handle both a found product and a missing SKU before reading stock.", [file("solution.ts", `type Product = { sku: string; stock: number };
type Lookup = { found: true; product: Product } | { found: false; message: string };
function lookup(products: Product[], sku: string): Lookup {
  const product = products.find(item => item.sku === sku);
  return product ? { found: true, product } : { found: false, message: 'Unknown SKU: ' + sku };
}
for (const sku of ['pen', 'missing']) {
  const result = lookup([{ sku: 'pen', stock: 8 }], sku);
  console.log(result.found ? result.product.stock + ' units available' : result.message);
}`), file("package.json", JSON.stringify({ private: true, type: "module", scripts: { check: "tsc --noEmit --strict --target ES2022 solution.ts", start: "node --experimental-strip-types solution.ts" }, devDependencies: { typescript: "^5.0.0" } }, null, 2))], "npm start", ["Prints 8 units available, followed by Unknown SKU: missing."], ["Node.js 22.12+ and npm. Run npm install and npm run check before npm start."]),
};

PRACTICAL_SIMPLE.typescript.commands.unshift(
  { command: "npm install", description: "Install the TypeScript compiler." },
  { command: "npm run check", description: "Check both branches of the discriminated union before execution." },
);

const reservationApp = `'use client';
import React, { useState } from 'react';
export default function Reservation() {
  const [available, setAvailable] = useState(8);
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState('');
  function reserve(event) {
    event.preventDefault();
    const count = Number(quantity);
    if (!Number.isSafeInteger(count) || count < 1 || count > available) {
      setMessage('Enter a whole number between 1 and ' + available + '.');
      return;
    }
    setAvailable(stock => stock - count);
    setMessage('Reserved ' + count + ' pens.');
  }
  return <main><h1>Reserve supplies</h1><p>{available} pens available</p>
    <form onSubmit={reserve} noValidate><label>Quantity <input type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
      <button disabled={available === 0}>Reserve</button></form>
    <p role="status">{message}</p>{available === 0 && <p>Sold out.</p>}
  </main>;
}`;

export const PRACTICAL_MEDIUM: Record<string, DocsProject> = {};
for (const id of ["react", "react-hooks", "nextjs", "nextjs-hooks"]) {
  const isNext = id.startsWith("nextjs");
  const base = isNext ? next : react;
  const entry = isNext ? "app/page.js" : "src/App.jsx";
  PRACTICAL_MEDIUM[id] = {
    ...base,
    title: "Validate a reservation against available stock",
    summary: "Solve a small reservation workflow: validate whole-number quantities, show an actionable error, decrement stock after a successful reservation, and disable checkout when sold out. This is a local UI exercise; it does not submit orders to a server.",
    files: base.files.map(source => source.path === entry ? file(entry, reservationApp) : source),
    verify: ["Reserve 3 pens: 5 remain and the confirmation appears.", "Try 6 next: stock remains 5 and a validation message appears.", "Reserve the remaining 5: Sold out appears and the Reserve button is disabled."],
  };
}
