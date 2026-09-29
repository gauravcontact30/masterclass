import { topics } from "./shared";

export const N8N_TOPICS = topics({
  "Workflow foundations": [
    ["n8n workflow architecture", "Connect trigger and action nodes into an automation with explicit data and error paths.", [
        "A workflow is nodes connected by the data that flows between them.",
        "Every node receives items and emits items, which is what makes them composable.",
        "A node with no incoming connection never runs, however correct it is.",
      ]],
    ["Cloud and self-hosted n8n", "Compare managed operation with responsibility for upgrades, backups and security.", [
        "The hosted service and a self-run instance differ in who operates it.",
        "Self-hosting keeps credentials and data inside your own network.",
        "It also makes upgrades, backups and scaling your responsibility.",
      ]],
    ["Workflow editor and executions", "Build, inspect and debug node executions using the input and output panels.", [
        "The canvas builds the workflow; the execution list shows what ran.",
        "Each execution stores the data at every node, which is why debugging is visual.",
        "Stored execution data grows quickly and must be pruned.",
      ]],
    ["Manual and production executions", "Distinguish test runs from active production triggers and their side effects.", [
        "A manual run is triggered from the editor; a production run by its trigger.",
        "Manual runs let you inspect data before the workflow is active.",
        "Only an active workflow responds to its production trigger.",
      ]],
    ["Workflow settings and time zones", "Set timeout, execution storage and scheduling assumptions deliberately.", [
        "Error behaviour, timeouts and time zone are set per workflow.",
        "The time zone decides what a schedule actually means.",
        "Inheriting the instance default makes a schedule move when that changes.",
      ]],
    ["Templates and reusable workflows", "Adapt a template by checking credentials, field mappings and error behavior.", [
        "A template is a starting point that is copied rather than referenced.",
        "Copying means later template fixes do not reach the copies.",
        "A sub-workflow is the mechanism when genuine reuse is wanted.",
      ]],
  ],
  "Items & expressions": [
    ["Items and JSON data", "Understand how nodes receive and emit collections of structured items.", [
        "Data travels as an array of items, each with a JSON payload.",
        "Most nodes run once per item, which is the core execution model.",
        "Treating the array as a single object is the most common beginner error.",
      ]],
    ["Expressions and field mapping", "Map fields from upstream data without hardcoding values from a sample run.", [
        "Expressions read values from earlier nodes into a field.",
        "Referencing a node by name is what makes the data path explicit.",
        "Renaming a node breaks every expression that referenced it.",
      ]],
    ["Item linking", "Keep output items connected to their inputs when referencing data from earlier nodes.", [
        "Output items keep a link back to the input item that produced them.",
        "The link is what lets a later node reach the original data.",
        "Code that rebuilds items without the link breaks that lookup.",
      ]],
    ["Edit Fields node", "Select, rename and calculate fields to make downstream contracts explicit.", [
        "Fields are set, renamed or removed declaratively.",
        "Doing it declaratively keeps simple reshaping out of code.",
        "Keeping only set fields discards everything else on the item.",
      ]],
    ["Code node", "Transform data with code while accounting for execution mode and available runtime APIs.", [
        "JavaScript or Python runs when no node expresses the transformation.",
        "It is the escape hatch, so it should stay small and readable.",
        "Code is invisible to the canvas, which is where the workflow is understood.",
      ]],
    ["Run once versus per item", "Choose whether a transformation sees an entire collection or one item at a time.", [
        "A Code node either runs for all items or once per item.",
        "All-items mode is what allows aggregation across the batch.",
        "Per-item mode silently multiplies any API call inside it.",
      ]],
    ["Dates, time zones and Luxon", "Parse, format and compare timestamps without mixing local and UTC assumptions.", [
        "Dates are manipulated with a library rather than by string surgery.",
        "A date without a zone is ambiguous by an entire day at the edges.",
        "Parsing an unknown format guesses, and guesses differently per input.",
      ]],
    ["Binary data and files", "Pass file metadata and content using the configured binary storage strategy.", [
        "Files travel beside the JSON as named binary properties.",
        "Keeping them separate is what stops a file being stringified into JSON.",
        "Large binaries held in memory are what exhaust a worker.",
      ]],
  ],
  "Triggers & APIs": [
    ["Schedule Trigger", "Schedule repeatable jobs with the intended time zone and overlap policy.", [
        "A workflow runs on an interval or a cron expression.",
        "The trigger only fires while the workflow is active.",
        "A long run overlapping the next tick creates concurrent executions.",
      ]],
    ["Webhook node", "Receive HTTP events and distinguish test endpoints from production endpoints.", [
        "An external system starts the workflow by calling a URL.",
        "Test and production URLs differ, which is what catches people out.",
        "The endpoint is public unless authentication is configured.",
      ]],
    ["Respond to Webhook", "Control response status, headers and body while avoiding duplicate responses.", [
        "The response is sent from a chosen point in the workflow.",
        "Responding early is what keeps the caller fast while work continues.",
        "Without it the caller waits for the whole workflow to finish.",
      ]],
    ["Webhook authentication", "Verify callers and validate payloads before performing downstream actions.", [
        "Header, basic or signature checks guard the endpoint.",
        "An unauthenticated webhook is an open endpoint anyone may call.",
        "A shared secret in a query string is logged everywhere the URL is.",
      ]],
    ["HTTP Request node", "Call external APIs with explicit methods, authentication, parameters and response handling.", [
        "Arbitrary APIs are called with method, headers, body and auth.",
        "It is the general-purpose node when no dedicated integration exists.",
        "Credentials belong in the credential store, not in a header field.",
      ]],
    ["API pagination", "Fetch multiple pages with termination rules and a cap on total requests.", [
        "Multiple pages are fetched until the source is exhausted.",
        "Fetching one page silently processes only part of the data.",
        "A pagination loop with no limit can run until the workflow times out.",
      ]],
    ["API rate limits", "Handle throttling with batching, delays and bounded retry rather than uncontrolled fan-out.", [
        "Requests are spaced or batched to stay within the provider's limits.",
        "Per-item execution is what turns a small workflow into a burst.",
        "Being rate-limited mid-run leaves the work half done.",
      ]],
    ["OAuth2 and credential scopes", "Grant only required access and plan credential renewal and revocation.", [
        "Credentials are stored centrally and scoped to what they need.",
        "Central storage is what keeps a secret out of the workflow JSON.",
        "A token that expires needs refresh configured or the workflow fails later.",
      ]],
    ["Polling triggers", "Use stable cursors or timestamps to avoid missing records or processing them twice.", [
        "A source is checked on a schedule for new data.",
        "Polling is what integrates a system with no webhook support.",
        "It needs a marker of what was already seen, or it reprocesses.",
      ]],
    ["Webhook deduplication", "Store event identities and make downstream operations safe under repeated delivery.", [
        "A repeated delivery is recognised and not processed twice.",
        "Delivery is at least once, so repeats are expected.",
        "Keying on the event id is what makes the repeat harmless.",
      ]],
  ],
  "Branching & transformations": [
    ["If and Switch nodes", "Route items using explicit conditions and a default path for unexpected values.", [
        "Items are routed down branches by condition.",
        "If has two outputs; Switch has many, which suits a classification.",
        "An item matching no branch is dropped unless a fallback exists.",
      ]],
    ["Merge node", "Combine branches using the intended matching keys and missing-item behavior.", [
        "Two branches are combined by append, match or position.",
        "The merge mode decides whether items are joined or stacked.",
        "Merging by position pairs unrelated items when counts differ.",
      ]],
    ["Loop Over Items", "Process controlled batches when a node or external service cannot handle all items at once.", [
        "Items are processed in batches rather than all at once.",
        "Batching is what keeps a large set within memory and rate limits.",
        "The loop must be closed back or only the first batch runs.",
      ]],
    ["Wait node", "Pause long-running workflows without holding an active synchronous request open.", [
        "Execution pauses for a duration, a time, or until a webhook.",
        "Pausing for a webhook is how an external approval is awaited.",
        "A paused execution holds state and counts against retention.",
      ]],
    ["Filter and Sort nodes", "Reduce and order item sets before expensive work or user-facing output.", [
        "Items are discarded or reordered declaratively.",
        "Filtering early is what keeps later nodes from doing wasted work.",
        "Filtering removes items entirely; it does not route them elsewhere.",
      ]],
    ["Aggregate and Split Out", "Convert between grouped records and individual items with stable identifiers.", [
        "Many items combine into one, or one item splits into many.",
        "They are the pair that changes the shape between per-item and per-batch work.",
        "Aggregating loses per-item linking to the original input.",
      ]],
    ["Remove Duplicates", "Choose deduplication keys and scope according to business identity.", [
        "Repeated items are dropped within a run or across runs.",
        "Across-run deduplication is what stops a poll reprocessing old data.",
        "It stores seen keys, which grows without a bound being set.",
      ]],
    ["Sub-workflows", "Extract reusable steps with documented inputs, outputs and error behavior.", [
        "One workflow calls another and receives its result.",
        "It is the real reuse mechanism, unlike copying a template.",
        "Each call is an execution of its own, with its own history and cost.",
      ]],
  ],
  "Integrations & automation": [
    ["Database nodes", "Use parameterized queries, least-privilege accounts and controlled transaction boundaries.", [
        "Rows are queried and written through a stored credential.",
        "Parameterised queries are what keep item data out of the SQL text.",
        "A per-item query opens a connection per item under load.",
      ]],
    ["Spreadsheet workflows", "Map rows using stable IDs and handle edits, missing cells and duplicate records.", [
        "Sheets are read and written as ordinary item data.",
        "Spreadsheets are where most business processes actually live.",
        "Concurrent writes to one sheet overwrite rather than merge.",
      ]],
    ["Email and messaging workflows", "Validate recipients and use deduplication before sending external messages.", [
        "Mail and chat messages are sent as workflow steps.",
        "Notification is usually what makes an automation visible to people.",
        "A per-item send turns one failure into a burst of messages.",
      ]],
    ["CRM synchronization", "Resolve record identities and conflicts rather than blindly copying fields both ways.", [
        "Records are kept in step between systems.",
        "A stable external identifier is what makes an update idempotent.",
        "Two-way sync without a conflict rule eventually loops.",
      ]],
    ["File and object-storage workflows", "Validate object paths, media types and size limits before moving content.", [
        "Files move between storage services through binary properties.",
        "Streaming is what avoids loading a large file into memory.",
        "Object keys collide silently, so naming is part of the design.",
      ]],
    ["Custom and community nodes", "Review permissions, maintenance and dependencies before installing third-party code.", [
        "Additional nodes extend the palette beyond the built-in set.",
        "A community node runs with the same access as any other node.",
        "It is third-party code inside your instance, with the trust that implies.",
      ]],
  ],
  "AI automation": [
    ["AI Agent node", "Connect a model and narrowly scoped tools to automate tasks with bounded autonomy.", [
        "A model is given tools and a goal inside a workflow.",
        "The agent decides its own steps, unlike the rest of the canvas.",
        "Nondeterminism enters the workflow at exactly this node.",
      ]],
    ["Chat Trigger and conversational flows", "Manage session identity and distinguish a new conversation from a continuing thread.", [
        "A chat interface starts and continues a workflow.",
        "The session identifier is what keeps a conversation together.",
        "Without memory each message is answered with no history.",
      ]],
    ["Chat model integrations", "Configure providers and compare tool support, latency, context size and costs.", [
        "Providers are attached to the agent through credentials.",
        "Swapping provider is configuration rather than rebuilding the workflow.",
        "Tool calling support differs per provider, so a swap needs retesting.",
      ]],
    ["Tools for n8n agents", "Expose workflows or APIs as tools with clear parameter descriptions and permissions.", [
        "Workflow nodes are exposed to the agent as callable tools.",
        "The description is prompt text, so a vague one is called wrongly.",
        "A tool with side effects can be invoked at the model's discretion.",
      ]],
    ["Structured Output Parser", "Require an output shape and validate it before handing data to a business system.", [
        "The model's reply is constrained to a schema.",
        "A schema is what makes the output usable by the next node.",
        "A reply that validates can still be semantically wrong.",
      ]],
    ["Memory nodes", "Scope conversation memory and use a storage backend appropriate for the execution topology.", [
        "Conversation history is retained between turns.",
        "Memory is what makes a follow-up question answerable.",
        "Unbounded history eventually exceeds the model's context window.",
      ]],
    ["RAG in n8n", "Build document ingestion and retrieval flows with traceable sources and access controls.", [
        "Documents are retrieved and given to the model as evidence.",
        "Grounding is what lets the model answer about your own data.",
        "The answer is bounded by retrieval quality, not by the model.",
      ]],
    ["Vector store nodes", "Connect embedding and storage components while keeping dimensions and metadata consistent.", [
        "Embeddings are stored and searched by similarity.",
        "Metadata stored beside the vector is what allows filtered search.",
        "Changing the embedding model invalidates the whole index.",
      ]],
    ["Human approval for AI actions", "Route sensitive actions through review before allowing the tool to execute.", [
        "A person confirms before a consequential action runs.",
        "The pause sits before the effect, which is what makes it a control.",
        "An approval step nobody answers stalls the execution indefinitely.",
      ]],
    ["AI workflow evaluation", "Use representative test cases to measure output quality and tool behavior.", [
        "Outputs are scored against a fixed set of cases.",
        "A fixed set is what turns a prompt change into a measurable one.",
        "Without it, prompt edits are judged on a single lucky example.",
      ]],
  ],
  "Reliability & debugging": [
    ["Error Trigger workflows", "Send failed executions to an actionable recovery path with enough diagnostic context.", [
        "A separate workflow runs when another one fails.",
        "Centralising failure handling is what makes errors visible.",
        "The error workflow failing is silent unless it is watched too.",
      ]],
    ["Retry on failure", "Retry temporary failures while preventing duplicate writes or notifications.", [
        "A node retries a configurable number of times.",
        "Most integration failures are transient and succeed on retry.",
        "Retrying a non-idempotent write repeats the write.",
      ]],
    ["Continue-on-error behavior", "Route failed items explicitly instead of silently treating errors as successful data.", [
        "A failing node can pass the error onward instead of stopping.",
        "Continuing is what lets one bad item not kill the batch.",
        "It also hides failures unless the error branch is handled.",
      ]],
    ["Pinned data", "Develop transformations with fixed samples and recheck behavior against live inputs.", [
        "Sample data is frozen on a node during development.",
        "Pinning is what lets later nodes be built without re-calling an API.",
        "Pinned data remains in the editor and can mislead if forgotten.",
      ]],
    ["Execution history and replay", "Inspect a failed run and assess side effects before replaying it.", [
        "Past runs are inspected and re-run from stored data.",
        "Replay is what makes a production failure reproducible.",
        "Replaying re-performs side effects unless the workflow guards against it.",
      ]],
    ["Workflow testing", "Test empty input, malformed fields, throttling and partial API failures.", [
        "Workflows are exercised deliberately before being activated.",
        "Manual execution with real credentials still performs real actions.",
        "A test against production systems is a production change.",
      ]],
  ],
  "Hosting & governance": [
    ["Docker deployment", "Run n8n with persistent storage and deployment-specific environment configuration.", [
        "Redis runs on localhost port 6379 with no password by default.",
        "It can run on a separate machine so long as the n8n instances can reach it.",
        "Persistent state must be mounted, or it is lost when the container is replaced.",
      ]],
    ["PostgreSQL and backups", "Back up workflow data and verify restoration alongside the encryption key.", [
        "A real database replaces the default embedded store.",
        "Backups are what make the instance recoverable at all.",
        "An untested restore is a backup that may not exist.",
      ]],
    ["Credential encryption key", "Keep a stable protected key shared where required by the deployment.", [
        "One key encrypts every stored credential.",
        "Losing it makes every credential unreadable and unrecoverable.",
        "Restoring a database without the matching key restores nothing usable.",
      ]],
    ["Queue mode and Redis", "Separate incoming execution coordination from worker processing using queue infrastructure.", [
        "The main instance generates an execution and passes its id to Redis rather than running it.",
        "`EXECUTIONS_MODE=queue` is required on the main instance and on every worker.",
        "The docs advise against queue mode on SQLite; a server database is expected.",
      ]],
    ["Worker scaling and concurrency", "Size workers against database capacity, external quotas and memory use.", [
        "Workers are separate n8n instances started with `n8n worker`, sharing the main encryption key.",
        "Each worker handles 10 parallel jobs by default, adjusted with `--concurrency`.",
        "The docs warn that low concurrency across many workers can exhaust the database connection pool.",
      ]],
    ["Task runners", "Isolate code execution according to the supported runner deployment model.", [
        "Code node execution is isolated from the main process.",
        "Isolation is what stops user code destabilising the instance.",
        "It is a separate component to deploy and keep in version step.",
      ]],
    ["Reverse proxy and TLS", "Configure external URLs and trusted proxy settings for secure webhook delivery.", [
        "The instance sits behind a proxy terminating TLS.",
        "Webhook URLs must match the public address or callbacks fail.",
        "A misconfigured proxy breaks webhooks while the editor still works.",
      ]],
    ["Execution pruning", "Set retention limits and remove unneeded payloads from stored execution history.", [
        "Old execution data is deleted on a schedule.",
        "Execution data is the fastest-growing thing in the database.",
        "Pruning removes the history a later investigation would have needed.",
      ]],
    ["Source control and environments", "Promote reviewed workflow changes and check feature availability for the chosen edition.", [
        "Workflows are versioned and promoted between environments.",
        "Version control is what makes a change reviewable and revertible.",
        "Credentials do not move with the workflow and must exist per environment.",
      ]],
    ["Projects and access control", "Limit workflow and credential access according to team responsibilities and edition support.", [
        "Workflows and credentials are scoped to teams.",
        "Scoping is what stops everyone holding every credential.",
        "Credential access is effectively access to the connected system.",
      ]],
    ["Monitoring and health checks", "Observe queue depth, execution failures and dependency availability.", [
        "Each worker runs a server exposing health check and metrics endpoints.",
        "Those endpoints are what an orchestrator uses to decide a worker is alive.",
        "A check that only pings the editor misses a failed worker entirely.",
      ]],
    ["Upgrades and rollback", "Back up first, test workflow compatibility and retain a recovery plan for upgrades.", [
        "Versions are upgraded deliberately with a way back.",
        "Node behaviour can change between versions in ways workflows notice.",
        "A database migrated forward may not accept the previous version.",
      ]],
  ],
  "Hooks": [
    ["External hooks", "Run your own code at named points in the backend, loaded from a hook file at startup.", [
        "Custom code runs at defined points in the instance lifecycle.",
        "Hooks are how instance-wide policy is applied without editing workflows.",
        "They run inside the instance, so a slow hook slows everything.",
      ]],
    ["workflow.postExecute", "Act after every execution - export the result, record an audit entry, alert on failure.", [
        "Code runs after every workflow execution completes.",
        "It is the single place to record or forward every outcome.",
        "It fires for every execution, so its cost is paid constantly.",
      ]],
    ["Frontend external hooks", "Extend the editor itself at documented points, for branding or in-house guardrails.", [
        "The editor interface is extended or constrained.",
        "It is how an organisation enforces a convention at authoring time.",
        "Client-side restrictions are guidance, not enforcement.",
      ]],
    ["Error hook payloads", "Read the execution, node and message an error handler receives, and route on it.", [
        "The failure payload names the workflow, node and error.",
        "Naming the node is what makes an alert actionable.",
        "The payload can contain item data, which may be sensitive.",
      ]],
    ["The errorWorkflow setting", "Point one workflow at a shared error handler instead of repeating recovery per workflow.", [
        "A workflow nominates another to handle its failures.",
        "Setting it per workflow is what allows different failure policies.",
        "Unset, a failure is recorded and nothing else happens.",
      ]],
    ["Sub-workflow calls", "Call another workflow as a step and treat its result as this workflow's data.", [
        "A parent waits for a child workflow and receives its output.",
        "Waiting is what makes the child's result usable by the parent.",
        "Failures propagate, so the parent must decide whether to continue.",
      ]],
    ["Response timing hooks", "Choose where in the flow the HTTP response is sent, rather than always at the end.", [
        "When the webhook response is sent is controlled explicitly.",
        "Responding immediately is what keeps a caller from timing out.",
        "An early response means the caller cannot learn the final outcome.",
      ]],
  ],
});
