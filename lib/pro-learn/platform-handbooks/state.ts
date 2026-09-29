import { defineHandbook } from "./shared";

export const STATE_HANDBOOKS = [
  defineHandbook("Zustand", "Stores, selectors, actions, middleware, persistence, TypeScript, SSR and testing.", "https://zustand.docs.pmnd.rs/", {
    mechanism: "A Zustand store holds state and exposes updates and subscriptions. React components subscribe through selectors; selecting a stable small value limits unnecessary rendering.",
    example: "A cart store exposes items and an addItem action. The header selects only the item count, while checkout selects the full item list. Update arrays immutably and test that unrelated state does not change the header's selected value.",
    pitfall: "Avoid a shared server singleton for per-user state. Persisted client state may not exist during server rendering; design hydration and migration explicitly.",
  }, {
    "Hooks": [
      ["useStore with a selector", "Call the store hook with a selector so only that slice's changes re-render the component.", [
        "Select a primitive or stable reference from the store.",
        "Unrelated state updates should not change the selected value.",
        "Keep selector computation free of side effects.",
      ]],
      ["useStoreWithEqualityFn", "Supply a custom equality function where shallow comparison is not the right test.", [
        "Import the equality-aware hook from zustand/traditional.",
        "Pass the vanilla store, selector and comparison function.",
        "Ensure equality checks all fields the component actually uses.",
      ]],
      ["createWithEqualityFn", "Create a store whose hook accepts an equality function at each call site.", [
        "Use the traditional entry point for equality-aware bound hooks.",
        "Choose a default comparison appropriate to the selected data.",
        "Account for its use-sync-external-store peer dependency.",
      ]],
      ["Binding a vanilla store", "Read a framework-independent store from React without creating a second source of truth.", [
        "Create the vanilla store once for its intended scope.",
        "Pass that instance to React's Zustand useStore hook.",
        "Reuse its getState and actions outside React.",
      ]],
      ["Context-scoped store hooks", "Create the store per provider and expose it through one typed wrapper hook.", [
        "Keep a stable store instance inside the provider.",
        "Throw a clear error when the wrapper lacks its provider.",
        "Initialize each provider from its own input data.",
      ]],
      ["Named slice hooks", "Export a hook per slice so no call site can select the whole store by accident.", [
        "Expose focused hooks such as useCartCount or useCartItems.",
        "Keep action selection separate from frequently changing values.",
        "Let callers depend on a stable domain-facing API.",
      ]],
      ["Hook-free access", "getState and subscribe cover event handlers and non-React code, where no hook may run.", [
        "Use getState for a current imperative snapshot.",
        "Use subscribe when outside code needs ongoing notifications.",
        "Call the returned unsubscribe function during teardown.",
      ]],
      ["Hooks in tests", "Reset the store between tests and read state through the same hook the component uses.", [
        "Render hook consumers with the correct scoped store.",
        "Wrap direct store updates in React act when needed.",
        "Restore initial state so tests cannot inherit earlier changes.",
      ]],
    ],
    "Store fundamentals": [
      ["create and bound hooks", "Create a React-bound store and call the returned hook with a selector inside a component.", [
        "The create function returns a hook with store utilities attached.",
        "Define actions alongside initial state in the initializer.",
        "Invoke the hook only where React hooks are allowed.",
      ]],
      ["createStore and vanilla stores", "Use a framework-independent store with getState, setState and subscribe.", [
        "createStore returns a StoreApi without binding it to React.",
        "Read snapshots with getState and update through actions.",
        "Attach subscriptions only for their required lifetime.",
      ]],
      ["State and actions", "Keep update rules in named actions so callers express intent instead of editing store internals.", [
        "Name actions after domain operations such as addItem.",
        "Keep related field updates together inside one action.",
        "Expose only the state consumers need to read.",
      ]],
      ["Functional updates", "Read the latest previous state when computing a new value from the old one.", [
        "Use set with a callback when the next value depends on state.",
        "Read previous values from that callback's state argument.",
        "Avoid captured render snapshots for sequential updates.",
      ]],
      ["Shallow merging and replacement", "Understand the difference between merging fields and replacing the entire state, including actions.", [
        "Default set merges fields at the top level only.",
        "Nested objects still require deliberate copying or replacement.",
        "Replacement mode also removes omitted action functions.",
      ]],
      ["Immutable nested updates", "Copy changed nested objects or use a suitable Immer integration to notify subscribers correctly.", [
        "Copy each changed branch before assigning the new root field.",
        "Retain references for nested data that did not change.",
        "Do not mutate arrays obtained from getState.",
      ]],
    ],
    "Selectors & subscriptions": [
      ["Atomic selectors", "Subscribe to the smallest value needed by a consumer instead of the entire store.", [
        "Select a single field when only that field is displayed.",
        "Prefer separate subscriptions for independent primitives.",
        "Avoid selecting a whole collection for one item's count.",
      ]],
      ["Stable selector results", "Avoid returning a fresh object on every snapshot read when the values have not changed.", [
        "A new object or array can look changed on every read.",
        "Reuse derived references when their inputs are unchanged.",
        "Prefer primitives or shallow stabilization for simple selections.",
      ]],
      ["useShallow", "Reuse an appropriate object or array selection when shallow equality captures its semantics.", [
        "Wrap a selector with useShallow for shallow-equal outputs.",
        "Use it for suitable flat arrays or object selections.",
        "Nested mutation cannot be repaired by shallow comparison.",
      ]],
      ["subscribeWithSelector", "Observe selected state outside React and clean up subscriptions when their owner is removed.", [
        "Enable selector-aware subscribe through the middleware.",
        "Provide a selector and listener for the external consumer.",
        "Unsubscribe when the listener's owning feature is disposed.",
      ]],
      ["Transient updates", "Drive an external renderer from a subscription without forcing a React render for every update.", [
        "Subscribe directly for rapid canvas or animation updates.",
        "Update the external target without storing duplicate React state.",
        "Clean up the subscription when the target unmounts.",
      ]],
      ["Derived state", "Compute values from canonical state rather than storing redundant copies that can diverge.", [
        "Derive totals and filters from canonical store fields.",
        "Memoize expensive derivations when input identities are stable.",
        "Do not synchronize a second stored copy unnecessarily.",
      ]],
    ],
    "Middleware & architecture": [
      ["persist middleware", "Persist selected state with a deliberate storage key, version and hydration strategy.", [
        "Choose a stable storage name and explicit storage adapter.",
        "Persist durable user preferences rather than temporary requests.",
        "Decide how the UI behaves before rehydration completes.",
      ]],
      ["partialize and migrations", "Store only durable fields and transform older saved state when its shape changes.", [
        "Use partialize to exclude actions and transient fields.",
        "Increment the persistence version when saved shape changes.",
        "Test migration against real older stored payloads.",
      ]],
      ["devtools middleware", "Name actions and inspect transitions while excluding sensitive application data.", [
        "Give the store and actions meaningful debugging names.",
        "Inspect before-and-after state for unexpected transitions.",
        "Disable or sanitize sensitive data in shared diagnostics.",
      ]],
      ["Immer middleware", "Use draft-based updates within the middleware's contract and understand reference changes.", [
        "Draft mutation syntax is valid inside Immer-managed updates.",
        "Return a replacement or mutate the draft, not both.",
        "Use draftable structures and test nested reference changes.",
      ]],
      ["Slices pattern", "Compose domain slices into a store with explicit ownership and compatible middleware typing.", [
        "Define one slice per clearly owned domain.",
        "Combine slice creators into the final store initializer.",
        "Apply store-wide middleware at the combined boundary.",
      ]],
      ["Context-scoped stores", "Create separate store instances for independently mounted features or request-specific initial state.", [
        "Use independent instances for separate editors or feature mounts.",
        "Supply the intended instance through React context.",
        "Dispose subscriptions when that scope is removed.",
      ]],
      ["Async actions and races", "Represent pending and failed operations and prevent stale responses from overwriting newer state.", [
        "Store loading and error state with each asynchronous operation.",
        "Compare request identities before accepting late results.",
        "Abort obsolete requests when the underlying API supports it.",
      ]],
      ["Resetting state", "Restore initial data while preserving action functions and clearing persisted state when required.", [
        "Use the store's initial snapshot to restore defaults.",
        "Preserve action functions when resetting data fields.",
        "Clear persistent storage when reset means forgetting saved data.",
      ]],
    ],
    "Zustand integration": [
      ["TypeScript store types", "Type state, actions and middleware composition without unsafe casts hiding incompatible updates.", [
        "Declare separate state and action types for the store.",
        "Preserve middleware type information through composition.",
        "Infer selectors from the actual store state type.",
      ]],
      ["Next.js and SSR", "Scope stores correctly and ensure initial server and client snapshots agree.", [
        "Create per-request stores for server-derived user data.",
        "Use matching initial snapshots during server render and hydration.",
        "Access browser-only storage after the client is ready.",
      ]],
      ["Hydration and persistence", "Avoid displaying persisted browser data as though it existed in the initial server render.", [
        "Represent hydration completion explicitly for persisted views.",
        "Avoid reading localStorage during server rendering.",
        "Decide how persisted values merge with fresh server state.",
      ]],
      ["Testing stores", "Reset store state between tests and verify actions and selector-visible outcomes.", [
        "Test actions against representative initial and edge-case states.",
        "Assert selected values and unchanged unrelated references.",
        "Include persistence migration and race-condition scenarios.",
      ]],
      ["Zustand versus server-state caches", "Keep remote-data freshness and retry policies in a tool designed for server state when appropriate.", [
        "Use a server-state cache for freshness, retries and deduplication.",
        "Keep local interaction state in the Zustand store.",
        "Avoid maintaining a competing copy of query data.",
      ]],
      ["Zustand versus Redux", "Compare update discipline, middleware needs and team debugging requirements before choosing a store.", [
        "Compare lightweight store actions with Redux's event pipeline.",
        "Consider auditability, middleware and team conventions.",
        "Choose based on actual sharing and debugging requirements.",
      ]],
    ],
  }),
  defineHandbook("Redux", "Predictable state transitions, actions, reducers, selectors, middleware, React integration and legacy migration.", "https://redux.js.org/", {
    mechanism: "An action describes an event. Dispatch sends it through middleware to reducers, which compute the next state without side effects. Selectors let consumers read a stable projection of that state.",
    example: "Dispatch cart/itemAdded with an item ID. The cart reducer returns the updated entities and quantity. A selector derives the total from normalized data; components render that result rather than recalculating state transitions themselves.",
    pitfall: "Do not mutate plain Redux state, perform network calls inside reducers or store unnecessary nonserializable objects. Redux Toolkit is the standard approach for new Redux application code.",
  }, {
    "Hooks": [
      ["useStore", "Reach the store instance for rare imperative work without subscribing to any state.", [
        "useStore returns the Provider's Redux store instance.",
        "Calling getState does not subscribe the component.",
        "Prefer useSelector for values that must update the UI.",
      ]],
      ["useSelector equality", "Pass shallowEqual or a custom comparison for selections that return objects or arrays.", [
        "The default comparison checks selected result identity.",
        "Use shallowEqual for suitable flat object selections.",
        "A custom comparator must cover every rendered field.",
      ]],
      ["Selector identity in hooks", "A selector returning a fresh object re-renders on every action, whatever the values inside it.", [
        "Returning a fresh object defeats default equality checking.",
        "Select primitives separately or memoize object derivations.",
        "Keep selector inputs stable across unrelated dispatches.",
      ]],
      ["Stable dispatch identity", "dispatch never changes, which is why it is safe to list in a dependency array.", [
        "The dispatch reference is stable while the store instance is unchanged.",
        "Include dispatch in effect and callback dependency lists.",
        "Replacing the Provider's store can change that reference.",
      ]],
      ["Selecting inside list rows", "Select one item by id in the row component rather than the whole collection in the parent.", [
        "Pass a record ID to each connected row.",
        "Select that record instead of subscribing to all entities.",
        "Use stable list keys to preserve row identity.",
      ]],
      ["Hooks versus connect", "What replaced mapStateToProps, and why each hook consumer subscribes on its own.", [
        "Hooks read context and subscribe within function components.",
        "connect wraps components with selected props and dispatch bindings.",
        "Test behavior during incremental migration between bindings.",
      ]],
      ["Reading state in handlers", "Prefer a thunk or getState for a value needed only at click time, not a new subscription.", [
        "Use getState inside a thunk for the latest store snapshot.",
        "Do not assume a captured render value has updated after dispatch.",
        "Subscribe only when a value affects rendered output.",
      ]],
      ["Hooks and the store Provider", "Every hook resolves the store from context, so a missing Provider fails at the first read.", [
        "Mount Provider above every React Redux hook consumer.",
        "Pass the correct store when testing an isolated subtree.",
        "Separate Providers can intentionally expose separate state domains.",
      ]],
    ],
    "Redux core": [
      ["Single state tree", "Model shared application state with clear domains rather than treating every component value as global.", [
        "Organize shared state into meaningful domain slices.",
        "Keep derived values out of the canonical state tree.",
        "Leave temporary form edits local when sharing is unnecessary.",
      ]],
      ["Actions and action creators", "Describe events with serializable payloads and centralize their creation when useful.", [
        "Actions need a type identifying the event being described.",
        "Put event data in a predictable serializable payload.",
        "Action creators standardize payload construction for callers.",
      ]],
      ["Pure reducers", "Compute next state from previous state and action without I/O, randomness or mutation.", [
        "Return the next state without changing the previous state.",
        "Move network requests and other effects into middleware or thunks.",
        "Return the existing reference for irrelevant actions.",
      ]],
      ["dispatch and subscribe", "Understand action delivery and how consumers observe committed state changes.", [
        "Dispatch a plain action to run the reducer synchronously.",
        "Subscribers read the committed state through getState.",
        "Middleware can extend dispatch to support other input forms.",
      ]],
      ["combineReducers", "Compose independently owned state slices under a predictable root state shape.", [
        "Each slice reducer owns one key of the root state.",
        "Provide a valid initial value when state is undefined.",
        "Return unchanged slice state for actions it does not handle.",
      ]],
      ["Immutable update patterns", "Copy only changed paths and retain unchanged references to support efficient comparisons.", [
        "Copy every ancestor of a changed nested value.",
        "Reuse untouched branches to preserve useful identity checks.",
        "Array copying alone does not copy the objects inside it.",
      ]],
    ],
    "Redux data modeling": [
      ["Normalized state", "Store entities by ID and reference them instead of duplicating nested records.", [
        "Keep entities in an ID-indexed lookup with ordered IDs.",
        "Reference shared entities by ID instead of duplicating records.",
        "Update a record once so all views use consistent data.",
      ]],
      ["Selectors", "Encapsulate state shape and derive values without forcing every caller to know internal layout.", [
        "Hide state layout behind named selector functions.",
        "Accept state and optional arguments as explicit inputs.",
        "Keep selectors deterministic and free of dispatch side effects.",
      ]],
      ["Memoized selectors", "Cache expensive derivations when their input references are unchanged.", [
        "Use stable input selectors for expensive derived calculations.",
        "Recompute only when the relevant inputs change.",
        "Choose cache scope carefully for parameterized list selectors.",
      ]],
      ["State machines", "Represent valid loading and workflow states explicitly rather than using contradictory booleans.", [
        "Represent mutually exclusive states with an explicit status field.",
        "Define allowed transitions for pending, success and failure.",
        "Prevent impossible combinations of independent loading flags.",
      ]],
      ["Event-style actions", "Name what happened instead of exposing implementation-level field setters everywhere.", [
        "Describe domain events such as orderSubmitted.",
        "Let multiple slices respond to the same meaningful event.",
        "Avoid exposing every internal field as a public setter.",
      ]],
      ["Local versus global state", "Keep temporary UI state local unless sharing or lifecycle requirements justify global ownership.", [
        "Keep transient input and hover state close to their component.",
        "Share state when distant consumers require coordinated updates.",
        "Consider reset lifetime before promoting data to the store.",
      ]],
    ],
    "Middleware & async": [
      ["Middleware pipeline", "Wrap dispatch to observe or transform actions before reducers receive them.", [
        "Middleware wraps dispatch before actions reach reducers.",
        "Call next to continue through the remaining middleware chain.",
        "Keep middleware ordering explicit when dependencies interact.",
      ]],
      ["Thunk middleware", "Run async logic that can dispatch actions and read current state through an explicit function contract.", [
        "A thunk receives dispatch and getState as arguments.",
        "Dispatch lifecycle actions around asynchronous operations.",
        "Return a promise when callers need to await completion.",
      ]],
      ["Async request lifecycle", "Track pending, fulfilled and rejected outcomes with request identity to handle races.", [
        "Track request identity along with pending and error state.",
        "Accept completion only for the still-relevant request.",
        "Distinguish canceled requests from user-visible failures.",
      ]],
      ["Store enhancers", "Distinguish altering store capabilities from intercepting actions with middleware.", [
        "An enhancer wraps store creation and may alter store capabilities.",
        "Middleware focuses on intercepting dispatched values.",
        "Compose enhancers in a documented order when maintaining legacy setup.",
      ]],
      ["Persistence and rehydration", "Version stored state and avoid treating old cached data as permanently valid.", [
        "Persist only approved durable state fields.",
        "Version and migrate stored snapshots before using them.",
        "Revalidate remote data after restoring an old cache.",
      ]],
      ["Redux DevTools", "Inspect action history and state differences while understanding the limits of replaying side effects.", [
        "Inspect dispatched events and the state changes they produced.",
        "Time travel replays state transitions, not external side effects.",
        "Sanitize action and state data before sharing debugging sessions.",
      ]],
    ],
    "React Redux & migration": [
      ["Provider", "Expose the intended store instance to a React subtree without cross-request state leakage.", [
        "Provide one stable store instance to the intended React subtree.",
        "Create request-scoped instances for server-rendered user state.",
        "Initialize test Providers with realistic state fixtures.",
      ]],
      ["useSelector", "Subscribe to selected values and keep reference behavior compatible with equality checking.", [
        "Select only the fields the component actually renders.",
        "Keep selected object identities stable when values are unchanged.",
        "Handle missing records when parent and child updates overlap.",
      ]],
      ["useDispatch", "Dispatch typed application actions and thunks from UI event handlers.", [
        "Get dispatch from the same Provider as the component's selectors.",
        "Send actions from handlers rather than during render.",
        "Use application dispatch types when dispatching thunks.",
      ]],
      ["connect and mapStateToProps", "Understand the older React binding when maintaining existing applications.", [
        "mapStateToProps converts store state into component props.",
        "mapDispatchToProps exposes event-oriented action callbacks.",
        "Keep prop derivations stable to avoid needless wrapper updates.",
      ]],
      ["Typed hooks", "Define reusable hooks with application state and dispatch types.", [
        "Infer RootState and AppDispatch from the configured store.",
        "Export pre-typed selector and dispatch wrappers once.",
        "Import those wrappers instead of repeating casts in components.",
      ]],
      ["Reducer and integration tests", "Test meaningful state transitions and user flows instead of relying only on mocked dispatch calls.", [
        "Verify reducer transitions from meaningful starting states.",
        "Render connected components with a real test store.",
        "Assert visible outcomes of actions and asynchronous flows.",
      ]],
      ["Legacy createStore migration", "Move legacy setup toward configureStore without rewriting all reducers at once.", [
        "Replace store creation with configureStore first.",
        "Keep existing reducers while checking middleware compatibility.",
        "Resolve serialization warnings before removing safeguards.",
      ]],
      ["Redux Toolkit adoption", "Replace repetitive action and reducer boilerplate with slices and supported async patterns.", [
        "Migrate one domain to createSlice at a time.",
        "Replace handwritten request boilerplate with supported Toolkit APIs.",
        "Keep action behavior compatible while updating consumers.",
      ]],
    ],
  }),
  defineHandbook("Redux Toolkit", "Modern Redux setup, slices, async thunks, entity adapters, listeners and RTK Query.", "https://redux-toolkit.js.org/", {
    mechanism: "Redux Toolkit supplies standard store configuration and reducer utilities. Immer-backed slice reducers allow draft mutation syntax while producing immutable state updates; RTK Query manages server-data requests and cache lifetimes.",
    example: "Define a cart slice with addItem, configure the store, export typed hooks and select a derived total. For product data, define an RTK Query endpoint and invalidate the appropriate tags after a mutation.",
    pitfall: "Immer mutation syntax is safe only inside an Immer-managed draft. Do not copy it into arbitrary reducer code or mutate a value read from the store outside the reducer.",
  }, {
    "Hooks": [
      ["Generated endpoint hooks", "createApi turns every endpoint into its own typed query or mutation hook.", [
        "Use the React-specific RTK Query entry point for generated hooks.",
        "Query hooks subscribe to endpoint-and-argument cache entries.",
        "Mutation hooks return a trigger and request status.",
      ]],
      ["useQuery options", "skip, pollingInterval and refetchOnMountOrArgChange are decided per call site, not per endpoint.", [
        "skip controls whether the hook subscribes and fetches.",
        "pollingInterval schedules refreshes while subscribed.",
        "Refetch options control reuse of an existing cached result.",
      ]],
      ["useLazyQuery", "Trigger a query from an event rather than on render, and keep the last result.", [
        "Call the lazy trigger when the initiating event occurs.",
        "Await its result when subsequent work depends on the response.",
        "Handle loading and failure states for the triggered argument.",
      ]],
      ["useMutation", "Take the trigger function and the request state as one tuple, and reset it deliberately.", [
        "Call the trigger with the mutation's argument payload.",
        "Use unwrap to handle success and failure with ordinary promises.",
        "Reset displayed mutation state when its UI flow ends.",
      ]],
      ["usePrefetch", "Warm the cache on hover or route entry before the user asks for the data.", [
        "Trigger prefetch for a likely upcoming query argument.",
        "Use age or force options to control cache warming.",
        "Prefetching alone does not create a lasting component subscription.",
      ]],
      ["useQueryState and useQuerySubscription", "Split reading cached data from subscribing to it when two components share one query.", [
        "useQueryState reads cached query status and data.",
        "useQuerySubscription owns fetching and subscription behavior.",
        "Keep both hooks aligned on the same endpoint argument.",
      ]],
      ["selectFromResult", "Narrow what a component subscribes to inside a query result it shares with others.", [
        "Return only fields the consuming component needs.",
        "Preserve references in the selected result when data is unchanged.",
        "Hoist stable empty defaults instead of creating new arrays.",
      ]],
      ["Typed useAppDispatch and useAppSelector", "Pre-typed wrappers so every call site keeps the store's own types.", [
        "Infer dispatch and state types from configureStore.",
        "Reuse typed hooks throughout feature components.",
        "Keep type-only imports separate to avoid runtime cycles.",
      ]],
      ["Tag-driven refetching", "Endpoint tags decide which hooks refetch after a mutation, instead of manual invalidation calls.", [
        "Declare provided tags on queries and invalidated tags on mutations.",
        "Active subscriptions refetch when matching tags are invalidated.",
        "Use entity IDs to avoid refreshing unrelated query results.",
      ]],
    ],
    "Toolkit foundations": [
      ["configureStore", "Use standard middleware and DevTools configuration with explicit root reducer and environment settings.", [
        "Pass the root reducer and any preloaded state explicitly.",
        "Extend default middleware rather than accidentally replacing it.",
        "Infer application types from the resulting configured store.",
      ]],
      ["createSlice", "Define case reducers and generated action creators around one state domain.", [
        "Define the slice name, initial state and case reducers.",
        "Export generated action creators for component event handlers.",
        "Mount the slice reducer under a deliberate root-state key.",
      ]],
      ["Immer draft updates", "Mutate a draft or return a replacement value according to Immer rules, without doing both ambiguously.", [
        "Modify only the draft supplied to an Immer reducer.",
        "Return a new value when replacing primitive slice state.",
        "Avoid implicit arrow returns from mutating array methods.",
      ]],
      ["prepare callbacks", "Normalize action payloads and add metadata before the reducer handles them.", [
        "Return a prepared payload before the action reaches reducers.",
        "Attach metadata or normalize arguments in one shared location.",
        "Keep reducer input shape predictable across all callers.",
      ]],
      ["extraReducers", "Respond to actions defined outside a slice while keeping action ownership clear.", [
        "Use the builder API to handle external action creators.",
        "Match async thunk lifecycle actions without owning their creation.",
        "Keep cross-slice reactions based on domain events.",
      ]],
      ["Typed state and dispatch", "Infer store types and expose reusable typed hooks for components.", [
        "Derive RootState from store.getState's return type.",
        "Derive AppDispatch from the configured dispatch function.",
        "Type reusable selectors against the actual root state.",
      ]],
    ],
    "Async Toolkit": [
      ["createAsyncThunk", "Generate pending, fulfilled and rejected actions around an asynchronous task.", [
        "Define one asynchronous payload creator for the request.",
        "Handle pending, fulfilled and rejected cases in reducers.",
        "Use dispatch(thunk()).unwrap() when callers need thrown failures.",
      ]],
      ["Thunk cancellation", "Propagate abort signals and distinguish canceled work from an ordinary application failure.", [
        "Pass the thunk's abort signal to supported request APIs.",
        "Abort dispatched work when its owning workflow is canceled.",
        "Inspect cancellation metadata before displaying an error.",
      ]],
      ["rejectWithValue", "Return a typed expected error payload rather than losing it in a generic thrown error.", [
        "Use rejectWithValue for expected validation or domain errors.",
        "Declare the rejection payload type in thunk configuration.",
        "Distinguish rejected payloads from unexpected serialized exceptions.",
      ]],
      ["Request IDs and race handling", "Accept a result only if it belongs to the still-relevant request.", [
        "Save the active requestId when a request begins.",
        "Compare completion metadata before updating the slice.",
        "Ignore late results from requests the user has superseded.",
      ]],
      ["Listener middleware", "React to actions or state changes with cancellable effect workflows outside reducers.", [
        "Register listeners for meaningful actions or state predicates.",
        "Run side effects outside the reducer's pure transition.",
        "Cancel obsolete listener tasks for take-latest workflows.",
      ]],
      ["createEntityAdapter", "Manage normalized entities with standard update helpers and derived selectors.", [
        "Store IDs and entity records in a normalized shape.",
        "Use adapter CRUD helpers inside appropriate reducers.",
        "Export generated selectors scoped to the entity slice.",
      ]],
    ],
    "RTK Query": [
      ["createApi and baseQuery", "Define a server-data API slice with shared request behavior and endpoint contracts.", [
        "Choose a base query that returns data or error consistently.",
        "Register the API reducer and middleware in the store.",
        "Centralize headers and request transformation at the API boundary.",
      ]],
      ["Query endpoints", "Cache reads by endpoint and serialized arguments and subscribe through generated hooks.", [
        "Define read operations as queries with explicit argument types.",
        "The endpoint and serialized argument identify the cached request.",
        "Share cache entries across equivalent active subscriptions.",
      ]],
      ["Mutation endpoints", "Represent server writes and define how successful changes affect cached queries.", [
        "Define write operations with their request and result types.",
        "Invalidate relevant query tags after server state changes.",
        "Handle mutation errors independently from cached read data.",
      ]],
      ["Cache tags and invalidation", "Invalidate the smallest relevant group of cached results after a mutation.", [
        "Provide tags that describe records or list membership.",
        "Invalidate affected IDs after successful changes.",
        "Use broader list tags when insertions affect collection results.",
      ]],
      ["Polling and refetch policies", "Balance freshness with bandwidth using focus, reconnect and polling behavior.", [
        "Enable focus and reconnect behavior with setupListeners.",
        "Choose polling intervals that match actual freshness needs.",
        "Stop unnecessary polling when the consuming view is absent.",
      ]],
      ["Optimistic updates", "Patch cached data immediately and roll back or invalidate when a mutation fails.", [
        "Apply a cache patch before the server confirms the mutation.",
        "Undo the patch on failure when reversal is unambiguous.",
        "Prefer invalidation when overlapping optimistic writes complicate rollback.",
      ]],
      ["Streaming cache updates", "Subscribe to server events for a cache entry and clean up when its lifecycle ends.", [
        "Open the stream from the cache-entry lifecycle handler.",
        "Apply incoming changes through updateCachedData.",
        "Close external subscriptions when cacheEntryRemoved resolves.",
      ]],
      ["Pagination and infinite data", "Model pages and arguments so cached results do not overwrite unrelated query states.", [
        "Include filters and page identity in query arguments.",
        "Define page merging and refresh behavior deliberately.",
        "Avoid mixing results from different searches into one list.",
      ]],
      ["Authentication and reauthorization", "Centralize credential handling and coordinate refresh behavior across failed requests.", [
        "Attach credentials through centralized request configuration.",
        "Coordinate refresh attempts to avoid parallel token-refresh storms.",
        "Retry the original request only after successful reauthorization.",
      ]],
      ["Code splitting and endpoint injection", "Extend an API slice without creating unnecessary isolated caches.", [
        "Inject feature endpoints into a shared API slice.",
        "Keep a common base URL and cache tag vocabulary.",
        "Export hooks from the extended API returned by injection.",
      ]],
    ],
    "Toolkit production": [
      ["Serializability checks", "Diagnose unsupported state or action values rather than disabling checks broadly.", [
        "Keep functions, promises and class instances out of normal state.",
        "Investigate the exact warning path and action payload.",
        "Configure narrow exceptions only for intentional integration boundaries.",
      ]],
      ["Reducer injection", "Load state domains dynamically with a predictable root-state contract.", [
        "Add reducers through a controlled dynamic-loading boundary.",
        "Define the root-state type for potentially absent slices.",
        "Initialize new slice state before consumers depend on it.",
      ]],
      ["SSR and hydration", "Create a store per request and hydrate only the state intended for the client.", [
        "Construct a fresh store for each server request.",
        "Serialize only client-appropriate preloaded state.",
        "Match the client's initial render to the server snapshot.",
      ]],
      ["RTK Query testing", "Test cache behavior, invalidation and errors through realistic request flows.", [
        "Exercise requests through a realistic mocked HTTP boundary.",
        "Verify cached reuse, tag invalidation and error rendering.",
        "Reset API state between independent test cases.",
      ]],
      ["Performance profiling", "Inspect selector changes and unnecessary subscriptions before adding memoization everywhere.", [
        "Measure which state changes trigger expensive component renders.",
        "Inspect selected references and query subscriptions first.",
        "Memoize costly derivations after identifying actual recomputation.",
      ]],
      ["Redux to Toolkit migration", "Adopt configureStore and slices incrementally while preserving application behavior.", [
        "Adopt configureStore before rewriting existing reducers.",
        "Convert one reducer domain into a slice incrementally.",
        "Preserve integration tests while replacing async boilerplate.",
      ]],
    ],
  }),
];
