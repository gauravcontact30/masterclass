import { topics } from "./shared";

export const LANGGRAPH_TOPICS = topics({
  "Graph foundations": [
    ["LangGraph architecture", "Model a workflow as state, nodes and transitions running on a durable execution engine.", [
        "Work is a graph of nodes over a shared state, not a linear chain.",
        "The graph is data, which is what makes the path inspectable and resumable.",
        "A chain cannot express a cycle; a graph is defined by being able to.",
      ]],
    ["StateGraph", "Define a state schema, register nodes and compile the graph before invoking it.", [
        "Nodes, edges and a state schema are declared, then compiled into a runnable.",
        "The schema is the contract every node reads and writes through.",
        "A node that returns something outside the schema is dropped, not merged.",
      ]],
    ["START and END", "Declare entry and terminal transitions so every execution path has a clear lifecycle.", [
        "Two sentinel nodes mark where execution enters and leaves.",
        "They make entry and exit explicit rather than implied by declaration order.",
        "A path with no route to END runs until a limit stops it.",
      ]],
    ["Nodes and partial updates", "Return explicit state updates from a node instead of mutating shared state implicitly.", [
        "A node returns only the keys it changed.",
        "Partial updates are what let parallel nodes touch the same state safely.",
        "Returning the whole state overwrites what a sibling just wrote.",
      ]],
    ["Static edges", "Connect deterministic stages whose next step is known before execution.", [
        "A fixed edge always routes from one node to the next.",
        "Fixed routing is the part of the graph that needs no reasoning at runtime.",
        "Every static edge is a decision taken at build time, not per run.",
      ]],
    ["Conditional edges", "Route from validated state and handle every expected decision outcome.", [
        "A function inspects state and chooses the next node.",
        "The choice is ordinary code, so it is testable without a model.",
        "Returning a name that is not a node fails at run time, not at compile time.",
      ]],
    ["Graph compilation", "Check graph structure and attach persistence and runtime options before execution.", [
        "Compiling validates the structure and produces something executable.",
        "Validation at compile time catches an unreachable or dangling node.",
        "The compiled graph is where the checkpointer and limits are attached.",
      ]],
    ["Graph visualization", "Inspect the graph topology to spot missing terminal paths and unintended cycles.", [
        "The compiled graph renders as a diagram of its nodes and edges.",
        "Seeing the shape is what reveals a branch nobody meant to add.",
        "The diagram shows structure, not which path a given run took.",
      ]],
  ],
  "State & reducers": [
    ["Typed state schemas", "Specify state fields and distinguish Python and TypeScript schema conventions.", [
        "State is declared with types the nodes are checked against.",
        "Typing the state is what makes a node's contract explicit.",
        "Untyped state turns every node into an assumption about its neighbours.",
      ]],
    ["Input and output schemas", "Expose a narrow public contract while retaining internal workflow state.", [
        "What enters and leaves the graph can differ from the internal state.",
        "Separating them keeps working state out of the public result.",
        "Without the split, internal channels leak to every caller.",
      ]],
    ["Reducers", "Define how multiple updates to the same channel combine across execution steps.", [
        "A reducer decides how an update combines with existing state.",
        "Combination, not replacement, is what makes concurrent writes meaningful.",
        "The default overwrites, which silently loses one of two parallel updates.",
      ]],
    ["MessagesState and add_messages", "Accumulate conversation messages with identity-aware updates rather than blind concatenation.", [
        "A prepared state and reducer append messages rather than replace them.",
        "Appending is what keeps a conversation accumulating correctly.",
        "It also handles matching updates by id, which naive appending does not.",
      ]],
    ["Parallel state updates", "Provide suitable reducers when concurrently executing nodes write to a shared field.", [
        "Nodes running together each contribute a partial update.",
        "A reducer is required, or the last writer simply wins.",
        "Two nodes writing the same key without one is a lost update.",
      ]],
    ["Runtime context", "Supply request dependencies and identity outside model-visible mutable state.", [
        "Per-run dependencies and identity are supplied outside the state.",
        "Keeping them out of state stops them being checkpointed and replayed.",
        "Identity in state is identity a resumed run could be given wrongly.",
      ]],
    ["Private channels and streaming", "Do not assume an internal state field is secret when streaming the full graph state.", [
        "Some channels carry internal data that is not streamed to the caller.",
        "Privacy is what lets a node pass scratch data without publishing it.",
        "Anything on a public channel is visible to whatever is streaming.",
      ]],
    ["State schema migrations", "Keep persisted threads readable when adding, changing or retiring state fields.", [
        "A changed schema has to account for checkpoints written under the old one.",
        "A resumed run reads state that was written before the change.",
        "A removed key breaks resumption for every run still in flight.",
      ]],
  ],
  "Control flow": [
    ["Command updates and routing", "Return a state update and navigation decision together when a node controls the next step.", [
        "A node can return both a state update and where to go next.",
        "Combining them removes the need for a separate conditional edge.",
        "It puts routing inside the node, which can hide the graph's shape.",
      ]],
    ["Send and map-reduce", "Fan out dynamically generated tasks and merge their results through explicit reducers.", [
        "Work fans out to many instances of a node with separate payloads.",
        "The number of branches can depend on runtime data, which edges cannot express.",
        "Results must be combined by a reducer, or they overwrite each other.",
      ]],
    ["Parallel fan-out and fan-in", "Run independent branches and join only after their required results are available.", [
        "Several branches run concurrently and rejoin at a single node.",
        "The join waits for every branch, so the slowest sets the pace.",
        "A branch that never completes blocks the join indefinitely.",
      ]],
    ["Cycles and agent loops", "Repeat model and tool steps while enforcing completion criteria and a turn budget.", [
        "An edge back to an earlier node is what makes an agent loop.",
        "Cycles are the reason a graph is used instead of a pipeline.",
        "A cycle with no exit condition runs until a limit intervenes.",
      ]],
    ["Recursion limits", "Bound graph super-steps and diagnose runaway execution rather than merely increasing the limit.", [
        "A maximum number of steps bounds any loop.",
        "The bound is what turns an infinite loop into a reported failure.",
        "Raising it to fix a loop hides the reason the loop does not terminate.",
      ]],
    ["Subgraphs", "Encapsulate a reusable workflow with an explicit state mapping and persistence scope.", [
        "A graph is used as a node inside another graph.",
        "Nesting is what lets a complex step be developed and tested alone.",
        "State is not shared automatically; it is mapped at the boundary.",
      ]],
    ["Parent graph handoffs", "Transfer control across graph boundaries without losing required state or ownership.", [
        "Control and mapped state pass between a parent and its subgraph.",
        "Explicit mapping is what keeps the two schemas independent.",
        "Assuming shared keys couples the subgraph to one caller.",
      ]],
    ["Deterministic and agentic branches", "Combine predictable business rules with model-directed decisions at selected nodes.", [
        "Some branches are decided by code and others by a model.",
        "Deciding in code where possible removes nondeterminism for free.",
        "A model asked to make an obvious choice will sometimes get it wrong.",
      ]],
  ],
  "Persistence & durability": [
    ["Checkpointers", "Save execution snapshots so paused and interrupted workflows can resume.", [
        "State is saved as a snapshot after each step, scoped to a thread.",
        "The documented savers are `InMemorySaver`, `SqliteSaver`, `PostgresSaver` and its async form.",
        "`checkpointer.setup()` creates the tables a database-backed saver needs.",
      ]],
    ["Thread IDs", "Use stable, authorized conversation identities to select the correct checkpoint history.", [
        "The id is passed through the graph config under `configurable`.",
        "The docs advise keeping it under 255 characters for `PostgresSaver`'s column limit.",
        "A UUID or hash is the recommended shape for a deterministic id.",
      ]],
    ["Checkpoint history", "Inspect past states and transitions to understand how a run reached its current result.", [
        "Checkpoints accumulate across a conversation rather than replacing one another.",
        "The docs warn this raises both latency and storage cost over time.",
        "Periodic pruning or a retention policy is the documented remedy.",
      ]],
    ["Durable execution", "Design restart behavior around persisted progress and the replay of unfinished work.", [
        "State is saved through the persistence layer whenever the graph pauses.",
        "A run therefore survives a process restart and resumes from its last checkpoint.",
        "Anything not held in state is not restored, however important it was.",
      ]],
    ["Idempotent side effects", "Prevent repeated payments, messages or writes when a node is retried or replayed.", [
        "Any operation before an `interrupt()` must be safe to repeat.",
        "A non-idempotent write placed there duplicates on every resume.",
        "Placing the effect after the interrupt is the documented way to avoid it.",
      ]],
    ["Production checkpoint backends", "Choose durable storage and test recovery across process restarts.", [
        "`PostgresSaver` replaces `InMemorySaver` for anything that must survive a restart.",
        "In-memory state disappears with the process, which defeats durability.",
        "The backend is on the hot path of every step, so its latency is per-step.",
      ]],
    ["Time travel and forks", "Explore an alternate path from a past checkpoint without confusing it with the original run.", [
        "A run can be rewound to an earlier checkpoint and continued differently.",
        "Forking is how an alternative path is explored without losing the original.",
        "A fork is a new thread, so effects already performed are not undone.",
      ]],
    ["State updates and recovery", "Repair a known state problem through controlled updates and an auditable resume path.", [
        "State can be edited at a checkpoint before resuming.",
        "Editing is what lets a human correct a run rather than restart it.",
        "An edit that violates the schema fails on resume, not on write.",
      ]],
  ],
  "Human approval": [
    ["interrupt and resume", "Pause for external input and resume with an explicit decision in the same thread.", [
        "`interrupt()` raises a special exception; the state is saved and the run waits indefinitely.",
        "Invoking with `Command(resume=…)` makes that value the return of the `interrupt()` call.",
        "The node restarts from its beginning, so code before the interrupt runs again.",
      ]],
    ["Tool approval workflows", "Show the exact proposed action and arguments before an authorized approver accepts them.", [
        "Specified actions wait for a human decision before executing.",
        "The pause happens before the effect, which is what makes it a control.",
        "An approval that always arrives automatically is not a control.",
      ]],
    ["Editing proposed actions", "Validate human-edited tool arguments using the same contract as model-generated inputs.", [
        "A human can change the arguments before an action runs.",
        "Editing beats rejecting when the intent was right and the detail wrong.",
        "The edited value must be validated as untrusted input all the same.",
      ]],
    ["Node restart semantics", "Account for code before an interrupt running again when the node resumes.", [
        "Resumption re-enters the node at the top, not at the interrupt.",
        "Everything before the `interrupt()` call therefore executes a second time.",
        "The docs advise putting side effects after the interrupt so they run once, post-approval.",
      ]],
    ["Multiple interrupts", "Keep interrupt ordering stable and match each resume value to the correct request.", [
        "One node may call `interrupt()` more than once in a run.",
        "Matching resume values to calls is strictly index-based, so their order matters.",
        "Skipping an interrupt conditionally or looping over them breaks that index alignment.",
      ]],
    ["Timeouts and abandoned approvals", "Expire pending decisions and prevent old approvals from applying to a changed action.", [
        "A pending approval that is never answered needs a policy.",
        "Without one, a paused run holds its state indefinitely.",
        "Expiring to a safe default is a decision, not an omission.",
      ]],
  ],
  "Streaming & memory": [
    ["Streaming state values", "Publish state snapshots deliberately and exclude fields the client must not see.", [
        "The full state is emitted after each step.",
        "Whole values suit a consumer that re-renders from current state.",
        "It is the most verbose mode, so it costs the most to transport.",
      ]],
    ["Streaming state updates", "Send incremental node updates when consumers need progress rather than full state.", [
        "Only the changes from each step are emitted.",
        "Deltas are cheaper and say exactly which node did what.",
        "The consumer must apply them in order to stay correct.",
      ]],
    ["Streaming model messages", "Render partial text alongside tool and graph progress without duplicating final output.", [
        "Model tokens stream out as they are produced.",
        "Token streaming is what makes the interface feel responsive.",
        "Tokens are not structure, so partial JSON must not be parsed.",
      ]],
    ["Custom progress events", "Expose useful milestones from slow tools with a documented client event contract.", [
        "A node emits its own events alongside the built-in ones.",
        "Custom events describe work the graph's structure cannot express.",
        "They travel on the same stream, so they share its ordering.",
      ]],
    ["Subgraph streaming", "Track which nested workflow emitted an event and preserve its execution context.", [
        "Events from inside a subgraph can be surfaced to the caller.",
        "Without it a subgraph is a silent gap in the stream.",
        "Including them means the consumer must handle nested namespaces.",
      ]],
    ["Short-term and long-term memory", "Distinguish checkpointed conversation state from cross-thread knowledge stores.", [
        "A checkpointer is thread-scoped short-term memory; a store is cross-thread.",
        "The store holds application-defined key-value data such as preferences and facts.",
        "`InMemoryStore` is the documented starting implementation.",
      ]],
    ["Store namespaces and search", "Scope persisted memories by user and task before applying relevance search.", [
        "Stored memories are namespaced and searched within a namespace.",
        "The namespace is the isolation boundary between users and tenants.",
        "A search without one can return another person's memory.",
      ]],
    ["Context trimming and summarization", "Control growing message history while retaining unresolved tool calls and decisions.", [
        "History is trimmed or summarised to fit the model's window.",
        "Something must give once the conversation exceeds the window.",
        "Trimming across a tool call and its result leaves history inconsistent.",
      ]],
  ],
  "Workflow patterns": [
    ["Routing workflow", "Use a classification node to select a deterministic domain-specific branch.", [
        "An input is classified and sent to the branch that handles it.",
        "Classifying once is cheaper than every branch inspecting the input.",
        "An unclassifiable input needs a default branch to land in.",
      ]],
    ["Evaluator-optimizer workflow", "Iterate against a concrete quality rubric with a maximum number of revision rounds.", [
        "One node produces and another critiques, looping until acceptable.",
        "Separating production from judgement is what makes the critique useful.",
        "Without a bound the pair can refine forever.",
      ]],
    ["Orchestrator-workers workflow", "Create bounded subtasks dynamically and synthesize their independently checked outputs.", [
        "An orchestrator splits work and workers execute the pieces.",
        "Splitting at runtime is what handles a variable amount of work.",
        "The orchestrator becomes the bottleneck and the single failure point.",
      ]],
    ["Agentic retrieval graph", "Model retrieve, assess, reformulate and answer as explicit transitions.", [
        "Retrieval is a node the graph can revisit with a new query.",
        "Revisiting is what rescues a question the first query missed.",
        "Each retrieval costs, so the loop needs a limit.",
      ]],
    ["Multi-agent supervisor", "Coordinate specialists through narrow contracts and a clear owner for the final answer.", [
        "A supervisor routes between specialist agents.",
        "Specialisation keeps each agent's tool set small and its prompt short.",
        "Every hop through the supervisor adds latency and context.",
      ]],
    ["Functional API", "Compare task and entrypoint style workflows with explicitly declared graph topology.", [
        "Graphs are expressed as ordinary functions with decorators.",
        "It suits a workflow that is mostly sequential with some durability.",
        "The structure is implicit, so it cannot be visualised the same way.",
      ]],
  ],
  "Graph operations": [
    ["Retry policies", "Retry transient failures with limits and avoid retrying invalid inputs or unauthorized actions.", [
        "A node retries on failure according to a declared policy.",
        "Declaring it keeps retry logic out of the node's own body.",
        "Retrying a node with an effect repeats that effect.",
      ]],
    ["Node caching", "Reuse deterministic node outputs only when cache keys include all relevant input and context.", [
        "A node's result is reused when its inputs are unchanged.",
        "Caching is what makes re-running a graph during development cheap.",
        "A cached node with a side effect does not perform it again.",
      ]],
    ["Graph unit tests", "Test nodes and routing functions separately before exercising full executions.", [
        "Individual nodes are tested as plain functions.",
        "A node takes state and returns state, which is trivially testable.",
        "Testing only the whole graph tests the model as much as the code.",
      ]],
    ["Recovery integration tests", "Simulate process loss, timeouts and duplicate delivery to verify durable behavior.", [
        "Interruption and resumption are exercised deliberately.",
        "Only this proves that effects are genuinely idempotent.",
        "A graph that works straight through can still be broken on resume.",
      ]],
    ["LangSmith graph traces", "Inspect execution paths, tool calls, latency and state changes across graph runs.", [
        "Each node's inputs, outputs and timing are recorded.",
        "Per-node detail is what localises a failure in a large graph.",
        "The trace is the state, so redaction matters before it is sent.",
      ]],
    ["Deployment and API serving", "Expose runs and threads with authentication, isolation and bounded concurrency.", [
        "The graph is exposed behind a service with threads and streaming.",
        "The thread identifier is what a client resumes against.",
        "Long-running runs outlive a request, so the API cannot be synchronous.",
      ]],
    ["Cancellation and cleanup", "Stop unfinished work and reconcile partially completed side effects.", [
        "An abandoned run is stopped and its resources released.",
        "Cancellation is what stops a closed tab from still spending money.",
        "State already checkpointed remains until it is deliberately removed.",
      ]],
    ["Graph performance tuning", "Measure critical paths and checkpoint overhead before increasing parallel execution.", [
        "Per-node timing shows where a run actually spends its time.",
        "Measuring before changing is what stops parallelism being added uselessly.",
        "Fan-out adds coordination cost that can exceed what it saves.",
      ]],
  ],
  "Hooks": [
    ["pre_model_hook", "Run a node before every model call to summarize, trim or re-order the state it will read.", [
        "State is adjusted immediately before the model node runs.",
        "It is the cheapest point to trim history or inject context.",
        "It runs on every model turn, so its cost is multiplied by the loop.",
      ]],
    ["post_model_hook", "Inspect the reply before tool calls proceed - the natural place for a guardrail.", [
        "The model's output is inspected or altered before the graph continues.",
        "Altering here is how an output check takes effect on behaviour.",
        "Rewriting silently makes the trace disagree with the model's reply.",
      ]],
    ["interrupt_before and interrupt_after", "Pause the graph around named nodes so a person can inspect or approve.", [
        "Execution pauses at a named node's boundary.",
        "Configuring it on compile keeps the pause out of the node's code.",
        "It pauses at the boundary, not at a point chosen inside the node.",
      ]],
    ["interrupt()", "Stop inside a node, persist, and resume from the same point once an answer arrives.", [
        "A node pauses itself mid-execution and waits for input.",
        "Pausing inside the node is what allows a value to be requested.",
        "The node re-runs from the top when resumed.",
      ]],
    ["Checkpointer hooks", "Every step writes a checkpoint, which is what makes resuming and time travel possible.", [
        "State can be observed or transformed as it is persisted.",
        "It is the single place to redact before anything is written.",
        "Transforming on write means reads must expect the transformed shape.",
      ]],
    ["Node retry policies", "Attach retry behaviour to the node that can fail, not to the whole graph.", [
        "Retry behaviour is declared per node rather than globally.",
        "Different nodes fail differently, so one policy rarely fits all.",
        "A node that calls a paid API should retry less eagerly than a local one.",
      ]],
    ["Stream event hooks", "Choose what streaming emits - values, updates, messages, debug - per consumer.", [
        "Custom handling attaches to the graph's event stream.",
        "The stream is the one place every node's progress converges.",
        "A slow consumer applies backpressure to the run itself.",
      ]],
  ],
});
