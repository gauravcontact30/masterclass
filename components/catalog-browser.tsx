"use client";

import learningCard from "./learning-card.module.css";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, GripVertical, Layers, ListFilter, Search, Volume2, X } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Pager } from "./pager";
import { VocabularyWordIcon } from "./vocabulary-word-icon";
import { TopicCover } from "./topic-media";
import { LearningResources } from "./learning-resources";
import { EnglishWordSearch } from "./english-word-search";
import styles from "./catalog-browser.module.css";
import type { VocabularyWord } from "@/lib/pro-learn/aws-highlights";
import type { PreparedExplanation } from "@/lib/pro-learn/prepared-explanation";
import { essentialPoints } from "@/lib/pro-learn/essentials";
import { GitWalkthrough } from "./git-walkthrough";

/** A row in a browsable catalogue: enough to draw a card and ask a question. */
export type CatalogItem = {
  name: string;
  category: string;
  summary: string;
  /** Authored features and points for this row, ahead of anything derived. */
  points?: string[];
  /** Where this row is really used, and the problem that use removes. */
  useCase?: { title: string; scenario: string };
  /** Problems this row in particular removes, named by the industry that has them. */
  industries?: readonly { industry: string; problem: string }[];
  /**
   * The general form of the command this row is about.
   *
   * Only a row that *is* a command carries one. Shown on the card above
   * everything else, because a reader who already knows what `git cherry-pick`
   * does has come for the flags and should not have to open the answer for them.
   */
  syntax?: readonly string[];
  vocabulary?: VocabularyWord;
  prepared?: PreparedExplanation;
};
export type CatalogCategory = { name: string; count: number };

const contentKey = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The two sentences a row gets when nothing was authored for it.
 *
 * They are built from the row's own category and say nothing a reader could
 * act on, so a card that has only these shows its definition alone rather than
 * padding the block out with them.
 */
const FILLER = /^It is commonly used when working with |when its .+ behavior matches the problem\.$/;

/** Points a card carries before the rest is left to the modal. */
const CARD_POINTS = 3;
/** Real uses a card carries. Two is what fits under the features without crowding them. */
const CARD_USE_CASES = 2;
/** Industries a card names. Three is enough to show the spread without a wall. */
const CARD_INDUSTRIES = 3;
/** A card line is a summary, not a paragraph: anything longer is cut with an ellipsis. */
const LINE_LIMIT = 190;

/** One line of a card, trimmed of the joins that only read well inside an answer. */
function cardLine(text: string) {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= LINE_LIMIT) return line;
  const cut = line.slice(0, LINE_LIMIT - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * Every line a card could draw, in the order the card prefers them.
 *
 * Split out from the card so the whole catalogue can be measured before any of
 * it is drawn: a line that several rows would print is shared writing, not
 * something this row has to say, and the card drops it rather than repeating
 * it down the grid.
 */
function cardCandidates(item: CatalogItem, technology: string) {
  const prepared = item.prepared;
  const answer = prepared?.answer;
  // A syllabus row leads with its class ("Class 6 · Order large numbers…"),
  // which the card already shows as the category.
  const full = (answer?.definition || item.summary).replace(/^.*? · /, "").trim();
  const facts = full.split(/(?<=[.;])\s+|\s+—\s+/).map(fact => fact.trim()).filter(Boolean);
  const definition = facts[0] || prepared?.focus || full;
  const points = [...(item.points ?? []), ...(answer?.keyPoints ?? []), ...facts.slice(1), ...essentialPoints(technology, item.category)];
  // "Title — what goes wrong without it" is the shape every use case takes,
  // whether it was authored on the row or matched from a study note.
  // Category and technology fallbacks do not belong to individual topics.
  const uses = [item.useCase, ...(answer?.useCases ?? [])]
    .filter((entry): entry is { title: string; scenario: string } => !!entry?.title)
    .map(entry => [entry.title, entry.scenario].filter(Boolean).join(" — "));
  const industries = [...(item.industries ?? []), ...(answer?.industries ?? [])];
  return { definition, full, facts, points, uses, industries };
}

/**
 * The lines that more than one row in this catalogue would print.
 *
 * A technology's essentials, its category use cases and its industry problems
 * are written once and are true of every topic under them — which makes them
 * worth reading in an answer, where one topic is on screen, and worth nothing
 * in a grid of six cards that would each carry the same sentence. Counting
 * them across the catalogue is what tells the two apart without a rule per
 * source: anything a second row also claims is shared writing, including
 * duplicates that arise by accident in the data.
 *
 * Returned as the set of keys to suppress, so a card only has to ask whether a
 * line is in it.
 */
function sharedLines(items: CatalogItem[], technology: string): ReadonlySet<string> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const candidate = cardCandidates(item, technology);
    const lines = [...candidate.points, ...candidate.uses, ...candidate.industries.map(entry => entry.problem)];
    // Per row, not per occurrence: a row that lists the same point twice has
    // not made it shared.
    for (const key of new Set(lines.map(line => contentKey(cardLine(line))))) {
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const shared = new Set<string>();
  for (const [key, count] of counts) if (count > 1) shared.add(key);
  return shared;
}

/**
 * What a technology card says before it is opened: what the topic is, the
 * features and points worth knowing, where it is really used, and the problems
 * it removes in the industries that have them.
 *
 * The definition is the first fact alone, and everything after it is a list: a
 * row's summary is several sentences, and printing the whole of it and then
 * repeating its opening as a bullet reads as a mistake.
 *
 * Every list is filtered twice. Against itself, so a card never says the same
 * thing in two blocks; and against `shared`, so it never says something another
 * card in the catalogue is also saying. A block with nothing of its own left is
 * dropped rather than padded — the writing it would have borrowed is still
 * there in the Explain this answer, where one topic is on screen at a time and
 * a sentence about the whole technology is worth reading.
 */
function cardDetail(item: CatalogItem, technology: string, shared: ReadonlySet<string>) {
  const { definition, full, points: pointLines, uses, industries: industryEntries } = cardCandidates(item, technology);
  const definitionKey = contentKey(definition);
  const seen = new Set([definitionKey, contentKey(full)]);
  /** Take a line unless it is filler, already said here, or said on another card. */
  const take = (text: string) => {
    const line = cardLine(text);
    const key = contentKey(line);
    if (!key || seen.has(key) || shared.has(key) || definitionKey.includes(key) || FILLER.test(line)) return null;
    seen.add(key);
    return line;
  };

  const points: string[] = [];
  for (const candidate of pointLines) {
    const line = take(candidate);
    if (line) points.push(line);
    if (points.length === CARD_POINTS) break;
  }

  const useCases: string[] = [];
  for (const candidate of uses) {
    const line = take(candidate);
    if (line) useCases.push(line);
    if (useCases.length === CARD_USE_CASES) break;
  }

  const industries: { industry: string; problem: string }[] = [];
  for (const entry of industryEntries) {
    const line = take(entry.problem);
    if (line) industries.push({ industry: entry.industry, problem: line });
    if (industries.length === CARD_INDUSTRIES) break;
  }

  return { definition, points, useCases, industries };
}

/** Two rows of three: enough of the catalogue to scan without burying the page. */
const PER_PAGE = 6;
/** Category tabs shown at once. The rest are a page turn away, not a side-scroll. */
const TABS_PER_PAGE = 4;
/** The tab that narrows nothing. Not a category name, so it cannot collide with one. */
const ALL = "*";

/**
 * The headword as a card shows it, with a capital first letter.
 *
 * Applied when drawing rather than stored: the vocabulary data is keyed on the
 * lower-case word — the respelling table, the Hindi glosses and the icon
 * resolver all look words up by it — so capitalising the data would break those
 * lookups and the search, which matches on the same lower-case text.
 */
const asHeadword = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

function pronounce(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function PronounceButton({ word, className }: { word: string; className?: string }) {
  return <button type="button" className={className ?? styles.audio} aria-label={`Pronounce ${word}`} title={`Pronounce ${word}`}
    onClick={event => { event.stopPropagation(); pronounce(word); }}>
    <Volume2 size={15} aria-hidden="true" />
  </button>;
}

/** Where a catalogue remembers which of its cards the reader has finished. */
const studiedKey = (id: string) => `masterclass:catalog-studied:${id}`;

function readStudied(id: string): ReadonlySet<string> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(studiedKey(id)) ?? "[]");
    return new Set(Array.isArray(stored) ? stored.filter((name): name is string => typeof name === "string") : []);
  } catch { return new Set(); }
}

/**
 * Hindi for the furniture around a word.
 *
 * The headword itself is never translated: it is the English word being
 * learned, and replacing it would leave nothing to study. What switches is
 * everything the card says *about* it — the meaning line, the counts and the
 * call to action — which is what makes the card readable to someone working in
 * Hindi.
 */
const LABELS = {
  en: { open: "Open word", ask: "Explain this", synonyms: "synonyms", antonyms: "antonyms", studied: "Mark as studied", done: "Studied", language: "Card language",
    Synonyms: "Synonyms", Antonyms: "Antonyms", sentence: "In a sentence", hear: "Hear it",
    wordLanguage: "Word language", listLanguage: "language" },
  hi: { open: "शब्द खोलें", ask: "समझाइए", synonyms: "पर्यायवाची", antonyms: "विलोम", studied: "पढ़ा हुआ चिह्नित करें", done: "पढ़ लिया", language: "कार्ड की भाषा",
    Synonyms: "पर्यायवाची", Antonyms: "विलोम", sentence: "वाक्य में", hear: "सुनिए",
    wordLanguage: "शब्द की भाषा", listLanguage: "की भाषा" },
} as const;

/**
 * The Hindi equivalent of a related word, short enough for a pill.
 *
 * The gloss table is written as "equivalent; fuller explanation", and only the
 * equivalent fits on a pill beside a speaker button. Returns null when the word
 * has no gloss — most synonyms and antonyms are not themselves headwords, so
 * the caller falls back to the English word rather than showing a blank.
 */
/**
 * The gloss table, held once it has been asked for.
 *
 * It is a quarter of a megabyte of Devanagari — on its own the largest thing
 * the search page could load — and it answers one question: what a synonym or
 * antonym pill reads as in Hindi. Importing it with the page charged every
 * visitor for a control most never touch, so it is fetched on the first switch
 * and kept for the rest of the session.
 */
let glosses: Record<string, string> | undefined;
let glossRequest: Promise<void> | undefined;

/**
 * Starts the fetch, or returns the one already in flight.
 *
 * Two tables, because they are maintained differently: the headword glosses are
 * generated from the vocabulary handbook, and the related-word glosses are
 * hand-authored for the synonyms and antonyms that are not headwords. A
 * headword's own gloss wins where a word appears in both.
 */
function loadGlosses(): Promise<void> {
  glossRequest ??= Promise.all([
    import("@/lib/pro-learn/english-vocabulary-hindi"),
    import("@/lib/pro-learn/english-related-hindi"),
  ]).then(([headwords, related]) => {
    glosses = { ...related.RELATED_HINDI, ...headwords.VOCABULARY_HINDI };
  });
  return glossRequest;
}

function shortGloss(word: string): string | null {
  const gloss = glosses?.[word.toLowerCase()];
  return gloss ? gloss.split(";")[0].trim() : null;
}

/**
 * The whole of one word, opened from its card.
 *
 * A single dialog is hoisted above the grid rather than one per card: the
 * catalogue runs to thousands of entries, and a closed portal per card is
 * thousands more than the page needs. The card sets which word is showing;
 * `null` is closed.
 */
function WordDialog({ item, onClose }: { item: CatalogItem | null; onClose: () => void }) {
  // The dialog keeps its own language rather than inheriting the card's: it is
  // opened, read and closed as one act, and a reader who wants the gloss here
  // should not have to close it and flip the card behind it. The choice is
  // stored against the word it was made for, so the next word opens in English
  // without an effect reaching in to reset it.
  const [choice, setChoice] = useState<{ word: string; value: "en" | "hi" }>({ word: "", value: "en" });
  const lang = item && choice.word === item.name ? choice.value : "en";
  const setLang = (value: "en" | "hi") => setChoice({ word: item?.name ?? "", value });
  // Synonyms and antonyms switch independently of the dialog and of each other,
  // so a reader can check one list against the other across languages.
  const [pairChoice, setPairChoice] = useState<{ word: string; hi: ReadonlySet<string> }>({ word: "", hi: new Set() });
  const pairInHindi = (tone: string) => !!item && pairChoice.word === item.name && pairChoice.hi.has(tone);
  const togglePair = (tone: string) => setPairChoice(previous => {
    const next = new Set(item && previous.word === item.name ? previous.hi : []);
    if (!next.delete(tone)) next.add(tone);
    return { word: item?.name ?? "", hi: next };
  });
  // The table is only needed once a list is switched, and only the switched
  // pills read it. Until it lands they keep their English spelling — the same
  // fallback a word with no gloss gets — so nothing goes blank in the meantime.
  const wantsGlosses = pairChoice.hi.size > 0;
  const [glossesReady, setGlossesReady] = useState(() => !!glosses);
  useEffect(() => {
    if (!wantsGlosses || glossesReady) return;
    let live = true;
    void loadGlosses().then(() => { if (live) setGlossesReady(true); });
    return () => { live = false; };
  }, [wantsGlosses, glossesReady]);

  const vocabulary = item?.vocabulary;
  const pairs = vocabulary
    ? ([["synonyms", "Synonyms", vocabulary.synonyms], ["antonyms", "Antonyms", vocabulary.antonyms]] as const)
    : [];

  return <Dialog open={!!item} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={styles.wordDialog}>
      {item && vocabulary && <>
        <header className={styles.wordHead}>
          <div className={styles.wordTopRow}>
          <span className={styles.wordCategory}>{item.category}</span>
          {/* Labelled rather than an icon alone: this is the one control in the
              dialog whose effect is not visible on screen. */}
          <button type="button" className={styles.wordSpeak} onClick={() => pronounce(item.name)}>
            <Volume2 size={15} aria-hidden="true" />{LABELS[lang].hear}
          </button>
          <div className={styles.wordLang} role="group" aria-label={LABELS[lang].wordLanguage}>
            {(["en", "hi"] as const).map(choice => <button key={choice} type="button" className={styles.langOption}
              aria-pressed={lang === choice} onClick={() => setLang(choice)}>
              {choice === "en" ? "En" : "Hi"}
            </button>)}
          </div>
          </div>
          <div className={styles.wordTitleRow}>
            <span className={styles.wordIcon}>
              <VocabularyWordIcon word={item.name} meaning={vocabulary.meaning} category={item.category} size={20} />
            </span>
            {/* Capitalised when drawn, like the card: the data is keyed on the
                lower-case word, so the stored form has to stay as it is. */}
            <DialogTitle className={styles.wordTitle}>{asHeadword(item.name)}</DialogTitle>
            {vocabulary.pronunciation && <span className={styles.wordRespell}>{vocabulary.pronunciation}</span>}
          </div>
          {/* The gloss replaces the English meaning rather than joining it: the
              dialog is in one language at a time, as the switch promises. */}
          <DialogDescription className={styles.wordMeaning} lang={lang === "hi" ? "hi" : undefined}>
            {lang === "hi" && vocabulary.hindi ? vocabulary.hindi : vocabulary.meaning}
          </DialogDescription>
        </header>

        <div className={styles.wordBody}>
          {item.category === "Workplace speaking" && <EnglishWordSearch key={item.name} />}
          <figure className={styles.wordSentence}>
            <figcaption>{LABELS[lang].sentence}</figcaption>
            <blockquote>“{vocabulary.sentence}”</blockquote>
          </figure>
          <div className={styles.wordPairs}>
            {pairs.map(([tone, label, words]) => <section key={tone} className={styles.wordGroup} data-tone={tone}>
              <h3>
                <span className={styles.dot} aria-hidden="true" />{LABELS[lang][label]}
                <div className={styles.pairLang} role="group" aria-label={`${LABELS[lang][label]} ${LABELS[lang].listLanguage}`}>
                  {(["en", "hi"] as const).map(choice => <button key={choice} type="button" className={styles.langOption}
                    aria-pressed={choice === "hi" ? pairInHindi(tone) : !pairInHindi(tone)}
                    onClick={() => { if ((choice === "hi") !== pairInHindi(tone)) togglePair(tone); }}>
                    {choice === "en" ? "En" : "Hi"}
                  </button>)}
                </div>
                <b>{words.length}</b>
              </h3>
              {/* Each related word is a word in its own right: it gets the same
                  mark and the same speaker the headword gets, because hearing a
                  synonym said aloud is most of why it is listed. */}
              {/* The pill shows the Hindi equivalent where the table has one
                  and the English word where it does not, so a switched list
                  stays complete rather than going blank in places. The speaker
                  always says the English word: that is what is being learned. */}
              <ul>{words.map(word => <li key={word}>
                <VocabularyWordIcon word={word} category={item.category} size={13} className={styles.pillIcon} />
                <span className={styles.pillWord} lang={pairInHindi(tone) && shortGloss(word) ? "hi" : undefined}>
                  {(pairInHindi(tone) && shortGloss(word)) || word}
                </span>
                <PronounceButton word={word} className={styles.pillAudio} />
              </li>)}</ul>
            </section>)}
          </div>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}

/**
 * A searchable, tabbed, paged grid of cards over any catalogue of named things.
 *
 * Written once and rendered twice — the AWS service directory and the AI
 * glossary — because the two differ only in their rows, their marks and the
 * question a card asks. Everything structural is the same, and two copies of it
 * would drift apart the first time either one was fixed.
 *
 * The caller supplies the marks: this component knows nothing about what it is
 * listing, which is what keeps it reusable for the next catalogue.
 */
export function CatalogBrowser({
  id, title, description, noun, items, categories, itemIcon, categoryIcon, question, onAsk, onExplain,
  cover = <TopicCover label={title} catalogueId={id} />,
  technology = title,
}: {
  id: string;
  title: string;
  /**
   * The name the authored essentials are keyed on, when it is not the title.
   *
   * A handbook's title is its own key, but "Popular AWS services" is the
   * catalogue's heading while the writing about it is filed under "AWS".
   */
  technology?: string;
  description: string;
  /** Plural, for the count beside the title: "services", "terms". */
  noun: string;
  items: CatalogItem[];
  categories: CatalogCategory[];
  itemIcon: (item: CatalogItem) => ReactNode;
  categoryIcon: (category: string) => ReactNode;
  /**
   * Artwork for the catalogue as a whole — a product logo or a subject scene.
   *
   * Defaults to a logo, subject scene, or semantic icon for the title.
   * Pass null to explicitly omit the cover.
   */
  cover?: ReactNode;
  /** The question a card asks when picked. */
  question: (item: CatalogItem) => string;
  onAsk: (question: string) => void;
  /**
   * Open the prepared explanation for a card, with the rest of its category.
   *
   * The group travels with the item so the answer can list what else is in that
   * area and open any of it, without the modal having to know which catalogue it
   * came from or re-deriving the grouping the grid already has.
   */
  onExplain?: (item: CatalogItem, group: CatalogItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [tab, setTab] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const [tabPage, setTabPage] = useState(0);
  // Which word is open in the dialog. Non-vocabulary catalogues never set it,
  // so their cards keep asking the question directly.
  const [opened, setOpened] = useState<CatalogItem | null>(null);
  // Language is per card, not per catalogue: a reader switches the one word
  // they are stuck on and leaves the rest in English. A card absent from this
  // set is in English, which is the default.
  const [inHindi, setInHindi] = useState<ReadonlySet<string>>(() => new Set());
  const toggleLang = useCallback((word: string) => setInHindi(shown => {
    const next = new Set(shown);
    if (!next.delete(word)) next.add(word);
    return next;
  }), []);
  // Which cards the reader has ticked off. Kept per catalogue and restored from
  // localStorage, so progress survives a reload and one catalogue's ticks never
  // appear in another.
  const [studied, setStudied] = useState<ReadonlySet<string>>(() => new Set());
  // Deferred rather than read during render: localStorage does not exist on
  // the server, and the first client render has to match the server's output.
  useEffect(() => { void Promise.resolve().then(() => setStudied(readStudied(id))); }, [id]);
  const toggleStudied = useCallback((name: string) => setStudied(done => {
    const next = new Set(done);
    if (!next.delete(name)) next.add(name);
    try { localStorage.setItem(studiedKey(id), JSON.stringify([...next])); } catch { /* Private mode: the tick still works for this visit. */ }
    return next;
  }), [id]);

  /** The label for this card, in whichever language the card is currently in. */
  const label = useCallback((item: CatalogItem, key: keyof typeof LABELS["en"]) =>
    LABELS[inHindi.has(item.name) ? "hi" : "en"][key], [inHindi]);

  // Name, category and summary all match, so "storage", "Aurora" and
  // "serverless" each find something — a reader who knows the shape of what
  // they want but not its name is the one this filter is for.
  const searchIndex = useMemo(() => new Map(items.map(item =>
    [item, `${item.name} ${item.category} ${item.summary}`.toLowerCase()])), [items]);
  const found = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const inTab = tab === ALL ? items : items.filter(item => item.category === tab);
    if (!needle) return inTab;
    return inTab.filter(item => searchIndex.get(item)!.includes(needle));
  }, [items, deferredQuery, tab, searchIndex]);

  // A tab and a query both narrow, so either changing has to return to the
  // first page — page four of the old result set is page four of nothing.
  const reset = useCallback(() => setPage(0), []);

  /**
   * The other topics in a topic's own category, in catalogue order.
   *
   * A card carries one sentence about one thing, which tells a reader what it is
   * but not what sits beside it. The group is the rest of that area — the
   * features you meet alongside this one — so a card can name a few of them and
   * the answer can list them all. Built from the whole catalogue rather than the
   * filtered page, because what is related to a topic does not change when a
   * search box narrows the grid.
   */
  const groups = useMemo(() => {
    const byCategory = new Map<string, CatalogItem[]>();
    for (const item of items) {
      const group = byCategory.get(item.category);
      if (group) group.push(item);
      else byCategory.set(item.category, [item]);
    }
    return byCategory;
  }, [items]);
  const groupOf = useCallback((item: CatalogItem) => groups.get(item.category) ?? [item], [groups]);
  // Measured over the whole catalogue rather than the filtered page: whether a
  // line is this row's own does not change when a search box narrows the grid,
  // and a card must not gain a sentence just because the row that shared it was
  // filtered out.
  const shared = useMemo(() => sharedLines(items, technology), [items, technology]);
  const isGit = items.some(item => item.prepared?.walkthrough === "git");
  const perPage = isGit ? 2 : PER_PAGE;
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [draggedName, setDraggedName] = useState<string | null>(null);
  const [dragOverName, setDragOverName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storageKey = `masterclass:catalog-order:${id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => setCustomOrder(parsed));
        }
      }
    } catch {}
  }, [id]);

  const moveItem = (sourceName: string, targetName: string) => {
    if (!sourceName || !targetName || sourceName === targetName) return;
    const currentNames = found.map(item => item.name);
    const base = customOrder.length > 0 ? [...customOrder] : currentNames;
    for (const name of currentNames) {
      if (!base.includes(name)) base.push(name);
    }
    const sourceIndex = base.indexOf(sourceName);
    const targetIndex = base.indexOf(targetName);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const nextOrder = [...base];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    setCustomOrder(nextOrder);
    try {
      localStorage.setItem(`masterclass:catalog-order:${id}`, JSON.stringify(nextOrder));
    } catch {}
  };

  const orderedFound = useMemo(() => {
    if (!customOrder.length) return found;
    const map = new Map(customOrder.map((name, idx) => [name, idx]));
    return [...found].sort((a, b) => {
      const idxA = map.has(a.name) ? map.get(a.name)! : 999999;
      const idxB = map.has(b.name) ? map.get(b.name)! : 999999;
      return idxA - idxB;
    });
  }, [found, customOrder]);

  const pages = Math.max(1, Math.ceil(orderedFound.length / perPage));
  const current = Math.min(page, pages - 1);
  const visible = orderedFound.slice(current * perPage, current * perPage + perPage);
  const filtering = deferredQuery.trim().length > 0;
  const narrowed = filtering || tab !== ALL;

  // Categories page rather than side-scroll: a scrollbar hides how much is left
  // and cannot be driven from the keyboard. "All" is pinned outside the paging,
  // so the way back to the whole catalogue never scrolls away.
  const tabPages = Math.max(1, Math.ceil(categories.length / TABS_PER_PAGE));
  const currentTabPage = Math.min(tabPage, tabPages - 1);
  const visibleCategories = categories.slice(currentTabPage * TABS_PER_PAGE, currentTabPage * TABS_PER_PAGE + TABS_PER_PAGE);

  return <section className={styles.catalog} aria-labelledby={id}>
    <div className={styles.head} data-has-cover={cover ? "" : undefined}>
      {cover && <div className={styles.cover}>{cover}</div>}
      <div className={styles.titleRow}>
        <h2 id={id}>{title}</h2>
        <span className={styles.count}>{filtering || tab !== ALL ? `${found.length} of ${items.length}` : `${items.length} ${noun}`}</span>
      </div>
      <p>{description}</p>
    </div>

    <div className={styles.tools}>
      <InputGroup className={styles.field}>
        <InputGroupAddon><Search size={15} aria-hidden="true" /></InputGroupAddon>
        <InputGroupInput type="search" aria-label={`Search ${title}`} placeholder="Search by name, category or what it does…"
          value={query} onChange={event => { setQuery(event.target.value); reset(); }} />
        {/* Clears the text but keeps the tab: two filters, cleared separately. */}
        {filtering && <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => { setQuery(""); reset(); }}>
            <X size={13} aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>}
      </InputGroup>
      {/* Resets both, and only appears once either is actually narrowing. */}
      {narrowed && <button type="button" className={styles.clear}
        onClick={() => { setQuery(""); setTab(ALL); setTabPage(0); reset(); }}>
        <ListFilter size={13} aria-hidden="true" />Clear filters
      </button>}
    </div>

    <Tabs className={styles.tabs} value={tab} onValueChange={value => { setTab(String(value)); reset(); }}>
      <div className={styles.tabsRow}>
        <TabsList className={styles.tabsList}>
          <TabsTab className={`${styles.tab} ${styles.tabAll}`} value={ALL}>
            <Layers size={14} aria-hidden="true" />All
            <span className={styles.tabCount}>{items.length}</span>
          </TabsTab>
          {visibleCategories.map(category => <TabsTab key={category.name} className={styles.tab} value={category.name}>
            {categoryIcon(category.name)}
            <span className={styles.tabName}>{category.name}</span>
            <span className={styles.tabCount}>{category.count}</span>
          </TabsTab>)}
        </TabsList>
        {tabPages > 1 && <div className={styles.tabsNav}>
          <button type="button" className={styles.tabsStep} aria-label="Previous categories"
            disabled={currentTabPage === 0} onClick={() => setTabPage(currentTabPage - 1)}>
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <span className={styles.tabsOf}>{currentTabPage + 1}/{tabPages}</span>
          <button type="button" className={styles.tabsStep} aria-label="More categories"
            disabled={currentTabPage === tabPages - 1} onClick={() => setTabPage(currentTabPage + 1)}>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>}
      </div>

      <TabsPanel value={tab} className={styles.panel} aria-busy={query !== deferredQuery}>
        {!found.length && <p className={styles.none} role="status">
          Nothing here matches{filtering ? ` “${deferredQuery.trim()}”` : ""}. Try a shorter word, or clear the filters.
        </p>}

        <ul className={styles.grid} data-walkthrough={isGit || undefined} key={`${tab}:${deferredQuery}:${current}`}>
          {visible.map(item => {
            const isDragging = draggedName === item.name;
            const isDragOver = dragOverName === item.name && draggedName !== item.name;
            const isChecked = studied.has(item.name);
            return <li
              key={item.name}
              className={`${styles.card} ${learningCard.card}`}
              data-studied={isChecked || undefined}
              data-dragging={isDragging || undefined}
              data-dragover={isDragOver || undefined}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", item.name);
                e.dataTransfer.effectAllowed = "move";
                setDraggedName(item.name);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverName !== item.name) setDragOverName(item.name);
              }}
              onDragLeave={() => {
                if (dragOverName === item.name) setDragOverName(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const sourceName = e.dataTransfer.getData("text/plain") || draggedName;
                if (sourceName && sourceName !== item.name) {
                  moveItem(sourceName, item.name);
                }
                setDraggedName(null);
                setDragOverName(null);
              }}
              onDragEnd={() => {
                setDraggedName(null);
                setDragOverName(null);
              }}
            >
              <div className={styles.cardHead}>
                <div
                  className={styles.cardDragHandle}
                  title="Drag to reposition card"
                  aria-label="Drag to reposition card"
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData("text/plain", item.name);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedName(item.name);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical size={14} aria-hidden="true" />
                </div>
                <span className={styles.cardTop}>
                  <span className={styles.cardIcon}>{itemIcon(item)}</span>
                  <span className={styles.cardName}>{item.vocabulary ? asHeadword(item.name) : item.name}</span>
                </span>
                {item.vocabulary?.hindi && <div className={styles.langToggle} role="group" aria-label={`Language for ${item.name}`}>
                  {(["en", "hi"] as const).map(choice => <button key={choice} type="button" className={styles.langOption}
                    aria-pressed={choice === "hi" ? inHindi.has(item.name) : !inHindi.has(item.name)}
                    onClick={() => { if ((choice === "hi") !== inHindi.has(item.name)) toggleLang(item.name); }}>
                    {choice === "en" ? "En" : "Hi"}
                  </button>)}
                </div>}
                {item.vocabulary && <PronounceButton word={item.name} className={styles.headAudio} />}
                <button type="button" className={styles.cardCheckbox} role="checkbox" aria-checked={isChecked}
                  aria-label={`${isChecked ? label(item, "done") : label(item, "studied")}: ${item.name}`}
                  title={isChecked ? label(item, "done") : label(item, "studied")}
                  onClick={() => toggleStudied(item.name)}>
                  <Check size={12} aria-hidden="true" />
                </button>
              </div>
            <div className={styles.open}>
              {/* The title sits in the header strip above, outside this button,
                  so the button has to name itself: without the label its
                  accessible name would be the summary and the word "Explain",
                  and a screen reader would not say which card it is on. */}
              <button type="button" className={styles.cardAction}
                aria-label={`${item.vocabulary ? label(item, "open") : label(item, "ask")}: ${item.vocabulary ? asHeadword(item.name) : item.name}`}
                onClick={() => item.vocabulary ? setOpened(item) : onExplain ? onExplain(item, groupOf(item)) : onAsk(question(item))}>
                <span className={styles.cardCategory}>{item.category}</span>
                {/* The title moved up into the header, so the respelling now
                    leads the body — still directly under the word it belongs
                    to, with only the category's small caps between them. */}
                {item.vocabulary?.pronunciation && <span className={styles.respell}>{item.vocabulary.pronunciation}</span>}
                {/* In Hindi the gloss replaces the English meaning outright,
                    rather than sitting under it: the card is in one language at
                    a time, which is what the switch promises. */}
                {inHindi.has(item.name) && item.vocabulary?.hindi
                  ? <span className={styles.cardSummary} lang="hi">{item.vocabulary.hindi}</span>
                  : item.vocabulary
                    ? <span className={styles.cardSummary}>{item.prepared?.focus ?? item.summary}</span>
                    : (() => {
                      // A topic card answers four questions before it is opened
                      // — what it is, which features and points matter, where it
                      // is really used, and what it fixes for the industries that
                      // pay for it — and leaves the rest of the answer to the
                      // modal. Each list is pointwise, so a reader scans rather
                      // than reads.
                      const detail = cardDetail(item, technology, shared);
                      return <>
                        <span className={styles.cardBlock}>
                          <span className={styles.blockLabel}>Definition</span>
                          <span className={styles.cardSummary} data-lines="2">{detail.definition}</span>
                        </span>
                        {/* The form comes before the prose: it is what a reader who
                            already knows the command came back for. One line on the
                            card; the rest are in the answer. */}
                        {!!item.syntax?.length && item.prepared?.walkthrough !== "git" && <span className={`${styles.cardBlock} ${styles.syntaxBlock}`}>
                          <span className={styles.blockLabel}>Syntax</span>
                          <code className={styles.syntax}>{item.syntax[0]}</code>
                          {item.syntax.length > 1 && <span className={styles.syntaxMore}>+{item.syntax.length - 1} more {item.syntax.length === 2 ? "form" : "forms"}</span>}
                        </span>}
                        {!!detail.points.length && <span className={`${styles.cardBlock} ${styles.pointsBlock}`}>
                          <span className={styles.blockLabel}>Core features &amp; key points</span>
                          {detail.points.map(point => <span key={point} className={styles.point}>{point}</span>)}
                        </span>}
                        {!!detail.useCases.length && <span className={`${styles.cardBlock} ${styles.useBlock}`}>
                          <span className={styles.blockLabel}>Real use cases</span>
                          {detail.useCases.map(useCase => <span key={useCase} className={styles.useItem}>{useCase}</span>)}
                        </span>}
                        {!!detail.industries.length && <span className={`${styles.cardBlock} ${styles.industryBlock}`}>
                          <span className={styles.blockLabel}>Real problems it solves, by industry</span>
                          {detail.industries.map(entry => <span key={entry.industry} className={styles.industry}>
                            <span className={styles.industryName}>{entry.industry}</span>
                            <span className={styles.industryProblem}>{entry.problem}</span>
                          </span>)}
                        </span>}
                      </>;
                    })()}
                {/* The counts stand in for the lists themselves: the detail now
                    lives in the dialog, and a card that carried all of it was
                    taller than the six-up grid could hold. */}
                {item.vocabulary && <span className={styles.cardMeta}>
                  <span data-tone="synonyms">{item.vocabulary.synonyms.length} {label(item, "synonyms")}</span>
                  <span data-tone="antonyms">{item.vocabulary.antonyms.length} {label(item, "antonyms")}</span>
                </span>}
                <span className={styles.go} aria-hidden="true">
                  {item.vocabulary ? label(item, "open") : label(item, "ask")} <ArrowRight size={13} />
                </span>
              </button>
              {item.prepared?.walkthrough === "git" && <GitWalkthrough answer={item.prepared.answer} embedded />}
            </div>
            </li>;
          })}
        </ul>
        {pages > 1 && <Pager page={current} pages={pages} onPage={setPage} label={`${title} pages`} />}
      </TabsPanel>
    </Tabs>

    <LearningResources key={title} technology={title} />
    <WordDialog item={opened} onClose={() => setOpened(null)} />
  </section>;
}
