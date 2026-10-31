/*
 * Editorial star ratings for Tech Buzz stories, written on 31 Oct 2026 by Claude (an AI) reviewing each story as a senior
 * full-stack engineer would: technical accuracy, depth, whether the code is correct and current, and how much a working
 * developer takes away. 1 to 5 in half stars. Kept out of lib/tech-buzz-public.ts (which client components import) so
 * the whole table never ships to the browser; server pages attach one review per card with withReview(). The labels
 * shown with it live in components/tech-buzz-review-stars.tsx.
 * Stories published after that date have no entry until someone reviews them, and show no rating meanwhile.
 * On 31 Oct 2026 the user had every story rated 2.5 or below removed (17 early feature stories); meetsReviewBar keeps
 * any later one off the public pages.
 */
import "server-only";

export type ExpertReview = { stars: number; verdict: string };

const REVIEWS: Record<string, ExpertReview> = {
  // Early feature stories: one short section each.
  "ebpf-kernel-telemetry-cilium-service-mesh": { stars: 3, verdict: "Accurate on sockmap redirection and TLS uprobes; the strongest early story, though its latency numbers are unsourced." },
  "deepseek-v3-moe-architecture-mla-training": { stars: 3, verdict: "MLA's latent KV compression is explained accurately with a fair PyTorch sketch; routing and FP8 get no space." },
  "system-design-distributed-event-driven-microservices": { stars: 3, verdict: "A correct transactional outbox table and rationale; locks and cache topologies from the title are missing." },

  // Technology explainers: four sections and one worked example each.
  "langchain-in-production-agents-tools-and-structured-output-without-the-magic": { stars: 4, verdict: "Demystifies the agent loop with current createAgent code and tool-design habits that genuinely improve agents." },
  "langgraph-explained-stateful-agent-workflows-you-can-pause-resume-and-test": { stars: 4, verdict: "State, reducers and checkpointers explained cleanly, with a draft-review graph you can run." },
  "langflow-prototyping-ai-workflows-visually-then-shipping-them-as-an-api": { stars: 3.5, verdict: "Sensible prototype-to-API advice and a correct run call; light on versioning and testing flows." },
  "langsmith-for-real-teams-tracing-datasets-and-evals-that-catch-regressions": { stars: 4, verdict: "The trace-to-dataset habit is exactly what teams skip; correct traceable usage." },
  "openrouter-one-api-for-hundreds-of-models-fallbacks-and-cost-control": { stars: 4, verdict: "Clear on fallbacks, pinning models for evals and data-policy risk; a practical request example." },
  "vercel-ai-gateway-with-the-ai-sdk-model-strings-fallbacks-and-observability": { stars: 4, verdict: "Accurate model-string routing and a current streaming route handler; good operational advice." },
  "n8n-for-developers-webhooks-code-nodes-and-ai-agents-in-one-workflow": { stars: 4, verdict: "Explaining n8n's item model is the insight most guides miss; the Code node example is correct." },
  "next-js-16-caching-finally-makes-sense-cache-components-use-cache-and-tags": { stars: 4.5, verdict: "An accurate mental model of Cache Components, cacheTag and updateTag, with the request-API rule spelled out." },
  "react-19-actions-forms-pending-states-and-optimistic-ui-without-boilerplate": { stars: 4, verdict: "Covers useActionState, useOptimistic and use correctly with a realistic optimistic comment form." },
  "modern-angular-signals-standalone-components-and-the-new-control-flow": { stars: 4, verdict: "A fair, current picture of signals, control flow and when RxJS still belongs." },
  "vue-3-composition-api-composables-reactivity-pitfalls-and-pinia": { stars: 4, verdict: "The reactivity rules (destructuring reactive, toRefs) are the right ones; a clean abortable fetch composable." },
  "tanstack-query-server-state-is-not-client-state": { stars: 4.5, verdict: "staleTime versus gcTime and key factories explained crisply; this mental model prevents real bugs." },
  "tanstack-start-type-safe-full-stack-react-with-server-functions": { stars: 3.5, verdict: "Good overview of server functions and loaders; the API moves fast, so check names against current docs." },
  "zustand-small-global-state-selectors-and-avoiding-re-renders": { stars: 4, verdict: "Selectors and useShallow framed as the performance model, which is exactly right." },
  "redux-toolkit-and-rtk-query-modern-redux-without-the-boilerplate": { stars: 4, verdict: "Modern RTK with tag invalidation and honest guidance on when Redux is still the right choice." },
  "the-javascript-event-loop-finally-clear-tasks-microtasks-and-rendering": { stars: 4.5, verdict: "Correct queue ordering with a puzzle and await walkthrough that teaches rather than memorises." },
  "modern-node-js-without-extra-dependencies-test-runner-watch-mode-fetch-and": { stars: 4, verdict: "Useful inventory of built-ins (node:test, --env-file, AbortSignal.timeout) with correct caveats on TypeScript." },
  "express-5-upgrade-guide-async-errors-new-path-syntax-and-safer-defaults": { stars: 4.5, verdict: "Names the real breaking changes (async errors, path-to-regexp wildcards) that bite during upgrades." },
  "nestjs-architecture-modules-providers-guards-and-pipes-explained": { stars: 4, verdict: "The request pipeline order is correct and the pitfalls (request scope, circular imports) are real." },
  "graphql-in-production-schema-design-n-1-queries-and-dataloader": { stars: 4, verdict: "N+1 and per-request DataLoader explained properly, plus depth limits and persisted queries." },
  "modern-python-for-backend-developers-type-hints-dataclasses-and-asyncio": { stars: 4, verdict: "TaskGroup's cancellation semantics are the key point and it makes it; solid habits list." },
  "redis-patterns-every-backend-engineer-should-know-caching-locks-and-rate-limits": { stars: 4, verdict: "Cache-aside, SET NX locks and TTL discipline with failure modes, which is what matters in production." },
  "salesforce-development-basics-apex-triggers-soql-and-governor-limits": { stars: 4, verdict: "Bulkification taught correctly with a single-query, single-DML trigger." },
  "docker-images-that-are-small-fast-to-build-and-safe-to-run": { stars: 4, verdict: "Layer ordering, multi-stage builds and a non-root runtime: the right three habits." },
  "aws-essentials-for-application-developers-iam-s3-presigned-urls-and-lambda": { stars: 4, verdict: "Least privilege, presigned uploads and billing alarms; focused and correct." },
  "git-beyond-commit-and-push-rebase-bisect-reflog-and-worktrees": { stars: 4, verdict: "bisect run and reflog rescues are high-value; sensible team conventions." },
  "github-actions-ci-that-is-fast-and-secure-caching-matrices-and-least-privilege": { stars: 4, verdict: "Strong security guidance, though its own example pins actions by tag rather than the SHA it recommends." },
  "playwright-tests-that-do-not-flake-locators-web-first-assertions-and-traces": { stars: 4, verdict: "Role locators, web-first assertions and traces: the correct cure for flaky suites." },
  "cypress-best-practices-retry-ability-cy-intercept-and-stable-selectors": { stars: 4, verdict: "Explains the command queue properly and uses intercept aliases instead of fixed waits." },
  "jest-mocks-without-tears-jest-fn-jest-mock-and-fake-timers": { stars: 4, verdict: "Mock at boundaries, with a correct fake-timer retry test; good suite hygiene." },
  "vitest-fast-unit-tests-that-share-your-vite-config": { stars: 4, verdict: "Accurate vi.mock hoisting and vi.mocked typing notes, plus a realistic migration checklist." },
  "react-testing-library-test-what-users-do-not-how-components-work": { stars: 4, verdict: "Query priorities and userEvent.setup used correctly; the common-mistakes list is on point." },
  "system-design-interviews-a-repeatable-framework-and-a-rate-limiter-walkthrough": { stars: 4, verdict: "A repeatable framework and a correct token bucket; good interview preparation." },
  "eight-dsa-patterns-that-solve-most-coding-interview-problems": { stars: 4, verdict: "Pattern signal words plus a correct O(n) sliding window; practical for interview practice." },
  "object-oriented-design-that-ages-well-encapsulation-polymorphism-and-solid": { stars: 3.5, verdict: "Correct and readable, but mostly textbook SOLID; the strategy example is the useful part." },
  "rag-that-actually-works-chunking-retrieval-and-evaluation-in-practice": { stars: 4.5, verdict: "Retrieval-first diagnosis, hybrid search with RRF and evaluation before tuning: production-grade advice." },
  "build-your-first-mcp-server-in-typescript-tools-resources-and-safe-defaults": { stars: 4, verdict: "Clear MCP concepts and safe defaults; the snippet uses the older server.tool helper." },
  "prompt-engineering-for-production-structured-output-examples-and-guard-rails": { stars: 3.5, verdict: "Prompts-as-code is the right stance, but generateObject is deprecated in current AI SDK releases." },
  "core-web-vitals-in-2026-fixing-lcp-inp-and-cls-on-real-pages": { stars: 4, verdict: "Correct thresholds and causes for LCP, INP and CLS, with a sensible Next.js fix list." },
  "accessible-react-components-keyboard-focus-and-aria-done-right": { stars: 4, verdict: "Native elements first and a correct dialog element pattern; a manual testing checklist." },
  "modern-css-layout-container-queries-has-and-subgrid-without-hacks": { stars: 4, verdict: "Container queries and :has() shown with a real adaptive card; subgrid gets less space." },
  "postgresql-indexing-for-developers-b-tree-gin-and-reading-explain": { stars: 4.5, verdict: "Reading EXPLAIN ANALYZE plus a partial composite index matched to the query: exactly how to do it." },
  "rest-api-design-that-lasts-resources-pagination-errors-and-versioning": { stars: 4, verdict: "Cursor pagination, one error shape and additive change rules; durable conventions." },
  "authentication-done-right-sessions-jwts-oauth-and-passkeys-explained": { stars: 4.5, verdict: "Sound sessions-versus-JWT trade-offs and a hashed session token; passkeys get only a mention." },
  "kubernetes-for-application-developers-pods-deployments-services-and-probes": { stars: 4, verdict: "The four core objects plus probes and requests; the liveness-probe pitfall is well chosen." },
  "observability-for-busy-teams-logs-metrics-and-traces-with-opentelemetry": { stars: 4, verdict: "Golden signals, trace ids in logs and symptom-based alerting with a correct OTel setup." },
  "the-testing-trophy-in-2026-what-to-unit-test-integrate-and-run-end-to-end": { stars: 4, verdict: "A pragmatic test split with an MSW integration test at the network boundary." },
  "visual-regression-testing-with-playwright-catch-ui-breaks-before-users-do": { stars: 4, verdict: "Stable screenshots done right: CI baselines, masks and disabled animations." },
  "graph-algorithms-explained-bfs-dfs-dijkstra-and-topological-sort": { stars: 4, verdict: "Algorithm choice by edge type is the right framing; the grid BFS is correct." },
  "concurrency-basics-every-developer-needs-threads-async-locks-and-races": { stars: 4.5, verdict: "The atomic conditional UPDATE fixing a lost update is the best single example on the topic." },
  "caching-strategies-at-every-layer-browser-cdn-application-and-database": { stars: 4, verdict: "Correct Cache-Control recipes per layer and invalidation designed alongside the cache." },
  "event-driven-architecture-queues-pub-sub-retries-and-idempotency": { stars: 4, verdict: "Outbox plus idempotent consumer, DLQs and backoff: the essentials, done correctly." },
  "typescript-generics-and-utility-types-write-types-once-reuse-everywhere": { stars: 4, verdict: "Derive-don't-duplicate taught with constraints, utility types and satisfies." },
  "supabase-for-full-stack-apps-auth-row-level-security-and-server-side-access": { stars: 4, verdict: "RLS policies per operation and service-key discipline; accurate and security-minded." },
  "lightning-web-components-building-modern-ui-on-salesforce": { stars: 4, verdict: "Wire adapters, cacheable Apex and Lightning Data Service first: correct LWC guidance." },

  // Researched deep dives and the daily 5:00 AM edition.
  "kubernetes-2026-10-27-the-3-am-page-that-taught-us-why-statefulsets-alone-dont-run-databases": { stars: 4, verdict: "Makes the operator case well with CloudNativePG and honest adoption trade-offs." },
  "system-design-2026-10-27-the-celebrity-tweet-that-broke-our-feed-fan-out-explained": { stars: 4.5, verdict: "Fan-out on write, on read and the hybrid explained the way real feeds run them, with caching for p99." },
  "nextjs-2026-10-27-why-our-dashboard-took-42-seconds-to-paint-and-how-use-fixed-it": { stars: 4, verdict: "Start promises early, unwrap with use() behind Suspense: a correct, runnable waterfall fix." },
  "aws-2026-10-27-amazon-q-developer-debugged-our-3-am-ecs-outage-before-my-coffee-finished-brewing": { stars: 3.5, verdict: "Useful triage flow and fair limits section, but reads partly like a product showcase." },
  "agentic-ai-2026-10-27-why-your-rag-bot-lies-with-a-straight-face-and-how-to-make-it-check-itself": { stars: 4, verdict: "Query planning, re-ranking and document grading address the real cause of RAG hallucinations." },
  "nextjs-2026-10-27-why-our-nextjs-dashboard-froze-for-8-seconds-until-cache-components-fixed-it": { stars: 4.5, verdict: "Accurate Next.js 16 upgrade path (proxy.ts, Turbopack) and Cache Components pitfalls." },
  "react-2026-10-27-react-19-in-production-the-checkout-bug-that-forced-us-to-rewrite-our-forms": { stars: 4.5, verdict: "The double-charge story motivates Actions perfectly; covers ref-as-prop, use() and the compiler." },
  "openai-2026-10-27-your-agent-defaulted-to-the-cheap-model-heres-how-we-found-out": { stars: 3.5, verdict: "Good point about pinning models and a correct Responses tool loop; the default-model claim needs verifying." },
  "agentic-ai-2026-10-27-your-chatbot-isnt-an-agent-until-it-can-loop-remember-and-ask-permission": { stars: 4, verdict: "Loop, memory and approval gates are the right definition of an agent; a runnable minimal example." },
  "aws-2026-10-27-the-2-am-outage-that-was-really-a-service-choice-problem": { stars: 4, verdict: "Sensible service-selection guidance that separates documented facts from field experience." },
  "google-ai-2026-10-27-why-your-gemini-prototype-breaks-when-it-meets-production-traffic": { stars: 3.5, verdict: "Clear AI Studio versus Vertex AI split; an admitted hypothetical incident and a thin agent example." },
  "python-ai-2026-10-27-the-rag-tutorial-that-broke-in-prod-why-i-stopped-trusting-blog-code-snippets": { stars: 3, verdict: "The verify-the-docs lesson is valid, but much of the story explains what it will not show." },
  "microsoft-ai-2026-10-27-azure-ai-foundry-vs-azure-openai-pick-the-right-endpoint-first": { stars: 4, verdict: "Untangles Foundry's naming and endpoints usefully, with retirement and governance called out." },
  "n8n-2026-10-27-the-n8n-workflow-that-paid-off-triggers-agents-errors-and-queue-mode": { stars: 4.5, verdict: "Triggers, error workflows and queue mode for real load: the most production-ready n8n guide here." },
  "agent-frameworks-2026-10-27-five-agent-frameworks-two-we-can-actually-verify-a-documentation-first": { stars: 3, verdict: "Honest about sourcing, but compares only two of the five frameworks its title promises." },
  "emerging-2026-10-27-agents-api-agents-sdk-or-responses-api-the-one-decision-that-breaks-production": { stars: 3.5, verdict: "The control-boundary decision is well framed; the Codex and MCP sections stay shallow." },
  "ai-trends-2026-10-27-reasoning-models-mcp-and-the-plumbing-behind-ai-agents-in-2026": { stars: 4, verdict: "The unstable tool-order cache-miss story is a genuinely useful production insight." },
  "claude-code-2026-10-27-why-our-claude-code-agent-almost-ran-rm-rf-in-ci-and-how-we-locked-it-down": { stars: 4.5, verdict: "Correctly separates guidance (CLAUDE.md) from enforcement (permissions, hooks); concrete lockdown example." },
  "broadsheet-ink-7d0e42": { stars: 3.5, verdict: "A clear walkthrough of a publishing flow with ownership checks and cache expiry; it describes this site's own feature." },
  "kubernetes-2026-10-28-we-ran-docker-compose-bridge-convert-two-days-before-launch-heres-what-it-did": { stars: 4, verdict: "Lists exactly what an automatic Compose conversion leaves out for production." },
  "nextjs-2026-10-28-the-lab-said-09s-real-phones-said-48s-fixing-core-web-vitals-in-nextjs-16": { stars: 4.5, verdict: "Lab versus field data explained properly, with useReportWebVitals wired into a reporting habit." },
  "system-design-2026-10-28-the-40gb-wedding-video-that-crashed-our-homegrown-transcoding-fleet": { stars: 4, verdict: "A solid managed-transcoding pipeline on both clouds, with a useful production checklist." },
  "aws-2026-10-28-we-cut-a-41-lakh-aws-bill-to-16-lakh-without-losing-a-single-feature": { stars: 4.5, verdict: "A realistic cost playbook: rightsizing, Graviton, Savings Plans and lifecycle rules with their risks." },
  "agentic-ai-2026-10-28-the-day-a-refund-bot-nearly-approved-a-48000-payout-alone": { stars: 3.5, verdict: "Approval thresholds and idempotent refunds are the right design; template headings and thin state code drag it down." },
  "stop-following-tutorials-build-these-5-backend-projects-instead-b2aa88": { stars: 3, verdict: "Good motivation and a correct redirect handler, but it details only one of the five projects." },
  "nextjs-2026-10-29-our-flash-sale-page-served-stale-prices-to-everyone-including-the-ceo": { stars: 4.5, verdict: "Moves caching decisions from route config to data with cacheTag; accurate migration pitfalls." },
  "system-design-2026-10-29-3-am-page-our-url-shorteners-database-melted-under-a-billion-redirects": { stars: 4, verdict: "Cache keys, 301 versus 302 and origin shielding: the right concerns for redirect traffic." },
  "kubernetes-2026-10-29-our-12gb-node-image-shipped-a-shell-npm-and-a-cve-we-never-scanned-for": { stars: 4.5, verdict: "Multi-stage, distroless and scratch trade-offs plus scanning and signing; complete and correct." },
  "aws-2026-10-29-the-hr-chatbot-that-almost-leaked-salary-bands-lessons-from-bedrock-guardrails": { stars: 4.5, verdict: "End-to-end Bedrock Knowledge Base with guardrails and edge-case testing; strong data-hygiene lesson." },
  "aws-2026-10-30-the-cdk-deploy-that-quietly-deleted-our-order-history-table-at-2-am": { stars: 4.5, verdict: "Key changes replacing DynamoDB tables and removal policies: a lesson every CDK user needs." },
  "nextjs-2026-10-30-the-support-ticket-queue-that-lied-fixing-optimistic-ui-with-react-19-actions": { stars: 4, verdict: "Shows optimistic UI that reverts honestly on failure with useActionState and useOptimistic." },
  "kubernetes-2026-10-30-we-had-hpa-vpa-and-still-got-paged-during-the-diwali-sale-spike": { stars: 4, verdict: "HPA, VPA and event-driven scaling as separate dials, with a practical pre-sale checklist." },
  "system-design-2026-10-30-the-order-that-shipped-twice-fixing-a-dual-write-bug-with-kafka-and-the-ou": { stars: 4.5, verdict: "The dual-write problem solved properly: outbox, transactional producer and idempotent consumers." },
  "agentic-ai-2026-10-30-how-a-langgraph-agent-reviews-every-pull-request-before-a-human-even-opens-it": { stars: 3.5, verdict: "A believable PR-review agent with humans kept in the loop; template headings make it read generated." },
  "nextjs-2026-10-31-we-shipped-a-480kb-moment-library-to-render-one-date-on-a-button": { stars: 3.5, verdict: "The client-boundary lesson is right, but the headline overstates moment's real gzipped size." },
  "kubernetes-2026-10-31-the-deploy-that-dropped-zero-requests-until-a-node-drained-mid-rollout": { stars: 4.5, verdict: "Readiness probes, maxUnavailable and PodDisruptionBudgets tied together in one appliable manifest." },
  "system-design-2026-10-31-the-replies-that-arrived-before-the-question-fixing-chat-message-order": { stars: 4, verdict: "Ordering keys and per-conversation delivery explained clearly, with honest throughput trade-offs." },
  "aws-2026-10-31-the-deploy-that-rolled-itself-back-before-anyone-noticed-the-bug": { stars: 4.5, verdict: "Alarm-driven blue/green rollback with CodeDeploy, built step by step with the quota traps named." },
  "agentic-ai-2026-10-31-can-an-agent-remember-you-hate-late-fees-building-a-bill-reminder-brain": { stars: 3.5, verdict: "A relatable memory-driven agent; template headings and a loose problem statement weaken it." },
};

/** Attaches the story's review, when it has one, to a card or preview headed for a client component. Imported
 *  stories arrive with their stored review already set (toCard/toPreview); this table wins when both exist. */
export const withReview = <T extends { slug: string; review?: ExpertReview }>(item: T): T & { review?: ExpertReview } => {
  const review = REVIEWS[item.slug];
  return review ? { ...item, review } : item;
};

/** Stories rated at or below this are never published (user rule 2026-10-31); unrated stories are kept. */
export const MIN_PUBLISHED_STARS = 2.5;
export const meetsReviewBar = (story: { slug: string; source?: { review?: ExpertReview } }) =>
  ((REVIEWS[story.slug] ?? story.source?.review)?.stars ?? Infinity) > MIN_PUBLISHED_STARS;
