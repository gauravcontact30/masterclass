import type { AnswerFile } from "./pro-learn/types";
import { createAdditionalProjects } from "./official-docs-additions";
import { BACKEND_PROJECTS } from "./official-docs-backend";

export type DocsProject = {
  title: string;
  summary: string;
  prerequisites: string[];
  points: string[];
  files: AnswerFile[];
  commands: { command: string; description: string }[];
  verify: string[];
};

const file = (path: string, code: string, note = ""): AnswerFile => ({ path, code: code.trim() + "\n", note });
const command = (command: string, description: string) => ({ command, description });
const manifest = (dependencies: Record<string, string>, scripts: Record<string, string>, devDependencies = {}) => file("package.json", JSON.stringify({ name: "docs-example", private: true, type: "module", scripts, dependencies, devDependencies }, null, 2));
const ignore = file(".gitignore", "node_modules/\ndist/\n.env*\n!.env.example\n.venv/\n__pycache__/\n*.db\n.next/\n");
const nodeRequirements = ["Node.js 22.12+ and npm", "Create an empty folder and save every file at its shown path."];
const nodeCommands = [command("npm install", "Install the dependencies declared in package.json."), command("npm start", "Run the example from the project root.")];

function project(title: string, summary: string, files: AnswerFile[], commands = nodeCommands, verify = ["Check the output described in the example."], prerequisites = nodeRequirements, points = ["Keep application logic separate from the entry point.", "Run the included example before changing its inputs."]): DocsProject {
  return { title, summary, files: [...files, ignore], commands, verify, prerequisites, points };
}

const pageStyles = file("src/style.css", `:root { font-family: system-ui, sans-serif; color: #292724; background: #faf9f5; }
body { margin: 0; }
main { max-width: 600px; margin: 64px auto; padding: 24px; }
button { padding: 10px 18px; cursor: pointer; }
li { margin-block: 12px; }`);

function reactProject(title: string, summary: string, app: string, extra: AnswerFile[] = [], dependencies: Record<string, string> = {}, verify = ["Open http://localhost:5173.", "Click the button and confirm the value increases."]): DocsProject {
  return project(title, summary, [
    file("src/App.jsx", app, "The screen and user interactions."),
    ...extra,
    file("src/main.jsx", `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.jsx';\nimport './style.css';\n\ncreateRoot(document.getElementById('root')).render(<App />);`),
    file("index.html", `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Learning example</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`),
    manifest({ react: "^19.0.0", "react-dom": "^19.0.0", ...dependencies }, { start: "vite --host 127.0.0.1", build: "vite build" }, { vite: "^7.0.0" }),
    pageStyles,
  ], nodeCommands, verify, nodeRequirements, ["Start with the entry point in src/main.jsx.", "Follow the imports to see how the screen and state connect.", "Use npm run build to check the production bundle."]);
}

const counter = `import React, { useState } from 'react';
import { Counter } from './Counter.jsx';
export default function App() {
  const [count, setCount] = useState(0);
  return (
    <main>
      <h1>Practice counter</h1>
      <Counter
        count={count}
        onIncrement={() => setCount(value => value + 1)}
      />
    </main>
  );
}`;

export const DOCS_PROJECTS: Record<string, DocsProject> = {
  react: reactProject("A counter with shared state", "A complete React app with a parent-owned value and a reusable child component.", counter, [file("src/Counter.jsx", `import React from 'react';
export function Counter({ count, onIncrement }) {
  return (
    <section>
      <p aria-live="polite">Completed: {count}</p>
      <button onClick={onIncrement}>Complete a lesson</button>
    </section>
  );
}`)]),
  zustand: reactProject("A shared counter store", "Read and update a Zustand store from a React screen.", `import React from 'react';
import { useCounter } from './store.js';
export default function App() {
  const count = useCounter(state => state.count);
  const increment = useCounter(state => state.increment);
  return <main><h1>Zustand counter</h1><p aria-live="polite">Count: {count}</p><button onClick={increment}>Increment</button></main>;
}`, [file("src/store.js", `import { create } from 'zustand';
export const useCounter = create(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));`)], { zustand: "^5.0.0" }),
  redux: reactProject("Actions, reducer, and store", "Trace a Redux action from the button through the reducer back to the screen.", `import React from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store.js';
function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();
  return <main><h1>Redux counter</h1><p aria-live="polite">Count: {count}</p><button onClick={() => dispatch({ type: 'increment' })}>Increment</button></main>;
}
export default function App() { return <Provider store={store}><Counter /></Provider>; }`, [file("src/store.js", `import { legacy_createStore as createStore } from 'redux';
function reducer(state = { count: 0 }, action) {
  return action.type === 'increment' ? { count: state.count + 1 } : state;
}
export const store = createStore(reducer);`, "Uses core Redux to teach reducers. Prefer Redux Toolkit for new application code.")], { redux: "^5.0.0", "react-redux": "^9.2.0" }),
  rtk: reactProject("A Redux Toolkit counter", "Connect a slice, a configured store, and a Provider in a runnable app.", `import React from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, increment } from './store.js';
function Counter() {
  const count = useSelector(state => state.counter.value);
  const dispatch = useDispatch();
  return <main><h1>Toolkit counter</h1><p aria-live="polite">Count: {count}</p><button onClick={() => dispatch(increment())}>Increment</button></main>;
}
export default function App() { return <Provider store={store}><Counter /></Provider>; }`, [file("src/store.js", `import { configureStore, createSlice } from '@reduxjs/toolkit';
const counter = createSlice({ name: 'counter', initialState: { value: 0 }, reducers: {
  increment(state) { state.value += 1; },
} });
export const { increment } = counter.actions;
export const store = configureStore({ reducer: { counter: counter.reducer } });`)], { "@reduxjs/toolkit": "^2.0.0", "react-redux": "^9.2.0" }),
  tanstack: reactProject("Fetch and cache a lesson list", "Load a bundled JSON endpoint with TanStack Query, including loading and error states.", `import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { getLessons } from './api.js';
const client = new QueryClient();
function Lessons() {
  const query = useQuery({ queryKey: ['lessons'], queryFn: getLessons });
  if (query.isPending) return <p role="status">Loading lessons...</p>;
  if (query.isError) return <p role="alert">{query.error.message}</p>;
  return <main><h1>Lessons</h1><ul>{query.data.map(item => <li key={item.id}>{item.title}</li>)}</ul><button onClick={() => query.refetch()} disabled={query.isFetching}>Refresh</button></main>;
}
export default function App() { return <QueryClientProvider client={client}><Lessons /></QueryClientProvider>; }`, [file("src/api.js", `export async function getLessons() {
  const response = await fetch('/lessons.json');
  if (!response.ok) throw new Error('Unable to load lessons');
  return response.json();
}`), file("public/lessons.json", '[{"id":1,"title":"Queries"},{"id":2,"title":"Caching"}]')], { "@tanstack/react-query": "^5.0.0" }, ["Open http://localhost:5173 and confirm two lessons appear.", "Refresh the query; inspect the /lessons.json request in browser developer tools."]),
};


DOCS_PROJECTS.nextjs = project("Server data with a client-side filter", "A Next.js App Router project with a server page, a data module, and an interactive client component.", [
  file("app/page.js", `import { lessons } from '../lib/lessons.js';\nimport LessonList from './lesson-list.js';\nexport default function Page() { return <main><h1>Lesson library</h1><LessonList lessons={lessons} /></main>; }`),
  file("app/lesson-list.js", `'use client';
import { useState } from 'react';
export default function LessonList({ lessons }) {
  const [query, setQuery] = useState('');
  const results = lessons.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  return <section><label>Find a lesson <input value={query} onChange={event => setQuery(event.target.value)} /></label><ul>{results.map(item => <li key={item.id}>{item.title}</li>)}</ul>{!results.length && <p>No lessons found.</p>}</section>;
}`),
  file("lib/lessons.js", `export const lessons = [{ id: 1, title: 'Server components' }, { id: 2, title: 'Client components' }];`),
  file("app/layout.js", `import './globals.css';\nexport const metadata = { title: 'Lesson library' };\nexport default function Layout({ children }) { return <html lang="en"><body>{children}</body></html>; }`),
  file("app/globals.css", "body { font-family: system-ui; color: #292724; background: #faf9f5; }\nmain { max-width: 640px; margin: 60px auto; padding: 24px; }\ninput { padding: 8px; }\nli { margin: 12px 0; }"),
  manifest({ next: "^16.3.6", react: "^19.2.0", "react-dom": "^19.2.0" }, { start: "next dev", build: "next build", serve: "next start" }),
], nodeCommands, ["Open http://localhost:3000 and see both lessons.", "Search for server, then an unknown term to check the empty state."], nodeRequirements, ["The page and data module run on the server.", "Only lesson-list.js needs the use client boundary.", "The complete project needs no API keys or database."]);

const sumModule = file("src/total.js", `export function total(values) {
  if (!values.every(Number.isFinite)) throw new TypeError('Expected finite numbers');
  return values.reduce((sum, value) => sum + value, 0);
}`);
const sumTest = file("src/total.test.js", `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { total } from './total.js';\ntest('totals values and accepts an empty list', () => { assert.equal(total([10, 20, 5]), 35); assert.equal(total([]), 0); });\ntest('rejects invalid values', () => { assert.throws(() => total([NaN]), TypeError); });`);
for (const id of ["javascript-features", "javascript-info", "git", "cicd"]) {
  DOCS_PROJECTS[id] = project("A tested JavaScript module", "Separate the reusable calculation, program entry point, and automated tests.", [
    file("src/main.js", "import { total } from './total.js';\nconsole.log(total([10, 20, 5]));"), sumModule, sumTest,
    manifest({}, { start: "node src/main.js", test: "node --test" }),
  ], [...nodeCommands, command("npm test", "Run both tests with Node's built-in test runner.")], ["The program prints 35.", "Both tests pass, including the invalid-input check."]);
}
DOCS_PROJECTS.git = { ...DOCS_PROJECTS.git, title: "Track a tested project in Git", summary: "Create a local repository, inspect changes, and record the first revision.", commands: [
  ...DOCS_PROJECTS.git.commands,
  command("git init", "Initialize Git inside this new example folder."),
  command('git config user.name "Learning Example"', "Set a name for commits in this local example only."),
  command('git config user.email "learner@example.com"', "Set the local example's commit email."),
  command("git add .", "Stage the source, tests, and ignore rules."),
  command('git commit -m "Add tested total module"', "Record the first version."),
  command("git log --oneline -1", "Inspect the commit you just created."),
], verify: ["git status reports a clean working tree.", "Change an input in src/main.js and use git diff to inspect it."] };
DOCS_PROJECTS.cicd = { ...DOCS_PROJECTS.cicd, title: "Run tests on each push", summary: "Use the same npm test command locally and in a GitHub Actions workflow.", prerequisites: [...nodeRequirements, "A GitHub repository is needed only to run the hosted workflow."], files: [...DOCS_PROJECTS.cicd.files,
  file(".github/workflows/test.yml", `name: Test
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
      - run: npm test`),
], verify: ["npm test passes locally.", "When these files are pushed to your repository, the Test workflow runs the same two tests."] };

DOCS_PROJECTS.typescript = project("Validate and total typed input", "Use TypeScript types alongside runtime input checks in a small executable project.", [
  file("src/main.ts", `import { total } from './total.js';\nconsole.log(total([10, 20, 5]));`),
  file("src/total.ts", `export function total(values: number[]): number {\n  if (!values.every(Number.isFinite)) throw new TypeError('Expected finite numbers');\n  return values.reduce((sum, value) => sum + value, 0);\n}`),
  file("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, outDir: "dist" }, include: ["src"] }, null, 2)),
  manifest({}, { build: "tsc", start: "npm run build && node dist/main.js" }, { typescript: "^5.9.0" }),
], nodeCommands, ["The TypeScript compiler completes without errors.", "The compiled program prints 35."]);

const apiFiles = [
  file("src/server.js", `import { createServer } from 'node:http';
import { lessons } from './lessons.js';
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  response.setHeader('Content-Type', 'application/json');
  if (request.method !== 'GET') { response.writeHead(405, { Allow: 'GET' }); return response.end(JSON.stringify({ error: 'Method not allowed' })); }
  if (path === '/health') return response.end(JSON.stringify({ ok: true }));
  if (path === '/lessons') return response.end(JSON.stringify(lessons));
  response.writeHead(404); response.end(JSON.stringify({ error: 'Not found' }));
});
server.listen(3000, '0.0.0.0', () => console.log('Listening on http://localhost:3000'));
process.on('SIGTERM', () => server.close());`),
  file("src/lessons.js", `export const lessons = [{ id: 1, title: 'HTTP basics' }, { id: 2, title: 'Routing' }];`),
  manifest({}, { start: "node src/server.js" }),
];
DOCS_PROJECTS.nodejs = project("A small HTTP API", "Serve a lesson list and a health endpoint using only Node's standard library.", apiFiles, nodeCommands, ["Open http://localhost:3000/lessons and confirm two records.", "Open /health for {\"ok\":true}; an unknown URL returns status 404."]);

DOCS_PROJECTS.vitest = project("Unit-test a calculation", "Keep the implementation and Vitest tests in separate files.", [sumModule,
  file("src/total.test.js", `import { describe, it, expect } from 'vitest';\nimport { total } from './total.js';\ndescribe('total', () => {\n  it('adds values', () => expect(total([10, 20, 5])).toBe(35));\n  it('accepts empty input', () => expect(total([])).toBe(0));\n  it('rejects NaN', () => expect(() => total([NaN])).toThrow(TypeError));\n});`),
  manifest({}, { start: "vitest run", test: "vitest run" }, { vitest: "^3.2.0" }),
], nodeCommands, ["The terminal reports three passing tests.", "Change the expected total to confirm a failing test is reported."]);
DOCS_PROJECTS.playwright = project("Test a page in a real browser", "Start a local Vite page and verify a button interaction with Playwright.", [
  file("index.html", '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><title>Counter</title></head><body><h1>Counter</h1><button id="increment">Increment</button><p role="status" id="count">Count: 0</p><script type="module" src="/main.js"></script></body></html>'),
  file("main.js", `let count = 0;\ndocument.querySelector('#increment').addEventListener('click', () => {\n  document.querySelector('#count').textContent = 'Count: ' + (++count);\n});`),
  file("playwright.config.js", `import { defineConfig } from '@playwright/test';\nexport default defineConfig({ testDir: './tests', use: { baseURL: 'http://127.0.0.1:5173' }, webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: false } });`),
  file("tests/counter.spec.js", `import { test, expect } from '@playwright/test';\ntest('increments the visible count', async ({ page }) => {\n  await page.goto('/');\n  await page.getByRole('button', { name: 'Increment' }).click();\n  await expect(page.getByRole('status')).toHaveText('Count: 1');\n});`),
  manifest({}, { dev: "vite --host 127.0.0.1", test: "playwright test" }, { vite: "^7.0.0", "@playwright/test": "^1.56.0" }),
], [nodeCommands[0], command("npx playwright install chromium", "Install the browser used by this test."), command("npm test", "Start the local app, run the browser test, then stop the app.")], ["The counter test passes.", "The test controls a local page and needs no external service."]);

DOCS_PROJECTS.graphql = project("A GraphQL server and Apollo client", "Run a local GraphQL endpoint and query it from a separate Apollo client program.", [
  file("src/schema.js", `import { buildSchema } from 'graphql';
export const schema = buildSchema('type Lesson { id: ID!, title: String! } type Query { lessons: [Lesson!]! }');
export const rootValue = { lessons: () => [{ id: '1', title: 'GraphQL basics' }] };`),
  file("src/server.js", `import { createServer } from 'node:http';
import { graphql } from 'graphql';
import { schema, rootValue } from './schema.js';
createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST' || req.url !== '/graphql') { res.writeHead(404); return res.end('{}'); }
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 10000) throw new Error('Request too large'); chunks.push(chunk); }
    const { query, variables } = JSON.parse(Buffer.concat(chunks).toString());
    const result = await graphql({ schema, source: query, rootValue, variableValues: variables });
    res.end(JSON.stringify(result));
  } catch { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid request' })); }
}).listen(3000, '127.0.0.1', () => console.log('GraphQL: http://localhost:3000/graphql'));`),
  file("src/client.js", `import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client/core/index.js';
const client = new ApolloClient({ cache: new InMemoryCache(), link: new HttpLink({ uri: 'http://localhost:3000/graphql', fetch }) });
try { const result = await client.query({ query: gql('query { lessons { id title } }') }); console.log(result.data); }
finally { client.stop(); }`),
  manifest({ graphql: "^16.10.0", "@apollo/client": "^3.13.0" }, { start: "node src/server.js", query: "node src/client.js" }),
], [...nodeCommands, command("npm run query", "In a second terminal in the same folder, query the running server.")], ["The client prints a lessons array containing GraphQL basics.", "The schema, server, and client are all included; no hosted endpoint is needed."]);

DOCS_PROJECTS.drizzle = project("Store lessons with Drizzle and SQLite", "Create a local SQLite table, insert a lesson, and read it through Drizzle.", [
  file("src/main.js", `import { db, sqlite } from './db.js';\nimport { lessons } from './schema.js';\ntry {\n  db.insert(lessons).values({ id: 1, title: 'Drizzle basics' }).onConflictDoNothing().run();\n  console.log(db.select().from(lessons).all());\n} finally { sqlite.close(); }`),
  file("src/schema.js", `import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';\nexport const lessons = sqliteTable('lessons', { id: integer('id').primaryKey(), title: text('title').notNull() });`),
  file("src/db.js", `import Database from 'better-sqlite3';\nimport { drizzle } from 'drizzle-orm/better-sqlite3';\nexport const sqlite = new Database('lessons.db');\nsqlite.exec('CREATE TABLE IF NOT EXISTS lessons (id INTEGER PRIMARY KEY, title TEXT NOT NULL)');\nexport const db = drizzle(sqlite);`),
  manifest({ "drizzle-orm": "^0.44.0", "better-sqlite3": "^12.0.0" }, { start: "node src/main.js" }),
], nodeCommands, ["The program prints the Drizzle basics record.", "Run it again: the primary key prevents a duplicate seed record."], [...nodeRequirements, "better-sqlite3 may require native build tools if your platform has no prebuilt binary."]);
DOCS_PROJECTS.prisma = project("A Prisma 6 SQLite project", "Generate a client from the included schema, then upsert and read one lesson.", [
  file("src/main.js", `import { PrismaClient } from '@prisma/client';\nconst db = new PrismaClient();\ntry {\n  await db.lesson.upsert({ where: { id: 1 }, create: { id: 1, title: 'Prisma basics' }, update: {} });\n  console.log(await db.lesson.findMany());\n} finally { await db.$disconnect(); }`),
  file("prisma/schema.prisma", `generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "sqlite"
  url      = "file:./lessons.db"
}
model Lesson {
  id    Int    @id
  title String
}`),
  manifest({ "@prisma/client": "6.19.0" }, { start: "node src/main.js", setup: "prisma db push && prisma generate" }, { prisma: "6.19.0" }),
], [nodeCommands[0], command("npm run setup", "Create the local database and generate the Prisma 6 client."), nodeCommands[1]], ["The program prints the seeded lesson.", "This example deliberately uses Prisma 6; Prisma 7 has a different configuration model."]);

const postgresCompose = file("compose.yaml", `services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: learner
      POSTGRES_PASSWORD: local-example-only
      POSTGRES_DB: lessons
    ports: ['127.0.0.1:5433:5432']
    volumes: ['./schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro']
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U learner -d lessons']
      interval: 2s
      timeout: 3s
      retries: 15`);
DOCS_PROJECTS.postgresql = project("Query a local PostgreSQL database", "Start PostgreSQL in Docker, initialize a table, and execute a parameterized query.", [
  file("src/main.js", `import pg from 'pg';\nconst client = new pg.Client({ connectionString: 'postgres://learner:local-example-only@localhost:5433/lessons' });\ntry {\n  await client.connect();\n  const result = await client.query('SELECT id, title FROM lessons WHERE id = $1', [1]);\n  console.log(result.rows);\n} finally { await client.end(); }`),
  file("schema.sql", "CREATE TABLE lessons (id integer PRIMARY KEY, title text NOT NULL);\nINSERT INTO lessons VALUES (1, 'Parameterized queries');"), postgresCompose,
  manifest({ pg: "^8.16.0" }, { start: "node src/main.js" }),
], [command("docker compose up -d --wait", "Start the local database and wait for readiness."), ...nodeCommands, command("docker compose down", "Stop the example database when finished.")], ["The query returns Parameterized queries.", "Values are passed separately from SQL text."], [...nodeRequirements, "Docker with Compose; port 5433 must be free."]);
DOCS_PROJECTS.supabase = project("Read public lessons with Supabase", "Create a read-only public table with an explicit RLS policy, then query it from Node.", [
  file("src/main.js", `import { createClient } from '@supabase/supabase-js';
const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error('Fill in .env first');
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const { data, error } = await db.from('docs_example_lessons').select('id,title');
if (error) throw error;
console.log(data);`),
  file("schema.sql", `CREATE TABLE public.docs_example_lessons (id integer PRIMARY KEY, title text NOT NULL);
INSERT INTO public.docs_example_lessons VALUES (1, 'Row level security');
ALTER TABLE public.docs_example_lessons ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.docs_example_lessons TO anon;
CREATE POLICY "Public example lessons" ON public.docs_example_lessons FOR SELECT TO anon USING (true);`, "Run once in the SQL editor of a development Supabase project. Only SELECT is granted to anonymous clients."),
  file(".env.example", "SUPABASE_URL=\nSUPABASE_PUBLISHABLE_KEY=", "Create .env from this file using your development project's URL and publishable key."),
  manifest({ "@supabase/supabase-js": "^2.0.0" }, { start: "node --env-file=.env src/main.js" }),
], [command("npm install", "Install the client. Run schema.sql in the Supabase SQL editor and fill in .env before the next command."), nodeCommands[1]], ["The program prints Row level security.", "Anonymous clients can read this demo table but have no insert, update, or delete grant."], [...nodeRequirements, "A development Supabase project and its URL/publishable key; never use a service-role key here."]);

const pythonRequirements = ["Python 3.11+", "Save all files in a new folder. Use python3 instead of python if required on your system."];
const pythonSetup = [command("python -m venv .venv", "Create an isolated environment."), command(".venv\\Scripts\\activate", "Windows PowerShell: activate the environment. On macOS/Linux use source .venv/bin/activate."), command("python -m pip install -r requirements.txt", "Install the example dependencies in that environment.")];
DOCS_PROJECTS.python = project("A tested Python calculation", "Import a reusable function from a module and verify it using unittest.", [
  file("main.py", "from totals import total\n\nprint(total([10, 20, 5]))"),
  file("totals.py", `def total(values):
    if not all(isinstance(value, (int, float)) for value in values):
        raise TypeError("Expected numbers")
    return sum(values)`),
  file("test_totals.py", `import unittest
from totals import total

class TotalTests(unittest.TestCase):
    def test_total(self):
        self.assertEqual(total([10, 20, 5]), 35)
    def test_empty(self):
        self.assertEqual(total([]), 0)
    def test_invalid(self):
        with self.assertRaises(TypeError):
            total(["invalid"])

if __name__ == "__main__":
    unittest.main()`),
], [command("python main.py", "Run the program; no third-party dependencies are needed."), command("python -m unittest", "Run all three tests.")], ["The program prints 35.", "All three tests pass."], pythonRequirements);
DOCS_PROJECTS.fastapi = project("A validated lesson API", "Use FastAPI and Pydantic to list and create lessons in a local in-memory store.", [
  file("main.py", `from fastapi import FastAPI
from models import LessonInput
from store import lessons

app = FastAPI()

@app.get("/lessons")
def list_lessons():
    return lessons

@app.post("/lessons", status_code=201)
def create_lesson(body: LessonInput):
    lesson = {"id": len(lessons) + 1, "title": body.title}
    lessons.append(lesson)
    return lesson`),
  file("models.py", `from pydantic import BaseModel, Field

class LessonInput(BaseModel):
    title: str = Field(min_length=1, max_length=100)`),
  file("store.py", 'lessons = [{"id": 1, "title": "Request validation"}]', "Demo-only memory storage; restarting the server resets the list."),
  file("requirements.txt", "fastapi>=0.115,<1\nuvicorn>=0.30,<1\npydantic>=2,<3"),
], [...pythonSetup, command("python -m uvicorn main:app --reload", "Start the API at http://localhost:8000.")], ["Open http://localhost:8000/docs and call GET /lessons.", 'Use POST /lessons with {"title":"New lesson"}; an empty title receives HTTP 422.'], pythonRequirements);
DOCS_PROJECTS.golang = project("A Go JSON endpoint", "Keep the HTTP handler separate from main and test it with httptest.", [
  file("main.go", `package main
import ("log"; "net/http")
func main() { http.HandleFunc("/lessons", lessons); log.Fatal(http.ListenAndServe("127.0.0.1:8080", nil)) }`),
  file("handlers.go", `package main
import ("encoding/json"; "net/http")
func lessons(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodGet { http.Error(w, "Method not allowed", 405); return }
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode([]string{"Go handlers", "JSON responses"})
}`),
  file("handlers_test.go", `package main
import ("net/http/httptest"; "testing")
func TestLessons(t *testing.T) {
  response := httptest.NewRecorder()
  lessons(response, httptest.NewRequest("GET", "/lessons", nil))
  if response.Code != 200 { t.Fatalf("got status %d", response.Code) }
  if response.Header().Get("Content-Type") != "application/json" { t.Fatal("missing JSON type") }
}`), file("go.mod", "module example.com/lessons\n\ngo 1.22"),
], [command("go test ./...", "Run the handler test."), command("go run .", "Start the server.")], ["The handler test passes.", "http://localhost:8080/lessons returns two lesson names."], ["Go 1.22+", "Save all files in a new folder."]);
DOCS_PROJECTS.rust = project("A Rust library and CLI", "Separate a calculation into a library, call it from a binary, and run a unit test.", [
  file("src/main.rs", "fn main() {\n    println!(\"{}\", lesson_total::total(&[10, 20, 5]));\n}"),
  file("src/lib.rs", `pub fn total(values: &[i32]) -> i32 { values.iter().sum() }
#[cfg(test)]
mod tests {
    use super::total;
    #[test]
    fn totals_values() { assert_eq!(total(&[10, 20, 5]), 35); assert_eq!(total(&[]), 0); }
}`), file("Cargo.toml", '[package]\nname = "lesson_total"\nversion = "0.1.0"\nedition = "2021"'),
], [command("cargo test", "Compile and test the library."), command("cargo run", "Run the CLI.")], ["The test passes and the CLI prints 35."], ["Rust and Cargo installed through rustup", "Save all files in a new folder."]);

DOCS_PROJECTS.langchain = project("A local LangChain text pipeline", "Compose two RunnableLambda steps without an API key or model service.", [
  file("main.py", 'from pipeline import pipeline\n\nprint(pipeline.invoke("  learn runnable composition  "))'),
  file("pipeline.py", `from langchain_core.runnables import RunnableLambda

def normalize(text):
    return text.strip().lower()

def describe(text):
    return {"text": text, "words": len(text.split())}

pipeline = RunnableLambda(normalize) | RunnableLambda(describe)`),
  file("requirements.txt", "langchain-core>=1,<2"),
], [...pythonSetup, command("python main.py", "Run the two-step pipeline.")], ["The result contains normalized text and words: 3.", "This teaches runnable composition; it does not call an LLM."], pythonRequirements, ["RunnableLambda adapts ordinary functions into pipeline steps.", "The pipe operator passes one step's output to the next.", "Both steps run locally, so outputs are deterministic."]);
DOCS_PROJECTS.langgraph = project("A two-node state graph", "Normalize text, count its words, and return the final typed state.", [
  file("main.py", 'from workflow import graph\n\nprint(graph.invoke({"text": "  learn state graphs  ", "words": 0}))'),
  file("workflow.py", `from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    text: str
    words: int

def normalize(state: State):
    return {"text": state["text"].strip().lower()}

def count(state: State):
    return {"words": len(state["text"].split())}

builder = StateGraph(State)
builder.add_node("normalize", normalize)
builder.add_node("count", count)
builder.add_edge(START, "normalize")
builder.add_edge("normalize", "count")
builder.add_edge("count", END)
graph = builder.compile()`),
  file("requirements.txt", "langgraph>=1,<2"),
], [...pythonSetup, command("python main.py", "Execute the graph.")], ["The final state contains text: learn state graphs and words: 3.", "No model provider or credentials are required."], pythonRequirements);
DOCS_PROJECTS.langsmith = project("Trace a small Python pipeline", "Run a deterministic function locally and optionally send its trace to your LangSmith project.", [
  file("main.py", `from dotenv import load_dotenv
load_dotenv()
from pipeline import summarize

print(summarize("learn tracing locally"))`),
  file("pipeline.py", `from langsmith import traceable

@traceable(name="word-summary")
def summarize(text):
    return {"text": text, "words": len(text.split())}`),
  file(".env.example", "LANGSMITH_TRACING=false\nLANGSMITH_API_KEY=\nLANGSMITH_PROJECT=docs-example", "Save as .env. To send sample inputs and outputs to LangSmith, add your key and set tracing to true."),
  file("requirements.txt", "langsmith>=0.4,<1\npython-dotenv>=1,<2"),
], [...pythonSetup, command("python main.py", "Run locally; tracing remains off unless you enable it in .env.")], ["The program prints words: 3.", "With tracing enabled and a valid key, the word-summary run appears in your LangSmith project."], pythonRequirements);

const dockerfile = file("Dockerfile", `FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]`);
const dockerIgnore = file(".dockerignore", "node_modules\n.git\n.env\n");
const apiCompose = file("compose.yaml", `services:
  api:
    build: .
    ports: ['127.0.0.1:3000:3000']
    healthcheck:
      test: ['CMD', 'node', '-e', "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
      interval: 5s
      timeout: 3s
      retries: 5`);
DOCS_PROJECTS.docker = project("Containerize a complete Node API", "Build the included server into an image and run it with a health check.", [...apiFiles, dockerfile, dockerIgnore, apiCompose], [
  command("docker compose up --build -d --wait", "Build and start the API; wait for its health check."),
  command("docker compose ps", "Inspect the healthy container."),
  command("docker compose down", "Stop the example when finished."),
], ["http://localhost:3000/lessons returns the bundled lessons.", "docker compose ps reports healthy."], ["Docker with Compose", "Port 3000 must be free. Save all files in a new folder."]);
DOCS_PROJECTS.devops = { ...DOCS_PROJECTS.docker, title: "Build, health-check, and inspect a service", summary: "Use a local container workflow to check service readiness and inspect logs.", commands: [
  DOCS_PROJECTS.docker.commands[0],
  command("docker compose ps", "Check readiness before sending requests."),
  command("docker compose logs api", "Inspect the startup log."),
  command("docker compose restart api", "Restart only this local example service, then check its health again."),
  command("docker compose down", "Stop the local example."),
], points: ["A health endpoint tells you whether the process can serve requests.", "Container logs provide the first place to inspect startup failures.", "This local exercise does not provide production monitoring or an SLO."] };
DOCS_PROJECTS.kubernetes = project("Deploy the example API to Minikube", "Build the included server image, load it into a local cluster, and expose it through a Service.", [...apiFiles, dockerfile, dockerIgnore,
  file("deployment.yaml", `apiVersion: apps/v1
kind: Deployment
metadata:
  name: docs-example
spec:
  replicas: 1
  selector:
    matchLabels: {app: docs-example}
  template:
    metadata:
      labels: {app: docs-example}
    spec:
      containers:
        - name: api
          image: docs-example:local
          imagePullPolicy: Never
          ports:
            - containerPort: 3000
          readinessProbe:
            httpGet: {path: /health, port: 3000}
          resources:
            requests: {cpu: 100m, memory: 64Mi}
            limits: {cpu: 500m, memory: 128Mi}`),
  file("service.yaml", `apiVersion: v1
kind: Service
metadata:
  name: docs-example
spec:
  selector: {app: docs-example}
  ports:
    - port: 80
      targetPort: 3000`),
], [command("minikube start", "Start a local development cluster."), command("docker build -t docs-example:local .", "Build the supplied API image."), command("minikube image load docs-example:local", "Load that image into Minikube."), command("kubectl --context=minikube apply -f deployment.yaml -f service.yaml", "Create the example Deployment and Service only in Minikube."), command("kubectl --context=minikube rollout status deployment/docs-example", "Wait until the Pod is ready."), command("kubectl --context=minikube port-forward service/docs-example 8080:80", "Keep this command running while you open localhost:8080/lessons."), command("kubectl --context=minikube delete -f deployment.yaml -f service.yaml", "After stopping port-forward, remove only the example resources.")], ["http://localhost:8080/lessons returns the lesson list.", "The readiness probe checks /health before the Pod receives traffic."], ["Docker, Minikube, and kubectl installed", "Save all files in a new folder; use the minikube context shown in each command."]);
DOCS_PROJECTS.aws = project("Run a Lambda API locally with SAM", "Use a SAM template, Lambda handler, and data file to serve a local HTTP endpoint.", [
  file("src/app.py", `import json
from lessons import LESSONS

def handler(event, context):
    return {"statusCode": 200, "headers": {"Content-Type": "application/json"}, "body": json.dumps(LESSONS)}`),
  file("src/lessons.py", 'LESSONS = [{"id": 1, "title": "Lambda and API Gateway"}]'),
  file("template.yaml", `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  LessonsFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: python3.12
      Handler: app.handler
      CodeUri: src/
      Timeout: 10
      Events:
        Lessons:
          Type: Api
          Properties:
            Path: /lessons
            Method: get`),
], [command("sam build --use-container", "Build using the Lambda runtime container."), command("sam local start-api", "Run the local HTTP emulator; no cloud deployment is performed.")], ["http://localhost:3000/lessons returns the bundled lesson.", "Stop the local emulator with Ctrl+C when finished."], ["AWS SAM CLI and Docker installed", "Save all files in a new folder. Port 3000 must be free."]);
DOCS_PROJECTS.redis = project("Cache an API response in Redis", "Connect a Node API to local Redis and cache a bundled lesson list for 30 seconds.", [
  file("src/server.js", `import { createServer } from 'node:http';
import { createClient } from 'redis';
import { lessons } from './lessons.js';
const cache = createClient({ url: 'redis://127.0.0.1:6380' });
cache.on('error', error => console.error('Redis:', error.message));
await cache.connect();
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json');
  if (request.method !== 'GET' || request.url !== '/lessons') { response.writeHead(404); return response.end('{}'); }
  try {
    const hit = await cache.get('docs-example:lessons');
    const body = hit ?? JSON.stringify(lessons);
    if (!hit) await cache.set('docs-example:lessons', body, { EX: 30 });
    response.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    response.end(body);
  } catch { response.writeHead(503); response.end(JSON.stringify({ error: 'Cache unavailable' })); }
});
server.listen(3000, '127.0.0.1');
process.on('SIGINT', () => server.close(() => { void cache.quit(); }));`),
  apiFiles[1],
  file("compose.yaml", `services:
  redis:
    image: redis:7-alpine
    ports: ['127.0.0.1:6380:6379']
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 2s
      timeout: 3s
      retries: 10`),
  manifest({ redis: "^5.0.0" }, { start: "node src/server.js" }),
], [command("docker compose up -d --wait", "Start local Redis."), ...nodeCommands, command("curl -i http://localhost:3000/lessons", "In another terminal, run this twice and compare the X-Cache header. PowerShell users can use curl.exe."), command("docker compose down", "After stopping the Node server, stop local Redis.")], ["The first request reports X-Cache: MISS; the second reports HIT.", "After 30 seconds, the cache entry expires."], [...nodeRequirements, "Docker with Compose; ports 3000 and 6380 must be free."], ["This example focuses on Redis cache-aside behavior.", "The data source is a bundled module, so no database is missing.", "Inngest, Arcjet, and Upstash are separate integrations, not requirements for this example."]);

Object.assign(DOCS_PROJECTS, createAdditionalProjects({ file, command, manifest, project, reactProject }, DOCS_PROJECTS));
Object.assign(DOCS_PROJECTS, BACKEND_PROJECTS);

/** Every project includes its own runbook alongside the actual source files. */
for (const [id, example] of Object.entries(DOCS_PROJECTS)) {
  example.files = [...example.files, file("README.md", `# ${example.title}\n\n${example.summary}\n\n## Prerequisites\n${example.prerequisites.map(point => "- " + point).join("\n")}\n\n## Run\nSave every file under its displayed path in the same project folder.\n\n${example.commands.map((item, index) => `${index + 1}. ${item.description}\n\n\`\`\`sh\n${item.command}\n\`\`\``).join("\n\n")}\n\n## Verify\n${example.verify.map(point => "- " + point).join("\n")}\n\nExample: ${id}. Educational scope; see the linked official documentation before production use.`)];
}
