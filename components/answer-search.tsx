"use client";

import { awsServiceImageUrl } from "@/lib/aws-service-image";
import learningCard from "./learning-card.module.css";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Building2, Check, ChevronDown, ChevronLeft, ChevronRight, CornerDownLeft, FolderTree, GraduationCap, Images, Layers, Lightbulb, ListOrdered, Search, Sigma, Sparkles, TriangleAlert, X } from "lucide-react";
import { LearningDiagram } from "./learning-diagram";
import { learningDiagramSchema } from "@/lib/pro-learn/learning-diagram";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { SearchSectionIcon } from "./search-section-icon";
import dynamic from "next/dynamic";
import { DeferredHandbook } from "./deferred-handbook";
const CodeLab = dynamic(() => import("./code-lab").then(module => module.CodeLab), { loading: () => <div style={{ minHeight: 240 }} role="status">Loading code editor?</div> });
import { CodeFiles } from "./code-files";
import { inferLanguage } from "@/lib/code-run";
import { TerminalBlock } from "./terminal-block";
import { GitWalkthrough } from "./git-walkthrough";
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
import { CatalogBrowser, type CatalogItem } from "./catalog-browser";
import { summaryExplanation } from "@/lib/pro-learn/prepared-explanation";
import { classroomExplanation } from "@/lib/pro-learn/classroom/lessons";
import { VocabularyWordIcon } from "./vocabulary-word-icon";
import { Pager } from "./pager";
import { TechnologyCategoryIcon, TechnologyTopicIcon } from "./technology-topic-icon";
import { ClassroomTopicIcon } from "./classroom-topic-icon";
import { OfficialScreens } from "./official-screens";
import { screensFor, type OfficialScreen } from "@/lib/media/official-screens";
import { essentialPoints } from "@/lib/pro-learn/essentials";
import { BrandMark, TopicCover, hasTopicMedia } from "./topic-media";
import type { TechnologyHandbook } from "@/lib/pro-learn/technology-handbooks";
import type { Catalogue } from "@/lib/pro-learn/catalogue";
import { stripCitationsDeep } from "@/lib/strip-citations";
import styles from "./answer-search.module.css";

type LibraryMatch = { id: string; title: string; technology: string; category: string; description: string };
type Result = { walkthrough?: "git"; answer: SearchAnswer | null; provider?: string; matches: LibraryMatch[]; reason?: string; prepared?: "exam" | "interview"; topic?: { subject: string; name: string; summary: string }; screens?: readonly OfficialScreen[];
  /** The rest of the opened topic's own category: what else this area covers. */
  related?: readonly { name: string; summary: string }[] };
/** One question and what came back for it, keyed by the normalised question so asking twice reuses the answer. */
type Card = { id: string; question: string; at: number; status: "loading" | "ready" | "error"; result?: Result; error?: string };

const EMPTY_ITEMS: never[] = [];

const CARDS_KEY = "masterclass:ai-search:cards";
/** Eight pages of history is plenty to look back through, and stays inside the storage budget. */
const MAX_CARDS = 24;
/** One row, so the index stays a strip above the search box rather than a wall of cards. */
const PER_PAGE = 3;
/** Section tabs shown at once. The rest are a page turn away, not a side-scroll. */
const SECTIONS_PER_PAGE = 3;

const cardKey = (question: string) => question.trim().toLowerCase().replace(/\s+/g, " ");
const contentKey = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");
/** A step title as a file name: "Worked example" becomes "worked-example". */
const slugPath = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").slice(0, 3).join("-").slice(0, 28).replace(/-$/, "") || "example";
const EXTENSIONS: Record<string, string> = { python: "py", dockerfile: "Dockerfile", bash: "sh", hcl: "tf", yaml: "yml", json: "json", tsx: "tsx", jsx: "jsx", typescript: "ts", javascript: "js", text: "txt" };
const fileExtension = (code: string) => EXTENSIONS[inferLanguage(code)] ?? "txt";
/**
 * A title that carries no information beyond the step's own number.
 *
 * The list is numbered, so "Step 2" or "Key idea 2" above the second item is
 * furniture. Matched at render time rather than only at the source, because
 * answers arrive from the model and from localStorage as well.
 */
const isGeneratedStepTitle = (title: string) => /^(key idea|step)\s*\d+[.:]?$/i.test(title.trim());

function uniqueText<T>(items: T[], text: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = contentKey(text(item));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function keyPointIcon(point: string) {
  const text = point.toLowerCase();
  if (/security|auth|permission|secret|token|attack|protect/.test(text)) return <TriangleAlert size={15} aria-hidden="true" />;
  if (/data|cache|database|state|store|query|redis|schema/.test(text)) return <Layers size={15} aria-hidden="true" />;
  if (/performance|speed|fast|optimi|build|deploy|automation/.test(text)) return <Sparkles size={15} aria-hidden="true" />;
  return <Lightbulb size={15} aria-hidden="true" />;
}

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
    diagrams: (Array.isArray(answer.diagrams) ? answer.diagrams : []).flatMap(diagram => {
      const parsed = learningDiagramSchema.safeParse(diagram);
      return parsed.success ? [parsed.data] : [];
    }),
    definition: answer.definition ?? "",
    summary: answer.summary ?? "",
    steps: answer.steps ?? [],
    alternatives: answer.alternatives ?? [],
    useCases: answer.useCases ?? [],
    industries: answer.industries ?? [],
    subjects: answer.subjects ?? [],
    formulas: answer.formulas ?? [],
    worked: (answer.worked ?? []).map(item => ({ ...item, steps: item.steps ?? [], answer: item.answer ?? "" })),
    files: answer.files ?? [],
    keyPoints: answer.keyPoints ?? [],
    caveats: answer.caveats ?? [],
    followUps: answer.followUps ?? [],
  };
}

/** Answered searches survive a reload; a half-finished one does not, because nothing is in flight after it. */
function readCards(): Card[] {
  try {
    // Answers saved before citation markers were stripped are cleaned on the way back in.
    const stored = stripCitationsDeep(JSON.parse(localStorage.getItem(CARDS_KEY) ?? "[]")) as Card[];
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
export function AnswerSearch({ initialQuestion = "", heading = "Search", intro = "Ask a question and get the answer first, then the steps to act on it — with what your own notes already cover.", emptyNoun = "service", search = true, catalogues = EMPTY_ITEMS, awsServices = EMPTY_ITEMS, awsCategories = EMPTY_ITEMS, aiGlossary = EMPTY_ITEMS, aiGlossaryCategories = EMPTY_ITEMS, pythonHandbook = EMPTY_ITEMS, pythonCategories = EMPTY_ITEMS, technologyHandbooks = EMPTY_ITEMS, deferredHandbooks = EMPTY_ITEMS }: {
  initialQuestion?: string; heading?: string; intro?: string; emptyNoun?: string;
  /**
   * Whether the page asks as well as browses.
   *
   * Class Room is a syllabus, not a search engine: the reader arrives to pick a
   * topic off a shelf, and a question box plus a list of what they asked
   * yesterday sits between them and that shelf. Turning this off drops the
   * search row and the earlier-searches index; the answer modal still opens,
   * because a card still asks its own question.
   */
  search?: boolean;
  catalogues?: readonly Catalogue[];
  awsServices?: AwsHighlight[]; awsCategories?: AwsCategory[];
  aiGlossary?: AwsHighlight[]; aiGlossaryCategories?: AwsCategory[];
  pythonHandbook?: AwsHighlight[]; pythonCategories?: AwsCategory[];
  technologyHandbooks?: readonly TechnologyHandbook[];
  deferredHandbooks?: readonly Omit<TechnologyHandbook, "topics">[];
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeId, setActiveId] = useState("");
  const [page, setPage] = useState(0);
  // The answer reads in a modal, so opening one is a separate act from having
  // one: closing the modal must leave the answer in the history, not forget it.
  const [reading, setReading] = useState(false);
  const [preparedCard, setPreparedCard] = useState<Card | null>(null);
  // The group the open answer came from, so a related topic in the modal can be
  // opened in place without the modal knowing which catalogue produced it.
  const [group, setGroup] = useState<{ technology: string; classroom: boolean; items: CatalogItem[] } | null>(null);
  const explain = useCallback((item: CatalogItem, technology: string, classroom = false, siblings: CatalogItem[] = []) => {
    const lesson = item.prepared ?? (classroom ? classroomExplanation(technology, item) : summaryExplanation(item.name, item.summary, item.category));
    // A catalogue row carries one summary sentence, which alone makes a thin
    // list of things worth remembering. The technology's authored essentials are
    // merged in here rather than on the server, so the same points are not
    // serialized once per topic into the page payload.
    const extra = essentialPoints(technology, item.category);
    const answer = {
      ...lesson.answer,
      keyPoints: [...new Set([...lesson.answer.keyPoints, ...extra])],
      useCases: item.useCase
        ? [{ ...item.useCase, example: "" }, ...lesson.answer.useCases.filter(entry => entry.scenario !== item.useCase?.scenario)]
        : lesson.answer.useCases,
      industries: item.industries ? [...item.industries] : lesson.answer.industries,
    };
    const related = siblings.filter(other => other.name !== item.name).map(other => ({ name: other.name, summary: other.summary }));
    setGroup(siblings.length ? { technology, classroom, items: siblings } : null);
    setPreparedCard({ id: `prepared:${technology}:${item.category}:${item.name}`, question: `${item.name} · ${item.category}`, at: 0, status: "ready",
      result: { answer, walkthrough: lesson.walkthrough, matches: [], prepared: lesson.kind, screens: screensFor(technology, item.category, item.name), related,
        topic: { subject: technology, name: item.name, summary: item.summary } } });
    setReading(true);
  }, []);
  const { providers, provider, choose } = useAiProvider();
  const [aiMode] = useAiMode();
  const pending = useRef(new Map<string, AbortController>());
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
    setPreparedCard(null);
    setActiveId(id);
    setReading(true);
  }, []);

  const ask = useCallback(async (value: string) => {
    setPreparedCard(null);
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
    setReading(true);
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
    // Forgetting what is being read closes the modal rather than swapping a
    // different answer in under the reader.
    if (activeId === id) { setActiveId(next[0]?.id ?? ""); setReading(false); }
  }

  const active = preparedCard ?? cards.find(card => card.id === activeId) ?? cards[0];
  // Only the answer actually being read is held out of the index. With the
  // modal closed there is nothing else showing it, so an answer that dropped
  // out of both would simply disappear.
  const history = useMemo(() => cards.filter(card => !(reading && card.id === active?.id) && card.status === "ready"), [cards, active?.id, reading]);
  const pages = Math.max(1, Math.ceil(history.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const visible = history.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);

  /**
   * Every catalogue the page offers.
   *
   * The page's own catalogues are alphabetical, so a reader looking for one
   * knows where to look. Catalogues handed in whole keep the order they came
   * in and follow: Class Room's are Maths, Physics, Chemistry, English and
   * then the exam groups, which alphabetising would scramble.
   *
   * Built as data rather than markup so the tab strip and the panel read from
   * one list: a section cannot appear as a tab without a body, or the reverse.
   * Each `render` stays a thunk because only the open section is mounted —
   * twenty-three catalogues rendered at once is what made this a scroll.
   */
  const sections = useMemo(() => [
    ...(awsServices.length ? [{ id: "popular-aws", title: "Popular AWS services", render: () =>
      <CatalogBrowser id="popular-aws" title="Popular AWS services" technology="AWS" noun="services"
        description="The services you meet first, in the order most learners meet them. Pick one to ask about it."
        items={awsServices} categories={awsCategories}
        cover={<TopicCover label="AWS" />}
        onExplain={(item, group) => explain(item, "AWS", false, group)}
        itemIcon={item => <AwsServiceIcon name={item.name} category={item.category} />}
        itemImage={item => { const src = awsServiceImageUrl(item.name); return src ? { src, alt: `Illustration of what ${item.name} does` } : null; }}
        categoryIcon={category => <AwsCategoryIcon category={category} />}
        question={item => `What is ${item.name}, what is it for, and when should I use it?`}
        onAsk={value => void ask(value)} /> }] : []),
    ...(aiGlossary.length ? [{ id: "ai-glossary", title: "AI terms worth knowing", render: () =>
      <CatalogBrowser id="ai-glossary" title="AI terms worth knowing" technology="AI terms" noun="terms"
        description="The working vocabulary of building with language models, grouped by the question each term answers."
        items={aiGlossary} categories={aiGlossaryCategories}
        onExplain={(item, group) => explain(item, "AI terms", false, group)}
        itemIcon={item => <AiTermIcon name={item.name} category={item.category} />}
        categoryIcon={category => <AiCategoryIcon category={category} />}
        question={item => `Explain ${item.name} in the context of building with AI: what it means, why it matters, and how it is used in practice.`}
        onAsk={value => void ask(value)} /> }] : []),
    ...(pythonHandbook.length ? [{ id: "python-handbook", title: "Python handbook", render: () =>
      <CatalogBrowser id="python-handbook" title="Python handbook" technology="Python" noun="topics"
        description="The language as it is usually taught — values, collections, control flow, functions, objects, then the craft around them."
        items={pythonHandbook} categories={pythonCategories}
        cover={<TopicCover label="Python" />}
        onExplain={(item, group) => explain(item, "Python", false, group)}
        itemIcon={item => <PythonTopicIcon name={item.name} category={item.category} />}
        categoryIcon={category => <PythonCategoryIcon category={category} />}
        question={item => `Explain ${item.name} in Python: what it is, how it works, a short runnable example, and the mistakes people make with it.`}
        onAsk={value => void ask(value)} /> }] : []),
    ...[...technologyHandbooks, ...deferredHandbooks].map(handbook => ({
      id: handbook.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: handbook.title,
      render: () => {
        const renderBook = (handbook: TechnologyHandbook) => <CatalogBrowser id={handbook.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} title={handbook.title} noun="topics"
        description={handbook.description} items={handbook.topics} categories={handbook.categories}
        cover={<TopicCover label={handbook.title} />}
        onExplain={(item, group) => explain(item, handbook.title, false, group)}
        // A package handbook lists products — axios, boto3, @nestjs/common —
        // so those rows get the real mark. Concept rows ("Refs and the DOM")
        // match no brand and keep the category glyph.
        itemIcon={item => {
          if (item.vocabulary) return <VocabularyWordIcon word={item.name} meaning={item.vocabulary.meaning} category={item.category} />;
          if (hasTopicMedia(item.name)) return <BrandMark label={item.name} size={15} />;
          return <TechnologyTopicIcon category={item.category} />;
        }}
        categoryIcon={category => <TechnologyCategoryIcon category={category} />}
        question={item => `Explain ${item.name} in ${handbook.questionPrefix}: what it is, how it works, a short runnable example, and the mistakes people make with it.`}
        onAsk={value => void ask(value)} />;
        const complete = technologyHandbooks.find(book => book.title === handbook.title);
        return complete ? renderBook(complete) : <DeferredHandbook key={handbook.title} title={handbook.title}>{renderBook}</DeferredHandbook>;
      },
    })),
  ].sort((a, b) => a.title.localeCompare(b.title)).concat(
      // Catalogues supplied whole by the caller. Class Room passes only these;
      // the search page still passes its own three plus the handbooks. They sit
      // outside the sort above, in the order the caller listed them.
      //
      // These are categorised by class or by exam, so the per-category icon the
      // handbooks use would give every card in a subject the same mark. The
      // resolvers here read the topic itself, and draw its diagram where the
      // subject has one.
      catalogues.map(entry => ({
        id: entry.id,
        title: entry.title,
        render: () => <CatalogBrowser id={entry.id} title={entry.title} noun={entry.noun}
          description={entry.description} items={entry.topics} categories={entry.categories}
          cover={<TopicCover label={entry.title} catalogueId={entry.id} />}
          onExplain={(item, group) => explain(item, entry.id, true, group)}
          itemIcon={item => <ClassroomTopicIcon subject={entry.id} name={item.name} summary={item.summary} />}
          categoryIcon={category => category.startsWith("Class ") ? <GraduationCap size={14} aria-hidden="true" /> : <ClassroomTopicIcon subject={entry.id} name={category} />}
          question={item => `${entry.questionPrefix} ${item.name} (${entry.title}, ${item.category}). Include a labeled learning diagram, step-by-step explanation, a worked example and common mistakes. ${item.summary}`.slice(0, 400)}
          onAsk={value => void ask(value)} />,
      }))
  ), [awsServices, awsCategories, aiGlossary, aiGlossaryCategories, pythonHandbook, pythonCategories, technologyHandbooks, deferredHandbooks, catalogues, ask, explain]);

  return <section className={styles.page} aria-label="Search">
    <header className={styles.head}>
      <h1>{heading}</h1>
      <p>{intro}</p>
    </header>

    {search && !!history.length && <section className={styles.history} aria-labelledby="earlier-searches">
      <div className={styles.historyHead}>
        <h2 id="earlier-searches">Earlier searches</h2>
        <span className={styles.historyCount}>{history.length} saved</span>
      </div>
      <ul className={styles.grid} key={current}>
        {visible.map(card => <HistoryEntry key={card.id} card={card} onOpen={() => open(card.id)} onForget={() => forget(card.id)} />)}
      </ul>
      {pages > 1 && <Pager page={current} pages={pages} onPage={setPage} label="Earlier searches pages" />}
    </section>}

    {search && <div className={styles.panel}>
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
    </div>}

    {/* Only promise the cards when there are cards to promise, and only where
        there is a box to ask in — a page that only browses has nothing to
        tell the reader to do first. */}
    {search && !cards.length && <p className={styles.empty} role="status">Your answers collect here. Ask a question to start{sections.length ? `, or pick a ${emptyNoun} below` : ""}.</p>}

    <SectionTabs sections={sections} />

    {/* The answer reads as a full-width document over the page, so the
        catalogue underneath keeps its place and the reader returns to exactly
        where they were asking from. */}
    <Dialog open={reading && !!active} onOpenChange={open => { if (!open) setReading(false); }}>
      <DialogContent className={styles.answerModal}>
        {active && <>
          {/* The dialog's title is the visible one in the document's own header,
              rather than a screen-reader-only copy of it. */}
          <AnswerDocument key={active.id} card={active} providers={providers}
            onOpenRelated={group ? name => {
              const next = group.items.find(item => item.name === name);
              if (next) explain(next, group.technology, group.classroom, group.items);
            } : undefined}
            onAsk={item => void ask(item)} onRetry={() => { forget(active.id); void ask(active.question); }} onForget={() => preparedCard ? setReading(false) : forget(active.id)} />
        </>}
      </DialogContent>
    </Dialog>
  </section>;
}

/**
 * The catalogues, one tab each.
 *
 * Paged four at a time rather than scrolled sideways: there are twenty-odd
 * catalogues, and a strip that runs off the edge hides the ones at the end from
 * anyone who does not think to drag it. Only the open section is mounted, so
 * each catalogue keeps the search, category tabs and pager it always had.
 */
function SectionTabs({ sections }: { sections: { id: string; title: string; render: () => ReactNode }[] }) {
  const [tab, setTab] = useState(sections[0]?.id ?? "");
  const [tabPage, setTabPage] = useState(0);
  if (!sections.length) return null;

  const pages = Math.max(1, Math.ceil(sections.length / SECTIONS_PER_PAGE));
  const current = Math.min(tabPage, pages - 1);
  const shown = sections.slice(current * SECTIONS_PER_PAGE, current * SECTIONS_PER_PAGE + SECTIONS_PER_PAGE);
  const open = sections.find(section => section.id === tab) ?? sections[0];

  return <Tabs className={styles.sections} value={open.id} onValueChange={value => setTab(String(value))}>
    <div className={styles.sectionsRow}>
      <div className={styles.sectionsToolbar}>
      <span className={styles.browseLabel}><Layers size={14} aria-hidden="true" />Explore topics</span>
      {pages > 1 && <div className={styles.sectionsNav}>
        <button type="button" className={styles.sectionsStep} aria-label="Previous catalogues"
          disabled={current === 0} onClick={() => setTabPage(current - 1)}>
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
        <span className={styles.sectionsOf}>{current + 1}/{pages}</span>
        <button type="button" className={styles.sectionsStep} aria-label="More catalogues"
          disabled={current === pages - 1} onClick={() => setTabPage(current + 1)}>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>}
      </div>
      <TabsList className={styles.sectionsList} aria-label="Browse a catalogue">
        {shown.map(section => <TabsTab key={section.id} className={styles.sectionTab} value={section.id}>
          <SearchSectionIcon title={section.title} />
          <span className={styles.sectionName}>{section.title}</span>
        </TabsTab>)}
      </TabsList>
    </div>
    {/* Keyed by section: without it React reconciles the outgoing catalogue
        with the incoming one and the search text typed into the first leaks
        into the second, filtering it to nothing. */}
    <TabsPanel value={open.id} className={styles.sectionPanel}>
      <div key={open.id}>{open.render()}</div>
    </TabsPanel>
  </Tabs>;
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

/**
 * What the modal calls itself, and what it says underneath.
 *
 * A card's question is `"<name> · <category>"`, so the title is the name and the
 * category belongs in the line below it with the technology it came from — the
 * same split the card itself uses. A typed question has no such parts and is its
 * own title.
 */
function answerTitle(card: Card): { title: string; kicker: string } {
  const topic = card.result?.topic;
  if (!topic) return { title: card.question, kicker: "" };
  const category = card.question.split(" · ").slice(1).join(" · ");
  return { title: topic.name, kicker: [topic.subject, category].filter(Boolean).join(" · ") };
}

/**
 * The mark for the thing an answer is about.
 *
 * A real product logo wins when one exists — the topic's own first, since a
 * handbook of Next.js APIs can still be showing a Turbopack topic, then the
 * technology's. Concepts have no logo and never will, so the fallback is the
 * semantic icon the rest of the page already uses for that category.
 */
function AnswerTitleIcon({ card }: { card: Card }) {
  const topic = card.result?.topic;
  const category = card.question.split(" · ").at(-1) ?? "";
  const brand = [topic?.name, topic?.subject].find((label): label is string => !!label && hasTopicMedia(label));
  if (brand) return <BrandMark label={brand} size={20} />;
  if (card.result?.prepared === "exam" && topic) return <ClassroomTopicIcon {...topic} size={20} />;
  return <TechnologyTopicIcon category={category} size={20} />;
}

function AnswerDocument({ card, providers, onAsk, onRetry, onForget, onOpenRelated }: {
  card: Card; providers: { id: string; label: string }[];
  onAsk: (question: string) => void; onRetry: () => void; onForget: () => void;
  /** Open another topic from the same category, when the answer came from one. */
  onOpenRelated?: (name: string) => void;
}) {
  const answer = card.result?.answer ?? null;
  const { title, kicker } = answerTitle(card);
  return <article className={styles.answer} aria-label={card.question}>
    {/* The title leads the header on every answer, with the mark of the thing it
        is about beside it: the reader opened a card, so the modal should open on
        that card's name rather than on a paragraph of answer. */}
    <header className={styles.answerHead}>
      <span className={styles.answerMark}><AnswerTitleIcon card={card} /></span>
      <div className={styles.answerTitles}>
        <DialogTitle className={styles.answerTitle}>{title}</DialogTitle>
        {kicker && <p className={styles.asked}>{kicker}</p>}
      </div>
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
        {(() => {
          const steps = uniqueText(answer.steps, step => `${step.title}\n${step.detail}`);
          const repeatedContent = new Set([
            contentKey(answer.definition),
            contentKey(answer.summary),
            ...steps.flatMap(step => [contentKey(step.title), contentKey(step.detail)]),
            ...answer.subjects.flatMap(subject => [contentKey(subject.name), contentKey(subject.summary), ...subject.details.map(contentKey)]),
          ]);
          const keyPoints = uniqueText(answer.keyPoints, point => point).filter(point => !repeatedContent.has(contentKey(point)));
          // An answer that carries code inside its steps still deserves the
          // editor: each step with code becomes a file, so every topic with an
          // example gets one Code example section rather than snippets strewn
          // through the prose.
          const exampleFiles = answer.files.length
            ? answer.files
            : steps.filter(step => step.code.trim()).map((step, index) => ({
              path: `${slugPath(step.title || `example-${index + 1}`)}.${fileExtension(step.code)}`,
              code: step.code, note: step.title,
            }));
          return <>
        {/* The header already names the topic, and a prepared answer's headline
            is that same name — so the headline only appears when it says
            something the title did not. */}
        {contentKey(answer.headline) !== contentKey(title) && <h2 className={styles.headline}>{card.result.topic && (card.result.prepared === "exam"
          ? <ClassroomTopicIcon {...card.result.topic} size={24} />
          : <TechnologyTopicIcon category={card.question.split(" · ").at(-1) ?? ""} size={24} />)}<KeyText text={answer.headline} /></h2>}
        {answer.definition && <p className={styles.definition}><KeyText text={answer.definition} /></p>}
        <p className={styles.summary}><KeyText text={answer.summary} /></p>
        {answer.diagrams?.map((diagram, index) => <LearningDiagram key={`${diagram.title}-${index}`} diagram={diagram} />)}

        {!!answer.subjects.length && <Block icon={<Layers size={16} aria-hidden="true" />} title={card.result.prepared === "interview" ? "Interview questions & answers" : "Each one explained"} className={styles.subjectsBlock} count={answer.subjects.length}>
          <ul className={styles.subjects}>{answer.subjects.map(subject => <li key={subject.name} className={`${styles.subject} ${learningCard.card}`}>
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

        {/* Formulas come before the method: a reader working a problem wants
            the equation in front of them while they read the steps, not after
            them. Set apart rather than left inside the prose, because finding
            the formula is most of why the answer was opened. */}
        {!!answer.formulas.length && <Block icon={<Sigma size={16} aria-hidden="true" />} title="Formulas" className={styles.formulaBlock} count={answer.formulas.length}>
          <ul className={styles.formulas}>{answer.formulas.map(formula => <li key={formula.expression}>
            <h4 className={styles.formulaName}><KeyText text={formula.name} /></h4>
            <p className={styles.expression}>{formula.expression}</p>
            {formula.meaning && <p className={styles.formulaMeaning}><KeyText text={formula.meaning} /></p>}
          </li>)}</ul>
        </Block>}

        {card.result.walkthrough === "git" ? <GitWalkthrough answer={answer} /> : <Block icon={<ListOrdered size={16} aria-hidden="true" />} title="Step by step" className={styles.steps}>
          <ol>{steps.map((step, index) => <li key={`${step.title}-${index}`}>
            <span className={styles.stepNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              {!!step.title.trim() && !isGeneratedStepTitle(step.title) && <h4><KeyText text={step.title} /></h4>}
              <p><KeyText text={step.detail} /></p>
              {step.code && (card.result?.prepared && !hasCommands(step.code)
                ? <pre className={styles.preparedCode}><code>{step.code}</code></pre>
                : <CodeSample title={step.title} code={step.code} />)}
            </div>
          </li>)}</ol>
        </Block>}

        {/* After the method, before the examples: the reader now has the model
            in mind, so the real screen is recognisable rather than decorative. */}
        {!!card.result.screens?.length && <Block icon={<Images size={16} aria-hidden="true" />} title="Screens & learning resources" count={card.result.screens.length}>
          <OfficialScreens screens={card.result.screens} />
        </Block>}

        {!!answer.worked.length && <Block icon={<GraduationCap size={16} aria-hidden="true" />} title="Worked questions" className={styles.workedBlock}>
          {answer.worked.map((example, index) => <section className={styles.workedExample} key={`${example.question}-${index}`}>
            <h4>Question {index + 1}</h4>
            <p className={styles.workedQuestion}>{example.question}</p>
            <ol>{example.steps.map((step, stepIndex) => <li key={stepIndex}>
              <p>{step.detail}</p>
              {step.expression && <p className={styles.expression}>{step.expression}</p>}
            </li>)}</ol>
            {example.answer && <div className={styles.workedAnswer}><span>Answer</span><p className={styles.expression}>{example.answer}</p></div>}
          </section>)}
        </Block>}

        {!!answer.useCases.length && <Block icon={<Lightbulb size={16} aria-hidden="true" />} title="Where this comes up" fold count={answer.useCases.length}>
          <ul className={styles.useCases}>{answer.useCases.map(item => <li key={item.title}>
            <strong><KeyText text={item.title} /></strong>
            {item.scenario && <p><KeyText text={item.scenario} /></p>}
            {item.example && <CodeSample title={item.title} code={item.example} />}
          </li>)}</ul>
        </Block>}

        {!!answer.industries.length && <Block icon={<Building2 size={16} aria-hidden="true" />} title="Real problems it solves, by industry" fold count={answer.industries.length}>
          <ul className={styles.industries}>{answer.industries.map(entry => <li key={entry.industry}>
            <strong>{entry.industry}</strong>
            <p><KeyText text={entry.problem} /></p>
          </li>)}</ul>
        </Block>}

        {!!exampleFiles.length && <Block icon={<FolderTree size={16} aria-hidden="true" />} title="Code example" fold count={exampleFiles.length}>
          <CodeFiles files={exampleFiles} label="Project files" />
        </Block>}

        {!!keyPoints.length && <Block icon={<Check size={16} aria-hidden="true" />} title="Worth remembering">
          <ul className={styles.points}>{keyPoints.map(point => <li key={point} className={styles.keyPoint}><span className={styles.keyPointIcon}>{keyPointIcon(point)}</span><KeyText text={point} /></li>)}</ul>
        </Block>}

        {/* The rest of the area this topic belongs to, each with the one line
            that says what it does. A reader who opened one feature almost always
            wants to know what the others in the group are — and opening one of
            them from here is the same prepared answer, so it costs nothing. */}
        {!!card.result.related?.length && <Block icon={<Layers size={16} aria-hidden="true" />} title={`Core features in ${card.question.split(" · ").slice(1).join(" · ") || "this group"}`} fold count={card.result.related.length}>
          <ul className={styles.related}>{card.result.related.map(item => <li key={item.name}>
            {onOpenRelated
              ? <button type="button" className={styles.relatedOpen} onClick={() => onOpenRelated(item.name)}>
                  <strong>{item.name}</strong><ArrowRight size={12} aria-hidden="true" />
                </button>
              : <strong>{item.name}</strong>}
            <p><KeyText text={item.summary} /></p>
          </li>)}</ul>
        </Block>}

        {!!answer.caveats.length && <Block icon={<TriangleAlert size={16} aria-hidden="true" />} title="Watch out for" tone="warn">
          <ul className={styles.points}>{answer.caveats.map((point, index) => {
            const text = typeof point === "string" ? point : point.text;
            const code = typeof point === "string" ? "" : point.code;
            return <li key={`${text}-${index}`}><KeyText text={text} />{code && <CodeSample title={`Watch out ${index + 1}`} code={code} />}</li>;
          })}</ul>
        </Block>}

        <p className={styles.provenance}>
          <span>{card.result.prepared ? "Prepared learning notes · available instantly" : `Answered with ${providers.find(item => item.id === card.result?.provider)?.label ?? card.result?.provider ?? "the configured model"}`}</span>
        </p>

        {!!answer.followUps.length && <Block icon={<ArrowRight size={16} aria-hidden="true" />} title="Ask next">
          <div className={styles.chips}>{answer.followUps.map(item => <button key={item} type="button" onClick={() => onAsk(item)}>{item}</button>)}</div>
        </Block>}
          </>;
        })()}
      </> : <div className={styles.noModel} role="status">
        <p>{referenceErrorMessage(card.result.reason)}</p>
        <p>No generated answer is available for this search yet.</p>
      </div>}
    </div>}
  </article>;
}

/**
 * Whether a step's code is something to type at a shell.
 *
 * A prepared answer's code is otherwise printed as plain text, which suits a
 * classroom answer's working but not a command: a reader following a Git
 * walkthrough needs the terminal chrome that says "run this", and the per-line
 * copy button that comes with it.
 */
const hasCommands = (code: string) => splitCommands(code).some(segment => segment.kind === "shell");

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
