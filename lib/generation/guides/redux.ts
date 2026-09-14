import type { Lesson } from "@/lib/domain";
import type { TechnologyGuide } from "./index";

type Topic = { title: string; points: string[]; code: string; exercise: string; check: string; warning: string };
const lesson = (topic: Topic): Lesson => ({
  title: topic.title, explanation: topic.points.map(point => `- ${point}`).join("\n"),
  keyPoints: topic.points.map(text => ({ tone: "key", text })),
  example: `- Trace the input and resulting state in this example.\n- ${topic.check}`,
  code: topic.code, exercise: `- ${topic.exercise}`, checkpoint: `- ${topic.check}`, mistake: `- ${topic.warning}`,
});
const sources = (entries: [string, string][]) => entries.map(([url, title]) => ({ url, title, retrievedAt: "2026-09-12T00:00:00.000Z" }));

export const redux: TechnologyGuide = {
  id: "redux-fundamentals", technologyId: "redux", topicId: "redux-full", level: "beginner",
  curriculum: {
    title: "Redux: state, actions, reducers and React", minutes: 100,
    objectives: ["Trace an action from the UI through a reducer to the next state.", "Design shared state and connect it to React using selectors."],
    prerequisites: ["JavaScript objects, functions and array methods", "React components and hooks"],
    lessons: [
      {
        title: "State ownership and one-way data flow",
        points: ["Redux coordinates application state shared by multiple features.", "Events become actions; reducers calculate new state; subscribers observe the result.", "Keep temporary input values local when no other feature needs them."],
        code: "const initialState = { cart: [], currency: 'INR' };\nconst added = { type: 'cart/itemAdded', payload: { id: 'book', quantity: 1 } };\nconsole.log(initialState.cart.length, added.type); // 0, cart/itemAdded",
        exercise: "List which checkout values belong in shared state and which belong in a component.",
        check: "Does creating an action object change the store by itself?", warning: "An action describes a change; it must be dispatched before reducers process it.",
      },
      {
        title: "Actions, payloads and action creators",
        points: ["An action has a string type describing an event.", "Payload contains the data the reducer needs to process that event.", "An action creator returns an action; dispatch sends that action to the store."],
        code: "const itemAdded = (id, quantity) => ({\n  type: 'cart/itemAdded', payload: { id, quantity },\n});\nconsole.log(itemAdded('book', 2).payload.quantity); // 2",
        exercise: "Write an itemRemoved action creator accepting an item ID.", check: "Which value identifies the event and which carries its data?", warning: "Use serializable event data; avoid putting DOM nodes or functions into ordinary actions.",
      },
      {
        title: "Pure reducers and immutable updates",
        points: ["A reducer receives the previous state and an action, then returns the next state.", "Copy each changed level when writing reducers without Immer.", "Return the existing state for unrelated actions; avoid network calls and random values inside reducers."],
        code: "function cart(state = [], action) {\n  if (action.type === 'cart/itemAdded') return [...state, action.payload];\n  return state;\n}\nconst before = [];\nconst after = cart(before, { type: 'cart/itemAdded', payload: { id: 'book' } });\nconsole.log(before.length, after.length); // 0, 1",
        exercise: "Implement removal with filter and confirm the input array stays unchanged.", check: "Why must the same state and action produce the same result?", warning: "Mutating an ordinary reducer's input can prevent reference-based change detection.",
      },
      {
        title: "Store, dispatch and subscriptions",
        points: ["The store owns the current state and executes the root reducer during dispatch.", "getState reads a snapshot; subscribe registers a change listener and returns an unsubscribe function.", "Use Redux Toolkit configureStore for application setup, including middleware and development checks."],
        code: "import { configureStore } from '@reduxjs/toolkit';\nconst reducer = (state = 0, action) => action.type === 'increment' ? state + 1 : state;\nconst store = configureStore({ reducer });\nconst unsubscribe = store.subscribe(() => console.log(store.getState()));\nstore.dispatch({ type: 'increment' }); // logs 1\nunsubscribe();",
        exercise: "Dispatch twice, unsubscribe, then verify a third dispatch no longer invokes the listener.", check: "Does getState subscribe a component to future updates?", warning: "Read snapshots for imperative work; use React-Redux hooks to subscribe React components.",
      },
      {
        title: "Reducer composition and normalized state",
        points: ["A reducer map passed to configureStore creates separate root-state fields.", "Store each entity once by ID and keep related records linked by IDs.", "Normalized state makes individual updates easier than updating repeated nested copies."],
        code: "import { configureStore } from '@reduxjs/toolkit';\nconst users = (state = { byId: { u1: { id: 'u1', name: 'Asha' } }, ids: ['u1'] }) => state;\nconst selectedUser = (state = 'u1') => state;\nconst store = configureStore({ reducer: { users, selectedUser } });\nconst state = store.getState();\nconsole.log(state.users.byId[state.selectedUser].name); // Asha",
        exercise: "Represent authors and posts with IDs instead of repeating author objects.", check: "Where does a reducer-map key appear in the root state?", warning: "Do not store independently editable copies of the same entity in multiple branches.",
      },
      {
        title: "Selectors and derived data",
        points: ["A selector reads or derives data from state without changing it.", "Derive totals and filtered lists instead of storing redundant copies.", "createSelector memoizes a result using input-selector results; keep input selectors focused on extraction."],
        code: "import { createSelector } from '@reduxjs/toolkit';\nconst selectItems = state => state.items;\nconst selectTotal = createSelector([selectItems], items =>\n  items.reduce((sum, item) => sum + item.price * item.quantity, 0));\nconsole.log(selectTotal({ items: [{ price: 120, quantity: 2 }] })); // 240",
        exercise: "Build a memoized selector for incomplete tasks.", check: "When can a selector reuse its previous computed result?", warning: "Creating a new array in every input-selector call defeats stable memoization inputs.",
      },
      {
        title: "React Provider, useSelector and useDispatch",
        points: ["Provider makes a store available to descendant React components.", "useSelector subscribes to a selected value; by default its result uses strict reference equality.", "useDispatch returns the dispatch function used by event handlers."],
        code: "import { useSelector, useDispatch } from 'react-redux';\n// Render Counter beneath <Provider store={store}>.\nexport function Counter() {\n  const count = useSelector(state => state.counter);\n  const dispatch = useDispatch();\n  return <button onClick={() => dispatch({ type: 'increment' })}>{count}</button>;\n}",
        exercise: "Connect a cart count to a header and dispatch item additions from a product card.", check: "Why can returning a fresh object from useSelector cause extra renders?", warning: "Do not mutate values returned by useSelector; dispatch actions to request updates.",
      },
      {
        title: "Middleware, thunks and async boundaries",
        points: ["Middleware wraps dispatch to add behavior around actions.", "Thunk middleware lets dispatch accept a function receiving dispatch and getState.", "Keep asynchronous work outside reducers and dispatch events to represent its result."],
        code: "const incrementIfOdd = () => (dispatch, getState) => {\n  if (getState().counter % 2 === 1) dispatch({ type: 'increment' });\n};\n// configureStore includes thunk middleware by default.\n// store.dispatch(incrementIfOdd());",
        exercise: "Write a thunk that checks the current cart before dispatching an item addition.", check: "Which part performs side effects and which part calculates state?", warning: "Reducers must stay synchronous; await work in a thunk or another effect layer.",
      },
    ].map(lesson),
    project: "Build a cart with actions for adding and removing items, a normalized product lookup and a memoized total selector.",
    summary: "Describe events with actions, calculate state with reducers, and let subscribed components read focused selections.",
    glossary: [{ term: "Action", definition: "A serializable event description with a string type." }, { term: "Reducer", definition: "A pure function that calculates next state from previous state and an action." }],
    sources: sources([
      ["https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers", "State, actions and reducers"],
      ["https://redux.js.org/tutorials/fundamentals/part-4-store", "The Redux store"],
      ["https://redux.js.org/usage/deriving-data-selectors", "Deriving data with selectors"],
      ["https://react-redux.js.org/api/hooks", "React-Redux hooks"],
      ["https://redux-toolkit.js.org/api/configureStore", "Store setup and default middleware"],
    ]),
  },
};

export const reduxToolkit: TechnologyGuide = {
  id: "redux-toolkit", technologyId: "redux-toolkit", topicId: "redux-toolkit-full", level: "intermediate",
  curriculum: {
    title: "Redux Toolkit: slices, async workflows and RTK Query", minutes: 120,
    objectives: ["Create typed slices and predictable async workflows.", "Manage normalized data and server caching with the appropriate Toolkit APIs."],
    prerequisites: ["Redux actions, reducers and selectors", "Promises and basic TypeScript"],
    lessons: [
      {
        title: "configureStore and development checks",
        points: ["configureStore combines reducer maps and supplies common defaults.", "Its defaults include thunk middleware, DevTools integration and development checks.", "Use the middleware callback to extend defaults instead of accidentally replacing them."],
        code: "import { configureStore } from '@reduxjs/toolkit';\nconst counter = (state = 0) => state;\nexport const store = configureStore({ reducer: { counter } });\nexport type RootState = ReturnType<typeof store.getState>;\nexport type AppDispatch = typeof store.dispatch;",
        exercise: "Create a store with separate cart and preferences reducers.", check: "Why should RootState be inferred from the store?", warning: "Do not disable serializability checks just to silence an unexplained warning.",
      },
      {
        title: "createSlice and generated action creators",
        points: ["createSlice groups a slice name, initial state and case reducers.", "Each reducers entry generates an action creator and an action type.", "Export the slice reducer for store registration and action creators for callers."],
        code: "import { createSlice, type PayloadAction } from '@reduxjs/toolkit';\nconst counter = createSlice({\n  name: 'counter', initialState: { value: 0 },\n  reducers: { added(state, action: PayloadAction<number>) { state.value += action.payload; } },\n});\nexport const { added } = counter.actions;\nexport default counter.reducer;\nconsole.log(added(3).type); // counter/added",
        exercise: "Add a reset action and inspect both generated action types.", check: "Which part of an action type comes from the slice name?", warning: "Call the generated action creator with payload data, then dispatch its returned action.",
      },
      {
        title: "Immer drafts and immutable results",
        points: ["Toolkit case reducers receive Immer drafts for draftable state.", "Draft writes produce immutable results; ordinary objects outside reducers do not gain this behavior.", "Either mutate the draft or return a replacement value from one case reducer."],
        code: "import { createSlice } from '@reduxjs/toolkit';\nconst tasks = createSlice({\n  name: 'tasks', initialState: [] as string[],\n  reducers: {\n    added(state, action) { state.push(action.payload); },\n    cleared() { return []; },\n  },\n});\nconst original: string[] = [];\nconst next = tasks.reducer(original, tasks.actions.added('Read'));\nconsole.log(original.length, next.length); // 0, 1",
        exercise: "Update a nested field in a slice and verify the original object is unchanged.", check: "Why is an implicit return of state.push(...) a problem?", warning: "An arrow expression that returns push's numeric result also mutates the draft; use a block body.",
      },
      {
        title: "Typed hooks and payload contracts",
        points: ["Infer application types from the configured store.", "Pre-typed hooks reuse those contracts throughout React components.", "PayloadAction describes the payload a case reducer expects."],
        code: "import { useDispatch, useSelector } from 'react-redux';\nimport type { AppDispatch, RootState } from './store';\nexport const useAppDispatch = useDispatch.withTypes<AppDispatch>();\nexport const useAppSelector = useSelector.withTypes<RootState>();",
        exercise: "Use typed hooks in a counter component and try dispatching an incorrect payload.", check: "What does dispatch's inferred type know about thunks?", warning: "Use type-only imports for store types to avoid unnecessary runtime dependencies.",
      },
      {
        title: "createAsyncThunk lifecycle and errors",
        points: ["createAsyncThunk creates pending, fulfilled and rejected action creators around a promise-returning callback.", "Use extraReducers to handle those lifecycle actions in state.", "Dispatch returns a promise for the final action; unwrap extracts success data or throws the failure."],
        code: "import { createAsyncThunk } from '@reduxjs/toolkit';\nexport const loadUser = createAsyncThunk('users/load', async (id: string, { signal }) => {\n  const response = await fetch('/api/users/' + encodeURIComponent(id), { signal });\n  if (!response.ok) throw new Error('User request failed');\n  return response.json();\n});\n// In an event handler: await dispatch(loadUser('u1')).unwrap();",
        exercise: "Add loading and error fields handled by pending, fulfilled and rejected cases.", check: "Why does awaiting dispatch alone not throw on a rejected thunk?", warning: "Check HTTP status explicitly; fetch does not reject merely because the server returned an error status.",
      },
      {
        title: "extraReducers and shared events",
        points: ["extraReducers handles actions declared outside a slice.", "The builder syntax connects action creators to correctly inferred payloads.", "Multiple slices may respond to the same event, such as signing out."],
        code: "import { createAction, createSlice } from '@reduxjs/toolkit';\nexport const signedOut = createAction('session/signedOut');\nconst cart = createSlice({\n  name: 'cart', initialState: { ids: [] as string[] }, reducers: {},\n  extraReducers: builder => {\n    builder.addCase(signedOut, state => { state.ids = []; });\n  },\n});\nexport default cart.reducer;",
        exercise: "Make both cart and preferences respond to a shared session event.", check: "Does an extraReducers case generate a new action creator?", warning: "Use reducers for locally generated actions and extraReducers for externally defined actions.",
      },
      {
        title: "createEntityAdapter and normalized collections",
        points: ["createEntityAdapter supplies collection reducers and selectors for ids/entities state.", "Choose selectId for an entity key other than id and sortComparer for ordering.", "Adapter updates are shallow; design nested entity data deliberately."],
        code: "import { createEntityAdapter } from '@reduxjs/toolkit';\nconst users = createEntityAdapter<{ id: string; name: string }>();\nconst initial = users.getInitialState();\nconst next = users.addOne(initial, { id: 'u1', name: 'Asha' });\nconsole.log(users.getSelectors().selectById(next, 'u1')?.name); // Asha",
        exercise: "Add two users, update one and list the collection with adapter selectors.", check: "How do ids and entities represent one collection?", warning: "updateOne merges the supplied changes shallowly; it does not recursively merge nested objects.",
      },
      {
        title: "RTK Query endpoints and generated hooks",
        points: ["RTK Query manages fetched server data, request status and cache subscriptions.", "createApi defines queries and mutations; the React entry point generates hooks.", "Register both the API reducer and middleware in the store."],
        code: "import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';\nexport const api = createApi({\n  reducerPath: 'api', baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),\n  endpoints: build => ({\n    user: build.query<{ id: string; name: string }, string>({\n      query: id => 'users/' + encodeURIComponent(id),\n    }),\n  }),\n});\nexport const { useUserQuery } = api;\n// Store: reducer: { [api.reducerPath]: api.reducer }\n// middleware: getDefault => getDefault().concat(api.middleware)",
        exercise: "Render the loading, error and success states returned by a generated query hook.", check: "Which store integrations must be installed for an API slice?", warning: "A generated hook alone does not register the API reducer or middleware.",
      },
      {
        title: "Cache tags and automated refetching",
        points: ["Queries can provide tags describing their cached data.", "Mutations invalidate matching tags after changing server data.", "Invalidated queries with active subscriptions refetch; unused cache entries are removed."],
        code: "// Inside createApi: declare tagTypes: ['User'].\n// Query endpoint:\n// providesTags: (_result, _error, id) => [{ type: 'User', id }]\n// Mutation endpoint:\n// invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }]\nconst tagForUser = id => ({ type: 'User', id });\nconsole.log(tagForUser('u1'));",
        exercise: "Give a user-detail query an ID tag and invalidate it after editing that user.", check: "How does active subscription status affect invalidation?", warning: "Invalidating a broad type can refetch many queries; choose tag scope intentionally.",
      },
      {
        title: "Listener middleware and reactive workflows",
        points: ["Listener middleware runs effects in response to matching dispatched actions.", "Register an action creator or predicate together with an effect function.", "Use listener cancellation helpers when newer events should supersede pending work."],
        code: "import { createAction, createListenerMiddleware } from '@reduxjs/toolkit';\nconst saved = createAction('draft/saved');\nexport const listener = createListenerMiddleware();\nlistener.startListening({ actionCreator: saved, effect: async (_action, api) => {\n  api.cancelActiveListeners();\n  await api.delay(300);\n  console.log('Latest save observed');\n} });\n// Store middleware: getDefault => getDefault().prepend(listener.middleware)",
        exercise: "Dispatch the observed action twice quickly and inspect which delayed effect completes.", check: "Where should listener middleware be inserted relative to default checks?", warning: "Wire the listener middleware into the store before expecting registered effects to run.",
      },
      {
        title: "Testing slices and connected behavior",
        points: ["Test reducer transitions with explicit starting state and actions.", "Use a fresh real store for each connected-component test.", "Assert visible behavior and mock the network boundary for request-driven tests."],
        code: "import { createSlice } from '@reduxjs/toolkit';\nconst counter = createSlice({ name: 'counter', initialState: 0,\n  reducers: { increment: state => state + 1 } });\n// Jest or Vitest test:\ntest('increments once', () => {\n  expect(counter.reducer(0, counter.actions.increment())).toBe(1);\n});",
        exercise: "Test a user interaction through Provider and assert the updated count on screen.", check: "Why should tests avoid sharing a mutable store instance?", warning: "Mocking useSelector or useDispatch can hide broken integration between the UI and state updates.",
      },
    ].map(lesson),
    project: "Build a typed task board using a slice for local preferences, an entity adapter for tasks and RTK Query for server data.",
    summary: "Toolkit supplies store and slice defaults, explicit async lifecycles, normalized collections and a server-data cache.",
    glossary: [{ term: "Slice", definition: "A feature's initial state, reducer logic and generated action creators." }, { term: "Cache tag", definition: "A label connecting cached query data to mutation invalidation." }],
    sources: sources([
      ["https://redux-toolkit.js.org/api/configureStore", "configureStore"],
      ["https://redux-toolkit.js.org/api/createSlice", "createSlice and extraReducers"],
      ["https://react-redux.js.org/api/hooks", "Typed React-Redux hooks"],
      ["https://redux-toolkit.js.org/api/createAsyncThunk", "Async thunk lifecycle"],
      ["https://redux-toolkit.js.org/api/createEntityAdapter", "Entity adapters"],
      ["https://redux-toolkit.js.org/rtk-query/overview", "RTK Query"],
      ["https://redux-toolkit.js.org/rtk-query/usage/automated-refetching", "Cache invalidation"],
      ["https://redux-toolkit.js.org/api/createListenerMiddleware", "Listener middleware"],
      ["https://redux.js.org/usage/writing-tests", "Testing Redux applications"],
    ]),
  },
};
