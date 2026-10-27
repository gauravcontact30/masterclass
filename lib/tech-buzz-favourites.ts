/*
 * The topics of /tech-buzz's "Community favourites" section. Each topic gets at least one researched story
 * (scripts/write-favourite-stories.ts, tagged `fav:<id>`) and collects every other story that matches it; readers'
 * likes rank the stories inside a topic. `officialSites` are where its stories are researched (named, never linked).
 */
export type FavouriteTopic = {
  id: string;
  label: string;
  /** What the topic's own story covers. */
  angle: string;
  /** Matched against a story's title, technology and tags to collect the rest of the topic. */
  match: RegExp;
  color: string;
  category: string;
  technology: string;
  techId: string;
  officialSites: string[];
};

export const favouriteTag = (id: string) => `fav:${id}`;
export const isFavouriteTag = (tag: string) => tag.startsWith("fav:");

export const FAVOURITE_TOPICS: FavouriteTopic[] = [
  { id: "react", label: "React 19+", color: "#0ea5e9", category: "Frontend", technology: "React 19", techId: "react",
    angle: "what React 19 changed for everyday code: Actions, useActionState, useOptimistic, the use() hook, ref as a prop and the React Compiler, with migration steps",
    match: /\breact\b/i, officialSites: ["react.dev"] },
  { id: "nextjs", label: "Next.js 16+", color: "#111827", category: "Frontend", technology: "Next.js 16", techId: "nextjs",
    angle: "building with Next.js 16: Cache Components and 'use cache', the proxy file, Turbopack by default and the upgrade path from 15",
    match: /next\.?js/i, officialSites: ["nextjs.org"] },
  { id: "claude-code", label: "Claude Code", color: "#c6613f", category: "AI Tools", technology: "Claude Code", techId: "claude",
    angle: "a working engineer's guide to Claude Code: CLAUDE.md memory, slash commands, hooks, subagents, MCP servers and safe permission settings",
    match: /claude/i, officialSites: ["code.claude.com", "docs.claude.com", "docs.anthropic.com", "anthropic.com"] },
  { id: "openai", label: "OpenAI", color: "#10a37f", category: "AI", technology: "OpenAI", techId: "openai",
    angle: "building on the OpenAI platform today: the Responses API, tool calling, structured outputs, the Agents SDK and choosing a model",
    match: /openai|\bgpt\b/i, officialSites: ["platform.openai.com", "openai.com", "cookbook.openai.com", "openai.github.io"] },
  { id: "aws", label: "AWS top services", color: "#d97706", category: "Cloud & DevOps", technology: "AWS", techId: "aws",
    angle: "the AWS services most production teams actually run (EC2, S3, Lambda, RDS and Aurora, DynamoDB, ECS and EKS, CloudFront, IAM, Bedrock) and when to pick each",
    match: /\baws\b|amazon/i, officialSites: ["docs.aws.amazon.com", "aws.amazon.com"] },
  { id: "agentic-ai", label: "Agentic AI", color: "#7c3aed", category: "Agentic AI", technology: "Agentic AI", techId: "agentic-ai",
    angle: "what makes an AI system agentic: the plan, act, observe loop, tools, memory, guardrails and human approval, with a minimal working agent",
    match: /agentic|\bagents?\b/i, officialSites: ["docs.langchain.com", "langchain-ai.github.io", "anthropic.com", "platform.openai.com"] },
  { id: "python-ai", label: "Python with AI", color: "#3776ab", category: "AI", technology: "Python & AI", techId: "python",
    angle: "Python for AI engineering in practice: calling LLM APIs, embeddings and vector search, Hugging Face Transformers and a small RAG service with FastAPI",
    match: /python/i, officialSites: ["docs.python.org", "huggingface.co", "pytorch.org", "fastapi.tiangolo.com"] },
  { id: "google-ai", label: "Google AI", color: "#4285f4", category: "AI", technology: "Google AI", techId: "google",
    angle: "Google's AI stack for developers: the Gemini API and models, AI Studio, Vertex AI and the Agent Development Kit, with a working example",
    match: /google|gemini|vertex/i, officialSites: ["ai.google.dev", "cloud.google.com", "google.github.io", "deepmind.google", "blog.google"] },
  { id: "microsoft-ai", label: "Microsoft AI", color: "#0078d4", category: "AI", technology: "Microsoft AI", techId: "microsoft",
    angle: "Microsoft's AI platform for developers: Azure AI Foundry, Azure OpenAI, Copilot Studio, Semantic Kernel and AutoGen, and how they fit together",
    match: /microsoft|azure|copilot|semantic kernel|autogen/i, officialSites: ["learn.microsoft.com", "azure.microsoft.com", "microsoft.com", "microsoft.github.io", "devblogs.microsoft.com"] },
  { id: "ai-trends", label: "Latest AI trends", color: "#db2777", category: "AI", technology: "AI Trends", techId: "agentic-ai",
    angle: "the latest trends shaping AI engineering this year: reasoning models, agents in production, the Model Context Protocol, small and on-device models, multimodality and evaluation",
    match: /trend|state of ai|this year in ai/i, officialSites: ["openai.com", "anthropic.com", "deepmind.google", "blog.google", "ai.meta.com", "modelcontextprotocol.io", "huggingface.co"] },
  { id: "agent-frameworks", label: "Agent frameworks", color: "#0f766e", category: "Agentic AI", technology: "Agent Frameworks", techId: "langgraph",
    angle: "the most popular agentic AI frameworks and workflow patterns compared: LangGraph, CrewAI, AutoGen, the OpenAI Agents SDK and LlamaIndex, and when each fits",
    match: /langgraph|crewai|autogen|llamaindex|agents sdk|framework/i, officialSites: ["docs.langchain.com", "langchain-ai.github.io", "docs.crewai.com", "microsoft.github.io", "openai.github.io", "docs.llamaindex.ai"] },
  { id: "n8n", label: "n8n workflows", color: "#ea4b71", category: "Workflow Automation", technology: "n8n", techId: "n8n",
    angle: "n8n workflows that pay off: triggers, the Code node, the AI Agent node with tools and memory, error workflows and self-hosting for production",
    match: /\bn8n\b/i, officialSites: ["docs.n8n.io", "n8n.io"] },
  { id: "emerging", label: "Emerging in tech", color: "#9333ea", category: "AI", technology: "Emerging Tech", techId: "agentic-ai",
    angle: "what is emerging across AI and the wider tech industry right now and what it means for engineers' skills: agentic workflows, AI coding tools, new model classes, AI infrastructure and edge AI",
    match: /emerging|future of|what's next/i, officialSites: ["openai.com", "anthropic.com", "deepmind.google", "blog.google", "nvidia.com", "ai.meta.com", "aws.amazon.com", "microsoft.com"] },
];

/** The topics a story belongs to: its own `fav:` tag, or a match on its title, technology or tags. */
export function topicsOf(story: { title: string; technology: string; tags: string[] }): string[] {
  const text = `${story.title} ${story.technology} ${story.tags.join(" ")}`;
  return FAVOURITE_TOPICS.filter(topic => story.tags.includes(favouriteTag(topic.id)) || topic.match.test(text)).map(topic => topic.id);
}
