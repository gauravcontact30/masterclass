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
  { name: "LLM", category: "Model foundations", summary: "A large language model: a network trained on text to predict the next token, which turns out to be enough to summarise, translate, write code and hold a conversation.", points: [
      "It predicts the next token, and everything else it appears to do follows from that.",
      "No fact is looked up at inference time; the answer comes from the weights.",
      "Capability is uneven, so it can draft an essay and miscount letters in a word.",
    ] },
  { name: "Tokens", category: "Model foundations", summary: "The chunks a model actually reads and writes — roughly a short word or word-piece. Cost, limits and speed are all measured in these, not in characters.", points: [
      "Cost, rate limits and context are all measured in these rather than in characters.",
      "A token is roughly a short word, so a language with rarer scripts costs more per sentence.",
      "The same text tokenises differently between model families, so counts do not transfer.",
    ] },
  { name: "Parameters", category: "Model foundations", summary: "The learned weights inside a model. More parameters usually means more capability and more cost to run, but training data and method matter at least as much.", points: [
      "The learned weights are what the model knows; nothing else persists between calls.",
      "More parameters usually means more capability and more cost to serve.",
      "Training data and method move quality at least as much as raw count does.",
    ] },
  { name: "Attention", category: "Model foundations", summary: "The mechanism that lets a model weigh every token against every other when deciding what comes next, rather than reading strictly left to right.", points: [
      "Every token is weighed against every other rather than read strictly left to right.",
      "That comparison is what lets a pronoun resolve to a noun far earlier in the text.",
      "Its cost grows faster than linearly with length, which is why context is not free.",
    ] },
  { name: "Transformer", category: "Model foundations", summary: "The architecture built on attention that underpins essentially every modern language model. Its parallelism is what made training at this scale practical.", points: [
      "Attention plus feed-forward layers is the architecture under essentially every modern model.",
      "Its parallelism is what made training at this scale practical at all.",
      "The design is broadly shared, so differences come from data, scale and tuning.",
    ] },
  { name: "Context Window", category: "Model foundations", summary: "The maximum tokens a model can consider at once — prompt plus reply. Exceed it and the earliest content falls out of view, or the call is rejected.", points: [
      "Prompt and reply together must fit inside one maximum.",
      "Exceeding it either drops the earliest content or rejects the call outright.",
      "Filling the window does not mean the model attends to all of it equally.",
    ] },
  { name: "Small Language Models", category: "Model foundations", summary: "Deliberately compact models that trade breadth for cost, latency and the option to run on your own hardware or on-device.", points: [
      "Breadth is traded for cost, latency and the option to run on your own hardware.",
      "Running on-device removes the round trip and keeps the data local.",
      "They need a narrower task definition to match a larger model's usefulness.",
    ] },
  { name: "Multimodal", category: "Model foundations", summary: "A model that takes more than text — images, audio, video, PDFs — in the same request, so a screenshot can be part of the question.", points: [
      "Images, audio, video and documents arrive in the same request as the text.",
      "A screenshot can be part of the question instead of being described in words.",
      "Non-text inputs consume context too, often far more than their description would.",
    ] },
  { name: "Reasoning Models", category: "Model foundations", summary: "Models trained to spend extra computation thinking before answering. Stronger on maths, planning and multi-step problems; slower and dearer per call.", points: [
      "Extra computation is spent before the answer is produced.",
      "The gain shows on maths, planning and multi-step problems rather than on recall.",
      "Latency and cost per call rise, so they are wrong for a simple extraction.",
    ] },
  { name: "AGI vs. ASI", category: "Model foundations", summary: "AGI is human-level competence across most tasks; ASI is beyond it. Both are contested, undefined in measurable terms, and neither describes what ships today.", points: [
      "AGI names human-level competence broadly; ASI names something past it.",
      "Neither has a measurable definition, so claims about them are not testable.",
      "Neither describes what is available to build with today.",
    ] },

  { name: "Prompting", category: "Prompting & control", summary: "Writing the input that gets the output you want: giving the task, the constraints, the format and an example or two rather than hoping the model guesses.", points: [
      "The task, the constraints, the format and an example beat hoping the model infers them.",
      "An example is usually worth more than another paragraph of instruction.",
      "A prompt that works on one model is not guaranteed to transfer to another.",
    ] },
  { name: "Temperature", category: "Prompting & control", summary: "How much randomness is allowed when picking the next token. Low for extraction and code, higher for drafting. It is not a correctness dial.", points: [
      "It controls how much randomness is allowed when the next token is chosen.",
      "Low suits extraction and code; higher suits drafting and ideation.",
      "It is not a correctness dial: zero temperature still produces confident errors.",
    ] },
  { name: "Hallucination", category: "Prompting & control", summary: "A fluent, confident answer that is simply wrong. The model optimises for plausible text, not for truth, so grounding and verification stay your job.", points: [
      "A fluent, confident answer can simply be wrong.",
      "The objective rewards plausible text, not true text.",
      "Grounding and verification stay the application's responsibility, not the model's.",
    ] },
  { name: "Context Engineering", category: "Prompting & control", summary: "Deciding what goes into the window and in what order — instructions, retrieved facts, history, tool results — so the model has what it needs and nothing else.", points: [
      "What enters the window, and in what order, is a design decision.",
      "Irrelevant context costs money and dilutes attention on what matters.",
      "Ordering matters, because position affects what the model weighs most.",
    ] },
  { name: "Structured Outputs", category: "Prompting & control", summary: "Constraining a reply to a schema so it parses every time, instead of asking for JSON in prose and hoping the braces match.", points: [
      "A reply constrained to a schema parses every time.",
      "Constraining beats asking for JSON in prose and hoping the braces match.",
      "A schema that is valid but semantically wrong still parses, so validation is not review.",
    ] },

  { name: "Training", category: "Training & alignment", summary: "Pre-training: running enormous text corpora through the network to fit its weights. Done once, at great expense, before anyone fine-tunes anything.", points: [
      "Pre-training fits the weights by running enormous corpora through the network.",
      "It happens once, at great expense, before anyone fine-tunes anything.",
      "Its cut-off is why the model has no knowledge of what came after it.",
    ] },
  { name: "Fine-Tuning", category: "Training & alignment", summary: "Continuing training on your own examples to fix tone, format or a narrow task. Reach for prompting and retrieval first — they are cheaper and reversible.", points: [
      "Training continues on your own examples to fix tone, format or a narrow task.",
      "It teaches behaviour far better than it teaches new facts.",
      "Prompting and retrieval are cheaper and reversible, so they come first.",
    ] },
  { name: "RLHF", category: "Training & alignment", summary: "Reinforcement learning from human feedback: people rank candidate replies, and those preferences train the model to be helpful rather than merely fluent.", points: [
      "Human rankings of candidate replies train the model toward being helpful.",
      "It is what turns a fluent text predictor into something that answers a request.",
      "The model inherits the preferences of whoever did the ranking.",
    ] },

  { name: "Vectors (Embeddings)", category: "Retrieval & memory", summary: "Text mapped to a list of numbers positioned so that similar meanings land near each other, which makes meaning something you can measure by distance.", points: [
      "Text becomes numbers positioned so that similar meanings sit near each other.",
      "Distance between them is what makes meaning measurable at all.",
      "Nearness is similarity, not truth, so a close match can still be irrelevant.",
    ] },
  { name: "Embeddings", category: "Retrieval & memory", summary: "The models and the pipeline that produce those vectors — choosing one, keeping dimensions consistent, and re-embedding the corpus when you switch.", points: [
      "The model and pipeline that produce the vectors are a choice with consequences.",
      "Dimensions must stay consistent, so mixing two models breaks the index.",
      "Switching model means re-embedding the whole corpus, not just new documents.",
    ] },
  { name: "Vector Database", category: "Retrieval & memory", summary: "A store built for nearest-neighbour search over embeddings, so finding the passages closest in meaning to a query stays fast across millions of rows.", points: [
      "Nearest-neighbour search over embeddings stays fast across millions of rows.",
      "Approximate search is what buys that speed, at some recall.",
      "Filtering by metadata alongside the vector is usually what makes results usable.",
    ] },
  { name: "RAG", category: "Retrieval & memory", summary: "Retrieval-augmented generation: fetch the relevant passages first, put them in the prompt, and have the model answer from those rather than from memory.", points: [
      "Relevant passages are fetched first and answered from, rather than from memory.",
      "It is how a model answers about data it was never trained on.",
      "The answer is bounded by retrieval: nothing fetched cannot be used.",
    ] },
  { name: "Chunking", category: "Retrieval & memory", summary: "Splitting documents into retrievable pieces. Too big and you retrieve noise; too small and you sever the context that made the passage meaningful.", points: [
      "Documents are split into pieces that retrieval can return.",
      "Chunks too large retrieve noise; too small sever the context that gave them meaning.",
      "Overlap preserves meaning across a boundary at the cost of duplication.",
    ] },
  { name: "Memory", category: "Retrieval & memory", summary: "What an agent keeps between turns or sessions. Short-term is the running transcript; long-term is a store you deliberately write to and read back.", points: [
      "Short-term memory is the running transcript; long-term is a store written to deliberately.",
      "Without it every session starts from nothing, however long the earlier one was.",
      "Everything remembered is context that must be paid for on later calls.",
    ] },

  { name: "AI Agents", category: "Agents & tools", summary: "A model in a loop with tools and a goal, deciding its own next step rather than answering one question and stopping.", points: [
      "A model in a loop with tools and a goal chooses its own next step.",
      "Choosing the step is what separates an agent from a single answered question.",
      "An unbounded loop needs a stopping condition or it runs until the budget does.",
    ] },
  { name: "Agentic AI", category: "Agents & tools", summary: "Building those systems: one agent with tools, or several with separate roles handing work between them. More agents means more coordination, not less work.", points: [
      "Systems are built either as one agent with tools or several with separate roles.",
      "More agents adds coordination cost rather than removing work.",
      "One agent with good tools usually beats several with vague ones.",
    ] },
  { name: "Actions", category: "Agents & tools", summary: "The steps an agent takes that change something outside itself — writing a file, calling an endpoint, sending a message. The part worth guarding.", points: [
      "These are the steps that change something outside the system.",
      "They are the part worth guarding, because they are not undone by ignoring the answer.",
      "An action that is not idempotent is dangerous on a retry.",
    ] },
  { name: "Tools", category: "Agents & tools", summary: "Functions you expose to a model, each with a name, a description and a typed schema. The description is prompt text: vague ones get called wrongly.", points: [
      "Each is a function with a name, a description and a typed schema.",
      "The description is prompt text, so a vague one produces wrong calls.",
      "Too many tools crowd the context and make selection worse, not better.",
    ] },
  { name: "Tool Calling", category: "Agents & tools", summary: "The loop itself — the model emits a structured call, your code runs it and returns the result, and the model continues with that result in context.", points: [
      "The model emits a structured call, your code runs it and returns the result.",
      "The loop continues with that result in context, which is what makes it iterative.",
      "A returned error is context too, so it should be readable rather than a stack trace.",
    ] },
  { name: "MCP", category: "Agents & tools", summary: "Model Context Protocol: a standard way to expose tools, data and prompts to any client, so an integration is written once instead of once per application.", points: [
      "Tools, data and prompts are exposed through one standard to any client.",
      "An integration is written once instead of once per application.",
      "A server's descriptions are untrusted text, not instructions to obey.",
    ] },
  { name: "Workflows", category: "Agents & tools", summary: "Fixed sequences you control, with a model at specific steps. Less autonomous than an agent and far easier to test, price and debug — usually the right default.", points: [
      "Fixed sequences you control, with a model at specific steps.",
      "Being fixed is what makes them testable, priceable and debuggable.",
      "They are usually the right default; autonomy is the exception that must be justified.",
    ] },
  { name: "Human in the loop", category: "Agents & tools", summary: "Designing the pause: where a person reviews, corrects or resumes the run, rather than discovering afterwards what the system decided on its own.", points: [
      "The pause is designed in, rather than discovered after the run.",
      "Review at the right step beats finding out afterwards what was decided.",
      "A checkpoint nobody reads is a delay without a safeguard.",
    ] },
  { name: "Human Approval", category: "Agents & tools", summary: "The narrower gate — an explicit yes before a consequential action commits. Spend it on what is costly or irreversible, or it becomes a reflex click.", points: [
      "An explicit yes gates a consequential action before it commits.",
      "It is spent on what is costly or irreversible, not on everything.",
      "Asked too often it becomes a reflex click and stops being a control.",
    ] },

  { name: "LLM API", category: "Building with AI", summary: "The HTTP surface you actually call: messages in, tokens out, usually streamed. Retries, timeouts, rate limits and cost accounting are yours to handle.", points: [
      "Messages go in and tokens come out, usually streamed.",
      "Retries, timeouts, rate limits and cost accounting are the caller's problem.",
      "Streaming changes error handling, because failure can arrive mid-response.",
    ] },
  { name: "Zod Validation", category: "Building with AI", summary: "Declaring the shape you expect in TypeScript and parsing the model output against it, so a malformed reply fails at your boundary and not three layers in.", points: [
      "The expected shape is declared once and the output parsed against it.",
      "A malformed reply then fails at the boundary rather than three layers in.",
      "The schema can also be handed to the model, so both sides agree on the shape.",
    ] },
  { name: "LangChain.js", category: "Building with AI", summary: "A JavaScript toolkit of adapters for models, retrievers, stores and tools. Useful for wiring; worth knowing what it abstracts before you depend on it.", points: [
      "Adapters cover models, retrievers, stores and tools.",
      "It is most useful for wiring things together quickly.",
      "Knowing what it abstracts is what makes depending on it a decision.",
    ] },
  { name: "LangGraph.js", category: "Building with AI", summary: "Agent control flow as an explicit graph of nodes and edges, with state and checkpoints — so a long run can be paused, resumed and reasoned about.", points: [
      "Agent control flow is an explicit graph of nodes and edges.",
      "State and checkpoints let a long run pause and resume.",
      "An explicit graph is what makes the path taken reviewable after the fact.",
    ] },
  { name: "AI Operator VS AI Builder", category: "Building with AI", summary: "Operating is using these tools well. Building is shipping systems on top of them, where evaluation, cost, failure modes and safety become your problem.", points: [
      "Operating is using these tools well; building is shipping systems on them.",
      "Building makes evaluation, cost, failure modes and safety your problem.",
      "The two need different skills, and being good at one does not confer the other.",
    ] },

  { name: "Agent is the human replacement", category: "Practice & perspective", summary: "The common claim, and the honest reading: agents shift where human effort goes — from doing the steps to specifying, reviewing and owning the result.", points: [
      "The honest reading is that effort moves rather than disappears.",
      "Specifying, reviewing and owning the result is where the work lands.",
      "A system nobody owns fails quietly, which is more expensive than doing it by hand.",
    ] },
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
