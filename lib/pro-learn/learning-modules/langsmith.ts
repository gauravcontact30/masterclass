import type { LearningModule } from "./module";

export const LANGSMITH_MODULE: LearningModule = {
  technology: "LangSmith",
  definition: "LangSmith is a framework-agnostic platform for developing, debugging, evaluating and deploying LLM applications and agents, combining tracing, evaluation, prompt engineering and deployment in one place.",
  overview: "LLM applications fail in ways unit tests do not catch: a prompt tweak quietly lowers answer quality, a tool returns the wrong document, a cost spike comes from one runaway loop. LangSmith gives the team the evidence to find and fix those failures: every request becomes an inspectable trace, production traces become datasets, and every change is scored against those datasets before it ships.",
  architecture: [
    { title: "Architecture: traces, runs and projects", detail: "Each request is a trace: a tree of runs for model calls, tool calls, retrievers and your own functions, each with inputs, outputs, latency, token usage and errors. Traces are grouped into tracing projects inside a workspace. The SDKs send runs asynchronously in background batches, so tracing adds little latency to the request path." },
    { title: "Under the hood: instrumentation that works with any stack", detail: "LangChain and LangGraph trace automatically once `LANGSMITH_TRACING=true` and an API key are set. Any other code is traced with `@traceable` (Python) or `traceable()` (TypeScript), with wrappers for provider SDKs and OpenTelemetry ingestion. Parent-child links propagate through context so nested functions form one tree, and metadata and tags let you filter by user, version or feature." },
    { title: "Core building blocks: datasets, evaluators and experiments", detail: "Datasets hold examples of inputs and reference outputs, often curated from real traces. Evaluators score outputs: code checks, LLM-as-judge, pairwise comparisons or human annotation queues. Running a target over a dataset creates an experiment you can compare side by side with earlier ones. Online evaluators and automation rules score live production traffic, and monitoring dashboards track cost, latency and feedback over time." },
  ],
  code: [
    { path: "evaluate_support_bot.py", note: "Trace a function, then score it against a dataset", code: `# Environment: LANGSMITH_TRACING=true, LANGSMITH_API_KEY=..., LANGSMITH_PROJECT=support-bot
from langsmith import Client, traceable

client = Client()


@traceable(run_type="chain", name="answer_question")
def answer_question(question: str) -> str:
    # Any code can be traced: nested @traceable calls become child runs.
    return "Refunds are processed within 5 business days."


# 1. Build a dataset (often curated from real production traces).
dataset = client.create_dataset("support-faq", description="Golden support questions")
client.create_examples(
    dataset_id=dataset.id,
    examples=[{
        "inputs": {"question": "How long do refunds take?"},
        "outputs": {"answer": "5 business days"},
    }],
)


# 2. A code evaluator: receives the target's outputs and the reference outputs.
def mentions_reference(outputs: dict, reference_outputs: dict) -> bool:
    return reference_outputs["answer"].lower() in outputs["answer"].lower()


# 3. Run an experiment; results appear in the LangSmith UI for comparison.
client.evaluate(
    lambda inputs: {"answer": answer_question(inputs["question"])},
    data="support-faq",
    evaluators=[mentions_reference],
    experiment_prefix="baseline-prompt",
)` },
  ],
  problem: { title: "Shipping LLM changes blind", scenario: "Without LangSmith, a team debugging a bad agent answer has scattered logs with no view of which retrieval result or tool call caused it, and every prompt or model change is judged by a few manual spot checks. Regressions reach users first. LangSmith records the full execution tree for every request, lets you turn a failing production trace into a dataset example in a click, and runs experiments so each change is measured against the same examples before release." },
  useCases: [
    { title: "Root-causing a wrong answer in a RAG assistant", scenario: "A support lead flags a hallucinated policy answer. The engineer opens the trace, sees that the retriever returned an outdated document and the model faithfully summarized it, fixes the index, and adds the trace to the regression dataset so the case is tested forever after." },
    { title: "Safe model or prompt migration", scenario: "Before moving an agent to a newer, cheaper model, the team runs both versions as experiments over a 300-example dataset with correctness and tone evaluators, compares them side by side, and only switches after the pairwise view shows no regression on high-risk categories." },
    { title: "Production monitoring with online evaluation", scenario: "An automation rule samples 10% of production traces, runs an LLM-as-judge evaluator for groundedness, and routes low-scoring or negatively rated traces to an annotation queue where domain experts label them, feeding the next round of dataset improvements." },
  ],
  subjective: [
    { rating: "Critical for Senior Roles", question: "Design an evaluation strategy for an LLM agent going to production. How do offline and online evaluation fit together?", answer: "Offline evaluation runs before release: curate a dataset that covers core tasks, edge cases and past failures, pick evaluators per criterion (deterministic checks for format and tool choice, LLM-as-judge for correctness or groundedness, pairwise comparison for subjective quality), and gate releases on experiment results compared against the current baseline. For agents, evaluate the final answer, the trajectory (were the right tools called in a sensible order) and single steps. Online evaluation runs after release on sampled production traces with reference-free evaluators and user feedback, catching drift the dataset never anticipated. The loop closes when flagged production traces are reviewed and added to the offline dataset." },
    { rating: "High / Common", question: "How do you trace code that is not built with LangChain, and how do you keep tracing safe and affordable in production?", answer: "Wrap functions with `@traceable` or `traceable()`, wrap provider clients with the SDK's wrappers, or export OpenTelemetry spans; context propagation makes nested calls children of the current run, though threads and some async boundaries may need the parent passed explicitly. For safety, mask or hide inputs and outputs that contain PII or secrets before they leave the process, and keep separate projects for development and production. For cost, sample a fraction of production traffic, set retention appropriately, and attach metadata such as version and customer tier so the traces you do keep are easy to query." },
    { rating: "Frequently asked for AI-engineer roles", question: "What are the pitfalls of LLM-as-judge evaluators and how do you make them trustworthy?", answer: "Judges can be biased toward longer or more confident answers, prefer the first option in pairwise comparisons, drift when the judge model changes, and score vague criteria inconsistently. Make them trustworthy by writing narrow, explicit rubrics with examples, asking for a short rationale before the score, using categorical or binary scores rather than fine-grained scales, randomizing order in pairwise runs, pinning the judge model version, and calibrating against a set of human-labelled examples so you know the judge's agreement rate before relying on it. Combine judges with deterministic checks wherever a rule can decide." },
  ],
  objective: [
    { question: "Which configuration turns on LangSmith tracing for a LangChain or LangGraph application without code changes?", options: ["Setting `LANGSMITH_TRACING=true` with a `LANGSMITH_API_KEY`", "Installing the LangSmith browser extension", "Adding `debug=True` to every chain", "Exporting traces manually to CSV"], answer: 0, explanation: "LangChain and LangGraph trace automatically once the tracing flag and an API key are in the environment, with `LANGSMITH_PROJECT` choosing the project. There is no browser extension involved, debug flags only print locally, and CSV export is not how traces are collected." },
    { question: "A production trace reveals a failure you never want to repeat. What is the idiomatic next step in LangSmith?", options: ["Delete the trace so it does not skew metrics", "Add the trace's inputs (and a corrected output) to an evaluation dataset", "Raise the model temperature", "Disable tracing for that user"], answer: 1, explanation: "Turning real failures into dataset examples makes them permanent regression tests that every future experiment is scored against. Deleting the evidence, changing temperature or disabling tracing hides the problem rather than preventing it." },
    { question: "What distinguishes online evaluation from offline evaluation in LangSmith?", options: ["Online evaluation requires reference outputs; offline does not", "Online evaluation scores live production runs, usually without reference outputs; offline runs a target over a curated dataset", "Online evaluation only works for LangChain apps", "There is no difference; the terms are interchangeable"], answer: 1, explanation: "Offline evaluation runs your application over a dataset, so reference outputs are available. Online evaluation scores production traces as they arrive, so it relies on reference-free evaluators and feedback. Both work with any instrumented application." },
  ],
  keyPoints: [
    "A trace is a tree of runs; the tree shows which step caused the failure.",
    "`@traceable` instruments any Python or TypeScript code, not only LangChain.",
    "Datasets plus evaluators turn each change into a measured experiment.",
    "Production failures should become dataset examples, closing the feedback loop.",
  ],
  sources: [
    { title: "Observability", url: "https://docs.langchain.com/langsmith/observability" },
    { title: "Evaluation concepts", url: "https://docs.langchain.com/langsmith/evaluation-concepts" },
    { title: "Evaluation", url: "https://docs.langchain.com/langsmith/evaluation" },
    { title: "LangSmith application", url: "https://smith.langchain.com/" },
  ],
};
