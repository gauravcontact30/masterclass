import { TECHY_EXAMPLES } from "./techy-examples";

import { questions, type TechyTopic } from "./techy-types";
import { TECHY_ADDITIONAL_TOPICS } from "./techy-additional-content";
export type { TechyTopic, TechyQuestion } from "./techy-types";

export const TECHY_TOPICS: TechyTopic[] = [
  {
    id: "aws", title: "AWS Services", category: "Cloud", summary: "Choose the right compute, storage, database and security building blocks.",
    features: ["EC2 for virtual machines; Lambda for event-driven functions.", "S3 for objects; EBS for block storage; EFS for shared files.", "RDS for relational workloads; DynamoDB for access-pattern-driven NoSQL.", "IAM roles, VPC boundaries and CloudWatch support secure operations."],
    source: "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/amazon-web-services-cloud-platform.html",
    questions: questions("aws", `Which service stores objects such as images and backups?|S3 stores objects in buckets; use lifecycle rules to manage retention and storage classes.|Amazon S3|Amazon EBS|Amazon EC2|Amazon Route 53
When should you choose Lambda over EC2?|Lambda fits short event-driven tasks without managing servers; EC2 gives control over long-running processes and the operating system.|Short event-driven tasks|Custom kernel management|Persistent local server processes|Unlimited execution duration
What is the purpose of an IAM role?|A role supplies temporary permissions to a trusted identity or AWS service without embedding long-lived access keys.|Temporary scoped permissions|Public bucket hosting|A network firewall|A billing alarm
How do security groups filter traffic?|They are stateful virtual firewalls attached to network interfaces; permitted connection responses are automatically allowed.|Stateful traffic filtering|Stateless subnet filtering|DNS routing|Object encryption
What does a VPC provide?|A VPC defines a logically isolated network with subnets, routes and network controls.|An isolated virtual network|A relational database|A container image|A CDN cache
When is RDS a good database choice?|Use RDS for managed relational databases where SQL, joins and transactions suit the workload.|Relational SQL workloads|Static asset caching|Message fan-out|DNS management
What drives DynamoDB key design?|Start with access patterns and distribute partition keys to avoid concentrating traffic on a hot key.|Known access patterns|Alphabetical table names|UI component hierarchy|Random index creation
Why use multiple Availability Zones?|Independent zones reduce the impact of a single data-center failure when the application and data are deployed across zones.|Improve fault tolerance|Eliminate all regional outages|Remove backup requirements|Guarantee zero latency
How do SQS and SNS differ?|SQS buffers messages for consumers; SNS publishes notifications to multiple subscribers.|Queue versus publish-subscribe|Both only store files|SNS is a SQL engine|SQS only serves web pages
What does CloudFront do?|CloudFront caches and delivers content through edge locations near users, reducing origin load.|Edge content delivery|Identity federation|Block storage|Database migrations
What is an Auto Scaling group used for?|It maintains and adjusts a group of EC2 instances based on desired capacity and scaling policies.|Manage EC2 fleet capacity|Rotate passwords only|Store machine images only|Replace DNS records
What does an Application Load Balancer route?|An ALB routes HTTP and HTTPS requests to healthy targets using application-level rules.|HTTP and HTTPS requests|Only database backups|Only DNS queries|Only IAM policies
How is EBS different from S3?|EBS provides block volumes for compute; S3 exposes object storage through an API.|Block versus object storage|Both are file-system mounts by default|S3 is attached to one EC2 instance|EBS is a CDN
Why use Secrets Manager?|It stores and retrieves secrets with access controls and supports configured rotation workflows.|Managed secret storage|Public configuration publishing|Source code compilation|Packet routing
What does CloudWatch collect?|CloudWatch supports operational metrics, logs and alarms to monitor applications and infrastructure.|Metrics and logs|Only IAM users|Only object versions|Only source code
What is the shared responsibility model?|AWS secures its cloud infrastructure; customers secure their workloads, identities and configurations according to the service used.|Security duties are shared|AWS secures all application code|Customers manage AWS data centers|Neither party manages access
What is a dead-letter queue for?|It isolates messages that repeatedly fail processing so they can be investigated and safely redriven.|Failed-message isolation|Faster successful delivery|Permanent deletion of all messages|Database replication
Why make a Lambda consumer idempotent?|Events may be delivered more than once; repeated processing should not duplicate business effects.|Handle duplicate events safely|Make execution unlimited|Disable retries globally|Avoid authorization
What is infrastructure as code?|Versioned templates or programs define infrastructure so changes can be reviewed and deployments repeated.|Versioned infrastructure definitions|Manual console screenshots|Untracked shell history|A monitoring dashboard
What is Amazon Bedrock used for?|Bedrock provides managed access to foundation models and tooling for generative AI applications.|Managed foundation-model applications|Block volume attachment|DNS registration|Virtual machine patching`),
  },
  {
    id: "agentic-ai", title: "Agentic AI", category: "AI", summary: "Tool use, retrieval, evaluation and reliable agent workflows.",
    features: ["An agent selects actions using model output and tool feedback.", "Structured tool contracts make inputs and results explicit.", "Retrieval grounds answers in relevant external knowledge.", "Step budgets, permission checks and evaluations bound failures."],
    source: "https://www.anthropic.com/engineering/building-effective-agents",
    questions: questions("agentic-ai", `What distinguishes an agent from a fixed workflow?|An agent can choose its next action dynamically; a workflow follows a predefined control path.|Dynamic action selection|A larger context window alone|A fixed sequence of prompts|A chat interface alone
What is tool calling?|The model proposes a structured operation; the application validates and executes it, then returns a result.|Structured operation requests|Direct unrestricted database access|Training model weights|Rendering HTML only
Why validate tool arguments?|Generated arguments may be malformed or unauthorized; validate schema and permissions before execution.|Enforce input and permission boundaries|Increase temperature|Guarantee truthful prose|Avoid all monitoring
What does RAG add to generation?|Retrieval-augmented generation supplies relevant retrieved context before answering; it does not guarantee correctness.|Relevant external context|Automatic model retraining|Infinite context|Guaranteed factual output
What is prompt injection?|Untrusted content tries to redirect the agent away from its authorized task or data boundaries.|Instructions embedded in untrusted content|A model checkpoint|A database index|Normal schema validation
Why set a maximum number of agent steps?|A bounded loop limits runaway cost and repeated unproductive actions, with an explicit stopping outcome.|Bound execution and cost|Guarantee task success|Increase permissions|Eliminate tool errors
When should an agent request human approval?|Use approval for consequential actions outside preauthorized scope, such as publishing or deleting important data.|Before consequential unauthorized actions|Before every read|After every token|Only after destructive execution
How should tool failures be handled?|Return a structured error, retry only appropriate transient failures with limits, and expose unresolved failure.|Bounded recovery with explicit errors|Hide every error|Retry forever|Invent a successful result
What is an embedding used for?|An embedding represents semantic features numerically so related items can be retrieved by similarity.|Semantic similarity retrieval|Encryption of secrets|Exact SQL transactions|Image compression only
Why use a reranker in retrieval?|A reranker scores candidate passages against the query to improve relevance after initial retrieval.|Improve candidate relevance ordering|Replace all access controls|Train a browser|Increase document count blindly
What should an agent evaluation measure?|Measure task success, tool correctness, safety boundaries, latency and cost on representative cases.|Task outcomes and operational quality|Only response length|Only model size|Only visual formatting
Why retain tool-call traces?|Traces show decisions, arguments and outcomes for debugging; redact sensitive values and apply retention controls.|Diagnose action sequences|Replace authorization|Expose all secrets|Guarantee deterministic models
What is the difference between memory and context?|Context is input for the current model call; memory persists information that can be selected into future calls.|Current input versus persisted information|Both are model weights|Context lasts forever|Memory is always a database backup
Why use structured outputs?|A schema makes responses easier to parse and validate, while semantic checks remain necessary.|Machine-readable contracts|Guaranteed correct decisions|Unlimited permissions|Removal of validation
When is a single agent preferable to many agents?|Use one agent when it can solve the task with less coordination overhead and sufficient quality.|When coordination adds little value|Whenever maximum token usage is desired|Only for image generation|Never for tool use
What is an idempotency key for an agent action?|A stable action key lets the service detect retries and avoid repeating a business side effect.|Deduplicate retried side effects|Hide tool arguments|Expand context|Increase temperature
What does least privilege mean for tools?|Grant only the operations and data access required for the authorized task.|Minimum necessary access|Admin access by default|No audit logs|Shared root credentials
How can retrieval leak private information?|Retrieving without enforcing source permissions can expose documents the user cannot access.|Missing document access filtering|Using vector math itself|Chunking by paragraphs|Returning fewer results
What is a useful fallback when an agent is uncertain?|Ask for missing information, route to a deterministic path, or clearly report uncertainty.|Escalate or clarify explicitly|Fabricate evidence|Repeat the same action forever|Silently broaden permissions
Why version prompts and evaluations together?|A versioned baseline lets teams compare behavior after changes and detect regressions.|Track behavioral regressions|Guarantee identical sampling|Avoid all testing|Replace source control`),
  },
  {
    id: "nextjs", title: "Next.js 16+", category: "Frontend", summary: "App Router, server boundaries, caching and production rendering.",
    features: ["File-based App Router pages compose with shared layouts.", "Server Components keep data access close to the server.", "Cache Components opt into explicit caching with use cache.", "Async request APIs and proxy.ts are key migration topics for 16+."],
    source: "https://nextjs.org/docs/app/guides/upgrading/version-16",
    questions: questions("nextjs", `What is the default component type in App Router pages?|Pages and layouts are Server Components unless a client boundary is introduced.|Server Component|Client Component|Web Component|Service worker
When is use client needed?|Declare a client entry point for state, event handlers and browser APIs; imported modules enter that client graph.|For interactive client boundaries|For every component|For server-only secrets|Only for CSS files
How do you read params in a Next.js 16 server page?|Await the params promise before accessing dynamic route values.|Await params|Read params synchronously only|Use window.params|Parse a CSS selector
What does a layout preserve across navigation?|Shared layouts retain their mounted UI and client state while child segments change.|Shared UI and client state|Every server response forever|All browser history|All route query results
What is the purpose of loading.tsx?|It supplies a route-segment loading fallback while content streams.|A loading fallback|A database migration|A global error logger|A static sitemap
How do you opt into Cache Components?|Enable cacheComponents in next.config and mark cacheable work with use cache where appropriate.|Enable cacheComponents|Add use client everywhere|Rename all pages to cache.tsx|Set a CSS cache property
What must a Server Action check before changing data?|Authenticate the caller, authorize the specific operation and validate the input on the server.|Identity, permission and input|Only button visibility|Only client-side types|Only the Referer header
Can a Client Component be prerendered on the server?|Yes. The client boundary controls interactivity and bundling; initial HTML can still be prerendered.|Yes, for initial HTML|No, it only ever runs in a browser|Only with a service worker|Only without React
What replaces the middleware convention in Next.js 16?|The convention is renamed to proxy.ts; review runtime and migration guidance for the application.|proxy.ts|gateway.css|router.json|interceptor.html
What does notFound do?|It terminates rendering for the route segment and displays the nearest not-found UI.|Show the not-found boundary|Return an empty success page|Reload the browser|Delete the route file
What belongs in route.ts?|HTTP handlers such as GET and POST implement endpoints using Request and Response APIs.|HTTP route handlers|A required React layout|Only metadata|Only CSS imports
How should secrets be kept out of client bundles?|Keep secret access in server-only modules and never expose it through public environment variables or serialized props.|Server-only data access|Prefix secrets with NEXT_PUBLIC_|Put them in JSX comments|Store them in client state
What does Suspense enable in server rendering?|It allows ready content to stream while a slower subtree displays its fallback.|Streaming with local fallbacks|Automatic database indexing|Global error suppression|Infinite request retries
What does revalidateTag with max do?|It marks tagged cached data stale using stale-while-revalidate behavior; a later request can trigger refresh.|Stale-while-revalidate invalidation|Immediately deletes all browser state|Changes a route URL|Disables the cache permanently
What is updateTag intended for?|Inside Server Actions, it expires tagged data immediately for read-your-own-writes behavior.|Immediate tag expiry in Server Actions|Client-side CSS updates|Image compression|DNS invalidation
How does next/link improve navigation?|It supports client navigation and prefetching, with behavior depending on route type and configuration.|Client navigation and prefetching|Mandatory full reloads|Automatic login|Database replication
Where is a root document shell defined?|The root layout supplies html and body and wraps the application.|app/layout.tsx|app/route.css|public/index.ts|package-lock.json
What should error.tsx export?|A Client Component that renders error recovery UI; the boundary covers errors in its child subtree.|A client error boundary UI|A SQL function|A static image|A middleware array
How are request cookies accessed on the server?|Await cookies() from next/headers; mutation is restricted to supported server contexts such as actions and route handlers.|Await cookies()|Read document.cookie in a server module|Import cookies from react|Use a global cookies object
What is the default bundler for Next.js 16 development and builds?|Turbopack is the default; explicit webpack opt-out exists for compatibility needs.|Turbopack|Rollup only|Parcel|Browserify`),
  },
  {
    id: "tanstack", title: "TanStack", category: "Frontend", summary: "Query v5 server state, typed routing and headless tables.",
    features: ["Query caches asynchronous server state by structured query keys.", "Mutations coordinate writes, invalidation and optimistic updates.", "Router focuses on typed routes; Table supplies headless table logic.", "Freshness and garbage collection have separate controls."],
    source: "https://tanstack.com/query/latest/docs/framework/react/overview",
    questions: questions("tanstack", `What problem does TanStack Query primarily solve?|It manages asynchronous server state, including fetching, caching and synchronization.|Server-state synchronization|CSS layout|Local form validation only|Bundling JavaScript
What belongs in a query key?|Include serializable values that identify the result, including parameters used by the query function.|Result identity and parameters|Random values every render|Only the component name|A DOM element
What does staleTime control?|It controls how long fetched data is considered fresh, not how long unused cache entries remain.|Data freshness duration|Unused cache lifetime|HTTP timeout|Mutation duration
What does gcTime control?|It controls how long inactive query data stays cached before garbage collection.|Inactive cache retention|Freshness duration|Server response time|Polling frequency
How do you notify Query that a mutation changed data?|Invalidate related query keys or update their cached values after a successful write.|Invalidate or update related queries|Reload every browser tab|Rename the hook|Mutate a cached object in place
What is an optimistic update?|Update the UI before server confirmation, retaining a snapshot so errors can roll back the change.|Immediate UI with rollback|Wait for a page reload|Skip the network write|Always ignore failures
How does enabled help dependent queries?|It delays a query until prerequisites such as a selected ID are ready.|Gate query execution|Increase retry count|Persist cache to disk|Disable type checking
Why check response.ok in a fetch query function?|fetch resolves on HTTP errors; throw an error so Query can represent the failure and apply retry rules.|Surface HTTP errors to Query|Prevent JSON parsing always|Turn every response into success|Disable caching
What does QueryClientProvider supply?|It makes a QueryClient available to Query hooks in the React subtree.|A shared query client|A CSS theme|A router history only|An authentication token automatically
What is the default freshness assumption?|Cached query data is stale by default, so configured lifecycle events can trigger background refetches.|Data is stale by default|Data is fresh forever|Cache is disabled|All data expires after one second
How can an in-flight query be cancelled?|Consume the AbortSignal supplied to the query function in a compatible request API.|Use the query AbortSignal|Delete the query key string|Throw during rendering|Set gcTime to zero
What does select in useQuery do?|It transforms the value observed by that hook without replacing the underlying stored query data.|Transform observer output|Replace the server schema|Clear all cached data|Choose a DOM node
How is paginated data identified?|Include the page or cursor in the query key so each result has a distinct identity.|Include page parameters in the key|Use the same static key for all pages|Store pages in CSS|Disable the query client
What does useInfiniteQuery manage?|It tracks pages and page parameters for load-more or infinite-scroll data.|A collection of fetched pages|Unlimited network retries|An infinite staleTime automatically|A browser history stack
What should an SSR app avoid with QueryClient?|Avoid sharing a server QueryClient across unrelated requests because cached user data could cross boundaries.|Cross-request user cache sharing|Creating a client per request|Hydrating authorized data|Using query keys
How do isPending and isFetching differ?|isPending describes query status without successful data; isFetching describes an active request, including background refetch.|Status versus network activity|They are always identical|isFetching means mutation only|isPending means browser offline only
What is TanStack Table's headless approach?|It provides table state and models while you own markup, styling and accessibility.|Logic without prescribed UI|A mandatory visual theme|A hosted spreadsheet|A database server
What does TanStack Router emphasize?|It emphasizes type-safe route definitions and route-related data and search parameters.|Typed routing|Image processing|SQL transactions|Container scheduling
What does setQueryData require for safe updates?|Return a new immutable value instead of mutating the existing cached object.|Immutable cache updates|In-place mutation|A full browser reload|A DOM ref
When should local state stay outside Query?|Transient UI state such as an open dialog usually belongs in local state or a client store.|Transient UI-only state|Fetched product records|Remote account responses|Paginated server results`),
  },
  {
    id: "zustand", title: "Zustand", category: "Frontend", summary: "Small stores, precise subscriptions and persistent client state.",
    features: ["Create a store containing state and actions with a small API.", "Selectors subscribe components to the values they need.", "Immutable updates keep snapshots predictable.", "Persistence and devtools middleware extend stores when needed."],
    source: "https://github.com/pmndrs/zustand",
    questions: questions("zustand", `What does create return for a React Zustand store?|It returns a hook with store APIs attached so components can subscribe through selectors.|A store hook|A Redux reducer only|A server endpoint|A DOM node
Why use a selector when reading a store?|Selecting a specific value avoids subscribing to unrelated store changes.|Limit subscriptions|Clone the entire database|Disable React rendering|Persist all values
How should you increment from existing state?|Use a functional set update to compute the next value from the current state.|set with an updater function|Mutate a variable outside the store|Read a stale render closure only|Replace the hook
How deeply does set merge by default?|It shallowly merges the top-level state; nested objects require explicit immutable updates.|One level|Every nested level|No levels under any condition|Only array entries
When is useShallow useful?|It stabilizes selector results when a new object or array has shallowly equal contents.|Shallow-equal selector outputs|Every primitive selector|Server authentication|Deep object mutation
Does a basic global Zustand store require a provider?|No. A provider is useful for scoped stores, dependency injection and per-request initialization.|No, not for a basic global store|Yes, always|Only with CSS modules|Only in production
Why avoid a shared server store for user data?|A process-level singleton can leak state between requests; create isolated stores per request when appropriate.|Prevent cross-request state leakage|Improve image loading|Enable global mutation|Remove hydration
What does persist middleware do?|It saves selected state to configured storage and rehydrates it later.|Store and rehydrate state|Encrypt all values automatically|Create a SQL schema|Cache every network response
How do you update a nested object safely?|Copy each changed object level and pass the new reference through set.|Immutable nested copies|Mutate the object directly|Change only a CSS class|Call get repeatedly
What is get used for inside a store creator?|It reads the current store state when an action needs another value.|Read current state|Subscribe to DOM events|Serialize all data|Reset React
How do async store actions work?|Await external work, then call set; model loading and error state explicitly if needed.|Await work then update state|Zustand forbids async functions|All actions run on the server|They require Redux Saga
What is the risk of set with replace true?|It replaces the full state, so omitted properties and actions can disappear.|Omitted state and actions are removed|It only changes nested fields|It merges more deeply|It creates an automatic backup
What does partialize in persist control?|It selects which state properties are saved, excluding transient values or sensitive data.|Persisted state selection|HTTP retries|Selector equality|Component keys
Why version persisted state?|A version and migration function can transform old stored shapes when the application changes.|Migrate old storage schemas|Increase storage limits|Prevent all user edits|Encrypt the store
What is hydration mismatch in a persisted store?|The initial browser output differs from server HTML, often because browser storage supplies different state.|Client and server initial UI differ|Two actions have the same name|A reducer returns null|A test runs twice
How do you unsubscribe from store.subscribe?|Call the unsubscribe function returned by subscribe when the observer is no longer needed.|Call the returned cleanup|Delete the store file|Set state to null|Reload the browser
What is the slices pattern?|Compose related state and actions from smaller creators into one store with clear boundaries.|Compose store domains|Split every array in half|Create a route per property|Persist each render
Where should derived values usually be computed?|Compute them in selectors or during rendering to avoid duplicated state that can drift.|Selectors or rendering|A second unsynchronized store|A global timer|Only localStorage
How can tests isolate a Zustand store?|Create a fresh store for each test or restore its initial state between tests.|Fresh or reset store state|Run tests in random order only|Share every previous mutation|Disable assertions
When is Zustand a better fit than a query cache?|Use it for shared client UI state; a query library supplies specialized remote-data synchronization.|Shared client UI state|Automatic server cache invalidation|Database replication|CDN configuration`),
  },
  {
    id: "vitest", title: "Vitest", category: "Testing", summary: "Fast unit tests, mocks, timers and useful assertions.",
    features: ["Vite-aware transforms support modern TypeScript and ESM tests.", "Watch mode shortens the edit-test feedback loop.", "Spies, module mocks and fake timers isolate dependencies.", "Coverage helps locate untested branches; assertions establish behavior."],
    source: "https://vitest.dev/guide/",
    questions: questions("vitest", `Which command runs Vitest once for CI?|vitest run executes a non-watch run and exits with the result.|vitest run|vitest watch forever|vite build only|tsc --watch
What is the difference between test and describe?|test defines a case; describe groups related cases and lifecycle hooks.|Case versus group|Both compile CSS|describe is an assertion|test only mocks modules
When should toEqual be used instead of toBe?|Use toEqual for structural comparison; toBe checks identity or primitive equality using Object.is.|Structural object comparison|Reference identity only|Checking a function call count|Skipping a test
What does vi.fn create?|It creates a mock function that records calls and can provide controlled implementations.|A tracked mock function|A real HTTP server|A DOM element|A coverage report
What does vi.spyOn do?|It wraps an existing object method or accessor so calls can be observed or behavior replaced.|Observe an existing member|Mock every import|Create a database|Disable all timers
How should asynchronous assertions be awaited?|Return or await the promise so the runner observes its completion and failure.|Return or await the promise|Ignore the promise|Use an arbitrary sleep only|Finish the test first
Why restore mocks after tests?|Restoration prevents modified methods from leaking behavior into subsequent tests.|Prevent test contamination|Speed up production code|Increase coverage automatically|Disable assertions
When are fake timers useful?|They control timeout and interval progression without waiting for real time.|Testing time-dependent logic|Real browser layout testing|Database encryption|CSS compilation
What environment supports DOM-oriented unit tests?|jsdom or happy-dom can emulate browser APIs; neither reproduces every real browser behavior.|jsdom or happy-dom|Node alone for all DOM APIs|A SQL shell|A CSS parser only
Does running TypeScript tests guarantee type correctness?|No. Transformation runs the code; use a separate type-check step or configured type tests.|No, type checking is separate|Yes, always|Only if assertions pass|Only in watch mode
What does beforeEach provide?|It runs setup before each test in its scope, helping create independent fixtures.|Per-test setup|One global production build|A replacement for assertions|An after-test report
Why avoid excessive implementation mocks?|Overmocking can verify wiring while missing broken observable behavior and integration contracts.|It can hide real integration failures|Mocks always fail on CI|Mocks cannot return values|It disables TypeScript
What is the benefit of test.each?|It runs the same behavior across a table of inputs and expected outputs.|Parameterized test cases|Parallel deployments|Browser screenshots|Random test deletion
What does coverage fail to prove?|Executed lines may lack meaningful assertions; coverage alone does not prove correctness.|Correct behavior|Whether a line ran|Which branches executed|Which files were instrumented
What is a brittle snapshot test?|A broad snapshot can fail on irrelevant presentation changes and encourage unreviewed updates.|Large incidental output comparison|A focused semantic assertion|A deterministic input test|A type error check
How should a thrown error be asserted?|Pass a function to expect and use toThrow; await rejects for asynchronous rejection.|expect with toThrow or rejects|Execute before expect without a wrapper|Catch and ignore the error|Assert console output only
What does clearAllMocks reset?|It clears call history while preserving mock implementations.|Call history|All implementations and modules|The source tree|All environment variables
What does resetAllMocks additionally do?|It clears history and resets mock implementations according to each mock's reset behavior.|Resets mock implementations|Restores every original descriptor only|Deletes test files|Restarts the operating system
What should you know about vi.mock placement?|Module mocking is hoisted by Vitest, so factories cannot freely depend on later runtime variables.|Module mocks are hoisted|Mocks execute only after assertions|Mock factories run in the browser only|Imports are never transformed
What makes a good unit test name?|Describe the condition and observable result so a failure explains the broken behavior.|Condition and expected behavior|An arbitrary number only|The implementation line number|A developer's initials`),
  },
  {
    id: "playwright", title: "Playwright Automation", category: "Testing", summary: "Resilient browser tests, accessible locators and trace debugging.",
    features: ["Exercise Chromium, Firefox and WebKit through one test API.", "Locators and web-first assertions wait for expected states.", "Browser contexts isolate cookies and session state.", "Traces, screenshots and network controls help diagnose failures."],
    source: "https://playwright.dev/docs/best-practices",
    questions: questions("playwright", `Which locator best expresses a user's interaction with a button?|Prefer getByRole with an accessible name so tests align with the visible interface.|getByRole with name|A deeply nested CSS path|An nth-child chain|A random generated class
Why prefer web-first assertions?|Assertions such as toBeVisible retry until the condition passes or the timeout expires.|Automatic assertion retry|They never time out|They skip the browser|They modify the application
What does auto-waiting check before clicking?|Playwright checks relevant actionability conditions such as visibility, stability and whether the target receives events.|Actionability conditions|All business logic completion|Every network request forever|Database replication
Why avoid waitForTimeout in normal tests?|Fixed sleeps are both slow and unreliable; wait for a specific observable condition instead.|Wait for observable state|Sleep is always faster|Timeouts disable retries|Browsers cannot measure time
What does a browser context isolate?|Contexts separate browser session data such as cookies and local storage between tests.|Browser session state|Application database rows automatically|Operating system users|Source code files
How should tests authenticate efficiently?|Use a setup flow and protected storageState when appropriate, while keeping test accounts and data isolated.|Reusable protected storageState|Commit passwords into tests|Disable production login|Share all mutable data blindly
What is a trace useful for?|A trace captures action context, snapshots and network information to investigate failures.|Debug a test timeline|Compile TypeScript|Replace assertions|Deploy the app
How do you test an expected URL change?|Use await expect(page).toHaveURL with the expected pattern or URL.|toHaveURL assertion|A fixed five-second sleep|Read the address once immediately|Assert the page title only
How can a test mock an API response?|Register a route handler before the request and fulfill it with controlled data.|page.route and route.fulfill|Change CSS variables|Call page.title|Use screenshot only
What is the page fixture?|It supplies a test-scoped browser page inside an isolated context by default.|A test-scoped browser page|A shared production tab|A React component|A database table
How do you interact with content inside an iframe?|Use frameLocator and then locate the target within the frame.|frameLocator|A global document selector only|A second test runner|A CSS media query
Why await every asynchronous Playwright action?|Awaiting ensures action completion and surfaces failures before the test ends.|Preserve ordering and failures|Increase test retries|Disable browser caching|Reduce accessible names
What is a strict locator violation?|An operation needing one element found multiple matches; refine the locator to identify the intended target.|Multiple matching targets|No network connection|A missing screenshot|A TypeScript build warning
How should a download event be captured?|Start waiting for the download before clicking the trigger so the event cannot be missed.|Register wait before triggering|Click then wait much later|Poll the page title|Restart the browser
What are Playwright projects for?|Projects run the suite with different configurations such as browsers, devices or authentication states.|Multiple test configurations|Only code formatting|Only package publishing|Only network mocking
What does a screenshot assertion compare?|It compares rendered output with a baseline, subject to tolerances and stable rendering conditions.|Visual output against a baseline|Database content directly|Only DOM text|Network latency
How should flaky tests be treated?|Use traces to fix unstable locators, timing or shared data; retries provide evidence but do not fix the cause.|Investigate and fix the cause|Increase retries forever|Remove every assertion|Ignore CI failures
What is a good test data strategy for parallel runs?|Allocate independent users or records and clean them up without disturbing other tests.|Independent test data|One mutable account for everything|Shared fixed IDs for all writes|Random deletion of records
When is getByTestId appropriate?|Use a stable test contract when semantic locators are unsuitable; keep accessibility checks separately.|When semantic locators are unsuitable|For every element automatically|Only for screenshots|Never in any test
What is the role of webServer configuration?|It can start a local application and wait for readiness before browser tests run.|Start and await the test app|Provision AWS automatically|Generate test assertions|Manage user passwords`),
  },
  {
    id: "react", title: "React 19+", category: "Frontend", summary: "Modern rendering, Actions, optimistic UI and component design.",
    features: ["Actions integrate asynchronous changes with pending and error states.", "useActionState and useOptimistic simplify interactive workflows.", "React 19 supports ref as a prop for function components.", "Pure rendering and stable component identity remain core principles."],
    source: "https://react.dev/blog/2024/12/05/react-19",
    questions: questions("react", `What makes a React component pure?|Given the same inputs it returns the same output and avoids side effects during rendering.|Deterministic rendering without side effects|Mutating props|Fetching during every render|Writing localStorage during render
Why are stable keys important in lists?|Keys help React associate items with component identity and preserve the correct state during reordering.|Preserve item identity|Style list items|Guarantee sorted data|Prevent all rerenders
When should state use a functional updater?|Use it when the next value depends on pending previous state, especially with queued updates.|When next state depends on previous state|Only for strings|Only in Server Components|Never with batching
What is useEffect primarily for?|It synchronizes a component with external systems and cleans up that synchronization as dependencies change.|Synchronize external systems|Compute every derived value|Run code before rendering|Replace event handlers
What does useActionState return?|It returns current state, a dispatch action and a pending flag for the associated Action workflow.|State, dispatch action and pending|Only a Promise|A DOM element and ref|A reducer definition only
What is useOptimistic used for?|It presents a temporary optimistic view while an Action is pending, then reconciles with authoritative state.|Temporary optimistic UI|Permanent local database storage|Blocking every render|Automatic authentication
How are refs passed to function components in React 19?|They can receive ref as a prop; many cases no longer need forwardRef.|As a prop|Only through window|Only as context|Through a required class
What does a Transition mark?|It marks supported state updates as non-urgent so urgent interactions can remain responsive.|Non-urgent UI updates|A CSS animation always|A network timeout|A forced synchronous update
Why avoid mutating state objects?|React relies on new references and snapshots to schedule consistent updates; mutation can hide changes.|Preserve state snapshots and identity checks|Objects cannot change in JavaScript|Mutation always throws|It only affects CSS
What does useFormStatus observe?|It reports status for a parent form submission; place the consumer inside that form.|Parent form submission status|Every form on the page|Only URL parameters|The browser's connectivity
What can use read?|It reads resources such as a Promise or context; a pending Promise integrates with Suspense.|Promises and context|Only CSS files|Only reducers|Only DOM events
What does Suspense show while a supported resource is pending?|It displays the nearest fallback for that boundary until the content is ready.|A boundary fallback|An automatic error page always|A browser alert|An empty database
What is a controlled input?|Its value is driven by React state and updated through an input handler.|React state controls its value|The DOM exclusively owns its value|It cannot be edited|It must be a class component
Why should Hooks have stable call order?|React associates Hook state with call order; ordinary Hooks belong at the top level of components or custom Hooks.|Preserve Hook state association|Improve CSS specificity|Allow arbitrary loops|Force server rendering
What is a stale closure?|A callback retains values from an earlier render when the code expects newer values.|A callback holding older render values|A deleted DOM node only|A cache with no expiry|A syntax error
When is useMemo useful?|Use it for measured expensive calculations or identity-sensitive values; it is a performance optimization.|Avoid measured repeated calculations|Guarantee persistent business state|Run side effects|Replace all local variables
What should an error boundary handle?|It provides recovery UI for descendant rendering failures; it does not catch every event-handler or async error.|Descendant rendering failures|Every failed network request automatically|All server authentication|All event exceptions automatically
What does lifting state up accomplish?|It moves shared state to a common owner so sibling components stay synchronized.|A shared source of truth|Global persistence automatically|Fewer components always|A new browser process
Why is cleanup important in Effects?|Cleanup releases subscriptions, timers or connections before reruns and unmounting.|Release external resources|Reset all application state|Prevent all future renders|Delete child components
What is the purpose of Strict Mode development checks?|They expose unsafe rendering and missing cleanup through extra development-only checks.|Find lifecycle and purity bugs|Double production charges|Optimize database queries|Disable concurrent rendering`),
  },
  {
    id: "typescript", title: "TypeScript", category: "Languages", summary: "Practical types, narrowing and safer API boundaries.",
    features: ["Static checking catches incompatible values before execution.", "Unions and narrowing represent multiple valid runtime shapes.", "Generics preserve relationships between inputs and outputs.", "Runtime validation remains necessary for external data."],
    source: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
    questions: questions("typescript", `How does unknown differ from any?|unknown requires narrowing before use; any disables most checking for that value.|unknown requires narrowing|Both disable all checks|any is always safer|unknown accepts no values
What is a discriminated union?|A union whose variants share a literal-valued field that identifies each shape.|Variants identified by a literal field|An array of unrelated strings|A class with no properties|A runtime database join
What is type narrowing?|Control-flow checks refine a broad type to a more specific type in a branch.|Refining types through checks|Deleting runtime fields|Compressing source code|Casting everything to any
Do TypeScript types validate JSON at runtime?|No. Types are erased; validate untrusted data with runtime checks or a schema library.|No, runtime validation is needed|Yes, automatically|Only when using interfaces|Only in production
What do generics preserve?|They express reusable relationships between types, such as an input element type and a returned element.|Type relationships|Runtime encryption|Database indexes|CSS themes
What does strictNullChecks change?|null and undefined must be handled where they are possible instead of being assignable everywhere.|Explicit nullable handling|Removal of null at runtime|Automatic default values|Mandatory optional properties
What is never useful for?|It models impossible values and supports exhaustive checking of discriminated unions.|Impossible cases and exhaustiveness|Any possible object|Optional values|A Promise that always resolves
How do type assertions behave at runtime?|They do not convert or validate the value; they only change the compiler's view.|No runtime conversion|They parse JSON|They throw on mismatch|They coerce all values
What does keyof produce?|It produces a union of property keys of a type.|A union of property keys|An array at runtime|An encrypted key|Only string values
What does Partial do?|It makes every property of an object type optional, shallowly.|Make properties optional|Make properties deeply readonly|Delete runtime properties|Require every property
What does Pick do?|It constructs a type containing a selected subset of properties.|Select properties by key|Remove all optional fields|Create runtime copies|Sort object entries
What does Omit do?|It constructs a type excluding selected property keys.|Exclude selected properties|Delete values at runtime|Make fields nullable|Merge database rows
How does satisfies differ from a type assertion?|satisfies checks compatibility while retaining useful inferred type information instead of simply asserting a view.|Check compatibility while retaining inference|Convert runtime values|Disable checking|Create a subclass
What does as const do?|It infers literal values and readonly object properties or tuple positions; it does not deeply freeze runtime objects.|Literal and readonly inference|Runtime deep freeze|JSON serialization|Automatic cloning
What is structural typing?|Compatibility depends primarily on a value's shape rather than an explicitly declared nominal identity.|Compatibility by shape|Compatibility only by class name|Runtime reflection only|A database schema migration
How should a catch value be handled under strict settings?|Treat it as unknown and narrow, for example with instanceof Error, before reading properties.|Narrow the caught value|Assume every value has message|Cast everything to string blindly|Ignore all errors
What is a type predicate?|A function return annotation such as value is User tells the compiler how a successful check narrows input.|A declared narrowing result|An SQL WHERE clause|A runtime enum only|An automatic validator with no logic
How does readonly affect arrays?|It prevents mutating operations through that type reference; other mutable references can still change the underlying value.|Restricts mutation through the reference|Freezes memory globally|Copies on every access|Deletes push at runtime
What is an intersection type?|It requires a value to satisfy all combined type constraints.|All combined constraints|Exactly one union variant|Only optional fields|A runtime merge function
Why avoid non-null assertions on untrusted data?|The assertion removes a compiler warning without proving the value exists at runtime.|They skip proof of runtime presence|They validate API payloads|They insert default values|They prevent all exceptions`),
  },
  {
    id: "docker", title: "Docker & CI/CD", category: "DevOps", summary: "Repeatable containers, reliable pipelines and release fundamentals.",
    features: ["Images package application dependencies into reusable layers.", "Containers run isolated processes from those images.", "Multi-stage builds separate build tools from runtime artifacts.", "CI checks changes; delivery pipelines promote reviewed artifacts."],
    source: "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/",
    questions: questions("docker", `How does an image differ from a container?|An image is a packaged template; a container is a running or stopped instance with a writable layer.|Template versus instance|Both are virtual machines|An image is a running process only|A container is a source repository
What does a Dockerfile define?|It defines instructions for building an image, including a base, files, dependencies and startup behavior.|Image build instructions|A running database schema|Only port mappings|Only user passwords
Why use multi-stage builds?|Build dependencies stay in earlier stages while the final image contains the needed runtime artifacts.|Smaller runtime image|Automatic application scaling|Unlimited CPU|Guaranteed bug-free code
Why use a .dockerignore file?|It excludes unnecessary or sensitive files from the build context, reducing exposure and transfer size.|Filter the build context|Hide runtime logs|Disable networking|Skip all dependencies
How do volumes help with persistence?|Volumes retain data independently of a container's writable layer and replacement lifecycle.|Persist data beyond container replacement|Make image layers writable globally|Back up data automatically|Encrypt every file automatically
What does EXPOSE do?|It documents the intended container port; publishing with a port mapping is a separate step.|Document a listening port|Publish a host port automatically|Open every firewall|Create an HTTPS certificate
Why run a container as a non-root user?|It reduces privileges if the application is compromised; additional isolation controls still matter.|Reduce process privileges|Guarantee perfect isolation|Remove file permissions|Increase CPU allocation
What is continuous integration?|Developers integrate changes frequently with automated builds and checks that catch regressions early.|Frequent integration with automated checks|Manual monthly deployment|Only server monitoring|Only writing documentation
How does continuous delivery differ from deployment?|Delivery keeps releases ready with a possible approval gate; deployment automatically releases passing changes.|Ready-to-release versus automatic release|They both require manual builds|Delivery never runs tests|Deployment only creates documentation
Why pin deployment images by digest?|A digest identifies exact image content, avoiding mutable-tag surprises.|Immutable artifact identity|Smaller logs|Automatic backups|Faster DNS lookup
How does Docker layer caching help?|Unchanged instruction layers can be reused; order stable dependency steps before frequently changing source files.|Reuse unchanged build work|Cache all HTTP responses|Persist all runtime data|Prevent package vulnerabilities
Why use npm ci in a pipeline?|It installs from the lockfile with consistency checks and is designed for clean automated installs.|Reproducible lockfile-based install|Update every package automatically|Ignore the lockfile|Skip dependency installation
How should build secrets be supplied?|Use dedicated secret mounts or the CI secret facility, avoiding copying secrets into image layers.|Ephemeral secret mechanisms|COPY a private key into the image|Commit an env file|Put tokens in a public image label
What is a health check for?|It reports whether a workload is healthy using an application-relevant probe; orchestration determines the response.|Report workload health|Automatically patch code|Back up every volume|Guarantee business correctness
What is a rolling deployment?|It gradually replaces instances while preserving service capacity, subject to readiness and rollout settings.|Gradual instance replacement|Stopping every instance at once|Deploying only documentation|Rebuilding all developer laptops
What is a canary release?|It exposes a small share of traffic to a new version before a wider rollout based on observations.|Limited traffic to a new version|A permanent development branch|A database dump|A local lint command
What enables reliable rollback?|Retain known-good artifacts and plan backward-compatible configuration and database changes.|Known-good artifacts and compatible changes|Only a mutable latest tag|Deleting previous images|Skipping release metadata
Why avoid sharing one mutable environment across parallel jobs?|Jobs can interfere through files, ports or records; isolate workspaces and resources.|Prevent cross-job interference|Increase network privileges|Disable pipeline checks|Reduce test assertions
What is an SBOM?|A software bill of materials inventories components used in an artifact for tracking and security analysis.|An inventory of software components|A deployment password|A CPU benchmark|A network firewall
Why scan images and dependencies?|Scanning identifies known vulnerabilities for triage; it does not prove the application is secure.|Identify known vulnerabilities|Guarantee no security issues|Replace code review|Enable root access`),
  },
  ...TECHY_ADDITIONAL_TOPICS,
];

export const TECHY_VOCABULARY = [
  ["Alignment", "Agreement on goals or direction.", "agreement, coordination", "disagreement, divergence", "Let's confirm alignment on the release scope."],
  ["Accountability", "Responsibility for decisions and outcomes.", "ownership, responsibility", "irresponsibility, evasion", "Each service needs clear accountability for incidents."],
  ["Proactive", "Acting before a problem requires a response.", "anticipatory, preventive", "reactive, passive", "Proactive monitoring helped us detect the outage early."],
  ["Transparent", "Open and clear about information or decisions.", "open, candid", "opaque, secretive", "Please be transparent about the delivery risk."],
  ["Feasible", "Practical and possible with available constraints.", "achievable, viable", "impractical, impossible", "A phased migration is feasible within this quarter."],
  ["Concise", "Expressing an idea clearly in few words.", "brief, succinct", "verbose, wordy", "Send a concise summary before the review."],
  ["Collaborative", "Involving people working together.", "cooperative, joint", "uncooperative, individualistic", "We took a collaborative approach to API design."],
  ["Escalate", "Raise an issue to a higher level of attention.", "elevate, intensify", "de-escalate, reduce", "Escalate the blocker if access is still unavailable."],
  ["Mitigate", "Reduce the impact or likelihood of a problem.", "alleviate, lessen", "aggravate, worsen", "A gradual rollout will mitigate deployment risk."],
  ["Prioritize", "Give something greater importance or earlier attention.", "rank, emphasize", "deprioritize, neglect", "Prioritize the authentication fix before cosmetic changes."],
  ["Consensus", "Broad agreement within a group.", "agreement, accord", "dissent, disagreement", "The team reached consensus on the API contract."],
  ["Ambiguous", "Open to more than one interpretation.", "unclear, vague", "clear, explicit", "The acceptance criterion is ambiguous; add an example."],
  ["Resilient", "Able to recover or keep working after disruption.", "robust, adaptable", "fragile, vulnerable", "Retries alone do not make a system resilient."],
  ["Efficient", "Achieving a result with little wasted effort.", "economical, productive", "wasteful, inefficient", "Batching the requests made the process more efficient."],
  ["Diligent", "Showing careful and persistent effort.", "thorough, conscientious", "careless, negligent", "Diligent review caught the permissions bug."],
  ["Autonomy", "Freedom to make decisions within an agreed scope.", "independence, self-direction", "dependence, subordination", "The team has autonomy over implementation choices."],
  ["Constructive", "Intended to help improve an outcome.", "helpful, productive", "destructive, unhelpful", "Keep code review feedback specific and constructive."],
  ["Streamline", "Simplify a process to make it more efficient.", "simplify, optimize", "complicate, obstruct", "We can streamline onboarding with a setup script."],
  ["Tangible", "Concrete and observable rather than abstract.", "concrete, measurable", "intangible, abstract", "The change produced a tangible reduction in latency."],
  ["Comprehensive", "Covering the relevant parts thoroughly.", "thorough, extensive", "partial, incomplete", "The handover includes a comprehensive recovery guide."],
].map(([word, meaning, synonyms, antonyms, sentence]) => ({ word, meaning, synonyms, antonyms, sentence }));

export { TECHY_EXAMPLES };
