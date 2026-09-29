import type { DocsProject } from "./official-docs-projects";
import type { AnswerFile } from "./pro-learn/types";
import { COMPLEX_AI_PROJECTS } from "./official-docs-complex-ai";
import { COMPLEX_AWS_PROJECT } from "./official-docs-complex-aws";

const file = (path: string, code: string): AnswerFile => ({ path, code: code.trim() + "\n", note: "" });
const json = (path: string, value: unknown) => file(path, JSON.stringify(value, null, 2));
const step = (command: string, description: string) => ({ command, description });
const nodeRequirements = ["Node.js 22.12+ and npm.", "Save every file at its displayed path in a new, empty project folder."];
const manifest = (scripts: Record<string, string>, dependencies = {}, devDependencies = {}) => json("package.json", { name: "complex-docs-project", private: true, type: "module", scripts, dependencies, devDependencies });

const nodeFiles = [
  file("src/server.js", `import { createServer } from 'node:http';
import { createApp } from './app.js';
import { Store } from './store.js';
const store = new Store(process.env.DATA_FILE ?? 'data/tasks.json');
await store.load();
const server = createServer(createApp(store));
server.listen(3000, '127.0.0.1', () => console.log('Open http://localhost:3000'));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}`),
  file("src/store.js", `import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export class Store {
  tasks = [];
  queue = Promise.resolve();
  constructor(path) { this.path = path; }
  async load() {
    try { this.tasks = JSON.parse(await readFile(this.path, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  list() { return this.tasks.map(task => ({ ...task })); }
  update(change) {
    const result = this.queue.then(async () => {
      const next = this.list();
      const value = change(next);
      await mkdir(dirname(this.path), { recursive: true });
      await writeFile(this.path + '.tmp', JSON.stringify(next, null, 2));
      await rename(this.path + '.tmp', this.path);
      this.tasks = next;
      return value;
    });
    this.queue = result.catch(() => {});
    return result;
  }
  create(title) {
    return this.update(tasks => {
      const task = { id: randomUUID(), title, done: false };
      tasks.push(task);
      return task;
    });
  }
  complete(id) {
    return this.update(tasks => {
      const task = tasks.find(item => item.id === id);
      if (!task) return null;
      task.done = true;
      return task;
    });
  }
}`),
  file("src/app.js", `import { readFile } from 'node:fs/promises';
const home = new URL('../public/index.html', import.meta.url);
async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16384) throw Object.assign(new Error('Payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}
export function createApp(store) {
  return async (request, response) => {
    const send = (status, data) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(data));
    };
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/') {
        const html = await readFile(home);
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return response.end(html);
      }
      if (request.method === 'GET' && url.pathname === '/health') return send(200, { ok: true });
      if (request.method === 'GET' && url.pathname === '/tasks') return send(200, store.list());
      if (request.method === 'POST' && url.pathname === '/tasks') {
        const input = await body(request);
        if (typeof input?.title !== 'string' || !input.title.trim() || input.title.length > 120) {
          return send(400, { error: 'Title must contain 1–120 characters' });
        }
        return send(201, await store.create(input.title.trim()));
      }
      const match = url.pathname.match(/^\\/tasks\\/([^/]+)$/);
      if (request.method === 'PATCH' && match) {
        const task = await store.complete(match[1]);
        return task ? send(200, task) : send(404, { error: 'Task not found' });
      }
      send(404, { error: 'Route not found' });
    } catch (error) {
      send(error.status ?? 500, { error: error.status ? error.message : 'Internal error' });
    }
  };
}`),
  file("public/index.html", `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Task board</title>
<style>body{font:16px system-ui;max-width:640px;margin:48px auto;padding:16px;background:#f3f8f5}input,button{padding:10px;margin:4px}li{margin:12px 0}</style>
<h1>Persistent task board</h1>
<form id="form"><label>Task <input id="title" required maxlength="120"></label><button>Add task</button></form>
<p id="status" role="status"></p><ul id="tasks"></ul>
<script type="module">
const status = document.querySelector('#status');
async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}
async function refresh() {
  const tasks = await api('/tasks');
  document.querySelector('#tasks').replaceChildren(...tasks.map(task => {
    const li = document.createElement('li');
    li.textContent = task.title + (task.done ? ' — complete' : '');
    if (!task.done) {
      const button = document.createElement('button');
      button.textContent = 'Complete';
      button.onclick = async () => {
        try { await api('/tasks/' + task.id, { method: 'PATCH' }); await refresh(); }
        catch (error) { status.textContent = error.message; }
      };
      li.append(button);
    }
    return li;
  }));
}
document.querySelector('#form').onsubmit = async event => {
  event.preventDefault();
  try {
    await api('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: document.querySelector('#title').value }) });
    event.target.reset();
    status.textContent = 'Task saved';
    await refresh();
  } catch (error) { status.textContent = error.message; }
};
refresh().catch(error => { status.textContent = error.message; });
</script></html>`),
  file("test/api.test.js", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/store.js';
import { createApp } from '../src/app.js';
test('HTTP create, complete, validation, concurrency and persistence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'task-board-'));
  const store = new Store(join(dir, 'tasks.json'));
  await store.load();
  const server = createServer(createApp(store));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    assert.equal((await fetch(base)).status, 200);
    const create = title => fetch(base + '/tasks', { method: 'POST', body: JSON.stringify({ title }) });
    assert.equal((await create('')).status, 400);
    assert.equal((await fetch(base + '/tasks', { method: 'POST', body: '{' })).status, 400);
    const responses = await Promise.all([create('Learn Node'), create('Write tests')]);
    assert.ok(responses.every(response => response.status === 201));
    const task = await responses[0].json();
    assert.equal((await fetch(base + '/tasks/' + task.id, { method: 'PATCH' })).status, 200);
    assert.equal((await fetch(base + '/tasks/missing', { method: 'PATCH' })).status, 404);
    const reloaded = new Store(store.path);
    await reloaded.load();
    assert.equal(reloaded.list().length, 2);
    assert.equal(reloaded.list().find(item => item.id === task.id).done, true);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});`),
  manifest({ start: "node src/server.js", test: "node --test" }),
];

const nodeProject: DocsProject = {
  title: "Persistent task board: browser → API → disk",
  summary: "Build a browser UI, validated HTTP endpoints, serialized atomic file writes, and end-to-end API tests. Data survives a restart; the store is designed for one server process.",
  prerequisites: [...nodeRequirements, "Port 3000 must be free. This local learning app has no authentication."],
  files: nodeFiles,
  commands: [step("npm test", "Run isolated HTTP and persistence tests; no dependencies are needed."), step("npm start", "Start the server and open http://localhost:3000. Stop with Ctrl+C.")],
  verify: ["Add two tasks in the browser and complete one.", "Restart the server: both tasks and their completion state remain.", "npm test covers malformed JSON, invalid titles, missing tasks, parallel writes, and reloads."],
  points: ["Keep transport, storage, and UI separate.", "Commit in-memory state only after the disk write succeeds."],
};

const typescriptProject: DocsProject = {
  title: "Typed batch processor with retries and partial failures",
  summary: "Validate untrusted JSON, process jobs with bounded concurrency, retry transient failures, and write a typed success/failure report.",
  prerequisites: nodeRequirements,
  files: [
    file("src/main.ts", `import { readFile, writeFile } from 'node:fs/promises';
import { parseJobs } from './schema.js';
import { processBatch } from './worker.js';
const jobs = parseJobs(JSON.parse(await readFile('jobs.json', 'utf8')));
const report = await processBatch(jobs, async job => {
  if (job.value < 0) throw new Error('Negative values are not supported');
  return job.value * 2;
}, 2, 2);
await writeFile('report.json', JSON.stringify(report, null, 2));
console.log(report);`),
    file("src/schema.ts", `export type Job = { id: string; value: number };
export function parseJobs(input: unknown): Job[] {
  if (!Array.isArray(input)) throw new Error('Expected an array');
  const ids = new Set<string>();
  return input.map((item: unknown) => {
    if (!item || typeof item !== 'object' || !('id' in item) || !('value' in item)
      || typeof item.id !== 'string' || !item.id.trim() || typeof item.value !== 'number'
      || !Number.isFinite(item.value) || ids.has(item.id)) throw new Error('Invalid or duplicate job');
    ids.add(item.id);
    return { id: item.id, value: item.value };
  });
}`),
    file("src/worker.ts", `import type { Job } from './schema.js';
export type Result = { id: string; ok: true; value: number; attempts: number }
  | { id: string; ok: false; error: string; attempts: number };
export async function processBatch(jobs: Job[], work: (job: Job) => Promise<number>, concurrency = 2, maxAttempts = 3): Promise<Result[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1 || !Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error('Limits must be positive integers');
  }
  const results: Result[] = new Array(jobs.length);
  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const index = cursor++;
      const job = jobs[index];
      for (let attempts = 1; attempts <= maxAttempts; attempts++) {
        try {
          results[index] = { id: job.id, ok: true, value: await work(job), attempts };
          break;
        } catch (error) {
          if (attempts === maxAttempts) {
            results[index] = { id: job.id, ok: false, error: String(error), attempts };
          } else await new Promise(resolve => setTimeout(resolve, 10 * 2 ** (attempts - 1)));
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  return results;
}`),
    file("src/worker.test.ts", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJobs } from './schema.js';
import { processBatch } from './worker.js';
test('validates inputs and preserves order through retry and failure', async () => {
  assert.throws(() => parseJobs([{ id: 'a', value: 1 }, { id: 'a', value: 2 }]));
  let active = 0;
  let peak = 0;
  const attempts = new Map<string, number>();
  const results = await processBatch(parseJobs([{ id: 'a', value: 1 }, { id: 'b', value: -1 }, { id: 'c', value: 3 }]), async job => {
    active++; peak = Math.max(peak, active);
    try {
      await new Promise(resolve => setTimeout(resolve, 5));
      const count = (attempts.get(job.id) ?? 0) + 1;
      attempts.set(job.id, count);
      if (job.value < 0 || count === 1) throw new Error('Retry');
      return job.value * 2;
    } finally { active--; }
  }, 2, 2);
  assert.ok(peak <= 2);
  assert.deepEqual(results.map(result => result.ok), [true, false, true]);
  assert.deepEqual(results.map(result => result.id), ['a', 'b', 'c']);
  assert.ok(results.every(result => result.attempts === 2));
});`),
    json("jobs.json", [{ id: "first", value: 10 }, { id: "second", value: -1 }, { id: "third", value: 30 }]),
    json("tsconfig.json", { compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, outDir: "dist", types: ["node"] }, include: ["src"] }),
    manifest({ build: "tsc", start: "npm run build && node dist/main.js", test: "npm run build && node --test dist/worker.test.js" }, {}, { typescript: "^5.9.0", "@types/node": "^22.0.0" }),
  ],
  commands: [step("npm install", "Install the compiler and Node types."), step("npm test", "Compile and verify validation, concurrency, retries, and ordering."), step("npm start", "Run the batch and write report.json.")],
  verify: ["report.json contains successes for first and third, and a failure for second after two attempts.", "Duplicate IDs fail validation before any job runs."],
  points: ["Use a discriminated union for success and failure.", "Retry only operations that are safe to repeat; this example doubles numbers."],
};

const puzzleProject: DocsProject = {
  title: "Async puzzle lab: memoization, concurrency, and failures",
  summary: "Build a promise memoizer that shares in-flight work and evicts rejected promises, then explore event-loop ordering with executable assertions.",
  prerequisites: nodeRequirements,
  files: [
    file("src/memoize.js", `export function memoizeAsync(fn) {
  const cache = new Map();
  return function (key) {
    if (!cache.has(key)) {
      const pending = Promise.resolve().then(() => fn(key));
      cache.set(key, pending);
      pending.catch(() => { if (cache.get(key) === pending) cache.delete(key); });
    }
    return cache.get(key);
  };
}`),
    file("src/event-loop.js", `export async function eventOrder() {
  const order = ['sync'];
  const timer = new Promise(resolve => setTimeout(() => { order.push('timer'); resolve(); }, 0));
  queueMicrotask(() => order.push('microtask'));
  Promise.resolve().then(() => order.push('promise'));
  order.push('end');
  await timer;
  return order;
}`),
    file("src/main.js", `import { memoizeAsync } from './memoize.js';
import { eventOrder } from './event-loop.js';
let calls = 0;
const load = memoizeAsync(async key => { calls++; return { key }; });
const [a, b] = await Promise.all([load('lesson'), load('lesson')]);
console.log({ calls, sameObject: a === b });
console.log(await eventOrder());`),
    file("test/puzzles.test.js", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoizeAsync } from '../src/memoize.js';
import { eventOrder } from '../src/event-loop.js';
test('shares concurrent work for the same key', async () => {
  let calls = 0;
  const load = memoizeAsync(async key => { calls++; return { key }; });
  const first = load('a');
  assert.equal(first, load('a'));
  assert.deepEqual(await first, { key: 'a' });
  assert.equal(calls, 1);
});
test('a rejection is evicted and retried; other keys are independent', async () => {
  let calls = 0;
  const load = memoizeAsync(key => { if (++calls === 1) throw new Error('offline'); return key; });
  await assert.rejects(load('a'), /offline/);
  assert.equal(await load('a'), 'a');
  assert.equal(await load('b'), 'b');
  assert.equal(calls, 3);
});
test('microtasks precede timers', async () => {
  assert.deepEqual(await eventOrder(), ['sync', 'end', 'microtask', 'promise', 'timer']);
});`),
    manifest({ start: "node src/main.js", test: "node --test" }),
  ],
  commands: [step("npm test", "Run all three puzzle assertions."), step("npm start", "Print the shared-work result and event-loop order.")],
  verify: ["The program prints calls: 1 and sameObject: true.", "The timer appears after both microtasks.", "The retry test proves rejected promises do not poison the cache."],
  points: ["Cache the promise before awaiting it.", "This exercise has no TTL or capacity bound; add those before using a long-lived cache."],
};

const nestProject: DocsProject = {
  title: "Validated Nest.js task API with dependency injection",
  summary: "Wire a module, controller, service, DTO validation, and real HTTP integration tests. Create tasks, update completion, and verify 400/404 responses.",
  prerequisites: [...nodeRequirements, "Port 3000 for the demo; tests allocate a free port. State is in memory and resets on restart."],
  files: [
    file("src/main.ts", `import { createApp } from './app.js';
const app = await createApp();
app.enableShutdownHooks();
await app.listen(3000, '127.0.0.1');
console.log('Task API: http://localhost:3000/tasks');`),
    file("src/app.ts", `import 'reflect-metadata';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
@Module({ controllers: [TasksController], providers: [TasksService] })
class AppModule {}
export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  return app;
}`),
    file("src/tasks.dto.ts", `import { IsBoolean, IsString, Length, Matches } from 'class-validator';
export class CreateTask {
  @IsString() @Length(1, 120) @Matches(/\\S/) title!: string;
}
export class UpdateTask {
  @IsBoolean() done!: boolean;
}`),
    file("src/tasks.service.ts", `import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
type Task = { id: string; title: string; done: boolean };
@Injectable()
export class TasksService {
  private tasks = new Map<string, Task>();
  list() { return [...this.tasks.values()]; }
  create(title: string) {
    const task = { id: randomUUID(), title: title.trim(), done: false };
    this.tasks.set(task.id, task);
    return task;
  }
  update(id: string, done: boolean) {
    const task = this.tasks.get(id);
    if (!task) throw new NotFoundException('Task not found');
    task.done = done;
    return task;
  }
}`),
    file("src/tasks.controller.ts", `import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { CreateTask, UpdateTask } from './tasks.dto.js';
@Controller('tasks')
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasks: TasksService) {}
  @Get() list() { return this.tasks.list(); }
  @Post() create(@Body() input: CreateTask) { return this.tasks.create(input.title); }
  @Patch(':id') update(@Param('id', new ParseUUIDPipe()) id: string, @Body() input: UpdateTask) {
    return this.tasks.update(id, input.done);
  }
}`),
    file("src/api.test.ts", `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
test('Nest routes validate and mutate tasks', async () => {
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const send = (path: string, body: unknown, method = 'POST') => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await send('/tasks', { title: '' })).status, 400);
    assert.equal((await send('/tasks', { title: 'Valid', extra: true })).status, 400);
    const response = await send('/tasks', { title: 'Learn Nest' });
    assert.equal(response.status, 201);
    const task = await response.json() as { id: string };
    const update = await send('/tasks/' + task.id, { done: true }, 'PATCH');
    assert.equal(update.status, 200);
    assert.equal((await update.json() as { done: boolean }).done, true);
    assert.equal((await send('/tasks/00000000-0000-4000-8000-000000000000', { done: true }, 'PATCH')).status, 404);
    assert.equal((await send('/tasks/not-a-uuid', { done: true }, 'PATCH')).status, 400);
  } finally { await app.close(); }
});`),
    file("requests.http", `### Create a task; use the returned id in the next request
POST http://localhost:3000/tasks
Content-Type: application/json

{"title":"Learn dependency injection"}

### List tasks
GET http://localhost:3000/tasks

### Complete a task (replace the id)
PATCH http://localhost:3000/tasks/PASTE_RETURNED_ID
Content-Type: application/json

{"done":true}`),
    json("tsconfig.json", { compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", experimentalDecorators: true, emitDecoratorMetadata: true, strict: true, skipLibCheck: true, outDir: "dist" }, include: ["src"] }),
    manifest({ build: "tsc", start: "npm run build && node dist/main.js", test: "npm run build && node --test dist/api.test.js" }, { "@nestjs/common": "^11.0.0", "@nestjs/core": "^11.0.0", "@nestjs/platform-express": "^11.0.0", "reflect-metadata": "^0.2.2", rxjs: "^7.8.0", "class-validator": "^0.14.0", "class-transformer": "^0.5.1" }, { typescript: "^5.9.0", "@types/node": "^22.0.0" }),
  ],
  commands: [step("npm install", "Install the Nest 11 learning project and compiler."), step("npm test", "Compile and run the HTTP integration tests."), step("npm start", "Start the API. Use requests.http with an HTTP client to create and complete tasks.")],
  verify: ["POST /tasks creates a task; GET /tasks lists it.", "PATCH with the returned ID changes done to true.", "Invalid DTOs produce 400 and an unknown valid UUID produces 404."],
  points: ["The module resolves service dependencies.", "Validation checks request data before the controller runs."],
};

const ciProject: DocsProject = {
  ...nodeProject,
  title: "Matrix CI for a persistent Node.js application",
  summary: "Run the complete task-board application through a Node version matrix, test its HTTP endpoints, and publish test reports as artifacts. Includes the application source and local test command.",
  files: [...nodeFiles, file(".github/workflows/ci.yml", `name: Task board CI
on: [push, pull_request, workflow_dispatch]
permissions:
  contents: read
concurrency:
  group: task-board-\${{ github.ref }}
  cancel-in-progress: true
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    strategy:
      fail-fast: false
      matrix:
        node: [22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
      - name: Run HTTP and persistence tests
        run: node --test --test-reporter=junit --test-reporter-destination=results.xml
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: results-node-\${{ matrix.node }}
          path: results.xml
          if-no-files-found: error
          retention-days: 7`)],
  prerequisites: [...nodeRequirements, "A GitHub repository with Actions enabled is needed for the hosted matrix. Local tests require no account."],
  commands: [...nodeProject.commands, step("node --test --test-reporter=junit --test-reporter-destination=results.xml", "After stopping the server, produce the same report used by CI. Commit the supplied files to your repository to run the hosted workflow.")],
  verify: ["Local tests pass and results.xml contains test results.", "After a push, both Node 22 and Node 24 jobs pass in Actions and provide separate artifacts."],
};

export const COMPLEX_DOCS_PROJECTS: Record<string, DocsProject> = {
  nodejs: nodeProject, nestjs: nestProject, aws: COMPLEX_AWS_PROJECT, cicd: ciProject,
  typescript: typescriptProject, "javascript-puzzles": puzzleProject, ...COMPLEX_AI_PROJECTS,
};

for (const [id, project] of Object.entries(COMPLEX_DOCS_PROJECTS)) {
  project.files = project.files.map(source => source.path === "package.json"
    ? json(source.path, { ...JSON.parse(source.code), name: `docs-complex-${id}` })
    : source);
  project.files = [...project.files,
    file(".gitignore", "node_modules/\ndist/\ndata/tasks.json\nreport.json\nresults.xml\n.venv/\n__pycache__/\n.env\n.aws-sam/"),
    file("README.md", `# ${project.title}\n\n${project.summary}\n\n## Prerequisites\n${project.prerequisites.map(text => "- " + text).join("\n")}\n\n## Run\nSave all files in a new folder, retaining the shown paths.\n\n${project.commands.map(item => item.description + "\n\n\`\`\`sh\n" + item.command + "\n\`\`\`").join("\n\n")}\n\n## Verify\n${project.verify.map(text => "- " + text).join("\n")}\n\n## Design notes\n${project.points.map(text => "- " + text).join("\n")}\n\nTopic: ${id}. Local educational project; see the official reference linked from the guide.`),
  ];
}
