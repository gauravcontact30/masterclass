import type { OfficialTechnologyDoc } from "./official-docs-data";
import { DOCS_PROJECTS } from "./official-docs-projects";
import type { DocsProject } from "./official-docs-projects";
import { COMPLEX_DOCS_PROJECTS } from "./official-docs-complex";
import type { AnswerFile } from "./pro-learn/types";

type Starter = [title: string, path: string, code: string, summary: string];

// Small, focused exercises before the existing worked example and full project.
const starters: Record<string, Starter> = {
  nextjs: ["Render a page", "app/page.tsx", `export default function Page() {
  return <h1>My learning dashboard</h1>;
}`, "Save this in an App Router project and visit /."],
  react: ["Pass a prop", "Greeting.jsx", `export default function Greeting({ name = 'Learner' }) {
  return <h1>Hello, {name}!</h1>;
}`, "Render <Greeting name=\"Sam\" /> in a React app to personalize the heading."],
  tailwind: ["Style a button", "button.html", `<button class="rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-900 hover:bg-blue-200">
  Start learning
</button>`, "Use in a page with Tailwind configured; hover to see the background change."],
  zustand: ["Update a store", "counter.js", `import { createStore } from 'zustand/vanilla';
const counter = createStore(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));
counter.getState().increment();
console.log(counter.getState().count); // 1`, "Create a Zustand store and update it without a UI."],
  redux: ["Reduce an action", "counter.js", `function counter(state = 0, action) {
  return action.type === 'increment' ? state + 1 : state;
}
console.log(counter(undefined, { type: 'increment' })); // 1`, "A pure reducer calculates the next state from the current state and an action."],
  rtk: ["Create a slice", "counter.js", `import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({
  name: 'counter', initialState: { value: 0 },
  reducers: { increment: state => { state.value += 1; } },
});
console.log(slice.reducer(undefined, slice.actions.increment()));`, "Redux Toolkit generates an action creator and an immutable state update."],
  tanstack: ["Read cached data", "cache.js", `import { QueryClient } from '@tanstack/react-query';
const client = new QueryClient();
client.setQueryData(['lesson', 1], { title: 'Caching' });
console.log(client.getQueryData(['lesson', 1]));`, "Store and retrieve data using the same query key."],
  graphql: ["Define a query", "schema.graphql", `type Lesson {
  id: ID!
  title: String!
}
type Query {
  lessons: [Lesson!]!
}`, "This schema defines a lessons query; a server resolver supplies its data."],
  drizzle: ["Define a table", "schema.ts", `import { pgTable, serial, text } from 'drizzle-orm/pg-core';
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
});`, "Add this schema to a Drizzle PostgreSQL project before generating a migration."],
  prisma: ["Define a model", "schema.prisma", `model Lesson {
  id    Int    @id @default(autoincrement())
  title String
}`, "Add the model to a configured Prisma schema, then generate a migration and client."],
  postgresql: ["Filter rows", "lessons.sql", `SELECT title, minutes
FROM (VALUES ('SQL basics', 15), ('Joins', 30)) AS lessons(title, minutes)
WHERE minutes <= 20;`, "Run in PostgreSQL to return only SQL basics."],
  supabase: ["Read public lessons", "lessons.js", `import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const { data, error } = await db.from('lessons').select('id, title').limit(5);
if (error) throw error;
console.log(data);`, "Requires a lessons table, environment variables, and a row-level security policy allowing the read."],
  playwright: ["Check a heading", "heading.spec.ts", `import { test, expect } from '@playwright/test';
test('shows a heading', async ({ page }) => {
  await page.setContent('<h1>Lessons</h1>');
  await expect(page.getByRole('heading', { name: 'Lessons' })).toBeVisible();
});`, "Run with Playwright Test after installing its browser binaries."],
  vitest: ["Assert a result", "sum.test.js", `import { expect, test } from 'vitest';
test('adds two numbers', () => {
  expect(2 + 3).toBe(5);
});`, "Run with Vitest to see one passing test."],
  typescript: ["Type a function", "lesson.ts", `type Lesson = { title: string; minutes: number };
function describe(lesson: Lesson): string {
  return lesson.title + ': ' + lesson.minutes + ' minutes';
}
console.log(describe({ title: 'Types', minutes: 15 }));`, "TypeScript checks the input shape and return type before execution."],
  "javascript-features": ["Use optional chaining", "lesson.js", `const lesson = { title: 'JavaScript' };
const author = lesson.author?.name ?? 'Community';
console.log(author); // Community`, "Read an optional nested value and supply a default when it is missing."],
  "javascript-info": ["Transform an array", "lessons.js", `const minutes = [10, 20, 30];
const shortLessons = minutes.filter(value => value <= 20);
console.log(shortLessons.map(value => value + ' min'));`, "Filter an array, then transform the matching values."],
  python: ["Filter a list", "lessons.py", `minutes = [10, 20, 30]
short_lessons = [value for value in minutes if value <= 20]
print(short_lessons)  # [10, 20]`, "Run with Python to practice a list comprehension."],
  fastapi: ["Return JSON", "main.py", `from fastapi import FastAPI

app = FastAPI()

@app.get('/health')
def health():
    return {'status': 'ok'}`, "With FastAPI and Uvicorn installed, run uvicorn main:app and visit /health."],
  golang: ["Iterate over a slice", "main.go", `package main
import "fmt"
func main() {
    for _, title := range []string{"Types", "Functions"} {
        fmt.Println(title)
    }
}`, "Run go run main.go to print each lesson title."],
  rust: ["Borrow a collection", "main.rs", `fn main() {
    let lessons = vec!["Ownership", "Borrowing"];
    for lesson in &lessons {
        println!("{}", lesson);
    }
    println!("{} lessons", lessons.len());
}`, "The loop borrows the vector, so it remains available afterward."],
  nodejs: ["Use an event emitter", "events.mjs", `import { EventEmitter } from 'node:events';
const events = new EventEmitter();
events.on('completed', title => console.log('Completed:', title));
events.emit('completed', 'Node.js basics');`, "Run node events.mjs to register a listener and emit an event."],
  langchain: ["Format a prompt", "prompt.py", `from langchain_core.prompts import PromptTemplate

prompt = PromptTemplate.from_template('Explain {topic} in one sentence.')
print(prompt.format(topic='caching'))`, "Requires langchain-core; prompt formatting does not call a model."],
  langgraph: ["Describe graph state", "state.py", `from typing import TypedDict

class State(TypedDict):
    topic: str
    summary: str

def summarize(state: State):
    return {'summary': 'Study ' + state['topic']}

print(summarize({'topic': 'graphs', 'summary': ''}))`, "A graph node receives state and returns the fields it updates."],
  langsmith: ["Trace a function", "trace.py", `from langsmith import traceable

@traceable
def format_topic(topic: str) -> str:
    return topic.strip().lower()

print(format_topic('  Tracing  '))`, "Install langsmith and configure LANGSMITH_API_KEY and LANGSMITH_TRACING=true to record the call."],
  docker: ["Build a small image", "Dockerfile", `FROM alpine:3.22
CMD ["echo", "Hello from a container"]`, "Run docker build -t docs-hello . then docker run --rm docs-hello."],
  kubernetes: ["Declare a ConfigMap", "config.yaml", `apiVersion: v1
kind: ConfigMap
metadata:
  name: learning-config
data:
  LOG_LEVEL: info`, "Apply to a development cluster with kubectl apply -f config.yaml, then inspect learning-config."],
  aws: ["Inspect your AWS identity", "identity.sh", `aws sts get-caller-identity`, "With the AWS CLI configured, display the active account and caller ARN."],
  devops: ["Check service health", "health.sh", `#!/bin/sh
if curl --fail --silent http://localhost:3000/health; then
  echo 'Service is healthy'
else
  echo 'Health check failed' >&2
  exit 1
fi`, "Start a local service with a /health endpoint; a failed request produces a nonzero exit code."],
  git: ["Inspect local changes", "review.sh", `git status --short
git diff
git log -3 --oneline`, "Run inside a repository to inspect changes and recent commits."],
  cicd: ["Run a workflow manually", ".github/workflows/hello.yml", `name: Learning workflow
on: workflow_dispatch
jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - run: echo 'Workflow started'`, "Commit this file to the default branch, then start it from the Actions tab."],
  jest: ["Test an array", "lessons.test.cjs", `test('contains the selected lesson', () => {
  expect(['React', 'Python']).toContain('Python');
});`, "Run in a Jest project to check collection membership."],
  "react-testing-library": ["Query by role", "heading.test.jsx", `import React from 'react';
import { render, screen } from '@testing-library/react';
test('renders a heading', () => {
  render(<h1>Learning notes</h1>);
  expect(screen.getByRole('heading').textContent).toBe('Learning notes');
});`, "Use Jest with jsdom to test the heading as a user would find it."],
  "javascript-puzzles": ["Observe a closure", "closure.js", `function makeCounter() {
  let count = 0;
  return () => ++count;
}
const next = makeCounter();
console.log(next(), next()); // 1 2`, "The returned function retains access to its own count variable."],
  uv: ["Run an isolated Python command", "hello.sh", `uv run --python 3.12 python -c "print('Hello from uv')"`, "With uv installed, select Python 3.12 and run a short command."],
  "agentic-ai": ["Dispatch an allowed tool", "tools.py", `def word_count(text):
    return len(text.split())

tools = {'word_count': word_count}
request = {'name': 'word_count', 'input': 'Learn agent tools'}
if request['name'] not in tools:
    raise ValueError('Unknown tool')
print(tools[request['name']](request['input']))`, "A deterministic tool dispatcher checks an allowlist before invoking a function."],
  cypress: ["Assert a value", "basics.cy.js", `describe('lesson totals', () => {
  it('adds completed lessons', () => {
    cy.wrap([1, 2, 3]).should('have.length', 3);
  });
});`, "Save under cypress/e2e and run in a configured Cypress project."],
  inngest: ["Declare an event client", "client.ts", `import { Inngest } from 'inngest';
export const inngest = new Inngest({ id: 'learning-app' });`, "Use this shared client when defining functions and sending events in an Inngest project."],
  arcjet: ["Configure a shield", "shield.ts", `import arcjet, { shield } from '@arcjet/next';
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [shield({ mode: 'DRY_RUN' })],
});`, "Requires ARCJET_KEY on the server. This configures a rule; call protect in a route to evaluate requests. Dry run does not block."],
  redis: ["Expire a cached value", "cache.redis", `SET lesson:title "Redis basics" EX 60
GET lesson:title
TTL lesson:title`, "Enter in redis-cli on a development instance; the value expires after 60 seconds."],
  webhook: ["Calculate a signature", "signature.mjs", `import { createHmac } from 'node:crypto';
const body = JSON.stringify({ event: 'lesson.completed' });
const signature = createHmac('sha256', 'local-demo-secret')
  .update(body).digest('hex');
console.log('sha256=' + signature);`, "This local exercise signs a payload. Receiving a real webhook also requires signature verification before processing."],
  upstash: ["Cache with a TTL", "cache.mjs", `import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
await redis.set('demo:lesson', 'Caching', { ex: 60 });
console.log(await redis.get('demo:lesson'));`, "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for a development database."],
  clerk: ["Add a sign-in button", "SignIn.jsx", `'use client';
import { SignInButton } from '@clerk/nextjs';
export default function SignIn() {
  return <SignInButton mode="modal"><button>Sign in</button></SignInButton>;
}`, "Render inside a configured ClerkProvider."],
  zod: ["Validate an input", "lesson.ts", `import { z } from 'zod';
const Lesson = z.object({ title: z.string().min(1) });
console.log(Lesson.safeParse({ title: 'Validation' }).success);
console.log(Lesson.safeParse({ title: '' }).success);`, "The first input succeeds; the empty title fails validation."],
  "tanstack-start": ["Render a route", "src/routes/index.tsx", `import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/')({
  component: () => <h1>Learning dashboard</h1>,
});`, "Add this index route to a configured TanStack Start project."],
  "tanstack-form": ["Create form state", "LessonForm.tsx", `import { useForm } from '@tanstack/react-form';
export default function LessonForm() {
  const form = useForm({ defaultValues: { title: '' } });
  return <form.Field name="title">{field => (
    <input aria-label="Lesson title" value={field.state.value}
      onChange={event => field.handleChange(event.target.value)} />
  )}</form.Field>;
}`, "Type in the input to update the field state in a React app."],
  "react-hooks": ["Toggle local state", "Toggle.jsx", `import { useState } from 'react';
export default function Toggle() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(value => !value)}>
    {open ? 'Hide notes' : 'Show notes'}
  </button>;
}`, "Each click updates state and renders a new label."],
  "nextjs-hooks": ["Read the current path", "Path.tsx", `'use client';
import { usePathname } from 'next/navigation';
export default function Path() {
  const pathname = usePathname();
  return <p>Current path: {pathname}</p>;
}`, "Use this client component in an App Router page to display its pathname."],
  conform: ["Connect form metadata", "LessonForm.tsx", `'use client';
import { useForm, getFormProps, getInputProps } from '@conform-to/react';
export default function LessonForm() {
  const [form, fields] = useForm<{ title: string }>();
  return <form {...getFormProps(form)}>
    <label>Title <input {...getInputProps(fields.title, { type: 'text' })} /></label>
  </form>;
}`, "Connect Conform metadata to a native form and input before adding validation and submission."],
  authjs: ["Read a session", "app/page.tsx", `import { auth } from '@/auth';
export default async function Page() {
  const session = await auth();
  return <p>{session?.user?.name ?? 'Guest'}</p>;
}`, "Requires an Auth.js project exporting auth from its configured auth module."],
  kinde: ["Read server authentication", "app/page.tsx", `import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
export default async function Page() {
  const { isAuthenticated } = getKindeServerSession();
  return <p>{await isAuthenticated() ? 'Signed in' : 'Guest'}</p>;
}`, "Use in a configured Kinde Next.js project with its authentication routes and environment variables."],
  neon: ["Query the database clock", "clock.mjs", `import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql\`SELECT NOW() AS current_time\`;
console.log(rows[0].current_time);`, "Run on the server with DATABASE_URL set to a Neon connection string."],
  "t3-stack": ["Type a page prop", "Lesson.tsx", `type Props = { title: string; completed: boolean };
export default function Lesson({ title, completed }: Props) {
  return <p>{title}: {completed ? 'Done' : 'To do'}</p>;
}`, "Use a typed React component in a T3 app before connecting it to a server procedure."],
  "system-design": ["Estimate request throughput", "capacity.py", `daily_requests = 864_000
average_rps = daily_requests / (24 * 60 * 60)
peak_multiplier = 5
print('Average requests/sec:', average_rps)
print('Estimated peak:', average_rps * peak_multiplier)`, "Estimate average and peak traffic; the peak multiplier is an assumption to validate with measurements."],
  nestjs: ["Define a controller", "health.controller.ts", `import { Controller, Get } from '@nestjs/common';
@Controller('health')
export class HealthController {
  @Get()
  check() { return { status: 'ok' }; }
}`, "Register this controller in a Nest module, then request /health."],
  mongoose: ["Validate a document", "lesson.mjs", `import mongoose from 'mongoose';
const schema = new mongoose.Schema({ title: { type: String, required: true } });
const Lesson = mongoose.model('StarterLesson', schema);
const lesson = new Lesson({ title: 'Schemas' });
await lesson.validate();
console.log(lesson.title);`, "Validation runs locally without a database connection; saving requires connecting to MongoDB."],
};

export type DocsCodeExample = {
  level: "Simple" | "Medium" | "Hard" | "Complex";
  title: string;
  summary: string;
  files: AnswerFile[];
  runbook?: DocsProject;
};

export function getDocsCodeExamples(doc: OfficialTechnologyDoc): DocsCodeExample[] {
  const [title, path, code, summary] = starters[doc.id];
  const project = DOCS_PROJECTS[doc.id];
  const complex = COMPLEX_DOCS_PROJECTS[doc.id];
  const examples: DocsCodeExample[] = [
    { level: "Simple", title, summary, files: [{ path, code: code + "\n", note: "" }] },
    {
      level: "Medium", title: `${doc.title}: worked example`,
      summary: `${doc.codeExample.explanation} This focused example assumes the relevant runtime and dependencies are configured; use the complete project below for setup.`,
      files: [{ path: doc.codeExample.filename, code: doc.codeExample.code, note: "" }],
    },
    { level: "Hard", title: project.title, summary: project.summary, files: project.files },
  ];
  if (complex) examples.push({ level: "Complex", title: complex.title, summary: complex.summary, files: complex.files, runbook: complex });
  return examples.map(example => ({ ...example, files: example.files.filter(file => !/(^|\/)(\.gitignore|README\.md)$/i.test(file.path)) }));
}
