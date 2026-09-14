import type { Lesson } from "@/lib/domain";

/**
 * One lesson appended to the Zustand path, covering the two things the main
 * guide does not: transient updates (imperative `subscribe` that bypasses React
 * rendering entirely) and writing your own middleware.
 *
 * The rest of the Zustand surface — create, selectors, set/get, shallow
 * merging and the replace flag, async actions, useShallow, persist, devtools,
 * immer, the slices pattern, TypeScript, store access outside React, and
 * testing — already has a lesson in ./zustand.ts.
 */
export const ZUSTAND_ADDITIONS: Lesson[] = [
  {
    title: "Transient updates and writing your own middleware",
    diagram: {
      kind: "split",
      caption: "Two ways to consume a store. The hook re-renders a component when its slice changes; subscribe hands you the value with no render at all — which is what makes 60fps updates possible.",
      headings: ["useStore selector (renders)", "store.subscribe (transient)"],
      items: [
        { label: "const x = useStore(s => s.x)", detail: "component re-renders on change", group: 0 },
        { label: "React reconciliation runs", detail: "fine at interaction speed", group: 0 },
        { label: "Right for anything the user reads", detail: "text, lists, conditional UI", group: 0 },
        { label: "Batched by React", detail: "consistent with the rest of the tree", group: 0 },
        { label: "store.subscribe(cb)", detail: "called on every change, no render", group: 1 },
        { label: "Write to a ref or the DOM", detail: "element.style.transform = ...", group: 1 },
        { label: "Right for pointer, scroll, animation", detail: "many updates per second", group: 1 },
        { label: "You own cleanup", detail: "unsubscribe in the Effect's teardown", group: 1 },
      ],
    },
    explanation: "- Every Zustand store is usable outside React: `store.getState()`, `store.setState()` and `store.subscribe(listener)` exist on the store object the `create` call returns\n- A transient update is a subscription that deliberately does not re-render: the listener writes straight to a ref or a DOM node, so a value changing sixty times a second costs no reconciliation\n- This is the right shape for pointer position, scroll offset, a drag handle, a canvas or game loop, and a progress value that updates continuously — anything where React's render cost per frame is the problem\n- The `subscribeWithSelector` middleware upgrades `subscribe` to take a selector and options, so the listener fires only when the selected slice changes, and `fireImmediately` gives the current value at subscription time\n- Always subscribe inside an Effect and return the unsubscribe function; a subscription that outlives its component leaks and can write to a detached node\n- Keep transient updates for presentation. If application logic depends on the value, keep that in state a component reads, or you end up with two sources of truth\n- Middleware in Zustand is a function wrapping the store initialiser: it receives `(set, get, api)`, returns a new initialiser, and can intercept every `set` call\n- That is all `devtools`, `persist` and `immer` are — which means a logger, an undo stack, a validation layer or an analytics hook is a dozen lines you write yourself\n- Order matters when composing middleware: the outermost wrapper sees calls first. `devtools(persist(fn))` and `persist(devtools(fn))` produce different DevTools output\n- Typing custom middleware precisely is the awkward part; for app-level middleware a pragmatic `StateCreator` signature is usually enough, and the deep generic form is only needed for a library\n- Middleware is also where you put cross-cutting invariants: reject an impossible state transition, stamp an updatedAt, or emit a metric on every mutation, in one place rather than in every action",
    keyPoints: [
      { tone: "key", title: "subscribe is the render-free path", text: "A listener that writes to the DOM skips reconciliation entirely, which is the only way to do continuous updates at frame rate without dropping frames." },
      { tone: "key", title: "Middleware is just a wrapper around the initialiser", text: "It takes (set, get, api) and returns a new initialiser, so intercepting every mutation for logging, validation or metrics is a small amount of code." },
      { tone: "key", title: "Unsubscribe in the Effect teardown", text: "A subscription outliving its component writes to a node that is no longer mounted, which leaks memory and can throw." },
      { tone: "tip", title: "subscribeWithSelector narrows the firing", text: "It lets subscribe take a selector and an equality function, so the listener runs only when the slice it cares about changes." },
      { tone: "tip", title: "fireImmediately avoids the first-frame gap", text: "Without it, a transient subscriber shows nothing until the next change, which is visible on mount." },
      { tone: "tip", title: "Compose middleware deliberately", text: "The outermost middleware sees set calls first; devtools(persist(fn)) and persist(devtools(fn)) log different things." },
      { tone: "warning", title: "Do not hide application state in a ref", text: "Transient values are presentation. If a decision depends on one, keep it in state something renders from." },
      { tone: "warning", title: "Middleware that swallows set breaks debugging", text: "If your middleware can reject a mutation, log the rejection; a silently dropped update is far harder to diagnose than an error." },
    ],
    example: "- A cursor follower updates transform on every mousemove with no component re-render\n- A scroll progress bar sets width directly from a subscription, at 60fps\n- subscribeWithSelector fires only when `cart.total` changes, not on every cart edit\n- A ten-line logger middleware prints every action's before and after state in development\n- A validation middleware refuses a negative quantity and logs the rejected update",
    code: "// store.ts — subscribeWithSelector enables selector-based transient subscriptions.\nimport { create } from 'zustand';\nimport { subscribeWithSelector } from 'zustand/middleware';\nimport type { StateCreator } from 'zustand';\n\ntype PointerState = { x: number; y: number; dragging: boolean; move: (x: number, y: number) => void };\n\n// A custom middleware: it wraps the initialiser and intercepts every set call.\nconst logger = <T>(config: StateCreator<T>, name = 'store'): StateCreator<T> =>\n  (set, get, api) => config(\n    (...args) => {\n      const before = get();\n      set(...(args as Parameters<typeof set>));\n      if (process.env.NODE_ENV !== 'production') console.debug(`[${name}]`, { before, after: get() });\n    },\n    get,\n    api,\n  );\n\n// A validating middleware: cross-cutting invariants in one place, not in every action.\nconst nonNegative = <T extends { quantity?: number }>(config: StateCreator<T>): StateCreator<T> =>\n  (set, get, api) => config(\n    (partial, replace) => {\n      const next = typeof partial === 'function' ? (partial as (s: T) => Partial<T>)(get()) : partial;\n      if (typeof next.quantity === 'number' && next.quantity < 0) {\n        console.warn('[store] rejected a negative quantity', next);   // never swallow silently\n        return;\n      }\n      set(partial as never, replace as never);\n    },\n    get,\n    api,\n  );\n\nexport const usePointer = create<PointerState>()(\n  subscribeWithSelector(logger(nonNegative((set) => ({\n    x: 0, y: 0, dragging: false,\n    move: (x, y) => set({ x, y }),\n  })), 'pointer')),\n);\n\n// Cursor.tsx — a transient subscription: sixty updates a second, zero re-renders.\nimport { useEffect, useRef } from 'react';\n\nexport function Cursor() {\n  const dot = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    // Select only what this subscriber needs; fireImmediately paints the first frame.\n    const unsubscribe = usePointer.subscribe(\n      state => [state.x, state.y] as const,\n      ([x, y]) => { if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`; },\n      { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1], fireImmediately: true },\n    );\n    return unsubscribe;            // the store outlives the component; the subscription must not\n  }, []);\n\n  return <div ref={dot} className=\"cursor-dot\" />;\n}\n\n// Anything outside React uses the same store object.\n// window.addEventListener('mousemove', e => usePointer.getState().move(e.clientX, e.clientY));",
    apiReference: [
      {
        name: "store.subscribe",
        kind: "API",
        signature: "subscribe(listener: (state, previousState) => void): () => void  — with subscribeWithSelector: subscribe(selector, listener, { equalityFn?, fireImmediately? })",
        params: [
          { name: "selector", type: "(state) => slice", description: "Only available with subscribeWithSelector; narrows when the listener fires." },
          { name: "equalityFn", type: "(a, b) => boolean", description: "Comparison deciding whether the slice changed." },
          { name: "fireImmediately", type: "boolean", description: "Call the listener once at subscription time with the current value." },
        ],
        returns: "An unsubscribe function you must call on teardown.",
        notes: "Listeners run outside React rendering, so updates here never cause a re-render.",
      },
      {
        name: "Custom middleware",
        kind: "pattern",
        signature: "(config: StateCreator<T>) => StateCreator<T> = config => (set, get, api) => config(wrappedSet, get, api)",
        params: [
          { name: "set", type: "function", description: "Wrap it to observe, transform or reject every mutation." },
          { name: "get", type: "function", description: "Read current state inside the wrapper, before and after." },
          { name: "api", type: "StoreApi", description: "The store instance, including subscribe and setState." },
        ],
        returns: "A store initialiser with behaviour layered around every set call.",
        notes: "Composition order matters: the outermost middleware intercepts first.",
      },
    ],
    vocabulary: [
      { word: "Transient update", meaning: "A state change consumed imperatively without triggering a React render.", example: "Writing a transform on every mousemove.", synonyms: ["render-free update", "imperative update", "out-of-band update", "direct DOM write", "subscription-driven change", "no-render update"], antonyms: ["reactive render", "hook subscription", "state-driven render", "hook-driven render", "state update", "reconciled change"] },
      { word: "Subscription", meaning: "A listener registered with the store that runs on every relevant change.", example: "store.subscribe(selector, listener).", synonyms: ["listener", "observer", "watcher", "change listener", "store watcher", "callback registration"], antonyms: ["one-off read", "getState snapshot", "one-time getState", "static snapshot", "polling"] },
      { word: "Middleware", meaning: "A function wrapping a store initialiser to intercept its set calls.", example: "A logger printing before and after state.", synonyms: ["store enhancer", "wrapper", "interceptor", "set interceptor", "store decorator", "behaviour layer"], antonyms: ["bare initialiser", "plain store", "raw store", "unwrapped creator", "direct mutation"] },
      { word: "Equality function", meaning: "The comparison that decides whether a selected slice actually changed.", example: "Comparing two coordinates element by element.", synonyms: ["comparator", "shallow compare", "change detector", "change test", "diff check", "selector comparator"], antonyms: ["reference identity", "always-changed", "identity check", "always re-render", "no comparison"] },
      { word: "Unsubscribe", meaning: "The teardown function that detaches a listener from the store.", example: "Returned from subscribe and called in an Effect cleanup.", synonyms: ["teardown", "cleanup", "detach", "listener removal", "disposal function"], antonyms: ["leaked listener", "dangling subscription", "persistent listener", "memory leak", "orphaned callback"] },
      { word: "Store API", meaning: "The object with getState, setState and subscribe, usable anywhere.", example: "useStore.getState() in an event handler.", synonyms: ["store instance", "vanilla store", "vanilla interface", "framework-free access", "imperative handle"], antonyms: ["hook-only access", "component-scoped state", "React hook only", "component-bound access", "render-time read"] },
    ],
    useCase: {
      scenario: "A canvas editor stores pointer position and a drag offset in a Zustand store and reads them with hooks. Dragging re-renders a tree of forty components on every mousemove, and the interaction visibly drops frames on a mid-range laptop.",
      example: "Pointer coordinates move to a transient subscription: components that draw the cursor and the drag ghost subscribe with subscribeWithSelector and write transforms directly to their refs, with fireImmediately for the first frame and the unsubscribe returned from the Effect. Anything a user reads as text — the selected shape's name, the layer list — keeps using selector hooks. A small logger middleware records every mutation in development, and a validation middleware rejects out-of-bounds coordinates in one place.",
      usage: "Dragging becomes smooth because no reconciliation happens per frame, while the parts of the UI that genuinely need re-rendering are unchanged and still debuggable.",
    },
    exercise: "- Convert one high-frequency value from a selector hook to a transient subscription, and measure the render count\n- Add subscribeWithSelector and fire only on the slice you need, with fireImmediately for the first paint\n- Write a ten-line logger middleware printing before and after state in development only\n- Add a validating middleware that rejects one impossible state transition and logs the rejection",
    checkpoint: "- What does a transient subscription avoid, and what do you take responsibility for?\n- What exactly is a Zustand middleware, mechanically?\n- Why does the order of composed middleware matter?",
    mistake: "- Do not forget to return the unsubscribe function; the listener will outlive the component\n- Do not keep decision-making state only in a ref written by a subscription\n- Do not let middleware drop a set call silently; log every rejection",
    interview: [
      {
        question: "What is a transient update in Zustand, and when is it the right tool?",
        definition: "A subscription that receives state changes imperatively and writes to the DOM or a ref, without triggering a React render.",
        answer: "Reading state with a selector hook re-renders the component whenever that slice changes, which is correct for anything the user reads as UI. For values that change many times a second — pointer position, scroll offset, a drag ghost, an animation value — that render cost is the bottleneck. store.subscribe hands the new value to a listener outside React, so the listener can set a transform directly on a ref'd node at frame rate with no reconciliation. The trade is that you own the lifecycle: subscribe inside an Effect, return the unsubscribe, and keep the pattern for presentation rather than for state that logic depends on.",
        similar: [
          { question: "What does subscribeWithSelector add?", answer: "Selector and equality-function support on subscribe, plus fireImmediately, so the listener runs only for the slice it needs." },
          { question: "Can you use the store outside React entirely?", answer: "Yes — getState, setState and subscribe are on the store object, so event listeners and non-React code use the same store." },
        ],
      },
      {
        question: "How does Zustand middleware work, and what would you write your own for?",
        definition: "Middleware is a function that wraps a store initialiser and intercepts its set calls before delegating.",
        answer: "It receives (set, get, api) and returns the result of calling the original initialiser with a wrapped set, so every mutation passes through your code. That is exactly how devtools, persist and immer are built. Custom middleware is worth writing for cross-cutting concerns you would otherwise repeat in every action: a development logger, an undo stack, an updatedAt stamp, an analytics event per mutation, or a validation layer that refuses impossible transitions. Two practical points: composition order matters, because the outermost wrapper intercepts first, and any middleware that can reject a mutation should log the rejection rather than dropping it silently.",
        similar: [
          { question: "Why is typing custom middleware awkward?", answer: "The deep generic signature exists so middleware can add to the store's type; for app-level middleware a plain StateCreator signature is usually enough." },
          { question: "Does middleware affect transient subscriptions?", answer: "Yes — subscribe listeners see the state after middleware has run, since middleware wraps the set that produces it." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "Which approach updates the DOM sixty times a second without re-rendering components?",
        options: ["useStore with a narrow selector", "useStore with useShallow", "store.subscribe writing to a ref inside an Effect", "Calling setState in a requestAnimationFrame loop"],
        correct: 2,
        shortAnswer: "store.subscribe writing to a ref",
        explanation: "A subscription runs outside React's render cycle, so the listener can write a style or a transform straight to a DOM node with no reconciliation. Selector hooks, with or without shallow comparison, still re-render the component when the slice changes, and calling setState in an animation loop causes a render per frame.",
      },
      {
        question: "What is Zustand middleware, mechanically?",
        options: ["A React context provider around the store", "A function that wraps the store initialiser and intercepts set calls", "A plugin registered with the Zustand runtime", "A selector applied to every read"],
        correct: 1,
        shortAnswer: "A wrapper around the initialiser that intercepts set",
        explanation: "Middleware takes the store's initialiser, and returns a new one that calls it with a wrapped set, plus get and api. Because every mutation flows through that wrapper, logging, persistence, devtools integration and validation are all expressible the same way — which is exactly how the built-in middleware is implemented.",
      },
      {
        question: "What must a component do after calling store.subscribe inside an Effect?",
        options: ["Call store.getState() on unmount", "Return the unsubscribe function from the Effect", "Wrap the listener in useCallback", "Re-subscribe on every render"],
        correct: 1,
        shortAnswer: "Return the unsubscribe function",
        explanation: "subscribe returns an unsubscribe function, and returning it from the Effect makes React call it on unmount. Without that, the listener survives the component and keeps writing to a node that is no longer mounted, which leaks and can throw. The other options do not detach the listener.",
      },
    ],
  },
];
