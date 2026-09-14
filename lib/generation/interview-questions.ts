import { Curriculum, InterviewQuestion } from "@/lib/domain";

/**
 * Frequently asked interview questions for every lesson of the two seeded
 * guides, keyed by lesson title and merged in by withInterview(). Kept apart
 * from the lesson content so each guide file stays readable; a test checks
 * that every lesson has an entry, so a renamed lesson cannot silently lose
 * its questions.
 *
 * Code samples stay within roughly 12 lines of 66 characters so a question
 * fits one A4 page and one two-column slide (see render.ts's interviewHtml).
 */
type InterviewBank = Record<string, InterviewQuestion[]>;

export function withInterview(guide: Curriculum, bank: InterviewBank): Curriculum {
  return { ...guide, lessons: guide.lessons.map(lesson => ({ ...lesson, interview: bank[lesson.title] ?? lesson.interview })) };
}

export const REACT_19_INTERVIEW: InterviewBank = {
  "Components, JSX and props": [
    {
      question: "What is the difference between props and state in React?",
      definition: "Props are inputs a parent passes to a child. State is data a component owns and can change over time.",
      answer: "Props are read-only from the child's point of view: the parent decides them and the child re-renders when they change. State is private memory declared with useState or useReducer; the component updates it through a set function, which schedules a re-render. Data flows down as props, and changes flow up through callback props.",
      syntax: "function Child({ label }) { ... }        // props\nconst [count, setCount] = useState(0);   // state",
      code: `function Counter({ step }) {          // step is a prop
  const [count, setCount] = useState(0); // count is state
  return (
    <button onClick={() => setCount(c => c + step)}>
      {count}
    </button>
  );
}

<Counter step={5} />`,
      similar: [
        { question: "Can a child component change its props?", answer: "No. Props are owned by the parent. To change them, the child calls a callback prop and the parent updates its own state." },
        { question: "What is lifting state up?", answer: "Moving shared state to the closest common parent, then passing it down as props so siblings stay in sync." },
      ],
    },
    {
      question: "Why does React need a key when rendering a list?",
      definition: "A key is a string or number that uniquely identifies an element among its siblings.",
      answer: "Keys let React match items between renders. With a stable key from the data, React can move, insert or delete exactly the right elements and keep each item's state. Without keys, or with array indexes on a reorderable list, React matches by position, so state and DOM such as input values can end up attached to the wrong item.",
      syntax: "items.map(item => <Row key={item.id} {...item} />)",
      code: `function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        // Stable id from data, not the array index
        <li key={todo.id}>
          <input defaultValue={todo.text} />
        </li>
      ))}
    </ul>
  );
}`,
      similar: [
        { question: "When is using the index as a key acceptable?", answer: "Only for static lists that are never reordered, filtered or inserted into, and whose items hold no state." },
        { question: "Are keys passed to the component as a prop?", answer: "No. key is consumed by React. Pass the id under another prop name if the child needs it." },
      ],
    },
  ],
  "State with useState": [
    {
      question: "Why does console.log show the old value right after calling setState?",
      definition: "State behaves like a snapshot: each render sees fixed values for that render.",
      answer: "Calling the set function does not mutate the variable in the currently running code. It queues an update and asks React to render again. The new value is only visible in the next render's snapshot. If you need the next value immediately, compute it into a local variable first, or use an updater function for dependent updates.",
      syntax: "setCount(count + 1);   // queues an update\nconsole.log(count);     // still the old value",
      code: `function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    const next = count + 1;
    setCount(next);
    console.log(count); // 0, the snapshot
    console.log(next);  // 1, the value you set
  }
  return <button onClick={handleClick}>{count}</button>;
}`,
      similar: [
        { question: "What is an updater function?", answer: "A function passed to setState, such as c => c + 1, that receives the latest pending state. Use it when an update depends on the previous value." },
        { question: "Does React batch state updates?", answer: "Yes. Since React 18, updates in the same event, timeout or promise are batched into a single re-render." },
      ],
    },
    {
      question: "How do you update an object or array held in state?",
      definition: "React state should be treated as immutable: replace values instead of changing them in place.",
      answer: "Create a new object or array with the change and pass it to the set function. Use spread syntax for objects and non-mutating array methods such as map, filter and concat for arrays. React compares with Object.is, so mutating the existing object and setting the same reference would not trigger a re-render and can corrupt earlier snapshots.",
      syntax: "setUser({ ...user, name });\nsetTodos([...todos, todo]);\nsetTodos(todos.filter(t => t.id !== id));",
      code: `const [user, setUser] = useState({
  name: 'Asha',
  address: { city: 'Pune' },
});

// Nested update: copy every level you change
setUser({
  ...user,
  address: { ...user.address, city: 'Mumbai' },
});

// Wrong: mutation keeps the same reference
user.address.city = 'Mumbai';
setUser(user);`,
      similar: [
        { question: "Why is mutating state a problem?", answer: "React skips the re-render when the reference is unchanged, and old snapshots, memo comparisons and DevTools history all see corrupted data." },
        { question: "How do you avoid deep copying for nested state?", answer: "Flatten the state shape, split it into several useState calls, or use a helper like Immer that produces immutable copies." },
      ],
    },
  ],
  "Complex state with useReducer": [
    {
      question: "When would you choose useReducer over useState?",
      definition: "useReducer manages state through a reducer function that maps (state, action) to the next state.",
      answer: "Choose useReducer when several pieces of state change together, when many event handlers update the same state, or when the next state depends on complex rules. It centralises the logic in one pure, testable function and keeps handlers short. For a single independent value such as a toggle, useState is simpler.",
      syntax: "const [state, dispatch] = useReducer(reducer, initialArg, init?);\ndispatch({ type: 'added', id });",
      code: `function reducer(state, action) {
  switch (action.type) {
    case 'start': return { ...state, loading: true, error: null };
    case 'success': return { loading: false, data: action.data, error: null };
    case 'failure': return { ...state, loading: false, error: action.error };
    default: throw new Error('Unknown action ' + action.type);
  }
}

const [state, dispatch] = useReducer(reducer, {
  loading: false, data: null, error: null,
});`,
      similar: [
        { question: "Is useReducer a replacement for Redux?", answer: "For local or moderately shared state, often yes, especially combined with context. Redux adds middleware, DevTools time travel and a global store." },
        { question: "What does the third init argument do?", answer: "It computes the initial state lazily as init(initialArg), so expensive setup runs only on the first render." },
      ],
    },
    {
      question: "Why must a reducer be a pure function?",
      definition: "A pure function returns the same output for the same input and has no side effects.",
      answer: "React may call reducers more than once, for example twice in Strict Mode during development, and it replays queued actions during rendering. Side effects such as fetches, timers or mutations inside a reducer would therefore run unpredictably. Keeping reducers pure also makes them trivial to unit-test and makes every state transition reproducible from the list of actions.",
      syntax: "function reducer(state, action) {\n  return nextState; // no fetch, no mutation, no Date.now()\n}",
      code: `// Pure: easy to test without rendering anything
test('adds a todo', () => {
  const next = todosReducer([], {
    type: 'added', id: 1, text: 'Milk',
  });
  expect(next).toEqual([{ id: 1, text: 'Milk' }]);
});`,
      similar: [
        { question: "Where should side effects go instead?", answer: "In event handlers or Effects. Dispatch actions with the results, for example dispatch({ type: 'loaded', data })." },
        { question: "Can a reducer read props?", answer: "Not directly. Pass the needed values inside the action, or declare the reducer inside the component if it must close over props." },
      ],
    },
  ],
  "Sharing data with context": [
    {
      question: "What problem does React context solve, and what are its downsides?",
      definition: "Context passes a value to every component below a provider without threading props through each level.",
      answer: "Context removes prop drilling for widely needed values such as theme, locale or the current user. Its downsides: data flow becomes implicit, components become harder to reuse outside the provider, and every consumer re-renders when the provider's value changes. Use it for truly global values, keep values stable with useMemo, and split unrelated values into separate contexts.",
      syntax: "const Ctx = createContext(defaultValue);\n<Ctx value={value}>{children}</Ctx>\nconst v = useContext(Ctx);",
      code: `const AuthContext = createContext(null);

export function AuthProvider({ user, children }) {
  const value = useMemo(() => ({ user }), [user]);
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth needs <AuthProvider>');
  return ctx;
}`,
      similar: [
        { question: "Does memo stop a context consumer from re-rendering?", answer: "No. A component that reads a context re-renders when the value changes, even if it is wrapped in memo." },
        { question: "Is context a state management library?", answer: "No. It only transports a value. State still lives in useState or useReducer, usually in the provider component." },
      ],
    },
    {
      question: "What changed about context providers in React 19?",
      definition: "React 19 lets you render a context object directly as its own provider.",
      answer: "Instead of <ThemeContext.Provider value={...}>, you can write <ThemeContext value={...}>. The older Provider form still works but is planned for deprecation. React 19 also added use(Context), which reads context like useContext but can be called conditionally. React 19.3 allows rendering a context directly from a Server Component.",
      syntax: "<ThemeContext value=\"dark\">...</ThemeContext>   // React 19\nconst theme = use(ThemeContext);               // conditional read",
      code: `const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext value="dark">
      <Button />
    </ThemeContext>
  );
}

function Button({ plain }) {
  if (plain) return <button>OK</button>;
  const theme = use(ThemeContext); // allowed after a return
  return <button className={theme}>OK</button>;
}`,
      similar: [
        { question: "What does useContext return without a provider?", answer: "The default value passed to createContext." },
        { question: "How do you override a context for part of the tree?", answer: "Render another provider of the same context lower down; readers use the closest provider above them." },
      ],
    },
  ],
  "Refs with useRef and ref as a prop": [
    {
      question: "What is the difference between useRef and useState?",
      definition: "Both persist values across renders; only state changes trigger a re-render.",
      answer: "useState returns a snapshot value and a setter; changing it schedules a render, so it is right for anything the UI displays. useRef returns a mutable { current } object that stays the same across renders; writing to current is instant and silent. Use refs for DOM nodes, timer ids and other values that should not cause a re-render, and never read them during render.",
      syntax: "const ref = useRef(initial);   // ref.current = x, no re-render\nconst [v, setV] = useState(initial); // setV(x) re-renders",
      code: `function Stopwatch() {
  const [elapsed, setElapsed] = useState(0); // shown on screen
  const intervalRef = useRef(null);           // never shown

  function start() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
  }
  const stop = () => clearInterval(intervalRef.current);
  return <p onClick={start} onDoubleClick={stop}>{elapsed}s</p>;
}`,
      similar: [
        { question: "Why is reading ref.current during render discouraged?", answer: "It makes output depend on a value React does not track, so the UI can be stale or inconsistent between renders." },
        { question: "Can a ref hold something other than a DOM node?", answer: "Yes, any value: timer ids, previous values, or an instance of a third-party widget." },
      ],
    },
    {
      question: "How do you pass a ref to a custom component in React 19?",
      definition: "In React 19, ref is an ordinary prop for function components.",
      answer: "Declare ref in the component's props and forward it to the element or hook that needs it. forwardRef is no longer necessary and is planned for deprecation. React 19 also lets ref callbacks return a cleanup function, which runs when the element is detached, replacing the old pattern of being called again with null.",
      syntax: "function Input({ ref, ...props }) {\n  return <input ref={ref} {...props} />;\n}",
      code: `// React 18
const Input18 = forwardRef((props, ref) => (
  <input ref={ref} {...props} />
));

// React 19
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

<div ref={node => {
  node.addEventListener('scroll', onScroll);
  return () => node.removeEventListener('scroll', onScroll);
}} />`,
      similar: [
        { question: "Do class components receive ref as a prop?", answer: "No. For class components ref still refers to the class instance, and it is not passed in props." },
        { question: "What happens if a ref callback returns a non-function?", answer: "React 19 treats the return value as a cleanup, so TypeScript rejects implicit returns such as ref={n => (x = n)}." },
      ],
    },
  ],
  "Custom ref handles with useImperativeHandle": [
    {
      question: "What is useImperativeHandle used for?",
      definition: "It customises the value a parent receives through a ref passed to your component.",
      answer: "It lets a component expose a small, deliberate API, such as focus or scrollToTop, instead of its raw DOM node. The component keeps a private ref to the real element and returns an object of methods from createHandle. This keeps the parent from depending on internal markup. It should be rare: most interactions are better expressed as props.",
      syntax: "useImperativeHandle(ref, () => ({ focus, clear }), [deps]);",
      code: `function SearchBox({ ref }) {
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
  }), []);
  return <input ref={inputRef} />;
}

const box = useRef(null);
<SearchBox ref={box} />;
box.current.clear();`,
      similar: [
        { question: "Why not just expose the DOM node?", answer: "The parent could then restyle, move or remove it, coupling it to internals the child may need to change." },
        { question: "When is the handle recreated?", answer: "When any dependency changes, or on every render if the dependency array is omitted." },
      ],
    },
    {
      question: "When should you avoid imperative APIs in React?",
      definition: "An imperative API makes the parent call methods, rather than describing state through props.",
      answer: "Avoid them whenever the behaviour can be described declaratively. Opening a modal, choosing a tab or showing an error should be props such as isOpen or selectedTab, because React can then render consistently from state. Reserve imperative handles for things props cannot express: focusing, scrolling, selecting text, playing media or triggering an animation.",
      syntax: "<Modal isOpen={open} />       // preferred\nmodalRef.current.open();     // avoid",
      code: `// Declarative: state drives the UI
function Page() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Edit</button>
      <Modal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}`,
      similar: [
        { question: "Name valid uses for an imperative ref.", answer: "Focus management, scrolling into view, measuring layout, text selection, media playback and starting animations." },
        { question: "What replaced forwardRef when using useImperativeHandle?", answer: "In React 19 the ref arrives as a normal prop and is passed straight to useImperativeHandle." },
      ],
    },
  ],
  "Effects with useEffect": [
    {
      question: "Explain the useEffect dependency array and its three forms.",
      definition: "The dependency array lists the reactive values an Effect reads, telling React when to re-run it.",
      answer: "With no array, the Effect runs after every render. With an empty array, it runs once after the component mounts, and its cleanup runs on unmount. With values listed, it runs after mount and again whenever one of them changes by Object.is, running the previous cleanup first. Every prop, state or derived value used inside must be listed; the linter enforces this.",
      syntax: "useEffect(fn);            // every render\nuseEffect(fn, []);        // mount only\nuseEffect(fn, [a, b]);    // when a or b changes",
      code: `useEffect(() => {
  const id = setInterval(() => tick(roomId), 1000);
  return () => clearInterval(id); // cleanup
}, [roomId]); // re-runs only when roomId changes`,
      similar: [
        { question: "Why does my Effect run twice in development?", answer: "Strict Mode mounts, unmounts and remounts components to verify cleanups. It does not happen in production." },
        { question: "How do you fix an infinite Effect loop?", answer: "Remove state that the Effect sets from its dependencies, add a condition, or derive the value during render instead." },
      ],
    },
    {
      question: "When do you NOT need an Effect?",
      definition: "Effects are only for synchronising with systems outside React.",
      answer: "You do not need an Effect to transform data for rendering: compute it during render, and memoise it if it is expensive. You do not need one to handle user events: put that logic in the event handler. You do not need one to reset state when a prop changes: use a key. Unnecessary Effects add extra renders and bugs from stale values.",
      syntax: "const fullName = first + ' ' + last; // no Effect\n<Profile key={userId} />             // reset state",
      code: `// Avoid: state plus an Effect to mirror props
const [visible, setVisible] = useState([]);
useEffect(() => {
  setVisible(todos.filter(t => !t.done));
}, [todos]);

// Prefer: derive during render
const visibleTodos = todos.filter(t => !t.done);`,
      similar: [
        { question: "Where should a POST request on button click go?", answer: "In the click handler. It is caused by a specific interaction, not by the component being displayed." },
        { question: "How do you fetch data correctly in an Effect?", answer: "Use an ignore flag or AbortController in the cleanup, or prefer a framework data API or a library such as TanStack Query." },
      ],
    },
  ],
  "Timing: useLayoutEffect and useInsertionEffect": [
    {
      question: "What is the difference between useEffect and useLayoutEffect?",
      definition: "Both run after React updates the DOM; they differ in whether the browser has painted yet.",
      answer: "useLayoutEffect runs synchronously after DOM mutations but before the browser paints, and state updates inside it re-render before paint. That makes it right for measuring layout and repositioning elements without flicker. useEffect runs after paint and does not block the frame, so it is the default for subscriptions, logging and network work.",
      syntax: "useLayoutEffect(() => { measure(); }, [deps]); // before paint\nuseEffect(() => { subscribe(); }, [deps]);     // after paint",
      code: `function Tooltip({ anchor }) {
  const ref = useRef(null);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const { height } = ref.current.getBoundingClientRect();
    setTop(anchor.top - height); // applied before paint
  }, [anchor]);
  return <div ref={ref} style={{ top }}>Tip</div>;
}`,
      similar: [
        { question: "Does useLayoutEffect run on the server?", answer: "No. Neither Effect runs during server rendering; the initial HTML has no measurements." },
        { question: "Why not use useLayoutEffect everywhere?", answer: "It blocks painting, so heavy work in it makes every update feel slower." },
      ],
    },
    {
      question: "Who is useInsertionEffect for, and what are its restrictions?",
      definition: "useInsertionEffect fires before any layout Effects and is meant for injecting styles.",
      answer: "It exists for CSS-in-JS library authors who must insert style tags before any component reads layout in useLayoutEffect. It runs on the client only, cannot update state, and runs before refs are attached. Application code should almost never use it; prefer static CSS or CSS modules.",
      syntax: "useInsertionEffect(() => { injectStyle(rule); }, [rule]);",
      code: `const inserted = new Set();
function useStyle(rule) {
  useInsertionEffect(() => {
    if (inserted.has(rule)) return;
    inserted.add(rule);
    const tag = document.createElement('style');
    tag.textContent = rule;
    document.head.appendChild(tag);
  }, [rule]);
}`,
      similar: [
        { question: "What order do the three Effect Hooks run in?", answer: "useInsertionEffect, then useLayoutEffect, then the browser paints, then useEffect." },
        { question: "Can you read a ref inside useInsertionEffect?", answer: "No. Refs have not been attached yet when insertion effects run." },
      ],
    },
  ],
  "Non-reactive logic with useEffectEvent": [
    {
      question: "What does useEffectEvent solve?",
      definition: "useEffectEvent creates a function that reads the latest props and state without being a dependency.",
      answer: "Some Effects read a value, such as the theme or the current user, only to use inside an event they fire, like showing a notification. Listing that value as a dependency would re-run the Effect and, for example, reconnect a chat. Wrapping that logic in an Effect Event keeps it up to date while the Effect depends only on the values that require re-synchronising. It is stable since React 19.2.",
      syntax: "const onConnected = useEffectEvent(() => notify(theme));\nuseEffect(() => { ...onConnected(); }, [roomId]);",
      code: `function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected', theme); // latest theme
  });

  useEffect(() => {
    const c = connect(roomId);
    c.on('connected', onConnected);
    return () => c.disconnect();
  }, [roomId]); // theme is not a dependency
}`,
      similar: [
        { question: "Can you pass an Effect Event to a child component?", answer: "No. It may only be called from Effects or other Effect Events in the same component; its identity changes every render." },
        { question: "Is it acceptable to use it to silence the dependency linter?", answer: "No. Only use it for logic that is genuinely an event; hiding real dependencies causes stale-data bugs." },
      ],
    },
    {
      question: "How did developers solve this before useEffectEvent?",
      definition: "The workaround kept the latest value or callback in a ref that the Effect read.",
      answer: "The common pattern stored the latest callback in a ref, updated it in a layout Effect on every render, and called ref.current() from the long-lived Effect. It worked but was verbose and easy to get subtly wrong. useEffectEvent is the official, linter-aware version of that pattern.",
      syntax: "const latest = useRef(fn);\nuseLayoutEffect(() => { latest.current = fn; });",
      code: `// The old "latest ref" workaround
function useLatest(callback) {
  const ref = useRef(callback);
  useLayoutEffect(() => {
    ref.current = callback;
  });
  return ref;
}

const onTickRef = useLatest(onTick);
useEffect(() => {
  const id = setInterval(() => onTickRef.current(), 1000);
  return () => clearInterval(id);
}, []);`,
      similar: [
        { question: "What version made useEffectEvent stable?", answer: "React 19.2, released in October 2025, together with updated eslint-plugin-react-hooks rules." },
        { question: "Which Hooks can call an Effect Event?", answer: "useEffect, useLayoutEffect and useInsertionEffect, plus other Effect Events." },
      ],
    },
  ],
  "Skipping work: useMemo, useCallback and memo": [
    {
      question: "What is the difference between useMemo and useCallback?",
      definition: "Both cache something between renders until their dependencies change.",
      answer: "useMemo calls a function and caches its return value, which suits expensive calculations and keeping object references stable. useCallback caches the function itself without calling it, which suits event handlers passed to memoised children or used as Effect dependencies. useCallback(fn, deps) is exactly useMemo(() => fn, deps).",
      syntax: "const value = useMemo(() => compute(a, b), [a, b]);\nconst handler = useCallback(e => save(id), [id]);",
      code: `const sorted = useMemo(
  () => [...rows].sort(byColumn(sortKey)),
  [rows, sortKey]
);

const onSelect = useCallback(id => {
  setSelected(id);
}, []);

return <Table rows={sorted} onSelect={onSelect} />;`,
      similar: [
        { question: "Is a memoised value guaranteed to stay cached?", answer: "No. React may discard caches, so use memoisation only as a performance optimisation." },
        { question: "What does React Compiler change here?", answer: "React Compiler 1.0 memoises components and values automatically at build time, so manual useMemo and useCallback are rarely needed." },
      ],
    },
    {
      question: "Why might wrapping a component in memo not stop it re-rendering?",
      definition: "memo skips a re-render only when every prop is equal to its previous value by Object.is.",
      answer: "If the parent passes a new object, array or inline function on each render, memo sees a changed prop and re-renders anyway. The component also re-renders when its own state changes or a context it reads changes. Fix it by stabilising props with useMemo and useCallback, passing primitives, or letting React Compiler handle it.",
      syntax: "const Row = memo(function Row(props) { ... });",
      code: `// Breaks memo: new object and function every render
<Chart options={{ color: 'red' }} onPick={id => pick(id)} />

// Works: stable references
const options = useMemo(() => ({ color: 'red' }), []);
const onPick = useCallback(id => pick(id), []);
<Chart options={options} onPick={onPick} />`,
      similar: [
        { question: "What is referential equality?", answer: "Two values are the same object in memory. {} !== {} even though they look identical." },
        { question: "How do you find components that re-render needlessly?", answer: "Use the React DevTools Profiler or the React 19.2 Performance Tracks in Chrome DevTools." },
      ],
    },
  ],
  "Responsive updates with useTransition": [
    {
      question: "What is a transition in React and why use one?",
      definition: "A transition is a state update marked as non-urgent so React can interrupt it.",
      answer: "Wrapping an update in startTransition tells React it may render it in the background. Urgent updates such as typing or clicking can interrupt it, so the interface stays responsive during expensive renders. useTransition also returns isPending for a subtle loading indicator, and transitions keep already-visible content on screen instead of showing Suspense fallbacks again.",
      syntax: "const [isPending, startTransition] = useTransition();\nstartTransition(() => setTab(next));",
      code: `function Tabs() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();
  return (
    <>
      <button onClick={() => startTransition(() => setTab('posts'))}>
        Posts {isPending && '...'}
      </button>
      <TabPanel tab={tab} />
    </>
  );
}`,
      similar: [
        { question: "Can you control a text input with a transition?", answer: "No. Input updates must stay synchronous; defer the expensive part with useDeferredValue instead." },
        { question: "What is the difference between useTransition and startTransition?", answer: "useTransition also gives isPending and works in components; the standalone startTransition works anywhere but has no pending flag." },
      ],
    },
    {
      question: "What are Actions in React 19, and how do they relate to transitions?",
      definition: "An Action is an async function run inside a transition.",
      answer: "React 19 lets startTransition accept async functions. React keeps isPending true for the whole async call, handles errors through Error Boundaries, and powers form actions, useActionState and useOptimistic. One caveat: set calls after an await are not automatically part of the transition, so wrap them in another startTransition.",
      syntax: "startTransition(async () => {\n  await save();\n  startTransition(() => setDone(true));\n});",
      code: `const [isPending, startTransition] = useTransition();

function handleSave() {
  startTransition(async () => {
    const error = await updateName(name);
    startTransition(() => {
      if (error) setError(error);
      else setSaved(true);
    });
  });
}`,
      similar: [
        { question: "Where are Actions used automatically?", answer: "Functions passed to <form action>, <button formAction> and useActionState's dispatch run as Actions." },
        { question: "How are errors in an Action handled?", answer: "A thrown error propagates to the nearest Error Boundary; with useActionState, return error values instead of throwing." },
      ],
    },
  ],
  "Deferring work with useDeferredValue": [
    {
      question: "What does useDeferredValue do, and how does it differ from debouncing?",
      definition: "useDeferredValue returns a copy of a value that may lag behind, rendered in the background.",
      answer: "On each change React first re-renders with the old deferred value, keeping urgent UI such as an input instant, then renders the new value in an interruptible background pass. Debouncing waits a fixed time before acting; useDeferredValue has no fixed delay, so fast devices update almost immediately and slow devices simply skip intermediate values.",
      syntax: "const deferred = useDeferredValue(value, initialValue?);",
      code: `function Search() {
  const [text, setText] = useState('');
  const deferredText = useDeferredValue(text);
  const stale = text !== deferredText;
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <div style={{ opacity: stale ? 0.5 : 1 }}>
        <SlowResults query={deferredText} />
      </div>
    </>
  );
}`,
      similar: [
        { question: "Why wrap the slow child in memo?", answer: "So the urgent re-render with the old deferred value can skip it entirely; otherwise it still renders slowly." },
        { question: "What does initialValue add in React 19?", answer: "It is used on the first render, so the component can show a cheap placeholder before rendering the real value." },
      ],
    },
    {
      question: "When would you choose useDeferredValue over useTransition?",
      definition: "Both defer non-urgent work; they differ in what you control.",
      answer: "Use useTransition when you own the state update and can wrap the set call. Use useDeferredValue when you receive a value, for example as a prop or from a third-party hook, and cannot control how it is set. Inside a transition, useDeferredValue returns the new value immediately because the update is already deferred.",
      syntax: "startTransition(() => setQuery(q));      // you own the update\nconst q = useDeferredValue(props.query);  // you receive a value",
      code: `// The query arrives from a parent or library
function Results({ query }) {
  const deferredQuery = useDeferredValue(query);
  return <List items={search(deferredQuery)} />;
}`,
      similar: [
        { question: "Does useDeferredValue reduce network requests?", answer: "No. It only changes which render the user sees; add caching or debouncing to limit requests." },
        { question: "How does it interact with Suspense?", answer: "If the background render suspends, the user keeps seeing the old content instead of the fallback." },
      ],
    },
  ],
  "Actions and useActionState": [
    {
      question: "Explain useActionState and the values it returns.",
      definition: "useActionState manages state produced by an Action, typically a form submission.",
      answer: "It takes an action function and an initial state and returns [state, dispatchAction, isPending]. When dispatched, React calls your action with the previous state and the payload, usually FormData, and the returned value becomes the new state. Dispatches are queued and run in order, and isPending is true while any are running. Returning errors as state gives inline error messages without extra useState.",
      syntax: "const [state, formAction, isPending] =\n  useActionState(action, initialState, permalink?);",
      code: `async function login(prev, formData) {
  const ok = await signIn(formData.get('email'),
                          formData.get('password'));
  return ok ? { error: null } : { error: 'Wrong password' };
}

function LoginForm() {
  const [state, formAction, isPending] =
    useActionState(login, { error: null });
  return (
    <form action={formAction}>
      <input name="email" /> <input name="password" type="password" />
      <button disabled={isPending}>Sign in</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}`,
      similar: [
        { question: "What was useActionState called before React 19?", answer: "It shipped in canaries as ReactDOM.useFormState, and was renamed useActionState in React 19." },
        { question: "What is the permalink argument for?", answer: "With Server Functions, it tells a form submitted before hydration which URL to navigate to." },
      ],
    },
    {
      question: "How do form actions in React 19 differ from onSubmit handlers?",
      definition: "A form action is a function passed to the action prop, called with the form's FormData.",
      answer: "With onSubmit you call preventDefault, read fields and manage pending and error state by hand. A function passed to <form action> runs as an Action inside a transition, receives FormData directly, integrates with useFormStatus and useActionState, and resets uncontrolled fields on success. With a Server Function it also works before JavaScript loads.",
      syntax: "<form action={async formData => { await save(formData); }}>",
      code: `// Before: manual event handling
<form onSubmit={async e => {
  e.preventDefault();
  setPending(true);
  await save(new FormData(e.currentTarget));
  setPending(false);
}}>

// React 19: a form action
<form action={async formData => { await save(formData); }}>`,
      similar: [
        { question: "Can a single form have several actions?", answer: "Yes. Give each submit button its own formAction; the button used decides which function runs." },
        { question: "How do you keep field values after an action?", answer: "Use controlled inputs, or return the values in state and pass them as defaultValue." },
      ],
    },
  ],
  "Form status with useFormStatus": [
    {
      question: "What does useFormStatus return, and where must it be called?",
      definition: "useFormStatus, from react-dom, reports the submission status of the nearest parent form.",
      answer: "It returns { pending, data, method, action }: whether the parent form is submitting, the FormData being sent, the HTTP method and the action function. It must be called from a component rendered inside the <form>; called in the component that renders the form, it reports nothing. That makes it ideal for reusable submit buttons in design systems.",
      syntax: "const { pending, data, method, action } = useFormStatus();",
      code: `import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}

function ProfileForm() {
  return (
    <form action={saveProfile}>
      <input name="name" />
      <SubmitButton />
    </form>
  );
}`,
      similar: [
        { question: "Does useFormStatus track nested forms?", answer: "No. It only reports on the parent form of the component that calls it." },
        { question: "How is it different from isPending in useActionState?", answer: "useActionState's flag lives in the component that owns the action; useFormStatus lets any child of the form read the status." },
      ],
    },
    {
      question: "How can you show the submitted value while a form is pending?",
      definition: "useFormStatus exposes the FormData being submitted as data.",
      answer: "While pending is true, data is the FormData the form is sending, so a child can read fields with data.get('name') and show text such as Sending to Asha. When there is no active submission, data is null, so always check pending first. For showing the submitted item in a list, useOptimistic is the better tool.",
      syntax: "const { pending, data } = useFormStatus();\npending && data.get('name');",
      code: `function SendingHint() {
  const { pending, data } = useFormStatus();
  if (!pending) return null;
  return <p>Sending to {data.get('recipient')}...</p>;
}

<form action={sendMoney}>
  <input name="recipient" />
  <SendingHint />
  <button>Send</button>
</form>`,
      similar: [
        { question: "What is method when a form has no method attribute?", answer: "'get', the HTML default, unless the form specifies method=\"post\"." },
        { question: "What is action when the form's action is a URL?", answer: "null; it is only set when the action prop is a function." },
      ],
    },
  ],
  "Instant feedback with useOptimistic": [
    {
      question: "How does useOptimistic work, and how does it roll back on failure?",
      definition: "useOptimistic shows a temporary state while an Action is pending.",
      answer: "You pass it the real value and optionally a reducer. Inside an Action you call setOptimistic, and the returned optimisticState shows that value immediately. When the Action finishes, React discards the optimistic value and renders the real value again. If the request failed and you never updated the real state, the UI automatically returns to the previous value, so no manual rollback code is needed.",
      syntax: "const [optimistic, setOptimistic] = useOptimistic(value, reducer?);",
      code: `function LikeButton({ likes, onLike }) {
  const [optimisticLikes, addLike] = useOptimistic(
    likes,
    (current, delta) => current + delta
  );
  async function likeAction() {
    addLike(1);          // shows instantly
    await onLike();      // parent updates real likes
  }
  return (
    <form action={likeAction}>
      <button>Like ({optimisticLikes})</button>
    </form>
  );
}`,
      similar: [
        { question: "What happens if setOptimistic is called outside an Action?", answer: "React warns in development, and the optimistic value only renders briefly." },
        { question: "How do you mark optimistic items visually?", answer: "Add a flag such as sending: true to the optimistic entry and style it as pending." },
      ],
    },
    {
      question: "When should you avoid optimistic updates?",
      definition: "An optimistic update assumes success before the server confirms it.",
      answer: "Avoid them when failure is common or costly to reverse in the user's mind, such as payments, bookings with limited stock or destructive actions. There the user needs confirmation, not an assumption. They fit best for low-risk, high-frequency actions like likes, reactions, reordering and sending chat messages, where success is the norm.",
      syntax: "// good: likes, messages, toggles\n// avoid: payments, irreversible deletes",
      code: `// Payment: wait for the server, show a pending state
const [state, pay, isPending] = useActionState(payAction, null);

<form action={pay}>
  <button disabled={isPending}>
    {isPending ? 'Processing payment...' : 'Pay now'}
  </button>
</form>`,
      similar: [
        { question: "What does perceived performance mean?", answer: "How fast an app feels to users, which optimistic UI improves even when the network is slow." },
        { question: "How do you show an error after an optimistic update fails?", answer: "Catch the error in the Action and store it in state, or let it reach an Error Boundary." },
      ],
    },
  ],
  "Reading resources with use and Suspense": [
    {
      question: "What is the use API, and how is it different from Hooks?",
      definition: "use reads the value of a Promise or a context during render.",
      answer: "use(promise) returns the resolved value and suspends the component while it is pending, so the nearest Suspense boundary shows a fallback; rejections go to the nearest Error Boundary. use(context) reads context like useContext. Unlike Hooks, use can be called inside if statements and loops, but it still must be called from a component or Hook and never inside try/catch.",
      syntax: "const data = use(dataPromise);\nconst theme = use(ThemeContext);",
      code: `function Profile({ userPromise }) {
  const user = use(userPromise); // suspends until resolved
  return <h1>{user.name}</h1>;
}

<ErrorBoundary fallback={<p>Could not load</p>}>
  <Suspense fallback={<Spinner />}>
    <Profile userPromise={fetchUser(id)} />
  </Suspense>
</ErrorBoundary>`,
      similar: [
        { question: "Why can't you create the promise inside the component that calls use?", answer: "Each render would create a new promise that never settles; promises must be cached or created by a parent." },
        { question: "Can Server Components use use(context)?", answer: "No. Reading context with use is not supported in Server Components." },
      ],
    },
    {
      question: "How does Suspense work, and where should boundaries go?",
      definition: "Suspense shows a fallback while anything inside it is waiting for code or data.",
      answer: "When a component suspends, React shows the fallback of the nearest Suspense boundary above it and renders the real content once it is ready. Place boundaries around independent sections that can load separately, such as a sidebar or comments, so the rest of the page appears first. Too few boundaries block large areas; too many cause many spinners popping in.",
      syntax: "<Suspense fallback={<Skeleton />}>\n  <SlowSection />\n</Suspense>",
      code: `export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<PostSkeleton />}>
        <Post />
        <Suspense fallback={<p>Loading comments...</p>}>
          <Comments />
        </Suspense>
      </Suspense>
    </>
  );
}`,
      similar: [
        { question: "What triggers Suspense besides use(promise)?", answer: "lazy() components, framework data APIs, and in React 19.3 use(browser()) during server rendering." },
        { question: "How do you avoid a fallback replacing visible content?", answer: "Make the update a transition; React keeps the old content visible while the new content loads." },
      ],
    },
  ],
  "External stores with useSyncExternalStore": [
    {
      question: "Why does useSyncExternalStore exist?",
      definition: "It subscribes components to data that lives outside React.",
      answer: "With concurrent rendering, reading a mutable external store directly can cause tearing: different components render different versions of the store in the same frame. useSyncExternalStore forces a consistent snapshot per render and re-renders subscribers when the store changes. It is how libraries such as Redux and Zustand integrate with React, and how you read browser APIs like online status.",
      syntax: "const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);",
      code: `const store = {
  value: 0,
  listeners: new Set(),
  set(v) { this.value = v; this.listeners.forEach(l => l()); },
  subscribe(l) { store.listeners.add(l); return () => store.listeners.delete(l); },
  getSnapshot() { return store.value; },
};

function Count() {
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return <p>{value}</p>;
}`,
      similar: [
        { question: "What is tearing?", answer: "A visual inconsistency where parts of the UI show different versions of the same data during one render." },
        { question: "When is getServerSnapshot required?", answer: "Whenever the component is server-rendered; without it, server rendering throws." },
      ],
    },
    {
      question: "What are the rules for getSnapshot?",
      definition: "getSnapshot returns the current store value for React to compare.",
      answer: "It must return the same value, by Object.is, while the store has not changed, and the snapshot must be immutable. Returning a new object or array on every call makes React think the store always changed, which causes an infinite re-render loop. Return primitives, or cache the last derived object and return it until the underlying data changes.",
      syntax: "getSnapshot: () => cachedValue // same reference until data changes",
      code: `// Wrong: a new object on every call
const getSnapshot = () => ({ width: window.innerWidth });

// Right: return a primitive
const getWidth = () => window.innerWidth;
function subscribe(cb) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}
const width = useSyncExternalStore(subscribe, getWidth);`,
      similar: [
        { question: "Why declare subscribe outside the component?", answer: "A new subscribe function each render makes React re-subscribe on every render." },
        { question: "Should you suspend based on a store value?", answer: "No. Store mutations cannot be transitions, so suspending would replace visible UI with a fallback." },
      ],
    },
  ],
  "Custom Hooks, useId and useDebugValue": [
    {
      question: "What is a custom Hook, and do components that use it share state?",
      definition: "A custom Hook is a function starting with use that calls other Hooks to reuse stateful logic.",
      answer: "Custom Hooks let you extract logic such as fetching, form handling or subscriptions and reuse it across components. They share logic, not state: every call creates independent state, just as if the Hooks were written inline in each component. To share state, lift it to a common parent or put it in context or an external store.",
      syntax: "function useToggle(initial = false) {\n  const [on, setOn] = useState(initial);\n  return [on, () => setOn(v => !v)];\n}",
      code: `function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

const width = useWindowWidth(); // each caller has its own state`,
      similar: [
        { question: "Why must custom Hooks start with use?", answer: "The linter and React tooling rely on the prefix to apply the Rules of Hooks to it." },
        { question: "Can a custom Hook return JSX?", answer: "It can, but if it returns UI it is usually clearer as a component." },
      ],
    },
    {
      question: "Why use useId instead of Math.random or a counter for element ids?",
      definition: "useId returns a unique id that is stable across renders and identical on server and client.",
      answer: "Random values differ between the server render and hydration, causing mismatches. Global counters break when components render in a different order on the server and client, or with several roots. useId derives the id from the component's position in the tree, so it matches everywhere. Use it for label htmlFor and aria attributes, never for list keys.",
      syntax: "const id = useId();\n<label htmlFor={id} /> <input id={id} />",
      code: `function PasswordField() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>Password</label>
      <input id={id} type="password"
        aria-describedby={id + '-hint'} />
      <p id={id + '-hint'}>At least 12 characters.</p>
    </>
  );
}`,
      similar: [
        { question: "What does useDebugValue do?", answer: "It shows a label for a custom Hook in React DevTools, with an optional formatter that only runs when inspected." },
        { question: "How do you avoid id clashes between several React roots?", answer: "Pass a different identifierPrefix to each createRoot or hydrateRoot call." },
      ],
    },
  ],
  "Server Components and Server Functions": [
    {
      question: "What are React Server Components, and what are their benefits?",
      definition: "Server Components render ahead of time on the server and send no JavaScript to the browser.",
      answer: "They can be async and read databases or files directly, keep secrets and heavy dependencies on the server, and shrink the client bundle because their code never ships. Interactive parts are marked with 'use client' and hydrate as usual. The trade-off is that Server Components cannot use state, Effects or browser APIs, and they need a framework such as Next.js.",
      syntax: "export default async function Page() {\n  const data = await db.query(...);\n  return <List data={data} />;\n}",
      code: `// Server Component: no 'use client', can be async
import { LikeButton } from './like-button'; // a Client Component

export default async function Post({ id }) {
  const post = await db.posts.find(id);
  return (
    <article>
      <h1>{post.title}</h1>
      <LikeButton postId={id} initial={post.likes} />
    </article>
  );
}`,
      similar: [
        { question: "Are Server Components the same as server-side rendering?", answer: "No. SSR turns components into HTML; Server Components are a component type whose code never runs in the browser, and they work with or without SSR." },
        { question: "Can a Client Component import a Server Component?", answer: "No, but it can receive one as children or another prop from a Server Component parent." },
      ],
    },
    {
      question: "What is a Server Function, and how do you secure it?",
      definition: "A Server Function is an async function marked 'use server' that the client can call over the network.",
      answer: "The 'use server' directive turns the function into an endpoint the framework can invoke from a form action or client code. Because anyone can call that endpoint with any arguments, treat every call as untrusted: authenticate the user, check authorisation for the specific record, and validate inputs inside the function itself. Return only serialisable, non-sensitive data.",
      syntax: "'use server';\nexport async function deletePost(id) { ... }",
      code: `'use server';

export async function deletePost(postId) {
  const user = await requireUser();          // authenticate
  const post = await db.posts.find(postId);
  if (post?.authorId !== user.id) {          // authorise
    throw new Error('Forbidden');
  }
  await db.posts.delete(postId);
}`,
      similar: [
        { question: "Why keep React up to date when using RSC?", answer: "Security fixes for Server Components shipped in December 2025; patched versions close denial-of-service and exposure issues." },
        { question: "What values can a Server Function return?", answer: "Serialisable ones: primitives, plain objects, arrays, Dates, Maps, Sets, promises and JSX." },
      ],
    },
  ],
  "Metadata, stylesheets and resource preloading": [
    {
      question: "How does React 19 handle title, meta and link tags inside components?",
      definition: "React 19 hoists document metadata rendered anywhere in the tree into the document head.",
      answer: "You can render <title>, <meta> and <link> next to the content they describe, for example inside a BlogPost component, and React places them in <head>, both in server HTML and on client updates. This replaces libraries such as react-helmet for simple cases. Frameworks may still offer richer metadata APIs, such as Next.js metadata exports.",
      syntax: "<title>{post.title}</title>\n<meta name=\"description\" content={post.summary} />",
      code: `function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title + ' | Blog'}</title>
      <meta name="author" content={post.author} />
      <link rel="canonical" href={post.url} />
      <h1>{post.title}</h1>
    </article>
  );
}`,
      similar: [
        { question: "What does the precedence prop on a stylesheet do?", answer: "It lets React order, deduplicate and load the stylesheet before revealing content that depends on it." },
        { question: "Are async scripts deduplicated?", answer: "Yes. <script async> rendered in several components is inserted and loaded only once." },
      ],
    },
    {
      question: "What is the difference between preload, preinit, preconnect and prefetchDNS?",
      definition: "They are react-dom functions that give the browser early resource hints.",
      answer: "prefetchDNS only resolves a domain's IP address. preconnect goes further and opens the connection, including the TLS handshake. preload downloads a specific resource, such as a font or image, without executing it. preinit downloads and executes a script or inserts a stylesheet eagerly. Use the lightest hint that fits, because every hint competes for bandwidth.",
      syntax: "prefetchDNS(url); preconnect(url);\npreload(url, { as: 'font' });\npreinit(url, { as: 'script' });",
      code: `import { preconnect, preinit, preload, prefetchDNS } from 'react-dom';

function CheckoutPage() {
  prefetchDNS('https://cdn.example.com');
  preconnect('https://api.payments.com');
  preload('/fonts/brand.woff2', { as: 'font' });
  preinit('https://js.payments.com/v3.js', { as: 'script' });
  return <Checkout />;
}`,
      similar: [
        { question: "What happens when these run during server rendering?", answer: "React emits the hints early in the HTML stream so the browser can start work sooner." },
        { question: "How do you preload an ES module?", answer: "Use preloadModule, or preinitModule to also evaluate it." },
      ],
    },
  ],
  "Hiding UI with Activity": [
    {
      question: "What is the Activity component, and how is it different from conditional rendering?",
      definition: "Activity, added in React 19.2, shows or hides part of the tree without unmounting it.",
      answer: "With {show && <Panel />}, hiding unmounts the panel and destroys its state and DOM. With <Activity mode=\"hidden\">, React hides the children with display: none, cleans up their Effects and keeps their state and DOM. When shown again, state is restored and Effects are re-created. Hidden children can also pre-render at low priority.",
      syntax: "<Activity mode={visible ? 'visible' : 'hidden'}>\n  <Panel />\n</Activity>",
      code: `function Tabs({ tab }) {
  return (
    <>
      <Activity mode={tab === 'inbox' ? 'visible' : 'hidden'}>
        <Inbox />   {/* keeps scroll position and drafts */}
      </Activity>
      <Activity mode={tab === 'settings' ? 'visible' : 'hidden'}>
        <Settings />
      </Activity>
    </>
  );
}`,
      similar: [
        { question: "Do Effects keep running while hidden?", answer: "No. They are cleaned up when hidden and re-created when the Activity becomes visible." },
        { question: "What is the default mode?", answer: "'visible', when the mode prop is omitted." },
      ],
    },
    {
      question: "What are good use cases for Activity?",
      definition: "Activity keeps UI alive but inactive.",
      answer: "Keeping tab contents, form drafts, scroll positions and expanded sections when users switch views; pre-rendering the screen a user is likely to open next so it appears instantly; and preserving the state of back-and-forth navigation, which frameworks like Next.js use with Cache Components. Avoid it for large, rarely visited screens because hidden trees still use memory.",
      syntax: "<Activity mode=\"hidden\"><LikelyNextPage /></Activity>",
      code: `// Pre-render the checkout while the user reviews the cart
function Cart({ showCheckout }) {
  return (
    <>
      <CartItems />
      <Activity mode={showCheckout ? 'visible' : 'hidden'}>
        <Checkout />
      </Activity>
    </>
  );
}`,
      similar: [
        { question: "What does a hidden Activity with a text-only child render?", answer: "Nothing, because there is no element to apply display: none to." },
        { question: "Can Activity be used in Server Components?", answer: "Yes. React 19.3 added support for Activity in the Server Components (Flight) protocol." },
      ],
    },
  ],
  "View Transitions and Fragment refs": [
    {
      question: "How do View Transitions work in React 19.3?",
      definition: "<ViewTransition> animates its children with the browser's View Transition API.",
      answer: "When an update is a transition, from startTransition, a Suspense reveal or useDeferredValue, React snapshots the affected <ViewTransition> boundaries, applies the DOM changes and lets the browser animate between old and new. Props such as enter, exit, update and share pick 'auto', 'none' or a CSS class. Plain setState calls never animate.",
      syntax: "<ViewTransition enter=\"fade-in\" exit=\"fade-out\">\n  {children}\n</ViewTransition>",
      code: `function Gallery({ photos }) {
  const [open, setOpen] = useState(null);
  return open
    ? <ViewTransition name={'photo-' + open.id}>
        <img src={open.large} onClick={() =>
          startTransition(() => setOpen(null))} />
      </ViewTransition>
    : photos.map(p => (
        <ViewTransition key={p.id} name={'photo-' + p.id}>
          <img src={p.thumb} onClick={() =>
            startTransition(() => setOpen(p))} />
        </ViewTransition>
      ));
}`,
      similar: [
        { question: "What is addTransitionType for?", answer: "Called inside startTransition, it labels the cause, such as 'next', so object-valued props can pick different animations." },
        { question: "How do you respect users who prefer less motion?", answer: "Disable or shorten the animation classes inside a prefers-reduced-motion media query." },
      ],
    },
    {
      question: "What is a Fragment ref, and when would you use it?",
      definition: "In React 19.3, <Fragment ref> gives you a FragmentInstance for the fragment's DOM children.",
      answer: "It lets a component attach behaviour to a group of siblings without adding a wrapper element. The FragmentInstance can add event listeners to its first-level DOM children, focus the first or last focusable element, observe them with an IntersectionObserver or ResizeObserver, and measure or scroll them. You need the explicit <Fragment> syntax, not <>...</>.",
      syntax: "<Fragment ref={ref}>{children}</Fragment>\nref.current.focus();",
      code: `function FocusGroup({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.focus(); // first focusable descendant
  }, []);
  return <Fragment ref={ref}>{children}</Fragment>;
}`,
      similar: [
        { question: "Which children do Fragment event listeners attach to?", answer: "Only the first-level host (DOM) children, not deeper descendants." },
        { question: "Can observeUsing watch text nodes?", answer: "No. Observers only work on element children." },
      ],
    },
  ],
  "Rules of Hooks and the complete Hooks cheat sheet": [
    {
      question: "What are the Rules of Hooks, and why do they exist?",
      definition: "Two rules: call Hooks only at the top level, and only from React functions.",
      answer: "React stores each component's Hook state in a list and matches it to Hook calls by order. If a Hook is called inside a condition, loop, nested function or after an early return, the order can change between renders and state gets attached to the wrong Hook. Calling Hooks only from components and custom Hooks keeps them tied to a component's lifecycle.",
      syntax: "function C() {\n  const [a] = useState(0);   // top level: OK\n  if (x) { useEffect(f); }   // conditional: breaks\n}",
      code: `// Wrong: Hook after an early return
function Profile({ user }) {
  if (!user) return <SignIn />;
  const [tab, setTab] = useState('posts'); // order changes
  return <Tabs tab={tab} onChange={setTab} />;
}

// Right: extract a component
function Profile({ user }) {
  return user ? <ProfileTabs /> : <SignIn />;
}`,
      similar: [
        { question: "Which React API may be called conditionally?", answer: "use, which reads promises or context and is allowed inside if statements and loops." },
        { question: "What enforces the rules automatically?", answer: "eslint-plugin-react-hooks; React Compiler also checks many of them." },
      ],
    },
    {
      question: "What does StrictMode do in development?",
      definition: "StrictMode enables extra development-only checks for its subtree.",
      answer: "It renders components twice to expose impure rendering, runs an extra Effect setup and cleanup cycle to expose missing cleanups, re-runs ref callbacks, and warns about deprecated APIs. None of this happens in production. React 19.3 also double-invokes Effects during hydration so server-rendered pages get the same checks.",
      syntax: "<StrictMode>\n  <App />\n</StrictMode>",
      code: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      similar: [
        { question: "Why does my fetch run twice in development?", answer: "StrictMode remounts components to check cleanups; add an ignore flag or AbortController in the Effect's cleanup." },
        { question: "Does StrictMode slow down production?", answer: "No. All its checks are development-only." },
      ],
    },
  ],
};

export const NEXTJS_16_INTERVIEW: InterviewBank = {
  "Routing with the App Router": [
    {
      question: "How does routing work in the Next.js App Router?",
      definition: "The App Router maps folders in the app directory to URL segments and special files to UI.",
      answer: "Each folder is a route segment. A page file makes that segment publicly reachable, and a layout wraps it and every nested route, preserving state across navigations. Square brackets create dynamic segments, [...slug] catch-all segments, and parentheses create route groups that organise files without affecting the URL. The root layout is required and renders html and body.",
      syntax: "app/blog/[slug]/page.tsx  ->  /blog/:slug\napp/(marketing)/about/page.tsx  ->  /about",
      code: `// app/blog/[slug]/page.tsx
export default async function Page(
  props: PageProps<'/blog/[slug]'>
) {
  const { slug } = await props.params; // a Promise in 16
  const post = await getPost(slug);
  return <h1>{post.title}</h1>;
}`,
      similar: [
        { question: "What is the difference between a layout and a template?", answer: "A layout persists and keeps state across navigations; a template re-mounts on every navigation." },
        { question: "What does a route group do?", answer: "A folder in parentheses groups routes or gives them their own layout without adding a URL segment." },
      ],
    },
    {
      question: "Why are params and searchParams Promises in Next.js 16?",
      definition: "In Next.js 16, pages and layouts receive params and searchParams as Promises.",
      answer: "Making them asynchronous lets Next.js start rendering and prerendering parts of the route that do not depend on request data, instead of blocking the whole tree on them. You must await them, or unwrap them with React's use in a Client Component. Reading searchParams opts the page into dynamic rendering because it depends on the request.",
      syntax: "const { slug } = await params;\nconst { q } = await searchParams;",
      code: `export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams;
  const results = await search(q);
  return <Results items={results} />;
}`,
      similar: [
        { question: "Are PageProps and LayoutProps imported?", answer: "No. They are generated globally by next dev, next build or next typegen." },
        { question: "What happens if you destructure params synchronously?", answer: "You get a Promise, not the values; TypeScript flags it and the segment values are undefined." },
      ],
    },
  ],
  "Server and Client Components": [
    {
      question: "How do you decide between a Server and a Client Component?",
      definition: "Server Components are the default; 'use client' opts a module into the browser.",
      answer: "Keep components on the server when they fetch data, use secrets or heavy libraries, or render static content. Use a Client Component when you need state, event handlers, Effects, browser APIs or custom hooks built on them. Push 'use client' as deep as possible, to the interactive leaves, so most of the tree stays on the server and ships no JavaScript.",
      syntax: "'use client'  // first line of the file",
      code: `// app/product/[id]/page.tsx (Server)
import AddToCart from './add-to-cart';

export default async function Page({ params }) {
  const { id } = await params;
  const product = await db.product(id);
  return <><h1>{product.name}</h1><AddToCart id={id} /></>;
}

// app/product/[id]/add-to-cart.tsx
'use client';
export default function AddToCart({ id }) {
  const [qty, setQty] = useState(1);
  return <button onClick={() => add(id, qty)}>Add</button>;
}`,
      similar: [
        { question: "Can you use context in a Server Component?", answer: "No. Wrap providers in a Client Component and render it from the layout." },
        { question: "What does the server-only package do?", answer: "It turns an accidental import of a server module into a client component into a build error." },
      ],
    },
    {
      question: "How can a Client Component render a Server Component?",
      definition: "Client Components cannot import Server Components but can receive them as props.",
      answer: "Pass the Server Component as children or another prop from a Server Component parent. React renders it on the server and passes its output through the Client Component, which just places it. This composition pattern keeps data fetching on the server even inside interactive wrappers such as modals, tabs or providers.",
      syntax: "<ClientModal>\n  <ServerCart />\n</ClientModal>",
      code: `// app/page.tsx (Server)
import Modal from './modal';     // 'use client'
import Cart from './cart';       // Server Component

export default function Page() {
  return (
    <Modal>
      <Cart />  {/* still rendered on the server */}
    </Modal>
  );
}`,
      similar: [
        { question: "What props can cross from server to client?", answer: "Serialisable values: primitives, plain objects, arrays, Dates, Maps, Sets, promises, JSX and Server Functions." },
        { question: "What is hydration?", answer: "React attaching event handlers and state to the server-rendered HTML so it becomes interactive." },
      ],
    },
  ],
  "Fetching data and streaming": [
    {
      question: "How do you fetch data in the App Router, and how do you avoid waterfalls?",
      definition: "Server Components can be async and await data directly.",
      answer: "Await fetch, an ORM or any async function in a Server Component; no useEffect is needed. Sequential awaits create a waterfall where each request waits for the previous one. Start independent requests together and await them with Promise.all, or split them into components under separate Suspense boundaries so each streams when ready.",
      syntax: "const [a, b] = await Promise.all([getA(), getB()]);",
      code: `export default async function Dashboard() {
  // Start both, then await together: parallel, not sequential
  const userPromise = getUser();
  const statsPromise = getStats();
  const [user, stats] = await Promise.all([
    userPromise, statsPromise,
  ]);
  return <Overview user={user} stats={stats} />;
}`,
      similar: [
        { question: "Are fetch requests cached by default in Next.js 16?", answer: "No. They are uncached by default; opt in with use cache and cacheLife." },
        { question: "What does React.cache do?", answer: "It memoises a function for one request, so several components share one query." },
      ],
    },
    {
      question: "What is streaming, and how do loading.tsx and Suspense enable it?",
      definition: "Streaming sends a page in chunks as each part becomes ready.",
      answer: "Next.js sends the static shell first, then streams slower parts as they finish. A loading.tsx file wraps the page in a Suspense boundary with that file as the fallback, so navigation is instant. Finer-grained Suspense boundaries let individual sections, such as a recommendations panel, stream independently of the rest.",
      syntax: "app/dashboard/loading.tsx\n<Suspense fallback={<Skeleton />}>...</Suspense>",
      code: `// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}

// app/dashboard/page.tsx
export default function Page() {
  return (
    <>
      <Summary />
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart />
      </Suspense>
    </>
  );
}`,
      similar: [
        { question: "Why avoid awaiting slow data in a layout?", answer: "It blocks navigation for every page under that layout; await deeper inside a boundary." },
        { question: "What is Partial Prerendering?", answer: "Serving a prerendered static shell instantly while dynamic parts stream in behind Suspense." },
      ],
    },
  ],
  "Caching with Cache Components": [
    {
      question: "How does the use cache directive work in Next.js 16?",
      definition: "use cache caches the return value of an async function, component or file.",
      answer: "With cacheComponents enabled, placing 'use cache' at the top of an async function or component stores its serialised result. Arguments and captured values become part of the cache key. Pair it with cacheLife to set how long the result lives, and cacheTag to invalidate it by name later. Cached output can join the static shell.",
      syntax: "'use cache'\ncacheLife('hours')\ncacheTag('products')",
      code: `import { cacheLife, cacheTag } from 'next/cache';

export async function getProducts(category: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('products');
  return db.product.findMany({ where: { category } });
}`,
      similar: [
        { question: "How do you enable Cache Components?", answer: "Set cacheComponents: true in next.config.ts." },
        { question: "Why can't request data be read inside use cache?", answer: "cookies() or headers() would make the result user-specific; read them outside and pass values as arguments." },
      ],
    },
    {
      question: "What is the difference between revalidatePath, revalidateTag, updateTag and refresh?",
      definition: "They are the ways to invalidate or refresh cached data after a change.",
      answer: "revalidatePath invalidates cached data for a URL. revalidateTag invalidates entries by tag with stale-while-revalidate behaviour. updateTag, used in Server Actions, expires a tag immediately so the user reads their own write. refresh re-renders the current route from a Server Action without invalidating caches. router.refresh on the client refetches Server Components for the route.",
      syntax: "revalidatePath('/posts')\nrevalidateTag('posts', 'max')\nupdateTag('posts')\nrefresh()",
      code: `'use server';
import { updateTag } from 'next/cache';

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: String(formData.get('title')) } });
  updateTag('posts'); // the author sees the new post at once
}`,
      similar: [
        { question: "Do cache entries survive a new deployment?", answer: "No. Entries are scoped to one deployment; a new build starts empty." },
        { question: "What does cacheLife('hours') control?", answer: "The stale, revalidate and expire timings of the cached entry, using a named profile." },
      ],
    },
  ],
  "Mutating data with Server Actions": [
    {
      question: "What are Server Actions, and how do they work with forms?",
      definition: "Server Actions are async server functions, marked 'use server', invoked by forms or client code.",
      answer: "Passing a Server Action to a form's action prop submits the form as a POST to that function, with the form's FormData. It works before JavaScript loads, which is progressive enhancement. After mutating, the action can call revalidatePath or updateTag and redirect, and the response carries both the result and freshly rendered UI in one roundtrip.",
      syntax: "'use server'\nexport async function create(formData: FormData) { ... }\n<form action={create}>",
      code: `// app/actions.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function addTodo(formData: FormData) {
  const user = await auth();
  if (!user) throw new Error('Unauthorized');
  await db.todo.create({ data: { text: String(formData.get('text')), userId: user.id } });
  revalidatePath('/todos');
}

// app/todos/page.tsx
<form action={addTodo}><input name="text" /><button>Add</button></form>`,
      similar: [
        { question: "How do you show a pending state for a Server Action?", answer: "Use useActionState's isPending in the form owner, or useFormStatus in a child of the form." },
        { question: "Why call revalidatePath before redirect?", answer: "redirect throws to stop execution, so any code after it never runs." },
      ],
    },
    {
      question: "How do you secure Server Actions?",
      definition: "Every Server Action is reachable as a public POST endpoint.",
      answer: "Hiding a button is not security: anyone can call the action directly. Inside every action, authenticate the session, authorise the specific operation, for example by re-reading the record by owner, and validate inputs with a schema. Take ids from the client, never whole objects, and never trust client-supplied roles or prices.",
      syntax: "const session = await auth();\nif (!session) throw new Error('Unauthorized');",
      code: `'use server';
import { z } from 'zod';

const Input = z.object({ id: z.string().uuid() });

export async function deleteNote(raw: unknown) {
  const { id } = Input.parse(raw);
  const user = await requireUser();
  const note = await db.note.findFirst({ where: { id, userId: user.id } });
  if (!note) throw new Error('Not found');
  await db.note.delete({ where: { id } });
}`,
      similar: [
        { question: "Are action ids secret?", answer: "They are encrypted and unused actions are removed from bundles, but the endpoint remains publicly callable." },
        { question: "Can actions run in parallel?", answer: "The client dispatches them one at a time; do not rely on parallel actions." },
      ],
    },
  ],
  "Proxy: running code before a request completes": [
    {
      question: "What is Proxy in Next.js 16, and how does it relate to Middleware?",
      definition: "Proxy is the Next.js 16 name for Middleware: code that runs before a matched request completes.",
      answer: "Next.js 16 renamed middleware.ts to proxy.ts with the same behaviour. It runs before routes render and can rewrite, redirect, set headers or respond directly, filtered by a config.matcher. Use it for fast, optimistic checks such as locale routing, A/B buckets or redirecting obviously signed-out users, not for full authorisation or slow data fetching.",
      syntax: "export function proxy(request: NextRequest) { ... }\nexport const config = { matcher: ['/dashboard/:path*'] };",
      code: `// proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (!request.cookies.has('session')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };`,
      similar: [
        { question: "How many proxy files can a project have?", answer: "One. Split logic into modules and import them into proxy.ts." },
        { question: "Is Proxy a security boundary?", answer: "No. Treat it as an optimistic check and still authorise inside pages, Server Actions and Route Handlers." },
      ],
    },
    {
      question: "What is the difference between a rewrite and a redirect?",
      definition: "Both send the request to a different path; only a redirect changes the URL the user sees.",
      answer: "A redirect responds with a 3xx status telling the browser to request a new URL, so the address bar changes and a new request is made. A rewrite serves a different path internally while the URL in the address bar stays the same. Rewrites suit A/B tests and locale routing; redirects suit moved pages and sign-in gates.",
      syntax: "NextResponse.redirect(new URL('/new', req.url))\nNextResponse.rewrite(new URL('/variant', req.url))",
      code: `export function proxy(request: NextRequest) {
  const bucket = request.cookies.get('bucket')?.value ?? 'a';
  if (bucket === 'b') {
    // same URL in the address bar, different page served
    return NextResponse.rewrite(new URL('/pricing-b', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: '/pricing' };`,
      similar: [
        { question: "Where should static redirects go instead?", answer: "In the redirects array of next.config.ts, which needs no runtime code." },
        { question: "Do fetch cache options work inside Proxy?", answer: "No. Caching options have no effect there." },
      ],
    },
  ],
  "Route Handlers for APIs": [
    {
      question: "What are Route Handlers, and when should you use them instead of Server Actions?",
      definition: "Route Handlers are route.ts files exporting functions named after HTTP methods.",
      answer: "They build custom HTTP endpoints with the Web Request and Response APIs. Use them for webhooks, public or mobile APIs, file downloads and anything a non-React client calls. Use Server Actions for mutations triggered from your own React UI, and fetch data in Server Components directly rather than calling your own Route Handler.",
      syntax: "export async function GET(request: Request, ctx) { return Response.json(data); }",
      code: `// app/api/orders/[id]/route.ts
export async function GET(
  _req: Request,
  ctx: RouteContext<'/api/orders/[id]'>
) {
  const { id } = await ctx.params;
  const order = await db.order.find(id);
  if (!order) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json(order);
}`,
      similar: [
        { question: "Can route.ts and page.tsx share a folder?", answer: "No. Both would claim the same URL, which is a build conflict." },
        { question: "What happens for an HTTP method you did not export?", answer: "Next.js responds with 405 Method Not Allowed." },
      ],
    },
    {
      question: "Are Route Handlers cached?",
      definition: "Caching behaviour decides whether a handler's response is reused between requests.",
      answer: "Route Handlers are not cached by default. Only GET handlers can opt in, for example with export const dynamic = 'force-static', or by moving cached work into a helper marked 'use cache'. 'use cache' cannot sit directly in the handler body. Handlers that read cookies, headers or the request are always dynamic.",
      syntax: "export const dynamic = 'force-static';",
      code: `// app/api/countries/route.ts
export const dynamic = 'force-static';

export async function GET() {
  const countries = await loadCountries(); // at build time
  return Response.json(countries);
}`,
      similar: [
        { question: "How do you read query parameters in a handler?", answer: "Use new URL(request.url).searchParams, or request.nextUrl.searchParams with NextRequest." },
        { question: "How do you set cookies in a Route Handler?", answer: "Use the cookies() function from next/headers, or set them on the NextResponse." },
      ],
    },
  ],
  "Images, fonts and metadata": [
    {
      question: "How does next/image improve performance?",
      definition: "next/image extends the img element with automatic optimisation.",
      answer: "It serves correctly sized images in modern formats, lazy-loads offscreen images, and prevents layout shift by reserving space from known width and height. Static imports supply dimensions and a blur placeholder automatically. Remote images need width and height, or fill, plus an images.remotePatterns entry in the config.",
      syntax: "<Image src={hero} alt=\"\" placeholder=\"blur\" priority />",
      code: `import Image from 'next/image';
import hero from './hero.jpg';

export default function Hero() {
  return (
    <Image
      src={hero}               // width and height come from the file
      alt="Students studying together"
      placeholder="blur"
      sizes="100vw"
    />
  );
}`,
      similar: [
        { question: "What is Cumulative Layout Shift?", answer: "A Core Web Vital measuring how much content jumps after it is painted; known image dimensions reduce it." },
        { question: "Why be specific in remotePatterns?", answer: "A broad pattern lets anyone use your optimiser for arbitrary images, costing bandwidth." },
      ],
    },
    {
      question: "How do you set metadata in the App Router?",
      definition: "Metadata is set with a metadata export, a generateMetadata function or special files.",
      answer: "Export a static metadata object from a layout or page for fixed values, or an async generateMetadata function for values that depend on data or params. Special files such as opengraph-image.tsx, icon, robots.ts and sitemap.ts generate the matching tags. Both exports only work in Server Components, and child segments merge with or override their parents.",
      syntax: "export const metadata: Metadata = { title: '...' };\nexport async function generateMetadata({ params }) { ... }",
      code: `import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return { title: post.title, description: post.summary };
}`,
      similar: [
        { question: "How do you avoid fetching the same post twice for metadata and the page?", answer: "Wrap the fetch in React.cache so both calls share one result per request." },
        { question: "Why use next/font?", answer: "It self-hosts fonts at build time, removing third-party requests and preventing layout shift." },
      ],
    },
  ],
  "Next.js hooks: reading the URL": [
    {
      question: "What is the difference between usePathname, useSearchParams and useParams?",
      definition: "They are Client Component hooks from next/navigation that read different parts of the URL.",
      answer: "usePathname returns the path without the query string, such as '/shop/shoes'. useSearchParams returns a read-only URLSearchParams for the query string. useParams returns the route's dynamic segments as an object, such as { tag: 'shoes' }, with arrays for catch-all segments. All require 'use client'; Server Component pages read params and searchParams props instead.",
      syntax: "const pathname = usePathname();\nconst searchParams = useSearchParams();\nconst params = useParams<{ tag: string }>();",
      code: `'use client';
import { useParams, usePathname, useSearchParams } from 'next/navigation';

export function Crumb() {
  const pathname = usePathname();          // '/shop/shoes'
  const { tag } = useParams<{ tag: string }>(); // 'shoes'
  const sort = useSearchParams().get('sort');   // 'price'
  return <p>{tag} / {sort} ({pathname})</p>;
}`,
      similar: [
        { question: "Why can't Server Components use usePathname?", answer: "By design: layouts are preserved across navigations, so they must not depend on the current URL." },
        { question: "How do you update the query string?", answer: "Build a new URLSearchParams from the current one and navigate with router.push or a Link." },
      ],
    },
    {
      question: "Why must useSearchParams often be wrapped in Suspense?",
      definition: "On a prerendered route, the query string is unknown at build time.",
      answer: "When a static route is prerendered, a Client Component calling useSearchParams cannot know the query, so Next.js client-renders the tree up to the nearest Suspense boundary. Without a boundary, a production build fails. Wrapping just the component in Suspense keeps everything else in the static HTML, with the fallback shown until hydration.",
      syntax: "<Suspense fallback={<SearchSkeleton />}>\n  <SearchBar />\n</Suspense>",
      code: `// app/dashboard/page.tsx
import { Suspense } from 'react';
import SearchBar from './search-bar'; // uses useSearchParams

export default function Page() {
  return (
    <>
      <Suspense fallback={<input disabled placeholder="Search" />}>
        <SearchBar />
      </Suspense>
      <h1>Dashboard</h1>
    </>
  );
}`,
      similar: [
        { question: "Does useSearchParams suspend in development?", answer: "No. Routes render on demand in development, so a missing boundary only surfaces in production builds." },
        { question: "What is an alternative for dynamic pages?", answer: "Call await connection() in the Server Component page, or read the searchParams prop and pass values down." },
      ],
    },
  ],
  "Next.js hooks: navigating with useRouter and useLinkStatus": [
    {
      question: "When should you use useRouter instead of the Link component?",
      definition: "useRouter, from next/navigation, navigates programmatically from Client Components.",
      answer: "Prefer Link for normal navigation because it renders a real anchor, prefetches routes in view and works without JavaScript. Use useRouter when navigation happens as a result of code, such as after a form succeeds or a timeout, or to refresh Server Components with router.refresh. push adds a history entry; replace does not.",
      syntax: "const router = useRouter();\nrouter.push('/dashboard', { scroll: false });\nrouter.replace('/sign-in');\nrouter.refresh();",
      code: `'use client';
import { useRouter } from 'next/navigation';

export function CheckoutButton() {
  const router = useRouter();
  async function pay() {
    const ok = await submitPayment();
    if (ok) router.push('/thanks');
    else router.refresh(); // re-render server data
  }
  return <button onClick={pay}>Pay</button>;
}`,
      similar: [
        { question: "Where do pathname and query live in the App Router?", answer: "In usePathname and useSearchParams; they were removed from the router object." },
        { question: "Why never pass untrusted URLs to router.push?", answer: "A javascript: URL would run in your page, which is a cross-site scripting risk." },
      ],
    },
    {
      question: "What is useLinkStatus, and when is it useful?",
      definition: "useLinkStatus, from next/link, returns { pending } for the parent Link's navigation.",
      answer: "It lets a component inside a Link show inline feedback, such as a shimmer or spinner, while a navigation is pending. It is most useful when prefetching is disabled or incomplete and the destination is dynamic without a loading.tsx. For prefetched routes the pending phase is skipped, so first consider prefetching or a loading file.",
      syntax: "const { pending } = useLinkStatus();",
      code: `'use client';
import Link, { useLinkStatus } from 'next/link';

function Hint() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={pending ? 'hint on' : 'hint'} />;
}

export const Nav = () => (
  <Link href="/reports" prefetch={false}>Reports <Hint /></Link>
);`,
      similar: [
        { question: "Where must useLinkStatus be called?", answer: "In a component rendered inside a Link; it reports on that parent Link only." },
        { question: "How do you avoid layout shift with a pending hint?", answer: "Render a fixed-size element and toggle its opacity or animation instead of mounting it." },
      ],
    },
  ],
  "Next.js hooks: layout segments, web vitals and offline status": [
    {
      question: "What do useSelectedLayoutSegment and useSelectedLayoutSegments return?",
      definition: "They read the active route segments below the layout that renders the calling component.",
      answer: "useSelectedLayoutSegment returns the active segment one level below the layout, or null, which suits tab bars that highlight the active child route. useSelectedLayoutSegments returns every active segment below the layout as an array, which suits breadcrumbs. Both are Client Component hooks and accept an optional parallelRouteKey for parallel route slots.",
      syntax: "const segment = useSelectedLayoutSegment(parallelRouteKey?);\nconst segments = useSelectedLayoutSegments(parallelRouteKey?);",
      code: `'use client';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';

export function Breadcrumbs() {
  const segments = useSelectedLayoutSegments()
    .filter(s => !s.startsWith('('));   // drop route groups
  return segments.map((s, i) => (
    <Link key={s} href={'/' + segments.slice(0, i + 1).join('/')}>{s}</Link>
  ));
}`,
      similar: [
        { question: "What does useSelectedLayoutSegment return in app/layout.js for '/'?", answer: "null, because there is no active segment below the root layout." },
        { question: "How are catch-all segments returned?", answer: "As a single joined string, for example 'a/b/c'." },
      ],
    },
    {
      question: "How do you report Core Web Vitals and detect offline status in Next.js 16?",
      definition: "useReportWebVitals reports performance metrics; useOffline reports connectivity.",
      answer: "useReportWebVitals, from next/web-vitals, calls your callback with metrics such as LCP, CLS, INP and TTFB, each with a name, value and rating; send them to analytics with navigator.sendBeacon and keep the callback stable. useOffline, from next/offline, is experimental: with experimental.useOffline enabled it returns true while the app is offline and Next.js retries blocked requests on reconnect.",
      syntax: "useReportWebVitals(metric => send(metric));\nconst isOffline = useOffline();",
      code: `'use client';
import { useReportWebVitals } from 'next/web-vitals';
import { useOffline } from 'next/offline';

const send = (m: { name: string; value: number }) =>
  navigator.sendBeacon('/api/vitals', JSON.stringify(m));

export function Monitoring() {
  useReportWebVitals(send);
  const isOffline = useOffline(); // false without the flag
  return isOffline ? <p role="status">You are offline</p> : null;
}`,
      similar: [
        { question: "Why must the web vitals callback keep a stable identity?", answer: "A new function is called with all metrics so far, which would report duplicates." },
        { question: "What does useOffline return on the server?", answer: "false, which is also its value before hydration completes." },
      ],
    },
  ],
};
