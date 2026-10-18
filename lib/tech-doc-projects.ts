export type ProjectFile = { name: string; code: string };
export type TechProject = { title: string; description: string; prerequisites: string; commands: string; expected: string; files: ProjectFile[] };
const file = (name: string, code: string): ProjectFile => ({ name, code });
const pkg = (scripts: Record<string, string>, dependencies = {}, devDependencies = {}) => file("package.json", JSON.stringify({ private: true, type: "module", scripts, dependencies, devDependencies }, null, 2));
const html = (entry: string) => file("index.html", `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Learning lab</title></head>
<body><div id="app"></div><script type="module" src="${entry}"></script></body></html>`);

const nodeApp = `import { createServer } from 'node:http';
export function createApp() {
  return createServer((req, res) => {
    // Match both method and path so unknown endpoints do not return success.
    if (req.method !== 'GET' || req.url !== '/health') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'not_found' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  });
}
`;
const nodeMain = `import { createApp } from './app.mjs';
const server = createApp();
server.listen(3000, '0.0.0.0', () => console.log('Open http://localhost:3000/health'));
// Stop accepting new traffic, then allow active requests to finish.
function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
`;
const nodeTest = `import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from './app.mjs';
test('health and unknown routes', async () => {
  const app = createApp().listen(0, '127.0.0.1');
  await once(app, 'listening'); // Port 0 avoids colliding with a running server.
  try {
    const base = 'http://127.0.0.1:' + app.address().port;
    const response = await fetch(base + '/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
    assert.equal((await fetch(base + '/missing')).status, 404);
  } finally { await new Promise(resolve => app.close(resolve)); }
});`;

const aiProject = (gateway: boolean): TechProject => ({
  title: gateway ? "AI Gateway command-line assistant" : "OpenRouter command-line assistant",
  description: "A server-side request with explicit configuration, timeout and response validation. No browser key exposure.",
  prerequisites: "Node.js 22.12+; an API key, available credit and a model ID enabled in your provider account. Model calls may incur charges.",
  commands: "Save the files in an empty directory. Copy .env.example to .env, fill in the key and model, then run:\nnode --env-file=.env main.mjs",
  expected: "A short explanation of idempotency is printed. Missing credentials, timeouts and provider errors produce a nonzero exit status.",
  files: [file("main.mjs", `import { ask } from './client.mjs';
try {
  console.log(await ask('Explain idempotency using a duplicate webhook example.'));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}`), file("client.mjs", `export async function ask(prompt) {
  const key = process.env.${gateway ? "AI_GATEWAY_API_KEY" : "OPENROUTER_API_KEY"};
  const model = process.env.AI_MODEL;
  if (!key || !model) throw new Error('Set the API key and AI_MODEL in .env');
  const response = await fetch('${gateway ? "https://ai-gateway.vercel.sh/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions"}', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30000), // Bound the time spent waiting for a provider.
    body: JSON.stringify({ model, max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
  });
  // Do not log provider bodies: they may contain sensitive request context.
  if (!response.ok) throw new Error('Provider request failed: HTTP ' + response.status);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('Provider returned no text');
  return text;
}`), file(".env.example", `${gateway ? "AI_GATEWAY_API_KEY" : "OPENROUTER_API_KEY"}=\n# Choose a model ID from your provider dashboard.\nAI_MODEL=\n`), file(".gitignore", ".env\nnode_modules/\n")],
});

export const TECH_PROJECTS: Record<string, TechProject> = {
  salesforce: { title: "Permission-aware Account record card", description: "Deploy a Lightning Web Component that loads the current record through UI API with loading and error states.", prerequisites: "Salesforce CLI and a Developer Edition org or Trailhead playground; permission to deploy components and read Account.Name.", commands: "# Save all tabs with their displayed paths in an empty project folder.\nsf org login web --alias learning-org\nsf project deploy start --target-org learning-org --source-dir force-app\nsf org open --target-org learning-org\n# Open an Account record > Edit Page. Drag Account Card onto the page, Save and Activate.", expected: "The card displays the Account name or an access error. UI API respects the user's record and field access.", files: [file("force-app/main/default/lwc/accountCard/accountCard.js", `import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME from '@salesforce/schema/Account.Name';
export default class AccountCard extends LightningElement {
  @api recordId; // Supplied by the Account record page.
  @wire(getRecord, { recordId: '$recordId', fields: [NAME] }) account;
  get name() { return this.account.data ? getFieldValue(this.account.data, NAME) : ''; }
  get loaded() { return Boolean(this.account.data); }
  get failed() { return Boolean(this.account.error); }
}`), file("force-app/main/default/lwc/accountCard/accountCard.html", `<template>
  <lightning-card title="Account Card" icon-name="standard:account">
    <div class="slds-p-around_medium">
      <template lwc:if={loaded}><p>{name}</p></template>
      <template lwc:elseif={failed}><p role="alert">Account could not be loaded. Check your record and field access.</p></template>
      <template lwc:else><lightning-spinner alternative-text="Loading account" size="small"></lightning-spinner></template>
    </div>
  </lightning-card>
</template>`), file("force-app/main/default/lwc/accountCard/accountCard.js-meta.xml", `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>65.0</apiVersion><isExposed>true</isExposed><masterLabel>Account Card</masterLabel>
  <targets><target>lightning__RecordPage</target></targets>
  <targetConfigs><targetConfig targets="lightning__RecordPage"><objects><object>Account</object></objects></targetConfig></targetConfigs>
</LightningComponentBundle>`), file("sfdx-project.json", JSON.stringify({ packageDirectories: [{ path: "force-app", default: true }], namespace: "", sourceApiVersion: "65.0" }, null, 2)), file(".gitignore", ".sf/\n.sfdx/\n.env\n") ] },
  node: { title: "Health API with integration tests", description: "Build a real HTTP endpoint, exercise it on an ephemeral port, and shut down cleanly.", prerequisites: "Node.js 22.12+; no packages required.", commands: "node --test app.test.mjs\nnode main.mjs", expected: 'The test passes. Open http://localhost:3000/health to see {"status":"ok"}; /missing returns 404.', files: [file("app.mjs", nodeApp), file("main.mjs", nodeMain), file("app.test.mjs", nodeTest), pkg({ start: "node main.mjs", test: "node --test app.test.mjs" })] },
  docker: { title: "Containerize the health API", description: "Package a dependency-free HTTP service and run it as a non-root user.", prerequisites: "Docker Engine or Docker Desktop running; internet access to pull the Node image.", commands: "docker build -t learning-health .\ndocker run --rm -p 3000:3000 --name learning-health learning-health\n# In another terminal, stop gracefully:\ndocker stop learning-health", expected: 'Open http://localhost:3000/health while the container runs. It returns {"status":"ok"}.', files: [file("Dockerfile", `FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node app.mjs main.mjs ./
USER node
EXPOSE 3000
# Exec form delivers termination signals directly to Node.
CMD ["node", "main.mjs"]`), file("app.mjs", nodeApp), file("main.mjs", nodeMain), file(".dockerignore", ".git\n.env*\nnode_modules\n") ] },
  react: { title: "Accessible reading-list app", description: "Practice controlled inputs, immutable state and derived totals in a complete browser app.", prerequisites: "Node.js 22.12+ and npm. This is a small client-side learning app using Vite.", commands: "npm install\nnpm run dev\n# Open the localhost URL printed by Vite.\n# Verify the production bundle:\nnpm run build", expected: "Add a title, toggle its checkbox, and watch the remaining count update. Blank submissions are ignored; refresh resets this in-memory demo.", files: [file("src/main.jsx", `import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
function App() {
  const [title, setTitle] = useState('');
  const [books, setBooks] = useState([]);
  function add(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setBooks(current => [...current, { id: crypto.randomUUID(), title: title.trim(), done: false }]);
    setTitle('');
  }
  return <main><h1>Reading list</h1><form onSubmit={add}>
    <label htmlFor="title">Book title</label>
    <input id="title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} required />
    <button>Add book</button></form>
    <p aria-live="polite">{books.filter(book => !book.done).length} remaining</p>
    <ul>{books.map(book => <li key={book.id}><label>
      <input type="checkbox" checked={book.done} onChange={() => {
        // Return new objects: never mutate an item already held in state.
        setBooks(current => current.map(item => item.id === book.id ? { ...item, done: !item.done } : item));
      }} /> {book.title}</label></li>)}</ul></main>;
}
createRoot(document.getElementById('app')).render(<App />);`), file("src/style.css", "body{font:16px system-ui;background:#f5f5f7;color:#1d1d1f;margin:0}main{max-width:560px;margin:64px auto;padding:24px;background:white;border-radius:16px}form{display:grid;gap:12px}input,button{font:inherit;padding:8px}li{margin:12px 0}"), html("/src/main.jsx"), pkg({ dev: "vite", build: "vite build" }, { react: "^19.2.0", "react-dom": "^19.2.0" }, { vite: "^7.0.0" })] },
  vue: { title: "Reactive reading-list app", description: "Build a Vue single-file component with computed state and a real Vite entry point.", prerequisites: "Node.js 22.12+ and npm.", commands: "npm install\nnpm run dev\n# Open the localhost URL printed by Vite.\nnpm run build", expected: "Add a book and mark it read. The remaining count updates automatically; data resets on refresh.", files: [file("src/App.vue", `<script setup>
import { ref, computed } from 'vue';
const title = ref('');
const books = ref([]);
// Derived state does not need a watcher or a second manually updated counter.
const remaining = computed(() => books.value.filter(book => !book.done).length);
function add() {
  if (!title.value.trim()) return;
  books.value.push({ id: crypto.randomUUID(), title: title.value.trim(), done: false });
  title.value = '';
}
</script>
<template>
  <main><h1>Reading list</h1><form @submit.prevent="add">
    <label for="title">Book title</label><input id="title" v-model="title" maxlength="120" required />
    <button>Add book</button></form><p aria-live="polite">{{ remaining }} remaining</p>
    <ul><li v-for="book in books" :key="book.id"><label><input type="checkbox" v-model="book.done" /> {{ book.title }}</label></li></ul>
  </main>
</template>
<style>body{font:16px system-ui;background:#f5f5f7;color:#1d1d1f}main{max-width:560px;margin:64px auto;padding:24px;background:white;border-radius:16px}form{display:grid;gap:12px}input,button{font:inherit;padding:8px}li{margin:12px 0}</style>`), file("src/main.js", "import { createApp } from 'vue';\nimport App from './App.vue';\ncreateApp(App).mount('#app');"), file("vite.config.js", "import { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\nexport default defineConfig({ plugins: [vue()] });"), html("/src/main.js"), pkg({ dev: "vite", build: "vite build" }, { vue: "^3.5.0" }, { vite: "^7.0.0", "@vitejs/plugin-vue": "^6.0.0" })] },
  angular: { title: "Signals reading list", description: "Create a standalone Angular application with computed state and explicit template event handlers.", prerequisites: "Node.js compatible with Angular 22 and npm. Run the scaffold command first, then replace the two src files with these tabs.", commands: "npx @angular/cli@22 new reading-lab --standalone --routing=false --style=css --skip-git --defaults\ncd reading-lab\n# Replace src/main.ts and add src/reading-list.ts from these tabs.\nnpm start\n# In another terminal in reading-lab:\nnpm run build", expected: "At http://localhost:4200, add a title and toggle its checkbox. Remaining count follows the signals without manual synchronization.", files: [file("src/reading-list.ts", `import { Component, computed, signal } from '@angular/core';
@Component({
  selector: 'app-root',
  standalone: true,
  template: \`<main><h1>Reading list</h1>
    <form (submit)="add($event, title)">
      <label for="title">Book title</label><input #title id="title" required maxlength="120" />
      <button>Add book</button>
    </form><p aria-live="polite">{{ remaining() }} remaining</p>
    <ul>@for (book of books(); track book.id) {
      <li><label><input type="checkbox" [checked]="book.done" (change)="toggle(book.id)" /> {{ book.title }}</label></li>
    }</ul></main>\`,
  styles: [\`main{font:16px system-ui;max-width:560px;margin:64px auto;padding:24px}form{display:grid;gap:12px}input,button{font:inherit;padding:8px}li{margin:12px 0}\`],
})
export class ReadingList {
  books = signal<{ id: string; title: string; done: boolean }[]>([]);
  remaining = computed(() => this.books().filter(book => !book.done).length);
  add(event: Event, input: HTMLInputElement) {
    event.preventDefault();
    if (!input.value.trim()) return;
    this.books.update(items => [...items, { id: crypto.randomUUID(), title: input.value.trim(), done: false }]);
    input.value = '';
  }
  toggle(id: string) {
    // Update through the signal so Angular knows the value changed.
    this.books.update(items => items.map(book => book.id === id ? { ...book, done: !book.done } : book));
  }
}`), file("src/main.ts", "import { bootstrapApplication } from '@angular/platform-browser';\nimport { ReadingList } from './reading-list';\nbootstrapApplication(ReadingList).catch(console.error);"), file("README.md", "# Signals reading list\n\nUse the CLI command in Run locally to generate package.json, angular.json, tsconfig files and src/index.html. Replace src/main.ts and add src/reading-list.ts; the generated root host is app-root. No external service or API key is needed.\n\nTry: add two books, complete one, verify the counter is 1. Refreshing resets this in-memory demo.") ] },
  typescript: { title: "Validate an order at runtime", description: "Turn unknown JSON into a discriminated union, then verify valid and invalid inputs.", prerequisites: "Node.js 22.12+ and npm.", commands: "npm install\nnpm test\nnpm start", expected: "All assertions pass. The example prints an accepted order, followed by a rejected invalid quantity.", files: [file("order.ts", `export type Order = { sku: string; quantity: number };
export type Result = { ok: true; order: Order } | { ok: false; error: string };
export function parseOrder(value: unknown): Result {
  if (typeof value !== 'object' || value === null) return { ok: false, error: 'Expected an object' };
  if (!('sku' in value) || typeof value.sku !== 'string' || !value.sku.trim()) return { ok: false, error: 'Missing SKU' };
  if (!('quantity' in value) || typeof value.quantity !== 'number' || !Number.isInteger(value.quantity) || value.quantity < 1 || value.quantity > 100) {
    return { ok: false, error: 'Quantity must be an integer from 1 to 100' };
  }
  // Narrowing proves these fields exist before constructing the trusted type.
  return { ok: true, order: { sku: value.sku.trim(), quantity: value.quantity } };
}`), file("main.ts", `import { parseOrder } from './order.js';
for (const value of [{ sku: 'BOOK', quantity: 2 }, { sku: 'BOOK', quantity: -1 }]) {
  const result = parseOrder(value);
  console.log(result.ok ? result.order : result.error);
}`), file("order.test.ts", `import assert from 'node:assert/strict';
import { parseOrder } from './order.js';
assert.deepEqual(parseOrder({ sku: ' BOOK ', quantity: 2 }), { ok: true, order: { sku: 'BOOK', quantity: 2 } });
for (const value of [null, {}, { sku: '', quantity: 1 }, { sku: 'BOOK', quantity: 1.5 }, { sku: 'BOOK', quantity: -1 }]) {
  assert.equal(parseOrder(value).ok, false);
}
console.log('All order validation tests passed');`), file("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, outDir: "dist", skipLibCheck: true }, include: ["*.ts"] }, null, 2)), pkg({ build: "tsc", test: "npm run build && node dist/order.test.js", start: "npm run build && node dist/main.js" }, {}, { typescript: "^5.9.0", "@types/node": "^22.0.0" })] },
  postgresql: { title: "Atomic inventory reservation", description: "Use a constrained schema and a conditional update to reserve the last item safely.", prerequisites: "PostgreSQL and psql, or Docker Desktop. Commands below use a disposable Docker database and development-only password.", commands: "docker run --name learning-pg -e POSTGRES_PASSWORD=learning-only -p 127.0.0.1:5433:5432 -d postgres:18\n# Wait for readiness; repeat until accepting connections:\ndocker exec learning-pg pg_isready -U postgres\ndocker cp schema.sql learning-pg:/tmp/schema.sql\ndocker cp reserve.sql learning-pg:/tmp/reserve.sql\ndocker exec learning-pg psql -U postgres -v ON_ERROR_STOP=1 -f /tmp/schema.sql\ndocker exec learning-pg psql -U postgres -v ON_ERROR_STOP=1 -f /tmp/reserve.sql\n# Repeat reserve.sql: no second reservation is created.\n# Cleanup the disposable container when finished:\ndocker rm -f learning-pg", expected: "First reservation returns BOOK with quantity 0 and creates one reservation. Repeating the reservation returns no row; stock stays 0.", files: [file("schema.sql", `CREATE TABLE inventory (
  sku text PRIMARY KEY,
  quantity integer NOT NULL CHECK (quantity >= 0)
);
CREATE TABLE reservations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku text NOT NULL REFERENCES inventory(sku),
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO inventory VALUES ('BOOK', 1);`), file("reserve.sql", `BEGIN;
-- The predicate and decrement are one operation; competing updates cannot both take the last item.
WITH reserved AS (
  UPDATE inventory SET quantity = quantity - 1
  WHERE sku = 'BOOK' AND quantity > 0
  RETURNING sku, quantity
), recorded AS (
  INSERT INTO reservations(sku) SELECT sku FROM reserved RETURNING sku
)
SELECT reserved.* FROM reserved JOIN recorded USING (sku);
COMMIT;
SELECT * FROM inventory;
SELECT count(*) AS reservations FROM reservations;`), file("README.md", "# Inventory lab\n\nUse a fresh database for schema.sql. Run reserve.sql twice and verify one reservation, not two. For a concurrency exercise, open two psql sessions and execute reserve.sql in both.\n\nProduction extensions: request idempotency keys, authenticated ownership, cancellation/refund transactions, and retry handling for serialization failures.") ] },
  openrouter: aiProject(false),
  "ai-gateway": aiProject(true),
  dsa: { title: "Binary search with boundary tests", description: "Implement iterative search and prove empty, missing and edge cases.", prerequisites: "Python 3.10+; standard library only.", commands: "python -m unittest -v\npython main.py", expected: "Five tests pass; the example prints 3. Input must already be sorted in ascending order.", files: [file("search.py", `def binary_search(values: list[int], target: int) -> int:
    low, high = 0, len(values) - 1
    while low <= high:
        middle = (low + high) // 2
        if values[middle] == target:
            return middle
        # Discard the midpoint as well: otherwise the loop may never progress.
        if values[middle] < target:
            low = middle + 1
        else:
            high = middle - 1
    return -1
`), file("main.py", "from search import binary_search\nprint(binary_search([1, 3, 5, 7, 9], 7))\n"), file("test_search.py", `import unittest
from search import binary_search
class SearchTests(unittest.TestCase):
    def test_empty(self): self.assertEqual(binary_search([], 1), -1)
    def test_first(self): self.assertEqual(binary_search([1, 3, 5], 1), 0)
    def test_last(self): self.assertEqual(binary_search([1, 3, 5], 5), 2)
    def test_missing(self): self.assertEqual(binary_search([1, 3, 5], 4), -1)
    def test_duplicates(self): self.assertIn(binary_search([1, 1, 1], 1), [0, 1, 2])
`) ] },
  oops: { title: "Pricing through composition", description: "Inject a pricing policy instead of embedding every discount rule in one class.", prerequisites: "Python 3.10+; standard library only.", commands: "python -m unittest -v\npython main.py", expected: "Three tests pass. The example prints 900 for a 1000-cent order with a 100-cent discount.", files: [file("pricing.py", `from typing import Protocol
class Discount(Protocol):
    def apply(self, cents: int) -> int: ...
class FixedDiscount:
    def __init__(self, cents: int):
        if cents < 0: raise ValueError('Discount cannot be negative')
        self.cents = cents
    def apply(self, cents: int) -> int:
        return max(0, cents - self.cents)
class Checkout:
    def __init__(self, discount: Discount):
        self.discount = discount  # Depend on behavior, not a specific implementation.
    def total(self, cents: int) -> int:
        if cents < 0: raise ValueError('Price cannot be negative')
        return self.discount.apply(cents)
`), file("main.py", "from pricing import Checkout, FixedDiscount\nprint(Checkout(FixedDiscount(100)).total(1000))\n"), file("test_pricing.py", `import unittest
from pricing import Checkout, FixedDiscount
class PricingTests(unittest.TestCase):
    def test_discount(self): self.assertEqual(Checkout(FixedDiscount(100)).total(1000), 900)
    def test_floor(self): self.assertEqual(Checkout(FixedDiscount(100)).total(50), 0)
    def test_negative(self):
        with self.assertRaises(ValueError): Checkout(FixedDiscount(0)).total(-1)
`) ] },
};
