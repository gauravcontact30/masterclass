import type { LearningModule } from "./module";

export const LANGCHAIN_MODULE: LearningModule = {
  technology: "LangChain",
  definition: "LangChain is an open-source framework with a pre-built agent architecture and integrations for any model or tool, so you can build agents that adapt as fast as the ecosystem evolves.",
  overview: "In the modern AI stack LangChain is the application layer: it gives every model provider one interface, turns plain functions into tools a model can call, and wraps them in a production-ready agent loop. Since v1, `create_agent` is the standard entry point and it runs on the LangGraph runtime, so persistence, streaming and human-in-the-loop come with it rather than being bolted on.",
  architecture: [
    { title: "Architecture: an agent loop on the LangGraph runtime", detail: "`create_agent` builds a graph with a model node and a tool node. The model reads the message history and either answers or emits tool calls; the tool node executes them and appends ToolMessages; the loop repeats until the model returns a final answer or a stop condition fires. Because the result is a compiled LangGraph graph, it supports `invoke`, `stream`, checkpointers and interrupts out of the box." },
    { title: "Under the hood: standard models, messages and tools", detail: "Chat models implement one interface (`invoke`, `stream`, `batch`, `bind_tools`, `with_structured_output`) and `init_chat_model` resolves strings such as `anthropic:<model>` to a provider class. Conversations are typed messages (System, Human, AI, Tool) with standard content blocks. The `@tool` decorator builds a JSON schema from the function's type hints and docstring, and that schema is what the model actually sees." },
    { title: "Core building blocks: middleware, structured output and retrieval", detail: "Middleware is how you customize the loop without forking it: hooks such as `before_model`, `after_model`, `wrap_model_call` and `wrap_tool_call` add summarization, PII redaction, human approval, model fallbacks or dynamic prompts. `response_format` returns validated structured output. Document loaders, text splitters, embeddings, vector stores and retrievers supply the retrieval layer for RAG." },
  ],
  code: [
    { path: "support_agent.py", note: "A tool-calling agent with middleware and a checkpointer", code: `from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware
from langchain.tools import tool
from langgraph.checkpoint.memory import InMemorySaver


@tool
def get_order_status(order_id: str) -> str:
    """Return the shipping status for an order ID."""
    # The docstring and type hints become the schema the model reads.
    return {"42": "shipped", "77": "processing"}.get(order_id, "unknown")


agent = create_agent(
    model="anthropic:claude-sonnet-5-5",          # resolved by init_chat_model
    tools=[get_order_status],
    system_prompt="You are a concise customer-support assistant.",
    middleware=[
        # Compress old turns before the context window fills up.
        SummarizationMiddleware(model="anthropic:claude-haiku-5-5", trigger=("tokens", 4000)),
    ],
    checkpointer=InMemorySaver(),                 # short-term memory per thread
)

config = {"configurable": {"thread_id": "customer-981"}}
result = agent.invoke(
    {"messages": [{"role": "user", "content": "Where is order 42?"}]},
    config,
)
print(result["messages"][-1].content)` },
  ],
  problem: { title: "Every provider, tool and agent loop written by hand", scenario: "Without LangChain, teams write a different client for every model provider, hand-roll JSON schemas for each tool, parse tool calls themselves and maintain a fragile while-loop that has no persistence, streaming or approval step. Switching models means rewriting that glue. LangChain standardizes the model, message and tool interfaces and supplies a tested agent loop, so swapping providers is a string change and cross-cutting concerns such as summarization, guardrails and retries are added as middleware rather than rewritten per project." },
  useCases: [
    { title: "Customer-support agent over internal systems", scenario: "An e-commerce company exposes order lookup, refund eligibility and shipment tracking as `@tool` functions. A `create_agent` loop answers customers, `HumanInTheLoopMiddleware` pauses before any refund above a threshold, and a checkpointer keyed by ticket ID keeps each conversation's history across requests." },
    { title: "Retrieval-augmented knowledge assistant", scenario: "A SaaS team loads product docs with document loaders, splits them into chunks, embeds them into a vector store and exposes the retriever as a tool. The agent decides when to search, cites the retrieved passages and falls back to a clarifying question when retrieval returns nothing relevant." },
    { title: "Structured data extraction from unstructured documents", scenario: "A fintech back office passes invoices and contracts through an agent with `response_format` set to a Pydantic schema. The model returns validated fields such as vendor, totals and due dates; validation failures are retried automatically, and the output flows straight into the accounting system." },
  ],
  subjective: [
    { rating: "Critical for Senior Roles", question: "Walk through what happens inside `create_agent` on a single user turn, and where middleware can intervene.", answer: "The input messages enter the graph's state. `before_model` middleware runs first (for example trimming or summarizing history), then `wrap_model_call` wraps the actual model request, which is where you swap models, add fallbacks or inject a dynamic system prompt. The model returns an AIMessage; `after_model` can inspect it (guardrails, approval). If it contains tool calls, the tool node executes each, with `wrap_tool_call` able to retry, mock or block a call, and appends ToolMessages. Control returns to the model node, and the loop ends when the model replies without tool calls or a limit middleware stops it. Because this is a LangGraph graph, every step can be checkpointed, streamed and interrupted." },
    { rating: "High / Common", question: "How do LangChain and LangGraph relate in v1, and when would you drop from `create_agent` to a hand-built LangGraph graph?", answer: "LangChain v1 agents are built on LangGraph: `create_agent` is a pre-built graph, so you inherit durable execution, streaming and human-in-the-loop. Stay with `create_agent` while the workflow is a model-and-tools loop that middleware can shape. Move to a custom LangGraph `StateGraph` when control flow is deterministic and branching (for example classify, then route to one of several specialist flows), when you need several cooperating agents with explicit hand-offs, custom state beyond messages, or parallel fan-out and fan-in steps. The two compose: a `create_agent` agent can be a node inside a larger graph." },
    { rating: "Frequently asked in AI-engineer loops", question: "How would you make an agent's output reliably machine-readable, and what are the trade-offs between the strategies?", answer: "Pass a schema (Pydantic model, TypedDict or JSON Schema) as `response_format`. With a provider strategy, the model's native structured-output mode constrains generation, which is the most reliable option when the provider supports it. With a tool strategy, the schema is presented as a tool the model must call; it works with any tool-calling model and LangChain can retry when validation fails, at the cost of extra tokens and latency. Either way, keep schemas small and well described, validate business rules after parsing, and log validation failures so prompt or schema problems are visible in tracing." },
  ],
  objective: [
    { question: "In LangChain v1, what does `create_agent(...)` return?", options: ["A legacy `AgentExecutor` that runs a ReAct prompt", "A compiled LangGraph graph that supports invoke, stream, checkpointers and interrupts", "An LCEL `RunnableSequence` with no loop", "A REST server that hosts the agent"], answer: 1, explanation: "`create_agent` builds a pre-built agent graph on the LangGraph runtime and returns it compiled, which is why persistence and streaming work directly. `AgentExecutor` is the legacy API, a plain runnable sequence has no tool loop, and serving over HTTP is a deployment concern, not what the function returns." },
    { question: "You need to trim or summarize message history before every model call without touching tool code. Where does that logic belong?", options: ["Inside each tool function", "In a `before_model` (or summarization) middleware", "In an output parser after the model responds", "In the system prompt"], answer: 1, explanation: "`before_model` middleware runs before each model invocation and can rewrite the state the model sees, which is exactly where history management belongs. Tools only run when called, output parsers act after the model has already consumed the context, and a system prompt cannot remove tokens from the history." },
    { question: "When you decorate a Python function with `@tool`, where does the model get the tool's description and argument schema?", options: ["Only from the function name", "From the docstring and the type hints of the parameters", "From a JSON schema you must always write by hand", "The model reads the function's source code"], answer: 1, explanation: "`@tool` derives the description from the docstring and the argument schema from the type hints, so both must be accurate and specific. The name alone carries too little, a hand-written schema is optional (you can pass `args_schema`), and the model never sees the source code." },
  ],
  keyPoints: [
    "`create_agent` is the v1 entry point and runs on the LangGraph runtime.",
    "Middleware customizes the loop: summarization, guardrails, approvals, fallbacks.",
    "A tool's docstring and type hints are the contract the model reads.",
    "Provider strings plus `init_chat_model` make swapping models a configuration change.",
  ],
  sources: [
    { title: "LangChain overview", url: "https://docs.langchain.com/oss/python/langchain/overview" },
    { title: "Agents", url: "https://docs.langchain.com/oss/python/langchain/agents" },
    { title: "Middleware", url: "https://docs.langchain.com/oss/python/langchain/middleware/overview" },
    { title: "Structured output", url: "https://docs.langchain.com/oss/python/langchain/structured-output" },
  ],
};
