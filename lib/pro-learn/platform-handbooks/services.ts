import { defineHandbook } from "./shared";

/**
 * The service edge: work that arrives from outside, or continues after the
 * response has been sent.
 *
 * All four share one hard problem — an event may arrive twice, late, or not at
 * all — so idempotency and retry semantics recur deliberately across them
 * rather than being stated once and assumed.
 */
export const SERVICE_HANDBOOKS = [
  defineHandbook("Webhook", "Receiving, verifying, acknowledging, retrying and replaying inbound events safely.", "https://www.rfc-editor.org/rfc/rfc9421.html", {
    mechanism: "A webhook is an HTTP request the sender retries until it receives a success status. The receiver therefore controls delivery by what it returns, and must treat every request as possibly a duplicate of one it already handled.",
    example: "A payment webhook verifies the signature, records the event id, and returns 200 immediately. The actual fulfilment runs from a queue, so a slow database cannot cause a timeout that makes the sender retry a payment already captured.",
    pitfall: "Doing the work before responding couples the sender's timeout to your slowest dependency. The result is repeated deliveries of an event you did in fact process, and duplicated side effects if the handler is not idempotent.",
  }, {
    "Receiver pipeline": [
      ["Raw body capture", "Capture the unparsed body before any middleware reads it, or signature verification cannot pass.", [
        "Read the request body as exact bytes before JSON parsing.",
        "Prevent middleware from rewriting the signed payload.",
        "Bound body size before allocating large buffers.",
      ]],
      ["Signature verification step", "Verify before parsing, and treat a failed verification as an unauthenticated request.", [
        "Check the sender's signature using its documented verification scheme.",
        "Reject unauthenticated payloads before acting on their contents.",
        "Use a maintained verifier when the provider supplies one.",
      ]],
      ["Idempotency check", "Look up the event id and stop early when this delivery has already been processed.", [
        "Use an atomic event-ID claim rather than a check-then-insert race.",
        "Distinguish processing, completed and retryable-failure states.",
        "Retain deduplication records for the sender's replay window.",
      ]],
      ["Acknowledge-then-work ordering", "Record the event durably, answer 2xx, and only then run the handler that may be slow.", [
        "Persist the verified event before returning a success response.",
        "Let a worker perform slow or retryable business processing.",
        "Do not acknowledge an event that would be lost on process exit.",
      ]],
      ["Queue handoff", "Hand the event to a queue so a slow handler cannot cause a delivery timeout.", [
        "Make event persistence and queue publication recoverable together.",
        "Use an outbox when separate writes can fail between systems.",
        "Pass event references instead of oversized queue messages.",
      ]],
      ["Failure classification", "Distinguish a retryable failure from a permanently bad payload before choosing a status code.", [
        "Identify invalid signatures and schemas as permanent request problems.",
        "Treat temporary storage or queue failures as recoverable.",
        "Follow the sender's documented retry interpretation of status codes.",
      ]],
      ["Dead-letter handling", "Park an event that cannot be processed where a person will actually see it.", [
        "Store exhausted events with the reason and attempt history.",
        "Assign an owner to inspect and repair failed deliveries.",
        "Reprocess through the same idempotent business handler.",
      ]],
      ["Replay endpoint", "Re-process a stored event on demand, using the same handler the live delivery used.", [
        "Authorize operators before allowing a stored event to be replayed.",
        "Record who requested the replay and why.",
        "Preserve the original event identity to prevent duplicate effects.",
      ]],
    ],
    "Receiving": [
      ["Endpoint design", "Expose a dedicated route that does one thing and returns quickly.", [
        "Expose a dedicated HTTPS route for the integration.",
        "Keep request processing short and bounded.",
        "Separate webhook authentication from normal browser session flows.",
      ]],
      ["Raw body access", "Read the unparsed body, since signature verification depends on exact bytes.", [
        "Use the provider's exact payload bytes for signature calculation.",
        "Read the body once and reuse the verified buffer.",
        "Parse into a domain object only after authenticity checks.",
      ]],
      ["Status code semantics", "Return 2xx to acknowledge and a retryable status only when a retry would help.", [
        "A 2xx response usually tells the provider delivery succeeded.",
        "Non-success responses may trigger retries under provider-specific rules.",
        "Avoid returning success before the event is durably accepted.",
      ]],
      ["Fast acknowledgement", "Accept the event, then process it outside the request.", [
        "Acknowledge after durable acceptance rather than business completion.",
        "Keep response latency below the provider's timeout.",
        "Monitor worker failures separately from delivery acknowledgement.",
      ]],
      ["Payload validation", "Parse the body against a schema before trusting any field.", [
        "Validate event type, required fields and expected value formats.",
        "Handle unknown event types without unsafe fallback behavior.",
        "Separate schema validity from permission to change a resource.",
      ]],
      ["Content types and encoding", "Handle the encoding the sender actually uses.", [
        "Check the declared content type against supported formats.",
        "Preserve the byte representation used by the signature scheme.",
        "Reject unsupported encodings and oversized decoded payloads.",
      ]],
    ],
    "Verifying": [
      ["Signature verification", "Recompute the HMAC over the raw body and compare in constant time.", [
        "Bind verification to the provider's expected signed message format.",
        "Compare computed signatures with a constant-time method.",
        "Validate the signing secret belongs to the intended endpoint.",
      ]],
      ["Timestamp tolerance", "Reject old requests so a captured payload cannot be replayed later.", [
        "Check signed timestamps against an explicit tolerance window.",
        "Keep receiver clocks synchronized to avoid false rejections.",
        "Never trust an unsigned timestamp as replay evidence.",
      ]],
      ["Secret rotation", "Accept two secrets during a rotation window without downtime.", [
        "Allow a controlled overlap while replacing signing secrets.",
        "Record which configured secret verified the delivery.",
        "Retire old secrets after the provider's transition period.",
      ]],
      ["Replay protection", "Record seen event ids and refuse a repeat of a one-time action.", [
        "Combine signature verification with timestamp and event-ID checks.",
        "Retain seen IDs long enough to cover expected redelivery.",
        "Ensure concurrent duplicates cannot both claim the same operation.",
      ]],
      ["IP allow lists", "Use network restrictions as defence in depth, never as the only check.", [
        "Treat source-IP restrictions as an additional control.",
        "Use the provider's maintained ranges and trusted proxy configuration.",
        "Keep cryptographic verification even when the address is allowed.",
      ]],
      ["mTLS and shared tokens", "Authenticate the sender where signatures are unavailable.", [
        "Use mTLS when both sender and receiver support client certificates.",
        "Rotate shared tokens and send them only over HTTPS.",
        "Avoid placing authentication tokens in logged query strings.",
      ]],
    ],
    "Processing reliably": [
      ["Idempotency keys", "Key the effect on the event id so repeats converge on one outcome.", [
        "Scope the deduplication key to provider, account and event.",
        "Enforce uniqueness atomically in durable storage.",
        "Reuse the same key when invoking an idempotent downstream API.",
      ]],
      ["Queueing the work", "Hand off to a durable queue so the handler stays fast.", [
        "Enqueue validated events with bounded retry and retention settings.",
        "Run business side effects in a separately monitored worker.",
        "Use acknowledgements only after the worker's durable result.",
      ]],
      ["Ordering assumptions", "Design for events arriving out of order, because they will.", [
        "Assume deliveries can arrive late or out of sequence.",
        "Compare resource versions before applying stale events.",
        "Fetch authoritative current state when ordering is ambiguous.",
      ]],
      ["Retry and backoff", "Understand the sender's retry schedule and align your own.", [
        "Use exponential backoff with jitter for transient outbound failures.",
        "Honor Retry-After where the destination defines it.",
        "Stop retrying when the attempt or age budget is exhausted.",
      ]],
      ["Dead letter handling", "Capture events that keep failing instead of losing them.", [
        "Keep unprocessable messages available for diagnosis and controlled replay.",
        "Capture the last error and relevant correlation identifiers.",
        "Alert on growing dead-letter age as well as count.",
      ]],
      ["Replay and backfill", "Reprocess a range of events safely after a bug is fixed.", [
        "Backfill missing events from an authoritative source when available.",
        "Apply the same validation and deduplication rules during replay.",
        "Rate-limit recovery traffic so normal processing remains healthy.",
      ]],
    ],
    "Operating": [
      ["Logging and correlation", "Record the event id end to end so one delivery is traceable.", [
        "Correlate provider event ID, delivery attempt and internal job ID.",
        "Log verification and processing outcomes without secret payload fields.",
        "Preserve enough metadata to trace one event end to end.",
      ]],
      ["Monitoring delivery", "Alert on failure rate and on a sudden absence of events.", [
        "Track acknowledgement latency, failure rate and retry volume.",
        "Monitor backlog age and time to completed business processing.",
        "Alert when accepted events stop making progress.",
      ]],
      ["Local development", "Receive real events on a development machine through a tunnel.", [
        "Use the provider's supported local forwarding or test tooling.",
        "Keep development endpoints and signing secrets separate.",
        "Exercise duplicate deliveries and invalid signatures locally.",
      ]],
      ["Testing handlers", "Test signature rejection and duplicate delivery, not just the happy path.", [
        "Test authentic, malformed, duplicate and reordered event fixtures.",
        "Verify persistence happens before a success acknowledgement.",
        "Simulate worker failures and confirm retry-safe side effects.",
      ]],
      ["Versioning", "Handle a sender's payload version changing under you.", [
        "Track provider API and payload versions explicitly.",
        "Support a migration overlap when old and new shapes coexist.",
        "Reject or quarantine incompatible events with clear diagnostics.",
      ]],
      ["Outbound webhooks", "Send your own events with signatures, retries and a documented contract.", [
        "Sign the exact body sent to each subscribed destination.",
        "Retry delivery under a documented bounded policy.",
        "Validate destination URLs and prevent server-side request forgery.",
      ]],
    ],
  }),

  defineHandbook("Inngest services", "Durable event-driven functions with steps, retries, concurrency, flow control and observability.", "https://www.inngest.com/docs", {
    mechanism: "A function is divided into steps, and each step's result is persisted. When a function resumes after a failure or a sleep, completed steps are not run again — they are replayed from their stored results, so only the failed step retries.",
    example: "An onboarding function sends a welcome email, sleeps three days, then sends a follow-up. If the second email fails, only that step retries; the first is never sent twice, and the three-day wait costs no running process.",
    pitfall: "Code outside a step runs again on every replay. Performing a side effect there — charging a card, sending a message — repeats it each time the function resumes, which is exactly what steps exist to prevent.",
  }, {
    "Hooks": [
      ["useRealtime", "Subscribe a component to a function's realtime channel and topics, using a server-issued token.", [
        "Subscribe with useRealtime from the installed React SDK entry point.",
        "Supply the typed channel, topics and server-issued subscription token.",
        "Handle reconnecting and terminal UI states explicitly.",
      ]],
      ["Subscription tokens", "Mint a short-lived token on the server so the browser never holds the signing key.", [
        "Mint subscription tokens after authenticating the requesting user.",
        "Scope each token to authorized channels and topics.",
        "Keep the application's signing key out of browser code.",
      ]],
      ["step.realtime.publish", "Publish durably from inside a step, so a retry does not send the message twice.", [
        "Publish important state transitions through a durable realtime step.",
        "Give each publish step a stable memoization identifier.",
        "Use ordinary realtime publishing for updates where replay is acceptable.",
      ]],
      ["onFunctionRun", "Middleware that wraps a whole run: attach a logger, a tenant, a trace.", [
        "Attach run-scoped behavior through the SDK's function lifecycle hook.",
        "Add correlation or dependencies to the execution context.",
        "Avoid assuming a hook executes only once across retries.",
      ]],
      ["onStepRun", "Middleware around each step, where per-step timing and context belong.", [
        "Use step lifecycle middleware for timing and tracing step work.",
        "Distinguish executing a step from reusing a saved result.",
        "Make cleanup and instrumentation tolerant of retried execution.",
      ]],
      ["transformInput and transformOutput", "Change what a function receives and returns without editing the function.", [
        "Transform incoming context and outgoing results at documented boundaries.",
        "Preserve the shapes expected by subsequent middleware.",
        "Test ordering when multiple transforms modify the same field.",
      ]],
      ["onSendEvent", "Intercept outgoing events to add metadata or redact fields centrally.", [
        "Observe or transform event publication at the send boundary.",
        "Preserve event names, IDs and validated payload fields.",
        "Do not log secret values while tracing outbound events.",
      ]],
      ["wrapStep", "Wrap step execution itself - the hook to reach for when per-step behaviour must compose.", [
        "Wrap supported step execution through the installed middleware API.",
        "Call the wrapped operation and preserve its result or error.",
        "Keep tracing wrappers compatible with cancellation and retries.",
      ]],
    ],
    "Functions & steps": [
      ["Events and triggers", "Start a function from an event, a schedule or another function.", [
        "Publish an event name and structured data describing what happened.",
        "Match function triggers to the intended event contract.",
        "Include stable domain identifiers for correlation.",
      ]],
      ["Function definition", "Declare an id, a trigger and the handler that runs.", [
        "Give each function a stable ID and explicit trigger configuration.",
        "Keep durable work inside the function's supported step tools.",
        "Configure retries and flow control for its dependencies.",
      ]],
      ["step.run", "Wrap a side effect so its result is stored and never repeated.", [
        "Wrap one retryable unit of work in step.run.",
        "Use a stable step ID within the function's execution path.",
        "Return serializable data needed by later steps.",
      ]],
      ["Step memoization", "Understand replay, and why code outside a step is not safe.", [
        "Completed step results can be reused when a function resumes.",
        "Keep nondeterministic work inside named steps.",
        "Treat changes to step identity as workflow compatibility changes.",
      ]],
      ["step.sleep and sleepUntil", "Pause for a duration or until a moment without holding a process.", [
        "Use durable sleeps instead of keeping a process timer alive.",
        "Choose a duration or absolute wake-up time deliberately.",
        "Account for cancellation while a function is sleeping.",
      ]],
      ["step.waitForEvent", "Suspend until a matching event arrives or a timeout expires.", [
        "Wait for a matching event with an explicit timeout.",
        "Correlate the event to the relevant user or workflow.",
        "Handle the timeout result as a normal alternate path.",
      ]],
    ],
    "Reliability": [
      ["Automatic retries", "Let a failed step retry with backoff instead of failing the function.", [
        "Throw failures that should trigger another attempt.",
        "Keep external side effects idempotent across retries.",
        "Bound retries according to the dependency's failure behavior.",
      ]],
      ["Non-retriable errors", "Signal a permanent failure so the platform stops retrying.", [
        "Use the SDK's non-retriable error for permanent failures.",
        "Separate invalid input from transient network problems.",
        "Include diagnostic context without exposing confidential event data.",
      ]],
      ["Idempotency", "Deduplicate by event key so one logical event runs once.", [
        "Choose an idempotency expression tied to the business operation.",
        "Understand the configured deduplication window and scope.",
        "Enforce unique side effects in the destination system too.",
      ]],
      ["Failure handlers", "React when a function exhausts its retries.", [
        "Handle exhausted function failures through the supported failure path.",
        "Include the original event and run identity in diagnosis.",
        "Make alerting or compensation safe to retry itself.",
      ]],
      ["Cancellation", "Stop an in-flight function when a cancelling event arrives.", [
        "Cancel obsolete runs when a matching business event arrives.",
        "Scope cancellation to the correct entity or workflow.",
        "Design already-completed side effects to remain consistent.",
      ]],
      ["Timeouts", "Bound how long a step and a function may take.", [
        "Set start and execution deadlines appropriate to the workflow.",
        "Distinguish waiting for capacity from running too long.",
        "Report timed-out work with enough context for recovery.",
      ]],
    ],
    "Flow control": [
      ["Concurrency limits", "Cap parallel runs globally or per key such as per customer.", [
        "Limit active work by function or an appropriate keyed scope.",
        "Protect database and provider capacity from event bursts.",
        "Monitor queueing time as well as execution time.",
      ]],
      ["Throttling and rate limiting", "Respect a downstream API's limits from inside the function.", [
        "Throttling smooths work over time instead of starting it all at once.",
        "Rate limits reject or suppress starts according to configured policy.",
        "Choose keys so one tenant cannot consume every allocation.",
      ]],
      ["Debounce", "Collapse a burst of events into a single run.", [
        "Collapse repeated events within a configured quiet period.",
        "Key debounce by the entity whose updates supersede each other.",
        "Avoid debouncing events that each require an independent side effect.",
      ]],
      ["Batching", "Process events in groups to amortize a costly operation.", [
        "Collect related events into a bounded processing batch.",
        "Choose batch size and timeout to balance latency and throughput.",
        "Handle partial failures without losing successful event results.",
      ]],
      ["Priority", "Run urgent work ahead of background work in the same queue.", [
        "Assign priority from trusted event or application attributes.",
        "Prevent low-priority jobs from starving indefinitely.",
        "Confirm priority behavior within the configured concurrency scope.",
      ]],
      ["Fan-out", "Trigger many functions from one event without coupling them.", [
        "Split independent work into separately tracked steps or events.",
        "Bound fan-out so downstream quotas remain respected.",
        "Collect child outcomes before declaring the parent operation complete.",
      ]],
    ],
    "Development & operation": [
      ["Local dev server", "Run and inspect functions locally against real event payloads.", [
        "Connect the development server to the local serve endpoint.",
        "Send representative events and inspect run traces.",
        "Keep local test events separate from production event traffic.",
      ]],
      ["Serving the handler", "Expose functions through a route in your framework.", [
        "Expose the framework-specific Inngest serve handler.",
        "Register the intended function list at that endpoint.",
        "Configure signing and environment keys for deployed execution.",
      ]],
      ["Event schemas", "Type events so producers and consumers agree on the payload.", [
        "Validate event names and payload fields at the producer boundary.",
        "Version contracts when consumers need incompatible data shapes.",
        "Remember static types do not validate untrusted runtime JSON.",
      ]],
      ["Observability", "Trace a run step by step and see exactly where it failed.", [
        "Trace events into function runs and individual steps.",
        "Compare queue delays, retry counts and dependency latency.",
        "Attach business identifiers while keeping logs appropriately redacted.",
      ]],
      ["Replay", "Re-run historical events after fixing a bug.", [
        "Replay a known event or run to diagnose recovery behavior.",
        "Confirm whether memoized results or side effects will be reused.",
        "Keep replayed operations idempotent and auditable.",
      ]],
      ["Environments", "Separate branch, staging and production event streams.", [
        "Separate development, preview and production credentials and data.",
        "Register functions against the matching environment.",
        "Verify event routing before promoting a deployment.",
      ]],
    ],
  }),

  defineHandbook("Arcjet", "Bot detection, rate limiting, abuse prevention, validation and security rules in application code.", "https://docs.arcjet.com/", {
    mechanism: "Rules run inside your application rather than at a separate edge, so a decision can use what the request already proved — the signed-in user, the plan, the route. Each rule returns a decision you choose to enforce or only record.",
    example: "A signup route runs bot detection, a per-IP rate limit and email validation in one call. New rules ship in dry-run mode first, so the logs show what would have been blocked before anything actually is.",
    pitfall: "Rate limiting by IP alone punishes shared networks and misses distributed abuse. Keying on the authenticated user where one exists, and falling back to IP only for anonymous traffic, is what makes the limit meaningful.",
  }, {
    "Extension points": [
      ["aj.protect", "The single call that evaluates every configured rule against a request and returns a decision.", [
        "Await aj.protect before performing the protected operation.",
        "Pass the request and any fields required by configured rules.",
        "Branch on the returned decision before continuing the handler.",
      ]],
      ["defineCustomRule", "Supply your own evaluate function, returning ALLOW or DENY from data the SDK cannot know.", [
        "Define the rule's validation and decision behavior explicitly.",
        "Return the result shape required by the installed SDK.",
        "Test allowed, denied and unexpected-input cases.",
      ]],
      ["withRule", "Add a rule for one route on top of the client's shared configuration.", [
        "Derive a client with additional rules for a specific route.",
        "Keep shared baseline rules on the original client.",
        "Avoid leaking one request's dynamic configuration into another.",
      ]],
      ["Decision inspection", "Read conclusion and reason to decide what to return, rather than trusting a boolean.", [
        "Inspect the conclusion and reason instead of guessing from status text.",
        "Review individual rule results when several protections run.",
        "Distinguish denied requests from protection-service errors.",
      ]],
      ["hasFailedOpen and errorResults", "Detect a request that was allowed only because a rule could not be evaluated.", [
        "Detect failed-open protection instead of treating it as a clean allow.",
        "Inspect error results to identify rules that could not complete.",
        "Apply the route's documented fallback policy and record the failure.",
      ]],
      ["Result inspectors", "Helpers such as isSpoofedBot examine the results a rule produced, after the decision.", [
        "Use supported inspectors to narrow individual rule-result types.",
        "Check bot verification or other specialized results explicitly.",
        "Do not cast every result to the same rule shape.",
      ]],
      ["DRY_RUN mode", "Run a rule in logging mode first and read what it would have blocked before turning it live.", [
        "Run new protections in DRY_RUN to observe proposed denials.",
        "Review false positives before changing enforcement to LIVE.",
        "Track dry-run findings separately from blocked traffic.",
      ]],
    ],
    "Core model": [
      ["Protect calls", "Evaluate configured rules at a point in a request handler.", [
        "Create and reuse a configured Arcjet client for the application.",
        "Supply route-specific request cost and identification fields.",
        "Place protection ahead of expensive database or model calls.",
      ]],
      ["Decisions and conclusions", "Read whether a request is allowed, denied or merely flagged.", [
        "An allowed conclusion is distinct from a denial or evaluation error.",
        "Use the decision reason to select an appropriate HTTP response.",
        "Preserve the decision identifier for troubleshooting.",
      ]],
      ["Dry run mode", "Observe what a rule would do before enforcing it.", [
        "Compare would-be denials with legitimate application traffic.",
        "Test unusual clients before enabling blocking behavior.",
        "Promote each tuned rule to enforcement deliberately.",
      ]],
      ["Rule composition", "Combine several rules and understand which decision wins.", [
        "Combine bot, rate-limit and Shield rules as needed.",
        "Give each rule an explicit mode and configuration.",
        "Inspect the combined decision and its per-rule evidence.",
      ]],
      ["Characteristics", "Key a rule on user, API key or another stable identifier.", [
        "Define the attributes that identify one rate-limit subject.",
        "Prefer authenticated user identity when limits are per account.",
        "Trust proxy-derived IP information only from configured proxies.",
      ]],
      ["Framework integration", "Add protection in Next.js, Node, Bun or Deno handlers.", [
        "Use the adapter matching the framework's request object.",
        "Keep the Arcjet secret key in server-only configuration.",
        "Verify behavior in the deployed runtime as well as local development.",
      ]],
    ],
    "Rules": [
      ["Bot detection", "Distinguish automated clients and allow the ones you want.", [
        "Allow intended bot categories rather than trusting a user-agent string.",
        "Inspect available verification signals for claimed known bots.",
        "Separate unwanted automation from legitimate monitoring or previews.",
      ]],
      ["Rate limiting algorithms", "Choose fixed window, sliding window or token bucket for the traffic shape.", [
        "Use token buckets to permit a controlled burst of requests.",
        "Use fixed or sliding windows for interval-based quotas.",
        "Match request cost and identity scope to the protected resource.",
      ]],
      ["Shield", "Detect common attack patterns against the application.", [
        "Evaluate request signals before vulnerable application processing.",
        "Combine Shield with normal input validation and authorization.",
        "Review detected attacks without logging sensitive request bodies.",
      ]],
      ["Email validation", "Reject disposable or undeliverable addresses at signup.", [
        "Check address syntax and supported risk signals at signup.",
        "Decide whether disposable or other address categories are acceptable.",
        "Keep email ownership confirmation as a separate step.",
      ]],
      ["Sensitive information detection", "Catch secrets or personal data in request payloads.", [
        "Choose which sensitive entity types to detect in supplied text.",
        "Apply the configured redaction or denial action before downstream use.",
        "Test domain-specific false positives with representative samples.",
      ]],
      ["Custom rules", "Express an application-specific policy alongside the built-ins.", [
        "Express application-specific conditions using the supported rule contract.",
        "Keep custom checks deterministic and bounded in execution time.",
        "Document what happens when the custom evaluator fails.",
      ]],
    ],
    "Operating": [
      ["Choosing a key", "Prefer an authenticated identity over a raw IP address.", [
        "Use the protected resource's owner as the limit subject.",
        "Avoid a shared IP limit unintentionally grouping unrelated users.",
        "Prevent callers from freely choosing another user's identifier.",
      ]],
      ["Handling denials", "Return a clear status and message rather than a silent failure.", [
        "Return 429 for rate-limit denials when appropriate.",
        "Use a generic refusal for other blocked requests.",
        "Avoid exposing rule internals that help attackers tune requests.",
      ]],
      ["Local and CI behaviour", "Keep rules from blocking development and test runs.", [
        "Exercise allow, deny and error branches with controlled fixtures.",
        "Account for local addresses and missing production proxy headers.",
        "Keep CI keys and rule modes distinct from production.",
      ]],
      ["Logging and tuning", "Use recorded decisions to adjust thresholds before enforcing.", [
        "Correlate rule decisions with route, account and request identifiers.",
        "Review denial trends and legitimate-user complaints together.",
        "Exclude secrets and unnecessary personal data from diagnostics.",
      ]],
      ["Performance", "Understand the latency a decision adds to a request.", [
        "Reuse the client and avoid repeating protection calls unnecessarily.",
        "Measure added request latency under realistic traffic.",
        "Set a deliberate failure policy for latency-sensitive endpoints.",
      ]],
      ["Layered defence", "Treat application rules as one layer beside platform protections.", [
        "Combine application protections with authentication and resource permissions.",
        "Keep infrastructure-level filtering and application rules complementary.",
        "Reassess controls when a new endpoint exposes a costly operation.",
      ]],
    ],
  }),

  defineHandbook("Payment gateway integration", "Checkout, webhooks, idempotency, refunds, subscriptions, reconciliation and compliance.", "https://docs.stripe.com/payments", {
    mechanism: "The browser never sends card details to your server; it sends them to the gateway and receives a token or a redirect. Your server confirms the outcome through a webhook, because the customer's browser may close before it returns.",
    example: "Checkout creates a session server-side with an idempotency key, the customer pays on the gateway's page, and the order is fulfilled from the webhook rather than the success redirect — so a closed tab still ships the order.",
    pitfall: "Fulfilling on the success redirect loses every payment where the customer closed the tab, and trusts a URL the customer controls. The webhook is the only authoritative signal that money moved.",
  }, {
    "Payment flow": [
      ["Hosted checkout", "Redirect to the gateway's page so card data never reaches your server.", [
        "The browser leaves for the gateway's page, so card data never touches your server.",
        "Keeping card data out is what keeps your compliance scope small.",
        "Branding and flow control are limited to what the gateway exposes.",
      ]],
      ["Payment intents", "Model a payment as an object that moves through explicit states.", [
        "A payment is an object moving through explicit, inspectable states.",
        "State on the gateway is the truth; your record is a mirror of it.",
        "A state your code does not handle stalls the order silently.",
      ]],
      ["Client-side elements", "Embed gateway-hosted fields while keeping your own layout.", [
        "Gateway-hosted fields embed inside your own layout.",
        "The sensitive input lives in the gateway's frame, not in your DOM.",
        "Styling is constrained, because you cannot reach inside that frame.",
      ]],
      ["Authentication and 3-D Secure", "Handle the extra verification step regulations may require.", [
        "An extra verification step is handled where regulation requires it.",
        "The flow can interrupt at any point, so the code path is not linear.",
        "Treating a challenge as a failure loses payments that would have succeeded.",
      ]],
      ["Currencies and amounts", "Store amounts in minor units and avoid floating point entirely.", [
        "Amounts are stored in minor units, never as floating point.",
        "Floating point makes a total that is a fraction of a cent wrong.",
        "Currencies differ in how many minor units they have, so the divisor is not always a hundred.",
      ]],
      ["Payment methods", "Support cards, wallets and local methods per market.", [
        "Cards, wallets and local methods are supported per market.",
        "The method a market expects is often not a card at all.",
        "Each method has its own settlement time and its own refund rules.",
      ]],
    ],
    "Correctness": [
      ["Idempotency keys", "Send a key so a retried create cannot charge twice.", [
        "A key makes a retried create safe rather than a second charge.",
        "Network failure after a request is indistinguishable from failure before it.",
        "The key must be derived from the attempt, not generated per retry.",
      ]],
      ["Webhook fulfilment", "Treat the webhook as the authoritative completion signal.", [
        "The webhook is the authoritative signal that the payment completed.",
        "A browser redirect can be closed, blocked or forged; the webhook cannot.",
        "Fulfilling on redirect alone loses orders whenever the user closes the tab.",
      ]],
      ["Signature verification", "Verify every webhook before acting on it.", [
        "Every webhook is verified before anything acts on it.",
        "An unverified endpoint is one anyone on the internet may post to.",
        "Verification uses the raw body, so parsing before checking breaks it.",
      ]],
      ["Duplicate event handling", "Make fulfilment safe to run more than once.", [
        "Fulfilment is safe to run more than once.",
        "Delivery is at least once, so a repeat is expected, not exceptional.",
        "Keying on the event id is what makes the repeat a no-op.",
      ]],
      ["Order state machine", "Model pending, paid, failed and refunded as explicit states.", [
        "Pending, paid, failed and refunded are modelled as explicit states.",
        "Explicit states are what make an inconsistent order visible.",
        "A transition the machine does not allow is a bug caught rather than applied.",
      ]],
      ["Race conditions", "Handle a webhook arriving before your own record is written.", [
        "A webhook can arrive before your own record has been written.",
        "The gateway does not wait for your database to commit.",
        "Creating the record on demand from the webhook is what survives the race.",
      ]],
    ],
    "Lifecycle operations": [
      ["Refunds", "Issue full and partial refunds and reflect them in your records.", [
        "Full and partial refunds are issued and reflected in your own records.",
        "A refund on the gateway that your ledger does not know about is a discrepancy.",
        "Refunding more than was captured is refused, so partials must be tracked.",
      ]],
      ["Disputes and chargebacks", "Respond to a dispute and account for the reversal.", [
        "A dispute is answered and the reversal accounted for.",
        "The money is taken back immediately, before the dispute is decided.",
        "Evidence must be submitted inside a window that is short and fixed.",
      ]],
      ["Subscriptions", "Model recurring billing, trials, upgrades and proration.", [
        "Recurring billing, trials, upgrades and proration are modelled.",
        "Proration is what makes a mid-cycle change charge the right amount.",
        "A plan change alters future invoices, not the one already issued.",
      ]],
      ["Failed payments and dunning", "Retry a failed renewal and communicate before cancelling.", [
        "A failed renewal is retried and communicated before access ends.",
        "Most renewal failures are temporary and succeed on a later attempt.",
        "Cancelling on the first failure loses customers who would have paid.",
      ]],
      ["Invoices and receipts", "Produce documents that match what was actually charged.", [
        "Documents match what was actually charged.",
        "A receipt that disagrees with the charge is a support case and a compliance risk.",
        "An issued invoice is a record, so a correction is a credit note rather than an edit.",
      ]],
      ["Cancellation", "End a subscription at the right moment for billing and access.", [
        "A subscription ends at the right moment for both billing and access.",
        "Ending access immediately on a paid period is a refund the customer did not get.",
        "Cancel-at-period-end and cancel-now are different promises.",
      ]],
    ],
    "Operating & compliance": [
      ["Reconciliation", "Compare gateway settlement against your own ledger regularly.", [
        "Gateway settlement is compared against your own ledger regularly.",
        "Fees, refunds and disputes mean the payout never equals the order total.",
        "A discrepancy found monthly is cheaper than one found at audit.",
      ]],
      ["Test mode and fixtures", "Exercise success, failure and dispute paths before going live.", [
        "Success, failure and dispute paths are exercised before going live.",
        "Only the failure paths reveal whether the state machine is complete.",
        "Test mode has its own keys and its own data, entirely separate from live.",
      ]],
      ["Key management", "Separate publishable and secret keys and rotate them safely.", [
        "Publishable and secret keys are separated and rotated safely.",
        "A secret key in the client bundle is a full compromise of the account.",
        "Rotation needs both keys valid briefly, or the swap causes an outage.",
      ]],
      ["PCI scope", "Keep card data out of your systems so scope stays minimal.", [
        "Card data is kept out of your systems so scope stays minimal.",
        "Scope is decided by what touches card data, not by what stores it.",
        "Logging a full card number pulls your logs into scope.",
      ]],
      ["Taxes and regional rules", "Apply the tax and disclosure rules a market requires.", [
        "Each market's tax and disclosure rules are applied.",
        "Tax depends on where the customer is, not where the business is.",
        "Displaying a price without the required tax treatment is a legal problem.",
      ]],
      ["Audit logging", "Record who changed a price, a refund or a subscription, and when.", [
        "Who changed a price, a refund or a subscription is recorded, and when.",
        "Money changes need attribution, because they will eventually be questioned.",
        "A log the application can edit is not evidence of anything.",
      ]],
    ],
  }),
];
