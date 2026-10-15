import type { LearningModule } from "./module";

export const VITEST_MODULE: LearningModule = {
  technology: "Vitest",
  definition: "Vitest is a next-generation testing framework powered by Vite: it reuses your Vite config and plugins, supports ESM, TypeScript and JSX out of the box, and offers a Jest-compatible API.",
  overview: "In a Vite-based or modern TypeScript project, Vitest removes the separate test toolchain: the same transforms, aliases and plugins that build the app also run the tests, so there is no Babel or ts-jest configuration to keep in sync. A smart watch mode reruns only the tests affected by a change, which keeps the feedback loop close to instant.",
  architecture: [
    { title: "Architecture: Vite's transform pipeline plus parallel workers", detail: "Vitest starts a Vite server and transforms each test file and its imports on demand through Vite's module runner, using the same plugins and resolve rules as the application. Test files run in parallel in a pool of workers (child processes with `forks`, the default, or `threads`), and each file is isolated in its own module graph by default so global state does not leak between files." },
    { title: "Under the hood: module graph and smart watch mode", detail: "Because Vite tracks the import graph, Vitest knows which test files depend on a changed module and reruns only those, similar to hot module replacement for tests. `vi.mock` calls are hoisted above imports so the mocked module is registered before the code under test loads it, and environments (`node`, `jsdom`, `happy-dom`) are selected per project or per file." },
    { title: "Core building blocks: the API, mocking, coverage and Browser Mode", detail: "`describe`, `it`/`test` and `expect` follow Jest's API, with snapshots, concurrent tests and type testing. The `vi` utility provides `vi.fn`, `vi.spyOn`, `vi.mock`, `vi.hoisted`, fake timers and `vi.stubEnv`. Coverage uses V8 or Istanbul with thresholds, `test.projects` runs several configurations in one process, and Browser Mode runs tests in real browsers through a provider such as Playwright when jsdom is not faithful enough." },
  ],
  code: [
    { path: "vitest.config.ts", code: `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      // Pure logic in Node; components in a DOM environment.
      { extends: true, test: { name: "unit", include: ["src/**/*.test.ts"], environment: "node" } },
      { extends: true, test: { name: "dom", include: ["src/**/*.test.tsx"], environment: "jsdom", setupFiles: ["./vitest.setup.ts"] } },
    ],
    coverage: { provider: "v8", thresholds: { lines: 80, branches: 75 } },
  },
});` },
    { path: "src/billing/retry.ts", code: `import { charge } from "./gateway";

/** Charges once, retrying a failure after a one-second backoff. */
export async function chargeWithRetry(amountCents: number) {
  try {
    return await charge(amountCents);
  } catch {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return charge(amountCents);
  }
}` },
    { path: "src/billing/retry.test.ts", note: "Module mocking plus fake timers", code: `import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chargeWithRetry } from "./retry";
import { charge } from "./gateway";

vi.mock("./gateway", () => ({ charge: vi.fn() }));   // hoisted above the imports

describe("chargeWithRetry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("retries a transient failure after the backoff", async () => {
    vi.mocked(charge)
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce({ id: "ch_1" });

    const result = chargeWithRetry(4999);
    await vi.advanceTimersByTimeAsync(1000);          // the 1s backoff passes instantly

    await expect(result).resolves.toEqual({ id: "ch_1" });
    expect(charge).toHaveBeenCalledTimes(2);
  });
});` },
  ],
  problem: { title: "A test toolchain that fights the build toolchain", scenario: "With a traditional runner, a modern TypeScript and ESM project needs a second set of transforms (Babel or ts-jest), duplicated path aliases and module mappers, and workarounds for ESM-only packages, and the whole suite re-transforms on every run. Configuration drifts from the app's build and feedback is slow. Vitest runs tests through the same Vite pipeline as the app, so aliases, plugins and ESM simply work, and its module-graph-aware watch mode reruns only what changed." },
  useCases: [
    { title: "Unit testing business logic in a TypeScript monorepo", scenario: "A fintech team tests pricing, tax and retry logic across several packages with `test.projects`, running node-environment suites in parallel workers and enforcing coverage thresholds in CI, with no separate TypeScript compilation step for tests." },
    { title: "Component testing for React or Vue apps", scenario: "A design-system team renders components with Testing Library in a jsdom project for fast feedback, and runs interaction-heavy components (focus management, layout, drag and drop) in Browser Mode with the Playwright provider for real-browser fidelity." },
    { title: "Migrating a slow Jest suite", scenario: "An engineering team moves a large Jest suite to Vitest by switching imports to `vitest` and replacing `jest.*` with `vi.*`, reusing the Vite config's aliases. Watch mode now reruns only affected files, and CI time drops because ESM and TypeScript need no extra transform layer." },
  ],
  subjective: [
    { rating: "High / Common", question: "How does Vitest differ from Jest internally, and when would you still choose Jest?", answer: "Vitest transforms code through Vite's pipeline, so it inherits the project's plugins, aliases and native ESM handling, with TypeScript and JSX supported out of the box; Jest uses its own transform layer (Babel or ts-jest) and a CommonJS-first module system, where ESM support is still more involved. Vitest's watch mode uses Vite's module graph to rerun only affected tests, and its API is largely Jest-compatible (`vi` instead of `jest`). You might keep Jest for a large stable suite with deep reliance on Jest-specific features or custom environments, a React Native project where Jest is the standard, or when a migration's cost outweighs the speed gains." },
    { rating: "Critical for Senior Roles", question: "Explain how `vi.mock` hoisting works and the common bugs it causes. When would you use `vi.spyOn` or dependency injection instead?", answer: "`vi.mock(path, factory)` is moved to the top of the file before any imports, so the mock is registered before the module under test imports its dependency. The consequence is that the factory cannot reference variables declared at the top level of the test file, because they do not exist yet when it runs; values the factory needs must come from `vi.hoisted(() => ...)`. Other bugs include mocking a path that does not match how the code imports it, and mocks leaking between tests when they are not reset with `clearAllMocks`, `resetAllMocks` or the `mockReset` config. Use `vi.spyOn` to observe or override one method of a real object while keeping the rest real, and prefer passing dependencies as parameters when you control the design, which makes tests simpler and less tied to module paths." },
    { rating: "Common for senior frontend and platform roles", question: "How do Vitest's pools and isolation settings affect speed and correctness, and when would you use Browser Mode instead of jsdom?", answer: "The default `forks` pool runs files in child processes, which is the most compatible with native modules and process-level APIs; `threads` uses worker threads and can be faster but is less compatible. With isolation on (the default), each test file gets a fresh module graph, which prevents state leaking at some cost in speed. Turning isolation off speeds up large suites but only works when tests do not rely on module-level state. Use Browser Mode when behaviour depends on real layout, CSS, focus, scrolling, Web APIs or events that jsdom only approximates; keep jsdom or happy-dom for fast logic-heavy component tests." },
  ],
  objective: [
    { question: "A `vi.mock` factory references a variable declared at the top of the test file and fails with a ReferenceError. Why?", options: ["`vi.mock` only works with default exports", "`vi.mock` is hoisted above the file's imports and variables, so the variable is not initialized yet; use `vi.hoisted`", "Factories must be synchronous", "The variable must be exported"], answer: 1, explanation: "Hoisting moves `vi.mock` before everything else, so ordinary top-level variables are still uninitialized when the factory runs; `vi.hoisted` declares values that are hoisted along with it. Named exports can be mocked, factories may be async, and exporting the variable changes nothing." },
    { question: "What is the default test pool in current Vitest versions?", options: ["`threads`", "`forks`", "`vmThreads`", "A single process with no isolation"], answer: 1, explanation: "Vitest uses `forks` (child processes) by default because it is the most compatible option. `threads` and `vmThreads` are opt-in alternatives, and isolation is enabled by default rather than running everything in one shared context." },
    { question: "Which Vitest feature runs tests inside a real browser instead of a simulated DOM?", options: ["`environment: \"jsdom\"`", "`environment: \"happy-dom\"`", "Browser Mode with a provider such as Playwright", "Snapshot testing"], answer: 2, explanation: "Browser Mode executes tests in real browsers through a provider like Playwright or WebdriverIO. jsdom and happy-dom are simulated DOM implementations running in Node, and snapshots are an assertion style, not an execution environment." },
  ],
  keyPoints: [
    "Tests run through the app's own Vite config: aliases, plugins and ESM just work.",
    "`vi.mock` is hoisted; use `vi.hoisted` for values its factory needs.",
    "`test.projects` runs several environments and configurations in one run.",
    "Browser Mode gives real-browser fidelity when jsdom is not enough.",
  ],
  sources: [
    { title: "Vitest guide", url: "https://vitest.dev/guide/" },
    { title: "Why Vitest", url: "https://vitest.dev/guide/why" },
    { title: "Mocking", url: "https://vitest.dev/guide/mocking" },
    { title: "Browser Mode", url: "https://vitest.dev/guide/browser/" },
  ],
};
