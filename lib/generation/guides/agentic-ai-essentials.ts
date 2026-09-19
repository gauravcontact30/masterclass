import type { Lesson } from "@/lib/domain";

/** Concise recap shared by the Learn in App guide and notes directory. */
export const agenticAiEssentials: Lesson = {
  title: "Agentic AI essentials: key features, topics and roadmap",
  explanation: "- Agentic AI pursues a goal through a bounded loop: plan, act with tools, observe results, adjust and stop.\n- Use the five capabilities, five topic areas and six learning steps below as a practical checklist.",
  keyPoints: [
    { tone: "key", title: "Feature: Autonomy", text: "Break a high-level goal into tasks and choose next steps without a prompt for each action; enforce time, turn and spending limits." },
    { tone: "key", title: "Feature: Tool employment (function calling)", text: "Use validated function arguments to call APIs, search the web, query databases or run sandboxed code; application code authorizes and executes each call." },
    { tone: "key", title: "Feature: Memory and context retention", text: "Keep recent work in short-term conversation context and retrieve durable facts or task history from long-term storage such as a vector database; stored feedback does not automatically retrain the model." },
    { tone: "key", title: "Feature: Self-reflection and correction", text: "Check outputs against evidence, detect failed tool calls and revise the plan; cap retries and verify the result instead of trusting self-critique alone." },
    { tone: "key", title: "Feature: Multi-agent collaboration", text: "Delegate distinct roles, such as researcher and writer, using explicit handoffs and shared task state; add agents only when specialization improves results." },
    { tone: "tip", title: "Topic: Agentic frameworks", text: "Study LangGraph and LlamaIndex Workflows for stateful orchestration, and CrewAI and AutoGen for role-based collaboration; understand the underlying loop first." },
    { tone: "tip", title: "Topic: Reasoning patterns", text: "ReAct alternates reasoning, action and observation; Plan-and-Solve decomposes work before execution; Chain-of-Thought (CoT) describes intermediate reasoning, not proof that an answer is correct." },
    { tone: "tip", title: "Topic: Human-in-the-Loop (HITL)", text: "Pause before sensitive actions such as payments or sending email; show the exact proposed action and resume only after approval." },
    { tone: "tip", title: "Topic: Small Language Models (SLMs)", text: "Evaluate smaller Llama or Mistral models for narrow function-calling tasks; fine-tune when needed and compare task success, latency and total cost against a larger-model baseline." },
    { tone: "tip", title: "Topic: Evaluation and observability", text: "Use LangSmith, Phoenix or Arize to trace model and tool steps, investigate loops and measure task success, tool errors, tokens, cost and latency." },
    { tone: "key", title: "Step 1: Generative AI foundations", text: "Learn Python, API integration, tokenization, context windows and temperature; practice few-shot prompting, task decomposition and schema-validated JSON outputs." },
    { tone: "key", title: "Step 2: RAG and external data", text: "Build Retrieval-Augmented Generation (RAG) with chunking, embeddings and semantic search; use ChromaDB, Pinecone or Qdrant to retrieve relevant knowledge and durable memory." },
    { tone: "key", title: "Step 3: Tool use and function calling", text: "Define function schemas, validate model-produced arguments and return tool results to a manual ReAct loop; build a single agent with web search or read-only SQL access." },
    { tone: "key", title: "Step 4: Orchestration frameworks", text: "Practice graph state, cycles and conditional routing in LangGraph or LlamaIndex Workflows; then implement role delegation and communication with CrewAI or AutoGen." },
    { tone: "key", title: "Step 5: State management and guardrails", text: "Persist checkpoints, enforce HITL approvals and handle API 500 errors with bounded backoff; combine input/output checks such as NeMo Guardrails or Llama Guard with least privilege and isolation to reduce prompt-injection risk." },
    { tone: "key", title: "Step 6: Evaluation, tracing and deployment", text: "Test representative tasks and inspect execution traces in LangSmith or Phoenix; deploy with FastAPI, Docker or serverless infrastructure and enforce cost monitoring, token throttling and request limits." },
  ],
  example: "- Flight assistant: collect dates and budget, search available flights, compare total prices and ask for approval of the exact itinerary and charge before booking.",
  code: "",
  exercise: "- Build a read-only research agent: retrieve sources, save a short summary, retry one simulated API failure and stop at a fixed tool-call budget.",
  checkpoint: "- Can you explain all five capabilities, choose an orchestration pattern and name a measurable deliverable for each roadmap step?",
  mistake: "- Do not treat memory as automatic learning, self-reflection as verification, or a guardrail model as a complete defense against prompt injection.",
};
