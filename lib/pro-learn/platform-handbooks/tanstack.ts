import { defineHandbook } from "./shared";

/**
 * The TanStack libraries, one handbook each.
 *
 * They share a headless philosophy and very little else: Query owns server
 * state, Table owns row models, Router owns typed navigation. Splitting them
 * keeps each catalogue's categories meaningful — a single "TanStack" tab would
 * mix cache invalidation with column sizing and leave every category ambiguous.
 */
export const TANSTACK_HANDBOOKS = [
  defineHandbook("TanStack Query", "Queries, caching, invalidation, mutations, pagination, prefetching, SSR and testing for server state.", "https://tanstack.com/query/latest/docs/framework/react/overview", {
    mechanism: "Query treats server data as a cache keyed by a query key, not as component state. A query reports status and data; staleness decides when a refetch happens; invalidation marks entries for refetch rather than deleting them.",
    example: "A product list uses the key ['products', filters]. Editing a product runs a mutation, then invalidates ['products'] so every dependent list refetches. The detail view reads from the same cache and shows data immediately while it revalidates.",
    pitfall: "A query key built from an unstable object identity produces a new cache entry on every render. Keys must serialize to the same value for the same request, and staleTime of zero is not the same as no caching.",
  }, {
    "Hooks": [
      ["useQueries", "Run a dynamic list of queries together and read their results as an array.", [
        "The number of queries may change between renders, which a list of hooks cannot do.",
        "Each entry keeps its own key, status and cache lifetime.",
        "A combine function reduces the array into one value without an extra render.",
      ]],
      ["useSuspenseQuery", "Suspend the component until data is ready instead of branching on a loading flag.", [
        "Data is never undefined in the component, so the type has no loading branch.",
        "The nearest Suspense boundary owns the fallback, not the component itself.",
        "Two suspense queries in one component fetch in series unless they are hoisted.",
      ]],
      ["useSuspenseInfiniteQuery", "Page through data under Suspense, where the first page suspends and the rest do not.", [
        "The first page suspends; later pages resolve without unmounting the list.",
        "Rendered rows stay on screen while the next page is in flight.",
        "The boundary is for the initial load only, so scrolling never blanks the view.",
      ]],
      ["useQueryClient", "Reach the client from a component to invalidate, set or read cached data.", [
        "The client is how imperative code reaches the cache outside a hook result.",
        "It reads context, so it works only under the provider that owns the cache.",
        "Use it in an event handler; use hooks for anything that should re-render.",
      ]],
      ["useIsFetching and useIsMutating", "Drive a global activity indicator from counts rather than from each query's flags.", [
        "A count of active requests drives one top-level progress bar.",
        "Filters narrow the count to a feature area rather than the whole application.",
        "Background revalidation is included, so a spinner here means activity, not blocking.",
      ]],
      ["useMutationState", "Observe mutations started elsewhere, keyed by mutation key.", [
        "A list can show a pending row created by a form somewhere else entirely.",
        "Mutations are matched by key, so unrelated writes stay out of the view.",
        "It exposes variables and status without lifting the mutation into shared state.",
      ]],
      ["usePrefetchQuery", "Start a fetch during render for data a child will need immediately.", [
        "Starting the fetch during render removes a waterfall a child would create.",
        "It returns nothing: the point is the cache entry, not a value to read.",
        "Prefetch what a child certainly needs, not what it might need.",
      ]],
      ["Query options factories", "Share key, function and options through queryOptions so every hook agrees on them.", [
        "One factory keeps the key and the fetcher from drifting apart across files.",
        "Prefetch, invalidate and read all take the same object, so they cannot disagree.",
        "Types flow from the factory, so a changed response shape breaks every consumer.",
      ]],
      ["Hook-level select", "Transform or narrow data in the hook so the component re-renders only when its slice changes.", [
        "A selector narrows the data so unrelated fields cannot cause a render.",
        "It runs after the fetch, on cached data, not as part of the request.",
        "An inline function that returns a new object defeats the comparison it relies on.",
      ]],
      ["Hooks in tests", "Wrap the hook in a fresh QueryClientProvider per test and turn retries off.", [
        "A fresh client per test stops one case seeding another through the cache.",
        "Retries off turns a deliberate failure into an immediate assertion.",
        "Assert on rendered output rather than on the internals of the cache.",
      ]],
    ],
    "Query fundamentals": [
      ["useQuery", "Read server state declaratively and render from status, data and error rather than manual loading flags.", [
        "The hook owns fetching, caching, retries and revalidation for one key.",
        "Several components asking for the same key share one request and one entry.",
        "Rendering from status is what removes the effect-plus-state pattern entirely.",
      ]],
      ["Query keys", "Identify a cache entry with a serializable key whose parts describe exactly what was requested.", [
        "The key is the cache identity, so anything that changes the request belongs in it.",
        "Keys are hashed deterministically, so property order in an object does not matter.",
        "Prefix keys by feature so a whole area can be invalidated in one call.",
      ]],
      ["Query functions", "Return a promise that rejects on failure so the library can distinguish success from error.", [
        "A fetcher must throw on a failed response, because fetch does not reject on 404.",
        "It receives the key and an abort signal as its argument.",
        "Keep it free of component state so the same call can run from a prefetch.",
      ]],
      ["QueryClient and provider", "Create one client per application and share it so components read the same cache.", [
        "Defaults set on the client apply to every query that does not override them.",
        "One client per application on the client; one per request on the server.",
        "Creating the client inside a component body makes a new cache on every render.",
      ]],
      ["Status and fetchStatus", "Separate whether data exists from whether a request is currently in flight.", [
        "Status answers whether data exists; fetch status answers whether a request is running.",
        "Cached data with a background refetch is success and fetching at the same time.",
        "Showing a full-page spinner for a background refetch is the usual mistake.",
      ]],
      ["staleTime and gcTime", "Decide how long data is considered fresh, and how long an unused entry survives in memory.", [
        "Stale time controls refetching; garbage collection time controls memory.",
        "A stale time of zero still serves from cache, it just revalidates immediately.",
        "Data that changes rarely deserves minutes of freshness, not the default.",
      ]],
    ],
    "Caching & invalidation": [
      ["invalidateQueries", "Mark matching entries stale so active observers refetch instead of clearing the cache.", [
        "Invalidation refetches what is on screen and marks the rest stale for later.",
        "Removing an entry instead throws away data a component is still rendering.",
        "Awaiting it lets a handler wait until dependent views are up to date.",
      ]],
      ["Query filters", "Target a subset of the cache by key prefix, status or staleness when invalidating or cancelling.", [
        "A filter matches by key prefix, so one call can reach a whole feature.",
        "Predicates handle the cases a prefix cannot express.",
        "The same filters apply to cancelling, removing and reading the cache.",
      ]],
      ["setQueryData", "Write a known value into the cache directly to reflect a result you already have.", [
        "Writing the server response directly saves a round trip the client already made.",
        "The updater must return a new value; mutating the cached object skips the update.",
        "Data written this way is immediately stale unless the entry says otherwise.",
      ]],
      ["Structural sharing", "Keep unchanged references stable across refetches so consumers do not rerender needlessly.", [
        "Unchanged parts of a response keep their previous references after a refetch.",
        "That keeps memoised children and effect dependencies from firing needlessly.",
        "It only works on plain JSON-like data, not on class instances.",
      ]],
      ["refetchOnWindowFocus", "Choose when regaining focus should revalidate, and when that would surprise the reader.", [
        "Refetching on focus keeps a dashboard current after a tab sits idle.",
        "The same behaviour on a half-filled form can replace what the user was reading.",
        "Set it per query, because the right answer differs by screen.",
      ]],
      ["Dependent queries", "Gate a query on another result with enabled rather than firing it with undefined input.", [
        "The enabled flag holds a query until its input actually exists.",
        "A disabled query reports pending rather than error, so the UI stays honest.",
        "Chaining too many dependent queries rebuilds the waterfall the cache removed.",
      ]],
    ],
    "Mutations": [
      ["useMutation", "Model a write as an explicit action with its own pending, error and success states.", [
        "A mutation does not run on render; it runs when something calls mutate.",
        "Pending state belongs to the action, so a button can disable itself.",
        "The async form lets a handler await the result and then navigate.",
      ]],
      ["Optimistic updates", "Apply the expected result immediately and keep a snapshot to restore if the write fails.", [
        "The screen updates before the server answers, which is what makes it feel instant.",
        "Cancel in-flight reads first, or a refetch overwrites the optimistic value.",
        "Keep the snapshot: without it a failed write has nothing to roll back to.",
      ]],
      ["onMutate, onError, onSettled", "Use the lifecycle to cancel in-flight reads, roll back and then resynchronize.", [
        "onMutate runs before the request and returns the rollback context.",
        "onError receives that context and restores the previous cache contents.",
        "onSettled runs either way, which is where invalidation belongs.",
      ]],
      ["Mutation keys and scoping", "Name mutations so concurrent writes can be tracked or serialized deliberately.", [
        "A key lets other components observe a write they did not start.",
        "A scope serialises writes that share it, instead of letting them race.",
        "Unkeyed mutations are fine until two of them touch the same record.",
      ]],
      ["Retry semantics for writes", "Understand why a non-idempotent write should not retry the way a read does.", [
        "A retried create can produce two records, unlike a retried read.",
        "Retry only when the server treats a repeated request as the same operation.",
        "An idempotency key is what makes a safe retry possible at all.",
      ]],
      ["Invalidation after a write", "Decide which query keys a mutation makes stale rather than refetching everything.", [
        "Name the keys the write actually affects rather than clearing everything.",
        "Over-invalidating turns one save into a burst of refetches.",
        "Under-invalidating leaves a stale list beside a freshly saved detail view.",
      ]],
    ],
    "Pagination & streaming": [
      ["Paginated queries", "Keep the previous page visible while the next one loads instead of flashing empty.", [
        "Keeping the previous page visible avoids a layout jump on every click.",
        "Each page is its own cache entry, so going back is instant.",
        "Prefetch the next page while the reader is still on the current one.",
      ]],
      ["placeholderData", "Show a stand-in value that is never written to the cache as if it were real data.", [
        "Placeholder data renders immediately but is never written to the cache.",
        "Derive it from the previous page, or from a list row already fetched.",
        "Initial data is different: it is treated as real, cached data.",
      ]],
      ["useInfiniteQuery", "Accumulate pages with getNextPageParam and render a growing list from page data.", [
        "Pages accumulate in one entry rather than replacing one another.",
        "The next page parameter is derived from the last page, usually a cursor.",
        "Returning undefined from it is what tells the list it has reached the end.",
      ]],
      ["Bidirectional infinite lists", "Fetch older and newer pages from the same entry when the feed grows at both ends.", [
        "A chat log grows at both ends, so it needs a previous page as well as a next.",
        "Prepending must adjust scroll position or the view jumps as content arrives.",
        "Cap the retained pages, since an unbounded feed grows without limit.",
      ]],
      ["Prefetching", "Warm a cache entry before navigation so the next screen renders without a spinner.", [
        "Prefetch on hover or on intent, so the data is there when the click lands.",
        "The fetch is skipped when a fresh entry already exists.",
        "Prefetching everything on a page costs bandwidth that the reader may never use.",
      ]],
      ["Cancellation", "Abort a superseded request with the signal the query function receives.", [
        "The abort signal ends a request that a newer one has already superseded.",
        "Fetchers must pass the signal through or cancellation has no effect.",
        "Cancelling before an optimistic write stops a stale response from landing.",
      ]],
    ],
    "Server rendering & testing": [
      ["Hydration boundaries", "Dehydrate prefetched entries on the server and hydrate them on the client without refetching.", [
        "The server serialises what it fetched and the client adopts it as cache.",
        "Without hydration the client refetches everything the server already had.",
        "Only serialisable data survives, so class instances need a transformer.",
      ]],
      ["Per-request clients", "Create a fresh client per server request so no user sees another user's cached data.", [
        "A module-level client on the server would share one cache between users.",
        "Creating it per request keeps one visitor's data out of another's response.",
        "The same rule applies to any per-user default set on the client.",
      ]],
      ["Suspense mode", "Let a boundary render the pending state instead of branching on status in the component.", [
        "The boundary decides the fallback, so sibling components can share one.",
        "Components read data directly, with no status branch in the markup.",
        "A boundary placed too high blanks more of the page than it needs to.",
      ]],
      ["Error boundaries", "Throw query errors to a boundary when a screen cannot render without the data.", [
        "Throwing on error moves failure handling out of every component.",
        "A reset lets the reader retry without reloading the page.",
        "Keep inline error handling where a partial screen is still useful.",
      ]],
      ["Testing queries", "Disable retries and use a fresh client per test so failures surface fast and stay isolated.", [
        "A client created inside the test wrapper cannot leak between cases.",
        "Retries on turn a one-line failure into a multi-second timeout.",
        "Mock at the network boundary so the real fetcher and key are exercised.",
      ]],
      ["Devtools", "Inspect keys, staleness and observers to explain a refetch you did not expect.", [
        "The panel lists every entry with its key, status and observer count.",
        "An entry with no observers explains why a refetch never happens.",
        "Two entries that should be one usually means an unstable key.",
      ]],
    ],
  }),

  defineHandbook("TanStack Form", "Type-safe fields, validation, async checks, arrays, submission and framework adapters.", "https://tanstack.com/form/latest/docs/overview", {
    mechanism: "The form owns the values; a field subscribes to one path and rerenders only when that path changes. Validators run per field and for the form as a whole, at points you choose rather than on every keystroke by default.",
    example: "A signup form validates email format on blur and checks availability asynchronously with a debounce. Submission is blocked while any async validator is pending, and server-returned errors are mapped back onto the fields that caused them.",
    pitfall: "Async validation without debouncing and without awaiting the pending state lets a user submit while a check is still running, so a stale valid result can pass a value the server will reject.",
  }, {
    "Hooks": [
      ["useField", "Read and update one field, with its own validators and meta, from a component.", [
        "The hook gives one field its value, its handlers and its own meta.",
        "Only the component holding that field re-renders when the value changes.",
        "Field validators declared here travel with the field wherever it is used.",
      ]],
      ["form.Field", "Bind a field through a render prop when the field's state should not lift a whole form render.", [
        "The render prop keeps field state out of the surrounding component.",
        "A parent that never reads the value is never re-rendered by typing in it.",
        "It is the right shape when fields are generated from a configuration list.",
      ]],
      ["form.Subscribe", "Re-render a small part of the form when a selected piece of form state changes.", [
        "Subscribing renders only the part that depends on the selected state.",
        "A submit button can track validity without the whole form re-rendering.",
        "The selector should return a primitive, or the comparison never matches.",
      ]],
      ["useStore with a form selector", "Subscribe to a slice of form state - canSubmit, isDirty, errors - instead of the whole store.", [
        "Reading a slice keeps unrelated keystrokes from touching the subscriber.",
        "Submittability, dirtiness and the error map are the usual slices.",
        "Selecting the whole store subscribes to everything and defeats the purpose.",
      ]],
      ["formOptions", "Declare shared form configuration once and reuse it across client and server.", [
        "Shared options are declared once and reused by every form that needs them.",
        "The same object can be used on the server, which keeps validation identical.",
        "Default values declared here are what the field types are inferred from.",
      ]],
      ["useTransform and mergeForm", "Merge server-returned state into the client form after a submission.", [
        "A server response can be merged back into the live form state.",
        "This is how server-side errors reach the fields that caused them.",
        "The merge keeps what the user typed instead of resetting the form.",
      ]],
      ["Field-level validators", "Attach sync and async validation to the field that owns it, with its own debounce.", [
        "A field validates itself, so moving it does not move its rules.",
        "Each field can have its own timing and its own debounce interval.",
        "Errors returned here are already associated with the field that owns them.",
      ]],
      ["Array fields", "Add, remove and reorder rows while keeping each row's validation and meta attached.", [
        "Rows are addressed by index, and the API keeps their state aligned on change.",
        "Each row keeps its own validation and touched state across a reorder.",
        "Push, insert and remove through the form rather than mutating the array.",
      ]],
    ],
    "Form fundamentals": [
      ["useForm", "Create a form with typed default values that drive every field's inferred type.", [
        "Default values define the shape, and every field path is checked against it.",
        "The form owns the values; fields are views onto paths within them.",
        "The submit handler receives the whole validated value in one place.",
      ]],
      ["Field components", "Subscribe a single field to its own path so unrelated edits do not rerender it.", [
        "A field subscribes to one path, so typing in it does not render its siblings.",
        "This is what keeps a long form responsive as it grows.",
        "The component decides its own markup; the library supplies only state.",
      ]],
      ["Typed field paths", "Reach nested values with paths the compiler checks against the form's shape.", [
        "A path is checked against the value shape, so a typo is a compile error.",
        "Nested objects and arrays are reachable with dotted and indexed paths.",
        "Renaming a field surfaces at every place that referenced it.",
      ]],
      ["Field state", "Read touched, dirty, pending and error state to decide what the field should show.", [
        "Touched separates a field the user has visited from one they have not.",
        "Dirty says the value differs from the default, which drives unsaved-change prompts.",
        "Showing an error before a field is touched is what makes a form feel hostile.",
      ]],
      ["Default and initial values", "Distinguish the value a form starts with from the value a reset returns to.", [
        "Default values seed an empty form; initial values populate an edit form.",
        "Reset returns to whichever of the two the form was constructed with.",
        "Loading data after mount needs an explicit reset, not a changed prop.",
      ]],
      ["Controlled inputs", "Wire value and change handlers so the form stays the single source of truth.", [
        "The input reads its value from field state and reports changes back.",
        "Mixing in local component state gives two sources of truth that drift.",
        "Uncontrolled inputs still work, but their values bypass validation timing.",
      ]],
    ],
    "Validation": [
      ["Field validators", "Validate one value in isolation and return a message the field can render.", [
        "A field rule sees one value and returns a message or nothing.",
        "Keep the message about what the user must do, not about the internal rule.",
        "Pure functions here stay testable without rendering the form.",
      ]],
      ["Form-level validators", "Express rules that need more than one field, such as matching passwords.", [
        "Some rules need two values, so they cannot live on either field.",
        "Attach the resulting issue to the field the user should correct.",
        "Form rules run after the fields pass, so they see validated values.",
      ]],
      ["Validation timing", "Choose change, blur or submit per rule so the form corrects rather than nags.", [
        "Validating on every keystroke reports an error before the entry is finished.",
        "Blur is the usual first pass; submit is the guaranteed one.",
        "Once a field has failed, revalidating on change lets it recover immediately.",
      ]],
      ["Schema validation", "Drive validation from a Zod or Valibot schema and keep one definition of the shape.", [
        "One schema can validate the form and type the submitted value.",
        "The same schema runs on the server, so the two cannot drift apart.",
        "Schema issues map onto fields by path with no manual translation.",
      ]],
      ["Async validators", "Check availability against a server with debouncing and a pending state that blocks submit.", [
        "A server check needs a debounce or it fires on every keystroke.",
        "Submission must wait for a pending check, or a stale pass slips through.",
        "Show the pending state, so the reader knows why submit is disabled.",
      ]],
      ["Error mapping", "Return server-side failures onto the specific fields that produced them.", [
        "A rejected submission returns errors keyed by field path.",
        "Mapping them back puts each message next to the input that caused it.",
        "A single banner saying the save failed leaves the reader hunting.",
      ]],
    ],
    "Arrays & dynamic fields": [
      ["Field arrays", "Render a repeating group and keep each row's identity stable across reorders.", [
        "A stable key per row keeps focus and errors attached through a reorder.",
        "Using the array index as the key loses that state the moment rows move.",
        "The row component reads its own path rather than the whole array.",
      ]],
      ["Adding and removing rows", "Mutate the array through the form API so validation and dirty state stay correct.", [
        "Mutating through the form keeps validation and dirty state consistent.",
        "Removing a row must drop its errors too, or the form stays invalid invisibly.",
        "Inserting in the middle shifts every later path, which the API handles.",
      ]],
      ["Nested objects", "Model grouped fields as an object and validate the group as a unit.", [
        "Grouped fields validate as a unit when the group has its own rule.",
        "Paths mirror the shape, so an address block reads as one object.",
        "The submitted value arrives already nested, needing no reassembly.",
      ]],
      ["Conditional fields", "Show and validate a field only while another value makes it relevant.", [
        "A hidden field should stop validating, or submit fails on something invisible.",
        "Decide whether hiding clears the value or preserves it for when it returns.",
        "Drive visibility from form state rather than from separate component state.",
      ]],
      ["Reordering", "Move rows without losing per-row errors or focus.", [
        "Moving a row keeps its errors, its touched flag and its focus.",
        "Reordering is a form operation, not an array mutation done outside it.",
        "Announce the move, or a keyboard user has no idea the list changed.",
      ]],
      ["Array-level validation", "Enforce minimum and maximum counts separately from each row's own rules.", [
        "Minimum and maximum counts belong to the array, not to any row.",
        "Uniqueness across rows is an array rule with an issue pointing at a row.",
        "Row rules still run, so both levels report independently.",
      ]],
    ],
    "Submission & integration": [
      ["onSubmit", "Receive validated values once and perform the write from a single place.", [
        "The handler receives one validated value, so the write happens in a single place.",
        "Validation runs first, so an invalid form never reaches the handler.",
        "Throwing here surfaces as a submission error rather than an unhandled rejection.",
      ]],
      ["canSubmit and isSubmitting", "Derive button state from the form instead of tracking a separate flag.", [
        "Derived state removes the separate flag that always drifts out of sync.",
        "A submit button disabled on pending async validation prevents a double write.",
        "Both come from a subscription, so the button alone re-renders.",
      ]],
      ["Reset and clear", "Return to initial values or to empty, and know which one the user expects.", [
        "Reset returns to the values the form started with, not to empty.",
        "Clearing to empty is a different intent and needs explicit values.",
        "Resetting after a successful save also drops the unsaved-change warning.",
      ]],
      ["Server actions", "Submit to a server function and surface its result without losing entered values.", [
        "A form can submit to a server function and receive typed results back.",
        "Keep the entered values on failure, so the reader does not retype the form.",
        "Validate on the server too: the client schema is a convenience, not a guard.",
      ]],
      ["Progressive enhancement", "Keep a form usable before hydration and enrich it once the client takes over.", [
        "A real form element and a method mean the page works before hydration.",
        "Client validation then enriches a form that already submits without it.",
        "Anything that only exists in JavaScript must not be required to submit.",
      ]],
      ["Framework adapters", "Use the binding for React, Vue, Solid or Angular without changing the core model.", [
        "The core is framework-agnostic; the adapter supplies reactivity.",
        "Validation, arrays and submission behave the same across React, Vue and Solid.",
        "Only the binding layer changes when a team moves between frameworks.",
      ]],
    ],
  }),

  defineHandbook("TanStack Table", "Headless row models, columns, sorting, filtering, grouping, selection, pinning and virtualization.", "https://tanstack.com/table/latest/docs/introduction", {
    mechanism: "The table is headless: it computes row models and leaves every element to you. Features compose as a pipeline — filtering feeds sorting, sorting feeds grouping, grouping feeds pagination — and each stage produces a new row model.",
    example: "An orders table filters by status, sorts by date, paginates server-side and lets the reader pin the order number column. State lives in the component so a URL can restore the exact view.",
    pitfall: "Defining columns inline recreates them on every render and resets table state. Column definitions and data must both keep stable references, usually through memoization.",
  }, {
    "Table hooks & state": [
      ["Row model functions", "getCoreRowModel and its siblings are what enable sorting, filtering, grouping and pagination.", [
        "Each row model is opt-in, so a plain table pays for nothing it does not use.",
        "They run in a fixed order: filter, sort, group, expand, then paginate.",
        "A feature that silently does nothing is usually a missing row model.",
      ]],
      ["Controlled table state", "Lift sorting, filtering or pagination into your own state and pass it back in.", [
        "Lifting state lets a URL or a store own the current sort and page.",
        "The table stops tracking what you control, so the value must come back in.",
        "Partial control is allowed: lift only the slices the application cares about.",
      ]],
      ["Manual server-side state", "Turn on manualSorting, manualFiltering or manualPagination when the server does the work.", [
        "Manual mode tells the table the rows it received are already sorted or paged.",
        "Without it the table sorts the current page again and the order looks wrong.",
        "Supply the total row count yourself, since the table cannot infer it.",
      ]],
      ["Header and cell renderers", "A header or cell definition may be a value, a function or a component, and all three render the same way.", [
        "A definition may be a plain value, an element or a function of the context.",
        "One render helper handles all three, so call sites need no branching.",
        "The function form receives the row, so a cell can render an action for it.",
      ]],
      ["Column helpers and typing", "Define columns through the typed helper so accessors and cell values stay in step.", [
        "The helper infers the cell type from the accessor it is given.",
        "A renamed data field breaks the column definition rather than rendering blank.",
        "Sorting and filtering functions are typed against the same value.",
      ]],
      ["Reading header groups and rows", "Draw the table from getHeaderGroups and getRowModel rather than from your source array.", [
        "Header groups already account for nesting, pinning and visibility.",
        "Rendering the source array directly bypasses every feature the table adds.",
        "The row model is what reflects the current sort, filter and page.",
      ]],
      ["Table state slices", "Subscribe to one piece of table state instead of re-rendering on every table change.", [
        "Subscribing to one slice keeps a header from re-rendering on a filter change.",
        "It matters once a table holds hundreds of cells.",
        "Read the slice where it is used rather than threading it from the top.",
      ]],
      ["Row identity across state", "Give each row a stable id, or selection and expansion follow positions instead of rows.", [
        "A stable id keeps a selection attached to a record across a re-sort.",
        "Index-based identity silently selects a different row when the order changes.",
        "The same id drives expansion, pinning and optimistic updates.",
      ]],
    ],
    "Table fundamentals": [
      ["useReactTable", "Create a table instance from data, columns and the row models a view needs.", [
        "The instance is the single object every header, row and cell is drawn from.",
        "It holds state, row models and the feature configuration together.",
        "The instance is recreated per render but keeps its state across renders.",
      ]],
      ["Column definitions", "Describe an accessor, a header and a cell renderer for each column.", [
        "A column says where its value comes from and how it is displayed.",
        "Definitions are data, so they can be generated from a schema.",
        "Per-column options carry sorting, filtering and sizing behaviour.",
      ]],
      ["Accessor and display columns", "Separate columns that read a value from columns that render controls.", [
        "An accessor column has a value and can therefore be sorted and filtered.",
        "A display column holds checkboxes or buttons and has no value at all.",
        "Giving a display column an accessor produces a column that sorts on nothing.",
      ]],
      ["Row models", "Add only the models a table uses, since each one costs work on every change.", [
        "Every added model recomputes on each data or state change.",
        "A table without pagination should not include the pagination model.",
        "The cost shows up on large datasets long before it shows up on small ones.",
      ]],
      ["flexRender", "Render a header or cell definition that may be a value, an element or a function.", [
        "The helper resolves whichever of the three definition forms was used.",
        "It passes the header or cell context through to a function definition.",
        "Calling a definition directly breaks as soon as someone passes a component.",
      ]],
      ["Stable data and columns", "Memoize both so the instance does not discard its state each render.", [
        "A new array identity each render makes the table rebuild its row models.",
        "Column definitions are static and belong outside the component or in a memo.",
        "The symptom is a table that loses its sort or selection while typing.",
      ]],
    ],
    "Sorting & filtering": [
      ["Sorting state", "Track which columns sort, in what direction, and whether multiple sorts combine.", [
        "The state is a list, which is what makes multi-column sorting expressible.",
        "Direction and null placement are part of the column, not of the click handler.",
        "Toggling cycles ascending, descending and off unless that is configured away.",
      ]],
      ["Custom sort functions", "Order values the default comparator cannot, such as localized text or nulls.", [
        "Locale-aware text sorting needs a comparator, not the default ordering.",
        "Decide explicitly where empty values belong rather than letting them scatter.",
        "A comparator registered by name can be reused across columns.",
      ]],
      ["Column filters", "Filter one column at a time with a predicate the column owns.", [
        "Each column owns its predicate, so a date column can filter by range.",
        "Filters combine, so two columns narrow the rows together.",
        "The filter value is state, which means it can be restored from a URL.",
      ]],
      ["Global filter", "Search across columns with a single input and a shared matching rule.", [
        "One input matches across the columns that opt into it.",
        "The matching rule is yours: substring, fuzzy or normalised.",
        "Debounce the input, since every keystroke recomputes the row model.",
      ]],
      ["Faceted values", "Offer filter options drawn from the data actually present in the column.", [
        "Facets are built from the data present, so a filter never offers an empty option.",
        "Counts beside each option tell the reader what a choice will cost.",
        "Facets must be computed after other filters if they should narrow together.",
      ]],
      ["Manual filtering and sorting", "Hand the work to a server and tell the table not to recompute it.", [
        "The server does the work and the table just renders what came back.",
        "State changes become query parameters rather than local recomputation.",
        "Forgetting the manual flag makes the table re-sort the page it was given.",
      ]],
    ],
    "Grouping & aggregation": [
      ["Grouping state", "Collapse rows under a grouping column and expand them on demand.", [
        "Grouping by a column collapses its rows under one header row.",
        "The grouped column is removed from the leaf rows that sit beneath it.",
        "Grouping runs before pagination, which changes what a page contains.",
      ]],
      ["Aggregation functions", "Summarize a group with a sum, mean or custom reducer.", [
        "An aggregate is computed per group, not per visible page.",
        "Sum, mean and count cover most cases; a reducer covers the rest.",
        "Aggregating a formatted string instead of its number is the usual bug.",
      ]],
      ["Expanding", "Control which groups or sub-rows are open, including nested hierarchies.", [
        "Expansion state is keyed by row id, so it survives a re-sort.",
        "The same mechanism serves group rows and nested sub-rows.",
        "Expanding everything on a large table defeats the point of grouping.",
      ]],
      ["Sub-rows", "Render tree data by pointing the table at each row's children.", [
        "A tree is described by pointing each row at its children.",
        "Depth is available per row, which is what indentation is drawn from.",
        "Filtering a tree has to decide whether a matching child keeps its parent.",
      ]],
      ["Aggregated cell rendering", "Show a different cell for a group row than for a leaf row.", [
        "A group row usually shows a total where a leaf shows a value.",
        "Placeholder cells appear where a grouped column has nothing to show.",
        "Rendering the same cell for both makes a summary row read as a record.",
      ]],
      ["Grouping with pagination", "Understand which rows a page counts when groups are collapsed.", [
        "Pages count the rows the model produced, which may be group rows.",
        "Expanding a group can therefore change how many pages exist.",
        "Decide whether a page should hold whole groups before choosing the size.",
      ]],
    ],
    "Selection, layout & scale": [
      ["Row selection", "Track selected rows by a stable row id rather than by index.", [
        "Selection is a map of row id to boolean, not a list of indexes.",
        "Select-all across pages is a different feature from select-all on this page.",
        "Keeping selection through a filter needs a decision about hidden rows.",
      ]],
      ["Column visibility", "Let a reader hide columns and persist that choice with the view.", [
        "Hidden columns stay in the definitions and can be restored.",
        "Persisting the choice is what makes a wide table usable on a second visit.",
        "A hidden column still filters unless it is excluded deliberately.",
      ]],
      ["Column ordering", "Reorder columns without changing the underlying definitions.", [
        "Order is a list of column ids kept separately from the definitions.",
        "Pinned columns sit outside that order at their own edge.",
        "Drag handles are yours to build; the table only tracks the resulting order.",
      ]],
      ["Column sizing and resizing", "Size columns and handle a resize interaction in your own markup.", [
        "The table tracks widths; the markup decides how they are applied.",
        "Resizing updates on every pointer move, so it needs to stay cheap.",
        "A minimum width keeps a dragged column from collapsing to nothing.",
      ]],
      ["Column and row pinning", "Freeze columns or rows at an edge while the rest scrolls.", [
        "A pinned column is rendered in its own group at the left or right.",
        "Sticky positioning in the markup is what actually freezes it on screen.",
        "Pinned rows are excluded from the scrolling body, so counts shift.",
      ]],
      ["Virtualized rows", "Render only visible rows for large datasets while keeping the row model intact.", [
        "Only the visible window is rendered while the row model stays complete.",
        "Sorting and filtering still see every row, because they run on the model.",
        "Row height estimation is what keeps the scrollbar honest.",
      ]],
    ],
  }),

  defineHandbook("TanStack Router", "Type-safe routes, loaders, search parameters, navigation, guards and code splitting.", "https://tanstack.com/router/latest/docs/framework/react/overview", {
    mechanism: "Routes form a typed tree. Each route can declare a loader that runs before render and search parameter validation that parses the query string into typed values, so navigation carries data rather than triggering a fetch inside a component.",
    example: "A search results route validates page and query from the URL, loads matching results in its loader, and links to page two by updating typed search parameters. Sharing the URL reproduces the exact view.",
    pitfall: "Treating search parameters as strings defeats the point. Without a validator the route hands components unparsed values, and a malformed URL becomes a runtime failure instead of a handled default.",
  }, {
    "Hooks": [
      ["useNavigate", "Navigate imperatively with typed params and search, from an event handler.", [
        "The target route id is checked, so a deleted route breaks the build.",
        "Params and search are typed against that route's own definitions.",
        "Replace rather than push when the current entry should not return on back.",
      ]],
      ["useParams", "Read typed path parameters for the matched route.", [
        "Parameters arrive already parsed, so no cast is needed at the call site.",
        "Reading from a route that does not declare the parameter is a type error.",
        "A strict option decides whether the hook reads this match or the nearest one.",
      ]],
      ["useSearch", "Read validated search parameters as typed state rather than parsing the query string.", [
        "Search is validated state, not a string the component parses itself.",
        "Defaults are applied, so a missing parameter still has a usable value.",
        "This is where filters and pagination belong: shareable and restorable.",
      ]],
      ["useRouter", "Reach the router instance for imperative work such as invalidation or preloading.", [
        "The instance is how imperative code invalidates or preloads a route.",
        "It reaches navigation outside a component tree, such as from an interceptor.",
        "Prefer the specific hooks where one exists, because they re-render precisely.",
      ]],
      ["useRouterState", "Observe pending navigations and the current location as state.", [
        "A pending navigation is observable, so a global progress bar is possible.",
        "Reading the location as state keeps derived UI in step with the URL.",
        "Select a slice, or every navigation re-renders the subscriber.",
      ]],
      ["useLoaderData", "Read what the route's loader returned, already resolved before the component rendered.", [
        "The data is already resolved, so the component has no loading branch.",
        "Its type comes from the loader, so a changed return shape breaks consumers.",
        "A parent layout's loader data is readable from the child's match.",
      ]],
      ["useMatch and useMatches", "Read one matched route, or the whole chain, for breadcrumbs and layout decisions.", [
        "The chain of matches is what a breadcrumb trail is built from.",
        "A layout can read a child's match to decide what to render around it.",
        "Route-level metadata travels on the match, not in a separate lookup.",
      ]],
      ["useRouteContext", "Read the context a route built for itself and its children.", [
        "Context is built in beforeLoad and inherited by every child route.",
        "It is the typed way to pass a session or a client into loaders.",
        "Each route can extend what it received without mutating the parent.",
      ]],
      ["useBlocker", "Stop a navigation while a form has unsaved changes, and let the user decide.", [
        "A blocker intercepts in-app navigation before it commits.",
        "The reader gets a choice, rather than losing a half-finished form.",
        "A browser tab close needs a separate handler; the router cannot stop it.",
      ]],
      ["useLinkProps", "Build a custom link component that keeps preloading and active state.", [
        "The props carry preloading, active state and the resolved href together.",
        "A design-system link can wrap them and stay a real anchor element.",
        "Hand-built hrefs lose type checking and the preloading behaviour.",
      ]],
    ],
    "Routing fundamentals": [
      ["Route trees", "Compose routes hierarchically so layouts and data nest the way the UI does.", [
        "Nesting routes nests layouts, loaders and error boundaries together.",
        "A parent's data is loaded once and shared by every child beneath it.",
        "The tree is what makes a partial re-render on navigation possible.",
      ]],
      ["File-based routing", "Generate the route tree from files and keep the URL visible in the directory.", [
        "The directory is the route table, so the URL is readable from the file tree.",
        "The generated tree is what carries the types into every hook.",
        "Generation runs in the dev server, so a new file is routable immediately.",
      ]],
      ["Code-based routing", "Declare routes explicitly when the structure is dynamic or shared.", [
        "Explicit definitions suit routes built from configuration at runtime.",
        "The same route objects power both approaches underneath.",
        "It is also how a shared library ships routes into a host application.",
      ]],
      ["Path parameters", "Capture typed segments and read them without casting.", [
        "A parameter is parsed into a typed value before any loader runs.",
        "Parsing and serialising can be customised for ids that are not strings.",
        "An invalid parameter can be rejected at the route rather than in the component.",
      ]],
      ["Layout and pathless routes", "Share UI or logic across children without adding a URL segment.", [
        "A pathless route adds a wrapper without adding a URL segment.",
        "It is how a group of pages shares a guard or a shell.",
        "Grouping this way keeps the URL from growing folders that mean nothing.",
      ]],
      ["Not-found and error routes", "Handle a missing match and a thrown error at the right level of the tree.", [
        "A not-found handler on a branch keeps the rest of the layout on screen.",
        "An error component catches what its own loader threw, not the whole app.",
        "Handling both at the root only is what produces a blank page on one bad id.",
      ]],
    ],
    "Data loading": [
      ["Route loaders", "Fetch before render so a route commits with its data already present.", [
        "The route commits only when its data is ready, so no spinner flashes.",
        "Parent and child loaders run in parallel rather than in a waterfall.",
        "A loader throwing a redirect sends the reader elsewhere before render.",
      ]],
      ["loaderDeps", "Declare which search parameters a loader depends on so it reruns when they change.", [
        "Declared dependencies are what tell the router to rerun the loader.",
        "Without them a change to a filter leaves the old data on screen.",
        "Keep the dependency object small; it is compared on every navigation.",
      ]],
      ["Stale-while-revalidate", "Serve cached route data immediately while refreshing it in the background.", [
        "Cached route data renders immediately and refreshes behind the view.",
        "Staleness is configured per route, since not all data ages alike.",
        "Invalidating after a write is what forces the next visit to reload.",
      ]],
      ["Preloading on intent", "Start loading on hover or focus so the click feels instant.", [
        "Hovering a link starts the loader before the click arrives.",
        "The preload is cached, so the navigation itself renders instantly.",
        "A delay threshold keeps a passing cursor from fetching every link.",
      ]],
      ["Integrating with Query", "Let the router await a query client prefetch instead of duplicating a cache.", [
        "The loader awaits a prefetch and the component reads from the query cache.",
        "One cache then serves both, so there is nothing to keep in sync.",
        "Invalidation stays in the query client rather than being duplicated.",
      ]],
      ["Pending and error components", "Render a route's own pending and failure UI at the boundary that owns it.", [
        "Each route owns the placeholder that replaces it while it loads.",
        "A pending threshold avoids a flash on a load that finishes quickly.",
        "A minimum display time stops the placeholder from blinking.",
      ]],
    ],
    "Search parameters": [
      ["Search validation", "Parse the query string into typed values with a schema and sensible defaults.", [
        "A schema turns the query string into typed, defaulted values.",
        "Invalid parameters can be corrected or rejected before the loader runs.",
        "Validated search is what makes a filtered view a shareable URL.",
      ]],
      ["Typed navigation", "Move between routes with parameters the compiler checks.", [
        "The compiler rejects a link to a route that needs a parameter you omitted.",
        "Renaming a route surfaces at every link that pointed at it.",
        "Relative navigation resolves against the current match, and is typed too.",
      ]],
      ["Search middleware", "Retain or strip parameters consistently as the reader navigates.", [
        "Middleware decides which parameters survive a navigation.",
        "Keeping a filter across pages is a rule, not something each link repeats.",
        "It is also where a parameter is stripped once it no longer applies.",
      ]],
      ["Structural sharing of search", "Avoid rerenders when an unrelated part of the query string changes.", [
        "Unchanged parts of the search object keep their references.",
        "A component reading one parameter is not re-rendered by another changing.",
        "It matters on screens where several controls write to the same URL.",
      ]],
      ["Links and active state", "Build links from route definitions and style the active match.", [
        "Active state comes from the matched route, not from comparing strings.",
        "Exact and partial matching differ for a parent item in a navigation bar.",
        "The link renders a real anchor, so middle-click and open-in-new-tab work.",
      ]],
      ["Navigation blocking", "Warn before leaving a route with unsaved work.", [
        "A guard on a dirty form prevents silent loss of work.",
        "The prompt should say what is unsaved, not just ask to confirm.",
        "Clear the block after a successful save or the warning outlives the edit.",
      ]],
    ],
    "Production concerns": [
      ["Route guards", "Redirect from beforeLoad when a route requires authentication or a role.", [
        "beforeLoad runs before the loader, so a redirect costs no fetch.",
        "It can inspect context, which is where the session usually lives.",
        "The server must still authorise; a client guard only shapes navigation.",
      ]],
      ["Router context", "Pass shared dependencies, such as a client or a session, down the tree.", [
        "Context is injected once at creation and typed throughout the tree.",
        "Loaders receive it, which keeps a client out of module-level state.",
        "A route can add to it for its children without touching the parent.",
      ]],
      ["Lazy routes", "Split route code so a bundle loads only when its route is visited.", [
        "Splitting by route is the split that matches how people actually navigate.",
        "The critical part of a route can stay eager while its component is lazy.",
        "Preloading on intent hides the extra request behind the hover.",
      ]],
      ["Scroll restoration", "Restore position on back navigation without fighting the browser.", [
        "Position is recorded per entry and restored on a back navigation.",
        "A forward navigation should start at the top, which is the opposite behaviour.",
        "A scroll container other than the window has to be named explicitly.",
      ]],
      ["Server-side rendering", "Render a matched route on the server and hydrate without a second load.", [
        "Loaders run on the server and their results are streamed to the client.",
        "Hydration adopts that data, so no route refetches on first paint.",
        "A redirect thrown during a server load is a real HTTP redirect.",
      ]],
      ["Devtools", "Inspect matches, loader state and search parsing to explain a navigation.", [
        "The panel shows the matched chain with each route's loader state.",
        "It explains why a loader reran by showing the dependencies that changed.",
        "Parsed search is visible there, which settles most validation questions.",
      ]],
    ],
  }),

  defineHandbook("TanStack Start", "Full-stack React with server functions, typed routing, streaming, middleware and deployment.", "https://tanstack.com/start/latest/docs/framework/react/overview", {
    mechanism: "Start builds on Router and adds a server. Server functions are callable from the client but execute only on the server, so a route loader can read a database directly while the client receives just the result.",
    example: "A dashboard route calls a server function to read the signed-in user's projects inside its loader. The function checks the session server-side; the client bundle never contains the database client or the query.",
    pitfall: "A server function is a public endpoint. Arguments arrive from the network and must be validated and authorized inside the function, not only at the call site that appears to be trusted.",
  }, {
    "Hooks": [
      ["useServerFn", "Call a server function from a client component with its types preserved.", [
        "The call looks local but crosses the network on every invocation.",
        "Arguments and return values keep their types across that boundary.",
        "Wrapping it in a mutation gives the call pending and error state.",
      ]],
      ["Server functions in mutations", "Pair a server function with a router invalidation so the page reflects the write.", [
        "A write is only finished when the views reading that data are refreshed.",
        "Invalidate the routes the write affected rather than reloading the page.",
        "Do the invalidation after the call resolves, not alongside it.",
      ]],
      ["useRouter in Start", "Reach the router to invalidate loaders or navigate after a server call.", [
        "The router instance is what invalidates loaders after a server call.",
        "Navigating from the same place keeps the post-write flow in one function.",
        "It reaches navigation from handlers that are not inside a route component.",
      ]],
      ["useLoaderData with server loaders", "Read data a route loaded on the server, without a client fetch on first paint.", [
        "First paint already contains the data, so there is no client waterfall.",
        "The loader runs where the database is, so no query reaches the browser.",
        "The returned value must be serialisable to survive the transfer.",
      ]],
      ["useRouteContext for request data", "Pass request-derived values - a session, a user - down through route context.", [
        "Request-derived values are read once and shared down the route tree.",
        "A session resolved in middleware is available to every child loader.",
        "Context is typed, so a missing value is a compile error rather than undefined.",
      ]],
      ["Hooks and the client boundary", "A hook runs in the browser; a server function does not, and the boundary is the file.", [
        "A hook needs the browser; a server function must never be inlined into it.",
        "The boundary is enforced by the file, which is why imports matter.",
        "Importing server-only code into a component is what leaks a secret.",
      ]],
      ["useNavigate after a form action", "Navigate once the server function resolves, not before it does.", [
        "Navigating before the write resolves shows the next screen with stale data.",
        "Await the server function, then navigate, then let the loader run.",
        "On failure stay put and show the error where the form is.",
      ]],
      ["Streaming and pending state", "Read a route's pending state so a slow loader shows progress instead of a blank shell.", [
        "Pending state lets a slow route show progress instead of an empty shell.",
        "Deferred parts of a loader resolve after the first bytes are sent.",
        "A threshold avoids a placeholder for work that finishes in milliseconds.",
      ]],
    ],
    "Start fundamentals": [
      ["Project structure", "Understand which files run on the server, the client, or both.", [
        "Route files run on both sides; server functions run only on one.",
        "Knowing which is which is what keeps credentials out of the bundle.",
        "Shared utilities must be safe for both environments or split in two.",
      ]],
      ["Server functions", "Define a function that executes server-side and is callable with typed arguments.", [
        "The function is compiled into an endpoint and a typed client caller.",
        "Arguments cross the network, so they must be serialisable.",
        "It is the seam where authentication and validation belong.",
      ]],
      ["Loaders with server data", "Read data in a route loader without exposing the query to the browser.", [
        "The loader talks to the database directly with no HTTP hop of its own.",
        "Only the result crosses to the client, never the query or the credentials.",
        "Route-level loading is what makes the first render complete.",
      ]],
      ["Client and server boundaries", "Know what ends up in the bundle and keep secrets out of it.", [
        "Anything imported by a component ends up in the bundle, transitively.",
        "A server-only marker turns an accidental import into a build error.",
        "Audit the bundle: a leaked key is not visible in the source review.",
      ]],
      ["Environment configuration", "Separate server-only configuration from values the client may read.", [
        "Server configuration is read at runtime; client configuration is inlined at build.",
        "A public prefix is what marks a value as safe to ship.",
        "Validate the whole configuration once at startup rather than at first use.",
      ]],
      ["Routing integration", "Reuse the Router model for typed paths and search parameters.", [
        "The same typed routes, loaders and search validation carry over.",
        "Server rendering is added to that model rather than replacing it.",
        "Links, params and search stay compiler-checked end to end.",
      ]],
    ],
    "Server behaviour": [
      ["Request context", "Read headers, cookies and the session inside a server function.", [
        "Headers and cookies are readable inside the function, not in the component.",
        "The session is resolved here and passed on through context.",
        "Setting a cookie is part of the response, so it happens on this side.",
      ]],
      ["Validation and authorization", "Treat every server function argument as untrusted input.", [
        "A server function is a public endpoint whatever the client code does.",
        "Parse the arguments with a schema before touching anything.",
        "Check permission per call; a hidden button is not an authorisation check.",
      ]],
      ["Middleware", "Run shared logic before a function or a route, such as auth or logging.", [
        "Middleware wraps functions and routes with logic they all share.",
        "Authentication, logging and rate limiting belong here rather than repeated.",
        "It can extend the context that the wrapped handler then receives.",
      ]],
      ["API routes", "Expose a plain HTTP endpoint when a caller is not this application.", [
        "A plain endpoint serves webhooks, native clients and other services.",
        "The contract is HTTP, so it is versioned rather than typed across the wire.",
        "Server functions remain the better choice for this application's own calls.",
      ]],
      ["Streaming responses", "Send a shell early and stream slower content as it resolves.", [
        "The shell is sent immediately and slower sections follow as they resolve.",
        "Time to first byte improves without waiting for the slowest query.",
        "An error after streaming has begun cannot change the status code.",
      ]],
      ["Error handling", "Convert a thrown server error into a response the route can render.", [
        "A thrown error becomes a response the route can render deliberately.",
        "Separate an expected failure from a bug: one is UI, the other is a report.",
        "Never let an internal message or stack reach the browser.",
      ]],
    ],
    "Data & mutations": [
      ["Mutations with server functions", "Write through a server function and revalidate the affected routes.", [
        "The write and the revalidation belong in one place so they cannot diverge.",
        "Return what the client needs so a round trip can be avoided.",
        "A failed write must leave the visible state unchanged.",
      ]],
      ["Optimistic UI", "Show the expected outcome while the server call is still in flight.", [
        "Showing the expected result first is what removes the perceived wait.",
        "Keep the previous state so a failure can restore it exactly.",
        "Reconcile with the server response rather than assuming the guess was right.",
      ]],
      ["Caching and revalidation", "Decide what is cached, for how long, and what invalidates it.", [
        "Decide per route whether a response may be cached and for how long.",
        "Anything user-specific must never reach a shared cache.",
        "A write invalidates the routes it affects rather than the whole cache.",
      ]],
      ["Forms and progressive enhancement", "Keep a form working before JavaScript has loaded.", [
        "A real form element submits before any JavaScript has loaded.",
        "The server function handles both the enhanced and the plain submission.",
        "Validation on the server is what makes the unenhanced path safe.",
      ]],
      ["File uploads", "Accept a multipart request and stream it without buffering everything in memory.", [
        "Streaming the body avoids holding a large file in memory.",
        "Check the size and type before writing anything to storage.",
        "Serverless platforms cap request size, which shapes the upload design.",
      ]],
      ["Session management", "Issue, read and rotate a session cookie with safe attributes.", [
        "Cookies need HttpOnly, Secure and an explicit SameSite value.",
        "Rotate the identifier on sign-in so a fixed session cannot be reused.",
        "Server-side expiry is what actually ends a session, not the cookie lifetime.",
      ]],
    ],
    "Shipping": [
      ["Build output", "Understand the server and client artifacts a build produces.", [
        "The build produces a client bundle and a server handler from one source.",
        "Knowing which artifact a file lands in explains most boundary errors.",
        "The server entry is what a deployment target actually runs.",
      ]],
      ["Deployment targets", "Deploy to a Node server or a serverless platform and know what changes.", [
        "A long-running Node process keeps warm caches that serverless cannot.",
        "Serverless adds cold starts and per-request limits to consider.",
        "The same build targets both, but the runtime assumptions differ.",
      ]],
      ["Static and prerendered routes", "Prerender routes whose content does not depend on the request.", [
        "A route whose output ignores the request can be rendered at build time.",
        "Prerendering removes both the server work and the latency.",
        "Anything personalised must stay dynamic or it is served to the wrong reader.",
      ]],
      ["Observability", "Log and trace server functions so a failure is diagnosable in production.", [
        "Log server functions with enough context to find one failing call.",
        "Tracing across the function, the database and the response locates the delay.",
        "Keep personal data out of the logs you keep for months.",
      ]],
      ["Performance", "Measure payload size and server timing rather than guessing at bottlenecks.", [
        "Measure the payload, the server time and the hydration cost separately.",
        "The largest win is usually less data, not faster rendering.",
        "Streaming helps perceived speed but not the total work done.",
      ]],
      ["Testing", "Test server functions directly and routes through the router.", [
        "A server function is an ordinary function and can be called directly in a test.",
        "Route tests exercise loaders, guards and rendering together.",
        "Cover the unauthorised path as deliberately as the happy one.",
      ]],
    ],
  }),

  defineHandbook("TanStack Virtual", "Virtualized lists, grids, dynamic measurement, scrolling and accessibility at scale.", "https://tanstack.com/virtual/latest/docs/introduction", {
    mechanism: "The virtualizer computes which items fall inside the scroll viewport and returns their index and offset. You render only those items, absolutely positioned inside a container sized to the full scrollable height.",
    example: "A log viewer with 200,000 rows renders about forty at a time. Rows of differing height are measured after render and reported back, so the total height and every offset stay correct as the reader scrolls.",
    pitfall: "Giving the container the real element count as children, or forgetting to set the total size, reintroduces the cost virtualization removed and breaks the scrollbar's relationship to the data.",
  }, {
    "Hooks": [
      ["useWindowVirtualizer", "Virtualize against the window's own scrolling instead of a scroll container.", [
        "The page itself scrolls, so the list has no inner scrollbar of its own.",
        "Offsets are measured from the document, which the hook accounts for.",
        "This is the shape a long article feed or a search results page wants.",
      ]],
      ["Virtualizer options", "count, estimateSize, getScrollElement and overscan are the whole contract.", [
        "The count is the logical length, not the number of rendered nodes.",
        "The size estimate only has to be close; measurement corrects it.",
        "Overscan trades a few extra renders for a quieter fast scroll.",
      ]],
      ["Virtualizer instance methods", "getVirtualItems, getTotalSize and measure are what the hook hands back to render with.", [
        "The virtual items carry an index, an offset and a size to render with.",
        "Total size is what the spacer element is sized to.",
        "Calling measure after a data change recalculates the cached sizes.",
      ]],
      ["scrollToIndex and scrollToOffset", "Move to a row programmatically, with an alignment that does not surprise the reader.", [
        "Scrolling by index works even when the target is not currently rendered.",
        "Alignment decides whether the row lands at the top, centre or nearest edge.",
        "An unmeasured target may need a second pass once its real height is known.",
      ]],
      ["Virtualizer in a dialog", "Re-measure when a scroll container appears or resizes, or the first paint is the wrong height.", [
        "A container that starts hidden has no size, so the first measurement is zero.",
        "Re-measure when the dialog opens or the list renders one screen of items.",
        "A resize observer keeps it correct when the dialog is resized afterwards.",
      ]],
      ["Virtualizer with a ref", "Give the hook the scroll element through a ref, and keep its size stable.", [
        "The hook reads the scroll element through a callback, not at first render.",
        "A ref that changes identity every render restarts the measurement.",
        "The element needs a fixed height and its own overflow for scrolling to exist.",
      ]],
    ],
    "Virtualization fundamentals": [
      ["useVirtualizer", "Compute visible items from a count, a scroll element and an item size estimate.", [
        "Only the visible window is rendered, whatever the list length.",
        "The hook returns positions; the markup still decides how to draw them.",
        "Ten thousand rows cost about as much to render as twenty.",
      ]],
      ["Scroll element", "Point the virtualizer at the element that actually scrolls.", [
        "The element must actually scroll, with a height and an overflow rule.",
        "Pointing at a parent that does not scroll produces a list stuck at the top.",
        "Nested scroll containers need the innermost one, not the page.",
      ]],
      ["estimateSize", "Provide a starting height so offsets are usable before measurement.", [
        "A rough estimate is enough to place items before anything is measured.",
        "A wildly wrong estimate makes the scrollbar jump as real sizes arrive.",
        "For uniform rows the estimate is exact and no measurement is needed.",
      ]],
      ["Total size", "Size the inner container to the full list so the scrollbar is honest.", [
        "The spacer is what gives the scrollbar its correct length.",
        "Without it the container is only as tall as the rendered window.",
        "Total size changes as items are measured, so it is read on every render.",
      ]],
      ["Item positioning", "Place each visible item at its computed offset rather than in flow.", [
        "Each item is absolutely placed at its own offset inside the spacer.",
        "Normal flow cannot work, because the items above it are not rendered.",
        "A transform on the container is the cheaper alternative to per-item offsets.",
      ]],
      ["Overscan", "Render a few extra items beyond the viewport to hide fast scrolling.", [
        "Extra rows above and below cover the gap during a fast flick.",
        "Too much overscan renders work that is never seen.",
        "Tune it against a real device, since the right number depends on row cost.",
      ]],
    ],
    "Dynamic content": [
      ["measureElement", "Report an item's real size after render so later offsets correct themselves.", [
        "Real heights replace the estimate as each item renders.",
        "Offsets after a re-measured item shift, which is why order matters.",
        "The callback must be attached to the element that owns the height.",
      ]],
      ["Variable heights", "Handle rows whose height depends on content without layout jumps.", [
        "A list of mixed content cannot be described by one fixed size.",
        "Measuring on render keeps the scrollbar honest as the reader moves.",
        "An image without reserved space resizes the row after it has been measured.",
      ]],
      ["Horizontal virtualization", "Virtualize columns the same way rows are virtualized.", [
        "The same model applies along the horizontal axis.",
        "Widths are estimated and measured exactly as heights are.",
        "A wide timeline or a column strip is the usual case.",
      ]],
      ["Grid virtualization", "Combine row and column virtualizers for a two-dimensional surface.", [
        "Two virtualizers together give a window in both directions.",
        "Each cell is positioned from a row offset and a column offset.",
        "A spreadsheet surface only renders the cells actually on screen.",
      ]],
      ["Sticky items", "Keep a header or group label fixed while its section scrolls.", [
        "A section header is rendered outside the virtual window while it is pinned.",
        "Its index has to be tracked, since the item under it keeps changing.",
        "Sticky positioning needs a container the header can stick within.",
      ]],
      ["Window scrolling", "Virtualize against the page itself rather than a bounded element.", [
        "Virtualizing the page avoids an inner scrollbar that traps the wheel.",
        "The list start offset from the document top has to be accounted for.",
        "It behaves better on mobile, where nested scroll areas are awkward.",
      ]],
    ],
    "Interaction & integration": [
      ["scrollToIndex", "Move to a specific item with a chosen alignment.", [
        "Jumping to an item is what a deep link into a long list needs.",
        "Alignment decides how much context is visible around the target.",
        "Combine it with focus so a keyboard reader lands on the row, not the container.",
      ]],
      ["Infinite loading", "Fetch the next page as the reader approaches the end of the loaded range.", [
        "Trigger the next page from the rendered range, not from a scroll handler.",
        "Fetch before the reader reaches the end so the list never stops.",
        "Appending items changes the count, which resizes the spacer.",
      ]],
      ["Keyboard navigation", "Keep focus correct when the focused item scrolls out of the rendered range.", [
        "Moving focus to a row that is not rendered loses focus entirely.",
        "Scroll the target into the rendered range first, then move focus.",
        "Focus lost to an unmounted row silently returns to the document body.",
      ]],
      ["Accessibility", "Expose position and size so assistive technology reports the real list length.", [
        "The rendered subset must still report the full list size and each row's position.",
        "Without that, a screen reader announces twenty items out of ten thousand.",
        "Use a real list or grid role rather than unlabelled positioned divs.",
      ]],
      ["Combining with Table", "Virtualize a table's row model without losing sorting or selection.", [
        "The row model stays complete; only its rendering is windowed.",
        "Sorting and selection operate on all rows, not on the visible ones.",
        "Measure the row element, since a cell can grow the row unexpectedly.",
      ]],
      ["Performance measurement", "Profile scroll performance instead of raising overscan by guesswork.", [
        "Profile a scroll to see whether the cost is layout, paint or the row component.",
        "Raising overscan hides a slow row rather than fixing it.",
        "A heavy cell renderer is usually the real cause of a stuttering list.",
      ]],
    ],
  }),
];
