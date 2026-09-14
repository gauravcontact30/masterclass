import type { TechnologyGuide } from "./index";
import { source } from "./shared";
import { REACT_HOOK_LESSONS } from "@/lib/notes-hooks";

/**
 * Every built-in React 19+ Hook, grouped the way react.dev's Hooks reference
 * groups them — state, context, refs, effects, performance, actions and
 * resources — including useEffectEvent (stable in React 19.2).
 */
const guide: TechnologyGuide = {
  id: "react-19-hooks",
  technologyId: "react",
  topicId: "react-19-hooks",
  level: "intermediate",
  curriculum: {
    title: "React 19+ Hooks, one by one",
    minutes: 200,
    objectives: [
      "Apply the Rules of Hooks and choose between useState and useReducer.",
      "Synchronise with external systems using useEffect, and read fresh values in Effects with useEffectEvent.",
      "Use refs as props, useImperativeHandle, context and the use() API.",
      "Keep UIs responsive with useTransition, useDeferredValue and memoisation (or the React Compiler).",
      "Build forms with Actions: useActionState, useFormStatus and useOptimistic.",
      "Write custom Hooks with useId, useSyncExternalStore and useDebugValue.",
    ],
    prerequisites: [
      "JavaScript (ES2020+) and JSX.",
      "Function components and props.",
      "React 19.2 or later for useEffectEvent.",
    ],
    lessons: [
      {
        title: "Rules of Hooks, useState and useReducer",
        diagram: {
          kind: "split",
          caption: "Both Hooks give a component memory. Reach for useReducer when several values change together or the next state depends on an action type.",
          headings: ["useState", "useReducer"],
          items: [
            { label: "One value, simple updates", detail: "setCount(c => c + 1)", group: 0 },
            { label: "Logic lives in event handlers", group: 0 },
            { label: "Great default", detail: "most component state", group: 0 },
            { label: "Many related values", detail: "a form, a cart, a wizard", group: 1 },
            { label: "Logic in one pure reducer", detail: "(state, action) => nextState", group: 1 },
            { label: "Easy to test in isolation", group: 1 },
          ],
        },
        explanation: "- Hooks are functions starting with use that let components use React features\n- Call Hooks only at the top level of a component or custom Hook, never in loops or conditions\n- React relies on call order to match each Hook call with its stored state\n- Setting state schedules a re-render; the new value is visible on the next render, not immediately\n- useReducer moves update logic into a pure function driven by actions",
        keyPoints: [
          { tone: "key", text: "Use an updater function, setCount(c => c + 1), when the next state depends on the previous one." },
          { tone: "key", text: "State is a snapshot: reading count right after setCount(5) still gives the old value in that render." },
          { tone: "tip", text: "Pass a function to initialise expensive state once: useState(() => buildIndex(items))." },
          { tone: "warning", text: "Never mutate state objects or arrays; create a new one so React sees the change." },
        ],
        example: "- const [count, setCount] = useState(0)\n- Three setCount(count + 1) calls in one click add 1; three setCount(c => c + 1) add 3\n- const [cart, dispatch] = useReducer(cartReducer, [])\n- dispatch({ type: 'added', item }) keeps the logic in cartReducer",
        code: "import { useReducer, useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  function addThree() {\n    setCount(c => c + 1);\n    setCount(c => c + 1);\n    setCount(c => c + 1); // 3 queued updates -> +3\n  }\n  return <button onClick={addThree}>{count}</button>;\n}\n\nfunction cartReducer(cart, action) {\n  switch (action.type) {\n    case 'added':\n      return [...cart, action.item];            // new array, no mutation\n    case 'removed':\n      return cart.filter(item => item.id !== action.id);\n    default:\n      throw new Error('Unknown action: ' + action.type);\n  }\n}\n\nfunction Cart() {\n  const [cart, dispatch] = useReducer(cartReducer, []);\n  return (\n    <button onClick={() => dispatch({ type: 'added', item: { id: Date.now() } })}>\n      Items: {cart.length}\n    </button>\n  );\n}",
        apiReference: [
          {
            name: "useState",
            kind: "Hook",
            signature: "const [state, setState] = useState(initialState)",
            params: [{ name: "initialState", type: "any | () => any", description: "The first value, or an initialiser function run once." }],
            returns: "The current state and a setter that accepts a value or an updater function.",
          },
          {
            name: "useReducer",
            kind: "Hook",
            signature: "const [state, dispatch] = useReducer(reducer, initialArg, init?)",
            params: [
              { name: "reducer", type: "(state, action) => state", description: "A pure function computing the next state." },
              { name: "init", type: "(initialArg) => state", description: "Optional lazy initialiser." },
            ],
            returns: "The current state and a dispatch function that sends actions to the reducer.",
          },
        ],
        exercise: "- Build a counter and prove that setCount(count + 1) three times only adds 1\n- Convert a form with four useState calls into one useReducer\n- Initialise state from localStorage with a lazy initialiser",
        checkpoint: "- Why must Hooks run in the same order every render?\n- When is an updater function required?\n- What makes a reducer 'pure'?",
        mistake: "- Do not call Hooks inside if statements or loops\n- Do not push into a state array; spread into a new one\n- Do not read state right after setting it and expect the new value",
        interview: [
          {
            question: "Why can't Hooks be called conditionally?",
            definition: "React identifies each Hook by the order in which it is called during a render.",
            answer: "React stores Hook state in a list attached to the component. On every render it walks that list in call order, so the third Hook call always gets the third slot. If a condition skipped a call, every later Hook would read another Hook's state. Put the condition inside the Hook's logic instead, or early-return after all Hooks are called.",
            code: "// ❌ Breaks call order\nif (user) {\n  const [name, setName] = useState(user.name);\n}\n\n// ✅ Always call, branch inside\nconst [name, setName] = useState(user?.name ?? '');",
            similar: [
              { question: "What is state batching?", answer: "React groups several state updates from one event into a single re-render." },
            ],
          },
        ],
      },
      {
        title: "Effects: useEffect, useLayoutEffect and useEffectEvent",
        diagram: {
          kind: "flow",
          caption: "The Effect lifecycle: React commits the UI, runs the Effect, and when dependencies change it cleans up the old Effect before running the new one.",
          items: [
            { label: "Render", detail: "pure: compute JSX from props and state" },
            { label: "Commit", detail: "React updates the DOM" },
            { label: "useLayoutEffect", detail: "runs before paint: measure layout here" },
            { label: "Paint", detail: "the browser shows the frame" },
            { label: "useEffect", detail: "connect to an external system" },
            { label: "Dependencies change", detail: "cleanup runs, then the Effect runs again" },
          ],
        },
        explanation: "- useEffect connects a component to an external system: a socket, a timer, a browser API\n- The dependency array lists every reactive value the Effect reads\n- Return a cleanup function to disconnect or cancel\n- useEffectEvent (React 19.2) creates a non-reactive function that always sees the latest props and state\n- useLayoutEffect runs before paint for measurements; useInsertionEffect is for CSS-in-JS libraries",
        keyPoints: [
          { tone: "key", text: "You might not need an Effect: derive values during render and handle user events in event handlers." },
          { tone: "key", text: "useEffectEvent separates 'what should re-run the Effect' from 'what the Effect reads at that moment'." },
          { tone: "tip", text: "In development Strict Mode React runs setup, cleanup, setup once to prove your cleanup works." },
          { tone: "warning", text: "Do not call an Effect Event during render or pass it to other components; call it only from Effects." },
        ],
        example: "- A chat room connects in an Effect keyed on roomId and disconnects in cleanup\n- A 'connected!' toast should use the current theme without reconnecting when theme changes\n- onConnected = useEffectEvent(() => showNotification('Connected!', theme))\n- Measuring a tooltip's height before showing it uses useLayoutEffect",
        useCase: {
          scenario: "Changing the colour theme of a chat app reconnects the chat socket, because the Effect reads theme to show a notification.",
          example: "Move the notification into const onConnected = useEffectEvent(...) and call it from the Effect; the dependency array is now just [roomId].",
          usage: "The socket reconnects only when the room changes, while notifications still use the latest theme.",
        },
        code: "import { useEffect, useEffectEvent } from 'react';\n\nfunction ChatRoom({ roomId, theme }) {\n  // Non-reactive: always reads the latest theme, never re-runs the Effect\n  const onConnected = useEffectEvent(() => {\n    showNotification('Connected!', theme);\n  });\n\n  useEffect(() => {\n    const connection = createConnection(roomId);\n    connection.on('connected', () => onConnected());\n    connection.connect();\n    return () => connection.disconnect();   // cleanup\n  }, [roomId]);                             // theme is not a dependency\n\n  return <h1>Welcome to {roomId}</h1>;\n}\n\n// ❌ Not an Effect: derive during render instead\nfunction TodoList({ todos, filter }) {\n  const visible = todos.filter(t => filter === 'all' || t.status === filter);\n  return <ul>{visible.map(t => <li key={t.id}>{t.text}</li>)}</ul>;\n}",
        apiReference: [
          {
            name: "useEffect",
            kind: "Hook",
            signature: "useEffect(setup, dependencies?)",
            params: [
              { name: "setup", type: "() => (() => void) | void", description: "Connects to the system; may return a cleanup function." },
              { name: "dependencies", type: "any[]", description: "Reactive values read by setup. [] runs once; omitted runs after every render." },
            ],
            returns: "undefined",
          },
          {
            name: "useEffectEvent",
            kind: "Hook (React 19.2)",
            signature: "const onEvent = useEffectEvent(callback)",
            params: [{ name: "callback", type: "function", description: "Logic that reads the latest props/state but should not trigger the Effect." }],
            returns: "An Effect Event function with a stable identity; do not list it in dependencies.",
          },
        ],
        exercise: "- Write an Effect that subscribes to window resize and cleans up\n- Refactor an Effect that sets derived state into a calculation during render\n- Use useEffectEvent to log page visits with the current cart size without re-logging when the cart changes",
        checkpoint: "- What belongs in the dependency array?\n- Why does React run your Effect twice in development?\n- What problem does useEffectEvent solve?",
        mistake: "- Do not silence the dependency linter; restructure the code instead\n- Do not use Effects to transform data for rendering\n- Do not forget cleanup for subscriptions, timers and fetches",
        interview: [
          {
            question: "What is useEffectEvent and when should you use it?",
            definition: "A React 19.2 Hook that wraps logic in an Effect Event: a function called from Effects that always sees the latest values but is not reactive.",
            answer: "Use it when an Effect must read a value (like theme or a logging context) without that value causing the Effect to re-synchronise. The Effect keeps only true dependencies such as roomId, and the Effect Event reads everything else fresh. It replaces workarounds like refs that mirror the latest props.",
            similar: [
              { question: "When would you use useLayoutEffect instead of useEffect?", answer: "When you must measure or change the DOM before the browser paints, to avoid a visible flicker." },
            ],
          },
        ],
      },
      {
        title: "Refs, context and the use API",
        diagram: {
          kind: "tree",
          caption: "React 19 simplified refs and context: function components receive ref as a normal prop, ref callbacks can return cleanup, and context can be read conditionally with use().",
          items: [
            { label: "useRef(initial)", detail: "a mutable box that survives renders" },
            { label: "DOM access", detail: "<input ref={inputRef} />", depth: 1 },
            { label: "ref as a prop (React 19)", detail: "no forwardRef needed", depth: 1 },
            { label: "useImperativeHandle", detail: "expose a limited API to the parent", depth: 1 },
            { label: "Context" },
            { label: "<ThemeContext value={...}>", detail: "React 19: render the context as the provider", depth: 1 },
            { label: "useContext(ThemeContext)", detail: "read at the top level", depth: 1 },
            { label: "use(ThemeContext)", detail: "can be called inside if statements", depth: 1 },
          ],
        },
        explanation: "- useRef holds a value that changes without re-rendering, most often a DOM node\n- In React 19 function components accept ref as a regular prop\n- useImperativeHandle customises what a parent sees through the ref\n- Context passes data deeply without prop drilling; React 19 lets you render <Context value={...}> directly\n- use(context) reads context like useContext but may be called conditionally",
        keyPoints: [
          { tone: "key", text: "Changing ref.current does not re-render. Use state for anything shown on screen." },
          { tone: "tip", text: "Ref callbacks can return a cleanup function in React 19, like Effects." },
          { tone: "tip", text: "Split context by how often values change: a rarely-changing theme should not share a provider with a ticking clock." },
          { tone: "warning", text: "Do not read or write ref.current during render (except lazy initialisation); do it in handlers and Effects." },
        ],
        example: "- const inputRef = useRef(null); inputRef.current.focus() in a click handler\n- function MyInput({ placeholder, ref }) { return <input placeholder={placeholder} ref={ref} /> }\n- <ThemeContext value=\"dark\"><App /></ThemeContext>\n- if (show) { const theme = use(ThemeContext); }",
        code: "import { createContext, use, useImperativeHandle, useRef } from 'react';\n\nconst ThemeContext = createContext('light');\n\n// React 19: ref is just a prop\nfunction VideoPlayer({ src, ref }) {\n  const videoRef = useRef(null);\n  useImperativeHandle(ref, () => ({\n    play: () => videoRef.current.play(),\n    pause: () => videoRef.current.pause(),\n  }), []);\n  return <video ref={videoRef} src={src} />;\n}\n\nfunction Heading({ children, highlighted }) {\n  if (!highlighted) return <h2>{children}</h2>;\n  const theme = use(ThemeContext);          // allowed after a branch\n  return <h2 className={theme}>{children}</h2>;\n}\n\nexport default function App() {\n  const player = useRef(null);\n  return (\n    <ThemeContext value=\"dark\">\n      <VideoPlayer ref={player} src=\"/intro.mp4\" />\n      <button onClick={() => player.current.play()}>Play</button>\n      <Heading highlighted>Now playing</Heading>\n    </ThemeContext>\n  );\n}",
        apiReference: [
          {
            name: "useRef",
            kind: "Hook",
            signature: "const ref = useRef(initialValue)",
            params: [{ name: "initialValue", type: "any", description: "The value of ref.current on the first render." }],
            returns: "An object { current } that persists for the component's lifetime.",
          },
          {
            name: "use",
            kind: "API",
            signature: "const value = use(resource)",
            params: [{ name: "resource", type: "Promise | Context", description: "A promise to unwrap (suspends until it resolves) or a context to read." }],
            returns: "The resolved promise value or the context value. May be called in conditions and loops.",
          },
        ],
        exercise: "- Focus an input when a button is clicked using useRef\n- Remove forwardRef from an old component using React 19's ref prop\n- Provide a theme context and read it with use() inside a conditional",
        checkpoint: "- Why doesn't changing a ref re-render the component?\n- What does useImperativeHandle protect?\n- How does use(Context) differ from useContext?",
        mistake: "- Do not store render-visible data in refs\n- Do not expose the whole DOM node when a small imperative API is enough\n- Do not put fast-changing values in a context that many components read",
      },
      {
        title: "Performance: transitions, deferred values and memoisation",
        diagram: {
          kind: "split",
          caption: "Two families of performance Hooks: transitions keep the UI responsive during slow renders, memoisation skips work that has not changed. The React Compiler can add the memoisation for you.",
          headings: ["Stay responsive", "Skip repeated work"],
          items: [
            { label: "useTransition", detail: "mark an update as non-blocking; get isPending", group: 0 },
            { label: "startTransition(async () => ...)", detail: "async transitions (Actions)", group: 0 },
            { label: "useDeferredValue", detail: "render a slow part with a lagging value", group: 0 },
            { label: "useMemo", detail: "cache a calculation between renders", group: 1 },
            { label: "useCallback", detail: "cache a function identity", group: 1 },
            { label: "React Compiler", detail: "memoises automatically at build time", group: 1 },
          ],
        },
        explanation: "- A transition marks a state update as non-urgent so typing and clicks stay responsive\n- useTransition returns isPending and startTransition; in React 19 the callback may be async\n- useDeferredValue shows stale content while a fresh version renders in the background\n- useMemo and useCallback cache values and functions between renders\n- The React Compiler analyses components and inserts memoisation automatically",
        keyPoints: [
          { tone: "key", text: "Transitions do not make rendering faster; they let urgent updates interrupt slow ones." },
          { tone: "tip", text: "Measure before memoising. With the React Compiler enabled, most manual useMemo/useCallback can go." },
          { tone: "tip", text: "Combine useDeferredValue with Suspense to keep old results visible while new ones load." },
          { tone: "warning", text: "Updates to a text input's own value must not be wrapped in a transition, or typing lags." },
        ],
        example: "- const [isPending, startTransition] = useTransition()\n- startTransition(() => setTab('posts')) keeps the current tab interactive\n- const deferredQuery = useDeferredValue(query) feeds a slow search list\n- const visible = useMemo(() => filterTodos(todos, tab), [todos, tab])",
        code: "import { memo, useDeferredValue, useMemo, useState, useTransition } from 'react';\n\nfunction SearchPage({ items }) {\n  const [query, setQuery] = useState('');\n  const deferredQuery = useDeferredValue(query);      // lags behind while typing\n  const isStale = query !== deferredQuery;\n\n  return (\n    <>\n      <input value={query} onChange={e => setQuery(e.target.value)} />\n      <div style={{ opacity: isStale ? 0.5 : 1 }}>\n        <Results items={items} query={deferredQuery} />\n      </div>\n    </>\n  );\n}\n\nconst Results = memo(function Results({ items, query }) {\n  const matches = useMemo(\n    () => items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())),\n    [items, query],\n  );\n  return <ul>{matches.map(m => <li key={m.id}>{m.name}</li>)}</ul>;\n});\n\nfunction Tabs() {\n  const [tab, setTab] = useState('about');\n  const [isPending, startTransition] = useTransition();\n  return (\n    <button disabled={isPending} onClick={() => startTransition(() => setTab('posts'))}>\n      {isPending ? 'Loading…' : `Current: ${tab}`}\n    </button>\n  );\n}",
        apiReference: [
          {
            name: "useTransition",
            kind: "Hook",
            signature: "const [isPending, startTransition] = useTransition()",
            params: [],
            returns: "isPending while a transition runs, and startTransition(action) where action may be async.",
          },
          {
            name: "useDeferredValue",
            kind: "Hook",
            signature: "const deferred = useDeferredValue(value, initialValue?)",
            params: [
              { name: "value", type: "any", description: "The value to defer." },
              { name: "initialValue", type: "any", description: "Optional value for the first render (React 19)." },
            ],
            returns: "The value, possibly one or more renders behind while a newer render is prepared.",
          },
          {
            name: "useMemo / useCallback",
            kind: "Hooks",
            signature: "useMemo(calculate, deps)\nuseCallback(fn, deps)",
            params: [{ name: "deps", type: "any[]", description: "Recalculate only when one of these changes." }],
            returns: "The cached value or function from the last render with equal dependencies.",
          },
        ],
        exercise: "- Make a slow filtered list responsive with useDeferredValue\n- Switch tabs with a transition and show isPending\n- Enable the React Compiler and delete manual memoisation that it now covers",
        checkpoint: "- What is the difference between useTransition and useDeferredValue?\n- When does useCallback actually help?\n- What does the React Compiler do?",
        mistake: "- Do not memoise everything by default; it adds complexity and memory\n- Do not wrap input value updates in startTransition\n- Do not forget memo() on the child when passing memoised callbacks for performance",
        interview: [
          {
            question: "What is the difference between useMemo and useCallback?",
            definition: "useMemo caches the result of a calculation; useCallback caches the function itself.",
            answer: "useCallback(fn, deps) is equivalent to useMemo(() => fn, deps). Use useMemo to avoid recomputing an expensive value and useCallback to keep a function's identity stable, typically so a memo() child or an Effect dependency does not change on every render. The React Compiler can apply both automatically.",
            similar: [
              { question: "What does memo() do?", answer: "It skips re-rendering a component when its props are shallowly equal to the previous render's props." },
              { question: "Why use a transition for tab switches?", answer: "So an expensive tab render can be interrupted by urgent input instead of freezing the UI." },
            ],
          },
        ],
      },
      {
        title: "Actions: useActionState, useFormStatus and useOptimistic",
        diagram: {
          kind: "flow",
          caption: "A form Action in React 19: submitting calls the action inside a transition, pending UI and an optimistic result appear immediately, and the final state replaces them when the action settles.",
          items: [
            { label: "<form action={formAction}>", detail: "a function, not a URL" },
            { label: "useFormStatus().pending = true", detail: "submit buttons disable themselves" },
            { label: "useOptimistic shows the expected result", detail: "the new message appears instantly" },
            { label: "Action runs (async)", detail: "e.g. a Server Function or fetch" },
            { label: "useActionState returns the result", detail: "success data or an error message" },
          ],
        },
        explanation: "- An Action is a function (often async) triggered by a form or a transition\n- <form action={fn}> passes FormData to fn and resets uncontrolled fields on success\n- useActionState keeps the result of the last submission and an isPending flag\n- useFormStatus (react-dom) lets a nested button read the parent form's pending state\n- useOptimistic shows the expected outcome while the Action is still running",
        keyPoints: [
          { tone: "key", text: "useActionState's action receives (previousState, formData) and returns the next state." },
          { tone: "tip", text: "useFormStatus must be called in a component rendered inside the <form>, not in the form's own component." },
          { tone: "tip", text: "Optimistic state automatically reverts to the real state when the Action finishes or fails." },
          { tone: "warning", text: "Validate on the server too: a client Action can be bypassed." },
        ],
        example: "- const [error, submitAction, isPending] = useActionState(updateName, null)\n- <form action={submitAction}> <input name=\"name\" /> <SubmitButton /> </form>\n- function SubmitButton() { const { pending } = useFormStatus(); ... }\n- const [optimisticMessages, addOptimistic] = useOptimistic(messages, (list, text) => [...list, { text, sending: true }])",
        useCase: {
          scenario: "A comment box feels slow: after clicking Send, nothing happens for a second while the request completes.",
          example: "Wrap the send in a form Action, call addOptimistic(text) first so the comment appears greyed out, and let useActionState hold any error to show under the form.",
          usage: "Users see their comment instantly; if the request fails, it disappears and the error explains why.",
        },
        code: "import { useActionState, useOptimistic } from 'react';\nimport { useFormStatus } from 'react-dom';\n\nfunction SubmitButton() {\n  const { pending } = useFormStatus();          // reads the parent <form>\n  return <button disabled={pending}>{pending ? 'Sending…' : 'Send'}</button>;\n}\n\nexport function Comments({ comments, sendComment }) {\n  const [optimistic, addOptimistic] = useOptimistic(\n    comments,\n    (current, text) => [...current, { id: 'temp', text, sending: true }],\n  );\n\n  const [error, formAction] = useActionState(async (previous, formData) => {\n    const text = formData.get('text');\n    addOptimistic(text);\n    try {\n      await sendComment(text);\n      return null;                              // no error\n    } catch (e) {\n      return 'Could not send. Try again.';\n    }\n  }, null);\n\n  return (\n    <>\n      <ul>\n        {optimistic.map(c => (\n          <li key={c.id} style={{ opacity: c.sending ? 0.5 : 1 }}>{c.text}</li>\n        ))}\n      </ul>\n      <form action={formAction}>\n        <input name=\"text\" required />\n        <SubmitButton />\n        {error && <p role=\"alert\">{error}</p>}\n      </form>\n    </>\n  );\n}",
        apiReference: [
          {
            name: "useActionState",
            kind: "Hook",
            signature: "const [state, formAction, isPending] = useActionState(action, initialState, permalink?)",
            params: [
              { name: "action", type: "(prevState, payload) => state | Promise<state>", description: "Runs on submit; its return value becomes the new state." },
              { name: "initialState", type: "any", description: "State before the first submission." },
            ],
            returns: "The latest state, an action to pass to <form action> or a button, and isPending.",
          },
          {
            name: "useFormStatus",
            kind: "Hook (react-dom)",
            signature: "const { pending, data, method, action } = useFormStatus()",
            params: [],
            returns: "The status of the closest parent <form>'s last submission.",
          },
          {
            name: "useOptimistic",
            kind: "Hook",
            signature: "const [optimisticState, addOptimistic] = useOptimistic(state, updateFn)",
            params: [{ name: "updateFn", type: "(currentState, optimisticValue) => nextState", description: "Merges an optimistic value into the current state." }],
            returns: "The state to render (optimistic while an Action runs) and a function to add optimistic values.",
          },
        ],
        exercise: "- Build a rename form with useActionState that shows a server error\n- Extract the submit button and make it read useFormStatus\n- Add an optimistic like button that reverts when the request fails",
        checkpoint: "- What arguments does a useActionState action receive?\n- Why must useFormStatus be used in a child of the form?\n- When does optimistic state revert?",
        mistake: "- Do not call useFormStatus in the component that renders the <form>\n- Do not keep optimistic state after the Action fails\n- Do not trust client-side validation alone",
      },
      {
        title: "use(), Suspense and custom Hooks",
        diagram: {
          kind: "flow",
          caption: "Reading a promise with use(): the component suspends, the nearest Suspense boundary shows its fallback, and rendering resumes with the resolved value.",
          items: [
            { label: "Parent creates a promise", detail: "ideally in a Server Component or a cache" },
            { label: "Child calls use(promise)", detail: "the component suspends if pending" },
            { label: "<Suspense fallback>", detail: "shows a loading state meanwhile" },
            { label: "Promise resolves", detail: "React renders the child with the value" },
            { label: "Promise rejects", detail: "the nearest Error Boundary handles it" },
          ],
        },
        explanation: "- use(promise) unwraps a promise inside render and integrates with Suspense\n- Create the promise outside the component (or in a Server Component), not on every render\n- A custom Hook is a function starting with use that calls other Hooks\n- useSyncExternalStore subscribes safely to an external store such as the browser's online status\n- useId generates stable unique IDs for accessibility attributes; useDebugValue labels custom Hooks in DevTools",
        keyPoints: [
          { tone: "key", text: "Custom Hooks share stateful logic, not state: each component calling useOnlineStatus() gets its own state." },
          { tone: "tip", text: "Pass promises from Server Components to Client Components and read them with use() for streaming data." },
          { tone: "warning", text: "Never create a new promise during render and pass it to use(); it restarts on every render." },
          { tone: "warning", text: "useId is not for list keys; derive keys from your data." },
        ],
        example: "- const comments = use(commentsPromise) inside a <Suspense fallback={<Spinner />}>\n- function useOnlineStatus() { return useSyncExternalStore(subscribe, () => navigator.onLine, () => true) }\n- const id = useId(); <label htmlFor={id}> ... <input id={id} />\n- useDebugValue(isOnline ? 'Online' : 'Offline') shows in React DevTools",
        code: "import { Suspense, use, useDebugValue, useId, useSyncExternalStore } from 'react';\n\nfunction subscribe(callback) {\n  window.addEventListener('online', callback);\n  window.addEventListener('offline', callback);\n  return () => {\n    window.removeEventListener('online', callback);\n    window.removeEventListener('offline', callback);\n  };\n}\n\nexport function useOnlineStatus() {\n  const isOnline = useSyncExternalStore(\n    subscribe,\n    () => navigator.onLine,   // client snapshot\n    () => true,               // server snapshot\n  );\n  useDebugValue(isOnline ? 'Online' : 'Offline');\n  return isOnline;\n}\n\nfunction Comments({ commentsPromise }) {\n  const comments = use(commentsPromise);   // suspends until resolved\n  return comments.map(c => <p key={c.id}>{c.text}</p>);\n}\n\nexport function Post({ commentsPromise }) {\n  const id = useId();\n  const online = useOnlineStatus();\n  return (\n    <section aria-labelledby={id}>\n      <h2 id={id}>Comments {online ? '' : '(offline)'}</h2>\n      <Suspense fallback={<p>Loading comments…</p>}>\n        <Comments commentsPromise={commentsPromise} />\n      </Suspense>\n    </section>\n  );\n}",
        apiReference: [
          {
            name: "useSyncExternalStore",
            kind: "Hook",
            signature: "const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)",
            params: [
              { name: "subscribe", type: "(callback) => unsubscribe", description: "Subscribes to the store and returns a cleanup." },
              { name: "getSnapshot", type: "() => value", description: "Returns the current store value; must be cached/immutable." },
              { name: "getServerSnapshot", type: "() => value", description: "Value used during server rendering and hydration." },
            ],
            returns: "The current snapshot; the component re-renders when it changes.",
          },
          {
            name: "useId",
            kind: "Hook",
            signature: "const id = useId()",
            params: [],
            returns: "A unique, stable string ID that matches between server and client.",
          },
        ],
        exercise: "- Write useWindowWidth with useSyncExternalStore\n- Stream a list of comments with use() and a Suspense fallback\n- Replace hand-made random IDs in a form with useId",
        checkpoint: "- What happens when use() receives a pending promise?\n- Do two components using the same custom Hook share state?\n- Why does useSyncExternalStore need a server snapshot?",
        mistake: "- Do not create promises inside the component that reads them with use()\n- Do not name a regular function useSomething unless it calls Hooks\n- Do not return a new object from getSnapshot on every call",
        interview: [
          {
            question: "How does the use() API differ from other Hooks?",
            definition: "use is a React API that reads the value of a resource: a promise or a context.",
            answer: "Unlike Hooks, use can be called inside conditions and loops. Given a promise it suspends the component until the promise resolves, working with Suspense for loading states and Error Boundaries for failures. Given a context it behaves like useContext. The promise should come from a stable source, such as a Server Component or a cache, not be recreated on every render.",
            similar: [
              { question: "When should you write a custom Hook?", answer: "When two components need the same stateful logic, such as subscribing to online status or a media query." },
            ],
          },
        ],
      },
    ],
    project: "Build a 'Reading list' app: a useReducer-powered list, an add-book form using useActionState with useFormStatus and useOptimistic, a search box with useDeferredValue, a theme provided through <ThemeContext value>, a useOnlineStatus custom Hook built on useSyncExternalStore, and a details panel that reads a promise with use() inside Suspense. Add one Effect that syncs the list to localStorage and one useEffectEvent that logs changes with the current theme.",
    summary: "- Call Hooks at the top level, in the same order every render\n- useState for simple values, useReducer for related state updated by actions\n- Effects synchronise with external systems; useEffectEvent reads fresh values without re-running them\n- Refs hold non-rendered values; ref is a prop in React 19; context and use() pass data deeply\n- Transitions and useDeferredValue keep the UI responsive; memoise only what measurement justifies\n- Actions power forms with useActionState, useFormStatus and useOptimistic\n- use() unwraps promises with Suspense; custom Hooks share stateful logic",
    glossary: [
      { term: "Hook", definition: "A function starting with use that lets a component use React features such as state or effects." },
      { term: "Rules of Hooks", definition: "Call Hooks only at the top level of components or custom Hooks, never conditionally." },
      { term: "Reducer", definition: "A pure function (state, action) => nextState used by useReducer." },
      { term: "Effect", definition: "Code that synchronises a component with an external system after rendering." },
      { term: "Effect Event", definition: "A non-reactive function created by useEffectEvent and called from Effects." },
      { term: "Transition", definition: "A non-urgent state update that urgent updates can interrupt." },
      { term: "Action", definition: "A function, often async, run by a form submission or a transition, with built-in pending state." },
      { term: "Optimistic update", definition: "Showing the expected result of an Action before it completes." },
      { term: "Suspense", definition: "A component that shows a fallback while its children wait for data or code." },
      { term: "Custom Hook", definition: "A function starting with use that composes other Hooks to share logic." },
      { term: "React Compiler", definition: "A build-time tool that automatically memoises components and values." },
    ],
    sources: [
      source("https://react.dev/reference/react/hooks", "Built-in React Hooks"),
      source("https://react.dev/reference/rules/rules-of-hooks", "Rules of Hooks"),
      source("https://react.dev/reference/react/useEffectEvent", "useEffectEvent"),
      source("https://react.dev/learn/you-might-not-need-an-effect", "You Might Not Need an Effect"),
      source("https://react.dev/reference/react/useActionState", "useActionState"),
      source("https://react.dev/reference/react-dom/hooks/useFormStatus", "useFormStatus"),
      source("https://react.dev/reference/react/useOptimistic", "useOptimistic"),
      source("https://react.dev/reference/react/use", "use"),
      source("https://react.dev/reference/react/useSyncExternalStore", "useSyncExternalStore"),
      source("https://react.dev/blog/2024/12/05/react-19", "React v19"),
      source("https://react.dev/learn/react-compiler", "React Compiler"),
    ],
  },
};

export const REACT_HOOKS_CORE = guide.curriculum;
export default { ...guide, version: 2, curriculum: { ...guide.curriculum, title: "React 19+ Hooks", minutes: guide.curriculum.minutes + REACT_HOOK_LESSONS.length * 5, lessons: [...guide.curriculum.lessons, ...REACT_HOOK_LESSONS] } } satisfies TechnologyGuide;
