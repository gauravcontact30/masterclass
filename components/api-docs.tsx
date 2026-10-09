"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Badge as UiBadge } from "@/components/ui/badge";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { vocabularyIcon } from "@/lib/vocabulary-icons";
import { BrandMark, BrandOrGlyph } from "./topic-media";
import { LearningResources } from "./learning-resources";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  Quote,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileCode2,
  Filter,
  GraduationCap,
  Layers,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";
import {
  API_PACKAGES,
  API_STATUSES,
  API_TYPES,
  filterApiPackages,
  javascriptGroup,
  type ApiEntry,
  type ApiPackage,
} from "@/lib/api-docs";
import { API_DETAILS } from "@/lib/api-docs-details";
import { apiDetailSchema, type ContentSource, type GeneratedApiDetail } from "@/lib/pro-learn/types";
import { highlightLines, type CodeLanguage } from "@/lib/code-highlight";
import { codeLineNotes } from "@/lib/code-line-notes";
import { CodeLineComment } from "./code-line-comment";
import styles from "./api-docs.module.css";
import projectStyles from "./api-project.module.css";
import { apiCodeLanguage, enrichApiLearning } from "@/lib/api-learning";
import { ApiProjectWorkspace } from "./api-project-workspace";
import { ApiInterviewPractice } from "./api-interview-practice";
import { referenceErrorMessage } from "@/lib/api-reference-errors";
import { DashboardPageHeader } from "./dashboard-page-header";
import { AiProvenance, AiProviderPicker, useAiProvider } from "./ai-provider-picker";
import { KeyText } from "./key-text";
import { shortDefinition } from "@/lib/notes-study";

export const AGENTIC_FRAMEWORK_ORDER = [
  "deepagents",
  "langchain",
  "langgraph",
  "integrations",
  "langsmith",
] as const;
export const AGENTIC_FRAMEWORK_IDS = new Set<string>(AGENTIC_FRAMEWORK_ORDER);

function Badge({ kind }: { kind: string }) {
  const definition = API_TYPES.find((type) => type.k === kind);
  return (
    <span
      className={styles.badge}
      style={{ background: definition?.c || "#64748b" }}
      aria-hidden="true"
    >
      {kind}
    </span>
  );
}

function ApiCode({ code, language }: { code: string; language: CodeLanguage }) {
  const [copied, setCopied] = useState("");
  const notes = useMemo(() => codeLineNotes(code, "", language), [code, language]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied("Copied");
    } catch {
      setCopied("Select the code to copy manually.");
    }
  }
  return (
    <div className={styles.ide}>
      <div className={styles.ideBar}>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{language}</span>
        <button onClick={() => void copy()} aria-label="Copy code">
          {copied === "Copied" ? <Check size={14} /> : <Copy size={14} />}{" "}
          {copied === "Copied" ? "Copied" : "Copy"}
        </button>
      </div>
      <pre tabIndex={0}>
        <code>
          {highlightLines(code, language).map((line, index) => (
            <span key={index}>
              <span className={styles.gutter} aria-hidden="true">
                {index + 1}
              </span>
              {line.map((token, part) => (
                <span key={part} className={styles[token.tone]}>
                  {token.text}
                </span>
              ))}
              {"\n"}
              <CodeLineComment note={notes[index]} />
            </span>
          ))}
        </code>
      </pre>
      <span className={styles.copyStatus} role="status">
        {copied}
      </span>
    </div>
  );
}

type GeneratedResult = {
  detail: GeneratedApiDetail;
  source: ContentSource;
  reason?: string;
  provider?: string;
  sources?: string[];
};
const DETAIL_CACHE = "masterclass:api-detail:v2";
function readCache(key: string): GeneratedResult | null {
  try {
    const value = JSON.parse(localStorage.getItem(DETAIL_CACHE) || "{}")[key];
    return value?.source === "ai"
      ? { source: "ai", detail: apiDetailSchema.parse(value.detail) }
      : null;
  } catch {
    return null;
  }
}
function writeCache(key: string, value: GeneratedResult) {
  try {
    const all = JSON.parse(localStorage.getItem(DETAIL_CACHE) || "{}");
    all[key] = value;
    const keys = Object.keys(all);
    while (keys.length > 120) delete all[keys.shift()!];
    localStorage.setItem(DETAIL_CACHE, JSON.stringify(all));
  } catch {
    /* Browser storage is an optional speed-up. */
  }
}
/** Loads the in-app reference for identifiers that have no hand-authored page. */
function useGeneratedDetail(
  pkg: ApiPackage,
  entry: ApiEntry,
  curated: boolean,
  provider?: string
) {
  const key = `${pkg.id}:${entry.name}:${provider ?? "default"}`;
  const [state, setState] = useState<{
    key: string;
    status: "loading" | "ready" | "error";
    data?: GeneratedResult;
    error?: string;
  }>({ key, status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (curated) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      const cached = attempt === 0 ? readCache(key) : null;
      if (cached) {
        setState({ key, status: "ready", data: cached });
        return;
      }
      setState({ key, status: "loading" });
      try {
        const response = await fetch("/api/pro-learn/api-detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packageId: pkg.id,
            name: entry.name,
            ...(provider ? { provider } : {}),
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const failure = await response.json().catch(() => ({}));
          throw new Error(
            failure.error ??
              (response.status === 401
                ? "signin_required"
                : response.status === 429
                ? "rate_limited"
                : response.status === 504
                ? "reference_timeout"
                : "reference_unavailable")
          );
        }
        const payload = await response.json();
        if (controller.signal.aborted) return;
        const data: GeneratedResult = {
          detail: apiDetailSchema.parse(payload.detail),
          source: payload.source === "ai" ? "ai" : "library",
          reason: typeof payload.reason === "string" ? payload.reason : undefined,
          provider: typeof payload.provider === "string" ? payload.provider : undefined,
          sources: Array.isArray(payload.sources)
            ? payload.sources.filter((item: unknown) => typeof item === "string").slice(0, 8)
            : undefined,
        };
        if (data.source === "ai") writeCache(key, data);
        setState({ key, status: "ready", data });
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            key,
            status: "error",
            error:
              error instanceof TypeError
                ? "network_error"
                : error instanceof Error
                ? error.message
                : "reference_unavailable",
          });
      }
    });
    return () => controller.abort();
  }, [key, curated, attempt, pkg.id, entry.name, provider]);

  return {
    ...(state.key === key ? state : { status: "loading" as const, data: undefined }),
    retry: () => setAttempt((value) => value + 1),
  };
}

function packageMark(pkg: ApiPackage) {
  return <BrandOrGlyph label={pkg.name} glyph={pkg.icon} size={16} />;
}

export function ApiDetail({
  pkg,
  entry,
  pathname,
}: {
  pkg: ApiPackage;
  entry: ApiEntry;
  pathname: string;
}) {
  const curated = API_DETAILS[`${pkg.id}:${entry.name}`];
  const { providers, provider, choose } = useAiProvider(!curated);
  const generated = useGeneratedDetail(pkg, entry, !!curated, provider);
  const kind = API_TYPES.find((type) => type.k === entry.kind)?.label || "Identifier";
  const status = API_STATUSES.find((item) => item.id === entry.status)?.label || "Reference entry";
  const base = curated ?? (generated.status === "ready" ? generated.data?.detail : undefined);
  const detail = base ? enrichApiLearning(pkg, entry, base) : undefined;
  const language: CodeLanguage = curated?.language ?? apiCodeLanguage(pkg.id);
  const fromLibrary = !curated && generated.status === "ready" && generated.data?.source === "library";
  const related = (detail?.related ?? [])
    .map((name) => pkg.entries.find((item) => item.name === name))
    .filter((item): item is ApiEntry => !!item);
  const seeAlso = related.length
    ? related
    : pkg.entries.filter((item) => item.name !== entry.name && item.kind === entry.kind).slice(0, 6);
  const mentorHref = `/dashboard/mentors?q=${encodeURIComponent(
    `Explain ${entry.name} from ${pkg.name} with a practical example`
  )}`;
  const quizHref = `/dashboard/quiz?topic=${encodeURIComponent(`${pkg.name} ${entry.name}`)}`;
  const isAgentic = AGENTIC_FRAMEWORK_IDS.has(pkg.id);

  return (
    <div>
      <div className={styles.detailTop}>
        <Link href={pathname}>
          <ArrowLeft size={16} />
          API Reference
        </Link>
        <div className={styles.learnLinks}>
          <a
            href={pkg.docs}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.officialDocsLink}
            title={`Open official ${pkg.name} documentation`}
          >
            <FileCode2 size={15} aria-hidden="true" />
            Official Reference
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
          <Link href={mentorHref}>
            <MessageCircle size={15} />
            Ask the mentor
          </Link>
          <Link href={quizHref}>
            <GraduationCap size={15} />
            Quiz me on this
          </Link>
        </div>
      </div>
      <div className={styles.detailLayout}>
        <article className={styles.detail}>
          <p className={styles.packageName}>
            <BrandMark label={pkg.name} size={14} />
            {detail?.packageName || pkg.name}
            {isAgentic && (
              <UiBadge variant="secondary" className={styles.frameworkBadge}>
                <Sparkles size={11} aria-hidden="true" />
                Agentic AI
              </UiBadge>
            )}
          </p>
          <h1>
            {entry.name}
            <span className={styles.kind}>{kind}</span>
            <span className={styles.statusBadge} data-status={entry.status}>
              {status}
            </span>
            {detail?.since && <span className={styles.kind}>{detail.since}</span>}
          </h1>
          {!curated && <AiProviderPicker providers={providers} provider={provider} onChoose={choose} />}
          {!detail && generated.status === "loading" && (
            <div className={styles.generating} role="status">
              <Sparkles size={16} />
              <span>Preparing the {entry.name} reference…</span>
              <i />
              <i />
              <i />
            </div>
          )}
          {!detail && generated.status === "error" && (
            <div className={styles.referenceCard} role="alert">
              <p>{referenceErrorMessage(generated.error)}</p>
              {generated.error === "signin_required" ? (
                <Link href="/sign-in">
                  Sign in again
                  <ArrowUpRight size={14} />
                </Link>
              ) : (
                <button className={styles.retry} onClick={generated.retry}>
                  <RefreshCw size={14} />
                  Try again
                </button>
              )}
            </div>
          )}
          {detail && (
            <>
              <section id="api-definition" className={styles.definitionBlock}>
                <h2 className={styles.coloredTitle} data-tone="clay">
                  <BookOpen size={20} aria-hidden="true" />
                  Definition
                </h2>
                <p className={styles.lead}>
                  <KeyText text={shortDefinition(detail.description)} />
                </p>
                {detail.description.length > shortDefinition(detail.description).length && (
                  <p>
                    <KeyText text={detail.description} />
                  </p>
                )}
                {detail.descriptionLong &&
                  detail.descriptionLong.split(/\n\n+/).map((paragraph) => (
                    <p key={paragraph}>
                      <KeyText text={paragraph} />
                    </p>
                  ))}
                <AiProvenance
                  provider={generated.data?.provider}
                  sources={generated.data?.sources}
                  providers={providers}
                />
                {fromLibrary && (
                  <p className={styles.small}>
                    Showing the in-app catalog summary for {entry.name}: the facts the catalog
                    holds, with no invented signature or example.
                    {generated.data?.reason
                      ? ` ${referenceErrorMessage(generated.data.reason)}`
                      : " Prepare the full learning page for signatures, a worked example and a runnable project."}
                  </p>
                )}
                <section id="api-signature" className={styles.syntaxBlock}>
                  <h3 className={styles.coloredSubtitle} data-tone="blue">
                    <FileCode2 size={18} aria-hidden="true" />
                    Syntax
                  </h3>
                  {detail.signature ? (
                    <ApiCode code={detail.signature} language={language} />
                  ) : (
                    <p>
                      {fromLibrary
                        ? `The catalog summary does not carry a signature for ${entry.name}. Prepare the full learning page below, or read the official documentation linked in the key features.`
                        : "This concept has no standalone syntax."}
                    </p>
                  )}
                  <div className={styles.memberBody}>
                    {detail.parameters.map((parameter) => (
                      <div className={styles.parameter} key={parameter.name}>
                        <p>
                          <b>{parameter.name}</b> <code>{parameter.type}</code>
                        </p>
                        <p>
                          <KeyText text={parameter.description} />
                        </p>
                      </div>
                    ))}
                    {detail.returns && (
                      <p>
                        <strong>Returns:</strong> <KeyText text={detail.returns} />
                      </p>
                    )}
                  </div>
                </section>
                <section id="api-example" className={styles.exampleBlock}>
                  <h3 className={styles.coloredSubtitle} data-tone="sage">
                    <FileCode2 size={18} aria-hidden="true" />
                    Example
                  </h3>
                  {detail.code ? (
                    <ApiCode code={detail.code} language={language} />
                  ) : (
                    <p>
                      {fromLibrary
                        ? "No example is invented for a catalog summary. Prepare the full learning page below to generate a runnable one."
                        : "Explore the complete code workspace below for a practical example."}
                    </p>
                  )}
                </section>
              </section>
              <section id="api-key-points">
                <h2 className={styles.coloredTitle} data-tone="violet">
                  <Sparkles size={20} aria-hidden="true" />
                  Key features
                </h2>
                <ol className={styles.pointList} data-tone="violet">
                  {detail.notes.map((note, index) => (
                    <li key={note}>
                      <span className={styles.pointNumber} aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <KeyText text={note} />
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
              <section id="api-use-cases">
                <h2 className={styles.coloredTitle} data-tone="sage">
                  <BriefcaseBusiness size={20} aria-hidden="true" />
                  Real use cases
                </h2>
                <ol className={styles.pointList} data-tone="sage">
                  {detail.useCases.map((note, index) => (
                    <li key={note}>
                      <span className={styles.pointNumber} aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <KeyText text={note} />
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
              <section id="api-project">
                <h2>Complete code workspace</h2>
                {detail.project ? (
                  <ApiProjectWorkspace key={entry.name} project={detail.project} />
                ) : (
                  <div className={styles.referenceCard}>
                    <p>A runnable project is not available in this catalog summary.</p>
                    <button className={styles.retry} onClick={generated.retry}>
                      Prepare full learning page
                    </button>
                  </div>
                )}
              </section>
              <section id="api-vocabulary">
                <div className={projectStyles.vocabularyHeading}>
                  <h2 className={styles.coloredTitle} data-tone="sage">
                    <BookOpen size={20} aria-hidden="true" />
                    Corporate English vocabulary
                  </h2>
                  <span className={projectStyles.wordTotal}>{detail.vocabulary.length} words</span>
                </div>
                <p className={projectStyles.sectionIntro}>
                  Build the language for clear technical discussions and confident workplace
                  communication.
                </p>
                <div className={projectStyles.vocabulary}>
                  {detail.vocabulary.map((item, index) => {
                    const icon = vocabularyIcon(item.word, item.meaning);
                    return (
                      <article key={item.word}>
                        <header className={projectStyles.wordHeading}>
                          <span className={projectStyles.sectionIcon}>
                            <Image src={icon.src} alt={icon.alt} width={26} height={26} />
                          </span>
                          <div>
                            <span className={projectStyles.wordEyebrow}>WORKPLACE VOCABULARY</span>
                            <h3>{item.word}</h3>
                          </div>
                          <span
                            className={projectStyles.wordIndex}
                            aria-label={`Word ${index + 1} of ${detail.vocabulary.length}`}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </header>
                        <dl>
                          <dt>Meaning</dt>
                          <dd>{item.meaning}</dd>
                          <dt>Sentence</dt>
                          <dd className={projectStyles.sentence}>
                            <Quote size={16} aria-hidden="true" />
                            {item.sentence}
                          </dd>
                          <dt>Synonyms</dt>
                          <dd className={projectStyles.wordChips}>
                            {item.synonyms.map((word) => (
                              <span key={word}>{word}</span>
                            ))}
                          </dd>
                          <dt>Antonyms</dt>
                          <dd className={projectStyles.wordChips} data-tone="rose">
                            {item.antonyms.map((word) => (
                              <span key={word}>{word}</span>
                            ))}
                          </dd>
                        </dl>
                      </article>
                    );
                  })}
                </div>
              </section>
              <section id="api-interview">
                <h2>Interview questions &amp; answers</h2>
                <p>
                  Practice common interview concepts and related follow-up questions. These are study
                  questions, not a measured frequency ranking.
                </p>
                <ApiInterviewPractice key={entry.name} detail={detail} />
              </section>
              <section id="api-topics">
                <h2>Learn {pkg.name} in the app</h2>
                <div className={styles.topicChips}>
                  {pkg.topics.map((topic) => (
                    <Link
                      key={topic}
                      href={`/dashboard/lessons?track=${encodeURIComponent(
                        pkg.id
                      )}&topic=${encodeURIComponent(topic)}`}
                    >
                      <BookOpen size={15} aria-hidden="true" />
                      <span>{topic}</span>
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
          {!!seeAlso.length && (
            <section id="api-related">
              <h2>See also</h2>
              <ul className={styles.related}>
                {seeAlso.map((item) => (
                  <li key={item.name}>
                    <Link href={apiTopicHref(pathname, pkg.id, item.name)}>
                      <FileCode2 size={15} aria-hidden="true" />
                      <span>{item.name}</span>
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <LearningResources key={pkg.id} technology={pkg.name} />
          <p className={styles.provenance}>
            {curated
              ? "Hand-authored reference prepared for study in MasterClass."
              : "Prepared inside MasterClass for study."}{" "}
            Behaviour can differ between versions; verify against the version installed in your
            project.
          </p>
        </article>
      </div>
    </div>
  );
}

export function apiTopicHref(pathname: string, packageId: string, name: string) {
  return `${pathname}/${encodeURIComponent(packageId)}/${encodeURIComponent(name)}`;
}

/**
 * The mark beside a package name: its real logo, else the catalog's emoji.
 */
function AgenticWorkflowArchitect() {
  const [activeMode, setActiveMode] = useState<"single" | "multi">("single");
  const [expandedStep, setExpandedStep] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const singleSteps = [
    {
      num: 1,
      tech: "LangSmith",
      title: "Observability & Telemetry Setup",
      desc: "Configure project tracing, credentials, and custom function spans using @traceable so every step, model call, and tool execution is recorded automatically.",
      apis: [
        { name: "Client", pkg: "langsmith" },
        { name: "traceable", pkg: "langsmith" },
        { name: "RunTree", pkg: "langsmith" },
      ],
      code: `import os\nfrom langsmith import Client, traceable\n\nos.environ["LANGCHAIN_TRACING_V2"] = "true"\nos.environ["LANGCHAIN_PROJECT"] = "single-agent-production"\nclient = Client()\n\n@traceable(name="sanitize_input", run_type="tool")\ndef sanitize(text: str) -> str:\n    return text.strip()`,
    },
    {
      num: 2,
      tech: "LangChain + Integrations",
      title: "Model Initialization & Schema-Validated Tools",
      desc: "Initialize chat models using init_chat_model or ChatOpenAI and define typed tools with @tool. Bind tools to the model with JSON Schema validation.",
      apis: [
        { name: "tool", pkg: "langchain" },
        { name: "init_chat_model", pkg: "langchain" },
        { name: "ChatOpenAI", pkg: "integrations" },
        { name: "TavilySearchResults", pkg: "integrations" },
      ],
      code: `from langchain.chat_models import init_chat_model\nfrom langchain_core.tools import tool\nfrom langchain_community.tools.tavily_search import TavilySearchResults\n\n@tool\ndef calculate_roi(investment: float, gain: float) -> float:\n    \"\"\"Calculate return on investment percentage.\"\"\"\n    return round(((gain - investment) / investment) * 100, 2)\n\ntools = [calculate_roi, TavilySearchResults(max_results=3)]\nmodel = init_chat_model("gpt-4o", model_provider="openai", temperature=0)\nmodel_with_tools = model.bind_tools(tools)`,
    },
    {
      num: 3,
      tech: "LangGraph",
      title: "Cyclic StateGraph & Session Memory",
      desc: "Construct the ReAct cyclic state machine. MessagesState with add_messages ensures immutable state reduction. ToolNode handles tool calls, cycling back to the agent.",
      apis: [
        { name: "StateGraph", pkg: "langgraph" },
        { name: "MessagesState", pkg: "langgraph" },
        { name: "add_messages", pkg: "langgraph" },
        { name: "MemorySaver", pkg: "langgraph" },
      ],
      code: `from langgraph.graph import StateGraph, MessagesState, START, END\nfrom langgraph.prebuilt import ToolNode, tools_condition\nfrom langgraph.checkpoint.memory import MemorySaver\n\ndef call_model(state: MessagesState):\n    return {"messages": [model_with_tools.invoke(state["messages"])]}\n\nbuilder = StateGraph(MessagesState)\nbuilder.add_node("agent", call_model)\nbuilder.add_node("tools", ToolNode(tools))\n\nbuilder.add_edge(START, "agent")\nbuilder.add_conditional_edges("agent", tools_condition)\nbuilder.add_edge("tools", "agent")\n\nagent_graph = builder.compile(checkpointer=MemorySaver())`,
    },
    {
      num: 4,
      tech: "Deep Agents",
      title: "Sandboxed Filesystem & Discipline",
      desc: "For autonomous coding agents, attach sandboxed execution primitives (execute_bash, read_file) and discipline middleware preventing infinite loops.",
      apis: [
        { name: "execute_bash", pkg: "deepagents" },
        { name: "read_file", pkg: "deepagents" },
        { name: "SandboxEnvironment", pkg: "deepagents" },
        { name: "ContextWindowGuardMiddleware", pkg: "deepagents" },
      ],
      code: `from deepagents.tools import execute_bash, read_file, write_file\nfrom deepagents.middleware import ModelRateLimitRetryMiddleware, FollowupDisciplineMiddleware\n\nsandbox_tools = [execute_bash, read_file, write_file]\nmiddleware = [\n    FollowupDisciplineMiddleware(max_consecutive_tool_calls=5),\n    ModelRateLimitRetryMiddleware(max_retries=3, backoff_factor=1.5),\n]`,
    },
    {
      num: 5,
      tech: "LangGraph + LangSmith",
      title: "Streaming, Human Approval & Automated Evals",
      desc: "Stream token deltas to clients with thread isolation. Interrupt execution with interrupt() for approval on sensitive operations, and benchmark accuracy with evaluate().",
      apis: [
        { name: "interrupt", pkg: "langgraph" },
        { name: "evaluate", pkg: "langsmith" },
        { name: "ExactMatchEvaluator", pkg: "langsmith" },
      ],
      code: `config = {"configurable": {"thread_id": "thread-42"}}\ninputs = {"messages": [("user", "Analyze Q4 revenue and search market consensus.")]}\n\nfor chunk, meta in agent_graph.stream(inputs, config=config, stream_mode="messages"):\n    if chunk.content:\n        print(chunk.content, end="", flush=True)`,
    },
  ];

  const multiSteps = [
    {
      num: 1,
      tech: "LangGraph",
      title: "Multi-Agent Shared State Schema",
      desc: "Declare a centralized TypedDict schema containing conversational messages, task milestone checklists, and dynamic worker delegation fields.",
      apis: [
        { name: "StateGraph", pkg: "langgraph" },
        { name: "add_messages", pkg: "langgraph" },
        { name: "DeepAgentState", pkg: "deepagents" },
      ],
      code: `from typing import TypedDict, Annotated, Literal\nfrom langchain_core.messages import AnyMessage\nfrom langgraph.graph.message import add_messages\n\nclass SupervisorState(TypedDict):\n    messages: Annotated[list[AnyMessage], add_messages]\n    next_worker: Literal["researcher", "coder", "FINISH"]\n    task_plan: list[str]\n    completed_milestones: list[str]`,
    },
    {
      num: 2,
      tech: "LangChain + Deep Agents + Integrations",
      title: "Specialized Worker Subagents",
      desc: "Construct dedicated subagents. Researcher is armed with Tavily web search. Coder is armed with Deep Agents containerized bash and filesystem tools.",
      apis: [
        { name: "create_agent", pkg: "langchain" },
        { name: "TavilySearchResults", pkg: "integrations" },
        { name: "execute_bash", pkg: "deepagents" },
      ],
      code: `from langchain_openai import ChatOpenAI\nfrom langchain_community.tools.tavily_search import TavilySearchResults\nfrom deepagents.tools import execute_bash, read_file\n\nmodel = ChatOpenAI(model="gpt-4o", temperature=0)\n# Researcher Worker\nresearcher = model.bind_tools([TavilySearchResults(max_results=3)])\n# Coder Worker\ncoder = model.bind_tools([execute_bash, read_file])`,
    },
    {
      num: 3,
      tech: "LangGraph + LangChain",
      title: "Supervisor Routing Node",
      desc: "The central supervisor evaluates current milestone completion, selecting the next worker using with_structured_output(RouterDecision) or returning FINISH.",
      apis: [
        { name: "with_structured_output", pkg: "langchain" },
        { name: "Command", pkg: "langgraph" },
        { name: "ChatPromptTemplate", pkg: "langchain" },
      ],
      code: `from pydantic import BaseModel, Field\nfrom typing import Literal\n\nclass RouterDecision(BaseModel):\n    next_worker: Literal["researcher", "coder", "FINISH"] = Field(\n        description="Next worker to delegate to, or FINISH when objective is achieved."\n    )\n\nsupervisor_chain = model.with_structured_output(RouterDecision)\ndef supervisor_node(state: SupervisorState):\n    decision = supervisor_chain.invoke(state["messages"])\n    return {"next_worker": decision.next_worker}`,
    },
    {
      num: 4,
      tech: "LangGraph",
      title: "Dynamic Graph Routing, SqliteSaver & Interrupts",
      desc: "Connect supervisor and worker nodes. Persist execution across threads with SqliteSaver, and pause execution with interrupt() before critical code actions.",
      apis: [
        { name: "SqliteSaver", pkg: "langgraph" },
        { name: "interrupt", pkg: "langgraph" },
        { name: "START", pkg: "langgraph" },
        { name: "END", pkg: "langgraph" },
      ],
      code: `from langgraph.graph import StateGraph, START, END\nfrom langgraph.checkpoint.sqlite import SqliteSaver\nimport sqlite3\n\nbuilder = StateGraph(SupervisorState)\nbuilder.add_node("supervisor", supervisor_node)\nbuilder.add_node("researcher", lambda s: {"messages": [researcher.invoke(s["messages"])]})\nbuilder.add_node("coder", lambda s: {"messages": [coder.invoke(s["messages"])]})\n\nbuilder.add_edge(START, "supervisor")\nbuilder.add_conditional_edges("supervisor", lambda s: s["next_worker"], {\n    "researcher": "researcher",\n    "coder": "coder",\n    "FINISH": END,\n})\nbuilder.add_edge("researcher", "supervisor")\nbuilder.add_edge("coder", "supervisor")\n\nwith sqlite3.connect("workflow.db", check_same_thread=False) as conn:\n    multi_agent = builder.compile(checkpointer=SqliteSaver(conn))`,
    },
    {
      num: 5,
      tech: "LangSmith",
      title: "Hierarchical Multi-Agent Tracing & CI/CD Testing",
      desc: "LangSmith organizes executions into nested span trees: supervisor orchestration at the root, with drill-down observability into worker tool outputs and token costs.",
      apis: [
        { name: "traceable", pkg: "langsmith" },
        { name: "CriteriaEvaluator", pkg: "langsmith" },
        { name: "unit", pkg: "langsmith" },
      ],
      code: `from langsmith import Client, evaluate\n\nclient = Client()\nthread_config = {"configurable": {"thread_id": "security-patch-101"}}\n\nfor step in multi_agent.stream({\n    "messages": [("user", "Investigate CVE-2026-8812 and generate regression tests.")],\n    "task_plan": ["1. Research CVE", "2. Author patch", "3. Test in sandbox"],\n    "completed_milestones": [],\n}, config=thread_config):\n    print("Step:", step)`,
    },
  ];

  const currentSteps = activeMode === "single" ? singleSteps : multiSteps;

  async function copyCode(code: string, index: number) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {}
  }

  return (
    <section className={styles.agenticWorkflowSection} aria-label="Agentic AI Workflow Architecture">
      <div className={styles.agenticWorkflowHeader}>
        <div>
          <div className={styles.agenticWorkflowTitleWrap}>
            <span className={styles.agenticSparkleBadge} aria-hidden="true">
              <Workflow size={15} />
            </span>
            <h2 className={styles.agenticWorkflowTitle}>
              Agentic AI Workflow Architect
              <UiBadge variant="secondary" className={styles.agenticBadge}>
                Step-by-Step Blueprint
              </UiBadge>
            </h2>
          </div>
          <p className={styles.agenticWorkflowSubtitle}>
            Step-by-step process for building stateful <strong>Single Agent</strong> and <strong>Multi-Agent</strong> systems using{" "}
            <strong>LangChain</strong>, <strong>LangGraph</strong>, <strong>LangSmith</strong>, <strong>Deep Agents</strong>, and <strong>Integrations</strong>.
          </p>
        </div>

        <div className={styles.agenticWorkflowActions}>
          <div className={styles.agenticModePills} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "single"}
              className={`${styles.agenticModeBtn} ${activeMode === "single" ? styles.agenticModeBtnActive : ""}`}
              onClick={() => {
                setActiveMode("single");
                setExpandedStep(0);
              }}
            >
              <Bot size={14} />
              Single-Agent Workflow
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === "multi"}
              className={`${styles.agenticModeBtn} ${activeMode === "multi" ? styles.agenticModeBtnActive : ""}`}
              onClick={() => {
                setActiveMode("multi");
                setExpandedStep(0);
              }}
            >
              <Users size={14} />
              Multi-Agent Workflow
            </button>
          </div>
          <Link href="/dashboard/workflow" className={styles.agenticWorkflowStudioLink}>
            Open Dedicated Workflow Studio
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className={styles.workflowStepsAccordion}>
        {currentSteps.map((step, idx) => {
          const isExpanded = expandedStep === idx;
          return (
            <article
              key={step.num}
              className={`${styles.workflowStepItem} ${isExpanded ? styles.workflowStepItemActive : ""}`}
            >
              <button
                type="button"
                className={styles.workflowStepHeaderBtn}
                onClick={() => setExpandedStep(isExpanded ? -1 : idx)}
                aria-expanded={isExpanded}
              >
                <div className={styles.workflowStepTitleWrap}>
                  <span className={styles.workflowStepNum}>{step.num}</span>
                  <span className={styles.workflowStepHeading}>{step.title}</span>
                  <span className={styles.workflowStepTechBadge}>{step.tech}</span>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isExpanded && (
                <div className={styles.workflowStepBody}>
                  <p className={styles.workflowStepDesc}>{step.desc}</p>

                  <div className={styles.workflowStepApis}>
                    <span style={{ fontWeight: 600, color: "#64748b" }}>Core APIs:</span>
                    {step.apis.map((api) => (
                      <Link
                        key={api.name}
                        href={`/dashboard/api-docs/${api.pkg}/${api.name}`}
                        className={styles.workflowStepApiLink}
                      >
                        {api.name}
                        <ArrowUpRight size={11} />
                      </Link>
                    ))}
                  </div>

                  <div className={styles.workflowStepCodeBox}>
                    <div className={styles.workflowStepCodeHeader}>
                      <span>Python Implementation (Step {step.num})</span>
                      <button
                        type="button"
                        className={styles.copyCodeButton}
                        onClick={() => copyCode(step.code, idx)}
                      >
                        {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                        {copiedIndex === idx ? "Copied" : "Copy Code"}
                      </button>
                    </div>
                    <pre className={styles.workflowStepCodeContent}>
                      <code>{step.code}</code>
                    </pre>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ApiDocs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [packageId, setPackageId] = useState("all");
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState(API_STATUSES.map((item) => item.id));
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [expandAll, setExpandAll] = useState(false);

  // Advance search and toggle filters panel states
  const [showFilters, setShowFilters] = useState(true);
  const [searchScope, setSearchScope] = useState<"all" | "name" | "exact">("all");

  // Keyboard shortcut: Cmd/Ctrl + K to focus API search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const input = document.getElementById("api-filter-search");
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const agenticPackages = useMemo(() => {
    return AGENTIC_FRAMEWORK_ORDER
      .map((id) => API_PACKAGES.find((pkg) => pkg.id === id))
      .filter((pkg): pkg is ApiPackage => Boolean(pkg));
  }, []);

  const otherPackages = useMemo(() => {
    return API_PACKAGES.filter((pkg) => !AGENTIC_FRAMEWORK_IDS.has(pkg.id));
  }, []);

  // Filter with Advance Search support
  const groups = useMemo(() => {
    const rawGroups = filterApiPackages(query, packageId, types, statuses);
    if (!query.trim() || searchScope === "all") return rawGroups;

    const normalized = query.trim().toLowerCase();
    return rawGroups
      .map((pkg) => ({
        ...pkg,
        entries: pkg.entries.filter((entry) => {
          if (searchScope === "name") {
            return entry.name.toLowerCase().includes(normalized);
          }
          if (searchScope === "exact") {
            return entry.name.toLowerCase() === normalized;
          }
          return true;
        }),
      }))
      .filter((pkg) => pkg.entries.length > 0);
  }, [query, packageId, types, statuses, searchScope]);

  const total = groups.reduce((sum, pkg) => sum + pkg.entries.length, 0);
  const selectedPackage = API_PACKAGES.find((pkg) => pkg.id === params.get("package"));
  const selectedEntry = selectedPackage?.entries.find((entry) => entry.name === params.get("api"));
  const detailRequested = params.has("api");

  const isFiltered =
    query.trim() !== "" ||
    packageId !== "all" ||
    types.length > 0 ||
    statuses.length !== API_STATUSES.length ||
    searchScope !== "all";

  // Count active filter constraints for badge indicator
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count++;
    if (packageId !== "all") count++;
    if (types.length > 0) count += types.length;
    if (statuses.length < API_STATUSES.length) count += API_STATUSES.length - statuses.length;
    if (searchScope !== "all") count++;
    return count;
  }, [query, packageId, types, statuses, searchScope]);

  function toggleType(kind: string) {
    setTypes((previous) =>
      previous.includes(kind) ? previous.filter((item) => item !== kind) : [...previous, kind]
    );
  }

  function reset() {
    setQuery("");
    setPackageId("all");
    setTypes([]);
    setStatuses(API_STATUSES.map((item) => item.id));
    setSearchScope("all");
    setOpen(null);
    setExpanded([]);
    setExpandAll(false);
  }

  function entryLink(pkg: ApiPackage, entry: ApiEntry) {
    return (
      <Link
        className={styles.apiItem}
        key={entry.name}
        href={apiTopicHref(pathname, pkg.id, entry.name)}
        title={`${entry.name} · ${
          API_TYPES.find((type) => type.k === entry.kind)?.label || entry.kind
        }`}
      >
        <Badge kind={entry.kind} />
        <span>{entry.name}</span>
        {entry.status !== "s" && (
          <small data-status={entry.status}>
            {API_STATUSES.find((item) => item.id === entry.status)?.label}
          </small>
        )}
      </Link>
    );
  }

  return (
    <div className={styles.root}>
      {detailRequested ? (
        selectedPackage && selectedEntry ? (
          <ApiDetail
            key={`${selectedPackage.id}:${selectedEntry.name}`}
            pkg={selectedPackage}
            entry={selectedEntry}
            pathname={pathname}
          />
        ) : (
          <div className={styles.empty}>
            <h1>API entry not found</h1>
            <p>This identifier is not in the reference catalog.</p>
            <Link href={pathname}>Back to API Reference</Link>
          </div>
        )
      ) : (
        <>
          <DashboardPageHeader
            eyebrow="Professional learning / API Docs"
            title="API Reference"
            icon={<FileCode2 />}
            description="Browse key identifiers across every technology and Agentic AI framework, filter by type or status, and study each API in depth with runnable code and workplace vocabulary."
            actions={
              <span className={styles.packageCount}>{API_PACKAGES.length} technologies</span>
            }
          />

          {/* Featured Agentic AI Frameworks Showcase */}
          <section className={styles.agenticShowcase} aria-label="Agentic AI Frameworks">
            <div className={styles.agenticShowcaseHeader}>
              <div className={styles.agenticTitleWrap}>
                <span className={styles.agenticSparkleBadge} aria-hidden="true">
                  <Sparkles size={15} />
                </span>
                <h2 className={styles.agenticTitle}>Agentic AI Frameworks</h2>
                <UiBadge variant="secondary" className={styles.agenticBadge}>
                  Complete Documentation
                </UiBadge>
              </div>
              <p className={styles.agenticSubtitle}>
                Reference specifications, state schemas, and runnable execution patterns for multi-agent workflows.
              </p>
            </div>
            <div className={styles.agenticGrid}>
              {agenticPackages.map((pkg) => {
                const isSelected = packageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`${styles.agenticCard} ${
                      isSelected ? styles.agenticCardActive : ""
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setPackageId("all");
                        setOpen(null);
                      } else {
                        setPackageId(pkg.id);
                        setOpen(pkg.id);
                      }
                    }}
                    aria-pressed={isSelected}
                    title={`Filter to ${pkg.name} (${pkg.entries.length} APIs)`}
                  >
                    <span className={styles.agenticCardIcon} aria-hidden="true">
                      {packageMark(pkg)}
                    </span>
                    <div className={styles.agenticCardBody}>
                      <span className={styles.agenticCardName}>{pkg.name}</span>
                      <span className={styles.agenticCardCount}>{pkg.entries.length} APIs</span>
                    </div>
                    {isSelected ? (
                      <span className={styles.agenticCardCheck} aria-hidden="true">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className={styles.agenticCardArrow} aria-hidden="true">
                        <ChevronDown size={13} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Interactive Agentic AI Workflow Architect (Step-by-Step Single/Multi-Agent Blueprint) */}
          <AgenticWorkflowArchitect />

          {/* Filters Card with Shadcn Form Controls, Advance Search, Toggle Filters Panel, and Clear Filter */}
          <section className={styles.filterPanel} aria-label="API reference filters">
            <div className={styles.toolbar}>
              <div className={styles.toolbarPrimaryRow}>
                {/* Search Input Box */}
                <div className={styles.searchBlock}>
                  <Label className={styles.search} htmlFor="api-filter-search">
                    <Search size={16} className={styles.searchIcon} aria-hidden="true" />
                    <Input
                      id="api-filter-search"
                      type="search"
                      aria-label="Filter APIs"
                      placeholder="Filter APIs across all technologies by identifier, package, or description…"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className={styles.searchInput}
                    />
                    {query ? (
                      <button
                        type="button"
                        aria-label="Clear API search"
                        onClick={() => setQuery("")}
                        className={styles.clearSearchBtn}
                        title="Clear search"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    ) : (
                      <span className={styles.searchShortcut} aria-hidden="true" title="Press ⌘K or Ctrl+K to search">
                        <kbd>⌘K</kbd>
                      </span>
                    )}
                  </Label>
                </div>

                {/* Package / Framework Dropdown */}
                <div className={styles.selectWrapper}>
                  <Layers size={15} className={styles.selectLeftIcon} aria-hidden="true" />
                  <NativeSelect
                    aria-label="API package"
                    value={packageId}
                    onChange={(event) => {
                      setPackageId(event.target.value);
                      setOpen(event.target.value === "all" ? null : event.target.value);
                    }}
                    className={styles.packageSelect}
                  >
                    <NativeSelectOption value="all">
                      All Packages ({API_PACKAGES.length} technologies)
                    </NativeSelectOption>
                    <NativeSelectOptGroup label="Agentic AI Frameworks">
                      {agenticPackages.map((pkg) => (
                        <NativeSelectOption value={pkg.id} key={pkg.id}>
                          {pkg.name} ({pkg.entries.length} APIs)
                        </NativeSelectOption>
                      ))}
                    </NativeSelectOptGroup>
                    <NativeSelectOptGroup label="Technologies & Ecosystems">
                      {otherPackages.map((pkg) => (
                        <NativeSelectOption value={pkg.id} key={pkg.id}>
                          {pkg.name} ({pkg.entries.length} APIs)
                        </NativeSelectOption>
                      ))}
                    </NativeSelectOptGroup>
                  </NativeSelect>
                  <ChevronDown size={15} className={styles.selectChevron} aria-hidden="true" />
                </div>

                {/* Filter Icon Button to Toggle Filters Panel */}
                <Button
                  type="button"
                  variant={showFilters ? "secondary" : "outline"}
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={styles.filterToggleBtn}
                  aria-expanded={showFilters}
                  aria-controls="api-collapsible-filters"
                  title={showFilters ? "Hide filter panel" : "Show filter panel"}
                >
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <UiBadge variant="default" className={styles.filterBadgeCount}>
                      {activeFilterCount}
                    </UiBadge>
                  )}
                  {showFilters ? (
                    <ChevronUp size={14} className={styles.toggleChevron} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={14} className={styles.toggleChevron} aria-hidden="true" />
                  )}
                </Button>

                {/* Dedicated Clear Filter Button */}
                {isFiltered && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    className={styles.toolbarClearBtn}
                    title="Clear all active filters"
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    <span>Clear filters</span>
                  </Button>
                )}
              </div>

              {/* Advance Search Mode Pills */}
              <div className={styles.toolbarSecondaryRow}>
                <div className={styles.advanceSearchRow} role="group" aria-label="Advance search options">
                  <span className={styles.advanceSearchLabel}>Search in:</span>
                  <button
                    type="button"
                    className={`${styles.advanceSearchPill} ${
                      searchScope === "all" ? styles.advanceSearchPillActive : ""
                    }`}
                    onClick={() => setSearchScope("all")}
                  >
                    All fields
                  </button>
                  <button
                    type="button"
                    className={`${styles.advanceSearchPill} ${
                      searchScope === "name" ? styles.advanceSearchPillActive : ""
                    }`}
                    onClick={() => setSearchScope("name")}
                  >
                    Identifier only
                  </button>
                  <button
                    type="button"
                    className={`${styles.advanceSearchPill} ${
                      searchScope === "exact" ? styles.advanceSearchPillActive : ""
                    }`}
                    onClick={() => setSearchScope((curr) => (curr === "exact" ? "all" : "exact"))}
                  >
                    Exact match
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Filters Panel */}
            <div
              id="api-collapsible-filters"
              className={`${styles.collapsibleFilters} ${
                showFilters ? styles.filtersExpanded : styles.filtersCollapsed
              }`}
              hidden={!showFilters}
            >
              <div className={styles.statusSection}>
                <span className={styles.filterSectionLabel}>Status</span>
                <div className={styles.statuses} role="group" aria-label="API status filters">
                  {API_STATUSES.map((item) => {
                    const isActive = statuses.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={isActive}
                        className={`${styles.statusPill} ${
                          isActive ? styles.statusPillActive : ""
                        }`}
                        onClick={() =>
                          setStatuses((previous) =>
                            previous.includes(item.id)
                              ? previous.filter((value) => value !== item.id)
                              : [...previous, item.id]
                          )
                        }
                      >
                        <span
                          className={styles.statusIndicator}
                          data-status={item.id}
                          aria-hidden="true"
                        />
                        {isActive && <Check size={13} aria-hidden="true" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.typeSection}>
                <div className={styles.typeHeader}>
                  <h2 className={styles.legend}>Filter by identifier type</h2>
                  {types.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTypes([])}
                      className={styles.clearTypesBtn}
                    >
                      Clear types ({types.length})
                    </button>
                  )}
                </div>
                <div className={styles.types} role="group" aria-label="Identifier types">
                  {API_TYPES.map((type) => {
                    const isActive = types.includes(type.k);
                    return (
                      <button
                        key={type.k}
                        type="button"
                        aria-pressed={isActive}
                        className={`${styles.typePill} ${
                          isActive ? styles.typePillActive : ""
                        }`}
                        onClick={() => toggleType(type.k)}
                      >
                        <Badge kind={type.k} />
                        <span className={styles.typeText}>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Results summary bar with quick controls */}
          <div className={styles.results}>
            <div className={styles.resultsInfo}>
              <span role="status" className={styles.resultsCount}>
                <strong>{total.toLocaleString("en-US")}</strong> identifiers ·{" "}
                <strong>{groups.length}</strong> packages
              </span>
              {isFiltered && (
                <UiBadge variant="outline" className={styles.activeFilterBadge}>
                  {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
                </UiBadge>
              )}
            </div>
            <div className={styles.resultsActions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => {
                  setExpandAll((prev) => !prev);
                  setOpen(null);
                }}
              >
                {expandAll ? "Collapse all" : "Expand all"}
              </button>
              <button type="button" className={styles.actionBtn} onClick={reset}>
                Reset filters
              </button>
            </div>
          </div>

          {/* Empty State */}
          {!groups.length && (
            <div className={styles.empty}>
              <Search size={30} className={styles.emptyIcon} aria-hidden="true" />
              <h2>No APIs match your filters.</h2>
              <p>Try a different identifier, package, type or status.</p>
              <div className={styles.emptySuggestions}>
                <span className={styles.suggestionTitle}>Try searching:</span>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("create_deep_agent");
                    setPackageId("all");
                  }}
                >
                  create_deep_agent
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("StateGraph");
                    setPackageId("all");
                  }}
                >
                  StateGraph
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("init_chat_model");
                    setPackageId("all");
                  }}
                >
                  init_chat_model
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("useState");
                    setPackageId("all");
                  }}
                >
                  useState
                </button>
              </div>
              <Button onClick={reset} variant="default" size="default">
                Clear all filters
              </Button>
            </div>
          )}

          {/* Grouped Catalog View */}
          <div className={styles.groups}>
            {groups.map((pkg) => {
              const isAgentic = AGENTIC_FRAMEWORK_IDS.has(pkg.id);
              const isOpen = !!query.trim() || expandAll || open === pkg.id;
              const entries = expanded.includes(pkg.id) ? pkg.entries : pkg.entries.slice(0, 60);
              const jsGroups = [...new Set(entries.map((entry) => javascriptGroup(entry.name)))];

              return (
                <section
                  key={pkg.id}
                  className={`${styles.group} ${isAgentic ? styles.agenticGroup : ""}`}
                  style={{ "--accent": pkg.accent } as CSSProperties}
                >
                  <header className={styles.groupHead}>
                    <h2>
                      <button
                        aria-label={`Toggle ${pkg.name}`}
                        aria-expanded={isOpen}
                        aria-controls={`api-group-${pkg.id}`}
                        onClick={() => {
                          if (isOpen) {
                            setOpen(null);
                            if (expandAll) setExpandAll(false);
                          } else {
                            setOpen(pkg.id);
                          }
                        }}
                      >
                        <ChevronDown
                          size={16}
                          className={isOpen ? "" : styles.closed}
                          aria-hidden="true"
                        />
                        <span className={styles.groupIcon} aria-hidden="true">
                          {packageMark(pkg)}
                        </span>
                        <span className={styles.groupName}>{pkg.name}</span>
                        {isAgentic && (
                          <UiBadge variant="secondary" className={styles.frameworkBadge}>
                            <Sparkles size={11} aria-hidden="true" />
                            Agentic AI
                          </UiBadge>
                        )}
                        <small>{pkg.entries.length}</small>
                      </button>
                    </h2>
                    <div className={styles.groupMetaActions}>
                      <span className={styles.groupMeta}>{pkg.description}</span>
                      <a
                        href={pkg.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.docsLink}
                        title={`Open official ${pkg.name} documentation`}
                      >
                        Docs <ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    </div>
                  </header>
                  <div id={`api-group-${pkg.id}`} hidden={!isOpen}>
                    {isOpen && (
                      <>
                        {pkg.id === "javascript" ? (
                          jsGroups.map((group) => (
                            <div className={styles.subgroup} key={group}>
                              <h3>{group}</h3>
                              <div className={styles.items}>
                                {entries
                                  .filter((entry) => javascriptGroup(entry.name) === group)
                                  .map((entry) => entryLink(pkg, entry))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={styles.items}>
                            {entries.map((entry) => entryLink(pkg, entry))}
                          </div>
                        )}
                        {entries.length < pkg.entries.length && (
                          <button
                            className={styles.showAll}
                            onClick={() => setExpanded((previous) => [...previous, pkg.id])}
                          >
                            Show all {pkg.entries.length} identifiers
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          <p className={styles.provenance}>
            Every reference opens inside MasterClass. Status labels describe the catalog snapshot;
            verify behaviour against the version installed in your project.
          </p>
        </>
      )}
    </div>
  );
}
