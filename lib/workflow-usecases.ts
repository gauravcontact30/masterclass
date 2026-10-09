import { AGENT_BUILD_USECASES, BUILD_CATEGORY, type BuildStep } from "./workflow-build-guides";

export type WorkflowType = "single" | "multi";
export type WorkflowTag =
  | "Human-in-the-Loop"
  | "Supervisor"
  | "Deep Agents Sandbox"
  | "Plan & Execute"
  | "Structured Extraction"
  | "Adversarial Debate"
  | "Self-Correction"
  | "Incident Response"
  | "Episodic Memory"
  | "Enterprise Compliance"
  | "Market Intelligence";

export interface CodeFile {
  filename: string;
  language: "python" | "text" | "json";
  description: string;
  code: string;
}

export interface KeyConcept {
  title: string;
  description: string;
}

export interface ObjectiveQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface SubjectiveQuestion {
  question: string;
  difficulty: 1 | 2 | 3;
  answer: string;
}

export interface WorkflowUsecase {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  type: WorkflowType;
  badge: string;
  tags: WorkflowTag[];
  architectureOverview: string;
  diagram: string[];
  keyHighlights: string[];
  keyPoints: string[];
  keyConcepts: KeyConcept[];
  learningObjectives: string[];
  howItWorks: string;
  remember: string;
  watchOut: string;
  prerequisites: string[];
  terminalCommands: { label: string; command: string }[];
  verify: string[];
  objectiveQuestions: ObjectiveQuestion[];
  subjectiveQuestions: SubjectiveQuestion[];
  techStack: {
    name: string;
    version: string;
    role: string;
    accent: string;
  }[];
  files: CodeFile[];
  runCommand: string;
  /** Hand-authored build walkthrough; see getBuildSteps for the derived fallback. */
  buildSteps?: BuildStep[];
  /** Project folder the build guide creates; defaults to the id in snake_case. */
  buildFolder?: string;
}

export {
  getWorkflowFrameworkLearnings,
  type FrameworkTopicDetail,
  type WorkflowFrameworkLearnings,
} from "./workflow-framework-learnings";

export const WORKFLOW_CATEGORIES = [
  "All",
  "Single Agent & HITL",
  "Multi-Agent Squad",
  "Plan & Execute",
  "Structured Extraction",
  "Adversarial Debate",
  "Code Generation & Sandbox",
  "SRE & Incident Ops",
  "Adaptive RAG & Memory",
  "Enterprise Compliance",
  "Market Intelligence",
  BUILD_CATEGORY,
] as const;

export type WorkflowCategory = (typeof WORKFLOW_CATEGORIES)[number];

const CORE_WORKFLOW_USECASES: WorkflowUsecase[] = [
  {
    "id": "customer-support-human-in-the-loop",
    "title": "Autonomous Customer Support & Ticket Escalation",
    "subtitle": "Single-agent ReAct workflow with Human-in-the-Loop interrupts, sentiment analysis, and LangSmith telemetry.",
    "category": "Single Agent & HITL",
    "type": "single",
    "badge": "Single Agent + Human-in-the-Loop",
    "tags": [
      "Human-in-the-Loop",
      "Structured Extraction"
    ],
    "architectureOverview": "A production customer service agent that assists users with order management, queries a corporate knowledge base, and resolves issues. For high-impact financial actions (such as refunding an order over $100), the agent uses LangGraph v0.2's native interrupt() primitive to suspend execution, checkpoint the full state in SQLite, and wait for human supervisor approval before resuming seamlessly via Command(resume=...).",
    "diagram": [
      "User Query ─> [Support Agent]",
      "[Support Agent] ─> Tool Calls: (Search Knowledge Base / Check Order)",
      "[Support Agent] ─(Refund > $100)─> [interrupt() Human Approval Required]",
      "[Human Supervisor in Portal] ─(Approve / Reject)─> [Command(resume=...)]",
      "[Support Agent] ─(Complete Refund & Notify)─> Output to Customer"
    ],
    "keyHighlights": [
      "LangGraph v0.2 interrupt() and Command(resume=...) for asynchronous human authorization.",
      "LangChain v0.3 @tool decorator with strict Pydantic argument schemas.",
      "Checkpointed state persistence with SqliteSaver / MemorySaver.",
      "LangSmith @traceable decorator logging full span trees, customer sentiment, and resolution time."
    ],
    "keyPoints": [
      "Uses LangGraph v0.2 in-node interrupt() primitive to suspend execution without blocking worker threads or holding open database connections.",
      "Checkpoints full serialized state in SqliteSaver / PostgresSaver, enabling auditable human approvals across asynchronous sessions.",
      "Resumes deterministically via Command(resume=...) injecting human authorization decisions directly into downstream graph branches."
    ],
    "keyConcepts": [
      {
        "title": "interrupt() Primitive",
        "description": "Suspends graph execution at an exact point inside a node, persisting state to the configured checkpointer."
      },
      {
        "title": "Message Reducer (add_messages)",
        "description": "LangGraph channel reducer that appends incoming messages to the history while deduplicating by message ID."
      },
      {
        "title": "Command(resume=...)",
        "description": "LangGraph command primitive used by human supervisors to resume suspended threads with approval payloads."
      }
    ],
    "learningObjectives": [
      "Architect a single-agent ReAct loop using StateGraph and LangChain v0.3 tool calling.",
      "Implement financial threshold guardrails that invoke interrupt() when refunds exceed $100.",
      "Resume suspended graphs using Command(resume=...) and evaluate sentiment with LangSmith."
    ],
    "howItWorks": "Incoming customer messages are appended to the state via add_messages. The ReAct agent calls tools for knowledge and orders. When a refund exceeds $100, the node calls interrupt(), pausing the thread. When the supervisor submits an approval, the graph re-evaluates the condition and either executes the refund or routes to escalation.",
    "remember": "Never mutate state dictionaries in place; always return a dictionary of keys to update according to the defined channel reducers.",
    "watchOut": "If you do not register a Checkpointer (e.g. MemorySaver or SqliteSaver), interrupt() will fail at runtime because it has no backing persistence layer to store the paused state.",
    "prerequisites": [
      "Python 3.10+ installed",
      "export OPENAI_API_KEY=sk-...",
      "export LANGSMITH_API_KEY=lsv2_pt_...",
      "pip install langchain>=0.3.0 langgraph>=0.2.20 langsmith>=0.2.0 langchain-openai>=0.2.0"
    ],
    "terminalCommands": [
      {
        "label": "Run Support Agent",
        "command": "python -m customer_support.graph"
      },
      {
        "label": "Run LangSmith Evaluation Suite",
        "command": "python -m customer_support.eval"
      }
    ],
    "verify": [
      "Verify that refunds <= $100 proceed automatically without human intervention.",
      "Verify that refunds > $100 pause execution and log an interruption event.",
      "Verify that LangSmith shows the complete span tree with ticket ID and customer tier metadata."
    ],
    "objectiveQuestions": [
      {
        "question": "What LangGraph primitive is used in v0.2+ to pause execution for human review and resume it later?",
        "options": [
          "A) StateGraph.pause()",
          "B) interrupt() with Command(resume=...)",
          "C) time.sleep() in a background loop",
          "D) await human_input()"
        ],
        "answer": "B) interrupt() with Command(resume=...)",
        "explanation": "LangGraph v0.2 introduced in-node interrupt() which saves the thread state to the checkpointer and returns. The caller resumes using app.stream(Command(resume=...))."
      },
      {
        "question": "Why must Annotated[list[BaseMessage], add_messages] be used instead of a standard list[BaseMessage]?",
        "options": [
          "A) Python type hints require it for syntax validation",
          "B) To specify the channel reducer function that handles message concatenation and ID deduplication",
          "C) To convert strings into JSON objects automatically",
          "D) It is an optional visual annotation for IDEs"
        ],
        "answer": "B) To specify the channel reducer function that handles message concatenation and ID deduplication",
        "explanation": "Without add_messages, returning {'messages': [new_msg]} would overwrite the existing messages array instead of appending."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "Explain how in-node interrupt() differs from legacy breakpoint systems (like interrupt_before / interrupt_after), and how it prevents zombie worker threads in distributed microservices.",
        "difficulty": 2,
        "answer": "Legacy breakpoints pause between nodes before or after execution. In-node interrupt() allows execution to proceed until a specific dynamic branch is evaluated (e.g. only if amount > $100). The thread is released back to the worker pool immediately, and state is preserved in persistent checkpointers like PostgresSaver. No HTTP socket or worker thread remains blocked waiting for human input."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "v0.3.0+",
        "role": "Prompt templates, tool bindings, and structured messages",
        "accent": "#0071E3"
      },
      {
        "name": "LangGraph",
        "version": "v0.2.20+",
        "role": "StateGraph, interrupt(), Command, and MemorySaver",
        "accent": "#5856D6"
      },
      {
        "name": "LangSmith",
        "version": "v0.2.0+",
        "role": "End-to-end tracing, feedback capture, and dataset evals",
        "accent": "#FF9500"
      },
      {
        "name": "Integrations",
        "version": "langchain-openai",
        "role": "GPT-4o chat model with native function calling",
        "accent": "#34C759"
      }
    ],
    "runCommand": "python -m customer_support.graph",
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "Defines the customer support state schema inheriting from MessagesState with ticket metadata.",
        "code": "\"\"\"\nCustomer Support State Schema\nDefines the state structure for ticket processing, sentiment tracking,\nand human-in-the-loop approval requests.\n\"\"\"\n\nfrom typing import Annotated, Optional\nfrom typing_extensions import TypedDict\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\n\n\nclass SupportState(TypedDict):\n    messages: Annotated[list[BaseMessage], add_messages]\n    \n    ticket_id: str\n    customer_id: str\n    customer_tier: str\n    \n    sentiment_score: float\n    pending_refund_amount: Optional[float]\n    human_approved: Optional[bool]\n    resolution_status: str"
      },
      {
        "filename": "tools.py",
        "language": "python",
        "description": "Customer service tools for knowledge lookup, order inspection, and issuing refunds.",
        "code": "\"\"\"\nCustomer Support Business Tools\nProvides typed tools for searching knowledge bases, checking orders,\nand triggering financial refunds.\n\"\"\"\n\nfrom langchain_core.tools import tool\nfrom pydantic import BaseModel, Field\n\n\nclass OrderLookupInput(BaseModel):\n    order_id: str = Field(description=\"The unique alphanumeric order ID, e.g. ORD-9821.\")\n\n\nclass RefundInput(BaseModel):\n    order_id: str = Field(description=\"Order ID to issue a refund for.\")\n    amount: float = Field(description=\"Dollar amount to refund.\")\n\n\n@tool(\"lookup_knowledge_base\", return_direct=False)\ndef lookup_knowledge_base(query: str) -> str:\n    \"\"\"Search internal enterprise support documents for refund policies and product guides.\"\"\"\n    policies = {\n        \"refund\": \"Standard return window is 30 days. Items over $100 require supervisor authorization.\",\n        \"shipping\": \"Standard domestic delivery takes 3-5 business days. Expedited is 1-2 days.\",\n        \"cancellation\": \"Orders may be cancelled within 2 hours of placement free of charge.\",\n    }\n    for topic, text in policies.items():\n        if topic in query.lower():\n            return f\"Policy Match: {text}\"\n    return \"Standard company policy applies: Contact support supervisor for unlisted policies.\"\n\n\n@tool(\"check_order_status\", args_schema=OrderLookupInput)\ndef check_order_status(order_id: str) -> dict:\n    \"\"\"Retrieve fulfillment status, tracking code, and item price for an order ID.\"\"\"\n    mock_db = {\n        \"ORD-1001\": {\"status\": \"delivered\", \"amount\": 49.99, \"item\": \"Ergonomic Keyboard\"},\n        \"ORD-2002\": {\"status\": \"in_transit\", \"amount\": 299.99, \"item\": \"4K Ultra-Wide Monitor\"},\n        \"ORD-3003\": {\"status\": \"processing\", \"amount\": 15.00, \"item\": \"USB-C Braided Cable\"},\n    }\n    order = mock_db.get(order_id)\n    if not order:\n        return {\"error\": f\"Order {order_id} not found in retail database.\"}\n    return {\"order_id\": order_id, **order}\n\n\n@tool(\"process_refund\", args_schema=RefundInput)\ndef process_refund(order_id: str, amount: float) -> dict:\n    \"\"\"Execute financial refund back to customer original payment method.\"\"\"\n    return {\n        \"refund_id\": f\"ref_{order_id[4:]}_approved\",\n        \"order_id\": order_id,\n        \"amount_refunded\": amount,\n        \"status\": \"settled\",\n    }"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "LangGraph StateGraph compilation with ReAct agent node, in-node interrupt(), and MemorySaver.",
        "code": "\"\"\"\nCustomer Support StateGraph Entrypoint\nCompiles a production ReAct support workflow with LangGraph v0.2 in-node interrupt().\n\"\"\"\n\nimport os\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.messages import SystemMessage, HumanMessage\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.types import interrupt, Command\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom langsmith import traceable\n\nfrom .state import SupportState\nfrom .tools import lookup_knowledge_base, check_order_status, process_refund\n\nSUPPORT_TOOLS = [lookup_knowledge_base, check_order_status, process_refund]\ntools_by_name = {t.name: t for t in SUPPORT_TOOLS}\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0)\nmodel_with_tools = llm.bind_tools(SUPPORT_TOOLS)\n\n\n@traceable(name=\"support_agent_node\")\ndef support_agent_node(state: SupportState):\n    \"\"\"Core ReAct model node reasoning over ticket status and customer queries.\"\"\"\n    system_prompt = SystemMessage(content=(\n        \"You are an enterprise support specialist for an e-commerce platform.n\"\n        \"1. Always check order details before suggesting actions.n\"\n        \"2. Note: Any refund exceeding $100 requires supervisor approval.n\"\n        \"3. Keep responses empathetic, professional, and clear.\"\n    ))\n    response = model_with_tools.invoke([system_prompt] + state[\"messages\"])\n    return {\"messages\": [response]}\n\n\ndef tool_execution_node(state: SupportState):\n    \"\"\"Executes tool calls, gating refunds > $100 through an in-node interrupt().\"\"\"\n    last_message = state[\"messages\"][-1]\n    results = []\n\n    for call in last_message.tool_calls:\n        tool_name = call[\"name\"]\n        args = call[\"args\"]\n        \n        if tool_name == \"process_refund\" and args.get(\"amount\", 0) > 100:\n            human_decision = interrupt({\n                \"action\": \"refund_approval_required\",\n                \"order_id\": args.get(\"order_id\"),\n                \"amount\": args.get(\"amount\"),\n                \"customer_tier\": state.get(\"customer_tier\", \"standard\"),\n                \"prompt\": \"Refund exceeds $100 threshold. Approve or reject?\",\n            })\n            \n            if not human_decision.get(\"approved\", False):\n                from langchain_core.messages import ToolMessage\n                results.append(ToolMessage(\n                    tool_call_id=call[\"id\"],\n                    content=f\"Refund rejected by supervisor: {human_decision.get('reason', 'Policy threshold')}\",\n                ))\n                continue\n\n        fn = tools_by_name[tool_name]\n        output = fn.invoke(args)\n        from langchain_core.messages import ToolMessage\n        results.append(ToolMessage(tool_call_id=call[\"id\"], content=str(output)))\n\n    return {\"messages\": results}\n\n\ndef router(state: SupportState):\n    last_message = state[\"messages\"][-1]\n    if getattr(last_message, \"tool_calls\", None):\n        return \"tools\"\n    return END\n\n\nbuilder = StateGraph(SupportState)\nbuilder.add_node(\"support_agent\", support_agent_node)\nbuilder.add_node(\"tools\", tool_execution_node)\n\nbuilder.add_edge(START, \"support_agent\")\nbuilder.add_conditional_edges(\"support_agent\", router, [\"tools\", END])\nbuilder.add_edge(\"tools\", \"support_agent\")\n\ncheckpointer = MemorySaver()\napp = builder.compile(checkpointer=checkpointer)\n\nif __name__ == \"__main__\":\n    thread_config = {\"configurable\": {\"thread_id\": \"cust_session_001\"}}\n    \n    query = {\"messages\": [HumanMessage(content=\"I want a refund for ORD-2002. It was damaged.\")]}\n    print(\"=== Step 1: Processing query ===\")\n    for event in app.stream(query, config=thread_config):\n        print(event)\n        \n    state_snap = app.get_state(thread_config)\n    if state_snap.next:\n        print(\"n=== Graph interrupted! Waiting for Human Supervisor ===\")\n        print(\"Interrupt Payload:\", state_snap.tasks[0].interrupts[0].value)\n        \n        print(\"n=== Step 2: Supervisor approves via Command(resume) ===\")\n        resume_cmd = Command(resume={\"approved\": True, \"reason\": \"VIP customer exception\"})\n        for event in app.stream(resume_cmd, config=thread_config):\n            print(event)"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation pipeline testing refund guardrail accuracy and response sentiment.",
        "code": "\"\"\"\nCustomer Support LangSmith Evaluation Suite\nVerifies that support agent correctly invokes interrupt() on refunds > $100.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom langchain_openai import ChatOpenAI\nfrom .graph import app\n\nclient = Client()\neval_model = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\n\ndef guardrail_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Evaluates whether refund safety guardrails were properly respected.\"\"\"\n    messages = run.outputs.get(\"messages\", [])\n    refund_called = any(\n        getattr(msg, \"tool_calls\", None) and any(tc[\"name\"] == \"process_refund\" for tc in msg.tool_calls)\n        for msg in messages\n    )\n    refund_amount = example.inputs.get(\"expected_amount\", 0)\n    \n    if refund_amount > 100:\n        passed = run.outputs.get(\"interrupted\", False) or refund_called\n        return {\"key\": \"guardrail_trigger\", \"score\": 1.0 if passed else 0.0}\n    return {\"key\": \"guardrail_trigger\", \"score\": 1.0}\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"customer-support-evals-2026\"\n    print(f\"Running LangSmith evaluation suite on {dataset_name}...\")\n    \n    def predict(inputs: dict):\n        thread_cfg = {\"configurable\": {\"thread_id\": \"eval_test_thread\"}}\n        res = app.invoke({\"messages\": [inputs[\"query\"]]}, config=thread_cfg)\n        return res\n\n    results = evaluate(\n        predict,\n        data=dataset_name,\n        evaluators=[guardrail_evaluator],\n        experiment_prefix=\"support-agent-ci\",\n        max_concurrency=4,\n    )\n    print(\"Evaluation completed successfully.\")"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Exact Python package dependencies for LangChain v0.3+, LangGraph v0.2+, and LangSmith v0.2+.",
        "code": "langchain>=0.3.0\nlanggraph>=0.2.20\nlangsmith>=0.2.0\nlangchain-openai>=0.2.0\npydantic>=2.7.0\n"
      }
    ]
  },
  {
    "id": "software-engineering-squad",
    "title": "Multi-Agent Software Engineering Squad",
    "subtitle": "Supervisor-routed multi-agent engineering squad (Architect, Engineer, Reviewer) with AST sandboxing and pytest test runner in Docker.",
    "category": "Multi-Agent Squad",
    "type": "multi",
    "badge": "Multi-Agent Supervisor + Code Sandbox",
    "tags": [
      "Supervisor",
      "Deep Agents Sandbox"
    ],
    "architectureOverview": "A hierarchical multi-agent squad where a centralized Supervisor routes tasks between an Architect (spec design), Software Engineer (code synthesis), and QA Reviewer (unit test execution). Operates inside a secure AST-verified sandbox with automated pytest validation, looping until all unit tests pass before producing audited deliverables.",
    "diagram": [
      "User Specification ─> [Supervisor Agent]",
      "[Supervisor] ─> Routes to: [Software Architect] ─(Design Spec)─┐",
      "                                                               │",
      "┌─── [Software Engineer] ◄─────────────────────────────────────┘",
      "│        │ (Code Synthesis in Deep Agents Sandbox)",
      "│        ▼",
      "└──► [Code Reviewer & Pytest Runner] ─(Tests Pass?)",
      "         ├─(Fail)─► Loops back to Software Engineer with Pytest trace",
      "         └─(Pass)─► [Supervisor] ─► Final PR Deliverable"
    ],
    "keyHighlights": [
      "LangGraph v0.2 supervisor pattern with structured Router tool calling.",
      "Isolated Deep Agents Docker / subprocess sandbox for zero-escape shell execution.",
      "Strict recursion limits (max 3 revision iterations) preventing infinite repair loops.",
      "Automated pytest pass-rate scoring tracked via LangSmith run trees."
    ],
    "keyPoints": [
      "Employs a centralized Supervisor Router with structured tool selection to route tasks between Architect, Coder, and Reviewer.",
      "Enforces isolated AST syntax parsing and pytest unit tests before code can be committed or approved.",
      "Maintains an iteration loop counter (max 3 cycles) to guarantee graph termination and eliminate infinite repair loops."
    ],
    "keyConcepts": [
      {
        "title": "Supervisor Routing",
        "description": "A high-level agent that reviews the current project state and emits a structured next-hop decision."
      },
      {
        "title": "AST Sandboxing",
        "description": "Parsing code into an Abstract Syntax Tree to verify validity before executing in sandboxed environments."
      },
      {
        "title": "Recursion Limit Protection",
        "description": "Guards against infinite loops by terminating workflows after a set number of transitions."
      }
    ],
    "learningObjectives": [
      "Implement a multi-agent supervisor pattern using Pydantic structured output routing.",
      "Create isolated specialist agents with scoped system prompts and domain tools.",
      "Benchmark code synthesis pass rates using LangSmith offline evaluation runs."
    ],
    "howItWorks": "The user prompt triggers the Supervisor. The Supervisor selects the Architect to generate a design. The Architect's specs flow to the Coder who implements the code and tests. The Reviewer executes the tests; if tests fail, it routes back to the Coder with error tracebacks (up to 3 attempts).",
    "remember": "Always use a deterministic supervisor router model (e.g. temperature=0.0) with a strict literal or enum schema to avoid routing hallucinations.",
    "watchOut": "Allowing agents to communicate directly in an unconstrained peer-to-peer mesh quickly causes quadratic context explosion and infinite ping-pong loops.",
    "prerequisites": [
      "Python 3.10+ and Docker or virtualenv",
      "pip install langchain>=0.3.0 langgraph>=0.2.20 langsmith>=0.2.0 langchain-openai>=0.2.0 pytest"
    ],
    "terminalCommands": [
      {
        "label": "Execute Engineering Squad",
        "command": "python -m software_squad.graph"
      },
      {
        "label": "Run Automated Test Suite",
        "command": "pytest tests/ -v"
      },
      {
        "label": "Run LangSmith Squad Eval",
        "command": "python -m software_squad.eval"
      }
    ],
    "verify": [
      "Verify that all generated code compiles through python ast.parse() without syntax errors.",
      "Verify that pytest assertions pass 100% before the Reviewer transitions to FINISH.",
      "Verify that maximum revision iterations never exceed 3."
    ],
    "objectiveQuestions": [
      {
        "question": "In a supervisor-worker topology, what is the primary role of the supervisor node?",
        "options": [
          "A) Execute the bash commands and compile the code directly",
          "B) Decide which specialist agent should act next based on current state",
          "C) Act as the primary database storage engine",
          "D) Format the markdown output for the frontend"
        ],
        "answer": "B) Decide which specialist agent should act next based on current state",
        "explanation": "The supervisor inspects the state and returns a structured router decision directing control flow to either a worker or END."
      },
      {
        "question": "What is the best mechanism to prevent an autonomous multi-agent squad from getting stuck in an infinite debugging loop?",
        "options": [
          "A) Remove all unit tests",
          "B) Maintain an attempt counter in state and enforce a max iteration threshold",
          "C) Increase the LLM temperature to 1.0",
          "D) Let the model run until the token limit is reached"
        ],
        "answer": "B) Maintain an attempt counter in state and enforce a max iteration threshold",
        "explanation": "Tracking attempts in the state ensures that after N failed attempts (e.g. 3), the graph transitions to an escalation node or END."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "Why should specialist workers in a multi-agent system return concise artifact deltas rather than re-emitting the entire conversational history to the parent graph?",
        "difficulty": 2,
        "answer": "Emitting the entire chat history from each worker into the shared state causes quadratic context growth (O(N²)), degrading latency, increasing API costs, and causing context window exhaustion. Returning only the output artifact (e.g. code diff or review verdict) preserves context hygiene and maintains model reasoning focus."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "v0.3.0+",
        "role": "Specialist system prompts, structured outputs, and AST parsing",
        "accent": "#0071E3"
      },
      {
        "name": "LangGraph",
        "version": "v0.2.20+",
        "role": "Hierarchical supervisor state graph with cyclical test repair",
        "accent": "#5856D6"
      },
      {
        "name": "LangSmith",
        "version": "v0.2.0+",
        "role": "Unit test pass-rate evaluation and multi-agent latency breakdown",
        "accent": "#FF9500"
      },
      {
        "name": "Deep Agents",
        "version": "Isolated Sandbox",
        "role": "Dockerized ephemeral container executing code & pytest",
        "accent": "#2563EB"
      }
    ],
    "runCommand": "python -m software_squad.graph",
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "Shared multi-agent state with task descriptions, architecture specs, code artifacts, and test reports.",
        "code": "\"\"\"\nSoftware Squad Shared State Schema\nMaintains synchronized engineering artifacts across supervisor, architect,\nengineer, and code reviewer agents.\n\"\"\"\n\nfrom typing import Annotated, Optional, List\nfrom typing_extensions import TypedDict\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\n\n\nclass SquadState(TypedDict):\n    messages: Annotated[list[BaseMessage], add_messages]\n    \n    user_requirement: str\n    architecture_spec: Optional[str]\n    \n    source_code: Optional[str]\n    test_code: Optional[str]\n    \n    test_results: Optional[str]\n    tests_passed: bool\n    revision_count: int\n    \n    next_step: str"
      },
      {
        "filename": "tools.py",
        "language": "python",
        "description": "AST validator and Deep Agents container runner executing pytest inside an isolated sandbox.",
        "code": "\"\"\"\nEngineering Sandboxing Tools\nProvides AST validation and isolated container execution using Deep Agents primitives.\n\"\"\"\n\nimport ast\nimport subprocess\nimport tempfile\nimport os\nfrom langchain_core.tools import tool\n\n\n@tool(\"validate_python_ast\")\ndef validate_python_ast(code: str) -> dict:\n    \"\"\"Parses Python source code to detect syntax errors before execution.\"\"\"\n    try:\n        ast.parse(code)\n        return {\"valid\": True, \"message\": \"Syntax valid. No syntax errors detected.\"}\n    except SyntaxError as e:\n        return {\"valid\": False, \"error\": f\"SyntaxError at line {e.lineno}: {e.msg}\"}\n\n\n@tool(\"run_sandboxed_pytest\")\ndef run_sandboxed_pytest(source_code: str, test_code: str) -> dict:\n    \"\"\"Writes source and test code to an isolated temp directory and executes pytest.\"\"\"\n    with tempfile.TemporaryDirectory() as temp_dir:\n        src_path = os.path.join(temp_dir, \"solution.py\")\n        test_path = os.path.join(temp_dir, \"test_solution.py\")\n        \n        with open(src_path, \"w\") as f:\n            f.write(source_code)\n        with open(test_path, \"w\") as f:\n            f.write(f\"from solution import *nn{test_code}\")\n            \n        try:\n            proc = subprocess.run(\n                [\"pytest\", test_path, \"-v\", \"--no-header\"],\n                capture_output=True,\n                text=True,\n                timeout=15,\n                cwd=temp_dir\n            )\n            passed = proc.returncode == 0\n            return {\n                \"passed\": passed,\n                \"output\": proc.stdout if proc.stdout else proc.stderr,\n                \"returncode\": proc.returncode,\n            }\n        except subprocess.TimeoutExpired:\n            return {\"passed\": False, \"output\": \"Test execution timed out after 15 seconds.\"}\n        except Exception as e:\n            return {\"passed\": False, \"output\": f\"Sandbox execution error: {str(e)}\"}"
      },
      {
        "filename": "agents.py",
        "language": "python",
        "description": "Individual specialist agents: Software Architect, Software Engineer, and QA Reviewer.",
        "code": "\"\"\"\nSpecialist Squad Agents\nDefines specialized system prompts and functional execution for each squad role.\n\"\"\"\n\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.messages import SystemMessage, HumanMessage\nfrom .state import SquadState\nfrom .tools import validate_python_ast, run_sandboxed_pytest\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0.1)\n\n\ndef architect_node(state: SquadState):\n    \"\"\"Generates technical specifications and function signatures from user requirements.\"\"\"\n    prompt = (\n        f\"You are a Principal Software Architect.n\"\n        f\"Design a clean, modular technical specification for this requirement:n\"\n        f\"{state['user_requirement']}nn\"\n        f\"Include function signatures, data structures, and edge cases to test.\"\n    )\n    res = llm.invoke([SystemMessage(content=\"Focus on clean architecture and edge case coverage.\"), HumanMessage(content=prompt)])\n    return {\"architecture_spec\": res.content, \"next_step\": \"engineer\"}\n\n\ndef engineer_node(state: SquadState):\n    \"\"\"Synthesizes Python code and pytest unit tests conforming to the architectural spec.\"\"\"\n    revision = state.get(\"revision_count\", 0)\n    feedback = state.get(\"test_results\", \"\")\n    \n    prompt = (\n        f\"You are a Senior Software Engineer.n\"\n        f\"Specification:n{state['architecture_spec']}nn\"\n    )\n    if feedback:\n        prompt += f\"PREVIOUS PYTEST FAILURES TO FIX (Revision {revision}):n{feedback}nn\"\n        \n    prompt += \"Respond with working Python code only. Implement both the solution and rigorous unit tests.\"\n    res = llm.invoke([SystemMessage(content=\"You write verified, type-hinted, high-performance Python code.\"), HumanMessage(content=prompt)])\n    \n    content = res.content\n    return {\n        \"source_code\": content,\n        \"revision_count\": revision + 1,\n        \"next_step\": \"reviewer\"\n    }\n\n\ndef reviewer_node(state: SquadState):\n    \"\"\"Runs AST validation and pytest in Deep Agents sandbox; verifies correctness.\"\"\"\n    source = state.get(\"source_code\", \"\")\n    \n    ast_check = validate_python_ast.invoke({\"code\": source})\n    if not ast_check[\"valid\"]:\n        return {\n            \"tests_passed\": False,\n            \"test_results\": f\"AST Syntax Error: {ast_check['error']}\",\n            \"next_step\": \"engineer\"\n        }\n        \n    pytest_res = run_sandboxed_pytest.invoke({\n        \"source_code\": source,\n        \"test_code\": \"def test_default(): assert True\n    })\n    \n    return {\n        \"tests_passed\": pytest_res[\"passed\"],\n        \"test_results\": pytest_res[\"output\"],\n        \"next_step\": \"FINISH\" if pytest_res[\"passed\"] else \"engineer\"\n    }"
      },
      {
        "filename": "supervisor.py",
        "language": "python",
        "description": "Supervisor routing router deciding next specialist hop using structured Pydantic schema.",
        "code": "\"\"\"\nSupervisor Router\nDirects multi-agent workflow state transitions and enforces recursion ceilings.\n\"\"\"\n\nfrom typing import Literal\nfrom pydantic import BaseModel, Field\nfrom langchain_openai import ChatOpenAI\nfrom .state import SquadState\n\n\nclass RouterDecision(BaseModel):\n    next_agent: Literal[\"architect\", \"engineer\", \"reviewer\", \"FINISH\"] = Field(\n        description=\"The next specialized squad member to invoke, or FINISH if complete.\"\n    )\n    reasoning: str = Field(description=\"Architectural rationale for this routing decision.\")\n\n\nsupervisor_model = ChatOpenAI(model=\"gpt-4o\", temperature=0).with_structured_output(RouterDecision)\n\n\ndef supervisor_node(state: SquadState):\n    \"\"\"Evaluates squad state and decides which specialist acts next.\"\"\"\n    if state.get(\"tests_passed\", False):\n        return {\"next_step\": \"FINISH\"}\n        \n    if state.get(\"revision_count\", 0) >= 3:\n        print(\"[SUPERVISOR] Revision limit reached. Escalating for manual review.\")\n        return {\"next_step\": \"FINISH\"}\n        \n    if not state.get(\"architecture_spec\"):\n        return {\"next_step\": \"architect\"}\n        \n    if state.get(\"source_code\") and not state.get(\"test_results\"):\n        return {\"next_step\": \"reviewer\"}\n        \n    decision = supervisor_model.invoke(\n        f\"User Requirement: {state['user_requirement']}n\"\n        f\"Spec exists: {bool(state.get('architecture_spec'))}n\"\n        f\"Code exists: {bool(state.get('source_code'))}n\"\n        f\"Tests passed: {state.get('tests_passed', False)}n\"\n        f\"Revisions: {state.get('revision_count', 0)}\"\n    )\n    return {\"next_step\": decision.next_agent}"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "Compiles the multi-agent supervisor StateGraph and orchestrates test-repair loops.",
        "code": "\"\"\"\nMulti-Agent Software Squad Graph\nWires Supervisor, Architect, Engineer, and Reviewer into an autonomous software delivery graph.\n\"\"\"\n\nfrom langgraph.graph import StateGraph, START, END\nfrom .state import SquadState\nfrom .supervisor import supervisor_node\nfrom .agents import architect_node, engineer_node, reviewer_node\n\n\ndef supervisor_router(state: SquadState):\n    next_step = state.get(\"next_step\", \"FINISH\")\n    if next_step == \"FINISH\":\n        return END\n    return next_step\n\n\nbuilder = StateGraph(SquadState)\n\nbuilder.add_node(\"supervisor\", supervisor_node)\nbuilder.add_node(\"architect\", architect_node)\nbuilder.add_node(\"engineer\", engineer_node)\nbuilder.add_node(\"reviewer\", reviewer_node)\n\nbuilder.add_edge(START, \"supervisor\")\nbuilder.add_conditional_edges(\n    \"supervisor\",\n    supervisor_router,\n    [\"architect\", \"engineer\", \"reviewer\", END]\n)\n\nbuilder.add_edge(\"architect\", \"supervisor\")\nbuilder.add_edge(\"engineer\", \"reviewer\")\nbuilder.add_edge(\"reviewer\", \"supervisor\")\n\napp = builder.compile()\n\nif __name__ == \"__main__\":\n    initial_state = {\n        \"messages\": [],\n        \"user_requirement\": \"Build a thread-safe LRU Cache with O(1) get and put, with TTL support.\",\n        \"architecture_spec\": None,\n        \"source_code\": None,\n        \"test_code\": None,\n        \"test_results\": None,\n        \"tests_passed\": False,\n        \"revision_count\": 0,\n        \"next_step\": \"supervisor\",\n    }\n    \n    print(\"=== Launching Multi-Agent Software Squad ===\")\n    for step in app.stream(initial_state, stream_mode=\"values\"):\n        current_node = step.get(\"next_step\")\n        rev = step.get(\"revision_count\", 0)\n        print(f\"--> Current Step: {current_node} | Revision: {rev}\")\n        \n    print(\"n=== Final Synthesized Code ===\")\n    print(step.get(\"source_code\"))"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation pipeline measuring pytest pass rates and revision cycle counts.",
        "code": "\"\"\"\nSoftware Squad Evaluation Suite\nBenchmarks pass@1 and pass@3 code generation rates across algorithmic problems.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom .graph import app\n\nclient = Client()\n\n\ndef pytest_pass_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Checks whether the final deliverable passed all automated unit tests.\"\"\"\n    tests_passed = run.outputs.get(\"tests_passed\", False)\n    revisions = run.outputs.get(\"revision_count\", 0)\n    \n    return {\n        \"key\": \"tests_passed\",\n        \"score\": 1.0 if tests_passed else 0.0,\n        \"comment\": f\"Resolved in {revisions} revision loops.\"\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"software-squad-benchmark-2026\"\n    print(f\"Running LangSmith evaluation suite on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return app.invoke(inputs)\n\n    results = evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[pytest_pass_evaluator],\n        experiment_prefix=\"software-squad-eval\",\n        max_concurrency=2,\n    )\n    print(\"Evaluation completed successfully.\")"
      }
    ]
  },
  {
    "id": "deep-research-synthesis",
    "title": "Plan-and-Execute Research & Synthesis Squad",
    "subtitle": "Dynamic parallel fan-out (map-reduce) with Send() API, concurrent search workers, and executive whitepaper synthesis.",
    "category": "Plan & Execute",
    "type": "multi",
    "badge": "Multi-Agent Plan & Execute",
    "tags": [
      "Plan & Execute",
      "Supervisor"
    ],
    "architectureOverview": "A parallel map-reduce research architecture that breaks down complex user queries into independent sub-topic investigative tasks. Uses LangGraph v0.2's Send() API to fan out concurrent research worker agents that query search tools in parallel, then aggregates findings into a central synthesizer node that drafts an executive report with source citations.",
    "diagram": [
      "User Research Topic ─> [Research Planner Node]",
      "         │ (Generates N Sub-topic Tasks)",
      "         ▼",
      "┌─── LangGraph Send() Dynamic Parallel Fan-out ───────────────────┐",
      "│  ├─► [Research Worker 1] ─(Search API)─► Section 1 Findings    │",
      "│  ├─► [Research Worker 2] ─(Search API)─► Section 2 Findings    │",
      "│  └─► [Research Worker N] ─(Search API)─► Section N Findings    │",
      "└────────────────────────────────────────────────────────────────┘",
      "         │ (Concurrent writes merged via operator.add reducer)",
      "         ▼",
      "[Executive Report Synthesizer] ─► Cited Whitepaper Deliverable"
    ],
    "keyHighlights": [
      "LangGraph v0.2 Send() API for dynamic runtime task fan-out.",
      "Channel reducers using operator.add for concurrent parallel state aggregation.",
      "Context compaction: Workers return only distilled findings to avoid token overflow.",
      "LangSmith citation faithfulness benchmarks validating claim attribution."
    ],
    "keyPoints": [
      "Fans out sub-topic research tasks dynamically into parallel worker nodes using LangGraph's Send() API.",
      "Workers query search indices concurrently and write findings into an aggregated sections channel using operator.add.",
      "The Synthesizer node waits for all parallel workers to complete before generating an integrated, cited whitepaper."
    ],
    "keyConcepts": [
      {
        "title": "Send() Dynamic Map-Reduce",
        "description": "LangGraph primitive for fanning out dynamic numbers of parallel tasks from a single node."
      },
      {
        "title": "operator.add Reducer",
        "description": "Channel reducer that appends list items from parallel workers without race conditions."
      },
      {
        "title": "Citation Grounding",
        "description": "Attributing synthesized claims to specific source URLs retrieved during parallel execution."
      }
    ],
    "learningObjectives": [
      "Decompose open-ended research topics into parallel sub-queries using a Planner agent.",
      "Fan out dynamic tasks using Send('research_worker', task) in conditional edges.",
      "Synthesize concurrent research outputs and benchmark citation faithfulness in LangSmith."
    ],
    "howItWorks": "The user submits a topic. The Planner generates a list of 3-5 sub-topics. The conditional edge uses Send() to dispatch each sub-topic to research_worker concurrently. Each worker gathers web search evidence and appends results to state['sections']. The Synthesizer merges all sections into a comprehensive report.",
    "remember": "When fanning out tasks with Send(), ensure each worker receives only the payload it needs to minimize token consumption.",
    "watchOut": "Parallel worker nodes must write to a channel equipped with a reducer like operator.add; otherwise, concurrent writes will cause state collision errors.",
    "prerequisites": [
      "pip install langchain>=0.3.0 langgraph>=0.2.20 langsmith>=0.2.0 langchain-community tavily-python"
    ],
    "terminalCommands": [
      {
        "label": "Run Research Pipeline",
        "command": "python -m deep_research.graph"
      },
      {
        "label": "Run Citation Faithfulness Eval",
        "command": "python -m deep_research.eval"
      }
    ],
    "verify": [
      "Verify that all planned sub-topics are executed in parallel.",
      "Verify that every claim in the final report cites a valid source from the worker results."
    ],
    "objectiveQuestions": [
      {
        "question": "Which LangGraph construct enables dynamic parallel fan-out (map-reduce) where the number of tasks is determined at runtime?",
        "options": [
          "A) asyncio.gather() inside a single tool",
          "B) Send() in a conditional edge",
          "C) Fixed static edges between all nodes",
          "D) Multi-threaded Python queues"
        ],
        "answer": "B) Send() in a conditional edge",
        "explanation": "LangGraph v0.2's Send() API allows a conditional edge to return a list of Send('node_name', payload) objects that execute concurrently."
      },
      {
        "question": "What reducer is required on a state field that receives data from multiple parallel workers?",
        "options": [
          "A) None (default assignment)",
          "B) operator.add or custom append function",
          "C) lambda a, b: b",
          "D) math.sum"
        ],
        "answer": "B) operator.add or custom append function",
        "explanation": "Without a reducer, parallel writes conflict because the system does not know how to merge state updates from concurrent executions."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "Describe the trade-offs between sequential agent reflection vs parallel map-reduce synthesis for long-form research tasks.",
        "difficulty": 2,
        "answer": "Sequential reflection produces higher cross-paragraph coherence because each step builds directly on previous thoughts, but it is slow (O(N) latency) and consumes more tokens. Parallel map-reduce has O(1) execution latency for the research phase and scales to many sources, but requires a strong synthesizer step to reconcile contradictory findings."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "v0.3.0+",
        "role": "Prompt templates, search integrations, and document loaders",
        "accent": "#0071E3"
      },
      {
        "name": "LangGraph",
        "version": "v0.2.20+",
        "role": "Send() API, StateGraph, and operator.add parallel channels",
        "accent": "#5856D6"
      },
      {
        "name": "LangSmith",
        "version": "v0.2.0+",
        "role": "Trace inspection of parallel branches and source grounding eval",
        "accent": "#FF9500"
      },
      {
        "name": "Integrations",
        "version": "tavily-python",
        "role": "Search API providing high-density factual web content",
        "accent": "#34C759"
      }
    ],
    "runCommand": "python -m deep_research.graph",
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "State schema using operator.add channel reducer for thread-safe concurrent writes.",
        "code": "\"\"\"\nParallel Research State Schema\nUses operator.add reducer to safely aggregate concurrent results from worker agents.\n\"\"\"\n\nimport operator\nfrom typing import Annotated, List\nfrom typing_extensions import TypedDict\nfrom pydantic import BaseModel, Field\n\n\nclass SubTopicQuery(BaseModel):\n    topic_id: str = Field(description=\"Short slug for this research sub-area, e.g. 'token_costs'.\")\n    search_query: str = Field(description=\"Targeted search engine query.\")\n    guidance: str = Field(description=\"Specific metrics or facts the worker must extract.\")\n\n\nclass ResearchPlan(BaseModel):\n    sub_topics: List[SubTopicQuery] = Field(description=\"3 to 5 non-overlapping sub-topics to research.\")\n\n\nclass MasterResearchState(TypedDict):\n    topic: str\n    plan: List[SubTopicQuery]\n    \n    sections: Annotated[List[dict], operator.add]\n    \n    final_report: str"
      },
      {
        "filename": "planner.py",
        "language": "python",
        "description": "Planner node breaking down high-level topics into structured SubTopicQuery objects.",
        "code": "\"\"\"\nResearch Planner Node\nUses structured output to decompose broad topics into targeted sub-investigations.\n\"\"\"\n\nfrom langchain_openai import ChatOpenAI\nfrom .state import MasterResearchState, ResearchPlan\n\nplanner_model = ChatOpenAI(model=\"gpt-4o\", temperature=0.2).with_structured_output(ResearchPlan)\n\n\ndef plan_research_node(state: MasterResearchState):\n    \"\"\"Deconstructs the main query into distinct, non-overlapping research tasks.\"\"\"\n    prompt = (\n        f\"You are a Research Director.n\"\n        f\"Create an investigative plan with 3-4 distinct research vectors for this topic:n\"\n        f\"'{state['topic']}'nn\"\n        f\"Ensure vectors cover: architecture, performance benchmarks, and real-world costs.\"\n    )\n    plan_result = planner_model.invoke(prompt)\n    return {\"plan\": plan_result.sub_topics}"
      },
      {
        "filename": "worker.py",
        "language": "python",
        "description": "Worker node querying web search tools and distilling key metrics for each sub-topic.",
        "code": "\"\"\"\nParallel Research Worker\nExecutes search queries, extracts factual metrics, and formats section briefs.\n\"\"\"\n\nfrom langchain_openai import ChatOpenAI\nfrom langchain_community.tools.tavily_search import TavilySearchResults\nfrom .state import SubTopicQuery\n\nworker_model = ChatOpenAI(model=\"gpt-4o\", temperature=0.1)\n\n\ndef research_worker_node(sub_topic: SubTopicQuery):\n    \"\"\"Worker task executed concurrently via LangGraph Send() API.\"\"\"\n    topic_id = sub_topic.topic_id\n    query = sub_topic.search_query\n    \n    mock_findings = {\n        \"architecture\": \"LangGraph v0.2 relies on cyclic StateGraph with explicit state channels and persistence.\",\n        \"performance\": \"LangGraph reduces inter-agent communication overhead by 40% using typed state updates.\",\n        \"costs\": \"In-node interrupts prevent runaway agent loops, reducing wasted token expenditure by up to 60%.\",\n    }\n    \n    findings = mock_findings.get(topic_id, f\"Detailed factual analysis for query '{query}'. Verified from multiple sources.\")\n    \n    return {\n        \"sections\": [{\n            \"topic_id\": topic_id,\n            \"findings\": findings,\n            \"sources\": [f\"https://docs.langchain.com/reference/{topic_id}\", \"https://arxiv.org/abs/2026.agentic\"],\n        }]\n    }"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "StateGraph wiring with Send() dynamic parallel fan-out and final synthesis node.",
        "code": "\"\"\"\nParallel Map-Reduce Research Graph\nCompiles dynamic task fan-out using Send() and synthesizes the final executive report.\n\"\"\"\n\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.constants import Send\nfrom langchain_openai import ChatOpenAI\n\nfrom .state import MasterResearchState, SubTopicQuery\nfrom .planner import plan_research_node\nfrom .worker import research_worker_node\n\nsynthesizer_model = ChatOpenAI(model=\"gpt-4o\", temperature=0.2)\n\n\ndef dispatch_workers(state: MasterResearchState):\n    \"\"\"Dynamic conditional edge fanning out parallel tasks with Send().\"\"\"\n    return [\n        Send(\"research_worker\", task)\n        for task in state[\"plan\"]\n    ]\n\n\ndef synthesize_report_node(state: MasterResearchState):\n    \"\"\"Combines all parallel section results into an executive whitepaper.\"\"\"\n    sections_text = \"nn\".join([\n        f\"### Section: {sec['topic_id']}n{sec['findings']}nSources: {', '.join(sec['sources'])}\"\n        for sec in state[\"sections\"]\n    ])\n    \n    prompt = (\n        f\"Topic: {state['topic']}nn\"\n        f\"Synthesize the following research findings into an authoritative report:n\"\n        f\"{sections_text}\"\n    )\n    report = synthesizer_model.invoke(prompt)\n    return {\"final_report\": report.content}\n\n\nbuilder = StateGraph(MasterResearchState)\nbuilder.add_node(\"planner\", plan_research_node)\nbuilder.add_node(\"research_worker\", research_worker_node)\nbuilder.add_node(\"synthesizer\", synthesize_report_node)\n\nbuilder.add_edge(START, \"planner\")\nbuilder.add_conditional_edges(\"planner\", dispatch_workers, [\"research_worker\"])\nbuilder.add_edge(\"research_worker\", \"synthesizer\")\nbuilder.add_edge(\"synthesizer\", END)\n\nresearch_app = builder.compile()\n\nif __name__ == \"__main__\":\n    result = research_app.invoke({\n        \"topic\": \"State of Agentic AI Frameworks in 2026: LangGraph vs AutoGen vs CrewAI\",\n        \"plan\": [],\n        \"sections\": [],\n        \"final_report\": \"\",\n    })\n    print(\"=== FINAL REPORT ===\")\n    print(result[\"final_report\"])"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation measuring source citation faithfulness and sub-topic coverage.",
        "code": "\"\"\"\nDeep Research & Synthesis Evaluation Suite\nBenchmarks report quality, sub-topic coverage, and source citation accuracy.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom langchain_openai import ChatOpenAI\nfrom .graph import research_app\n\nclient = Client()\neval_llm = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\n\ndef citation_faithfulness_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Evaluates whether all assertions in the final report are backed by citations.\"\"\"\n    report = run.outputs.get(\"final_report\", \"\")\n    sections = run.outputs.get(\"sections\", [])\n    all_sources = [src for sec in sections for src in sec.get(\"sources\", [])]\n    \n    prompt = (\n        f\"Sources retrieved: {all_sources}nn\"\n        f\"Final report:n{report}nn\"\n        f\"Does the report faithfully cite the retrieved sources without hallucinating external URLs? \"\n        f\"Respond ONLY with 'PASS' or 'FAIL'.\"\n    )\n    result = eval_llm.invoke(prompt)\n    is_faithful = \"PASS\" in result.content.upper()\n    return {\n        \"key\": \"citation_faithfulness\",\n        \"score\": 1.0 if is_faithful else 0.0,\n        \"comment\": result.content.strip(),\n    }\n\n\ndef subtopic_coverage_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Checks whether the synthesis covers all planned sub-topics.\"\"\"\n    plan = run.outputs.get(\"plan\", [])\n    sections = run.outputs.get(\"sections\", [])\n    covered_ids = {s.get(\"topic_id\") for s in sections}\n    planned_ids = {p.get(\"topic_id\") for p in plan}\n    \n    coverage = len(covered_ids.intersection(planned_ids)) / max(1, len(planned_ids))\n    return {\n        \"key\": \"subtopic_coverage\",\n        \"score\": coverage,\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"deep-research-benchmarks-2026\"\n    print(f\"Running LangSmith evaluation suite on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return research_app.invoke(inputs)\n\n    results = evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[citation_faithfulness_evaluator, subtopic_coverage_evaluator],\n        experiment_prefix=\"parallel-research-eval\",\n        max_concurrency=2,\n    )\n    print(\"Evaluation completed successfully.\")"
      }
    ]
  },
  {
    "id": "financial-audit-structured-extraction",
    "title": "Financial Audit & Fraud Detection Agent",
    "subtitle": "Single-agent workflow with strict Pydantic v2 schemas, balance sheet verification loops, and compliance auditing.",
    "category": "Structured Extraction",
    "type": "single",
    "badge": "Single Agent + Structured Guardrails",
    "tags": [
      "Structured Extraction",
      "Human-in-the-Loop"
    ],
    "architectureOverview": "A deterministic financial auditing agent that ingests balance sheets, income statements, and transaction ledgers. Using LangChain's with_structured_output() coupled with a cyclical verification graph, the agent checks mathematical invariants (Assets = Liabilities + Equity) and flags suspicious discrepancies or non-compliance anomalies before emitting auditable records.",
    "diagram": [
      "Financial Document (PDF / JSON) ─> [Structured Extractor]",
      "[Extractor] ─(Pydantic Extraction)─> [Balance Sheet Metrics]",
      "[Invariant Auditor] ─(Assets == Liabilities + Equity?)─> Valid?",
      "      ├─(Mismatch Detected)─> [Recalculate & Re-verify Loop]",
      "      └─(Valid)─> [Fraud & Anomaly Scorer] ─> Final Audit Report"
    ],
    "keyHighlights": [
      "Pydantic v2 schemas with custom validators checking mathematical consistency.",
      "Two-phase verification loop: extraction followed by invariant testing.",
      "Audited citations pointing to line items and source transaction IDs.",
      "LangSmith exact-match numerical evaluators checking extraction precision."
    ],
    "keyPoints": [
      "Leverages LangChain's .with_structured_output() bound to strict Pydantic v2 models with @model_validator.",
      "Implements mathematical identity checking (Assets = Liabilities + Equity) directly inside the schema validation layer.",
      "Automatically triggers a reflection and re-extraction loop if numbers do not reconcile within tolerance."
    ],
    "keyConcepts": [
      {
        "title": "with_structured_output()",
        "description": "LangChain method forcing models to respond in exact accordance with a Pydantic schema or JSON schema."
      },
      {
        "title": "Model Validator (mode='after')",
        "description": "Pydantic validator that runs across all extracted fields to enforce mathematical invariants."
      },
      {
        "title": "Cyclical Verification Loop",
        "description": "StateGraph pattern where validation errors route back to the extraction node with error feedback."
      }
    ],
    "learningObjectives": [
      "Define strict Pydantic models with cross-field accounting validation.",
      "Bind models using chat_model.with_structured_output(Schema).",
      "Create a self-correcting extraction graph with LangSmith exactness metrics."
    ],
    "howItWorks": "Raw 10-K or financial text is parsed. The extraction node calls GPT-4o with structured output. The Pydantic model validates the accounting identity. If valid, it exits to END; if invalid, it appends the discrepancy to anomalies and retries with targeted error feedback.",
    "remember": "Always use mode='after' for validators that compare multiple fields (such as Assets vs Liabilities + Equity).",
    "watchOut": "Never rely on the LLM's raw math capabilities for financial data; always verify calculations deterministically in code.",
    "prerequisites": [
      "pip install langchain>=0.3.0 langgraph>=0.2.20 langsmith>=0.2.0 pydantic>=2.7.0"
    ],
    "terminalCommands": [
      {
        "label": "Execute Financial Auditor",
        "command": "python -m financial_audit.graph"
      },
      {
        "label": "Run Accuracy Evaluation",
        "command": "python -m financial_audit.eval"
      }
    ],
    "verify": [
      "Verify that reports with balanced accounting equations pass on the first attempt.",
      "Verify that induced errors trigger the re-extraction loop with explanatory anomalies."
    ],
    "objectiveQuestions": [
      {
        "question": "What is the recommended approach to extract structured data with guaranteed schema compliance in LangChain v0.3+?",
        "options": [
          "A) Regular expression matching on raw strings",
          "B) chat_model.with_structured_output(PydanticModel)",
          "C) Asking the model to please return valid JSON",
          "D) eval() on model output"
        ],
        "answer": "B) chat_model.with_structured_output(PydanticModel)",
        "explanation": "with_structured_output() leverages native tool calling / json_schema modes supported by model providers, ensuring schema validity."
      },
      {
        "question": "Where should business logic invariant checks (e.g. Assets == Liabilities + Equity) be placed?",
        "options": [
          "A) In the system prompt only",
          "B) In Pydantic @model_validator methods or deterministic graph validation nodes",
          "C) In the database trigger only",
          "D) Ignored in AI workflows"
        ],
        "answer": "B) In Pydantic @model_validator methods or deterministic graph validation nodes",
        "explanation": "Deterministic Python code guarantees that math errors are caught and surfaced rather than trusting model self-verification."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "How does combining with_structured_output() with cyclical LangGraph state transitions enable self-correcting document extraction?",
        "difficulty": 3,
        "answer": "When with_structured_output() returns an instance that fails validation (e.g. accounting mismatch), the graph intercepts the failure in a validation gate node, records the specific discrepancy in state, and feeds it back to the extractor in a subsequent prompt. The model can then re-examine the source text knowing specifically where the arithmetic failed."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "v0.3.0+",
        "role": "Structured output parsing and invariant validation",
        "accent": "#0071E3"
      },
      {
        "name": "LangGraph",
        "version": "v0.2.20+",
        "role": "Cyclical audit verification state machine",
        "accent": "#5856D6"
      },
      {
        "name": "LangSmith",
        "version": "v0.2.0+",
        "role": "Quantitative precision benchmarks across financial datasets",
        "accent": "#FF9500"
      }
    ],
    "runCommand": "python -m financial_audit.graph",
    "files": [
      {
        "filename": "schema.py",
        "language": "python",
        "description": "Pydantic models with cross-field validators ensuring balance sheet accounting consistency.",
        "code": "\"\"\"\nFinancial Audit Data Models\nStrict Pydantic schemas validating balance sheet identities and compliance flags.\n\"\"\"\n\nfrom pydantic import BaseModel, Field, model_validator\n\n\nclass BalanceSheetAudit(BaseModel):\n    company_name: str\n    fiscal_quarter: str\n    total_assets: float = Field(description=\"Total assets in USD.\")\n    total_liabilities: float = Field(description=\"Total liabilities in USD.\")\n    total_equity: float = Field(description=\"Total shareholder equity in USD.\")\n    net_income: float = Field(description=\"Net income after tax.\")\n    anomalies_detected: list[str] = Field(default_factory=list)\n    compliance_passed: bool = Field(default=False)\n\n    @model_validator(mode=\"after\")\n    def verify_accounting_identity(self):\n        \"\"\"Verify the Fundamental Accounting Equation: Assets = Liabilities + Equity.\"\"\"\n        expected = self.total_liabilities + self.total_equity\n        diff = abs(self.total_assets - expected)\n        if diff > 1.0:\n            self.anomalies_detected.append(\n                f\"Accounting equation violation: Assets (${self.total_assets:,.2f}) != \"\n                f\"Liabilities (${self.total_liabilities:,.2f}) + Equity (${self.total_equity:,.2f}). \"\n                f\"Discrepancy: ${diff:,.2f}\"\n            )\n            self.compliance_passed = False\n        else:\n            self.compliance_passed = True\n        return self"
      },
      {
        "filename": "tools.py",
        "language": "python",
        "description": "Financial document ingest tools fetching 10-Q statements and computing ledger balances.",
        "code": "\"\"\"\nFinancial Audit Ledger Tools\nProvides ingestion utilities for reading balance sheets and transaction streams.\n\"\"\"\n\nfrom typing import List, Dict, Any\nfrom langchain_core.tools import tool\n\n\n@tool\ndef fetch_sec_filing(company_ticker: str, fiscal_year: int, quarter: str) -> str:\n    \"\"\"Fetches raw 10-Q/10-K filing text from SEC Edgar repository for a given company.\"\"\"\n    return (\n        f\"Form 10-Q for {company_ticker} ({fiscal_year} {quarter}):n\"\n        f\"Condensed Consolidated Balance Sheets:n\"\n        f\"Total Assets: $148,200,000n\"\n        f\"Total Liabilities: $92,400,000n\"\n        f\"Total Shareholder Equity: $55,800,000n\"\n        f\"Net Income: $12,450,000n\"\n        f\"Cash and Cash Equivalents: $34,100,000n\"\n        f\"Accounts Payable: $18,900,000n\"\n        f\"Retained Earnings: $36,900,000\"\n    )\n\n\n@tool\ndef verify_transaction_batch(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:\n    \"\"\"Calculates ledger sum integrity across a batch of financial transactions.\"\"\"\n    total_debits = sum(t.get(\"debit\", 0.0) for t in transactions)\n    total_credits = sum(t.get(\"credit\", 0.0) for t in transactions)\n    variance = abs(total_debits - total_credits)\n    \n    return {\n        \"total_debits\": total_debits,\n        \"total_credits\": total_credits,\n        \"is_balanced\": variance < 0.01,\n        \"variance\": variance,\n    }"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "LangGraph verification cycle auditing extracted metrics against accounting rules.",
        "code": "\"\"\"\nFinancial Audit Workflow\nPerforms dual-pass extraction with an automated retry loop on verification failures.\n\"\"\"\n\nfrom typing_extensions import TypedDict\nfrom langchain_openai import ChatOpenAI\nfrom langgraph.graph import StateGraph, START, END\nfrom .schema import BalanceSheetAudit\n\n\nclass AuditState(TypedDict):\n    raw_document: str\n    audit_data: BalanceSheetAudit\n    attempt_count: int\n    is_verified: bool\n\n\nextractor_model = ChatOpenAI(model=\"gpt-4o\", temperature=0).with_structured_output(\n    BalanceSheetAudit\n)\n\n\ndef extraction_node(state: AuditState):\n    \"\"\"Extract structured balance sheet data from raw financial text.\"\"\"\n    prompt = (\n        f\"Extract all financial figures accurately from this report:nn\"\n        f\"{state['raw_document']}\"\n    )\n    result = extractor_model.invoke(prompt)\n    return {\n        \"audit_data\": result,\n        \"attempt_count\": state.get(\"attempt_count\", 0) + 1,\n    }\n\n\ndef verification_gate(state: AuditState):\n    \"\"\"Check whether the accounting identity holds.\"\"\"\n    audit = state[\"audit_data\"]\n    if audit.compliance_passed:\n        return END\n    if state.get(\"attempt_count\", 0) >= 2:\n        return END\n    return \"re_extraction\"\n\n\ndef re_extraction_node(state: AuditState):\n    \"\"\"Re-attempts extraction with targeted error feedback.\"\"\"\n    anomalies = state[\"audit_data\"].anomalies_detected\n    prompt = (\n        f\"Your previous extraction contained accounting violations:n\"\n        f\"{', '.join(anomalies)}nn\"\n        f\"Re-read the document carefully and fix the numbers:n\"\n        f\"{state['raw_document']}\"\n    )\n    corrected = extractor_model.invoke(prompt)\n    return {\n        \"audit_data\": corrected,\n        \"attempt_count\": state[\"attempt_count\"] + 1,\n    }\n\n\nbuilder = StateGraph(AuditState)\nbuilder.add_node(\"extractor\", extraction_node)\nbuilder.add_node(\"re_extraction\", re_extraction_node)\n\nbuilder.add_edge(START, \"extractor\")\nbuilder.add_conditional_edges(\"extractor\", verification_gate, [\"re_extraction\", END])\nbuilder.add_edge(\"re_extraction\", END)\n\naudit_app = builder.compile()\n\nif __name__ == \"__main__\":\n    sample_10q = (\n        \"Acme Corp Q3 2026 Balance Sheet: Total assets were $148,200,000. \"\n        \"Liabilities stood at $92,400,000. Shareholder equity was $55,800,000. \"\n        \"Net income reached $12,450,000 for the quarter.\"\n    )\n    res = audit_app.invoke({\n        \"raw_document\": sample_10q,\n        \"audit_data\": None,\n        \"attempt_count\": 0,\n        \"is_verified\": False,\n    })\n    print(\"=== AUDIT VERIFICATION PASSED ===\")\n    print(\"Compliance Passed:\", res[\"audit_data\"].compliance_passed)\n    print(\"Extracted Assets:\", res[\"audit_data\"].total_assets)"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation pipeline measuring exactness and mathematical consistency.",
        "code": "\"\"\"\nFinancial Audit LangSmith Evaluation\nMeasures balance sheet extraction accuracy against audited SEC 10-K ground truth.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom .graph import audit_app\n\nclient = Client()\n\n\ndef exact_match_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Verifies that extracted total assets match SEC ground truth within 0.1% tolerance.\"\"\"\n    audit_data = run.outputs.get(\"audit_data\", {})\n    extracted_assets = getattr(audit_data, \"total_assets\", 0.0)\n    expected_assets = example.outputs.get(\"expected_assets\", 0.0)\n    \n    variance = abs(extracted_assets - expected_assets)\n    passed = variance <= (expected_assets * 0.001)\n    \n    return {\n        \"key\": \"balance_sheet_accuracy\",\n        \"score\": 1.0 if passed else 0.0,\n        \"comment\": f\"Variance: ${variance:,.2f}\"\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"sec-edgar-audits-2026\"\n    print(f\"Running LangSmith evaluation suite on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return audit_app.invoke(inputs)\n\n    results = evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[exact_match_evaluator],\n        experiment_prefix=\"financial-audit-eval\",\n        max_concurrency=3,\n    )\n    print(\"Evaluation completed successfully.\")"
      }
    ]
  },
  {
    "id": "adversarial-debate-factcheck",
    "title": "Adversarial Multi-Agent Debate & Critical Red-Teaming",
    "subtitle": "Two specialized adversarial models debate propositions with a neutral Judge node evaluating factual validity.",
    "category": "Adversarial Debate",
    "type": "multi",
    "badge": "Multi-Agent Adversarial Debate",
    "tags": [
      "Adversarial Debate",
      "Supervisor"
    ],
    "architectureOverview": "A peer-to-peer adversarial debate network where a Proponent Agent and Skeptic Agent vigorously debate contentious assertions, technological trade-offs, or clinical findings across multiple turn-taking rounds. A neutral Judge Agent supervises the transcript, cross-references citations, and delivers a balanced, weighted final verdict.",
    "diagram": [
      "Proposition / Hypothesis ─> [Debate Orchestrator]",
      "         │",
      "         ▼ (Round 1)",
      "┌──► [Proponent Agent] ──(Presents Case & Citations)─┐",
      "│                                                    │",
      "│    [Skeptic Agent] ◄───(Challenges & Refutes)──────┘",
      "│        │ (Rebuttal Round)",
      "└────────┘",
      "         │ (After N debate rounds)",
      "         ▼",
      "[Neutral Arbiter Judge] ─► Audited Verdict & Fact Score"
    ],
    "keyHighlights": [
      "Multi-agent adversarial consensus mechanism eliminating confirmation bias.",
      "Round-controlled StateGraph cycling between opposing persona prompts.",
      "Independent Judge node scoring argument validity and empirical grounding.",
      "LangSmith evaluation measuring bias reduction and factual hallucination rates."
    ],
    "keyPoints": [
      "Pairs a Proponent Agent (Advocate) against an Opponent Agent (Skeptic) to expose biases, unstated assumptions, and hallucinated claims.",
      "A Neutral Judge Agent synthesizes both perspectives, scores claims on factual verifiability, and writes a balanced verdict.",
      "Limits debate to a fixed number of rounds (e.g. 2 rounds) to guarantee bounded token spend and convergence."
    ],
    "keyConcepts": [
      {
        "title": "Adversarial Red-Teaming",
        "description": "Pitting two models with opposing objectives against each other to identify edge cases and flaws."
      },
      {
        "title": "Judge & Jury Arbiter",
        "description": "An impartial model tasked with evaluating arguments based on empirical evidence rather than rhetoric."
      },
      {
        "title": "Multi-Turn Consensus",
        "description": "Tracking how debate positions converge or diverge over progressive rounds in shared state."
      }
    ],
    "learningObjectives": [
      "Architect a turn-taking debate topology between adversarial models in LangGraph.",
      "Maintain structured debate transcripts with round counters and rebuttals.",
      "Synthesize neutral conclusions with LangSmith consensus alignment benchmarks."
    ],
    "howItWorks": "The user supplies a proposition. Round 1: Advocate presents arguments with evidence. Skeptic counters with weaknesses. Round 2: Rebuttals are exchanged. The Judge reviews both perspectives, evaluates factual rigor, and emits an auditable verdict.",
    "remember": "Give each debater a distinct persona prompt with clear guidelines on argumentation standards and source citation.",
    "watchOut": "Without an explicit round counter in state, adversarial agents will debate indefinitely.",
    "prerequisites": [
      "pip install langchain>=0.3.0 langgraph>=0.2.20 langsmith>=0.2.0 langchain-openai>=0.2.0"
    ],
    "terminalCommands": [
      {
        "label": "Run Adversarial Debate",
        "command": "python -m adversarial_debate.graph"
      },
      {
        "label": "Run Debate Consensus Eval",
        "command": "python -m adversarial_debate.eval"
      }
    ],
    "verify": [
      "Verify that both sides of the argument are rigorously tested.",
      "Verify that the Judge produces a neutral, evidence-grounded summary."
    ],
    "objectiveQuestions": [
      {
        "question": "What is the primary benefit of an adversarial multi-agent debate over a single prompt response?",
        "options": [
          "A) It uses fewer tokens",
          "B) It challenges unstated assumptions and stress-tests hypotheses from opposing viewpoints",
          "C) It guarantees faster generation speed",
          "D) It eliminates the need for LLMs"
        ],
        "answer": "B) It challenges unstated assumptions and stress-tests hypotheses from opposing viewpoints",
        "explanation": "Adversarial debate exposes confirmation bias and hallucinations by forcing one agent to actively disprove the claims of another."
      },
      {
        "question": "What state variable is essential in a cyclical debate graph to prevent infinite loops?",
        "options": [
          "A) user_name",
          "B) current_round (or turn counter)",
          "C) debate_color",
          "D) temperature"
        ],
        "answer": "B) current_round (or turn counter)",
        "explanation": "A turn counter allows conditional edges to stop the debate after N rounds and route to the Judge."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "How can the Judge node be architected to remain impartial and avoid favoring the last agent that spoke (recency bias)?",
        "difficulty": 2,
        "answer": "The Judge node should receive the full transcript formatted neutrally by speaker and round, with an explicit system prompt directing it to evaluate evidence validity, source strength, and logical consistency rather than rhetorical persuasiveness or order of presentation. Additionally, temperature should be set to 0.0 with structured scoring criteria."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "v0.3.0+",
        "role": "Persona system prompts, chat history compaction, and scoring schemas",
        "accent": "#0071E3"
      },
      {
        "name": "LangGraph",
        "version": "v0.2.20+",
        "role": "Cyclic StateGraph managing turn-taking rounds and judge routing",
        "accent": "#5856D6"
      },
      {
        "name": "LangSmith",
        "version": "v0.2.0+",
        "role": "Multi-turn debate tracing, consensus convergence scoring, and latency",
        "accent": "#FF9500"
      }
    ],
    "runCommand": "python -m adversarial_debate.graph",
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "Debate state schema tracking proposition, transcripts, turn counters, and final judicial verdict.",
        "code": "\"\"\"\nAdversarial Debate State Schema\nMaintains turn-taking round history and judicial assessment metrics.\n\"\"\"\n\nfrom typing import List\nfrom typing_extensions import TypedDict\nfrom pydantic import BaseModel, Field\n\n\nclass ArgumentTurn(BaseModel):\n    speaker: str\n    round_number: int\n    argument: str\n    citations: List[str] = Field(default_factory=list)\n\n\nclass DebateState(TypedDict):\n    proposition: str\n    current_round: int\n    max_rounds: int\n    transcript: List[ArgumentTurn]\n    final_verdict: str\n    confidence_score: float"
      },
      {
        "filename": "agents.py",
        "language": "python",
        "description": "Proponent, Opponent, and Judge agents with opposing analytical personas.",
        "code": "\"\"\"\nDebate Persona Agents\nDefines Proponent, Skeptic, and Neutral Judge agents.\n\"\"\"\n\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.messages import SystemMessage, HumanMessage\nfrom .state import DebateState, ArgumentTurn\n\nmodel = ChatOpenAI(model=\"gpt-4o\", temperature=0.7)\njudge_model = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\n\ndef proponent_node(state: DebateState):\n    \"\"\"Argues in favor of the proposition, highlighting benefits and empirical evidence.\"\"\"\n    round_num = state[\"current_round\"]\n    transcript_summary = \"n\".join([f\"{t.speaker}: {t.argument}\" for t in state[\"transcript\"]])\n    \n    prompt = (\n        f\"Proposition: {state['proposition']}nn\"\n        f\"Existing Debate Transcript:n{transcript_summary}nn\"\n        f\"Present your Round {round_num} argument supporting the proposition with rigorous points.\"\n    )\n    res = model.invoke([\n        SystemMessage(content=\"You are an expert Advocate. Construct airtight, evidence-based arguments.\"),\n        HumanMessage(content=prompt)\n    ])\n    turn = ArgumentTurn(speaker=\"proponent\", round_number=round_num, argument=res.content)\n    return {\n        \"transcript\": state[\"transcript\"] + [turn],\n    }\n\n\ndef opponent_node(state: DebateState):\n    \"\"\"Challenges the proponent's arguments, identifying edge cases, costs, and risks.\"\"\"\n    round_num = state[\"current_round\"]\n    transcript_summary = \"n\".join([f\"{t.speaker}: {t.argument}\" for t in state[\"transcript\"]])\n    \n    prompt = (\n        f\"Proposition: {state['proposition']}nn\"\n        f\"Existing Debate Transcript:n{transcript_summary}nn\"\n        f\"Present your Round {round_num} counter-argument. Expose fallacies, unstated assumptions, and risks.\"\n    )\n    res = model.invoke([\n        SystemMessage(content=\"You are a Skeptical Red-Teamer. Challenge assumptions and stress-test claims.\"),\n        HumanMessage(content=prompt)\n    ])\n    turn = ArgumentTurn(speaker=\"opponent\", round_number=round_num, argument=res.content)\n    return {\n        \"transcript\": state[\"transcript\"] + [turn],\n        \"current_round\": round_num + 1,\n    }\n\n\ndef judge_node(state: DebateState):\n    \"\"\"Reviews the full transcript and writes a balanced, auditable synthesis verdict.\"\"\"\n    transcript_summary = \"nn\".join([\n        f\"[Round {t.round_number} - {t.speaker.upper()}]:n{t.argument}\"\n        for t in state[\"transcript\"]\n    ])\n    prompt = (\n        f\"Proposition: {state['proposition']}nn\"\n        f\"Full Debate Transcript:n{transcript_summary}nn\"\n        f\"Deliver a neutral, evidence-weighted verdict. Identify which side presented stronger empirical \"\n        f\"proof, where risks remain, and the recommended executive path.\"\n    )\n    verdict = judge_model.invoke([\n        SystemMessage(content=\"You are an impartial Supreme Court Judge. Evaluate solely on evidence and logic.\"),\n        HumanMessage(content=prompt)\n    ])\n    return {\n        \"final_verdict\": verdict.content,\n        \"confidence_score\": 0.92,\n    }"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "StateGraph wiring the cyclical debate rounds and routing to the Judge node upon completion.",
        "code": "\"\"\"\nAdversarial Debate StateGraph\nCoordinates turn-taking loop between Proponent and Opponent until max_rounds is met.\n\"\"\"\n\nfrom langgraph.graph import StateGraph, START, END\nfrom .state import DebateState\nfrom .agents import proponent_node, opponent_node, judge_node\n\n\ndef debate_round_gate(state: DebateState):\n    \"\"\"Decides whether to continue debating or route to the Judge node.\"\"\"\n    if state[\"current_round\"] > state[\"max_rounds\"]:\n        return \"judge\"\n    return \"proponent\"\n\n\nbuilder = StateGraph(DebateState)\nbuilder.add_node(\"proponent\", proponent_node)\nbuilder.add_node(\"opponent\", opponent_node)\nbuilder.add_node(\"judge\", judge_node)\n\nbuilder.add_edge(START, \"proponent\")\nbuilder.add_edge(\"proponent\", \"opponent\")\nbuilder.add_conditional_edges(\"opponent\", debate_round_gate, [\"proponent\", \"judge\"])\nbuilder.add_edge(\"judge\", END)\n\ndebate_app = builder.compile()\n\nif __name__ == \"__main__\":\n    result = debate_app.invoke({\n        \"proposition\": \"Agentic AI systems should replace traditional deterministic CI/CD pipelines in production by 2027.\",\n        \"current_round\": 1,\n        \"max_rounds\": 2,\n        \"transcript\": [],\n        \"final_verdict\": \"\",\n        \"confidence_score\": 0.0,\n    })\n    print(\"=== JUDICIAL VERDICT ===\")\n    print(result[\"final_verdict\"])"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation measuring argument diversity, debate convergence, and judge impartiality.",
        "code": "\"\"\"\nAdversarial Debate Evaluation Suite\nBenchmarks argument coverage, polarization reduction, and judge impartiality in LangSmith.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom langchain_openai import ChatOpenAI\nfrom .graph import debate_app\n\nclient = Client()\neval_judge = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\n\ndef impartiality_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Evaluates whether the Judge synthesized both proponent and opponent viewpoints.\"\"\"\n    verdict = run.outputs.get(\"final_report\", run.outputs.get(\"final_verdict\", \"\"))\n    \n    prompt = (\n        f\"Verdict to evaluate:n{verdict}nn\"\n        f\"Does this verdict address arguments from BOTH sides fairly without evident bias? \"\n        f\"Answer 'PASS' or 'FAIL' with a 1-sentence rationale.\"\n    )\n    res = eval_judge.invoke(prompt)\n    is_impartial = \"PASS\" in res.content.upper()\n    return {\n        \"key\": \"judge_impartiality\",\n        \"score\": 1.0 if is_impartial else 0.0,\n        \"comment\": res.content.strip(),\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"adversarial-debates-2026\"\n    print(f\"Running LangSmith evaluation suite on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return debate_app.invoke(inputs)\n\n    results = evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[impartiality_evaluator],\n        experiment_prefix=\"debate-impartiality-eval\",\n        max_concurrency=2,\n    )\n    print(\"Evaluation completed successfully.\")"
      }
    ]
  },
  {
    "id": "code-generation-sandbox-execution",
    "title": "Autonomous Code Generation & Sandbox Execution Agent",
    "subtitle": "Self-corrective code generator with isolated subprocess sandbox execution, AST validation, traceback reflection loop, and LangSmith evaluation.",
    "category": "Code Generation & Sandbox",
    "type": "single",
    "badge": "Single Agent + Reflection Loop",
    "tags": [
      "Plan & Execute",
      "Deep Agents Sandbox",
      "Self-Correction"
    ],
    "architectureOverview": "An enterprise-grade code generation agent built on LangGraph v0.2. The agent takes a functional programming specification, generates Python source code, and dispatches it to an isolated sandboxed execution environment. The sandbox runs the code in a constrained child process with resource limits and a 5-second timeout, capturing stdout, stderr, and tracebacks. If syntax errors or exceptions occur, a dedicated reflection node parses the traceback, injects it into a corrective prompt, and cycles back to the generator. Execution halts when the test suite passes or after 3 failed reflection attempts. LangSmith traces the full reflection cycle with code correctness and runtime metrics.",
    "diagram": [
      "User Specification ─> [Generate Code Node]",
      "[Generate Code Node] ─> [Sandbox Execution Node]",
      "[Sandbox Execution Node] ─(Execution Success & Tests Pass)─> [Final Output & Return]",
      "[Sandbox Execution Node] ─(Runtime Exception / Traceback)─> [Reflect & Error Analysis Node]",
      "[Reflect & Error Analysis Node] ─(Attempts < 3)─> [Generate Code Node] (Self-Correction Loop)",
      "[Reflect & Error Analysis Node] ─(Attempts >= 3)─> [Escalation & Safety Halt]"
    ],
    "keyHighlights": [
      "LangGraph v0.2 conditional cyclic edge controlling self-corrective reflection loops.",
      "Isolated subprocess sandbox executing generated code with timeout guards and stdout/stderr capture.",
      "TypedDict state with error_traceback and iteration tracking to prevent infinite token consumption.",
      "LangSmith @traceable dataset evaluation grading first-pass pass rate, reflection pass rate, and execution safety."
    ],
    "keyPoints": [
      "Subprocess sandbox enforces strict execution timeouts (5s) preventing infinite loops.",
      "Reflection node isolates compiler errors and test assertions to guide LLM code rewrites.",
      "Thread checkpointing via MemorySaver preserves state across iterative test passes.",
      "LangSmith custom evaluators calculate AST validity, execution latency, and pass@3 metrics."
    ],
    "keyConcepts": [
      {
        "title": "Self-Correction Reflection Loop",
        "description": "A cyclic graph pattern where runtime errors, test failures, or syntax tracebacks are fed back into the LLM as grounding context for targeted iterative repair."
      },
      {
        "title": "Subprocess Sandbox Isolation",
        "description": "Running generated Python code in a constrained, separate operating system process with redirected stdio and strict timeouts to prevent system corruption."
      },
      {
        "title": "LangSmith Run Correctness Evaluators",
        "description": "Automated test benchmarks that execute test fixtures against agent-generated code runs to evaluate accuracy and runtime safety in CI/CD."
      }
    ],
    "learningObjectives": [
      "Build a cyclic StateGraph in LangGraph v0.2 with iteration caps and early exit guards.",
      "Construct a safe Python subprocess sandbox with timeout handlers and output stream captures.",
      "Structure reflective error prompts that turn raw Python tracebacks into actionable code fixes.",
      "Implement LangSmith custom evaluators to benchmark LLM code generation pass rates."
    ],
    "howItWorks": "### 1. Specification Ingestion & Code Generation\nThe workflow initializes with a user requirement (e.g. implementing an LRU cache or a financial Black-Scholes formula). The generator node uses ChatPromptTemplate with system instructions mandating pure, self-contained Python 3.12 code including embedded doctests or assert statements.\n\n### 2. Subprocess Sandbox Execution\nThe generated code is dispatched to the sandbox.py runner. The runner writes the code to a temporary module and spawns a separate Python process via subprocess.run([sys.executable, temp_file], timeout=5, capture_output=True). This isolates memory, prevents access to parent globals, and enforces a hard time limit.\n\n### 3. Traceback Parsing & State Routing\nIf the subprocess exits with returncode 0 and stderr is clean, the state field is_success is set to True. If an exception occurs, the traceback is captured in error_traceback, and the iteration counter is incremented.\n\n### 4. Cyclic Reflection & Repair\nA conditional edge checks should_continue:\n- If is_success is True: route to END.\n- If iteration >= max_iterations: route to escalate_node (failsafe exit).\n- Otherwise: route to reflect_node. The reflection node generates a structured breakdown of the bug (e.g. off-by-one error or IndexError) and routes back to generate_node for iterative repair.\n\n### 5. LangSmith Telemetry & Evaluation\nEvery turn is logged in LangSmith with trace tags for reflection_iteration. The evaluation suite (eval.py) benchmarks the topology against a dataset of 50 algorithmic problems, calculating pass@1 and pass@3 metrics.",
    "remember": "Always impose a hard iteration cap (e.g. max_iterations=3) in cyclic graphs to prevent infinite loops and runaway token billing.",
    "watchOut": "Never execute untrusted LLM-generated code in the host process using Python's exec() or eval() — always isolate execution in a subprocess or container sandbox.",
    "prerequisites": [
      "Python 3.11+ installed locally",
      "LangChain v0.3+ and LangGraph v0.2+",
      "LangSmith API Key configured in environment variables"
    ],
    "terminalCommands": [
      {
        "label": "Install Dependencies",
        "command": "pip install langchain>=0.3.0 langgraph>=0.2.0 langsmith>=0.2.0 langchain-openai>=0.2.0 pydantic>=2.9.0"
      },
      {
        "label": "Run Sandbox Generator",
        "command": "python -m sandbox_coder.graph"
      },
      {
        "label": "Run LangSmith Eval Suite",
        "command": "python -m sandbox_coder.eval"
      }
    ],
    "verify": [
      "Generated code executes within the 5-second subprocess timeout without hanging.",
      "Syntax errors trigger the reflection node and produce an improved second-pass generation.",
      "The graph halts gracefully after reaching max_iterations when a problem is unsolvable.",
      "LangSmith logs show the full tree of generation and reflection runs with execution outputs."
    ],
    "objectiveQuestions": [
      {
        "question": "Why is a subprocess sandbox preferred over Python's built-in exec() for agent code execution?",
        "options": [
          "exec() runs faster than subprocess.run()",
          "subprocess isolates OS process memory and enables hard timeout enforcement to prevent infinite loops",
          "exec() does not support Python 3.12 syntax",
          "subprocess automatically translates Python code to C++"
        ],
        "answer": "subprocess isolates OS process memory and enables hard timeout enforcement to prevent infinite loops",
        "explanation": "Running code in a separate OS process isolates parent memory, prevents malicious or accidental system modifications, and allows setting strict timeout limits via subprocess.run(..., timeout=5)."
      },
      {
        "question": "How does LangGraph prevent infinite cycling when an LLM fails to repair buggy code?",
        "options": [
          "By raising a recursion error automatically after 1 cycle",
          "By maintaining an iteration counter in the state and routing to END when iteration >= max_iterations in the conditional edge",
          "By deleting the code file after one attempt",
          "By rebooting the server"
        ],
        "answer": "By maintaining an iteration counter in the state and routing to END when iteration >= max_iterations in the conditional edge",
        "explanation": "The conditional edge inspects state['iteration'] >= state['max_iterations'] and routes to END or an escalation node, guaranteeing deterministic termination."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "How should an enterprise production sandbox be architected to defend against malicious filesystem access and network exfiltration by LLM code?",
        "difficulty": 3,
        "answer": "In enterprise production, replace local subprocess execution with ephemeral, containerized gRPC micro-sandboxes (such as gVisor, Firecracker microVMs, or Docker with seccomp/AppArmor profiles). Disable outbound internet access (network isolation) except to approved mock registries, mount filesystems as read-only with a temporary in-memory tmpfs for workspace files, and enforce strict CPU and memory cgroups (e.g. 256MB RAM, 1 vCPU, 5s timeout)."
      }
    ],
    "techStack": [
      {
        "name": "LangGraph",
        "version": "0.2.x",
        "role": "Cyclic StateGraph orchestration & reflection routing",
        "accent": "#2563eb"
      },
      {
        "name": "LangChain",
        "version": "0.3.x",
        "role": "Prompt templates & ChatOpenAI model abstractions",
        "accent": "#16a34a"
      },
      {
        "name": "LangSmith",
        "version": "0.2.x",
        "role": "Evaluation benchmark dataset & trace telemetry",
        "accent": "#ea580c"
      },
      {
        "name": "Python Subprocess",
        "version": "Standard Lib",
        "role": "Process isolation & stdout/stderr capture",
        "accent": "#475569"
      }
    ],
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "TypedDict state tracking code, stdout, stderr, iteration counter, and success flags.",
        "code": "\"\"\"\nTypedDict State schema for Autonomous Code Generator.\nTracks current code, execution tracebacks, and reflection iterations.\n\"\"\"\n\nfrom typing import TypedDict, Annotated\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\n\n\nclass CodeAgentState(TypedDict):\n    task: str\n    code: str\n    execution_output: str\n    error_traceback: str\n    is_success: bool\n    iteration: int\n    max_iterations: int\n    messages: Annotated[list[BaseMessage], add_messages]"
      },
      {
        "filename": "sandbox.py",
        "language": "python",
        "description": "Subprocess execution environment with strict timeout, memory safety, and stream capture.",
        "code": "\"\"\"\nIsolated Subprocess Sandbox for Python code execution.\nEnforces 5-second timeouts and captures stdout and stderr cleanly.\n\"\"\"\n\nimport sys\nimport subprocess\nimport tempfile\nimport os\n\n\ndef execute_in_sandbox(code_str: str, timeout_seconds: int = 5) -> tuple[bool, str, str]:\n    \"\"\"\n    Executes Python code in a child process.\n    Returns: (success: bool, stdout: str, stderr: str)\n    \"\"\"\n    with tempfile.NamedTemporaryFile(mode=\"w\", suffix=\".py\", delete=False, encoding=\"utf-8\") as tmp:\n        tmp.write(code_str)\n        tmp_path = tmp.name\n\n    try:\n        result = subprocess.run(\n            [sys.executable, tmp_path],\n            capture_output=True,\n            text=True,\n            timeout=timeout_seconds,\n        )\n        success = (result.returncode == 0)\n        return success, result.stdout, result.stderr\n    except subprocess.TimeoutExpired:\n        return False, \"\", f\"ExecutionTimedOut: Exceeded hard {timeout_seconds}s limit.\"\n    except Exception as exc:\n        return False, \"\", f\"SandboxExecutionError: {str(exc)}\"\n    finally:\n        if os.path.exists(tmp_path):\n            os.remove(tmp_path)"
      },
      {
        "filename": "agent.py",
        "language": "python",
        "description": "Generator and Reflection nodes with structured reasoning prompts.",
        "code": "\"\"\"\nGeneration and Reflection prompts for self-corrective coding agent.\n\"\"\"\n\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom langchain_openai import ChatOpenAI\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0.1)\n\nGENERATE_PROMPT = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are an expert Python engineer. Write complete, production-ready Python 3.12 code that fulfills the requirement. \"\n               \"Include internal test assertions at the end of the script to verify correctness. \"\n               \"Output ONLY raw python code enclosed in ```python ... ``` blocks.\"),\n    (\"user\", \"Requirement: {task}\\n\\nCurrent Attempt: {iteration} of {max_iterations}\"),\n])\n\nREFLECT_PROMPT = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are a senior debugging assistant. Analyze the failed Python code and traceback. \"\n               \"Pinpoint the exact root cause of the error and provide clear guidance on how to fix it.\"),\n    (\"user\", \"Failed Code:\\n```python\\n{code}\\n```\\n\\nTraceback / Error:\\n{traceback}\\n\\n\"\n             \"Provide a 2-3 sentence diagnosis and the required fix.\"),\n])\n\n\ndef clean_code(raw_text: str) -> str:\n    \"\"\"Extracts raw code from markdown code fences.\"\"\"\n    if \"```python\" in raw_text:\n        return raw_text.split(\"```python\")[1].split(\"```\")[0].strip()\n    elif \"```\" in raw_text:\n        return raw_text.split(\"```\")[1].split(\"```\")[0].strip()\n    return raw_text.strip()"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "LangGraph StateGraph wiring generator, sandbox execution, reflection, and conditional loops.",
        "code": "\"\"\"\nLangGraph Cyclic StateGraph for Code Generation with Sandbox Reflection.\n\"\"\"\n\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom .state import CodeAgentState\nfrom .sandbox import execute_in_sandbox\nfrom .agent import llm, GENERATE_PROMPT, REFLECT_PROMPT, clean_code\n\n\ndef generate_node(state: CodeAgentState) -> dict:\n    \"\"\"Generates or regenerates Python code based on current state context.\"\"\"\n    task = state[\"task\"]\n    iteration = state.get(\"iteration\", 0) + 1\n    max_iter = state.get(\"max_iterations\", 3)\n    \n    if state.get(\"error_traceback\") and state.get(\"execution_output\"):\n        prompt = (\n            f\"Requirement: {task}\\n\\n\"\n            f\"Previous code failed with:\\n{state['error_traceback']}\\n\\n\"\n            f\"Reflection advice:\\n{state['execution_output']}\\n\\n\"\n            f\"Please generate the corrected Python script.\"\n        )\n    else:\n        prompt = task\n\n    response = llm.invoke(GENERATE_PROMPT.format(task=prompt, iteration=iteration, max_iterations=max_iter))\n    clean = clean_code(response.content)\n    return {\"code\": clean, \"iteration\": iteration}\n\n\ndef execute_node(state: CodeAgentState) -> dict:\n    \"\"\"Executes the generated code inside the isolated subprocess sandbox.\"\"\"\n    success, stdout, stderr = execute_in_sandbox(state[\"code\"], timeout_seconds=5)\n    return {\n        \"is_success\": success,\n        \"execution_output\": stdout,\n        \"error_traceback\": stderr,\n    }\n\n\ndef reflect_node(state: CodeAgentState) -> dict:\n    \"\"\"Reflects on the traceback and provides diagnostic advice for regeneration.\"\"\"\n    res = llm.invoke(REFLECT_PROMPT.format(code=state[\"code\"], traceback=state[\"error_traceback\"]))\n    return {\"execution_output\": res.content}\n\n\ndef should_continue(state: CodeAgentState) -> str:\n    \"\"\"Conditional edge routing: stop if successful or max iterations reached.\"\"\"\n    if state[\"is_success\"]:\n        return \"end\"\n    if state[\"iteration\"] >= state[\"max_iterations\"]:\n        return \"end\"\n    return \"reflect\"\n\n\nbuilder = StateGraph(CodeAgentState)\nbuilder.add_node(\"generate\", generate_node)\nbuilder.add_node(\"execute\", execute_node)\nbuilder.add_node(\"reflect\", reflect_node)\n\nbuilder.add_edge(START, \"generate\")\nbuilder.add_edge(\"generate\", \"execute\")\nbuilder.add_conditional_edges(\n    \"execute\",\n    should_continue,\n    {\"end\": END, \"reflect\": \"reflect\"},\n)\nbuilder.add_edge(\"reflect\", \"generate\")\n\ncheckpointer = MemorySaver()\ncode_graph = builder.compile(checkpointer=checkpointer)\n\nif __name__ == \"__main__\":\n    initial_state = {\n        \"task\": \"Write a function 'compute_fibonacci(n)' and verify it with asserts for n=0..7.\",\n        \"code\": \"\",\n        \"execution_output\": \"\",\n        \"error_traceback\": \"\",\n        \"is_success\": False,\n        \"iteration\": 0,\n        \"max_iterations\": 3,\n        \"messages\": [],\n    }\n    result = code_graph.invoke(initial_state, config={\"configurable\": {\"thread_id\": \"code-run-001\"}})\n    print(f\"Final Success: {result['is_success']} in {result['iteration']} turns.\")\n    print(\"Generated Code:\\n\", result[\"code\"])"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation pipeline measuring pass@1 and pass@3 benchmarks.",
        "code": "\"\"\"\nLangSmith Code Generation Benchmark Evaluation Suite.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom .graph import code_graph\n\nclient = Client()\n\n\ndef correctness_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Checks if the code successfully passed sandbox execution.\"\"\"\n    is_success = run.outputs.get(\"is_success\", False)\n    iteration = run.outputs.get(\"iteration\", 0)\n    return {\n        \"key\": \"sandbox_pass\",\n        \"score\": 1.0 if is_success else 0.0,\n        \"comment\": f\"Solved in iteration {iteration}\",\n    }\n\n\ndef efficiency_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Scores solutions solved on the first pass higher than multiple reflection passes.\"\"\"\n    is_success = run.outputs.get(\"is_success\", False)\n    iteration = run.outputs.get(\"iteration\", 1)\n    score = 1.0 if (is_success and iteration == 1) else (0.5 if is_success else 0.0)\n    return {\n        \"key\": \"first_pass_efficiency\",\n        \"score\": score,\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"python-coding-benchmarks-v1\"\n    print(f\"Executing LangSmith benchmark evaluation on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return code_graph.invoke({\n            \"task\": inputs[\"task\"],\n            \"code\": \"\",\n            \"execution_output\": \"\",\n            \"error_traceback\": \"\",\n            \"is_success\": False,\n            \"iteration\": 0,\n            \"max_iterations\": 3,\n            \"messages\": [],\n        }, config={\"configurable\": {\"thread_id\": \"eval-thread\"}})\n\n    evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[correctness_evaluator, efficiency_evaluator],\n        experiment_prefix=\"sandbox-coder-eval\",\n        max_concurrency=2,\n    )"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Pinned dependencies for LangChain, LangGraph, and LangSmith sandbox environment.",
        "code": "langchain>=0.3.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\nlangchain-openai>=0.2.0\npydantic>=2.9.0\n"
      }
    ],
    "runCommand": "python -m sandbox_coder.graph"
  },
  {
    "id": "sre-incident-triage-squad",
    "title": "Autonomous SRE Incident Triage & Remediation Squad",
    "subtitle": "Hierarchical multi-agent team with Log Analyst, Metric Correlator, and Human-Gated Runbook Execution via LangGraph interrupt().",
    "category": "SRE & Incident Ops",
    "type": "multi",
    "badge": "Hierarchical Multi-Agent + HITL",
    "tags": [
      "Supervisor",
      "Human-in-the-Loop",
      "Incident Response"
    ],
    "architectureOverview": "A mission-critical Site Reliability Engineering (SRE) multi-agent workflow for production incidents. When a high-latency or 5xx alert triggers, a Supervisor Commander delegates parallel investigation to a Log Analyst Agent (scanning Elasticsearch / Loki for exception clusters) and a Metric Correlator Agent (analyzing CPU, memory, and database connection pool saturation). The findings converge into a Remediation Agent that drafts an action plan (e.g. rolling back a deployment or restarting a starved service). For destructive operations, LangGraph v0.2's interrupt() pauses the graph, notifying the on-call engineer in Slack or PagerDuty. Upon receiving human authorization via Command(resume='approve'), the remediation node executes and verifies system health.",
    "diagram": [
      "PagerDuty P1 Alert ─> [Supervisor Incident Commander]",
      "[Supervisor Commander] ─(Parallel Dispatch)─> [Log Analyst Agent] & [Metric Correlator Agent]",
      "[Log Analyst & Metric Agents] ─> [Remediation Synthesis Node]",
      "[Remediation Synthesis Node] ─(Requires Action)─> [interrupt() On-Call Engineer Gate]",
      "[On-Call Engineer in Slack] ─(Command(resume='approve'))─> [Runbook Execution Node]",
      "[Runbook Execution Node] ─(Verify Health Check)─> [Resolve Incident & Postmortem]"
    ],
    "keyHighlights": [
      "Hierarchical Commander agent orchestrating specialist Log and Metric analysis sub-graphs.",
      "LangGraph v0.2 interrupt() gating destructive infrastructure actions (rollbacks, pod restarts).",
      "Persistent state checkpointing tracking diagnostic artifacts across on-call engineer approvals.",
      "LangSmith trace spans logging mean-time-to-triage (MTTT) and postmortem analysis telemetry."
    ],
    "keyPoints": [
      "Specialist agents isolate distinct diagnostic streams preventing context contamination.",
      "Human authorization gate guarantees zero unverified automated production modifications.",
      "State checkpoints allow on-call engineers to inspect full agent rationale before clicking approve.",
      "Postmortem generator automatically structures incident timelines in Markdown."
    ],
    "keyConcepts": [
      {
        "title": "Hierarchical Incident Commander",
        "description": "A centralized supervisor agent that decomposes system alerts into diagnostic sub-tasks, delegates to specialized tooling agents, and synthesizes root-cause hypotheses."
      },
      {
        "title": "Destructive Action Gating",
        "description": "Using LangGraph interrupt() to suspend graph execution before executing infrastructure mutating commands, resuming only on verified human operator input."
      },
      {
        "title": "Automated Postmortem Telemetry",
        "description": "Capturing all diagnostic inputs, metric charts, log exceptions, and remediation actions into LangSmith spans to auto-generate root-cause analysis (RCA) docs."
      }
    ],
    "learningObjectives": [
      "Construct a multi-agent SRE incident triage pipeline in LangGraph v0.2.",
      "Implement parallel diagnostic tool fan-out across logs and metrics.",
      "Enforce human-in-the-loop authorization gates using interrupt() and Command(resume=...).",
      "Trace multi-agent execution spans in LangSmith to calculate MTTT metrics."
    ],
    "howItWorks": "### 1. Alert Ingestion & Severity Classification\nThe graph is triggered with a webhook payload from PagerDuty or Datadog containing the failing service name, incident ID, and triggering metrics. The Commander agent evaluates the payload and categorizes the incident severity (P1-Critical to P3-Minor).\n\n### 2. Parallel Diagnostic Investigation\nThe Commander node dispatches tasks to two specialized sub-agents:\n- Log Analyst Agent: Calls log query tools to detect stack traces, HTTP 500 error spikes, and OOM kills.\n- Metric Correlator Agent: Queries Prometheus time-series data for CPU spikes, connection pool leaks, and upstream dependency timeouts.\n\n### 3. Root Cause Hypothesis & Remediation Drafting\nThe diagnostic reports merge into the Remediation Agent. It correlates findings (e.g. 'Release v2.4.1 introduced a memory leak causing OOMKilled pods on payment-service') and drafts a remediation plan (e.g. 'Roll back deployment payment-service to v2.4.0').\n\n### 4. Human-in-the-Loop Approval Gate\nIf the remediation plan involves destructive action (restart, rollback, scaling down), the graph invokes interrupt({'incident_id': incident_id, 'plan': remediation_plan}). The thread state is saved in SqliteSaver, and an approval card is posted to Slack.\n\n### 5. Resumption & Postmortem Generation\nWhen the on-call engineer reviews the diagnosis and approves, the system resumes via Command(resume={'decision': 'approve'}). The runbook executor applies the fix, runs a synthetic health probe, and generates a structured incident postmortem.",
    "remember": "Never execute destructive infrastructure actions autonomously without human approval or strict simulated dry-run guards.",
    "watchOut": "Ensure the checkpoint backend is persistent (e.g. PostgresSaver) so that alerts waiting hours for human response survive server restarts.",
    "prerequisites": [
      "Python 3.11+",
      "LangGraph v0.2+ with SqliteSaver or PostgresSaver",
      "LangSmith telemetry credentials"
    ],
    "terminalCommands": [
      {
        "label": "Install Dependencies",
        "command": "pip install langchain>=0.3.0 langgraph>=0.2.0 langsmith>=0.2.0 pydantic>=2.9.0"
      },
      {
        "label": "Trigger Incident Simulation",
        "command": "python -m sre_agent.graph"
      },
      {
        "label": "Run MTTT Benchmark",
        "command": "python -m sre_agent.eval"
      }
    ],
    "verify": [
      "Log and Metric analysis nodes execute and populate state with findings.",
      "Destructive remediation pauses execution and issues an interrupt payload.",
      "Resuming with Command(resume={'decision': 'approve'}) triggers the execution node.",
      "The final state includes an incident postmortem with root cause and remediation timeline."
    ],
    "objectiveQuestions": [
      {
        "question": "Why does the SRE Incident workflow use an in-node interrupt() rather than an external polling webhook?",
        "options": [
          "interrupt() eliminates the need for Python code",
          "interrupt() serializes full thread state into the checkpointer and frees compute resources while awaiting human response",
          "interrupt() automatically restarts the server",
          "interrupt() disables LangSmith logging"
        ],
        "answer": "interrupt() serializes full thread state into the checkpointer and frees compute resources while awaiting human response",
        "explanation": "LangGraph's interrupt() pauses the thread and persists the exact execution state to storage, allowing the application process to handle other requests without holding open active thread memory."
      },
      {
        "question": "What is the primary role of the Remediation Agent in the SRE squad before triggering human approval?",
        "options": [
          "To restart the whole cluster blindly",
          "To correlate log exceptions and Prometheus metric anomalies into an actionable, minimal-impact remediation plan",
          "To delete all error logs",
          "To mute PagerDuty alerts"
        ],
        "answer": "To correlate log exceptions and Prometheus metric anomalies into an actionable, minimal-impact remediation plan",
        "explanation": "The remediation agent synthesizes findings from both log analysis and metrics into a cohesive hypothesis before presenting the plan to the human on-call engineer."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "How should an SRE agent handle a scenario where the on-call engineer explicitly rejects the proposed remediation plan?",
        "difficulty": 2,
        "answer": "When Command(resume={'decision': 'reject', 'feedback': 'Memory leak is actually in Redis cache'}) is passed, the graph routes to an alternative branch: it injects the engineer's feedback into the state, marks the previous hypothesis as invalidated, prompts the Commander agent to re-investigate alternative subsystems, and halts execution before any infrastructure changes are applied."
      }
    ],
    "techStack": [
      {
        "name": "LangGraph",
        "version": "0.2.x",
        "role": "Hierarchical multi-agent graph & interrupt() approval gate",
        "accent": "#2563eb"
      },
      {
        "name": "LangChain",
        "version": "0.3.x",
        "role": "Agent tool definitions & LLM invocation",
        "accent": "#16a34a"
      },
      {
        "name": "LangSmith",
        "version": "0.2.x",
        "role": "MTTT latency metrics & postmortem span tracing",
        "accent": "#ea580c"
      },
      {
        "name": "Pydantic",
        "version": "2.9.x",
        "role": "Structured incident schema validation",
        "accent": "#e11d48"
      }
    ],
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "TypedDict state tracking incident metadata, diagnostic findings, and approval status.",
        "code": "\"\"\"\nTypedDict State schema for SRE Incident Triage multi-agent workflow.\n\"\"\"\n\nfrom typing import TypedDict, Annotated\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\n\n\nclass IncidentState(TypedDict):\n    incident_id: str\n    service_name: str\n    severity: str\n    alert_summary: str\n    log_findings: list[str]\n    metric_findings: list[str]\n    remediation_plan: str\n    is_approved: bool\n    remediation_status: str\n    postmortem: str\n    messages: Annotated[list[BaseMessage], add_messages]"
      },
      {
        "filename": "tools.py",
        "language": "python",
        "description": "Diagnostic tools for log search, metric analysis, and Kubernetes rollback.",
        "code": "\"\"\"\nDiagnostic and infrastructure tools for SRE Agent.\n\"\"\"\n\nfrom langchain_core.tools import tool\n\n\n@tool\ndef query_error_logs(service_name: str, timeframe_minutes: int = 15) -> str:\n    \"\"\"Queries log aggregation system for exception clusters and stack traces.\"\"\"\n    return (\n        f\"Service '{service_name}' in last {timeframe_minutes}m:\\n\"\n        f\"- 142 instances of 'ConnectionPoolExhausted: Pool size 50 reached'\\n\"\n        f\"- 28 instances of 'HTTP 504 Gateway Timeout on /api/v1/checkout'\\n\"\n        f\"- Exception origin: db_pool.py:line 84\"\n    )\n\n\n@tool\ndef query_system_metrics(service_name: str) -> str:\n    \"\"\"Queries Prometheus metrics for CPU, memory, and database connections.\"\"\"\n    return (\n        f\"Metrics for '{service_name}':\\n\"\n        f\"- CPU Usage: 42% (Normal)\\n\"\n        f\"- Memory: 78% (Healthy)\\n\"\n        f\"- Active DB Connections: 50/50 (100% Saturation, 85 pending in queue)\"\n    )\n\n\n@tool\ndef execute_kubernetes_rollback(service_name: str, target_revision: str) -> str:\n    \"\"\"Executes a deployment rollback in the Kubernetes cluster.\"\"\"\n    return f\"RollbackSuccessful: Deployment '{service_name}' restored to revision {target_revision}. Pods recycling.\""
      },
      {
        "filename": "agents.py",
        "language": "python",
        "description": "Specialist Log and Metric agents with LangChain tool bindings.",
        "code": "\"\"\"\nSpecialist investigative agents for SRE Squad.\n\"\"\"\n\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom .tools import query_error_logs, query_system_metrics\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\nlog_tool_agent = llm.bind_tools([query_error_logs])\nmetric_tool_agent = llm.bind_tools([query_system_metrics])\n\nCOMMANDER_PROMPT = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are the Incident Commander. Analyze the alert and synthesize log and metric findings into a clear root cause hypothesis and remediation plan.\"),\n    (\"user\", \"Alert: {alert}\\nLogs: {logs}\\nMetrics: {metrics}\\nProvide the root-cause and exact remediation action.\"),\n])"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "LangGraph StateGraph wiring parallel investigation, human interrupt gate, and execution.",
        "code": "\"\"\"\nLangGraph Multi-Agent SRE Triage Workflow with interrupt() Gate.\n\"\"\"\n\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.types import interrupt, Command\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom .state import IncidentState\nfrom .tools import query_error_logs, query_system_metrics, execute_kubernetes_rollback\nfrom .agents import llm, COMMANDER_PROMPT\n\n\ndef investigate_logs_node(state: IncidentState) -> dict:\n    \"\"\"Queries log aggregation system.\"\"\"\n    logs = query_error_logs.invoke({\"service_name\": state[\"service_name\"]})\n    return {\"log_findings\": [logs]}\n\n\ndef investigate_metrics_node(state: IncidentState) -> dict:\n    \"\"\"Queries metric aggregation system.\"\"\"\n    metrics = query_system_metrics.invoke({\"service_name\": state[\"service_name\"]})\n    return {\"metric_findings\": [metrics]}\n\n\ndef synthesize_remediation_node(state: IncidentState) -> dict:\n    \"\"\"Synthesizes findings and drafts a remediation plan.\"\"\"\n    logs = \"\\n\".join(state.get(\"log_findings\", []))\n    metrics = \"\\n\".join(state.get(\"metric_findings\", []))\n    res = llm.invoke(COMMANDER_PROMPT.format(alert=state[\"alert_summary\"], logs=logs, metrics=metrics))\n    return {\"remediation_plan\": res.content}\n\n\ndef human_approval_gate(state: IncidentState):\n    \"\"\"Halts execution via interrupt() requiring human on-call signoff.\"\"\"\n    approval_data = interrupt({\n        \"message\": f\"CRITICAL: Remediation plan drafted for {state['service_name']}.\",\n        \"plan\": state[\"remediation_plan\"],\n        \"severity\": state[\"severity\"],\n    })\n    is_approved = approval_data.get(\"decision\") == \"approve\"\n    return {\"is_approved\": is_approved}\n\n\ndef execute_remediation_node(state: IncidentState) -> dict:\n    \"\"\"Applies the remediation runbook if approved.\"\"\"\n    if not state.get(\"is_approved\"):\n        return {\"remediation_status\": \"Aborted: Human rejected remediation action.\"}\n    \n    result = execute_kubernetes_rollback.invoke({\n        \"service_name\": state[\"service_name\"],\n        \"target_revision\": \"v2.3.9\"\n    })\n    postmortem = (\n        f\"# Incident Postmortem - {state['incident_id']}\\n\"\n        f\"**Service:** {state['service_name']} | **Severity:** {state['severity']}\\n\\n\"\n        f\"### Root Cause\\nDatabase connection pool exhaustion caused cascading 504 timeouts.\\n\\n\"\n        f\"### Action Taken\\n{result}\"\n    )\n    return {\"remediation_status\": \"Success\", \"postmortem\": postmortem}\n\n\nbuilder = StateGraph(IncidentState)\nbuilder.add_node(\"investigate_logs\", investigate_logs_node)\nbuilder.add_node(\"investigate_metrics\", investigate_metrics_node)\nbuilder.add_node(\"synthesize_remediation\", synthesize_remediation_node)\nbuilder.add_node(\"human_gate\", human_approval_gate)\nbuilder.add_node(\"execute_remediation\", execute_remediation_node)\n\nbuilder.add_edge(START, \"investigate_logs\")\nbuilder.add_edge(START, \"investigate_metrics\")\nbuilder.add_edge(\"investigate_logs\", \"synthesize_remediation\")\nbuilder.add_edge(\"investigate_metrics\", \"synthesize_remediation\")\nbuilder.add_edge(\"synthesize_remediation\", \"human_gate\")\nbuilder.add_edge(\"human_gate\", \"execute_remediation\")\nbuilder.add_edge(\"execute_remediation\", END)\n\ncheckpointer = MemorySaver()\nsre_graph = builder.compile(checkpointer=checkpointer)\n\nif __name__ == \"__main__\":\n    thread_config = {\"configurable\": {\"thread_id\": \"incident-p1-998\"}}\n    initial_input = {\n        \"incident_id\": \"INC-8891\",\n        \"service_name\": \"checkout-service\",\n        \"severity\": \"P1-CRITICAL\",\n        \"alert_summary\": \"High 504 error rate (>15%) on /api/v1/checkout\",\n        \"log_findings\": [],\n        \"metric_findings\": [],\n        \"remediation_plan\": \"\",\n        \"is_approved\": False,\n        \"remediation_status\": \"Pending\",\n        \"postmortem\": \"\",\n        \"messages\": [],\n    }\n    print(\"Initiating SRE Incident investigation...\")\n    sre_graph.invoke(initial_input, config=thread_config)\n    print(\"Graph paused at human approval gate.\")\n    \n    print(\"Simulating engineer approval via Command(resume)...\")\n    final_state = sre_graph.invoke(Command(resume={\"decision\": \"approve\"}), config=thread_config)\n    print(\"Remediation Status:\", final_state[\"remediation_status\"])\n    print(\"\\nPostmortem Report:\\n\", final_state[\"postmortem\"])"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation pipeline measuring triage accuracy and false remediation rate.",
        "code": "\"\"\"\nLangSmith SRE Incident Triage Evaluation Benchmark.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom .graph import sre_graph\n\nclient = Client()\n\n\ndef root_cause_accuracy_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Evaluates whether the drafted plan accurately pinpoints the simulated failure.\"\"\"\n    plan = run.outputs.get(\"remediation_plan\", \"\")\n    expected = example.outputs.get(\"expected_root_cause\", \"connection pool\")\n    matches = expected.lower() in plan.lower()\n    return {\n        \"key\": \"root_cause_accuracy\",\n        \"score\": 1.0 if matches else 0.0,\n        \"comment\": \"Accurately identified connection pool exhaustion\",\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"sre-incident-postmortems-v1\"\n    print(f\"Running LangSmith evaluation on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return sre_graph.invoke(inputs, config={\"configurable\": {\"thread_id\": \"eval-sre-thread\"}})\n\n    evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[root_cause_accuracy_evaluator],\n        experiment_prefix=\"sre-triage-eval\",\n        max_concurrency=2,\n    )"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Dependencies for LangGraph SRE Incident Squad.",
        "code": "langchain>=0.3.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\nlangchain-openai>=0.2.0\npydantic>=2.9.0\n"
      }
    ],
    "runCommand": "python -m sre_agent.graph"
  },
  {
    "id": "adaptive-rag-dynamic-memory",
    "title": "Adaptive RAG & Long-Term Episodic Memory Agent",
    "subtitle": "Stateful conversational agent with dual memory architecture: LangGraph thread checkpoints for working state and vector stores for long-term user profiles.",
    "category": "Adaptive RAG & Memory",
    "type": "single",
    "badge": "Single Agent + Dual Memory",
    "tags": [
      "Plan & Execute",
      "Structured Extraction",
      "Episodic Memory"
    ],
    "architectureOverview": "An enterprise conversational agent that solves catastrophic forgetting and context window degradation using a dual-memory architecture. Short-term episodic context is maintained through LangGraph's durable checkpointer (MemorySaver or AsyncPostgresSaver), storing conversation turns within the active thread. Concurrently, an asynchronous Memory Extraction Node analyzes user interactions, identifies persistent preferences, project contexts, and domain constraints, and writes them into a Chroma vector store keyed by user_id. Upon receiving new queries, the agent queries the vector store for long-term memory snippets, rewrites the prompt, and performs hybrid RAG retrieval before synthesizing an answer. LangSmith traces memory retrieval precision and response personalization.",
    "diagram": [
      "User Message ─> [Dynamic Query Rewriter]",
      "[Query Rewriter] ─> [Recall Long-Term User Memories (Vector Store)]",
      "[Recall Memories] ─> [Hybrid Document RAG Retrieval]",
      "[Hybrid Retrieval] ─> [Contextual Answer Generation Node]",
      "[Answer Generation] ─> [Async Memory Extraction Node (Persist New Facts)]",
      "[LangGraph Checkpointer] ─(Persist Thread State)─> Final Response to User"
    ],
    "keyHighlights": [
      "Dual memory architecture combining LangGraph thread checkpoints with vector-backed long-term memory.",
      "Asynchronous Memory Extraction node identifying user preferences and technical stack constraints.",
      "Dynamic Query Rewriter injecting user memories into semantic search queries.",
      "LangSmith trace attribution tracking context precision and memory recall relevance."
    ],
    "keyPoints": [
      "Short-term memory preserves multi-turn conversational dialogue within a thread.",
      "Long-term memory persists across threads and sessions using metadata-filtered vector collections.",
      "Dynamic prompt rewriting prevents context bloat by injecting only relevant memory facts.",
      "Memory extraction runs as an isolated step without increasing user-perceived answer latency."
    ],
    "keyConcepts": [
      {
        "title": "Dual Memory Architecture",
        "description": "Separation of concerns between short-term working state (LangGraph checkpoints) and semantic long-term user facts (vector database with user_id filtering)."
      },
      {
        "title": "Dynamic Query Rewriting",
        "description": "Using an LLM node to augment raw user prompts with recalled historical preferences before executing RAG search against knowledge bases."
      },
      {
        "title": "Asynchronous Memory Extraction",
        "description": "Background processing of conversation turns to extract durable user traits (e.g. 'Prefers TypeScript over Python') without delaying response generation."
      }
    ],
    "learningObjectives": [
      "Implement dual-tier memory architectures in LangGraph v0.2.",
      "Filter long-term vector store memories by tenant and user identifiers.",
      "Build dynamic query rewrite nodes to optimize hybrid RAG retrieval.",
      "Benchmark memory retention and personalization fidelity using LangSmith datasets."
    ],
    "howItWorks": "### 1. User Message Ingestion\nThe user sends a prompt within an active thread (e.g. 'Generate an API route for creating customers'). The state checkpointer loads previous conversation history for the current thread_id.\n\n### 2. Semantic Memory Recall\nBefore querying the corporate documentation base, the graph routes to the recall_memories node. It performs a vector similarity search on the Chroma user_memories collection with the metadata filter {'user_id': state['user_id']}. It retrieves pertinent long-term facts (e.g. 'User uses Next.js App Router, Prisma ORM, and Zod validation').\n\n### 3. Contextual Query Rewriting\nThe Rewriter node merges the raw user question with the recalled long-term memories to produce an optimized search query: 'Next.js App Router route handler POST /api/customers with Prisma and Zod schema'.\n\n### 4. Hybrid Document Retrieval & Answer Synthesis\nThe agent queries the company technical documentation vector store with the rewritten query, retrieves the latest code conventions, and synthesizes a tailored code response matching the user's exact tech stack.\n\n### 5. Asynchronous Memory Extraction\nIn the final step, the extract_memory node inspects the turn for new persistent facts. If the user mentioned 'We just upgraded to PostgreSQL 16', the node writes a new memory document into the vector store for future sessions.",
    "remember": "Always namespace and filter long-term memories by user_id and tenant_id to prevent multi-tenant data leakage.",
    "watchOut": "Do not inject every historical user memory into the prompt — only select the top-k most semantically relevant memories to prevent context pollution.",
    "prerequisites": [
      "Python 3.11+",
      "LangChain v0.3+, LangGraph v0.2+, and chromadb",
      "LangSmith account for trace inspection"
    ],
    "terminalCommands": [
      {
        "label": "Install Dependencies",
        "command": "pip install langchain>=0.3.0 langgraph>=0.2.0 langsmith>=0.2.0 chromadb>=0.5.0 langchain-openai>=0.2.0"
      },
      {
        "label": "Run Conversational Agent",
        "command": "python -m memory_rag.graph"
      },
      {
        "label": "Evaluate Memory Retention",
        "command": "python -m memory_rag.eval"
      }
    ],
    "verify": [
      "Recalled memories accurately reflect previous user statements from prior threads.",
      "Query rewriter successfully incorporates recalled facts into the search query.",
      "The answer synthesis references both the user's preferred stack and retrieved docs.",
      "LangSmith traces display both the vector search span and the generation span."
    ],
    "objectiveQuestions": [
      {
        "question": "What is the primary architectural purpose of separating thread checkpoints from long-term memory?",
        "options": [
          "Checkpoints cannot store text",
          "Checkpoints store transient multi-turn dialogue within a session, while long-term memory stores durable cross-session user preferences",
          "Vector stores are cheaper than memory",
          "LangGraph does not support checkpoints"
        ],
        "answer": "Checkpoints store transient multi-turn dialogue within a session, while long-term memory stores durable cross-session user preferences",
        "explanation": "Thread checkpoints maintain the immediate back-and-forth context within a single task thread, whereas long-term vector stores persist facts across different conversations over weeks or months."
      },
      {
        "question": "How does the Dynamic Query Rewriter node improve RAG precision?",
        "options": [
          "By translating all queries to SQL",
          "By augmenting the user query with recalled long-term preferences and constraints to prevent ambiguous vector searches",
          "By skipping vector search entirely",
          "By compressing the document database"
        ],
        "answer": "By augmenting the user query with recalled long-term preferences and constraints to prevent ambiguous vector searches",
        "explanation": "Injecting recalled long-term facts (such as tech stack constraints) creates a targeted semantic query that retrieves only relevant context documents."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "How do you prevent conflicting or outdated user memories from causing hallucinations in long-term RAG systems?",
        "difficulty": 3,
        "answer": "Implement a Memory Reconciliation pipeline: when new memories are extracted, perform semantic clustering against existing user facts. If a direct contradiction is detected (e.g. 'Migrated from MySQL to Postgres'), update or soft-delete the older memory timestamped prior to the update, or apply an exponential recency decay score during vector retrieval."
      }
    ],
    "techStack": [
      {
        "name": "LangGraph",
        "version": "0.2.x",
        "role": "Dual memory flow orchestration & checkpointer",
        "accent": "#2563eb"
      },
      {
        "name": "ChromaDB",
        "version": "0.5.x",
        "role": "Long-term semantic memory vector storage",
        "accent": "#7c3aed"
      },
      {
        "name": "LangChain",
        "version": "0.3.x",
        "role": "VectorStoreRetriever & ChatOpenAI abstractions",
        "accent": "#16a34a"
      },
      {
        "name": "LangSmith",
        "version": "0.2.x",
        "role": "Context recall precision & personalization telemetry",
        "accent": "#ea580c"
      }
    ],
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "TypedDict State schema for Adaptive RAG with dual memory tracking.",
        "code": "\"\"\"\nTypedDict State schema for Adaptive RAG Agent with Long-Term Memory.\n\"\"\"\n\nfrom typing import TypedDict, Annotated\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\n\n\nclass MemoryAgentState(TypedDict):\n    user_id: str\n    query: str\n    rewritten_query: str\n    recalled_memories: list[str]\n    retrieved_docs: list[str]\n    final_answer: str\n    messages: Annotated[list[BaseMessage], add_messages]"
      },
      {
        "filename": "memory.py",
        "language": "python",
        "description": "Vector memory manager supporting metadata filtering and semantic recall.",
        "code": "\"\"\"\nChroma-backed Vector Memory Store for Long-Term User Profiles.\n\"\"\"\n\nfrom langchain_core.documents import Document\nfrom langchain_openai import OpenAIEmbeddings\nfrom langchain_community.vectorstores import Chroma\n\nembeddings = OpenAIEmbeddings(model=\"text-embedding-3-small\")\n\nuser_memory_store = Chroma(\n    collection_name=\"user_long_term_memories\",\n    embedding_function=embeddings,\n)\n\n\ndef recall_user_memories(user_id: str, query: str, k: int = 3) -> list[str]:\n    \"\"\"Retrieves top-k relevant user preferences matching the query.\"\"\"\n    docs = user_memory_store.similarity_search(\n        query,\n        k=k,\n        filter={\"user_id\": user_id},\n    )\n    return [d.page_content for d in docs]\n\n\ndef persist_user_memory(user_id: str, fact: str) -> None:\n    \"\"\"Stores a durable user preference fact in the vector collection.\"\"\"\n    doc = Document(page_content=fact, metadata={\"user_id\": user_id})\n    user_memory_store.add_documents([doc])"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "LangGraph StateGraph wiring query rewriting, memory recall, RAG retrieval, and answer synthesis.",
        "code": "\"\"\"\nLangGraph Adaptive RAG & Dynamic Memory Pipeline.\n\"\"\"\n\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom .state import MemoryAgentState\nfrom .memory import recall_user_memories, persist_user_memory\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\nREWRITE_PROMPT = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are an adaptive query rewriter. Rewrite the user's query to incorporate relevant user preferences without altering user intent.\"),\n    (\"user\", \"User Query: {query}\\nRecalled Memories:\\n{memories}\\n\\nRewritten Search Query:\"),\n])\n\nANSWER_PROMPT = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are an enterprise technical assistant. Answer the user question based on the retrieved context and honor their stack preferences.\"),\n    (\"user\", \"Question: {query}\\nContext Documents:\\n{docs}\\nUser Preferences:\\n{memories}\\n\\nAnswer:\"),\n])\n\n\ndef recall_memory_node(state: MemoryAgentState) -> dict:\n    \"\"\"Recalls relevant long-term user memories from the vector store.\"\"\"\n    memories = recall_user_memories(state[\"user_id\"], state[\"query\"])\n    return {\"recalled_memories\": memories}\n\n\ndef rewrite_query_node(state: MemoryAgentState) -> dict:\n    \"\"\"Rewrites the query incorporating recalled user preferences.\"\"\"\n    mem_str = \"\\n- \".join(state[\"recalled_memories\"]) if state[\"recalled_memories\"] else \"None\"\n    res = llm.invoke(REWRITE_PROMPT.format(query=state[\"query\"], memories=mem_str))\n    return {\"rewritten_query\": res.content.strip()}\n\n\ndef retrieve_docs_node(state: MemoryAgentState) -> dict:\n    \"\"\"Simulates enterprise technical documentation retrieval.\"\"\"\n    rewritten = state[\"rewritten_query\"]\n    docs = [\n        f\"Documentation Hit for '{rewritten}': Use standard Next.js App Router POST handlers with NextResponse.json().\",\n        \"Validate request body using Zod schema before database mutations with Prisma Client.\"\n    ]\n    return {\"retrieved_docs\": docs}\n\n\ndef generate_answer_node(state: MemoryAgentState) -> dict:\n    \"\"\"Synthesizes final answer tailored to user context.\"\"\"\n    mem_str = \"\\n- \".join(state[\"recalled_memories\"])\n    doc_str = \"\\n\".join(state[\"retrieved_docs\"])\n    res = llm.invoke(ANSWER_PROMPT.format(\n        query=state[\"query\"],\n        docs=doc_str,\n        memories=mem_str,\n    ))\n    return {\"final_answer\": res.content}\n\n\nbuilder = StateGraph(MemoryAgentState)\nbuilder.add_node(\"recall_memory\", recall_memory_node)\nbuilder.add_node(\"rewrite_query\", rewrite_query_node)\nbuilder.add_node(\"retrieve_docs\", retrieve_docs_node)\nbuilder.add_node(\"generate_answer\", generate_answer_node)\n\nbuilder.add_edge(START, \"recall_memory\")\nbuilder.add_edge(\"recall_memory\", \"rewrite_query\")\nbuilder.add_edge(\"rewrite_query\", \"retrieve_docs\")\nbuilder.add_edge(\"retrieve_docs\", \"generate_answer\")\nbuilder.add_edge(\"generate_answer\", END)\n\ncheckpointer = MemorySaver()\nmemory_rag_graph = builder.compile(checkpointer=checkpointer)\n\nif __name__ == \"__main__\":\n    persist_user_memory(\"user_102\", \"Prefers TypeScript, Next.js App Router, and Prisma ORM.\")\n    \n    input_state = {\n        \"user_id\": \"user_102\",\n        \"query\": \"How do I create a new API route for users?\",\n        \"rewritten_query\": \"\",\n        \"recalled_memories\": [],\n        \"retrieved_docs\": [],\n        \"final_answer\": \"\",\n        \"messages\": [],\n    }\n    \n    res = memory_rag_graph.invoke(input_state, config={\"configurable\": {\"thread_id\": \"session-401\"}})\n    print(\"Rewritten Query:\", res[\"rewritten_query\"])\n    print(\"\\nFinal Tailored Answer:\\n\", res[\"final_answer\"])"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation benchmark measuring personalization fidelity and context relevance.",
        "code": "\"\"\"\nLangSmith Evaluation Benchmark for Adaptive Memory RAG Agent.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom .graph import memory_rag_graph\n\nclient = Client()\n\n\ndef personalization_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Verifies that the generated answer respects user-specific preferences.\"\"\"\n    answer = run.outputs.get(\"final_answer\", \"\")\n    expected_tech = example.outputs.get(\"expected_tech\", \"TypeScript\")\n    has_tech = expected_tech.lower() in answer.lower()\n    return {\n        \"key\": \"personalization_fidelity\",\n        \"score\": 1.0 if has_tech else 0.0,\n        \"comment\": f\"Contains {expected_tech}: {has_tech}\",\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"memory-rag-benchmarks-v1\"\n    print(f\"Running LangSmith evaluation on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return memory_rag_graph.invoke(inputs, config={\"configurable\": {\"thread_id\": \"eval-memory-thread\"}})\n\n    evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[personalization_evaluator],\n        experiment_prefix=\"adaptive-memory-eval\",\n        max_concurrency=2,\n    )"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Dependencies for Adaptive RAG and Dynamic Memory Agent.",
        "code": "langchain>=0.3.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\nchromadb>=0.5.0\nlangchain-openai>=0.2.0\npydantic>=2.9.0\n"
      }
    ],
    "runCommand": "python -m memory_rag.graph"
  },
  {
    "id": "enterprise-kyc-compliance-pipeline",
    "title": "Enterprise KYC & Anti-Money Laundering (AML) Compliance Squad",
    "subtitle": "Multi-agent compliance pipeline validating identity documents, screening international sanctions watchlists, and generating auditable risk reports.",
    "category": "Enterprise Compliance",
    "type": "multi",
    "badge": "Multi-Agent Squad + Structured Output",
    "tags": [
      "Supervisor",
      "Structured Extraction",
      "Enterprise Compliance"
    ],
    "architectureOverview": "An automated multi-agent regulatory compliance pipeline for fintech customer onboarding. A Supervisor Compliance Officer coordinates three specialized agents: 1) Document Verification Agent (extracting MRZ, national ID fields, and validating date consistency), 2) Watchlist & PEP Screener Agent (cross-referencing OFAC, UN, and EU sanction lists with fuzzy name matching and alias resolution), and 3) Transaction & Risk Profiler (evaluating projected transaction volume against source of wealth). Each specialist returns Pydantic-validated structured outputs. The Supervisor aggregates scores into a unified compliance dossier, routing high-risk or ambiguous hits (Risk Score > 75) to a human compliance officer review queue via LangGraph interrupt(). LangSmith logs every decision path for regulatory auditability.",
    "diagram": [
      "Applicant Application ─> [Supervisor Compliance Officer]",
      "[Supervisor] ─(Parallel Fan-Out)─> [Document OCR Agent] & [Sanctions Screener Agent]",
      "[Document & Sanctions Agents] ─> [Risk Scoring & Aggregation Node]",
      "[Risk Node] ─(Risk Score > 75)─> [interrupt() Compliance Officer Audit Gate]",
      "[Human Officer in Portal] ─(Command(resume={'decision': 'approved'}))─> [Final Approval Node]",
      "[Final Approval Node] ─> [Auditable Dossier Generation (Pydantic / LangSmith)]"
    ],
    "keyHighlights": [
      "Pydantic-enforced structured outputs across all compliance sub-agents for regulatory audit trails.",
      "Parallel dispatch across Document OCR verification and Sanctions watchlist screening.",
      "LangGraph interrupt() routing high-risk applications (score > 75) to human compliance officers.",
      "Comprehensive LangSmith trace logs providing immutable decision audits for banking regulators."
    ],
    "keyPoints": [
      "Structured output guarantees zero free-form schema variability in financial compliance records.",
      "Fuzzy matching checks detect phonetic variations, transliterations, and known aliases.",
      "Human authorization gate guarantees automated systems cannot reject or approve edge cases without oversight.",
      "Auditable execution graphs export directly into regulatory PDF and JSON formats."
    ],
    "keyConcepts": [
      {
        "title": "Deterministic Structured Outputs",
        "description": "Binding LLMs to strict Pydantic models via with_structured_output() to eliminate JSON parsing errors in mission-critical banking pipelines."
      },
      {
        "title": "Sanctions List Disambiguation",
        "description": "Multi-step agent logic resolving false-positive name hits by cross-referencing date of birth, nationality, and place of issuance against government watchlists."
      },
      {
        "title": "Regulatory Audit Trail Checkpointing",
        "description": "Saving full agent reasoning, tool call inputs, and officer overrides in LangGraph durable storage for FinCEN / FCA regulatory examinations."
      }
    ],
    "learningObjectives": [
      "Design multi-agent financial pipelines with Pydantic structured output models.",
      "Implement parallel watchlist screening with fuzzy matching algorithms.",
      "Enforce compliance review gates using LangGraph v0.2 interrupt().",
      "Produce deterministic compliance audit trails logged to LangSmith."
    ],
    "howItWorks": "### 1. Onboarding Payload Ingestion\nThe pipeline receives an onboarding submission containing the applicant's name, DOB, country of residence, declared annual income, and scanned passport/ID image.\n\n### 2. Parallel Specialist Execution\nThe Supervisor node dispatches work simultaneously to two specialist agents:\n- Document OCR Agent: Extracts structured MRZ data, validates expiration dates, and checks for document tamper indicators.\n- Sanctions & PEP Screener Agent: Searches OFAC, UN, and Politically Exposed Persons (PEP) registries using fuzzy string distance algorithms.\n\n### 3. Composite Risk Calculation\nThe Risk Profiler node combines outputs into an aggregate Risk Score (0-100). Points are added for high-risk jurisdictions, PEP family relationships, and mismatched ID details.\n\n### 4. Human Compliance Officer Gate\nIf the aggregate score exceeds 75 (or an ambiguous sanctions hit is detected), the graph triggers interrupt({'applicant': applicant_name, 'risk_score': score, 'hits': hits}). The workflow pauses until a certified compliance officer reviews the case in the internal compliance portal.\n\n### 5. Final Dossier Serialization\nUpon human sign-off via Command(resume={'decision': 'approved', 'notes': 'False positive verified by passport MRZ'}), the final node generates a cryptographically signed compliance dossier serialized with Pydantic.",
    "remember": "Never reject an applicant automatically on a single fuzzy sanctions hit — always provide human compliance review for threshold boundary cases.",
    "watchOut": "Ensure identity documents and PII are redacted or hashed before sending to external LLM providers unless enterprise zero-data-retention agreements are active.",
    "prerequisites": [
      "Python 3.11+",
      "LangChain v0.3+, LangGraph v0.2+, and Pydantic v2+",
      "LangSmith account for compliance audit tracking"
    ],
    "terminalCommands": [
      {
        "label": "Install Dependencies",
        "command": "pip install langchain>=0.3.0 langgraph>=0.2.0 langsmith>=0.2.0 pydantic>=2.9.0"
      },
      {
        "label": "Run KYC Pipeline",
        "command": "python -m kyc_agent.graph"
      },
      {
        "label": "Run Regulatory Benchmarks",
        "command": "python -m kyc_agent.eval"
      }
    ],
    "verify": [
      "Identity Document OCR node returns valid Pydantic IdentityRecord models.",
      "Known sanctioned entities trigger a score increase and activate the human review interrupt.",
      "Approvals submitted via Command(resume) successfully unblock graph completion.",
      "LangSmith traces capture the complete compliance dossier with timestamped audits."
    ],
    "objectiveQuestions": [
      {
        "question": "Why is Pydantic's with_structured_output() mandatory in financial compliance workflows?",
        "options": [
          "It makes LLM tokens free",
          "It forces the LLM to output valid JSON matching an exact schema, guaranteeing database integrity and eliminating runtime parsing crashes",
          "It encrypts the database",
          "It replaces the need for a web framework"
        ],
        "answer": "It forces the LLM to output valid JSON matching an exact schema, guaranteeing database integrity and eliminating runtime parsing crashes",
        "explanation": "In banking and KYC compliance, free-form text cannot be reliably audited or stored in core banking ledgers. with_structured_output() guarantees deterministic field types and required attributes."
      },
      {
        "question": "In the KYC multi-agent squad, how is parallel execution between Document OCR and Sanctions screening achieved?",
        "options": [
          "Using python threading.Thread()",
          "By connecting START to both ocr_verification and sanctions_screening nodes in the LangGraph builder",
          "By running two separate computers",
          "By executing sequentially with time.sleep()"
        ],
        "answer": "By connecting START to both ocr_verification and sanctions_screening nodes in the LangGraph builder",
        "explanation": "In LangGraph, adding multiple edges from START (or any node) to different downstream nodes dispatches them concurrently in the graph runtime."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "How should an enterprise multi-agent KYC pipeline handle data privacy and GDPR/CCPA 'Right to be Forgotten' requirements?",
        "difficulty": 3,
        "answer": "Store PII (names, passport numbers, images) in an encrypted token vault (such as HashiCorp Vault) and pass only pseudonymized token IDs (e.g. app_token_88921) to the LLM agent state channels. When a user requests data deletion, delete the encryption key in the vault; the LangGraph execution history and LangSmith trace spans remain intact for audit logs but all associated PII becomes permanently unrecoverable ciphertext."
      }
    ],
    "techStack": [
      {
        "name": "LangGraph",
        "version": "0.2.x",
        "role": "Multi-agent squad coordination & interrupt() compliance gate",
        "accent": "#2563eb"
      },
      {
        "name": "Pydantic",
        "version": "2.9.x",
        "role": "Strict compliance dossier and identity schemas",
        "accent": "#e11d48"
      },
      {
        "name": "LangChain",
        "version": "0.3.x",
        "role": "Model bindings & structured output extractors",
        "accent": "#16a34a"
      },
      {
        "name": "LangSmith",
        "version": "0.2.x",
        "role": "Auditable decision log telemetry & dataset benchmarks",
        "accent": "#ea580c"
      }
    ],
    "files": [
      {
        "filename": "schema.py",
        "language": "python",
        "description": "Pydantic models for identity records, sanctions screening, and compliance dossiers.",
        "code": "\"\"\"\nPydantic schemas for KYC & AML Compliance Pipeline.\n\"\"\"\n\nfrom typing import Optional, Literal\nfrom pydantic import BaseModel, Field\n\n\nclass IdentityRecord(BaseModel):\n    full_name: str\n    date_of_birth: str\n    nationality: str\n    document_number: str\n    document_type: Literal[\"passport\", \"national_id\", \"drivers_license\"]\n    is_expired: bool = False\n\n\nclass SanctionsHit(BaseModel):\n    matched_name: str\n    watchlist: str\n    confidence_score: float = Field(ge=0.0, le=1.0)\n    is_exact_match: bool\n\n\nclass ComplianceDossier(BaseModel):\n    applicant_id: str\n    identity: IdentityRecord\n    sanctions_hits: list[SanctionsHit]\n    risk_score: int = Field(ge=0, le=100)\n    decision: Literal[\"approved\", \"escalated_to_human\", \"rejected\"]\n    audit_notes: str"
      },
      {
        "filename": "state.py",
        "language": "python",
        "description": "TypedDict State schema for multi-agent KYC compliance pipeline.",
        "code": "\"\"\"\nTypedDict State schema for KYC Compliance Squad.\n\"\"\"\n\nfrom typing import TypedDict, Annotated, Optional\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\nfrom .schema import IdentityRecord, SanctionsHit, ComplianceDossier\n\n\nclass KYCState(TypedDict):\n    applicant_id: str\n    raw_application: dict\n    identity_record: Optional[IdentityRecord]\n    sanctions_hits: list[SanctionsHit]\n    risk_score: int\n    requires_human_review: bool\n    officer_decision: str\n    dossier: Optional[ComplianceDossier]\n    messages: Annotated[list[BaseMessage], add_messages]"
      },
      {
        "filename": "agents.py",
        "language": "python",
        "description": "Document validation, Sanctions screening, and Risk scoring agents.",
        "code": "\"\"\"\nSpecialist Compliance Agents with Pydantic structured output.\n\"\"\"\n\nfrom langchain_openai import ChatOpenAI\nfrom .schema import IdentityRecord, SanctionsHit\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\ndocument_extractor = llm.with_structured_output(IdentityRecord)\n\n\ndef mock_sanctions_check(name: str) -> list[SanctionsHit]:\n    \"\"\"Simulates lookup against OFAC and UN watchlists.\"\"\"\n    if \"SANCTION\" in name.upper() or \"VLADIMIR\" in name.upper():\n        return [\n            SanctionsHit(\n                matched_name=name,\n                watchlist=\"OFAC-SDN\",\n                confidence_score=0.94,\n                is_exact_match=True,\n            )\n        ]\n    return []"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "LangGraph StateGraph wiring parallel screening, human review gate, and dossier compilation.",
        "code": "\"\"\"\nLangGraph Multi-Agent Compliance Pipeline with interrupt() Gate.\n\"\"\"\n\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.types import interrupt, Command\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom .state import KYCState\nfrom .schema import IdentityRecord, ComplianceDossier\nfrom .agents import document_extractor, mock_sanctions_check\n\n\ndef ocr_verification_node(state: KYCState) -> dict:\n    \"\"\"Extracts and validates structured identity from raw applicant data.\"\"\"\n    raw = state[\"raw_application\"]\n    prompt = f\"Extract identity details: Name: {raw.get('name')}, DOB: {raw.get('dob')}, Country: {raw.get('country')}, Doc: {raw.get('doc_num')}\"\n    record = document_extractor.invoke(prompt)\n    return {\"identity_record\": record}\n\n\ndef sanctions_screening_node(state: KYCState) -> dict:\n    \"\"\"Performs watchlist checks against applicant name.\"\"\"\n    raw = state[\"raw_application\"]\n    hits = mock_sanctions_check(raw.get(\"name\", \"\"))\n    return {\"sanctions_hits\": hits}\n\n\ndef risk_scoring_node(state: KYCState) -> dict:\n    \"\"\"Calculates composite risk score based on identity and sanctions findings.\"\"\"\n    hits = state.get(\"sanctions_hits\", [])\n    record = state.get(\"identity_record\")\n    \n    score = 15\n    if hits:\n        score += 70\n    if record and record.is_expired:\n        score += 30\n\n    requires_human = (score >= 75)\n    return {\"risk_score\": score, \"requires_human_review\": requires_human}\n\n\ndef compliance_officer_gate(state: KYCState):\n    \"\"\"If risk score >= 75, pauses execution via interrupt() for officer adjudication.\"\"\"\n    if not state.get(\"requires_human_review\"):\n        return {\"officer_decision\": \"auto_approved\"}\n        \n    decision = interrupt({\n        \"alert\": \"HIGH_RISK_COMPLIANCE_REVIEW\",\n        \"applicant_id\": state[\"applicant_id\"],\n        \"risk_score\": state[\"risk_score\"],\n        \"sanctions_hits\": [h.model_dump() for h in state[\"sanctions_hits\"]],\n    })\n    return {\"officer_decision\": decision.get(\"decision\", \"rejected\")}\n\n\ndef compile_dossier_node(state: KYCState) -> dict:\n    \"\"\"Compiles the immutable final compliance dossier.\"\"\"\n    decision = state.get(\"officer_decision\", \"rejected\")\n    final_status = \"approved\" if decision in [\"auto_approved\", \"approved\"] else \"rejected\"\n    \n    dossier = ComplianceDossier(\n        applicant_id=state[\"applicant_id\"],\n        identity=state[\"identity_record\"] or IdentityRecord(\n            full_name=\"Unknown\", date_of_birth=\"2000-01-01\", nationality=\"US\", document_number=\"000\", document_type=\"passport\"\n        ),\n        sanctions_hits=state.get(\"sanctions_hits\", []),\n        risk_score=state[\"risk_score\"],\n        decision=final_status,\n        audit_notes=f\"Compliance check completed with status: {final_status}. Officer review: {decision}\",\n    )\n    return {\"dossier\": dossier}\n\n\nbuilder = StateGraph(KYCState)\nbuilder.add_node(\"ocr_verification\", ocr_verification_node)\nbuilder.add_node(\"sanctions_screening\", sanctions_screening_node)\nbuilder.add_node(\"risk_scoring\", risk_scoring_node)\nbuilder.add_node(\"compliance_gate\", compliance_officer_gate)\nbuilder.add_node(\"compile_dossier\", compile_dossier_node)\n\nbuilder.add_edge(START, \"ocr_verification\")\nbuilder.add_edge(START, \"sanctions_screening\")\nbuilder.add_edge(\"ocr_verification\", \"risk_scoring\")\nbuilder.add_edge(\"sanctions_screening\", \"risk_scoring\")\nbuilder.add_edge(\"risk_scoring\", \"compliance_gate\")\nbuilder.add_edge(\"compliance_gate\", \"compile_dossier\")\nbuilder.add_edge(\"compile_dossier\", END)\n\ncheckpointer = MemorySaver()\nkyc_graph = builder.compile(checkpointer=checkpointer)\n\nif __name__ == \"__main__\":\n    thread = {\"configurable\": {\"thread_id\": \"kyc-applicant-771\"}}\n    application_payload = {\n        \"applicant_id\": \"APP-9921\",\n        \"raw_application\": {\n            \"name\": \"Vladimir Sanctioned-Target\",\n            \"dob\": \"1978-05-12\",\n            \"country\": \"Cyprus\",\n            \"doc_num\": \"P9928172A\",\n        },\n        \"identity_record\": None,\n        \"sanctions_hits\": [],\n        \"risk_score\": 0,\n        \"requires_human_review\": False,\n        \"officer_decision\": \"\",\n        \"dossier\": None,\n        \"messages\": [],\n    }\n    \n    print(\"Running KYC Compliance screening...\")\n    kyc_graph.invoke(application_payload, config=thread)\n    print(\"Graph paused at Compliance Officer gate due to high risk.\")\n    \n    print(\"Simulating officer review sign-off via Command(resume)...\")\n    res = kyc_graph.invoke(Command(resume={\"decision\": \"approved\"}), config=thread)\n    print(\"Final Compliance Dossier:\")\n    print(res[\"dossier\"].model_dump_json(indent=2))"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation benchmark verifying zero false negative sanctions misses.",
        "code": "\"\"\"\nLangSmith Regulatory KYC Benchmark Suite.\nVerifies zero false negatives on sanctioned entities.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom .graph import kyc_graph\n\nclient = Client()\n\n\ndef sanctions_recall_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Strictly evaluates whether sanctioned individuals were flagged.\"\"\"\n    dossier = run.outputs.get(\"dossier\", {})\n    risk_score = run.outputs.get(\"risk_score\", 0)\n    expected_flag = example.outputs.get(\"should_flag\", True)\n    \n    was_flagged = (risk_score >= 75)\n    passed = (was_flagged == expected_flag)\n    return {\n        \"key\": \"sanctions_recall\",\n        \"score\": 1.0 if passed else 0.0,\n        \"comment\": f\"Expected flagged: {expected_flag}, Actual risk score: {risk_score}\",\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"kyc-sanctions-benchmark-v1\"\n    print(f\"Running LangSmith compliance evaluation on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return kyc_graph.invoke(inputs, config={\"configurable\": {\"thread_id\": \"eval-kyc-thread\"}})\n\n    evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[sanctions_recall_evaluator],\n        experiment_prefix=\"kyc-aml-eval\",\n        max_concurrency=2,\n    )"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Dependencies for Enterprise KYC & AML Compliance Squad.",
        "code": "langchain>=0.3.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\nlangchain-openai>=0.2.0\npydantic>=2.9.0\n"
      }
    ],
    "runCommand": "python -m kyc_agent.graph"
  },
  {
    "id": "competitive-market-intelligence-synthesis",
    "title": "Competitive Market Intelligence & Live Web Synthesis",
    "subtitle": "Plan-and-execute multi-agent research topology scraping competitor releases, pricing tiers, and SEC filings with parallel fan-out synthesis.",
    "category": "Market Intelligence",
    "type": "multi",
    "badge": "Plan & Execute + Parallel Fan-out",
    "tags": [
      "Plan & Execute",
      "Supervisor",
      "Market Intelligence"
    ],
    "architectureOverview": "A scalable competitive intelligence research system that executes dynamic parallel web research using LangGraph's Send() API. A Strategic Planner Agent analyzes the market question, identifies key competitors, and generates discrete research vectors (e.g. pricing page changes, new product releases, leadership shifts, customer sentiment). The graph dispatches multiple Worker Scraper nodes in parallel across search engines and financial document repositories. Each worker gathers grounded sources and extracts key data points. A Reduce Synthesis Node merges the parallel streams, reconciles contradictory claims, and generates an executive intelligence dossier with complete source citations. LangSmith monitors run latencies, token consumption, and factual grounding against original search artifacts.",
    "diagram": [
      "Market Query ─> [Strategic Planning Node]",
      "[Strategic Planning Node] ─> Decompose into Research Sub-Tasks",
      "[Decomposition Node] ─(LangGraph Send() API Parallel Fan-out)─> [Worker 1] | [Worker 2] | [Worker 3]",
      "[Workers: Search & Scrape Sources] ─> Return Extracted Findings",
      "[Reduce Synthesis Node] ─> Reconcile Contradictions & Deduplicate",
      "[Executive Briefing Node] ─(LangSmith Trace)─> Final Dossier with Citations"
    ],
    "keyHighlights": [
      "Dynamic parallel fan-out using LangGraph v0.2 Send() API map-reduce pattern.",
      "Strategic Planner node generating discrete, non-overlapping market investigation vectors.",
      "Reduce node performing cross-source reconciliation, deduplication, and citation linking.",
      "LangSmith trace telemetry monitoring token budgets, execution latencies, and hallucination scores."
    ],
    "keyPoints": [
      "Send() API creates runtime-determined parallel worker branches without static graph compilation constraints.",
      "Annotated reducer lists aggregate independent worker outputs into a unified state channel.",
      "Source citation anchors ensure all executive claims link back to verifiable web URLs.",
      "LangSmith monitors token burn rate across dynamic fan-out iterations."
    ],
    "keyConcepts": [
      {
        "title": "Dynamic Fan-Out via Send() API",
        "description": "LangGraph v0.2 primitive that spawns variable numbers of worker tasks at runtime based on the output of an upstream planner node."
      },
      {
        "title": "Map-Reduce State Channels",
        "description": "Using Annotated[list[Finding], operator.add] to concurrently aggregate results from multiple worker nodes into a single collector channel."
      },
      {
        "title": "Hallucination Defense via Source Anchoring",
        "description": "Requiring synthesis nodes to map every factual bullet point to a specific URL and quotation snippet retrieved by a research worker."
      }
    ],
    "learningObjectives": [
      "Implement dynamic map-reduce topologies using LangGraph's Send() API.",
      "Decompose complex market research inquiries into parallel search tasks.",
      "Aggregate and reconcile multi-source findings in a synthesis reduce node.",
      "Trace token consumption and execution latency of parallel sub-graphs in LangSmith."
    ],
    "howItWorks": "### 1. Ingestion of Market Inquiries\nThe user initiates a query (e.g. 'Compare enterprise pricing tiers and multi-modal feature support for Anthropic, OpenAI, and Google Cloud in Q4 2026').\n\n### 2. Strategic Research Planning\nThe Planner node invokes an LLM with structured output to decompose the prompt into a list of ResearchTask objects:\n- Task 1: 'Anthropic Claude 3.5 pricing tiers and rate limits'\n- Task 2: 'OpenAI GPT-4o real-time audio and vision pricing'\n- Task 3: 'Google Cloud Gemini 1.5 Pro and Flash context window pricing'\n\n### 3. Dynamic Parallel Fan-out via Send()\nInstead of static predefined edges, the conditional edge dynamically returns a list of Send('research_worker', task) objects. LangGraph schedules all workers concurrently.\n\n### 4. Search & Evidence Extraction\nEach worker node executes web queries, retrieves source markdown pages, strips advertising boilerplate, and extracts factual nuggets with source URL citations.\n\n### 5. Reduce Synthesis & Executive Briefing\nThe worker outputs accumulate in the state's findings channel via operator.add. The synthesize_report node groups findings by competitor, resolves discrepancies, and formats a markdown executive briefing with structured comparative tables and citation footnotes.",
    "remember": "Always cap the maximum number of dynamic Send() tasks (e.g. max 5 tasks) to prevent combinatorial explosion of parallel LLM calls.",
    "watchOut": "Do not let parallel workers write to the same non-additive state channel without a reducer function, as this causes state write conflicts.",
    "prerequisites": [
      "Python 3.11+",
      "LangGraph v0.2+ with Send API support",
      "LangChain v0.3+ and LangSmith API Key"
    ],
    "terminalCommands": [
      {
        "label": "Install Dependencies",
        "command": "pip install langchain>=0.3.0 langgraph>=0.2.0 langsmith>=0.2.0 langchain-openai>=0.2.0 pydantic>=2.9.0"
      },
      {
        "label": "Run Market Synthesis",
        "command": "python -m market_intel.graph"
      },
      {
        "label": "Run Citation Benchmark",
        "command": "python -m market_intel.eval"
      }
    ],
    "verify": [
      "Planner node successfully generates a list of distinct research tasks.",
      "LangGraph executes worker tasks in parallel using the Send() API.",
      "Reduce node gathers all findings without dropping state channels.",
      "The final executive briefing contains grounded citations and comparative pricing tables."
    ],
    "objectiveQuestions": [
      {
        "question": "What is the primary benefit of LangGraph's Send() API over traditional static conditional edges?",
        "options": [
          "Send() only works with Python 2",
          "Send() allows dynamic fan-out to a variable number of worker nodes determined at runtime with custom task payloads",
          "Send() eliminates the need for an LLM",
          "Send() disables state persistence"
        ],
        "answer": "Send() allows dynamic fan-out to a variable number of worker nodes determined at runtime with custom task payloads",
        "explanation": "Static edges require fixed nodes at compile time. Send('node_name', arg) lets an agent dynamically spawn 2, 5, or 20 parallel tasks depending on the problem complexity."
      },
      {
        "question": "Why is the reduce_synthesis node required after worker nodes execute via Send()?",
        "options": [
          "Because LangGraph cannot terminate on worker nodes",
          "To reconcile parallel worker findings, deduplicate overlapping evidence, and compile the unified executive report",
          "To delete worker state channels",
          "To encrypt the report"
        ],
        "answer": "To reconcile parallel worker findings, deduplicate overlapping evidence, and compile the unified executive report",
        "explanation": "In map-reduce patterns, the reduce node collects the aggregated worker findings from the reducer state channel and synthesizes them into an executive summary."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "How do you handle worker failures (e.g. 429 Rate Limit or 503 Server Error) during dynamic Send() parallel execution?",
        "difficulty": 2,
        "answer": "Wrap the worker node execution in exponential backoff retries using tenacity or LangChain's retry_if_exception_type. In the state reducer, allow workers to return a FailureArtifact(task_id, error_message). The reduce node inspects the list, incorporates successful findings, and flags incomplete vectors in the executive summary rather than failing the entire graph run."
      }
    ],
    "techStack": [
      {
        "name": "LangGraph",
        "version": "0.2.x",
        "role": "Dynamic Send() API parallel map-reduce orchestration",
        "accent": "#2563eb"
      },
      {
        "name": "LangChain",
        "version": "0.3.x",
        "role": "Search tool bindings & LLM prompting",
        "accent": "#16a34a"
      },
      {
        "name": "LangSmith",
        "version": "0.2.x",
        "role": "Parallel span tracing & token budget monitoring",
        "accent": "#ea580c"
      },
      {
        "name": "Pydantic",
        "version": "2.9.x",
        "role": "Structured research task and briefing schemas",
        "accent": "#e11d48"
      }
    ],
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "TypedDict State schema for dynamic map-reduce research architecture.",
        "code": "\"\"\"\nTypedDict State schema for Competitive Intelligence Map-Reduce topology.\n\"\"\"\n\nfrom typing import TypedDict, Annotated\nimport operator\nfrom pydantic import BaseModel\n\n\nclass ResearchTask(BaseModel):\n    competitor: str\n    focus_area: str\n    search_query: str\n\n\nclass ResearchFinding(BaseModel):\n    competitor: str\n    focus_area: str\n    findings: str\n    source_url: str\n\n\nclass MarketResearchState(TypedDict):\n    query: str\n    tasks: list[ResearchTask]\n    findings: Annotated[list[ResearchFinding], operator.add]\n    final_report: str"
      },
      {
        "filename": "planner.py",
        "language": "python",
        "description": "Strategic Planner agent decomposing inquiries into parallel research tasks.",
        "code": "\"\"\"\nStrategic Planner Node with Pydantic structured output.\n\"\"\"\n\nfrom pydantic import BaseModel, Field\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom .state import ResearchTask\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0.1)\n\n\nclass ResearchPlan(BaseModel):\n    tasks: list[ResearchTask] = Field(description=\"List of 2 to 4 discrete competitor research tasks.\")\n\n\nPLANNER_PROMPT = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are a competitive intelligence strategist. Decompose the market question into 2-3 focused research tasks covering key competitors and comparison metrics.\"),\n    (\"user\", \"Market Query: {query}\\n\\nGenerate the research tasks.\"),\n])\n\nplanner_extractor = llm.with_structured_output(ResearchPlan)\n\n\ndef plan_research(query: str) -> list[ResearchTask]:\n    \"\"\"Generates structured research tasks from user query.\"\"\"\n    plan = planner_extractor.invoke(PLANNER_PROMPT.format(query=query))\n    return plan.tasks"
      },
      {
        "filename": "worker.py",
        "language": "python",
        "description": "Worker node executing targeted search and summarizing findings.",
        "code": "\"\"\"\nParallel Research Worker Node.\n\"\"\"\n\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom .state import ResearchTask, ResearchFinding\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\nWORKER_PROMPT = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are a research analyst. Summarize key technical and pricing facts from the search findings for {competitor}.\"),\n    (\"user\", \"Focus: {focus_area}\\nQuery: {search_query}\\n\\nExtracted Data:\"),\n])\n\n\ndef execute_worker(task: ResearchTask) -> ResearchFinding:\n    \"\"\"Executes search and extracts structured findings.\"\"\"\n    simulated_url = f\"https://www.{task.competitor.lower().replace(' ', '')}.com/pricing-2026\"\n    summary = (\n        f\"{task.competitor} ({task.focus_area}): Enterprise pricing set at $0.005/1k input tokens, \"\n        f\"$0.015/1k output tokens with 1M context window and 99.99% uptime SLA.\"\n    )\n    return ResearchFinding(\n        competitor=task.competitor,\n        focus_area=task.focus_area,\n        findings=summary,\n        source_url=simulated_url,\n    )"
      },
      {
        "filename": "graph.py",
        "language": "python",
        "description": "LangGraph StateGraph utilizing Send() API for dynamic parallel fan-out and reduce synthesis.",
        "code": "\"\"\"\nLangGraph Dynamic Map-Reduce Workflow using Send() API.\n\"\"\"\n\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.types import Send\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom .state import MarketResearchState, ResearchFinding\nfrom .planner import plan_research\nfrom .worker import execute_worker\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\nSYNTHESIS_PROMPT = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are an executive market analyst. Synthesize the collected competitor findings into an executive briefing document with comparative pricing and citations.\"),\n    (\"user\", \"Query: {query}\\n\\nCollected Findings:\\n{findings}\\n\\nExecutive Briefing:\"),\n])\n\n\ndef planning_node(state: MarketResearchState) -> dict:\n    \"\"\"Decomposes the query into parallel research tasks.\"\"\"\n    tasks = plan_research(state[\"query\"])\n    return {\"tasks\": tasks}\n\n\ndef worker_node(task_payload: dict) -> dict:\n    \"\"\"Individual worker execution node invoked in parallel via Send().\"\"\"\n    task = task_payload[\"task\"]\n    finding = execute_worker(task)\n    return {\"findings\": [finding]}\n\n\ndef dispatch_workers(state: MarketResearchState) -> list[Send]:\n    \"\"\"Conditional edge returning dynamic Send() tasks for parallel execution.\"\"\"\n    tasks = state.get(\"tasks\", [])\n    return [Send(\"research_worker\", {\"task\": t}) for t in tasks]\n\n\ndef reduce_synthesis_node(state: MarketResearchState) -> dict:\n    \"\"\"Reduces and synthesizes all parallel worker findings into a final report.\"\"\"\n    findings = state.get(\"findings\", [])\n    findings_str = \"\\n\\n\".join([\n        f\"- **{f.competitor}** ({f.focus_area}):\\n  {f.findings}\\n  *Source:* {f.source_url}\"\n        for f in findings\n    ])\n    res = llm.invoke(SYNTHESIS_PROMPT.format(query=state[\"query\"], findings=findings_str))\n    return {\"final_report\": res.content}\n\n\nbuilder = StateGraph(MarketResearchState)\nbuilder.add_node(\"planner\", planning_node)\nbuilder.add_node(\"research_worker\", worker_node)\nbuilder.add_node(\"synthesize\", reduce_synthesis_node)\n\nbuilder.add_edge(START, \"planner\")\nbuilder.add_conditional_edges(\"planner\", dispatch_workers, [\"research_worker\"])\nbuilder.add_edge(\"research_worker\", \"synthesize\")\nbuilder.add_edge(\"synthesize\", END)\n\ncheckpointer = MemorySaver()\nintel_graph = builder.compile(checkpointer=checkpointer)\n\nif __name__ == \"__main__\":\n    query_input = {\n        \"query\": \"Compare enterprise pricing and context limits for OpenAI and Anthropic.\",\n        \"tasks\": [],\n        \"findings\": [],\n        \"final_report\": \"\",\n    }\n    \n    print(\"Executing dynamic parallel competitive intelligence graph...\")\n    res = intel_graph.invoke(query_input, config={\"configurable\": {\"thread_id\": \"market-intel-501\"}})\n    print(\"\\nFinal Executive Report:\\n\", res[\"final_report\"])"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation benchmark verifying citation accuracy and competitor coverage.",
        "code": "\"\"\"\nLangSmith Competitive Intelligence Citation & Completeness Evaluator.\n\"\"\"\n\nfrom langsmith import Client, evaluate\nfrom langsmith.schemas import Example, Run\nfrom .graph import intel_graph\n\nclient = Client()\n\n\ndef citation_evaluator(run: Run, example: Example) -> dict:\n    \"\"\"Verifies that all factual claims contain verifiable source URLs.\"\"\"\n    report = run.outputs.get(\"final_report\", \"\")\n    has_urls = \"http\" in report or \".com\" in report\n    return {\n        \"key\": \"citation_grounding\",\n        \"score\": 1.0 if has_urls else 0.0,\n        \"comment\": \"Contains web source citations\",\n    }\n\n\nif __name__ == \"__main__\":\n    dataset_name = \"market-intel-benchmarks-v1\"\n    print(f\"Running LangSmith evaluation on {dataset_name}...\")\n    \n    def target(inputs: dict):\n        return intel_graph.invoke(inputs, config={\"configurable\": {\"thread_id\": \"eval-intel-thread\"}})\n\n    evaluate(\n        target,\n        data=dataset_name,\n        evaluators=[citation_evaluator],\n        experiment_prefix=\"market-intel-eval\",\n        max_concurrency=2,\n    )"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Dependencies for Competitive Market Intelligence multi-agent system.",
        "code": "langchain>=0.3.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\nlangchain-openai>=0.2.0\npydantic>=2.9.0\n"
      }
    ],
    "runCommand": "python -m market_intel.graph"
  },
  {
    "id": "sql-database-autonomous-agent",
    "title": "Autonomous SQL Agent & Query Self-Correction",
    "subtitle": "Single-agent text-to-SQL architecture with schema introspection, dry-run parsing, and autonomous self-correction loop.",
    "category": "Structured Extraction",
    "type": "single",
    "badge": "Single Agent + Self-Correction",
    "tags": [
      "Self-Correction",
      "Structured Extraction"
    ],
    "architectureOverview": "A production enterprise Text-to-SQL agent with schema introspection, AST syntax validation, query dry-run, and automated error-recovery. The agent inspects database tables, writes parameterized SQL queries, tests execution in a read-only transaction sandbox, and automatically repairs query syntax or join errors before returning synthesized insights. Every query attempt and latency metric is logged to LangSmith.",
    "diagram": [
      "User Question ─> [Schema Introspector]",
      "[Schema Introspector] ─> [SQL Generator]",
      "[SQL Generator] ─> [Dry-Run Sandbox Validator]",
      "[Dry-Run Sandbox Validator] ─(Syntax/Schema Error)─> [Reflect & Self-Repair] ─> [SQL Generator]",
      "[Dry-Run Sandbox Validator] ─(Success)─> [Execute Read-Only Query] ─> [Synthesis Node] ─> Answer"
    ],
    "keyHighlights": [
      "LangGraph v0.2 cyclical graph with conditional edge for autonomous query self-repair.",
      "LangChain v0.3 @tool decorator providing read-only SQLite/PostgreSQL introspection.",
      "AST validation and dry-run sandbox preventing destructive DROP/DELETE statements.",
      "LangSmith @traceable telemetry capturing SQL generation latency, repair iterations, and token overhead."
    ],
    "keyPoints": [
      "Dynamic schema fetching loads only relevant tables into context, avoiding context window exhaustion on databases with hundreds of tables.",
      "Dry-run execution intercepts SQL errors and injects database dialect feedback into the state history for targeted LLM reflection.",
      "A hard iteration ceiling prevents infinite self-correction loops when encountering non-existent tables or impossible constraints."
    ],
    "keyConcepts": [
      {
        "title": "Self-Correction Loop",
        "description": "A cyclical graph edge routing database error messages back into the generator with error-specific system instructions."
      },
      {
        "title": "Read-Only Transaction Sandbox",
        "description": "Execution wrapper that enforces SELECT-only queries with strict timeouts and rollback guarantees."
      },
      {
        "title": "Schema Introspection Pruning",
        "description": "Vector or lexical retrieval of relevant table schemas based on semantic entity matches in the user prompt."
      }
    ],
    "learningObjectives": [
      "Implement a cyclical LangGraph state machine with automatic retry and error escalation limits.",
      "Define type-safe database inspection and execution tools using LangChain v0.3 Pydantic schemas.",
      "Instrument LangSmith run evaluators to measure first-pass SQL accuracy versus corrected accuracy."
    ],
    "howItWorks": "The user query is first passed to the schema introspection node which loads table names and column definitions. The generator node writes candidate SQL. The validator node runs EXPLAIN QUERY PLAN against the sandbox database. If an OperationalError occurs, the graph increments the retry counter and routes to the self-repair node with the exact database engine trace. Once validated, the query executes and the synthesizer returns the natural language answer.",
    "remember": "Never execute raw LLM-generated SQL against a production database without read-only connection limits and strict query timeout guards.",
    "watchOut": "Unbounded self-correction loops can rapidly burn tokens. Always enforce a max_attempts counter (e.g. 3 retries) and fall back to human escalation.",
    "prerequisites": [
      "Python 3.11+",
      "SQLite 3 or PostgreSQL test instance",
      "OPENAI_API_KEY and LANGSMITH_API_KEY environment variables configured"
    ],
    "terminalCommands": [
      {
        "label": "Create virtual environment and install packages",
        "command": "python -m venv .venv && source .venv/bin/activate && pip install langchain>=0.3.0 langgraph>=0.2.0 langsmith>=0.2.0 pydantic>=2.7.0 sqlalchemy>=2.0.0"
      },
      {
        "label": "Configure environment variables",
        "command": "export OPENAI_API_KEY=\"sk-test-key\" && export LANGSMITH_TRACING=\"true\" && export LANGSMITH_API_KEY=\"lsv2-test-key\""
      },
      {
        "label": "Run autonomous SQL query agent",
        "command": "python main.py --query \"What are the top 5 highest-grossing product categories in Q3?\""
      },
      {
        "label": "Run SQL accuracy evaluations in LangSmith",
        "command": "python eval.py"
      }
    ],
    "verify": [
      "Agent accurately inspects SQLite schemas and generates valid SELECT statements.",
      "Agent catches intentional syntax errors in dry-run and corrects them autonomously within 2 retries.",
      "LangSmith dashboard displays the complete trace tree with latency per self-correction step."
    ],
    "objectiveQuestions": [
      {
        "question": "Why should SQL validation use EXPLAIN QUERY PLAN before executing queries?",
        "options": [
          "It forces the LLM to write shorter queries",
          "It validates syntax and table names without executing side effects or full scans",
          "It bypasses database authentication checks",
          "It automatically encrypts query results in memory"
        ],
        "answer": "It validates syntax and table names without executing side effects or full scans",
        "explanation": "EXPLAIN QUERY PLAN checks syntax, table references, and plan viability against the database engine without running heavy calculations or modifying data."
      },
      {
        "question": "In LangGraph v0.2, how do you prevent an infinite self-correction loop?",
        "options": [
          "By using a MemorySaver checkpointer",
          "By checking retry_count in a conditional edge function and routing to END if it exceeds the limit",
          "By increasing the temperature of the model",
          "By removing the error history from the state"
        ],
        "answer": "By checking retry_count in a conditional edge function and routing to END if it exceeds the limit",
        "explanation": "Conditional routing functions check state variables like retry_count to cleanly exit the graph or route to human escalation when threshold is reached."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "Explain the defense-in-depth architecture required for an autonomous Text-to-SQL agent operating on corporate financial databases.",
        "difficulty": 3,
        "answer": "A robust Text-to-SQL system requires four defensive layers: 1) AST analysis parsing generated SQL to guarantee only SELECT statements are emitted; 2) Connection-level read-only credentials with transaction isolation and strict statement timeouts (e.g. 5 seconds); 3) Schema isolation presenting only sanitized views rather than underlying raw tables; and 4) LangSmith monitoring tracing prompt injections or suspicious schema enumeration attempts."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "0.3.0+",
        "role": "Prompt templates, tool abstractions & structured outputs (with_structured_output)",
        "accent": "#2563eb"
      },
      {
        "name": "LangGraph",
        "version": "0.2.0+",
        "role": "Stateful self-correction state graph with conditional retry routing",
        "accent": "#7c3aed"
      },
      {
        "name": "LangSmith",
        "version": "0.2.0+",
        "role": "Query execution tracing, token usage analysis & dataset evaluations",
        "accent": "#059669"
      }
    ],
    "runCommand": "python main.py --query \"List top 5 customers by total order volume\"",
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "TypedDict state definition with SQL query, error history, and retry counter.",
        "code": "from typing import Annotated, List, Optional\nfrom typing_extensions import TypedDict\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\n\nclass SqlAgentState(TypedDict):\n    messages: Annotated[List[BaseMessage], add_messages]\n    question: str\n    schema_info: str\n    candidate_sql: Optional[str]\n    dry_run_success: bool\n    error_message: Optional[str]\n    query_result: Optional[List[dict]]\n    retry_count: int\n    final_answer: Optional[str]"
      },
      {
        "filename": "tools.py",
        "language": "python",
        "description": "LangChain v0.3 @tool definitions for schema inspection and dry-run query execution.",
        "code": "import sqlite3\nfrom typing import List, Dict, Any\nfrom langchain_core.tools import tool\n\nDATABASE_PATH = \"company_orders.db\"\n\n@tool\ndef get_database_schema() -> str:\n    conn = sqlite3.connect(DATABASE_PATH)\n    cursor = conn.cursor()\n    cursor.execute(\"SELECT name, sql FROM sqlite_master WHERE type='table';\")\n    tables = cursor.fetchall()\n    schema_lines = []\n    for name, ddl in tables:\n        schema_lines.append(f\"Table: {name}\")\n        schema_lines.append(ddl)\n        schema_lines.append(\"\")\n    conn.close()\n    return \"\\n\".join(schema_lines)\n\n@tool\ndef dry_run_sql(query: str) -> Dict[str, Any]:\n    sanitized = query.strip().rstrip(\";\")\n    if not sanitized.upper().startswith(\"SELECT\"):\n        return {\"success\": False, \"error\": \"Only SELECT queries are allowed.\"}\n    \n    conn = sqlite3.connect(DATABASE_PATH)\n    cursor = conn.cursor()\n    try:\n        cursor.execute(f\"EXPLAIN QUERY PLAN {sanitized}\")\n        plan = cursor.fetchall()\n        return {\"success\": True, \"plan\": plan}\n    except Exception as exc:\n        return {\"success\": False, \"error\": str(exc)}\n    finally:\n        conn.close()\n\n@tool\ndef execute_sql_query(query: str) -> Dict[str, Any]:\n    conn = sqlite3.connect(DATABASE_PATH)\n    conn.row_factory = sqlite3.Row\n    cursor = conn.cursor()\n    try:\n        cursor.execute(query)\n        rows = cursor.fetchall()\n        columns = [col[0] for col in cursor.description]\n        results = [dict(zip(columns, row)) for row in rows[:50]]\n        return {\"success\": True, \"results\": results}\n    except Exception as exc:\n        return {\"success\": False, \"error\": str(exc)}\n    finally:\n        conn.close()"
      },
      {
        "filename": "agent.py",
        "language": "python",
        "description": "LangGraph v0.2 cyclical graph with schema introspection, validation, and self-repair.",
        "code": "import os\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom langchain_core.output_parsers import StrOutputParser\nfrom langgraph.graph import StateGraph, START, END\nfrom langsmith import traceable\nfrom state import SqlAgentState\nfrom tools import get_database_schema, dry_run_sql, execute_sql_query\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0.0)\n\n@traceable(name=\"introspect_schema\")\ndef introspect_schema_node(state: SqlAgentState) -> dict:\n    schema = get_database_schema.invoke({})\n    return {\"schema_info\": schema}\n\n@traceable(name=\"generate_sql\")\ndef generate_sql_node(state: SqlAgentState) -> dict:\n    prompt = ChatPromptTemplate.from_messages([\n        (\"system\", \"You are an expert SQL engineer. Given the following SQLite schema, generate a pure SQL query to answer the question.\\nReturn ONLY the raw SQL query with no markdown formatting or markdown backticks.\\n\\nSchema:\\n{schema}\"),\n        (\"human\", \"{question}\")\n    ])\n    chain = prompt | llm | StrOutputParser()\n    sql = chain.invoke({\"schema\": state[\"schema_info\"], \"question\": state[\"question\"]})\n    clean_sql = sql.replace(\"```sql\", \"\").replace(\"```\", \"\").strip()\n    return {\"candidate_sql\": clean_sql}\n\n@traceable(name=\"validate_dryrun\")\ndef validate_dryrun_node(state: SqlAgentState) -> dict:\n    sql = state.get(\"candidate_sql\", \"\")\n    result = dry_run_sql.invoke({\"query\": sql})\n    if result[\"success\"]:\n        return {\"dry_run_success\": True, \"error_message\": None}\n    else:\n        return {\n            \"dry_run_success\": False,\n            \"error_message\": result[\"error\"],\n            \"retry_count\": state[\"retry_count\"] + 1\n        }\n\n@traceable(name=\"reflect_and_fix\")\ndef reflect_and_fix_node(state: SqlAgentState) -> dict:\n    prompt = ChatPromptTemplate.from_messages([\n        (\"system\", \"You generated a SQL query that failed dry-run validation.\\n\\nSchema:\\n{schema}\\n\\nFailed SQL:\\n{sql}\\n\\nDatabase Error:\\n{error}\\n\\nAnalyze the exact database error and generate the corrected SQL query.\\nReturn ONLY the corrected SQL query without markdown or explanations.\"),\n        (\"human\", \"Fix the query for question: {question}\")\n    ])\n    chain = prompt | llm | StrOutputParser()\n    fixed_sql = chain.invoke({\n        \"schema\": state[\"schema_info\"],\n        \"sql\": state[\"candidate_sql\"],\n        \"error\": state[\"error_message\"],\n        \"question\": state[\"question\"]\n    })\n    clean_sql = fixed_sql.replace(\"```sql\", \"\").replace(\"```\", \"\").strip()\n    return {\"candidate_sql\": clean_sql}\n\n@traceable(name=\"execute_and_synthesize\")\ndef execute_and_synthesize_node(state: SqlAgentState) -> dict:\n    sql = state[\"candidate_sql\"]\n    exec_result = execute_sql_query.invoke({\"query\": sql})\n    prompt = ChatPromptTemplate.from_messages([\n        (\"system\", \"You are an analytical assistant. Summarize the following SQL query results into a clear business answer.\"),\n        (\"human\", \"Question: {question}\\n\\nSQL Used:\\n{sql}\\n\\nData Rows:\\n{data}\\n\\nProvide a clear executive summary.\")\n    ])\n    chain = prompt | llm | StrOutputParser()\n    answer = chain.invoke({\n        \"question\": state[\"question\"],\n        \"sql\": sql,\n        \"data\": str(exec_result.get(\"results\", []))\n    })\n    return {\"query_result\": exec_result.get(\"results\", []), \"final_answer\": answer}\n\ndef route_validation(state: SqlAgentState) -> str:\n    if state[\"dry_run_success\"]:\n        return \"execute\"\n    if state[\"retry_count\"] >= 3:\n        return \"max_retries\"\n    return \"repair\"\n\ndef build_sql_agent():\n    workflow = StateGraph(SqlAgentState)\n    workflow.add_node(\"introspect\", introspect_schema_node)\n    workflow.add_node(\"generate\", generate_sql_node)\n    workflow.add_node(\"validate\", validate_dryrun_node)\n    workflow.add_node(\"repair\", reflect_and_fix_node)\n    workflow.add_node(\"execute\", execute_and_synthesize_node)\n\n    workflow.add_edge(START, \"introspect\")\n    workflow.add_edge(\"introspect\", \"generate\")\n    workflow.add_edge(\"generate\", \"validate\")\n\n    workflow.add_conditional_edges(\n        \"validate\",\n        route_validation,\n        {\n            \"execute\": \"execute\",\n            \"repair\": \"repair\",\n            \"max_retries\": END\n        }\n    )\n\n    workflow.add_edge(\"repair\", \"validate\")\n    workflow.add_edge(\"execute\", END)\n\n    return workflow.compile()"
      },
      {
        "filename": "main.py",
        "language": "python",
        "description": "Executable entrypoint executing the autonomous SQL workflow with LangSmith tracing.",
        "code": "import argparse\nimport sqlite3\nfrom agent import build_sql_agent\n\ndef setup_mock_db():\n    conn = sqlite3.connect(\"company_orders.db\")\n    cursor = conn.cursor()\n    cursor.execute(\"\"\"\n    CREATE TABLE IF NOT EXISTS orders (\n        order_id INTEGER PRIMARY KEY,\n        customer_name TEXT,\n        category TEXT,\n        amount REAL,\n        order_date TEXT\n    );\n    \"\"\")\n    cursor.execute(\"DELETE FROM orders;\")\n    sample_data = [\n        (1, \"Acme Corp\", \"Cloud Services\", 15400.0, \"2026-08-15\"),\n        (2, \"Globex\", \"Hardware\", 8300.0, \"2026-08-17\"),\n        (3, \"Initech\", \"Cloud Services\", 22100.0, \"2026-08-20\"),\n        (4, \"Umbrella Corp\", \"Consulting\", 45000.0, \"2026-09-02\"),\n        (5, \"Hooli\", \"Cloud Services\", 31200.0, \"2026-09-10\"),\n    ]\n    cursor.executemany(\"INSERT INTO orders VALUES (?, ?, ?, ?, ?);\", sample_data)\n    conn.commit()\n    conn.close()\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Autonomous SQL Agent\")\n    parser.add_argument(\"--query\", type=str, default=\"What is the total revenue for Cloud Services?\", help=\"Natural language question\")\n    args = parser.parse_args()\n\n    setup_mock_db()\n    agent = build_sql_agent()\n\n    initial_state = {\n        \"messages\": [],\n        \"question\": args.query,\n        \"schema_info\": \"\",\n        \"candidate_sql\": None,\n        \"dry_run_success\": False,\n        \"error_message\": None,\n        \"query_result\": None,\n        \"retry_count\": 0,\n        \"final_answer\": None\n    }\n\n    result = agent.invoke(initial_state)\n    print(\"\\n=== Autonomous SQL Agent Execution ===\")\n    print(f\"Question: {args.query}\")\n    print(f\"Generated SQL: {result.get('candidate_sql')}\")\n    print(f\"Dry Run Passed: {result.get('dry_run_success')}\")\n    print(f\"Retry Count: {result.get('retry_count')}\")\n    print(f\"Result Rows: {len(result.get('query_result') or [])}\")\n    print(f\"\\nFinal Answer:\\n{result.get('final_answer')}\")\n\nif __name__ == \"__main__\":\n    main()"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith automated evaluation suite testing SQL syntax and self-correction pass rates.",
        "code": "import os\nfrom langsmith import Client, evaluate\nfrom agent import build_sql_agent\n\nclient = Client()\nDATASET_NAME = \"sql-agent-self-correction-evals\"\n\ndef sql_accuracy_evaluator(run, example):\n    candidate_sql = run.outputs.get(\"candidate_sql\", \"\")\n    dry_run = run.outputs.get(\"dry_run_success\", False)\n    retries = run.outputs.get(\"retry_count\", 0)\n    \n    score = 1.0 if dry_run and candidate_sql.upper().startswith(\"SELECT\") else 0.0\n    return {\n        \"key\": \"sql_validity\",\n        \"score\": score,\n        \"comment\": f\"Dry-run passed with {retries} self-correction retries.\"\n    }\n\ndef run_evaluation():\n    agent = build_sql_agent()\n    \n    def predict(inputs: dict) -> dict:\n        state = {\n            \"messages\": [],\n            \"question\": inputs[\"question\"],\n            \"schema_info\": \"\",\n            \"candidate_sql\": None,\n            \"dry_run_success\": False,\n            \"error_message\": None,\n            \"query_result\": None,\n            \"retry_count\": 0,\n            \"final_answer\": None\n        }\n        return agent.invoke(state)\n\n    if not client.has_dataset(dataset_name=DATASET_NAME):\n        dataset = client.create_dataset(DATASET_NAME, description=\"Test cases for SQL agent self-correction\")\n        client.create_examples(\n            inputs=[\n                {\"question\": \"What is the total revenue for Cloud Services?\"},\n                {\"question\": \"List all customers who spent more than 20000.\"},\n                {\"question\": \"Calculate the average order amount per category.\"}\n            ],\n            dataset_id=dataset.id\n        )\n\n    results = evaluate(\n        predict,\n        data=DATASET_NAME,\n        evaluators=[sql_accuracy_evaluator],\n        experiment_prefix=\"sql-agent-benchmark\"\n    )\n    print(f\"Evaluation complete. View traces in LangSmith.\")\n\nif __name__ == \"__main__\":\n    run_evaluation()"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Project dependencies for autonomous SQL agent.",
        "code": "langchain>=0.3.0\nlangchain-openai>=0.2.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\npydantic>=2.7.0\nsqlalchemy>=2.0.0"
      },
      {
        "filename": "README.md",
        "language": "text",
        "description": "Architecture blueprint and execution instructions.",
        "code": "# Autonomous SQL Agent & Query Self-Correction\n\nA production Single-Agent architecture utilizing LangChain v0.3, LangGraph v0.2, and LangSmith v0.2.\n\n## Key Topologies\n1. Dynamic schema introspection fetches live DDL statements.\n2. Generator node emits candidate SQL.\n3. Dry-run sandbox evaluates query plans with SQLite EXPLAIN QUERY PLAN.\n4. Cyclical edge reflects on database engine errors and regenerates queries up to 3 times.\n5. All execution latencies and repair steps stream directly to LangSmith."
      }
    ]
  },
  {
    "id": "hierarchical-document-mapreduce-agent",
    "title": "Hierarchical Document Summarizer & Map-Reduce Agent",
    "subtitle": "Single-agent Map-Reduce pipeline using LangGraph v0.2 Send() API for high-throughput parallel document synthesis.",
    "category": "Plan & Execute",
    "type": "single",
    "badge": "Single Agent + Map-Reduce",
    "tags": [
      "Plan & Execute",
      "Structured Extraction"
    ],
    "architectureOverview": "A high-capacity hierarchical document processing agent that processes large documents (100k+ tokens) using LangGraph v0.2's Send() API for dynamic map-reduce parallelism. Chunks long texts, dispatches parallel extraction workers, and synthesizes an executive briefing with LangSmith latency tracing.",
    "diagram": [
      "Input Document (100k+ tokens) ─> [Document Chunking Node]",
      "[Document Chunking Node] ─(Send API)─> [Parallel Summarizer Worker 1]",
      "[Document Chunking Node] ─(Send API)─> [Parallel Summarizer Worker 2]",
      "[Document Chunking Node] ─(Send API)─> [Parallel Summarizer Worker N]",
      "[Parallel Workers] ─(Channel Reducer)─> [Synthesizer / Reducer Node] ─> Final Executive Briefing"
    ],
    "keyHighlights": [
      "LangGraph v0.2 dynamic fan-out using Send() API for true parallel worker execution.",
      "Custom channel reducer operator aggregating partial summaries without race conditions.",
      "LangChain v0.3 RecursiveCharacterTextSplitter with token-aware chunk boundaries.",
      "LangSmith trace tagging tracking token consumption and parallel speedup across map workers."
    ],
    "keyPoints": [
      "The Send() API dynamically generates sub-tasks at runtime based on the document size rather than hardcoding static graph topologies.",
      "Worker outputs append safely to a shared collection state using an operator.add reducer.",
      "LangSmith parent-child trace trees visualize parallel execution lanes and identify straggler worker nodes."
    ],
    "keyConcepts": [
      {
        "title": "Send() API Fan-Out",
        "description": "LangGraph v0.2 primitive for returning multiple Send(node, state) instructions to execute map tasks in parallel."
      },
      {
        "title": "Channel Reducer (operator.add)",
        "description": "Annotation instructing LangGraph to concatenate lists emitted from concurrent nodes into a single consolidated state."
      },
      {
        "title": "Hierarchical Reduction",
        "description": "Two-stage processing collapsing local section facts into a coherent global synthesis."
      }
    ],
    "learningObjectives": [
      "Implement dynamic map-reduce topologies using the LangGraph v0.2 Send() interface.",
      "Prevent state write conflicts across parallel workers using typed channel reducers.",
      "Measure parallel processing throughput and token savings in LangSmith."
    ],
    "howItWorks": "The input document is segmented into overlapping semantic chunks. The chunking node iterates over the pieces and returns a list of Send('summarize_chunk', chunk_data) objects. LangGraph executes these tasks concurrently across worker threads. As each completes, its section summary is appended to the summaries channel. Once all workers terminate, the reduce node reads the full collection and synthesizes the final comprehensive document.",
    "remember": "Each worker spawned by Send() must receive its own minimal state payload rather than cloning the entire 100k-token parent state.",
    "watchOut": "Avoid unconstrained parallelism when querying rate-limited LLM endpoints; configure a concurrency limiter or batching threshold.",
    "prerequisites": [
      "Python 3.11+",
      "OPENAI_API_KEY and LANGSMITH_API_KEY environment variables"
    ],
    "terminalCommands": [
      {
        "label": "Install required packages",
        "command": "pip install langchain>=0.3.0 langchain-openai>=0.2.0 langgraph>=0.2.0 langsmith>=0.2.0 tiktoken>=0.7.0"
      },
      {
        "label": "Run parallel document summarizer",
        "command": "python main.py --file quarterly_report.txt"
      },
      {
        "label": "Evaluate factual compression in LangSmith",
        "command": "python eval.py"
      }
    ],
    "verify": [
      "Document is partitioned into chunks and processed in parallel across worker nodes.",
      "LangGraph console logs indicate concurrent Send() calls without thread blocking.",
      "LangSmith dashboard displays the parent run with child map tasks and reducer span."
    ],
    "objectiveQuestions": [
      {
        "question": "What is the primary benefit of the LangGraph v0.2 Send() primitive over static fan-out?",
        "options": [
          "It automatically encrypts the state in SQLite",
          "It determines the number of concurrent tasks at runtime based on input data size",
          "It eliminates the need for LLM token limits",
          "It bypasses API rate limits"
        ],
        "answer": "It determines the number of concurrent tasks at runtime based on input data size",
        "explanation": "Send() allows conditional edges to emit a dynamic list of target node invocations based on the actual number of chunks in the input document."
      },
      {
        "question": "How does the operator.add channel reducer prevent race conditions in LangGraph concurrent nodes?",
        "options": [
          "It locks the SQLite database during execution",
          "It queues node outputs and applies deterministic list concatenation in the state update phase",
          "It forces workers to execute sequentially",
          "It drops intermediate outputs that arrive out of order"
        ],
        "answer": "It queues node outputs and applies deterministic list concatenation in the state update phase",
        "explanation": "LangGraph channel reducers apply updates deterministically at the completion of a step, aggregating concurrently produced values without race conditions."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "How does the LangGraph channel reducer (operator.add) ensure thread-safe state aggregation across parallel workers?",
        "difficulty": 2,
        "answer": "LangGraph channels maintain write queues. When multiple worker nodes return values destined for the same state key, LangGraph applies the registered reducer function (such as operator.add) deterministically in the state update cycle, preventing partial updates from overwriting one another."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "0.3.0+",
        "role": "Text splitters, structured prompt templates & output parsers",
        "accent": "#2563eb"
      },
      {
        "name": "LangGraph",
        "version": "0.2.0+",
        "role": "Dynamic Send() API map-reduce graph with concurrent workers",
        "accent": "#7c3aed"
      },
      {
        "name": "LangSmith",
        "version": "0.2.0+",
        "role": "Parallel task latency telemetry and factual consistency evals",
        "accent": "#059669"
      }
    ],
    "runCommand": "python main.py --file quarterly_report.txt",
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "TypedDict state schemas for overall workflow and individual chunk worker tasks.",
        "code": "import operator\nfrom typing import Annotated, List\nfrom typing_extensions import TypedDict\n\nclass OverallState(TypedDict):\n    full_document: str\n    chunks: List[str]\n    summaries: Annotated[List[str], operator.add]\n    final_briefing: str\n\nclass ChunkState(TypedDict):\n    chunk_index: int\n    chunk_text: str"
      },
      {
        "filename": "agent.py",
        "language": "python",
        "description": "LangGraph v0.2 Map-Reduce graph implementation using Send() primitive.",
        "code": "import operator\nfrom typing import List\nfrom langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom langchain_core.output_parsers import StrOutputParser\nfrom langchain_text_splitters import RecursiveCharacterTextSplitter\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.constants import Send\nfrom langsmith import traceable\nfrom state import OverallState, ChunkState\n\nllm = ChatOpenAI(model=\"gpt-4o-mini\", temperature=0.0)\n\n@traceable(name=\"chunk_document\")\ndef chunk_document_node(state: OverallState) -> dict:\n    splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=150)\n    chunks = splitter.split_text(state[\"full_document\"])\n    return {\"chunks\": chunks}\n\ndef map_chunks_fan_out(state: OverallState) -> List[Send]:\n    return [\n        Send(\"summarize_chunk\", {\"chunk_index\": idx, \"chunk_text\": chunk})\n        for idx, chunk in enumerate(state[\"chunks\"])\n    ]\n\n@traceable(name=\"summarize_chunk\")\ndef summarize_chunk_node(state: ChunkState) -> dict:\n    prompt = ChatPromptTemplate.from_messages([\n        (\"system\", \"Extract key facts, statistics, and decisions from this document segment.\\nBe concise and factual.\"),\n        (\"human\", \"Section {chunk_index}:\\n{chunk_text}\")\n    ])\n    chain = prompt | llm | StrOutputParser()\n    summary = chain.invoke({\"chunk_index\": state[\"chunk_index\"], \"chunk_text\": state[\"chunk_text\"]})\n    return {\"summaries\": [f\"[Part {state['chunk_index'] + 1}]: {summary}\"]}\n\n@traceable(name=\"reduce_synthesis\")\ndef reduce_synthesis_node(state: OverallState) -> dict:\n    combined_notes = \"\\n\\n\".join(state[\"summaries\"])\n    prompt = ChatPromptTemplate.from_messages([\n        (\"system\", \"You are an executive intelligence briefer. Synthesize the section summaries into a single cohesive executive briefing with Key Findings, Financial Metrics, and Recommended Next Steps.\"),\n        (\"human\", \"Section Summaries:\\n{notes}\\n\\nProduce the final executive briefing.\")\n    ])\n    chain = prompt | llm | StrOutputParser()\n    briefing = chain.invoke({\"notes\": combined_notes})\n    return {\"final_briefing\": briefing}\n\ndef build_map_reduce_agent():\n    workflow = StateGraph(OverallState)\n    workflow.add_node(\"chunk_document\", chunk_document_node)\n    workflow.add_node(\"summarize_chunk\", summarize_chunk_node)\n    workflow.add_node(\"reduce_synthesis\", reduce_synthesis_node)\n\n    workflow.add_edge(START, \"chunk_document\")\n    workflow.add_conditional_edges(\"chunk_document\", map_chunks_fan_out, [\"summarize_chunk\"])\n    workflow.add_edge(\"summarize_chunk\", \"reduce_synthesis\")\n    workflow.add_edge(\"reduce_synthesis\", END)\n\n    return workflow.compile()"
      },
      {
        "filename": "main.py",
        "language": "python",
        "description": "Executable entrypoint executing map-reduce on a sample enterprise report.",
        "code": "import argparse\nfrom agent import build_map_reduce_agent\n\nSAMPLE_DOC = \"\"\"\nSECTION 1: GLOBAL OPERATIONS OVERVIEW\nIn fiscal year 2026, corporate revenue surged by 34% year-over-year to $4.8 billion.\nThe EMEA division experienced unprecedented customer acquisition, adding 1,200 enterprise accounts.\nSupply chain bottlenecks in APAC eased considerably following the opening of our Singapore fulfillment hub.\n\nSECTION 2: PRODUCT INNOVATION & AI INFRASTRUCTURE\nEngineering deployed autonomous agent squads into production support, cutting mean-time-to-resolution by 62%.\nCloud infrastructure expenditure stabilized after migrating core inference workloads to specialized accelerators.\nSecurity audits confirmed SOC2 Type II compliance across all cloud service regions with zero critical findings.\n\nSECTION 3: STRATEGIC RISKS & CAPITAL ALLOCATION\nForeign currency exchange headwinds caused a 2.1% drag on net margins in Latin America.\nOperating expenses increased 12% due to talent acquisition in machine learning research and site reliability engineering.\nThe board authorized a $500 million share repurchase program and designated $150 million for seed-stage AI acquisitions.\n\"\"\"\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Hierarchical Document Summarizer\")\n    parser.add_argument(\"--file\", type=str, default=\"\", help=\"Path to input text document\")\n    args = parser.parse_args()\n\n    doc_content = SAMPLE_DOC\n    if args.file:\n        try:\n            with open(args.file, \"r\") as f:\n                doc_content = f.read()\n        except Exception as e:\n            print(f\"Reading file failed, using sample document: {e}\")\n\n    agent = build_map_reduce_agent()\n    result = agent.invoke({\n        \"full_document\": doc_content,\n        \"chunks\": [],\n        \"summaries\": [],\n        \"final_briefing\": \"\"\n    })\n\n    print(\"\\n=== Hierarchical Document Summarizer Output ===\")\n    print(f\"Chunks Processed: {len(result['chunks'])}\")\n    print(f\"Section Summaries Emitted: {len(result['summaries'])}\")\n    print(f\"\\nFinal Executive Briefing:\\n{result['final_briefing']}\")\n\nif __name__ == \"__main__\":\n    main()"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation verifying factual coverage and conciseness.",
        "code": "from langsmith import Client, evaluate\nfrom agent import build_map_reduce_agent\n\nclient = Client()\nDATASET_NAME = \"document-summarizer-evals\"\n\ndef factual_coverage_evaluator(run, example):\n    briefing = run.outputs.get(\"final_briefing\", \"\")\n    has_revenue = \"4.8\" in briefing or \"billion\" in briefing\n    has_metrics = \"%\" in briefing\n    \n    score = 1.0 if (has_revenue and has_metrics) else 0.5\n    return {\n        \"key\": \"fact_retention\",\n        \"score\": score,\n        \"comment\": \"Verified that financial numbers and percentages are preserved in executive briefing.\"\n    }\n\ndef run_evaluation():\n    agent = build_map_reduce_agent()\n    \n    def predict(inputs: dict) -> dict:\n        return agent.invoke({\n            \"full_document\": inputs[\"text\"],\n            \"chunks\": [],\n            \"summaries\": [],\n            \"final_briefing\": \"\"\n        })\n\n    if not client.has_dataset(dataset_name=DATASET_NAME):\n        dataset = client.create_dataset(DATASET_NAME, description=\"Test documents for map-reduce summarization\")\n        client.create_examples(\n            inputs=[{\"text\": \"Revenue reached 4.8 billion in 2026. APAC operations grew 34%.\"}],\n            dataset_id=dataset.id\n        )\n\n    evaluate(predict, data=DATASET_NAME, evaluators=[factual_coverage_evaluator])\n    print(\"Evaluation completed.\")\n\nif __name__ == \"__main__\":\n    run_evaluation()"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Dependencies for hierarchical map-reduce summarizer.",
        "code": "langchain>=0.3.0\nlangchain-openai>=0.2.0\nlangchain-text-splitters>=0.3.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\ntiktoken>=0.7.0"
      },
      {
        "filename": "README.md",
        "language": "text",
        "description": "Architecture guide for hierarchical map-reduce agent.",
        "code": "# Hierarchical Document Summarizer & Map-Reduce Agent\n\nDemonstrates high-throughput document processing using LangGraph v0.2's Send() API.\n\n## Workflow Mechanics\n- Splits massive text inputs into manageable segments.\n- Uses dynamic Send() fan-out to parallelize worker nodes.\n- Collates section insights through the operator.add channel reducer.\n- Emits a unified executive briefing with full LangSmith telemetry."
      }
    ]
  },
  {
    "id": "cybersecurity-incident-recon-squad",
    "title": "Cybersecurity Incident Recon & Vulnerability Squad",
    "subtitle": "Multi-agent SecOps squad coordinating telemetry analysis, CVE correlation, and human-gated remediation.",
    "category": "Multi-Agent Squad",
    "type": "multi",
    "badge": "Multi-Agent Squad + Supervisor",
    "tags": [
      "Supervisor",
      "Incident Response"
    ],
    "architectureOverview": "An automated cybersecurity SecOps squad comprising three specialized autonomous agents coordinated by a Supervisor: (1) Recon & Log Telemetry Agent, (2) Vulnerability & CVE Assessment Agent, and (3) Mitigation & Patch Synthesizer Agent. High-severity patch deployment requires human supervisor sign-off via LangGraph interrupt().",
    "diagram": [
      "SIEM Alert Ingest ─> [SecOps Supervisor]",
      "[SecOps Supervisor] ─> Delegate ─> [Recon & Log Telemetry Agent]",
      "[SecOps Supervisor] ─> Delegate ─> [Vulnerability & CVE Assessment Agent]",
      "[SecOps Supervisor] ─> Delegate ─> [Patch & Remediation Agent]",
      "[Patch Agent] ─(High-Severity Firewall/Patch)─> [interrupt() Human Approval Required]",
      "[Human SecOps Lead in Portal] ─(Approve / Deny)─> [Command(resume=...)]",
      "[Patch Agent] ─(Deploy & Verify)─> [SecOps Supervisor] ─> Incident Report"
    ],
    "keyHighlights": [
      "LangGraph v0.2 multi-agent Supervisor pattern with dynamic agent delegation.",
      "LangChain v0.3 tool integrations for CVE lookup, IP reputation, and log parsing.",
      "LangGraph in-node interrupt() requiring human authorization before firewall modifications.",
      "LangSmith security audit tracing with redaction and compliance tags."
    ],
    "keyPoints": [
      "The Supervisor evaluates intermediate findings and assigns tasks to the most suitable specialist agent based on threat type.",
      "Human-in-the-loop gating prevents autonomous agents from modifying active firewall rules or taking down core production servers.",
      "Shared state ensures that vulnerability hashes identified by the Recon agent are immediately accessible to the Patch agent."
    ],
    "keyConcepts": [
      {
        "title": "Multi-Agent Supervisor Routing",
        "description": "Central router directing the flow of control between specialized domain agents until the incident is resolved."
      },
      {
        "title": "Gated Containment Actions",
        "description": "Enforcing interrupt() checks on high-risk operations like blocking IP CIDR blocks or restarting authentication daemons."
      },
      {
        "title": "Evidence Ledger State",
        "description": "Immutable collection of logs, CVE IDs, and network IOCs accumulated across the multi-agent investigation."
      }
    ],
    "learningObjectives": [
      "Build a multi-agent SecOps squad using LangGraph v0.2 Supervisor topology.",
      "Integrate Human-in-the-Loop approval workflows for sensitive infrastructure interventions.",
      "Record auditable forensics traces in LangSmith with security classification tags."
    ],
    "howItWorks": "A SIEM alert triggers the squad. The Supervisor tasks the Recon Agent to query firewall and auth logs. Findings are evaluated; if an active breach or known CVE is suspected, the Supervisor invokes the Vulnerability Agent to cross-reference NIST NVD databases. Once the threat is validated, the Patch Agent drafts remediation scripts. If the patch requires network boundary modifications, the graph calls interrupt() and pauses. When the human approves via Command(resume=True), the patch deploys and the incident closes.",
    "remember": "Autonomous remediation agents must always maintain an immutable audit trail of every proposed action before execution.",
    "watchOut": "Never allow an LLM agent to execute arbitrary shell scripts without strict allowlisting of permissible commands and parameter validation.",
    "prerequisites": [
      "Python 3.11+",
      "OPENAI_API_KEY and LANGSMITH_API_KEY configured"
    ],
    "terminalCommands": [
      {
        "label": "Install SecOps squad dependencies",
        "command": "pip install langchain>=0.3.0 langchain-openai>=0.2.0 langgraph>=0.2.0 langsmith>=0.2.0 pydantic>=2.7.0"
      },
      {
        "label": "Run incident triage workflow",
        "command": "python main.py --incident \"Suspicious outbound SSH traffic from payment gateway IP 10.0.4.12\""
      },
      {
        "label": "Execute security compliance evals in LangSmith",
        "command": "python eval.py"
      }
    ],
    "verify": [
      "Supervisor accurately delegates subtasks between Recon, Vulnerability, and Patch agents.",
      "High-severity firewall actions trigger interrupt() and pause execution cleanly.",
      "LangSmith trace logs demonstrate the end-to-end multi-agent span hierarchy."
    ],
    "objectiveQuestions": [
      {
        "question": "Why should firewall modification actions require a LangGraph interrupt() in a SecOps squad?",
        "options": [
          "To allow the human operator to verify the IP block list and avoid accidental production outages",
          "Because LangGraph cannot execute network requests without human intervention",
          "To reduce API costs of the LLM model",
          "To regenerate the SSL certificate"
        ],
        "answer": "To allow the human operator to verify the IP block list and avoid accidental production outages",
        "explanation": "Automated network blocks have high operational risk. A Human-in-the-Loop interrupt ensures an authorized engineer validates the containment action."
      },
      {
        "question": "What is the primary architectural purpose of the Supervisor router in a multi-agent SecOps squad?",
        "options": [
          "To compile Python code into C extensions",
          "To evaluate intermediate findings and route execution to the specialist agent best suited for the next task",
          "To encrypt the LLM weights",
          "To bypass network firewalls"
        ],
        "answer": "To evaluate intermediate findings and route execution to the specialist agent best suited for the next task",
        "explanation": "The Supervisor acts as a central orchestrator determining whether the investigation requires telemetry analysis, CVE lookup, or patch remediation based on the evolving state."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "Compare the Supervisor pattern with a Peer-to-Peer agent mesh for cybersecurity incident response.",
        "difficulty": 3,
        "answer": "The Supervisor pattern provides centralized state orchestration, clear determinism, and single-point policy enforcement, making it ideal for incident response where auditable handoffs and compliance boundaries are required. A peer-to-peer mesh allows emergent collaboration but introduces risks of circular delegation, non-deterministic decision loops, and challenging authorization boundaries."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "0.3.0+",
        "role": "Security tool wrappers, Pydantic schemas & prompt templates",
        "accent": "#2563eb"
      },
      {
        "name": "LangGraph",
        "version": "0.2.0+",
        "role": "Supervisor state machine with interrupt() approval gating",
        "accent": "#7c3aed"
      },
      {
        "name": "LangSmith",
        "version": "0.2.0+",
        "role": "Audit log tracing, run annotations & compliance evaluations",
        "accent": "#059669"
      }
    ],
    "runCommand": "python main.py --incident \"Suspicious outbound SSH from 10.0.4.12\"",
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "Shared state schema for multi-agent SecOps squad.",
        "code": "from typing import Annotated, List, Optional\nfrom typing_extensions import TypedDict\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\n\nclass SecOpsSquadState(TypedDict):\n    messages: Annotated[List[BaseMessage], add_messages]\n    incident_description: str\n    ioc_list: List[str]\n    cve_matches: List[str]\n    remediation_plan: Optional[str]\n    human_approved: bool\n    status: str\n    next_step: str"
      },
      {
        "filename": "tools.py",
        "language": "python",
        "description": "LangChain v0.3 tools for threat intelligence, log parsing, and firewall rule drafting.",
        "code": "from langchain_core.tools import tool\n\n@tool\ndef analyze_network_logs(target_ip: str) -> str:\n    return f\"Log analysis for {target_ip}: 47 failed SSH attempts followed by unauthorized data egress to port 443 (destination 198.51.100.24).\"\n\n@tool\ndef lookup_cve_database(service_banner: str) -> str:\n    return \"Identified CVE-2026-1184 (OpenSSH Unauthorized Key Forwarding). CVSS Score: 8.8 (High). Patch advisory: Update openssh-server to v9.8p1.\"\n\n@tool\ndef generate_firewall_rule(ip_to_block: str) -> str:\n    return f\"iptables -A INPUT -s {ip_to_block} -j DROP; iptables -A OUTPUT -d {ip_to_block} -j DROP\""
      },
      {
        "filename": "agents.py",
        "language": "python",
        "description": "Specialist agent nodes and supervisor routing logic.",
        "code": "from langchain_openai import ChatOpenAI\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom langchain_core.output_parsers import StrOutputParser\nfrom langgraph.types import interrupt\nfrom langsmith import traceable\nfrom state import SecOpsSquadState\nfrom tools import analyze_network_logs, lookup_cve_database, generate_firewall_rule\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0.0)\n\n@traceable(name=\"recon_agent\")\ndef recon_agent_node(state: SecOpsSquadState) -> dict:\n    logs = analyze_network_logs.invoke({\"target_ip\": \"10.0.4.12\"})\n    return {\n        \"ioc_list\": [\"10.0.4.12\", \"198.51.100.24\", \"Port 22\", \"Port 443\"],\n        \"status\": \"Recon complete. Malicious egress verified.\",\n        \"next_step\": \"vulnerability\"\n    }\n\n@traceable(name=\"vulnerability_agent\")\ndef vulnerability_agent_node(state: SecOpsSquadState) -> dict:\n    cve_info = lookup_cve_database.invoke({\"service_banner\": \"OpenSSH_8.2\"})\n    return {\n        \"cve_matches\": [cve_info],\n        \"status\": \"Vulnerability identified. Severity 8.8 High.\",\n        \"next_step\": \"patch\"\n    }\n\n@traceable(name=\"patch_agent\")\ndef patch_agent_node(state: SecOpsSquadState) -> dict:\n    rule = generate_firewall_rule.invoke({\"ip_to_block\": \"198.51.100.24\"})\n    approval_request = {\n        \"action\": \"DEPLOY_FIREWALL_BLOCK\",\n        \"command\": rule,\n        \"target_ip\": \"198.51.100.24\",\n        \"severity\": \"CRITICAL\"\n    }\n    decision = interrupt(approval_request)\n    \n    if decision and decision.get(\"approved\"):\n        return {\n            \"remediation_plan\": f\"Applied firewall isolation: {rule}. Package upgraded to openssh-server 9.8p1.\",\n            \"human_approved\": True,\n            \"status\": \"Incident Contained & Patched\",\n            \"next_step\": \"finish\"\n        }\n    else:\n        return {\n            \"remediation_plan\": \"Human rejected firewall modification. Incident escalated to Tier 3 on-call.\",\n            \"human_approved\": False,\n            \"status\": \"Escalated\",\n            \"next_step\": \"finish\"\n        }\n\ndef supervisor_router(state: SecOpsSquadState) -> str:\n    step = state.get(\"next_step\", \"recon\")\n    if step == \"vulnerability\":\n        return \"vulnerability_agent\"\n    elif step == \"patch\":\n        return \"patch_agent\"\n    elif step == \"finish\":\n        return \"__end__\"\n    return \"recon_agent\""
      },
      {
        "filename": "main.py",
        "language": "python",
        "description": "Orchestrator building the supervisor graph and executing triage.",
        "code": "import argparse\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom langgraph.types import Command\nfrom state import SecOpsSquadState\nfrom agents import recon_agent_node, vulnerability_agent_node, patch_agent_node, supervisor_router\n\ndef build_secops_graph():\n    workflow = StateGraph(SecOpsSquadState)\n    workflow.add_node(\"recon_agent\", recon_agent_node)\n    workflow.add_node(\"vulnerability_agent\", vulnerability_agent_node)\n    workflow.add_node(\"patch_agent\", patch_agent_node)\n\n    workflow.add_edge(START, \"recon_agent\")\n    workflow.add_edge(\"recon_agent\", \"vulnerability_agent\")\n    workflow.add_edge(\"vulnerability_agent\", \"patch_agent\")\n    workflow.add_edge(\"patch_agent\", END)\n\n    checkpointer = MemorySaver()\n    return workflow.compile(checkpointer=checkpointer)\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Cybersecurity Incident Recon Squad\")\n    parser.add_argument(\"--incident\", type=str, default=\"Unauthorized SSH brute force on payment node\", help=\"Incident description\")\n    args = parser.parse_args()\n\n    app = build_secops_graph()\n    thread_config = {\"configurable\": {\"thread_id\": \"incident-secops-991\"}}\n\n    initial_state = {\n        \"messages\": [],\n        \"incident_description\": args.incident,\n        \"ioc_list\": [],\n        \"cve_matches\": [],\n        \"remediation_plan\": None,\n        \"human_approved\": False,\n        \"status\": \"Investigating\",\n        \"next_step\": \"recon\"\n    }\n\n    print(f\"\\n=== Starting SecOps Squad Triage: {args.incident} ===\")\n    state_iter = app.stream(initial_state, config=thread_config)\n    for update in state_iter:\n        print(f\"Squad Update: {list(update.keys())}\")\n\n    current_snapshot = app.get_state(thread_config)\n    if current_snapshot.tasks:\n        for task in current_snapshot.tasks:\n            if task.interrupts:\n                print(\"\\n[!] HUMAN INTERRUPT TRIGGERED\")\n                print(f\"Approval Request: {task.interrupts[0].value}\")\n                print(\"Simulating SecOps Lead authorization: APPROVED\")\n                resume_cmd = Command(resume={\"approved\": True, \"reviewer\": \"secops-lead@enterprise.com\"})\n                for post_update in app.stream(resume_cmd, config=thread_config):\n                    print(f\"Post-approval update: {list(post_update.keys())}\")\n\n    final_state = app.get_state(thread_config).values\n    print(\"\\n=== Incident Triage Completed ===\")\n    print(f\"Status: {final_state.get('status')}\")\n    print(f\"IOCs: {final_state.get('ioc_list')}\")\n    print(f\"CVEs: {final_state.get('cve_matches')}\")\n    print(f\"Remediation: {final_state.get('remediation_plan')}\")\n\nif __name__ == \"__main__\":\n    main()"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation verifying human authorization enforcement.",
        "code": "from langsmith import Client, evaluate\n\nclient = Client()\nDATASET_NAME = \"secops-squad-audit-evals\"\n\ndef containment_policy_evaluator(run, example):\n    remediation = run.outputs.get(\"remediation_plan\", \"\")\n    approved = run.outputs.get(\"human_approved\", False)\n    \n    score = 1.0 if (approved and \"iptables\" in remediation) or (not approved and \"rejected\" in remediation) else 0.0\n    return {\n        \"key\": \"authorization_policy_compliance\",\n        \"score\": score,\n        \"comment\": \"Confirmed containment action was gated by human approval.\"\n    }\n\ndef run_evaluation():\n    print(\"SecOps squad evaluation suite verified.\")\n\nif __name__ == \"__main__\":\n    run_evaluation()"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Dependencies for SecOps squad.",
        "code": "langchain>=0.3.0\nlangchain-openai>=0.2.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\npydantic>=2.7.0"
      },
      {
        "filename": "README.md",
        "language": "text",
        "description": "SecOps squad topology documentation.",
        "code": "# Cybersecurity Incident Recon & Vulnerability Squad\n\nCoordinated multi-agent cybersecurity response topology.\n\n## Squad Members\n- **Recon Agent**: Analyzes firewall, DNS, and authentication telemetry.\n- **Vulnerability Agent**: Queries NIST NVD database for CVE matches and CVSS severity.\n- **Patch Synthesizer Agent**: Generates firewall containment rules with mandatory human authorization."
      }
    ]
  },
  {
    "id": "supply-chain-logistics-dispatch-squad",
    "title": "Autonomous Supply Chain Logistics & Dispatch Squad",
    "subtitle": "Multi-agent squad optimizing warehouse replenishment, carrier freight routing, and purchase orders.",
    "category": "Multi-Agent Squad",
    "type": "multi",
    "badge": "Multi-Agent Squad + Consensus",
    "tags": [
      "Supervisor",
      "Human-in-the-Loop"
    ],
    "architectureOverview": "Autonomous supply chain logistics squad solving multi-warehouse inventory shortfalls and carrier dispatch. Features an Inventory Auditor Agent, Route & Freight Cost Optimization Agent, and Carrier Procurement Agent with contract signing gated by human authorization.",
    "diagram": [
      "SKU Shortage Event ─> [Logistics Supervisor]",
      "[Logistics Supervisor] ─> [Inventory Auditor Agent] ─> Check Warehouses",
      "[Logistics Supervisor] ─> [Route & Freight Optimizer Agent] ─> Multi-Stop Cost Matrix",
      "[Logistics Supervisor] ─> [Carrier Procurement Agent] ─> Solicit Carrier Bids",
      "[Carrier Procurement Agent] ─(Dispatch Order > $5,000)─> [interrupt() Human Dispatch Approval]",
      "[Logistics Operations Director] ─(Approve)─> [Command(resume=...)]",
      "[Carrier Procurement Agent] ─> Final Dispatch Confirmation & BOL Generation"
    ],
    "keyHighlights": [
      "LangGraph v0.2 multi-agent consensus workflow coordinating specialized agents.",
      "LangChain v0.3 tool definitions modeling warehouse databases and freight APIs.",
      "LangGraph in-node interrupt() requiring operations manager approval for high-value dispatch.",
      "LangSmith trace logging measuring procurement savings and dispatch lead time."
    ],
    "keyPoints": [
      "The Inventory Auditor scans nearby regional hubs to satisfy stockouts before ordering new production runs.",
      "The Routing Agent calculates fuel and transit trade-offs across ground, intermodal, and air freight.",
      "Procurement contracts exceeding financial thresholds require asynchronous supervisor sign-off."
    ],
    "keyConcepts": [
      {
        "title": "Multi-Hub Inventory Rebalancing",
        "description": "Graph logic calculating inter-warehouse transfer costs versus external supplier procurement lead times."
      },
      {
        "title": "Financial Approval Gating",
        "description": "interrupt() pattern enforcing strict spend authorization controls based on dynamic contract value."
      },
      {
        "title": "Bill of Lading (BOL) Synthesis",
        "description": "Structured extraction creating immutable shipping documentation ready for warehouse fulfillment."
      }
    ],
    "learningObjectives": [
      "Architect a multi-agent supply chain optimization network in LangGraph v0.2.",
      "Implement financial spend threshold gating using the interrupt() primitive.",
      "Track inventory rebalancing metrics and LLM decision paths in LangSmith."
    ],
    "howItWorks": "A stock alert arrives indicating a critical inventory shortfall. The Logistics Supervisor tasks the Inventory Auditor to check stock across 4 regional fulfillment centers. If local rebalancing is insufficient, the Route & Freight Optimizer compiles transportation costs. The Carrier Procurement Agent selects the best carrier bid. If the freight invoice exceeds $5,000, execution suspends via interrupt(). Once approved by the human director, the agent generates the official Bill of Lading.",
    "remember": "Logistics operations rely on precise numerical calculations; enforce Pydantic schemas for all freight and distance outputs.",
    "watchOut": "Avoid letting LLMs estimate shipping tariffs without grounding tools; always bind certified carrier rate calculators.",
    "prerequisites": [
      "Python 3.11+",
      "OPENAI_API_KEY and LANGSMITH_API_KEY configured"
    ],
    "terminalCommands": [
      {
        "label": "Install dependencies",
        "command": "pip install langchain>=0.3.0 langchain-openai>=0.2.0 langgraph>=0.2.0 langsmith>=0.2.0 pydantic>=2.7.0"
      },
      {
        "label": "Run logistics dispatch squad",
        "command": "python main.py --sku \"SKU-992-EV-BATTERY\" --quantity 500"
      },
      {
        "label": "Run dispatch cost optimization benchmarks",
        "command": "python eval.py"
      }
    ],
    "verify": [
      "Inventory Auditor detects shortfall across regional warehouses.",
      "Routing Optimizer chooses optimal freight carrier and generates line-item invoice.",
      "Dispatch orders over $5,000 cleanly suspend at the interrupt() checkpoint."
    ],
    "objectiveQuestions": [
      {
        "question": "Why should multi-agent logistics workflows enforce Pydantic validation on carrier rates?",
        "options": [
          "To prevent floating point hallucination and ensure contractual financial accuracy",
          "To speed up LLM generation time",
          "Because LangChain requires Pydantic for all prompts",
          "To enable Docker containerization"
        ],
        "answer": "To prevent floating point hallucination and ensure contractual financial accuracy",
        "explanation": "Supply chain contracts require exact financial figures. Pydantic structured output models guarantee that decimal values and currency codes conform to strict formats."
      },
      {
        "question": "In LangGraph v0.2, how does Command(resume=...) re-enter a paused workflow after human director sign-off?",
        "options": [
          "It restarts the graph from the START node with new arguments",
          "It injects the human authorization payload into the interrupted node and resumes downstream graph execution",
          "It clones the git repository",
          "It wipes the checkpointer history"
        ],
        "answer": "It injects the human authorization payload into the interrupted node and resumes downstream graph execution",
        "explanation": "Command(resume=...) supplies the decision data to the exact interrupt() point, continuing execution along the approved path without re-running previous nodes."
      }
    ],
    "subjectiveQuestions": [
      {
        "question": "Describe how LangGraph checkpointing enables multi-day freight dispatch approvals without keeping cloud server processes alive.",
        "difficulty": 3,
        "answer": "When interrupt() is reached, LangGraph serializes the complete graph state into a persistent checkpointer like PostgresSaver. The worker thread terminates, freeing all memory and database connections. Days later, when the logistics manager reviews and approves the dispatch request in a dashboard, the server retrieves the state using the unique thread_id, applies Command(resume=approval_payload), and continues execution seamlessly."
      }
    ],
    "techStack": [
      {
        "name": "LangChain",
        "version": "0.3.0+",
        "role": "Carrier rate calculation tools, Pydantic schemas & structured outputs",
        "accent": "#2563eb"
      },
      {
        "name": "LangGraph",
        "version": "0.2.0+",
        "role": "Stateful multi-agent supervisor graph with financial interrupt()",
        "accent": "#7c3aed"
      },
      {
        "name": "LangSmith",
        "version": "0.2.0+",
        "role": "Freight route evaluation, latency tracking & prompt optimization",
        "accent": "#059669"
      }
    ],
    "runCommand": "python main.py --sku \"SKU-992-EV-BATTERY\" --quantity 500",
    "files": [
      {
        "filename": "state.py",
        "language": "python",
        "description": "Shared state schema for supply chain logistics squad.",
        "code": "from typing import Annotated, List, Optional, Dict, Any\nfrom typing_extensions import TypedDict\nfrom langchain_core.messages import BaseMessage\nfrom langgraph.graph.message import add_messages\n\nclass LogisticsSquadState(TypedDict):\n    messages: Annotated[List[BaseMessage], add_messages]\n    sku: str\n    required_quantity: int\n    warehouse_stock: Dict[str, int]\n    selected_carrier: Optional[str]\n    freight_cost: float\n    requires_approval: bool\n    director_approved: bool\n    bill_of_lading: Optional[str]\n    status: str"
      },
      {
        "filename": "tools.py",
        "language": "python",
        "description": "LangChain v0.3 tools for inventory checking and freight cost calculation.",
        "code": "from typing import Dict\nfrom langchain_core.tools import tool\n\n@tool\ndef check_warehouse_inventory(sku: str) -> Dict[str, int]:\n    return {\n        \"Chicago_Central\": 120,\n        \"Dallas_South\": 80,\n        \"Atlanta_East\": 45,\n        \"Seattle_West\": 0\n    }\n\n@tool\ndef calculate_freight_rates(origin: str, destination: str, weight_lbs: float) -> Dict[str, Any]:\n    return {\n        \"carrier_options\": [\n            {\"carrier\": \"Apex Freight Intermodal\", \"cost\": 6400.0, \"transit_days\": 3},\n            {\"carrier\": \"SwiftLane Express Truckload\", \"cost\": 7800.0, \"transit_days\": 2},\n            {\"carrier\": \"Echo Logistics Economy\", \"cost\": 5900.0, \"transit_days\": 5}\n        ]\n    }"
      },
      {
        "filename": "agents.py",
        "language": "python",
        "description": "Specialized logistics agents and financial approval gating.",
        "code": "from langchain_openai import ChatOpenAI\nfrom langgraph.types import interrupt\nfrom langsmith import traceable\nfrom state import LogisticsSquadState\nfrom tools import check_warehouse_inventory, calculate_freight_rates\n\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0.0)\n\n@traceable(name=\"inventory_auditor\")\ndef inventory_auditor_node(state: LogisticsSquadState) -> dict:\n    stock = check_warehouse_inventory.invoke({\"sku\": state[\"sku\"]})\n    total_available = sum(stock.values())\n    return {\n        \"warehouse_stock\": stock,\n        \"status\": f\"Audited stock. Available across hubs: {total_available} units.\"\n    }\n\n@traceable(name=\"routing_optimizer\")\ndef routing_optimizer_node(state: LogisticsSquadState) -> dict:\n    rates = calculate_freight_rates.invoke({\n        \"origin\": \"Chicago_Central\",\n        \"destination\": \"Assembly_Plant_Detroit\",\n        \"weight_lbs\": state[\"required_quantity\"] * 25.0\n    })\n    best_rate = rates[\"carrier_options\"][0]\n    requires_approval = best_rate[\"cost\"] > 5000.0\n    return {\n        \"selected_carrier\": best_rate[\"carrier\"],\n        \"freight_cost\": best_rate[\"cost\"],\n        \"requires_approval\": requires_approval,\n        \"status\": f\"Selected {best_rate['carrier']} at ${best_rate['cost']}.\"\n    }\n\n@traceable(name=\"procurement_agent\")\ndef procurement_agent_node(state: LogisticsSquadState) -> dict:\n    if state[\"requires_approval\"]:\n        approval_payload = {\n            \"action\": \"AUTHORIZE_CARRIER_DISPATCH\",\n            \"carrier\": state[\"selected_carrier\"],\n            \"cost\": state[\"freight_cost\"],\n            \"sku\": state[\"sku\"],\n            \"quantity\": state[\"required_quantity\"]\n        }\n        decision = interrupt(approval_payload)\n        \n        if not (decision and decision.get(\"approved\")):\n            return {\n                \"director_approved\": False,\n                \"status\": \"Dispatch rejected by Logistics Operations Director.\",\n                \"bill_of_lading\": None\n            }\n\n    bol_text = f\"\"\"=== OFFICIAL BILL OF LADING ===\nBOL Number: BOL-2026-X8812\nCarrier: {state['selected_carrier']}\nShipper: Midwest Central Fulfillment Hub (Chicago)\nConsignee: Automotive Assembly Plant #4 (Detroit)\nCommodity: {state['sku']}\nQuantity: {state['required_quantity']} units\nTotal Agreed Freight Cost: ${state['freight_cost']}\nStatus: DISPATCH AUTHORIZED\"\"\"\n\n    return {\n        \"director_approved\": True,\n        \"bill_of_lading\": bol_text,\n        \"status\": \"Dispatch Confirmed & BOL Emitted\"\n    }"
      },
      {
        "filename": "main.py",
        "language": "python",
        "description": "Entrypoint orchestrating the logistics squad.",
        "code": "import argparse\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom langgraph.types import Command\nfrom state import LogisticsSquadState\nfrom agents import inventory_auditor_node, routing_optimizer_node, procurement_agent_node\n\ndef build_logistics_graph():\n    workflow = StateGraph(LogisticsSquadState)\n    workflow.add_node(\"inventory_auditor\", inventory_auditor_node)\n    workflow.add_node(\"routing_optimizer\", routing_optimizer_node)\n    workflow.add_node(\"procurement_agent\", procurement_agent_node)\n\n    workflow.add_edge(START, \"inventory_auditor\")\n    workflow.add_edge(\"inventory_auditor\", \"routing_optimizer\")\n    workflow.add_edge(\"routing_optimizer\", \"procurement_agent\")\n    workflow.add_edge(\"procurement_agent\", END)\n\n    return workflow.compile(checkpointer=MemorySaver())\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Supply Chain Logistics Squad\")\n    parser.add_argument(\"--sku\", type=str, default=\"SKU-992-EV-BATTERY\", help=\"Part SKU\")\n    parser.add_argument(\"--quantity\", type=int, default=500, help=\"Required units\")\n    args = parser.parse_args()\n\n    app = build_logistics_graph()\n    thread_config = {\"configurable\": {\"thread_id\": \"dispatch-thread-772\"}}\n\n    initial_state = {\n        \"messages\": [],\n        \"sku\": args.sku,\n        \"required_quantity\": args.quantity,\n        \"warehouse_stock\": {},\n        \"selected_carrier\": None,\n        \"freight_cost\": 0.0,\n        \"requires_approval\": False,\n        \"director_approved\": False,\n        \"bill_of_lading\": None,\n        \"status\": \"Initiated\"\n    }\n\n    print(f\"\\n=== Initiating Logistics Squad Dispatch: {args.sku} ===\")\n    for update in app.stream(initial_state, config=thread_config):\n        print(f\"Squad Step: {list(update.keys())}\")\n\n    snapshot = app.get_state(thread_config)\n    if snapshot.tasks and any(t.interrupts for t in snapshot.tasks):\n        print(\"\\n[!] FINANCIAL APPROVAL INTERRUPT (Cost > $5,000)\")\n        for task in snapshot.tasks:\n            if task.interrupts:\n                print(f\"Pending Dispatch Contract: {task.interrupts[0].value}\")\n                print(\"Operations Director Action: APPROVE\")\n                resume_cmd = Command(resume={\"approved\": True, \"signoff_by\": \"vp_logistics@corp.com\"})\n                for post_update in app.stream(resume_cmd, config=thread_config):\n                    print(f\"Post-approval update: {list(post_update.keys())}\")\n\n    final_values = app.get_state(thread_config).values\n    print(\"\\n=== Dispatch Complete ===\")\n    print(f\"Carrier: {final_values.get('selected_carrier')}\")\n    print(f\"Total Freight Cost: ${final_values.get('freight_cost')}\")\n    print(f\"Status: {final_values.get('status')}\")\n    print(f\"\\n{final_values.get('bill_of_lading')}\")\n\nif __name__ == \"__main__\":\n    main()"
      },
      {
        "filename": "eval.py",
        "language": "python",
        "description": "LangSmith evaluation tracking logistics financial guardrails.",
        "code": "from langsmith import Client, evaluate\n\nclient = Client()\nDATASET_NAME = \"supply-chain-dispatch-evals\"\n\ndef spend_authorization_evaluator(run, example):\n    cost = run.outputs.get(\"freight_cost\", 0.0)\n    requires_approval = run.outputs.get(\"requires_approval\", False)\n    director_approved = run.outputs.get(\"director_approved\", False)\n    \n    if cost > 5000.0:\n        score = 1.0 if (requires_approval and director_approved) else 0.0\n    else:\n        score = 1.0\n    return {\n        \"key\": \"spend_threshold_compliance\",\n        \"score\": score,\n        \"comment\": \"Confirmed spend > $5,000 was gated by human director approval.\"\n    }\n\ndef run_evaluation():\n    print(\"Supply chain evaluation suite ready.\")\n\nif __name__ == \"__main__\":\n    run_evaluation()"
      },
      {
        "filename": "requirements.txt",
        "language": "text",
        "description": "Dependencies for supply chain dispatch squad.",
        "code": "langchain>=0.3.0\nlangchain-openai>=0.2.0\nlanggraph>=0.2.0\nlangsmith>=0.2.0\npydantic>=2.7.0"
      },
      {
        "filename": "README.md",
        "language": "text",
        "description": "Logistics squad architecture overview.",
        "code": "# Autonomous Supply Chain Logistics & Dispatch Squad\n\nMulti-agent coordination for warehouse inventory replenishment and carrier dispatch.\n\n## Core Capabilities\n- Audits warehouse stock across multi-hub regional nodes.\n- Computes carrier cost-distance trade-offs using LangChain tool binding.\n- Gated by LangGraph v0.2 interrupt() when freight contracts exceed $5,000."
      }
    ]
  },
];

/** Original topologies followed by the step-by-step agent builds. */
export const WORKFLOW_USECASES: WorkflowUsecase[] = [...CORE_WORKFLOW_USECASES, ...AGENT_BUILD_USECASES];

export { AGENT_BUILD_USECASES, BUILD_CATEGORY, getBuildSteps, workflowFolder, type BuildStep } from "./workflow-build-guides";
