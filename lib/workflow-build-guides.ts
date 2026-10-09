/**
 * Step-by-step agent builds for the Workflow page.
 *
 * Every build here is authored as an ordered list of steps, and each code step
 * writes one complete file. The workflow's codebase (`files`), run commands and
 * terminal list are derived from those steps, so the walkthrough and the final
 * project can never disagree. Code targets the 1.x line of LangChain and
 * LangGraph (`create_agent`, middleware, `Command`, `Send`, runtime context)
 * and the current LangSmith SDK (`Client.evaluate`).
 */
import type { CodeFile, WorkflowUsecase } from "./workflow-usecases";

export type BuildStepLanguage = "python" | "bash" | "text" | "json";
export type BuildStepLayer = "Setup" | "LangChain" | "LangGraph" | "LangSmith";

export interface BuildStep {
  title: string;
  /** One sentence: what this step adds to the agent. */
  goal: string;
  /** Why the step exists and how the code works. */
  explanation: string;
  layer: BuildStepLayer;
  /** File written by this step. Omitted for shell-only steps. */
  file?: string;
  language: BuildStepLanguage;
  code: string;
  /** Command to run once the step is done. */
  run?: string;
  /** What the learner should see if the step worked. */
  checkpoint: string;
}

type BuildMeta = Omit<WorkflowUsecase, "files" | "runCommand" | "terminalCommands" | "buildSteps" | "category"> & {
  folder: string;
  steps: BuildStep[];
};

export const BUILD_CATEGORY = "Step-by-Step Agent Builds";

const TECH_STACK: WorkflowUsecase["techStack"] = [
  { name: "LangChain", version: "1.0+", role: "create_agent, tools, middleware and structured output", accent: "#0071E3" },
  { name: "LangGraph", version: "1.0+", role: "StateGraph, checkpointers, Command, Send and stores", accent: "#5856D6" },
  { name: "LangSmith", version: "0.4+", role: "Tracing, datasets and Client.evaluate experiments", accent: "#34C759" },
];

const REQUIREMENTS = `langchain>=1.0
langchain-openai>=1.0
langgraph>=1.0
langsmith>=0.4
python-dotenv>=1.0`;

/** The four setup steps every build starts with. */
function setupSteps(folder: string, project: string): BuildStep[] {
  return [
    {
      title: "Create the project folder and virtual environment",
      goal: "Start from an isolated Python environment so package versions cannot clash.",
      explanation:
        "Agents pull in several fast-moving packages. A dedicated virtual environment keeps LangChain 1.x and LangGraph 1.x away from older global installs, which is the most common cause of import errors such as a missing create_agent.",
      layer: "Setup",
      language: "bash",
      code: `mkdir ${folder} && cd ${folder}
python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows PowerShell
# .venv\\Scripts\\Activate.ps1`,
      checkpoint: "Your prompt shows (.venv) and `python --version` reports 3.10 or newer.",
    },
    {
      title: "Pin the dependencies",
      goal: "Install LangChain, LangGraph, LangSmith and one model provider.",
      explanation:
        "langchain gives you create_agent, tools and middleware. langgraph is the runtime underneath every agent. langsmith sends traces and runs evaluations. langchain-openai is the model provider; swap it for langchain-anthropic or another integration if you prefer.",
      layer: "Setup",
      file: "requirements.txt",
      language: "text",
      code: REQUIREMENTS,
      run: "pip install -r requirements.txt",
      checkpoint: "pip finishes without errors and `pip show langgraph` reports version 1.x.",
    },
    {
      title: "Add keys and turn on LangSmith tracing",
      goal: "Give the agent a model key and make every run visible in LangSmith.",
      explanation:
        "Setting LANGSMITH_TRACING=true is all it takes: LangChain and LangGraph detect it and send each model call, tool call and graph step to the project named in LANGSMITH_PROJECT. Never commit the real .env file.",
      layer: "LangSmith",
      file: ".env.example",
      language: "text",
      code: `OPENAI_API_KEY=sk-your-key
LANGSMITH_API_KEY=lsv2_your-key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=${project}
# Any provider:model string supported by init_chat_model
AGENT_MODEL=openai:gpt-5.4-mini`,
      run: "cp .env.example .env   # PowerShell: Copy-Item .env.example .env",
      checkpoint: "A .env file exists next to .env.example and holds your real keys.",
    },
    {
      title: "Create one place to choose the model",
      goal: "Load the environment once and build the chat model from a single setting.",
      explanation:
        "init_chat_model turns a 'provider:model' string into a chat model, so changing AGENT_MODEL in .env switches every agent in the project without code edits. Every later file imports get_model from here.",
      layer: "LangChain",
      file: "config.py",
      language: "python",
      code: String.raw`import os

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

load_dotenv()

MODEL_NAME = os.getenv("AGENT_MODEL", "openai:gpt-5.4-mini")


def get_model():
    """Return the chat model named in AGENT_MODEL, e.g. 'anthropic:claude-sonnet-4-6'."""
    return init_chat_model(MODEL_NAME)`,
      run: `python -c "from config import get_model; print(get_model().invoke('Reply with the word ready').content)"`,
      checkpoint: "The command prints 'ready' and a matching trace appears in LangSmith.",
    },
  ];
}

function defineBuild(meta: BuildMeta): WorkflowUsecase {
  const { folder, steps, ...rest } = meta;
  const latest = new Map<string, BuildStep>();
  for (const step of steps) if (step.file) latest.set(step.file, step);
  const files: CodeFile[] = [...latest.values()].map(step => ({
    filename: step.file!,
    language: step.language === "bash" ? "text" : step.language,
    description: step.goal,
    code: step.code,
  }));
  const terminalCommands = steps
    .filter(step => step.run && step.layer !== "Setup")
    .map(step => ({ label: step.title, command: step.run! }));
  const runStep = [...steps].reverse().find(step => step.run?.startsWith("python main.py"));
  return {
    ...rest,
    category: BUILD_CATEGORY,
    buildFolder: folder,
    files,
    runCommand: runStep?.run ?? "python main.py",
    terminalCommands: [{ label: "Install dependencies", command: "pip install -r requirements.txt" }, ...terminalCommands],
    buildSteps: steps,
  };
}

/* ------------------------------------------------------------------ */
/* 1. Single agent: a ReAct agent built by hand with StateGraph        */
/* ------------------------------------------------------------------ */

const reactFromScratch = defineBuild({
  id: "build-react-agent-from-scratch",
  folder: "react_agent",
  title: "Build a ReAct Research Agent from Scratch",
  subtitle: "Single agent. Hand-build the reason, act, observe loop with StateGraph, ToolNode, a checkpointer for memory, and LangSmith evaluation.",
  type: "single",
  badge: "Single Agent · Build Guide",
  tags: ["Self-Correction", "Structured Extraction"],
  architectureOverview:
    "The smallest real agent: one model node that can call tools, one tool node that runs them, and a conditional edge that loops until the model answers without a tool call. Building it by hand shows exactly what create_agent does for you, and the checkpointer gives the agent memory across turns of the same thread.",
  diagram: [
    "START ─> [agent: model.bind_tools]",
    "[agent] ─(tool_calls?)─> [tools: ToolNode] ─> [agent]",
    "[agent] ─(no tool calls)─> END",
    "InMemorySaver checkpoints state after every step, keyed by thread_id",
  ],
  keyHighlights: [
    "StateGraph with an add_messages reducer as the agent's working memory.",
    "bind_tools plus ToolNode and tools_condition for the ReAct loop.",
    "InMemorySaver so a follow-up question on the same thread remembers the first.",
    "A LangSmith dataset with two code evaluators: answer correctness and tool choice.",
  ],
  keyPoints: [
    "An agent is a loop: the model proposes tool calls, the runtime executes them, and the results go back to the model.",
    "The loop ends when the model replies without tool calls; tools_condition encodes exactly that rule.",
    "Memory is not magic: it is the checkpointer reloading the message list for the same thread_id.",
  ],
  keyConcepts: [
    { title: "add_messages reducer", description: "Appends new messages to the state list instead of replacing it, and de-duplicates by message id." },
    { title: "ToolNode", description: "A prebuilt node that executes every tool call in the last AI message and returns ToolMessages." },
    { title: "thread_id", description: "The key a checkpointer uses to save and reload a conversation's state." },
  ],
  learningObjectives: [
    "Write tools with the @tool decorator and clear docstrings the model can read.",
    "Assemble a cyclic StateGraph that alternates between the model and the tools.",
    "Measure the agent with a LangSmith dataset and code evaluators.",
  ],
  howItWorks:
    "The user message enters the graph state. The agent node calls a tool-bound model. If the reply contains tool calls, ToolNode executes them and the graph routes back to the agent. When the model answers in plain text, the graph ends and the checkpointer stores the whole exchange.",
  remember: "Node functions return only the keys they change; the reducer merges them into state.",
  watchOut: "Without a recursion limit or a clear stopping rule, a confused model can loop between agent and tools until LangGraph raises GraphRecursionError.",
  prerequisites: ["Python 3.10+", "An OpenAI (or other provider) API key", "A free LangSmith account and API key"],
  verify: [
    "python main.py prints tool-call steps followed by an answer that includes 391 for 17 × 23.",
    "The follow-up question is answered from memory because it reuses the same thread_id.",
    "python eval.py creates an experiment in LangSmith with two scores per example.",
  ],
  objectiveQuestions: [
    {
      question: "What makes the graph stop looping between the agent and the tools?",
      options: ["A) A fixed number of iterations", "B) tools_condition routes to END when the last AI message has no tool calls", "C) The ToolNode raises StopIteration", "D) The checkpointer detects a repeated state"],
      answer: "B) tools_condition routes to END when the last AI message has no tool calls",
      explanation: "tools_condition inspects the last message. Tool calls send the graph to the tools node; a plain answer ends the run.",
    },
    {
      question: "Why does the follow-up question in main.py remember the first answer?",
      options: ["A) The model caches prompts", "B) LangSmith replays the trace", "C) The checkpointer reloads the message list for the same thread_id", "D) Python keeps a global variable"],
      answer: "C) The checkpointer reloads the message list for the same thread_id",
      explanation: "Each invoke with the same thread_id starts from the last saved state, so earlier messages are already present.",
    },
  ],
  subjectiveQuestions: [
    {
      question: "Explain what create_agent would replace in this project and when you would still hand-build the graph.",
      difficulty: 2,
      answer: "create_agent builds this same model node, tool node and conditional loop for you, plus middleware hooks. You hand-build when you need extra nodes around the loop, custom state keys, special routing such as validation before tools, or when you are teaching or debugging the loop itself.",
    },
  ],
  techStack: TECH_STACK,
  steps: [
    ...setupSteps("react_agent", "react-agent-from-scratch"),
    {
      title: "Write the tools the agent can call",
      goal: "Give the agent two capabilities: searching notes and doing arithmetic.",
      explanation:
        "The @tool decorator turns a typed Python function into a tool schema. The model only sees the name, the argument types and the docstring, so the docstring must say when to use the tool. The calculator parses the expression with Python's ast module and only allows numbers and + - * /, so the model can never make it run arbitrary code.",
      layer: "LangChain",
      file: "tools.py",
      language: "python",
      code: String.raw`import ast
import operator

from langchain.tools import tool

# Sample notes for the exercise. Replace with a vector store or API later.
KNOWLEDGE_BASE = {
    "langgraph": "LangGraph is a low-level runtime for stateful, long-running agents. It models an agent as a graph of nodes that read and update shared state.",
    "langchain": "LangChain provides model integrations, tools and the create_agent helper, which builds a tool-calling agent on top of LangGraph.",
    "langsmith": "LangSmith records traces of every model and tool call and runs evaluations over datasets to score agent quality.",
    "checkpointer": "A checkpointer saves graph state after every step, keyed by thread_id. It enables memory, resuming and human-in-the-loop.",
}


@tool
def search_notes(query: str) -> str:
    """Search the engineering notes. Use for any question about LangChain, LangGraph, LangSmith or checkpointers."""
    q = query.lower()
    hits = [text for key, text in KNOWLEDGE_BASE.items() if key in q]
    return "\n".join(hits) if hits else "No matching notes. Answer from general knowledge and say so."


OPERATORS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.USub: operator.neg}


def _evaluate(node: ast.AST) -> float:
    """Walk the parsed expression, allowing only numbers and + - * /."""
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in OPERATORS:
        return OPERATORS[type(node.op)](_evaluate(node.left), _evaluate(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in OPERATORS:
        return OPERATORS[type(node.op)](_evaluate(node.operand))
    raise ValueError("only numbers and + - * / are allowed")


@tool
def calculator(expression: str) -> str:
    """Evaluate an arithmetic expression such as '12 * (3 + 4)'."""
    try:
        return str(_evaluate(ast.parse(expression, mode="eval").body))
    except (SyntaxError, ValueError, ZeroDivisionError) as exc:
        return f"Error: {exc}"


TOOLS = [search_notes, calculator]`,
      run: `python -c "from tools import calculator; print(calculator.invoke({'expression': '6 * 7'}))"`,
      checkpoint: "The command prints 42. Tools are plain runnables, so you can test them without a model.",
    },
    {
      title: "Define the agent state",
      goal: "Describe the data that flows through the graph.",
      explanation:
        "The state is a TypedDict. Annotating messages with add_messages tells LangGraph to append each node's new messages rather than overwrite the list. This one key is the agent's whole working memory.",
      layer: "LangGraph",
      file: "state.py",
      language: "python",
      code: String.raw`from typing import Annotated

from langchain.messages import AnyMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class AgentState(TypedDict):
    # add_messages appends new messages and de-duplicates by id.
    messages: Annotated[list[AnyMessage], add_messages]`,
      checkpoint: "Nothing to run yet. The next step imports this class.",
    },
    {
      title: "Wire the ReAct loop as a graph",
      goal: "Connect the model node and the tool node with a conditional loop.",
      explanation:
        "call_model sends the system prompt plus the conversation to a tool-bound model. ToolNode runs whatever tools the model asked for. tools_condition routes to 'tools' when there are tool calls and to END otherwise, and the edge from tools back to agent closes the loop. Compiling with InMemorySaver adds memory.",
      layer: "LangGraph",
      file: "graph.py",
      language: "python",
      code: String.raw`from langchain.messages import SystemMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from config import get_model
from state import AgentState
from tools import TOOLS

SYSTEM_PROMPT = SystemMessage(
    "You are a precise research assistant. Use search_notes for facts about the "
    "LangChain ecosystem and calculator for every calculation. Say which tool you used."
)
model_with_tools = get_model().bind_tools(TOOLS)


def call_model(state: AgentState) -> dict:
    response = model_with_tools.invoke([SYSTEM_PROMPT, *state["messages"]])
    return {"messages": [response]}


def build_graph(checkpointer=None):
    builder = StateGraph(AgentState)
    builder.add_node("agent", call_model)
    builder.add_node("tools", ToolNode(TOOLS))
    builder.add_edge(START, "agent")
    builder.add_conditional_edges("agent", tools_condition)  # -> "tools" or END
    builder.add_edge("tools", "agent")
    return builder.compile(checkpointer=checkpointer or InMemorySaver())


graph = build_graph()`,
      run: `python -c "from graph import graph; print(graph.get_graph().draw_mermaid())"`,
      checkpoint: "A Mermaid diagram prints with __start__, agent, tools and __end__, and a loop between agent and tools.",
    },
    {
      title: "Run the agent and stream each step",
      goal: "Watch the loop happen and prove the agent remembers the thread.",
      explanation:
        "stream_mode='updates' yields one dictionary per finished node, so you see each tool call and each answer as it happens. The second question reuses the thread_id, so the checkpointer loads the first exchange and the agent can summarise it.",
      layer: "LangGraph",
      file: "main.py",
      language: "python",
      code: String.raw`import sys

from graph import graph


def chat(question: str, thread_id: str = "demo-thread") -> str:
    config = {"configurable": {"thread_id": thread_id}}
    inputs = {"messages": [{"role": "user", "content": question}]}
    for step in graph.stream(inputs, config, stream_mode="updates"):
        for node, update in step.items():
            last = update["messages"][-1]
            kind = "tool calls" if getattr(last, "tool_calls", None) else "message"
            print(f"[{node}] {kind}: {str(last.content)[:120]}")
    return graph.get_state(config).values["messages"][-1].content


if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) or "What does a LangGraph checkpointer do, and what is 17 * 23?"
    print("\nAnswer:", chat(question))
    print("\nFollow-up on the same thread:")
    print(chat("Summarise your previous answer in one sentence."))`,
      run: "python main.py",
      checkpoint: "You see [agent] tool calls, then [tools] results, then a final answer containing 391, then a one-sentence summary.",
    },
    {
      title: "Inspect the run in LangSmith",
      goal: "Read the trace to see every model call, tool call and token count.",
      explanation:
        "Open your LangSmith project. Each invoke is one trace whose child runs are the graph nodes. Click the agent run to see the exact prompt the model received, including the tool schemas generated from your docstrings. This is where you debug a wrong tool choice.",
      layer: "LangSmith",
      language: "text",
      code: `LangSmith → Projects → react-agent-from-scratch
  └─ LangGraph (trace)
       ├─ agent      → ChatOpenAI (tool_calls: search_notes, calculator)
       ├─ tools      → search_notes, calculator
       └─ agent      → ChatOpenAI (final answer)`,
      checkpoint: "You can find the calculator call with input '17 * 23' and output '391' in the trace tree.",
    },
    {
      title: "Evaluate the agent with a dataset",
      goal: "Score the agent automatically so later changes cannot silently break it.",
      explanation:
        "The script creates a small dataset once, then Client.evaluate runs the target on every example. Each evaluator is a plain function: LangSmith passes outputs and reference_outputs by parameter name. One checks the answer, the other checks that the agent picked the right tool.",
      layer: "LangSmith",
      file: "eval.py",
      language: "python",
      code: String.raw`import uuid

from langsmith import Client

from graph import build_graph

client = Client()
DATASET = "react-agent-from-scratch"
EXAMPLES = [
    {"inputs": {"question": "What is 12 * (3 + 4)?"}, "outputs": {"must_contain": "84", "tool": "calculator"}},
    {"inputs": {"question": "What does a checkpointer save?"}, "outputs": {"must_contain": "thread", "tool": "search_notes"}},
]


def ensure_dataset() -> None:
    if not client.has_dataset(dataset_name=DATASET):
        dataset = client.create_dataset(dataset_name=DATASET)
        client.create_examples(dataset_id=dataset.id, examples=EXAMPLES)


def target(inputs: dict) -> dict:
    graph = build_graph()
    config = {"configurable": {"thread_id": str(uuid.uuid4())}}
    result = graph.invoke({"messages": [{"role": "user", "content": inputs["question"]}]}, config)
    tools_used = [call["name"] for m in result["messages"] for call in (getattr(m, "tool_calls", None) or [])]
    return {"answer": result["messages"][-1].content, "tools_used": tools_used}


def contains_expected(outputs: dict, reference_outputs: dict) -> bool:
    return reference_outputs["must_contain"].lower() in outputs["answer"].lower()


def used_right_tool(outputs: dict, reference_outputs: dict) -> bool:
    return reference_outputs["tool"] in outputs["tools_used"]


if __name__ == "__main__":
    ensure_dataset()
    results = client.evaluate(
        target,
        data=DATASET,
        evaluators=[contains_expected, used_right_tool],
        experiment_prefix="react-from-scratch",
    )
    print(results)`,
      run: "python eval.py",
      checkpoint: "LangSmith shows a new experiment with contains_expected and used_right_tool scores for both examples.",
    },
  ],
});

/* ------------------------------------------------------------------ */
/* 2. Single agent: create_agent + human-in-the-loop middleware        */
/* ------------------------------------------------------------------ */

const hitlEmailAgent = defineBuild({
  id: "build-hitl-email-agent-create-agent",
  folder: "inbox_agent",
  title: "Build an Inbox Triage Agent with Human Approval",
  subtitle: "Single agent. Use create_agent with HumanInTheLoopMiddleware, structured output and a checkpointer so risky tool calls wait for a person.",
  type: "single",
  badge: "Single Agent + Human-in-the-Loop · Build Guide",
  tags: ["Human-in-the-Loop", "Structured Extraction"],
  architectureOverview:
    "create_agent builds the tool-calling loop in one call. HumanInTheLoopMiddleware pauses the run before any tool listed in interrupt_on, and the checkpointer saves the paused state. A person approves, edits or rejects each action, the run resumes with Command(resume=...), and the agent finishes with a typed TriageReport.",
  diagram: [
    "User ─> [create_agent: model ⇄ tools]",
    "[model] ─(send_email / archive_email)─> HumanInTheLoopMiddleware ─> interrupt",
    "[Human] ─(approve / edit / reject)─> Command(resume={'decisions': [...]})",
    "[model] ─(done)─> structured_response: TriageReport",
  ],
  keyHighlights: [
    "create_agent with system_prompt, tools, middleware and response_format.",
    "Per-tool approval policies: send_email allows edit, archive_email only approve or reject.",
    "A resume loop that keeps answering interrupts until the agent finishes.",
    "A LangSmith evaluator that proves no email was sent without an approval.",
  ],
  keyPoints: [
    "Approval belongs in middleware, not in the prompt: the model cannot talk its way past it.",
    "Interrupts need a checkpointer because the paused run must be saved and reloaded.",
    "response_format makes the final answer a validated Pydantic object, not free text.",
  ],
  keyConcepts: [
    { title: "create_agent", description: "LangChain 1.x helper that builds a model-and-tools loop on LangGraph and accepts middleware." },
    { title: "HumanInTheLoopMiddleware", description: "Middleware that interrupts before selected tool calls and applies the human's decisions." },
    { title: "structured_response", description: "The validated object produced when response_format is set on create_agent." },
  ],
  learningObjectives: [
    "Create an agent with create_agent and a typed response_format.",
    "Configure per-tool approval rules with HumanInTheLoopMiddleware.",
    "Resume an interrupted thread with approve, edit and reject decisions.",
  ],
  howItWorks:
    "The agent lists the inbox freely because list_inbox is not gated. When it decides to send or archive, the middleware raises an interrupt carrying the proposed calls. main.py shows each one to you, collects a decision per call, and resumes the same thread. After the last tool call, the agent returns a TriageReport.",
  remember: "Send exactly one decision per action request, in the same order as the request lists them.",
  watchOut: "Resuming with a new thread_id starts a fresh conversation; the paused run is only found under the original thread_id.",
  prerequisites: ["Python 3.10+", "An OpenAI (or other provider) API key", "A LangSmith API key"],
  verify: [
    "python main.py stops and asks you to approve, edit or reject each send_email and archive_email call.",
    "Rejecting a reply keeps it out of the sent list printed at the end.",
    "python eval.py scores approvals_gate_sends as 1 for every example.",
  ],
  objectiveQuestions: [
    {
      question: "Where does the agent's run pause when it wants to call send_email?",
      options: ["A) Inside the tool body", "B) In HumanInTheLoopMiddleware, before the tool executes", "C) After the email is sent", "D) In LangSmith"],
      answer: "B) In HumanInTheLoopMiddleware, before the tool executes",
      explanation: "The middleware checks interrupt_on and raises an interrupt before running the gated tool call.",
    },
    {
      question: "Which key holds the typed TriageReport after the run finishes?",
      options: ["A) result['messages'][-1]", "B) result['structured_response']", "C) result['__interrupt__']", "D) result['output']"],
      answer: "B) result['structured_response']",
      explanation: "When response_format is set, create_agent stores the validated object under structured_response.",
    },
  ],
  subjectiveQuestions: [
    {
      question: "Why is a middleware approval gate safer than telling the model in its prompt to ask before sending email?",
      difficulty: 2,
      answer: "A prompt instruction is a request the model may ignore, misread, or be manipulated out of by text in an email. The middleware runs in code around every tool call, so a gated tool cannot execute until a human decision arrives, regardless of what the model says.",
    },
  ],
  techStack: TECH_STACK,
  steps: [
    ...setupSteps("inbox_agent", "inbox-triage-agent"),
    {
      title: "Write safe and risky tools",
      goal: "Give the agent one read-only tool and two tools with side effects.",
      explanation:
        "list_inbox only reads, so it can run freely. send_email and archive_email change the world, so the next step gates them. The in-memory INBOX, SENT and ARCHIVED lists stand in for a real mail API so the exercise runs offline.",
      layer: "LangChain",
      file: "tools.py",
      language: "python",
      code: String.raw`from langchain.tools import tool

# Sample inbox for the exercise. Swap for Gmail or Microsoft Graph later.
INBOX = [
    {"id": "e1", "from": "billing@vendor.example", "subject": "Invoice 2291 overdue", "body": "Invoice of $4,200 is 15 days overdue."},
    {"id": "e2", "from": "news@ai-weekly.example", "subject": "This week in agents", "body": "Top ten agent papers of the week."},
    {"id": "e3", "from": "priya@customer.example", "subject": "Production outage?", "body": "Our dashboard has returned 500 errors since 09:00."},
]
SENT: list[dict] = []
ARCHIVED: set[str] = set()


@tool
def list_inbox() -> list[dict]:
    """Return every email that is not archived, with id, sender, subject and body."""
    return [mail for mail in INBOX if mail["id"] not in ARCHIVED]


@tool
def send_email(to: str, subject: str, body: str) -> str:
    """Send an email. Has real-world side effects."""
    SENT.append({"to": to, "subject": subject, "body": body})
    return f"Sent to {to}: {subject}"


@tool
def archive_email(email_id: str) -> str:
    """Archive an email that needs no action, such as a newsletter."""
    ARCHIVED.add(email_id)
    return f"Archived {email_id}"`,
      run: `python -c "from tools import list_inbox; print(len(list_inbox.invoke({})))"`,
      checkpoint: "The command prints 3.",
    },
    {
      title: "Create the agent with an approval gate and typed output",
      goal: "Build the whole agent loop in one create_agent call.",
      explanation:
        "interrupt_on maps tool names to policies: True or a dict of allowed decisions pauses the call, False lets it run. response_format=TriageReport makes the agent end with a validated object. The checkpointer is required because a paused run has to be stored until the human answers.",
      layer: "LangChain",
      file: "agent.py",
      language: "python",
      code: String.raw`from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langgraph.checkpoint.memory import InMemorySaver
from pydantic import BaseModel, Field

from config import get_model
from tools import archive_email, list_inbox, send_email


class TriageReport(BaseModel):
    urgent: list[str] = Field(description="Ids of emails that need action today")
    replied: list[str] = Field(description="Ids of emails that received a reply")
    archived: list[str] = Field(description="Ids of emails that were archived")
    summary: str = Field(description="Two sentence summary for the inbox owner")


agent = create_agent(
    model=get_model(),
    tools=[list_inbox, send_email, archive_email],
    system_prompt=(
        "You triage the user's inbox. Read it with list_inbox. Reply briefly and politely "
        "to anything urgent, archive newsletters, and leave the rest. Then report."
    ),
    middleware=[
        HumanInTheLoopMiddleware(
            interrupt_on={
                "send_email": {"allowed_decisions": ["approve", "edit", "reject"]},
                "archive_email": {"allowed_decisions": ["approve", "reject"]},
                "list_inbox": False,
            }
        )
    ],
    response_format=TriageReport,
    checkpointer=InMemorySaver(),
)`,
      checkpoint: "Importing agent.py raises no errors: python -c \"import agent\".",
    },
    {
      title: "Answer interrupts and resume the run",
      goal: "Let a person approve, edit or reject each risky action, then finish the run.",
      explanation:
        "A paused run returns a result containing __interrupt__. Its value lists action_requests, one per gated tool call. You build one decision per request and resume the same thread with Command(resume={'decisions': [...]}). The loop repeats because the agent may want more approvals later. Pass --yes to approve everything automatically.",
      layer: "LangGraph",
      file: "main.py",
      language: "python",
      code: String.raw`import sys

from langgraph.types import Command

from agent import agent
from tools import ARCHIVED, SENT


def ask_human(action: dict) -> dict:
    print(f"\nAgent wants {action['name']} with {action['args']}")
    choice = input("approve / edit / reject [approve]: ").strip().lower() or "approve"
    if choice == "edit" and action["name"] == "send_email":
        body = input("New body: ")
        return {"type": "edit", "edited_action": {"name": action["name"], "args": {**action["args"], "body": body}}}
    if choice == "reject":
        return {"type": "reject", "message": input("Reason: ") or "Rejected by the inbox owner"}
    return {"type": "approve"}


def run(thread_id: str = "inbox-1", auto_approve: bool = False) -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    request = {"messages": [{"role": "user", "content": "Triage my inbox now."}]}
    result = agent.invoke(request, config)
    approvals = 0
    while "__interrupt__" in result:
        pending = result["__interrupt__"][0].value
        decisions = [{"type": "approve"} if auto_approve else ask_human(a) for a in pending["action_requests"]]
        approvals += sum(d["type"] != "reject" for d in decisions)
        result = agent.invoke(Command(resume={"decisions": decisions}), config)
    return {"report": result["structured_response"], "approvals": approvals}


if __name__ == "__main__":
    outcome = run(auto_approve="--yes" in sys.argv)
    print("\n", outcome["report"].model_dump_json(indent=2))
    print("Sent:", SENT)
    print("Archived:", sorted(ARCHIVED))`,
      run: "python main.py",
      checkpoint: "The run pauses with 'Agent wants send_email ...', and after your decisions it prints a TriageReport listing e3 as urgent and e2 as archived.",
    },
    {
      title: "Find the interrupt in LangSmith",
      goal: "See where the run paused and how it resumed.",
      explanation:
        "Every invoke is a separate trace on the same thread. The first trace ends at the middleware interrupt. The resumed trace starts with your decisions and continues to the tool execution. Filtering by thread shows the full conversation as one timeline.",
      layer: "LangSmith",
      language: "text",
      code: `LangSmith → Projects → inbox-triage-agent → Threads → inbox-1
  trace 1: model → list_inbox → model → HumanInTheLoopMiddleware (interrupt)
  trace 2: resume decisions → send_email / archive_email → model → TriageReport`,
      checkpoint: "The thread view shows two or more traces joined by the same thread id.",
    },
    {
      title: "Evaluate the approval gate",
      goal: "Prove automatically that every sent email went through a human decision.",
      explanation:
        "The target resets the sample inbox and runs with auto-approval on a fresh thread. approvals_gate_sends fails if more emails were sent than were approved. archived_newsletter checks the triage judgement itself.",
      layer: "LangSmith",
      file: "eval.py",
      language: "python",
      code: String.raw`import uuid

from langsmith import Client

import main
from tools import ARCHIVED, SENT

client = Client()
DATASET = "inbox-triage-agent"


def ensure_dataset() -> None:
    if not client.has_dataset(dataset_name=DATASET):
        dataset = client.create_dataset(dataset_name=DATASET)
        client.create_examples(
            dataset_id=dataset.id,
            examples=[{"inputs": {"scenario": "default inbox"}, "outputs": {"newsletter_id": "e2", "urgent_id": "e3"}}],
        )


def target(inputs: dict) -> dict:
    SENT.clear()
    ARCHIVED.clear()
    outcome = main.run(thread_id=str(uuid.uuid4()), auto_approve=True)
    return {"report": outcome["report"].model_dump(), "approvals": outcome["approvals"], "sent": len(SENT), "archived": sorted(ARCHIVED)}


def approvals_gate_sends(outputs: dict) -> bool:
    return outputs["sent"] <= outputs["approvals"]


def archived_newsletter(outputs: dict, reference_outputs: dict) -> bool:
    return reference_outputs["newsletter_id"] in outputs["archived"]


def flagged_urgent(outputs: dict, reference_outputs: dict) -> bool:
    return reference_outputs["urgent_id"] in outputs["report"]["urgent"]


if __name__ == "__main__":
    ensure_dataset()
    print(client.evaluate(target, data=DATASET, evaluators=[approvals_gate_sends, archived_newsletter, flagged_urgent], experiment_prefix="inbox-hitl"))`,
      run: "python eval.py",
      checkpoint: "The experiment shows approvals_gate_sends = 1, plus scores for the newsletter and urgent checks.",
    },
  ],
});

/* ------------------------------------------------------------------ */
/* 3. Single agent: long-term memory with a store and runtime context  */
/* ------------------------------------------------------------------ */

const memoryAgent = defineBuild({
  id: "build-memory-agent-store",
  folder: "memory_agent",
  title: "Build a Study Coach Agent with Long-Term Memory",
  subtitle: "Single agent. Combine short-term thread memory from a checkpointer with long-term user memory in a LangGraph store, scoped by runtime context.",
  type: "single",
  badge: "Single Agent + Memory · Build Guide",
  tags: ["Episodic Memory", "Structured Extraction"],
  architectureOverview:
    "Two kinds of memory work together. The checkpointer remembers one conversation (a thread). The store remembers facts about a user across every thread. A respond node reads the user's facts from the store before answering, and a remember node extracts new durable facts with structured output and writes them back.",
  diagram: [
    "START ─> [respond] reads store namespace ('memories', user_id)",
    "[respond] ─> [remember] with_structured_output(MemoryUpdate)",
    "[remember] ─> store.put(...) ─> END",
    "Checkpointer = per-thread history · Store = cross-thread user facts",
  ],
  keyHighlights: [
    "context_schema and Runtime pass user_id into nodes without putting it in state.",
    "InMemoryStore namespaces keep each user's memories separate.",
    "with_structured_output extracts only durable facts worth saving.",
    "An evaluation that checks a fact learned in one thread is used in another.",
  ],
  keyPoints: [
    "Checkpointer memory is per thread; store memory is per user and survives new threads.",
    "Runtime context carries per-run values such as user_id that should not live in graph state.",
    "Write memory deliberately: extract facts, do not dump whole transcripts into the store.",
  ],
  keyConcepts: [
    { title: "BaseStore / InMemoryStore", description: "A key-value store with namespaces that graphs can read and write across threads." },
    { title: "Runtime context", description: "Per-invocation data passed with context=..., typed by context_schema, read from runtime.context." },
    { title: "Memory extraction", description: "A structured-output call that decides which new facts are worth keeping." },
  ],
  learningObjectives: [
    "Tell short-term thread memory and long-term store memory apart.",
    "Pass per-user context into nodes with context_schema and Runtime.",
    "Read and write namespaced memories from inside graph nodes.",
  ],
  howItWorks:
    "Each invoke passes context={'user_id': ...}. The respond node loads that user's facts from the store and adds them to the system prompt. After answering, the remember node asks the model to extract durable facts from the latest user message and stores each one under the user's namespace. A new thread for the same user starts with those facts already known.",
  remember: "Namespace every memory by user so one person's facts can never reach another's prompt.",
  watchOut: "InMemoryStore and InMemorySaver vanish when the process exits; use a Postgres store and checkpointer in production.",
  prerequisites: ["Python 3.10+", "An OpenAI (or other provider) API key", "A LangSmith API key"],
  verify: [
    "In main.py, the second thread for Asha recommends Python-based study because it recalls her goal.",
    "The same question for a different user gets a generic answer with no recalled facts.",
    "python eval.py scores recalls_fact as 1.",
  ],
  objectiveQuestions: [
    {
      question: "A user starts a brand-new thread. Which memory still knows their stated goal?",
      options: ["A) The checkpointer", "B) The store", "C) The model's weights", "D) LangSmith"],
      answer: "B) The store",
      explanation: "Checkpointer state is scoped to a thread. The store is shared across threads and namespaced by user.",
    },
    {
      question: "How does the respond node learn which user it is serving?",
      options: ["A) From a global variable", "B) From runtime.context, passed with context=... on invoke", "C) From the last message", "D) From the thread_id"],
      answer: "B) From runtime.context, passed with context=... on invoke",
      explanation: "context_schema declares the shape and each invoke supplies the values, which nodes read through Runtime.",
    },
  ],
  subjectiveQuestions: [
    {
      question: "Describe the risks of saving every message to long-term memory and how the extraction step reduces them.",
      difficulty: 2,
      answer: "Saving everything bloats prompts, raises cost, stores sensitive or temporary details, and lets stale or wrong statements steer future answers. Extracting only durable facts with a schema keeps memory small and relevant, and gives you one place to add rules such as skipping secrets or asking for confirmation.",
    },
  ],
  techStack: TECH_STACK,
  steps: [
    ...setupSteps("memory_agent", "memory-study-coach"),
    {
      title: "Declare the runtime context and memory schema",
      goal: "Describe who the run is for and what a memory looks like.",
      explanation:
        "Context is a dataclass passed on every invoke; it is not saved in graph state, which keeps user identity out of checkpoints. MemoryUpdate is the schema the model fills when it extracts facts.",
      layer: "LangChain",
      file: "schemas.py",
      language: "python",
      code: String.raw`from dataclasses import dataclass

from pydantic import BaseModel, Field


@dataclass
class Context:
    user_id: str


class MemoryUpdate(BaseModel):
    new_facts: list[str] = Field(
        default_factory=list,
        description="Durable facts about the user, such as goals, level or preferences. Empty if none.",
    )`,
      checkpoint: "python -c \"from schemas import Context; print(Context('asha'))\" prints Context(user_id='asha').",
    },
    {
      title: "Build the graph that reads and writes memory",
      goal: "Answer with recalled facts, then save any new ones.",
      explanation:
        "Nodes receive runtime: Runtime[Context], which exposes runtime.context and runtime.store. respond searches the user's namespace and adds the facts to the system prompt. remember runs the extractor on the latest user message and puts each fact under a fresh key. Compile with both a checkpointer and a store.",
      layer: "LangGraph",
      file: "graph.py",
      language: "python",
      code: String.raw`import uuid

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.runtime import Runtime
from langgraph.store.memory import InMemoryStore

from config import get_model
from schemas import Context, MemoryUpdate

model = get_model()
extractor = model.with_structured_output(MemoryUpdate)


def namespace(runtime: Runtime[Context]) -> tuple[str, str]:
    return ("memories", runtime.context.user_id)


def respond(state: MessagesState, runtime: Runtime[Context]) -> dict:
    items = runtime.store.search(namespace(runtime), limit=20)
    facts = "\n".join(f"- {item.value['fact']}" for item in items) or "- nothing yet"
    system = f"You are a friendly study coach. What you know about this learner:\n{facts}"
    reply = model.invoke([{"role": "system", "content": system}, *state["messages"]])
    return {"messages": [reply]}


def remember(state: MessagesState, runtime: Runtime[Context]) -> dict:
    last_user = next(m for m in reversed(state["messages"]) if m.type == "human")
    update = extractor.invoke([
        {"role": "system", "content": "Extract durable facts about the learner from this message only."},
        {"role": "user", "content": last_user.content},
    ])
    for fact in update.new_facts:
        runtime.store.put(namespace(runtime), str(uuid.uuid4()), {"fact": fact})
    return {}


def build_graph(store=None, checkpointer=None):
    builder = StateGraph(MessagesState, context_schema=Context)
    builder.add_node("respond", respond)
    builder.add_node("remember", remember)
    builder.add_edge(START, "respond")
    builder.add_edge("respond", "remember")
    return builder.compile(checkpointer=checkpointer or InMemorySaver(), store=store or InMemoryStore())


graph = build_graph()`,
      run: `python -c "from graph import graph; print(graph.get_graph().draw_mermaid())"`,
      checkpoint: "The diagram shows __start__ → respond → remember → __end__.",
    },
    {
      title: "Prove memory crosses threads but not users",
      goal: "Teach the agent in one thread and test recall in another.",
      explanation:
        "Thread A tells the coach Asha's goal. Thread B is a brand-new conversation, so the checkpointer has nothing, yet the store still holds Asha's facts. Ravi asks the same question and gets no recalled facts because his namespace is empty.",
      layer: "LangGraph",
      file: "main.py",
      language: "python",
      code: String.raw`from graph import graph


def ask(text: str, user_id: str, thread_id: str) -> str:
    result = graph.invoke(
        {"messages": [{"role": "user", "content": text}]},
        {"configurable": {"thread_id": thread_id}},
        context={"user_id": user_id},
    )
    return result["messages"][-1].content


if __name__ == "__main__":
    print(ask("Hi! I'm Asha, a beginner aiming to become a data engineer. I prefer Python.", "asha", "thread-a"))
    print("\n--- new thread, same user ---")
    print(ask("What should I study this week?", "asha", "thread-b"))
    print("\n--- same question, different user ---")
    print(ask("What should I study this week?", "ravi", "thread-c"))
    for item in graph.store.search(("memories", "asha")):
        print("stored:", item.value["fact"])`,
      run: "python main.py",
      checkpoint: "Asha's second answer mentions Python or data engineering, Ravi's does not, and the stored facts print at the end.",
    },
    {
      title: "Trace memory reads and writes",
      goal: "Confirm in LangSmith which facts reached the prompt.",
      explanation:
        "Open the thread-b trace and click the respond model call. The system message shows the recalled facts, which is the fastest way to debug a wrong or missing memory. The remember run shows the structured MemoryUpdate the extractor produced.",
      layer: "LangSmith",
      language: "text",
      code: `LangSmith → Projects → memory-study-coach
  thread-b trace
    ├─ respond  → system prompt contains "- Wants to become a data engineer"
    └─ remember → MemoryUpdate(new_facts=[])`,
      checkpoint: "The thread-b system prompt lists facts learned in thread-a.",
    },
    {
      title: "Evaluate cross-thread recall",
      goal: "Score whether a fact taught in one thread is used in another.",
      explanation:
        "Each example teaches a fact, then asks a question on a new thread with a fresh store so examples cannot leak into each other. recalls_fact checks the answer for the expected keyword.",
      layer: "LangSmith",
      file: "eval.py",
      language: "python",
      code: String.raw`import uuid

from langsmith import Client

from graph import build_graph

client = Client()
DATASET = "memory-study-coach"
EXAMPLES = [
    {"inputs": {"teach": "I am learning Rust for embedded systems.", "ask": "Suggest one project for me."}, "outputs": {"keyword": "rust"}},
    {"inputs": {"teach": "I only have 20 minutes a day to study.", "ask": "Plan my week."}, "outputs": {"keyword": "20"}},
]


def ensure_dataset() -> None:
    if not client.has_dataset(dataset_name=DATASET):
        dataset = client.create_dataset(dataset_name=DATASET)
        client.create_examples(dataset_id=dataset.id, examples=EXAMPLES)


def target(inputs: dict) -> dict:
    graph = build_graph()
    user = {"user_id": str(uuid.uuid4())}
    graph.invoke({"messages": [{"role": "user", "content": inputs["teach"]}]}, {"configurable": {"thread_id": "t1"}}, context=user)
    result = graph.invoke({"messages": [{"role": "user", "content": inputs["ask"]}]}, {"configurable": {"thread_id": "t2"}}, context=user)
    return {"answer": result["messages"][-1].content}


def recalls_fact(outputs: dict, reference_outputs: dict) -> bool:
    return reference_outputs["keyword"].lower() in outputs["answer"].lower()


if __name__ == "__main__":
    ensure_dataset()
    print(client.evaluate(target, data=DATASET, evaluators=[recalls_fact], experiment_prefix="memory-recall"))`,
      run: "python eval.py",
      checkpoint: "Both examples score recalls_fact = 1 in the LangSmith experiment.",
    },
  ],
});

/* ------------------------------------------------------------------ */
/* 4. Multi agent: supervisor that calls specialist subagents as tools */
/* ------------------------------------------------------------------ */

const supervisorTeam = defineBuild({
  id: "build-supervisor-subagents-team",
  folder: "supervisor_team",
  title: "Build a Supervisor Research Team with Subagents",
  subtitle: "Multi agent. A supervisor create_agent delegates to researcher, analyst and writer subagents wrapped as tools, with tracing and trajectory evaluation.",
  type: "multi",
  badge: "Multi-Agent Supervisor · Build Guide",
  tags: ["Supervisor", "Plan & Execute"],
  architectureOverview:
    "Each specialist is its own create_agent with its own tools and prompt. The supervisor never sees their tools; it sees three delegation tools, one per specialist. Calling a delegation tool runs that subagent to completion and returns its final message. This keeps every agent's context small and makes the supervisor's plan visible as a sequence of tool calls.",
  diagram: [
    "User ─> [supervisor: create_agent]",
    "[supervisor] ─ask_researcher─> [researcher: search_papers]",
    "[supervisor] ─ask_analyst─> [analyst: get_adoption_metrics]",
    "[supervisor] ─ask_writer─> [writer: word_count] ─> final brief",
  ],
  keyHighlights: [
    "Three specialist agents, each with its own narrow toolset and prompt.",
    "Subagents wrapped as @tool functions so the supervisor delegates by tool call.",
    "A checkpointer on the supervisor only; subagents run fresh per delegation.",
    "A trajectory evaluator that checks every specialist was consulted.",
  ],
  keyPoints: [
    "Subagents-as-tools is the simplest multi-agent pattern: the supervisor is just an agent whose tools are other agents.",
    "Context isolation is the main win: each subagent only sees the task text it was given.",
    "The tool docstrings are the supervisor's routing rules, so write them as precisely as prompts.",
  ],
  keyConcepts: [
    { title: "Supervisor", description: "An agent that plans and delegates but does not do the specialist work itself." },
    { title: "Subagent as tool", description: "A compiled agent invoked inside a @tool function that returns its final message." },
    { title: "Trajectory evaluation", description: "Scoring the sequence of tool calls an agent made, not only its final answer." },
  ],
  learningObjectives: [
    "Build several specialist agents with create_agent.",
    "Expose subagents to a supervisor through delegation tools.",
    "Evaluate a multi-agent run by its trajectory and its final output.",
  ],
  howItWorks:
    "The supervisor receives the request and calls ask_researcher for facts, ask_analyst for numbers, then ask_writer with both results. Each delegation tool invokes its subagent with a single user message and returns the last message content. The supervisor then returns the writer's brief.",
  remember: "Pass subagents the full task they need in the tool argument; they cannot see the supervisor's conversation.",
  watchOut: "Delegation loops cost real money: cap them with a recursion_limit and keep subagent prompts focused on one job.",
  prerequisites: ["Python 3.10+", "An OpenAI (or other provider) API key", "A LangSmith API key"],
  verify: [
    "python main.py prints delegations to the researcher, analyst and writer, in that order.",
    "The final brief is under 150 words and cites figures from the analyst.",
    "python eval.py scores consulted_all_specialists and brief_is_short as 1.",
  ],
  objectiveQuestions: [
    {
      question: "What does the supervisor see when the researcher finishes?",
      options: ["A) The researcher's full message history", "B) Only the string returned by ask_researcher", "C) The researcher's tool schemas", "D) Nothing until the writer runs"],
      answer: "B) Only the string returned by ask_researcher",
      explanation: "The delegation tool returns just the subagent's final message, which keeps the supervisor's context small.",
    },
    {
      question: "Where are the supervisor's routing rules defined?",
      options: ["A) In a conditional edge", "B) In the delegation tools' names, docstrings and the system prompt", "C) In LangSmith", "D) In the checkpointer"],
      answer: "B) In the delegation tools' names, docstrings and the system prompt",
      explanation: "The supervisor is a tool-calling model, so it routes by reading tool descriptions and its prompt.",
    },
  ],
  subjectiveQuestions: [
    {
      question: "Compare subagents-as-tools with a hand-built graph of agent nodes. When is each a better fit?",
      difficulty: 3,
      answer: "Subagents-as-tools is quick to build, keeps context isolated and lets the model choose order dynamically, but routing depends on the model. A hand-built graph with explicit edges or Command handoffs gives deterministic flow, shared state and easier guarantees, at the cost of more code. Use tools for flexible delegation and graphs when the process must follow fixed steps or share structured state.",
    },
  ],
  techStack: TECH_STACK,
  steps: [
    ...setupSteps("supervisor_team", "supervisor-research-team"),
    {
      title: "Give each specialist its own tools",
      goal: "Write narrow tools so each specialist has exactly one job.",
      explanation:
        "The researcher can only search papers, the analyst can only read metrics, and the writer can only count words. Narrow tools make each agent's behaviour predictable. The data is sample data for the exercise.",
      layer: "LangChain",
      file: "tools.py",
      language: "python",
      code: String.raw`from langchain.tools import tool

# Sample data for the exercise.
PAPERS = {
    "multi-agent": "Survey (2025): supervisor patterns cut token use by isolating each specialist's context.",
    "evaluation": "Field report (2026): teams that run trajectory evals catch routing regressions before release.",
    "memory": "Case study (2025): long-term stores improve personalisation when facts are extracted, not dumped.",
}
METRICS = {
    "langgraph": {"weekly_downloads_millions": 9.1, "production_teams_surveyed_pct": 41},
    "crewai": {"weekly_downloads_millions": 1.2, "production_teams_surveyed_pct": 14},
    "autogen": {"weekly_downloads_millions": 0.8, "production_teams_surveyed_pct": 9},
}


@tool
def search_papers(topic: str) -> str:
    """Find research findings about a topic such as multi-agent, evaluation or memory."""
    return "\n".join(text for key, text in PAPERS.items() if key in topic.lower()) or "No findings for that topic."


@tool
def get_adoption_metrics(framework: str) -> dict:
    """Return sample adoption metrics for one framework: langgraph, crewai or autogen."""
    return METRICS.get(framework.lower(), {"error": "unknown framework"})


@tool
def word_count(text: str) -> int:
    """Count the words in a draft."""
    return len(text.split())`,
      run: `python -c "from tools import get_adoption_metrics; print(get_adoption_metrics.invoke({'framework': 'langgraph'}))"`,
      checkpoint: "The command prints the LangGraph metrics dictionary.",
    },
    {
      title: "Create the specialist agents",
      goal: "Build three focused agents with create_agent.",
      explanation:
        "Each specialist gets a short prompt describing one job and the output format the supervisor needs. The name argument labels each agent in traces, so you can tell them apart in LangSmith.",
      layer: "LangChain",
      file: "agents.py",
      language: "python",
      code: String.raw`from langchain.agents import create_agent

from config import get_model
from tools import get_adoption_metrics, search_papers, word_count

researcher = create_agent(
    get_model(),
    tools=[search_papers],
    system_prompt="You are a research specialist. Use search_papers and return 2-4 bullet facts with their source.",
    name="researcher",
)

analyst = create_agent(
    get_model(),
    tools=[get_adoption_metrics],
    system_prompt="You are a data analyst. Fetch metrics for each framework named and return a compact comparison table.",
    name="analyst",
)

writer = create_agent(
    get_model(),
    tools=[word_count],
    system_prompt="You write executive briefs under 150 words. Draft, check with word_count, shorten if needed, return only the brief.",
    name="writer",
)`,
      checkpoint: "python -c \"import agents\" runs without errors.",
    },
    {
      title: "Wrap the specialists as tools and build the supervisor",
      goal: "Let one agent plan the work and delegate it.",
      explanation:
        "Each ask_* tool invokes a subagent with one user message and returns its final text. The supervisor only knows these three tools, and its prompt sets the order: research, analyse, write. The checkpointer lives on the supervisor so the conversation can continue.",
      layer: "LangGraph",
      file: "supervisor.py",
      language: "python",
      code: String.raw`from langchain.agents import create_agent
from langchain.tools import tool
from langgraph.checkpoint.memory import InMemorySaver

from agents import analyst, researcher, writer
from config import get_model


def _run(agent, task: str) -> str:
    result = agent.invoke({"messages": [{"role": "user", "content": task}]})
    return result["messages"][-1].content


@tool
def ask_researcher(task: str) -> str:
    """Delegate fact-finding from research papers. Describe the topic in the task."""
    return _run(researcher, task)


@tool
def ask_analyst(task: str) -> str:
    """Delegate a numeric comparison. Name every framework to compare in the task."""
    return _run(analyst, task)


@tool
def ask_writer(task: str) -> str:
    """Delegate writing the final brief. Include all facts and figures the writer must use."""
    return _run(writer, task)


supervisor = create_agent(
    get_model(),
    tools=[ask_researcher, ask_analyst, ask_writer],
    system_prompt=(
        "You lead a research team. Always: 1) ask_researcher for findings, 2) ask_analyst for figures, "
        "3) ask_writer with everything gathered. Never write the brief yourself. Return the writer's brief."
    ),
    checkpointer=InMemorySaver(),
    name="supervisor",
)`,
      checkpoint: "python -c \"from supervisor import supervisor; print(supervisor.name)\" prints supervisor.",
    },
    {
      title: "Run the team and watch the delegations",
      goal: "Stream the supervisor and print each delegation as it happens.",
      explanation:
        "Streaming updates shows each supervisor step. Tool calls reveal which specialist was asked and with what task. The recursion_limit caps the number of steps so a confused supervisor cannot loop forever.",
      layer: "LangGraph",
      file: "main.py",
      language: "python",
      code: String.raw`from supervisor import supervisor

REQUEST = "Write a brief on whether our team should standardise on LangGraph for multi-agent work, compared with CrewAI and AutoGen."


def run(request: str = REQUEST, thread_id: str = "team-1") -> dict:
    config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 25}
    delegations: list[str] = []
    for step in supervisor.stream({"messages": [{"role": "user", "content": request}]}, config, stream_mode="updates"):
        for update in step.values():
            for message in (update or {}).get("messages", []):
                for call in getattr(message, "tool_calls", None) or []:
                    delegations.append(call["name"])
                    print(f"-> {call['name']}: {call['args']['task'][:90]}")
    brief = supervisor.get_state(config).values["messages"][-1].content
    return {"brief": brief, "delegations": delegations}


if __name__ == "__main__":
    outcome = run()
    print("\nFinal brief:\n", outcome["brief"])`,
      run: "python main.py",
      checkpoint: "You see -> ask_researcher, -> ask_analyst and -> ask_writer, followed by a brief under 150 words.",
    },
    {
      title: "Read the nested traces",
      goal: "See each subagent's run nested under the supervisor's tool call.",
      explanation:
        "Because subagents run inside tool functions, LangSmith nests their traces under the matching ask_* tool run. Expand ask_analyst to see the analyst's own model call and get_adoption_metrics calls. Token totals per subtree show which specialist is most expensive.",
      layer: "LangSmith",
      language: "text",
      code: `supervisor
  ├─ model → tool_calls: ask_researcher
  ├─ ask_researcher → researcher → search_papers
  ├─ ask_analyst    → analyst    → get_adoption_metrics ×3
  ├─ ask_writer     → writer     → word_count
  └─ model → final answer`,
      checkpoint: "Each ask_* run contains a nested agent trace with its own tool calls.",
    },
    {
      title: "Evaluate the trajectory and the brief",
      goal: "Check the team followed the plan and produced a usable brief.",
      explanation:
        "consulted_all_specialists checks the trajectory: every specialist must appear in the delegations. brief_is_short checks the writer obeyed its limit. Together they catch both routing bugs and output regressions.",
      layer: "LangSmith",
      file: "eval.py",
      language: "python",
      code: String.raw`import uuid

from langsmith import Client

import main

client = Client()
DATASET = "supervisor-research-team"


def ensure_dataset() -> None:
    if not client.has_dataset(dataset_name=DATASET):
        dataset = client.create_dataset(dataset_name=DATASET)
        client.create_examples(dataset_id=dataset.id, examples=[
            {"inputs": {"request": main.REQUEST}, "outputs": {"specialists": ["ask_researcher", "ask_analyst", "ask_writer"]}},
        ])


def target(inputs: dict) -> dict:
    return main.run(inputs["request"], thread_id=str(uuid.uuid4()))


def consulted_all_specialists(outputs: dict, reference_outputs: dict) -> bool:
    return all(name in outputs["delegations"] for name in reference_outputs["specialists"])


def brief_is_short(outputs: dict) -> bool:
    return len(outputs["brief"].split()) <= 160


if __name__ == "__main__":
    ensure_dataset()
    print(client.evaluate(target, data=DATASET, evaluators=[consulted_all_specialists, brief_is_short], experiment_prefix="supervisor-team"))`,
      run: "python eval.py",
      checkpoint: "The experiment scores consulted_all_specialists and brief_is_short as 1.",
    },
  ],
});

/* ------------------------------------------------------------------ */
/* 5. Multi agent: router plus specialists that hand off with Command  */
/* ------------------------------------------------------------------ */

const handoffSquad = defineBuild({
  id: "build-handoff-router-squad",
  folder: "handoff_squad",
  title: "Build a Customer Squad with Router and Agent Handoffs",
  subtitle: "Multi agent. A structured-output router sends each request to billing or technical specialists, who can hand the conversation to each other with Command.",
  type: "multi",
  badge: "Multi-Agent Handoffs · Build Guide",
  tags: ["Supervisor", "Human-in-the-Loop"],
  architectureOverview:
    "A parent StateGraph owns the conversation. A triage node classifies the request with structured output and returns Command(goto=...) to the right specialist. Each specialist is a create_agent subgraph with its own tools plus a transfer tool. When a request crosses domains, the transfer tool returns Command(graph=Command.PARENT) and the parent graph moves control to the other specialist. Refunds above a threshold pause for human approval.",
  diagram: [
    "START ─> [triage: with_structured_output(Route)] ─Command(goto)─> billing | technical",
    "[billing] ─transfer_to_technical─> Command.PARENT ─> [technical]",
    "[technical] ─transfer_to_billing─> Command.PARENT ─> [billing]",
    "[billing.issue_refund > $50] ─> interrupt ─> human ─> resume",
  ],
  keyHighlights: [
    "Deterministic first routing with a Pydantic Route model and Command(goto=...).",
    "Peer-to-peer handoffs with tools that return Command(graph=Command.PARENT).",
    "An interrupt inside a subagent tool for refunds above $50.",
    "A routing-accuracy evaluator over a labelled dataset.",
  ],
  keyPoints: [
    "Command combines a state update and a routing decision in one return value.",
    "Command.PARENT lets a node inside a subgraph route the parent graph.",
    "A handoff must carry the AI message with the tool call and its ToolMessage so the history stays valid.",
  ],
  keyConcepts: [
    { title: "Command(goto=...)", description: "Returned by a node or tool to update state and choose the next node in one step." },
    { title: "Command.PARENT", description: "Targets the parent graph, which is how a subagent hands control to a sibling." },
    { title: "ToolRuntime", description: "Injected into tools to read graph state and the current tool_call_id." },
  ],
  learningObjectives: [
    "Route requests with structured output and Command.",
    "Implement handoff tools between subagents in a parent graph.",
    "Pause a subagent's tool for approval and resume the parent graph.",
  ],
  howItWorks:
    "triage reads the first message and returns Command(goto='billing' or 'technical'). The specialist runs as a subgraph on the shared messages. If the user also needs the other team, the specialist calls its transfer tool, which appends the handoff messages and routes the parent graph to the other specialist. A specialist that simply answers ends the run.",
  remember: "Choose one routing style per node: either Command-driven handoffs or static edges, never both.",
  watchOut: "If a handoff omits the AI message that made the tool call, the next model call fails because a ToolMessage has no matching tool call.",
  prerequisites: ["Python 3.10+", "An OpenAI (or other provider) API key", "A LangSmith API key"],
  verify: [
    "A pure billing question visits triage then billing only.",
    "The double-charge plus login-crash request visits billing and technical, in either order.",
    "A refund over $50 pauses for approval; python eval.py scores routed_correctly as 1.",
  ],
  objectiveQuestions: [
    {
      question: "How does the billing subagent move the conversation to the technical subagent?",
      options: ["A) It calls technical.invoke directly", "B) A tool returns Command(goto='technical', graph=Command.PARENT)", "C) It edits the parent's edges", "D) It raises an exception"],
      answer: "B) A tool returns Command(goto='technical', graph=Command.PARENT)",
      explanation: "Command.PARENT tells LangGraph to apply the goto in the parent graph, where the technical node lives.",
    },
    {
      question: "Why does the triage node use with_structured_output instead of free text?",
      options: ["A) It is cheaper", "B) It guarantees a valid destination name for Command(goto=...)", "C) It enables streaming", "D) LangSmith requires it"],
      answer: "B) It guarantees a valid destination name for Command(goto=...)",
      explanation: "A Literal-typed field can only hold an allowed node name, so routing never targets a missing node.",
    },
  ],
  subjectiveQuestions: [
    {
      question: "Explain the trade-off between a central router and peer-to-peer handoffs in a support squad.",
      difficulty: 3,
      answer: "A central router gives one auditable decision point and predictable first hops, but it cannot react to issues discovered mid-conversation. Peer handoffs let specialists redirect when they learn more, which suits mixed requests, but they can ping-pong and are harder to reason about. Combining both, router first and handoffs after, with a cap on handoffs, gets most of the benefit.",
    },
  ],
  techStack: TECH_STACK,
  steps: [
    ...setupSteps("handoff_squad", "handoff-customer-squad"),
    {
      title: "Define the shared state and the route schema",
      goal: "Describe the conversation state and the router's allowed answers.",
      explanation:
        "SquadState extends the standard message state with active_agent so you can see who holds the conversation. Route restricts the router to two node names, which makes Command(goto=...) safe.",
      layer: "LangGraph",
      file: "state.py",
      language: "python",
      code: String.raw`from typing import Literal

from langgraph.graph import MessagesState
from pydantic import BaseModel, Field


class SquadState(MessagesState):
    active_agent: str


class Route(BaseModel):
    destination: Literal["billing", "technical"] = Field(description="Team that should handle the request first")
    reason: str = Field(description="One short sentence explaining the choice")`,
      checkpoint: "python -c \"from state import Route; print(Route(destination='billing', reason='refund'))\" works.",
    },
    {
      title: "Write domain tools and a refund approval",
      goal: "Give each team its tools, with a human check on large refunds.",
      explanation:
        "Billing tools read invoices and issue refunds. issue_refund calls interrupt() when the amount is over $50, so the whole parent graph pauses until a person answers. Technical tools check service status and open tickets. The data is sample data.",
      layer: "LangChain",
      file: "tools.py",
      language: "python",
      code: String.raw`from langchain.tools import tool
from langgraph.types import interrupt

# Sample data for the exercise.
INVOICES = {"C-100": [{"id": "INV-1", "amount": 79.0, "status": "charged twice"}]}
STATUS = {"login": "degraded: elevated 500 errors since 09:00", "payments": "operational"}
TICKETS: list[dict] = []


@tool
def lookup_invoices(customer_id: str) -> list[dict]:
    """List a customer's recent invoices, e.g. customer_id 'C-100'."""
    return INVOICES.get(customer_id, [])


@tool
def issue_refund(invoice_id: str, amount: float) -> str:
    """Refund an invoice. Refunds over $50 need a human's approval."""
    if amount > 50:
        decision = interrupt({"action": "issue_refund", "invoice_id": invoice_id, "amount": amount})
        if not decision.get("approved"):
            return f"Refund for {invoice_id} was declined by a supervisor."
    return f"Refunded {amount:.2f} USD on {invoice_id}."


@tool
def check_service_status(service: str) -> str:
    """Check the live status of a service such as 'login' or 'payments'."""
    return STATUS.get(service.lower(), "unknown service")


@tool
def open_ticket(summary: str, severity: str) -> str:
    """Open an engineering ticket. severity is low, medium or high."""
    TICKETS.append({"summary": summary, "severity": severity})
    return f"Ticket T-{len(TICKETS)} opened ({severity})."`,
      checkpoint: "python -c \"from tools import check_service_status; print(check_service_status.invoke({'service': 'login'}))\" prints the degraded status.",
    },
    {
      title: "Write the handoff tools",
      goal: "Let a specialist pass the conversation to the other specialist.",
      explanation:
        "make_handoff builds a tool for a target node. ToolRuntime gives the tool the subagent's state and the tool_call_id. The tool returns Command with graph=Command.PARENT, so the parent graph routes to the target. It sends the AI message that made the call plus a ToolMessage, keeping the message history valid for the next agent.",
      layer: "LangGraph",
      file: "handoffs.py",
      language: "python",
      code: String.raw`from langchain.messages import AIMessage, ToolMessage
from langchain.tools import ToolRuntime, tool
from langgraph.types import Command


def make_handoff(target: str, description: str):
    @tool(f"transfer_to_{target}", description=description)
    def handoff(runtime: ToolRuntime) -> Command:
        last_ai = next(m for m in reversed(runtime.state["messages"]) if isinstance(m, AIMessage))
        note = ToolMessage(content=f"Transferred to {target}.", tool_call_id=runtime.tool_call_id)
        return Command(
            goto=target,
            graph=Command.PARENT,
            update={"messages": [last_ai, note], "active_agent": target},
        )

    return handoff


transfer_to_billing = make_handoff("billing", "Hand off when the user needs help with charges, invoices or refunds.")
transfer_to_technical = make_handoff("technical", "Hand off when the user reports errors, outages or login problems.")`,
      checkpoint: "python -c \"from handoffs import transfer_to_technical; print(transfer_to_technical.name)\" prints transfer_to_technical.",
    },
    {
      title: "Build the router, the specialists and the parent graph",
      goal: "Assemble triage plus two specialist subgraphs into one graph.",
      explanation:
        "triage returns Command(goto=route.destination) and records the reason. Each specialist is a create_agent added directly as a node, so it shares the messages key with the parent. Specialists have no outgoing edges: they either finish, which ends the run, or hand off with Command. The checkpointer on the parent supports the refund interrupt.",
      layer: "LangGraph",
      file: "graph.py",
      language: "python",
      code: String.raw`from typing import Literal

from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, StateGraph
from langgraph.types import Command

from config import get_model
from handoffs import transfer_to_billing, transfer_to_technical
from state import Route, SquadState
from tools import check_service_status, issue_refund, lookup_invoices, open_ticket

router = get_model().with_structured_output(Route)

billing = create_agent(
    get_model(),
    tools=[lookup_invoices, issue_refund, transfer_to_technical],
    system_prompt="You are the billing specialist. Resolve charges and refunds. If the user also has a technical problem, finish billing then transfer_to_technical.",
    name="billing",
)
technical = create_agent(
    get_model(),
    tools=[check_service_status, open_ticket, transfer_to_billing],
    system_prompt="You are the technical specialist. Check status and open tickets. If the user also has a billing issue, finish then transfer_to_billing.",
    name="technical",
)


def triage(state: SquadState) -> Command[Literal["billing", "technical"]]:
    route = router.invoke([
        {"role": "system", "content": "Pick the team that should handle this request first."},
        state["messages"][0],
    ])
    return Command(goto=route.destination, update={"active_agent": route.destination})


def build_graph(checkpointer=None):
    builder = StateGraph(SquadState)
    builder.add_node("triage", triage)
    builder.add_node("billing", billing, destinations=("technical",))
    builder.add_node("technical", technical, destinations=("billing",))
    builder.add_edge(START, "triage")
    return builder.compile(checkpointer=checkpointer or InMemorySaver())


graph = build_graph()`,
      run: `python -c "from graph import graph; print(graph.get_graph().draw_mermaid())"`,
      checkpoint: "The diagram shows triage pointing to billing and technical, and dashed handoff edges between the two specialists.",
    },
    {
      title: "Run mixed requests and approve a refund",
      goal: "Watch routing, handoffs and the refund interrupt in one run.",
      explanation:
        "run() streams node updates to record the path, then answers any interrupt, here the refund approval, and resumes the same thread. The second scenario mixes a double charge with a login error, which should trigger a handoff.",
      layer: "LangGraph",
      file: "main.py",
      language: "python",
      code: String.raw`import sys

from langgraph.types import Command

from graph import graph

SCENARIOS = [
    "Customer C-100: why was I charged for INV-1? Please explain.",
    "Customer C-100: I was charged twice for INV-1 ($79) and I also can't log in, the app shows a 500 error.",
]


def run(text: str, thread_id: str, approve: bool = True) -> dict:
    config = {"configurable": {"thread_id": thread_id}, "recursion_limit": 40}
    path: list[str] = []
    payload = {"messages": [{"role": "user", "content": text}]}
    while True:
        for step in graph.stream(payload, config, stream_mode="updates"):
            path += [node for node in step if node != "__interrupt__"]
        state = graph.get_state(config)
        pending = [i for task in state.tasks for i in task.interrupts]
        if not pending:
            break
        print(f"  approval needed: {pending[0].value} -> {'approve' if approve else 'decline'}")
        payload = Command(resume={"approved": approve})
    return {"path": path, "answer": state.values["messages"][-1].content}


if __name__ == "__main__":
    approve = "--decline" not in sys.argv
    for index, text in enumerate(SCENARIOS):
        outcome = run(text, thread_id=f"case-{index}", approve=approve)
        print(f"\n{text}\n  path: {' -> '.join(outcome['path'])}\n  answer: {outcome['answer'][:200]}")`,
      run: "python main.py",
      checkpoint: "The first case shows path triage -> billing. The second shows billing and technical, plus an approval line for the $79 refund.",
    },
    {
      title: "Follow a handoff in LangSmith",
      goal: "See the parent graph move between subagents.",
      explanation:
        "In the case-1 trace, the billing subgraph ends with a transfer_to_technical tool run whose output is a Command. The next sibling run is the technical subgraph, which starts with the full shared history. Filter by thread to see the paused and resumed parts together.",
      layer: "LangSmith",
      language: "text",
      code: `case-1 thread
  ├─ triage   → Route(destination='billing')
  ├─ billing  → lookup_invoices → issue_refund (interrupt) … resume → transfer_to_technical
  └─ technical→ check_service_status → open_ticket → final answer`,
      checkpoint: "The billing run ends in a transfer tool call and the technical run follows it in the same trace.",
    },
    {
      title: "Evaluate routing accuracy",
      goal: "Score whether each request reached the right specialists.",
      explanation:
        "Each example lists the specialists that must appear in the path. routed_correctly checks the first hop, and covered_all_teams checks that mixed requests reached both teams. Run it after every prompt change to the router or specialists.",
      layer: "LangSmith",
      file: "eval.py",
      language: "python",
      code: String.raw`import uuid

from langsmith import Client

import main

client = Client()
DATASET = "handoff-customer-squad"
EXAMPLES = [
    {"inputs": {"text": main.SCENARIOS[0]}, "outputs": {"first": "billing", "teams": ["billing"]}},
    {"inputs": {"text": "My login page keeps returning 500 errors."}, "outputs": {"first": "technical", "teams": ["technical"]}},
    {"inputs": {"text": main.SCENARIOS[1]}, "outputs": {"first": "billing", "teams": ["billing", "technical"]}},
]


def ensure_dataset() -> None:
    if not client.has_dataset(dataset_name=DATASET):
        dataset = client.create_dataset(dataset_name=DATASET)
        client.create_examples(dataset_id=dataset.id, examples=EXAMPLES)


def target(inputs: dict) -> dict:
    return main.run(inputs["text"], thread_id=str(uuid.uuid4()))


def routed_correctly(outputs: dict, reference_outputs: dict) -> bool:
    hops = [node for node in outputs["path"] if node != "triage"]
    return bool(hops) and hops[0] == reference_outputs["first"]


def covered_all_teams(outputs: dict, reference_outputs: dict) -> bool:
    return all(team in outputs["path"] for team in reference_outputs["teams"])


if __name__ == "__main__":
    ensure_dataset()
    print(client.evaluate(target, data=DATASET, evaluators=[routed_correctly, covered_all_teams], experiment_prefix="handoff-routing"))`,
      run: "python eval.py",
      checkpoint: "All three examples score routed_correctly and covered_all_teams.",
    },
  ],
});

/* ------------------------------------------------------------------ */
/* 6. Multi agent: parallel reviewers with Send, reducers and a loop   */
/* ------------------------------------------------------------------ */

const parallelReviewTeam = defineBuild({
  id: "build-parallel-send-review-team",
  folder: "review_team",
  title: "Build a Parallel Code Review Team with Send and a Fix Loop",
  subtitle: "Multi agent. Fan out security, performance and readability reviewers in parallel with Send, merge their findings with a reducer, and loop a fixer agent until no blockers remain.",
  type: "multi",
  badge: "Multi-Agent Map-Reduce · Build Guide",
  tags: ["Self-Correction", "Plan & Execute"],
  architectureOverview:
    "A map-reduce team. The Send API starts one reviewer task per focus area, all in the same step, each with its own private input. Their structured reviews merge into state through an operator.add reducer. A collect node waits for all of them, then a router either sends blockers to a fixer agent, which rewrites the code and triggers another review round, or finishes with a synthesized report.",
  diagram: [
    "START ─Send×3─> [reviewer(security)] [reviewer(performance)] [reviewer(readability)]",
    "[reviewers] ─(reviews: operator.add)─> [collect]",
    "[collect] ─(blockers and revision < 2)─> [fixer] ─Send×3─> reviewers",
    "[collect] ─(clean or limit reached)─> [report] ─> END",
  ],
  keyHighlights: [
    "Send for dynamic parallel fan-out with per-task input.",
    "Annotated[list, operator.add] to merge results from parallel branches.",
    "A bounded self-correction loop between reviewers and a fixer.",
    "Structured Review and Finding models for machine-checkable output.",
  ],
  keyPoints: [
    "Parallel branches must write to a key with a reducer, or LangGraph raises an error on conflicting updates.",
    "Send lets each parallel task receive a different input than the main state.",
    "Every loop needs a hard limit; here revision stops the fixer after two rounds.",
  ],
  keyConcepts: [
    { title: "Send", description: "Schedules a node with a custom input; returning several Sends runs them in parallel." },
    { title: "operator.add reducer", description: "Concatenates list updates from parallel branches instead of overwriting." },
    { title: "Fan-in node", description: "A node that runs once after all parallel tasks of the previous step finish." },
  ],
  learningObjectives: [
    "Fan out parallel agents with Send and merge them with a reducer.",
    "Design a bounded review-and-fix loop.",
    "Evaluate whether the team caught a planted vulnerability.",
  ],
  howItWorks:
    "fan_out returns one Send per focus area with the current code and revision. Each reviewer returns a structured Review appended to reviews. collect runs after all reviewers. The router counts blockers in the current revision: if any remain and fewer than two fixes have run, the fixer rewrites the code and fans out again; otherwise report writes the final summary.",
  remember: "Tag parallel results with the round they belong to, so later rounds do not mix with earlier ones.",
  watchOut: "Do not route from the reviewer node itself; a conditional edge there runs once per parallel task and multiplies the next step.",
  prerequisites: ["Python 3.10+", "An OpenAI (or other provider) API key", "A LangSmith API key"],
  verify: [
    "python main.py shows three reviews per round arriving in parallel.",
    "The security reviewer flags the SQL injection in round 0.",
    "The final code uses a parameterised query, and python eval.py scores caught_sql_injection as 1.",
  ],
  objectiveQuestions: [
    {
      question: "Why is reviews declared as Annotated[list[dict], operator.add]?",
      options: ["A) For type checking only", "B) So updates from three parallel reviewers are concatenated instead of conflicting", "C) To sort the reviews", "D) To save them in LangSmith"],
      answer: "B) So updates from three parallel reviewers are concatenated instead of conflicting",
      explanation: "Without a reducer, several branches writing the same key in one step is an invalid concurrent update.",
    },
    {
      question: "What does returning a list of Send objects from a conditional edge do?",
      options: ["A) Runs the targets one after another", "B) Runs each target in parallel with its own input", "C) Sends messages to the user", "D) Creates subgraphs"],
      answer: "B) Runs each target in parallel with its own input",
      explanation: "Each Send schedules a task in the next step with the given payload, which is LangGraph's map step.",
    },
  ],
  subjectiveQuestions: [
    {
      question: "How would you stop the fixer from introducing new problems while it removes blockers?",
      difficulty: 3,
      answer: "Re-run every reviewer on each revision rather than only the one that complained, keep the revision cap, and compare blocker counts between rounds so a round that adds blockers is rejected. Add a test-running tool or static checker as a non-LLM reviewer, and evaluate with a dataset of planted bugs to catch regressions.",
    },
  ],
  techStack: TECH_STACK,
  steps: [
    ...setupSteps("review_team", "parallel-review-team"),
    {
      title: "Define structured reviews and the team state",
      goal: "Describe a finding, a review, and the state that collects them.",
      explanation:
        "Review is what each reviewer must return. TeamState.reviews uses operator.add so parallel results append. ReviewerInput is the private input each Send delivers, which is why reviewers do not need the whole state.",
      layer: "LangGraph",
      file: "state.py",
      language: "python",
      code: String.raw`import operator
from typing import Annotated, Literal

from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class Finding(BaseModel):
    severity: Literal["blocker", "major", "minor"]
    issue: str = Field(description="What is wrong")
    fix: str = Field(description="Concrete change that fixes it")


class Review(BaseModel):
    findings: list[Finding] = Field(default_factory=list)
    verdict: Literal["approve", "request_changes"]


class TeamState(TypedDict):
    code: str
    revision: int
    reviews: Annotated[list[dict], operator.add]
    report: str


class ReviewerInput(TypedDict):
    code: str
    focus: str
    revision: int`,
      checkpoint: "python -c \"from state import Review; print(Review(verdict='approve'))\" prints an empty review.",
    },
    {
      title: "Create the reviewer, fixer and reporter agents",
      goal: "Write the three model-powered roles the graph will call.",
      explanation:
        "The reviewer uses with_structured_output(Review), so its answer is always parseable. The focus string changes the reviewer's expertise per Send. The fixer rewrites code from blocker findings, and the reporter summarises all rounds.",
      layer: "LangChain",
      file: "agents.py",
      language: "python",
      code: String.raw`from config import get_model
from state import Review

model = get_model()
reviewer_model = model.with_structured_output(Review)

FOCUS_PROMPTS = {
    "security": "You are a security reviewer. Look for injection, secrets in code and unsafe input handling.",
    "performance": "You are a performance reviewer. Look for N+1 queries, repeated work and blocking calls.",
    "readability": "You are a readability reviewer. Look for unclear names, missing error handling and dead code.",
}


def review(code: str, focus: str) -> Review:
    return reviewer_model.invoke([
        {"role": "system", "content": FOCUS_PROMPTS[focus] + " Only report real problems. Mark exploitable or crashing issues as blocker."},
        {"role": "user", "content": code},
    ])


def fix(code: str, findings: list[dict]) -> str:
    notes = "\n".join(f"- [{f['severity']}] {f['issue']} -> {f['fix']}" for f in findings)
    reply = model.invoke([
        {"role": "system", "content": "Rewrite the Python code to fix every listed issue. Return only the code, no fences."},
        {"role": "user", "content": f"Issues:\n{notes}\n\nCode:\n{code}"},
    ])
    return reply.content


def summarise(code: str, reviews: list[dict]) -> str:
    reply = model.invoke([
        {"role": "system", "content": "Write a short review report: what was found, what was fixed, what remains."},
        {"role": "user", "content": f"Reviews: {reviews}\n\nFinal code:\n{code}"},
    ])
    return reply.content`,
      checkpoint: "python -c \"import agents\" runs without errors.",
    },
    {
      title: "Wire the fan-out, fan-in and fix loop",
      goal: "Build the map-reduce graph with a bounded correction loop.",
      explanation:
        "fan_out returns three Sends, used both from START and after the fixer. Every reviewer has a static edge to collect, which runs once after all of them. after_collect counts blockers in the current revision and routes to fixer or report. The fixer increments revision, which both tags the next round and enforces the limit.",
      layer: "LangGraph",
      file: "graph.py",
      language: "python",
      code: String.raw`from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from agents import FOCUS_PROMPTS, fix, review, summarise
from state import ReviewerInput, TeamState

MAX_REVISIONS = 2


def fan_out(state: TeamState) -> list[Send]:
    return [Send("reviewer", {"code": state["code"], "focus": focus, "revision": state["revision"]}) for focus in FOCUS_PROMPTS]


def reviewer(task: ReviewerInput) -> dict:
    result = review(task["code"], task["focus"])
    return {"reviews": [{"focus": task["focus"], "revision": task["revision"], **result.model_dump()}]}


def current_blockers(state: TeamState) -> list[dict]:
    this_round = [r for r in state["reviews"] if r["revision"] == state["revision"]]
    return [f for r in this_round for f in r["findings"] if f["severity"] == "blocker"]


def collect(state: TeamState) -> dict:
    return {}


def after_collect(state: TeamState) -> str:
    if current_blockers(state) and state["revision"] < MAX_REVISIONS:
        return "fixer"
    return "report"


def fixer(state: TeamState) -> dict:
    return {"code": fix(state["code"], current_blockers(state)), "revision": state["revision"] + 1}


def report(state: TeamState) -> dict:
    return {"report": summarise(state["code"], state["reviews"])}


def build_graph(checkpointer=None):
    builder = StateGraph(TeamState)
    builder.add_node("reviewer", reviewer)
    builder.add_node("collect", collect)
    builder.add_node("fixer", fixer)
    builder.add_node("report", report)
    builder.add_conditional_edges(START, fan_out, ["reviewer"])
    builder.add_edge("reviewer", "collect")
    builder.add_conditional_edges("collect", after_collect, ["fixer", "report"])
    builder.add_conditional_edges("fixer", fan_out, ["reviewer"])
    builder.add_edge("report", END)
    return builder.compile(checkpointer=checkpointer or InMemorySaver())


graph = build_graph()`,
      run: `python -c "from graph import graph; print(graph.get_graph().draw_mermaid())"`,
      checkpoint: "The diagram shows reviewer → collect, collect → fixer or report, and fixer back to reviewer.",
    },
    {
      title: "Review code with a planted vulnerability",
      goal: "Run the team on code with SQL injection and an N+1 query.",
      explanation:
        "The sample code builds SQL with an f-string, which the security reviewer should mark as a blocker, and queries inside a loop, which the performance reviewer should flag. Streaming updates shows the three reviewers finishing in the same step.",
      layer: "LangGraph",
      file: "main.py",
      language: "python",
      code: String.raw`from graph import graph

SAMPLE_CODE = '''
def get_orders(db, username):
    user = db.execute(f"SELECT * FROM users WHERE name = '{username}'").fetchone()
    orders = []
    for order_id in user["order_ids"]:
        orders.append(db.execute(f"SELECT * FROM orders WHERE id = {order_id}").fetchone())
    return orders
'''


def run(code: str = SAMPLE_CODE, thread_id: str = "review-1") -> dict:
    config = {"configurable": {"thread_id": thread_id}}
    initial = {"code": code, "revision": 0, "reviews": [], "report": ""}
    for step in graph.stream(initial, config, stream_mode="updates"):
        for node, update in step.items():
            for item in (update or {}).get("reviews", []):
                print(f"round {item['revision']} | {item['focus']:<11} -> {item['verdict']} ({len(item['findings'])} findings)")
            if node == "fixer":
                print(f"fixer produced revision {update['revision']}")
    return graph.get_state(config).values


if __name__ == "__main__":
    final = run()
    print("\nFinal code:\n", final["code"])
    print("\nReport:\n", final["report"])`,
      run: "python main.py",
      checkpoint: "Round 0 shows security -> request_changes, a fixer line, then later rounds and a final parameterised query.",
    },
    {
      title: "Compare the parallel branches in LangSmith",
      goal: "Confirm the reviewers ran concurrently and see each one's structured output.",
      explanation:
        "In the trace, the three reviewer runs of a round start at almost the same time, which is the Send fan-out. Each contains one structured model call. Comparing the timings of round 0 and round 1 shows what the fix loop costs.",
      layer: "LangSmith",
      language: "text",
      code: `review-1 trace
  ├─ reviewer (security, rev 0)      ┐
  ├─ reviewer (performance, rev 0)   ├─ same step, parallel
  ├─ reviewer (readability, rev 0)   ┘
  ├─ collect → fixer (rev 1)
  ├─ reviewer ×3 (rev 1) → collect
  └─ report`,
      checkpoint: "Round 0's three reviewer runs overlap in time on the trace timeline.",
    },
    {
      title: "Evaluate with planted bugs",
      goal: "Score whether the team catches and removes a known vulnerability.",
      explanation:
        "caught_sql_injection looks for an injection finding from the security reviewer in round 0. no_fstring_sql checks that the final code no longer builds SQL with an f-string. Add more planted-bug examples over time to grow this into a regression suite.",
      layer: "LangSmith",
      file: "eval.py",
      language: "python",
      code: String.raw`import re
import uuid

from langsmith import Client

import main

client = Client()
DATASET = "parallel-review-team"


def ensure_dataset() -> None:
    if not client.has_dataset(dataset_name=DATASET):
        dataset = client.create_dataset(dataset_name=DATASET)
        client.create_examples(dataset_id=dataset.id, examples=[{"inputs": {"code": main.SAMPLE_CODE}, "outputs": {"bug": "injection"}}])


def target(inputs: dict) -> dict:
    final = main.run(inputs["code"], thread_id=str(uuid.uuid4()))
    return {"reviews": final["reviews"], "code": final["code"]}


def caught_sql_injection(outputs: dict, reference_outputs: dict) -> bool:
    first_security = [r for r in outputs["reviews"] if r["focus"] == "security" and r["revision"] == 0]
    return any(reference_outputs["bug"] in f["issue"].lower() for r in first_security for f in r["findings"])


def no_fstring_sql(outputs: dict) -> bool:
    return not re.search(r'f"\s*(SELECT|INSERT|UPDATE|DELETE)', outputs["code"], re.IGNORECASE)


if __name__ == "__main__":
    ensure_dataset()
    print(client.evaluate(target, data=DATASET, evaluators=[caught_sql_injection, no_fstring_sql], experiment_prefix="review-team"))`,
      run: "python eval.py",
      checkpoint: "The experiment scores caught_sql_injection and no_fstring_sql as 1.",
    },
  ],
});

export const AGENT_BUILD_USECASES: WorkflowUsecase[] = [
  reactFromScratch,
  hitlEmailAgent,
  memoryAgent,
  supervisorTeam,
  handoffSquad,
  parallelReviewTeam,
];

/** Walkthrough order for files of the original multi-file workflows. */
const FILE_ORDER = ["requirements.txt", "state.py", "schemas.py", "tools.py", "prompts.py", "agents.py", "nodes.py", "graph.py", "main.py", "eval.py", "README.md"];
const FILE_LAYER: Record<string, BuildStepLayer> = {
  "requirements.txt": "Setup",
  "state.py": "LangGraph",
  "graph.py": "LangGraph",
  "main.py": "LangGraph",
  "eval.py": "LangSmith",
  "README.md": "Setup",
};

/** Folder name used by the build guide and the codebase paths. */
export function workflowFolder(workflow: Pick<WorkflowUsecase, "id" | "buildFolder">): string {
  return workflow.buildFolder ?? workflow.id.replace(/-/g, "_");
}

/**
 * Hand-authored steps when a workflow has them; otherwise a build path derived
 * from its own files, so every workflow on the page can be built in order.
 */
export function getBuildSteps(workflow: WorkflowUsecase): BuildStep[] {
  if (workflow.buildSteps?.length) return workflow.buildSteps;
  const folder = workflowFolder(workflow);
  const rank = (name: string) => {
    const index = FILE_ORDER.indexOf(name);
    return index === -1 ? FILE_ORDER.length - 2 : index;
  };
  const files = [...workflow.files].filter(file => file.filename !== "README.md").sort((a, b) => rank(a.filename) - rank(b.filename));
  const install = workflow.prerequisites.find(item => item.startsWith("pip install"));
  const steps: BuildStep[] = [
    {
      title: "Create the project and install dependencies",
      goal: "Prepare an isolated Python environment for this workflow.",
      explanation: `Create a ${folder} folder with a virtual environment, then install the packages this workflow needs. Set your model and LangSmith keys so every run is traced.`,
      layer: "Setup",
      language: "bash",
      code: `mkdir ${folder} && cd ${folder}
python -m venv .venv && source .venv/bin/activate
${install ?? "pip install -r requirements.txt"}
export OPENAI_API_KEY=sk-your-key
export LANGSMITH_API_KEY=lsv2_your-key
export LANGSMITH_TRACING=true`,
      checkpoint: "pip finishes without errors and your shell shows the active virtual environment.",
    },
  ];
  for (const file of files) {
    steps.push({
      title: `Write ${file.filename}`,
      goal: file.description,
      explanation: `Save this file as ${folder}/${file.filename}. ${file.description} Later steps import from it, so build the files in this order.`,
      layer: FILE_LAYER[file.filename] ?? "LangChain",
      file: file.filename,
      language: file.language,
      code: file.code,
      run: file.filename === "eval.py" ? `python ${file.filename}` : undefined,
      checkpoint:
        file.language === "python"
          ? `python -c "import ${file.filename.replace(/\.py$/, "")}" runs without an ImportError.`
          : "The file is saved at the path shown.",
    });
  }
  steps.push({
    title: "Run the workflow and verify it",
    goal: "Execute the finished agent and confirm it behaves as designed.",
    explanation: "Run the entry point, then open your LangSmith project to read the trace of every node, model call and tool call.",
    layer: "LangSmith",
    language: "bash",
    code: workflow.runCommand,
    run: workflow.runCommand,
    checkpoint: workflow.verify.join(" "),
  });
  return steps;
}
