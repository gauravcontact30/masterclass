import type { TechnologyHandbook } from "../technology-handbooks";
import { LANGCHAIN_TOPICS } from "./langchain";
import { LANGGRAPH_TOPICS } from "./langgraph";
import { LANGSMITH_TOPICS } from "./langsmith";
import { LANGFLOW_TOPICS } from "./langflow";
import { LANGFLOW_API_TOPICS } from "./langflow-api";
import { N8N_TOPICS } from "./n8n";
import { DOCKER_TOPICS } from "./docker";
import { AWS_DEVOPS_TOPICS } from "./aws-devops";
import { AGENTIC_AI_TOPICS } from "./agentic-ai";
import { AGENTIC_AI_CONCEPTS } from "./agentic-ai-concepts";
import { AGENTIC_FOUNDATIONS } from "./agentic-ai-foundations";

const official = (title: string, url: string) => ({ title, url, reviewedAt: "2026-09-20" });
const create = (title: string, description: string, topics: TechnologyHandbook["topics"], sources: NonNullable<TechnologyHandbook["sources"]>): TechnologyHandbook => {
  const counts = new Map<string, number>();
  topics.forEach(topic => counts.set(topic.category, (counts.get(topic.category) ?? 0) + 1));
  return { title, description, topics, categories: [...counts].map(([name, count]) => ({ name, count })),
    questionPrefix: `${title}, based on official documentation at ${new URL(sources[0].url).hostname}`, sources };
};

export const AUTOMATION_HANDBOOKS: TechnologyHandbook[] = [
  create("LangChain", "Models, messages, tools, agents, middleware, retrieval and production practices, organized from foundations to deployment.", LANGCHAIN_TOPICS, [
    official("LangChain documentation", "https://docs.langchain.com/oss/python/langchain/overview"),
    official("Agents", "https://docs.langchain.com/oss/python/langchain/agents"),
    official("Middleware", "https://docs.langchain.com/oss/python/langchain/middleware/overview"),
    official("LangChain website", "https://www.langchain.com/"),
  ]),
  create("LangGraph", "State, reducers, control flow, checkpoints, human approval, memory, streaming and reliable graph operations.", LANGGRAPH_TOPICS, [
    official("LangGraph documentation", "https://docs.langchain.com/oss/python/langgraph/overview"),
    official("Graph API", "https://docs.langchain.com/oss/python/langgraph/graph-api"),
    official("Persistence", "https://docs.langchain.com/oss/python/langgraph/persistence"),
    official("Interrupts", "https://docs.langchain.com/oss/python/langgraph/interrupts"),
    official("LangGraph website", "https://www.langchain.com/langgraph"),
  ]),
  create("LangSmith", "Trace applications, curate datasets, evaluate agents, manage prompts and operate deployments using the official platform concepts.", LANGSMITH_TOPICS, [
    official("Observability documentation", "https://docs.langchain.com/langsmith/observability"),
    official("Evaluation concepts", "https://docs.langchain.com/langsmith/evaluation-concepts"),
    official("Prompt & Context Hub", "https://docs.langchain.com/langsmith/prompt-context-hub"),
    official("Deployment", "https://docs.langchain.com/langsmith/deployment"),
    official("LangSmith application", "https://smith.langchain.com/"),
  ]),
  create("LangFlow", "Lessons from first flow to production — building flows, agents and tools, RAG, serving over API, MCP and A2A, custom components and operations — plus the full API reference: concepts, CLI and LFX, REST endpoints, components, SDKs and configuration.", [...LANGFLOW_TOPICS, ...LANGFLOW_API_TOPICS], [
    official("Langflow documentation", "https://docs.langflow.org/"),
    official("Quickstart", "https://docs.langflow.org/get-started-quickstart"),
    official("Trigger flows with the API", "https://docs.langflow.org/concepts-publish"),
    official("Langflow as an MCP server", "https://docs.langflow.org/mcp-server"),
    official("Langflow API reference", "https://docs.langflow.org/api-reference-api-examples"),
    official("Custom components", "https://docs.langflow.org/components-custom-components"),
  ]),
  create("n8n", "Build workflow automations with data mapping, APIs, branches, AI agents, error recovery and production hosting.", N8N_TOPICS, [
    official("n8n documentation", "https://docs.n8n.io/"),
    official("Advanced AI", "https://docs.n8n.io/advanced-ai/"),
    official("Queue mode", "https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode"),
  ]),
  create("Docker", "Containers, Dockerfiles, BuildKit, multi-platform builds, Compose, networking, storage, security and operations.", DOCKER_TOPICS, [
    official("Docker manuals", "https://docs.docker.com/manuals/"),
    official("Docker Build", "https://docs.docker.com/build/concepts/overview/"),
  ]),
  create("DevOps with AWS CI/CD", "From source and tests to secure pipelines, immutable artifacts, infrastructure, deployments, observability and rollback.", AWS_DEVOPS_TOPICS, [
    official("CodePipeline concepts", "https://docs.aws.amazon.com/codepipeline/latest/userguide/concepts.html"),
    official("ECR and ECS deployment tutorial", "https://docs.aws.amazon.com/codepipeline/latest/userguide/tutorials-ecs-ecr-codedeploy.html"),
  ]),
  create("Agentic AI", "Start with individual concept cards in Agentic AI with LangChain and LangGraph, then explore Generative AI, RAG, Deep Agents, Guardrails, evaluation, gateways, design patterns, protocols, memory and production agents.", [...AGENTIC_FOUNDATIONS, ...AGENTIC_AI_TOPICS, ...AGENTIC_AI_CONCEPTS], [
    official("Agent foundations", "https://docs.langchain.com/oss/python/langchain/agents"),
    official("Retrieval", "https://docs.langchain.com/oss/python/deepagents/retrieval"),
    official("Deep Agents", "https://docs.langchain.com/oss/python/deepagents/overview"),
    official("Guardrails", "https://docs.langchain.com/oss/python/langchain/guardrails"),
    official("Evaluation", "https://docs.langchain.com/langsmith/evaluation"),
    official("Full-text retrieval", "https://www.elastic.co/docs/solutions/search/full-text"),
    official("LLM Gateway", "https://docs.litellm.ai/docs/simple_proxy"),
    official("Building effective agents", "https://www.anthropic.com/engineering/building-effective-agents"),
    official("Model Context Protocol", "https://modelcontextprotocol.io/docs/getting-started/intro"),
    official("Agent2Agent protocol", "https://a2a-protocol.org/latest/"),
    official("LangGraph memory", "https://docs.langchain.com/oss/python/concepts/memory"),
  ]),
];
