import { AI_VOCABULARY } from './ai-vocabulary';
import { lesson, type FundamentalSeed } from './notes-fundamentals';

const distinctions = [
  'Fluent text can still be wrong; model size does not guarantee accuracy.',
  'Prompting changes the request, not the model’s trained parameters.',
  'Temperature is not an accuracy switch; even a value of zero does not guarantee identical or correct answers.',
  'Check important claims against reliable evidence.',
  'Choose relevant context within the token budget; it is not automatic permanent memory.',
  'Tokens are not always whole words. Exact splits depend on the tokenizer.',
  'Similar embeddings suggest related content, not guaranteed truth. Compare vectors from compatible models.',
  'Input and generated output commonly share a context budget; output may also have a separate limit.',
  'Learned parameters differ from request settings such as temperature.',
  'Attention is a calculation, not human awareness or a reliable explanation of every model decision.',
  'Transformers can handle different tasks; not every transformer is a chatbot.',
  'Training changes learned values; inference uses a trained model to produce an answer.',
  'Fine-tuning updates model or adapter parameters; adding documents to a prompt does not.',
  'Rating an answer does not immediately update a deployed model’s weights.',
  'RAG supplies retrieved context without requiring a weight update; poor retrieval can still produce poor answers.',
  'MCP standardizes connections; the application must still enforce access and permissions.',
  'An agent is a system around a model, not a guarantee of reliable autonomous action.',
  'Supported input and output modalities differ by model; image input does not imply image generation.',
  'Extra reasoning effort does not guarantee correctness; verify the result against the task constraints.',
  'Small is relative: there is no universal parameter cutoff, and smaller does not automatically mean more accurate.',
  'AGI and ASI have debated definitions; a strong result on one narrow benchmark does not establish either.',
];
const slugs=['llm','prompting','temperature','hallucination','context-engineering','tokens','embeddings','context-window','parameters','attention','transformer','training','fine-tuning','rlhf','rag','mcp','ai-agents','multimodal','reasoning-models','small-language-models','agi-vs-asi'];
const glossary='https://developers.google.com/machine-learning/glossary';
/** The same feature bullets feed topic cards, the reader and generated library notes. */
export const AI_TOPIC_FEATURES: Record<string, [string, string, string]> = {
  'LLM': ['Predicts tokens using learned patterns and the supplied context.', 'Supports tasks such as summarization, drafting, translation, and coding.', 'Output quality depends on training data, instructions, and relevant evidence.'],
  'Prompting': ['State the task, constraints, and desired output format clearly.', 'Add representative examples when the expected pattern is hard to describe.', 'Test prompts on varied inputs; prompting does not retrain the model.'],
  'Temperature': ['Rescales token scores before sampling the next token.', 'Lower settings usually favor likely tokens; higher settings allow more variation.', 'It controls sampling diversity, not factual knowledge or reasoning effort.'],
  'Hallucination': ['Can appear as invented facts, citations, quotations, or code APIs.', 'Ground answers in trustworthy evidence and allow the model to express uncertainty.', 'Check claims against sources or tests; confident wording is not proof.'],
  'Context Engineering': ['Assemble instructions, relevant documents, tool results, and conversation state.', 'Retrieve selectively and summarize older history to manage the token budget.', 'Keep durable memory outside the model and load only what the current task needs.'],
  'Tokens': ['Tokenizers map text pieces to numerical IDs.', 'Token counts affect context limits, usage costs, and generation length.', 'Counts vary by language, code, and tokenizer; characters are not a fixed token measure.'],
  'Vectors (Embeddings)': ['Represent text or other content as numerical coordinates.', 'Enable semantic search, clustering, and similarity-based recommendations.', 'Compare compatible embeddings using a suitable metric, such as cosine similarity.'],
  'Context Window': ['Bounds the tokens available to a model for a request.', 'Instructions, history, retrieved material, and output compete for the budget.', 'Longer capacity does not guarantee every detail will be used reliably.'],
  'Parameters': ['Include learned weights and other trainable values in the network.', 'Parameter count affects storage and compute requirements.', 'More parameters alone do not guarantee higher quality on a specific task.'],
  'Attention': ['Uses queries, keys, and values to combine contextual information.', 'Multiple attention heads learn different relationships between positions.', 'Causal attention masks future tokens during next-token prediction.'],
  'Transformer': ['Combines attention with feed-forward layers and positional information.', 'Encoder, decoder, and encoder-decoder variants support different tasks.', 'Training can process positions in parallel; autoregressive decoding remains sequential.'],
  'Training': ['Defines a learning objective and measures prediction error with a loss.', 'Uses optimization to update parameters over batches of examples.', 'Evaluates on held-out data to detect overfitting and measure generalization.'],
  'Fine-Tuning': ['Starts with pretrained weights and task-relevant training examples.', 'Can update all weights or smaller adapters, such as LoRA.', 'Useful for consistent behavior or task adaptation; evaluate regressions on separate data.'],
  'RLHF': ['Collects human comparisons or ratings of candidate responses.', 'A common pipeline fits a reward model and optimizes a policy using that signal.', 'Preference quality matters; preferred answers are not necessarily factually correct.'],
  'RAG': ['Retrieves relevant passages from an external knowledge source at answer time.', 'Supplies retrieved evidence with the prompt without changing model weights.', 'Track retrieval quality and source support; stale or irrelevant passages can mislead.'],
  'MCP': ['Connects AI applications through a host, clients, and servers.', 'Servers can expose tools, resources, and reusable prompts.', 'Standard interfaces reduce custom integration work; applications still control authorization.'],
  'AI Agents': ['Run a goal-driven loop: choose an action, use a tool, observe, and adapt.', 'Maintain task state and retrieve relevant memory between steps.', 'Need stopping conditions, tool permissions, and checks on action outcomes.'],
  'Multimodal': ['Combines information across supported formats, such as text and images.', 'Supports tasks such as chart interpretation, audio transcription, and visual question answering.', 'Quality depends on each modality; unclear images or noisy audio can cause mistakes.'],
  'Reasoning Models': ['Use additional inference effort for tasks with multiple dependent steps.', 'Can improve performance on mathematics, coding, and constraint-based problems.', 'Trade additional computation and latency for potential gains; assess verified outcomes.'],
  'Small Language Models (SLMs)': ['Can reduce memory needs and inference costs for suitable workloads.', 'May run locally or on edge devices when hardware and model size permit.', 'Task-focused training or distillation can improve usefulness; benchmark against a larger baseline.'],
  'AGI vs. ASI': ['AGI emphasizes broad generalization across tasks rather than one narrow specialty.', 'ASI emphasizes capabilities broadly beyond human performance.', 'Capability, autonomy, and consciousness are different concepts; one does not establish the others.'],
};
const topicSources: Record<string, string> = {
  'LLM': 'https://huggingface.co/learn/llm-course/en/chapter1/1',
  'Prompting': 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables',
  'Context Engineering': 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents',
  'Attention': 'https://arxiv.org/abs/1706.03762',
  'Transformer': 'https://arxiv.org/abs/1706.03762',
  'Fine-Tuning': 'https://huggingface.co/learn/llm-course/en/chapter3/1',
  'RAG': 'https://arxiv.org/abs/2005.11401',
  'MCP': 'https://modelcontextprotocol.io/docs/getting-started/intro',
  'AI Agents': 'https://www.anthropic.com/engineering/building-effective-agents',
  'Reasoning Models': 'https://arxiv.org/abs/2501.12948',
  'Small Language Models (SLMs)': 'https://arxiv.org/abs/2404.14219',
  'AGI vs. ASI': 'https://arxiv.org/abs/2311.02462',
};
export const AI_VOCABULARY_SEEDS: FundamentalSeed[] = AI_VOCABULARY.map((entry,index)=>({
  ...lesson(`vocabulary-${slugs[index]}`,entry.word,'AI terms & vocabulary',[entry.meaning, ...AI_TOPIC_FEATURES[entry.word], distinctions[index]].join('|'),entry.example,
    `Term: ${entry.word}\nMeaning: ${entry.meaning}\nKey features:\n${AI_TOPIC_FEATURES[entry.word].map(point => `- ${point}`).join('\n')}\nExample: ${entry.example}`,
    [`Which statement correctly describes ${entry.word}?`,entry.meaning,'It guarantees every AI answer is correct.','It gives a model unlimited permanent memory.','It automatically grants access to every data source.'],
    topicSources[entry.word] ?? glossary),
  vocabulary:[entry],
}));
