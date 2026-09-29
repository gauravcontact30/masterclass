import type { AnswerFile } from "./pro-learn/types";
import type { DocsProject } from "./official-docs-projects";
import type { OfficialDocsCategory, OfficialTechnologyDoc } from "./official-docs-data";

type Builders = {
  file: (path: string, code: string, note?: string) => AnswerFile;
  command: (command: string, description: string) => { command: string; description: string };
  manifest: (dependencies: Record<string, string>, scripts: Record<string, string>, devDependencies?: Record<string, string>) => AnswerFile;
  project: (title: string, summary: string, files: AnswerFile[], commands?: DocsProject["commands"], verify?: string[], prerequisites?: string[], points?: string[]) => DocsProject;
  reactProject: (title: string, summary: string, app: string, extra?: AnswerFile[], dependencies?: Record<string, string>, verify?: string[]) => DocsProject;
};

const entries: [string, string, OfficialDocsCategory, string, string[]][] = [
  ["jest", "Jest", "Testing & Quality", "https://jestjs.io/docs/getting-started", ["Assertions", "Mocks", "Coverage"]],
  ["react-testing-library", "React Testing Library", "Testing & Quality", "https://testing-library.com/docs/react-testing-library/intro/", ["Accessible queries", "User interactions", "Async assertions"]],
  ["javascript-puzzles", "JavaScript Puzzles", "Languages & Fundamentals", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", ["Closures", "Event loop", "Equality & coercion"]],
  ["uv", "uv Package Manager", "Tooling & CI/CD", "https://docs.astral.sh/uv/guides/projects/", ["Virtual environments", "Lockfiles", "Python versions"]],
  ["agentic-ai", "Agentic AI — Key Concepts", "AI & Agents", "https://docs.langchain.com/oss/python/langgraph/overview", ["Tool use & planning", "State & memory", "Evaluation & guardrails"]],
  ["cypress", "Cypress", "Testing & Quality", "https://docs.cypress.io/app/get-started/why-cypress", ["Browser tests", "Retryable assertions", "Fixtures"]],
  ["inngest", "Inngest", "Security & Infrastructure", "https://www.inngest.com/docs", ["Events", "Durable steps", "Retries"]],
  ["arcjet", "Arcjet", "Security & Infrastructure", "https://docs.arcjet.com/sdk/next/get-started/", ["Shield", "Rate limits", "Request decisions"]],
  ["redis", "Redis", "Databases & Storage", "https://redis.io/docs/latest/", ["Data structures", "Expiration", "Cache-aside"]],
  ["webhook", "Webhooks", "Security & Infrastructure", "https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries", ["Signature verification", "Idempotency", "Delivery retries"]],
  ["upstash", "Upstash", "Databases & Storage", "https://upstash.com/docs/redis/overall/getstarted", ["Redis over HTTP", "TTL", "Serverless connections"]],
  ["clerk", "Clerk", "Security & Infrastructure", "https://clerk.com/docs/nextjs/getting-started/quickstart", ["Sessions", "Route protection", "Sign-in UI"]],
  ["zod", "Zod", "Languages & Fundamentals", "https://zod.dev/basics", ["Schemas", "Validation errors", "Type inference"]],
  ["tanstack-start", "TanStack Start", "Frontend Frameworks", "https://tanstack.com/start/latest/docs/framework/react/overview", ["Typed routing", "Server rendering", "Route loaders"]],
  ["tanstack-form", "TanStack Form", "State & Data Libraries", "https://tanstack.com/form/latest/docs/framework/react/overview", ["Field state", "Validation", "Submission"]],
  ["react-hooks", "React Hooks", "Frontend Frameworks", "https://react.dev/reference/react/hooks", ["State & reducers", "Effects & refs", "Actions & transitions"]],
  ["nextjs-hooks", "Next.js 16+ Hooks", "Frontend Frameworks", "https://nextjs.org/docs/app/api-reference/functions", ["Navigation", "Search parameters", "Route segments"]],
  ["conform", "Conform", "State & Data Libraries", "https://conform.guide/integration/nextjs", ["Progressive enhancement", "Form metadata", "Server validation"]],
  ["authjs", "Auth.js", "Security & Infrastructure", "https://authjs.dev/getting-started/installation", ["OAuth providers", "Sessions", "Server authentication"]],
  ["kinde", "Kinde", "Security & Infrastructure", "https://docs.kinde.com/developer-tools/sdks/backend/nextjs-sdk/", ["Hosted login", "Sessions", "Permissions"]],
  ["neon", "Neon", "Databases & Storage", "https://neon.com/docs/introduction", ["Serverless Postgres", "Database branches", "HTTP driver"]],
  ["t3-stack", "T3 Stack", "Frontend Frameworks", "https://create.t3.gg/en/introduction", ["Next.js & TypeScript", "tRPC", "End-to-end types"]],
  ["system-design", "System Design", "DevOps & Cloud", "https://aws.amazon.com/builders-library/", ["Caching & consistency", "Reliability", "Capacity & tradeoffs"]],
];

export function additionalDocumentation(projects: Record<string, DocsProject>): OfficialTechnologyDoc[] {
  return entries.map(([id, title, category, officialUrl, concepts]) => {
    const p = projects[id];
    const source = p.files.find(f => /\.(tsx?|jsx?|py)$/.test(f.path)) ?? p.files[0];
    return {
      id, title, category, officialUrl, version: "Versioned example", badge: "Project guide",
      tagline: p.summary, overview: { en: p.summary, hi: p.summary },
      keyPoints: p.points, keyFeatures: concepts.map(title => ({ title, description: `Explore ${title.toLowerCase()} in the linked official reference.` })),
      architecturePoints: p.points, cliCommands: p.commands,
      codeExample: { filename: source.path, language: source.path.split(".").pop() ?? "text", code: source.code, explanation: p.summary },
      bestPractices: p.points,
      commonGotchas: p.prerequisites,
    };
  });
}

export function createAdditionalProjects(b: Builders, existing: Record<string, DocsProject>): Record<string, DocsProject> {
  const { file, command, manifest, project, reactProject } = b;
  const projects: Record<string, DocsProject> = {};
  const node = ["Node.js 22.12+ and npm.", "Save all files in a new project folder, keeping their displayed paths."];
  const install = command("npm install", "Install project dependencies.");
  const start = command("npm start", "Start the application.");
  function next(title: string, summary: string, page: string, files: AnswerFile[] = [], deps: Record<string, string> = {}, prerequisites = node, points = ["Keep credentials and privileged operations on the server.", "The app directory contains the page and HTTP route handlers."]): DocsProject {
    return project(title, summary, [file("app/page.jsx", page), file("app/layout.jsx", `import React from 'react';
import './globals.css';
export default function Layout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}`), file("app/globals.css", "body { font-family: system-ui; background: #faf9f5; color: #292724; margin: 40px; } button,input { padding: 10px; margin: 6px; } pre { white-space: pre-wrap; }"), ...files,
      manifest({ next: "^16.0.0", react: "^19.2.0", "react-dom": "^19.2.0", ...deps }, { start: "next dev", build: "next build", serve: "next start" }),
    ], [install, start], ["Open http://localhost:3000 and follow the interaction described above."], prerequisites, points);
  }
  const counter = file("src/Counter.jsx", `import React, { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  return <main><h1>Counter</h1><p role="status">Count: {count}</p>
    <button onClick={() => setCount(n => n + 1)}>Increment</button></main>;
}`);
  projects.jest = project("Test a price calculator", "Run table-driven unit tests and a mocked receipt callback with Jest.", [
    file("src/total.cjs", `function total(prices, receipt = () => {}) {
  if (prices.some(price => !Number.isFinite(price) || price < 0)) throw new Error('Invalid price');
  const amount = prices.reduce((sum, price) => sum + price, 0);
  receipt(amount);
  return amount;
}
module.exports = { total };`), file("src/total.test.cjs", `const { total } = require('./total.cjs');
test.each([[[], 0], [[10, 25], 35]])('totals %j', (input, expected) => {
  expect(total(input)).toBe(expected);
});
test('rejects negative prices', () => expect(() => total([-1])).toThrow('Invalid price'));
test('sends one receipt', () => {
  const receipt = jest.fn();
  total([10], receipt);
  expect(receipt).toHaveBeenCalledTimes(1);
  expect(receipt).toHaveBeenCalledWith(10);
});`), file("jest.config.cjs", "module.exports = { testEnvironment: 'node', testMatch: ['**/*.test.cjs'], collectCoverageFrom: ['src/total.cjs'] };"),
    manifest({}, { test: "jest --runInBand", coverage: "jest --coverage" }, { jest: "^30.0.0" }),
  ], [install, command("npm test", "Run all four tests."), command("npm run coverage", "Inspect coverage for the calculator.")], ["Four tests pass, including invalid input and the receipt mock."], node, ["CommonJS files avoid an unnecessary transpilation layer.", "Use table-driven tests for boundaries and mocks for observable side effects."]);
  projects["react-testing-library"] = project("Test the counter as a user", "Render a React component, click its accessible button, and check the announced value.", [counter,
    file("src/Counter.test.jsx", `import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import Counter from './Counter.jsx';
test('increments after a user click', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  expect(screen.getByRole('status')).toHaveTextContent('Count: 0');
  await user.click(screen.getByRole('button', { name: 'Increment' }));
  expect(screen.getByRole('status')).toHaveTextContent('Count: 1');
});`), file("vitest.config.js", `import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'jsdom', setupFiles: ['./test/setup.js'] } });`), file("test/setup.js", `import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(cleanup);`), manifest({ react: "^19.0.0", "react-dom": "^19.0.0" }, { test: "vitest run" }, { vitest: "^3.2.0", jsdom: "^26.0.0", "@testing-library/react": "^16.0.0", "@testing-library/dom": "^10.0.0", "@testing-library/user-event": "^14.0.0", "@testing-library/jest-dom": "^6.0.0" }),
  ], [install, command("npm test", "Run the component test in jsdom.")], ["The test passes after checking the initial value and the click result."], node, ["React Testing Library supplies queries; Vitest is the test runner.", "Query roles and names that users and assistive technology can access.", "Await user interactions before asserting updates."]);
  projects.cypress = project("Test a browser counter", "Start a real page and exercise it with a complete Cypress end-to-end test.", [
    file("index.html", `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Counter</title></head>
<body><main><h1>Counter</h1><p id="count" role="status">0</p><button id="increment">Increment</button></main>
<script type="module" src="/src/main.js"></script></body></html>`), file("src/main.js", `let count = 0;
document.querySelector('#increment').addEventListener('click', () => {
  document.querySelector('#count').textContent = String(++count);
});`), file("cypress.config.js", `import { defineConfig } from 'cypress';
export default defineConfig({ e2e: { baseUrl: 'http://127.0.0.1:5173', supportFile: false } });`), file("cypress/e2e/counter.cy.js", `describe('counter', () => {
  it('increments', () => {
    cy.visit('/');
    cy.get('[role="status"]').should('have.text', '0');
    cy.contains('button', 'Increment').click();
    cy.get('[role="status"]').should('have.text', '1');
  });
});`), manifest({}, { start: "vite --host 127.0.0.1", test: "cypress run" }, { vite: "^7.0.0", cypress: "^15.0.0" }),
  ], [install, start, command("npm test", "Keep Vite running; execute this in a second terminal.")], ["The browser test passes; the counter changes from 0 to 1."], node, ["Cypress retries queries and assertions; avoid arbitrary sleeps.", "Keep the development server running while the browser test executes."]);
  projects.zod = project("Validate unknown input", "Parse a valid registration and report errors for an invalid registration using Zod 4.", [
    file("src/schema.js", `import { z } from 'zod';
export const Registration = z.object({
  email: z.email(),
  age: z.number().int().min(18),
}).strict();`), file("src/main.js", `import { Registration } from './schema.js';
for (const input of [{ email: 'learner@example.com', age: 21 }, { email: 'invalid', age: 12 }]) {
  const result = Registration.safeParse(input);
  console.log(result.success ? result.data : result.error.issues);
}`), manifest({ zod: "^4.0.0" }, { start: "node src/main.js" }),
  ], [install, start], ["The valid input prints parsed data; the invalid input prints email and age issues."], node, ["TypeScript types alone do not validate external input.", "safeParse returns a discriminated result without throwing."]);
  projects["react-hooks"] = reactProject("A searchable lesson list", "Combine state, a memoized filter, refs, and a cleaned-up effect in a complete React app.", `import React, { useEffect, useMemo, useRef, useState } from 'react';
import { lessons } from './lessons.js';
export default function App() {
  const [query, setQuery] = useState('');
  const input = useRef(null);
  const filtered = useMemo(() => lessons.filter(item => item.toLowerCase().includes(query.toLowerCase())), [query]);
  useEffect(() => {
    const previous = document.title;
    document.title = filtered.length + ' lessons';
    return () => { document.title = previous; };
  }, [filtered.length]);
  return <main><h1>Lessons</h1><label>Search <input ref={input} value={query} onChange={e => setQuery(e.target.value)} /></label>
    <button onClick={() => input.current?.focus()}>Focus search</button>
    <ul>{filtered.map(item => <li key={item}>{item}</li>)}</ul>
    {!filtered.length && <p>No matching lessons.</p>}</main>;
}`, [file("src/lessons.js", "export const lessons = ['State', 'Effects', 'Refs', 'Transitions'];")], {}, ["Search for refs; only Refs remains.", "Focus search moves focus to the input.", "The browser title reflects the number of results."]);
  projects["nextjs-hooks"] = next("Keep a filter in the URL", "Use App Router hooks to read and update a query parameter without losing other URL state.", `import React, { Suspense } from 'react';
import Filter from './Filter.jsx';
export default function Page() {
  return <main><h1>URL filter</h1><Suspense fallback={<p>Loading filter...</p>}><Filter /></Suspense></main>;
}`, [file("app/Filter.jsx", `'use client';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
export default function Filter() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  function update(value) {
    const next = new URLSearchParams(params.toString());
    value ? next.set('q', value) : next.delete('q');
    router.replace(pathname + (next.size ? '?' + next.toString() : ''), { scroll: false });
  }
  return <><label>Search <input value={params.get('q') ?? ''} onChange={e => update(e.target.value)} /></label>
    <p>Current filter: {params.get('q') || 'All lessons'}</p></>;
}`)], {}, node, ["Import App Router hooks from next/navigation.", "useSearchParams is read-only; clone it before editing.", "A Suspense boundary supports static rendering during production builds."]);
  projects["tanstack-form"] = reactProject("Validate and submit a name", "Use field metadata, validation, and a form subscription with TanStack Form.", `import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
export default function App() {
  const [saved, setSaved] = useState('');
  const form = useForm({ defaultValues: { name: '' }, onSubmit: async ({ value }) => setSaved(value.name) });
  return <main><h1>Profile</h1><form onSubmit={e => { e.preventDefault(); void form.handleSubmit(); }}>
    <form.Field name="name" validators={{ onChange: ({ value }) => value.trim().length < 2 ? 'Enter at least two characters' : undefined }}>
      {field => <div><label htmlFor={field.name}>Name</label><input id={field.name} name={field.name} value={field.state.value}
        onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} aria-describedby="name-error" />
        <p id="name-error" role="status">{field.state.meta.errors.join(', ')}</p></div>}
    </form.Field>
    <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, submitting]) => <button disabled={!canSubmit || submitting} type="submit">Save</button>}
    </form.Subscribe>
  </form><p role="status">{saved && 'Saved: ' + saved}</p></main>;
}`, [], { "@tanstack/react-form": "^1.0.0" }, ["A one-character name shows an error.", "Enter Ada and submit; Saved: Ada appears."]);
  projects.conform = next("Validate a server-backed form", "Connect Conform metadata to a React action and validate the same schema on the server.", `import React from 'react';
import Registration from './Registration.jsx';
export default function Page() { return <main><h1>Register</h1><Registration /></main>; }`, [
    file("app/schema.js", `import { z } from 'zod';
export const schema = z.object({ email: z.string().email() });`),
    file("app/actions.js", `'use server';
import { parseWithZod } from '@conform-to/zod';
import { schema } from './schema.js';
export async function register(previous, formData) {
  const submission = parseWithZod(formData, { schema });
  if (submission.status !== 'success') return submission.reply();
  // Validation demo: no account is created or data persisted.
  return submission.reply({ resetForm: true });
}`), file("app/Registration.jsx", `'use client';
import React, { useActionState } from 'react';
import { useForm, getFormProps, getInputProps } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { register } from './actions.js';
import { schema } from './schema.js';
export default function Registration() {
  const [lastResult, action, pending] = useActionState(register, undefined);
  const [form, fields] = useForm({ lastResult, onValidate: ({ formData }) => parseWithZod(formData, { schema }), shouldValidate: 'onBlur' });
  return <form {...getFormProps(form)} action={action} noValidate>
    <label htmlFor={fields.email.id}>Email</label>
    <input {...getInputProps(fields.email, { type: 'email' })} />
    <p id={fields.email.errorId}>{fields.email.errors}</p>
    <button disabled={pending}>Validate</button>
    <p role="status">{lastResult?.status === 'success' ? 'Validated successfully (demo only).' : ''}</p>
  </form>;
}`)], { "@conform-to/react": "^1.0.0", "@conform-to/zod": "^1.0.0", zod: "^3.24.0" }, node, ["This example deliberately uses the Zod 3 adapter; use the documented v4 adapter when migrating.", "Validate again in the server action even when client validation succeeds.", "Successful validation resets the form; persistence is outside this example."]);
  projects.inngest = next("Send an event to a durable function", "Send a task from a server action and process it through an Inngest step in the local development server.", `import React from 'react';
import { sendTask } from './actions.js';
export default function Page() {
  return <main><h1>Task processor</h1><form action={sendTask}><button>Send demo task</button></form>
    <p>Inspect the function run at http://localhost:8288.</p></main>;
}`, [file("lib/inngest.js", `import { Inngest } from 'inngest';
export const inngest = new Inngest({ id: 'docs-tasks' });
export const processTask = inngest.createFunction(
  { id: 'process-task', triggers: { event: 'app/task.created' } },
  async ({ event, step }) => {
    return await step.run('format-task', () => ({ id: event.data.id, result: event.data.title.toUpperCase() }));
  },
);`), file("app/api/inngest/route.js", `import { serve } from 'inngest/next';
import { inngest, processTask } from '../../../lib/inngest.js';
export const { GET, POST, PUT } = serve({ client: inngest, functions: [processTask] });`), file("app/actions.js", `'use server';
import { randomUUID } from 'node:crypto';
import { inngest } from '../lib/inngest.js';
export async function sendTask() {
  await inngest.send({ name: 'app/task.created', data: { id: randomUUID(), title: 'Learn durable steps' } });
}`), file(".env.example", "INNGEST_DEV=1")], { inngest: "^4.0.0" }, [...node, "Copy .env.example to .env.local before starting Next.js."], ["Each step stores its result so a retry can resume completed work.", "Version 4 declares triggers in the function configuration.", "Local mode needs the Inngest development server; production requires signing and event keys."]);
  projects.inngest.commands.push(command("npx inngest-cli@latest dev -u http://localhost:3000/api/inngest", "In a second terminal, start Inngest; then press Send demo task in the app."));
  projects.arcjet = next("Protect a JSON endpoint", "Evaluate Shield and a token bucket before returning a response from a server route.", `import React from 'react';
export default function Page() { return <main><h1>Protected endpoint</h1><a href="/api/protected">Request protected JSON</a></main>; }`, [
    file("app/api/protected/route.js", `import arcjet, { shield, tokenBucket } from '@arcjet/next';
const aj = arcjet({ key: process.env.ARCJET_KEY, rules: [shield({ mode: 'LIVE' }), tokenBucket({ mode: 'LIVE', refillRate: 5, interval: 60, capacity: 5 })] });
export async function GET(request) {
  try {
    const decision = await aj.protect(request, { requested: 1 });
    if (decision.isErrored()) return Response.json({ error: 'Protection unavailable' }, { status: 503 });
    if (decision.isDenied()) return Response.json({ error: 'Request denied' }, { status: decision.reason.isRateLimit() ? 429 : 403 });
    return Response.json({ message: 'Request allowed' });
  } catch { return Response.json({ error: 'Protection unavailable' }, { status: 503 }); }
}`), file(".env.example", "ARCJET_KEY=replace_with_your_site_key\nARCJET_ENV=development")], { "@arcjet/next": "^1.5.0" }, [...node, "Create an Arcjet site. Copy .env.example to .env.local and set its key."], ["Requests are evaluated on the server before protected work begins.", "Denied, rate-limited, and failed decisions have distinct responses.", "Development mode supports local IP handling; change environment settings before deployment."]);
  projects.redis = { ...existing.redis, title: "Cache a local API with Redis", points: ["Cache-aside reads Redis first and populates it after a miss.", "EX sets a 30-second expiry.", "A namespaced key prevents collisions with other application data."] };
  projects.upstash = project("Read and expire a Redis value", "Use Upstash Redis over HTTP from a server-side Node script.", [
    file("src/client.js", `import { Redis } from '@upstash/redis';
export const redis = Redis.fromEnv();`), file("src/main.js", `import { randomUUID } from 'node:crypto';
import { redis } from './client.js';
const key = 'docs-example:' + randomUUID();
await redis.set(key, { title: 'HTTP Redis', completed: false }, { ex: 60 });
console.log(await redis.get(key));
console.log('TTL:', await redis.ttl(key));
await redis.del(key);`), file(".env.example", "UPSTASH_REDIS_REST_URL=replace_with_database_url\nUPSTASH_REDIS_REST_TOKEN=replace_with_database_token"), manifest({ "@upstash/redis": "^1.34.0" }, { start: "node --env-file=.env src/main.js" }),
  ], [install, start], ["The stored object and a TTL no greater than 60 print, then the example key is deleted."], [...node, "Create an Upstash Redis database. Copy .env.example to .env and fill both values."], ["The REST token is a server secret; never bundle it into browser JavaScript.", "The SDK serializes objects automatically.", "Each run uses a unique expiring key."]);
  projects.neon = project("Query Postgres over HTTP", "Use a parameterized Neon query to read a seeded lesson from a dedicated test database.", [
    file("schema.sql", "CREATE TABLE IF NOT EXISTS docs_lessons (id integer PRIMARY KEY, title text NOT NULL);\nINSERT INTO docs_lessons VALUES (1, 'Postgres over HTTP') ON CONFLICT (id) DO NOTHING;"),
    file("src/db.js", `import { neon } from '@neondatabase/serverless';
export const sql = neon(process.env.DATABASE_URL);`), file("src/main.js", `import { sql } from './db.js';
const rows = await sql.query('SELECT id, title FROM docs_lessons WHERE id = $1', [1]);
console.log(rows);`), file(".env.example", "DATABASE_URL=postgresql://replace_with_your_neon_connection_string"), manifest({ "@neondatabase/serverless": "^1.0.0" }, { start: "node --env-file=.env src/main.js" }),
  ], [command("# Run schema.sql in the Neon SQL Editor", "Create a test branch/database and run the supplied schema there."), install, start], ["The query prints the lesson with id 1."], [...node, "Create a Neon project/test branch, then copy .env.example to .env and fill DATABASE_URL."], ["The HTTP driver is suited to single queries and noninteractive transactions.", "Pass values separately from SQL text; do not concatenate untrusted input.", "Keep the connection string on the server."]);
  projects.clerk = next("Sign in and read a protected session", "Use hosted sign-in controls and protect a JSON route with Clerk.", `import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { SignInButton, UserButton } from '@clerk/nextjs';
export default async function Page() {
  const { userId } = await auth();
  return <main><h1>Session demo</h1>{userId ? <><UserButton /><a href="/api/me">View protected session</a></> : <SignInButton mode="modal"><button>Sign in</button></SignInButton>}</main>;
}`, [file("proxy.js", `import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();
export const config = { matcher: ['/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)', '/(api|trpc)(.*)'] };`), file("app/api/me/route.js", `import { auth } from '@clerk/nextjs/server';
export async function GET() {
  const { userId } = await auth.protect();
  return Response.json({ userId });
}`), file(".env.example", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=replace_with_publishable_key\nCLERK_SECRET_KEY=replace_with_secret_key")], { "@clerk/nextjs": "^7.0.0" }, [...node, "Create a Clerk application. Copy .env.example to .env.local and fill both keys."]);
  projects.clerk.files = projects.clerk.files.map(f => f.path !== "app/layout.jsx" ? f : file(f.path, `import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
export default function Layout({ children }) { return <ClerkProvider><html lang="en"><body>{children}</body></html></ClerkProvider>; }`));
  projects.authjs = next("GitHub OAuth with Auth.js", "Sign in, read the server session, and sign out using the Auth.js v5 beta API.", `import React from 'react';
import { auth, signIn, signOut } from '../auth.js';
export default async function Page() {
  const session = await auth();
  return <main><h1>GitHub sign-in</h1>{session?.user ? <><p>Signed in as {session.user.name}</p>
    <form action={async () => { 'use server'; await signOut(); }}><button>Sign out</button></form></> :
    <form action={async () => { 'use server'; await signIn('github'); }}><button>Sign in with GitHub</button></form>}</main>;
}`, [file("auth.js", `import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
export const { handlers, auth, signIn, signOut } = NextAuth({ providers: [GitHub] });`), file("app/api/auth/[...nextauth]/route.js", `import { handlers } from '../../../../auth.js';
export const { GET, POST } = handlers;`), file(".env.example", "AUTH_SECRET=replace_with_a_random_secret\nAUTH_GITHUB_ID=replace_with_oauth_client_id\nAUTH_GITHUB_SECRET=replace_with_oauth_client_secret")], { "next-auth": "5.0.0-beta.30" }, [...node, "Create a GitHub OAuth app with callback http://localhost:3000/api/auth/callback/github.", "Copy .env.example to .env.local. Generate AUTH_SECRET with npx auth secret or a cryptographic generator."], ["This example pins the v5 beta API; it does not use v4 configuration.", "OAuth client secrets and session signing keys remain server-side.", "Authentication identifies a user; check authorization at every protected operation."]);
  projects.kinde = next("Hosted authentication with Kinde", "Read a server session and render login and logout links through the Kinde Next.js SDK.", `import React from 'react';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { LoginLink, LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
export default async function Page() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  if (!(await isAuthenticated())) return <main><h1>Kinde sign-in</h1><LoginLink>Sign in</LoginLink></main>;
  const user = await getUser();
  return <main><h1>Welcome {user?.given_name ?? 'learner'}</h1><LogoutLink>Sign out</LogoutLink></main>;
}`, [file("app/api/auth/[kindeAuth]/route.js", `import { handleAuth } from '@kinde-oss/kinde-auth-nextjs/server';
export const GET = handleAuth();`), file(".env.example", "KINDE_CLIENT_ID=replace_with_client_id\nKINDE_CLIENT_SECRET=replace_with_client_secret\nKINDE_ISSUER_URL=https://replace_with_subdomain.kinde.com\nKINDE_SITE_URL=http://localhost:3000\nKINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000\nKINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000")], { "@kinde-oss/kinde-auth-nextjs": "^2.0.0" }, [...node, "Create a Kinde web application. Allow callback http://localhost:3000/api/auth/kinde_callback and logout http://localhost:3000.", "Copy .env.example to .env.local and fill in the application credentials."]);
  projects.uv = project("A reproducible Python project", "Run a Python package and its standard-library tests through uv's managed environment.", [
    file("pyproject.toml", `[project]
name = "docs-uv-example"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = []`), file(".python-version", "3.12"), file("lessons.py", `def total_minutes(lessons):
    return sum(lesson["minutes"] for lesson in lessons)
`), file("main.py", `from lessons import total_minutes

print(total_minutes([{"minutes": 10}, {"minutes": 25}]))
`), file("test_lessons.py", `import unittest
from lessons import total_minutes

class LessonTests(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(total_minutes([]), 0)

    def test_total(self):
        self.assertEqual(total_minutes([{"minutes": 10}, {"minutes": 25}]), 35)

if __name__ == "__main__":
    unittest.main()
`),
  ], [command("uv sync", "Create .venv and generate uv.lock from pyproject.toml."), command("uv run main.py", "Run the program in the project environment."), command("uv run python -m unittest", "Run the two tests."), command("uv sync --locked", "Verify dependencies against the generated lockfile; commit that file with your project.")], ["The program prints 35 and both tests pass."], ["Install uv using the instructions for your operating system at docs.astral.sh/uv/getting-started/installation/.", "uv can install the Python version declared in .python-version."], ["pyproject.toml describes the project; uv.lock records resolved dependencies.", "uv run selects the project environment automatically.", "Use uv add package-name to add a dependency rather than editing an unrelated global environment."]);
  projects["agentic-ai"] = { ...existing.langgraph, title: "Trace a stateful agent workflow", summary: "Run a deterministic LangGraph workflow locally, then study the concepts needed to add model decisions and tools.", points: ["This runnable baseline uses deterministic nodes, not an LLM or an autonomous agent.", "An agent combines model decisions, tool calls, state, and a stopping condition.", "Use the concept directory to explore memory, retrieval, planning, evaluation, safety, and deployment."] };
  projects["system-design"] = project("Observe cache-aside tradeoffs", "Run a small HTTP service with an expiring in-memory cache and counters that expose cache behavior.", [
    file("src/store.js", `export const lessons = [{ id: 1, title: 'Caching and consistency' }];
export async function readLessons() {
  await new Promise(resolve => setTimeout(resolve, 150));
  return lessons;
}`), file("src/cache.js", `export function createCache(ttlMs) {
  let entry;
  return {
    get: () => entry && entry.expires > Date.now() ? entry.value : undefined,
    set: value => { entry = { value, expires: Date.now() + ttlMs }; },
  };
}`), file("src/server.js", `import { createServer } from 'node:http';
import { readLessons } from './store.js';
import { createCache } from './cache.js';
const cache = createCache(5000);
const metrics = { hits: 0, misses: 0 };
createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/metrics') return res.end(JSON.stringify(metrics));
  if (req.url !== '/lessons') { res.writeHead(404); return res.end('{}'); }
  let value = cache.get();
  if (value) metrics.hits++;
  else { metrics.misses++; value = await readLessons(); cache.set(value); }
  res.end(JSON.stringify(value));
}).listen(3000, '127.0.0.1');`), manifest({}, { start: "node src/server.js" }),
  ], [install, start, command("curl http://localhost:3000/lessons", "In another terminal, request twice within five seconds (use curl.exe in PowerShell)."), command("curl http://localhost:3000/metrics", "Inspect hits and misses; repeat after the TTL expires.")], ["The first request misses, the next hits, and a request after five seconds misses again."], node, ["This single-process cache is intentionally local; replicas would not share its state.", "TTL bounds staleness but concurrent misses can still cause a cache stampede.", "Use metrics to compare latency, load, and consistency tradeoffs before adding complexity."]);
  projects["javascript-puzzles"] = project("Predict, run, and explain", "Run six JavaScript puzzles with assertions and explanations in a separate answer file.", [
    file("src/puzzles.js", `export function closurePuzzle() {
  const callbacks = [];
  for (let i = 0; i < 3; i++) callbacks.push(() => i);
  return callbacks.map(fn => fn());
}
export async function eventLoopPuzzle() {
  const order = ['sync'];
  const done = new Promise(resolve => setTimeout(() => { order.push('timer'); resolve(); }, 0));
  Promise.resolve().then(() => order.push('microtask'));
  order.push('end');
  await done;
  return order;
}
export function coercionPuzzle() { return [1 + '2', '5' - 2, Boolean('false')]; }
export function equalityPuzzle() { return [NaN === NaN, Object.is(NaN, NaN), Object.is(0, -0)]; }
export function copyPuzzle() {
  const original = { nested: { value: 1 } };
  const copy = { ...original };
  copy.nested.value = 2;
  return original.nested.value;
}
export function defaultPuzzle() { return [0 || 10, 0 ?? 10, '' ?? 'fallback']; }
`), file("src/main.js", `import * as puzzles from './puzzles.js';
for (const [name, puzzle] of Object.entries(puzzles)) console.log(name, JSON.stringify(await puzzle()));`),
    file("src/puzzles.test.js", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as p from './puzzles.js';
test('block-scoped closures', () => assert.deepEqual(p.closurePuzzle(), [0, 1, 2]));
test('event loop', async () => assert.deepEqual(await p.eventLoopPuzzle(), ['sync', 'end', 'microtask', 'timer']));
test('coercion', () => assert.deepEqual(p.coercionPuzzle(), ['12', 3, true]));
test('equality', () => assert.deepEqual(p.equalityPuzzle(), [false, true, false]));
test('shallow copy', () => assert.equal(p.copyPuzzle(), 2));
test('defaults', () => assert.deepEqual(p.defaultPuzzle(), [10, 0, '']));`),
    file("ANSWERS.md", `# Answers and reasoning
1. Closures: [0, 1, 2]. Each let loop iteration has its own binding. Replacing let with var shares a binding and produces [3, 3, 3].
2. Event loop: sync, end, microtask, timer. Synchronous work finishes before promise microtasks; the timer runs in a later task.
3. Coercion: ["12", 3, true]. Addition concatenates when a string is involved; subtraction converts numeric strings; a nonempty string is truthy.
4. Equality: [false, true, false]. NaN is unequal to itself with ===; Object.is treats NaN as the same value and distinguishes signed zero.
5. Shallow copy: 2. Object spread copies the outer object, but the nested object is still shared.
6. Defaults: [10, 0, ""]. || replaces all falsy values; ?? only replaces null and undefined.

Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide`), manifest({}, { start: "node src/main.js", test: "node --test" }),
  ], [start, command("npm test", "Check each prediction against its assertion.")], ["Six puzzle outputs print and all six assertions pass."], node, ["Predict the result before opening ANSWERS.md.", "Each puzzle is isolated in a function to avoid cross-example state.", "Change one expression and rerun the tests to check your reasoning."]);
  projects["tanstack-start"] = project("Render a typed lesson route", "Build a minimal TanStack Start app with a route loader and a complete file-based route setup.", [
    file("src/routes/index.tsx", `import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/')({
  loader: () => [{ id: 1, title: 'Typed routes' }, { id: 2, title: 'Server rendering' }],
  component: Home,
});
function Home() {
  const lessons = Route.useLoaderData();
  return <main><h1>Lessons</h1><ul>{lessons.map(item => <li key={item.id}>{item.title}</li>)}</ul></main>;
}`), file("src/routes/__root.tsx", `import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Lesson routes' }] }),
  component: Root,
});
function Root() {
  return <html lang="en"><head><HeadContent /></head><body><Outlet /><Scripts /></body></html>;
}`), file("src/router.tsx", `import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
export function getRouter() { return createRouter({ routeTree, scrollRestoration: true }); }
declare module '@tanstack/react-router' { interface Register { router: ReturnType<typeof getRouter> } }`),
    file("src/routeTree.gen.ts", `// Initial route tree. The TanStack Vite plugin regenerates this file from src/routes.
import { Route as rootRoute } from './routes/__root';
import { Route as indexImport } from './routes/index';
const indexRoute = indexImport.update({ id: '/', path: '/', getParentRoute: () => rootRoute } as any);
declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof indexImport; parentRoute: typeof rootRoute };
  }
}
export const routeTree = rootRoute.addChildren([indexRoute]);`),
    file("vite.config.ts", `import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [tanstackStart(), react()] });`),
    file("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2022", jsx: "react-jsx", module: "ESNext", moduleResolution: "Bundler", strict: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true }, include: ["src", "vite.config.ts"] }, null, 2)),
    manifest({ "@tanstack/react-start": "^1.132.0", "@tanstack/react-router": "^1.132.0", react: "^19.0.0", "react-dom": "^19.0.0" }, { start: "vite --host 127.0.0.1", build: "vite build", check: "tsc --noEmit" }, { vite: "^7.0.0", "@vitejs/plugin-react": "^5.0.0", typescript: "^5.9.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0", "@types/node": "^22.0.0" }),
  ], [install, start, command("npm run build", "Stop the development server, then build; the plugin regenerates the route tree."), command("npm run check", "Check types after route generation.")], ["Open the URL printed by Vite; both lesson titles render.", "The route loader's result is inferred by useLoaderData."], node, ["The Start plugin runs before the React Vite plugin.", "routeTree.gen.ts is generated from the route files; do not maintain it by hand.", "The root route supplies the document shell and hydration scripts."]);
  projects["t3-stack"] = project("A typed tRPC greeting", "Connect Next.js, TypeScript, tRPC, and Zod in a small T3-style app with a typed browser call.", [
    file("app/page.tsx", `'use client';
import { useState } from 'react';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/router';
export default function Page() {
  const [name, setName] = useState('Ada');
  const [message, setMessage] = useState('');
  async function greet() {
    const client = createTRPCProxyClient<AppRouter>({ links: [httpBatchLink({ url: window.location.origin + '/api/trpc' })] });
    try { setMessage((await client.greet.query({ name })).message); }
    catch { setMessage('Enter a name between 1 and 50 characters.'); }
  }
  return <main><h1>Typed greeting</h1><label>Name <input value={name} onChange={e => setName(e.target.value)} /></label>
    <button onClick={greet}>Greet</button><p role="status">{message}</p></main>;
}`), file("server/router.ts", `import { initTRPC } from '@trpc/server';
import { z } from 'zod';
const t = initTRPC.create();
export const appRouter = t.router({
  greet: t.procedure.input(z.object({ name: z.string().trim().min(1).max(50) }))
    .query(({ input }) => ({ message: 'Hello, ' + input.name + '!' })),
});
export type AppRouter = typeof appRouter;`), file("app/api/trpc/[trpc]/route.ts", `import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../server/router';
function handler(req: Request) {
  return fetchRequestHandler({ endpoint: '/api/trpc', req, router: appRouter, createContext: () => ({}) });
}
export { handler as GET, handler as POST };`), file("app/layout.tsx", `import type { ReactNode } from 'react';
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body style={{ fontFamily: 'system-ui', margin: 40 }}>{children}</body></html>;
}`), file("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["dom", "esnext"], module: "esnext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, esModuleInterop: true, skipLibCheck: true, plugins: [{ name: "next" }] }, include: ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] }, null, 2)),
    manifest({ next: "^16.0.0", react: "^19.2.0", "react-dom": "^19.2.0", "@trpc/client": "^11.0.0", "@trpc/server": "^11.0.0", zod: "^4.0.0" }, { start: "next dev", build: "next build" }, { typescript: "^5.9.0", "@types/react": "^19.0.0", "@types/node": "^22.0.0", "@types/react-dom": "^19.0.0" }),
  ], [install, start, command("npm run build", "Stop the dev server and verify the production build.")], ["At localhost:3000, Greet returns Hello, Ada!; a blank name produces a validation message."], node, ["T3 is a composable stack; this minimal example omits optional database and authentication layers.", "Only the router type is imported into the browser; server implementation stays on the server.", "Zod validates the input at runtime while tRPC carries types across the API boundary."]);
  projects.webhook = project("Verify a signed webhook", "Run a local sender and receiver that verify the raw request body before accepting a delivery.", [
    file("src/signature.js", `import { createHmac, timingSafeEqual } from 'node:crypto';
export function sign(body, secret) { return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex'); }
export function verify(body, signature, secret) {
  if (!/^sha256=[a-f0-9]{64}$/.test(signature ?? '')) return false;
  return timingSafeEqual(Buffer.from(sign(body, secret)), Buffer.from(signature));
}`), file("src/server.js", `import { createServer } from 'node:http';
import { verify } from './signature.js';
const secret = process.env.WEBHOOK_SECRET;
if (!secret) throw new Error('Set WEBHOOK_SECRET in .env');
const seen = new Set();
createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') { res.writeHead(404); return res.end(); }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65536) { res.writeHead(413); return res.end('Payload too large'); }
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);
  if (!verify(body, req.headers['x-hub-signature-256'], secret)) { res.writeHead(401); return res.end('Invalid signature'); }
  let event;
  try { event = JSON.parse(body.toString('utf8')); }
  catch { res.writeHead(400); return res.end('Invalid JSON'); }
  if (typeof event.id !== 'string' || typeof event.message !== 'string') { res.writeHead(400); return res.end('Invalid event'); }
  if (seen.has(event.id)) { res.writeHead(200); return res.end('Duplicate ignored'); }
  seen.add(event.id);
  setTimeout(() => seen.delete(event.id), 300000).unref();
  console.log('Accepted:', event.message);
  res.writeHead(202); res.end('Accepted');
}).listen(3000, '127.0.0.1');`), file("src/send.js", `import { randomUUID } from 'node:crypto';
import { sign } from './signature.js';
const body = JSON.stringify({ id: randomUUID(), message: 'A signed delivery' });
for (const signature of [sign(body, process.env.WEBHOOK_SECRET), sign(body, process.env.WEBHOOK_SECRET), 'invalid']) {
  const response = await fetch('http://localhost:3000/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature }, body });
  console.log(response.status, await response.text());
}`), file("src/signature.test.js", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sign, verify } from './signature.js';
test('accepts authentic bytes and rejects tampering', () => {
  const signature = sign('hello', 'test-secret');
  assert.equal(verify('hello', signature, 'test-secret'), true);
  assert.equal(verify('changed', signature, 'test-secret'), false);
  assert.equal(verify('hello', 'invalid', 'test-secret'), false);
});`), file(".env.example", "WEBHOOK_SECRET=local_learning_secret_change_me"), manifest({}, { start: "node --env-file=.env src/server.js", send: "node --env-file=.env src/send.js", test: "node --test" }),
  ], [command("npm test", "Run signature checks."), start, command("npm run send", "Keep the receiver running; send three requests from another terminal.")], ["The sender prints 202 Accepted, 200 Duplicate ignored, then 401 Invalid signature."], [...node, "Copy .env.example to .env. The sample secret is only for this local exercise."], ["Authenticate the original bytes before parsing JSON.", "This sender uses GitHub's HMAC header convention with a custom demo payload.", "The five-minute deduplication set is local and volatile; production needs a durable delivery ledger and bounded retention."]);
  return projects;
}
