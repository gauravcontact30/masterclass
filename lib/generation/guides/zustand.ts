import type { TechnologyGuide } from "./index";
import { source } from "./shared";
import { ZUSTAND_ADDITIONS } from "./zustand-additions";
import { ZUSTAND_LESSONS } from "@/lib/notes-zustand-fundamentals";
import { expandGuide } from "../guide-expansions";

/** Zustand v5 state management for React, grounded in zustand.docs.pmnd.rs and the pmndrs/zustand repository docs. */
const guide: TechnologyGuide = {
  id: "zustand",
  technologyId: "zustand",
  topicId: "zustand-5",
  level: "intermediate",
  curriculum: {
    title: "Zustand 5: small, fast React state",
    minutes: 140,
    objectives: [
      "Create a Zustand store and read it with selector hooks.",
      "Update state immutably with set and get, including nested updates.",
      "Prevent unnecessary re-renders with precise selectors and useShallow.",
      "Add persist, devtools, immer and subscribeWithSelector middleware.",
      "Type stores with TypeScript and split large stores into slices.",
      "Use stores outside React, in Next.js, and in tests.",
    ],
    prerequisites: [
      "React 18+ and Hooks (Zustand 5 requires React 18).",
      "TypeScript basics for the typing lesson.",
      "npm install zustand",
    ],
    lessons: [
      {
        title: "Your first store",
        diagram: {
          kind: "flow",
          caption: "A Zustand store lives outside React. Components subscribe with a selector and re-render only when the value they selected changes.",
          items: [
            { label: "create((set) => ({ ...state, ...actions }))", detail: "returns a hook" },
            { label: "Store holds state + actions", detail: "outside the component tree" },
            { label: "useStore(state => state.count)", detail: "component selects a slice" },
            { label: "An action calls set(...)", detail: "state is merged shallowly" },
            { label: "Subscribers compare their selection", detail: "only changed ones re-render" },
          ],
        },
        explanation: "- create builds a store and returns a hook bound to it\n- The initialiser receives set (and get) and returns state plus actions\n- Components call the hook with a selector to read exactly what they need\n- set merges the object you pass into state (one level deep)\n- No Provider is needed: the store is a module-level singleton",
        keyPoints: [
          { tone: "key", text: "Always select: useBearStore(s => s.bears), not useBearStore(), which subscribes to everything." },
          { tone: "tip", text: "Keep actions in the store next to the state they change; components just call them." },
          { tone: "warning", text: "Zustand 5 has no default export: import { create } from 'zustand'." },
        ],
        example: "- const useBearStore = create(set => ({ bears: 0, increase: () => set(s => ({ bears: s.bears + 1 })) }))\n- const bears = useBearStore(s => s.bears)\n- const increase = useBearStore(s => s.increase)\n- Two components using the store share the same state without a Provider",
        code: "import { create } from 'zustand';\n\ntype CounterState = {\n  count: number;\n  increase: (by?: number) => void;\n  reset: () => void;\n};\n\nexport const useCounterStore = create<CounterState>()((set) => ({\n  count: 0,\n  increase: (by = 1) => set((state) => ({ count: state.count + by })),\n  reset: () => set({ count: 0 }),\n}));\n\nfunction Count() {\n  const count = useCounterStore((s) => s.count);      // re-renders on count only\n  return <h1>{count}</h1>;\n}\n\nfunction Controls() {\n  const increase = useCounterStore((s) => s.increase); // stable action reference\n  const reset = useCounterStore((s) => s.reset);\n  return (\n    <>\n      <button onClick={() => increase()}>+1</button>\n      <button onClick={reset}>Reset</button>\n    </>\n  );\n}",
        apiReference: [
          {
            name: "create",
            kind: "function",
            signature: "const useStore = create<State>()((set, get, store) => initialState)",
            params: [
              { name: "set", type: "(partial | (state) => partial, replace?) => void", description: "Merge a partial state; pass replace: true to replace it." },
              { name: "get", type: "() => State", description: "Read the current state inside actions." },
            ],
            returns: "A React hook useStore(selector) that also exposes getState, setState and subscribe.",
          },
        ],
        exercise: "- Build a counter store with increase, decrease and reset\n- Read the count in two separate components and confirm they stay in sync\n- Log renders to prove a component selecting an action does not re-render on count changes",
        checkpoint: "- Why doesn't Zustand need a Provider?\n- What does set do with the object you pass it?\n- Why should components always pass a selector?",
        mistake: "- Do not call the hook without a selector in large components\n- Do not use a default import from 'zustand'\n- Do not put component-local UI state in a global store",
        interview: [
          {
            question: "How does Zustand differ from React Context for shared state?",
            definition: "Context passes a value down the tree; Zustand is an external store that components subscribe to with selectors.",
            answer: "When a Context value changes, every consumer re-renders, so large contexts cause wide re-renders unless split carefully. A Zustand store lives outside React and uses useSyncExternalStore under the hood; each component re-renders only when the slice returned by its selector changes. Zustand also needs no Provider and its actions can be called outside components.",
            similar: [
              { question: "When is Context still the better choice?", answer: "For rarely changing values scoped to a subtree, such as a theme or dependency injection, where a library is unnecessary." },
            ],
          },
        ],
      },
      {
        title: "Updating state: set, get and nested data",
        diagram: {
          kind: "split",
          caption: "set merges only the top level. Nested objects must be copied yourself, or you can let the immer middleware produce the copy from 'mutating' code.",
          headings: ["Plain set", "With immer middleware"],
          items: [
            { label: "set(s => ({ user: { ...s.user, name } }))", detail: "spread every level you change", group: 0 },
            { label: "Works everywhere, no extra package", group: 0 },
            { label: "Verbose for deep objects", group: 0 },
            { label: "set(s => { s.user.name = name })", detail: "write it like mutation", group: 1 },
            { label: "Immer produces the immutable copy", group: 1 },
            { label: "Requires the immer package", group: 1 },
          ],
        },
        explanation: "- Pass an object to set for simple updates, or a function (state) => partial when the next value depends on the current one\n- set merges one level deep; nested objects need spreading\n- get() reads the latest state inside actions, useful for async flows\n- Async actions are plain async functions that call set when data arrives\n- set(state, true) replaces the whole state instead of merging",
        keyPoints: [
          { tone: "key", text: "Never mutate state directly (state.items.push(x)); Zustand compares references to detect changes." },
          { tone: "tip", text: "Track loading and error state in the store for async actions: { status: 'idle' | 'loading' | 'error' }." },
          { tone: "warning", text: "Replacing state with set(x, true) drops actions unless x includes them." },
        ],
        example: "- set({ open: true }) merges one flag\n- set(s => ({ todos: [...s.todos, todo] })) appends immutably\n- set(s => ({ user: { ...s.user, address: { ...s.user.address, city } } })) updates deep data\n- fetchTodos: async () => { set({ status: 'loading' }); const todos = await api(); set({ todos, status: 'idle' }) }",
        code: "import { create } from 'zustand';\n\ntype Todo = { id: string; title: string; done: boolean };\ntype TodoState = {\n  todos: Todo[];\n  status: 'idle' | 'loading' | 'error';\n  add: (title: string) => void;\n  toggle: (id: string) => void;\n  load: () => Promise<void>;\n};\n\nexport const useTodoStore = create<TodoState>()((set, get) => ({\n  todos: [],\n  status: 'idle',\n  add: (title) =>\n    set((s) => ({ todos: [...s.todos, { id: crypto.randomUUID(), title, done: false }] })),\n  toggle: (id) =>\n    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),\n  load: async () => {\n    if (get().status === 'loading') return;      // read the latest state\n    set({ status: 'loading' });\n    try {\n      const todos: Todo[] = await fetch('/api/todos').then((r) => r.json());\n      set({ todos, status: 'idle' });\n    } catch {\n      set({ status: 'error' });\n    }\n  },\n}));",
        exercise: "- Add remove and clearCompleted actions without mutating the array\n- Update a nested address field with and without the immer middleware\n- Add an async load action with loading and error states",
        checkpoint: "- How deep does set merge?\n- When do you need get()?\n- What does the second argument to set do?",
        mistake: "- Do not mutate arrays or objects in place\n- Do not forget to spread nested objects you change\n- Do not replace state accidentally and lose actions",
      },
      {
        title: "Selectors, useShallow and re-renders",
        diagram: {
          kind: "flow",
          caption: "Zustand re-renders a component when its selector's result changes by Object.is. A selector that builds a new object every time always looks 'changed' — useShallow compares its contents instead.",
          items: [
            { label: "Selector runs after every store change", detail: "s => ({ a: s.a, b: s.b })" },
            { label: "New object each time", detail: "Object.is(prev, next) is false" },
            { label: "Without useShallow", detail: "re-render on every change (and loops in v5)" },
            { label: "With useShallow(selector)", detail: "compares keys shallowly" },
            { label: "Re-render only if a or b changed", detail: "stable output" },
          ],
        },
        explanation: "- Selecting a primitive (s.count) is already optimal\n- Selecting several values into a new object or array needs useShallow\n- useShallow is imported from 'zustand/react/shallow'\n- Derive computed values inside the selector: s => s.todos.filter(t => !t.done).length\n- For custom equality, Zustand 5 moved equality functions to createWithEqualityFn in 'zustand/traditional'",
        keyPoints: [
          { tone: "key", text: "In Zustand 5 a selector returning a new reference every call can cause an infinite render loop; wrap it in useShallow." },
          { tone: "tip", text: "Selecting several separate primitives with several hook calls is also fine and very clear." },
          { tone: "tip", text: "Return primitives from derived selectors (a count, not a filtered array) when possible." },
        ],
        example: "- const count = useStore(s => s.count) is fine as is\n- const { nuts, honey } = useStore(useShallow(s => ({ nuts: s.nuts, honey: s.honey })))\n- const [a, b] = useStore(useShallow(s => [s.a, s.b]))\n- const remaining = useTodoStore(s => s.todos.filter(t => !t.done).length)",
        code: "import { create } from 'zustand';\nimport { useShallow } from 'zustand/react/shallow';\n\ntype BearState = { nuts: number; honey: number; bears: number; eat: () => void };\n\nconst useBearStore = create<BearState>()((set) => ({\n  nuts: 0,\n  honey: 0,\n  bears: 2,\n  eat: () => set((s) => ({ honey: Math.max(0, s.honey - 1) })),\n}));\n\nfunction Pantry() {\n  // new object each call -> needs useShallow\n  const { nuts, honey } = useBearStore(useShallow((s) => ({ nuts: s.nuts, honey: s.honey })));\n  return <p>{nuts} nuts, {honey} honey</p>;\n}\n\nfunction BearCount() {\n  // primitive -> no useShallow needed; ignores nuts/honey changes\n  const bears = useBearStore((s) => s.bears);\n  return <p>{bears} bears</p>;\n}\n\nfunction HungryBadge() {\n  // derived primitive\n  const hungry = useBearStore((s) => s.honey < s.bears);\n  return hungry ? <span>Hungry!</span> : null;\n}",
        apiReference: [
          {
            name: "useShallow",
            kind: "hook helper",
            signature: "import { useShallow } from 'zustand/react/shallow'\nuseStore(useShallow(selector))",
            params: [{ name: "selector", type: "(state) => object | array", description: "A selector that returns a new object or array." }],
            returns: "A memoised selector whose result keeps its identity while its top-level values are unchanged.",
          },
        ],
        exercise: "- Select two values into an object and observe re-renders with and without useShallow\n- Rewrite a selector that returns a filtered array to return a count\n- Split one component's big selection into several primitive selections",
        checkpoint: "- Why does a selector that returns a new object cause extra renders?\n- Where is useShallow imported from?\n- How do you use a custom equality function in Zustand 5?",
        mistake: "- Do not return new objects or arrays from selectors without useShallow\n- Do not select the entire state in leaf components\n- Do not compute expensive derived data in many components; compute once in a selector or store",
        interview: [
          {
            question: "What does useShallow solve in Zustand?",
            definition: "useShallow wraps a selector so its object or array result is compared by its top-level values rather than by reference.",
            answer: "A selector like s => ({ a: s.a, b: s.b }) creates a new object on every run, so Zustand's Object.is check always sees a change, causing re-renders and, in Zustand 5, potentially an infinite loop. useShallow returns the previous result when all top-level values are equal, so the component re-renders only when a or b actually changes.",
            similar: [
              { question: "Is useShallow needed for s => s.count?", answer: "No. Primitives compare by value, so Object.is already works." },
            ],
          },
        ],
      },
      {
        title: "Middleware: persist, devtools, immer and more",
        diagram: {
          kind: "tree",
          caption: "Middleware wraps the store initialiser. Order matters: devtools usually sits outermost so it records every action, and persist wraps the state you want saved.",
          items: [
            { label: "devtools(...)", detail: "Redux DevTools timeline; name actions" },
            { label: "persist(...)", detail: "save/load state from storage", depth: 1 },
            { label: "name, storage: createJSONStorage(() => localStorage)", depth: 2 },
            { label: "partialize, version, migrate", depth: 2 },
            { label: "immer(...)", detail: "mutable-style updates", depth: 2 },
            { label: "(set, get) => ({ ... })", detail: "your state and actions", depth: 3 },
            { label: "subscribeWithSelector", detail: "subscribe to one slice outside React" },
            { label: "combine(initialState, actions)", detail: "infer types from initial state" },
          ],
        },
        explanation: "- Middleware functions wrap the initialiser: create()(devtools(persist(immer(...))))\n- persist saves state to localStorage (default) or another storage and rehydrates it on load\n- partialize chooses which fields are saved; version and migrate handle schema changes\n- devtools connects the store to Redux DevTools; the third set argument names an action\n- immer lets you write updates like mutations; subscribeWithSelector adds selective subscriptions",
        keyPoints: [
          { tone: "key", text: "Persist only what must survive a reload: partialize: (s) => ({ theme: s.theme, cart: s.cart })." },
          { tone: "tip", text: "Bump version and add migrate when the persisted shape changes, instead of breaking returning users." },
          { tone: "warning", text: "Never persist secrets or tokens to localStorage." },
          { tone: "warning", text: "Persisted state loads on the client, so server-rendered HTML may differ; handle hydration (see the SSR lesson)." },
        ],
        example: "- persist(store, { name: 'cart-storage' }) saves to localStorage['cart-storage']\n- storage: createJSONStorage(() => sessionStorage) switches storage\n- set(s => ({ count: s.count + 1 }), undefined, 'counter/increase') names the devtools action\n- useStore.persist.clearStorage() wipes the saved copy",
        code: "import { create } from 'zustand';\nimport { createJSONStorage, devtools, persist } from 'zustand/middleware';\nimport { immer } from 'zustand/middleware/immer';\n\ntype Item = { id: string; qty: number };\ntype CartState = {\n  items: Item[];\n  coupon: string | null;\n  add: (id: string) => void;\n  setCoupon: (code: string | null) => void;\n};\n\nexport const useCartStore = create<CartState>()(\n  devtools(\n    persist(\n      immer((set) => ({\n        items: [],\n        coupon: null,\n        add: (id) =>\n          set((s) => {\n            const line = s.items.find((i) => i.id === id);\n            if (line) line.qty += 1;               // immer makes this immutable\n            else s.items.push({ id, qty: 1 });\n          }),\n        setCoupon: (code) => set((s) => { s.coupon = code; }),\n      })),\n      {\n        name: 'cart-storage',\n        storage: createJSONStorage(() => localStorage),\n        partialize: (s) => ({ items: s.items }),   // do not persist the coupon\n        version: 2,\n        migrate: (persisted, version) =>\n          version < 2 ? { items: (persisted as { lines: Item[] }).lines } : persisted,\n      },\n    ),\n    { name: 'CartStore' },\n  ),\n);",
        apiReference: [
          {
            name: "persist",
            kind: "middleware",
            signature: "persist(initializer, { name, storage?, partialize?, version?, migrate?, onRehydrateStorage?, skipHydration? })",
            params: [
              { name: "name", type: "string", description: "Unique storage key." },
              { name: "storage", type: "createJSONStorage(() => Storage)", description: "localStorage by default; sessionStorage or a custom async storage." },
              { name: "partialize", type: "(state) => partial", description: "Choose which fields are saved." },
              { name: "version / migrate", type: "number / (persisted, version) => state", description: "Upgrade old saved shapes." },
            ],
            returns: "The wrapped initializer; the store gains a .persist API (rehydrate, clearStorage, hasHydrated).",
          },
        ],
        exercise: "- Persist a theme store to localStorage and reload the page\n- Add partialize so only the cart items are saved\n- Change the persisted shape and write a migrate function",
        checkpoint: "- Why does middleware order matter?\n- What does partialize do?\n- How do you name actions for Redux DevTools?",
        mistake: "- Do not persist the whole store by default\n- Do not store secrets in browser storage\n- Do not change a persisted shape without a version bump and migration",
      },
      {
        title: "TypeScript and the slices pattern",
        diagram: {
          kind: "tree",
          caption: "Large stores stay maintainable when each feature owns a slice. The slices are combined into one store and one hook.",
          items: [
            { label: "store/", detail: "one bound store for the app" },
            { label: "bear-slice.ts", detail: "StateCreator<AppState, [], [], BearSlice>", depth: 1 },
            { label: "fish-slice.ts", detail: "StateCreator<AppState, [], [], FishSlice>", depth: 1 },
            { label: "index.ts", detail: "create<AppState>()((...a) => ({ ...bear(...a), ...fish(...a) }))", depth: 1 },
            { label: "Components", detail: "useAppStore(s => s.bears)" },
          ],
        },
        explanation: "- In TypeScript write create<State>()(...) — the extra () is required for correct middleware typing\n- Type state and actions together in one type, or separate State and Actions types\n- A slice is a StateCreator returning part of the store; slices can call each other through get\n- Combine slices by spreading them into one initializer\n- With middleware, pass the middleware mutators in StateCreator's second type parameter",
        keyPoints: [
          { tone: "key", text: "The curried create<T>()(...) form exists so TypeScript can infer middleware types while you supply the state type." },
          { tone: "tip", text: "Apply middleware once, around the combined store, not inside each slice." },
          { tone: "tip", text: "combine(initialState, (set) => actions) infers the state type from initial values for small stores." },
        ],
        example: "- const useStore = create<BearState>()((set) => ({ ... }))\n- const createBearSlice: StateCreator<BearSlice & FishSlice, [], [], BearSlice> = (set) => ({ ... })\n- create<BearSlice & FishSlice>()((...a) => ({ ...createBearSlice(...a), ...createFishSlice(...a) }))\n- With devtools: StateCreator<AppState, [['zustand/devtools', never]], [], BearSlice>",
        code: "import { create, type StateCreator } from 'zustand';\n\ntype BearSlice = { bears: number; addBear: () => void; eatFish: () => void };\ntype FishSlice = { fishes: number; addFish: () => void };\ntype AppState = BearSlice & FishSlice;\n\nconst createBearSlice: StateCreator<AppState, [], [], BearSlice> = (set) => ({\n  bears: 0,\n  addBear: () => set((s) => ({ bears: s.bears + 1 })),\n  eatFish: () => set((s) => ({ fishes: Math.max(0, s.fishes - 1) })), // touches another slice\n});\n\nconst createFishSlice: StateCreator<AppState, [], [], FishSlice> = (set) => ({\n  fishes: 0,\n  addFish: () => set((s) => ({ fishes: s.fishes + 1 })),\n});\n\nexport const useAppStore = create<AppState>()((...a) => ({\n  ...createBearSlice(...a),\n  ...createFishSlice(...a),\n}));",
        apiReference: [
          {
            name: "StateCreator",
            kind: "type",
            signature: "StateCreator<T, Mis extends [StoreMutatorIdentifier, unknown][], Mos, U = T>",
            params: [
              { name: "T", type: "type", description: "The full store type the slice can read and set." },
              { name: "Mis", type: "tuple", description: "Middleware mutators applied outside, e.g. [['zustand/devtools', never]]." },
              { name: "U", type: "type", description: "The part of the store this slice returns." },
            ],
            returns: "A typed initializer for one slice.",
          },
        ],
        exercise: "- Split a store with user and cart concerns into two slices\n- Add devtools around the combined store and type the slices for it\n- Rewrite a small store with combine and let TypeScript infer its state",
        checkpoint: "- Why is create<T>()(...) curried in TypeScript?\n- How can one slice update another slice's state?\n- Where should middleware be applied with slices?",
        mistake: "- Do not write create<T>(...) without the extra () in TypeScript\n- Do not apply persist inside individual slices\n- Do not create one store per component; share the bound store",
      },
      {
        title: "Outside React, Next.js SSR and testing",
        diagram: {
          kind: "split",
          caption: "Module-level stores are shared by every request on a server. In Next.js, create a store per request and provide it through context; in the browser a singleton is fine.",
          headings: ["Client-only app", "Next.js (server rendering)"],
          items: [
            { label: "Module-level create()", detail: "one store for the tab", group: 0 },
            { label: "Import the hook anywhere", group: 0 },
            { label: "store.getState() in utilities", group: 0 },
            { label: "createStore() per request", detail: "zustand/vanilla factory", group: 1 },
            { label: "Provider component holds it in a ref", group: 1 },
            { label: "useStore(storeFromContext, selector)", group: 1 },
          ],
        },
        explanation: "- Every store exposes getState, setState and subscribe, so non-React code can use it\n- createStore from 'zustand/vanilla' builds a store without a hook; useStore(store, selector) reads it in React\n- On the server, a shared module store would leak data between users; create one per request in Next.js\n- Initialise the per-request store with server data and provide it via React context from a Client Component\n- In tests, reset stores between tests by restoring their initial state",
        keyPoints: [
          { tone: "key", text: "Never keep user-specific data in a module-level store that also runs on the server." },
          { tone: "tip", text: "Save const initialState = useStore.getState() in tests and call useStore.setState(initialState, true) in beforeEach." },
          { tone: "tip", text: "Read state in callbacks with useStore.getState() to avoid subscribing a component you do not want to re-render." },
        ],
        example: "- useCounterStore.getState().increase() in a WebSocket handler\n- const unsub = useCounterStore.subscribe(s => console.log(s.count))\n- const store = createStore<CounterState>()(set => ({ ... })) for a per-request store\n- <CounterStoreProvider initialCount={await getCount()}> in a Next.js layout",
        code: "// counter-store.ts\nimport { createStore } from 'zustand/vanilla';\n\nexport type CounterState = { count: number; increase: () => void };\n\nexport const createCounterStore = (initialCount = 0) =>\n  createStore<CounterState>()((set) => ({\n    count: initialCount,\n    increase: () => set((s) => ({ count: s.count + 1 })),\n  }));\n\n// counter-provider.tsx\n'use client';\nimport { createContext, useContext, useState, type ReactNode } from 'react';\nimport { useStore } from 'zustand';\nimport { createCounterStore, type CounterState } from './counter-store';\n\nconst CounterContext = createContext<ReturnType<typeof createCounterStore> | null>(null);\n\nexport function CounterStoreProvider({ initialCount, children }: { initialCount: number; children: ReactNode }) {\n  const [store] = useState(() => createCounterStore(initialCount)); // one store per mount/request\n  return <CounterContext value={store}>{children}</CounterContext>;\n}\n\nexport function useCounter<T>(selector: (s: CounterState) => T): T {\n  const store = useContext(CounterContext);\n  if (!store) throw new Error('useCounter must be used inside CounterStoreProvider');\n  return useStore(store, selector);\n}\n\n// counter.test.ts\n// const store = createCounterStore(5);\n// store.getState().increase();\n// expect(store.getState().count).toBe(6);",
        apiReference: [
          {
            name: "createStore (zustand/vanilla)",
            kind: "function",
            signature: "const store = createStore<State>()((set, get) => initialState)",
            params: [],
            returns: "A store object with getState, setState, subscribe and getInitialState, usable without React.",
          },
          {
            name: "useStore",
            kind: "hook",
            signature: "useStore(store, selector?)",
            params: [
              { name: "store", type: "StoreApi", description: "A vanilla store, e.g. from context." },
              { name: "selector", type: "(state) => T", description: "Which part of state to read." },
            ],
            returns: "The selected value; the component re-renders when it changes.",
          },
        ],
        exercise: "- Call a store action from a plain utility function with getState\n- Build a per-request store provider for a Next.js page seeded with server data\n- Reset a store between tests and prove tests no longer leak state",
        checkpoint: "- Why is a module-level store risky in server rendering?\n- What is the difference between create and createStore?\n- How do you reset a store between tests?",
        mistake: "- Do not share one server-side store across requests\n- Do not forget to unsubscribe from store.subscribe in non-React code\n- Do not let tests depend on state left by earlier tests",
      },
      ...ZUSTAND_ADDITIONS,
    ],
    project: "Build a 'Study planner' with Zustand 5: a slices-based store (subjects, sessions, settings) typed with StateCreator, immer-based updates for nested session data, precise selectors plus useShallow for a summary panel, persist with partialize, version and migrate for settings, devtools with named actions, a non-React timer that updates the store with getState, and Jest/Vitest tests that reset the store between cases. Add a Next.js page that seeds a per-request store from server data.",
    summary: "- create<State>()(set => ...) builds a store and a selector hook, no Provider required\n- set merges shallowly; update nested data immutably or with immer\n- Select primitives, or wrap object/array selectors in useShallow to avoid re-renders and v5 loops\n- persist (partialize, version, migrate), devtools, immer and subscribeWithSelector extend stores\n- Type with the curried create and split large stores into StateCreator slices\n- Use getState/subscribe outside React, per-request stores in Next.js, and reset stores in tests",
    glossary: [
      { term: "Store", definition: "An external container for state and actions that components subscribe to." },
      { term: "Selector", definition: "A function that picks the part of state a component needs; it re-renders only when that changes." },
      { term: "Action", definition: "A function stored alongside state that updates it with set." },
      { term: "Shallow merge", definition: "Combining objects one level deep, which is how set applies partial state." },
      { term: "useShallow", definition: "A helper that compares a selector's object or array result by top-level values." },
      { term: "Middleware", definition: "A wrapper around the store initialiser that adds behaviour such as persistence or devtools." },
      { term: "Rehydration", definition: "Loading persisted state back into the store when the app starts." },
      { term: "Slice", definition: "A part of a larger store defined by its own StateCreator." },
      { term: "Vanilla store", definition: "A store created with createStore from zustand/vanilla, independent of React." },
    ],
    sources: [
      source("https://zustand.docs.pmnd.rs/getting-started/introduction", "Introduction"),
      source("https://zustand.docs.pmnd.rs/guides/updating-state", "Updating state"),
      source("https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow", "Prevent rerenders with useShallow"),
      source("https://zustand.docs.pmnd.rs/middlewares/persist", "persist middleware"),
      source("https://zustand.docs.pmnd.rs/middlewares/devtools", "devtools middleware"),
      source("https://zustand.docs.pmnd.rs/guides/typescript", "TypeScript guide"),
      source("https://zustand.docs.pmnd.rs/guides/slices-pattern", "Slices pattern"),
      source("https://zustand.docs.pmnd.rs/guides/nextjs", "Setup with Next.js"),
      source("https://zustand.docs.pmnd.rs/migrations/migrating-to-v5", "Migrating to v5"),
    ],
  },
};

const core = expandGuide(guide.id, guide.curriculum);
export const ZUSTAND_CORE_LESSON_COUNT = core.lessons.length;
export default { ...guide, version: 2, curriculum: { ...core, title: "Zustand 5", minutes: core.minutes + ZUSTAND_LESSONS.length * 5, lessons: [...core.lessons, ...ZUSTAND_LESSONS] } } satisfies TechnologyGuide;
