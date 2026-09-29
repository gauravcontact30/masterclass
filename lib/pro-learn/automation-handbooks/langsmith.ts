import { topics } from "./shared";

export const LANGSMITH_TOPICS = topics({
  "LangSmith foundations": [
    ["LangSmith platform overview", "Connect tracing, evaluation and deployment into an evidence-driven agent development cycle.", [
        "Tracing, datasets, evaluation and deployment sit on one platform.",
        "Sharing a data model is what lets a production trace become a test case.",
        "It observes an application; it does not decide how the application is built.",
      ]],
    ["Organizations, workspaces and projects", "Separate team ownership and related runs using the platform's organizational boundaries.", [
        "A hierarchy separates billing, teams and individual applications.",
        "The workspace is where access and resources are actually scoped.",
        "Traces land in a project, so an unset project name mixes applications together.",
      ]],
    ["API keys and SDK setup", "Configure the official Python or JavaScript SDK with securely stored workspace credentials.", [
        "A key and a project name configure the SDK through the environment.",
        "Configuration by environment is what keeps it out of application code.",
        "A key committed to the repository exposes every trace in the workspace.",
      ]],
    ["Framework-independent instrumentation", "Trace application behavior even when the agent does not use LangChain or LangGraph.", [
        "Anything can be traced, not only LangChain applications.",
        "Independence is what makes it usable over a hand-written agent loop.",
        "Manual instrumentation must define the span boundaries itself.",
      ]],
    ["Local development workflow", "Run a small instrumented application and inspect its first trace before adding complexity.", [
        "Traces from a laptop go to a separate project from production.",
        "Separation keeps experiments out of the numbers that matter.",
        "Tracing local runs still sends data off the machine.",
      ]],
    ["LangChain, LangGraph and LangSmith roles", "Distinguish agent components, orchestration runtime and the tooling used to inspect and evaluate them.", [
        "One builds chains, one runs graphs, one observes and evaluates them.",
        "They are independent, so any can be used without the others.",
        "Using all three does not remove the need to understand each.",
      ]],
  ],
  "Tracing & observability": [
    ["Traces, runs and spans", "Follow a request as a tree of model, tool, retrieval and application operations.", [
        "A trace is a tree of runs; each run is one unit of work.",
        "The tree is what shows which step produced which input downstream.",
        "A flat list of calls cannot show nesting, which is where causes hide.",
      ]],
    ["Automatic LangChain tracing", "Capture framework calls with tracing configuration and inspect the generated run structure.", [
        "Enabling an environment variable traces every LangChain call.",
        "Zero-code tracing is what makes adoption immediate.",
        "It traces everything, including what should not be recorded.",
      ]],
    ["traceable instrumentation", "Wrap custom functions so their input, output and timing join the surrounding trace.", [
        "A decorator turns an ordinary function into a traced run.",
        "Decorating is the cheapest way to trace code that is not a framework call.",
        "Arguments and return values are captured, so sensitive data is captured too.",
      ]],
    ["Manual run instrumentation", "Create explicit run boundaries when automatic instrumentation does not fit the application.", [
        "Runs are created and closed explicitly through the client.",
        "Explicit control is needed where execution does not fit a function boundary.",
        "A run never closed stays pending and distorts the timings.",
      ]],
    ["Parent-child trace relationships", "Preserve nesting across helper functions and asynchronous tasks.", [
        "Nesting is established by passing the parent run through.",
        "The parent link is what makes the tree rather than a list.",
        "Losing it produces orphan runs that appear unrelated.",
      ]],
    ["Distributed trace propagation", "Carry trace context across service boundaries without mixing unrelated requests.", [
        "Trace context travels across service boundaries in headers.",
        "Propagation is what keeps one user request as one trace.",
        "Without it each service produces a separate, uncorrelated trace.",
      ]],
    ["Tags and metadata", "Attach release, environment and task labels that make regressions searchable.", [
        "Runs carry labels and structured fields for later filtering.",
        "Filtering by version or tenant is what makes a large project searchable.",
        "High-cardinality metadata makes filtering slow rather than useful.",
      ]],
    ["Threads and conversations", "Group related turns while retaining each request's separate trace.", [
        "Related runs group into a conversation by a thread identifier.",
        "Grouping is what lets a multi-turn failure be read in order.",
        "Without a thread id, turns appear as unrelated runs.",
      ]],
    ["Token usage and cost tracking", "Attribute model usage to runs and check how pricing or missing usage data affects estimates.", [
        "Input and output tokens are recorded per run and priced.",
        "Per-run cost is what identifies the step that is actually expensive.",
        "Pricing is configured, so a new model can be counted at the wrong rate.",
      ]],
    ["Latency and errors", "Locate slow or failed child operations instead of treating the whole request as one opaque call.", [
        "Duration and failures are recorded for every run.",
        "Per-run latency separates a slow model from a slow tool.",
        "An error caught in code is not an error unless it is reported.",
      ]],
    ["Trace filtering and comparison", "Compare runs for the same task across model, prompt or code revisions.", [
        "Traces are searched and two runs compared side by side.",
        "Comparison is what shows what changed between a good and a bad run.",
        "Filters operate on recorded fields, so what was not recorded cannot be found.",
      ]],
    ["Input and output redaction", "Remove sensitive fields before they leave the application for tracing.", [
        "Sensitive fields are removed before a trace is sent.",
        "Redacting client-side is the only way it never leaves the process.",
        "Redaction removes the data, so the trace becomes less diagnosable.",
      ]],
    ["Tracing sampling", "Choose how much production traffic to record while preserving useful failure evidence.", [
        "Only a fraction of runs are recorded at high volume.",
        "Sampling is what keeps tracing affordable under load.",
        "A rare failure is likely to be the run that was not sampled.",
      ]],
    ["Dashboards and alerts", "Watch quality, latency and usage trends with thresholds tied to operational decisions.", [
        "Aggregate latency, cost, error and feedback trends are monitored.",
        "Alerting on a trend catches a regression no single trace reveals.",
        "An alert with no owner is noise rather than monitoring.",
      ]],
  ],
  "Datasets & examples": [
    ["Datasets and examples", "Define representative inputs, reference outputs and metadata for repeatable evaluation.", [
        "An example holds `inputs`, a dictionary passed to the application.",
        "Reference outputs and metadata on an example are both optional.",
        "The dataset is the fixed ground an experiment measures against.",
      ]],
    ["Creating datasets from traces", "Turn observed failures and successful runs into reusable regression cases.", [
        "Real production runs are promoted into a dataset.",
        "Real traffic is a better test set than invented examples.",
        "Promoted inputs carry whatever sensitive data they contained.",
      ]],
    ["Dataset imports and exports", "Move examples with their intended field mapping and privacy constraints preserved.", [
        "Examples move in and out in bulk.",
        "Bulk movement is what makes a dataset reviewable outside the platform.",
        "An export is a copy of the data, with the same handling obligations.",
      ]],
    ["Dataset versions", "Pin the evaluation data so two experiments can be compared fairly.", [
        "A dataset is versioned so an experiment stays comparable.",
        "Pinning a version is what keeps an old result meaningful.",
        "Evaluating against the latest silently changes what is measured.",
      ]],
    ["Dataset splits", "Separate development, regression and held-out examples to reduce evaluation leakage.", [
        "Splits organise examples into named subsets.",
        "The documented patterns are ML-style train/validation/test, category-based, and staged rollout.",
        "Staged rollout is what isolates exploratory examples from the measured set.",
      ]],
    ["Reference outputs", "Record expected behavior without assuming there is only one valid wording.", [
        "A reference output is the answer an example is expected to produce.",
        "Reference-based evaluators need it and therefore work offline only.",
        "Many valid tasks have no single correct answer to record.",
      ]],
    ["Multiturn evaluation datasets", "Represent conversation history and expected outcomes for stateful agents.", [
        "A conversation, not a single input, is the unit of evaluation.",
        "Multi-turn behaviour is where single-turn tests say nothing.",
        "Each turn depends on the last, so the sequence cannot be shuffled.",
      ]],
    ["Dataset maintenance", "Refresh stale cases and retain important production failures as permanent regression checks.", [
        "Examples are corrected, retired and added as the product changes.",
        "A stale dataset measures a product that no longer exists.",
        "Every change to it breaks comparability with earlier results.",
      ]],
  ],
  "Offline evaluation": [
    ["Experiments", "Run a candidate application against a defined dataset and record outputs and scores.", [
        "An experiment captures one application version evaluated over a dataset.",
        "It records outputs, evaluator scores and an execution trace for every example.",
        "One experiment is a measurement, not evidence that quality improved.",
      ]],
    ["Evaluation SDK", "Connect a target function, dataset and evaluators using the official evaluation interface.", [
        "Evaluations run from code over a dataset with chosen evaluators.",
        "Running from code is what puts evaluation into CI.",
        "Concurrency has to be bounded or the provider rate-limits the run.",
      ]],
    ["Deterministic evaluators", "Check exact rules such as JSON validity, required fields or prohibited tool calls.", [
        "A code evaluator applies a deterministic, rule-based check.",
        "It is fast, free and perfectly repeatable.",
        "It only works where correctness is exactly expressible.",
      ]],
    ["LLM-as-judge evaluators", "Score qualitative properties with a written rubric and validate agreement with human review.", [
        "A language model scores the output against a rubric.",
        "It reaches qualities no rule-based check can express.",
        "The judge is itself fallible and carries its own biases.",
      ]],
    ["Reference-free evaluation", "Measure properties that do not need a gold answer while recognizing what remains unverified.", [
        "A reference-free evaluator scores without comparing to an expected output.",
        "It is the only kind that works for both offline and online evaluation.",
        "It can measure properties, but not correctness against a known answer.",
      ]],
    ["Pairwise comparison", "Compare candidate outputs for the same input using blinded, consistent criteria.", [
        "Two application versions are compared on the same input.",
        "The comparison can be made by a heuristic, an LLM with a pairwise prompt, or a human.",
        "It shows which is preferred without showing whether either is good.",
      ]],
    ["Experiment comparison", "Inspect case-level regressions alongside aggregate quality, latency and cost.", [
        "Two runs over the same dataset are compared example by example.",
        "Per-example comparison is what reveals a regression an average hides.",
        "An improved average can still contain new failures.",
      ]],
    ["Repeated trials and concurrency", "Account for model variability and rate limits when configuring evaluation runs.", [
        "Each example runs several times to expose variance.",
        "Repetition is what separates a real change from sampling noise.",
        "It multiplies cost and runtime by the number of trials.",
      ]],
    ["RAG evaluation", "Measure retrieval relevance, answer support and answer usefulness as separate properties.", [
        "Retrieval and generation are scored separately.",
        "Separating them is what tells you which half is failing.",
        "A grounded answer from wrong evidence still scores well on fluency.",
      ]],
    ["Agent trajectory evaluation", "Assess tool choices and action order as well as the final task outcome.", [
        "The path taken, not only the final answer, is scored.",
        "Two runs can agree on the answer and differ wildly in cost.",
        "Demanding an exact trajectory makes a valid alternative look like a failure.",
      ]],
    ["Regression gates in CI", "Block promotion when a representative evaluation suite violates agreed thresholds.", [
        "A build fails when scores drop below a threshold.",
        "A gate is what stops a regression reaching production.",
        "A threshold set too tight fails on noise and gets disabled.",
      ]],
    ["Evaluator calibration", "Compare evaluator scores with expert labels and investigate disagreements before trusting the score.", [
        "An evaluator is checked against human judgement.",
        "An uncalibrated evaluator measures itself rather than the product.",
        "Calibration has to be redone when the rubric or the judge changes.",
      ]],
  ],
  "Online evaluation & review": [
    ["Online evaluators", "Apply selected quality checks to production runs under explicit sampling and cost limits.", [
        "Online evaluation targets production runs and threads rather than a dataset.",
        "It has no reference outputs available, so evaluators must be reference-free.",
        "Scoring live traffic adds a model call to the traffic being scored.",
      ]],
    ["User feedback", "Attach feedback to the correct run and distinguish satisfaction from factual correctness.", [
        "Ratings and corrections attach to the run that produced the output.",
        "Attaching to the run is what makes feedback actionable rather than anecdotal.",
        "Feedback is self-selected, so it skews toward the extremes.",
      ]],
    ["Annotation queues", "Route cases to reviewers with clear instructions and consistent scoring criteria.", [
        "Queues collect structured human feedback on runs.",
        "They come in single-run and pairwise forms.",
        "Review capacity, not trace volume, is what sets the throughput.",
      ]],
    ["Human review rubrics", "Define observable success and failure examples to improve reviewer agreement.", [
        "Human evaluation is one of the four documented approaches.",
        "A shared rubric is what makes two reviewers roughly agree.",
        "Changing the rubric makes earlier review rounds incomparable.",
      ]],
    ["Automation rules", "Move matching traces into review or monitoring workflows without manual triage of every run.", [
        "Runs matching a filter are sampled, scored or queued automatically.",
        "Automation is what keeps review flowing without someone watching.",
        "A rule matching too broadly floods the queue it feeds.",
      ]],
    ["Production-to-evaluation loop", "Convert confirmed production failures into reproducible cases before changing the system.", [
        "Failures found live become dataset examples.",
        "Closing the loop is what stops the same failure recurring.",
        "The dataset only grows, so it needs pruning as well as additions.",
      ]],
  ],
  "Prompts & context": [
    ["Prompt and Context Hub", "Manage reusable prompt and context assets separately from application deployment.", [
        "Prompts are versioned centrally rather than embedded in code.",
        "Central storage is what lets a prompt change without a deploy.",
        "It also means a prompt can change without a code review.",
      ]],
    ["Prompt versions and commits", "Record changes to instructions and identify which version produced an output.", [
        "Each change is a commit with history.",
        "History is what makes a rollback possible and a change attributable.",
        "A version pinned nowhere means production can move underneath you.",
      ]],
    ["Prompt tags and promotion", "Use controlled references when moving a tested prompt between environments.", [
        "A tag names which version an environment uses.",
        "Tagging is what separates editing a prompt from releasing it.",
        "Moving a tag is a production change with no deployment.",
      ]],
    ["Prompt playground", "Try candidate prompts and model settings on representative inputs before integration.", [
        "A prompt is run against models and inputs interactively.",
        "Fast iteration is what the playground is for.",
        "A prompt that works on one example is not evidence of anything.",
      ]],
    ["Prompt comparison and evaluation", "Compare revisions using the same examples and evaluator definitions.", [
        "Two prompts are scored over the same dataset.",
        "Measured comparison replaces an argument about which reads better.",
        "A prompt tuned on the dataset may not generalise past it.",
      ]],
    ["Prompt access and secrets", "Keep reusable assets free of embedded credentials and restrict access appropriately.", [
        "Who may read and change a prompt is controlled.",
        "Prompts carry business logic, so editing one is a production change.",
        "Anything secret inside a prompt is visible to everyone with access.",
      ]],
  ],
  "Agent deployment": [
    ["LangSmith deployment options", "Compare hosted and self-managed deployment choices against operational and data requirements.", [
        "Cloud, hybrid and self-hosted differ in where data lives.",
        "Data residency is usually what decides between them.",
        "Self-hosting moves the operational burden onto your team.",
      ]],
    ["Agent Server", "Understand the service interface for deployed agents, runs and persistent conversations.", [
        "Graphs are served with threads, runs and streaming built in.",
        "It supplies the durable run API rather than each team writing one.",
        "It is another service to deploy, monitor and upgrade.",
      ]],
    ["Deployment configuration", "Declare application dependencies and graph entry points with environment-specific configuration.", [
        "Graphs, dependencies and environment are declared in one file.",
        "Declaring it is what makes a deployment reproducible.",
        "Configuration drift between environments reappears as a run-time failure.",
      ]],
    ["Assistants, threads and runs", "Separate configured agent behavior, conversation state and individual executions.", [
        "An assistant is a configured graph; threads hold conversations; runs are executions.",
        "The separation is what lets one graph serve many configurations.",
        "Thread state persists, so it must eventually be cleaned up.",
      ]],
    ["Streaming client integration", "Render server progress and partial responses while handling reconnects and cancellation.", [
        "A client consumes the run's stream of tokens and events.",
        "Streaming is what makes a long run feel responsive.",
        "The client must handle reconnection or a dropped stream looks like a failure.",
      ]],
    ["Background runs and scheduling", "Manage long-running work with explicit ownership, status and completion handling.", [
        "Runs continue without a client attached, and can be scheduled.",
        "Detachment is what allows a run longer than any request.",
        "A background run still consumes budget with nobody watching it.",
      ]],
    ["Authentication and authorization", "Enforce identity and resource access before accepting thread and run operations.", [
        "Who may call which assistant and read which thread is enforced.",
        "Thread-level rules are what stop one user reading another's conversation.",
        "Authentication alone answers who, not what they may reach.",
      ]],
    ["Release testing and rollback", "Verify a candidate deployment on evaluation tasks before shifting production traffic.", [
        "A new version is evaluated before promotion and can be reverted.",
        "Evaluating before promoting is the point of keeping the datasets.",
        "Rolling back code does not roll back a prompt tag.",
      ]],
    ["Deployment monitoring", "Watch execution failures, capacity and downstream dependencies after a release.", [
        "Latency, errors, cost and feedback are watched in production.",
        "Production is where the inputs you never imagined arrive.",
        "A dashboard nobody reads is not monitoring.",
      ]],
    ["Retention and data governance", "Set trace and dataset handling policies suitable for the workspace and deployment model.", [
        "How long traces persist, and who can read them, is decided deliberately.",
        "Traces contain user input, so retention is a privacy decision.",
        "Indefinite retention grows both cost and exposure.",
      ]],
  ],
  "Hooks & automations": [
    ["The traceable wrapper", "Wrap a function and its inputs, output, latency and errors become one run.", [
        "Wrapping a function makes it a run in the trace tree.",
        "It is the primitive the rest of the tracing builds on.",
        "It captures arguments and results, which is both the value and the risk.",
      ]],
    ["Manual run trees", "Build parent and child runs by hand when the work does not sit inside one function.", [
        "A tree is constructed explicitly when execution does not fit functions.",
        "Explicit construction is what traces a loop or a stream correctly.",
        "The parent-child links are yours to get right.",
      ]],
    ["Tracing callbacks", "A tracer is a callback handler, so tracing an existing chain needs no code change.", [
        "Tracing attaches as a callback handler within LangChain.",
        "Being a handler is why it composes with other callbacks.",
        "A handler that throws can disrupt the run it was observing.",
      ]],
    ["Custom evaluators", "Score a run with your own function, which receives the run and the reference example.", [
        "A scoring function is written for a domain-specific property.",
        "Generic evaluators miss what actually matters to a specific product.",
        "A custom evaluator needs calibrating like any other.",
      ]],
    ["Feedback submission", "Attach a score or a comment to a run from the app, keyed by the run id.", [
        "Scores and comments are attached to a run through the API.",
        "Programmatic submission is how implicit signals become feedback.",
        "Feedback on the wrong run id is worse than none.",
      ]],
    ["Run rules", "Trigger an action - an annotation queue, a dataset, a webhook - when a run matches a filter.", [
        "Matching runs trigger an automatic action.",
        "Rules are what connect production traffic to review and datasets.",
        "Overlapping rules can act on the same run more than once.",
      ]],
    ["Metadata and tags on runs", "Set tenant, version and experiment on the run so a filter can find it later.", [
        "Version, tenant and experiment labels attach to each run.",
        "Labels are what make later filtering and grouping possible.",
        "Metadata not set at write time cannot be added retrospectively.",
      ]],
  ],
});
