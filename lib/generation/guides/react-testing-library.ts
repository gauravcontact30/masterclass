import type { TechnologyGuide } from "./index";
import { source } from "./shared";

/** React Testing Library (v16) with user-event 14 and jest-dom, grounded in testing-library.com. */
const guide: TechnologyGuide = {
  id: "react-testing-library",
  technologyId: "rtl",
  topicId: "rtl-queries-user-event",
  level: "intermediate",
  curriculum: {
    title: "React Testing Library: test what users see",
    minutes: 170,
    objectives: [
      "Apply Testing Library's guiding principle: test behaviour the way users experience it.",
      "Choose queries by priority, preferring getByRole with accessible names.",
      "Simulate real interactions with user-event 14 instead of fireEvent.",
      "Test asynchronous UI with findBy queries and waitFor.",
      "Wrap components in providers, mock network boundaries and test custom Hooks with renderHook.",
    ],
    prerequisites: [
      "React components and Hooks.",
      "Jest or Vitest basics (describe, test, expect, mocks).",
      "Packages: @testing-library/react, @testing-library/dom, @testing-library/user-event, @testing-library/jest-dom.",
    ],
    lessons: [
      {
        title: "The guiding principle and first test",
        diagram: {
          kind: "flow",
          caption: "Every Testing Library test follows the same shape: render the component into a real DOM, find elements the way a user would, interact, then assert on what the user can now see.",
          items: [
            { label: "render(<Component />)", detail: "mounts into a jsdom document" },
            { label: "screen.getByRole(...)", detail: "find elements by role and accessible name" },
            { label: "await user.click(...)", detail: "real browser-like interactions" },
            { label: "expect(...).toBeInTheDocument()", detail: "assert on visible outcomes" },
          ],
        },
        explanation: "- 'The more your tests resemble the way your software is used, the more confidence they can give you'\n- Test behaviour through the DOM, not component state, props or internal methods\n- render mounts a component; screen queries the whole document\n- jest-dom adds readable DOM matchers such as toBeInTheDocument and toBeDisabled\n- Cleanup between tests happens automatically when your runner exposes afterEach",
        keyPoints: [
          { tone: "key", title: "Test what users see and do", text: "The more a test resembles real usage, the more confidence it gives. Find elements by what users perceive, interact the way they would, and assert on the visible result instead of state, props or internal methods.", example: "expect(screen.getByText('Count: 2')).toBeInTheDocument()" },
          { tone: "tip", title: "Set up jest-dom once", text: "Import @testing-library/jest-dom in a setup file so every test gets readable DOM matchers such as toBeVisible, toBeDisabled and toHaveValue. React Testing Library v16 also needs @testing-library/dom installed.", example: "setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']" },
          { tone: "warning", title: "Refactors should not break good tests", text: "If a test fails after a refactor that left the UI identical, it was coupled to implementation details such as class names or component structure. Rewrite it around roles, labels and text.", example: "getByRole('button', { name: /save/i })  # not .btn-primary" },
        ],
        example: "- render(<Greeting name=\"Asha\" />)\n- screen.getByRole('heading', { name: 'Hello, Asha' })\n- expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()\n- screen.debug() prints the current DOM when a test fails mysteriously",
        code: "// jest.setup.ts\nimport '@testing-library/jest-dom';\n\n// Counter.test.tsx\nimport { render, screen } from '@testing-library/react';\nimport userEvent from '@testing-library/user-event';\nimport { Counter } from './Counter';\n\ntest('increments when the button is clicked', async () => {\n  const user = userEvent.setup();\n  render(<Counter initial={0} />);\n\n  const button = screen.getByRole('button', { name: /increment/i });\n  await user.click(button);\n  await user.click(button);\n\n  expect(screen.getByText('Count: 2')).toBeInTheDocument();\n});",
        apiReference: [
          {
            name: "render",
            kind: "function",
            signature: "render(ui, { container?, baseElement?, wrapper?, hydrate?, legacyRoot? })",
            params: [
              { name: "ui", type: "ReactElement", description: "The component tree to mount." },
              { name: "wrapper", type: "Component", description: "Wraps ui, typically with providers (router, theme, query client)." },
            ],
            returns: "{ container, rerender, unmount, asFragment, ...queries bound to the container }",
          },
        ],
        exercise: "- Write a test for a toggle button that checks its aria-pressed state\n- Add jest-dom to your setup file and use toBeVisible\n- Refactor a component's internals and confirm the tests still pass",
        checkpoint: "- What is Testing Library's guiding principle?\n- Why is screen preferred over destructuring queries from render?\n- What does jest-dom add?",
        mistake: "- Do not test implementation details like state variables\n- Do not query by CSS class selectors\n- Do not forget to await user-event calls",
        interview: [
          {
            question: "What does 'avoid testing implementation details' mean in React Testing Library?",
            definition: "Tests should interact with and assert on what a user sees and does, not on how the component is built.",
            answer: "An implementation detail is anything a user cannot observe: state variable names, internal methods, component hierarchy or class names. Tests coupled to them break during harmless refactors and can pass while the UI is broken. Instead, find elements by role, label or text, interact with user-event, and assert on the rendered result.",
            similar: [
              { question: "Why does RTL not offer a way to read component state?", answer: "By design: state is internal, and users only see its effect on the DOM." },
            ],
          },
        ],
      },
      {
        title: "Queries and their priority",
        diagram: {
          kind: "tree",
          caption: "Testing Library's recommended query priority. Accessible queries come first because they reflect how every user, including screen-reader users, finds things.",
          items: [
            { label: "Accessible to everyone" },
            { label: "getByRole", detail: "role + accessible name: the default choice", depth: 1 },
            { label: "getByLabelText", detail: "form fields by their label", depth: 1 },
            { label: "getByPlaceholderText, getByText, getByDisplayValue", depth: 1 },
            { label: "Semantic" },
            { label: "getByAltText, getByTitle", depth: 1 },
            { label: "Last resort" },
            { label: "getByTestId", detail: "data-testid when nothing else identifies it", depth: 1 },
          ],
        },
        explanation: "- Each query comes in get, query and find forms, plus *All variants\n- getBy throws if there is no match (or more than one); use it when the element must exist\n- queryBy returns null instead of throwing; use it to assert absence\n- findBy returns a promise that waits for the element to appear\n- within(element) scopes queries to part of the page",
        keyPoints: [
          { tone: "key", title: "Reach for getByRole first", text: "Role queries match elements by ARIA role and accessible name, the way assistive technology exposes them. If a button cannot be found by its name, a screen-reader user probably cannot operate it either.", example: "screen.getByRole('checkbox', { name: /accept the terms/i })" },
          { tone: "tip", title: "get, query and find answer different questions", text: "getBy asserts that exactly one element exists (and throws otherwise), queryBy returns null so you can assert absence, and findBy returns a promise that waits for the element to appear.", example: "expect(screen.queryByRole('alert')).not.toBeInTheDocument()" },
          { tone: "warning", title: "Test IDs are the last resort", text: "data-testid is invisible to users and hides accessibility problems. Use it only when no role, label or text identifies an element, and never as a shortcut around a missing label.", example: "getByLabelText('Email')  # before getByTestId('email')" },
        ],
        example: "- screen.getByRole('textbox', { name: 'Email' }) finds <label>Email <input /></label>\n- screen.getAllByRole('listitem') returns every list item\n- within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' })\n- screen.getByRole('heading', { level: 2 }) finds an h2",
        code: "import { render, screen, within } from '@testing-library/react';\nimport { SignupForm } from './SignupForm';\n\ntest('finds form fields the accessible way', () => {\n  render(<SignupForm />);\n\n  expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();\n  expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');\n  expect(screen.getByRole('checkbox', { name: /accept the terms/i })).not.toBeChecked();\n\n  // absence: queryBy returns null instead of throwing\n  expect(screen.queryByRole('alert')).not.toBeInTheDocument();\n\n  // scope to one region\n  const plans = screen.getByRole('group', { name: 'Plan' });\n  expect(within(plans).getAllByRole('radio')).toHaveLength(3);\n});",
        apiReference: [
          {
            name: "getByRole",
            kind: "query",
            signature: "screen.getByRole(role, { name?, level?, checked?, pressed?, selected?, expanded?, hidden? })",
            params: [
              { name: "role", type: "ARIA role", description: "button, link, heading, textbox, checkbox, dialog, listitem..." },
              { name: "name", type: "string | RegExp", description: "The accessible name (label text, aria-label or content)." },
              { name: "level", type: "number", description: "Heading level for role 'heading'." },
            ],
            returns: "The single matching element; throws if none or several match.",
          },
        ],
        exercise: "- Replace every getByTestId in a test file with an accessible query\n- Assert that an error message is absent before submitting and present after\n- Use within to click the Delete button of the second row in a table",
        checkpoint: "- What is the difference between getBy, queryBy and findBy?\n- Why is getByRole the first choice?\n- When is getByTestId acceptable?",
        mistake: "- Do not use getBy to check that something is missing\n- Do not add data-testid everywhere when roles and labels would work\n- Do not wrap queries in waitFor when findBy exists",
      },
      {
        title: "Interactions with user-event",
        diagram: {
          kind: "split",
          caption: "fireEvent dispatches one synthetic DOM event; user-event simulates the full sequence a real user produces, including focus, pointer and keyboard events.",
          headings: ["fireEvent.click", "await user.click"],
          items: [
            { label: "One click event", group: 0 },
            { label: "No hover, focus or pointer events", group: 0 },
            { label: "Can click disabled or hidden elements", group: 0 },
            { label: "pointerdown, mousedown, focus, pointerup, click", group: 1 },
            { label: "Respects disabled and pointer-events: none", group: 1 },
            { label: "Async: always await it", group: 1 },
          ],
        },
        explanation: "- Create a user with userEvent.setup() at the start of each test, before rendering\n- Every user-event method returns a promise: await user.click(...), await user.type(...)\n- user.type types character by character, firing keydown, keypress, input and keyup\n- user.keyboard('{Enter}') and user.tab() test keyboard navigation\n- Fall back to fireEvent only for events user-event does not cover",
        keyPoints: [
          { tone: "key", title: "user-event simulates the whole interaction", text: "A user-event click fires pointer, mouse, focus and click events in order and respects disabled elements and pointer-events: none, so it catches bugs a single fireEvent dispatch would miss.", example: "await user.click(screen.getByRole('button', { name: 'Sign in' }))" },
          { tone: "tip", title: "Create the user before rendering", text: "Call userEvent.setup() at the start of each test, before render, and await every method. With fake timers, pass advanceTimers so typing delays follow the fake clock.", example: "const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })" },
          { tone: "warning", title: "A missing await is a silent bug", text: "user-event methods return promises. Without await, assertions run before the interaction has finished and the test may pass or fail at random.", example: "await user.type(input, 'react')" },
        ],
        example: "- const user = userEvent.setup()\n- await user.type(screen.getByLabelText('Search'), 'react')\n- await user.selectOptions(screen.getByRole('combobox'), 'Hindi')\n- await user.tab(); expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus()",
        code: "import { render, screen } from '@testing-library/react';\nimport userEvent from '@testing-library/user-event';\nimport { LoginForm } from './LoginForm';\n\ntest('submits the typed credentials', async () => {\n  const user = userEvent.setup();\n  const onSubmit = jest.fn();\n  render(<LoginForm onSubmit={onSubmit} />);\n\n  await user.type(screen.getByLabelText('Email'), 'asha@example.in');\n  await user.type(screen.getByLabelText('Password'), 's3cret!');\n  await user.click(screen.getByRole('button', { name: 'Sign in' }));\n\n  expect(onSubmit).toHaveBeenCalledWith({ email: 'asha@example.in', password: 's3cret!' });\n});\n\ntest('the submit button is keyboard reachable', async () => {\n  const user = userEvent.setup();\n  render(<LoginForm onSubmit={jest.fn()} />);\n\n  await user.tab();   // email\n  await user.tab();   // password\n  await user.tab();   // button\n  expect(screen.getByRole('button', { name: 'Sign in' })).toHaveFocus();\n});",
        apiReference: [
          {
            name: "userEvent.setup",
            kind: "function",
            signature: "const user = userEvent.setup({ delay?, advanceTimers?, pointerEventsCheck? })",
            params: [
              { name: "delay", type: "number | null", description: "Delay between keystrokes; null disables it." },
              { name: "advanceTimers", type: "(ms) => void", description: "Hook user-event into fake timers." },
            ],
            returns: "A user instance with click, dblClick, type, clear, keyboard, tab, hover, selectOptions, upload and paste.",
          },
        ],
        exercise: "- Test a search box that filters a list as the user types\n- Verify that clicking a disabled button does not call the handler\n- Test that Escape closes a modal using user.keyboard",
        checkpoint: "- Why should you call userEvent.setup() before render?\n- What does user-event do that fireEvent does not?\n- How do you combine user-event with fake timers?",
        mistake: "- Do not forget await on user-event calls\n- Do not create one shared user instance for all tests\n- Do not reach for fireEvent first",
      },
      {
        title: "Asynchronous UI: findBy and waitFor",
        diagram: {
          kind: "flow",
          caption: "Waiting for UI that updates after data loads: findBy retries a query until it succeeds or times out (1000 ms by default).",
          items: [
            { label: "Render with a loading state", detail: "'Loading…' is visible" },
            { label: "Mocked request resolves", detail: "React updates the DOM" },
            { label: "await screen.findByRole(...)", detail: "retries until the element appears" },
            { label: "Assert on the loaded content", detail: "or the error message" },
          ],
        },
        explanation: "- findBy* is getBy* plus waitFor: it returns a promise that resolves when the element appears\n- waitFor retries an assertion callback until it passes or times out\n- waitForElementToBeRemoved waits for a loading indicator to disappear\n- Testing Library wraps renders, events and waits in act() for you\n- Mock the network at the boundary (fetch, a module, or a mock server) so tests are deterministic",
        keyPoints: [
          { tone: "key", title: "findBy waits for UI to appear", text: "findBy queries retry until the element appears or the timeout (1000 ms by default) passes. They are the simplest way to wait for data that loads after render.", example: "expect(await screen.findByRole('list')).toBeInTheDocument()" },
          { tone: "tip", title: "Mock only the network boundary", text: "Replace fetch, an API module or a mock service worker with controlled responses, then test both the success path and the failure path of the real component.", example: "global.fetch = jest.fn().mockResolvedValue({ ok: false })" },
          { tone: "warning", title: "Keep waitFor callbacks side-effect free", text: "waitFor may run its callback many times, so it should contain only the assertion that needs to wait. Clicks and other actions inside it run repeatedly and cause confusing failures.", example: "await waitFor(() => expect(save).toHaveBeenCalledTimes(1))" },
        ],
        example: "- expect(await screen.findByRole('list')).toBeInTheDocument()\n- await waitForElementToBeRemoved(() => screen.queryByText('Loading…'))\n- await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1))\n- global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => users })",
        code: "import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';\nimport { UserList } from './UserList';\n\nbeforeEach(() => {\n  global.fetch = jest.fn().mockResolvedValue({\n    ok: true,\n    json: async () => [{ id: 1, name: 'Asha' }, { id: 2, name: 'Ravi' }],\n  }) as jest.Mock;\n});\n\ntest('shows users after loading', async () => {\n  render(<UserList />);\n\n  expect(screen.getByText('Loading…')).toBeInTheDocument();\n  await waitForElementToBeRemoved(() => screen.queryByText('Loading…'));\n\n  expect(screen.getAllByRole('listitem')).toHaveLength(2);\n  expect(screen.getByText('Asha')).toBeInTheDocument();\n});\n\ntest('shows an error when the request fails', async () => {\n  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });\n  render(<UserList />);\n  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load users');\n});",
        apiReference: [
          {
            name: "waitFor",
            kind: "async utility",
            signature: "await waitFor(callback, { timeout?: 1000, interval?: 50, onTimeout? })",
            params: [
              { name: "callback", type: "() => void | Promise", description: "Retried until it stops throwing." },
              { name: "timeout", type: "number", description: "Milliseconds before giving up (default 1000)." },
            ],
            returns: "A promise resolving to the callback's return value.",
          },
        ],
        exercise: "- Test a component that fetches data on mount with a mocked fetch\n- Assert the loading indicator disappears before checking results\n- Test the error path with mockResolvedValueOnce({ ok: false })",
        checkpoint: "- What is findBy equivalent to?\n- What belongs inside a waitFor callback?\n- What does an act() warning usually indicate?",
        mistake: "- Do not put user interactions inside waitFor\n- Do not use arbitrary sleeps (setTimeout) to wait for UI\n- Do not call real APIs from component tests",
        interview: [
          {
            question: "How do you test a component that loads data asynchronously?",
            definition: "By mocking the data boundary and waiting for the resulting UI with findBy queries or waitFor.",
            answer: "Replace the network call (fetch, an API module or a mock service worker) with a controlled response, render the component, optionally assert the loading state, then await screen.findBy... for the loaded content. Also test the error path with a failing response. Testing Library wraps these waits in act(), so no manual act calls are needed.",
            similar: [
              { question: "Why prefer findBy over waitFor plus getBy?", answer: "It is shorter and gives better error messages for the common 'wait until it appears' case." },
            ],
          },
        ],
      },
      {
        title: "Providers, custom render and renderHook",
        diagram: {
          kind: "tree",
          caption: "Real components need their providers. A custom render wraps them once so every test renders the component in a realistic tree.",
          items: [
            { label: "test-utils.tsx" },
            { label: "AllProviders", detail: "theme, router, query client, i18n", depth: 1 },
            { label: "customRender(ui, options)", detail: "render(ui, { wrapper: AllProviders, ...options })", depth: 1 },
            { label: "export * from '@testing-library/react'", detail: "tests import everything from one place", depth: 1 },
            { label: "renderHook(() => useThing(), { wrapper })", detail: "test a custom Hook directly" },
          ],
        },
        explanation: "- Components that read context fail to render without their providers\n- Pass a wrapper to render, or create a custom render in a test-utils file\n- rerender(ui) updates props on the same mounted component\n- renderHook tests a custom Hook in isolation; result.current holds its latest return value\n- Wrap Hook updates in act() when you call them directly from the test",
        keyPoints: [
          { tone: "key", title: "A custom render supplies providers", text: "Components that read context need their providers. Wrap them once in a test-utils render and re-export Testing Library from it, so every test renders components in a realistic tree.", example: "render(ui, { wrapper: AllProviders, ...options })" },
          { tone: "tip", title: "renderHook tests reusable Hooks", text: "renderHook runs a Hook inside a test component and exposes its latest return value as result.current. Wrap direct updates in act so React applies them before you assert.", example: "act(() => result.current.increment())" },
          { tone: "warning", title: "Never share stores between tests", text: "A query client, router or store created once at module level carries state from one test to the next. Create a fresh instance inside the wrapper for every render.", example: "const client = new QueryClient()  // per test" },
        ],
        example: "- render(<Profile />, { wrapper: ThemeProvider })\n- const { rerender } = render(<Badge count={1} />); rerender(<Badge count={2} />)\n- const { result } = renderHook(() => useCounter(5))\n- act(() => result.current.increment()); expect(result.current.count).toBe(6)",
        code: "// test-utils.tsx\nimport { render, type RenderOptions } from '@testing-library/react';\nimport type { ReactNode } from 'react';\nimport { ThemeProvider } from './theme';\nimport { LanguageProvider } from './language';\n\nfunction AllProviders({ children }: { children: ReactNode }) {\n  return (\n    <LanguageProvider initial=\"en\">\n      <ThemeProvider>{children}</ThemeProvider>\n    </LanguageProvider>\n  );\n}\n\nexport function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {\n  return render(ui, { wrapper: AllProviders, ...options });\n}\nexport * from '@testing-library/react';\n\n// useCounter.test.ts\nimport { act, renderHook } from '@testing-library/react';\nimport { useCounter } from './useCounter';\n\ntest('increments from the initial value', () => {\n  const { result } = renderHook(() => useCounter(5));\n  act(() => result.current.increment());\n  expect(result.current.count).toBe(6);\n});",
        apiReference: [
          {
            name: "renderHook",
            kind: "function",
            signature: "const { result, rerender, unmount } = renderHook(callback, { initialProps?, wrapper? })",
            params: [
              { name: "callback", type: "(props) => any", description: "Calls the Hook under test." },
              { name: "wrapper", type: "Component", description: "Providers the Hook needs." },
            ],
            returns: "result.current is the Hook's latest return value.",
          },
        ],
        exercise: "- Build a test-utils file with your app's providers and migrate two tests to it\n- Test a component's prop change with rerender\n- Test a useToggle Hook with renderHook and act",
        checkpoint: "- Why create a custom render?\n- What does result.current hold in renderHook?\n- When do you need act() explicitly?",
        mistake: "- Do not share one store instance across tests\n- Do not duplicate provider setup in every test file\n- Do not test every Hook in isolation when testing the component is enough",
      },
      {
        title: "Accessible assertions and debugging",
        diagram: {
          kind: "split",
          caption: "jest-dom matchers express intent in user terms, and Testing Library's debugging helpers show you what the test actually sees.",
          headings: ["Assert (jest-dom)", "Debug"],
          items: [
            { label: "toBeInTheDocument / toBeVisible", group: 0 },
            { label: "toBeDisabled / toBeEnabled / toBeRequired", group: 0 },
            { label: "toHaveAccessibleName / toHaveAccessibleDescription", group: 0 },
            { label: "toHaveValue / toBeChecked / toHaveFocus", group: 0 },
            { label: "screen.debug()", detail: "print the current DOM", group: 1 },
            { label: "logRoles(container)", detail: "list roles and names", group: 1 },
            { label: "screen.logTestingPlaygroundURL()", detail: "suggests the best query", group: 1 },
          ],
        },
        explanation: "- jest-dom matchers read like requirements: the button is disabled, the field has a value\n- Accessibility matchers verify names and descriptions assistive technologies announce\n- screen.debug() prints the DOM; pass an element to print only part of it\n- Query error messages list the roles and names that do exist\n- Accessible queries make your tests an early warning for accessibility regressions",
        keyPoints: [
          { tone: "key", title: "Assert in the user's terms", text: "jest-dom matchers read like requirements: the field has a value, the button is disabled, the dialog has an accessible name. Tests written this way double as accessibility checks.", example: "expect(confirm).toHaveAccessibleDescription('This cannot be undone')" },
          { tone: "tip", title: "Let failures tell you what exists", text: "When a role query fails, the error lists the roles and names actually present. screen.debug(element) prints part of the DOM, and logTestingPlaygroundURL suggests the best query.", example: "screen.debug(screen.getByRole('dialog'))" },
          { tone: "warning", title: "Visual correctness is not accessibility", text: "A form can look perfect and still have unlabelled inputs or a dialog without a name. Keep accessible queries and add an automated axe check for structural issues.", example: "expect(await axe(container)).toHaveNoViolations()" },
        ],
        example: "- expect(screen.getByRole('button', { name: 'Delete' })).toHaveAccessibleDescription('Removes the file permanently')\n- expect(screen.getByLabelText('Quantity')).toHaveValue(2)\n- expect(screen.getByRole('switch')).toBeChecked()\n- screen.debug(screen.getByRole('dialog'))",
        code: "import { render, screen } from '@testing-library/react';\nimport userEvent from '@testing-library/user-event';\nimport { DeleteDialog } from './DeleteDialog';\n\ntest('the dialog is labelled and guards the destructive action', async () => {\n  const user = userEvent.setup();\n  render(<DeleteDialog fileName=\"notes.txt\" onConfirm={jest.fn()} />);\n\n  const dialog = screen.getByRole('dialog', { name: 'Delete notes.txt?' });\n  expect(dialog).toBeVisible();\n\n  const confirm = screen.getByRole('button', { name: 'Delete' });\n  expect(confirm).toHaveAccessibleDescription('This cannot be undone');\n  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();\n\n  await user.click(screen.getByRole('checkbox', { name: 'I understand' }));\n  expect(confirm).toBeEnabled();\n  // When stuck: screen.debug(dialog) prints just the dialog's DOM\n});",
        exercise: "- Add accessible-name assertions to three existing tests\n- Break a label on purpose and read the query's error message\n- Use logTestingPlaygroundURL to find a better query for one element",
        checkpoint: "- Which matcher checks what a screen reader announces as a name?\n- How do you print only part of the DOM?\n- How do accessible queries help accessibility?",
        mistake: "- Do not silence failing role queries by switching to test IDs\n- Do not leave screen.debug calls in committed tests\n- Do not assume visual correctness equals accessibility",
      },
    ],
    project: "Test a 'Todo with filters' feature with React Testing Library: a custom render with theme and i18n providers, accessible queries only (no test IDs), user-event for adding, completing and filtering todos, a mocked fetch that loads initial todos with a loading and an error path, keyboard navigation checks with user.tab, and a renderHook test for the useTodos Hook.",
    summary: "- Test behaviour the way users experience it, never implementation details\n- Query by priority: getByRole with a name first, getByTestId last\n- getBy asserts presence, queryBy absence, findBy waits\n- Always userEvent.setup() and await interactions\n- Await async UI with findBy and waitFor; mock only the network boundary\n- Use a custom render for providers and renderHook for reusable Hooks\n- jest-dom matchers and accessible queries double as accessibility checks",
    glossary: [
      { term: "Guiding principle", definition: "Tests should resemble how software is used, so they give confidence and survive refactors." },
      { term: "Accessible name", definition: "The name assistive technology announces for an element, from its label, aria-label or content." },
      { term: "getBy / queryBy / findBy", definition: "Query variants that throw, return null, or wait asynchronously when nothing matches." },
      { term: "screen", definition: "An object with every query bound to document.body." },
      { term: "user-event", definition: "A companion library that simulates full user interactions rather than single DOM events." },
      { term: "jest-dom", definition: "Custom matchers for asserting on DOM state, such as toBeVisible and toHaveValue." },
      { term: "act()", definition: "A React test helper ensuring updates are applied before assertions; RTL wraps it for you." },
      { term: "Custom render", definition: "A render wrapper that supplies an app's providers to every test." },
      { term: "renderHook", definition: "An RTL function that runs a custom Hook in a test component and exposes its result." },
    ],
    sources: [
      source("https://testing-library.com/docs/guiding-principles", "Guiding Principles"),
      source("https://testing-library.com/docs/react-testing-library/intro", "React Testing Library introduction"),
      source("https://testing-library.com/docs/queries/about", "About Queries"),
      source("https://testing-library.com/docs/queries/byrole", "ByRole"),
      source("https://testing-library.com/docs/user-event/intro", "user-event introduction"),
      source("https://testing-library.com/docs/dom-testing-library/api-async", "Async Methods"),
      source("https://testing-library.com/docs/react-testing-library/setup", "Setup and custom render"),
      source("https://testing-library.com/docs/react-testing-library/api", "React Testing Library API (renderHook)"),
      source("https://testing-library.com/docs/ecosystem-jest-dom", "jest-dom"),
    ],
  },
};

export default guide;
