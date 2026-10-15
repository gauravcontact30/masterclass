/**
 * The real problems a technology removes, named by the industry that has them.
 *
 * A use case says what a developer reaches for something to do. This says who
 * pays for that to be done well: the sector, the job inside it, and the loss
 * that is taken today when the job is done by hand. A card shows these so a
 * reader can see why a topic is worth learning before they open it.
 *
 * Written per technology, and per category where an area of a technology solves
 * a visibly different problem. A line that would be true of anything — "used
 * widely in finance" — is not an industry problem and does not belong here.
 * Each one names the work and what goes wrong without it.
 */
export type IndustryProblem = {
  /** The sector, as someone working in it would name it. */
  industry: string;
  /** The problem that sector has, and what this removes. One sentence. */
  problem: string;
};

export type TechnologyIndustries = {
  /** Handbook titles and catalogue names these belong to, matched exactly. */
  technologies: string[];
  industries: IndustryProblem[];
  /** Preferred over the technology's own when the topic's category matches. */
  categoryIndustries?: Record<string, IndustryProblem[]>;
};

export const INDUSTRY_IMPACT: TechnologyIndustries[] = [
  // ---- Web UI ----
  {
    technologies: ["React 19+ — Components, Actions & Server UI", "React 19+ Hooks — State, Effects & Actions"],
    industries: [
      { industry: "Retail & e-commerce", problem: "A basket, a price and a stock count have to agree on screen while three people buy the last item; component state keeps one source of truth instead of DOM updates that drift." },
      { industry: "Banking & fintech", problem: "Account dashboards mix slow ledger reads with instant balances, and boundaries let the fast half render while the slow half is still loading rather than blanking the page." },
      { industry: "Healthcare", problem: "Clinical forms are long, conditional and audited, so declarative state makes which fields appear a consequence of the record rather than a pile of hand-written show and hide rules." },
    ],
  },
  {
    technologies: ["Next.js 16+ — Routing, Rendering & Caching", "Next.js 16+ APIs — Directives, Functions, Hooks & Config", "Next.js 16+ Hooks — App Router Navigation"],
    industries: [
      { industry: "Media & publishing", problem: "Article pages must rank and open in under a second on a phone, which static rendering with revalidation serves from the edge without a nightly rebuild of the whole site." },
      { industry: "Retail & e-commerce", problem: "Ten thousand product URLs share one route file, so a catalogue change is a data change rather than a deploy of ten thousand pages." },
      { industry: "SaaS & B2B products", problem: "Marketing pages and a signed-in dashboard live in one codebase, so the team is not running a static site and an app separately with two deploy pipelines." },
    ],
  },
  {
    technologies: ["JavaScript (ECMAScript 2026) — Language & Runtime"],
    industries: [
      { industry: "Every sector with a browser product", problem: "The language is the one thing a team cannot swap out, and misreading async, coercion or scoping is what puts bugs into production that no type checker would have caught." },
      { industry: "Advertising & analytics", problem: "Tracking scripts run inside someone else's page, where a thrown error or a leaked global breaks the host site rather than only the script." },
      { industry: "Embedded & IoT dashboards", problem: "Device interfaces run on weak hardware, so the cost of a copy, a closure or a regular expression is felt directly and has to be reasoned about in the language itself." },
    ],
  },
  {
    technologies: ["TypeScript 7 — Types, Compiler & Migration"],
    industries: [
      { industry: "Banking & fintech", problem: "A money amount, a currency and an account id are all strings at runtime, and types stop the line that mixes them up from ever being written." },
      { industry: "Healthcare", problem: "Patient records change shape across versions, and a compiler that fails the build is cheaper than a field silently read as undefined in a clinical report." },
      { industry: "Large engineering teams", problem: "A rename touches four hundred files across thirty packages, which is an afternoon with types and a quarter of incident reports without them." },
    ],
  },

  // ---- Client state ----
  {
    technologies: ["Zustand"],
    industries: [
      { industry: "Design & creative tools", problem: "An editor's selection, tool and history are read by dozens of panels, and a small store keeps them in one place without a context re-rendering the whole canvas." },
      { industry: "Logistics & operations", problem: "Live dispatch boards update many times a second, so per-slice subscriptions mean one moving vehicle repaints one row rather than the whole screen." },
      { industry: "Gaming & interactive media", problem: "Game state has to be readable outside React, in a loop or a worker, which a store outside the tree allows and component state does not." },
    ],
  },
  {
    technologies: ["Redux", "Redux Toolkit"],
    industries: [
      { industry: "Banking & fintech", problem: "Trading and payment screens need an auditable trail of what changed and why, and actions in a log make a bug reproducible from the user's own session." },
      { industry: "Insurance", problem: "Multi-step claims flows span hours and devices, so a serializable store can be persisted and rehydrated exactly rather than rebuilt from scattered component state." },
      { industry: "Enterprise software", problem: "Large teams need one agreed way to change shared state, or a feature team invents a third pattern that the next team has to learn." },
    ],
  },
  {
    technologies: ["TanStack Query"],
    industries: [
      { industry: "Healthcare", problem: "Several clinicians open the same chart at once, and cache invalidation after a write is what stops one of them acting on a stale record." },
      { industry: "Logistics & operations", problem: "Tracking views poll constantly, so request deduplication plus background refetch cuts the traffic a fleet dashboard generates without letting it go stale." },
      { industry: "Retail & e-commerce", problem: "Stock and price must be fresh at checkout but cheap to show on a listing page, which is a cache-time decision rather than a new endpoint." },
    ],
  },
  {
    technologies: ["TanStack Form", "Conform - Validation libraries"],
    industries: [
      { industry: "Insurance & lending", problem: "Application forms run to a hundred conditional fields, and schema-driven validation keeps the rules in one place instead of duplicated in the browser and on the server." },
      { industry: "Government & public services", problem: "Statutory forms must work without JavaScript and still validate identically, which progressive enhancement gives and a client-only form does not." },
      { industry: "Healthcare", problem: "Intake forms are partly filled, saved and resumed, so field state has to survive a reload rather than being lost with the component." },
    ],
  },
  {
    technologies: ["TanStack Table", "TanStack Virtual"],
    industries: [
      { industry: "Banking & fintech", problem: "Back-office tools show a hundred thousand transactions with sorting, grouping and column choice, and virtualization renders the visible rows rather than freezing the tab." },
      { industry: "Manufacturing & supply chain", problem: "Inventory grids are the whole product for warehouse staff, so per-column filters replace the spreadsheet exports that are out of date the moment they are sent." },
      { industry: "Healthcare", problem: "Lab result tables need grouped and aggregated views per patient without shipping a full spreadsheet engine to the browser." },
    ],
  },
  {
    technologies: ["TanStack Router", "TanStack Start"],
    industries: [
      { industry: "SaaS & B2B products", problem: "Filters, tabs and pagination belong in the URL so a colleague can be sent the exact view, which typed search parameters make safe to refactor." },
      { industry: "Travel & booking", problem: "Search state is the product — dates, passengers, filters — and losing it to a refresh or a back button is a lost booking." },
      { industry: "Internal tooling", problem: "Route-level loaders fetch before the screen paints, so an operations tool does not show an empty shell and three spinners on every navigation." },
    ],
  },

  // ---- Data layer ----
  {
    technologies: ["Prisma", "Drizzle ORM"],
    industries: [
      { industry: "Banking & fintech", problem: "A transfer must debit one row and credit another or neither, and transactions in the query layer make that guarantee part of ordinary application code." },
      { industry: "Healthcare", problem: "Schema changes to patient data must be reviewable and reversible, which versioned migrations give and a hand-edited production database does not." },
      { industry: "Retail & e-commerce", problem: "Order, line item and inventory queries are written once with types that match the tables, so a renamed column fails the build instead of the checkout." },
    ],
  },
  {
    technologies: ["Neon"],
    industries: [
      { industry: "SaaS & B2B products", problem: "Every pull request wants a real database with real data, and branching gives one in seconds instead of a shared staging database everyone breaks." },
      { industry: "Startups & early products", problem: "Traffic is spiky and mostly zero, so scale-to-zero Postgres removes the cost of an idle instance kept alive for a demo." },
      { industry: "Agencies & consultancies", problem: "Dozens of client projects each need an isolated database without a dozen servers to patch and back up." },
    ],
  },
  {
    technologies: ["Redis caching solutions", "Upstash"],
    industries: [
      { industry: "Retail & e-commerce", problem: "A flash sale sends the same product query a thousand times a second, and a cache in front of it is the difference between a slow page and a dead database." },
      { industry: "Gaming & interactive media", problem: "Leaderboards and session state change constantly and matter for seconds, which is work a durable database should never be doing." },
      { industry: "Media & streaming", problem: "Rate limiting needs a counter shared atomically across every server, which is one Redis operation and a hard distributed problem anywhere else." },
    ],
  },
  {
    technologies: ["GraphQL — Schema, Servers, Clients & Tooling"],
    industries: [
      { industry: "Media & publishing", problem: "A phone app, a TV app and a website want different slices of the same article, which one schema serves without three bespoke endpoints per screen." },
      { industry: "Retail & e-commerce", problem: "A product page joins catalogue, pricing, reviews and stock owned by four teams, and federation lets each team own its part of one graph." },
      { industry: "Telecoms & enterprise", problem: "Mobile clients on poor networks pay for every byte, so asking for exactly the fields shown is a measurable cost saving rather than a preference." },
    ],
  },
  {
    technologies: ["Zod validation libraries"],
    industries: [
      { industry: "Banking & fintech", problem: "Money, dates and account identifiers arrive as untrusted strings from forms and webhooks, and parsing at the boundary is what keeps a bad value out of the ledger." },
      { industry: "Healthcare", problem: "Records exchanged between systems must be rejected loudly when a required field is missing rather than stored half complete." },
      { industry: "SaaS & B2B products", problem: "One schema validates the form, the API route and the database write, so the three cannot disagree about what a valid record is." },
    ],
  },
  {
    technologies: ["T3 environment"],
    industries: [
      { industry: "Every sector running a deployed app", problem: "A missing or misspelled environment variable fails at build time instead of at 3am when the first request reaches the payment provider." },
      { industry: "Banking & fintech", problem: "Server secrets must never reach the browser bundle, and a typed split between server and client variables makes that a compile error." },
      { industry: "Agencies & consultancies", problem: "A new developer on a client project gets a precise list of what to set rather than discovering it one crash at a time." },
    ],
  },

  // ---- Identity, money, safety ----
  {
    technologies: ["Authentication with Auth.js & Kinde Auth", "BetterAuth", "Clerk user management"],
    industries: [
      { industry: "Healthcare", problem: "Access to a record has to be provable per user and per role, and session handling that is wrong once is a reportable breach rather than a bug." },
      { industry: "SaaS & B2B products", problem: "Enterprise buyers require organizations, invitations and single sign-on before they will sign, which is months of work to build and a configuration step to adopt." },
      { industry: "Education", problem: "Students, teachers and parents see different halves of the same system, so role and organization membership decide the interface rather than a flag on a user row." },
    ],
  },
  {
    technologies: ["Payment gateway integration"],
    industries: [
      { industry: "Retail & e-commerce", problem: "A customer charged twice by a retried request is a refund, a chargeback and a lost customer, and idempotency keys are what make the retry safe." },
      { industry: "Subscription software", problem: "Renewals, upgrades and failed cards are a lifecycle rather than an event, so the webhook stream is the only account of it the business can trust." },
      { industry: "Marketplaces", problem: "Money moves between three parties with fees and refunds in between, so reconciliation has to be designed rather than discovered at the first dispute." },
    ],
  },
  {
    technologies: ["Arcjet"],
    industries: [
      { industry: "SaaS & B2B products", problem: "Signup forms are farmed by bots for free trials and credits, which costs real money per fake account until the rules sit next to the route itself." },
      { industry: "Media & publishing", problem: "Scrapers take the content and the bandwidth, and blocking them at the application layer catches what a network rule cannot see." },
      { industry: "Banking & fintech", problem: "Credential-stuffing bursts look like ordinary traffic until per-user rate limits and bot signals are applied to the login endpoint." },
    ],
  },

  // ---- Platform, infrastructure, delivery ----
  {
    technologies: ["Docker"],
    industries: [
      { industry: "Every sector shipping software", problem: "The machine ships with the code, which is what turns an onboarding week into an onboarding hour and ends environment-only failures." },
      { industry: "Scientific & research computing", problem: "A result has to be reproducible years later, which a pinned image gives and a README of install steps does not." },
      { industry: "Financial services", problem: "Audit requires knowing exactly what ran in production, and an image digest is a far stronger answer than a deploy log." },
    ],
  },
  {
    technologies: ["Kubernetes"],
    industries: [
      { industry: "Media & streaming", problem: "Traffic multiplies during a live event and falls back an hour later, and declarative scaling handles both without anyone at a console at midnight." },
      { industry: "Retail & e-commerce", problem: "A failing container is replaced before a customer notices, which turns a night-time page into a morning log entry." },
      { industry: "Regulated enterprise", problem: "Workloads must be isolated by namespace, policy and secret rather than by trusting each team's deployment script." },
    ],
  },
  {
    technologies: ["Terraform"],
    industries: [
      { industry: "Banking & fintech", problem: "Every infrastructure change must be reviewed, approved and reversible, which a plan in a pull request gives and a console click never can." },
      { industry: "Healthcare", problem: "The same environment has to exist identically for development, staging and production, or a compliance finding cannot be tested before release." },
      { industry: "Enterprise IT", problem: "Drift between what was declared and what actually exists is found by a plan rather than by an outage." },
    ],
  },
  {
    technologies: ["GitHub Actions", "DevOps with AWS CI/CD"],
    industries: [
      { industry: "SaaS & B2B products", problem: "Shipping several times a day is only safe when tests, builds and deploys run the same way every time without a person remembering the order." },
      { industry: "Regulated industries", problem: "Who deployed what, when and with which approval has to be a record, and a pipeline produces one as a side effect of doing the work." },
      { industry: "Agencies & consultancies", problem: "Reusable workflows mean thirty client repositories share one release process instead of thirty scripts that have each rotted differently." },
    ],
  },
  {
    technologies: ["Node.js — Runtime, APIs, Streams & Operations", "Node.js Packages — Modules, Libraries & Middleware"],
    industries: [
      { industry: "Media & publishing", problem: "Large uploads and exports are streamed rather than buffered, so a two-gigabyte video does not take the process down with it." },
      { industry: "Retail & e-commerce", problem: "One runtime serves the storefront and the back-office jobs, so a small team is not maintaining two language stacks." },
      { industry: "Logistics & operations", problem: "Long-lived socket connections to devices and vehicles are what an event loop is for, and what a thread-per-request server struggles with." },
    ],
  },
  {
    technologies: ["Nest.js — APIs, Architecture, Security & Testing", "Nest.js Packages — Decorators, Providers & Modules"],
    industries: [
      { industry: "Banking & fintech", problem: "Validation, authorization and audit logging are cross-cutting requirements, and pipes, guards and interceptors put them in one place rather than at the top of every handler." },
      { industry: "Healthcare", problem: "A regulated service is picked up by a different team years later, which explicit modules and injected dependencies make possible to reason about." },
      { industry: "Enterprise software", problem: "Dozens of developers need one agreed structure, or every service ends up with its own idea of where the business logic lives." },
    ],
  },
  {
    technologies: ["Python Packages — Standard Library & Ecosystem", "uv package manager", "Python"],
    industries: [
      { industry: "Data science & analytics", problem: "A notebook that runs today must run on a colleague's machine tomorrow, which locked and resolved dependencies give and a list of installs does not." },
      { industry: "Scientific & research computing", problem: "Numerical work depends on exact library versions, so an unpinned upgrade that silently changes a result is a retracted paper rather than a bug." },
      { industry: "Automation & back office", problem: "File, date and text handling is most of the work in an internal script, and the standard library removes the dependency that would otherwise need maintaining." },
    ],
  },
  {
    technologies: ["Webhook", "Inngest services", "n8n"],
    industries: [
      { industry: "Retail & e-commerce", problem: "Order, payment and shipping events arrive out of order and more than once, so idempotent retried handling is what keeps the order state correct." },
      { industry: "SaaS & B2B products", problem: "Onboarding, trial reminders and dunning are multi-day sequences, which a durable workflow survives and a cron job plus a database flag does not." },
      { industry: "Operations & back office", problem: "Work that lives between five vendor systems is automated without a team writing and hosting glue services for every pair." },
    ],
  },
  {
    technologies: ["System Design"],
    industries: [
      { industry: "Banking & fintech", problem: "Consistency, latency and cost pull against each other, and the trade-off has to be made deliberately before it is made accidentally by a default." },
      { industry: "Media & streaming", problem: "Read traffic outnumbers writes by orders of magnitude, so caching and fan-out decide whether a launch survives its own announcement." },
      { industry: "Any hiring team", problem: "Senior interviews are conducted in these terms, so the vocabulary is what turns real experience into an offer." },
    ],
  },
  {
    technologies: ["Modern Full-Stack Technologies — Tools, Data & Infrastructure"],
    industries: [
      { industry: "Startups & early products", problem: "A small team picks auth, payments, data and hosting once and lives with it, and knowing the field is what keeps that from becoming a rewrite in a year." },
      { industry: "Agencies & consultancies", problem: "Each client arrives with a different stack, so recognising what every tool is for matters more than mastery of any single one." },
      { industry: "Enterprise modernisation", problem: "Replacing one part of a legacy system means knowing which modern piece fits the seam, rather than adopting a whole platform at once." },
    ],
  },

  // ---- Testing ----
  {
    technologies: ["Jest — Unit Testing, Mocks & Coverage", "Vitest — Fast Unit Testing & Mocks"],
    industries: [
      { industry: "Banking & fintech", problem: "Interest, fees and rounding are rules nobody can verify by clicking, so the tests are the specification the business signs off." },
      { industry: "Healthcare", problem: "Dosage and eligibility logic must be proved against known cases before release, and a test suite is the only evidence that survives a refactor." },
      { industry: "Any team with a release cadence", problem: "Fast unit tests are what let a change ship the same day instead of waiting for a manual regression pass." },
    ],
  },
  {
    technologies: ["React Testing Library — User-Centered UI Tests"],
    industries: [
      { industry: "Government & public services", problem: "Accessibility is a legal requirement, and querying by role and label makes a test fail the moment a screen stops being usable with a screen reader." },
      { industry: "Healthcare", problem: "A clinician's workflow is the thing that must not break, which tests written against what is on screen protect and implementation tests do not." },
      { industry: "SaaS & B2B products", problem: "Interface refactors are constant, and tests tied to behaviour rather than markup are what make them cheap instead of a day of red." },
    ],
  },
  {
    technologies: ["Playwright Automation — Browser Testing & Debugging", "Playwright — API, Locators, Fixtures & Tooling", "Cypress — End-to-End Testing & Network Control"],
    industries: [
      { industry: "Retail & e-commerce", problem: "Checkout is the one flow that must never break, and an end-to-end run before every deploy is cheaper than one hour of failed orders." },
      { industry: "Banking & fintech", problem: "Regulated flows must be evidenced across browsers, and a trace with video and network log is an audit artefact as well as a debugging aid." },
      { industry: "Travel & booking", problem: "Third-party payment and inventory steps are mocked at the network layer, so a nightly suite does not book a real seat every time it runs." },
    ],
  },

  // ---- AI ----
  {
    technologies: ["LangChain", "Agentic AI", "AI terms"],
    industries: [
      { industry: "Customer support", problem: "Answers must come from the company's own documentation rather than the model's memory, which retrieval supplies and a bare prompt cannot." },
      { industry: "Legal & professional services", problem: "A cited passage is the deliverable, so grounding and source attribution are the product rather than a nicety." },
      { industry: "Healthcare & regulated sectors", problem: "A model that may answer must also be able to refuse, and guardrails are where that boundary is written down and tested." },
    ],
  },
  {
    technologies: ["LangGraph"],
    industries: [
      { industry: "Financial operations", problem: "An agent that moves money needs a human approval step it cannot skip, which an interrupt in a durable graph enforces." },
      { industry: "Insurance", problem: "Claims triage runs for hours across several tools, so state has to survive a restart rather than living in one process's memory." },
      { industry: "Customer support", problem: "Escalation is a branch with its own state rather than a longer prompt, and modelling it explicitly is what makes a handoff auditable." },
    ],
  },
  {
    technologies: ["LangSmith"],
    industries: [
      { industry: "Any team shipping an AI feature", problem: "A prompt change that helps ten cases and breaks thirty is invisible without a dataset and a scored run against it." },
      { industry: "Customer support", problem: "Quality complaints have to be traced to the exact call, retrieval and token spend that produced the bad answer." },
      { industry: "Regulated industries", problem: "Model behaviour must be evidenced over time, and trace plus evaluation history is the record an auditor asks for." },
    ],
  },
  {
    technologies: ["LangFlow"],
    industries: [
      { industry: "Internal tools and HR", problem: "A policy assistant over company documents is needed in days, and a visual RAG flow served as an API removes the rewrite between prototype and integration." },
      { industry: "Platform engineering", problem: "Teams want their internal workflows callable from AI assistants, and publishing flows as MCP tools avoids writing a separate server for each." },
      { industry: "Product teams", problem: "Domain experts must tune prompts and retrieval settings themselves, which a shared canvas and Playground allow without an engineering ticket per change." },
    ],
  },

  // ---- Cloud ----
  {
    technologies: ["AWS"],
    industries: [
      { industry: "Retail & e-commerce", problem: "Peak days need ten times the capacity for a few hours, which is a scaling policy rather than a datacentre purchase." },
      { industry: "Healthcare & life sciences", problem: "Data residency, encryption and access logging are compliance requirements that arrive as managed service settings instead of a project." },
      { industry: "Startups & early products", problem: "Storage, queues, identity and compute are available on day one, so an idea is tested before any hardware decision is made." },
    ],
  },
  {
    technologies: ["Git — Commands, Branching, Rebase & History"],
    industries: [
      { industry: "Every sector that writes software", problem: "Two people editing one file is the default situation, and without version control one of the two edits is silently lost with no record that it existed." },
      { industry: "Banking & regulated industries", problem: "An auditor asks who changed a control, when and who approved it, and a signed commit history answers in seconds what a ticket system answers badly." },
      { industry: "Healthcare & safety-critical systems", problem: "A regression has to be traced to the exact change that caused it, which `git bisect` does in ten tests over a thousand commits and code review does not do at all." },
    ],
  },
];
