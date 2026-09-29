import type { TechnologyEssentials } from "./types";

/** Unit, component and end-to-end testing. */
export const TESTING_ESSENTIALS: TechnologyEssentials[] = [
  {
    technologies: ["Jest — Unit Testing, Mocks & Coverage"],
    points: [
      "A test asserts on observable behaviour. Asserting that a private method was called locks the test to today's implementation and makes every refactor look like a regression.",
      "Mocks are hoisted above imports, which is why `jest.mock` works at the top of a file and fails when written inside a test. The module registry, not the import statement, decides what a test receives.",
      "A mock left un-reset leaks into the next test. `clearMocks` in config is better than remembering a `beforeEach` in every file.",
      "Coverage measures lines executed, not behaviour verified. A file at 100% with no assertions is fully covered and completely untested.",
      "A test that fails only when the suite runs in a different order is telling you about shared state, and that is a finding about the code, not about Jest.",
    ],
    categories: {
      "Async testing": ["An assertion after an un-awaited promise runs before the work finishes and passes for the wrong reason. Return or await everything async."],
      "Test doubles": ["A fake that always resolves hides the error path. The rejection case is usually the one worth a test."],
      "Quality": ["Snapshot tests catch change, not correctness. A snapshot updated without being read is a test that has been switched off."],
    },
  },
  {
    technologies: ["Vitest — Fast Unit Testing & Mocks"],
    points: [
      "Vitest runs through the project's own build pipeline, so tests resolve modules, aliases and transforms exactly as the application does — one configuration instead of two.",
      "`vi.mock` is hoisted like Jest's, and a factory that references an outer variable will run before that variable exists. `vi.hoisted` is the escape hatch.",
      "Tests run in parallel by default, per file. Anything global — a shared database, an env var, a fake timer left installed — needs isolation or explicit sequencing.",
      "Watch mode re-runs only the tests affected by the module graph you changed, which makes a fast feedback loop the default rather than something to configure.",
    ],
    categories: {
      "Configuration": ["Environment is per file: a component test needs a DOM environment, and a pure function test is faster without one."],
      "Test doubles": ["Spying on a real module keeps its behaviour and records calls, which is usually what you wanted instead of a full mock."],
      "Quality": ["Browser mode runs the same test in a real engine. Reach for it when a failure disappears under jsdom."],
    },
  },
  {
    technologies: ["React Testing Library — User-Centered UI Tests"],
    points: [
      "Query the way a user finds things: role, then label, then text. Reaching for a test id is a signal that the UI is missing an accessible name, which is a real finding.",
      "`getBy` throws when absent, `queryBy` returns null, `findBy` waits. Choosing the wrong one turns a timing problem into a confusing error message.",
      "`userEvent` reproduces a real interaction — focus, key events, pointer events — where `fireEvent` dispatches one synthetic event. The difference shows up in anything keyboard-driven.",
      "Every state update must be inside React's batching for the assertion to see it, which is what `act` and the async queries handle for you. A manual `setTimeout` in a test almost always means a missing `await`.",
    ],
    categories: {
      "Async behavior": ["`waitFor` retries an assertion; it does not make a pending promise resolve. If nothing will change, it just fails slowly."],
      "Test design": ["Rendering the component with its real children finds integration bugs that a test with every child mocked cannot."],
      "Queries": ["An accessible-name query failing is often the accessibility bug the test was supposed to catch."],
    },
  },
  {
    technologies: ["Cypress — End-to-End Testing & Network Control"],
    points: [
      "Commands are queued, not executed where they are written. A plain variable assigned from `cy.get` is empty at the next line — the value arrives in `.then`.",
      "Assertions retry until they pass or time out, so explicit waits are almost always wrong. Wait for the state you expect, not for a duration.",
      "Intercepting the network is how a flaky suite becomes deterministic: stub the response, and the test stops depending on a third party being up.",
      "Tests should not share state through the UI. Logging in through the interface in every test is slow and couples unrelated tests to the login page.",
    ],
    categories: {
      "Network control": ["An intercept with no matching request passes silently. Assert on the route to prove the call actually happened."],
      "Debugging": ["Every command in the log holds its subject. Clicking a step and reading the console is faster than adding logging."],
      "Test design": ["One behaviour per test. A test that checks five things reports the first failure and hides the rest."],
    },
  },
  {
    technologies: ["Playwright Automation — Browser Testing & Debugging", "Playwright — API, Locators, Fixtures & Tooling"],
    points: [
      "Locators are lazy and auto-waiting: they resolve at the moment of the action, which removes the class of flake caused by an element that appeared a frame late.",
      "Web-first assertions retry until the expectation holds. Any explicit sleep in a Playwright test is either redundant or hiding a real race.",
      "Each test gets a fresh browser context — its own cookies and storage — so tests are isolated by default and a stored login has to be set up on purpose.",
      "Traces are the debugging tool that matters, because they let you inspect a CI failure you never saw. Recording them on first retry costs nothing on green runs.",
      "Prefer role and text locators over CSS: they survive markup changes and they fail loudly when the accessible name is wrong, which is a bug in the app.",
    ],
    categories: {
      "Fixtures & hooks": ["A fixture is dependency injection for tests: set-up and tear-down travel with the thing being provided instead of living in a hook that has to remember to clean up."],
      "Network & mocking": ["Routing is per context, so a mock installed in one test cannot leak into another."],
      "Debugging & tracing": ["UI mode and the trace viewer show the DOM as the failing assertion saw it — the snapshot, not the live page."],
      "Projects and browsers": ["Projects run the same tests under different configurations, which is how one suite covers three engines without duplication."],
      "Assertions": ["`toHaveText` waits; a manual read of `textContent` does not. That is the whole difference between stable and flaky."],
    },
  },
];
