import type { Curriculum, GenerationRequest } from "@/lib/domain";
import python from "./python";
import claudeEcosystem from "./claude-ecosystem";
import llmEngineering from "./llm-engineering";
import jest from "./jest";
import reactTestingLibrary from "./react-testing-library";
import vitest from "./vitest";
import playwright from "./playwright";
import javascriptPuzzles from "./javascript-puzzles";
import zustand from "./zustand";
import es2026 from "./es2026";
import typescript7 from "./typescript-7";
import aws from "./aws";
import devops from "./devops";
import tanstackStart from "./tanstack-start";
import cypress from "./cypress";
import agenticAi from "./agentic-ai";
import platformEngineering from "./platform-engineering";
import awsAi from "./aws-ai";
import dataEngineering from "./data-engineering";
import cybersecurity from "./cybersecurity";
import { redux, reduxToolkit } from "./redux";
import nextjsHooks from "./nextjs-hooks";
import reactHooks from "./react-hooks";
import node from "./node";
import graphql from "./graphql";
import nestjs from "./nestjs";

/**
 * The hand-authored technology notes seeded into every library, one module
 * per technology. Each is written from scratch for this course and grounded
 * in that technology's official documentation, which its `sources` cite.
 */
export type TechnologyGuide = {
  id: string;
  technologyId: string;
  topicId: string;
  level: GenerationRequest["level"];
  version?: number;
  curriculum: Curriculum;
};

/** In library order: the first guide is listed first. */
export const TECHNOLOGY_GUIDES: TechnologyGuide[] = [
  node,
  graphql,
  nestjs,
  python,
  claudeEcosystem,
  llmEngineering,
  jest,
  reactTestingLibrary,
  vitest,
  playwright,
  javascriptPuzzles,
  zustand,
  es2026,
  typescript7,
  aws,
  devops,
  tanstackStart,
  cypress,
  agenticAi,
  platformEngineering,
  awsAi,
  dataEngineering,
  cybersecurity,
  redux,
  reduxToolkit,
  nextjsHooks,
  reactHooks,
];
