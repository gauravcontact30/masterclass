import type { AwsCategory, AwsHighlight } from "./aws-highlights";

/** The glossary reuses the catalogue row shape, so one browser renders both. */
export type AiTerm = AwsHighlight;

/**
 * The working vocabulary of building with language models.
 *
 * Ordered as a reading order rather than alphabetically: what a model is, how
 * you steer it, how it is trained, how you give it knowledge, how it acts, what
 * you build it with, and what any of it means for the people doing the work.
 * The category is what the tabs group by, so a term sits under the question it
 * answers rather than under the technology it happens to use.
 */
const TERMS: AiTerm[] = [
  { name: "LLM", category: "Model foundations", summary: "A large language model: a network trained on text to predict the next token, which turns out to be enough to summarise, translate, write code and hold a conversation." },
  { name: "Tokens", category: "Model foundations", summary: "The chunks a model actually reads and writes — roughly a short word or word-piece. Cost, limits and speed are all measured in these, not in characters." },
  { name: "Parameters", category: "Model foundations", summary: "The learned weights inside a model. More parameters usually means more capability and more cost to run, but training data and method matter at least as much." },
  { name: "Attention", category: "Model foundations", summary: "The mechanism that lets a model weigh every token against every other when deciding what comes next, rather than reading strictly left to right." },
  { name: "Transformer", category: "Model foundations", summary: "The architecture built on attention that underpins essentially every modern language model. Its parallelism is what made training at this scale practical." },
  { name: "Context Window", category: "Model foundations", summary: "The maximum tokens a model can consider at once — prompt plus reply. Exceed it and the earliest content falls out of view, or the call is rejected." },
  { name: "Small Language Models", category: "Model foundations", summary: "Deliberately compact models that trade breadth for cost, latency and the option to run on your own hardware or on-device." },
  { name: "Multimodal", category: "Model foundations", summary: "A model that takes more than text — images, audio, video, PDFs — in the same request, so a screenshot can be part of the question." },
  { name: "Reasoning Models", category: "Model foundations", summary: "Models trained to spend extra computation thinking before answering. Stronger on maths, planning and multi-step problems; slower and dearer per call." },
  { name: "AGI vs. ASI", category: "Model foundations", summary: "AGI is human-level competence across most tasks; ASI is beyond it. Both are contested, undefined in measurable terms, and neither describes what ships today." },

  { name: "Prompting", category: "Prompting & control", summary: "Writing the input that gets the output you want: giving the task, the constraints, the format and an example or two rather than hoping the model guesses." },
  { name: "Temperature", category: "Prompting & control", summary: "How much randomness is allowed when picking the next token. Low for extraction and code, higher for drafting. It is not a correctness dial." },
  { name: "Hallucination", category: "Prompting & control", summary: "A fluent, confident answer that is simply wrong. The model optimises for plausible text, not for truth, so grounding and verification stay your job." },
  { name: "Context Engineering", category: "Prompting & control", summary: "Deciding what goes into the window and in what order — instructions, retrieved facts, history, tool results — so the model has what it needs and nothing else." },
  { name: "Structured Outputs", category: "Prompting & control", summary: "Constraining a reply to a schema so it parses every time, instead of asking for JSON in prose and hoping the braces match." },

  { name: "Training", category: "Training & alignment", summary: "Pre-training: running enormous text corpora through the network to fit its weights. Done once, at great expense, before anyone fine-tunes anything." },
  { name: "Fine-Tuning", category: "Training & alignment", summary: "Continuing training on your own examples to fix tone, format or a narrow task. Reach for prompting and retrieval first — they are cheaper and reversible." },
  { name: "RLHF", category: "Training & alignment", summary: "Reinforcement learning from human feedback: people rank candidate replies, and those preferences train the model to be helpful rather than merely fluent." },

  { name: "Vectors (Embeddings)", category: "Retrieval & memory", summary: "Text mapped to a list of numbers positioned so that similar meanings land near each other, which makes meaning something you can measure by distance." },
  { name: "Embeddings", category: "Retrieval & memory", summary: "The models and the pipeline that produce those vectors — choosing one, keeping dimensions consistent, and re-embedding the corpus when you switch." },
  { name: "Vector Database", category: "Retrieval & memory", summary: "A store built for nearest-neighbour search over embeddings, so finding the passages closest in meaning to a query stays fast across millions of rows." },
  { name: "RAG", category: "Retrieval & memory", summary: "Retrieval-augmented generation: fetch the relevant passages first, put them in the prompt, and have the model answer from those rather than from memory." },
  { name: "Chunking", category: "Retrieval & memory", summary: "Splitting documents into retrievable pieces. Too big and you retrieve noise; too small and you sever the context that made the passage meaningful." },
  { name: "Memory", category: "Retrieval & memory", summary: "What an agent keeps between turns or sessions. Short-term is the running transcript; long-term is a store you deliberately write to and read back." },

  { name: "AI Agents", category: "Agents & tools", summary: "A model in a loop with tools and a goal, deciding its own next step rather than answering one question and stopping." },
  { name: "Agentic AI", category: "Agents & tools", summary: "Building those systems: one agent with tools, or several with separate roles handing work between them. More agents means more coordination, not less work." },
  { name: "Actions", category: "Agents & tools", summary: "The steps an agent takes that change something outside itself — writing a file, calling an endpoint, sending a message. The part worth guarding." },
  { name: "Tools", category: "Agents & tools", summary: "Functions you expose to a model, each with a name, a description and a typed schema. The description is prompt text: vague ones get called wrongly." },
  { name: "Tool Calling", category: "Agents & tools", summary: "The loop itself — the model emits a structured call, your code runs it and returns the result, and the model continues with that result in context." },
  { name: "MCP", category: "Agents & tools", summary: "Model Context Protocol: a standard way to expose tools, data and prompts to any client, so an integration is written once instead of once per application." },
  { name: "Workflows", category: "Agents & tools", summary: "Fixed sequences you control, with a model at specific steps. Less autonomous than an agent and far easier to test, price and debug — usually the right default." },
  { name: "Human in the loop", category: "Agents & tools", summary: "Designing the pause: where a person reviews, corrects or resumes the run, rather than discovering afterwards what the system decided on its own." },
  { name: "Human Approval", category: "Agents & tools", summary: "The narrower gate — an explicit yes before a consequential action commits. Spend it on what is costly or irreversible, or it becomes a reflex click." },

  { name: "LLM API", category: "Building with AI", summary: "The HTTP surface you actually call: messages in, tokens out, usually streamed. Retries, timeouts, rate limits and cost accounting are yours to handle." },
  { name: "Zod Validation", category: "Building with AI", summary: "Declaring the shape you expect in TypeScript and parsing the model output against it, so a malformed reply fails at your boundary and not three layers in." },
  { name: "LangChain.js", category: "Building with AI", summary: "A JavaScript toolkit of adapters for models, retrievers, stores and tools. Useful for wiring; worth knowing what it abstracts before you depend on it." },
  { name: "LangGraph.js", category: "Building with AI", summary: "Agent control flow as an explicit graph of nodes and edges, with state and checkpoints — so a long run can be paused, resumed and reasoned about." },
  { name: "AI Operator VS AI Builder", category: "Building with AI", summary: "Operating is using these tools well. Building is shipping systems on top of them, where evaluation, cost, failure modes and safety become your problem." },

  { name: "Agent is the human replacement", category: "Practice & perspective", summary: "The common claim, and the honest reading: agents shift where human effort goes — from doing the steps to specifying, reviewing and owning the result." },
];

export function aiTerms(): AiTerm[] {
  return TERMS;
}

/** Categories in the order the terms introduce them, which is the reading order. */
export function aiCategories(): AwsCategory[] {
  const counts = new Map<string, number>();
  for (const term of TERMS) counts.set(term.category, (counts.get(term.category) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count }));
}
