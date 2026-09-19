import type { CodeLanguage } from "./code-highlight";
import { TECHY_ADDITIONAL_EXAMPLES } from "./techy-additional-examples";

export type TechyExample = { title: string; description: string; setup: string; files: { path: string; language: CodeLanguage; code: string }[] };
// Small, connected teaching examples. Setup identifies the host project or runtime.
export const TECHY_EXAMPLES: Record<string, TechyExample> = {
  ...TECHY_ADDITIONAL_EXAMPLES,
  aws: {
    title: "Read a private S3 object", description: "Keep credentials in the AWS credential chain. The role needs s3:GetObject on the selected object.",
    setup: "Node.js 22+ • npm install @aws-sdk/client-s3 • Set AWS_REGION, BUCKET and OBJECT_KEY; authenticate with an AWS role or local profile. Run node src/read.mjs.",
    files: [
      { path: "src/storage.mjs", language: "javascript", code: `import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function readObject(bucket, key) {
  const result = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }));
  if (!result.Body) throw new Error('Object body is missing');
  return result.Body.transformToString();
}` },
      { path: "src/read.mjs", language: "javascript", code: `import { readObject } from './storage.mjs';

const { BUCKET, OBJECT_KEY } = process.env;
if (!BUCKET || !OBJECT_KEY) {
  throw new Error('Set BUCKET and OBJECT_KEY');
}

try {
  const text = await readObject(BUCKET, OBJECT_KEY);
  console.log(text);
} catch (error) {
  console.error('Read failed:', error.message);
  process.exitCode = 1;
}` },
    ],
  },
  "agentic-ai": {
    title: "A bounded tool loop", description: "A deterministic model stand-in makes the control loop runnable. Replace decide with a model adapter that validates its response against the same contract.",
    setup: "Node.js 22+ • No dependencies • Run node src/agent.mjs. Expected result: The release is ready. This example performs read-only tool calls.",
    files: [
      { path: "src/tools.mjs", language: "javascript", code: `export const tools = {
  release_status: async (args) => {
    if (args?.project !== 'demo') {
      throw new Error('Unknown project');
    }
    return { project: 'demo', status: 'ready' };
  },
};` },
      { path: "src/model.mjs", language: "javascript", code: `// Contract: a final answer OR a requested tool and arguments.
// This deterministic adapter is a teaching fixture, not an LLM.
export async function decide(history) {
  const result = history.find(item => item.role === 'tool');
  if (result) {
    return { kind: 'final', text: 'The release is ' + result.value.status };
  }
  return {
    kind: 'tool', name: 'release_status',
    args: { project: 'demo' },
  };
}` },
      { path: "src/agent.mjs", language: "javascript", code: `import { tools } from './tools.mjs';
import { decide } from './model.mjs';

const history = [{ role: 'user', text: 'Is demo ready?' }];
let complete = false;
for (let step = 0; step < 4; step++) {
  const action = await decide(history);
  if (action.kind === 'final') {
    console.log(action.text);
    complete = true;
    break;
  }
  if (action.kind !== 'tool' || !Object.hasOwn(tools, action.name)) {
    throw new Error('Unsupported action');
  }
  const value = await tools[action.name](action.args);
  history.push({ role: 'tool', value });
}
if (!complete) throw new Error('Step budget exhausted');` },
    ],
  },
  nextjs: {
    title: "A server page with a client favorite", description: "The page awaits route params and passes serializable data into a small interactive component.",
    setup: "Existing Next.js 16+ App Router TypeScript project with its root layout • Add these files, run npm run dev and visit /topics/caching.",
    files: [
      { path: "app/topics/[slug]/page.tsx", language: "tsx", code: `import Favorite from './favorite';

export default async function Page({ params }: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <section>
      <h1>{slug}</h1>
      <p>Rendered by a Server Component.</p>
      <Favorite topic={slug} />
    </section>
  );
}` },
      { path: "app/topics/[slug]/favorite.tsx", language: "tsx", code: `'use client';
import { useState } from 'react';

export default function Favorite({ topic }: { topic: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button aria-pressed={saved} onClick={() => setSaved(value => !value)}>
      {saved ? 'Saved ' : 'Save '}{topic}
    </button>
  );
}` },
    ],
  },
  tanstack: {
    title: "Query with a local API adapter", description: "The same query key reuses cached data. Replace the async adapter with your API call and check response.ok.",
    setup: "Existing React TypeScript app • npm install @tanstack/react-query • Render App from your existing entry point.",
    files: [
      { path: "src/api.ts", language: "typescript", code: `export type Topic = { id: number; title: string };

export async function getTopics(): Promise<Topic[]> {
  // Runnable local fixture; replace with a real API adapter.
  return [{ id: 1, title: 'Query keys' }, { id: 2, title: 'Mutations' }];
}` },
      { path: "src/Topics.tsx", language: "tsx", code: `import { useQuery } from '@tanstack/react-query';
import { getTopics } from './api';

export function Topics() {
  const query = useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
    staleTime: 60_000,
  });
  if (query.isPending) return <p>Loading…</p>;
  if (query.isError) return <p role="alert">{query.error.message}</p>;
  return <ul>{query.data.map(topic => <li key={topic.id}>{topic.title}</li>)}</ul>;
}` },
      { path: "src/App.tsx", language: "tsx", code: `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Topics } from './Topics';

// Browser-only SPA: one client for this app instance.
const client = new QueryClient();
export default function App() {
  return <QueryClientProvider client={client}><Topics /></QueryClientProvider>;
}` },
    ],
  },
  zustand: {
    title: "A focused learning counter", description: "State and actions live together. Each selector subscribes only to the value it needs.",
    setup: "Existing React TypeScript SPA • npm install zustand • Render Counter in the app. For SSR, use a scoped store rather than shared user state.",
    files: [
      { path: "src/stores/learning.ts", language: "typescript", code: `import { create } from 'zustand';

type Learning = {
  reviewed: number;
  review: () => void;
  reset: () => void;
};
export const useLearning = create<Learning>()((set) => ({
  reviewed: 0,
  review: () => set(state => ({ reviewed: state.reviewed + 1 })),
  reset: () => set({ reviewed: 0 }),
}));` },
      { path: "src/Counter.tsx", language: "tsx", code: `import { useLearning } from './stores/learning';

export function Counter() {
  const reviewed = useLearning(state => state.reviewed);
  const review = useLearning(state => state.review);
  const reset = useLearning(state => state.reset);
  return (
    <section>
      <p aria-live="polite">{reviewed} cards reviewed</p>
      <button onClick={review}>Review a card</button>
      <button onClick={reset}>Reset</button>
    </section>
  );
}` },
    ],
  },
  vitest: {
    title: "Test a scoring boundary", description: "Parameterized tests cover passing, failing and empty attempts; invalid scores must fail explicitly.",
    setup: "Node.js 22+ • npm install -D vitest typescript • Run npx vitest run.",
    files: [
      { path: "src/score.ts", language: "typescript", code: `export function passed(correct: number, total: number) {
  if (!Number.isInteger(correct) || !Number.isInteger(total)
      || correct < 0 || total < 0 || correct > total) {
    throw new Error('Invalid score');
  }
  return total > 0 && correct / total >= 0.8;
}` },
      { path: "src/score.test.ts", language: "typescript", code: `import { describe, expect, test } from 'vitest';
import { passed } from './score';

describe('quiz pass threshold', () => {
  test.each([
    [8, 10, true],
    [7, 10, false],
    [0, 0, false],
  ])('%i of %i yields %s', (correct, total, expected) => {
    expect(passed(correct, total)).toBe(expected);
  });
  test('rejects more correct answers than questions', () => {
    expect(() => passed(11, 10)).toThrow('Invalid score');
  });
});` },
    ],
  },
  playwright: {
    title: "Test a small counter in a browser", description: "A self-contained local page keeps this example independent of a running server. The same locators work against a deployed app.",
    setup: "Node.js 22+ • npm install -D @playwright/test • npx playwright install chromium • Run npx playwright test.",
    files: [
      { path: "fixtures/counter.html", language: "html", code: `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Learning counter</title>
<button type="button">Review card</button>
<p role="status">0 reviewed</p>
<script>
  let count = 0;
  document.querySelector('button').addEventListener('click', () => {
    count += 1;
    document.querySelector('[role="status"]').textContent = count + ' reviewed';
  });
</script>
</html>` },
      { path: "tests/counter.spec.ts", language: "typescript", code: `import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('reviewing a card updates the count', async ({ page }) => {
  await page.setContent(await readFile('fixtures/counter.html', 'utf8'));
  await page.getByRole('button', { name: 'Review card' }).click();
  await expect(page.getByRole('status')).toHaveText('1 reviewed');
});` },
      { path: "playwright.config.ts", language: "typescript", code: `import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { browserName: 'chromium', trace: 'retain-on-failure' },
});` },
    ],
  },
  react: {
    title: "An Action with visible feedback", description: "The action receives previous state and submitted form data. React tracks pending state; the async save here is a local fixture.",
    setup: "Existing React 19+ TypeScript app • Render Signup. Add use client at the top of Signup.tsx when using it in an App Router project.",
    files: [
      { path: "src/save.ts", language: "typescript", code: `export type FormState = { message: string };

export async function save(_previous: FormState, data: FormData): Promise<FormState> {
  const name = String(data.get('name') ?? '').trim();
  if (!name) return { message: 'Please enter your name.' };
  // Demo only: a real save must validate and authorize on the server.
  await Promise.resolve();
  return { message: 'Welcome, ' + name + '!' };
}` },
      { path: "src/Signup.tsx", language: "tsx", code: `import { useActionState } from 'react';
import { save } from './save';

export function Signup() {
  const [state, action, pending] = useActionState(save, { message: '' });
  return (
    <form action={action}>
      <label>Name <input name="name" required /></label>
      <button disabled={pending}>{pending ? 'Saving…' : 'Join'}</button>
      <p role="status">{state.message}</p>
    </form>
  );
}` },
    ],
  },
  typescript: {
    title: "Narrow an API result", description: "The discriminant gives each branch a precise shape. Validation rejects malformed external input before it enters typed code.",
    setup: "Node.js 22+ • npm install -D typescript tsx • Run npx tsx src/main.ts; also check with npx tsc --noEmit --strict --target es2022 --module nodenext src/main.ts.",
    files: [
      { path: "src/result.ts", language: "typescript", code: `export type Result =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function parseName(value: unknown): Result {
  if (typeof value !== 'object' || value === null || !('name' in value)) {
    return { ok: false, error: 'Missing name' };
  }
  if (typeof value.name !== 'string' || !value.name.trim()) {
    return { ok: false, error: 'Invalid name' };
  }
  return { ok: true, name: value.name.trim() };
}` },
      { path: "src/main.ts", language: "typescript", code: `import { parseName } from './result';

const input: unknown = JSON.parse('{"name":"Ada"}');
const result = parseName(input);
if (result.ok) {
  console.log(result.name.toUpperCase());
} else {
  console.error(result.error);
}` },
    ],
  },
  docker: {
    title: "Containerize a tiny health endpoint", description: "This dependency-free server runs as a non-root user. The workflow checks JavaScript syntax and builds the same image.",
    setup: "Docker • docker build -t techy-demo . • docker run --rm -p 8080:8080 techy-demo • Visit http://localhost:8080/health. For releases, pin a reviewed base-image digest.",
    files: [
      { path: "src/server.mjs", language: "javascript", code: `import { createServer } from 'node:http';

createServer((req, res) => {
  const healthy = req.url === '/health';
  res.writeHead(healthy ? 200 : 404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(healthy ? { status: 'ok' } : { error: 'Not found' }));
}).listen(8080, '0.0.0.0');` },
      { path: "Dockerfile", language: "text", code: `FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node src ./src
USER node
EXPOSE 8080
CMD ["node", "src/server.mjs"]` },
      { path: ".dockerignore", language: "text", code: `.git
node_modules
.env
.env.*
coverage` },
      { path: ".github/workflows/ci.yml", language: "yaml", code: `name: Check and build
on: [push, pull_request]
permissions:
  contents: read
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: node --check src/server.mjs
      - run: docker build -t techy-demo .` },
    ],
  },
};
