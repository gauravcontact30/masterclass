import type { TechnologyHandbook } from "../technology-handbooks";
import { learningModuleRow, type LearningModule } from "./module";
import { LANGCHAIN_MODULE } from "./langchain";
import { LANGGRAPH_MODULE } from "./langgraph";
import { LANGSMITH_MODULE } from "./langsmith";
import { LANGFLOW_MODULE } from "./langflow";
import { NEXTJS_MODULE } from "./nextjs";
import { REDIS_MODULE } from "./redis";
import { UPSTASH_MODULE } from "./upstash";
import { PLAYWRIGHT_MODULE } from "./playwright";
import { VITEST_MODULE } from "./vitest";

export { LEARNING_MODULE_CATEGORY } from "./module";

/** The Search tab each module opens, keyed by the handbook's exact title. */
export const LEARNING_MODULES: Record<string, LearningModule> = {
  "LangChain": LANGCHAIN_MODULE,
  "LangGraph": LANGGRAPH_MODULE,
  "LangSmith": LANGSMITH_MODULE,
  "LangFlow": LANGFLOW_MODULE,
  "Next.js 16+ — Routing, Rendering & Caching": NEXTJS_MODULE,
  "Redis caching solutions": REDIS_MODULE,
  "Upstash": UPSTASH_MODULE,
  "Playwright Automation — Browser Testing & Debugging": PLAYWRIGHT_MODULE,
  "Vitest — Fast Unit Testing & Mocks": VITEST_MODULE,
};

/** Puts each technology's learning module first in its tab, ahead of the reference rows. */
export function withLearningModules<T extends TechnologyHandbook>(handbooks: readonly T[]): T[] {
  return handbooks.map(handbook => {
    const learning = LEARNING_MODULES[handbook.title];
    if (!learning) return handbook;
    const row = learningModuleRow(learning);
    return { ...handbook, topics: [row, ...handbook.topics], categories: [{ name: row.category, count: 1 }, ...handbook.categories] } as T;
  });
}
