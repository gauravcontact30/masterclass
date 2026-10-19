/** Short definitions for the learning-path overview. Full lessons remain in their tabs. */
export const WORKFLOW_DEFINITIONS: Record<string, string> = {
  "architecture-review": "System design turns requirements into reliable, scalable services.",
  "langchain-tool-agent": "LangChain connects models, tools and context to build AI applications.",
  "langgraph-resume": "LangGraph coordinates stateful agents through nodes, branches and checkpoints.",
  "langflow-api": "LangFlow connects visual components into runnable AI flows.",
  "langsmith-regression": "LangSmith helps trace, evaluate and improve AI application behavior.",
  "n8n-ai-routing": "n8n automates tasks by connecting triggers, services and processing steps.",
  "python-agent-io": "Python combines model APIs, typed data and asynchronous tools for agent execution.",
  "agentic-terms": "Agent vocabulary explains how models use context, tools, memory and feedback.",
  "nextjs-ai-routing": "Next.js serves AI interfaces while OpenRouter or AI Gateway routes model requests.",
  "react19-actions": "React builds interactive interfaces from components, state and Actions.",
  "agentic-patterns": "Agentic AI uses models to choose actions and adapt to results within defined limits.",
  "integrated-agent-workflow": "An integrated workflow connects automation, agent state, visual flows and evaluation.",
};

/** Sentence-aware bullets preserve the original wording, including decimal numbers. */
export function learningPoints(content: string): string[] {
  return Array.from(new Intl.Segmenter("en", { granularity: "sentence" }).segment(content), part => part.segment.trim()).filter(Boolean);
}
