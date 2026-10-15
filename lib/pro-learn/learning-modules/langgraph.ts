import type { LearningModule } from "./module";

export const LANGGRAPH_MODULE: LearningModule = {
  technology: "LangGraph",
  definition: "LangGraph is a low-level orchestration framework and runtime for building, managing and deploying long-running, stateful agents, with durable execution, streaming and human-in-the-loop built in.",
  overview: "Where LangChain gives you a ready-made agent loop, LangGraph gives you the loop's building material: explicit state, nodes, edges and a runtime that checkpoints every step. It is the layer teams reach for when an agent must branch deterministically, run for minutes or days, survive crashes, pause for a human and resume exactly where it stopped.",
  architecture: [
    { title: "Architecture: state, nodes and edges", detail: "A `StateGraph` is defined by a state schema (TypedDict, dataclass or Pydantic). Nodes are functions that read the state and return a partial update; edges decide what runs next, either fixed (`add_edge`) or computed (`add_conditional_edges`). Reducers declared with `Annotated` control how updates merge, for example `add_messages` appends to a list instead of replacing it. `compile()` validates the graph and returns a runnable." },
    { title: "Under the hood: Pregel super-steps", detail: "Execution follows a message-passing model inspired by Pregel. Each super-step runs every node that was triggered, in parallel when several are; their updates are applied through the reducers at the end of the step, and edges determine the next set of nodes. Two parallel nodes writing the same key without a reducer is an error, because the runtime cannot know which value should win." },
    { title: "Core building blocks: persistence, interrupts and memory", detail: "A checkpointer saves a snapshot after every super-step, keyed by `thread_id`, which powers conversation memory, time travel and fault-tolerant resumption. `interrupt()` pauses a node and surfaces a payload to the caller; resuming with `Command(resume=...)` re-runs that node from its start with the human's value. A Store adds long-term memory shared across threads, and `stream` emits values, updates, messages or custom events as the graph runs." },
  ],
  code: [
    { path: "refund_graph.py", note: "A routed graph with a human approval step", code: `from typing import Annotated, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.types import Command, interrupt


class State(TypedDict):
    messages: Annotated[list, add_messages]   # reducer: append, never overwrite
    draft: str
    approved: bool


def draft_reply(state: State) -> dict:
    complaint = state["messages"][-1].content
    return {"draft": f"We will refund your order. Reason noted: {complaint}"}


def human_review(state: State) -> dict:
    # Pauses the run; the value passed to Command(resume=...) is returned here.
    decision = interrupt({"draft": state["draft"]})
    return {"approved": decision == "approve"}


def send_reply(state: State) -> dict:
    return {"messages": [{"role": "assistant", "content": state["draft"]}]}


builder = StateGraph(State)
builder.add_node("draft_reply", draft_reply)
builder.add_node("human_review", human_review)
builder.add_node("send_reply", send_reply)
builder.add_edge(START, "draft_reply")
builder.add_edge("draft_reply", "human_review")
builder.add_conditional_edges(
    "human_review", lambda s: "send_reply" if s["approved"] else END, ["send_reply", END]
)
builder.add_edge("send_reply", END)

graph = builder.compile(checkpointer=InMemorySaver())   # required for interrupts
config = {"configurable": {"thread_id": "ticket-981"}}

graph.invoke({"messages": [{"role": "user", "content": "Order 42 arrived broken"}]}, config)
graph.invoke(Command(resume="approve"), config)          # resume the paused thread` },
  ],
  problem: { title: "Agents that cannot pause, recover or be controlled", scenario: "A plain agent loop lives in one process's memory: a crash or deploy loses the run, there is no safe place to stop for human approval, and branching logic ends up as prompt instructions the model may ignore. LangGraph makes control flow explicit code, persists state after every step so a run can resume after failure or days later, and turns human approval into a first-class `interrupt` rather than a polling hack." },
  useCases: [
    { title: "Approval workflows in regulated operations", scenario: "A bank's dispute-handling agent gathers evidence and drafts a decision, then interrupts for an analyst's sign-off. The checkpoint keeps the full state while the analyst reviews, possibly hours later, and resuming continues on the approved path with an audit trail of every step." },
    { title: "Multi-agent research and reporting pipelines", scenario: "A planner node splits a research question into sub-questions, fans out to parallel researcher nodes with the `Send` API, and a writer node fans the findings back in through a reducer. Conditional edges loop back to research when a critic node finds gaps." },
    { title: "Long-running, crash-safe coding or data agents", scenario: "An internal agent migrates hundreds of repositories, running for hours. With a durable checkpointer such as Postgres, a worker crash or redeploy resumes from the last completed step on the same `thread_id` instead of restarting and repeating side effects." },
  ],
  subjective: [
    { rating: "Critical for Senior Roles", question: "Explain super-steps and reducers. What goes wrong when two parallel branches update the same state key?", answer: "LangGraph executes in discrete super-steps: all nodes triggered in a step run (concurrently where possible), their returned partial updates are collected, and at the end of the step they are applied to the state through each key's reducer. Without a reducer a key is last-write-wins, which is only safe when one node writes it per step. If two parallel nodes both write the same un-reduced key, the runtime raises an invalid-concurrent-update error rather than silently picking one. The fix is to declare a reducer with `Annotated`, such as `operator.add` or `add_messages`, so the writes merge deterministically, or to give each branch its own key and combine them in a downstream node." },
    { rating: "High / Common", question: "How do `interrupt` and resumption work, and what must a node author be careful about?", answer: "`interrupt(payload)` raises inside the node, the runtime saves a checkpoint and returns the payload to the caller under `__interrupt__`. A checkpointer and a `thread_id` are required. Resuming with `Command(resume=value)` on the same thread re-executes the interrupted node from the beginning, and this time `interrupt` returns `value`. Because the node re-runs, any side effect placed before the `interrupt` call (sending an email, charging a card) runs twice, so such work should go after the interrupt, into a separate node, or be idempotent. With several interrupts in one node, they are matched by order, so their order must stay stable." },
    { rating: "Common in system-design rounds", question: "Distinguish short-term and long-term memory in LangGraph and how you would run it durably in production.", answer: "Short-term memory is the thread's state saved by the checkpointer: the message history and any fields of the current conversation, scoped to one `thread_id`. Long-term memory lives in a Store, organized by namespace (for example per user) and readable across threads, often with semantic search. In production, replace `InMemorySaver` with a durable checkpointer such as Postgres, choose a durability mode that trades latency against how much work can be lost, trim or summarize messages so threads do not grow without bound, and apply retention policies to both checkpoints and the store." },
  ],
  objective: [
    { question: "A run was paused with `interrupt()` and is resumed with `Command(resume=\"approve\")`. Where does execution continue?", options: ["At the exact line after `interrupt()`, like a generator", "At the start of the node that called `interrupt()`, which now receives \"approve\"", "At the start of the whole graph", "At the next node after the interrupted one"], answer: 1, explanation: "Resumption re-runs the interrupted node from its beginning, and the `interrupt()` call returns the resume value this time. It is not a generator continuation, the graph does not restart from START (the checkpoint preserves earlier steps), and the interrupted node is not skipped." },
    { question: "Two nodes run in the same super-step and both return an update to `results`, which has no reducer. What happens?", options: ["The last node alphabetically wins", "Both values are appended automatically", "LangGraph raises an invalid concurrent update error", "The first value is kept silently"], answer: 2, explanation: "A key without a reducer accepts one write per step; concurrent writes are rejected with an error so data is never lost silently. Appending only happens when you declare a reducer such as `operator.add`, and there is no alphabetical or first-wins rule." },
    { question: "What is the role of `thread_id` in a compiled graph's config?", options: ["It selects the CPU thread the graph runs on", "It identifies which checkpointed conversation state to load and save", "It sets the maximum number of parallel nodes", "It is the API key for LangGraph Platform"], answer: 1, explanation: "The checkpointer stores snapshots per `thread_id`, so the same ID continues a conversation and a new ID starts fresh. It has nothing to do with OS threads, concurrency limits or authentication." },
  ],
  keyPoints: [
    "State plus reducers define how node updates merge each super-step.",
    "A checkpointer and a `thread_id` are required for memory, interrupts and recovery.",
    "A resumed node re-runs from its start, so side effects before `interrupt` must be idempotent.",
    "Conditional edges and `Send` express routing and fan-out in code, not in the prompt.",
  ],
  sources: [
    { title: "LangGraph overview", url: "https://docs.langchain.com/oss/python/langgraph/overview" },
    { title: "Graph API", url: "https://docs.langchain.com/oss/python/langgraph/graph-api" },
    { title: "Persistence", url: "https://docs.langchain.com/oss/python/langgraph/persistence" },
    { title: "Interrupts", url: "https://docs.langchain.com/oss/python/langgraph/interrupts" },
  ],
};
