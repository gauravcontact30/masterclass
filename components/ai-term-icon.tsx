import { createElement } from "react";
import {
  Anchor, Bot, BrainCircuit, Boxes, CheckCheck, CircleDot, Columns3, Compass, Cpu, Database, FileJson,
  Flame, GitGraph, Gauge, Hand, Images, Layers, Link2, ListTree, Maximize, MessageSquareText, Network,
  Play, Plug, Puzzle, Route, Scissors, Search, Shapes, ShieldQuestion, Sparkles, SlidersHorizontal,
  Split, Target, ThumbsUp, UserCheck, Users, Workflow, Wrench, type LucideIcon,
} from "lucide-react";

/**
 * A mark for an AI term.
 *
 * The category supplies the default and each term may override it, the same
 * arrangement the AWS catalogue uses — but here almost every term overrides,
 * because a glossary card is read one at a time and the mark is doing real work
 * distinguishing "Tokens" from "Parameters" rather than just labelling a group.
 */
const BY_CATEGORY: Record<string, LucideIcon> = {
  "Model foundations": BrainCircuit,
  "Prompting & control": MessageSquareText,
  "Training & alignment": Gauge,
  "Retrieval & memory": Database,
  "Agents & tools": Bot,
  "Building with AI": Wrench,
  "Practice & perspective": Compass,
};

const BY_TERM: Record<string, LucideIcon> = {
  // Model foundations
  "LLM": BrainCircuit,
  "Tokens": Shapes,
  "Parameters": SlidersHorizontal,
  "Attention": Target,
  "Transformer": Network,
  "Context Window": Maximize,
  "Small Language Models": Cpu,
  "Multimodal": Images,
  "Reasoning Models": ListTree,
  "AGI vs. ASI": ShieldQuestion,
  // Prompting and control
  "Prompting": MessageSquareText,
  "Temperature": Flame,
  "Hallucination": CircleDot,
  "Context Engineering": Columns3,
  "Structured Outputs": FileJson,
  // Training and alignment
  "Training": Gauge,
  "Fine-Tuning": SlidersHorizontal,
  "RLHF": ThumbsUp,
  // Retrieval and memory
  "Vectors (Embeddings)": Shapes,
  "Embeddings": Boxes,
  "Vector Database": Database,
  "RAG": Search,
  "Chunking": Scissors,
  "Memory": Anchor,
  // Agents and tools
  "AI Agents": Bot,
  "Agentic AI": Users,
  "Actions": Play,
  "Tools": Wrench,
  "Tool Calling": Plug,
  "MCP": Link2,
  "Workflows": Workflow,
  "Human in the loop": Hand,
  "Human Approval": UserCheck,
  // Building with AI
  "LLM API": Route,
  "Zod Validation": CheckCheck,
  "LangChain.js": Link2,
  "LangGraph.js": GitGraph,
  "AI Operator VS AI Builder": Split,
  // Practice and perspective
  "Agent is the human replacement": Puzzle,
};

export function aiTermIcon(name: string, category: string): LucideIcon {
  return BY_TERM[name] ?? BY_CATEGORY[category] ?? Sparkles;
}

export function aiCategoryIcon(category: string): LucideIcon {
  return BY_CATEGORY[category] ?? Layers;
}

/** `createElement` rather than `<Icon />`: see aws-service-icon.tsx. */
export function AiTermIcon({ name, category, size = 15, className }: {
  name: string; category: string; size?: number; className?: string;
}) {
  return createElement(aiTermIcon(name, category), { size, className, "aria-hidden": true });
}

export function AiCategoryIcon({ category, size = 14, className }: { category: string; size?: number; className?: string }) {
  return createElement(aiCategoryIcon(category), { size, className, "aria-hidden": true });
}
