import type { LearningModule } from "./module";

export const PLAYWRIGHT_MODULE: LearningModule = {
  technology: "Playwright",
  definition: "Playwright Test is an end-to-end test framework for modern web apps that bundles a test runner, assertions, isolation, parallelization and rich tooling, and runs on Chromium, WebKit and Firefox across Windows, Linux and macOS.",
  overview: "End-to-end tests are the only tests that prove a real user can complete a real journey, and they used to be the slowest and flakiest in the suite. Playwright reduces that flakiness at the framework level: actions wait for elements to be actionable, assertions retry until they pass, each test gets a fresh browser context, and when something does fail the trace viewer replays exactly what happened.",
  architecture: [
    { title: "Architecture: runner, workers and browser contexts", detail: "`@playwright/test` discovers test files and runs them in parallel worker processes. Each worker launches a browser and gives every test a new `BrowserContext`, an isolated profile with its own cookies, storage and cache, so tests cannot leak state into each other while still avoiding the cost of a new browser per test. Projects in `playwright.config.ts` run the same tests against different browsers, devices or settings." },
    { title: "Under the hood: auto-waiting and web-first assertions", detail: "Playwright drives browsers over their automation protocols rather than injecting scripts. Before an action such as `click`, it checks that the element is attached, visible, stable, enabled and receives events, retrying until the timeout. Locators are lazy and re-resolved on every use, so they survive re-renders. Assertions like `toBeVisible` and `toHaveText` poll until the condition holds, which removes most hand-written waits and sleeps." },
    { title: "Core building blocks: locators, fixtures, network control and tooling", detail: "User-facing locators (`getByRole`, `getByLabel`, `getByText`, `getByTestId`) mirror how people find things. Fixtures such as `page`, `context` and `request` are injected per test, and `test.extend` adds your own with test or worker scope. `page.route` mocks or modifies network traffic, `storageState` reuses authentication, and the tooling (codegen, UI mode, trace viewer, HTML report) covers writing, debugging and diagnosing CI failures." },
  ],
  code: [
    { path: "playwright.config.ts", code: `import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",              // a full replay for every flaky failure
  },
  projects: [
    { name: "setup", testMatch: /auth\\.setup\\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" },
      dependencies: ["setup"],            // sign in once, reuse everywhere
    },
  ],
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: !process.env.CI },
});` },
    { path: "e2e/auth.setup.ts", code: `import { test as setup, expect } from "@playwright/test";

setup("sign in", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.context().storageState({ path: "playwright/.auth/user.json" });
});` },
    { path: "e2e/checkout.spec.ts", note: "Mock a failing payment and assert what the user sees", code: `import { test, expect } from "@playwright/test";

test("shows a clear error when the card is declined", async ({ page }) => {
  // Deterministic failure: no real payment provider involved.
  await page.route("**/api/payments", route =>
    route.fulfill({ status: 402, json: { error: "Card declined" } }),
  );

  await page.goto("/checkout");
  await page.getByRole("button", { name: "Pay now" }).click();

  // Web-first assertion: retries until the alert shows this text or times out.
  await expect(page.getByRole("alert")).toHaveText("Card declined");
  await expect(page).toHaveURL(/\\/checkout$/);
});` },
  ],
  problem: { title: "Flaky, slow end-to-end tests nobody trusts", scenario: "Without Playwright, teams write E2E tests full of sleeps and retries, share one browser session so tests depend on each other, test only in Chrome, and debug CI failures from a single screenshot. The suite becomes slow and flaky, so it gets ignored. Playwright's actionability checks and retrying assertions remove timing guesswork, per-test contexts make tests independent and parallel, one API covers Chromium, Firefox and WebKit, and traces show the DOM, network and console at every step of a failed run." },
  useCases: [
    { title: "Critical-journey regression in CI", scenario: "An online retailer runs sign-up, search, add-to-cart and checkout on every pull request across Chromium, Firefox and WebKit, sharded over CI machines. Retries capture a trace on the first retry, so any flaky failure arrives with a complete replay attached to the report." },
    { title: "Testing edge cases by controlling the network", scenario: "A banking app uses `page.route` to simulate declined payments, slow APIs and 500 errors, and `clock` to fast-forward session timeouts, proving the UI shows the right error, retry and logout behaviour without depending on a sandbox provider's state." },
    { title: "Authenticated multi-role testing", scenario: "A B2B dashboard signs in an admin and a viewer once in setup projects, saves each `storageState`, and runs role-specific suites in parallel, including a test that opens two contexts side by side to verify that an admin's change appears in real time for the viewer." },
  ],
  subjective: [
    { rating: "Critical for Senior Roles", question: "How does Playwright reduce test flakiness, and what flakiness can it not fix for you?", answer: "Actions auto-wait for actionability (attached, visible, stable, enabled, receiving events), locators re-resolve on every use so re-renders do not leave stale handles, and web-first assertions such as `toHaveText` retry until the condition holds, which replaces sleeps and manual polling. Fresh browser contexts per test remove state leaking between tests, and traces make remaining failures diagnosable. It cannot fix shared or order-dependent test data, tests that assert on values read once with `textContent()` instead of retrying assertions, real third-party dependencies, or genuine race conditions in the application. Those need isolated test data per worker, network mocking or a controlled environment, and fixes in the product itself. Retries should surface flakiness in the report, not hide it." },
    { rating: "High / Common", question: "How do you handle authentication across a large, parallel Playwright suite?", answer: "Sign in once in a setup project that the browser projects depend on, save the authenticated state with `storageState` to a file, and point the test projects' `use.storageState` at it, so tests start already signed in instead of repeating the UI login. For tests that modify server-side state per account, use one account per parallel worker, created in a worker-scoped fixture keyed by `testInfo.parallelIndex`, so workers do not interfere. Tests of the login flow itself opt out with an empty storage state. Keep the auth files out of version control, and prefer API-based login in setup where the UI flow is slow." },
    { rating: "Common for SDET and senior frontend roles", question: "What are fixtures in Playwright and how would you design them for a large codebase?", answer: "Fixtures are the dependency-injection system of Playwright Test: a test declares what it needs (`page`, `request`, or your own fixture) and the runner sets it up before and tears it down after, only when used. `test.extend` defines custom fixtures with setup code, a `use(value)` call and teardown code after it, in either test scope or worker scope for expensive shared resources. In a large codebase, expose page objects (such as `checkoutPage`), seeded test data and authenticated API clients as fixtures, compose them in one shared `test` export, keep each fixture focused, and use automatic fixtures sparingly for things every test needs, such as log capture. This keeps tests declarative and setup reusable without `beforeEach` chains." },
  ],
  objective: [
    { question: "Why is `await expect(locator).toHaveText(\"Saved\")` preferred over `expect(await locator.textContent()).toBe(\"Saved\")`?", options: ["It runs faster because it skips the browser", "It retries until the text matches or the timeout expires, avoiding timing flakiness", "It ignores case differences automatically", "It works without an `await`"], answer: 1, explanation: "Web-first assertions poll the page until the condition holds, so an update that arrives a few hundred milliseconds later still passes. Reading `textContent()` once captures a snapshot that may be taken too early. It still talks to the browser, is case-sensitive by default and must be awaited." },
    { question: "By default, how does Playwright Test isolate one test from another?", options: ["It launches a brand-new browser process for every test", "Each test gets a new browser context with its own cookies and storage", "Tests share a single page and clear cookies between them", "There is no isolation; tests must clean up manually"], answer: 1, explanation: "A new `BrowserContext` per test gives full isolation of cookies, storage and cache cheaply, while the browser process is reused within a worker. A new browser per test would be much slower, and sharing a page would leak state." },
    { question: "According to Playwright's guidance, which locator should you reach for first?", options: ["A long CSS selector copied from DevTools", "An XPath expression", "`page.getByRole(\"button\", { name: \"Submit\" })`", "`page.locator(\"div:nth-child(3) > span\")`"], answer: 2, explanation: "Role-based locators reflect how users and assistive technology perceive the page, so they are resilient to markup changes and double as an accessibility check. Copied CSS, XPath and positional selectors are tied to DOM structure and break on refactors." },
  ],
  keyPoints: [
    "Each test gets a fresh browser context: isolated and cheap.",
    "Actions auto-wait; web-first assertions retry; remove sleeps.",
    "Prefer `getByRole` and other user-facing locators.",
    "Use `trace: \"on-first-retry\"` so CI failures come with a full replay.",
  ],
  sources: [
    { title: "Playwright introduction", url: "https://playwright.dev/docs/intro" },
    { title: "Best practices", url: "https://playwright.dev/docs/best-practices" },
    { title: "Authentication", url: "https://playwright.dev/docs/auth" },
    { title: "Fixtures", url: "https://playwright.dev/docs/test-fixtures" },
  ],
};
