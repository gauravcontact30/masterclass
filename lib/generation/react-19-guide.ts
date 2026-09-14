import { Curriculum } from "@/lib/domain";

/**
 * The "Complete React 19 path" guide seeded into every library alongside the
 * Next.js 16 guide (see default-library.ts). Hand-authored like that guide, so
 * every lesson carries the richer sections: a code-drawn figure, tone-coloured
 * key points, a real-world use case, a vocabulary builder, a code sample and a
 * full API/syntax reference. Together the lessons cover every built-in Hook
 * (react and react-dom) plus the React 19.0 → 19.3 additions.
 *
 * Facts are grounded in the official reference and release posts on react.dev
 * (listed in `sources`); the explanations and examples are written from scratch
 * for this course rather than copied from those pages.
 */

const RETRIEVED_AT = "2026-09-11T00:00:00.000Z";

/** Point-wise fields render as real bullets (see render.ts's bulletLines). */
const points = (...items: string[]) => items.map(item => `- ${item}`).join("\n");

export const REACT_19_GUIDE: Curriculum = {
  title: "Complete React 19 path",
  minutes: 540,
  objectives: [
    "Build interfaces from pure components, props and JSX, and manage local state with useState and useReducer.",
    "Share data with context, reach the DOM with refs, and synchronise with outside systems through every Effect Hook.",
    "Keep apps fast and responsive with useMemo, useCallback, useTransition, useDeferredValue and the React Compiler.",
    "Handle forms and mutations with React 19 Actions: useActionState, useFormStatus and useOptimistic.",
    "Read async data with use and Suspense, and split work between Server Components and Server Functions.",
    "Apply the React 19.2 and 19.3 additions: Activity, useEffectEvent, View Transitions and Fragment refs.",
  ],
  prerequisites: [
    "Comfortable with modern JavaScript: arrow functions, destructuring, spread syntax, modules and promises.",
    "Basic HTML and CSS, and a feel for how the DOM represents a page.",
    "Node.js and a package manager installed, or an online sandbox, to run the examples.",
  ],
  lessons: [
    {
      title: "Components, JSX and props",
      diagram: {
        kind: "tree",
        caption: "A React app is a tree of components. Data travels down as props, each component returns JSX that describes its slice of the UI, and React turns the whole tree into DOM under the root you create.",
        items: [
          { label: "createRoot(document.getElementById('root'))", detail: "react-dom/client entry point" },
          { label: "<App />", detail: "the root component", depth: 1 },
          { label: "<Header title=\"Shop\" />", detail: "props flow down from the parent", depth: 2 },
          { label: "<ProductList products={items}>", detail: "maps an array to rows", depth: 2 },
          { label: "<ProductRow key={p.id} />", detail: "key identifies each row among siblings", depth: 3 },
          { label: "<Card>{children}</Card>", detail: "nested JSX arrives as props.children", depth: 2 },
          { label: "<Footer />", depth: 2 },
        ],
      },
      explanation: points(
        "A component is a JavaScript function that returns JSX, and its name must start with a capital letter",
        "JSX looks like HTML but compiles to function calls, so curly braces can embed any JavaScript expression",
        "Props are the read-only inputs a parent passes to a child, like arguments to a function",
        "children is a special prop holding whatever JSX you nest between a component's opening and closing tags",
        "Lists are rendered with map, and every item needs a key that is stable and unique among its siblings",
        "Components must be pure: the same props, state and context always produce the same JSX",
      ),
      keyPoints: [
        { tone: "key", text: "A component is a function that returns JSX. Capitalise its name so React treats it as a component, not an HTML tag." },
        { tone: "key", text: "Props flow one way, from parent to child. A child never modifies the props it receives." },
        { tone: "tip", text: "Use a stable id from your data as the key. Array indexes break when items are inserted, removed or reordered." },
        { tone: "tip", text: "Return null to render nothing, and branch inside JSX with && or a ternary." },
        { tone: "warning", text: "JSX attributes are camelCase: className instead of class, htmlFor instead of for, onClick instead of onclick." },
        { tone: "warning", text: "Never define a component inside another component; it is re-created on every render and loses its state." },
      ],
      example: points(
        "ProductRow receives name and price as props and returns one list item",
        "ProductList maps an array of products to ProductRow elements, each keyed by product.id",
        "Card renders props.children inside a styled border, so it can wrap any content",
        "createRoot attaches the whole tree to the div whose id is root",
      ),
      useCase: {
        scenario: "An online store shows the same product tile on the home page, in search results and in the wishlist, each time with different data.",
        example: "Write one ProductTile({ name, price, image, onAdd }) component and render it from all three pages with a different product object each time, mapping arrays with product.id as the key.",
        usage: "A design change to the tile is made once and appears everywhere, and when a list is filtered React only updates the tiles whose props actually changed.",
      },
      code: `// ProductList.jsx
function ProductRow({ name, price }) {
  return (
    <li className="row">
      {name} <strong>{price}</strong>
    </li>
  );
}

export default function ProductList({ products }) {
  if (products.length === 0) {
    return <p>No products found.</p>;
  }
  return (
    <ul>
      {products.map(p => (
        <ProductRow key={p.id} name={p.name} price={p.price} />
      ))}
    </ul>
  );
}

// main.jsx
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(<ProductList products={data} />);`,
      apiReference: [
        {
          name: "createRoot",
          kind: "function (react-dom/client)",
          signature: "const root = createRoot(domNode, options?)\nroot.render(reactNode)\nroot.unmount()",
          params: [
            { name: "domNode", type: "Element", description: "The DOM element React will manage. Its existing contents are replaced by your UI." },
            { name: "options", type: "object", description: "Optional: onCaughtError, onUncaughtError, onRecoverableError and identifierPrefix." },
          ],
          returns: "A root object: render(reactNode) displays JSX inside the node, unmount() destroys the tree.",
          notes: "Call createRoot once per app. For HTML that was rendered on the server, use hydrateRoot(domNode, reactNode) instead.",
        },
        {
          name: "JSX element, key and children",
          kind: "syntax",
          signature: "<Component prop={value} key={id}>\n  {children}\n</Component>\n\n<>{siblings}</>  // Fragment",
          params: [
            { name: "prop", type: "any", description: "Any JavaScript value in curly braces becomes a property of the props object." },
            { name: "key", type: "string | number", description: "Identifies an item among its siblings in a list. It is not passed to the component as a prop." },
            { name: "children", type: "ReactNode", description: "Nested JSX, received by the component as props.children." },
          ],
          returns: "A React element: a plain object describing what to render.",
          notes: "A component returns a single root. Wrap siblings in a Fragment <>...</> when you do not want an extra DOM node.",
        },
      ],
      exercise: points(
        "Build a Greeting component that takes a name prop and renders Hello, followed by the name",
        "Render a list of five users with map, keyed by their id",
        "Wrap the list in a Card component that renders its children inside a border",
      ),
      checkpoint: points(
        "Why must a component name start with a capital letter?",
        "What goes wrong when you use the array index as the key of a sortable list?",
        "How does a component receive the JSX nested between its tags?",
      ),
      mistake: points(
        "Do not mutate props, or objects created before render; components must stay pure",
        "Do not write class= or for= in JSX; use className and htmlFor",
        "Do not declare a component inside another component's body",
      ),
      vocabulary: [
        { word: "declarative", meaning: "Describing what the result should look like rather than listing the steps that produce it.", example: "React is declarative: you describe the UI for each state and React updates the DOM to match.", synonyms: ["descriptive", "outcome-based", "what-not-how", "intent-based", "state-driven"], antonyms: ["imperative", "procedural", "step-by-step", "manual sequencing", "command-driven"] },
        { word: "encapsulate", meaning: "To wrap related logic and markup into one unit that hides its internal details.", example: "A DatePicker component encapsulates its calendar logic behind a few simple props.", synonyms: ["enclose", "package", "hide internals", "contain", "wrap up"], antonyms: ["expose", "scatter", "leak details", "spread out", "publicise internals"] },
        { word: "interpolate", meaning: "To insert the value of an expression into a surrounding template.", example: "Curly braces interpolate the user's name into the heading.", synonyms: ["embed", "insert", "substitute in", "splice", "inject a value"], antonyms: ["hard-code", "omit", "literal text", "static string", "escape"] },
        { word: "immutable", meaning: "Unable to be changed after it is created; an update produces a new value instead.", example: "Props are immutable from the child's point of view, so it never edits them.", synonyms: ["unchangeable", "read-only", "frozen", "copy-on-write", "unmodifiable"], antonyms: ["mutable", "editable", "in-place edit", "writable", "changeable"] },
        { word: "transpile", meaning: "To convert source code from one syntax into another at a similar level of abstraction.", example: "The build tool transpiles JSX into ordinary JavaScript function calls.", synonyms: ["compile", "convert", "source-to-source compile", "downlevel", "rewrite syntax"], antonyms: ["run as-is", "interpret raw", "ship as authored", "native execution", "no build step"] },
        { word: "reconcile", meaning: "To compare two versions and bring them into agreement by applying only the differences.", example: "React reconciles the new JSX with the previous tree and patches just the nodes that changed.", synonyms: ["diff", "harmonise", "compare and patch", "sync trees", "converge"], antonyms: ["replace wholesale", "discard", "rebuild from scratch", "unmount all", "ignore differences"] },
      ],
    },
    {
      title: "State with useState",
      diagram: {
        kind: "flow",
        caption: "State is a snapshot. Calling the set function does not change the variable in the code that is already running; it asks React to render again, and the next render receives the new value.",
        items: [
          { label: "Initial render", detail: "useState(0) returns [0, setCount]" },
          { label: "Event handler runs", detail: "setCount(c => c + 1) queues an update" },
          { label: "React re-renders", detail: "Your component function runs again" },
          { label: "New snapshot", detail: "useState now returns [1, setCount]" },
          { label: "DOM is updated", detail: "Only the text that changed is patched" },
        ],
      },
      explanation: points(
        "useState adds a state variable to a component and returns the current value plus a set function",
        "Calling the set function schedules a re-render; it does not change the variable in the code already running",
        "React batches every set call made during one event into a single re-render",
        "Pass an updater function such as c => c + 1 when the next value depends on the previous one",
        "Objects and arrays in state must be replaced, never mutated, so React can see that they changed",
        "Pass the initializer function itself, not its result, when the initial value is expensive to compute",
      ),
      keyPoints: [
        { tone: "key", text: "useState returns exactly two values: the current state and a set function with a stable identity." },
        { tone: "key", text: "Each render sees its own snapshot of state. Reading state right after setting it still gives the old value." },
        { tone: "tip", text: "Use an updater, setCount(c => c + 1), when several updates in a row depend on the previous value." },
        { tone: "tip", text: "Pass the initializer itself, useState(createTodos), so the expensive work runs only on the first render." },
        { tone: "warning", text: "Never mutate state objects. Copy them with spread syntax: setUser({ ...user, name })." },
        { tone: "warning", text: "If the new value is identical to the current one by Object.is, React skips re-rendering." },
      ],
      example: points(
        "A counter stores count with useState(0) and increments it from a button's onClick",
        "A profile form keeps { name, age } in one object and replaces it with spread syntax on each keystroke",
        "A todo list adds an item with setTodos([...todos, newTodo]) instead of todos.push",
        "Calling setCount(count + 1) three times adds one, but the updater form adds three",
      ),
      useCase: {
        scenario: "A checkout page has a quantity stepper, a coupon field and a gift-wrap checkbox, and the order total must update instantly as any of them changes.",
        example: "Keep quantity, coupon and giftWrap in three useState calls, derive the total during render from those values, and update each through its own set function in onChange or onClick.",
        usage: "Because the total is calculated rather than stored, it can never drift out of sync, and React re-renders only the checkout component when one of the three values changes.",
      },
      code: `import { useState } from 'react';

export default function Profile() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState({ name: 'Asha', age: 24 });

  function addThree() {
    // Updaters queue: each receives the latest pending value
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  function rename(e) {
    // Replace the object; never mutate user.name
    setUser({ ...user, name: e.target.value });
  }

  return (
    <>
      <button onClick={addThree}>Count: {count}</button>
      <input value={user.name} onChange={rename} />
    </>
  );
}`,
      apiReference: [
        {
          name: "useState",
          kind: "hook",
          signature: "const [state, setState] = useState(initialState)\n\nsetState(nextState)\nsetState(prev => nextState)",
          params: [
            { name: "initialState", type: "T | () => T", description: "The value on the first render. If it is a function, React calls it once as an initializer and stores the result." },
            { name: "nextState", type: "T | (prev: T) => T", description: "The next value, or a pure updater that receives the pending state and returns the next one." },
          ],
          returns: "An array of exactly two items: the state for this render, and a set function that updates it and triggers a re-render.",
          notes: "The set function has a stable identity and returns nothing. In Strict Mode, React calls initializers and updaters twice in development to surface impure code.",
        },
      ],
      exercise: points(
        "Build a counter with increment, decrement and reset buttons",
        "Store a form with name and email in one state object and update it with spread syntax",
        "Call setCount(count + 1) three times in one handler, then switch to the updater form and compare",
      ),
      checkpoint: points(
        "Why does console.log(count) right after setCount(count + 1) print the old value?",
        "When should you pass an updater function instead of a plain value?",
        "What is the difference between useState(createTodos()) and useState(createTodos)?",
      ),
      mistake: points(
        "Do not mutate an object or array in state and then set the same reference",
        "Do not store values that can be computed from other state or props; derive them during render",
        "Do not call a set function unconditionally during render; it causes an infinite loop",
      ),
      vocabulary: [
        { word: "snapshot", meaning: "A fixed copy of values as they were at one moment, unaffected by later changes.", example: "Every render gets a snapshot of state, so an older click handler still sees the older count.", synonyms: ["frozen copy", "capture", "point-in-time copy", "still", "state capture"], antonyms: ["live value", "stream", "live subscription", "moving value", "mutable source", "evolving state"] },
        { word: "batching", meaning: "Grouping several updates together so they are processed in a single pass.", example: "Thanks to batching, three set calls in one click cause only one re-render.", synonyms: ["grouping", "coalescing", "bundling updates", "merging work", "deferred flush"], antonyms: ["one-by-one", "immediate flush", "per-change render", "instant apply", "unbatched"] },
        { word: "asynchronous", meaning: "Taking effect later rather than at the exact moment the instruction runs.", example: "State updates feel asynchronous because the new value appears only on the next render.", synonyms: ["deferred", "non-blocking", "awaited", "promise-based", "off the main path"], antonyms: ["synchronous", "immediate", "inline", "blocking", "sequential wait"] },
        { word: "stale", meaning: "Out of date because it was captured before the most recent change.", example: "A closure created in an earlier render can hold a stale copy of state.", synonyms: ["outdated", "old", "out of date", "old copy", "expired"], antonyms: ["fresh", "current", "up to date", "live", "revalidated"] },
        { word: "derive", meaning: "To calculate a value from other existing values instead of storing it separately.", example: "Derive the cart total from the items during render rather than keeping it in state.", synonyms: ["compute", "calculate", "infer", "compute from", "project"], antonyms: ["duplicate", "store", "store separately", "copy", "hardcode"] },
        { word: "initializer", meaning: "A function that produces the starting value of something the first time it is needed.", example: "Passing an initializer to useState avoids re-reading localStorage on every render.", synonyms: ["factory", "seed function", "setup function", "lazy initial value", "constructor"], antonyms: ["updater", "finalizer", "setter", "reducer", "teardown"] },
      ],
    },
    {
      title: "Complex state with useReducer",
      diagram: {
        kind: "flow",
        caption: "useReducer moves update logic out of event handlers into one pure function. Handlers only describe what happened by dispatching an action; the reducer decides how the state changes.",
        items: [
          { label: "User interacts", detail: "A click, a keystroke or a network response" },
          { label: "dispatch(action)", detail: "An object such as { type: 'added', text }" },
          { label: "reducer(state, action)", detail: "A pure function computes the next state" },
          { label: "React stores the next state", detail: "Skipped if Object.is reports no change" },
          { label: "Component re-renders", detail: "The UI reflects the new state" },
        ],
      },
      explanation: points(
        "useReducer is an alternative to useState for state with many related ways to change",
        "You write a reducer: a pure function that takes the current state and an action and returns the next state",
        "Components call dispatch with an action object that describes what the user did",
        "All update logic lives in one place, which makes it easier to read, test and debug",
        "Like useState, a reducer must return new objects rather than mutating the existing state",
        "An optional third init argument computes the initial state lazily from the second argument",
      ),
      keyPoints: [
        { tone: "key", text: "A reducer is (state, action) => nextState and must be pure: no side effects and no mutation." },
        { tone: "key", text: "Actions describe what happened, such as 'added' or 'deleted', not how the state should change." },
        { tone: "tip", text: "Reducers are plain functions, so you can unit-test them without rendering a component." },
        { tone: "tip", text: "dispatch has a stable identity. Pass it down, or share it through context, without breaking memoisation." },
        { tone: "warning", text: "Throw on an unknown action type in the default case so typos surface immediately." },
        { tone: "warning", text: "Dispatching does not change the state variable in the running code; the new state arrives on the next render." },
      ],
      example: points(
        "A todo app dispatches { type: 'added', text } when the form is submitted",
        "The same reducer handles 'toggled' and 'deleted' actions with a switch statement",
        "The component body shrinks to rendering plus a few dispatch calls",
        "A test calls todosReducer([], { type: 'added', id: 1, text: 'Milk' }) and checks the result",
      ),
      useCase: {
        scenario: "A multi-step signup wizard tracks the current step, field values, validation errors and a submitting flag, and several buttons change more than one of those at once.",
        example: "Model the wizard as one reducer with actions such as next, back, fieldChanged, submitStarted and submitFailed, and dispatch them from the buttons and inputs.",
        usage: "Every state transition is listed in one switch, so impossible combinations such as submitting on step one are easy to spot, and the reducer is covered by fast unit tests.",
      },
      code: `import { useReducer } from 'react';

function todosReducer(todos, action) {
  switch (action.type) {
    case 'added':
      return [...todos, { id: action.id, text: action.text }];
    case 'toggled':
      return todos.map(t =>
        t.id === action.id ? { ...t, done: !t.done } : t
      );
    case 'deleted':
      return todos.filter(t => t.id !== action.id);
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

let nextId = 1;

export default function TodoApp() {
  const [todos, dispatch] = useReducer(todosReducer, []);
  const add = () =>
    dispatch({ type: 'added', id: nextId++, text: 'New task' });

  return (
    <>
      <button onClick={add}>Add</button>
      {todos.map(t => (
        <label key={t.id}>
          <input
            type="checkbox"
            checked={Boolean(t.done)}
            onChange={() => dispatch({ type: 'toggled', id: t.id })}
          />
          {t.text}
        </label>
      ))}
    </>
  );
}`,
      apiReference: [
        {
          name: "useReducer",
          kind: "hook",
          signature: "const [state, dispatch] = useReducer(reducer, initialArg, init?)\n\ndispatch(action)",
          params: [
            { name: "reducer", type: "(state, action) => state", description: "Pure function that returns the next state from the current state and an action." },
            { name: "initialArg", type: "any", description: "The value the initial state is calculated from." },
            { name: "init", type: "(initialArg) => state", description: "Optional initializer. With it the initial state is init(initialArg); without it, initialArg." },
            { name: "action", type: "any", description: "What the user did, usually an object with a type property plus any extra data." },
          ],
          returns: "An array of two values: the current state, and a dispatch function that takes an action and triggers a re-render.",
          notes: "dispatch has a stable identity and returns nothing. React skips re-rendering when the reducer returns a state identical to the current one by Object.is.",
        },
      ],
      exercise: points(
        "Convert a component with three related useState calls into a single useReducer",
        "Add a 'cleared' action that removes every completed todo",
        "Write a unit test that calls the reducer directly with two actions in sequence",
      ),
      checkpoint: points(
        "Why must a reducer never call fetch or write to localStorage?",
        "What should an action describe: what happened, or how to change the state?",
        "When is useReducer a better choice than several useState calls?",
      ),
      mistake: points(
        "Do not mutate state inside the reducer; return a new array or object",
        "Do not forget the default case; unknown actions should throw, not silently return undefined",
        "Do not read the state variable right after dispatch and expect the new value",
      ),
      vocabulary: [
        { word: "consolidate", meaning: "To combine several scattered pieces into a single, more effective whole.", example: "A reducer consolidates the update logic that used to be spread across five handlers.", synonyms: ["combine", "unify", "merge", "centralise", "fold together"], antonyms: ["scatter", "fragment", "duplicate", "split", "spread out"] },
        { word: "deterministic", meaning: "Always producing the same output for the same input, with no randomness or hidden inputs.", example: "A deterministic reducer makes every bug reproducible from the list of actions.", synonyms: ["predictable", "repeatable", "same input, same output", "reproducible", "stable"], antonyms: ["random", "non-deterministic", "time-dependent", "randomised", "environment-specific"] },
        { word: "dispatch", meaning: "To send a message or task off to be handled somewhere else.", example: "The button dispatches an 'added' action and the reducer decides what that means.", synonyms: ["send", "emit", "trigger", "fire", "hand off"], antonyms: ["receive", "handle", "process", "consume", "execute inline"] },
        { word: "pure", meaning: "Having no side effects and depending only on its arguments to compute its result.", example: "A pure reducer never touches the network; it only returns the next state.", synonyms: ["side-effect free", "referentially clean", "deterministic", "no side effects", "stateless"], antonyms: ["impure", "effectful", "mutating", "IO-performing", "time-dependent"] },
        { word: "exhaustive", meaning: "Covering every possible case, leaving nothing out.", example: "An exhaustive switch handles every action type the app can dispatch.", synonyms: ["complete", "comprehensive", "full coverage", "nothing omitted", "all cases"], antonyms: ["partial", "incomplete", "sampled", "selective", "shortened"] },
        { word: "centralise", meaning: "To bring control or logic into one central place.", example: "Centralising the wizard's transitions in one reducer made the edge cases obvious.", synonyms: ["concentrate", "unify", "gather", "single-source", "co-locate"], antonyms: ["decentralise", "distribute", "spread", "duplicate per site", "federate"] },
      ],
    },
    {
      title: "Sharing data with context",
      diagram: {
        kind: "tree",
        caption: "Context lets a parent provide a value to every component below it, however deep, without passing props through each level. Each reader receives the value from the closest provider above it.",
        items: [
          { label: "<ThemeContext value=\"dark\">", detail: "React 19: the context itself is the provider" },
          { label: "<Layout>", detail: "knows nothing about the theme", depth: 1 },
          { label: "<Sidebar>", depth: 2 },
          { label: "<Button>", detail: "useContext(ThemeContext) returns 'dark'", depth: 3 },
          { label: "<ThemeContext value=\"light\">", detail: "a nearer provider overrides the value", depth: 2 },
          { label: "<Card>", detail: "useContext(ThemeContext) returns 'light'", depth: 3 },
        ],
      },
      explanation: points(
        "createContext creates a context object with a default value used when no provider is found",
        "In React 19 you render the context itself, <ThemeContext value={theme}>, as the provider",
        "The older <ThemeContext.Provider> still works but is planned for deprecation in a future version",
        "useContext(SomeContext) reads the value from the nearest provider above the calling component",
        "When a provider's value changes, every component that reads that context re-renders",
        "Context suits theme, locale and the signed-in user; combine it with useReducer to share state and dispatch",
      ),
      keyPoints: [
        { tone: "key", text: "React 19 lets you render <MyContext value={...}> directly as the provider, with no .Provider." },
        { tone: "key", text: "useContext looks for the closest provider above the calling component, never in the component itself." },
        { tone: "tip", text: "Memoise object values passed to a provider with useMemo so readers do not re-render needlessly." },
        { tone: "tip", text: "Export a custom Hook such as useTheme() that wraps useContext, so readers never import the context object." },
        { tone: "warning", text: "Without a matching provider, useContext returns the default value passed to createContext." },
        { tone: "warning", text: "Reach for props or composition first; context makes the data flow implicit and harder to trace." },
      ],
      example: points(
        "ThemeContext is created with createContext('light')",
        "App keeps the theme in state and renders <ThemeContext value={theme}> around the page",
        "ThemedButton, three levels down, reads the theme with useContext and no props in between",
        "Toggling the theme re-renders every reader of ThemeContext automatically",
      ),
      useCase: {
        scenario: "A dashboard supports English and Hindi, and dozens of components, from the navigation bar to date pickers deep in forms, must render in the current language.",
        example: "Create LocaleContext, render <LocaleContext value={locale}> in the root layout, and expose a useLocale() Hook that components call to get the language and a translate function.",
        usage: "Switching the language updates one piece of state at the top, and every component that reads LocaleContext re-renders in the new language without any prop drilling.",
      },
      code: `import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext('light');

export default function App() {
  const [theme, setTheme] = useState('light');
  const toggle = () =>
    setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    // React 19: render the context itself as the provider
    <ThemeContext value={theme}>
      <Toolbar />
      <button onClick={toggle}>Toggle theme</button>
    </ThemeContext>
  );
}

function Toolbar() {
  return <ThemedButton label="Save" />; // no theme prop
}

function ThemedButton({ label }) {
  const theme = useContext(ThemeContext);
  return <button className={'btn-' + theme}>{label}</button>;
}`,
      apiReference: [
        {
          name: "createContext",
          kind: "function",
          signature: "const SomeContext = createContext(defaultValue)\n\n<SomeContext value={value}>\n  {children}\n</SomeContext>",
          params: [
            { name: "defaultValue", type: "any", description: "The value readers receive when there is no matching provider above them. It never changes." },
            { name: "value (prop)", type: "any", description: "The value passed to every reader below this provider." },
          ],
          returns: "A context object. Render it as a provider, and read it with useContext or use.",
          notes: "SomeContext.Provider and SomeContext.Consumer are the older APIs. Rendering <SomeContext value> directly is the React 19 way, and React 19.3 allows it from Server Components too.",
        },
        {
          name: "useContext",
          kind: "hook",
          signature: "const value = useContext(SomeContext)",
          params: [
            { name: "SomeContext", type: "Context<T>", description: "A context created with createContext: the context object itself, not its value." },
          ],
          returns: "The value from the closest provider above the calling component, or the default value if there is none.",
          notes: "Call it at the top level. Readers re-render when the provider value changes by Object.is, and wrapping a reader in memo does not prevent that.",
        },
      ],
      exercise: points(
        "Create a UserContext and show the signed-in user's name in a deeply nested header",
        "Add a second, nested provider that overrides the value for one section of the page",
        "Wrap useContext in a useUser() Hook that throws a clear error when no provider is found",
      ),
      checkpoint: points(
        "What does useContext return when there is no provider above the component?",
        "How does a React 19 provider differ in syntax from a React 18 provider?",
        "Why can passing a new object literal as the provider value cause extra re-renders?",
      ),
      mistake: points(
        "Do not use context as a shortcut for every prop; pass data explicitly when only one or two levels need it",
        "Do not create the context inside a component; createContext belongs at module level",
        "Do not call useContext in the same component that renders the provider and expect its value",
      ),
      vocabulary: [
        { word: "propagate", meaning: "To spread or pass something along through a system from one part to the next.", example: "A new theme value propagates to every component that reads the context.", synonyms: ["spread", "transmit", "pass down", "cascade", "flow through"], antonyms: ["contain", "isolate", "stop", "swallow", "scope locally"] },
        { word: "implicit", meaning: "Present or understood without being stated directly.", example: "Context creates an implicit dependency, because the reader's props do not mention the theme.", synonyms: ["unstated", "tacit", "inferred", "automatic", "assumed"], antonyms: ["explicit", "stated", "declared", "opt-in", "spelled out"] },
        { word: "override", meaning: "To replace an existing value or behaviour with a different one that takes priority.", example: "A nested provider overrides the theme for the settings panel only.", synonyms: ["supersede", "replace", "take precedence", "shadow", "outrank"], antonyms: ["inherit", "defer to", "fall back", "accept default", "defer to base", "use the default"] },
        { word: "descendant", meaning: "Any element that sits somewhere below another one in a tree, at any depth.", example: "Every descendant of the provider can read its value, not just direct children.", synonyms: ["child node", "offspring", "nested node", "subtree member", "grandchild"], antonyms: ["ancestor", "parent", "forebear", "container", "root"] },
        { word: "cumbersome", meaning: "Awkward and slow to use because of its size or complexity.", example: "Passing the locale through eight layers of props quickly becomes cumbersome.", synonyms: ["unwieldy", "clumsy", "awkward", "heavy-handed", "verbose"], antonyms: ["convenient", "streamlined", "ergonomic", "lightweight", "fluent"] },
        { word: "ambient", meaning: "Present all around, available everywhere in an environment without being requested.", example: "Context provides ambient values such as the theme and the current user.", synonyms: ["surrounding", "pervasive", "implicitly available", "context-provided", "background"], antonyms: ["local", "explicit", "passed explicitly", "scoped", "prop-drilled"] },
      ],
    },
    {
      title: "Refs with useRef and ref as a prop",
      diagram: {
        kind: "split",
        caption: "Both survive re-renders, but they serve different jobs. State drives what is on screen; a ref is an escape hatch for values React does not need to render, such as a DOM node or a timer id.",
        headings: ["State (useState)", "Ref (useRef)"],
        items: [
          { label: "Changing it re-renders", detail: "setState schedules a new render", group: 0 },
          { label: "An immutable snapshot", detail: "Read the value for this render", group: 0 },
          { label: "For what the screen shows", detail: "Text, lists, toggles", group: 0 },
          { label: "Changing it does not re-render", detail: "ref.current = x is instant and silent", group: 1 },
          { label: "A mutable box", detail: "The same object on every render", group: 1 },
          { label: "For DOM nodes and timers", detail: "Focus, scroll, measure, interval ids", group: 1 },
        ],
      },
      explanation: points(
        "useRef returns an object with a single current property that persists for the component's lifetime",
        "Changing ref.current does not trigger a re-render, so refs suit values that do not affect the output",
        "Pass a ref object to a JSX element's ref attribute and React sets current to that DOM node",
        "In React 19, ref is an ordinary prop for function components, so forwardRef is no longer needed",
        "React 19 ref callbacks can return a cleanup function that runs when the element is removed",
        "Do not read or write ref.current during rendering, except to initialise it lazily",
      ),
      keyPoints: [
        { tone: "key", text: "useRef(initial) returns the same { current } object on every render." },
        { tone: "key", text: "React 19: function components receive ref as a regular prop; forwardRef is slated for deprecation." },
        { tone: "tip", text: "Ref callbacks can now return a cleanup function, just like an Effect." },
        { tone: "tip", text: "Keep interval and timeout ids in a ref so a later handler can clear them." },
        { tone: "warning", text: "Updating ref.current does not re-render. If the screen must change, use state instead." },
        { tone: "warning", text: "Do not read ref.current during render; a DOM node is attached only after React commits." },
      ],
      example: points(
        "A search bar keeps inputRef for the input element and focuses it from a button",
        "SearchInput receives ref directly from its props and forwards it to the input",
        "A timerRef stores the timeout id so a second click can cancel the first",
        "A ref callback starts a ResizeObserver and returns a cleanup that disconnects it",
      ),
      useCase: {
        scenario: "A chat window must scroll to the newest message, focus the composer after sending, and stop a typing-indicator timer when the user leaves.",
        example: "Keep listEndRef on an empty div at the bottom and call scrollIntoView after each message, hold composerRef on the textarea for focus(), and store the typing timer id in timerRef.",
        usage: "None of these values appear on screen, so storing them in refs avoids pointless re-renders while still giving the component direct control of the DOM when it needs it.",
      },
      code: `import { useRef } from 'react';

// React 19: ref is a normal prop, no forwardRef needed
function SearchInput({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

export default function SearchBar() {
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  function focusSoon() {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      inputRef.current.focus();
    }, 300);
  }

  return (
    <>
      <SearchInput ref={inputRef} placeholder="Search" />
      <button onClick={focusSoon}>Focus</button>
      <ul
        ref={node => {
          const observer = new ResizeObserver(onResize);
          observer.observe(node);
          // React 19: runs when the node is removed
          return () => observer.disconnect();
        }}
      />
    </>
  );
}`,
      apiReference: [
        {
          name: "useRef",
          kind: "hook",
          signature: "const ref = useRef(initialValue)\n\nref.current        // read\nref.current = next // write, no re-render",
          params: [
            { name: "initialValue", type: "T", description: "The value of ref.current the first time. Ignored after the initial render." },
          ],
          returns: "An object with a single current property. React returns the same object on every render.",
          notes: "Mutating current never schedules a render. In Strict Mode, components run twice in development, so each call creates two ref objects and one is discarded.",
        },
        {
          name: "ref callback",
          kind: "JSX attribute",
          signature: "<div ref={node => {\n  // node attached\n  return () => {\n    // node detached (React 19)\n  };\n}} />",
          params: [
            { name: "node", type: "Element", description: "The DOM node React attached. Called again with a new node when the callback identity changes." },
          ],
          returns: "Optionally a cleanup function, called on detach. Without one, React calls the callback with null instead.",
          notes: "Avoid implicit returns such as ref={n => (x = n)}; React 19 treats a returned value as a cleanup and TypeScript rejects it.",
        },
      ],
      exercise: points(
        "Build a stopwatch that stores its interval id in a ref and its elapsed time in state",
        "Create a TextField component that accepts ref as a prop and focus it from the parent",
        "Attach an IntersectionObserver with a ref callback that returns its own cleanup",
      ),
      checkpoint: points(
        "What is the practical difference between storing a value in state and in a ref?",
        "Why was forwardRef needed before React 19, and why is it not needed now?",
        "When does React call the cleanup returned from a ref callback?",
      ),
      mistake: points(
        "Do not use a ref for a value the UI displays; the screen will not update",
        "Do not read inputRef.current during render; it is null until after the first commit",
        "Do not write ref={node => (myNode = node)} in React 19; the implicit return is treated as a cleanup",
      ),
      vocabulary: [
        { word: "mutable", meaning: "Able to be changed in place after it has been created.", example: "A ref is a mutable box: you can overwrite current at any time.", synonyms: ["changeable", "writable", "editable", "in-place", "reassignable"], antonyms: ["immutable", "fixed", "frozen", "read-only", "copy-on-write"] },
        { word: "imperative", meaning: "Giving direct step-by-step commands rather than describing the desired result.", example: "Calling input.focus() is imperative code that React's declarative model cannot express.", synonyms: ["command-based", "procedural", "step-by-step", "how-focused", "explicit sequence"], antonyms: ["declarative", "descriptive", "intent-based", "state-driven", "what-focused"] },
        { word: "persist", meaning: "To continue to exist across changes instead of being reset.", example: "The timer id persists across renders because it lives in a ref.", synonyms: ["endure", "remain", "survive", "carry over", "retain"], antonyms: ["reset", "vanish", "expire", "clear"] },
        { word: "escape hatch", meaning: "A deliberate way out of a system's normal rules for cases the rules cannot handle.", example: "Refs are an escape hatch for talking to the DOM directly.", synonyms: ["workaround", "back door", "opt-out", "manual override", "low-level access"], antonyms: ["standard path", "main road", "idiomatic route", "supported API", "framework default"] },
        { word: "detach", meaning: "To disconnect or remove something that was previously attached.", example: "React calls the cleanup when it detaches the node from the ref.", synonyms: ["disconnect", "unhook", "remove", "release", "tear off"], antonyms: ["attach", "connect", "bind", "mount", "wire up"] },
        { word: "reference", meaning: "A value that points to another object rather than containing a copy of it.", example: "inputRef.current holds a reference to the real input element on the page.", synonyms: ["pointer", "handle", "identity", "address", "link"], antonyms: ["copy", "clone", "value copy", "snapshot", "duplicate"] },
      ],
    },
    {
      title: "Custom ref handles with useImperativeHandle",
      diagram: {
        kind: "flow",
        caption: "Instead of exposing its whole DOM node, a component can hand its parent a small, deliberate set of methods. The parent can play or pause the video but cannot restyle or remove the element.",
        items: [
          { label: "Parent creates a ref", detail: "const playerRef = useRef(null)" },
          { label: "Parent passes it as a prop", detail: "<VideoPlayer ref={playerRef} />" },
          { label: "Child calls useImperativeHandle", detail: "Returns { play, pause } instead of the DOM node" },
          { label: "React assigns the handle", detail: "playerRef.current = { play, pause }" },
          { label: "Parent calls a method", detail: "playerRef.current.play() from a click" },
        ],
      },
      explanation: points(
        "useImperativeHandle customises the value a parent receives through the ref it passes down",
        "In React 19 the child reads ref straight from its props and passes it to useImperativeHandle",
        "The createHandle function returns an object, usually a few methods, that becomes ref.current",
        "The child keeps its own private ref to the real DOM node and wraps it",
        "The dependency array controls when the handle is recreated, like an Effect's",
        "It is rarely needed: use it only for imperative actions that props cannot express",
      ),
      keyPoints: [
        { tone: "key", text: "useImperativeHandle(ref, createHandle, deps) replaces what the parent's ref.current points to." },
        { tone: "key", text: "Expose only the methods the parent needs, such as focus or scrollToTop, never the raw node." },
        { tone: "tip", text: "Keep a private useRef inside the child for the real DOM node and call it from the handle's methods." },
        { tone: "tip", text: "List every reactive value the handle uses in the dependency array, exactly as for an Effect." },
        { tone: "warning", text: "Do not use refs for what props can express. A modal's isOpen belongs in a prop, not in an open() method." },
        { tone: "warning", text: "Before React 19 the ref arrived through forwardRef; in React 19 it is a regular prop." },
      ],
      example: points(
        "VideoPlayer keeps videoRef on its own <video> element",
        "It exposes only play and pause through useImperativeHandle",
        "The parent's Play and Pause buttons call playerRef.current.play() and .pause()",
        "The parent has no way to reach the video element itself, so it cannot break it",
      ),
      useCase: {
        scenario: "A design system ships a RichTextEditor. Product teams need to focus it, insert a mention and clear it from toolbar buttons, but must not touch its internal contenteditable DOM.",
        example: "Inside RichTextEditor, call useImperativeHandle(ref, () => ({ focus, insertMention, clear }), []) where each method drives the private editor instance held in an internal ref.",
        usage: "Teams get a small, documented API that survives internal rewrites, while the design-system team stays free to change the editor's DOM structure without breaking anyone.",
      },
      code: `import { useImperativeHandle, useRef } from 'react';

function VideoPlayer({ src, ref }) {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play() {
      videoRef.current.play();
    },
    pause() {
      videoRef.current.pause();
    },
  }), []);

  return <video ref={videoRef} src={src} />;
}

export default function Lesson() {
  const playerRef = useRef(null);

  return (
    <>
      <VideoPlayer ref={playerRef} src="/intro.mp4" />
      <button onClick={() => playerRef.current.play()}>
        Play
      </button>
      <button onClick={() => playerRef.current.pause()}>
        Pause
      </button>
    </>
  );
}`,
      apiReference: [
        {
          name: "useImperativeHandle",
          kind: "hook",
          signature: "useImperativeHandle(ref, createHandle, dependencies?)",
          params: [
            { name: "ref", type: "Ref<T>", description: "The ref your component received as a prop." },
            { name: "createHandle", type: "() => T", description: "Takes no arguments and returns the value to expose, usually an object of methods." },
            { name: "dependencies", type: "any[]", description: "Reactive values used in createHandle. When one changes, or if the array is omitted, the handle is recreated." },
          ],
          returns: "undefined.",
          notes: "Starting with React 19, ref is available as a prop. In React 18 and earlier it had to be received through forwardRef.",
        },
      ],
      exercise: points(
        "Build a FancyInput that exposes only focus and clear through useImperativeHandle",
        "Try calling a method you did not expose and confirm it is undefined",
        "Add a dependency to the handle and check when it is recreated",
      ),
      checkpoint: points(
        "What does the parent's ref.current contain after the child calls useImperativeHandle?",
        "Why is exposing a narrow handle safer than exposing the DOM node?",
        "Give an example of behaviour that should be a prop rather than an imperative method",
      ),
      mistake: points(
        "Do not reach for useImperativeHandle when a prop or callback would do",
        "Do not expose the whole DOM node through the handle; that defeats its purpose",
        "Do not forget dependencies when the handle's methods read props or state",
      ),
      vocabulary: [
        { word: "expose", meaning: "To make something available to code outside the unit that owns it.", example: "The player exposes play and pause but keeps the video element private.", synonyms: ["publish", "reveal", "make public", "offer", "open up"], antonyms: ["hide", "conceal", "keep private", "seal", "encapsulate", "restrict"] },
        { word: "facade", meaning: "A simplified front that hides a more complex system behind it.", example: "The handle is a facade over the editor's complicated internal API.", synonyms: ["front", "wrapper", "public surface", "simplified API", "shell"], antonyms: ["internals", "implementation", "raw internals", "underlying engine", "private core"] },
        { word: "restrict", meaning: "To limit what is allowed or possible.", example: "useImperativeHandle restricts the parent to a few safe operations.", synonyms: ["limit", "constrain", "narrow", "scope down", "fence"], antonyms: ["permit", "expand", "open up", "broaden", "grant freely"] },
        { word: "delegate", meaning: "To hand a task to another part of the system to carry out.", example: "The play method delegates the work to the underlying video element.", synonyms: ["forward", "hand off", "pass on", "defer to", "assign"], antonyms: ["handle directly", "retain", "own it", "do it inline", "absorb"] },
        { word: "contract", meaning: "An agreed promise about how a piece of code can be used and how it behaves.", example: "The handle's three methods form a contract that survives internal rewrites.", synonyms: ["interface", "agreement", "public API", "expected shape", "promise"], antonyms: ["implementation detail", "internals", "private behaviour", "incidental detail", "implementation"] },
        { word: "surface", meaning: "As a verb, to bring something into view or make it available to others.", example: "The component surfaces only what the toolbar actually needs.", synonyms: ["present", "bring up", "expose", "make visible", "raise"], antonyms: ["bury", "hide", "swallow", "suppress", "keep internal"] },
      ],
    },
    {
      title: "Effects with useEffect",
      diagram: {
        kind: "flow",
        caption: "Effects run after React has updated the screen, to synchronise the component with something outside React. Every setup is paired with a cleanup that undoes it.",
        items: [
          { label: "Component renders", detail: "React calls your function and computes the JSX" },
          { label: "React commits and the browser paints", detail: "The user sees the new screen" },
          { label: "Effect setup runs", detail: "Connect, subscribe or start a timer" },
          { label: "A dependency changes", detail: "Cleanup runs with old values, then setup with new ones" },
          { label: "Component unmounts", detail: "A final cleanup disconnects everything" },
        ],
      },
      explanation: points(
        "useEffect connects a component to an external system: a network socket, a browser API or a third-party widget",
        "The setup function runs after the component has been committed to the screen",
        "Return a cleanup function that undoes the setup; React calls it before re-running and on unmount",
        "The dependency array lists every reactive value the Effect reads, and the Effect re-runs when one changes",
        "An empty array runs the Effect once after mount; no array runs it after every render",
        "In development, Strict Mode runs one extra setup and cleanup cycle to prove the cleanup is correct",
      ),
      keyPoints: [
        { tone: "key", text: "Effects are for synchronising with systems outside React, not for transforming data for rendering." },
        { tone: "key", text: "Every reactive value read inside the Effect must appear in its dependency array." },
        { tone: "tip", text: "If an Effect only calculates something from props or state, delete it and calculate during render." },
        { tone: "tip", text: "Use an ignore flag or an AbortController in the cleanup to discard stale fetch responses." },
        { tone: "warning", text: "Setting state that is also a dependency, with no condition, creates an infinite render loop." },
        { tone: "warning", text: "The double setup in development is intentional. Fix the cleanup rather than trying to prevent it." },
      ],
      example: points(
        "ChatRoom connects to a room in an Effect and disconnects in its cleanup",
        "Changing roomId disconnects from the old room and connects to the new one",
        "Profile fetches a user and ignores the response if userId changed in the meantime",
        "Unmounting either component runs its cleanup one last time",
      ),
      useCase: {
        scenario: "A live sports page shows scores pushed over a WebSocket for whichever match the user selects, and must never show scores from a previously selected match.",
        example: "In an Effect keyed on matchId, open the socket, subscribe to that match and update state on each message; the cleanup unsubscribes and closes the socket.",
        usage: "Switching matches tears down the old subscription before opening the new one, so updates never mix, and leaving the page leaves no socket running in the background.",
      },
      code: `import { useEffect, useState } from 'react';

export function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('message', msg =>
      setMessages(list => [...list, msg])
    );
    connection.connect();
    return () => connection.disconnect(); // cleanup
  }, [roomId]); // re-sync when the room changes

  return <MessageList messages={messages} />;
}

export function Profile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetchUser(userId).then(data => {
      if (!ignore) setUser(data); // skip stale responses
    });
    return () => {
      ignore = true;
    };
  }, [userId]);

  return user ? <h2>{user.name}</h2> : <p>Loading...</p>;
}`,
      apiReference: [
        {
          name: "useEffect",
          kind: "hook",
          signature: "useEffect(setup, dependencies?)\n\n// setup: () => void | (() => void)",
          params: [
            { name: "setup", type: "() => void | (() => void)", description: "Your Effect logic. It may return a cleanup, which runs before the next setup and on unmount." },
            { name: "dependencies", type: "any[]", description: "Every reactive value read by setup, compared with Object.is. [] runs once after mount; omitted runs after every render." },
          ],
          returns: "undefined.",
          notes: "Effects only run on the client, never during server rendering. If an Effect changes something visual and you see a flicker, use useLayoutEffect instead.",
        },
      ],
      exercise: points(
        "Write an Effect that sets document.title to the current count",
        "Subscribe to window resize in an Effect and remove the listener in the cleanup",
        "Fetch data keyed on an id prop and use an ignore flag to drop stale responses",
      ),
      checkpoint: points(
        "When exactly does React run an Effect's cleanup function?",
        "What is the difference between an empty dependency array and no array at all?",
        "Why does Strict Mode run setup, cleanup and setup again in development?",
      ),
      mistake: points(
        "Do not use an Effect to compute derived data; calculate it during render",
        "Do not omit dependencies to stop an Effect re-running; restructure the code instead",
        "Do not forget the cleanup for subscriptions, timers and connections",
      ),
      vocabulary: [
        { word: "synchronise", meaning: "To make two systems match each other and keep them matching over time.", example: "The Effect synchronises the chat connection with the selected room.", synonyms: ["align", "coordinate", "keep in step", "reconcile", "match up"], antonyms: ["desynchronise", "diverge", "drift apart", "fall behind", "decouple"] },
        { word: "subscription", meaning: "An ongoing registration to receive updates from a source until you cancel it.", example: "The cleanup cancels the subscription so no messages arrive after unmount.", synonyms: ["listener", "registration", "watch", "handler registration", "live binding"], antonyms: ["unsubscription", "cancellation", "polling", "single read", "detached snapshot"] },
        { word: "dependency", meaning: "A value that another piece of code relies on, so a change to it requires re-running that code.", example: "roomId is a dependency, so changing it reconnects the chat.", synonyms: ["input", "prerequisite", "required value", "trigger", "watched input"], antonyms: ["independent value", "constant", "stable constant", "irrelevant value", "untracked"] },
        { word: "teardown", meaning: "The process of dismantling something that was set up, releasing its resources.", example: "Closing the socket is the teardown half of the Effect.", synonyms: ["cleanup", "dismantling", "disposal", "unsubscribe", "unwind"], antonyms: ["setup", "initialisation", "mount", "construct", "start-up"] },
        { word: "reactive", meaning: "Responding automatically to change; in React, a value that can differ between renders.", example: "Props and state are reactive values, so the linter asks you to list them.", synonyms: ["responsive", "dynamic", "auto-updating", "change-driven", "live"], antonyms: ["static", "constant", "one-shot", "frozen", "manual refresh"] },
        { word: "redundant", meaning: "Not needed because the same result is already available another way.", example: "An Effect that copies props into state is redundant; read the props directly.", synonyms: ["superfluous", "unnecessary", "duplicated", "wasteful", "already covered"], antonyms: ["essential", "necessary", "required", "load-bearing", "unique"] },
      ],
    },
    {
      title: "Timing: useLayoutEffect and useInsertionEffect",
      diagram: {
        kind: "flow",
        caption: "The three Effect Hooks share one signature and differ only in when they fire. Insertion effects run first, layout effects run before the browser paints, and ordinary Effects run after the paint.",
        items: [
          { label: "Render", detail: "React calls components and computes the new JSX" },
          { label: "useInsertionEffect", detail: "CSS-in-JS libraries insert <style> tags before any layout Effect" },
          { label: "DOM updated, then useLayoutEffect", detail: "Measure and adjust synchronously; painting waits" },
          { label: "Browser paints", detail: "The user sees the final, already-adjusted frame" },
          { label: "useEffect", detail: "Subscriptions and network work run after the paint" },
        ],
      },
      explanation: points(
        "useLayoutEffect has the same signature as useEffect but fires before the browser repaints the screen",
        "Use it to measure layout, such as an element's size or position, and adjust before the user sees anything",
        "State set inside useLayoutEffect re-renders synchronously, so the intermediate frame never appears",
        "useInsertionEffect fires even earlier, before any layout Effects, and is meant for CSS-in-JS libraries",
        "You cannot set state in useInsertionEffect, and refs are not attached yet when it runs",
        "Both run before painting and can slow it down, so prefer useEffect unless you see a visual problem",
      ),
      keyPoints: [
        { tone: "key", text: "Timing order: useInsertionEffect, then useLayoutEffect, then the browser paints, then useEffect." },
        { tone: "key", text: "useLayoutEffect blocks the paint. Use it to measure and reposition, for example a tooltip." },
        { tone: "tip", text: "Start with useEffect. Switch to useLayoutEffect only when you can see a flicker." },
        { tone: "tip", text: "useInsertionEffect is for library authors injecting styles; application code almost never needs it." },
        { tone: "warning", text: "Heavy work inside useLayoutEffect delays every frame and makes the app feel sluggish." },
        { tone: "warning", text: "Layout effects do not run during server rendering, so server HTML is shown without measurements." },
      ],
      example: points(
        "A Tooltip first renders with height 0 to measure itself",
        "useLayoutEffect reads its real height and sets state before paint",
        "React re-renders synchronously and places the tooltip above or below the target",
        "A CSS-in-JS helper injects its <style> rule in useInsertionEffect so layout reads see the styles",
      ),
      useCase: {
        scenario: "A data grid shows a floating context menu on right-click, and it must flip upwards near the bottom of the screen without visibly jumping.",
        example: "Render the menu, measure it with getBoundingClientRect inside useLayoutEffect, and set its final top and left before the browser paints the frame.",
        usage: "The user only ever sees the menu in its final position. Using useEffect instead would paint it in the wrong place first and cause a visible jump.",
      },
      code: `import {
  useInsertionEffect, useLayoutEffect, useRef, useState,
} from 'react';

export function Tooltip({ targetRect, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    // Measured before paint, so there is no flicker
    setHeight(ref.current.getBoundingClientRect().height);
  }, []);

  const above = targetRect.top - height > 0;
  const top = above ? targetRect.top - height : targetRect.bottom;

  return (
    <div ref={ref} className="tooltip" style={{ top }}>
      {children}
    </div>
  );
}

// Inside a CSS-in-JS library
const inserted = new Set();
export function useCSS(rule) {
  useInsertionEffect(() => {
    if (!inserted.has(rule)) {
      inserted.add(rule);
      document.head.appendChild(makeStyleTag(rule));
    }
  });
  return rule;
}`,
      apiReference: [
        {
          name: "useLayoutEffect",
          kind: "hook",
          signature: "useLayoutEffect(setup, dependencies?)",
          params: [
            { name: "setup", type: "() => void | (() => void)", description: "Effect logic that runs after DOM changes but before the browser paints. May return a cleanup." },
            { name: "dependencies", type: "any[]", description: "Reactive values read by setup, compared with Object.is." },
          ],
          returns: "undefined.",
          notes: "Blocks painting, so it can hurt performance. Runs only on the client; server rendering skips it.",
        },
        {
          name: "useInsertionEffect",
          kind: "hook",
          signature: "useInsertionEffect(setup, dependencies?)",
          params: [
            { name: "setup", type: "() => void | (() => void)", description: "Runs before any layout Effects, so injected styles exist when layout is read. May return a cleanup." },
            { name: "dependencies", type: "any[]", description: "Reactive values read by setup; omit to run after every render." },
          ],
          returns: "undefined.",
          notes: "Client only. You cannot update state inside it and refs are not attached yet. Cleanup and setup run one component at a time, interleaved.",
        },
      ],
      exercise: points(
        "Build a tooltip that measures itself with useLayoutEffect and flips when near the top edge",
        "Swap useLayoutEffect for useEffect and throttle the CPU in DevTools to see the flicker",
        "Log from all three Effect Hooks in one component and confirm their order",
      ),
      checkpoint: points(
        "Which of the three Effect Hooks runs first, and which runs after the paint?",
        "Why can setting state in useLayoutEffect avoid a visible flicker?",
        "Who is useInsertionEffect really designed for?",
      ),
      mistake: points(
        "Do not default to useLayoutEffect; it blocks painting",
        "Do not set state or read refs inside useInsertionEffect",
        "Do not rely on layout effects for the initial server-rendered HTML",
      ),
      vocabulary: [
        { word: "flicker", meaning: "A brief, unwanted flash where the screen shows an intermediate state before the final one.", example: "Measuring in useEffect caused a flicker as the menu jumped into place.", synonyms: ["flash", "jitter", "visual blink", "flash of wrong state", "stutter"], antonyms: ["steadiness", "stability", "smooth transition", "stable frame", "seamless update"] },
        { word: "repaint", meaning: "The browser redrawing pixels on screen after something visual has changed.", example: "useLayoutEffect finishes before the next repaint, so the user never sees the old layout.", synonyms: ["redraw", "refresh", "re-render pixels", "redraw frame", "recompose"], antonyms: ["freeze", "hold", "skip painting", "reuse frame", "no visual change"] },
        { word: "synchronous", meaning: "Happening immediately and in order, with nothing else running until it finishes.", example: "A state update inside a layout effect is processed synchronously before paint.", synonyms: ["blocking", "immediate", "inline", "awaited in place", "sequential"], antonyms: ["asynchronous", "deferred", "queued", "promise-based", "concurrent"] },
        { word: "interleave", meaning: "To alternate steps from two sequences instead of finishing one before the other.", example: "Insertion effects interleave cleanup and setup one component at a time.", synonyms: ["alternate", "intersperse", "mix", "time-slice", "weave together"], antonyms: ["batch", "sequence", "run to completion", "group", "serialise"] },
        { word: "precede", meaning: "To come before something else in time or order.", example: "Insertion effects precede layout effects, which precede the paint.", synonyms: ["come before", "lead", "run first", "happen before", "front-run"], antonyms: ["follow", "succeed", "trail", "come after", "run last"] },
        { word: "inject", meaning: "To insert something into a running system from outside.", example: "The library injects a style tag into the document head.", synonyms: ["insert", "introduce", "supply from outside", "provide", "pass in"], antonyms: ["extract", "remove", "hardcode", "construct internally", "pull out"] },
      ],
    },
    {
      title: "Non-reactive logic with useEffectEvent",
      diagram: {
        kind: "split",
        caption: "useEffectEvent, stable since React 19.2, splits an Effect into the part that must re-run when values change and the part that merely reacts to an event using the latest values.",
        headings: ["Reactive (re-syncs the Effect)", "Effect Event (reads latest)"],
        items: [
          { label: "roomId", detail: "Changing room must reconnect", group: 0 },
          { label: "serverUrl", detail: "A new server needs a new connection", group: 0 },
          { label: "Listed in the dependency array", detail: "The linter requires it", group: 0 },
          { label: "theme", detail: "Only used to style a notification", group: 1 },
          { label: "onConnected()", detail: "Reads the latest theme when it fires", group: 1 },
          { label: "Never listed as a dependency", detail: "Its identity changes on every render", group: 1 },
        ],
      },
      explanation: points(
        "Sometimes an Effect reads a value, such as the current theme, that should not make it re-run",
        "useEffectEvent wraps that logic in an Effect Event: a function that always sees the latest props and state",
        "You call the Effect Event from inside the Effect, and leave it out of the dependency array",
        "The Effect keeps only the dependencies that truly require re-synchronising, such as roomId",
        "It became stable in React 19.2; use the latest eslint-plugin-react-hooks so the linter understands it",
        "It is not a way to silence the linter; use it only for logic that is genuinely an event",
      ),
      keyPoints: [
        { tone: "key", text: "useEffectEvent(callback) returns a function that always reads the latest committed props and state." },
        { tone: "key", text: "Effect Events are not dependencies. Leave them out of the array; the linter knows this." },
        { tone: "tip", text: "Typical uses: logging an analytics event with the current user, or notifying with the current theme." },
        { tone: "warning", text: "Call Effect Events only from inside Effects or other Effect Events, never during render." },
        { tone: "warning", text: "Do not pass an Effect Event to another component or Hook; its identity changes on every render." },
        { tone: "warning", text: "Using it to dodge real dependencies hides bugs. If a value should re-sync the Effect, keep it reactive." },
      ],
      example: points(
        "ChatRoom reconnects when roomId changes, but not when theme changes",
        "onConnected reads the current theme each time the connection reports success",
        "usePageView logs a visit for each new url with the user's current plan",
        "Changing the plan alone does not log a fake extra page view",
      ),
      useCase: {
        scenario: "An e-commerce app logs a page_view event for every product page, including the shopper's cart size, but must not log again just because the cart changed.",
        example: "Wrap the logging in const onVisit = useEffectEvent(url => log(url, cart.length)) and call onVisit(url) from an Effect whose only dependency is url.",
        usage: "Analytics count one view per navigation, each with an accurate cart size, and adding items to the cart no longer inflates the page-view numbers.",
      },
      code: `import { useEffect, useEffectEvent } from 'react';

export default function ChatRoom({ roomId, theme }) {
  // Reads the latest theme, but is not reactive
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme);
  });

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on('connected', () => {
      onConnected();
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // OK: theme is not a dependency

  return <h1>Welcome to {roomId}</h1>;
}

function usePageView(url, user) {
  const logVisit = useEffectEvent(visitedUrl => {
    analytics.track(visitedUrl, user.plan);
  });

  useEffect(() => {
    logVisit(url); // re-runs when url changes, only
  }, [url]);
}`,
      apiReference: [
        {
          name: "useEffectEvent",
          kind: "hook",
          signature: "const onEvent = useEffectEvent(callback)\n\n// inside an Effect:\nonEvent(...args)",
          params: [
            { name: "callback", type: "(...args) => any", description: "The event logic. When the returned function is called, callback sees the latest committed values from render." },
          ],
          returns: "An Effect Event function with the same signature as callback, callable from useEffect, useLayoutEffect, useInsertionEffect or other Effect Events.",
          notes: "Stable in React 19.2. Call it at the top level. Never call it during render or pass it to other components. Its identity intentionally changes on every render.",
        },
      ],
      exercise: points(
        "Find an Effect in your code that re-runs because of a value it only uses for logging",
        "Move that logging into an Effect Event and remove the value from the dependency array",
        "Confirm with console logs that the Effect now re-runs only for its real dependencies",
      ),
      checkpoint: points(
        "What problem does useEffectEvent solve that the dependency array cannot?",
        "Why must an Effect Event never appear in a dependency array?",
        "When would using useEffectEvent hide a real bug?",
      ),
      mistake: points(
        "Do not call an Effect Event during render or from an event handler",
        "Do not use it to silence the linter about values that should re-sync the Effect",
        "Do not pass an Effect Event as a prop to another component",
      ),
      vocabulary: [
        { word: "decouple", meaning: "To separate two things so that a change in one no longer forces a change in the other.", example: "useEffectEvent decouples the notification's theme from the connection logic.", synonyms: ["separate", "detach", "loosen", "isolate", "break the link"], antonyms: ["couple", "bind", "entangle", "tighten", "hardwire"] },
        { word: "inadvertent", meaning: "Happening by accident, without being intended.", example: "Listing theme as a dependency caused an inadvertent reconnection on every theme change.", synonyms: ["accidental", "unintended", "by accident", "unplanned", "unnoticed"], antonyms: ["deliberate", "intentional", "on purpose", "planned", "explicit"] },
        { word: "suppress", meaning: "To deliberately stop something from appearing or happening.", example: "Do not suppress the lint rule; restructure the Effect instead.", synonyms: ["silence", "stifle", "mute", "hide", "swallow"], antonyms: ["allow", "reveal", "surface", "report", "propagate"] },
        { word: "conceptual", meaning: "Relating to the underlying idea of something rather than its surface details.", example: "Logging a visit is conceptually an event, not something to keep synchronised.", synonyms: ["theoretical", "abstract", "model-level", "high-level", "mental"], antonyms: ["concrete", "literal", "implementation-level", "physical", "runtime"] },
        { word: "spurious", meaning: "False or unwanted, even though it appears genuine.", example: "Removing cart from the dependencies stopped the spurious page-view events.", synonyms: ["false", "bogus", "misleading", "phantom", "not real"], antonyms: ["genuine", "legitimate", "real", "reproducible", "meaningful"] },
        { word: "volatile", meaning: "Liable to change often or unpredictably.", example: "An Effect Event's identity is volatile, so it must never be treated as stable.", synonyms: ["unstable", "changeable", "changes often", "unpredictable", "short-lived"], antonyms: ["stable", "constant", "steady", "fixed", "long-lived"] },
      ],
    },
    {
      title: "Skipping work: useMemo, useCallback and memo",
      diagram: {
        kind: "split",
        caption: "Both Hooks keep something from the previous render while their dependencies are unchanged. They are performance tools, and React Compiler 1.0 can now add most of this memoisation automatically at build time.",
        headings: ["useMemo(calculate, deps)", "useCallback(fn, deps)"],
        items: [
          { label: "Caches a calculated value", detail: "The result of calling calculate", group: 0 },
          { label: "Skips expensive work", detail: "Filter 10,000 rows only when inputs change", group: 0 },
          { label: "Stabilises objects", detail: "The same reference for memo children", group: 0 },
          { label: "Caches the function itself", detail: "fn is returned, not called", group: 1 },
          { label: "Stable event handlers", detail: "Pass them to a memo-wrapped child", group: 1 },
          { label: "Shorthand for useMemo", detail: "Same as useMemo(() => fn, deps)", group: 1 },
        ],
      },
      explanation: points(
        "useMemo caches the result of a calculation between renders until one of its dependencies changes",
        "useCallback caches a function definition, so a child receives the same function reference each render",
        "memo(Component) lets a component skip re-rendering when all of its props are unchanged",
        "They work together: memo only helps if the props you pass, including functions, are stable",
        "React Compiler 1.0, released in October 2025, memoises components and values automatically",
        "Profile first. Memoisation adds complexity and small costs, so use it only where it measurably helps",
      ),
      keyPoints: [
        { tone: "key", text: "useMemo caches a value; useCallback caches a function. Both compare dependencies with Object.is." },
        { tone: "key", text: "memo(Component) skips a re-render only when every prop equals its previous value." },
        { tone: "tip", text: "With React Compiler enabled, you rarely need to write useMemo or useCallback by hand." },
        { tone: "tip", text: "Measure with the React DevTools Profiler, or the React 19.2 Performance Tracks, before memoising." },
        { tone: "warning", text: "Memoisation is a performance hint, not a guarantee; React may discard the cache." },
        { tone: "warning", text: "Objects or functions created inline during render defeat memo, because they are new every time." },
      ],
      example: points(
        "ProductPage filters thousands of products with useMemo keyed on products and query",
        "handleBuy is wrapped in useCallback so ProductGrid receives the same function each render",
        "ProductGrid is wrapped in memo and skips re-rendering when the theme changes",
        "Typing in the search box still re-renders the grid, because visible really changed",
      ),
      useCase: {
        scenario: "An analytics dashboard re-renders every second for a live clock, and each re-render recalculates a heavy chart dataset and redraws a large table.",
        example: "Compute the chart series with useMemo keyed on the raw data and date range, wrap the table in memo, and pass it a sort handler created with useCallback.",
        usage: "The clock ticks without redoing the heavy work, and the chart and table only update when the data or filters actually change. With React Compiler, the same result comes with no manual Hooks.",
      },
      code: `import { memo, useCallback, useMemo, useState } from 'react';

export default function ProductPage({ products, theme }) {
  const [query, setQuery] = useState('');

  // Recomputed only when products or query change
  const visible = useMemo(
    () => products.filter(p => p.name.includes(query)),
    [products, query]
  );

  // The same function reference on every render
  const handleBuy = useCallback(productId => {
    post('/api/cart', { productId });
  }, []);

  return (
    <div className={theme}>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ProductGrid items={visible} onBuy={handleBuy} />
    </div>
  );
}

// Skips re-rendering while items and onBuy are unchanged
const ProductGrid = memo(function ProductGrid({ items, onBuy }) {
  return items.map(p => (
    <button key={p.id} onClick={() => onBuy(p.id)}>
      {p.name}
    </button>
  ));
});`,
      apiReference: [
        {
          name: "useMemo",
          kind: "hook",
          signature: "const cachedValue = useMemo(calculateValue, dependencies)",
          params: [
            { name: "calculateValue", type: "() => T", description: "A pure function with no arguments that returns the value to cache." },
            { name: "dependencies", type: "any[]", description: "Reactive values used inside calculateValue, compared with Object.is." },
          ],
          returns: "On the first render, the result of calculateValue. Later, the cached value, or a fresh result when a dependency changed.",
          notes: "In Strict Mode, React calls calculateValue twice in development. React may throw the cache away, so rely on it only for performance.",
        },
        {
          name: "useCallback",
          kind: "hook",
          signature: "const cachedFn = useCallback(fn, dependencies)",
          params: [
            { name: "fn", type: "Function", description: "The function to cache. React returns it; it does not call it." },
            { name: "dependencies", type: "any[]", description: "Reactive values referenced inside fn." },
          ],
          returns: "The fn from the last render when dependencies are unchanged; otherwise the fn passed during this render.",
          notes: "useCallback(fn, deps) is equivalent to useMemo(() => fn, deps).",
        },
        {
          name: "memo",
          kind: "function",
          signature: "const MemoizedComponent = memo(SomeComponent, arePropsEqual?)",
          params: [
            { name: "SomeComponent", type: "Component", description: "The component to memoise." },
            { name: "arePropsEqual", type: "(prev, next) => boolean", description: "Optional. Return true to skip the re-render. Defaults to comparing each prop with Object.is." },
          ],
          returns: "A new component that re-renders only when its props change.",
          notes: "State changes and context changes inside the component still re-render it.",
        },
      ],
      exercise: points(
        "Wrap an expensive filter in useMemo and log when it recomputes",
        "Wrap a child in memo, then pass it an inline arrow function and watch memo fail",
        "Fix it with useCallback, then remove both Hooks and enable React Compiler instead",
      ),
      checkpoint: points(
        "What exactly does useCallback return, and when does that value change?",
        "Why does memo not help when a parent passes a new object literal as a prop?",
        "Why should memoisation be treated as an optimisation rather than a guarantee?",
      ),
      mistake: points(
        "Do not wrap every value in useMemo by default; profile first",
        "Do not leave out dependencies to keep a value cached; that shows stale data",
        "Do not rely on useMemo to run side effects or to keep data alive",
      ),
      vocabulary: [
        { word: "memoise", meaning: "To remember a computed result so an identical later call can reuse it.", example: "useMemo memoises the filtered list until the query changes.", synonyms: ["cache", "remember", "cache a result", "reuse", "store the answer"], antonyms: ["recompute", "discard", "recalculate", "re-derive", "recompute each time"] },
        { word: "referential", meaning: "Relating to whether two values are the very same object in memory, not merely equal-looking.", example: "memo uses referential equality, so a new but identical array still counts as a change.", synonyms: ["identity-based", "by reference", "pointer equality", "same instance", "identity check"], antonyms: ["structural", "by value", "deep equality", "value comparison", "structural match"] },
        { word: "premature", meaning: "Happening or done before the right or necessary time.", example: "Memoising a two-item list is premature optimisation.", synonyms: ["early", "hasty", "too soon", "before it is needed", "speculative"], antonyms: ["timely", "overdue", "evidence-led", "measured first", "well-timed"] },
        { word: "overhead", meaning: "Extra cost in time or memory that comes with doing something.", example: "Every useMemo has a small overhead for storing and comparing dependencies.", synonyms: ["cost", "burden", "extra work", "tax", "added cost"], antonyms: ["savings", "benefit", "net gain", "free", "no-cost path"] },
        { word: "heuristic", meaning: "A practical rule of thumb that usually works but is not guaranteed to be optimal.", example: "A good heuristic is to memoise only calculations that take over a millisecond.", synonyms: ["rule of thumb", "guideline", "good-enough rule", "approximation", "shortcut"], antonyms: ["guarantee", "algorithm", "exact method", "proof", "deterministic rule"] },
        { word: "profile", meaning: "As a verb, to measure where a program spends its time in order to find slow parts.", example: "Profile the page before deciding which components need memo.", synonyms: ["measure", "benchmark", "record timings", "instrument", "trace"], antonyms: ["guess", "assume", "speculate", "eyeball", "eyeball it", "trust intuition"] },
      ],
    },
    {
      title: "Responsive updates with useTransition",
      diagram: {
        kind: "flow",
        caption: "A Transition lets React keep the current screen responsive while it prepares a slow update. Urgent input always wins; the transition restarts or finishes in the background.",
        items: [
          { label: "User clicks a tab", detail: "selectTab('posts') is called" },
          { label: "startTransition(() => setTab('posts'))", detail: "The update is marked as non-urgent" },
          { label: "React renders in the background", detail: "isPending is true; the old tab stays visible" },
          { label: "User clicks or types again", detail: "Urgent updates interrupt the transition" },
          { label: "The transition commits", detail: "The new tab appears and isPending returns to false" },
        ],
      },
      explanation: points(
        "useTransition returns [isPending, startTransition] and lets you mark a state update as non-blocking",
        "Updates inside startTransition can be interrupted by more urgent ones, such as typing",
        "isPending lets you show a subtle loading indicator while the old UI stays on screen",
        "In React 19, startTransition accepts async functions, and these async transitions are called Actions",
        "State updates after an await inside a transition must be wrapped in another startTransition call",
        "A standalone startTransition function is available for code outside components",
      ),
      keyPoints: [
        { tone: "key", text: "Wrap slow, non-urgent state updates in startTransition to keep the UI responsive." },
        { tone: "key", text: "React 19: functions passed to startTransition can be async. These are called Actions." },
        { tone: "tip", text: "Show isPending as a dimmed tab or a small spinner instead of replacing the page with a fallback." },
        { tone: "tip", text: "Transitions stop an already-visible Suspense boundary from falling back to its spinner." },
        { tone: "warning", text: "Text inputs cannot be controlled by a Transition; their updates must stay synchronous." },
        { tone: "warning", text: "After an await, wrap later set calls in startTransition again, or they are not part of the transition." },
      ],
      example: points(
        "Tabs wraps setTab in startTransition so a slow Posts tab never freezes the buttons",
        "The navigation fades to 60 percent opacity while isPending is true",
        "SaveButton runs an async Action and disables itself while it is pending",
        "After the await, setSaved is wrapped in startTransition again",
      ),
      useCase: {
        scenario: "A photo library has a filter bar. Applying a filter re-renders thousands of thumbnails, and the whole page used to freeze for half a second on each click.",
        example: "Keep the selected filter button in urgent state, but wrap the update that drives the thumbnail grid in startTransition and dim the grid while isPending is true.",
        usage: "Buttons respond instantly, a rapid second click cancels the half-finished render, and the user always sees either the old grid or the new one, never a frozen page.",
      },
      code: `import { useState, useTransition } from 'react';

export default function Tabs() {
  const [tab, setTab] = useState('about');
  const [isPending, startTransition] = useTransition();

  function selectTab(next) {
    startTransition(() => {
      setTab(next); // slow render, but interruptible
    });
  }

  return (
    <>
      <nav style={{ opacity: isPending ? 0.6 : 1 }}>
        <button onClick={() => selectTab('about')}>About</button>
        <button onClick={() => selectTab('posts')}>Posts</button>
      </nav>
      {tab === 'posts' ? <SlowPosts /> : <About />}
    </>
  );
}

function SaveButton({ draft }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () => startTransition(async () => {
    await saveDraft(draft); // an async Action (React 19)
    startTransition(() => setSaved(true));
  });

  return (
    <button onClick={save} disabled={isPending}>
      {isPending ? 'Saving...' : saved ? 'Saved' : 'Save'}
    </button>
  );
}`,
      apiReference: [
        {
          name: "useTransition",
          kind: "hook",
          signature: "const [isPending, startTransition] = useTransition()\n\nstartTransition(action)",
          params: [
            { name: "action", type: "() => void | Promise<void>", description: "Calls one or more set functions. React calls it immediately and marks updates scheduled during it as a Transition." },
          ],
          returns: "An array: isPending, whether a Transition is pending, and startTransition, which starts one and returns nothing.",
          notes: "useTransition takes no arguments. Call it at the top level of a component or custom Hook; startTransition has a stable identity.",
        },
        {
          name: "startTransition",
          kind: "function",
          signature: "import { startTransition } from 'react'\n\nstartTransition(action)",
          params: [
            { name: "action", type: "() => void | Promise<void>", description: "A function whose state updates are marked as a Transition." },
          ],
          returns: "Nothing.",
          notes: "Works outside components, for example in a data library, but offers no isPending flag.",
        },
      ],
      exercise: points(
        "Build three tabs where one renders a deliberately slow list",
        "Switch tabs quickly without a transition and notice the freeze",
        "Wrap setTab in startTransition and show isPending as a dimmed tab bar",
      ),
      checkpoint: points(
        "What can interrupt a Transition, and what happens to its half-finished render?",
        "Why can a controlled text input not be updated inside a Transition?",
        "What must you do with set calls that come after an await in an async Action?",
      ),
      mistake: points(
        "Do not wrap text-input state in startTransition",
        "Do not assume updates after an await are still part of the transition",
        "Do not use a Transition to delay work by time; it prioritises, it does not wait",
      ),
      vocabulary: [
        { word: "interruptible", meaning: "Able to be paused or abandoned partway through so something more important can run.", example: "Transitions are interruptible, so typing always wins over a slow re-render.", synonyms: ["pausable", "cancellable", "yieldable", "abortable", "resumable"], antonyms: ["blocking", "atomic", "uninterruptible", "all-or-nothing", "locked"] },
        { word: "urgent", meaning: "Requiring immediate attention before other work.", example: "Keystrokes are urgent updates; the filtered list is not.", synonyms: ["pressing", "critical", "high priority", "user-blocking", "immediate"], antonyms: ["deferrable", "low-priority", "background", "interruptible", "can wait"] },
        { word: "responsive", meaning: "Reacting quickly to user input without noticeable delay.", example: "The page stays responsive even while the new tab renders.", synonyms: ["snappy", "reactive", "fluid", "quick to react", "smooth"], antonyms: ["sluggish", "unresponsive", "janky", "laggy", "frozen"] },
        { word: "precedence", meaning: "The condition of being more important and therefore handled first.", example: "Clicks take precedence over the background render.", synonyms: ["priority", "preference", "ranking", "ordering rule", "who wins"], antonyms: ["subordination", "inferiority", "equal footing", "deference", "lower rank"] },
        { word: "concurrent", meaning: "Making progress on more than one task over the same period of time.", example: "Concurrent rendering lets React prepare a new screen while the old one stays interactive.", synonyms: ["parallel", "simultaneous", "interleaved", "overlapping", "multi-tasked"], antonyms: ["sequential", "serial", "blocking", "one at a time", "strictly ordered"] },
        { word: "pending", meaning: "Started but not yet completed or confirmed.", example: "isPending is true while the new tab is still rendering.", synonyms: ["in progress", "unresolved", "in flight", "awaiting result", "not settled"], antonyms: ["complete", "settled", "resolved", "finished", "returned"] },
      ],
    },
    {
      title: "Deferring work with useDeferredValue",
      diagram: {
        kind: "flow",
        caption: "useDeferredValue keeps a lagging copy of a value. The urgent part of the UI uses the fresh value, while the expensive part renders the deferred copy in the background and catches up when it can.",
        items: [
          { label: "User types 'a'", detail: "query updates at once; the input stays snappy" },
          { label: "Render with the old deferred value", detail: "Results still show the previous query" },
          { label: "Background render with the new value", detail: "React tries deferredQuery = 'a'" },
          { label: "User types 'ab'", detail: "The background render is abandoned and restarted" },
          { label: "Background render commits", detail: "Results catch up with the latest query" },
        ],
      },
      explanation: points(
        "useDeferredValue(value) returns a version of value that may lag behind the latest one",
        "On an update, React first re-renders with the old value, then re-renders in the background with the new one",
        "The background render is interruptible: a newer value abandons it and starts again",
        "It pairs with Suspense: while new results load, the old results stay visible instead of a fallback",
        "React 19 added an initialValue argument that is used for the very first render",
        "Unlike debouncing there is no fixed delay, so fast devices update almost immediately",
      ),
      keyPoints: [
        { tone: "key", text: "useDeferredValue defers a value you receive; useTransition defers an update you trigger." },
        { tone: "key", text: "Compare query !== deferredQuery to know the results are stale, and dim them." },
        { tone: "tip", text: "Wrap the slow child in memo so the urgent re-render with the old value is cheap." },
        { tone: "tip", text: "React 19: useDeferredValue(value, initialValue) renders initialValue first, then the real value." },
        { tone: "warning", text: "Pass primitives or objects created outside render; a new object every render causes endless background work." },
        { tone: "warning", text: "It does not reduce network requests; it only changes which render the user sees." },
      ],
      example: points(
        "SearchPage keeps query in state and passes deferredQuery to SearchResults",
        "Typing updates the input instantly while the result list lags slightly behind",
        "The list dims to half opacity while it is stale",
        "When a result fetch suspends, the old results stay on screen instead of a spinner",
      ),
      useCase: {
        scenario: "A code editor shows a live Markdown preview that takes 80ms to render on low-end laptops, and typing felt laggy because every keystroke waited for the preview.",
        example: "Pass useDeferredValue(markdown) to a memo-wrapped Preview component, and dim the preview while markdown !== deferredMarkdown.",
        usage: "Keystrokes render immediately, the preview updates as fast as the device allows, and quick typing simply skips intermediate previews instead of queueing them.",
      },
      code: `import {
  Suspense, memo, use, useDeferredValue, useState,
} from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query, '');
  const isStale = query !== deferredQuery;

  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search albums"
      />
      <Suspense fallback={<p>Loading...</p>}>
        <div style={{ opacity: isStale ? 0.5 : 1 }}>
          <SearchResults query={deferredQuery} />
        </div>
      </Suspense>
    </>
  );
}

// memo lets the urgent render skip this slow list
const SearchResults = memo(function SearchResults({ query }) {
  const albums = use(fetchAlbums(query)); // a cached promise
  return albums.map(a => <p key={a.id}>{a.title}</p>);
});`,
      apiReference: [
        {
          name: "useDeferredValue",
          kind: "hook",
          signature: "const deferredValue = useDeferredValue(value, initialValue?)",
          params: [
            { name: "value", type: "T", description: "The value to defer: a primitive, or an object created outside render." },
            { name: "initialValue", type: "T", description: "Optional, React 19. Used on the initial render; without it nothing is deferred on the first render." },
          ],
          returns: "On the first render, initialValue or value. On updates, first the old value, then the new value from a background re-render.",
          notes: "Inside a Transition it returns the new value at once. Background re-renders do not fire Effects until they commit. React 19.3 fixed a case where it could get stuck on an old value.",
        },
      ],
      exercise: points(
        "Build a search box that filters a list of 5,000 items and feel the lag",
        "Pass a deferred copy of the query to a memo-wrapped list and compare",
        "Add a stale indicator by comparing the value with its deferred copy",
      ),
      checkpoint: points(
        "In what order does React render after the value changes?",
        "How is useDeferredValue different from a 300ms debounce?",
        "Why does passing a new object literal to useDeferredValue cause trouble?",
      ),
      mistake: points(
        "Do not forget memo on the slow child, or the urgent render stays slow",
        "Do not expect fewer network requests; add caching or debouncing for that",
        "Do not pass an object created during render as the value",
      ),
      vocabulary: [
        { word: "defer", meaning: "To put off an action until a later, more convenient time.", example: "React defers the expensive list render until the input has updated.", synonyms: ["postpone", "delay", "put off", "schedule later", "lower priority"], antonyms: ["expedite", "hasten", "do now", "prioritise", "flush immediately"] },
        { word: "lag", meaning: "To fall behind; also the delay by which something falls behind.", example: "The results may lag one keystroke behind the input.", synonyms: ["trail", "delay", "fall behind", "stale by a beat", "catch up late"], antonyms: ["lead", "keep pace", "stay current", "track exactly", "stay in sync", "immediate update"] },
        { word: "throttle", meaning: "To limit how often something is allowed to run in a period of time.", example: "Throttling runs a handler at most once every 100ms.", synonyms: ["rate-limit", "restrict", "cap the rate", "space out", "limit frequency"], antonyms: ["unleash", "flood", "run unbounded", "fire every event", "no cap"] },
        { word: "debounce", meaning: "To wait until input has stopped for a set time before acting on it.", example: "A debounced search waits 300ms after the last keystroke before querying.", synonyms: ["settle", "coalesce", "wait for quiet", "collapse bursts", "delay until idle"], antonyms: ["fire immediately", "stream", "respond per keystroke", "immediate trigger", "no delay"] },
        { word: "perceptible", meaning: "Large enough to be noticed by the senses.", example: "An 80ms delay per keystroke is perceptible to most typists.", synonyms: ["noticeable", "discernible", "visible to a user", "felt", "above threshold"], antonyms: ["imperceptible", "negligible", "unnoticeable", "below threshold", "invisible"] },
        { word: "intermediate", meaning: "Coming between a starting point and an end point.", example: "Fast typing skips intermediate previews instead of rendering each one.", synonyms: ["in-between", "transitional", "mid-step", "interim", "staging value"], antonyms: ["final", "initial", "endpoint", "starting point", "settled result"] },
      ],
    },
    {
      title: "Actions and useActionState",
      diagram: {
        kind: "flow",
        caption: "An Action is an async function run inside a transition. useActionState wires one to a form: it tracks the pending status, passes the previous result in, and exposes the latest result as state.",
        items: [
          { label: "Form submits", detail: "<form action={formAction}> collects the FormData" },
          { label: "dispatchAction(formData)", detail: "The call is queued and isPending becomes true" },
          { label: "reducerAction(prevState, formData)", detail: "Your async function validates and saves" },
          { label: "Return value becomes state", detail: "An error or a success message, not a throw" },
          { label: "Form resets on success", detail: "React resets uncontrolled fields automatically" },
        ],
      },
      explanation: points(
        "React 19 calls an async function used in a transition an Action, and tracks its pending state for you",
        "form, button and input elements accept a function as their action or formAction prop",
        "useActionState(reducerAction, initialState) returns [state, dispatchAction, isPending]",
        "reducerAction receives the previous state and the payload, usually FormData, and returns the next state",
        "Multiple dispatches are queued and run one after another, each receiving the previous result",
        "With a Server Function as the action, the form can even work before JavaScript has loaded",
      ),
      keyPoints: [
        { tone: "key", text: "useActionState returns exactly three values: state, dispatchAction and isPending." },
        { tone: "key", text: "reducerAction(previousState, payload) returns the next state. Return errors instead of throwing them." },
        { tone: "tip", text: "Pass dispatchAction straight to <form action>; React runs it inside a transition for you." },
        { tone: "tip", text: "With Server Functions, the optional permalink lets submissions made before hydration land on the right page." },
        { tone: "warning", text: "Calling dispatchAction outside an Action logs an error in development; wrap it in startTransition." },
        { tone: "warning", text: "If reducerAction throws, React cancels the queued actions and shows the nearest Error Boundary." },
      ],
      example: points(
        "Newsletter passes formAction to its form's action prop",
        "subscribe validates the email and returns an error object instead of throwing",
        "The button shows Subscribing... from isPending with no extra state",
        "On success React resets the uncontrolled email input automatically",
      ),
      useCase: {
        scenario: "A SaaS settings page lets admins rename the workspace. It must show a pending state, display server validation errors inline, and avoid double submissions.",
        example: "const [state, formAction, isPending] = useActionState(renameWorkspace, { error: null }); the form's action is formAction, the button is disabled while pending, and state.error renders under the field.",
        usage: "Pending, error and success handling come from one Hook with no manual useState flags, and queued submissions run strictly in order, so a quick double click cannot race.",
      },
      code: `import { useActionState } from 'react';

async function subscribe(prevState, formData) {
  const email = formData.get('email');
  if (!email.includes('@')) {
    return { ok: false, message: 'Enter a valid email.' };
  }
  await saveSubscriber(email);
  return { ok: true, message: 'Subscribed ' + email };
}

export default function Newsletter() {
  const [state, formAction, isPending] = useActionState(
    subscribe,
    { ok: false, message: '' }
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <button disabled={isPending}>
        {isPending ? 'Subscribing...' : 'Subscribe'}
      </button>
      {state.message && (
        <p className={state.ok ? 'success' : 'error'}>
          {state.message}
        </p>
      )}
    </form>
  );
}`,
      apiReference: [
        {
          name: "useActionState",
          kind: "hook",
          signature: "const [state, dispatchAction, isPending] =\n  useActionState(reducerAction, initialState, permalink?)",
          params: [
            { name: "reducerAction", type: "(prevState, payload) => State | Promise<State>", description: "Called when the Action runs, with the previous state and the payload passed to dispatchAction." },
            { name: "initialState", type: "State", description: "The initial state, ignored after the first dispatch. Must be serialisable when used with Server Functions." },
            { name: "permalink", type: "string", description: "Optional page URL that a form submitted before JavaScript loads navigates to, for Server Functions." },
          ],
          returns: "[state, dispatchAction, isPending]: the latest result, a function that triggers the Action, and whether any dispatch is pending.",
          notes: "Dispatches are queued and run sequentially. dispatchAction has a stable identity. React 19.3 fires onReset when it auto-resets a form after a Server Action.",
        },
        {
          name: "<form action>",
          kind: "DOM prop (react-dom)",
          signature: "<form action={fn}>\n<button formAction={fn}>\n<input type=\"submit\" formAction={fn} />",
          params: [
            { name: "action", type: "string | (formData: FormData) => void", description: "A URL behaves like plain HTML. A function is called with the form's FormData inside a transition." },
          ],
          returns: "Nothing. After a successful function action, React resets the form's uncontrolled fields.",
          notes: "Read the pending state from inside the form with useFormStatus, or from the form's owner with useActionState.",
        },
      ],
      exercise: points(
        "Build a login form whose action returns an error message for a wrong password",
        "Disable the submit button with isPending while the request runs",
        "Submit twice quickly and log how the second call receives the first call's result",
      ),
      checkpoint: points(
        "What are the three values returned by useActionState?",
        "Why should reducerAction return errors instead of throwing them?",
        "What happens to uncontrolled inputs after a successful form action?",
      ),
      mistake: points(
        "Do not call dispatchAction from a plain onClick without startTransition",
        "Do not keep separate isLoading and error state when useActionState already provides them",
        "Do not pass a non-serialisable initialState when the action is a Server Function",
      ),
      vocabulary: [
        { word: "sequential", meaning: "Happening one after another in a fixed order.", example: "Queued Actions are sequential, so each one sees the previous result.", synonyms: ["serial", "consecutive", "in order", "one after another", "chained"], antonyms: ["parallel", "concurrent", "simultaneous", "interleaved", "fanned out"] },
        { word: "payload", meaning: "The actual data carried by a message or request.", example: "The form's FormData is the payload passed to the Action.", synonyms: ["content", "body", "data", "message content", "transmitted value"], antonyms: ["envelope", "header", "wrapper", "transport frame", "protocol overhead"] },
        { word: "mutation", meaning: "An operation that changes stored data rather than only reading it.", example: "Renaming the workspace is a mutation, so it belongs in an Action.", synonyms: ["write", "update", "state change", "side effect"], antonyms: ["query", "read", "lookup", "fetch", "pure read"] },
        { word: "queue", meaning: "A line of tasks waiting to be processed in the order they arrived.", example: "React places each dispatch in a queue and runs them one by one.", synonyms: ["backlog", "line", "waiting list", "buffer", "pipeline"], antonyms: ["stack", "free-for-all", "immediate execution", "drop", "random order"] },
        { word: "serialisable", meaning: "Able to be converted into a format that can travel over a network and be rebuilt.", example: "Plain objects are serialisable, but class instances and functions are not.", synonyms: ["transferable", "encodable", "JSON-safe", "sendable", "portable"], antonyms: ["opaque", "non-transferable", "function value", "live handle", "process-bound"] },
        { word: "permalink", meaning: "A permanent URL that always points to the same page or resource.", example: "The permalink tells an early form submission which page to load.", synonyms: ["fixed URL", "canonical link", "stable URL", "durable address", "shareable link"], antonyms: ["temporary link", "ephemeral URL", "session URL", "expiring link", "generated once"] },
      ],
    },
    {
      title: "Form status with useFormStatus",
      diagram: {
        kind: "tree",
        caption: "useFormStatus reads the submission status of the nearest parent form. A reusable submit button can show its own pending state without the form passing any props to it.",
        items: [
          { label: "<form action={placeOrder}>", detail: "the parent form" },
          { label: "<AddressFields />", detail: "plain inputs", depth: 1 },
          { label: "<SubmitButton />", detail: "useFormStatus() returns { pending, data, method, action }", depth: 1 },
          { label: "<Spinner />", detail: "shown while pending is true", depth: 2 },
          { label: "<form action={applyCoupon}>", detail: "a separate form" },
          { label: "<SubmitButton />", detail: "reports only its own parent form", depth: 1 },
        ],
      },
      explanation: points(
        "useFormStatus is imported from react-dom and returns the status of the parent form's current submission",
        "The status object has four fields: pending, data, method and action",
        "It must be called from a component rendered inside a <form>, not from the component that renders the form",
        "That makes design-system buttons and inputs aware of submissions without prop drilling",
        "data is the FormData being submitted, so you can show what is being sent while it is pending",
        "It works with any form whose action is a function, including Server Functions",
      ),
      keyPoints: [
        { tone: "key", text: "Import it from react-dom: import { useFormStatus } from 'react-dom'." },
        { tone: "key", text: "It returns { pending, data, method, action } for the parent <form> only." },
        { tone: "tip", text: "Build one SubmitButton that disables itself while pending and reuse it in every form." },
        { tone: "tip", text: "Read data.get('name') while pending to show text such as Sending to Asha..." },
        { tone: "warning", text: "Called in the same component that renders the <form>, it never reports pending as true." },
        { tone: "warning", text: "It does not track forms rendered inside the calling component or its children." },
      ],
      example: points(
        "SubmitButton calls useFormStatus and disables itself while pending",
        "While sending it shows the invited friend's name from data",
        "InviteForm renders the form but never calls useFormStatus itself",
        "The same SubmitButton works unchanged in every form in the app",
      ),
      useCase: {
        scenario: "A design system's Button is used in 40 forms, and each form team kept wiring an isSubmitting prop into it by hand, often forgetting to.",
        example: "Ship a FormSubmit component that calls useFormStatus internally, disables itself while pending, shows a spinner and sets aria-busy, with no props required.",
        usage: "Every form gets consistent pending feedback and protection against double submits for free, and teams delete their hand-rolled isSubmitting state.",
      },
      code: `import { useFormStatus } from 'react-dom';

function SubmitButton({ children }) {
  const { pending, data } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? 'Sending to ' + data.get('name') + '...' : children}
    </button>
  );
}

async function sendInvite(formData) {
  await api.invite(formData.get('name'));
}

export default function InviteForm() {
  // Do not call useFormStatus here: this component renders the form
  return (
    <form action={sendInvite}>
      <input name="name" placeholder="Friend's name" />
      <SubmitButton>Send invite</SubmitButton>
    </form>
  );
}`,
      apiReference: [
        {
          name: "useFormStatus",
          kind: "hook (react-dom)",
          signature: "const { pending, data, method, action } = useFormStatus()",
          params: [
            { name: "pending", type: "boolean", description: "True while the parent form is submitting." },
            { name: "data", type: "FormData | null", description: "The data being submitted; null with no active submission or no parent form." },
            { name: "method", type: "'get' | 'post'", description: "The HTTP method of the parent form. Forms use get by default." },
            { name: "action", type: "Function | null", description: "The function passed to the parent form's action prop; null for a URL action or none." },
          ],
          returns: "A status object describing the parent form's current submission. The Hook itself takes no parameters.",
          notes: "Must be called from a component rendered inside a <form>, and only reports on that parent form. React 19.3 fixed a case where form status reset when component state updated.",
        },
      ],
      exercise: points(
        "Build a SubmitButton that shows a spinner while its form is pending",
        "Use it in two different forms on one page and submit each separately",
        "Try calling useFormStatus in the component that renders the form and observe the result",
      ),
      checkpoint: points(
        "Which package exports useFormStatus?",
        "Why does useFormStatus report nothing when called in the component that renders the form?",
        "Name the four fields of the returned status object",
      ),
      mistake: points(
        "Do not import useFormStatus from react; it lives in react-dom",
        "Do not call it outside a <form> and expect a status",
        "Do not keep a parallel isSubmitting prop now that the button can read the form's status",
      ),
      vocabulary: [
        { word: "ancestor", meaning: "An element located anywhere above another one in a tree.", example: "useFormStatus reads the status of its nearest form ancestor.", synonyms: ["parent", "forebear", "enclosing component", "outer node", "container"], antonyms: ["descendant", "child", "nested node", "leaf", "subtree member"] },
        { word: "submission", meaning: "The act of sending a completed form for processing.", example: "The button stays disabled until the submission finishes.", synonyms: ["sending", "filing", "form post", "sent data", "commit of input"], antonyms: ["retrieval", "withdrawal", "draft", "cancel", "discard"] },
        { word: "affordance", meaning: "A visual cue that shows how something can be used or what state it is in.", example: "A disabled, spinning button is an affordance that says the form is busy.", synonyms: ["cue", "signal", "visual hint", "usability clue", "invitation to act"], antonyms: ["ambiguity", "obscurity", "hidden control", "unclear target", "no feedback"] },
        { word: "prop drilling", meaning: "Passing a prop through many layers of components that do not use it just to reach a deep child.", example: "useFormStatus removes the prop drilling of an isSubmitting flag.", synonyms: ["threading props", "prop passing", "manual pass-down", "intermediate plumbing", "chain of props"], antonyms: ["context", "direct access", "shared context", "store access", "colocation"] },
        { word: "indicator", meaning: "Something that shows the state or condition of a system.", example: "The spinner is a pending indicator for the invite form.", synonyms: ["signal", "marker", "status cue", "progress hint", "badge"], antonyms: ["concealment", "silence", "silent state", "no feedback", "hidden progress"] },
        { word: "agnostic", meaning: "Not tied to or dependent on any one particular thing.", example: "A form-agnostic SubmitButton works in any form because it reads its parent's status.", synonyms: ["independent", "neutral", "portable", "unopinionated", "vendor-neutral"], antonyms: ["coupled", "specific", "tied to one vendor", "opinionated", "platform-locked"] },
      ],
    },
    {
      title: "Instant feedback with useOptimistic",
      diagram: {
        kind: "flow",
        caption: "useOptimistic shows the expected result of an Action before the server confirms it. When the Action ends, React drops the optimistic value and renders the real state, which also rolls back failures.",
        items: [
          { label: "User sends a message", detail: "The form's action starts" },
          { label: "setOptimistic(draft)", detail: "The UI shows the message as sending, instantly" },
          { label: "Request in flight", detail: "optimisticState differs from the real state" },
          { label: "Action finishes", detail: "The real state now includes the saved message" },
          { label: "Optimistic value discarded", detail: "The UI shows real state; on error it reverts" },
        ],
      },
      explanation: points(
        "useOptimistic(value, reducer?) returns [optimisticState, setOptimistic]",
        "optimisticState equals value unless an Action is pending, when it shows your optimistic version",
        "setOptimistic must be called inside an Action, such as a form action or a startTransition callback",
        "With a reducer, the argument to setOptimistic is passed to it, which suits adding items to a list",
        "When the Action completes, the optimistic value is thrown away and value is shown again",
        "If the request fails and value was never updated, the UI reverts automatically",
      ),
      keyPoints: [
        { tone: "key", text: "optimisticState equals the real value whenever no Action is pending." },
        { tone: "key", text: "setOptimistic only works inside an Action: a form action or a startTransition callback." },
        { tone: "tip", text: "Mark optimistic items, for example with a sending flag, so the UI can style them as unconfirmed." },
        { tone: "tip", text: "Pass a reducer, useOptimistic(list, (state, item) => [...state, item]), for list updates." },
        { tone: "warning", text: "Calling setOptimistic outside an Action logs a warning and the value only flashes briefly." },
        { tone: "warning", text: "Always update the real state on success, or the change disappears when the Action ends." },
      ],
      example: points(
        "Thread renders optimistic, not messages, so a new message appears at once",
        "The draft carries sending: true and is shown faded with a sending label",
        "When deliverMessage resolves, the saved message is added to the real state",
        "If deliverMessage throws, the draft vanishes and the error boundary explains why",
      ),
      useCase: {
        scenario: "A social feed's like button waits 400ms for the server on mobile networks, and users tap it repeatedly because nothing seems to happen.",
        example: "Render the count from useOptimistic(likes, (n, delta) => n + delta), call setOptimistic(1) in the like Action, then update the real likes from the server's response.",
        usage: "The heart fills and the count increments on tap. If the request fails, the count quietly falls back to the real value with no manual rollback code.",
      },
      code: `import { startTransition, useOptimistic, useState } from 'react';

export default function Thread() {
  const [messages, setMessages] = useState([]);
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (state, draft) => [...state, draft]
  );

  async function sendAction(formData) {
    const text = formData.get('message');
    const id = crypto.randomUUID();
    addOptimistic({ id, text, sending: true }); // instant
    const saved = await deliverMessage(text);
    startTransition(() => {
      setMessages(list => [...list, saved]); // real state
    });
  }

  return (
    <>
      {optimistic.map(m => (
        <p key={m.id} className={m.sending ? 'muted' : ''}>
          {m.text} {m.sending && <small>(sending)</small>}
        </p>
      ))}
      <form action={sendAction}>
        <input name="message" />
        <button>Send</button>
      </form>
    </>
  );
}`,
      apiReference: [
        {
          name: "useOptimistic",
          kind: "hook",
          signature: "const [optimisticState, setOptimistic] =\n  useOptimistic(value, reducer?)\n\nsetOptimistic(nextOrUpdater)",
          params: [
            { name: "value", type: "T", description: "The value returned whenever no Action is pending." },
            { name: "reducer", type: "(currentState, action) => T", description: "Optional pure function that computes the optimistic state from the current state and the argument to setOptimistic." },
            { name: "nextOrUpdater", type: "any | (pending) => T", description: "The optimistic value, the action for your reducer, or a pure updater applied to the pending state." },
          ],
          returns: "[optimisticState, setOptimistic]: the value to render, and a function that sets it for the duration of an Action.",
          notes: "setOptimistic returns nothing and must be called inside an Action; outside one, React warns and the value renders only briefly.",
        },
      ],
      exercise: points(
        "Build a like button whose count increments optimistically",
        "Make the fake server fail one time in three and watch the count revert",
        "Add a reducer so several quick likes each add one to the optimistic count",
      ),
      checkpoint: points(
        "What does optimisticState equal when no Action is pending?",
        "Why must setOptimistic be called inside an Action?",
        "What happens to the optimistic value when the request fails?",
      ),
      mistake: points(
        "Do not call setOptimistic from a plain event handler outside a transition",
        "Do not forget to update the real state after the server confirms",
        "Do not use index keys for optimistic list items; give each draft an id",
      ),
      vocabulary: [
        { word: "optimistic", meaning: "Assuming the most likely good outcome and acting on it before it is confirmed.", example: "The optimistic update shows the comment before the server has saved it.", synonyms: ["hopeful", "anticipatory", "assumed success", "ahead of confirmation", "predicted"], antonyms: ["pessimistic", "cautious", "confirmed", "server-truth"] },
        { word: "revert", meaning: "To return to a previous state.", example: "If saving fails, the like count reverts to the real number.", synonyms: ["roll back", "restore", "undo", "return to previous", "back out"], antonyms: ["commit", "advance", "confirm", "persist", "move forward"] },
        { word: "provisional", meaning: "Arranged for the present, possibly to be changed later.", example: "The greyed-out message is provisional until the server confirms it.", synonyms: ["tentative", "temporary", "pending confirmation", "draft", "assumed"], antonyms: ["final", "confirmed", "authoritative", "settled", "server-confirmed"] },
        { word: "perceived", meaning: "As it seems to the user, which may differ from what is measured.", example: "Optimistic updates cut the perceived latency to zero.", synonyms: ["apparent", "felt", "experienced", "subjective", "as it feels"], antonyms: ["actual", "measured", "instrumented", "objective", "as measured"] },
        { word: "discrepancy", meaning: "A difference between two things that should match.", example: "During the request there is a brief discrepancy between the screen and the database.", synonyms: ["mismatch", "divergence", "difference", "gap", "inconsistency"], antonyms: ["agreement", "consistency", "exact match", "parity", "alignment"] },
        { word: "latency", meaning: "The delay between a request and its response.", example: "High mobile latency is exactly where useOptimistic helps most.", synonyms: ["delay", "lag", "round-trip time", "wait", "response delay"], antonyms: ["immediacy", "responsiveness", "instant response", "low delay", "snappiness"] },
      ],
    },
    {
      title: "Reading resources with use and Suspense",
      diagram: {
        kind: "flow",
        caption: "use reads the value of a promise or a context during render. A pending promise suspends the component so Suspense shows its fallback; a rejected one is caught by the nearest Error Boundary.",
        items: [
          { label: "A parent starts a fetch", detail: "const promise = fetchComments(id), not awaited" },
          { label: "The promise is passed as a prop", detail: "<Comments commentsPromise={promise} />" },
          { label: "use(commentsPromise) suspends", detail: "The nearest <Suspense> shows its fallback" },
          { label: "The promise resolves", detail: "React re-renders with the resolved value" },
          { label: "Or the promise rejects", detail: "The nearest Error Boundary shows its fallback" },
        ],
      },
      explanation: points(
        "use(resource) reads a Promise or a context during render; despite its name it is an API, not a Hook",
        "Unlike Hooks, use can be called inside conditions and loops, but still only in components or Hooks",
        "Given a pending Promise, the component suspends and the nearest Suspense boundary shows its fallback",
        "A rejected Promise shows the nearest Error Boundary; use cannot be wrapped in try/catch",
        "Promises must be cached or created outside render, typically in a Server Component or a data library",
        "React 19.3 adds use(browser()) from react-dom to render a component only in the browser",
      ),
      keyPoints: [
        { tone: "key", text: "use(promise) returns the resolved value and suspends while the promise is pending." },
        { tone: "key", text: "use is the one React API that may be called conditionally, inside if and for." },
        { tone: "tip", text: "Create the promise in a Server Component and pass it to a Client Component to stream data." },
        { tone: "tip", text: "Handle rejections with an Error Boundary, or with promise.catch() to resolve to a fallback value." },
        { tone: "warning", text: "Do not create the promise during a Client Component's render; a new promise every render never settles." },
        { tone: "warning", text: "use cannot be called inside try/catch; errors must reach an Error Boundary." },
      ],
      example: points(
        "PostPage starts fetchComments without awaiting it and renders the post straight away",
        "Comments calls use(commentsPromise) and suspends until the comments arrive",
        "The Suspense fallback shows Loading comments... in the meantime",
        "Heading reads ThemeContext with use inside an if statement",
      ),
      useCase: {
        scenario: "A product page must show the product immediately, while reviews come from a slower service that can take a second or more to respond.",
        example: "In the Server Component, start reviewsPromise = getReviews(id) without awaiting, render the product, and pass the promise into a Reviews Client Component wrapped in Suspense.",
        usage: "The product HTML streams at once and the reviews pop in when ready. The fetch starts on the server early, so there is no client-side waterfall of requests.",
      },
      code: `// app/post/page.js (Server Component)
import { Suspense } from 'react';
import { Comments } from './comments';

export default function PostPage({ id }) {
  const commentsPromise = fetchComments(id); // not awaited
  return (
    <Suspense fallback={<p>Loading comments...</p>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}

// app/post/comments.js (Client Component)
'use client';
import { use } from 'react';

export function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}

function Heading({ show }) {
  if (show) {
    const theme = use(ThemeContext); // conditional is fine
    return <h1 className={theme}>Hello</h1>;
  }
  return null;
}`,
      apiReference: [
        {
          name: "use",
          kind: "API (react)",
          signature: "const value = use(resource)\n// resource: Promise<T> | Context<T>",
          params: [
            { name: "resource", type: "Promise<T> | Context<T>", description: "A cached Promise whose value you want, or a context created with createContext." },
          ],
          returns: "The resolved value of the Promise, or the context value from the closest provider.",
          notes: "Call it in a component or Hook, never inside try/catch. Reading context with use is not supported in Server Components. Values sent from server to client must be serialisable.",
        },
        {
          name: "Suspense",
          kind: "component (react)",
          signature: "<Suspense fallback={<Spinner />}>\n  <SomethingThatSuspends />\n</Suspense>",
          params: [
            { name: "children", type: "ReactNode", description: "The UI to render. If anything inside suspends, the fallback is shown instead." },
            { name: "fallback", type: "ReactNode", description: "A lightweight placeholder shown while the children are loading." },
          ],
          returns: "The children once they are ready; the fallback until then.",
          notes: "Updates inside startTransition keep already-revealed content on screen instead of falling back again.",
        },
        {
          name: "browser",
          kind: "function (react-dom, 19.3)",
          signature: "import { browser } from 'react-dom'\n\nuse(browser(reason?))",
          params: [
            { name: "reason", type: "string", description: "Optional message explaining why the component needs the browser." },
          ],
          returns: "undefined in the browser. During server rendering the component suspends and the Suspense fallback goes into the HTML.",
          notes: "New in React 19.3. The component must sit inside a <Suspense> boundary, and in an RSC app it must be a Client Component.",
        },
      ],
      exercise: points(
        "Create a promise at module level and read it with use inside a Suspense boundary",
        "Make the promise reject and catch it with an Error Boundary",
        "Read a context with use inside an if statement and confirm it works",
      ),
      checkpoint: points(
        "What happens to a component that calls use with a pending promise?",
        "Why must the promise be cached rather than created during render?",
        "How is use different from every Hook when it comes to conditions?",
      ),
      mistake: points(
        "Do not write use(fetch(url)) inside a Client Component's render",
        "Do not wrap use in try/catch; add an Error Boundary",
        "Do not forget the Suspense boundary above a component that suspends",
      ),
      vocabulary: [
        { word: "suspend", meaning: "To pause temporarily until some condition is met.", example: "The component suspends until the comments promise resolves.", synonyms: ["pause", "halt", "wait", "hold rendering", "stall"], antonyms: ["resume", "continue", "carry on", "render now", "release"] },
        { word: "resolve", meaning: "For a promise, to complete successfully and produce a value.", example: "When the promise resolves, React renders the comments.", synonyms: ["fulfil", "settle", "complete successfully", "return a value", "finish"], antonyms: ["reject", "fail", "throw", "time out", "remain pending"] },
        { word: "reject", meaning: "For a promise, to fail and produce an error instead of a value.", example: "If the request rejects, the Error Boundary shows a retry message.", synonyms: ["fail", "error out", "throw", "return an error", "refuse"], antonyms: ["resolve", "succeed", "fulfil", "return a value", "complete"] },
        { word: "fallback", meaning: "A stand-in shown while the real content is unavailable.", example: "The skeleton is the fallback until the reviews arrive.", synonyms: ["placeholder", "backup", "skeleton", "placeholder view", "loading state"], antonyms: ["final content", "primary view", "real content", "settled UI", "loaded result"] },
        { word: "boundary", meaning: "A dividing line that contains the effects of what happens inside it.", example: "A Suspense boundary limits the loading state to the reviews section.", synonyms: ["border", "perimeter", "dividing line", "edge", "seam"], antonyms: ["open space", "interior", "shared scope", "seamless whole", "single environment"] },
        { word: "orchestrate", meaning: "To arrange and coordinate several parts so they work together smoothly.", example: "Suspense boundaries orchestrate the order in which sections appear.", synonyms: ["coordinate", "arrange", "sequence", "drive", "conduct"], antonyms: ["disorganise", "scatter", "leave uncoordinated", "run independently", "improvise"] },
      ],
    },
    {
      title: "External stores with useSyncExternalStore",
      diagram: {
        kind: "flow",
        caption: "useSyncExternalStore subscribes a component to data that lives outside React, such as a browser API or a third-party store, and guarantees every component sees the same snapshot.",
        items: [
          { label: "Component calls the Hook", detail: "useSyncExternalStore(subscribe, getSnapshot)" },
          { label: "React calls subscribe(callback)", detail: "The store remembers the callback" },
          { label: "The store changes", detail: "For example the browser fires online or offline" },
          { label: "Callback fires; getSnapshot re-runs", detail: "The new value is compared with Object.is" },
          { label: "Re-render if changed", detail: "The returned unsubscribe runs on unmount" },
        ],
      },
      explanation: points(
        "Most state lives in React, but some lives outside it: browser APIs, third-party stores and global caches",
        "useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?) reads such a store safely",
        "subscribe registers a callback and returns a function that unsubscribes",
        "getSnapshot returns the current value, and must return the same value while the store is unchanged",
        "getServerSnapshot supplies the value used for server rendering and hydration",
        "Wrapping it in a custom Hook such as useOnlineStatus hides the plumbing from components",
      ),
      keyPoints: [
        { tone: "key", text: "It prevents tearing: every component reads the same version of the store in one render." },
        { tone: "key", text: "getSnapshot must return a cached, immutable value while the store has not changed." },
        { tone: "tip", text: "Declare subscribe outside the component so React does not re-subscribe on every render." },
        { tone: "tip", text: "Wrap it in a custom Hook such as useOnlineStatus() and reuse it anywhere." },
        { tone: "warning", text: "Returning a new object from getSnapshot on every call causes an infinite re-render loop." },
        { tone: "warning", text: "Without getServerSnapshot, rendering the component on the server throws an error." },
      ],
      example: points(
        "subscribe listens to the window's online and offline events",
        "getSnapshot returns navigator.onLine, a primitive that is naturally stable",
        "useOnlineStatus wraps the Hook so any component can call it",
        "SaveButton disables itself and shows Reconnecting... while offline",
      ),
      useCase: {
        scenario: "A web app shares a small store with a legacy jQuery widget and also needs to react to the window width, and some components were showing different values in the same frame.",
        example: "Expose subscribe and getState from the store and read it with useSyncExternalStore(store.subscribe, store.getState), and build a useWindowWidth Hook the same way.",
        usage: "All components read one consistent snapshot per render, the legacy widget keeps working unchanged, and the mismatched frames disappear.",
      },
      code: `import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true; // assume online in HTML

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

export default function SaveButton() {
  const isOnline = useOnlineStatus();
  return (
    <button disabled={!isOnline}>
      {isOnline ? 'Save progress' : 'Reconnecting...'}
    </button>
  );
}`,
      apiReference: [
        {
          name: "useSyncExternalStore",
          kind: "hook",
          signature: "const snapshot = useSyncExternalStore(\n  subscribe,\n  getSnapshot,\n  getServerSnapshot?\n)",
          params: [
            { name: "subscribe", type: "(callback) => () => void", description: "Subscribes callback to the store and returns a function that unsubscribes." },
            { name: "getSnapshot", type: "() => T", description: "Returns the store data. Repeated calls must return the same value while the store is unchanged." },
            { name: "getServerSnapshot", type: "() => T", description: "Optional. The snapshot used during server rendering and hydration; it must match on server and client." },
          ],
          returns: "The current snapshot of the store, for use in rendering.",
          notes: "A store mutated during a Transition falls back to a blocking update. Avoid suspending based on its value, as that shows the nearest Suspense fallback.",
        },
      ],
      exercise: points(
        "Build useOnlineStatus and toggle offline mode in DevTools to watch it update",
        "Build useWindowWidth with a resize subscription",
        "Return a new object from getSnapshot on purpose and observe the warning",
      ),
      checkpoint: points(
        "What is tearing, and how does this Hook prevent it?",
        "Why should subscribe be defined outside the component?",
        "When is getServerSnapshot used?",
      ),
      mistake: points(
        "Do not return a freshly created object from getSnapshot on every call",
        "Do not use it for state React already owns; useState is simpler",
        "Do not omit getServerSnapshot in server-rendered apps",
      ),
      vocabulary: [
        { word: "tearing", meaning: "A visual inconsistency where different parts of the screen show different versions of the same data.", example: "useSyncExternalStore prevents tearing during concurrent rendering.", synonyms: ["inconsistency", "split view", "mixed-version render", "visual inconsistency", "torn frame"], antonyms: ["consistency", "coherence", "single consistent view", "atomic update", "coherent frame"] },
        { word: "subscribe", meaning: "To register interest in a source so that you are notified whenever it changes.", example: "The Hook subscribes to online and offline events.", synonyms: ["listen", "register", "attach a listener", "watch", "opt in to updates"], antonyms: ["unsubscribe", "ignore", "detach", "stop listening", "poll manually"] },
        { word: "consistency", meaning: "The quality of every part agreeing with every other part.", example: "All components show the same count, so the UI keeps its consistency.", synonyms: ["coherence", "uniformity", "one version everywhere", "agreement", "integrity"], antonyms: ["inconsistency", "discrepancy", "divergence", "mixed state", "contradiction"] },
        { word: "hydrate", meaning: "To attach client-side behaviour to HTML that was rendered on the server.", example: "During hydration React uses getServerSnapshot so the HTML matches.", synonyms: ["activate", "attach", "make interactive", "bind handlers", "adopt markup"], antonyms: ["dehydrate", "serialise", "leave static", "render fresh", "discard HTML"] },
        { word: "mismatch", meaning: "A failure of two things that should be the same to correspond.", example: "Returning different server and client snapshots causes a hydration mismatch.", synonyms: ["discrepancy", "conflict", "divergence", "disagreement", "difference"], antonyms: ["match", "agreement", "identical output", "alignment", "parity"] },
        { word: "broadcast", meaning: "To send a message to every listener at once.", example: "The store broadcasts each change to all of its subscribers.", synonyms: ["announce", "publish", "notify all", "fan out", "emit widely"], antonyms: ["whisper", "unicast", "targeted send", "point-to-point", "silence"] },
      ],
    },
    {
      title: "Custom Hooks, useId and useDebugValue",
      diagram: {
        kind: "tree",
        caption: "Custom Hooks package reusable stateful logic. Each component that calls one gets its own independent state, while useId and useDebugValue make that logic accessible and easy to inspect.",
        items: [
          { label: "useFormField(label)", detail: "a custom Hook: a function whose name starts with use" },
          { label: "useId()", detail: "a stable unique id, identical on server and client", depth: 1 },
          { label: "useState('')", detail: "the field's value", depth: 1 },
          { label: "useDebugValue(...)", detail: "the label shown in React DevTools", depth: 1 },
          { label: "<EmailField />", detail: "calls useFormField('Email')" },
          { label: "<PasswordField />", detail: "calls useFormField('Password') and gets its own state and id" },
        ],
      },
      explanation: points(
        "A custom Hook is a function whose name starts with use and which calls other Hooks",
        "It shares logic, not state: every component that calls it gets its own copy of the state",
        "useId generates a unique, stable id that matches between server and client rendering",
        "Use it to connect labels to inputs and aria attributes to their targets, never as a list key",
        "useDebugValue adds a readable label to a custom Hook in React DevTools",
        "React 19.2 changed the default useId prefix to _r_ so ids are valid in more contexts",
      ),
      keyPoints: [
        { tone: "key", text: "Custom Hooks share stateful logic, not state itself." },
        { tone: "key", text: "useId() returns a unique string that is stable across renders and consistent with server HTML." },
        { tone: "tip", text: "Call useId once per component and derive related ids: id + '-hint', id + '-error'." },
        { tone: "tip", text: "Pass a formatter as useDebugValue's second argument so expensive formatting runs only in DevTools." },
        { tone: "warning", text: "Never use useId to generate list keys; keys should come from your data." },
        { tone: "warning", text: "Name custom Hooks useSomething; the linter relies on the prefix to check the Rules of Hooks." },
      ],
      example: points(
        "useFormField bundles an id, a value and an onChange handler",
        "SignupForm calls it twice, once for email and once for password",
        "Each field gets its own id, so the label's htmlFor always matches its input",
        "DevTools shows Email: filled next to the Hook while inspecting",
      ),
      useCase: {
        scenario: "A banking app renders the same accessible input field in dozens of forms, and screen-reader audits kept finding labels pointing at the wrong input because ids were hand-written.",
        example: "Create a useField(label) Hook that calls useId for the input, hint and error ids and returns ready-made props for the label, input, hint and error elements.",
        usage: "Every field is correctly wired for assistive technology, ids never collide even with several forms on one page, and server-rendered HTML matches the client.",
      },
      code: `import { useDebugValue, useId, useState } from 'react';

function useFormField(label) {
  const id = useId();
  const [value, setValue] = useState('');
  useDebugValue(label + (value ? ': filled' : ': empty'));

  return {
    labelProps: { htmlFor: id, children: label },
    inputProps: {
      id,
      value,
      'aria-describedby': id + '-hint',
      onChange: e => setValue(e.target.value),
    },
    hintId: id + '-hint',
  };
}

export default function SignupForm() {
  const email = useFormField('Email');
  const password = useFormField('Password'); // own state and id

  return (
    <form>
      <label {...email.labelProps} />
      <input type="email" {...email.inputProps} />
      <p id={email.hintId}>We never share your email.</p>
      <label {...password.labelProps} />
      <input type="password" {...password.inputProps} />
      <p id={password.hintId}>At least 12 characters.</p>
    </form>
  );
}`,
      apiReference: [
        {
          name: "useId",
          kind: "hook",
          signature: "const id = useId()",
          params: [],
          returns: "A unique id string for this call in this component, stable across re-renders and matching the server HTML.",
          notes: "Takes no parameters. Do not use it for list keys. Set identifierPrefix on createRoot or hydrateRoot when several React roots share a page.",
        },
        {
          name: "useDebugValue",
          kind: "hook",
          signature: "useDebugValue(value, format?)",
          params: [
            { name: "value", type: "any", description: "The value to display next to your custom Hook in React DevTools." },
            { name: "format", type: "(value) => any", description: "Optional formatter, called only when the Hook is actually inspected." },
          ],
          returns: "undefined.",
          notes: "Only meaningful inside custom Hooks, and most useful for Hooks published in shared libraries.",
        },
      ],
      exercise: points(
        "Extract a useToggle(initial) Hook and use it in two components",
        "Build an accessible checkbox with a label and hint wired together through useId",
        "Add useDebugValue to your Hook and inspect it in React DevTools",
      ),
      checkpoint: points(
        "Do two components that call the same custom Hook share state?",
        "Why is useId better than a global counter for generating ids?",
        "Why should useId never be used for list keys?",
      ),
      mistake: points(
        "Do not name a helper that calls Hooks without the use prefix",
        "Do not generate ids with Math.random; the server and client values will not match",
        "Do not expect a custom Hook to share state between components; lift the state or use context",
      ),
      vocabulary: [
        { word: "collision", meaning: "A clash where two things accidentally end up with the same identifier.", example: "useId prevents id collisions when a form appears twice on a page.", synonyms: ["clash", "conflict", "duplicate id", "name clash", "overlap"], antonyms: ["uniqueness", "separation", "distinct value", "namespaced", "unique key"] },
        { word: "accessibility", meaning: "The practice of making software usable by people with disabilities, including screen-reader users.", example: "Linking the label to the input through an id is basic accessibility.", synonyms: ["a11y", "inclusivity", "usable by everyone", "assistive support", "inclusive design"], antonyms: ["inaccessibility", "exclusion", "barrier", "mouse-only design", "screen-reader hostile"] },
        { word: "abstraction", meaning: "A simplified interface that hides complicated details underneath.", example: "useFormField is an abstraction over ids, state and aria wiring.", synonyms: ["generalisation", "encapsulation", "simplified model", "layer", "interface"], antonyms: ["specific detail", "implementation", "raw mechanics", "concrete case", "low-level detail"] },
        { word: "extract", meaning: "To take a part out of a larger whole so it can be used separately.", example: "Extract the repeated logic into a custom Hook.", synonyms: ["pull out", "separate", "factor out", "lift into a function", "isolate"], antonyms: ["inline", "embed", "inline again", "duplicate in place", "keep coupled"] },
        { word: "idiomatic", meaning: "Written in the natural, conventional style of a particular language or library.", example: "Returning an object of props from a Hook is idiomatic React.", synonyms: ["conventional", "natural", "the expected way", "community standard", "canonical style"], antonyms: ["unidiomatic", "awkward", "hand-rolled", "surprising", "against the grain"] },
        { word: "prefix", meaning: "A fixed piece of text placed at the start of a word or identifier.", example: "The use prefix tells the linter a function is a Hook.", synonyms: ["leading tag", "preface", "namespace", "leading marker", "front label"], antonyms: ["suffix", "ending", "trailing marker", "postfix", "bare name"] },
      ],
    },
    {
      title: "Server Components and Server Functions",
      diagram: {
        kind: "split",
        caption: "In a React Server Components framework such as Next.js, components are server-first. 'use client' marks where interactivity begins, and 'use server' exposes async functions that the client can call.",
        headings: ["Server Component (default)", "Client Component ('use client')"],
        items: [
          { label: "Runs ahead of time or per request", detail: "On the server, before bundling", group: 0 },
          { label: "Can be async", detail: "await a database query directly", group: 0 },
          { label: "Sends no JavaScript", detail: "Its code never reaches the browser", group: 0 },
          { label: "Hydrates in the browser", detail: "Can use state, Effects and event handlers", group: 1 },
          { label: "Marked by 'use client'", detail: "The directive sits at the top of the file", group: 1 },
          { label: "Receives serialisable props", detail: "Plus Server Functions it can call", group: 1 },
        ],
      },
      explanation: points(
        "Server Components render in a separate environment before bundling, at build time or per request",
        "They can be async and read data directly, and their code is never sent to the browser",
        "'use client' at the top of a file marks it, and everything it imports, as Client Components",
        "'use server' marks async functions as Server Functions that Client Components can call over the network",
        "Props passed from server to client components must be serialisable: no class instances or plain functions",
        "These features need a framework or bundler that supports React Server Components, such as Next.js",
      ),
      keyPoints: [
        { tone: "key", text: "Components are Server Components by default in an RSC app; 'use client' opts a subtree into the browser." },
        { tone: "key", text: "Server Functions ('use server') are callable from the client and always run on the server." },
        { tone: "tip", text: "Pass Server Components as children to Client Components to keep them rendering on the server." },
        { tone: "tip", text: "Use a Server Function as a form action to get progressive enhancement for free." },
        { tone: "warning", text: "Treat every Server Function as a public endpoint: validate and authorise every input." },
        { tone: "warning", text: "Keep react and react-dom patched; RSC security fixes shipped in December 2025." },
      ],
      example: points(
        "NotesPage is an async Server Component that queries the database directly",
        "saveNote is a Server Function that authorises the user before writing",
        "NoteEditor is a Client Component that receives saveNote as its form action",
        "Save reads the form's pending state with useFormStatus",
      ),
      useCase: {
        scenario: "A documentation site renders thousands of Markdown pages with a heavy syntax highlighter, but only the search box and the copy-code buttons need to be interactive.",
        example: "Render and highlight the Markdown in Server Components, mark only SearchBox and CopyButton with 'use client', and save feedback votes through a 'use server' function.",
        usage: "The highlighter and Markdown parser never ship to the browser, pages arrive as ready HTML, and the JavaScript bundle holds only the two small interactive pieces.",
      },
      code: `// app/notes/page.js (Server Component)
import { NoteEditor } from './note-editor';
import { saveNote } from './actions';

export default async function NotesPage() {
  const notes = await db.notes.findAll(); // on the server
  return (
    <main>
      {notes.map(n => <article key={n.id}>{n.body}</article>)}
      <NoteEditor saveNote={saveNote} />
    </main>
  );
}

// app/notes/actions.js (Server Functions)
'use server';
export async function saveNote(formData) {
  const user = await requireUser(); // always authorise
  await db.notes.create({
    body: String(formData.get('body')),
    userId: user.id,
  });
}

// app/notes/note-editor.js (Client Component)
'use client';
import { useFormStatus } from 'react-dom';

export function NoteEditor({ saveNote }) {
  return (
    <form action={saveNote}>
      <textarea name="body" />
      <Save />
    </form>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Save</button>;
}`,
      apiReference: [
        {
          name: "'use client'",
          kind: "directive",
          signature: "'use client';\n// the first statement in the file, before imports",
          params: [
            { name: "placement", type: "file top", description: "Marks the module, and everything it imports, as client code." },
          ],
          returns: "Nothing. It defines the boundary between the server and client module graphs.",
          notes: "Props crossing the boundary must be serialisable. Server Components passed in as children are still rendered on the server.",
        },
        {
          name: "'use server'",
          kind: "directive",
          signature: "'use server';\nexport async function action(formData) {\n  // runs on the server\n}",
          params: [
            { name: "placement", type: "file top or function body", description: "Marks every export of the file, or one async function, as a Server Function." },
          ],
          returns: "The function's serialisable return value, delivered to the client that called it.",
          notes: "Arguments arrive from the client and must be treated as untrusted. React 19.3 also transports Error.cause and AggregateError.errors to the client.",
        },
        {
          name: "cache and cacheSignal",
          kind: "function (react, RSC)",
          signature: "import { cache, cacheSignal } from 'react'\n\nconst getUser = cache(async id => db.user(id))\nfetch(url, { signal: cacheSignal() })",
          params: [
            { name: "fn", type: "(...args) => T", description: "The function to memoise for the duration of one server request." },
          ],
          returns: "cache returns a memoised fn; cacheSignal returns an AbortSignal that fires when the cache lifetime ends.",
          notes: "Server Components only. cacheSignal, added in React 19.2, fires when rendering completes, is aborted or fails, so pending work can be cancelled.",
        },
      ],
      exercise: points(
        "In a Next.js app, fetch a list in an async Server Component and render it",
        "Add a Client Component with a button that calls a Server Function",
        "Try passing a function prop from a Server Component to a Client Component and read the error",
      ),
      checkpoint: points(
        "Where must the 'use client' directive appear, and what does it affect?",
        "Why must every Server Function authorise its caller?",
        "What kinds of values can be passed as props from a Server Component to a Client Component?",
      ),
      mistake: points(
        "Do not use useState or useEffect in a Server Component",
        "Do not put 'use client' at the top of a whole layout just to fix one button",
        "Do not trust any argument a Server Function receives without validating it",
      ),
      vocabulary: [
        { word: "directive", meaning: "A special string at the top of a file or function that instructs the tooling how to treat the code.", example: "The 'use client' directive tells the bundler to ship this module to the browser.", synonyms: ["instruction", "pragma", "marker string", "build hint", "compiler instruction"], antonyms: ["suggestion", "comment", "plain code", "documentation", "inert comment"] },
        { word: "bundle", meaning: "The compiled JavaScript file a browser downloads to run part of an app.", example: "Server Components keep the Markdown parser out of the client bundle.", synonyms: ["build output", "chunk", "compiled output", "asset", "package"], antonyms: ["source file", "module", "raw source", "untranspiled file", "individual module"] },
        { word: "hydration", meaning: "React attaching event handlers and state to server-rendered HTML to make it interactive.", example: "Only Client Components take part in hydration.", synonyms: ["activation", "wiring up", "attaching behaviour", "client takeover", "interactivity setup"], antonyms: ["dehydration", "static render", "server-only render", "inert markup", "plain HTML"] },
        { word: "colocate", meaning: "To place related pieces of code next to each other.", example: "Server Components let you colocate the data query with the markup that uses it.", synonyms: ["group", "keep together", "place beside", "keep with its code", "co-file"], antonyms: ["separate", "scatter", "centralise elsewhere", "split into a folder", "distant file"] },
        { word: "credential", meaning: "A secret such as a password, token or API key that proves identity or grants access.", example: "Database credentials stay on the server because the query runs in a Server Component.", synonyms: ["secret", "key", "token", "password", "access secret"], antonyms: ["public data", "open value", "public identifier", "published config", "non-secret"] },
        { word: "untrusted", meaning: "Coming from a source that cannot be relied on and must therefore be checked.", example: "Every argument to a Server Function is untrusted input.", synonyms: ["unverified", "suspect", "user-supplied", "external", "unvalidated"], antonyms: ["trusted", "verified", "first-party", "validated", "known-safe"] },
      ],
    },
    {
      title: "Metadata, stylesheets and resource preloading",
      diagram: {
        kind: "tree",
        caption: "React 19 hoists metadata tags rendered anywhere in the tree into the document head, orders stylesheets by precedence, and deduplicates async scripts and preload hints.",
        items: [
          { label: "<head>", detail: "React manages what ends up here" },
          { label: "<title>Post title</title>", detail: "hoisted from BlogPost", depth: 1 },
          { label: "<meta name=\"description\">", detail: "hoisted from BlogPost", depth: 1 },
          { label: "<link rel=\"stylesheet\" precedence=\"default\">", detail: "ordered and deduplicated", depth: 1 },
          { label: "<link rel=\"preload\" as=\"font\">", detail: "added by preload()", depth: 1 },
          { label: "<body>" },
          { label: "<BlogPost>", detail: "renders <title>, <meta> and <link> inline", depth: 1 },
          { label: "<script async src=\"share.js\">", detail: "loaded once even if rendered twice", depth: 2 },
        ],
      },
      explanation: points(
        "In React 19 you can render <title>, <meta> and <link> inside any component, and React hoists them into <head>",
        "Stylesheets rendered with a precedence prop are inserted in order and deduplicated",
        "React waits for those stylesheets to load before revealing content that depends on them",
        "<script async> can be rendered wherever it is needed and is only loaded once",
        "react-dom exports preload, preinit, preconnect and prefetchDNS to tell the browser about resources early",
        "During server rendering these hints are emitted early in the HTML; on the client they apply immediately",
      ),
      keyPoints: [
        { tone: "key", text: "Render <title> and <meta> next to the content they describe; React moves them into <head>." },
        { tone: "key", text: "<link rel=\"stylesheet\" precedence=\"...\"> is ordered, deduplicated and loaded before dependent content." },
        { tone: "tip", text: "Call preload for a font or hero image you know the page will need." },
        { tone: "tip", text: "preconnect to an API origin early so the TLS handshake is done before the first request." },
        { tone: "warning", text: "Render only one <title> at a time; if several are rendered, React places all of them in <head>." },
        { tone: "warning", text: "Where a framework has its own metadata API, such as Next.js metadata, prefer that API." },
      ],
      example: points(
        "BlogPost renders its own title, description and canonical link",
        "The post stylesheet is rendered with precedence default and loaded before the post shows",
        "preload warms the font and preconnect warms the API origin",
        "The share widget's async script is rendered inline and deduplicated",
      ),
      useCase: {
        scenario: "A single-page news app changes articles without a full reload, so browser tabs and shared links kept showing the home page's title and description.",
        example: "Render <title>{article.headline}</title> and <meta name=\"description\" content={article.summary} /> inside the Article component, and preload each article's hero image.",
        usage: "Tabs, bookmarks and link previews show the current article, with no third-party head manager, and the hero image starts downloading before the component even mounts it.",
      },
      code: `import { preconnect, preinit, preload, prefetchDNS } from 'react-dom';

export default function BlogPost({ post }) {
  preload('/fonts/inter.woff2', { as: 'font' });
  preconnect('https://api.example.com');
  prefetchDNS('https://images.example.com');
  preinit('https://maps.example.com/sdk.js', { as: 'script' });

  return (
    <article>
      <title>{post.title + ' | My Blog'}</title>
      <meta name="description" content={post.summary} />
      <link rel="canonical" href={post.url} />
      <link rel="stylesheet" href="/post.css" precedence="default" />

      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <script async src="https://widgets.example.com/share.js" />
    </article>
  );
}`,
      apiReference: [
        {
          name: "<title>, <meta>, <link>",
          kind: "built-in components",
          signature: "<title>{text}</title>\n<meta name=\"...\" content=\"...\" />\n<link rel=\"stylesheet\" href=\"...\" precedence=\"...\" />",
          params: [
            { name: "precedence", type: "string", description: "Opts a stylesheet into React's ordering, deduplication and Suspense-aware loading." },
            { name: "title children", type: "string", description: "<title> must contain a single string, so combine values into one expression." },
          ],
          returns: "The tags, placed in the document head wherever they were rendered.",
          notes: "A <meta itemProp> tag is not hoisted; it stays where it is rendered.",
        },
        {
          name: "preload",
          kind: "function (react-dom)",
          signature: "preload(href, options)\n// options: { as, crossOrigin?, type?,\n//   fetchPriority?, imageSrcSet?, imageSizes? }",
          params: [
            { name: "href", type: "string", description: "The URL of the resource to download." },
            { name: "options.as", type: "'font' | 'image' | 'script' | 'style' | ...", description: "Required. The kind of resource being fetched." },
          ],
          returns: "Nothing.",
          notes: "Downloads without executing. Repeated calls with the same href are deduplicated. Use preloadModule for ES modules.",
        },
        {
          name: "preinit",
          kind: "function (react-dom)",
          signature: "preinit(href, options)\n// options: { as: 'script' | 'style', precedence?, crossOrigin?, fetchPriority? }",
          params: [
            { name: "href", type: "string", description: "The URL of the script or stylesheet." },
            { name: "options.as", type: "'script' | 'style'", description: "Required. Whether to execute a script or insert a stylesheet." },
            { name: "options.precedence", type: "string", description: "Stylesheets only: where to insert it relative to other stylesheets." },
          ],
          returns: "Nothing.",
          notes: "Fetches and evaluates a script, or fetches and inserts a stylesheet, eagerly. Use preinitModule for ES modules.",
        },
        {
          name: "preconnect and prefetchDNS",
          kind: "function (react-dom)",
          signature: "preconnect(href, { crossOrigin? })\nprefetchDNS(href)",
          params: [
            { name: "href", type: "string", description: "The origin of a server you expect to contact soon." },
          ],
          returns: "Nothing.",
          notes: "preconnect opens a full connection (DNS, TCP and TLS). prefetchDNS only resolves the IP address, which is cheaper.",
        },
      ],
      exercise: points(
        "Render a <title> inside a component and watch the browser tab change on navigation",
        "Render the same stylesheet with precedence from two components and confirm it loads once",
        "Add preconnect for your API origin and compare request timing in the Network panel",
      ),
      checkpoint: points(
        "What does React do with a <title> rendered deep inside the tree?",
        "What does the precedence prop add to a stylesheet link?",
        "What is the difference between preload and preinit?",
      ),
      mistake: points(
        "Do not render several competing <title> tags at once",
        "Do not preload everything; each hint competes for bandwidth",
        "Do not mix React 19 metadata tags with a framework metadata API for the same page",
      ),
      vocabulary: [
        { word: "hoist", meaning: "To lift something from where it is written to a higher place where it takes effect.", example: "React hoists the <title> from the article into the document head.", synonyms: ["lift", "raise", "move to the top", "promote", "float up"], antonyms: ["lower", "sink", "keep in place", "nest deeper", "push down"] },
        { word: "deduplicate", meaning: "To remove repeated copies so only one remains.", example: "React deduplicates the stylesheet even though three components render it.", synonyms: ["merge", "collapse", "collapse duplicates", "unify", "fold"], antonyms: ["duplicate", "replicate", "repeat", "emit each time", "repeat output", "multiple copies"] },
        { word: "preload", meaning: "To fetch a resource early, before it is actually needed.", example: "Preloading the font removes the flash of unstyled text.", synonyms: ["prefetch", "warm up", "fetch early", "warm the cache", "start ahead"], antonyms: ["lazy-load", "defer", "fetch when needed", "load lazily", "load on demand", "fetch at use"] },
        { word: "handshake", meaning: "The initial exchange that establishes a network connection before data flows.", example: "preconnect completes the TLS handshake ahead of the first API call.", synonyms: ["negotiation", "greeting", "connection setup", "agreement step", "connection agreement", "session start"], antonyms: ["disconnection", "teardown", "abrupt close", "reset", "dropped connection", "abrupt disconnect"] },
        { word: "render-blocking", meaning: "Preventing the page from being displayed until the resource has loaded.", example: "Stylesheets are render-blocking, so React waits for them before revealing content.", synonyms: ["blocking", "gating", "paint-delaying", "critical path", "must-load-first"], antonyms: ["non-blocking", "async", "deferred", "async-loaded", "non-critical"] },
        { word: "eager", meaning: "Done as early as possible rather than waiting until needed.", example: "preinit eagerly loads and runs the maps SDK.", synonyms: ["early", "proactive", "upfront", "immediate", "load-on-start"], antonyms: ["lazy", "deferred", "on-demand", "load-when-visible", "on-demand loading", "late binding"] },
      ],
    },
    {
      title: "Hiding UI with Activity",
      diagram: {
        kind: "split",
        caption: "Activity, added in React 19.2, hides part of the UI without unmounting it. Hidden content keeps its state and DOM, stops its Effects, and can even pre-render in the background.",
        headings: ["mode=\"visible\"", "mode=\"hidden\""],
        items: [
          { label: "Children are shown", detail: "Rendered normally in the DOM", group: 0 },
          { label: "Effects are mounted", detail: "Subscriptions and timers are active", group: 0 },
          { label: "Normal update priority", detail: "Responds like any other UI", group: 0 },
          { label: "Hidden with display: none", detail: "The DOM is kept, not destroyed", group: 1 },
          { label: "Effects are cleaned up", detail: "Re-created when shown again", group: 1 },
          { label: "State is preserved", detail: "Updates are deferred until React is idle", group: 1 },
        ],
      },
      explanation: points(
        "<Activity mode=\"visible\"> or <Activity mode=\"hidden\"> wraps a part of the tree you want to show and hide",
        "Unlike conditional rendering, hiding does not unmount: state and DOM are preserved",
        "While hidden, children get display: none and their Effects are cleaned up",
        "Hidden children still re-render for new props, but at a lower priority than visible content",
        "Showing it again restores the previous state and re-creates the Effects",
        "Use it to keep tab state alive, or to pre-render a screen the user is likely to open next",
      ),
      keyPoints: [
        { tone: "key", text: "Activity preserves state and DOM while hidden; conditional rendering with && destroys them." },
        { tone: "key", text: "Hidden means display: none, Effects cleaned up, and updates deferred until React is idle." },
        { tone: "tip", text: "Pre-render a likely next screen inside a hidden Activity so it appears instantly." },
        { tone: "tip", text: "Keep form drafts and scroll positions alive across tab switches by wrapping each tab." },
        { tone: "warning", text: "Effects in hidden content stop; do not rely on them to keep a video playing or a socket open." },
        { tone: "warning", text: "A hidden Activity whose child renders only text outputs nothing, as there is no element to hide." },
      ],
      example: points(
        "Workspace wraps Editor and Preview in their own Activity boundaries",
        "Switching to Preview hides the Editor but keeps the draft text",
        "Preview pre-renders in the background while the Editor is visible",
        "Before React 19.2, tab === 'editor' && <Editor /> threw the draft away",
      ),
      useCase: {
        scenario: "An email client has Inbox, Drafts and Settings tabs. Users lost half-written replies and scroll positions whenever they glanced at another tab.",
        example: "Render all three tabs, each inside <Activity mode={tab === name ? 'visible' : 'hidden'}>, instead of rendering only the selected tab.",
        usage: "Switching tabs is instant and lossless: drafts, scroll positions and expanded threads survive, while hidden tabs pause their polling Effects to save work.",
      },
      code: `import { Activity, useState } from 'react';

export default function Workspace() {
  const [tab, setTab] = useState('editor');

  return (
    <>
      <nav>
        <button onClick={() => setTab('editor')}>Editor</button>
        <button onClick={() => setTab('preview')}>Preview</button>
      </nav>

      {/* Both stay mounted; only one is visible */}
      <Activity mode={tab === 'editor' ? 'visible' : 'hidden'}>
        <Editor />
      </Activity>
      <Activity mode={tab === 'preview' ? 'visible' : 'hidden'}>
        <Preview />
      </Activity>
    </>
  );
}

// Before React 19.2, switching tabs unmounted the editor:
// {tab === 'editor' && <Editor />}`,
      apiReference: [
        {
          name: "Activity",
          kind: "component (react)",
          signature: "<Activity mode={'visible' | 'hidden'}>\n  {children}\n</Activity>",
          params: [
            { name: "children", type: "ReactNode", description: "The UI you intend to show and hide." },
            { name: "mode", type: "'visible' | 'hidden'", description: "Defaults to 'visible'. Hidden applies display: none, destroys Effects and defers updates." },
          ],
          returns: "The children, either visible or hidden, with their state preserved.",
          notes: "Added in React 19.2. When revealed, children come back with their previous state and their Effects re-created. React 19.3 supports Activity in Server Components too.",
        },
      ],
      exercise: points(
        "Build two tabs with a text input each and switch between them with conditional rendering",
        "Wrap each tab in Activity and confirm the typed text now survives",
        "Log from an Effect inside a tab and watch it clean up when the tab is hidden",
      ),
      checkpoint: points(
        "What happens to state, DOM and Effects inside a hidden Activity?",
        "How is Activity different from rendering {isOpen && <Panel />}?",
        "Why is Activity useful for pre-rendering the next screen?",
      ),
      mistake: points(
        "Do not rely on Effects to keep running inside hidden content",
        "Do not wrap huge rarely visited screens in Activity; hidden trees still use memory",
        "Do not expect a hidden text-only child to keep hidden text in the DOM",
      ),
      vocabulary: [
        { word: "dormant", meaning: "Temporarily inactive but able to become active again.", example: "A hidden tab lies dormant, with its Effects stopped but its state intact.", synonyms: ["inactive", "idle", "hidden but alive", "paused", "suspended"], antonyms: ["active", "awake", "running", "visible", "mounted and active"] },
        { word: "pre-render", meaning: "To render UI ahead of time, before the user asks to see it.", example: "The preview tab pre-renders in a hidden Activity so it opens instantly.", synonyms: ["prepare", "warm up", "render offscreen", "build ahead", "warm"], antonyms: ["render on demand", "lazy-render", "render when shown", "cold start", "defer"] },
        { word: "restore", meaning: "To bring something back to a former condition.", example: "Showing the tab restores its scroll position and draft text.", synonyms: ["reinstate", "recover", "bring back", "revive state", "reapply saved state", "bring back state"], antonyms: ["discard", "reset", "lose state", "start fresh", "clear everything", "fresh mount"] },
        { word: "prioritise", meaning: "To decide the order in which tasks are handled by importance.", example: "React prioritises visible updates over hidden ones.", synonyms: ["rank", "order", "put first", "rank higher", "schedule sooner"], antonyms: ["neglect", "deprioritise", "defer", "treat equally", "treat as background", "push to the back"] },
        { word: "conceal", meaning: "To hide something from view.", example: "Activity conceals the tab with display: none rather than deleting it.", synonyms: ["hide", "mask", "keep out of view", "obscure", "cover"], antonyms: ["reveal", "expose", "display", "surface", "unhide"] },
        { word: "reveal", meaning: "To make something visible that was hidden.", example: "Revealing the tab re-creates its Effects.", synonyms: ["show", "unveil", "bring into view", "disclose", "surface"], antonyms: ["conceal", "hide", "collapse", "obscure", "keep hidden", "suppress display"] },
      ],
    },
    {
      title: "View Transitions and Fragment refs",
      diagram: {
        kind: "flow",
        caption: "React 19.3 made <ViewTransition> stable. When an update runs as a Transition, React snapshots the old and new DOM and lets the browser animate between them using the View Transition API.",
        items: [
          { label: "startTransition(() => { ... })", detail: "Optionally addTransitionType('next')" },
          { label: "React snapshots the old view", detail: "Only <ViewTransition> boundaries take part" },
          { label: "State updates and the DOM changes", detail: "The new view is rendered" },
          { label: "Browser animates old to new", detail: "enter, exit, update or share animations" },
          { label: "Animation finishes", detail: "Plain setState without a transition never animates" },
        ],
      },
      explanation: points(
        "<ViewTransition> animates its children when they enter, exit, update or move as part of a Transition",
        "Only updates from startTransition, a Suspense reveal or useDeferredValue activate it; plain setState does not",
        "Props enter, exit, update, share and default choose 'auto', 'none' or your own CSS class",
        "addTransitionType('next') inside startTransition lets one boundary run different animations per cause",
        "Fragment refs, also stable in React 19.3, give a <Fragment ref> a FragmentInstance for its DOM children",
        "A FragmentInstance can add event listeners, focus, observe and measure a group without a wrapper div",
      ),
      keyPoints: [
        { tone: "key", text: "<ViewTransition> only animates updates marked as Transitions, not ordinary setState calls." },
        { tone: "key", text: "A named <ViewTransition name=\"...\"> removed in one place and added in another runs a shared-element animation." },
        { tone: "tip", text: "Use addTransitionType to slide forward on 'next' and backward on 'previous' with one component." },
        { tone: "tip", text: "Use <Fragment ref> to observe or focus a list of siblings without adding a wrapper element." },
        { tone: "warning", text: "Respect prefers-reduced-motion in your transition CSS; not everyone wants animation." },
        { tone: "warning", text: "Two mounted <ViewTransition> boundaries with the same name throw an error." },
      ],
      example: points(
        "Slides wraps the current slide in a ViewTransition with enter and exit classes",
        "nextSlide calls addTransitionType('next') and updates the index inside startTransition",
        "Moving backwards uses the 'previous' classes, so the slide enters from the other side",
        "InView attaches an IntersectionObserver to a fragment's children with observeUsing",
      ),
      useCase: {
        scenario: "A photo gallery opens a large detail view when a thumbnail is clicked, and the jump between the grid and the detail view felt abrupt and disorienting.",
        example: "Give the thumbnail and the large image the same <ViewTransition name={'photo-' + id}>, and open the detail view inside startTransition.",
        usage: "The browser morphs the thumbnail into the large image, so users keep track of where they are. With reduced motion enabled, the CSS simply switches views instantly.",
      },
      code: `import {
  Fragment, ViewTransition, addTransitionType,
  startTransition, useLayoutEffect, useRef, useState,
} from 'react';

export function Slides({ slides }) {
  const [index, setIndex] = useState(0);

  function go(type, step) {
    startTransition(() => {
      addTransitionType(type);
      setIndex(i => i + step);
    });
  }

  return (
    <>
      <ViewTransition
        key={index}
        enter={{ next: 'from-right', previous: 'from-left' }}
        exit={{ next: 'to-left', previous: 'to-right' }}
      >
        <Slide data={slides[index]} />
      </ViewTransition>
      <button onClick={() => go('previous', -1)}>Back</button>
      <button onClick={() => go('next', 1)}>Next</button>
    </>
  );
}

// Fragment ref: observe siblings without a wrapper div
export function InView({ onChange, children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const fragment = ref.current;
    const observer = new IntersectionObserver(onChange);
    fragment.observeUsing(observer);
    return () => fragment.unobserveUsing(observer);
  }, [onChange]);
  return <Fragment ref={ref}>{children}</Fragment>;
}`,
      apiReference: [
        {
          name: "ViewTransition",
          kind: "component (react, 19.3)",
          signature: "<ViewTransition name? enter? exit? update? share? default?\n  onEnter? onExit? onUpdate? onShare?>\n  {children}\n</ViewTransition>",
          params: [
            { name: "name", type: "string", description: "Only for shared-element transitions. Without it React generates a unique name." },
            { name: "enter / exit", type: "'auto' | 'none' | string | object", description: "Animation class when the boundary is added or removed; an object maps transition types to classes." },
            { name: "update / share", type: "'auto' | 'none' | string | object", description: "Class for changes inside the boundary, or for a named boundary moving between places." },
            { name: "default", type: "'auto' | 'none' | string | object", description: "Class for any animation type not set explicitly. 'none' disables the others unless listed." },
            { name: "onEnter etc.", type: "(instance, types) => () => void", description: "Run custom JavaScript animations; each callback must return a cleanup that cancels them." },
          ],
          returns: "The children, animated between states by the browser's View Transition API.",
          notes: "DOM only for now. Must come before any DOM node to animate enter and exit. Only Transitions, Suspense reveals and useDeferredValue updates activate it.",
        },
        {
          name: "addTransitionType",
          kind: "function (react, 19.3)",
          signature: "startTransition(() => {\n  addTransitionType(type)\n  setState(...)\n})",
          params: [
            { name: "type", type: "string", description: "A label for the cause of this Transition, matched by object-valued ViewTransition props." },
          ],
          returns: "Nothing.",
          notes: "Call it inside startTransition. Several types can be added to one Transition.",
        },
        {
          name: "Fragment ref",
          kind: "component prop (react, 19.3)",
          signature: "<Fragment ref={ref}>{children}</Fragment>\n// ref.current is a FragmentInstance",
          params: [
            { name: "ref", type: "Ref<FragmentInstance>", description: "A ref object or callback. Needs the explicit <Fragment> syntax, not <>...</>." },
            { name: "events", type: "method", description: "addEventListener, removeEventListener and dispatchEvent on the first-level DOM children." },
            { name: "focus", type: "method", description: "focus(), focusLast() and blur() search nested children depth-first." },
            { name: "observe / measure", type: "method", description: "observeUsing, unobserveUsing, getClientRects, getRootNode, compareDocumentPosition, scrollIntoView." },
          ],
          returns: "Nothing; React sets ref.current to the FragmentInstance.",
          notes: "Child-targeting methods act on first-level host children only. observeUsing does not work on text nodes.",
        },
      ],
      exercise: points(
        "Animate a list item's removal with <ViewTransition exit=\"auto\"> and startTransition",
        "Add next and previous transition types to a carousel and animate each direction differently",
        "Replace a wrapper div around a list with <Fragment ref> and focus its first item",
      ),
      checkpoint: points(
        "Why does a plain setState call not trigger a view transition?",
        "What is a shared-element transition, and which prop enables it?",
        "Which DOM nodes do a FragmentInstance's event listeners attach to?",
      ),
      mistake: points(
        "Do not expect animations from updates outside startTransition",
        "Do not mount two ViewTransitions with the same name at the same time",
        "Do not use the <>...</> shorthand when you need a key or a ref on a Fragment",
      ),
      vocabulary: [
        { word: "morph", meaning: "To change smoothly from one shape or form into another.", example: "The thumbnail morphs into the full-size photo.", synonyms: ["transform", "metamorphose", "tween", "animate between", "blend"], antonyms: ["jump", "cut", "instant swap", "hard cut", "snap"] },
        { word: "disorienting", meaning: "Causing someone to lose their sense of position or direction.", example: "An instant cut to a different layout can be disorienting.", synonyms: ["confusing", "jarring", "hard to follow", "abrupt", "unsettling"], antonyms: ["orienting", "reassuring", "smooth", "predictable", "easy to track"] },
        { word: "choreograph", meaning: "To plan and arrange a sequence of movements.", example: "Transition types let you choreograph forward and backward slides.", synonyms: ["arrange", "stage", "sequence motion", "time the steps", "direct"], antonyms: ["improvise", "randomise", "let it happen", "unordered motion", "random timing"] },
        { word: "continuity", meaning: "The unbroken and consistent existence of something over time.", example: "Shared-element animations give the user visual continuity between screens.", synonyms: ["flow", "coherence", "unbroken flow", "visual thread", "smoothness"], antonyms: ["discontinuity", "break", "jump cut", "abrupt change", "lost context"] },
        { word: "sibling", meaning: "An element that shares the same parent as another element.", example: "A Fragment ref lets you observe a group of siblings as one unit.", synonyms: ["peer", "neighbour", "same-level node", "adjacent element", "co-child"], antonyms: ["parent", "child", "container", "nested child", "ancestor"] },
        { word: "unobtrusive", meaning: "Not attracting unwanted attention; blending in quietly.", example: "Keep transitions short and unobtrusive so they guide rather than distract.", synonyms: ["subtle", "discreet", "quiet", "low-key", "out of the way"], antonyms: ["intrusive", "showy", "attention-grabbing", "distracting", "loud"] },
      ],
    },
    {
      title: "Rules of Hooks and the complete Hooks cheat sheet",
      diagram: {
        kind: "tree",
        caption: "Every built-in Hook in React 19, grouped by purpose. All of them follow the same two rules: call them at the top level, and call them only from components or custom Hooks.",
        items: [
          { label: "Built-in React Hooks" },
          { label: "State", detail: "useState, useReducer", depth: 1 },
          { label: "Context", detail: "useContext (plus the use API)", depth: 1 },
          { label: "Refs", detail: "useRef, useImperativeHandle", depth: 1 },
          { label: "Effects", detail: "useEffect, useLayoutEffect, useInsertionEffect, useEffectEvent", depth: 1 },
          { label: "Performance", detail: "useMemo, useCallback, useTransition, useDeferredValue", depth: 1 },
          { label: "Actions and forms", detail: "useActionState, useOptimistic, useFormStatus (react-dom)", depth: 1 },
          { label: "Other", detail: "useId, useSyncExternalStore, useDebugValue", depth: 1 },
        ],
      },
      explanation: points(
        "Hooks are functions whose names start with use and that let components use React features",
        "Rule one: call Hooks only at the top level, never inside conditions, loops, nested functions or try/catch",
        "Rule two: call Hooks only from function components or custom Hooks, never from regular functions",
        "React relies on the call order to match each Hook call with its stored state between renders",
        "eslint-plugin-react-hooks enforces the rules; version 6 ships a flat config in its recommended preset",
        "StrictMode double-invokes components and Effects in development to surface impure code early",
      ),
      keyPoints: [
        { tone: "key", text: "Call Hooks at the top level, in the same order on every render." },
        { tone: "key", text: "Call Hooks only from function components and custom Hooks." },
        { tone: "tip", text: "Need a Hook conditionally? Extract a child component and render that component conditionally." },
        { tone: "tip", text: "The use API is the exception: it may be called inside if statements and loops." },
        { tone: "tip", text: "Wrap the app in <StrictMode> during development to catch impure renders and missing cleanups." },
        { tone: "warning", text: "An early return placed before a Hook call changes the call order and breaks state." },
        { tone: "warning", text: "Do not call Hooks inside event handlers, or inside useMemo, useReducer or useEffect callbacks." },
      ],
      example: points(
        "useState at the top of the component is correct",
        "useState inside if (isLoggedIn) is wrong, because the call order can change",
        "An early return before useEffect is wrong for the same reason",
        "Moving the conditional part into a <LoggedInPanel /> child fixes all three problems",
      ),
      useCase: {
        scenario: "A team saw a production bug where a form showed the wrong field values after users logged out and back in, and nobody could reproduce it locally.",
        example: "The linter flagged a useState call placed after an early return for logged-out users. Moving every Hook above the return, and the logged-in UI into its own component, fixed it.",
        usage: "The team now runs eslint-plugin-react-hooks in CI and renders the app inside StrictMode in development, so rule violations fail the build instead of reaching users.",
      },
      code: `// Every built-in Hook in React 19 at a glance
const [state, setState] = useState(initialState);
const [state, dispatch] = useReducer(reducer, initialArg, init?);
const value = useContext(SomeContext);
const ref = useRef(initialValue);
useImperativeHandle(ref, createHandle, deps?);
useEffect(setup, deps?);
useLayoutEffect(setup, deps?);
useInsertionEffect(setup, deps?);
const onEvent = useEffectEvent(callback);
const cachedValue = useMemo(calculateValue, deps);
const cachedFn = useCallback(fn, deps);
const [isPending, startTransition] = useTransition();
const deferred = useDeferredValue(value, initialValue?);
const id = useId();
useDebugValue(value, format?);
const snapshot = useSyncExternalStore(
  subscribe, getSnapshot, getServerSnapshot?);
const [state, dispatchAction, isPending] =
  useActionState(reducerAction, initialState, permalink?);
const [optimistic, setOptimistic] = useOptimistic(value, reducer?);
const { pending, data, method, action } = useFormStatus();
const resolved = use(promiseOrContext); // an API, not a Hook`,
      apiReference: [
        {
          name: "Rules of Hooks",
          kind: "rules",
          signature: "function Profile() {\n  const [name] = useState('');  // OK: top level\n  if (cond) useState(0);        // Wrong: conditional\n  for (;;) useId();             // Wrong: in a loop\n}",
          params: [
            { name: "top level", type: "rule", description: "Never call Hooks inside conditions, loops, nested functions, try/catch/finally or after an early return." },
            { name: "React functions", type: "rule", description: "Call Hooks only from function components and custom Hooks, never from plain functions or classes." },
          ],
          returns: "Not applicable: these are rules that eslint-plugin-react-hooks enforces.",
          notes: "React matches Hook calls to stored state by call order, which is why the order must be the same on every render.",
        },
        {
          name: "StrictMode",
          kind: "component (react)",
          signature: "<StrictMode>\n  <App />\n</StrictMode>",
          params: [
            { name: "children", type: "ReactNode", description: "The subtree to check during development." },
          ],
          returns: "The children, with extra development-only checks.",
          notes: "In development it renders components twice, runs an extra Effect and ref-callback setup and cleanup, and warns about deprecated APIs. React 19.3 also double-invokes Effects during hydration. No effect in production.",
        },
      ],
      exercise: points(
        "Install eslint-plugin-react-hooks and fix every rules-of-hooks error it reports",
        "Move a conditional Hook into a child component and confirm the behaviour is unchanged",
        "Write each built-in Hook's signature from memory, then check it against the cheat sheet",
      ),
      checkpoint: points(
        "What are the two Rules of Hooks?",
        "Why does React need Hooks to be called in the same order on every render?",
        "Which React API may be called conditionally, and why is it allowed?",
      ),
      mistake: points(
        "Do not call a Hook after an early return",
        "Do not call Hooks from event handlers or regular helper functions",
        "Do not disable the rules-of-hooks lint rule to make an error go away",
      ),
      vocabulary: [
        { word: "convention", meaning: "An agreed way of doing something that tools and people rely on.", example: "The use prefix is a convention the linter uses to find Hooks.", synonyms: ["norm", "standard", "agreed pattern", "naming rule", "default behaviour"], antonyms: ["exception", "deviation", "custom setting", "override", "explicit config"] },
        { word: "linter", meaning: "A tool that analyses source code to flag errors, bugs and style problems before it runs.", example: "The linter caught a Hook called inside a loop.", synonyms: ["static analyser", "code checker", "rule checker", "style enforcer", "static tool"], antonyms: ["runtime", "debugger", "test runner", "profiler", "runtime check"] },
        { word: "conditional", meaning: "Depending on a condition being true or false.", example: "A conditional Hook call changes the call order between renders.", synonyms: ["dependent", "contingent", "branching", "situation-dependent", "guarded"], antonyms: ["unconditional", "absolute", "always applied", "constant", "unbranched"] },
        { word: "idempotent", meaning: "Producing the same result no matter how many times it is repeated.", example: "StrictMode runs renders twice to check they are idempotent.", synonyms: ["repeatable", "stable", "safely retryable", "convergent", "once-effective"], antonyms: ["cumulative", "side-effecting", "duplicating", "accumulating", "unsafe to retry"] },
        { word: "compiler", meaning: "A program that transforms source code into another form, often optimising it on the way.", example: "React Compiler inserts memoisation into your components at build time.", synonyms: ["translator", "transformer", "build-time tool", "code generator", "optimiser"], antonyms: ["interpreter", "decompiler", "runtime engine", "evaluator", "REPL"] },
        { word: "invariant", meaning: "A condition that must always hold true for a system to work correctly.", example: "A stable Hook call order is an invariant React depends on.", synonyms: ["constant", "guarantee", "always-true rule", "assumption", "property"], antonyms: ["variable", "exception", "special case", "violation", "changing condition", "case-specific rule"] },
      ],
    },
  ],
  project: "Build a small reading-list app with React 19. Model the list with useReducer and share it through a context rendered as <ListContext value={...}>. Add a search box whose results use useDeferredValue, and put the Reading and Finished tabs inside <Activity> so each keeps its scroll position. Add books through a form managed by useActionState, give it a SubmitButton that reads useFormStatus, and show new books instantly with useOptimistic. Subscribe to online status with useSyncExternalStore and disable saving while offline, and animate tab changes with <ViewTransition> inside startTransition. Finally, wrap the app in <StrictMode> and confirm every Effect has a correct cleanup.",
  summary: "Components are pure functions that turn props and state into JSX. useState and useReducer hold local state, and context shares values across the tree, now rendered directly as <Context value>. Refs, now a plain prop, reach DOM nodes and hold values that should not re-render, and useImperativeHandle narrows what a parent sees. Effects synchronise with outside systems; useLayoutEffect and useInsertionEffect handle timing-sensitive work, and useEffectEvent keeps non-reactive logic out of dependencies. useMemo, useCallback and React Compiler skip needless work, while useTransition and useDeferredValue keep input responsive. React 19 Actions simplify forms through useActionState, useFormStatus and useOptimistic. use reads promises and context, Server Components and Server Functions split work across the network, Activity hides UI without losing state, and View Transitions animate change.",
  glossary: [
    { term: "Component", definition: "A JavaScript function, named with a capital letter, that returns JSX describing a piece of UI." },
    { term: "JSX", definition: "A syntax extension that lets you write HTML-like markup inside JavaScript; it compiles to function calls." },
    { term: "Hook", definition: "A function whose name starts with use that lets a component use React features such as state or Effects." },
    { term: "State", definition: "Component memory that persists between renders; changing it through a set function triggers a re-render." },
    { term: "Effect", definition: "Code that runs after rendering to synchronise a component with a system outside React." },
    { term: "Ref", definition: "A mutable { current } object that persists across renders without causing re-renders, often holding a DOM node." },
    { term: "Context", definition: "A way for a parent to provide a value to every component below it without passing props through each level." },
    { term: "Transition", definition: "A non-urgent state update that React can interrupt to keep the interface responsive." },
    { term: "Action", definition: "An async function run inside a transition, typically a form submission; React tracks its pending state." },
    { term: "Suspense", definition: "A component that shows a fallback while its children wait for code or data to load." },
    { term: "Server Component", definition: "A component that renders on the server before bundling and ships no JavaScript to the browser." },
    { term: "Activity", definition: "A React 19.2 component that hides part of the UI while preserving its state and DOM." },
  ],
  sources: [
    { url: "https://react.dev/reference/react/hooks", title: "Built-in React Hooks", retrievedAt: RETRIEVED_AT },
    { url: "https://react.dev/blog/2024/12/05/react-19", title: "React v19", retrievedAt: RETRIEVED_AT },
    { url: "https://react.dev/blog/2025/10/01/react-19-2", title: "React 19.2", retrievedAt: RETRIEVED_AT },
    { url: "https://react.dev/blog/2026/09/09/react-19-3", title: "React 19.3", retrievedAt: RETRIEVED_AT },
    { url: "https://react.dev/reference/react/useActionState", title: "useActionState", retrievedAt: RETRIEVED_AT },
    { url: "https://react.dev/reference/react/use", title: "use", retrievedAt: RETRIEVED_AT },
    { url: "https://react.dev/reference/react-dom", title: "React DOM APIs", retrievedAt: RETRIEVED_AT },
    { url: "https://react.dev/reference/rsc/server-components", title: "Server Components", retrievedAt: RETRIEVED_AT },
  ],
};
