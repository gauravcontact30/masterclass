/**
 * Topic-matched screenshots from official documentation and captured public
 * learning pages. Remote images retain their source links; local captures are
 * registered with provenance in learning-resources.ts.
 */
import { capturedScreensFor } from "./learning-resources";

export type OfficialScreen = {
  /** What the screen is, as a reader scanning figures would name it. */
  title: string;
  /** What to look at in the picture, and what it teaches. Not a repeat of the title. */
  caption: string;
  /** An owning host's image URL, or a locally captured public-page preview. */
  src: string;
  /** The source page for this screenshot or learning-resource preview. */
  page: string;
  /** Shown under the figure, so the picture is never mistaken for ours. */
  credit: string;
  /** Last date the URL answered with an image. */
  checkedAt: string;
  /**
   * Lower-case fragments of the topic names this screen actually depicts,
   * matched against the opened topic's name.
   *
   * This is the primary rule, and the reason is the AWS catalogue: a traced
   * Lambda invocation is a real screenshot, but shown on Amazon Cognito it is a
   * picture of something else. A screen appears on the service or topic it
   * shows, not on everything filed near it.
   */
  topics?: string[];
  /**
   * Categories this screen illustrates as a whole, matched against the opened
   * topic's category. Only for a picture that genuinely explains the area
   * rather than one topic in it — a trace viewer does that for Debugging.
   */
  categories?: string[];
};

type ScreenSet = {
  /** Handbook titles (and catalogue names) these screens belong to, matched exactly. */
  technologies: string[];
  screens: OfficialScreen[];
};

const CHECKED = "2026-09-20";
const raw = (repo: string, ref: string, path: string) => `https://raw.githubusercontent.com/${repo}/${ref}/${path}`;

const SCREEN_SETS: ScreenSet[] = [
  {
    technologies: ["Playwright Automation — Browser Testing & Debugging", "Playwright — API, Locators, Fixtures & Tooling"],
    screens: [
      {
        title: "The HTML report after a run",
        caption: "One row per test, with the failing ones grouped first. This is the artifact CI publishes, so learning to read it is most of learning to debug a suite you did not watch run.",
        src: raw("microsoft/playwright", "main", "docs/src/images/getting-started/html-report.png"),
        page: "https://playwright.dev/docs/running-tests", credit: "playwright.dev", checkedAt: CHECKED,
        topics: ["reporter", "blob report", "retries and sharding", "retries", "--last-failed", "screenshot / video", "playwright test configuration"],
      },
      {
        title: "A trace opened from a failure",
        caption: "The timeline across the top, the DOM snapshot in the middle, the action log on the left. Each action has a before and after snapshot, which is how you see the page as the assertion saw it.",
        src: raw("microsoft/playwright", "main", "docs/src/images/getting-started/html-report-trace.png"),
        page: "https://playwright.dev/docs/trace-viewer", credit: "playwright.dev", checkedAt: CHECKED,
        topics: ["trace", "tracing", "--debug", "pwdebug", "page.pause", "retries"],
        categories: ["Debugging", "Debugging & tracing"],
      },
      {
        title: "Picking a locator in UI mode",
        caption: "Hovering the page prints the locator Playwright would generate for that element. Use it to check a hand-written locator resolves to the element you meant, before the assertion tells you it did not.",
        src: raw("microsoft/playwright", "main", "docs/src/images/getting-started/pick-locator.png"),
        page: "https://playwright.dev/docs/test-ui-mode", credit: "playwright.dev", checkedAt: CHECKED,
        topics: ["locator", "getby", "--ui", "strict mode", "chaining", "role and text"],
        categories: ["Locators"],
      },
      {
        title: "Recording a test with codegen",
        caption: "The browser on the left, generated code on the right. Worth seeing once for the locator style it picks — role and text first — which is the style to keep when you write tests by hand.",
        src: raw("microsoft/playwright", "main", "docs/src/images/getting-started/record-new-test.png"),
        page: "https://playwright.dev/docs/codegen", credit: "playwright.dev", checkedAt: CHECKED,
        topics: ["codegen", "page object model", "--ui"],
      },
    ],
  },
  {
    technologies: ["Cypress — End-to-End Testing & Network Control"],
    screens: [
      {
        title: "The routes table for intercepted requests",
        caption: "Every route your test declared, with a hit count beside it. A route showing zero hits is the usual reason a network test passes while asserting nothing.",
        src: raw("cypress-io/cypress-documentation", "main", "static/img/api/intercept/command-log-routes-ui.png"),
        page: "https://docs.cypress.io/api/commands/intercept", credit: "docs.cypress.io", checkedAt: CHECKED,
        topics: ["network interception", "request stubbing", "wait for network", "aliases", "page.route", "route.fulfill"],
      },
      {
        title: "Intercepted calls in the command log",
        caption: "Each matched request appears as its own log entry under the route. Clicking one prints the request and response in the browser console, which is where you confirm the stub shape matched the real API.",
        src: raw("cypress-io/cypress-documentation", "main", "static/img/api/intercept/command-log-fetches.png"),
        page: "https://docs.cypress.io/api/commands/intercept", credit: "docs.cypress.io", checkedAt: CHECKED,
        topics: ["network interception", "request stubbing", "wait for network"],
        categories: ["Network control"],
      },
      {
        title: "cy.debug() stopping on a command",
        caption: "The run pauses with the subject of that command available in the console. The point of the picture: the command log is a time machine, and each step holds the state it ran against.",
        src: raw("cypress-io/cypress-documentation", "main", "static/img/api/debug/how-debug-displays-in-command-log.png"),
        page: "https://docs.cypress.io/api/commands/debug", credit: "docs.cypress.io", checkedAt: CHECKED,
        topics: ["debugging and retries", "command queue", "commands and chaining", "flake detection"],
        categories: ["Debugging"],
      },
    ],
  },
  {
    technologies: ["Jest — Unit Testing, Mocks & Coverage"],
    screens: [
      {
        title: "A Jest failure in the terminal",
        caption: "Expected above, received below, with the diff highlighted and the failing line pointed at. Reading this output precisely is the skill — the matcher name in the header tells you which comparison was used.",
        src: raw("jestjs/jest", "main", "website/static/img/blog/15-failure1.png"),
        page: "https://jestjs.io/docs/expect", credit: "jestjs.io", checkedAt: CHECKED,
        topics: ["matchers", "assertions", "test structure", "async tests", "testing rejected promises"],
      },
      {
        title: "A failed mock-function assertion",
        caption: "Jest prints every call the mock received, numbered, when the expected call is not among them. That list is usually enough to see that the argument shape drifted, not that the code never ran.",
        src: raw("jestjs/jest", "main", "website/static/img/blog/24-mock-function.png"),
        page: "https://jestjs.io/docs/mock-function-api", credit: "jestjs.io", checkedAt: CHECKED,
        topics: ["mock functions", "spies and implementations", "module mocking", "manual mocks"],
        categories: ["Test doubles"],
      },
      {
        title: "Interactive watch mode after a failure",
        caption: "Watch mode offers to re-run only the failed tests, filter by filename or by test name. This is the loop to work in while fixing one test, instead of running the whole suite each save.",
        src: raw("jestjs/jest", "main", "website/static/img/blog/27-interactive-failures.png"),
        page: "https://jestjs.io/docs/cli", credit: "jestjs.io", checkedAt: CHECKED,
        topics: ["coverage", "jest configuration", "test isolation", "setup and teardown"],
        categories: ["Quality"],
      },
    ],
  },
  {
    technologies: ["Vitest — Fast Unit Testing & Mocks"],
    screens: [
      {
        title: "The HTML reporter",
        caption: "Suites on the left, the run's output on the right, and annotations attached to the test that produced them. The same report is what a CI job uploads when nobody watched the run.",
        src: raw("vitest-dev/vitest", "main", "docs/public/annotations-html-light.png"),
        page: "https://vitest.dev/guide/reporters", credit: "vitest.dev", checkedAt: CHECKED,
        topics: ["watch mode and coverage", "coverage providers", "test projects"],
      },
      {
        title: "Browser-mode trace view",
        caption: "A real browser run, recorded, with each command and the page state beside it. Use it when a component test fails only in the browser and passes under jsdom.",
        src: raw("vitest-dev/vitest", "main", "docs/public/browser/trace-view-light.png"),
        page: "https://vitest.dev/guide/browser/", credit: "vitest.dev", checkedAt: CHECKED,
        topics: ["environment and globals", "test projects", "concurrent tests"],
        categories: ["Configuration"],
      },
      {
        title: "Import breakdown for a slow suite",
        caption: "Where the time went before the first assertion ran — transform, collect, setup, then tests. Slow suites are usually this chart's first bars, not the test bodies.",
        src: raw("vitest-dev/vitest", "main", "docs/public/reporter-import-breakdown-light.png"),
        page: "https://vitest.dev/guide/improving-performance", credit: "vitest.dev", checkedAt: CHECKED,
        topics: ["watch mode and coverage", "coverage providers", "environment and globals"],
        categories: ["Quality"],
      },
    ],
  },
  {
    technologies: ["React 19+ — Components, Actions & Server UI", "React 19+ Hooks — State, Effects & Actions"],
    screens: [
      {
        title: "React DevTools inspecting a component",
        caption: "The component tree on the left, that component's props, state and hooks on the right. Hook values are listed in call order, which is why the rules about conditional hooks exist.",
        src: raw("reactjs/react.dev", "main", "public/images/docs/react-devtools-extension.png"),
        page: "https://react.dev/learn/react-developer-tools", credit: "react.dev", checkedAt: CHECKED,
        topics: ["hydration and mismatch debugging", "react compiler", "rules of hooks", "hook dependency arrays", "hook testing", "reducers & context"],
      },
      {
        title: "A custom hook labelled with useDebugValue",
        caption: "Without the label a custom hook shows only its internal state; with it, DevTools names the value. Worth adding to hooks other people will debug.",
        src: raw("reactjs/react.dev", "main", "public/images/docs/react-devtools-usedebugvalue.png"),
        page: "https://react.dev/reference/react/useDebugValue", credit: "react.dev", checkedAt: CHECKED,
        topics: ["usedebugvalue", "custom hooks"],
        categories: ["Utility hooks"],
      },
    ],
  },
  {
    technologies: ["TypeScript 7 — Types, Compiler & Migration"],
    screens: [
      {
        title: "The tsconfig reference",
        caption: "Every compiler option with its default, grouped by what it affects. The defaults matter more than the list: most migration surprises are an option you never set behaving as documented.",
        src: raw("microsoft/TypeScript-Website", "v2", "packages/typescriptlang-org/static/images/tools/tsconfig-ref.png"),
        page: "https://www.typescriptlang.org/tsconfig/", credit: "typescriptlang.org", checkedAt: CHECKED,
        topics: ["tsconfig migration", "strict compiler checks", "modules and resolution", "build mode and incremental checks", "nouncheckedindexedaccess", "exactoptionalpropertytypes", "tsc and project references", "parallel builds"],
      },
    ],
  },
  {
    technologies: ["Nest.js — APIs, Architecture, Security & Testing", "Nest.js Packages — Decorators, Providers & Modules"],
    screens: [
      {
        title: "The module graph in Nest Devtools",
        caption: "Every module and the imports between them, drawn from the running application. A cycle or an unexpectedly central module is visible here long before it shows up as a confusing injection error.",
        src: "https://docs.nestjs.com/assets/devtools/modules-graph.png",
        page: "https://docs.nestjs.com/devtools/overview", credit: "docs.nestjs.com", checkedAt: CHECKED,
        topics: ["modules", "@module()", "dynamic modules", "lazy modules", "moduleref", "@nestjs/cli", "nest build"],
      },
      {
        title: "Providers and their dependencies",
        caption: "The classes view resolves what each provider injects. Use it to check a provider is registered where you think it is, rather than re-reading module files.",
        src: "https://docs.nestjs.com/assets/devtools/classes-graph.png",
        page: "https://docs.nestjs.com/devtools/overview", credit: "docs.nestjs.com", checkedAt: CHECKED,
        topics: ["providers and dependency injection", "@injectable()", "@inject()", "injection scopes", "discoveryservice", "moduleref"],
        categories: ["Providers & DI"],
      },
      {
        title: "Bootstrap performance",
        caption: "How long each module took to initialize. The usual finding is one module doing network work during startup, which belongs in a lifecycle hook instead.",
        src: "https://docs.nestjs.com/assets/devtools/bootstrap-performance.png",
        page: "https://docs.nestjs.com/devtools/overview", credit: "docs.nestjs.com", checkedAt: CHECKED,
        topics: ["lifecycle hooks", "moduleref and lifecycle", "configuration module", "@nestjs/config", "@nestjs/terminus"],
        categories: ["Operations"],
      },
    ],
  },
  {
    technologies: ["Kubernetes"],
    screens: [
      {
        title: "The Kubernetes Dashboard",
        caption: "Workloads for one namespace, with deployments, replica sets and pods nested as the controllers actually nest. The shape of this list is the object model the YAML describes.",
        src: "https://kubernetes.io/images/docs/ui-dashboard.png",
        page: "https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/", credit: "kubernetes.io", checkedAt: CHECKED,
        topics: ["pods", "deployments", "replicasets", "services", "service types", "statefulsets", "daemonsets"],
      },
      {
        title: "Pod logs in the dashboard",
        caption: "Container logs for one pod, per container. Worth recognizing because it is the same data `kubectl logs` prints — the dashboard is a reader, not a separate source of truth.",
        src: "https://kubernetes.io/images/docs/ui-dashboard-logs-view.png",
        page: "https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/", credit: "kubernetes.io", checkedAt: CHECKED,
        topics: ["pods", "readiness probes", "liveness and startup probes"],
        categories: ["Health, storage & security"],
      },
    ],
  },
  {
    technologies: ["GitHub Actions"],
    screens: [
      {
        title: "A workflow_dispatch run",
        caption: "The manual trigger, with the inputs the workflow declared rendered as a form. If the button is missing, the workflow is not on the default branch — the usual first confusion.",
        src: raw("github/docs", "main", "assets/images/help/actions/actions-workflow-dispatch.png"),
        page: "https://docs.github.com/actions/reference/workflows-and-actions/events-that-trigger-workflows", credit: "docs.github.com", checkedAt: CHECKED,
        topics: ["events and triggers", "workflow files", "conditions"],
      },
      {
        title: "Environments with protection rules",
        caption: "Environments hold their own secrets and can require a reviewer before a job runs. This is the screen that turns a deploy job into an approval gate.",
        src: raw("github/docs", "main", "assets/images/help/actions/environments.png"),
        page: "https://docs.github.com/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments", credit: "docs.github.com", checkedAt: CHECKED,
        topics: ["environments", "deployment jobs", "variables and secrets", "github_token permissions"],
        categories: ["Reuse & environments"],
      },
      {
        title: "A job summary",
        caption: "Markdown a step wrote to `$GITHUB_STEP_SUMMARY`, rendered on the run page. Cheaper than reading logs, and the right place for a test or coverage digest.",
        src: raw("github/docs", "main", "assets/images/help/actions/actions-job-summary-simple-example.png"),
        page: "https://docs.github.com/actions/how-tos/write-workflows/choose-what-workflows-do/add-a-job-summary", credit: "docs.github.com", checkedAt: CHECKED,
        topics: ["jobs and steps", "job outputs", "artifacts"],
        categories: ["Data & performance"],
      },
    ],
  },
  {
    technologies: ["Docker"],
    screens: [
      {
        title: "How the build cache is layered",
        caption: "Each instruction is a layer keyed on the one before it. Read it top to bottom once: it explains why instruction order, not Dockerfile length, decides rebuild time.",
        src: raw("docker/docs", "main", "content/manuals/build/images/cache-stack.png"),
        page: "https://docs.docker.com/build/cache/", credit: "docs.docker.com", checkedAt: CHECKED,
        topics: ["run and image layers", "images, containers and layers", "build cache invalidation", "buildkit and build frontends", "cache mounts", "multi-stage builds", "remote cache"],
      },
      {
        title: "One changed layer invalidating the rest",
        caption: "The same stack after an early layer changed — everything below it is rebuilt. This is why dependency installation goes above the `COPY` of your source.",
        src: raw("docker/docs", "main", "content/manuals/build/images/cache-stack-invalidated.png"),
        page: "https://docs.docker.com/build/cache/", credit: "docs.docker.com", checkedAt: CHECKED,
        topics: ["build cache invalidation", "workdir and copy", ".dockerignore", "run and image layers"],
        categories: ["Dockerfile design"],
      },
      {
        title: "A build summary in CI",
        caption: "Per-step timings for a build that ran on a runner, including what came from cache. The first thing to open when a pipeline build is slower than the same build locally.",
        src: raw("docker/docs", "main", "content/manuals/build/images/gha_build_summary.png"),
        page: "https://docs.docker.com/build/ci/github-actions/", credit: "docs.docker.com", checkedAt: CHECKED,
        topics: ["ci container pipelines", "buildx builders", "multi-platform images", "remote cache"],
        categories: ["BuildKit & Buildx"],
      },
    ],
  },
  {
    technologies: ["n8n"],
    screens: [
      {
        title: "A workflow on the canvas",
        caption: "Nodes left to right, with the connection carrying items between them. Every node receives a list, not one record — the single fact that explains most n8n surprises.",
        src: raw("n8n-io/n8n-docs", "main", "docs/build/.gitbook/assets/example_workflow.png"),
        page: "https://docs.n8n.io/workflows/", credit: "docs.n8n.io", checkedAt: CHECKED,
        topics: ["n8n workflow architecture", "workflow editor and executions", "items and json data", "manual and production executions"],
      },
      {
        title: "Grouping nodes on the canvas",
        caption: "Groups label a stretch of a workflow — fetch, transform, notify. Worth copying as a habit: an automation is read by whoever is on call, not by its author.",
        src: raw("n8n-io/n8n-docs", "main", "docs/build/.gitbook/assets/canvas-groups-overview.png"),
        page: "https://docs.n8n.io/workflows/components/sticky-notes/", credit: "docs.n8n.io", checkedAt: CHECKED,
        topics: ["templates and reusable workflows", "workflow editor and executions", "sub-workflows", "workflow testing"],
        categories: ["Workflow foundations"],
      },
    ],
  },
  {
    technologies: ["Redis caching solutions"],
    screens: [
      {
        title: "Browsing keys in Redis Insight",
        caption: "Keys with their type and TTL beside them. Scanning this once tells you whether your naming scheme and expiries are what the code intended.",
        src: raw("redis/docs", "main", "static/images/ri/ri-browser.png"),
        page: "https://redis.io/docs/latest/develop/tools/insight/", credit: "redis.io", checkedAt: CHECKED,
        topics: ["keys and namespacing", "ttl and expiration", "hashes", "strings and counters", "memory limits and eviction", "hot keys and large values"],
      },
      {
        title: "The Workbench",
        caption: "Commands typed against a real database, with results and inline documentation for each command. The fastest way to learn a data structure is to run its commands here.",
        src: raw("redis/docs", "main", "static/images/rc/rc-ri-workbench.png"),
        page: "https://redis.io/docs/latest/develop/tools/insight/", credit: "redis.io", checkedAt: CHECKED,
        topics: ["sorted sets", "streams", "lists", "sets", "json and search capabilities", "lua scripts", "multi, exec and watch", "pub/sub"],
        categories: ["Redis foundations", "Atomicity & messaging"],
      },
    ],
  },
  {
    technologies: ["AWS", "DevOps with AWS CI/CD"],
    screens: [
      {
        title: "An X-Ray trace of one request",
        caption: "Time spent per segment for a single invocation, initialization shown separately from the handler. This is where a cold start stops being theory and becomes a measured number.",
        src: raw("awsdocs/aws-lambda-developer-guide", "main", "sample-apps/blank-go/images/blank-go-trace.png"),
        page: "https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html", credit: "docs.aws.amazon.com", checkedAt: CHECKED,
        topics: ["lambda", "x-ray", "distributed tracing", "cloudwatch"],
      },
      {
        title: "The service map",
        caption: "Every service the request touched, with latency and error rate on each edge. Read it before optimizing anything: the slow edge is often not the one being blamed.",
        src: raw("awsdocs/aws-lambda-developer-guide", "main", "sample-apps/blank-go/images/blank-go-servicemap.png"),
        page: "https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html", credit: "docs.aws.amazon.com", checkedAt: CHECKED,
        topics: ["x-ray", "distributed tracing", "cloudwatch logs", "step functions"],
      },
    ],
  },
];

const byTechnology = new Map<string, OfficialScreen[]>();
for (const set of SCREEN_SETS) for (const technology of set.technologies) byTechnology.set(technology, set.screens);

/**
 * The screens worth showing beside one opened topic.
 *
 * A screen shows when it depicts the topic by name, or when it illustrates the
 * whole category the topic sits in. Nothing shows just because the reader is
 * somewhere in the handbook: an unrelated screenshot of the right product still
 * teaches the wrong thing, and an empty section is the better answer.
 */
export function screensFor(technology: string, category: string, topic = ""): OfficialScreen[] {
  const screens = byTechnology.get(technology) ?? [];
  const name = topic.toLowerCase();
  return [...screens.filter(screen =>
    (!!name && (screen.topics ?? []).some(fragment => name.includes(fragment)))
    || (screen.categories ?? []).includes(category)), ...capturedScreensFor(technology, topic)];
}

/** Every technology with screenshots, for tests and for review. */
export const SCREEN_TECHNOLOGIES = [...byTechnology.keys()];

/** Every screen, whatever category it belongs to, for tests and for review. */
export const ALL_OFFICIAL_SCREENS: readonly OfficialScreen[] = SCREEN_SETS.flatMap(set => set.screens);
