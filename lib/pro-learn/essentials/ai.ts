import type { TechnologyEssentials } from "./types";

/** LLM applications, agents, evaluation and workflow automation. */
export const AI_ESSENTIALS: TechnologyEssentials[] = [
  {
    technologies: ["LangChain"],
    points: [
      "A model call is a network call to a non-deterministic service: it can be slow, it can fail, and it can return something valid-looking and wrong. Every design decision follows from that.",
      "The context window is a budget. What goes in it — instructions, retrieved documents, history, tool results — is the engineering, and trimming strategy matters more than prompt wording.",
      "Structured output is what makes a model callable from code. Ask for a schema and validate the reply, because a parse failure is a normal outcome rather than an exception.",
      "A tool is an API you are handing to a probabilistic caller. Narrow arguments, validate them, and make destructive tools require confirmation.",
      "Cost and latency scale with tokens, so the same feature can be ten times cheaper with a smaller model, a shorter prompt, or a cache in front of it.",
    ],
    categories: {
      "Retrieval & knowledge": ["Retrieval quality sets the ceiling for answer quality. A perfect model over the wrong three chunks still answers wrongly.", "Chunking decides what can ever be retrieved together. It is a data decision, not a tuning knob."],
      "Memory & context": ["Unbounded history eventually crowds out the instructions. Summarize or window deliberately rather than waiting for the limit."],
      "Testing & production": ["Prompt changes need a reference set, because a change that fixes one case routinely breaks another silently."],
    },
  },
  {
    technologies: ["LangGraph"],
    points: [
      "The graph makes control flow explicit: nodes do work, edges decide what happens next. That is the difference between an agent you can debug and a loop you cannot.",
      "State is shared and updated by reducers, so two nodes writing the same key need a rule for combining rather than last-write-wins by accident.",
      "Checkpointing is what makes a run resumable and a human-approval step possible: the graph can stop, persist, and continue later from the same state.",
      "An interrupt is how a person enters the loop. Designing where approval belongs is a product decision that the graph then enforces.",
      "Every loop needs a termination condition and a step budget, because a cycle with no bound is a bill with no bound.",
    ],
    categories: {
      "Persistence & durability": ["A checkpoint contains whatever is in state, including anything sensitive you put there."],
      "Control flow": ["Conditional edges are where the agent's decisions become inspectable. Prefer them to branching inside a node."],
    },
  },
  {
    technologies: ["LangSmith"],
    points: [
      "A trace is the unit of debugging: one run, every model call, tool call and retry inside it, with inputs, outputs and latency. Without it you are guessing about a non-deterministic system.",
      "Evaluation needs a dataset before it needs a metric. A handful of real, hard examples with expected outcomes beats a large synthetic set.",
      "Offline evaluation answers 'did this change help'; online evaluation and feedback answer 'is it working now'. Both are needed, and they measure different things.",
      "An LLM-as-judge is itself a model call with the same failure modes, so a judge needs its own validation before you trust its scores.",
      "Traces contain user data. Whatever you would not put in a log should not be sent to a tracing backend either.",
    ],
  },
  {
    technologies: ["Agentic AI", "AI terms"],
    points: [
      "An agent is a loop: decide, act with a tool, observe the result, repeat until done. Everything else — memory, planning, guardrails — is added to that loop.",
      "Autonomy multiplies both usefulness and blast radius. Scope the tools it holds, and put a human in front of anything irreversible.",
      "Retrieval grounds answers in your data, and it is the difference between a confident guess and a citation. It does not, on its own, stop a model inventing the parts it did not retrieve.",
      "Guardrails belong on input and output, and in code rather than in the prompt. A prompt is a request; a validator is a rule.",
      "Evaluate on cases you have collected from real use. Without that set, every prompt change is a change of unknown direction.",
    ],
    categories: {
      "Guardrails": ["Treat model output as untrusted input: never execute it, and never interpolate it into a query or a shell command."],
      "RAG": ["The retriever is the model's memory. Measure retrieval separately from generation, or you cannot tell which half failed."],
      "LLM Evaluation": ["Report per-case results, not only an aggregate score; an average hides the regression you care about."],
      "LLM Gateways": ["A gateway centralizes keys, routing, fallbacks and spend limits, which is what makes provider choice a configuration rather than a rewrite."],
    },
  },
  {
    technologies: ["n8n"],
    points: [
      "Every node receives a list of items and returns a list. Expecting one record is the single most common reason a working workflow breaks on the second input.",
      "Credentials are stored once and referenced by nodes, so they never belong in an expression or a URL.",
      "An automation is production software: it needs error handling, a retry policy and someone who is told when it fails, or it will fail silently for weeks.",
      "Expressions run per item and can reach data from earlier nodes. That power makes an unnamed, ungrouped workflow unreadable within a month.",
      "Queue mode is what turns a single-instance automation into something that survives load and restarts.",
    ],
  },
];
