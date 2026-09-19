"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, CornerDownLeft, FolderTree, Layers, Lightbulb, ListOrdered, Search, Sparkles, TriangleAlert, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CodeLab } from "./code-lab";
import { CodeFiles } from "./code-files";
import { TerminalBlock } from "./terminal-block";
import { splitCommands } from "@/lib/terminal-commands";
import { KeyText } from "./key-text";
import { AiProviderSwitch, useAiProvider } from "./ai-provider-picker";
import { useAiMode } from "@/lib/ai-mode";
import { referenceErrorMessage } from "@/lib/api-reference-errors";
import type { SearchAnswer } from "@/lib/pro-learn/types";
import type { AwsHighlight, AwsCategory } from "@/lib/pro-learn/aws-highlights";
import { AwsCategoryIcon, AwsServiceIcon } from "./aws-service-icon";
import { AiCategoryIcon, AiTermIcon } from "./ai-term-icon";
import { PythonCategoryIcon, PythonTopicIcon } from "./python-topic-icon";
import { CatalogBrowser } from "./catalog-browser";
import { VocabularyWordIcon } from "./vocabulary-word-icon";
import { Pager } from "./pager";
import { TechnologyCategoryIcon, TechnologyTopicIcon } from "./technology-topic-icon";
import type { TechnologyHandbook } from "@/lib/pro-learn/technology-handbooks";
import styles from "./answer-search.module.css";

type LibraryMatch = { id: string; title: string; technology: string; category: string; description: string };
type Result = { answer: SearchAnswer | null; provider?: string; sources?: string[]; matches: LibraryMatch[]; reason?: string };
/** One question and what came back for it, keyed by the normalised question so asking twice reuses the answer. */
type Card = { id: string; question: string; at: number; status: "loading" | "ready" | "error"; result?: Result; error?: string };

const CARDS_KEY = "masterclass:ai-search:cards";
/** Eight pages of history is plenty to look back through, and stays inside the storage budget. */
const MAX_CARDS = 24;
/** One row, so the index stays a strip above the search box rather than a wall of cards. */
const PER_PAGE = 3;

const cardKey = (question: string) => question.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Fill in an answer whose shape predates the one this build expects.
 *
 * Two things hand us an answer: localStorage, written by whatever build the
 * reader last used, and the API, which may briefly be an older deployment than
 * the page calling it. Neither is guaranteed to carry a list this build reads,
 * and a missing one used to take the whole page down on restore. Repairing
 * beats dropping — the answer is still good, and the history is the reader's —
 * so every list is defaulted here and the rendering code can trust the shape.
 */
function reviveAnswer(answer: Partial<SearchAnswer> | null | undefined): SearchAnswer | null {
  if (!answer?.headline) return null;
  return {
    headline: answer.headline,
    definition: answer.definition ?? "",
    summary: answer.summary ?? "",
    steps: answer.steps ?? [],
    alternatives: answer.alternatives ?? [],
    useCases: answer.useCases ?? [],
    subjects: answer.subjects ?? [],
    files: answer.files ?? [],
    keyPoints: answer.keyPoints ?? [],
    caveats: answer.caveats ?? [],
    followUps: answer.followUps ?? [],
  };
}

/** Answered searches survive a reload; a half-finished one does not, because nothing is in flight after it. */
function readCards(): Card[] {
  try {
    const stored = JSON.parse(localStorage.getItem(CARDS_KEY) ?? "[]") as Card[];
    if (!Array.isArray(stored)) return [];
    return stored.filter(card => card?.id && card.status === "ready" && card.result).slice(0, MAX_CARDS)
      .map(card => ({ ...card, result: { ...card.result!, answer: reviveAnswer(card.result!.answer) } }));
  } catch { return []; }
}
/** Answers can be large, so a full store sheds the oldest rather than losing the lot. */
function storeCards(cards: Card[]) {
  const keep = cards.filter(card => card.status === "ready").slice(0, MAX_CARDS);
  for (let size = keep.length; size > 0; size--) {
    try { localStorage.setItem(CARDS_KEY, JSON.stringify(keep.slice(0, size))); return; }
    catch { /* Over quota: try again with fewer. */ }
  }
  try { localStorage.removeItem(CARDS_KEY); } catch { /* Nothing more to do. */ }
}

function whenLabel(at: number) {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/**
 * Ask a question; read the answer; browse what you asked before.
 *
 * The page holds one answer open at a time as a document, and keeps every other
 * answer as an index entry. That split is the design: the thing being read gets
 * reading treatment, and the things worth returning to get uniform, scannable
 * treatment. Reopening an entry is instant — the answer is already here, so
 * nothing is ever generated twice.
 *
 * The index sits above the search box rather than under the answer: it is the
 * shelf you reach for before asking, and putting it first means a question you
 * have already asked is one glance away instead of one scroll past a long
 * document. The search box stays sticky, so it follows you down the answer.
 *
 * With AI Mode off, or no model configured, the page still answers from the
 * app's own notes can still ground the answer, but the reader sees one focused
 * answer document rather than a second notes index beneath every result.
 */
export function AnswerSearch({ initialQuestion = "", awsServices = [], awsCategories = [], aiGlossary = [], aiGlossaryCategories = [], pythonHandbook = [], pythonCategories = [], technologyHandbooks = [] }: {
  initialQuestion?: string; awsServices?: AwsHighlight[]; awsCategories?: AwsCategory[];
  aiGlossary?: AwsHighlight[]; aiGlossaryCategories?: AwsCategory[];
  pythonHandbook?: AwsHighlight[]; pythonCategories?: AwsCategory[];
  technologyHandbooks?: readonly TechnologyHandbook[];
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeId, setActiveId] = useState("");
  const [page, setPage] = useState(0);
  const { providers, provider, choose } = useAiProvider();
  const [aiMode] = useAiMode();
  const pending = useRef(new Map<string, AbortController>());
  const answerRef = useRef<HTMLDivElement>(null);
  // React defers a setState updater to render time, but asking a question needs
  // to know *now* whether it already has an answer. Every mutation goes through
  // `commit`, so this ref is the synchronous truth and `cards` the view.
  const cardsRef = useRef<Card[]>([]);
  const commit = useCallback((update: (previous: Card[]) => Card[]) => {
    cardsRef.current = update(cardsRef.current);
    setCards(cardsRef.current);
    return cardsRef.current;
  }, []);

  // Restoring only fills an empty stack: a question asked before this lands must not be dropped.
  useEffect(() => {
    void Promise.resolve().then(() => {
      const restored = commit(previous => previous.length ? previous : readCards());
      setActiveId(current => current || restored[0]?.id || "");
    });
  }, [commit]);
  useEffect(() => { const running = pending.current; return () => { for (const controller of running.values()) controller.abort(); }; }, []);

  const open = useCallback((id: string) => {
    setActiveId(id);
    // Bring the reader back to the document they just chose.
    requestAnimationFrame(() => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const ask = useCallback(async (value: string) => {
    const query = value.trim();
    if (query.length < 3) return;
    const id = cardKey(query);
    setQuestion(query);

    // Already answered: reopen it rather than paying for the same answer twice.
    const known = cardsRef.current.find(card => card.id === id);
    if (known && known.status !== "error") { open(id); return; }

    pending.current.get(id)?.abort();
    const controller = new AbortController();
    pending.current.set(id, controller);
    commit(previous => [{ id, question: query, at: Date.now(), status: "loading" } as Card, ...previous.filter(card => card.id !== id)].slice(0, MAX_CARDS));
    setActiveId(id);
    setPage(0);

    const settle = (patch: Partial<Card>) => storeCards(commit(previous => previous.map(item => (item.id === id ? { ...item, ...patch } as Card : item))));

    try {
      const response = await fetch("/api/pro-learn/answer", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ question: query, ...(provider ? { provider } : {}), aiMode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "search_failed");
      if (controller.signal.aborted) return;
      settle({ status: "ready", result: {
        answer: reviveAnswer(payload.answer),
        provider: typeof payload.provider === "string" ? payload.provider : undefined,
        sources: Array.isArray(payload.sources) ? payload.sources.filter((item: unknown) => typeof item === "string") : [],
        matches: Array.isArray(payload.matches) ? payload.matches : [],
        reason: typeof payload.reason === "string" ? payload.reason : undefined,
      } });
    } catch (failure) {
      if (controller.signal.aborted) return;
      settle({ status: "error", error: failure instanceof TypeError ? "network_error" : failure instanceof Error ? failure.message : "search_failed" });
    } finally {
      pending.current.delete(id);
    }
  }, [provider, aiMode, commit, open]);

  useEffect(() => {
    if (initialQuestion.trim().length < 3) return;
    void Promise.resolve().then(() => ask(initialQuestion));
  }, [initialQuestion, ask]);

  function forget(id: string) {
    pending.current.get(id)?.abort();
    pending.current.delete(id);
    const next = commit(previous => previous.filter(card => card.id !== id));
    storeCards(next);
    if (activeId === id) setActiveId(next[0]?.id ?? "");
  }

  const active = cards.find(card => card.id === activeId) ?? cards[0];
  const history = useMemo(() => cards.filter(card => card.id !== active?.id && card.status === "ready"), [cards, active?.id]);
  const pages = Math.max(1, Math.ceil(history.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const visible = history.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);

  return <section className={styles.page} aria-label="Search">
    <header className={styles.head}>
      <h1>Search</h1>
      <p>Ask a question and get the answer first, then the steps to act on it — with what your own notes already cover.</p>
    </header>

    {!!history.length && <section className={styles.history} aria-labelledby="earlier-searches">
      <div className={styles.historyHead}>
        <h2 id="earlier-searches">Earlier searches</h2>
        <span className={styles.historyCount}>{history.length} saved</span>
      </div>
      <ul className={styles.grid} key={current}>
        {visible.map(card => <HistoryEntry key={card.id} card={card} onOpen={() => open(card.id)} onForget={() => forget(card.id)} />)}
      </ul>
      {pages > 1 && <Pager page={current} pages={pages} onPage={setPage} label="Earlier searches pages" />}
    </section>}

    <div className={styles.panel}>
      {/* The field is a div, not a label: it holds the model switch, and a label
          would forward every click on it to the input. The input names itself. */}
      <form className={styles.searchRow} onSubmit={event => { event.preventDefault(); void ask(question); }} role="search">
        <div className={styles.field}>
          <Search size={18} aria-hidden="true" />
          <Input type="search" aria-label="Ask a question" placeholder="How do I upgrade React without breaking my app?" value={question} onChange={event => setQuestion(event.target.value)} />
          {question && <button type="button" className={styles.clear} aria-label="Clear question" onClick={() => setQuestion("")}><X size={15} /></button>}
          {aiMode && <AiProviderSwitch providers={providers} provider={provider} onChoose={choose} label="Answer with" />}
        </div>
        <button type="submit" className={styles.submit} disabled={question.trim().length < 3}>
          Ask <CornerDownLeft size={15} aria-hidden="true" />
        </button>
      </form>
      {!aiMode && <p className={styles.modeOff} role="status"><Sparkles size={13} aria-hidden="true" />AI Mode is off. Questions are answered from your own notes — turn it on in the sidebar for a generated answer.</p>}
    </div>

    {/* Only promise the cards when there are cards to promise. */}
    {!cards.length && <p className={styles.empty} role="status">Your answers collect here. Ask a question to start{awsServices.length ? ", or pick a service below" : ""}.</p>}

    {active && <div ref={answerRef} className={styles.answerWrap}>
      <AnswerDocument key={active.id} card={active} providers={providers}
        onAsk={item => void ask(item)} onRetry={() => { forget(active.id); void ask(active.question); }} onForget={() => forget(active.id)} />
    </div>}

    {!!awsServices.length && <CatalogBrowser id="popular-aws" title="Popular AWS services" noun="services"
      description="The services you meet first, in the order most learners meet them. Pick one to ask about it."
      items={awsServices} categories={awsCategories}
      itemIcon={item => <AwsServiceIcon name={item.name} category={item.category} />}
      categoryIcon={category => <AwsCategoryIcon category={category} />}
      question={item => `What is ${item.name}, what is it for, and when should I use it?`}
      onAsk={question => void ask(question)} />}

    {!!aiGlossary.length && <CatalogBrowser id="ai-glossary" title="AI terms worth knowing" noun="terms"
      description="The working vocabulary of building with language models, grouped by the question each term answers."
      items={aiGlossary} categories={aiGlossaryCategories}
      itemIcon={item => <AiTermIcon name={item.name} category={item.category} />}
      categoryIcon={category => <AiCategoryIcon category={category} />}
      question={item => `Explain ${item.name} in the context of building with AI: what it means, why it matters, and how it is used in practice.`}
      onAsk={question => void ask(question)} />}

    {!!pythonHandbook.length && <CatalogBrowser id="python-handbook" title="Python handbook" noun="topics"
      description="The language as it is usually taught — values, collections, control flow, functions, objects, then the craft around them."
      items={pythonHandbook} categories={pythonCategories}
      itemIcon={item => <PythonTopicIcon name={item.name} category={item.category} />}
      categoryIcon={category => <PythonCategoryIcon category={category} />}
      question={item => `Explain ${item.name} in Python: what it is, how it works, a short runnable example, and the mistakes people make with it.`}
      onAsk={question => void ask(question)} />}

    {technologyHandbooks.map(handbook => <CatalogBrowser key={handbook.title} id={handbook.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} title={handbook.title} noun="topics"
      description={handbook.description} items={handbook.topics} categories={handbook.categories}
      itemIcon={item => item.vocabulary
        ? <VocabularyWordIcon word={item.name} meaning={item.vocabulary.meaning} category={item.category} />
        : <TechnologyTopicIcon category={item.category} />}
      categoryIcon={category => <TechnologyCategoryIcon category={category} />}
      question={item => `Explain ${item.name} in ${handbook.questionPrefix}: what it is, how it works, a short runnable example, and the mistakes people make with it.`}
      onAsk={question => void ask(question)} />)}
  </section>;
}

/** An index entry: enough to recognise an answer, nothing more. */
function HistoryEntry({ card, onOpen, onForget }: { card: Card; onOpen: () => void; onForget: () => void }) {
  const answer = card.result?.answer ?? null;
  return <li className={styles.entry}>
    <button type="button" className={styles.entryOpen} aria-label={`Open ${card.question}`} onClick={onOpen}>
      <span className={styles.entryQuestion}>{card.question}</span>
      <span className={styles.entryAnswer}>{answer?.headline ?? "Answered from your notes"}</span>
      <span className={styles.entryFoot}>
        <span className={styles.entryWhen}>{whenLabel(card.at)}</span>
        {answer && <span className={styles.entryCounts}>
          <span>{answer.steps.length} steps</span>
          {!!answer.files.length && <span>{answer.files.length} files</span>}
        </span>}
      </span>
    </button>
    <button type="button" className={styles.entryForget} aria-label={`Forget ${card.question}`} onClick={onForget}><X size={13} /></button>
  </li>;
}

function AnswerDocument({ card, providers, onAsk, onRetry, onForget }: {
  card: Card; providers: { id: string; label: string }[];
  onAsk: (question: string) => void; onRetry: () => void; onForget: () => void;
}) {
  const answer = card.result?.answer ?? null;
  return <article className={styles.answer} aria-label={card.question}>
    <header className={styles.answerHead}>
      <p className={styles.asked}>{card.question}</p>
      <button type="button" className={styles.forget} aria-label={`Forget ${card.question}`} onClick={onForget}><X size={14} /></button>
    </header>

    {card.status === "loading" && <div className={styles.skeleton} role="status" aria-live="polite">
      <span className={styles.srOnly}>Searching for an answer</span>
      <div className={styles.skeletonHeadline} /><div className={styles.skeletonLine} /><div className={styles.skeletonLine} />
      {[0, 1, 2].map(index => <div key={index} className={styles.skeletonStep} />)}
    </div>}

    {card.status === "error" && <div className={styles.error} role="alert">
      <p>{referenceErrorMessage(card.error)}</p>
      <button type="button" onClick={onRetry}>Try again</button>
    </div>}

    {card.status === "ready" && card.result && <div className={styles.body}>
      {answer ? <>
        <h2 className={styles.headline}><KeyText text={answer.headline} /></h2>
        {answer.definition && <p className={styles.definition}><KeyText text={answer.definition} /></p>}
        <p className={styles.summary}><KeyText text={answer.summary} /></p>

        {!!answer.subjects.length && <Block icon={<Layers size={16} aria-hidden="true" />} title="Each one explained" className={styles.subjectsBlock} count={answer.subjects.length}>
          <ul className={styles.subjects}>{answer.subjects.map(subject => <li key={subject.name} className={styles.subject}>
            <h4 className={styles.subjectName}><KeyText text={subject.name} /></h4>
            {subject.summary && <p className={styles.subjectSummary}><KeyText text={subject.summary} /></p>}
            {!!subject.details.length && <ul className={styles.subjectDetails}>
              {subject.details.map(detail => <li key={detail}><KeyText text={detail} /></li>)}
            </ul>}
            {!!subject.keyPoints.length && <div className={styles.subjectPoints}>
              <h5>Key points</h5>
              <ul className={styles.points}>{subject.keyPoints.map(point => <li key={point}><KeyText text={point} /></li>)}</ul>
            </div>}
          </li>)}</ul>
        </Block>}

        <Block icon={<ListOrdered size={16} aria-hidden="true" />} title="Step by step" className={styles.steps}>
          <ol>{answer.steps.map((step, index) => <li key={step.title}>
            <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h4><KeyText text={step.title} /></h4>
              <p><KeyText text={step.detail} /></p>
              {step.code && <CodeSample title={step.title} code={step.code} />}
            </div>
          </li>)}</ol>
        </Block>

        {!!answer.useCases.length && <Block icon={<Lightbulb size={16} aria-hidden="true" />} title="Where this comes up" fold count={answer.useCases.length}>
          <ul className={styles.useCases}>{answer.useCases.map(item => <li key={item.title}>
            <strong><KeyText text={item.title} /></strong>
            {item.scenario && <p><KeyText text={item.scenario} /></p>}
            {item.example && <CodeSample title={item.title} code={item.example} />}
          </li>)}</ul>
        </Block>}

        {!!answer.files.length && <Block icon={<FolderTree size={16} aria-hidden="true" />} title="Code example" fold count={answer.files.length}>
          <CodeFiles files={answer.files} label="Project files" />
        </Block>}

        {!!answer.keyPoints.length && <Block icon={<Check size={16} aria-hidden="true" />} title="Worth remembering">
          <ul className={styles.points}>{answer.keyPoints.map(point => <li key={point}><KeyText text={point} /></li>)}</ul>
        </Block>}

        {!!answer.caveats.length && <Block icon={<TriangleAlert size={16} aria-hidden="true" />} title="Watch out for" tone="warn">
          <ul className={styles.points}>{answer.caveats.map((point, index) => {
            const text = typeof point === "string" ? point : point.text;
            const code = typeof point === "string" ? `// ${text}\nconsole.log("Review this edge case before shipping.");` : point.code;
            return <li key={`${text}-${index}`}><KeyText text={text} />{code && <CodeSample title={`Watch out ${index + 1}`} code={code} />}</li>;
          })}</ul>
        </Block>}

        <p className={styles.provenance}>
          <span>Answered with {providers.find(item => item.id === card.result?.provider)?.label ?? card.result?.provider ?? "the configured model"}</span>
          {card.result.sources?.length ? <span className={styles.hosts}>{card.result.sources.map(host => <span key={host}>{host}</span>)}</span> : null}
        </p>

        {!!answer.followUps.length && <Block icon={<ArrowRight size={16} aria-hidden="true" />} title="Ask next">
          <div className={styles.chips}>{answer.followUps.map(item => <button key={item} type="button" onClick={() => onAsk(item)}>{item}</button>)}</div>
        </Block>}
      </> : <div className={styles.noModel} role="status">
        <p>{referenceErrorMessage(card.result.reason)}</p>
        <p>No generated answer is available for this search yet.</p>
      </div>}
    </div>}
  </article>;
}

/**
 * A code sample, with anything meant for a shell lifted into its own terminal.
 * Source stays in the editor; `npm install …` goes where it will be typed.
 */
function CodeSample({ title, code }: { title: string; code: string }) {
  return <>{splitCommands(code).map((segment, index) => segment.kind === "shell"
    ? <TerminalBlock key={index} lines={segment.lines} />
    : <CodeLab key={index} title={title} code={formatCode(segment.code)} />)}</>;
}

/** Keep compact generated snippets readable in the line-numbered editor. */
function formatCode(code: string) {
  const source = code.trim();
  if (source.includes("\n")) return source;
  return source.replace(/;\s+(?=(?:import|export|const|let|var|if|return|throw|console\.|function|class)\b)/g, ";\n");
}

/**
 * A titled section. The rule and the icon carry the structure, so the heading
 * can just read as a heading.
 *
 * `fold` closes a section behind its own title. The page should open on the
 * answer and the steps — the way a search result does — so the supporting
 * material is one click away rather than something to scroll past. The count in
 * the title says what is inside, so nothing is hidden, only folded.
 */
function Block({ icon, title, children, className = "", tone, fold, count }: {
  icon: ReactNode; title: string; children: ReactNode; className?: string; tone?: "warn"; fold?: boolean; count?: number;
}) {
  const head = <>
    <span className={styles.blockIcon}>{icon}</span>
    {title}
    {count ? <span className={styles.blockCount}>{count}</span> : null}
  </>;
  return <section className={`${styles.block} ${className}`.trim()} data-tone={tone} aria-label={title}>
    {fold
      ? <details className={styles.fold}>
          <summary className={styles.blockTitle}>{head}<ChevronDown size={15} className={styles.foldMark} aria-hidden="true" /></summary>
          <div className={styles.foldBody}>{children}</div>
        </details>
      : <><h3 className={styles.blockTitle}>{head}</h3>{children}</>}
  </section>;
}
