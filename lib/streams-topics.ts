import type { ExamChapter } from "./streams-exams";

/*
 * Streams' topic-led tech playlists (2026-11-27): TypeScript, Jest and React Testing Library, TanStack, Zustand,
 * Playwright, FastAPI, Python, NestJS, modern JavaScript and TypeScript, and DevOps on AWS, plus further System Design
 * chapters. Shown to everyone (the Tech category).
 *
 * Each topic is one step. Its video is chosen in lib/streams-topic-videos.ts (generated: a public, embeddable video of
 * 1080p or more for that topic, 4K preferred), by the key "<playlist>#<topic index>". Titles and study notes are ours,
 * written from each topic, so they describe it whichever video teaches it.
 */
export type TopicPlaylist = { id: string; group: "tech"; name: string; playlist: string; tagline: string; color: string; chapters: readonly ExamChapter[] };

export const TECH_TOPIC_PLAYLISTS = [
  /* ---------- TypeScript ---------- */
  { id: "typescript", group: "tech", name: "TypeScript", playlist: "TypeScript: types to production", color: "#3178c6",
    tagline: "The type system from first annotations to generics, utility types, configuration and TypeScript with React.",
    chapters: [
      { title: "TypeScript foundations", level: "Beginner", summary: "Why TypeScript exists, setting it up and the everyday types you will write in every file.", topics: [
        ["TypeScript in one course", ["What TypeScript adds to JavaScript", "Installing it and compiling your first file", "How types catch bugs before they run"]],
        ["Basic types and type inference", ["string, number, boolean, arrays and tuples", "When TypeScript infers a type for you", "any, unknown and never"]],
        ["Functions in TypeScript", ["Typing parameters and return values", "Optional, default and rest parameters", "Function types and overloads"]],
        ["Interfaces and type aliases", ["Describing object shapes", "Extending interfaces and intersecting types", "When to choose an interface or a type"]],
      ] },
      { title: "The type system in depth", level: "Intermediate", summary: "Unions, narrowing, generics and the built-in utility types that make large codebases safe.", topics: [
        ["Union types and type narrowing", ["Union and literal types", "Narrowing with typeof, in and instanceof", "Discriminated unions and exhaustive checks"]],
        ["TypeScript generics", ["Writing generic functions", "Generic constraints with extends", "Generic interfaces and classes"]],
        ["TypeScript utility types", ["Partial, Required and Readonly", "Pick, Omit and Record", "ReturnType, Parameters and Awaited"]],
        ["Classes in TypeScript", ["Access modifiers and parameter properties", "Abstract classes and implements", "Static members and getters"]],
      ] },
      { title: "TypeScript in real projects", level: "Intermediate", summary: "Configuring the compiler, typing modules and libraries, and using TypeScript with React.", topics: [
        ["tsconfig.json explained", ["strict mode and what it turns on", "target, module and moduleResolution", "Paths, includes and project references"]],
        ["TypeScript with React", ["Typing props and children", "Typing state, events and refs", "Typing custom hooks and context"]],
        ["Declaration files and typing libraries", ["What a .d.ts file is", "Using @types packages", "Declaring modules and globals"]],
      ] },
    ] },

  /* ---------- Jest and React Testing Library ---------- */
  { id: "testing", group: "tech", name: "Jest & RTL", playlist: "Jest and React Testing Library: test with confidence", color: "#99425b",
    tagline: "Unit tests with Jest, component tests with React Testing Library, mocking, async code and coverage.",
    chapters: [
      { title: "Jest fundamentals", level: "Beginner", summary: "Writing, running and organising tests with Jest, and the matchers you use every day.", topics: [
        ["Jest testing tutorial", ["Installing Jest and writing a first test", "describe, test and expect", "Running tests in watch mode"]],
        ["Jest matchers", ["toBe versus toEqual", "Truthiness, numbers and strings", "Arrays, objects and exceptions"]],
        ["Jest mock functions", ["jest.fn and what it records", "Mocking modules with jest.mock", "Spying on methods with jest.spyOn"]],
        ["Testing asynchronous code in Jest", ["Promises and async/await in tests", "Fake timers", "Avoiding tests that pass by accident"]],
      ] },
      { title: "React Testing Library", level: "Intermediate", summary: "Testing components the way users use them: queries, events and async UI.", topics: [
        ["React Testing Library tutorial", ["render and screen", "Testing behaviour, not implementation", "The guiding principles"]],
        ["React Testing Library queries", ["getBy, queryBy and findBy", "Priority: ByRole first", "Accessible names and text matchers"]],
        ["user-event in React Testing Library", ["Typing, clicking and tabbing", "user-event versus fireEvent", "Testing forms end to end"]],
        ["Mocking API calls with Mock Service Worker", ["Why mock at the network layer", "Writing request handlers", "Testing loading and error states"]],
      ] },
      { title: "Testing in practice", level: "Advanced", summary: "Hooks, context, coverage and keeping a test suite fast in CI.", topics: [
        ["Testing custom React hooks", ["renderHook and act", "Hooks that fetch data", "Wrapping providers"]],
        ["Test-driven development with Jest", ["Red, green, refactor", "Writing the test first", "When TDD pays off"]],
        ["Code coverage with Jest", ["Statement, branch and function coverage", "Coverage thresholds", "Reading the coverage report"]],
      ] },
    ] },

  /* ---------- TanStack ---------- */
  { id: "tanstack", group: "tech", name: "TanStack", playlist: "TanStack: Query, Router, Table, Form and Start", color: "#e2710c",
    tagline: "Server state with TanStack Query, type-safe routing, headless tables and forms, and the TanStack Start framework.",
    chapters: [
      { title: "TanStack Query", level: "Beginner", summary: "Fetching, caching and updating server state without hand-written loading logic.", topics: [
        ["TanStack Query (React Query) tutorial", ["Why server state is different", "QueryClient and useQuery", "Loading, error and success states"]],
        ["React Query mutations", ["useMutation for writes", "Invalidating queries after a change", "Optimistic updates"]],
        ["React Query caching and stale time", ["staleTime versus gcTime", "Query keys and refetching", "Prefetching data"]],
        ["Infinite queries and pagination in React Query", ["useInfiniteQuery", "Paged and cursor APIs", "Infinite scroll"]],
      ] },
      { title: "TanStack Router and Start", level: "Intermediate", summary: "Fully type-safe routing and the full-stack framework built on it.", topics: [
        ["TanStack Router tutorial", ["File-based routes", "Type-safe links and params", "Route loaders"]],
        ["TanStack Router search params", ["Validating search params", "Search params as state", "Navigation with typed params"]],
        ["TanStack Start", ["What TanStack Start is", "Server functions", "Server-side rendering and deployment"]],
      ] },
      { title: "TanStack Table and Form", level: "Intermediate", summary: "Headless building blocks for data grids and forms.", topics: [
        ["TanStack Table tutorial", ["Headless tables explained", "Column definitions", "Sorting, filtering and pagination"]],
        ["TanStack Form", ["useForm and fields", "Validation with a schema", "Async validation and submission"]],
      ] },
    ] },

  /* ---------- Zustand ---------- */
  { id: "zustand", group: "tech", name: "Zustand", playlist: "Zustand: simple React state", color: "#5b4636",
    tagline: "Small, fast global state for React: stores, selectors, middleware and patterns for large apps.",
    chapters: [
      { title: "Zustand essentials", level: "Beginner", summary: "Creating stores and reading and updating state from any component.", topics: [
        ["Zustand tutorial", ["What Zustand is and why it is small", "Creating a store with create", "Reading state in components"]],
        ["Zustand actions and updating state", ["set and get", "Updating nested state", "Async actions that fetch data"]],
        ["Zustand selectors and re-renders", ["Selecting slices of state", "useShallow for objects", "Avoiding needless re-renders"]],
      ] },
      { title: "Zustand in larger apps", level: "Intermediate", summary: "Middleware, persistence, TypeScript and the slices pattern.", topics: [
        ["Zustand persist middleware", ["Saving state to localStorage", "Partial persistence", "Migrations between versions"]],
        ["Zustand with TypeScript", ["Typing a store", "Typed actions and selectors", "Combining middleware types"]],
        ["Zustand slices pattern", ["Splitting a store into slices", "Sharing state across slices", "Keeping stores maintainable"]],
        ["Zustand with Next.js", ["Stores and server rendering", "A store per request", "Hydration pitfalls"]],
        ["Zustand vs Redux vs Context", ["What each one is good at", "Boilerplate and performance", "Choosing for your app"]],
      ] },
    ] },

  /* ---------- Playwright ---------- */
  { id: "playwright", group: "tech", name: "Playwright", playlist: "Playwright: end-to-end testing", color: "#2d7d46",
    tagline: "Reliable browser tests with Playwright: locators, assertions, fixtures, API tests, debugging and CI.",
    chapters: [
      { title: "Getting started", level: "Beginner", summary: "Installing Playwright, writing the first tests and generating them with codegen.", topics: [
        ["Playwright tutorial for beginners", ["Installing Playwright Test", "Writing and running a first test", "Chromium, Firefox and WebKit"]],
        ["Playwright locators", ["getByRole, getByText and getByLabel", "Chaining and filtering locators", "Why locators auto-wait"]],
        ["Playwright assertions", ["Web-first assertions", "Soft assertions", "Screenshots and visual comparisons"]],
        ["Playwright codegen", ["Recording a test", "Picking locators", "Cleaning up generated code"]],
      ] },
      { title: "Scaling a test suite", level: "Intermediate", summary: "Fixtures, page objects, authentication and API testing.", topics: [
        ["Playwright fixtures", ["Built-in fixtures", "Writing custom fixtures", "Sharing setup across tests"]],
        ["Page Object Model in Playwright", ["Why page objects", "Building a page class", "Keeping tests readable"]],
        ["Playwright authentication", ["Logging in once", "storageState", "Multiple user roles"]],
        ["API testing with Playwright", ["The request fixture", "Testing REST endpoints", "Mixing API and UI steps"]],
        ["Mocking network requests in Playwright", ["page.route", "Fulfilling with mock data", "Testing error states"]],
      ] },
      { title: "Debugging and CI", level: "Advanced", summary: "Finding failures fast and running Playwright in pipelines.", topics: [
        ["Playwright Trace Viewer and debugging", ["UI mode", "Recording and reading traces", "Debugging flaky tests"]],
        ["Playwright with GitHub Actions", ["The CI workflow", "Sharding and parallel workers", "HTML reports as artifacts"]],
      ] },
    ] },

  /* ---------- FastAPI ---------- */
  { id: "fastapi", group: "tech", name: "FastAPI", playlist: "FastAPI: modern Python APIs", color: "#05998b",
    tagline: "Fast, typed Python APIs: routing, Pydantic models, dependencies, databases, auth, testing and deployment.",
    chapters: [
      { title: "FastAPI foundations", level: "Beginner", summary: "Building endpoints with automatic validation and interactive documentation.", topics: [
        ["FastAPI course for beginners", ["Installing FastAPI and Uvicorn", "A first endpoint", "Interactive docs at /docs"]],
        ["FastAPI path and query parameters", ["Path parameters and types", "Query parameters and defaults", "Validation errors explained"]],
        ["Pydantic models in FastAPI", ["Request bodies", "Response models", "Field validation"]],
        ["FastAPI dependency injection", ["Depends", "Sharing logic across routes", "Dependencies with yield"]],
      ] },
      { title: "Building a real API", level: "Intermediate", summary: "Databases, authentication and structure for a production service.", topics: [
        ["FastAPI with SQLAlchemy and a database", ["Models and sessions", "CRUD endpoints", "Migrations with Alembic"]],
        ["FastAPI JWT authentication", ["OAuth2 password flow", "Issuing and checking JWTs", "Protecting routes"]],
        ["Async in FastAPI", ["async def versus def", "Async database access", "Background tasks"]],
        ["Structuring a large FastAPI project", ["APIRouter", "Settings and configuration", "Folder layout"]],
      ] },
      { title: "Shipping FastAPI", level: "Advanced", summary: "Testing and deploying the service.", topics: [
        ["Testing FastAPI with pytest", ["TestClient", "Overriding dependencies", "A test database"]],
        ["Deploying FastAPI with Docker", ["Writing the Dockerfile", "Running with Uvicorn workers", "Deploying to the cloud"]],
      ] },
    ] },

  /* ---------- Python ---------- */
  { id: "python", group: "tech", name: "Python", playlist: "Python: zero to confident", color: "#3c6e9f",
    tagline: "Python from the first line of code to OOP, generators, async, type hints and the newest releases.",
    chapters: [
      { title: "Python basics", level: "Beginner", summary: "Syntax, data types, control flow and functions.", topics: [
        ["Python full course for beginners", ["Installing Python and running code", "Variables, numbers and strings", "Input and output"]],
        ["Python lists, tuples, sets and dictionaries", ["Choosing the right collection", "Common methods", "Comprehensions"]],
        ["Python functions", ["Parameters, defaults and *args/**kwargs", "Return values and scope", "Lambda functions"]],
        ["Python file handling and exceptions", ["Reading and writing files", "try, except and finally", "Raising your own exceptions"]],
      ] },
      { title: "Intermediate Python", level: "Intermediate", summary: "Object-oriented code, modules and the tools of the language.", topics: [
        ["Object-oriented programming in Python", ["Classes and objects", "Inheritance and polymorphism", "Dunder methods"]],
        ["Python modules, packages and virtual environments", ["Importing modules", "pip and venv", "Structuring a package"]],
        ["Python iterators and generators", ["The iterator protocol", "yield and generator expressions", "Lazy pipelines"]],
        ["Python decorators", ["Functions as objects", "Writing a decorator", "functools.wraps and decorators with arguments"]],
      ] },
      { title: "Modern Python", level: "Advanced", summary: "Concurrency, typing and what is new in recent releases.", topics: [
        ["Python asyncio", ["Coroutines and the event loop", "async and await", "Running tasks concurrently"]],
        ["Python type hints", ["Annotating functions and variables", "Generics and Protocols", "Checking with mypy"]],
        ["What's new in Python 3.13 and 3.14", ["The new interactive shell", "Free-threaded Python without the GIL", "Template strings and other additions"]],
      ] },
    ] },

  /* ---------- NestJS ---------- */
  { id: "nestjs", group: "tech", name: "NestJS", playlist: "NestJS: structured Node.js backends", color: "#d71e4f",
    tagline: "Modules, controllers and providers, validation, auth, databases, microservices and testing in NestJS.",
    chapters: [
      { title: "NestJS fundamentals", level: "Beginner", summary: "How a NestJS application is put together.", topics: [
        ["NestJS crash course", ["Creating a project with the Nest CLI", "The request lifecycle", "A first REST resource"]],
        ["NestJS modules, controllers and providers", ["Organising code in modules", "Routing in controllers", "Services as providers"]],
        ["Dependency injection in NestJS", ["How the container works", "Custom providers", "Scopes"]],
      ] },
      { title: "Building APIs", level: "Intermediate", summary: "Validation, request pipeline features, data access and auth.", topics: [
        ["NestJS pipes and validation", ["ValidationPipe", "DTOs with class-validator", "Transforming input"]],
        ["NestJS guards, interceptors and middleware", ["Where each one runs", "Guards for authorisation", "Interceptors for logging and mapping"]],
        ["NestJS with Prisma", ["Setting up Prisma", "A Prisma service", "CRUD with a database"]],
        ["NestJS JWT authentication", ["Passport strategies", "Issuing and validating tokens", "Protecting routes with guards"]],
      ] },
      { title: "Beyond REST", level: "Advanced", summary: "GraphQL, microservices and testing.", topics: [
        ["NestJS GraphQL", ["Code-first schemas", "Resolvers", "Queries and mutations"]],
        ["NestJS microservices", ["Transports", "Message and event patterns", "Communicating between services"]],
        ["Testing NestJS applications", ["Unit tests with the testing module", "Mocking providers", "End-to-end tests"]],
      ] },
    ] },

  /* ---------- Modern JavaScript and TypeScript ---------- */
  { id: "modernjs", group: "tech", name: "Advanced JS & TS", playlist: "JavaScript and TypeScript: advanced and latest features", color: "#b39b00",
    tagline: "How JavaScript really runs, the latest ECMAScript features and advanced TypeScript types.",
    chapters: [
      { title: "How JavaScript works", level: "Intermediate", summary: "The mechanics every senior JavaScript developer is expected to know.", topics: [
        ["JavaScript closures and scope", ["Lexical scope", "How closures capture variables", "Practical uses of closures"]],
        ["JavaScript event loop", ["The call stack and task queues", "Microtasks versus macrotasks", "Why order of output surprises people"]],
        ["JavaScript promises and async/await", ["Promise states and chaining", "Promise.all, allSettled, race and any", "Error handling with async/await"]],
        ["JavaScript prototypes and this", ["The prototype chain", "How this is decided", "call, apply and bind"]],
      ] },
      { title: "The latest JavaScript", level: "Intermediate", summary: "Features added in ES2022 to ES2025 that change everyday code.", topics: [
        ["New JavaScript features ES2023 and ES2024", ["toSorted, toReversed and with", "Object.groupBy", "Promise.withResolvers"]],
        ["New JavaScript features ES2025", ["Set methods: union, intersection and difference", "Iterator helpers", "RegExp and JSON module additions"]],
        ["JavaScript modules: ESM explained", ["import and export", "Dynamic import", "Top-level await"]],
        ["JavaScript Proxy and Reflect", ["Intercepting operations", "Validation and reactive patterns", "The Reflect API"]],
      ] },
      { title: "Advanced TypeScript", level: "Advanced", summary: "The type-level features behind well-typed libraries.", topics: [
        ["TypeScript conditional types and infer", ["Conditional types", "Extracting types with infer", "Distributive conditional types"]],
        ["TypeScript mapped types", ["Mapping over keys", "Key remapping with as", "Building your own utility types"]],
        ["TypeScript template literal types", ["String types from other types", "Typed event names and routes", "Intrinsic string helpers"]],
        ["TypeScript 5 new features", ["The satisfies operator", "const type parameters", "Decorators and using declarations"]],
      ] },
    ] },

  /* ---------- DevOps on AWS ---------- */
  { id: "devops-aws", group: "tech", name: "DevOps on AWS", playlist: "DevOps: the popular AWS services", color: "#d4690a",
    tagline: "DevOps practices with the AWS services teams use most: EC2, S3, IAM, VPC, containers, CI/CD, IaC and monitoring.",
    chapters: [
      { title: "DevOps and AWS foundations", level: "Beginner", summary: "What DevOps is and the core AWS building blocks.", topics: [
        ["DevOps explained", ["What DevOps is and why it matters", "The DevOps lifecycle", "Roles, tools and culture"]],
        ["AWS IAM tutorial", ["Users, groups and roles", "Policies and least privilege", "MFA and access keys"]],
        ["AWS EC2 tutorial", ["Launching an instance", "Instance types and pricing", "Security groups and key pairs"]],
        ["AWS S3 tutorial", ["Buckets and objects", "Storage classes", "Bucket policies and static hosting"]],
        ["AWS VPC explained", ["Subnets and route tables", "Internet and NAT gateways", "Security groups versus NACLs"]],
      ] },
      { title: "Running applications", level: "Intermediate", summary: "Databases, serverless, containers and traffic.", topics: [
        ["AWS RDS tutorial", ["Managed relational databases", "Multi-AZ and read replicas", "Backups and snapshots"]],
        ["AWS Lambda tutorial", ["Functions and triggers", "Pricing and limits", "Lambda with API Gateway"]],
        ["AWS ECS and Fargate", ["Task definitions and services", "Fargate versus EC2", "Deploying a container"]],
        ["AWS EKS tutorial", ["Kubernetes on AWS", "Node groups", "Deploying to EKS"]],
        ["AWS Elastic Load Balancer and Auto Scaling", ["ALB and NLB", "Target groups and health checks", "Auto Scaling groups"]],
        ["AWS Route 53 and CloudFront", ["DNS records and routing policies", "A CDN in front of your app", "HTTPS with ACM"]],
      ] },
      { title: "Automation and operations", level: "Advanced", summary: "Pipelines, infrastructure as code and observability.", topics: [
        ["AWS CodePipeline CI/CD", ["CodeCommit, CodeBuild and CodeDeploy", "Building a pipeline", "Deployment strategies"]],
        ["Terraform on AWS", ["Providers, resources and state", "Plan and apply", "Modules and remote state"]],
        ["AWS CloudFormation and CDK", ["Templates and stacks", "The CDK in TypeScript", "Drift and change sets"]],
        ["AWS CloudWatch monitoring", ["Metrics and alarms", "Logs and Logs Insights", "Dashboards"]],
      ] },
    ] },
  /* ---------- Data structures and algorithms ---------- */
  { id: "dsa", group: "tech", name: "DSA", playlist: "Data structures and algorithms: interview ready", color: "#6b4fbb",
    tagline: "Complexity, the core data structures and the algorithm patterns that coding interviews ask for.",
    chapters: [
      { title: "Data structure foundations", level: "Beginner", summary: "Measuring cost with Big O and the structures every solution is built from.", topics: [
        ["Big O notation and time complexity", ["Counting work as the input grows", "Common complexities from O(1) to O(n²)", "Space complexity"]],
        ["Arrays and strings", ["Indexing, insertion and deletion costs", "The two-pointer technique", "The sliding-window technique"]],
        ["Hash tables", ["Hashing and collisions", "Hash maps and sets in practice", "Frequency-counting problems"]],
        ["Linked lists", ["Singly and doubly linked lists", "Reversing a linked list", "Fast and slow pointers"]],
        ["Stacks and queues", ["LIFO and FIFO", "The monotonic stack", "A queue built from two stacks"]],
        ["Recursion", ["Base case and recursive case", "The call stack", "Drawing a recursion tree"]],
      ] },
      { title: "Core algorithms", level: "Intermediate", summary: "Searching, sorting, trees and heaps, with the patterns behind each.", topics: [
        ["Binary search", ["Searching a sorted array", "Lower and upper bounds", "Binary search on the answer"]],
        ["Sorting algorithms", ["Bubble, insertion and selection sort", "Merge sort and quicksort", "Stability and complexity"]],
        ["Binary trees and tree traversal", ["Preorder, inorder and postorder", "Level-order traversal with a queue", "Height and depth"]],
        ["Binary search trees", ["Insert, search and delete", "Validating a BST", "Why balance matters"]],
        ["Heaps and priority queues", ["The heap property and heapify", "Top-K problems", "Heap sort"]],
        ["Trie data structure", ["Storing words character by character", "Insert and prefix search", "Autocomplete"]],
      ] },
      { title: "Advanced algorithms", level: "Advanced", summary: "Graphs, dynamic programming and the techniques for the hardest interview rounds.", topics: [
        ["Graph algorithms BFS and DFS", ["Adjacency lists and matrices", "Breadth-first and depth-first search", "Connected components"]],
        ["Dijkstra's shortest path algorithm", ["Weighted graphs", "The priority-queue implementation", "Why negative weights break it"]],
        ["Topological sort", ["Directed acyclic graphs and dependencies", "Kahn's algorithm", "Ordering with DFS"]],
        ["Union Find disjoint set", ["Union and find", "Path compression and union by rank", "Cycle detection"]],
        ["Dynamic programming", ["Overlapping subproblems", "Memoization and tabulation", "Classic problems step by step"]],
        ["Backtracking algorithms", ["Choose, explore, un-choose", "Subsets and permutations", "N-Queens"]],
        ["Greedy algorithms", ["The greedy choice", "Interval scheduling", "When greedy fails"]],
      ] },
    ] },

  /* ---------- DevOps tools ---------- */
  { id: "devops", group: "tech", name: "DevOps tools", playlist: "DevOps: the popular tools", color: "#2b6c8f",
    tagline: "The tools DevOps teams use every day: Linux, Git, Docker, Kubernetes, Terraform, Ansible, CI/CD, GitOps and monitoring.",
    chapters: [
      { title: "DevOps foundations", level: "Beginner", summary: "The command line, version control and containers that everything else builds on.", topics: [
        ["Linux for DevOps", ["The shell and the filesystem", "Users, permissions and processes", "Networking and services"]],
        ["Git and GitHub", ["Commits, branches and merges", "Remotes and pull requests", "Resolving conflicts"]],
        ["Docker tutorial", ["Images and containers", "Writing a Dockerfile", "Volumes and networks"]],
        ["Docker Compose", ["Defining a multi-container app", "Services, networks and volumes", "Compose for local development"]],
      ] },
      { title: "Orchestration and infrastructure as code", level: "Intermediate", summary: "Running containers at scale and describing infrastructure in code.", topics: [
        ["Kubernetes tutorial", ["Pods, deployments and services", "kubectl essentials", "ConfigMaps, Secrets and scaling"]],
        ["Helm charts", ["What a chart is", "Values and templates", "Installing and upgrading releases"]],
        ["Terraform tutorial", ["Providers, resources and state", "Variables and outputs", "Modules"]],
        ["Ansible tutorial", ["Inventories and playbooks", "Modules and roles", "Idempotent configuration"]],
      ] },
      { title: "Delivery and operations", level: "Advanced", summary: "Pipelines, GitOps and keeping production observable.", topics: [
        ["GitHub Actions CI/CD", ["Workflows, jobs and steps", "Secrets and environments", "Building and deploying on every push"]],
        ["Jenkins pipeline", ["Jenkinsfile and stages", "Agents and plugins", "A full CI/CD pipeline"]],
        ["Argo CD GitOps", ["What GitOps is", "Syncing a cluster from Git", "Rollbacks and health"]],
        ["Prometheus and Grafana monitoring", ["Metrics and exporters", "PromQL basics", "Dashboards and alerts"]],
      ] },
    ] },
] as const satisfies readonly TopicPlaylist[];

export type TopicPlaylistId = (typeof TECH_TOPIC_PLAYLISTS)[number]["id"];

/**
 * Further topic-led chapters for the hand-picked playlists in lib/streams.ts, video per topic as above, keyed "<playlist>#<i>"
 * (indexes run across that playlist's chapters here).
 */
export const EXTRA_TOPIC_CHAPTERS = {
  nextjs: [
    { title: "Next.js 16 in practice", level: "Intermediate", summary: "Hands-on builds with the features you use in every production app.", topics: [
      ["Next.js 16 full course", ["Project setup with the App Router", "Pages, layouts and navigation", "Building and deploying a complete app"]],
      ["Next.js Server Actions", ["Mutating data from a form", "Revalidating after a mutation", "Validation and error handling"]],
      ["Next.js authentication", ["Sessions and sign-in flows", "Protecting routes and data", "Auth libraries that fit the App Router"]],
      ["Next.js middleware", ["Running code before a request completes", "Redirects, rewrites and headers", "Matching paths (proxy.ts in Next.js 16)"]],
      ["Next.js SEO and metadata", ["The Metadata API", "Open Graph images", "Sitemaps and robots"]],
      ["Next.js full stack app with Prisma", ["Modelling data with Prisma", "Querying from Server Components", "Creating, updating and deleting records"]],
    ] },
  ],
  react: [
    { title: "React 19 in practice", level: "Intermediate", summary: "The everyday React patterns, written the React 19 way.", topics: [
      ["React full course for beginners", ["Components, JSX and props", "State and events", "Rendering lists and conditions"]],
      ["React hooks explained", ["useState and useEffect", "useRef and useMemo", "Writing custom hooks"]],
      ["React 19 Actions and useActionState", ["Actions for form submissions", "useActionState and useFormStatus", "Optimistic updates with useOptimistic"]],
      ["React Compiler explained", ["What the compiler memoizes for you", "Adopting it in an existing app", "When useMemo and useCallback still matter"]],
      ["React context and useReducer", ["Sharing state with context", "Reducers for complex state", "Avoiding unnecessary re-renders"]],
      ["React performance optimization", ["Finding slow renders with the Profiler", "Memoization and code splitting", "Lists, transitions and Suspense"]],
    ] },
  ],
  langchain: [
    { title: "LangChain hands-on", level: "Intermediate", summary: "Building real retrieval and agent apps with LangChain.", topics: [
      ["LangChain RAG tutorial", ["Loading and splitting documents", "Embeddings and a vector store", "Answering questions over your data"]],
      ["LangChain agents tutorial", ["Giving a model tools", "The agent loop", "Debugging an agent's steps"]],
      ["LangChain structured output", ["Returning typed data from a model", "Schemas with Pydantic or Zod", "Handling invalid output"]],
      ["LangChain with Ollama local models", ["Running a model locally with Ollama", "Using it from LangChain", "Local RAG without an API key"]],
    ] },
  ],
  langgraph: [
    { title: "LangGraph hands-on", level: "Intermediate", summary: "Building stateful and multi-agent systems step by step.", topics: [
      ["LangGraph tutorial for beginners", ["State, nodes and edges", "Conditional edges", "Running and streaming a graph"]],
      ["LangGraph multi-agent systems", ["Supervisor and network patterns", "Handing off between agents", "Shared and private state"]],
      ["LangGraph human in the loop", ["Interrupting a graph for approval", "Editing state before resuming", "Checkpoints that make it possible"]],
      ["LangGraph memory and persistence", ["Short-term memory with checkpointers", "Long-term memory with stores", "Threads and resuming conversations"]],
    ] },
  ],
  langsmith: [
    { title: "LangSmith in practice", level: "Intermediate", summary: "Seeing inside an LLM app and proving it works.", topics: [
      ["LangSmith tutorial", ["Setting up tracing", "Reading a trace", "Projects and runs"]],
      ["LangSmith evaluation", ["Datasets and examples", "Evaluators and LLM-as-judge", "Comparing experiments"]],
      ["LangSmith prompt engineering playground", ["The prompt hub", "Testing prompts in the playground", "Versioning prompts"]],
    ] },
  ],
  langflow: [
    { title: "Langflow hands-on", level: "Beginner", summary: "Building agents and RAG flows visually.", topics: [
      ["Langflow tutorial for beginners", ["The canvas and components", "Your first flow", "Running and sharing it"]],
      ["Langflow RAG", ["Ingesting documents", "A vector store in a flow", "A chat over your documents"]],
      ["Langflow AI agents", ["Agent components and tools", "Connecting MCP servers", "Calling a flow from your app"]],
    ] },
  ],
  n8n: [
    { title: "n8n hands-on", level: "Intermediate", summary: "Real automations and AI agents, built end to end.", topics: [
      ["n8n tutorial for beginners", ["Triggers, nodes and executions", "Working with data between nodes", "Your first useful workflow"]],
      ["n8n AI agent tutorial", ["The AI Agent node", "Tools, memory and models", "An agent that acts on your apps"]],
      ["n8n RAG chatbot", ["Loading documents into a vector store", "Retrieval in a workflow", "A chatbot over your data"]],
      ["n8n webhooks and APIs", ["Webhook triggers", "The HTTP Request node", "Authentication and pagination"]],
      ["n8n self hosting", ["Running n8n with Docker", "Hosting on a VPS", "Updates, backups and security"]],
      ["n8n MCP server", ["What MCP adds to n8n", "The MCP Server Trigger", "Using n8n tools from an AI client"]],
    ] },
  ],
  aws: [
    { title: "The most-used AWS services", level: "Intermediate", summary: "The services beyond compute and storage that most AWS applications rely on.", topics: [
      ["AWS Cloud Practitioner full course", ["The global infrastructure", "Core services at a glance", "Pricing, support and the shared responsibility model"]],
      ["AWS DynamoDB tutorial", ["Tables, items and keys", "Queries and indexes", "Capacity modes"]],
      ["AWS API Gateway", ["REST and HTTP APIs", "Integrating with Lambda", "Auth, throttling and stages"]],
      ["AWS SQS and SNS", ["Queues and topics", "Fan-out with SNS and SQS", "Dead-letter queues"]],
      ["Amazon Cognito authentication", ["User pools and identity pools", "Sign-up and sign-in", "Securing an API"]],
      ["Amazon Bedrock tutorial", ["Foundation models on AWS", "Calling a model from code", "Knowledge bases and agents"]],
      ["AWS Step Functions", ["State machines", "Orchestrating Lambda functions", "Error handling and retries"]],
    ] },
  ],
  sysdesign: [
    { title: "Distributed systems in depth", level: "Advanced", summary: "The ideas behind systems that stay correct and available across many machines.", topics: [
      ["Database sharding and partitioning", ["Range, hash and directory sharding", "Choosing a shard key", "Resharding and hot spots"]],
      ["Database replication explained", ["Leader-follower and multi-leader", "Synchronous versus asynchronous", "Replication lag"]],
      ["Distributed consensus: Raft and Paxos", ["Why consensus is hard", "Leader election and log replication", "Where consensus is used"]],
      ["Event-driven architecture", ["Events, producers and consumers", "Event sourcing and CQRS", "Trade-offs"]],
      ["Microservices design patterns", ["Saga and outbox", "Circuit breaker and retries", "Service discovery"]],
      ["Observability: logs, metrics and traces", ["The three pillars", "Distributed tracing", "SLIs, SLOs and alerts"]],
    ] },
    { title: "More case studies", level: "Advanced", summary: "Classic design questions, worked through end to end.", topics: [
      ["Design a news feed like Twitter", ["Fan-out on write versus read", "Timeline storage and caching", "Ranking and celebrities"]],
      ["Design a ride-hailing app like Uber", ["Location updates at scale", "Matching riders and drivers", "Surge pricing and ETAs"]],
      ["Design a video streaming service like Netflix", ["Encoding and adaptive bitrate", "Open Connect and CDNs", "Recommendations and personalisation"]],
      ["Design a notification system", ["Push, email and SMS channels", "Queues and retries", "User preferences and rate limits"]],
      ["Design a collaborative editor like Google Docs", ["Operational transforms and CRDTs", "Real-time sync", "Conflict resolution"]],
      ["Design a distributed cache", ["Partitioning and replication", "Eviction policies", "Consistency with the database"]],
    ] },
  ],
} as const satisfies Record<string, readonly ExamChapter[]>;

export type ExtraTopicPlaylistId = keyof typeof EXTRA_TOPIC_CHAPTERS;

/** "<playlist>#<topic index>" for every topic here, in order: the search plan and the generated video map use the same keys. */
export const techTopicKeys = () => [
  ...(TECH_TOPIC_PLAYLISTS as readonly TopicPlaylist[]).flatMap(p => p.chapters.flatMap(c => [...c.topics]).map((_, i) => `${p.id}#${i}`)),
  ...Object.entries(EXTRA_TOPIC_CHAPTERS).flatMap(([id, chapters]) => (chapters as readonly ExamChapter[]).flatMap(c => [...c.topics]).map((_, i) => `${id}#${i}`)),
];
