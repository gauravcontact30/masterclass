import type { DocsProject } from "./official-docs-projects";
import type { AnswerFile } from "./pro-learn/types";
import { inventoryProject, INVENTORY_SCENARIO } from "./official-docs-inventory";

const file = (path: string, code: string): AnswerFile => ({ path, code: code.trim() + "\n", note: "" });
const command = (command: string, description: string) => ({ command, description });

// These projects extend the Hard implementation with executable acceptance
// scenarios. Keep the app, dependencies and setup together: a test alone is
// not a complete codebase. Dedicated Complex applications take precedence.
const browserScenarios: Record<string, string> = {
  react: `await expect(page.getByText('Completed: 0')).toBeVisible();
  await page.getByRole('button', { name: 'Complete a lesson' }).click();
  await page.getByRole('button', { name: 'Complete a lesson' }).click();
  await expect(page.getByText('Completed: 2')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Completed: 0')).toBeVisible();`,
  zustand: `await expect(page.getByText('Count: 0')).toBeVisible();
  await page.getByRole('button', { name: 'Increment' }).click();
  await expect(page.getByText('Count: 1')).toBeVisible();`,
  redux: `await expect(page.getByText('Count: 0')).toBeVisible();
  await page.getByRole('button', { name: 'Increment' }).click();
  await expect(page.getByText('Count: 1')).toBeVisible();`,
  rtk: `await expect(page.getByText('Count: 0')).toBeVisible();
  await page.getByRole('button', { name: 'Increment' }).click();
  await expect(page.getByText('Count: 1')).toBeVisible();`,
  tailwind: `await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();`,
  tanstack: `await expect(page.getByRole('listitem')).toHaveCount(2);
  await page.route('**/lessons.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.reload();
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 20000 });`,
  nextjs: `await expect(page.getByRole('listitem')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Find a lesson' }).fill('server');
  await expect(page.getByRole('listitem')).toHaveText(['Server components']);
  await page.getByRole('textbox').fill('missing');
  await expect(page.getByText('No lessons found.')).toBeVisible();
  await page.getByRole('textbox').fill('');
  await expect(page.getByRole('listitem')).toHaveCount(2);`,
  "react-hooks": `await page.getByRole('textbox', { name: 'Search' }).fill('refs');
  await expect(page.getByRole('listitem')).toHaveText(['Refs']);
  await expect(page).toHaveTitle('1 lessons');
  await page.getByRole('button', { name: 'Focus search' }).click();
  await expect(page.getByRole('textbox')).toBeFocused();
  await page.getByRole('textbox').fill('missing');
  await expect(page.getByText('No matching lessons.')).toBeVisible();`,
  "nextjs-hooks": `await page.goto('/?sort=newest');
  await page.getByRole('textbox', { name: 'Search' }).fill('cache');
  await expect(page).toHaveURL(/q=cache/);
  expect(new URL(page.url()).searchParams.get('sort')).toBe('newest');
  await page.reload();
  await expect(page.getByRole('textbox')).toHaveValue('cache');
  await page.getByRole('textbox').fill('');
  await expect(page).not.toHaveURL(/[?&]q=/);`,
  "tanstack-form": `await page.getByRole('textbox', { name: 'Name' }).fill('A');
  await expect(page.getByText('Enter at least two characters')).toBeVisible();
  await page.getByRole('textbox').fill('Ada');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved: Ada')).toBeVisible();`,
  conform: `await page.getByRole('textbox', { name: 'Email' }).fill('invalid');
  await page.getByRole('button', { name: 'Validate' }).click();
  await expect(page.getByRole('status')).not.toContainText('Validated successfully');
  await page.getByRole('textbox').fill('learner@example.com');
  await page.getByRole('button', { name: 'Validate' }).click();
  await expect(page.getByRole('status')).toContainText('Validated successfully');`,
  "t3-stack": `await page.getByRole('button', { name: 'Greet' }).click();
  await expect(page.getByRole('status')).toHaveText('Hello, Ada!');
  await page.getByRole('textbox', { name: 'Name' }).fill('');
  await page.getByRole('button', { name: 'Greet' }).click();
  await expect(page.getByRole('status')).toHaveText('Enter a name between 1 and 50 characters.');`,
  "tanstack-start": `await expect(page.getByRole('listitem')).toHaveText(['Typed routes', 'Server rendering']);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lessons' })).toBeVisible();`,
  clerk: `await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  const response = await page.request.get('/api/me', { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(500);`,
  authjs: `await expect(page.getByRole('button', { name: 'Sign in with GitHub' })).toBeVisible();
  const response = await page.request.get('/api/auth/session');
  expect(response.ok()).toBe(true);
  expect(await response.json()).toBeNull();`,
  kinde: `await expect(page.getByRole('heading', { name: 'Kinde sign-in' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute('href', /api.*auth.*login/);
  await expect(page.getByRole('link', { name: 'Sign out' })).toHaveCount(0);`,
  inngest: `await expect(page.getByRole('heading', { name: 'Task processor' })).toBeVisible();
  const registration = await page.request.get('/api/inngest');
  expect(registration.ok()).toBe(true);
  const submitted = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/');
  await page.getByRole('button', { name: 'Send demo task' }).click();
  expect((await submitted).ok()).toBe(true);`,
  arcjet: `await expect(page.getByRole('link', { name: 'Request protected JSON' })).toBeVisible();
  const statuses = [];
  for (let index = 0; index < 7; index++) {
    const response = await page.request.get('/api/protected');
    statuses.push(response.status());
    expect([200, 429]).toContain(response.status());
  }
  expect(statuses).toContain(429);`,
};

function withReadme(project: DocsProject): DocsProject {
  const readme = `# ${project.title}\n\n${project.summary}\n\n## Prerequisites\n${project.prerequisites.map(text => "- " + text).join("\n")}\n\n## Run\n${project.commands.map(step => `${step.description}\n\n\`\`\`sh\n${step.command}\n\`\`\``).join("\n\n")}\n\n## Verify\n${project.verify.map(text => "- " + text).join("\n")}`;
  return { ...project, files: [...project.files.filter(entry => entry.path !== "README.md"), file("README.md", readme)] };
}

function browserProject(id: string, base: DocsProject): DocsProject {
  const inventory = ["react", "react-hooks", "nextjs", "nextjs-hooks"].includes(id);
  if (inventory) base = inventoryProject(id, base);
  const manifestFile = base.files.find(entry => entry.path === "package.json")!;
  const manifest = JSON.parse(manifestFile.code);
  manifest.devDependencies = { ...manifest.devDependencies, "@playwright/test": "^1.58.0" };
  manifest.scripts["test:acceptance"] = "playwright test --config acceptance/playwright.config.mjs";
  const nextApp = Boolean(manifest.dependencies?.next);
  const port = nextApp ? 3000 : 5173;
  const server = nextApp ? "npm start -- --hostname 127.0.0.1 --port 3000" : "npm start -- --host 127.0.0.1 --port 5173 --strictPort";
  // Hosted authentication callbacks use localhost; keep that origin intact.
  const origin = ["clerk", "authjs", "kinde"].includes(id) ? "localhost" : "127.0.0.1";
  return withReadme({
    ...base,
    title: `${base.title} — acceptance-tested codebase`,
    summary: `${base.summary} Extend the Hard example with browser-driven acceptance checks, isolated sessions, and failure traces. All application and configuration files are included.`,
    prerequisites: [...base.prerequisites, "Install Chromium with the command below. Keep the app port free: the test runner starts and stops its own server.", ...(id === "inngest" ? ["Start the local Inngest development server in a separate terminal before running acceptance tests."] : []), ...(id === "arcjet" ? ["Use a development Arcjet key and wait for the token bucket to refill before re-running the rate-limit scenario."] : [])],
    files: [...base.files.filter(entry => entry.path !== "package.json"), file("package.json", JSON.stringify(manifest, null, 2)),
      file("acceptance/playwright.config.mjs", `import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'workflow.spec.mjs',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://${origin}:${port}', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: { command: ${JSON.stringify(server)}, cwd: '..', url: 'http://${origin}:${port}', reuseExistingServer: false, timeout: 120000 },
});`),
      file("acceptance/workflow.spec.mjs", `import { test, expect } from '@playwright/test';
test('complete user workflow and boundary behavior', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  ${inventory ? INVENTORY_SCENARIO : browserScenarios[id]}
  expect(pageErrors).toEqual([]);
});${inventory ? `
test('recovers from corrupted saved inventory', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('docs-inventory-v1', '{invalid'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Saved data could not be loaded');
  await expect(page.getByRole('status')).toContainText('12 units in stock');
});` : ""}`),
    ],
    commands: [command("npm install", "Install app dependencies and Playwright."), command("npx playwright install chromium", "Install the browser used by the acceptance suite."), ...(inventory ? [command(`node ${nextApp ? "app" : "src"}/inventory.test.mjs`, "Check stock limits, saved-data validation, and immutable updates.")] : []), ...(id === "inngest" ? [command("npx inngest-cli@latest dev -u http://localhost:3000/api/inngest", "Keep this running in a separate terminal for event delivery.")] : []), command("npm run test:acceptance", "Run the full workflow; Playwright starts and stops the application server."), command("npm start", "After the tests finish, start the app to explore it manually.")],
    verify: ["The acceptance suite passes with no uncaught browser errors.", "Inspect acceptance/workflow.spec.mjs for the exact user actions and expected results.", ...base.verify, ...(["clerk", "authjs", "kinde"].includes(id) ? ["Automation covers the signed-out boundary. Complete a real provider login manually using your development account to verify the authenticated flow."] : [])],
  });
}

const httpScenarios: Record<string, { port: number; code: string }> = {
  graphql: { port: 3000, code: `const query = source => request('/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: source }) });
const valid = await query('{ lessons { id title } }');
assert.equal(valid.status, 200);
assert.deepEqual((await valid.json()).data.lessons, [{ id: '1', title: 'GraphQL basics' }]);
const invalid = await query('{ lessons { missingField } }');
assert.ok((await invalid.json()).errors.length > 0);
assert.equal((await request('/graphql', { method: 'POST', body: '{' })).status, 400);` },
  fastapi: { port: 8000, code: `assert.equal((await request('/lessons')).status, 200);
const create = title => request('/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
assert.equal((await create('')).status, 422);
const title = 'Acceptance ' + crypto.randomUUID();
const saved = await create(title);
assert.ok(saved.ok);
const records = await (await request('/lessons')).json();
assert.ok(records.some(item => item.title === title));` },
  golang: { port: 8080, code: `const response = await request('/lessons');
assert.equal(response.status, 200);
assert.ok(response.headers.get('content-type')?.includes('application/json'));
assert.equal((await response.json()).length, 2);
assert.equal((await request('/missing')).status, 404);` },
  redis: { port: 3000, code: `const first = await request('/lessons');
assert.ok(first.ok);
const data = await first.json();
assert.ok(data.length > 0);
const second = await request('/lessons');
assert.equal(second.headers.get('x-cache'), 'HIT');
assert.deepEqual(await second.json(), data);
const results = await Promise.all(Array.from({ length: 8 }, () => request('/lessons')));
assert.ok(results.every(response => response.ok && response.headers.get('x-cache') === 'HIT'));` },
  "system-design": { port: 3000, code: `await request('/lessons');
const before = await (await request('/metrics')).json();
await request('/lessons');
const after = await (await request('/metrics')).json();
assert.ok(after.hits > before.hits);
assert.equal((await request('/missing')).status, 404);` },
};
for (const id of ["docker", "devops", "kubernetes"]) {
  httpScenarios[id] = { port: id === "kubernetes" ? 8080 : 3000, code: `assert.deepEqual(await (await request('/health')).json(), { ok: true });
const responses = await Promise.all(Array.from({ length: 8 }, () => request('/lessons')));
for (const response of responses) {
  assert.equal(response.status, 200);
  assert.equal((await response.json()).length, 2);
}
assert.equal((await request('/missing')).status, 404);` };
}

// The verifier executes programs directly with argument arrays, never via a
// shell, and checks observable output as well as exit status.
const cliScenarios: Record<string, { executable: string; args: string[]; expected: string }> = {
  "javascript-features": { executable: "node", args: ["src/main.js"], expected: "35" },
  "javascript-info": { executable: "node", args: ["src/main.js"], expected: "35" },
  git: { executable: "node", args: ["src/main.js"], expected: "35" },
  python: { executable: "python", args: ["main.py"], expected: "35" },
  uv: { executable: "uv", args: ["run", "main.py"], expected: "35" },
  rust: { executable: "cargo", args: ["run", "--quiet"], expected: "35" },
  drizzle: { executable: "node", args: ["src/main.js"], expected: "Drizzle basics" },
  prisma: { executable: "node", args: ["src/main.js"], expected: "Prisma basics" },
  postgresql: { executable: "node", args: ["src/main.js"], expected: "Parameterized queries" },
  supabase: { executable: "node", args: ["--env-file=.env", "src/main.js"], expected: "Row level security" },
  upstash: { executable: "node", args: ["--env-file=.env", "src/main.js"], expected: "HTTP Redis" },
  neon: { executable: "node", args: ["--env-file=.env", "src/main.js"], expected: "Postgres over HTTP" },
  mongoose: { executable: "node", args: ["--env-file=.env", "src/main.js"], expected: "Schema validation" },
  zod: { executable: "node", args: ["src/main.js"], expected: "learner@example.com" },
  vitest: { executable: "node", args: ["node_modules/vitest/vitest.mjs", "run"], expected: "passed" },
  jest: { executable: "node", args: ["node_modules/jest/bin/jest.js", "--runInBand"], expected: "PASS" },
  "react-testing-library": { executable: "node", args: ["node_modules/vitest/vitest.mjs", "run"], expected: "passed" },
  playwright: { executable: "node", args: ["node_modules/@playwright/test/cli.js", "test"], expected: "passed" },
  cypress: { executable: "node", args: ["node_modules/cypress/bin/cypress", "run"], expected: "All specs passed" },
  webhook: { executable: "node", args: ["--env-file=.env", "src/send.js"], expected: "Invalid signature" },
};

export function createAcceptanceProjects(projects: Record<string, DocsProject>, dedicated: Record<string, DocsProject>): Record<string, DocsProject> {
  return Object.fromEntries(Object.entries(projects).filter(([id]) => !dedicated[id]).map(([id, base]) => {
    if (browserScenarios[id]) return [id, browserProject(id, base)];
    const http = httpScenarios[id];
    const cli = cliScenarios[id];
    if (!http && !cli) throw new Error(`Missing Complex acceptance scenario: ${id}`);
    const code = http
      ? `import assert from 'node:assert/strict';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:${http.port}';
const request = (path, options = {}) => fetch(new URL(path, base), { ...options, signal: AbortSignal.timeout(10000) });
${http.code}
console.log('Acceptance checks passed.');`
      : `import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const executable = ${JSON.stringify(cli.executable)} === 'node' ? process.execPath : ${JSON.stringify(cli.executable)};
// A second run catches programs that accidentally depend on fresh state.
for (let run = 1; run <= 2; run++) {
  const result = spawnSync(executable, ${JSON.stringify(cli.args)}, { encoding: 'utf8', timeout: 120000, env: { ...process.env, NO_COLOR: '1' } });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok((result.stdout + result.stderr).includes(${JSON.stringify(cli.expected)}), 'Expected output missing: ' + result.stdout + result.stderr);
  console.log('Acceptance run', run, 'passed');
}`;
    const verifyStep = command("node acceptance/verify.mjs", http || ["cypress", "webhook"].includes(id) ? "Keep the service running. In a second terminal, run the acceptance checks before cleanup." : "After the setup steps above, run the program twice and check its output automatically.");
    const steps = [...base.commands];
    const cleanup = steps.findIndex(step => /docker compose down|kubectl .* delete/.test(step.command));
    steps.splice(cleanup < 0 ? steps.length : cleanup, 0, verifyStep);
    return [id, withReadme({ ...base,
      title: `${base.title} — verified workflow`,
      summary: `${base.summary} Extend the Hard implementation with ${http ? "HTTP acceptance checks for the running service" : "a repeatable process-level acceptance runner"}. Includes the entire codebase, setup, and verification.`,
      prerequisites: [...base.prerequisites, "Node.js 22.12+ for the acceptance runner.", ...(http ? ["Start the service with the steps below and keep it running while the verifier runs in a second terminal."] : [])],
      files: [...base.files, file("acceptance/verify.mjs", code)], commands: steps,
      verify: [...base.verify, http ? "The verifier prints Acceptance checks passed; a wrong status or response fails the run." : "Both acceptance runs pass; nonzero exit codes or missing expected output fail the verification."],
    })];
  }));
}
