"use client";
import { AccordionChevron } from "@/components/ui/accordion-chevron";

import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Badge as UiBadge } from "@/components/ui/badge";
import { memo, useDeferredValue, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { vocabularyIcon } from "@/lib/vocabulary-icons";
import { BrandMark, BrandOrGlyph } from "./topic-media";
import { LearningResources } from "./learning-resources";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Quote,
  ArrowLeft,
  ArrowUpRight,
  FileCode2,
  GraduationCap,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  API_PACKAGES,
  API_STATUSES,
  API_TYPES,
  filterApiPackages,
  groupByCategory,
  javascriptGroup,
  type ApiEntry,
  type ApiPackage,
} from "@/lib/api-docs";
import { API_DETAILS } from "@/lib/api-docs-details";
import { agenticSection, agenticSections } from "@/lib/api-docs-agentic";
import { apiDetailSchema, type ContentSource, type GeneratedApiDetail } from "@/lib/pro-learn/types";
import type { CodeLanguage } from "@/lib/code-highlight";
import styles from "./api-docs.module.css";
import ref from "./api-reference.module.css";
import projectStyles from "./api-project.module.css";
import { apiCodeLanguage, enrichApiLearning } from "@/lib/api-learning";
import { ApiProjectWorkspace } from "./api-project-workspace";
import { ApiInterviewPractice } from "./api-interview-practice";
import { referenceErrorMessage } from "@/lib/api-reference-errors";
import { DashboardPageHeader } from "./dashboard-page-header";
import { ApiPackageIndex } from "./api-package-index";
import { AgentBlueprint } from "./agent-blueprint";
import { ApiDefinitionCards } from "./api-definition";
import { AiProvenance, AiProviderPicker, useAiProvider } from "./ai-provider-picker";
import { KeyText } from "./key-text";
import { LearningPicture } from "./learning-picture";
import { ListenButton } from "./listen-button";
import { learningImageUrl } from "@/lib/learning-image";
import { shortDefinition } from "@/lib/notes-study";

export const AGENTIC_FRAMEWORK_ORDER = [
  "deepagents",
  "langchain",
  "langgraph",
  "integrations",
  "langsmith",
  "langflow",
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

type GeneratedResult = {
  detail: GeneratedApiDetail;
  source: ContentSource;
  reason?: string;
  provider?: string;
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
          {detail && <ListenButton id={`api:${pkg.id}:${entry.name}`} title={entry.name} text={() => [`${entry.name}, from ${detail.packageName}`, detail.description,
            detail.parameters.length ? `Parameters. ${detail.parameters.map(parameter => `${parameter.name}: ${parameter.description}`).join(". ")}` : "",
            `Returns. ${detail.returns}`, detail.notes.length ? `Notes. ${detail.notes.join(". ")}` : "", detail.useCases.length ? `Use it for: ${detail.useCases.join(". ")}` : ""].filter(Boolean).join(". ")} />}
          <LearningPicture src={learningImageUrl("api", [pkg.id, entry.name])} alt={`Illustration of how ${entry.name} works`} />
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
                <ApiDefinitionCards
                  name={entry.name}
                  kindLabel={kind}
                  status={status}
                  packageName={detail.packageName || pkg.name}
                  signature={detail.signature}
                  parameters={detail.parameters}
                  returns={detail.returns}
                  code={detail.code}
                  language={language}
                  missingSignature={
                    fromLibrary
                      ? `The catalog summary does not carry a signature for ${entry.name}. Prepare the full learning page below, or read the official documentation linked in the key features.`
                      : "This concept has no standalone syntax."
                  }
                  missingExample={
                    fromLibrary
                      ? "No example is invented for a catalog summary. Prepare the full learning page below to generate a runnable one."
                      : "Explore the complete code workspace below for a practical example."
                  }
                />
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
const SEARCH_SCOPES = [
  { id: "all", label: "Name or package" },
  { id: "name", label: "Name only" },
  { id: "exact", label: "Exact name" },
] as const;
type SearchScope = (typeof SEARCH_SCOPES)[number]["id"];

const STATUS_HINTS: Record<string, string> = {
  s: "Safe to rely on in production code.",
  p: "Usable, but the API may still change before it is stable.",
  x: "Early API that can change or disappear between releases.",
  d: "Still documented, but replaced by a newer API.",
};

const TRY_QUERIES = ["StateGraph", "useState", "create_agent", "DataFrame"];

function kindLabel(kind: string) {
  return API_TYPES.find((type) => type.k === kind)?.label ?? kind;
}

function pluralKind(kind: string, count: number) {
  const label = kindLabel(kind).toLowerCase();
  if (count === 1) return label;
  return /(s|ss|x)$/.test(label) ? `${label}es` : `${label}s`;
}

function statusLabel(status: string) {
  return API_STATUSES.find((item) => item.id === status)?.label ?? status;
}

/** Everything the catalog knows about a package, summarised under its name. */
function PackageFacts({ pkg }: { pkg: ApiPackage }) {
  const kinds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of pkg.entries) counts.set(entry.kind, (counts.get(entry.kind) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [pkg]);
  const unstable = API_STATUSES.filter((item) => item.id !== "s")
    .map((item) => ({ ...item, count: pkg.entries.filter((entry) => entry.status === item.id).length }))
    .filter((item) => item.count > 0);
  const guides = pkg.entries.filter((entry) => API_DETAILS[`${pkg.id}:${entry.name}`]).length;
  return (
    <dl className={ref.packageFacts}>
      <div>
        <dt>Types</dt>
        <dd>
          {kinds.slice(0, 5).map(([kind, count]) => (
            <span key={kind} className={ref.factChip}>
              <Badge kind={kind} />
              {count} {pluralKind(kind, count)}
            </span>
          ))}
          {kinds.length > 5 && <span className={ref.factMore}>+{kinds.length - 5} more types</span>}
        </dd>
      </div>
      <div>
        <dt>Stability</dt>
        <dd>
          {unstable.length ? (
            unstable.map((item) => (
              <span key={item.id} className={ref.factChip}>
                <span className={ref.statusDot} data-status={item.id} aria-hidden="true" />
                {item.count} {item.label.toLowerCase()}
              </span>
            ))
          ) : (
            <span className={ref.factChip}>
              <span className={ref.statusDot} data-status="s" aria-hidden="true" />
              All stable
            </span>
          )}
        </dd>
      </div>
      {pkg.topics.length > 0 && (
        <div>
          <dt>Topics</dt>
          <dd className={ref.topics}>{pkg.topics.slice(0, 6).join(" · ")}</dd>
        </div>
      )}
      {guides > 0 && (
        <div>
          <dt>Guides</dt>
          <dd>
            {guides} hand-written {guides === 1 ? "page" : "pages"}
          </dd>
        </div>
      )}
    </dl>
  );
}

const ApiEntryRow = memo(function ApiEntryRow({ packageId, entry, pathname }: { packageId: string; entry: ApiEntry; pathname: string }) {
  const guide = API_DETAILS[`${packageId}:${entry.name}`];
  // The agentic frameworks read as picture cards, like the Popular AWS
  // services on Search: the illustration across the top, then the name.
  if (AGENTIC_FRAMEWORK_IDS.has(packageId)) return (
    <li className={`${ref.entry} ${ref.entryCard}`} key={entry.name} data-guide={guide ? "" : undefined}>
      <LearningPicture variant="card" className={ref.entryPicture} src={learningImageUrl("api", [packageId, entry.name])} alt="" />
      <div className={ref.entryCardBody}>
        <Badge kind={entry.kind} />
        <div className={ref.entryText}>
          <Link prefetch={false} className={ref.entryLink} href={apiTopicHref(pathname, packageId, entry.name)}>
            {entry.name}
          </Link>
          {guide && <p className={ref.entrySummary}>{guide.description}</p>}
        </div>
      </div>
      <span className={ref.entryMeta}>
        {guide && <span className={ref.guideTag}>Guide</span>}
        {entry.status !== "s" && (
          <span className={ref.statusTag} data-status={entry.status}>
            {statusLabel(entry.status)}
          </span>
        )}
        <span className={ref.kindLabel}>{kindLabel(entry.kind)}</span>
      </span>
    </li>
  );
  return (
    <li className={ref.entry} key={entry.name} data-guide={guide ? "" : undefined}>
      <Badge kind={entry.kind} />
      <div className={ref.entryText}>
        <Link prefetch={false} className={ref.entryLink} href={apiTopicHref(pathname, packageId, entry.name)}>
          {entry.name}
        </Link>
        {guide && <p className={ref.entrySummary}>{guide.description}</p>}
      </div>
      <span className={ref.entryMeta}>
        {guide && <span className={ref.guideTag}>Guide</span>}
        {entry.status !== "s" && (
          <span className={ref.statusTag} data-status={entry.status}>
            {statusLabel(entry.status)}
          </span>
        )}
        <span className={ref.kindLabel}>{kindLabel(entry.kind)}</span>
      </span>
    </li>
  );
});

export function ApiDocs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [packageId, setPackageId] = useState("all");
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState(API_STATUSES.map((item) => item.id));
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [expandAll, setExpandAll] = useState(false);
  // Agentic AI framework packages start open with every entry listed; this tracks the ones the reader closed.
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [showTypes, setShowTypes] = useState(false);
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [indexRail, setIndexRail] = useState(false);

  // Cmd/Ctrl + K focuses the reference search.
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

  const catalogFacts = useMemo(() => {
    const identifiers = API_PACKAGES.reduce((sum, pkg) => sum + pkg.entries.length, 0);
    return {
      packages: API_PACKAGES.length,
      identifiers,
      guides: Object.keys(API_DETAILS).length,
      categories: groupByCategory(API_PACKAGES),
    };
  }, []);

  const groups = useMemo(() => {
    const rawGroups = filterApiPackages(deferredQuery, packageId, types, statuses);
    if (!deferredQuery.trim() || searchScope === "all") return rawGroups;
    const normalized = deferredQuery.trim().toLowerCase();
    return rawGroups
      .map((pkg) => ({
        ...pkg,
        entries: pkg.entries.filter((entry) =>
          searchScope === "name" ? entry.name.toLowerCase().includes(normalized) : entry.name.toLowerCase() === normalized
        ),
      }))
      .filter((pkg) => pkg.entries.length > 0);
  }, [deferredQuery, packageId, types, statuses, searchScope]);

  const categories = useMemo(() => groupByCategory(groups), [groups]);
  // Counts per status for the current search, package and types, ignoring the status filter itself.
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pkg of filterApiPackages(deferredQuery, packageId, types, API_STATUSES.map((item) => item.id))) {
      for (const entry of pkg.entries) counts[entry.status] = (counts[entry.status] ?? 0) + 1;
    }
    return counts;
  }, [deferredQuery, packageId, types]);
  // The same for each identifier type, ignoring the type filter itself, so every type shows what choosing it would add.
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pkg of filterApiPackages(deferredQuery, packageId, [], statuses)) {
      for (const entry of pkg.entries) counts[entry.kind] = (counts[entry.kind] ?? 0) + 1;
    }
    return counts;
  }, [deferredQuery, packageId, statuses]);
  const selectedFilterPackage = API_PACKAGES.find((pkg) => pkg.id === packageId);
  const total = groups.reduce((sum, pkg) => sum + pkg.entries.length, 0);
  const selectedPackage = API_PACKAGES.find((pkg) => pkg.id === params.get("package"));
  const selectedEntry = selectedPackage?.entries.find((entry) => entry.name === params.get("api"));
  const detailRequested = params.has("api");
  const searching = deferredQuery.trim() !== "";

  const isFiltered =
    searching || packageId !== "all" || types.length > 0 || statuses.length !== API_STATUSES.length || searchScope !== "all";

  function toggleType(kind: string) {
    setTypes((previous) => (previous.includes(kind) ? previous.filter((item) => item !== kind) : [...previous, kind]));
  }

  function toggleStatus(id: string) {
    setStatuses((previous) => (previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]));
  }

  function choosePackage(id: string) {
    setPackageId(id);
    setOpen(id === "all" ? null : id);
    document.getElementById("api-reference-results")?.scrollIntoView({ block: "start" });
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
    setCollapsed([]);
  }


  if (detailRequested) {
    return (
      <div className={styles.root}>
        {selectedPackage && selectedEntry ? (
          <ApiDetail key={`${selectedPackage.id}:${selectedEntry.name}`} pkg={selectedPackage} entry={selectedEntry} pathname={pathname} />
        ) : (
          <div className={styles.empty}>
            <h1>API entry not found</h1>
            <p>This identifier is not in the reference catalog.</p>
            <Link href={pathname}>Back to API Reference</Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <DashboardPageHeader
        eyebrow="Professional learning / API Docs"
        title="API Reference"
        icon={<FileCode2 />}
        description="Look up any identifier across the stacks you study, see its type and stability at a glance, and open it for a full learning page with syntax, runnable code and practice."
      />

      <dl className={ref.facts} aria-label="Catalog at a glance">
        <div>
          <dt>Technologies</dt>
          <dd>{catalogFacts.packages}</dd>
        </div>
        <div>
          <dt>Identifiers</dt>
          <dd>{catalogFacts.identifiers.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt>Categories</dt>
          <dd>{catalogFacts.categories.length}</dd>
        </div>
        <div>
          <dt>Hand-written guides</dt>
          <dd>{catalogFacts.guides}</dd>
        </div>
      </dl>

      <div className={ref.layout} data-rail={indexRail || undefined}>
        <ApiPackageIndex
          categories={catalogFacts.categories}
          packageId={packageId}
          total={catalogFacts.identifiers}
          rail={indexRail}
          onRailChange={setIndexRail}
          onChoose={choosePackage}
          renderMark={packageMark}
        />

        <div className={ref.main}>
          <section className={ref.toolbar} aria-label="API reference filters">
            <div className={ref.filterCard} data-tone="search">
              <div className={ref.cardHead}>
                <span className={ref.cardIcon} aria-hidden="true">
                  <Search size={14} />
                </span>
                <h2 className={ref.cardTitle}>Search</h2>
                <kbd className={ref.shortcut} aria-hidden="true">
                  Ctrl K
                </kbd>
              </div>
              <label className={ref.search} htmlFor="api-filter-search">
                <Search size={16} aria-hidden="true" />
                <input
                  id="api-filter-search"
                  type="search"
                  aria-label="Filter APIs"
                  placeholder="Identifier or package, e.g. StateGraph"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button type="button" aria-label="Clear API search" onClick={() => setQuery("")} className={ref.clearSearch}>
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </label>
              <div className={ref.segmented} role="group" aria-label="Match search against">
                {SEARCH_SCOPES.map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    aria-pressed={searchScope === scope.id}
                    onClick={() => setSearchScope(scope.id)}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={ref.filterCard} data-tone="package">
              <div className={ref.cardHead}>
                <span className={ref.cardIcon} aria-hidden="true">
                  <Boxes size={14} />
                </span>
                <h2 className={ref.cardTitle}>Package</h2>
              </div>
              <NativeSelect
                aria-label="API package"
                value={packageId}
                onChange={(event) => {
                  setPackageId(event.target.value);
                  setOpen(event.target.value === "all" ? null : event.target.value);
                }}
                className={ref.select}
              >
                <NativeSelectOption value="all">All packages ({API_PACKAGES.length})</NativeSelectOption>
                {catalogFacts.categories.map((category) => (
                  <NativeSelectOptGroup label={category.label} key={category.id}>
                    {category.packages.map((pkg) => (
                      <NativeSelectOption value={pkg.id} key={pkg.id}>
                        {pkg.name} ({pkg.entries.length})
                      </NativeSelectOption>
                    ))}
                  </NativeSelectOptGroup>
                ))}
              </NativeSelect>
              <p className={ref.cardHint}>
                {selectedFilterPackage
                  ? `${selectedFilterPackage.entries.length} identifiers · ${selectedFilterPackage.description}`
                  : `${API_PACKAGES.length} technologies across ${catalogFacts.categories.length} categories`}
              </p>
            </div>

            <div className={ref.filterCard} data-tone="status">
              <div className={ref.cardHead}>
                <span className={ref.cardIcon} aria-hidden="true">
                  <ShieldCheck size={14} />
                </span>
                <h2 className={ref.cardTitle}>Stability</h2>
                <span className={ref.cardMeta}>
                  {statuses.length} of {API_STATUSES.length} shown
                </span>
              </div>
              <div className={ref.statuses} role="group" aria-label="API status filters">
                {API_STATUSES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={statuses.includes(item.id)}
                    className={ref.statusToggle}
                    data-status={item.id}
                    title={STATUS_HINTS[item.id]}
                    onClick={() => toggleStatus(item.id)}
                  >
                    <span className={ref.statusDot} aria-hidden="true" />
                    {item.label}
                    <span className={ref.statusCount} aria-hidden="true">
                      {(statusCounts[item.id] ?? 0).toLocaleString("en-US")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className={ref.filterCard} data-tone="types">
              <div className={ref.cardHead}>
                <span className={ref.cardIcon} aria-hidden="true">
                  <SlidersHorizontal size={14} />
                </span>
                <h2 className={ref.cardTitle}>Identifier types</h2>
              </div>
              <button
                type="button"
                className={ref.typesToggle}
                aria-expanded={showTypes}
                aria-controls="api-type-filters"
                onClick={() => setShowTypes((previous) => !previous)}
              >
                <span>{types.length ? `${types.length} of ${API_TYPES.length} selected` : `All ${API_TYPES.length} types`}</span>
                <AccordionChevron />
              </button>
              <p className={ref.cardHint}>Classes, hooks, functions, components and more.</p>
            </div>

            <div id="api-type-filters" className={ref.typePanel} hidden={!showTypes}>
              <div className={ref.typePanelHead}>
                <h2>Choose identifier types</h2>
                {types.length > 0 && (
                  <button type="button" className={ref.textButton} onClick={() => setTypes([])}>
                    Clear types
                  </button>
                )}
              </div>
              <div className={ref.types} role="group" aria-label="Identifier types">
                {API_TYPES.map((type) => (
                  <button
                    key={type.k}
                    type="button"
                    aria-pressed={types.includes(type.k)}
                    className={ref.typeToggle}
                    onClick={() => toggleType(type.k)}
                  >
                    <Badge kind={type.k} />
                    {type.label}
                    <span className={ref.typeCount} aria-hidden="true" data-empty={!typeCounts[type.k]}>
                      {(typeCounts[type.k] ?? 0).toLocaleString("en-US")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div id="api-reference-results" className={ref.resultsBar}>
            <p role="status">
              <strong>{total.toLocaleString("en-US")}</strong> {total === 1 ? "identifier" : "identifiers"} in{" "}
              <strong>{groups.length}</strong> {groups.length === 1 ? "package" : "packages"}
            </p>
            {isFiltered && (
              <ul className={ref.activeFilters} aria-label="Active filters">
                {searching && (
                  <li>
                    <button type="button" onClick={() => setQuery("")} aria-label={`Remove search ${query.trim()}`}>
                      “{query.trim()}” <X size={12} aria-hidden="true" />
                    </button>
                  </li>
                )}
                {packageId !== "all" && (
                  <li>
                    <button type="button" onClick={() => choosePackage("all")} aria-label="Show all packages">
                      {API_PACKAGES.find((pkg) => pkg.id === packageId)?.name} <X size={12} aria-hidden="true" />
                    </button>
                  </li>
                )}
                {types.map((kind) => (
                  <li key={kind}>
                    <button type="button" onClick={() => toggleType(kind)} aria-label={`Remove type ${kindLabel(kind)}`}>
                      {kindLabel(kind)} <X size={12} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {API_STATUSES.filter((item) => !statuses.includes(item.id)).map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => toggleStatus(item.id)} aria-label={`Show ${item.label} again`}>
                      Hiding {item.label} <X size={12} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className={ref.resultsActions}>
              {groups.length > 0 && !searching && (
                <button
                  type="button"
                  className={ref.textButton}
                  onClick={() => {
                    setCollapsed(expandAll ? [...AGENTIC_FRAMEWORK_ORDER] : []);
                    setExpandAll((previous) => !previous);
                    setOpen(null);
                  }}
                >
                  {expandAll ? "Collapse all" : "Expand all"}
                </button>
              )}
              {isFiltered && (
                <button type="button" className={ref.textButton} onClick={reset}>
                  <RotateCcw size={13} aria-hidden="true" /> Reset
                </button>
              )}
            </div>
          </div>

          {!groups.length && (
            <div className={ref.empty}>
              <h2>No APIs match your filters.</h2>
              <p>
                {searching
                  ? `Nothing named “${query.trim()}” fits the package, types and statuses you chose.`
                  : "The package, types and statuses you chose leave nothing to show."}{" "}
                Widen the filters or try one of these.
              </p>
              <div className={ref.tryRow}>
                {TRY_QUERIES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      reset();
                      setQuery(term);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
              <Button onClick={reset}>Clear all filters</Button>
            </div>
          )}

          {categories.map((category) => (
            <section className={ref.category} key={category.id} aria-labelledby={`api-category-${category.id}`}>
              <h2 id={`api-category-${category.id}`} className={ref.categoryHeading}>
                {category.label}
                <span className={ref.count}>
                  {category.packages.reduce((sum, pkg) => sum + pkg.entries.length, 0).toLocaleString("en-US")}
                </span>
              </h2>
              <div className={ref.packages}>
                {category.packages.map((pkg) => {
                  const agentic = AGENTIC_FRAMEWORK_IDS.has(pkg.id);
                  const isOpen = searching || expandAll || open === pkg.id || packageId === pkg.id || (agentic && !collapsed.includes(pkg.id));
                  const entries = agentic || expanded.includes(pkg.id) || searching ? pkg.entries : pkg.entries.slice(0, 60);
                  const sectionNames = agenticSections(pkg.id);
                  const full = API_PACKAGES.find((item) => item.id === pkg.id);
                  const jsGroups = [...new Set(entries.map((entry) => javascriptGroup(entry.name)))];
                  return (
                    <section
                      key={pkg.id}
                      className={ref.package}
                      data-open={isOpen || undefined}
                      style={{ "--accent": pkg.accent } as CSSProperties}
                    >
                      <header className={ref.packageHead}>
                        <h3>
                          <button
                            type="button"
                            aria-label={`Toggle ${pkg.name}`}
                            aria-expanded={isOpen}
                            aria-controls={`api-group-${pkg.id}`}
                            onClick={() => {
                              if (isOpen) {
                                if (agentic) setCollapsed((previous) => [...previous, pkg.id]);
                                setOpen(null);
                                if (expandAll) setExpandAll(false);
                                if (packageId === pkg.id) setPackageId("all");
                              } else {
                                // One package open at a time: opening this one folds the others, the default-open agentic ones included.
                                setCollapsed(() => [...AGENTIC_FRAMEWORK_IDS].filter((id) => id !== pkg.id));
                                setOpen(pkg.id);
                                if (expandAll) setExpandAll(false);
                              }
                            }}
                          >
                            <span className={ref.packageMark} aria-hidden="true">
                              {packageMark(pkg)}
                            </span>
                            <span className={ref.packageTitle}>
                              <span className={ref.packageName}>{pkg.name}</span>
                              <span className={ref.packageDescription}>{pkg.description}</span>
                            </span>
                            <span className={ref.count}>
                              {pkg.entries.length === full?.entries.length
                                ? pkg.entries.length
                                : `${pkg.entries.length} of ${full?.entries.length}`}
                            </span>
                            <AccordionChevron />
                          </button>
                        </h3>
                      </header>
                      {full && <PackageFacts pkg={full} />}
                      <div id={`api-group-${pkg.id}`} hidden={!isOpen}>
                        {isOpen && <LearningPicture src={learningImageUrl("api", [pkg.id])} alt={`Illustration of how ${pkg.name} works`} />}
                        {isOpen &&
                          (sectionNames ? (
                            sectionNames.map((section) => {
                              const inSection = entries.filter((entry) => agenticSection(pkg.id, entry.name, entry.kind) === section);
                              return inSection.length ? (
                                <div className={ref.subgroup} key={section}>
                                  <h4>
                                    {section} <span className={ref.subgroupCount}>{inSection.length}</span>
                                  </h4>
                                  <ul className={agentic ? `${ref.entries} ${ref.cardGrid}` : ref.entries}>{inSection.map((entry) => <ApiEntryRow key={entry.name} packageId={pkg.id} entry={entry} pathname={pathname} />)}</ul>
                                </div>
                              ) : null;
                            })
                          ) : pkg.id === "javascript" ? (
                            jsGroups.map((group) => (
                              <div className={ref.subgroup} key={group}>
                                <h4>{group}</h4>
                                <ul className={ref.entries}>
                                  {entries.filter((entry) => javascriptGroup(entry.name) === group).map((entry) => <ApiEntryRow key={entry.name} packageId={pkg.id} entry={entry} pathname={pathname} />)}
                                </ul>
                              </div>
                            ))
                          ) : (
                            <ul className={agentic ? `${ref.entries} ${ref.cardGrid}` : ref.entries}>{entries.map((entry) => <ApiEntryRow key={entry.name} packageId={pkg.id} entry={entry} pathname={pathname} />)}</ul>
                          ))}
                        {isOpen && entries.length < pkg.entries.length && (
                          <button
                            type="button"
                            className={ref.showAll}
                            onClick={() => setExpanded((previous) => [...previous, pkg.id])}
                          >
                            Show all {pkg.entries.length} identifiers
                          </button>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          ))}

          <aside className={ref.legend} aria-label="How to read this reference">
            <h2>Reading the reference</h2>
            <dl>
              {API_STATUSES.map((item) => (
                <div key={item.id}>
                  <dt>
                    <span className={ref.statusDot} data-status={item.id} aria-hidden="true" />
                    {item.label}
                  </dt>
                  <dd>{STATUS_HINTS[item.id]}</dd>
                </div>
              ))}
              <div>
                <dt>
                  <span className={ref.guideTag}>Guide</span>
                </dt>
                <dd>A hand-written page with syntax, parameters and a worked example. Other identifiers open a page prepared in the app.</dd>
              </div>
            </dl>
            <p>Statuses describe this catalog snapshot. Check them against the version installed in your project.</p>
          </aside>
        </div>
      </div>

      <AgentBlueprint />
    </div>
  );
}
