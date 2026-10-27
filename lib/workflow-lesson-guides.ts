import type { WorkflowNodeKind } from "./landing-workflows-shape";

type Stage = [label: string, kind: WorkflowNodeKind];
export type WorkflowLessonGuide = {
  stages: [Stage, Stage, Stage, Stage];
  sections: { title: string; body: string; example: string }[];
  verify: string[];
};

/** Original in-app teaching notes; source attribution is retained by each lesson. */
export const WORKFLOW_LESSON_GUIDES: Record<string, WorkflowLessonGuide> = {
  "architecture-review": {
    stages: [["Requirements\nload and latency", "actor"], ["Service boundary\nAPI and queue", "service"], ["Data strategy\nconsistency", "store"], ["Failure drill\nmeasure recovery", "decision"]],
    sections: [
      { title: "Start with an invariant", body: "An architecture is useful when it protects a concrete requirement. Write down what must remain true under concurrency, then separate that from performance targets. A checkout may tolerate a delayed email but must not silently charge twice.", example: "For an order API, use an operation ID to distinguish one purchase retried three times from three separate purchases." },
      { title: "Follow the request and the failure", body: "Draw the normal request path, then remove one dependency at a time. Decide which failures reject work, which can wait in a queue, and which can use bounded stale data. Every queue needs a limit and a recovery owner.", example: "When notifications fail, preserve the order and retry delivery asynchronously. When inventory cannot be reserved, do not report a confirmed order." },
      { title: "Measure before adding components", body: "Compare the baseline with the proposed design using the same workload. Check tail latency, error rate and recovery time as well as cost. More replicas or caches introduce additional consistency and operational work.", example: "Simulate peak traffic followed by a database restart. Record failed requests and time to restore normal service." },
    ],
    verify: ["Duplicate requests produce one business effect.", "A dependency failure has a documented response.", "Load and recovery results meet explicit targets."],
  },
  "langchain-tool-agent": {
    stages: [["User message\nvalidated request", "actor"], ["Agent harness\nmodel and tools", "llm"], ["Tool observation\nchecked evidence", "tool"], ["Structured result\nschema and rules", "decision"]],
    sections: [
      { title: "Define the tool before the prompt", body: "A good tool performs one clear operation with typed inputs and bounded output. The model proposes arguments; application code checks identity, permissions and business rules before executing them.", example: "A stock lookup accepts a product ID and returns availability. It obtains tenant identity from trusted runtime context." },
      { title: "Treat the agent as a bounded loop", body: "The model chooses a tool, receives an observation and decides whether it can answer. Provide useful descriptions, handle failures explicitly and limit calls so a missing product does not lead to endless searches.", example: "Return a structured not-found observation and require the final answer to acknowledge missing evidence." },
      { title: "Validate meaning as well as shape", body: "Structured output makes results easier to consume, but a valid schema can still contain unsupported values. Check the answer against tool evidence and domain constraints before displaying or using it.", example: "A quantity must be nonnegative and match the lookup result, even when the model returned valid JSON." },
    ],
    verify: ["Unknown products are reported as unknown.", "Unauthorized tool arguments are rejected.", "The run ends within its call budget."],
  },
  "langgraph-resume": {
    stages: [["Thread input\nowned identity", "actor"], ["Graph nodes\nstate updates", "service"], ["Checkpoint\ndurable snapshot", "store"], ["Review and resume\nvalidated decision", "decision"]],
    sections: [
      { title: "Separate state from external effects", body: "Graph state records progress, while an external tool may modify a different system. A saved checkpoint does not automatically make that modification exactly once. Use operation identifiers for repeatable writes.", example: "Store a ticket operation ID before creating the ticket and reuse it when the worker retries." },
      { title: "Make persistence deliberate", body: "Choose a durable checkpointer for restart recovery and assign thread IDs according to the intended conversation or job. Verify ownership before reading or continuing a thread.", example: "Two unrelated customer requests receive different thread IDs even if their text is identical." },
      { title: "Resume the proposed action", body: "A review pause must preserve the concrete proposed change. Validate the reviewer and resume value against that proposal. Code before an interrupt may execute again, so do not place unsafe repeated effects there.", example: "An approval for draft A cannot authorize draft B after the graph changes its contents." },
    ],
    verify: ["A restarted worker can retrieve the checkpoint.", "A repeated resume does not duplicate the external write.", "A user cannot resume another user's thread."],
  },
  "langflow-api": {
    stages: [["Flow inputs\ntyped values", "actor"], ["Components\nmodel and logic", "llm"], ["Workflow API\nexecution mode", "service"], ["Client result\nvalidated output", "decision"]],
    sections: [
      { title: "Read ports as contracts", body: "A visual connection carries a value with a type. Inspect whether the next component expects a message, text or structured data. Convert explicitly instead of assuming every output is a string.", example: "Format selected fields from retrieved data before inserting them into a prompt template." },
      { title: "Move from editor to service", body: "Save the flow and invoke its supported Workflow API with authenticated inputs. Choose synchronous, streaming or background execution according to the interaction's duration and progress needs.", example: "Use a background execution reference for a long job and show its eventual completion instead of holding the browser request open." },
      { title: "Test the deployed contract", body: "A flow that works in the editor can still fail because deployment credentials, component versions or input mappings differ. Use the same representative fixtures in the editor and through the API.", example: "Compare a normal request, a missing required input and a model timeout across both entry points." },
    ],
    verify: ["Input and output types match connected components.", "API credentials remain on the server.", "The client distinguishes acceptance, progress and completion."],
  },
  "langsmith-regression": {
    stages: [["Dataset\nreviewed examples", "store"], ["Experiment\nversioned application", "service"], ["Evaluators\nrubric and checks", "decision"], ["Trace review\nrelease decision", "actor"]],
    sections: [
      { title: "Build a representative dataset", body: "Include ordinary tasks and failure cases, with expected behavior where it can be specified. Keep holdout examples separate from those repeatedly used for tuning so improvements are not merely memorized cases.", example: "A support dataset includes answerable tickets, unknown products and permission-denied tool results." },
      { title: "Choose the right evaluator", body: "Use executable checks for exact properties and a calibrated rubric for subjective qualities. A model judge is a measurement tool with limitations; compare its decisions with human review.", example: "Check schema validity in code, then separately assess whether the response is supported by the supplied evidence." },
      { title: "Investigate regressions by trace", body: "Run baseline and candidate configurations on the same examples. Inspect individual failures and important slices alongside averages, then examine the trace to locate the responsible model or tool step.", example: "A higher average score does not justify releasing a candidate that fails every authorization edge case." },
    ],
    verify: ["Experiments record their model and prompt configuration.", "Critical failure cases are reviewed individually.", "Quality is considered alongside latency and cost."],
  },
  "n8n-ai-routing": {
    stages: [["Trigger\nevent or chat", "actor"], ["Normalize\nvalidate items", "service"], ["AI and tools\nclassify request", "llm"], ["Review queue\nauthorized action", "queue"]],
    sections: [
      { title: "Inspect the incoming items", body: "Before adding AI, inspect the event shape and map only the fields the workflow needs. Missing values and changed item counts can break later branches even when the editor connection appears correct.", example: "Normalize each ticket into an ID, message and authenticated account context before classification." },
      { title: "Bound the AI decision", body: "Connect the agent to a model and a narrow tool set. Validate the classification or structured result before selecting a downstream business action. Treat generated text as a proposal.", example: "Route an unknown category into review rather than letting arbitrary generated category names choose destinations." },
      { title: "Design for repeated delivery", body: "Webhooks and API calls can be repeated after a lost response. Use stable external identifiers and a deliberate retry policy. Error handling should preserve enough context for an owner to recover safely.", example: "The same ticket event arriving twice updates one ticket instead of creating two customer replies." },
    ],
    verify: ["Malformed tickets reach an explicit failure path.", "Duplicate events do not duplicate writes.", "An outbound draft is reviewed before sending."],
  },
  "python-agent-io": {
    stages: [["Typed request\nvalidated inputs", "actor"], ["Async tasks\nbounded fan-out", "service"], ["Tool results\ntimeout handling", "tool"], ["Agent context\nchecked evidence", "llm"]],
    sections: [
      { title: "Separate waiting from computation", body: "Async functions allow network waits to share an event loop. Blocking I/O or heavy computation still prevents other tasks from progressing unless moved to an appropriate execution strategy.", example: "Run independent network lookups concurrently, but do not perform a large synchronous document transform inside the event loop." },
      { title: "Make task lifetimes explicit", body: "Use structured concurrency, an overall deadline and a concurrency bound. On failure, clean up resources and preserve cancellation rather than swallowing it and allowing work to continue unseen.", example: "If one required lookup fails, cancel sibling tasks and report that the combined result is unavailable." },
      { title: "Validate at the tool boundary", body: "Type hints help development but do not validate incoming model arguments. Check schema and domain rules before execution, then return bounded results that are safe to include in context.", example: "Reject an excessive requested result limit before contacting the database, even if the value is an integer." },
    ],
    verify: ["Concurrency stays within the configured limit.", "A timeout releases network resources.", "Invalid arguments never reach the external operation."],
  },
  "agentic-terms": {
    stages: [["Goal\ncompletion criteria", "actor"], ["Context\nevidence and state", "store"], ["Action\nvalidated tool call", "tool"], ["Observation\nanswer or continue", "decision"]],
    sections: [
      { title: "Follow one concrete run", body: "Start with a goal and identify the model's inputs, proposed tool arguments, returned observation and final response. This makes the vocabulary tangible and separates generated claims from externally observed results.", example: "A product assistant searches by ID, receives a stock record and answers using that record's quantity." },
      { title: "Distinguish the stores of information", body: "Context is what the model sees now. State tracks execution. Memory retains selected information for later use. A checkpoint saves execution progress; it does not verify that the agent's answer is correct.", example: "A conversation thread may retain recent messages while a separate store keeps an explicitly saved user preference." },
      { title: "Recognize the trust boundary", body: "Tools execute in application code, not inside the model's authority. Retrieved documents and tool results are evidence, not permission to change policies or access unrelated resources.", example: "A retrieved page asking the assistant to reveal a secret must not change the tool's authorization checks." },
    ],
    verify: ["Each answer claim can be connected to evidence.", "Tool permissions are enforced outside the model.", "Completion and abstention conditions are explicit."],
  },
  "nextjs-ai-routing": {
    stages: [["React interface\nmessage and cancel", "actor"], ["Next.js server\nauth and validation", "service"], ["Provider route\nOpenRouter / Gateway", "llm"], ["Response stream\npersist and display", "service"]],
    sections: [
      { title: "Keep the provider boundary on the server", body: "The UI submits a validated user request to a server endpoint. The server authenticates the caller, authorizes conversation access and constructs trusted instructions before invoking the provider.", example: "The browser sends a message and conversation ID, never a privileged provider key or an arbitrary system prompt." },
      { title: "Treat routes as separate configurations", body: "OpenRouter and Vercel AI Gateway are alternative routing services with their own credentials and capabilities. Verify tools, structured responses and streaming on every configured model and fallback.", example: "A model that answers plain text successfully may still be unsuitable for a workflow requiring a specific tool schema." },
      { title: "Represent partial progress honestly", body: "Streaming improves perceived responsiveness but introduces interrupted results. Propagate cancellation where supported, preserve stable message IDs and distinguish partial output from a completed answer.", example: "After a disconnect, retrieve authoritative message status rather than appending a fresh generation to an unknown partial response." },
    ],
    verify: ["Secrets never appear in client props or requests.", "Users cannot load another conversation.", "Fallback models meet the same required capability contract."],
  },
  "react19-actions": {
    stages: [["Form input\nuser intent", "actor"], ["Action\npending state", "service"], ["Authoritative result\nvalidation", "store"], ["Reconciled UI\nsuccess or error", "decision"]],
    sections: [
      { title: "Model the submission states", body: "A form needs a value, a pending state and a result that distinguishes success from validation failure. useActionState connects an Action with its returned state so the UI can represent these outcomes.", example: "A feedback form shows a pending button and preserves the user's text when the server rejects the submission." },
      { title: "Use optimism as a temporary view", body: "useOptimistic can show an anticipated result while the Action runs. Confirmed state remains authoritative; a failed request must reconcile the optimistic view instead of leaving false success visible.", example: "Show a pending feedback entry, then replace it with the saved record or remove it and display the error." },
      { title: "Test the slow and failed paths", body: "Delay the response and trigger validation errors. Check focus, repeated submissions and status announcements. Fast successful requests alone do not reveal whether the form is understandable under real conditions.", example: "Submit invalid feedback during a simulated delay and confirm the button and error message reflect the actual result." },
    ],
    verify: ["Pending and completed states are distinct.", "Failed submissions do not retain false optimistic success.", "Validation errors remain understandable to keyboard users."],
  },
  "agentic-patterns": {
    stages: [["Research brief\nbounded objective", "actor"], ["Workers\nindependent evidence", "llm"], ["Synthesis\nsource provenance", "service"], ["Evaluator\naccept or revise", "decision"]],
    sections: [
      { title: "Choose the simplest execution pattern", body: "Use an explicit sequence for known steps, routing for specialized cases and parallel work for independent subtasks. Model-directed behavior is useful where intermediate evidence changes the next action.", example: "Collect independent sources concurrently, but wait for those results before synthesizing the research brief." },
      { title: "Control what workers receive", body: "Give each worker a bounded task, relevant evidence and a result contract. Preserve provenance and check outputs before aggregation. Adding more agents does not automatically improve correctness.", example: "Ask one worker to extract product constraints and another to compare alternatives, then reconcile conflicting claims." },
      { title: "Make evaluation terminate", body: "A revision loop needs explicit acceptance criteria and a maximum budget. Use executable checks or independent evidence where possible; repeated self-review is not proof of correctness.", example: "After two unsuccessful revisions, report missing evidence and request review instead of making a stronger unsupported claim." },
    ],
    verify: ["Workers cannot exceed their scope or call budget.", "Claims preserve source provenance.", "Unresolved revisions terminate with a useful status."],
  },
  "integrated-agent-workflow": {
    stages: [["n8n event\nvalidate and dedupe", "actor"], ["LangGraph\nLangChain execution", "llm"], ["Langflow service\nHTTP processing", "service"], ["LangSmith review\nresult to n8n", "decision"]],
    sections: [
      { title: "Assign one owner to execution", body: "Use n8n for event integration and a graph service for durable agent execution. A Langflow flow can serve a specialized HTTP operation; LangSmith observes and evaluates supported calls. This is a proposed integration architecture, not an automatic connector between every pair.", example: "A support event enters n8n, calls the graph service and receives an execution reference while processing continues." },
      { title: "Define the cross-service contract", body: "Carry a stable business operation ID, authenticated tenant context and versioned payloads. Validate at every boundary. Thread IDs locate saved graph state, while trace IDs identify observed runs; neither grants authorization.", example: "A repeated n8n webhook returns the existing ticket job instead of starting a second independent agent run." },
      { title: "Recover without repeating effects", body: "Choose the authoritative retry policy, make writes idempotent and persist pending approvals. Propagate correlation identifiers for diagnosis, then turn confirmed failures into evaluation fixtures.", example: "Restart the graph worker after ticket creation but before acknowledgment; recovery must find the existing ticket rather than create another." },
    ],
    verify: ["Duplicate events produce one business outcome.", "A service failure has a bounded recovery path.", "The same correlation ID connects the event, job and diagnostic records."],
  },
};
