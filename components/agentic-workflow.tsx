"use client";
import { AccordionChevron, AccordionSummary } from "@/components/ui/accordion-chevron";

import { useState, useMemo, useCallback, type CSSProperties } from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, ChevronLeft, ChevronRight, ChevronDown, Search, X, SlidersHorizontal, RotateCcw, Code2, Terminal, ArrowRight, Check, Copy, Layers, Bot, Workflow, Binary, Database, CheckCircle2, FileCode2, ArrowUpRight, MessageCircle, GraduationCap } from "lucide-react";
import { WORKFLOW_USECASES, WORKFLOW_CATEGORIES, getWorkflowFrameworkLearnings, workflowFolder, type WorkflowUsecase } from "@/lib/workflow-usecases";
import type { AnswerFile } from "@/lib/pro-learn/types";
import { CodeFiles } from "./code-files";
import { WorkflowBuildGuide } from "./workflow-build-guide";
import { Pager } from "./pager";
import { CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

import styles from "./official-docs.module.css";
import readerStyles from "./official-docs-reader.module.css";
import cardStyles from "./official-docs-cards.module.css";
import mechStyles from "./agentic-workflow.module.css";
import apiStyles from "./api-docs.module.css";
import { LearningPicture } from "./learning-picture";
import { learningImageUrl } from "@/lib/learning-image";

export const CARDS_PER_PAGE = 4;
export const CATEGORIES_PER_PAGE = 3;

/**
 * Pastel tone washes matching the Official Docs and On The Go palettes.
 */
export const CARD_TONES = [
  { bg: "#fbeee6", ink: "#9a4a2c" },
  { bg: "#eaf1e6", ink: "#5f6f45" },
  { bg: "#e6f0f7", ink: "#2f5f82" },
  { bg: "#efeaf7", ink: "#5e4a8f" },
  { bg: "#fbf3dc", ink: "#7a5d10" },
  { bg: "#f8e8ec", ink: "#8f3a55" },
  { bg: "#e3f3ef", ink: "#26695a" },
  { bg: "#f3ede3", ink: "#6b5536" },
  { bg: "#e8ebf8", ink: "#3f4c93" },
  { bg: "#e2f1f4", ink: "#1f6474" },
  { bg: "#f5e9f5", ink: "#7b3f7b" },
  { bg: "#eff1e0", ink: "#5b6320" },
] as const;

export const toneStyle = (tone: number): CSSProperties =>
  ({
    "--tone": CARD_TONES[tone % CARD_TONES.length].bg,
    "--tone-ink": CARD_TONES[tone % CARD_TONES.length].ink,
  } as CSSProperties);

export const CATEGORY_CONFIG: Record<
  string,
  {
    bg: string;
    ink: string;
    border: string;
    icon: typeof Workflow;
  }
> = {
  All: {
    bg: "#f6f4ee",
    ink: "#4a483f",
    border: "#dedad0",
    icon: Workflow,
  },
  "Single Agent & HITL": {
    bg: "#e8f5f1",
    ink: "#286b58",
    border: "#9ac7b8",
    icon: Bot,
  },
  "Multi-Agent Squad": {
    bg: "#efeaf7",
    ink: "#4e357d",
    border: "#d5c7ea",
    icon: Layers,
  },
  "Plan & Execute": {
    bg: "#e6f0f7",
    ink: "#1d4f73",
    border: "#bdd7eb",
    icon: Binary,
  },
  "Structured Extraction": {
    bg: "#fbf3dc",
    ink: "#6e4f07",
    border: "#eed89d",
    icon: Database,
  },
  "Adversarial Debate": {
    bg: "#f8e8ec",
    ink: "#7c2640",
    border: "#ebbac7",
    icon: CheckCircle2,
  },
  "Code Generation & Sandbox": {
    bg: "#e3f3ef",
    ink: "#26695a",
    border: "#98d5c5",
    icon: Code2,
  },
  "SRE & Incident Ops": {
    bg: "#fbeee6",
    ink: "#9a4a2c",
    border: "#f4cbb8",
    icon: Terminal,
  },
  "Adaptive RAG & Memory": {
    bg: "#efeaf7",
    ink: "#5e4a8f",
    border: "#d5c7ea",
    icon: Bot,
  },
  "Enterprise Compliance": {
    bg: "#fbf3dc",
    ink: "#7a5d10",
    border: "#eed89d",
    icon: ShieldCheck,
  },
  "Market Intelligence": {
    bg: "#e6f0f7",
    ink: "#2f5f82",
    border: "#bdd7eb",
    icon: Binary,
  },
};

const REFERENCE_CATEGORIES = WORKFLOW_CATEGORIES.filter((cat) => cat !== "All");




function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className={cardStyles.rating}>
      <span aria-hidden="true">
        {"★".repeat(level)}
        {"☆".repeat(3 - level)}
      </span>
      Difficulty: {level}/3 · {level === 1 ? "Recall" : level === 2 ? "Explain" : "Apply"}
    </span>
  );
}

/**
 * Top Reader Component matching OfficialDocsReader and OfficialDocsLearning
 */
function WorkflowStudioReader({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const workflow =
    WORKFLOW_USECASES.find((item) => item.id === selectedId) ?? WORKFLOW_USECASES[0];
  const selectedCategoryIndex = Math.max(
    0,
    REFERENCE_CATEGORIES.findIndex((category) => category === workflow.category)
  );
  const categoryPage = Math.floor(selectedCategoryIndex / CATEGORIES_PER_PAGE);
  const pageCount = Math.ceil(REFERENCE_CATEGORIES.length / CATEGORIES_PER_PAGE);
  const categories = REFERENCE_CATEGORIES.slice(
    categoryPage * CATEGORIES_PER_PAGE,
    (categoryPage + 1) * CATEGORIES_PER_PAGE
  );

  const [copiedTerminalIndex, setCopiedTerminalIndex] = useState<number | null>(null);

  function selectCategory(index: number) {
    const firstDoc = WORKFLOW_USECASES.find(
      (item) => item.category === REFERENCE_CATEGORIES[index]
    );
    if (firstDoc) onSelect(firstDoc.id);
  }

  const codeFiles: AnswerFile[] = useMemo(
    () =>
      workflow.files.map((file) => ({
        path: `${workflowFolder(workflow)}/${file.filename}`,
        code: file.code,
        note: file.description,
      })),
    [workflow]
  );

  const prefix = `workflow-${workflow.id}`;

  return (
    <>
      <section
        id="official-website-reader"
        className={apiStyles.agenticShowcase}
        aria-labelledby="workflow-reader-heading"
        tabIndex={-1}
        style={{ margin: "0 0 24px" }}
      >
        <div className={apiStyles.agenticShowcaseHeader}>
          <div className={apiStyles.agenticTitleWrap}>
            <span className={apiStyles.agenticSparkleBadge} aria-hidden="true">
              <Sparkles size={15} />
            </span>
            <h2 id="workflow-reader-heading" className={apiStyles.agenticTitle}>
              Official workflow reader
            </h2>
            <Badge variant="secondary" className={apiStyles.agenticBadge}>
              Official Documentation
            </Badge>
          </div>
          <p className={apiStyles.agenticSubtitle}>
            Choose an agentic topology to study its runtime architecture, code files, and verification steps.
          </p>
        </div>

        {/* Categories Grid matching API Docs agenticGrid */}
        <div style={{ marginTop: "16px" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Workflow Categories
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Previous workflow categories"
                disabled={categoryPage === 0}
                onClick={() => selectCategory((categoryPage - 1) * CATEGORIES_PER_PAGE)}
                className="h-6 w-6"
              >
                <ChevronLeft size={13} aria-hidden="true" />
              </Button>
              <span className="text-[11px] text-muted-foreground font-mono" aria-live="polite">
                {categoryPage + 1} / {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Next workflow categories"
                disabled={categoryPage === pageCount - 1}
                onClick={() => selectCategory((categoryPage + 1) * CATEGORIES_PER_PAGE)}
                className="h-6 w-6"
              >
                <ChevronRight size={13} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className={apiStyles.agenticGrid} role="tablist" aria-label="Workflow categories">
            {categories.map((category, index) => {
              const actualIndex = categoryPage * CATEGORIES_PER_PAGE + index;
              const count = WORKFLOW_USECASES.filter((item) => item.category === category).length;
              const isSelected = category === workflow.category;
              const meta = CATEGORY_CONFIG[category];
              const CatIcon = meta?.icon ?? Workflow;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  id={`reference-tab-${actualIndex}`}
                  aria-selected={isSelected}
                  aria-controls="reference-technologies"
                  tabIndex={isSelected ? 0 : -1}
                  className={`${apiStyles.agenticCard} ${
                    isSelected ? apiStyles.agenticCardActive : ""
                  }`}
                  onClick={() => selectCategory(actualIndex)}
                  title={`Filter to ${category} (${count} topologies)`}
                >
                  <span className={apiStyles.agenticCardIcon} aria-hidden="true">
                    <CatIcon size={16} />
                  </span>
                  <div className={apiStyles.agenticCardBody}>
                    <span className={apiStyles.agenticCardName}>{category}</span>
                    <span className={apiStyles.agenticCardCount}>
                      {count} {count === 1 ? "topology" : "topologies"}
                    </span>
                  </div>
                  {isSelected ? (
                    <span className={apiStyles.agenticCardCheck} aria-hidden="true">
                      <Check size={14} />
                    </span>
                  ) : (
                    <span className={apiStyles.agenticCardArrow} aria-hidden="true">
                      <ChevronDown size={13} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar & Shadcn Select Dropdown matching API Docs filterPanel toolbar */}
        <div className={apiStyles.toolbar} style={{ marginTop: "16px" }}>
          <div className={apiStyles.toolbarPrimaryRow}>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono whitespace-nowrap">
                Topology:
              </span>
              <div className={apiStyles.selectWrapper} style={{ width: "100%", maxWidth: "420px" }}>
                <Layers size={15} className={apiStyles.selectLeftIcon} aria-hidden="true" />
                <Select
                  items={WORKFLOW_USECASES.map((item) => ({ value: item.id, label: item.title }))}
                  value={workflow.id}
                  onValueChange={(val) => {
                    if (val) onSelect(val);
                  }}
                >
                  <SelectTrigger
                    aria-label="Select workflow topology"
                    className={mechStyles.readerTopologySelect}
                  >
                    <SelectValue placeholder="Select workflow topology..." />
                  </SelectTrigger>
                  <SelectContent align="start" className="max-h-[380px] w-[340px] sm:w-[420px]">
                    {WORKFLOW_USECASES.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="py-2 cursor-pointer">
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="font-medium text-foreground">{item.title}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.category} · {item.type === "single" ? "Single-Agent" : "Multi-Agent"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-medium px-2.5 py-1">
                {workflow.category}
              </Badge>
              <Badge
                variant={workflow.type === "single" ? "secondary" : "default"}
                className="text-xs font-medium px-2.5 py-1"
              >
                {workflow.type === "single" ? "Single-Agent Pattern" : "Multi-Agent System"}
              </Badge>
            </div>
          </div>

          {/* In-category advance pills */}
          <div className={apiStyles.toolbarSecondaryRow}>
            <div
              id="reference-technologies"
              className={apiStyles.advanceSearchRow}
              role="tabpanel"
              aria-labelledby={`reference-tab-${selectedCategoryIndex}`}
            >
              <span className={apiStyles.advanceSearchLabel}>Topologies in {workflow.category}:</span>
              {WORKFLOW_USECASES.filter((item) => item.category === workflow.category).map((item) => {
                const isActive = item.id === workflow.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isActive}
                    className={`${apiStyles.advanceSearchPill} ${
                      isActive ? apiStyles.advanceSearchPillActive : ""
                    }`}
                    onClick={() => onSelect(item.id)}
                  >
                    {item.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Reader Detail Top & Learn Links matching API Docs */}
      <div className={apiStyles.detailTop}>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs font-mono font-medium">
            {workflow.category}
          </Badge>
          <Badge
            variant={workflow.type === "single" ? "secondary" : "default"}
            className="text-xs font-medium"
          >
            {workflow.type === "single" ? "Single-Agent Pattern" : "Multi-Agent System"}
          </Badge>
        </div>
        <div className={apiStyles.learnLinks}>
          <Link href="/learning/api-docs" className={apiStyles.officialDocsLink}>
            <FileCode2 size={15} aria-hidden="true" />
            API Reference
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
          <Link href={`/learning/mentors?q=${encodeURIComponent(`Explain ${workflow.title} architecture in LangGraph`)}`}>
            <MessageCircle size={15} />
            Ask the mentor
          </Link>
          <Link href={`/learning/quiz?topic=${encodeURIComponent(workflow.title)}`}>
            <GraduationCap size={15} />
            Quiz me on this
          </Link>
        </div>
      </div>

      <div className={readerStyles.referenceLayout}>
        <div className={readerStyles.articleColumn}>
          <article className={cardStyles.learning} aria-label={`${workflow.title} learning notes`}>
            <header className={cardStyles.header}>
              <h2>{workflow.title}</h2>
              <p>{workflow.subtitle}</p>
            </header>
            <LearningPicture src={learningImageUrl("workflow", [workflow.id])} alt={`Illustration of the ${workflow.title} execution flow`} />

            <nav className={cardStyles.jumpLinks} aria-label={`${workflow.title} learning sections`}>
              <a href={`#${prefix}-key`}>Key information</a>
              <a href={`#${prefix}-concepts`}>Key concepts</a>
              <a href={`#${prefix}-objectives`}>Learning objectives</a>
              <a href={`#${prefix}-learning`}>Key learning contents</a>
              <a href={`#${prefix}-build`}>Step-by-step build</a>
              <a href={`#${prefix}-code`}>Codebase</a>
              <a href={`#${prefix}-terminal`}>Terminal commands</a>
              <a href={`#${prefix}-objective`}>Objective questions</a>
              <a href={`#${prefix}-subjective`}>Subjective questions</a>
            </nav>

            <div className={cardStyles.sections}>
              {/* Section 1: Key Information */}
              <section
                id={`${prefix}-key`}
                className={`${cardStyles.section} ${cardStyles.information}`}
                aria-labelledby={`${prefix}-key-title`}
              >
                <h3 id={`${prefix}-key-title`}>Key information</h3>
                <ul className={cardStyles.points}>
                  {workflow.keyPoints.map((point, pIdx) => (
                    <li key={pIdx}>
                      <strong>{point}</strong>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 2: Key Concepts */}
              <section
                id={`${prefix}-concepts`}
                className={`${cardStyles.section} ${cardStyles.concepts}`}
                aria-labelledby={`${prefix}-concepts-title`}
              >
                <h3 id={`${prefix}-concepts-title`}>Key concepts</h3>
                <dl className={cardStyles.conceptList}>
                  {workflow.keyConcepts.map((concept) => (
                    <div key={concept.title}>
                      <dt>
                        <mark>{concept.title}</mark>
                      </dt>
                      <dd>{concept.description}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* Section 3: Learning Objectives */}
              <section
                id={`${prefix}-objectives`}
                className={`${cardStyles.section} ${cardStyles.objectives}`}
                aria-labelledby={`${prefix}-objectives-title`}
              >
                <h3 id={`${prefix}-objectives-title`}>Learning objectives</h3>
                <p className={cardStyles.sectionNote}>
                  After studying this workflow architecture, you should be able to:
                </p>
                <ul className={cardStyles.points}>
                  {workflow.learningObjectives.map((obj, oIdx) => (
                    <li key={oIdx}>{obj}</li>
                  ))}
                </ul>
              </section>

              {/* Section 4: Key Learning Contents strictly focused on LangChain, LangGraph, and LangSmith */}
              <section
                id={`${prefix}-learning`}
                className={`${cardStyles.section} ${cardStyles.contents}`}
                aria-labelledby={`${prefix}-learning-title`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <h3 id={`${prefix}-learning-title`} style={{ margin: 0 }}>Key learning contents</h3>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "#fbeee6", color: "#9a4a2c", border: "1px solid #f0ddd0" }}>
                      LangChain v0.3+
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "#eaf5ed", color: "#2f6f47", border: "1px solid #d4e8da" }}>
                      LangGraph v0.2+
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "#e6f0fa", color: "#2b5680", border: "1px solid #d4e3f2" }}>
                      LangSmith v0.2+
                    </span>
                  </div>
                </div>
                <p className={cardStyles.sectionNote}>
                  Core architectural invariants, runtime primitives, and evaluation mechanics strictly for <strong>LangChain</strong>, <strong>LangGraph</strong>, and <strong>LangSmith</strong> in this topology.
                </p>

                {(() => {
                  const learnings = getWorkflowFrameworkLearnings(workflow);
                  return (
                    <div className={mechStyles.frameworkLearningsGrid}>
                      {/* LangChain v0.3+ Card */}
                      <div className={mechStyles.frameworkLearningCard} data-framework="langchain">
                        <div className={mechStyles.frameworkHeader}>
                          <span className={mechStyles.frameworkBadge}>{learnings.langchain.badge}</span>
                          <span className={mechStyles.frameworkRole}>{learnings.langchain.role}</span>
                        </div>
                        <div className={mechStyles.frameworkPrimitives}>
                          {learnings.langchain.primitives.map((prim) => (
                            <span key={prim} className={mechStyles.frameworkPrimitivePill}>
                              {prim}
                            </span>
                          ))}
                        </div>
                        <div className={mechStyles.frameworkTakeawayBlock}>
                          <span className={mechStyles.frameworkTakeawayLabel}>How It Works</span>
                          <p className={mechStyles.frameworkTakeawayText}>{learnings.langchain.howItWorks}</p>
                        </div>
                        <div className={`${mechStyles.frameworkCallout} ${mechStyles.frameworkBestPractice}`}>
                          <strong>Remember:</strong> {learnings.langchain.bestPractice}
                        </div>
                        <div className={`${mechStyles.frameworkCallout} ${mechStyles.frameworkWatchOut}`}>
                          <strong>Watch out:</strong> {learnings.langchain.watchOut}
                        </div>
                      </div>

                      {/* LangGraph v0.2+ Card */}
                      <div className={mechStyles.frameworkLearningCard} data-framework="langgraph">
                        <div className={mechStyles.frameworkHeader}>
                          <span className={mechStyles.frameworkBadge}>{learnings.langgraph.badge}</span>
                          <span className={mechStyles.frameworkRole}>{learnings.langgraph.role}</span>
                        </div>
                        <div className={mechStyles.frameworkPrimitives}>
                          {learnings.langgraph.primitives.map((prim) => (
                            <span key={prim} className={mechStyles.frameworkPrimitivePill}>
                              {prim}
                            </span>
                          ))}
                        </div>
                        <div className={mechStyles.frameworkTakeawayBlock}>
                          <span className={mechStyles.frameworkTakeawayLabel}>How It Works</span>
                          <p className={mechStyles.frameworkTakeawayText}>{learnings.langgraph.howItWorks}</p>
                        </div>
                        <div className={`${mechStyles.frameworkCallout} ${mechStyles.frameworkBestPractice}`}>
                          <strong>Remember:</strong> {learnings.langgraph.bestPractice}
                        </div>
                        <div className={`${mechStyles.frameworkCallout} ${mechStyles.frameworkWatchOut}`}>
                          <strong>Watch out:</strong> {learnings.langgraph.watchOut}
                        </div>
                      </div>

                      {/* LangSmith v0.2+ Card */}
                      <div className={mechStyles.frameworkLearningCard} data-framework="langsmith">
                        <div className={mechStyles.frameworkHeader}>
                          <span className={mechStyles.frameworkBadge}>{learnings.langsmith.badge}</span>
                          <span className={mechStyles.frameworkRole}>{learnings.langsmith.role}</span>
                        </div>
                        <div className={mechStyles.frameworkPrimitives}>
                          {learnings.langsmith.primitives.map((prim) => (
                            <span key={prim} className={mechStyles.frameworkPrimitivePill}>
                              {prim}
                            </span>
                          ))}
                        </div>
                        <div className={mechStyles.frameworkTakeawayBlock}>
                          <span className={mechStyles.frameworkTakeawayLabel}>How It Works</span>
                          <p className={mechStyles.frameworkTakeawayText}>{learnings.langsmith.howItWorks}</p>
                        </div>
                        <div className={`${mechStyles.frameworkCallout} ${mechStyles.frameworkBestPractice}`}>
                          <strong>Remember:</strong> {learnings.langsmith.bestPractice}
                        </div>
                        <div className={`${mechStyles.frameworkCallout} ${mechStyles.frameworkWatchOut}`}>
                          <strong>Watch out:</strong> {learnings.langsmith.watchOut}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* Section 5: Step-by-step build walkthrough */}
              <section
                id={`${prefix}-build`}
                className={`${cardStyles.section} ${cardStyles.contents}`}
                aria-labelledby={`${prefix}-build-title`}
              >
                <h3 id={`${prefix}-build-title`}>Step-by-step build</h3>
                <p className={cardStyles.sectionNote}>
                  Build {workflow.type === "single" ? "this single agent" : "this multi-agent system"} from an empty folder. Each step adds one
                  file or command, explains why it exists, and tells you what you should see before moving on.
                </p>
                <WorkflowBuildGuide key={workflow.id} workflow={workflow} headingId={`${prefix}-build-title`} />
              </section>

              {/* Section 5: Codebase with CodeFiles */}
              <section
                id={`${prefix}-code`}
                className={`${cardStyles.section} ${cardStyles.codeSection}`}
                aria-labelledby={`${prefix}-code-title`}
              >
                <h3 id={`${prefix}-code-title`}>Codebase</h3>
                <p className={cardStyles.sectionNote}>
                  Complete multi-file codebase for {workflow.title}. Save these files in your project directory
                  and follow the Terminal commands below to execute and verify.
                </p>
                <CodeFiles
                  skin="apple"
                  files={codeFiles}
                  label={`${workflow.title} codebase`}
                  hoverComments
                  includeConfigTabs
                  explainFormatting={false}
                  className={cardStyles.projectEditor}
                />
              </section>

              {/* Section 7: Terminal commands */}
              <section
                id={`${prefix}-terminal`}
                className={`${cardStyles.section} ${cardStyles.terminalSection}`}
                aria-labelledby={`${prefix}-terminal-title`}
              >
                <h3 id={`${prefix}-terminal-title`}>Terminal commands</h3>
                <p className={cardStyles.sectionNote}>
                  Save the files at their displayed paths, then run these steps from the project folder in order.
                </p>
                <h4>Before you start</h4>
                <ul className={cardStyles.points}>
                  {workflow.prerequisites.map((pre, pIdx) => (
                    <li key={pIdx}>{pre}</li>
                  ))}
                </ul>

                <div className={cardStyles.terminalWindow}>
                  <div className={cardStyles.windowBar}>
                    <span className={cardStyles.trafficLights} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <Terminal size={14} aria-hidden="true" /> Terminal
                  </div>
                  <ol className={cardStyles.commands}>
                    {workflow.terminalCommands.map((item, index) => (
                      <li key={index}>
                        <p>
                          <strong>{item.label}</strong>
                        </p>
                        <div className={cardStyles.commandRow}>
                          <pre tabIndex={0}>
                            <code>{item.command}</code>
                          </pre>
                          <button
                            type="button"
                            aria-label={`Copy command ${index + 1}`}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(item.command);
                                setCopiedTerminalIndex(index);
                                setTimeout(() => setCopiedTerminalIndex(null), 2000);
                              } catch {}
                            }}
                          >
                            {copiedTerminalIndex === index ? (
                              <Check size={14} aria-hidden="true" />
                            ) : (
                              <Copy size={14} aria-hidden="true" />
                            )}
                            {copiedTerminalIndex === index ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <h4>Check the result</h4>
                <ul className={cardStyles.points}>
                  {workflow.verify.map((ver, vIdx) => (
                    <li key={vIdx}>{ver}</li>
                  ))}
                </ul>
              </section>

              {/* Section 8: Objective Questions */}
              <section
                id={`${prefix}-objective`}
                className={`${cardStyles.section} ${cardStyles.objective}`}
                aria-labelledby={`${prefix}-objective-title`}
              >
                <h3 id={`${prefix}-objective-title`}>Objective questions</h3>
                <p className={cardStyles.sectionNote}>
                  Identify the concept. Each question has one correct answer.
                </p>
                {workflow.objectiveQuestions.map((q, index) => (
                  <div key={index} className={cardStyles.question}>
                    <Difficulty level={1} />
                    <h4>
                      {index + 1}. {q.question}
                    </h4>
                    <ol type="A" className={cardStyles.options}>
                      {q.options.map((opt, oIdx) => (
                        <li key={oIdx}>{opt}</li>
                      ))}
                    </ol>
                    <details className={cardStyles.answer}>
                      <AccordionSummary>Show answer {index + 1}</AccordionSummary>
                      <p>
                        <strong>Answer:</strong> <mark>{q.answer}</mark>
                      </p>
                      <p style={{ marginTop: "6px" }}>{q.explanation}</p>
                    </details>
                  </div>
                ))}
              </section>

              {/* Section 9: Subjective Questions */}
              <section
                id={`${prefix}-subjective`}
                className={`${cardStyles.section} ${cardStyles.subjective}`}
                aria-labelledby={`${prefix}-subjective-title`}
              >
                <h3 id={`${prefix}-subjective-title`}>Subjective questions</h3>
                <p className={cardStyles.sectionNote}>
                  Explain in your own words, then compare with the model answer. Ratings indicate study difficulty.
                </p>
                {workflow.subjectiveQuestions.map((sq, index) => (
                  <div key={index} className={cardStyles.question}>
                    <Difficulty level={sq.difficulty} />
                    <h4>
                      {index + 1}. {sq.question}
                    </h4>
                    <details className={cardStyles.answer}>
                      <AccordionSummary>Show model answer</AccordionSummary>
                      <p>{sq.answer}</p>
                    </details>
                  </div>
                ))}
              </section>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}

/**
 * Main Workflow Dashboard Component matching Official Docs
 */
export function AgenticWorkflowDashboard() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    WORKFLOW_USECASES[0]?.id ?? "customer-support-human-in-the-loop"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [categoryPage, setCategoryPage] = useState<number>(0);
  const [isExpandedCategories, setIsExpandedCategories] = useState<boolean>(false);
  const [advanced, setAdvanced] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"default" | "name" | "files" | "multi" | "single">("default");
  const [agentTypeFilter, setAgentTypeFilter] = useState<"all" | "single" | "multi">("all");
  const [requireHitl, setRequireHitl] = useState<boolean>(false);
  const [requireEval, setRequireEval] = useState<boolean>(false);
  const [requireSandbox, setRequireSandbox] = useState<boolean>(false);
  const [selectedModalDoc, setSelectedModalDoc] = useState<WorkflowUsecase | null>(null);
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);

  const singleAgentCount = useMemo(
    () => WORKFLOW_USECASES.filter((u) => u.type === "single").length,
    []
  );
  const multiAgentCount = useMemo(
    () => WORKFLOW_USECASES.filter((u) => u.type === "multi").length,
    []
  );

  // Compute live count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: WORKFLOW_USECASES.length };
    for (const wf of WORKFLOW_USECASES) {
      counts[wf.category] = (counts[wf.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Filtered & sorted workflows
  const filteredWorkflows = useMemo(() => {
    let list = WORKFLOW_USECASES.filter((wf) => {
      const matchesCategory = selectedCategory === "All" || wf.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        wf.title.toLowerCase().includes(query) ||
        wf.subtitle.toLowerCase().includes(query) ||
        wf.architectureOverview.toLowerCase().includes(query) ||
        wf.tags.some((t) => t.toLowerCase().includes(query)) ||
        wf.keyHighlights.some((h) => h.toLowerCase().includes(query));

      if (!matchesCategory || !matchesQuery) return false;
      if (agentTypeFilter === "single" && wf.type !== "single") return false;
      if (agentTypeFilter === "multi" && wf.type !== "multi") return false;
      if (requireHitl && !wf.tags.includes("Human-in-the-Loop")) return false;
      if (requireSandbox && !wf.tags.includes("Deep Agents Sandbox")) return false;
      if (requireEval && !wf.files.some((f) => f.filename === "eval.py")) return false;
      return true;
    });

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "files") {
      list = [...list].sort((a, b) => b.files.length - a.files.length);
    } else if (sortBy === "multi") {
      list = [...list].sort((a, b) => (b.type === "multi" ? 1 : 0) - (a.type === "multi" ? 1 : 0));
    } else if (sortBy === "single") {
      list = [...list].sort((a, b) => (b.type === "single" ? 1 : 0) - (a.type === "single" ? 1 : 0));
    }

    return list;
  }, [selectedCategory, searchQuery, agentTypeFilter, sortBy, requireHitl, requireSandbox, requireEval]);

  const totalPages = Math.ceil(filteredWorkflows.length / CARDS_PER_PAGE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  const TABS_PER_PAGE = 4;
  const categoryTabPages = Math.max(1, Math.ceil(REFERENCE_CATEGORIES.length / TABS_PER_PAGE));
  const currentCategoryTabPage = Math.min(categoryPage, categoryTabPages - 1);
  const visibleCategories = isExpandedCategories
    ? REFERENCE_CATEGORIES
    : REFERENCE_CATEGORIES.slice(
        currentCategoryTabPage * TABS_PER_PAGE,
        currentCategoryTabPage * TABS_PER_PAGE + TABS_PER_PAGE
      );

  const handleSelectWorkflow = useCallback((id: string) => {
    setSelectedWorkflowId(id);
    const element = document.getElementById("official-website-reader");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
    setAgentTypeFilter("all");
    setSortBy("default");
    setRequireHitl(false);
    setRequireSandbox(false);
    setRequireEval(false);
    setPage(0);
    setCategoryPage(0);
  }, []);

  const startIndex = safePage * CARDS_PER_PAGE;
  const endIndex = Math.min(startIndex + CARDS_PER_PAGE, filteredWorkflows.length);
  const displayedWorkflows = filteredWorkflows.slice(startIndex, endIndex);

  return (
    <div className={styles.page}>
      {/* Header matching Official Docs */}
      <header className={styles.head}>
        <div className={styles.eyebrow}>
          <Sparkles size={13} aria-hidden="true" />
          <span>Agentic AI Architecture &amp; Runtime Systems</span>
        </div>
        <div className={styles.headTitleRow}>
          <div>
            <h1 className={styles.heading}>Agentic Workflow Architecture &amp; Runtime Systems</h1>
            <p className={styles.subheading}>
              Definitive technical specification and execution mechanics for stateful Single-Agent and Multi-Agent topologies. Built on modern{" "}
              <strong>LangChain v0.3+</strong>, <strong>LangGraph v0.2+</strong>, and <strong>LangSmith v0.2+</strong> runtime primitives.
            </p>
          </div>
          <div className={styles.badgeRow}>
            <span className={styles.verifiedBadge}>
              <ShieldCheck size={14} aria-hidden="true" />
              LangChain v0.3+ / LangGraph v0.2+ / LangSmith v0.2+ Specification
            </span>
          </div>
        </div>
      </header>

      {/* Top Reader matching OfficialDocsReader */}
      <WorkflowStudioReader
        selectedId={selectedWorkflowId}
        onSelect={setSelectedWorkflowId}
      />

      {/* Catalog & Search Section matching OfficialDocs catalog */}
      <section
        id="documentation-catalog"
        className={styles.panel}
        aria-label="Search and filter workflow topologies"
      >
        <div className={styles.catalogHeadingRow}>
          <div className={styles.catalogHeading}>
            <h2>Production Agentic Workflows &amp; Multi-File Topologies</h2>
            <p>Find your next single-agent or multi-agent architecture.</p>
          </div>
          <button
            type="button"
            className={styles.complexFilter}
            aria-pressed={sortBy === "multi"}
            onClick={() => {
              setSortBy((v) => (v === "multi" ? "default" : "multi"));
              setPage(0);
            }}
          >
            <Code2 size={15} aria-hidden="true" /> Multi-Agent Squads{" "}
            <span>{WORKFLOW_USECASES.filter((u) => u.type === "multi").length}</span>
          </button>
        </div>

        {/* Agent Type Tabs: Single Agent vs Multi Agents */}
        <div className={mechStyles.agentTypeSection}>
          <div
            className={mechStyles.agentTypeTabs}
            role="tablist"
            aria-label="Filter topologies by agent type"
          >
            <button
              type="button"
              role="tab"
              id="agent-type-tab-all"
              aria-controls="documentation-catalog"
              aria-selected={agentTypeFilter === "all"}
              className={`${mechStyles.agentTypeTab} ${
                agentTypeFilter === "all" ? mechStyles.agentTypeTabActive : ""
              }`}
              onClick={() => {
                setAgentTypeFilter("all");
                setPage(0);
              }}
            >
              <Workflow size={15} aria-hidden="true" />
              <span>All Topologies</span>
              <span className={mechStyles.agentTypeCount}>{WORKFLOW_USECASES.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              id="agent-type-tab-single"
              aria-controls="documentation-catalog"
              aria-selected={agentTypeFilter === "single"}
              className={`${mechStyles.agentTypeTab} ${
                agentTypeFilter === "single" ? mechStyles.agentTypeTabActive : ""
              }`}
              onClick={() => {
                setAgentTypeFilter("single");
                setPage(0);
              }}
            >
              <Bot size={15} aria-hidden="true" />
              <span>Single Agent Workflows</span>
              <span className={mechStyles.agentTypeCount}>{singleAgentCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              id="agent-type-tab-multi"
              aria-controls="documentation-catalog"
              aria-selected={agentTypeFilter === "multi"}
              className={`${mechStyles.agentTypeTab} ${
                agentTypeFilter === "multi" ? mechStyles.agentTypeTabActive : ""
              }`}
              onClick={() => {
                setAgentTypeFilter("multi");
                setPage(0);
              }}
            >
              <Layers size={15} aria-hidden="true" />
              <span>Multi Agents Workflows</span>
              <span className={mechStyles.agentTypeCount}>{multiAgentCount}</span>
            </button>
          </div>
        </div>

        {/* Search Row */}
        <div className={styles.searchRow}>
          <div className={styles.field}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              placeholder={`Search ${WORKFLOW_USECASES.length} workflow topologies...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
              aria-label="Search workflows"
            />
            <div className={styles.searchActions}>
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className={styles.clearSearchBtn}
                  onClick={() => handleSearchChange("")}
                  aria-label="Clear search query"
                >
                  <X size={13} aria-hidden="true" />
                  <span>Clear</span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdvanced((v) => !v)}
                className={`${styles.advancedToggleBtn} ${advanced ? styles.advancedToggleActive : ""}`}
                aria-expanded={advanced}
                aria-controls="advanced-filter-panel"
                aria-label="Toggle advanced filters"
              >
                <SlidersHorizontal size={13} aria-hidden="true" />
                <span>Filters</span>
                <AccordionChevron />
              </Button>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {advanced && (
          <div id="advanced-filter-panel" className={styles.advancedDrawer}>
            <div className={styles.advancedHeader}>
              <span className={styles.advancedTitle}>
                <SlidersHorizontal size={13} aria-hidden="true" />
                Advanced Filtering &amp; Sorting
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={resetAllFilters}
                className={styles.resetFiltersBtn}
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset Filters
              </Button>
            </div>

            <div className={styles.advancedGrid}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Sort Order</span>
                <div className={styles.filterPills}>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "default" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("default")}
                  >
                    Verified Order
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "name" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("name")}
                  >
                    Alphabetical (A–Z)
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "files" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("files")}
                  >
                    Most Files
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "multi" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("multi")}
                  >
                    Multi-Agent First
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${sortBy === "single" ? styles.filterSubPillActive : ""}`}
                    onClick={() => setSortBy("single")}
                  >
                    Single-Agent First
                  </button>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Required Capabilities</span>
                <div className={styles.filterPills}>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${requireHitl ? styles.filterSubPillActive : ""}`}
                    onClick={() => setRequireHitl((v) => !v)}
                  >
                    Human-in-the-Loop
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${requireSandbox ? styles.filterSubPillActive : ""}`}
                    onClick={() => setRequireSandbox((v) => !v)}
                  >
                    Deep Agents Sandbox
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterSubPill} ${requireEval ? styles.filterSubPillActive : ""}`}
                    onClick={() => setRequireEval((v) => !v)}
                  >
                    LangSmith Evals (eval.py)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Toolbar with Pagination & Light Color Pills */}
        <div className={styles.categoryToolbar}>
          <div className={styles.categoryNavLeft} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div className={`${styles.categoryPillsWrap} ${isExpandedCategories ? styles.categoryPillsExpanded : ""}`} style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: isExpandedCategories ? "wrap" : "nowrap", overflowX: "auto" }}>
              {/* Pinned "All" Pill */}
              {(() => {
                const isSelected = selectedCategory === "All";
                const count = categoryCounts["All"] || 0;
                const catCfg = CATEGORY_CONFIG["All"];
                const CatIcon = catCfg.icon;
                const catStyle: CSSProperties = {
                  "--cat-bg": catCfg.bg,
                  "--cat-ink": catCfg.ink,
                  "--cat-border": catCfg.border,
                } as CSSProperties;
                return (
                  <button
                    key="All"
                    type="button"
                    style={catStyle}
                    className={`${styles.categoryPill} ${isSelected ? styles.categoryPillActive : ""}`}
                    onClick={() => {
                      setSelectedCategory("All");
                      setPage(0);
                    }}
                  >
                    <CatIcon size={14} aria-hidden="true" />
                    <span>All</span>
                    <span className={styles.catCountBadge}>{count}</span>
                  </button>
                );
              })()}

              {/* Dynamic Category Tabs */}
              {visibleCategories.map((category) => {
                const isSelected = selectedCategory === category;
                const count = categoryCounts[category] || 0;
                const catCfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["All"];
                const CatIcon = catCfg.icon;

                const catStyle: CSSProperties = {
                  "--cat-bg": catCfg.bg,
                  "--cat-ink": catCfg.ink,
                  "--cat-border": catCfg.border,
                } as CSSProperties;

                return (
                  <button
                    key={category}
                    type="button"
                    style={catStyle}
                    className={`${styles.categoryPill} ${isSelected ? styles.categoryPillActive : ""}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setPage(0);
                    }}
                  >
                    <CatIcon size={14} aria-hidden="true" />
                    <span>{category}</span>
                    <span className={styles.catCountBadge}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Tab Pagination Nav matching Search Page */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
              {!isExpandedCategories && categoryTabPages > 1 && (
                <div className={mechStyles.tabsNav}>
                  <button
                    type="button"
                    className={mechStyles.tabsStep}
                    aria-label="Previous categories"
                    disabled={currentCategoryTabPage === 0}
                    onClick={() => setCategoryPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                  </button>
                  <span className={mechStyles.tabsOf}>
                    {currentCategoryTabPage + 1}/{categoryTabPages}
                  </span>
                  <button
                    type="button"
                    className={mechStyles.tabsStep}
                    aria-label="More categories"
                    disabled={currentCategoryTabPage === categoryTabPages - 1}
                    onClick={() => setCategoryPage((p) => Math.min(categoryTabPages - 1, p + 1))}
                  >
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                style={{ fontSize: "11.5px", height: "32px", color: "var(--muted)" }}
                onClick={() => setIsExpandedCategories((v) => !v)}
              >
                {isExpandedCategories ? "Page categories" : "View all categories"}
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Meta Row */}
        <div className={styles.filterMetaRow}>
          <span className={styles.countText}>
            Showing {filteredWorkflows.length} {filteredWorkflows.length === 1 ? "topology" : "topologies"}
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
            {totalPages > 1 && ` (Page ${safePage + 1} of ${totalPages})`}
          </span>

          {totalPages > 1 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={13} aria-hidden="true" />
                Prev
              </Button>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", padding: "0 4px" }}>
                {safePage + 1} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={safePage === totalPages - 1}
                onClick={() => setPage(safePage + 1)}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={13} aria-hidden="true" />
              </Button>
            </div>
          )}

          {searchQuery && (
            <span className={styles.queryIndicator}>
              Filter: &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        {/* Cards Grid matching Official Docs */}
        {filteredWorkflows.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={32} className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>No matching topologies found</p>
            <p className={styles.emptyText}>
              Try adjusting your search query or reset your filters.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={resetAllFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {displayedWorkflows.map((wf, idx) => {
              const toneIndex = idx % CARD_TONES.length;
              return (
                <div
                  key={wf.id}
                  className={styles.card}
                  style={toneStyle(toneIndex)}
                  onClick={() => setSelectedModalDoc(wf)}
                >
                  <LearningPicture variant="card" className={mechStyles.cardPicture} src={learningImageUrl("workflow", [wf.id])} alt={`Illustration of the ${wf.title} execution flow`} />
                  <CardHeader style={{ padding: "0 18px", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className={styles.cardKeyPointBadge}>
                        {wf.badge}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--tone-ink)" }}>
                        {wf.files.length} files
                      </span>
                    </div>
                    <h3 style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 650, color: "var(--ink)", lineHeight: 1.3 }}>
                      {wf.title}
                    </h3>
                  </CardHeader>

                  <CardContent style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.5, color: "var(--muted)" }}>
                      {wf.subtitle}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {wf.keyPoints.slice(0, 2).map((kp, kIdx) => (
                        <div key={kIdx} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                          <Check size={13} style={{ color: "var(--tone-ink)", flexShrink: 0, marginTop: "2px" }} />
                          <span style={{ fontSize: "11.5px", lineHeight: 1.45, color: "#3b3a36" }}>
                            {kp}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className={styles.cardFoot} style={{ padding: "12px 18px 0" }}>
                    <button
                      type="button"
                      className={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectWorkflow(wf.id);
                      }}
                      title="Study complete learning guide"
                    >
                      <span>Study Guide</span>
                      <ArrowRight size={13} className={styles.arrowIcon} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className={styles.cardExtLink}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await navigator.clipboard.writeText(wf.runCommand);
                          setCopiedCommandId(wf.id);
                          setTimeout(() => setCopiedCommandId(null), 2000);
                        } catch {}
                      }}
                      title={`Copy execution command: ${wf.runCommand}`}
                    >
                      {copiedCommandId === wf.id ? (
                        <Check size={13} style={{ color: "#059669" }} />
                      ) : (
                        <Terminal size={13} />
                      )}
                    </button>
                  </CardFooter>
                </div>
              );
            })}
          </div>
        )}

        {/* Numbered Pagination matching Search Page */}
        <div className={styles.paginationWrapper} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          {totalPages > 1 && (
            <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
              Showing Page {safePage + 1} of {totalPages} ({filteredWorkflows.length} total topologies)
            </div>
          )}
          {totalPages > 1 && (
            <Pager
              page={safePage}
              pages={totalPages}
              onPage={setPage}
              label="Workflow catalog pagination"
            />
          )}
        </div>
      </section>

      {/* Detail Modal Dialog Window matching Official Docs */}
      {selectedModalDoc && (
        <Dialog open={true} onOpenChange={() => setSelectedModalDoc(null)}>
          <DialogContent className={styles.modalContent}>
            <DialogHeader className={styles.modalHeader}>
              <div className={styles.modalBadges}>
                <Badge className={styles.modalCategoryBadge}>{selectedModalDoc.category}</Badge>
                <Badge variant="outline">{selectedModalDoc.type === "single" ? "Single Agent" : "Multi-Agent"}</Badge>
                <Badge variant="secondary">{selectedModalDoc.files.length} Code Files</Badge>
              </div>
              <DialogTitle style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0 2px" }}>
                {selectedModalDoc.title}
              </DialogTitle>
              <DialogDescription style={{ fontSize: "14px", lineHeight: 1.6 }}>
                {selectedModalDoc.subtitle}
              </DialogDescription>
            </DialogHeader>

            <div className={styles.modalBody}>
              <LearningPicture src={learningImageUrl("workflow", [selectedModalDoc.id])} alt={`Illustration of the ${selectedModalDoc.title} execution flow`} />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 650, margin: "0 0 8px" }}>Architecture Overview</h4>
                <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: "#3d3d3a", margin: 0 }}>
                  {selectedModalDoc.architectureOverview}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 650, margin: "0 0 8px" }}>Execution Diagram</h4>
                <div style={{ background: "#f5f4ed", padding: "12px 16px", borderRadius: "10px", fontFamily: "ui-monospace, monospace", fontSize: "12px", lineHeight: 1.7 }}>
                  {selectedModalDoc.diagram.map((step, sIdx) => (
                    <div key={sIdx}>{step}</div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 650, margin: "0 0 8px" }}>Key Highlights</h4>
                <ul className={cardStyles.points}>
                  {selectedModalDoc.keyHighlights.map((hl, hIdx) => (
                    <li key={hIdx}>{hl}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 650, margin: "0 0 8px" }}>Verified Tech Stack</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  {selectedModalDoc.techStack.map((tech) => (
                    <div key={tech.name} style={{ padding: "8px 12px", border: "1px solid #dedcd1", borderRadius: "8px", background: "#ffffff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "12.5px" }}>{tech.name}</strong>
                        <span style={{ fontSize: "11px", color: tech.accent }}>{tech.version}</span>
                      </div>
                      <span style={{ fontSize: "11.5px", color: "#73726c" }}>{tech.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleSelectWorkflow(selectedModalDoc.id);
                    setSelectedModalDoc(null);
                  }}
                >
                  Open in Study Reader
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    const bundle = selectedModalDoc.files
                      .map((f) => `### ${f.filename}\n\`\`\`${f.language}\n${f.code}\n\`\`\``)
                      .join("\n\n");
                    try {
                      await navigator.clipboard.writeText(bundle);
                      setSelectedModalDoc(null);
                    } catch {}
                  }}
                >
                  <Copy size={14} style={{ marginRight: "6px" }} />
                  Copy Full Project ({selectedModalDoc.files.length} Files)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Default export for routing
export default AgenticWorkflowDashboard;
